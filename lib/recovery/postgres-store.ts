import { createHash, randomBytes } from "node:crypto";
export interface SqlClient {
  query<Row = Record<string, unknown>>(sql: string, values?: unknown[]): Promise<{ rows: Row[] }>;
  release(error?: Error): void;
}
export interface SqlPool { connect(): Promise<SqlClient> }
import { assertLedger, receiptId, type EntitlementStore, type Ledger, type Receipt, type Scope } from "./entitlements";

// Effective privileges include PUBLIC even for NOINHERIT logins. Check on every
// transaction before reading receipts or exercising either INSERT policy. This
// is a deny-only check: never repair another product's permissions from the app.
export const databaseIsolationSql = `SELECT NOT EXISTS (
  SELECT 1 FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.member
  WHERE r.rolname=current_user
) AND NOT EXISTS (
  SELECT 1 FROM pg_namespace n
  WHERE n.nspname NOT IN ('pg_catalog','information_schema','everymcp_receipts')
    AND n.nspname NOT LIKE 'pg_%'
    AND has_schema_privilege(current_user,n.oid,'CREATE')
) AND NOT EXISTS (
  SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname NOT IN ('pg_catalog','information_schema','everymcp_receipts')
    AND n.nspname NOT LIKE 'pg_%'
    AND has_schema_privilege(current_user,n.oid,'USAGE')
    AND ((c.relkind IN ('r','p','v','m','f') AND (
      has_table_privilege(current_user,c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
      OR has_any_column_privilege(current_user,c.oid,'SELECT,INSERT,UPDATE,REFERENCES')
    )) OR (c.relkind='S' AND has_sequence_privilege(current_user,c.oid,'USAGE,SELECT,UPDATE')))
) AND NOT EXISTS (
  SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE p.prosecdef AND n.nspname NOT IN ('pg_catalog','information_schema')
    AND n.nspname NOT LIKE 'pg_%'
    AND has_schema_privilege(current_user,n.oid,'USAGE')
    AND has_function_privilege(current_user,p.oid,'EXECUTE')
) AS isolated`;

// Server-only, fixed private schema; no migration, role provisioning or global
// credentials. The caller supplies an approved, dedicated scoped login/pool.
export class PostgresStore implements EntitlementStore {
  constructor(private readonly pool: SqlPool, private readonly scope: Scope) {}
  transaction<T>(change: (ledger: Ledger) => T): Promise<T> { return this.run(change, false); }
  async checkReadiness(): Promise<boolean> {
    // Exercise BOTH scoped INSERT/RLS paths in the same rollback-only transaction.
    // A grant/forced-RLS catalog check alone cannot prove policy applicability.
    const nonce = randomBytes(32).toString("hex");
    const sessionId = `cs_${this.scope.mode}_readiness_${nonce}`;
    const packet = "# EveryMCP MCP Integration Starter Kit\n" + Array.from({ length: 7 }, (_, i) => `\n## ${i + 1}. Readiness probe\nNot a purchase.\n`).join("") + "\n## What this paid packet includes\nRollback-only probe; never committed.";
    const id = receiptId(this.scope, sessionId);
    try {
      await this.run((ledger) => {
        ledger.events[nonce] = createHash("sha256").update("rollback-only readiness").digest("hex");
        ledger.receipts[id] = { id, sessionId, scope: { ...this.scope }, ownerKey: nonce, packet, packetSha256: createHash("sha256").update(packet).digest("hex") };
      }, true);
      return true;
    } catch { return false; }
  }
  private async run<T>(change: (ledger: Ledger) => T, rollbackOnly: boolean): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      const client = await this.pool.connect();
      let discard: Error | undefined;
      try {
        await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
        const isolation = await client.query<{ isolated: boolean }>(databaseIsolationSql);
        if (isolation.rows.length !== 1 || isolation.rows[0].isolated !== true) throw new Error("Cross-product store isolation unavailable");
        const permissions = await client.query<{ ready: boolean }>(`SELECT
          current_user = 'everymcp_receipt_server'
          AND NOT r.rolsuper AND NOT r.rolinherit AND NOT r.rolbypassrls
          AND NOT r.rolcreatedb AND NOT r.rolcreaterole AND NOT r.rolreplication
          AND count(*) = 2
          AND bool_and(c.relrowsecurity AND c.relforcerowsecurity)
          AND bool_and(has_table_privilege(current_user,c.oid,'SELECT') AND has_table_privilege(current_user,c.oid,'INSERT'))
          AND bool_and(NOT has_table_privilege(current_user,c.oid,'UPDATE') AND NOT has_table_privilege(current_user,c.oid,'DELETE')) AS ready
          FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
          CROSS JOIN pg_roles r WHERE n.nspname='everymcp_receipts'
          AND c.relname IN ('payment_events','paid_receipts') AND c.relkind='r'
          AND r.rolname=current_user
          GROUP BY r.rolsuper,r.rolinherit,r.rolbypassrls,r.rolcreatedb,r.rolcreaterole,r.rolreplication`);
        if (permissions.rows.length !== 1 || permissions.rows[0].ready !== true) throw new Error("Dedicated store permissions unavailable");
        await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [JSON.stringify(this.scope)]);
        const ledger = await this.read(client);
        assertLedger(ledger);
        const before = JSON.parse(JSON.stringify(ledger)) as Ledger;
        const result = change(ledger);
        if (result instanceof Promise) throw new Error("Transaction callback must be synchronous");
        assertLedger(ledger);
        // Immutable rows: reject mutation/deletion rather than silently losing it.
        for (const [key, value] of Object.entries(before.events)) if (ledger.events[key] !== value) throw new Error("Immutable event mutation");
        for (const [key, value] of Object.entries(before.receipts)) if (JSON.stringify(ledger.receipts[key]) !== JSON.stringify(value)) throw new Error("Immutable receipt mutation");
        for (const [key, value] of Object.entries(ledger.events)) {
          if (!(key in before.events)) await client.query("INSERT INTO everymcp_receipts.payment_events (account_id, mode, event_id, payload_sha256) VALUES ($1,$2,$3,$4)", [this.scope.accountId, this.scope.mode, key, value]);
        }
        for (const [key, value] of Object.entries(ledger.receipts)) {
          if (!(key in before.receipts)) {
            if (value.scope.accountId !== this.scope.accountId || value.scope.mode !== this.scope.mode) throw new Error("Store scope mismatch");
            await client.query("INSERT INTO everymcp_receipts.paid_receipts (account_id,mode,session_id,receipt_id,owner_key,packet,packet_sha256) VALUES ($1,$2,$3,$4,$5,$6,$7)", [this.scope.accountId, this.scope.mode, value.sessionId, value.id, value.ownerKey, value.packet, value.packetSha256]);
          }
        }
        await client.query(rollbackOnly ? "ROLLBACK" : "COMMIT");
        return result;
      } catch (error) {
        discard = error instanceof Error ? error : new Error("Store transaction failed");
        await client.query("ROLLBACK").catch(() => {});
        const code = (error as { code?: string }).code;
        if (attempt >= 2 || !["40001", "40P01", "23505"].includes(code || "")) throw error;
      } finally { client.release(discard); }
    }
  }
  private async read(client: SqlClient): Promise<Ledger> {
    const events = await client.query<{ event_id: string; payload_sha256: string }>("SELECT event_id,payload_sha256 FROM everymcp_receipts.payment_events WHERE account_id=$1 AND mode=$2", [this.scope.accountId, this.scope.mode]);
    const receipts = await client.query<{ session_id: string; receipt_id: string; owner_key: string; packet: string; packet_sha256: string }>("SELECT session_id,receipt_id,owner_key,packet,packet_sha256 FROM everymcp_receipts.paid_receipts WHERE account_id=$1 AND mode=$2", [this.scope.accountId, this.scope.mode]);
    const ledger: Ledger = { events: {}, receipts: {} };
    for (const row of events.rows) {
      if (!/^[a-f0-9]{64}$/.test(row.event_id) || !/^[a-f0-9]{64}$/.test(row.payload_sha256) || Object.prototype.hasOwnProperty.call(ledger.events, row.event_id)) throw new Error("Store event integrity failure");
      ledger.events[row.event_id] = row.payload_sha256;
    }
    for (const row of receipts.rows) {
      const value: Receipt = { id: row.receipt_id, sessionId: row.session_id, scope: { ...this.scope }, ownerKey: row.owner_key, packet: row.packet, packetSha256: row.packet_sha256 };
      if (value.id !== receiptId(this.scope, value.sessionId)) throw new Error("Store receipt identity failure");
      ledger.receipts[value.id] = value;
    }
    return ledger;
  }
}
