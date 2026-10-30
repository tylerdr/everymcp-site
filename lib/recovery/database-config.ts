import { X509Certificate } from "node:crypto";
import type { PoolConfig } from "pg";

export const receiptAuthProject = "wcacimdgzcdehcbtjkbk";
type Environment = Record<string, string | undefined>;

// Server-only configuration. No connection or credential discovery occurs here.
// The operator binds the exact dashboard-returned host:port, never a guessed region.
export function receiptPoolConfiguration(env: Environment): PoolConfig | null {
  try {
    if (env.EVERYMCP_AUTH_PROJECT !== receiptAuthProject) return null;
    const url = env.EVERYMCP_RECEIPT_DATABASE_URL;
    if (!url) return null;
    const database = new URL(url);
    const role = decodeURIComponent(database.username);
    const direct = database.hostname === `db.${receiptAuthProject}.supabase.co`
      && database.port === "5432" && role === "everymcp_receipt_server";
    const pooled = database.hostname.endsWith(".pooler.supabase.com")
      && ["5432", "6543"].includes(database.port)
      && role === `everymcp_receipt_server.${receiptAuthProject}`;
    if (database.protocol !== "postgresql:" || database.pathname !== "/postgres"
      || (!direct && !pooled) || !database.password || database.search || database.hash
      || env.EVERYMCP_RECEIPT_DATABASE_ENDPOINT !== database.host) return null;

    // Without an override, Node's trusted roots apply. A custom root is never a
    // reason to disable certificate or hostname verification. Reject malformed
    // configured trust instead of silently falling back to a different root set.
    let ca: string | undefined;
    if (env.EVERYMCP_RECEIPT_DATABASE_CA_CERT !== undefined) {
      ca = env.EVERYMCP_RECEIPT_DATABASE_CA_CERT.trim();
      if (ca.length > 65536 || !/^-----BEGIN CERTIFICATE-----\r?\n[A-Za-z0-9+/=\r\n]+\r?\n-----END CERTIFICATE-----$/.test(ca)
        || !new X509Certificate(ca).ca) return null;
    }
    return {
      connectionString: url,
      ssl: { rejectUnauthorized: true, ...(ca ? { ca } : {}) },
      // Per-instance bound; the installed role's limit remains the database cap.
      max: 1,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 5000
    };
  } catch { return null; }
}
