/** UNEXECUTED native fixture. Explicit local-run marker + isolated namespaces required. */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { appendFileSync, lstatSync, readFileSync, readlinkSync, realpathSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { Pool, type PoolClient } from "pg";
import type { SqlClient, SqlPool } from "../../lib/recovery/postgres-store";
import { NATIVE_PLAN, fixtureProposal } from "../../scripts/monitoring-native-plan.mjs";
import { CUSTODY_ACCESS_SQL, CUSTODY_DEFINITION_SQL } from "../../lib/monitoring/postgres-policy";
import { CUSTODY_SQL, PostgresCustodyStore } from "../../lib/monitoring/postgres-store";
import { canonicalJson, sha256 } from "../../lib/monitoring/source-contract";
import { jobIdentity, type Job, type OriginalExecution } from "../../lib/monitoring/runtime";
import { createMonitoringOwner } from "../../lib/monitoring/owner";
import { harness, request, SCOPE } from "../fixtures/monitoring-node/runtime-fixture";
import { OWNER_CONFIG, TOKEN_A, TOKEN_B, USER_A, USER_B, authResponse, ownerRequest } from "../fixtures/monitoring-node/owner-fixture";

const enabled = process.env.EVERYMCP_NATIVE_POSTGRES_RUN === "local-pg1711-v1";
const root = NATIVE_PLAN.paths.root;
type Role = "everymcp_fixture_admin" | "everymcp_monitor_producer" | "everymcp_monitor_recovery" | "everymcp_fixture_wrapper";
const producer: Role = "everymcp_monitor_producer", recovery: Role = "everymcp_monitor_recovery", administrator: Role = "everymcp_fixture_admin";
const pools = new Map<Role, Pool>();
let statements = 0, attempts = 0, active = 0, logBytes = 0;
const sqlStates: string[] = [];
let definition = "", baseline: unknown, original: OriginalExecution, reportId = "", receiptId = "";
let owner = "";
let h: ReturnType<typeof harness>;
const failed = (error: unknown) => {
  const item = error as { code?: unknown; constraint?: unknown; table?: unknown } | null;
  return { sqlstate: typeof item?.code === "string" ? item.code : "LOCAL_ERROR", constraint: typeof item?.constraint === "string" ? item.constraint : null, table: typeof item?.table === "string" ? item.table : null };
};
function checkpoint(stage: string, data: unknown) {
  const line = JSON.stringify({ stage, statements, attempts, active, data }) + "\n";
  logBytes += Buffer.byteLength(line);
  if (logBytes > NATIVE_PLAN.budgets.retainedLogBytes) throw new Error("Native diagnostic budget exhausted");
  appendFileSync(join(root, "diagnostics.ndjson"), line, { mode: 0o600 });
}
function pool(role: Role) {
  if (!pools.has(role)) pools.set(role, new Pool({ host: NATIVE_PLAN.paths.socket, port: 55436, user: role, database: "postgres", ssl: false, max: 2, connectionTimeoutMillis: 2000, idleTimeoutMillis: 1000, query_timeout: 5000, application_name: "everymcp-native-fixture" }));
  return pools.get(role)!;
}
async function connect(role: Role): Promise<PoolClient> {
  if (++attempts > NATIVE_PLAN.budgets.connections) throw new Error("Native connection budget exhausted");
  if (++active > NATIVE_PLAN.budgets.activeConnections) { active--; throw new Error("Native active-connection budget exhausted"); }
  try { return await pool(role).connect(); }
  catch (error) { active--; checkpoint("connect:" + role, failed(error)); throw error; }
}
function release(client: PoolClient, error?: Error) { active--; client.release(error); }
async function query(client: PoolClient, stage: string, sql: string, values: unknown[] = [], catalog = false) {
  // Conservative count includes multi-statement setup/settings and all retries.
  statements += Math.max(1, sql.split(";").filter(part => part.trim()).length);
  if (statements > NATIVE_PLAN.budgets.sqlQueries) throw new Error("Native SQL budget exhausted");
  try {
    const result = await client.query(sql, values);
    const parts = Array.isArray(result) ? result : [result];
    const rows = parts.at(-1)?.rows as Record<string, unknown>[] || [];
    checkpoint(stage, { sqlstate: "00000", rowCounts: parts.map(part => part.rowCount), ...(catalog ? { rows } : {}) });
    return { rows };
  } catch (error) { const diagnostic = failed(error); sqlStates.push(diagnostic.sqlstate); checkpoint(stage, diagnostic); throw error; }
}
async function sql(role: Role, stage: string, text: string, values: unknown[] = [], catalog = false) {
  const client = await connect(role);
  try { return await query(client, stage, text, values, catalog); }
  finally { release(client); }
}
async function denied(stage: string, execute: () => Promise<unknown>, code: string) {
  let observed = "NO_ERROR";
  try { await execute(); } catch (error) { observed = failed(error).sqlstate; }
  checkpoint(stage + ":assertion", { expectedSqlstate: code, observedSqlstate: observed });
  expect(observed).toBe(code);
}
function adapterPool(role: typeof producer | typeof recovery, intercept?: (sql: string, values: unknown[], result: "before" | "after") => Promise<void>): SqlPool {
  return { connect: async () => {
    const client = await connect(role);
    const bound: SqlClient = {
      query: async <Row,>(text: string, values: unknown[] = []) => {
        await intercept?.(text, values, "before");
        const result = await query(client, "adapter:" + text.split(/\s+/)[0], text, values);
        await intercept?.(text, values, "after");
        return { rows: result.rows as Row[] };
      }, release: error => release(client, error),
    };
    return bound;
  } };
}
function store(access: "producer" | "recovery", intercept?: Parameters<typeof adapterPool>[1]) {
  return new PostgresCustodyStore(adapterPool(access === "producer" ? producer : recovery, intercept), { scope: SCOPE, access, expectedDefinitionSha256: definition });
}
async function ready(expected: boolean, stage: string) {
  const result = await sql(producer, stage, CUSTODY_ACCESS_SQL, [SCOPE.accountId, SCOPE.mode, SCOPE.productKey, "producer"], true);
  checkpoint(stage + ":assertion", { expected, observed: result.rows }); expect(result.rows).toEqual([{ role_name: producer, ready: expected }]);
}
async function fingerprint() {
  const client = await connect(administrator);
  try { await query(client, "catalog-search-path", "SET search_path=pg_catalog"); return (await query(client, "definition", CUSTODY_DEFINITION_SQL, [], true)).rows[0].definition_sha256 as string; }
  finally { release(client); }
}
async function snapshot() {
  return (await sql(administrator, "exact-catalog", `WITH target AS (SELECT c.oid,c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='everymcp_monitoring' AND c.relkind='r')
    SELECT t.relname::text AS name,
    ARRAY(SELECT a.attname::text FROM pg_attribute a WHERE a.attrelid=t.oid AND a.attnum>0 AND NOT a.attisdropped ORDER BY a.attnum)::text[] AS columns,
    ARRAY(SELECT pg_get_constraintdef(c.oid,false)::text FROM pg_constraint c WHERE c.conrelid=t.oid ORDER BY c.conname)::text[] AS constraints,
    COALESCE((SELECT jsonb_agg(jsonb_build_object('name',p.polname::text,'command',p.polcmd::text,'permissive',p.polpermissive,'roles',ARRAY(SELECT pg_get_userbyid(x)::text FROM unnest(p.polroles) x ORDER BY x)::text[],'using',pg_get_expr(p.polqual,p.polrelid,false),'check',pg_get_expr(p.polwithcheck,p.polrelid,false)) ORDER BY p.polname) FROM pg_policy p WHERE p.polrelid=t.oid),'[]'::jsonb) AS policies
    FROM target t ORDER BY t.relname`, [], true)).rows;
}

describe.skipIf(!enabled)("approved disposable PostgreSQL17.11 fixture — never hosted acceptance", () => {
  beforeAll(async () => {
    if (process.env.EVERYMCP_NATIVE_ROOT !== root || process.getuid?.() !== 1000 || realpathSync(root) !== root) throw new Error("Wrong native fixture boundary");
    const stat = lstatSync(root);
    if (!stat.isDirectory() || stat.isSymbolicLink() || stat.uid !== 1000 || (stat.mode & 0o777) !== 0o700) throw new Error("Unsafe fixture directory");
    const marker = JSON.parse(readFileSync(join(root, "isolation.json"), "utf8")) as { schemaSha256: string; parentNetwork: string; parentPid: string; parentMount: string };
    if (marker.schemaSha256 !== NATIVE_PLAN.schema.sha256 || readlinkSync("/proc/self/ns/net") === marker.parentNetwork || readlinkSync("/proc/self/ns/pid") === marker.parentPid || readlinkSync("/proc/self/ns/mnt") === marker.parentMount) throw new Error("Unverified namespace boundary");
    const version = await sql(administrator, "server-identity", "SELECT current_setting('server_version_num')::integer AS version,current_user::text AS role,current_setting('listen_addresses')::text AS listeners,current_setting('fsync')::text AS fsync,current_setting('synchronous_commit')::text AS synchronous_commit", [], true);
    expect(version.rows).toEqual([{ version: 170011, role: administrator, listeners: "", fsync: "on", synchronous_commit: "on" }]);
    const source = readFileSync(NATIVE_PLAN.schema.path, "utf8");
    fixtureProposal(source); // Hash/wrapper validation before any fixture DDL.
    await sql(administrator, "proposal-rollback-syntax", source);
    const rolledBack = await sql(administrator, "proposal-rollback-observed", "SELECT to_regnamespace('everymcp_monitoring')::text AS schema", [], true); expect(rolledBack.rows).toEqual([{ schema: null }]);
    await sql(administrator, "fixture-only-install", fixtureProposal(source));
    const roles = await sql(administrator, "nologin-placeholders", "SELECT rolname::text AS role,rolcanlogin AS login FROM pg_roles WHERE rolname IN ('everymcp_monitor_owner','everymcp_monitor_producer','everymcp_monitor_recovery') ORDER BY rolname", [], true);
    expect(roles.rows).toEqual([{ role: "everymcp_monitor_owner", login: false }, { role: producer, login: false }, { role: recovery, login: false }]);
    await denied("nologin-connection", async () => { const client = await connect(producer); release(client); }, "28000");
    await sql(administrator, "fixture-local-role-binding", `ALTER ROLE everymcp_monitor_producer LOGIN; ALTER ROLE everymcp_monitor_recovery LOGIN;
      SET ROLE everymcp_monitor_owner;
      INSERT INTO everymcp_monitoring.role_bindings VALUES ('everymcp_monitor_producer','acct_fictional','test','source-history-fixture','producer',1),('everymcp_monitor_recovery','acct_fictional','test','source-history-fixture','recovery',1); RESET ROLE;`);
    baseline = await snapshot();
    const columns = (baseline as { name: string; columns: string[] }[]).map(row => ({ name: row.name, columns: row.columns }));
    checkpoint("typed-catalog-before-assertion", columns);
    expect(columns.every(row => Array.isArray(row.columns) && row.columns.every(name => typeof name === "string"))).toBe(true);
    expect(columns.find(row => row.name === "role_bindings")?.columns).toEqual(["role_name", "account_id", "mode", "product_key", "access_kind", "contract_version"]);
    expect(columns).toHaveLength(4);
    definition = await fingerprint(); expect(definition).toMatch(/^[a-f0-9]{64}$/);
    checkpoint("fixture-definition-only-not-hosted-approval", { definition });
  }, 45000);

  it("accepts clean defaults and direct login, but rejects a SET ROLE wrapper", async () => {
    await ready(true, "clean-defaults");
    await sql(administrator, "create-local-wrapper", `CREATE ROLE everymcp_fixture_wrapper LOGIN NOINHERIT; GRANT everymcp_monitor_producer TO everymcp_fixture_wrapper;`);
    const client = await connect("everymcp_fixture_wrapper");
    try {
      await query(client, "wrapper-set-role", "SET ROLE everymcp_monitor_producer");
      const state = await query(client, "wrapper-identity", "SELECT current_user::text AS effective,session_user::text AS session", [], true);
      expect(state.rows).toEqual([{ effective: producer, session: "everymcp_fixture_wrapper" }]);
      const guard = await query(client, "wrapper-guard", CUSTODY_ACCESS_SQL, [SCOPE.accountId, SCOPE.mode, SCOPE.productKey, "producer"], true); expect(guard.rows[0].ready).toBe(false);
    } finally { release(client); }
  });

  it("refuses ambient PUBLIC capabilities without changing unrelated real grants", async () => {
    // All objects/grants below are new fictional objects in this disposable cluster.
    await sql(administrator, "fixture-public-definer", "CREATE FUNCTION public.everymcp_fixture_definer() RETURNS integer LANGUAGE sql SECURITY DEFINER AS 'SELECT 1'");
    await ready(false, "public-definer-refused"); expect(await fingerprint()).toBe(definition);
    const recoveryQueries: string[] = [];
    const blockedRecovery = store("recovery", async (text, _values, phase) => { if (phase === "before") recoveryQueries.push(text); });
    let recoveryRefused = false;
    try { await blockedRecovery.getJob("a".repeat(64)); } catch (error) { recoveryRefused = error instanceof Error && error.message === "Monitoring custody unavailable"; }
    checkpoint("ambient-public-recovery-before-assertion", { recoveryRefused, guardChecked: recoveryQueries.includes(CUSTODY_ACCESS_SQL), fingerprintChecked: recoveryQueries.includes(CUSTODY_DEFINITION_SQL), custodyRead: recoveryQueries.includes(CUSTODY_SQL.job) });
    expect(recoveryRefused).toBe(true); expect(recoveryQueries).toContain(CUSTODY_ACCESS_SQL);
    expect(recoveryQueries).not.toContain(CUSTODY_DEFINITION_SQL); expect(recoveryQueries).not.toContain(CUSTODY_SQL.job);
    await sql(administrator, "remove-own-definer", "DROP FUNCTION public.everymcp_fixture_definer()");
    await sql(administrator, "fixture-public-read", "CREATE TABLE public.everymcp_fixture_table(id integer); INSERT INTO public.everymcp_fixture_table VALUES(7); GRANT SELECT ON public.everymcp_fixture_table TO PUBLIC");
    await ready(false, "public-readable-refused");
    await sql(administrator, "fixture-denying-rls", "ALTER TABLE public.everymcp_fixture_table ENABLE ROW LEVEL SECURITY; ALTER TABLE public.everymcp_fixture_table FORCE ROW LEVEL SECURITY");
    const invisible = await sql(producer, "denying-rls-observed", "SELECT id FROM public.everymcp_fixture_table", [], true); expect(invisible.rows).toEqual([]);
    await ready(false, "public-readable-with-denying-rls-still-refused"); expect(await fingerprint()).toBe(definition);
    await sql(administrator, "remove-own-public-table", "DROP TABLE public.everymcp_fixture_table");
    await sql(administrator, "fixture-unrelated-roles", "CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE TABLE public.everymcp_fixture_limited(id integer); CREATE SEQUENCE public.everymcp_fixture_sequence; GRANT SELECT ON public.everymcp_fixture_limited TO anon,authenticated; GRANT USAGE,SELECT ON SEQUENCE public.everymcp_fixture_sequence TO anon,authenticated");
    await ready(true, "unrelated-role-grants-pass-without-membership");
    await sql(administrator, "fixture-invoker-and-usage", "CREATE SCHEMA everymcp_fixture_other; GRANT USAGE ON SCHEMA everymcp_fixture_other TO PUBLIC; CREATE FUNCTION everymcp_fixture_other.invoker() RETURNS integer LANGUAGE sql SECURITY INVOKER AS 'SELECT 1'");
    await ready(true, "foreign-usage-and-invoker-alone-pass");
    await sql(administrator, "fixture-legacy-public-create", "GRANT CREATE ON SCHEMA public TO PUBLIC");
    await ready(false, "legacy-public-create-refused");
    // Restore ONLY the fixture grant this test created, not any hosted/unrelated ACL.
    await sql(administrator, "undo-own-fixture-create-grant", "REVOKE CREATE ON SCHEMA public FROM PUBLIC");
    await ready(true, "fixture-defaults-restored"); expect(await snapshot()).toEqual(baseline);
  });

  it("produces original reports through the installed adapter and enforces native grants/RLS/constraints", async () => {
    const auth = createMonitoringOwner(OWNER_CONFIG, async (_url, options) => authResponse(JSON.stringify(new Headers(options?.headers).get("authorization") === "Bearer " + TOKEN_B ? USER_B : USER_A)));
    owner = (await auth(ownerRequest()))!.ownerKey;
    h = harness(undefined, owner); h.deps.store = store("producer"); h.deps.authenticateOwner = auth;
    const a = await h.capture(0), b = await h.capture(3), report = await h.report([a.receiptId, b.receiptId]);
    reportId = report.jobId; receiptId = report.receiptId; original = (await h.deps.store.getExecutionByReceipt(receiptId))!;
    checkpoint("native-original-before-assertion", { ...report, bytes: original.reportBytes!.length, sha256: sha256(original.reportBytes!) });
    expect(sha256(original.reportBytes!)).toBe(report.reportSha256);
    const start = original.start;
    function startValues(account = SCOPE.accountId) {
      const job = { ...start.job, scope: { ...start.job.scope, accountId: account } };
      const next = { ...start, executionId: randomUUID(), nonce: randomUUID(), job, jobId: jobIdentity(job) };
      const bytes = canonicalJson(next);
      return [account, SCOPE.mode, SCOPE.productKey, next.executionId, next.nonce, next.jobId, owner, sha256(bytes), bytes];
    }
    await denied("native-cross-scope-insert", () => sql(producer, "cross-scope-insert", CUSTODY_SQL.insertStart, startValues("acct_other")), "42501");
    await sql(administrator, "fixture-other-scope-seed", CUSTODY_SQL.insertStart, startValues("acct_other"));
    const hidden = await sql(producer, "cross-scope-read", "SELECT execution_id::text FROM everymcp_monitoring.execution_starts WHERE account_id='acct_other'", [], true); expect(hidden.rows).toEqual([]);
    await denied("native-read-role-insert", () => sql(recovery, "read-role-insert", CUSTODY_SQL.insertStart, startValues()), "42501");
    await denied("native-writer-column", () => sql(producer, "writer-column", "UPDATE everymcp_monitoring.execution_starts SET writer_role=current_user"), "42501");
    await denied("native-explicit-writer-insert", () => sql(producer, "explicit-writer-insert", CUSTODY_SQL.insertStart.replace("start_bytes)", "start_bytes,writer_role)").replace("$8,$9)", "$8,$9,current_user)"), startValues()), "42501");
    await denied("native-binding-update", () => sql(producer, "binding-update", "UPDATE everymcp_monitoring.role_bindings SET mode='live'"), "42501");
    await denied("native-original-delete", () => sql(producer, "original-delete", "DELETE FROM everymcp_monitoring.execution_completions"), "42501");
    await denied("native-original-truncate", () => sql(producer, "original-truncate", "TRUNCATE everymcp_monitoring.execution_completions"), "42501");
    const bad = startValues(); bad[7] = "f".repeat(64);
    await denied("native-hash-constraint", () => sql(producer, "hash-constraint", CUSTODY_SQL.insertStart, bad), "23514");
    const empty = startValues(); empty[8] = Buffer.alloc(0); empty[7] = sha256(Buffer.alloc(0));
    await denied("native-empty-constraint", () => sql(producer, "empty-constraint", CUSTODY_SQL.insertStart, empty), "23514");
    const receipt = JSON.parse(original.receiptBytes.toString()) as Record<string, unknown>;
    const absentId = randomUUID(), newReceipt = canonicalJson({ ...receipt, executionId: absentId });
    await denied("native-foreign-key", () => sql(producer, "foreign-key", CUSTODY_SQL.insertOriginal, [SCOPE.accountId,SCOPE.mode,SCOPE.productKey,absentId,start.jobId,owner,sha256(canonicalJson(start)),sha256(newReceipt),newReceipt,null,original.reportBytes,null,sha256(original.reportBytes!),original.reportBytes!.length]), "23503");
    await h.deps.store.beginExecution(start); await h.deps.store.completeExecution(start.executionId, original);
    h.deps.store = store("recovery");
    expect(await h.runtime.recover(ownerRequest(TOKEN_A), reportId)).toEqual(original.reportBytes);
    expect(await h.runtime.recover(ownerRequest(TOKEN_B), reportId)).toBeNull();
    const activeRights = h.deps.currentRights;
    h.deps.currentRights = async (job, action) => ({ ...await activeRights(job, action), decision: "denied" });
    expect(await h.runtime.recover(ownerRequest(TOKEN_A), reportId)).toBeNull(); h.deps.currentRights = activeRights;
    expect(await snapshot()).toEqual(baseline);
  });

  it("runs competing SERIALIZABLE commits and recovers an explicitly injected lost acknowledgement", async () => {
    const job: Job = { ...original.start.job, version: 2 }, id = h.add(job);
    let arrivals = 0, releaseGate!: () => void;
    const gate = new Promise<void>(resolve => { releaseGate = resolve; });
    h.deps.store = store("producer", async (sql, values, phase) => {
      if (phase === "before" && sql === CUSTODY_SQL.insertJob && values[3] === id && ++arrivals <= 2) { if (arrivals === 2) releaseGate(); await gate; }
    });
    const [one, two] = await Promise.all([h.runtime.run(request(), id), h.runtime.run(request(), id)]);
    checkpoint("serializable-winners-before-assertion", { one, two, sqlStates }); expect(two).toEqual(one); expect(sqlStates).toContain("40001");
    const lostJob = { ...job, version: 3 }, lostId = h.add(lostJob);
    let pendingLostAck = false, injected = false;
    h.deps.store = store("producer", async (sql, values, phase) => {
      if (phase === "before" && sql === CUSTODY_SQL.insertJob && values[3] === lostId) pendingLostAck = true;
      if (phase === "after" && sql === CUSTODY_SQL.commit && pendingLostAck && !injected) { injected = true; checkpoint("injected-after-real-commit", { lostId, note: "Acknowledgement hidden from adapter; not an actual network-fault claim" }); throw Object.assign(new Error("Fictional lost acknowledgement"), { code: "ECONNRESET" }); }
    });
    await expect(h.runtime.run(request(), lostId)).rejects.toThrow();
    const committed = await store("recovery").getJob(lostId); checkpoint("lost-ack-committed-before-assertion", committed); expect(committed).not.toBeNull();
    h.deps.store = store("producer");
    const recovered = await h.runtime.run(request(), lostId); expect(recovered.receiptId).toBe(committed!.receiptId);
  }, 45000);

  it("recovers the same original after a clean engine restart and preserves exact catalog definitions", async () => {
    const footprint = await sql(administrator, "fixture-footprint", "SELECT pg_total_relation_size('everymcp_monitoring.execution_starts')+pg_total_relation_size('everymcp_monitoring.execution_completions')+pg_total_relation_size('everymcp_monitoring.job_commits') AS bytes", [], true);
    expect(Number(footprint.rows[0].bytes)).toBeLessThanOrEqual(NATIVE_PLAN.budgets.fixtureBytes);
    await Promise.all([...pools.values()].map(value => value.end())); pools.clear();
    const bin = join(root, "engine/usr/lib/postgresql/17/bin/pg_ctl");
    checkpoint("clean-restart-requested", { data: NATIVE_PLAN.paths.data });
    execFileSync(bin, ["-D", NATIVE_PLAN.paths.data, "-m", "fast", "-w", "-t", "10", "restart"], { timeout: 25000, env: { PATH: "/usr/bin:/bin", LANG: "C", NODE_ENV: "test" }, stdio: "pipe", maxBuffer: 65536 });
    checkpoint("clean-restart-returned", { crashTest: false });
    const resumed = harness(undefined, owner); resumed.deps.store = store("recovery");
    resumed.deps.authenticateOwner = createMonitoringOwner(OWNER_CONFIG, async () => authResponse());
    resumed.deps.loadInventory = async () => { throw new Error("No regeneration"); }; resumed.deps.collectCanonicalSources = async () => { throw new Error("No collection"); };
    const bytes = await resumed.runtime.recover(ownerRequest("fictional-native-fresh-session"), reportId);
    checkpoint("restart-original-before-assertion", { bytes: bytes?.length, sha256: bytes && sha256(bytes), expected: sha256(original.reportBytes!) });
    expect(bytes).toEqual(original.reportBytes); expect(await snapshot()).toEqual(baseline); expect(await fingerprint()).toBe(definition);
    writeFileSync(join(root, "native-original.md"), bytes!, { mode: 0o600 });
    writeFileSync(join(root, "native-result.json"), JSON.stringify({ status: "passed", sourceClass: "fictional-observations-auth-rights; native-local-postgresql", serverVersion: "17.11", definition, reportId, receiptId, reportSha256: sha256(bytes!), reportBytes: bytes!.length, statements, attempts, sqlStates, cleanRestartOnly: true }), { mode: 0o600 });
  }, 45000);

  afterAll(async () => { await Promise.allSettled([...pools.values()].map(value => value.end())); pools.clear(); });
});
