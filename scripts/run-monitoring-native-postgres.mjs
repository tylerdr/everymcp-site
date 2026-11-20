/** Prepared one-run controller. Do not invoke --run-once without separate approval. */
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { closeSync, existsSync, lstatSync, mkdirSync, openSync, readFileSync, readlinkSync, readdirSync, readSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { NATIVE_PLAN } from "./monitoring-native-plan.mjs";

const root = NATIVE_PLAN.paths.root;
const repo = "/workspace/everymcp-site";
const script = join(repo, "scripts/run-monitoring-native-postgres.mjs");
const safeEnv = { PATH: "/usr/local/bin:/usr/bin:/bin", LANG: "C", NODE_ENV: "test" };
const nsArgs = ["--user", "--map-current-user", "--net", "--pid", "--fork", "--kill-child=KILL", "--mount-proc"];
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
function command(file, args, options = {}) {
  const result = spawnSync(file, args, { env: safeEnv, cwd: repo, encoding: "utf8", timeout: 15000, maxBuffer: 65536, ...options });
  if (result.error || result.status !== 0) throw new Error(`${file}: ${result.error?.message || result.stderr || "exit " + result.status}`.slice(0, 1000));
  return result.stdout;
}
function ownDirectory(path) {
  const stat = lstatSync(path);
  if (!stat.isDirectory() || stat.isSymbolicLink() || stat.uid !== 1000 || realpathSync(path) !== path) throw new Error("Unexpected fixture directory");
}
function namespaces() { return { network: readlinkSync("/proc/self/ns/net"), pid: readlinkSync("/proc/self/ns/pid"), mount: readlinkSync("/proc/self/ns/mnt") }; }
function marker() { return JSON.parse(readFileSync(join(root, "isolation.json"), "utf8")); }
function save(name, value) { writeFileSync(join(root, name), JSON.stringify(value, null, 2) + "\n", { mode: 0o600 }); }
function boundedFile(path, limit) {
  if (!existsSync(path)) return;
  if (statSync(path).size > limit) {
    // Retain a bounded prefix only after the producing process has exited.
    if (lstatSync(path).isSymbolicLink()) throw new Error("Unexpected diagnostic symlink");
    const file = openSync(path, "r"), bytes = Buffer.alloc(limit);
    try { const count = readSync(file, bytes, 0, limit, 0); writeFileSync(path, bytes.subarray(0, count)); }
    finally { closeSync(file); }
  }
}
async function child(file, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(file, args, { cwd: repo, env: safeEnv, stdio: ["ignore", "pipe", "pipe"], ...options });
    let output = "", bytes = 0, exceeded = false;
    const collect = chunk => {
      bytes += chunk.length;
      if (bytes > 512 * 1024) { exceeded = true; proc.kill("SIGTERM"); return; }
      output += chunk.toString();
    };
    proc.stdout.on("data", collect); proc.stderr.on("data", collect);
    const stop = () => proc.kill("SIGTERM");
    process.once("SIGTERM", stop); process.once("SIGINT", stop);
    proc.once("error", reject);
    proc.once("close", (code, signal) => {
      process.removeListener("SIGTERM", stop); process.removeListener("SIGINT", stop);
      if (exceeded) reject(new Error("Child diagnostic budget exceeded"));
      else resolve({ code, signal, output });
    });
  });
}

async function outer(expectedHead) {
  if (process.getuid?.() !== 1000 || process.platform !== "linux" || process.arch !== "x64" || !/^[a-f0-9]{40}$/.test(expectedHead || "")) throw new Error("Wrong approved source/environment boundary");
  if (command("git", ["rev-parse", "HEAD"]).trim() !== expectedHead || command("git", ["status", "--porcelain"]).trim()) throw new Error("Source differs from the reviewed clean head");
  if (digest(readFileSync(NATIVE_PLAN.schema.path)) !== NATIVE_PLAN.schema.sha256 || existsSync(root)) throw new Error("Changed proposal or existing task directory; preserve it and stop");
  // This is the first future execution action. A denial stops before acquisition;
  // there is no Docker, host-network or privilege-escalation fallback.
  command("/usr/bin/unshare", [...nsArgs, "/usr/bin/true"], { timeout: 10000 });
  mkdirSync(root, { mode: 0o700 }); ownDirectory(root);
  const before = namespaces();
  save("isolation.json", { schemaSha256: NATIVE_PLAN.schema.sha256, sourceHead: expectedHead, parentNetwork: before.network, parentPid: before.pid, parentMount: before.mount });
  const receipt = { status: "pending", phase: "acquisition", sourceHead: expectedHead, nativeExecuted: false, cleanup: "pending" };
  try {
    const archive = join(root, "package.deb");
    command("/usr/bin/curl", ["--fail", "--silent", "--show-error", "--proto", "=https", "--max-redirs", "0", "--retry", "0", "--connect-timeout", "10", "--max-time", "60", "--max-filesize", String(NATIVE_PLAN.package.size), "--output", archive, NATIVE_PLAN.package.url], { timeout: 65000 });
    if (statSync(archive).size !== NATIVE_PLAN.package.size || digest(readFileSync(archive)) !== NATIVE_PLAN.package.sha256) throw new Error("Package identity mismatch; do not execute");
    save("package-receipt.json", NATIVE_PLAN.package);
    mkdirSync(NATIVE_PLAN.paths.engine, { mode: 0o700 });
    command("/usr/bin/dpkg-deb", ["-x", archive, NATIVE_PLAN.paths.engine], { timeout: 30000 });
    receipt.phase = "isolated-fixture";
    // Hard elapsed-time/process-tree boundary; monitored RSS/disk are thresholds,
    // not new cgroup quotas. Namespace PID1 death reaps its remaining descendants.
    const result = await child("/usr/bin/timeout", ["--signal=TERM", "--kill-after=20s", "800s", "/usr/bin/unshare", ...nsArgs, "/usr/bin/prlimit", `--fsize=${NATIVE_PLAN.budgets.fileSizeBytes}`, "--", process.execPath, script, "--inside"]);
    writeFileSync(join(root, "harness.log"), result.output, { mode: 0o600 });
    receipt.nativeExecuted = existsSync(join(root, "engine-version.json"));
    receipt.status = result.code === 0 ? "passed" : result.signal || result.code === 124 ? "interrupted" : "failed";
    receipt.exitCode = result.code; receipt.signal = result.signal;
    if (result.code !== 0) throw new Error("Isolated fixture did not pass; preserve diagnostics, no automatic retry");
    const completed = JSON.parse(readFileSync(join(root, "native-result.json"), "utf8"));
    if (completed.status !== "passed" || completed.serverVersion !== "17.11" || !/^[a-f0-9]{64}$/.test(completed.reportSha256)) throw new Error("Missing native completion evidence");
    receipt.result = completed;
  } catch (error) { if (receipt.status !== "interrupted") receipt.status = "failed"; receipt.error = String(error).slice(0, 1000); throw error; }
  finally {
    // This runs only after the namespace controller exits; its private PID1 and
    // all descendants have terminated. Remove only this invocation's fresh paths.
    ownDirectory(root);
    for (const name of ["data", "socket", "engine", "package.deb"]) if (existsSync(join(root, name))) rmSync(join(root, name), { recursive: true });
    boundedFile(join(root, "server.log"), 65536);
    receipt.cleanup = "owned-cluster-engine-and-sockets-removed"; save("run-receipt.json", receipt);
  }
}

async function inside() {
  ownDirectory(root);
  const m = marker(), current = namespaces();
  if (process.getuid?.() !== 1000 || current.network === m.parentNetwork || current.pid === m.parentPid || current.mount === m.parentMount || m.schemaSha256 !== NATIVE_PLAN.schema.sha256) throw new Error("Isolation unavailable; no engine execution");
  const bin = join(root, "engine/usr/lib/postgresql/17/bin");
  const binaries = Object.fromEntries(["postgres", "initdb", "pg_ctl"].map(name => {
    const path = join(bin, name);
    if (!realpathSync(path).startsWith(root + "/engine/")) throw new Error("Executable escaped verified package");
    const version = command(path, ["--version"]);
    if (!/\b17\.11\b/.test(version)) throw new Error("Unexpected PostgreSQL version");
    return [name, { version: version.trim(), sha256: digest(readFileSync(path)) }];
  }));
  save("engine-version.json", { binaries, namespaces: current, hostConnections: false, hardAggregateMemoryLimit: false });
  mkdirSync(NATIVE_PLAN.paths.socket, { mode: 0o700 });
  command(join(bin, "initdb"), ["-D", NATIVE_PLAN.paths.data, "-L", join(root, "engine/usr/share/postgresql/17"), "--no-locale", "-E", "UTF8", "-U", "everymcp_fixture_admin", "--auth-local=trust", "--auth-host=reject"], { timeout: 60000 });
  writeFileSync(join(NATIVE_PLAN.paths.data, "postgresql.auto.conf"), `listen_addresses = ''\nunix_socket_directories = '${NATIVE_PLAN.paths.socket}'\nunix_socket_permissions = 0700\nport = 55436\nmax_connections = 12\nshared_buffers = '16MB'\nwork_mem = '1MB'\nmaintenance_work_mem = '16MB'\nautovacuum = off\njit = off\nmax_worker_processes = 0\nfsync = on\nfull_page_writes = on\nsynchronous_commit = on\nlog_min_messages = warning\n`, { mode: 0o600 });
  const pgCtl = join(bin, "pg_ctl");
  let started = false, watchdog, threshold = null;
  function identify() {
    const lines = readFileSync(join(NATIVE_PLAN.paths.data, "postmaster.pid"), "utf8").split("\n");
    if (!/^[1-9][0-9]*$/.test(lines[0]) || lines[1] !== NATIVE_PLAN.paths.data || realpathSync(`/proc/${lines[0]}/exe`) !== realpathSync(join(bin, "postgres"))) throw new Error("Unknown cluster process; no signal sent");
    return { pid: lines[0], start: readFileSync(`/proc/${lines[0]}/stat`, "utf8").split(") ")[1].split(" ")[19] };
  }
  try {
    command(pgCtl, ["-D", NATIVE_PLAN.paths.data, "-l", join(root, "server.log"), "-w", "-t", "10", "start"], { timeout: 15000 }); started = true;
    save("started.json", identify());
    watchdog = setInterval(() => {
      try {
        let rss = 0;
        for (const name of readdirSync("/proc").filter(value => /^[0-9]+$/.test(value))) {
          try { rss += Number(/^VmRSS:\s+(\d+)/m.exec(readFileSync(`/proc/${name}/status`, "utf8"))?.[1] || 0) * 1024; } catch { /* exited child */ }
        }
        const disk = Number(command("/usr/bin/du", ["-sb", root], { timeout: 5000 }).split(/\s/)[0]);
        if (rss > NATIVE_PLAN.budgets.watchdogRssBytes || disk > NATIVE_PLAN.budgets.watchdogRootBytes || (existsSync(join(root, "server.log")) && statSync(join(root, "server.log")).size > 1048576)) {
          threshold = { rss, disk }; save("threshold.json", threshold); process.kill(process.pid, "SIGTERM");
        }
      } catch (error) { threshold = { error: String(error).slice(0, 200) }; process.kill(process.pid, "SIGTERM"); }
    }, 1000);
    const result = await child(process.execPath, [join(repo, "node_modules/vitest/vitest.mjs"), "run", NATIVE_PLAN.paths.test, "--maxWorkers=1", "--minWorkers=1", "--reporter=dot"], { env: { ...safeEnv, EVERYMCP_NATIVE_POSTGRES_RUN: "local-pg1711-v1", EVERYMCP_NATIVE_ROOT: root } });
    writeFileSync(join(root, "native-tests.log"), result.output, { mode: 0o600 });
    if (threshold || result.code !== 0) throw new Error("Native fixture interrupted or failed");
  } finally {
    clearInterval(watchdog);
    if (started && existsSync(join(NATIVE_PLAN.paths.data, "postmaster.pid"))) {
      const first = identify(); const second = identify();
      if (first.pid !== second.pid || first.start !== second.start) throw new Error("Cluster identity changed; namespace teardown required");
      try { command(pgCtl, ["-D", NATIVE_PLAN.paths.data, "-m", "fast", "-w", "-t", "10", "stop"], { timeout: 12000 }); }
      catch { identify(); command(pgCtl, ["-D", NATIVE_PLAN.paths.data, "-m", "immediate", "-w", "-t", "10", "stop"], { timeout: 12000 }); }
    }
    save("shutdown.json", { status: "stopped", threshold });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  try {
    if (args.length === 0) process.stdout.write(JSON.stringify({ ...NATIVE_PLAN, invocation: "timeout --signal=TERM --kill-after=20s 900s node scripts/run-monitoring-native-postgres.mjs --run-once <reviewed-head>" }, null, 2) + "\n");
    else if (args.length === 2 && args[0] === "--run-once") await outer(args[1]);
    else if (args.length === 1 && args[0] === "--inside") await inside();
    else throw new Error("Unsupported arguments; no engine action taken");
  } catch (error) { process.stderr.write(String(error).slice(0, 1000) + "\n"); process.exitCode = 1; }
}
