import { rootCertificates } from "node:tls";
import { afterEach, describe, expect, it, vi } from "vitest";
import { receiptAuthProject, receiptPoolConfiguration } from "../lib/recovery/database-config";
import { PostgresStore, type SqlClient } from "../lib/recovery/postgres-store";

const pool = vi.hoisted(() => vi.fn());
vi.mock("pg", () => ({ Pool: pool }));
const endpoint = "aws-0-review-only.pooler.supabase.com:6543";
const configuration = () => ({
  EVERYMCP_AUTH_PROJECT: receiptAuthProject,
  EVERYMCP_RECEIPT_DATABASE_ENDPOINT: endpoint,
  EVERYMCP_RECEIPT_DATABASE_URL: `postgresql://everymcp_receipt_server.${receiptAuthProject}:synthetic%40password@${endpoint}/postgres`
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.clearAllMocks(); vi.resetModules(); });

describe("reviewed runtime configuration without provider access", () => {
  it("binds exact direct/session/transaction endpoints with verified TLS and one local connection", () => {
    const env = configuration();
    for (const [host, role] of [
      [endpoint, `everymcp_receipt_server.${receiptAuthProject}`],
      [endpoint.replace(":6543", ":5432"), `everymcp_receipt_server.${receiptAuthProject}`],
      [`db.${receiptAuthProject}.supabase.co:5432`, "everymcp_receipt_server"]
    ]) {
      const result = receiptPoolConfiguration({ ...env, EVERYMCP_RECEIPT_DATABASE_ENDPOINT: host,
        EVERYMCP_RECEIPT_DATABASE_URL: `postgresql://${role}:synthetic@${host}/postgres` });
      expect(result).toMatchObject({ ssl: { rejectUnauthorized: true }, max: 1, connectionTimeoutMillis: 5000, idleTimeoutMillis: 5000 });
      expect(result).not.toHaveProperty("options");
    }
  });
  it("rejects project, host, port, role, database and URL trust overrides before connecting", () => {
    const env = configuration();
    for (const patch of [
      { EVERYMCP_AUTH_PROJECT: "abcdefghijklmnopqrst" },
      { EVERYMCP_RECEIPT_DATABASE_ENDPOINT: undefined },
      { EVERYMCP_RECEIPT_DATABASE_ENDPOINT: "aws-1-review-only.pooler.supabase.com:6543" },
      ...[
        env.EVERYMCP_RECEIPT_DATABASE_URL + "?sslmode=no-verify",
        env.EVERYMCP_RECEIPT_DATABASE_URL + "?options=-c%20role=postgres",
        env.EVERYMCP_RECEIPT_DATABASE_URL + "#ignored",
        env.EVERYMCP_RECEIPT_DATABASE_URL.replace("postgresql:", "http:"),
        env.EVERYMCP_RECEIPT_DATABASE_URL.replace("/postgres", "/other"),
        env.EVERYMCP_RECEIPT_DATABASE_URL.replace("everymcp_receipt_server.", "postgres."),
        env.EVERYMCP_RECEIPT_DATABASE_URL.replace(":synthetic%40password", ""),
        env.EVERYMCP_RECEIPT_DATABASE_URL.replace(receiptAuthProject, "abcdefghijklmnopqrst")
      ].map((EVERYMCP_RECEIPT_DATABASE_URL) => ({ EVERYMCP_RECEIPT_DATABASE_URL })),
      { EVERYMCP_RECEIPT_DATABASE_ENDPOINT: endpoint.replace(":6543", ":9999"), EVERYMCP_RECEIPT_DATABASE_URL: env.EVERYMCP_RECEIPT_DATABASE_URL.replace(":6543", ":9999") },
      { EVERYMCP_RECEIPT_DATABASE_ENDPOINT: "attacker.invalid:6543", EVERYMCP_RECEIPT_DATABASE_URL: env.EVERYMCP_RECEIPT_DATABASE_URL.replace(endpoint, "attacker.invalid:6543") }
    ]) expect(receiptPoolConfiguration({ ...env, ...patch })).toBeNull();
  });
  it("retains explicit public CA trust and rejects malformed/empty overrides without disabling verification", () => {
    const ca = rootCertificates[0]; // Public trust fixture; no generated keys/certificates.
    expect(receiptPoolConfiguration({ ...configuration(), EVERYMCP_RECEIPT_DATABASE_CA_CERT: ca })?.ssl)
      .toEqual({ rejectUnauthorized: true, ca: ca.trim() });
    for (const invalid of ["", "not a certificate", "-----BEGIN CERTIFICATE-----\nAAAA\n-----END CERTIFICATE-----", ca + "\n" + ca, "x".repeat(65537)]) {
      expect(receiptPoolConfiguration({ ...configuration(), EVERYMCP_RECEIPT_DATABASE_CA_CERT: invalid })).toBeNull();
    }
  });
  it("passes approved TLS configuration to Pool without network calls", async () => {
    const env = { ...configuration(), VERCEL_ENV: "preview", VERCEL_URL: "everymcp-review.vercel.app",
      NEXT_PUBLIC_SITE_URL: "https://everymcp-review.vercel.app", EVERYMCP_PREVIEW_RECOVERY: "named-sandbox-v1",
      STRIPE_MODE: "test", STRIPE_ACCOUNT_ID: "acct_1Re4ltEQ7c58oLZ4", STRIPE_SECRET_KEY: "sk_test_synthetic",
      EVERYMCP_AUTH_PUBLISHABLE_KEY: "sb_publishable_synthetic", EVERYMCP_STRIPE_WEBHOOK_SECRET: "whsec_synthetic",
      EVERYMCP_RECEIPT_DATABASE_CA_CERT: rootCertificates[0] };
    for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value);
    const fetcher = vi.fn(() => { throw new Error("Provider access forbidden in source checks"); });
    vi.stubGlobal("fetch", fetcher);
    const { getStarterBinding } = await import("../lib/recovery/binding");
    expect(getStarterBinding()).not.toBeNull();
    expect(pool).toHaveBeenCalledExactlyOnceWith(receiptPoolConfiguration(env));
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("invalid project/endpoint/trust constructs no Pool and performs no fetch", async () => {
    const env = { ...configuration(), VERCEL_ENV: "preview", VERCEL_URL: "everymcp-review.vercel.app",
      NEXT_PUBLIC_SITE_URL: "https://everymcp-review.vercel.app", EVERYMCP_PREVIEW_RECOVERY: "named-sandbox-v1",
      STRIPE_MODE: "test", STRIPE_ACCOUNT_ID: "acct_1Re4ltEQ7c58oLZ4", STRIPE_SECRET_KEY: "sk_test_synthetic",
      EVERYMCP_AUTH_PUBLISHABLE_KEY: "sb_publishable_synthetic", EVERYMCP_STRIPE_WEBHOOK_SECRET: "whsec_synthetic" };
    for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value);
    const fetcher = vi.fn(() => { throw new Error("Provider access forbidden in source checks"); });
    vi.stubGlobal("fetch", fetcher);
    const { getStarterBinding } = await import("../lib/recovery/binding");
    for (const [key, value] of [["EVERYMCP_AUTH_PROJECT", "abcdefghijklmnopqrst"], ["EVERYMCP_RECEIPT_DATABASE_ENDPOINT", "wrong:6543"], ["EVERYMCP_RECEIPT_DATABASE_CA_CERT", "broken"]]) {
      vi.stubEnv(key, value);
      expect(getStarterBinding()).toBeNull();
      vi.unstubAllEnvs();
      for (const [name, original] of Object.entries(env)) vi.stubEnv(name, original);
    }
    expect(pool).not.toHaveBeenCalled(); expect(fetcher).not.toHaveBeenCalled();
  });
});

describe("transaction-pooler timeout boundary without a database", () => {
  it.each([false, true])("sets local timeouts before isolation/receipt work; timeout refusal=%s", async (refuse) => {
    const calls: string[] = [];
    const client: SqlClient = { async query<Row>(sql: string) {
      calls.push(sql);
      if (refuse && sql.startsWith("SET LOCAL")) throw new Error("Settings unavailable");
      return { rows: (sql.includes("AS isolated") ? [{ isolated: true }] : sql.includes("AS ready") ? [{ ready: true }] : []) as Row[] };
    }, release: vi.fn() };
    const store = new PostgresStore({ connect: async () => client }, { accountId: "acct_synthetic", mode: "test" });
    const change = vi.fn(() => true);
    if (refuse) {
      await expect(store.transaction(change)).rejects.toThrow("Settings unavailable");
      expect(change).not.toHaveBeenCalled();
      expect(calls).toHaveLength(3); expect(calls[2]).toBe("ROLLBACK");
    } else {
      expect(await store.transaction(change)).toBe(true);
      expect(calls[2]).toContain("AS isolated"); expect(calls.at(-1)).toBe("COMMIT");
    }
    expect(calls[0]).toBe("BEGIN ISOLATION LEVEL SERIALIZABLE");
    expect(calls[1]).toBe("SET LOCAL statement_timeout='5s'; SET LOCAL lock_timeout='5s'; SET LOCAL idle_in_transaction_session_timeout='5s'");
  });
});
