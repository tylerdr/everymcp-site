/** Fictional SQL server model, NOT PostgreSQL, RLS, TLS or hosted durability evidence. */
import { readFileSync, writeFileSync } from "node:fs";
import type { SqlClient, SqlPool } from "../../../lib/recovery/postgres-store";
import { CUSTODY_ACCESS_SQL, CUSTODY_DEFINITION_SQL } from "../../../lib/monitoring/postgres-policy";
import { CUSTODY_SQL, PostgresCustodyStore, type CustodyAccess } from "../../../lib/monitoring/postgres-store";
import { SCOPE } from "./runtime-fixture";
type Row = Record<string, unknown>;
type State = { starts: Row[]; completions: Row[]; jobs: Row[] };
export const FICTIONAL_DEFINITION = "e".repeat(64); // Not an observed native installation fingerprint.
// Do not JSON-revive every byte on every modeled query: real-catalog receipts are large.
// The on-disk JSON format stays unchanged. This is only the fictional SQL response model.
export function cloneFictionalSqlValue<T>(value: T): T {
  if (Buffer.isBuffer(value)) return Buffer.from(value) as T;
  if (Array.isArray(value)) return value.map(item => cloneFictionalSqlValue(item)) as T;
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    if ("type" in value && value.type === "Buffer" && "data" in value && Array.isArray(value.data)) return Buffer.from(value.data) as T;
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneFictionalSqlValue(item)])) as T;
  }
  if (value === null || ["string", "boolean"].includes(typeof value) || typeof value === "number" && Number.isFinite(value)) return value;
  throw new Error("Unsupported fictional SQL value");
}
const cloned = cloneFictionalSqlValue;
const sameScope = (row: Row, args: unknown[]) => row.account_id === args[0] && row.mode === args[1] && row.product_key === args[2];
const databaseError = (code: string) => Object.assign(new Error("Fictional database fault"), { code });
export class FictionalPostgres {
  state: State = { starts: [], completions: [], jobs: [] };
  readonly calls: { access: CustodyAccess; sql: string; values: unknown[] }[] = [];
  readonly releases: (Error | undefined)[] = [];
  connections = 0;
  ready = true;
  definition = FICTIONAL_DEFINITION;
  failNext: { sql: string; code: string; afterCommit?: boolean } | null = null;
  failAlways: { sql: string; code: string } | null = null;
  private queue: Promise<void> = Promise.resolve();
  constructor(private readonly path?: string) {
    if (path) { try { this.state = cloned(JSON.parse(readFileSync(path, "utf8"))); } catch (error) { if ((error as { code?: string }).code !== "ENOENT") throw error; } }
  }
  save() { if (this.path) writeFileSync(this.path, JSON.stringify(this.state)); }
  store(access: CustodyAccess) { return new PostgresCustodyStore(this.pool(access), { scope: SCOPE, access, expectedDefinitionSha256: FICTIONAL_DEFINITION }); }
  pool(access: CustodyAccess): SqlPool {
    return { connect: async () => {
      this.connections++;
      let draft: State | null = null, unlock: (() => void) | undefined;
      const end = () => { draft = null; unlock?.(); unlock = undefined; };
      const client: SqlClient = {
        query: async <T,>(sql: string, values: unknown[] = []): Promise<{ rows: T[] }> => {
          this.calls.push({ access, sql, values: cloned(values) });
          const fault = this.failNext?.sql === sql ? this.failNext : this.failAlways?.sql === sql ? this.failAlways : null;
          if (fault === this.failNext) this.failNext = null;
          if (fault && !("afterCommit" in fault && fault.afterCommit)) throw databaseError(fault.code);
          let rows: Row[] = [];
          if (sql === CUSTODY_SQL.begin) {
            const prior = this.queue;
            this.queue = new Promise<void>(resolve => { unlock = resolve; });
            await prior; draft = cloned(this.state);
          } else if (sql === CUSTODY_SQL.rollback) end();
          else if (!draft) throw new Error("Fictional transaction missing");
          else if (sql === CUSTODY_SQL.settings) { /* Session settings are recorded, not native-executed. */ }
          else if (sql === CUSTODY_SQL.commit) {
            this.state = cloned(draft); this.save(); end();
            if (fault && "afterCommit" in fault && fault.afterCommit) throw databaseError(fault.code);
          } else if (sql === CUSTODY_ACCESS_SQL) rows = [{ ready: this.ready && values[0] === SCOPE.accountId && values[1] === SCOPE.mode && values[2] === SCOPE.productKey && values[3] === access, role_name: access === "producer" ? "everymcp_monitor_producer" : "everymcp_monitor_recovery" }];
          else if (sql === CUSTODY_DEFINITION_SQL) rows = [{ definition_sha256: this.definition }];
          else {
            const writer_role = "everymcp_monitor_producer";
            const scope = { account_id: values[0], mode: values[1], product_key: values[2] };
            if ([CUSTODY_SQL.insertStart, CUSTODY_SQL.insertOriginal, CUSTODY_SQL.insertJob].includes(sql as typeof CUSTODY_SQL.insertStart) && access !== "producer") throw databaseError("42501");
            if (sql === CUSTODY_SQL.insertStart) {
              if (!draft.starts.some(r => sameScope(r, values) && (r.execution_id === values[3] || r.nonce === values[4]))) draft.starts.push({ ...scope, execution_id: values[3], nonce: values[4], job_id: values[5], owner_key: values[6], start_sha256: values[7], start_bytes: cloned(values[8]), writer_role });
            } else if (sql === CUSTODY_SQL.start) rows = draft.starts.filter(r => sameScope(r, values) && r.execution_id === values[3]);
            else if (sql === CUSTODY_SQL.insertOriginal) {
              if (!draft.starts.some(r => sameScope(r, values) && r.execution_id === values[3] && r.job_id === values[4] && r.owner_key === values[5] && r.start_sha256 === values[6])) throw databaseError("23503");
              if (!draft.completions.some(r => sameScope(r, values) && (r.execution_id === values[3] || r.receipt_id === values[7]))) draft.completions.push({ ...scope, execution_id: values[3], job_id: values[4], owner_key: values[5], start_sha256: values[6], receipt_id: values[7], receipt_bytes: cloned(values[8]), source_bytes: cloned(values[9]), report_bytes: cloned(values[10]), source_sha256: values[11], report_sha256: values[12], report_length: values[13], writer_role });
            } else if (sql === CUSTODY_SQL.completedExecution) rows = draft.completions.filter(r => sameScope(r, values) && r.execution_id === values[3]).map(r => ({ receipt_id: r.receipt_id }));
            else if (sql === CUSTODY_SQL.original) {
              rows = draft.completions.filter(r => sameScope(r, values) && r.receipt_id === values[3]).flatMap(r => {
                const s = draft!.starts.find(s => sameScope(s, values) && s.execution_id === r.execution_id && s.job_id === r.job_id && s.owner_key === r.owner_key && s.start_sha256 === r.start_sha256);
                return s ? [{ ...r, nonce: s.nonce, start_bytes: s.start_bytes, start_writer_role: s.writer_role }] : [];
              });
            } else if (sql === CUSTODY_SQL.job) rows = draft.jobs.filter(r => sameScope(r, values) && r.job_id === values[3]);
            else if (sql === CUSTODY_SQL.insertJob) {
              if (!draft.completions.some(r => sameScope(r, values) && r.job_id === values[3] && r.owner_key === values[4] && r.receipt_id === values[5])) throw databaseError("23503");
              if (!draft.jobs.some(r => sameScope(r, values) && r.job_id === values[3])) draft.jobs.push({ ...scope, job_id: values[3], owner_key: values[4], receipt_id: values[5], job_sha256: values[6], job_bytes: cloned(values[7]), writer_role });
            } else throw new Error("Unexpected fictional SQL statement");
          }
          return { rows: cloned(rows) as T[] };
        },
        release: error => { this.releases.push(error); end(); },
      };
      return client;
    } };
  }
}
