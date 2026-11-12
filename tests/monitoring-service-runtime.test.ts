/** Actual service workflow/SQL adapter; HTTP/Auth/SQL authority remains explicitly fictional. */
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createNodeCollector } from "../lib/monitoring/collector";
import { CUSTODY_SQL } from "../lib/monitoring/postgres-store";
import { jobIdentity } from "../lib/monitoring/runtime";
import { admitServiceReceipt, createServiceRecordedRuntime } from "../lib/monitoring/service-runtime";
import { serviceJobIdentity, type ServiceOriginal, type ServiceReceipt, type ServiceStart } from "../lib/monitoring/service-records";
import { canonicalJson, sha256 } from "../lib/monitoring/source-contract";
import { fixture, harness, SCOPE } from "./fixtures/monitoring-node/runtime-fixture";
import { FictionalPostgres } from "./fixtures/monitoring-node/postgres-fixture";
import { ownerRequest, TOKEN_B } from "./fixtures/monitoring-node/owner-fixture";
import { producerRequest, serviceHarness } from "./fixtures/monitoring-node/service-fixture";
import { loopback } from "./fixtures/monitoring-node/loopback";
const cleanups: (() => Promise<void>)[] = [], directories: string[] = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0)) await cleanup(); for (const dir of directories.splice(0)) rmSync(dir, { recursive: true, force: true }); });
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
async function prepared() {
  const h = await serviceHarness(), a = await h.capture(0), b = await h.capture(3), report = await h.report([a.receiptId, b.receiptId]);
  const original = (await h.deps.store.getExecutionByReceipt(report.receiptId))!;
  return { h, a, b, report, original };
}
describe("authenticated service-recorded capture, custody and current-owner recovery", () => {
  it("captures real loopback streams, signs/adopts originals, reports useful changes and recovers in a public-key-only fresh process", async () => {
    let body = '<html><body><h1>Requirements</h1><p>Node 18 required.</p><pre>npm install example@1\n  --save</pre></body></html>';
    const local = await loopback((req, res) => {
      if (req.url === "/robots.txt") { res.setHeader("Content-Type", "text/plain"); res.end("User-agent: *\nAllow: /\n"); }
      else { res.setHeader("Content-Type", "text/html; charset=utf-8"); res.setHeader("ETag", '"fictional"'); res.end(body); }
    }); cleanups.push(local.close);
    const dir = mkdtempSync(join(tmpdir(), "everymcp-service-recorded-")); directories.push(dir);
    const h = await serviceHarness(new FictionalPostgres(join(dir, "fictional-postgres.json")));
    h.deps.collectCanonicalSources = createNodeCollector({ now: h.deps.now, transport: local.transport });
    h.setClock("2026-11-01T00:00:00Z");
    const one = await h.runtime.run(producerRequest(), h.add(h.captureJob("2026-11-01T00:00:00Z")));
    body = body.replace("Node 18", "Node 20").replace("example@1", "example@2"); h.setClock("2026-11-09T00:00:00Z");
    const two = await h.runtime.run(producerRequest(), h.add(h.captureJob("2026-11-09T00:00:00Z", [one.receiptId])));
    const report = await h.report([one.receiptId, two.receiptId]), original = (await h.runtime.recover(ownerRequest(), report.jobId))!;
    const text = original.toString();
    expect(text).toContain("Node 18 required"); expect(text).toContain("Node 20 required"); expect(text).toContain("Latest captured change");
    expect(text).toContain("EveryMCP service-recorded observation"); expect(text).toContain("signer/credential-holder endorsement only");
    expect(text).toContain("fictional observations"); expect(text).not.toMatch(/deploymentId|gitSha|vercel-next-custody|actions\/runs/);
    expect(local.calls.map(call => call.path)).toEqual(["/robots.txt", "/example/mcp", "/robots.txt", "/example/mcp"]);
    expect(local.calls[3].headers["if-none-match"]).toBe('"fictional"');
    expect(h.db.state.starts).toHaveLength(3); expect(h.db.state.completions).toHaveLength(3); expect(h.db.state.jobs).toHaveLength(3);
    for (const handle of [one, two, report]) expect(h.verifier.verifyOriginal((await h.deps.store.getExecutionByReceipt(handle.receiptId))!)).toBe(true);
    writeFileSync(join(dir, "expected.json"), JSON.stringify(report)); writeFileSync(join(dir, "original-service-report.md"), original);
    const output = execFileSync(process.execPath, ["node_modules/vitest/vitest.mjs", "run", "tests/fixtures/monitoring-node/service-recover-process.test.ts", "--maxWorkers=1", "--minWorkers=1"], {
      cwd: process.cwd(), env: { PATH: process.env.PATH, NODE_ENV: "test", EVERYMCP_SERVICE_RECOVERY_DIR: dir }, timeout: 30000, encoding: "utf8",
    });
    expect(output).toContain("1 passed"); expect(readFileSync(join(dir, "fresh-process-service-report.md"))).toEqual(original); expect(sha256(original)).toBe(report.reportSha256);
    const evidenceDir = process.env.EVERYMCP_SERVICE_EVIDENCE_DIR;
    if (evidenceDir) for (const name of ["expected.json", "fictional-postgres.json", "original-service-report.md", "fresh-process-service-report.md"]) copyFileSync(join(dir, name), join(evidenceDir, name));
  }, 15000);

  it("authenticates the fixed producer before job/database/collector access and rejects caller ownership or paid flags", async () => {
    const h = await serviceHarness(), id = h.add(h.captureJob("2026-11-12T00:00:00Z"));
    for (const request of [new Request("https://fictional.invalid", { method: "POST" }), producerRequest("x".repeat(64)), new Request("https://fictional.invalid", { method: "POST", headers: { authorization: producerRequest().headers.get("authorization")!, cookie: "owner=forged" } })]) {
      await expect(h.runtime.run(request, id)).rejects.toThrow(/authentication/);
    }
    expect(h.db.connections).toBe(0); expect(h.calls).toEqual({ collect: 0, inventory: 0 });
    h.jobs.delete(id);
    const forged = new Request("https://fictional.invalid", { method: "POST", headers: producerRequest().headers, body: JSON.stringify({ ownerKey: h.ownerKey, paid: true, urls: ["https://attacker.invalid"] }) });
    await expect(h.runtime.run(forged, id)).rejects.toThrow(/Canonical service job unavailable/);
    expect(h.db.connections).toBe(0);
  });

  it("refuses off-watchlist URLs and receipt ownership/inventory substitutions", async () => {
    const h = await serviceHarness(), job = h.captureJob("2026-11-12T00:00:00Z"); job.sourceUrls = ["https://attacker.invalid/private"];
    await expect(h.runtime.run(producerRequest(), h.add(job))).rejects.toThrow(/outside canonical/); expect(h.calls.collect).toBe(0);
    const a = await h.capture(0); h.setClock("2026-11-12T00:00:04Z");
    const canonical = h.reportJob([a.receiptId]), inventory = { catalog: fixture.catalog, curated: fixture.curated };
    await expect(admitServiceReceipt(h.deps, a.receiptId, { ...canonical, ownerKey: "f".repeat(64) }, inventory)).rejects.toThrow(/ownership/);
    await expect(admitServiceReceipt(h.deps, a.receiptId, { ...canonical, scope: { ...SCOPE, productKey: "elsewhere" } }, inventory)).rejects.toThrow(/scope/);
    await expect(admitServiceReceipt(h.deps, a.receiptId, canonical, { ...inventory, catalog: [] })).rejects.toThrow(/inventory changed/);
  });

  it("keeps SQL origin codecs fixed and rejects cross-version reads without altering either original", async () => {
    const db = new FictionalPostgres(), legacy = harness(); legacy.deps.store = db.store("producer");
    const old = await legacy.capture(0), oldBytes = (await legacy.deps.store.getExecutionByReceipt(old.receiptId))!;
    const service = await serviceHarness(db), next = await service.capture(0), newBytes = (await service.deps.store.getExecutionByReceipt(next.receiptId))!;
    expect(serviceJobIdentity(newBytes.start.job)).not.toBe(jobIdentity(newBytes.start.job));
    const before = JSON.stringify(db.state);
    await expect(service.deps.store.getExecutionByReceipt(old.receiptId)).rejects.toThrow();
    await expect(legacy.deps.store.getExecutionByReceipt(next.receiptId)).rejects.toThrow();
    expect(service.verifier.verifyOriginal(oldBytes as unknown as ServiceOriginal)).toBe(false);
    expect(await service.deps.store.getExecutionByReceipt(next.receiptId)).toEqual(newBytes);
    expect(await legacy.deps.store.getExecutionByReceipt(old.receiptId)).toEqual(oldBytes);
    expect(JSON.stringify(db.state)).toBe(before);
  });

  it("accepts exact retries but refuses signed nonce reuse, conflicting starts and altered immutable completion", async () => {
    const { h, original } = await prepared(), store = h.deps.store, before = JSON.stringify(h.db.state);
    await store.beginExecution(original.start); await store.completeExecution(original.start.executionId, original);
    const { signature: _signature, ...unsigned } = original.start;
    const reused = h.producer.signStart({ ...unsigned, executionId: randomUUID() });
    await expect(store.beginExecution(reused)).rejects.toThrow();
    const conflict = h.producer.signStart({ ...unsigned, nonce: randomUUID() });
    await expect(store.beginExecution(conflict)).rejects.toThrow();
    const { signature: _receiptSignature, ...receipt } = JSON.parse(original.receiptBytes.toString()) as ServiceReceipt;
    const reportBytes = Buffer.from("Changed by credential holder; immutable replacement must still fail.");
    const replacement = h.producer.signReceipt(original.start, { ...receipt, reportSha256: sha256(reportBytes), reportLength: reportBytes.length });
    await expect(store.completeExecution(original.start.executionId, { ...original, reportBytes, receiptBytes: canonicalJson(replacement) })).rejects.toThrow();
    expect(JSON.stringify(h.db.state)).toBe(before);
  });

  it("selects one immutable period original for competing runs and changed-input retries", async () => {
    const h = await serviceHarness(), a = await h.capture(0), b = await h.capture(3);
    const [one, two] = await Promise.all([h.report([a.receiptId, b.receiptId]), h.report([a.receiptId, b.receiptId])]);
    expect(two).toEqual(one); expect(h.db.state.jobs.filter(row => row.job_id === one.jobId)).toHaveLength(1);
    const before = JSON.stringify(h.db.state), calls = { ...h.calls };
    expect(await h.report([a.receiptId])).toEqual(one); // Same canonical period recovers original inputs.
    expect(JSON.stringify(h.db.state)).toBe(before); expect(h.calls).toEqual(calls);
  });

  it("does not retry an uncertain commit and explicitly recovers its exact acknowledged-later original", async () => {
    const { h, report, original } = await prepared(); h.db.state.jobs = h.db.state.jobs.filter(row => row.job_id !== report.jobId);
    const commit = { jobId: report.jobId, receiptId: report.receiptId, job: original.start.job }, connections = h.db.connections;
    h.db.failNext = { sql: CUSTODY_SQL.commit, code: "ECONNRESET", afterCommit: true };
    await expect(h.deps.store.commitJobIfAbsent(commit)).rejects.toThrow(); expect(h.db.connections).toBe(connections + 1);
    expect(await h.deps.store.getJob(report.jobId)).toEqual(commit);
    expect(await h.runtime.recover(ownerRequest(), report.jobId)).toEqual(original.reportBytes);
  });

  it("checks current authenticated owner before body reads and can recover without any producer authority", async () => {
    const { h, report, original } = await prepared(); h.deps.store = h.makeStore("recovery"); h.deps.producer = undefined;
    const runtime = createServiceRecordedRuntime(h.deps), count = h.db.calls.length;
    expect(await runtime.recover(ownerRequest(TOKEN_B), report.jobId)).toBeNull();
    expect(h.db.calls.slice(count).some(call => call.sql === CUSTODY_SQL.original)).toBe(false);
    const before = JSON.stringify(h.db.state);
    expect(await runtime.recover(ownerRequest(), report.jobId)).toEqual(original.reportBytes);
    await expect(runtime.run(producerRequest(), report.jobId)).rejects.toThrow(/producer unavailable/);
    expect(JSON.stringify(h.db.state)).toBe(before);
    expect(h.db.calls.filter(call => call.access === "recovery").some(call => call.sql.startsWith("INSERT"))).toBe(false);
  });

  it("separates current generate/recover rights, fails unknown closed and checks revocation again after reading", async () => {
    const { h, report, original } = await prepared(), rights = h.deps.currentRights;
    h.deps.currentRights = async (job, action) => ({ ...(await rights(job, action))!, decision: action === "generate" ? "denied" : "active" });
    await expect(h.runtime.run(producerRequest(), report.jobId)).rejects.toThrow(/Access denied/);
    expect(await h.runtime.recover(ownerRequest(), report.jobId)).toEqual(original.reportBytes);
    h.deps.currentRights = async (job, action) => ({ ...(await rights(job, action))!, decision: "unknown" });
    await expect(h.runtime.recover(ownerRequest(), report.jobId)).rejects.toThrow(/rights unavailable/);
    let checks = 0; h.deps.currentRights = async (job, action) => ({ ...(await rights(job, action))!, decision: ++checks === 1 ? "active" : "denied" });
    expect(await h.runtime.recover(ownerRequest(), report.jobId)).toBeNull(); expect(checks).toBe(2);
  });

  it("rejects stored tampering and recovery-role writes before returning or replacing signed originals", async () => {
    const { h, report, original } = await prepared(), reader = h.makeStore("recovery"), connections = h.db.connections;
    await expect(reader.beginExecution(original.start)).rejects.toThrow(); await expect(reader.completeExecution(original.start.executionId, original)).rejects.toThrow();
    expect(h.db.connections).toBe(connections);
    const row = h.db.state.completions.find(item => item.receipt_id === report.receiptId)!;
    row.report_bytes = Buffer.from("tampered"); await expect(h.runtime.recover(ownerRequest(), report.jobId)).rejects.toThrow();
    row.report_bytes = original.reportBytes;
    const startRow = h.db.state.starts.find(item => item.execution_id === original.start.executionId)!;
    const forged = clone(original.start); forged.runtime.serviceId = "another-service";
    startRow.start_bytes = canonicalJson(forged as ServiceStart); startRow.start_sha256 = sha256(startRow.start_bytes as Buffer);
    await expect(h.runtime.recover(ownerRequest(), report.jobId)).rejects.toThrow();
  });
});
