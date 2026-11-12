import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { CUSTODY_SQL, PostgresCustodyStore } from "../lib/monitoring/postgres-store";
import { CUSTODY_ACCESS_SQL, CUSTODY_DEFINITION_SQL } from "../lib/monitoring/postgres-policy";
import { jobIdentity, type OriginalExecution, type RuntimeReceipt } from "../lib/monitoring/runtime";
import { canonicalJson, sha256 } from "../lib/monitoring/source-contract";
import { harness, request, SCOPE } from "./fixtures/monitoring-node/runtime-fixture";
import { FICTIONAL_DEFINITION, FictionalPostgres } from "./fixtures/monitoring-node/postgres-fixture";

async function prepared() {
  const db = new FictionalPostgres(), store = db.store("producer"), h = harness(); h.deps.store = store;
  const a = await h.capture(0), b = await h.capture(3), report = await h.report([a.receiptId, b.receiptId]);
  return { db, store, h, a, b, report, original: (await store.getExecutionByReceipt(report.receiptId))! };
}
describe("real PostgreSQL custody adapter against a fictional SQL server", () => {
  it("accepts an installed pg Pool structurally without opening a connection or configuring a host", async () => {
    const pool = new Pool(); // pg does not connect until asked; this test never asks.
    const store = new PostgresCustodyStore(pool, { scope: SCOPE, access: "recovery", expectedDefinitionSha256: FICTIONAL_DEFINITION });
    expect(store).toBeInstanceOf(PostgresCustodyStore); expect(pool.totalCount).toBe(0); await pool.end();
  });
  it("runs capture→admission→report→immutable SQL originals and recovery with the separate read role", async () => {
    const { db, h, report, original } = await prepared();
    expect(db.state.starts).toHaveLength(3); expect(db.state.completions).toHaveLength(3); expect(db.state.jobs).toHaveLength(3);
    h.deps.store = db.store("recovery");
    const before = JSON.stringify(db.state);
    expect(await h.runtime.recover(request(), report.jobId)).toEqual(original.reportBytes);
    expect(JSON.stringify(db.state)).toBe(before);
    expect(db.calls.filter(c => c.access === "recovery").some(c => c.sql.startsWith("INSERT"))).toBe(false);
    expect(db.calls.filter(c => c.sql.startsWith("INSERT")).every(c => !c.sql.includes("writer_role"))).toBe(true);
    expect(db.releases).toHaveLength(db.connections);
  });
  it("checks current scope/role and independently approved definition on each transaction before custody access", async () => {
    const db = new FictionalPostgres(), store = db.store("producer"); db.ready = false;
    expect(await store.checkReadiness()).toBe(false);
    expect(db.calls.map(c => c.sql)).toEqual([CUSTODY_SQL.begin, CUSTODY_SQL.settings, CUSTODY_ACCESS_SQL, CUSTODY_SQL.rollback]);
    db.ready = true; db.definition = "0".repeat(64); db.calls.length = 0;
    await expect(store.getJob("a".repeat(64))).rejects.toThrow();
    expect(db.calls.map(c => c.sql)).toEqual([CUSTODY_SQL.begin, CUSTODY_SQL.settings, CUSTODY_ACCESS_SQL, CUSTODY_DEFINITION_SQL, CUSTODY_SQL.rollback]);
    db.definition = FICTIONAL_DEFINITION;
    const wrong = new PostgresCustodyStore(db.pool("producer"), { scope: { ...SCOPE, accountId: "acct_other" }, access: "producer", expectedDefinitionSha256: FICTIONAL_DEFINITION });
    expect(await wrong.checkReadiness()).toBe(false);
  });
  it("refuses all recovery-role writes before acquiring a database client", async () => {
    const { db, original, report, h } = await prepared(), reader = db.store("recovery"), before = db.connections;
    await expect(reader.beginExecution(original.start)).rejects.toThrow();
    await expect(reader.completeExecution(original.start.executionId, original)).rejects.toThrow();
    await expect(reader.commitJobIfAbsent({ jobId: report.jobId, receiptId: report.receiptId, job: h.jobs.get(report.jobId)! })).rejects.toThrow();
    expect(db.connections).toBe(before);
  });
  it("makes exact start/completion retries idempotent but rejects nonce, identity and original-byte reuse", async () => {
    const { store, original, db } = await prepared(), before = JSON.stringify(db.state);
    await store.beginExecution(original.start); await store.completeExecution(original.start.executionId, original);
    expect(JSON.stringify(db.state)).toBe(before);
    await expect(store.beginExecution({ ...original.start, executionId: randomUUID() })).rejects.toThrow(); // reused nonce
    await expect(store.beginExecution({ ...original.start, nonce: randomUUID() })).rejects.toThrow(); // changed start for same execution
    const receipt = JSON.parse(original.receiptBytes.toString()) as RuntimeReceipt;
    const altered: OriginalExecution = { ...original, reportBytes: Buffer.from("changed original"), receiptBytes: canonicalJson({ ...receipt, reportSha256: sha256(Buffer.from("changed original")), reportLength: 16 }) };
    await expect(store.completeExecution(original.start.executionId, altered)).rejects.toThrow();
    expect(JSON.stringify(db.state)).toBe(before);
  });
  it("rejects malformed/oversized bytes and cross-scope jobs before any insert", async () => {
    const { db, store, original } = await prepared(); const count = db.connections;
    await expect(store.completeExecution(original.start.executionId, { ...original, reportBytes: Buffer.alloc(2097153) })).rejects.toThrow();
    await expect(store.completeExecution(original.start.executionId, { ...original, receiptBytes: Buffer.from("{}") })).rejects.toThrow();
    const start = { ...original.start, job: { ...original.start.job, scope: { ...SCOPE, productKey: "other" } } };
    start.jobId = jobIdentity(start.job);
    await expect(store.beginExecution(start)).rejects.toThrow();
    expect(db.connections).toBe(count);
  });
  it("verifies read rows, hashes, original ownership and database writer provenance before returning bytes", async () => {
    const { db, store, original, report } = await prepared();
    const row = db.state.completions.find(r => r.receipt_id === report.receiptId)!;
    row.report_bytes = Buffer.from("corrupted"); await expect(store.getExecutionByReceipt(report.receiptId)).rejects.toThrow();
    row.report_bytes = original.reportBytes; row.writer_role = "untrusted"; await expect(store.getExecutionByReceipt(report.receiptId)).rejects.toThrow();
    row.writer_role = "everymcp_monitor_producer";
    const job = db.state.jobs.find(r => r.job_id === report.jobId)!;
    job.owner_key = "f".repeat(64); await expect(store.getJob(report.jobId)).rejects.toThrow();
  });
  it("selects one verified immutable period winner under competing report generation", async () => {
    const db = new FictionalPostgres(), h = harness(); h.deps.store = db.store("producer");
    const a = await h.capture(0), b = await h.capture(3);
    const [first, second] = await Promise.all([h.report([a.receiptId, b.receiptId]), h.report([a.receiptId, b.receiptId])]);
    expect(second).toEqual(first); expect(db.state.jobs.filter(r => r.job_id === first.jobId)).toHaveLength(1);
    const original = await h.runtime.recover(request(), first.jobId);
    expect(sha256(original!)).toBe(first.reportSha256);
  });
  it("bounds acknowledged serialization/deadlock retries and never retries a transport-uncertain commit", async () => {
    const db = new FictionalPostgres(), store = db.store("producer");
    db.failNext = { sql: CUSTODY_ACCESS_SQL, code: "40001" };
    expect(await store.checkReadiness()).toBe(true); expect(db.connections).toBe(2); expect(db.releases).toHaveLength(2);
    db.failNext = { sql: CUSTODY_ACCESS_SQL, code: "40P01" };
    expect(await store.checkReadiness()).toBe(true); expect(db.connections).toBe(4);
    db.failAlways = { sql: CUSTODY_ACCESS_SQL, code: "40001" };
    expect(await store.checkReadiness()).toBe(false); expect(db.connections).toBe(7); expect(db.releases).toHaveLength(7);
    const { db: populated, store: writer, original, report } = await prepared();
    populated.state.jobs = populated.state.jobs.filter(r => r.job_id !== report.jobId);
    const count = populated.connections;
    populated.failNext = { sql: CUSTODY_SQL.commit, code: "ECONNRESET", afterCommit: true };
    const commit = { jobId: report.jobId, receiptId: report.receiptId, job: original.start.job };
    await expect(writer.commitJobIfAbsent(commit)).rejects.toThrow();
    expect(populated.connections).toBe(count + 1); // No automatic retry of an uncertain external write.
    expect(await writer.getJob(report.jobId)).toEqual(commit);
    expect(await writer.commitJobIfAbsent(commit)).toEqual(commit); // Later explicit recovery, same original.
  });
});
