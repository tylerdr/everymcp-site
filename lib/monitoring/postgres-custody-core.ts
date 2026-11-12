import { z } from "zod";
import type { SqlClient, SqlPool } from "@/lib/recovery/postgres-store";
import { canonicalJson, MAX_SOURCE_BYTES, parseCanonical, sha256, timestamp } from "./source-contract";
import { MAX_REPORT_BYTES, MonitoringUnavailable, scopeSchema, type ExecutionStart, type RuntimeReceipt, type Job, type JobCommit, type Scope } from "./runtime";
import { CUSTODY_ACCESS_SQL, CUSTODY_DEFINITION_SQL } from "./postgres-policy";

const HASH = z.string().regex(/^[a-f0-9]{64}$/);
const UUID = z.string().uuid();
const META_BYTES = 65536;
export type CustodyAccess = "producer" | "recovery";
export type PostgresCustodyConfiguration = { scope: Scope; access: CustodyAccess; expectedDefinitionSha256: string };
const equal = (a: unknown, b: unknown) => canonicalJson(a).equals(canonicalJson(b));
const equalBytes = (a: Buffer | null, b: Buffer | null) => a === null || b === null ? a === b : a.equals(b);
const unavailable = () => new MonitoringUnavailable("Monitoring custody unavailable");
const prefix = "account_id=$1 AND mode=$2 AND product_key=$3";

// Constants are also consumed by the fictional SQL fixture. No statement here
// installs or repairs a schema, provisions roles, or writes another product.
export const CUSTODY_SQL = {
  begin: "BEGIN ISOLATION LEVEL SERIALIZABLE",
  settings: "SET LOCAL search_path=pg_catalog; SET LOCAL statement_timeout=5000; SET LOCAL lock_timeout=5000; SET LOCAL idle_in_transaction_session_timeout=5000",
  commit: "COMMIT", rollback: "ROLLBACK",
  start: `SELECT execution_id,nonce,job_id,owner_key,start_sha256,writer_role::text,
    CASE WHEN octet_length(start_bytes)<=65536 THEN start_bytes END AS start_bytes
    FROM everymcp_monitoring.execution_starts WHERE ${prefix} AND execution_id=$4`,
  insertStart: `INSERT INTO everymcp_monitoring.execution_starts
    (account_id,mode,product_key,execution_id,nonce,job_id,owner_key,start_sha256,start_bytes)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING`,
  original: `SELECT c.execution_id,c.job_id,c.owner_key,c.start_sha256,c.receipt_id,c.source_sha256,c.report_sha256,c.report_length,c.writer_role::text,
    s.nonce,s.writer_role::text AS start_writer_role,
    CASE WHEN octet_length(s.start_bytes)<=65536 THEN s.start_bytes END AS start_bytes,
    CASE WHEN octet_length(c.receipt_bytes)<=65536 THEN c.receipt_bytes END AS receipt_bytes,
    CASE WHEN octet_length(c.source_bytes)<=2097152 THEN c.source_bytes END AS source_bytes,
    CASE WHEN octet_length(c.report_bytes)<=2097152 THEN c.report_bytes END AS report_bytes
    FROM everymcp_monitoring.execution_completions c JOIN everymcp_monitoring.execution_starts s
    ON (s.account_id,s.mode,s.product_key,s.execution_id,s.job_id,s.owner_key,s.start_sha256)=
       (c.account_id,c.mode,c.product_key,c.execution_id,c.job_id,c.owner_key,c.start_sha256)
    WHERE c.account_id=$1 AND c.mode=$2 AND c.product_key=$3 AND c.receipt_id=$4`,
  completedExecution: `SELECT receipt_id FROM everymcp_monitoring.execution_completions WHERE ${prefix} AND execution_id=$4`,
  insertOriginal: `INSERT INTO everymcp_monitoring.execution_completions
    (account_id,mode,product_key,execution_id,job_id,owner_key,start_sha256,receipt_id,receipt_bytes,source_bytes,report_bytes,source_sha256,report_sha256,report_length)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) ON CONFLICT DO NOTHING`,
  job: `SELECT job_id,owner_key,receipt_id,job_sha256,writer_role::text,
    CASE WHEN octet_length(job_bytes)<=65536 THEN job_bytes END AS job_bytes
    FROM everymcp_monitoring.job_commits WHERE ${prefix} AND job_id=$4`,
  insertJob: `INSERT INTO everymcp_monitoring.job_commits
    (account_id,mode,product_key,job_id,owner_key,receipt_id,job_sha256,job_bytes)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING`,
} as const;

function metadata(value: unknown): Buffer {
  const bytes = canonicalJson(value);
  if (bytes.length > META_BYTES) throw unavailable();
  return bytes;
}
function buffer(value: unknown, limit: number): Buffer {
  if (!Buffer.isBuffer(value) || value.length === 0 || value.length > limit) throw unavailable();
  return Buffer.from(value);
}
function one(rows: Record<string, unknown>[]): Record<string, unknown> | null {
  if (rows.length > 1) throw unavailable();
  return rows[0] ?? null;
}

/** Real parameterized PostgreSQL custody, never a hosted binding by itself.
 * The pool must be an approved, TLS-verified, dedicated direct-login pool with
 * bounded acquisition/query timeouts. expectedDefinitionSha256 is separately
 * reviewed installation metadata; NEVER learn-and-trust it from this same DB.
 * Database role identity is not deployment or source-observation attestation.
 */
export type BaseStart = Omit<ExecutionStart, "policy" | "runtime"> & { policy: string; runtime: { validFrom: string; validUntil: string } };
export type BaseReceipt = Omit<RuntimeReceipt, "policy" | "runtime" | "reportPolicy"> & { policy: string; runtime: { validFrom: string; validUntil: string }; reportPolicy: string | null };
export type BaseOriginal<S extends BaseStart> = { start: S; status: "completed"; receiptBytes: Buffer; sourceBytes: Buffer | null; reportBytes: Buffer | null };
export abstract class PostgresCustodyCore<S extends BaseStart, R extends BaseReceipt, O extends BaseOriginal<S>> {
  protected abstract parseStart(input: unknown): S;
  protected abstract parseReceipt(input: unknown): R;
  protected abstract identity(job: Job): string;
  protected abstract validateOriginal(input: O): void;
  private readonly scope: Scope;
  private readonly access: CustodyAccess;
  private readonly definition: string;
  protected constructor(private readonly pool: SqlPool, config: PostgresCustodyConfiguration) {
    this.scope = scopeSchema.parse(config.scope);
    this.access = z.enum(["producer", "recovery"]).parse(config.access);
    this.definition = HASH.parse(config.expectedDefinitionSha256);
  }
  private params() { return [this.scope.accountId, this.scope.mode, this.scope.productKey]; }
  private producer() { if (this.access !== "producer") throw unavailable(); }
  private start(input: unknown) {
    const start = this.parseStart(input);
    if (!equal(start.job.scope, this.scope) || start.jobId !== this.identity(start.job)) throw unavailable();
    const bytes = metadata(start);
    return { start, bytes, digest: sha256(bytes) };
  }
  private original(input: O) {
    if (input.status !== "completed") throw unavailable();
    const start = this.start(input.start);
    this.validateOriginal(input);
    const receiptBytes = buffer(input.receiptBytes, META_BYTES);
    const receipt = this.parseReceipt(parseCanonical(receiptBytes, META_BYTES));
    const expected = start.start;
    if (receipt.policy !== expected.policy || receipt.executionId !== expected.executionId || receipt.nonce !== expected.nonce || receipt.jobId !== expected.jobId || receipt.inventorySha256 !== expected.inventorySha256 || !equal(receipt.runtime, expected.runtime) || receipt.evidenceClass !== expected.evidenceClass || receipt.stage !== expected.job.kind || receipt.startedAt !== expected.startedAt || !equal(receipt.inputReceiptIds, expected.job.receiptIds)) throw unavailable();
    const begin = timestamp(expected.startedAt), end = timestamp(receipt.completedAt);
    if (end < begin || end - begin > (receipt.stage === "capture" ? 30000 : 60000) || begin < timestamp(expected.runtime.validFrom) || end > timestamp(expected.runtime.validUntil)) throw unavailable();
    const sourceBytes = input.sourceBytes === null ? null : buffer(input.sourceBytes, MAX_SOURCE_BYTES);
    const reportBytes = input.reportBytes === null ? null : buffer(input.reportBytes, MAX_REPORT_BYTES);
    if (receipt.stage === "capture") {
      if (!sourceBytes || reportBytes !== null || sha256(sourceBytes) !== receipt.sourceSha256 || receipt.reportSha256 !== null || receipt.reportLength !== 0 || receipt.reportPolicy !== null) throw unavailable();
      parseCanonical(sourceBytes); // Full source/inventory admission remains the runtime's responsibility.
    } else if (sourceBytes !== null || receipt.sourceSha256 !== null || !reportBytes || receipt.reportPolicy === null || sha256(reportBytes) !== receipt.reportSha256 || reportBytes.length !== receipt.reportLength) throw unavailable();
    return { ...start, receipt, receiptBytes, sourceBytes, reportBytes, receiptId: sha256(receiptBytes) };
  }
  private decodeStart(row: Record<string, unknown>) {
    const bytes = buffer(row.start_bytes, META_BYTES), parsed = this.start(parseCanonical(bytes, META_BYTES));
    if (!bytes.equals(parsed.bytes) || row.execution_id !== parsed.start.executionId || row.nonce !== parsed.start.nonce || row.job_id !== parsed.start.jobId || row.owner_key !== parsed.start.job.ownerKey || row.start_sha256 !== parsed.digest || row.writer_role !== "everymcp_monitor_producer") throw unavailable();
    return parsed;
  }
  private async readOriginal(client: SqlClient, id: string): Promise<O | null> {
    const row = one((await client.query(CUSTODY_SQL.original, [...this.params(), HASH.parse(id)])).rows);
    if (!row) return null;
    const start = this.decodeStart({ ...row, writer_role: row.start_writer_role });
    const original = { start: start.start, status: "completed", receiptBytes: buffer(row.receipt_bytes, META_BYTES), sourceBytes: row.source_bytes === null ? null : buffer(row.source_bytes, MAX_SOURCE_BYTES), reportBytes: row.report_bytes === null ? null : buffer(row.report_bytes, MAX_REPORT_BYTES) } as O;
    const checked = this.original(original);
    if (row.receipt_id !== id || checked.receiptId !== id || row.source_sha256 !== checked.receipt.sourceSha256 || row.report_sha256 !== checked.receipt.reportSha256 || row.report_length !== checked.receipt.reportLength || row.writer_role !== "everymcp_monitor_producer") throw unavailable();
    return original;
  }
  private async readJob(client: SqlClient, id: string, verifyOriginal = false): Promise<JobCommit | null> {
    const row = one((await client.query(CUSTODY_SQL.job, [...this.params(), HASH.parse(id)])).rows);
    if (!row) return null;
    const bytes = buffer(row.job_bytes, META_BYTES), job = parseCanonical(bytes, META_BYTES) as JobCommit["job"];
    if (row.job_id !== id || row.job_sha256 !== sha256(bytes) || this.identity(job) !== id || row.owner_key !== job.ownerKey || !equal(job.scope, this.scope) || row.writer_role !== "everymcp_monitor_producer") throw unavailable();
    // Recovery first needs only scoped job metadata to check the authenticated
    // owner. Do not read another owner's report body before that runtime check.
    if (verifyOriginal) {
      const original = await this.readOriginal(client, HASH.parse(row.receipt_id));
      if (!original || !equal(original.start.job, job) || original.start.jobId !== id) throw unavailable();
    }
    return { jobId: id, receiptId: HASH.parse(row.receipt_id), job };
  }
  private async transaction<T>(action: (client: SqlClient) => Promise<T>): Promise<T> {
    // Only these SQL-only closures repeat after an acknowledged PostgreSQL
    // serialization/deadlock abort. Transport/COMMIT uncertainty is never retried.
    for (let attempt = 0; ; attempt++) {
      const client = await this.pool.connect();
      let discard: Error | undefined;
      try {
        await client.query(CUSTODY_SQL.begin);
        await client.query(CUSTODY_SQL.settings);
        const access = one((await client.query(CUSTODY_ACCESS_SQL, [...this.params(), this.access])).rows);
        const expectedRole = this.access === "producer" ? "everymcp_monitor_producer" : "everymcp_monitor_recovery";
        if (!access || access.ready !== true || access.role_name !== expectedRole) throw unavailable();
        const definition = one((await client.query(CUSTODY_DEFINITION_SQL)).rows);
        if (!definition || definition.definition_sha256 !== this.definition) throw unavailable();
        const result = await action(client);
        await client.query(CUSTODY_SQL.commit);
        return result;
      } catch (error) {
        discard = error instanceof Error ? error : unavailable();
        await client.query(CUSTODY_SQL.rollback).catch(() => {});
        const code = (error as { code?: unknown } | null)?.code;
        if (attempt >= 2 || (code !== "40001" && code !== "40P01")) throw unavailable();
      } finally { client.release(discard); }
    }
  }
  /** Inspection only; no probe rows, migrations or repairs. Not native isolation acceptance. */
  async checkReadiness(): Promise<boolean> {
    try { await this.transaction(async () => true); return true; } catch { return false; }
  }
  async beginExecution(input: S): Promise<void> {
    this.producer();
    const { start, bytes, digest } = this.start(input);
    await this.transaction(async client => {
      await client.query(CUSTODY_SQL.insertStart, [...this.params(), start.executionId, start.nonce, start.jobId, start.job.ownerKey, digest, bytes]);
      const row = one((await client.query(CUSTODY_SQL.start, [...this.params(), start.executionId])).rows);
      if (!row || !this.decodeStart(row).bytes.equals(bytes)) throw unavailable();
    });
  }
  async completeExecution(id: string, input: O): Promise<void> {
    this.producer(); UUID.parse(id);
    const original = this.original(input);
    if (original.start.executionId !== id) throw unavailable();
    await this.transaction(async client => {
      const start = one((await client.query(CUSTODY_SQL.start, [...this.params(), id])).rows);
      if (!start || !this.decodeStart(start).bytes.equals(original.bytes)) throw unavailable();
      await client.query(CUSTODY_SQL.insertOriginal, [...this.params(), id, original.start.jobId, original.start.job.ownerKey, original.digest, original.receiptId, original.receiptBytes, original.sourceBytes, original.reportBytes, original.receipt.sourceSha256, original.receipt.reportSha256, original.receipt.reportLength]);
      const complete = one((await client.query(CUSTODY_SQL.completedExecution, [...this.params(), id])).rows);
      if (!complete || complete.receipt_id !== original.receiptId) throw unavailable();
      const saved = await this.readOriginal(client, original.receiptId);
      if (!saved || !saved.receiptBytes.equals(original.receiptBytes) || !equal(saved.start, original.start) || !equalBytes(saved.sourceBytes, original.sourceBytes) || !equalBytes(saved.reportBytes, original.reportBytes)) throw unavailable();
    });
  }
  async getExecutionByReceipt(id: string) { HASH.parse(id); return this.transaction(client => this.readOriginal(client, id)); }
  async getJob(id: string) { HASH.parse(id); return this.transaction(client => this.readJob(client, id)); }
  async commitJobIfAbsent(input: JobCommit): Promise<JobCommit> {
    this.producer();
    const bytes = metadata(input.job), job = parseCanonical(bytes, META_BYTES) as JobCommit["job"];
    const jobId = HASH.parse(input.jobId), receiptId = HASH.parse(input.receiptId);
    if (jobId !== this.identity(job) || !equal(job.scope, this.scope)) throw unavailable();
    return this.transaction(async client => {
      const original = await this.readOriginal(client, receiptId);
      if (!original || original.start.jobId !== jobId || !equal(original.start.job, job)) throw unavailable();
      await client.query(CUSTODY_SQL.insertJob, [...this.params(), jobId, job.ownerKey, receiptId, sha256(bytes), bytes]);
      const winner = await this.readJob(client, jobId, true);
      if (!winner) throw unavailable();
      // The immutable existing period wins even when retry inputs have changed.
      return winner;
    });
  }
}
