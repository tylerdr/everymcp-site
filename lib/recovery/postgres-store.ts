export interface SqlClient {
  query<Row = Record<string, unknown>>(sql: string, values?: unknown[]): Promise<{ rows: Row[] }>;
  release(): void;
}
export interface SqlPool { connect(): Promise<SqlClient> }
import { assertLedger, receiptId, type EntitlementStore, type Ledger, type Receipt, type Scope } from "./entitlements";

// Server-only, fixed private schema; no migration, role provisioning or global
// credentials. The caller supplies an approved, dedicated scoped login/pool.
export class PostgresStore implements EntitlementStore {
  constructor(private readonly pool: SqlPool, private readonly scope: Scope) {}
  async transaction<T>(change: (ledger: Ledger) => T): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      const client = await this.pool.connect();
      try {
        await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
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
        await client.query("COMMIT");
        return result;
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        const code = (error as { code?: string }).code;
        if (attempt >= 2 || !["40001", "40P01", "23505"].includes(code || "")) throw error;
      } finally { client.release(); }
    }
  }
  private async read(client: SqlClient): Promise<Ledger> {
    const events = await client.query<{ event_id: string; payload_sha256: string }>("SELECT event_id,payload_sha256 FROM everymcp_receipts.payment_events WHERE account_id=$1 AND mode=$2", [this.scope.accountId, this.scope.mode]);
    const receipts = await client.query<{ session_id: string; receipt_id: string; owner_key: string; packet: string; packet_sha256: string }>("SELECT session_id,receipt_id,owner_key,packet,packet_sha256 FROM everymcp_receipts.paid_receipts WHERE account_id=$1 AND mode=$2", [this.scope.accountId, this.scope.mode]);
    const ledger: Ledger = { events: {}, receipts: {} };
    for (const row of events.rows) ledger.events[row.event_id] = row.payload_sha256;
    for (const row of receipts.rows) {
      const value: Receipt = { id: row.receipt_id, sessionId: row.session_id, scope: { ...this.scope }, ownerKey: row.owner_key, packet: row.packet, packetSha256: row.packet_sha256 };
      if (value.id !== receiptId(this.scope, value.sessionId)) throw new Error("Store receipt identity failure");
      ledger.receipts[value.id] = value;
    }
    return ledger;
  }
}
