import { afterEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import { createStarterBinding, getStarterBinding, purchaseReader } from "../lib/recovery/binding";
import { supabaseOwner, ownerKey } from "../lib/recovery/owner";
import { PostgresStore, type SqlClient } from "../lib/recovery/postgres-store";
import { recordPayment, receiptId, type EntitlementStore, type Ledger, type Scope } from "../lib/recovery/entitlements";
import { createHash } from "node:crypto";
import { buildStarterKit } from "../lib/starter-kit";
const scope: Scope = { accountId: "acct_synthetic", mode: "test" };
const project = "abcdefghijklmnopqrst";
const principal = { scope, ownerKey: ownerKey(scope, project, "00000000-0000-0000-0000-000000000001"), email: "synthetic@example.invalid" };
const packet = buildStarterKit();
function memory() {
  let data: Ledger = { events: {}, receipts: {} };
  const store: EntitlementStore = { async transaction<T>(change: (l: Ledger) => T) {
    const next = structuredClone(data); const result = change(next); data = next; return result;
  } };
  return store;
}
function dependencies() {
  return { scope, authProject: project, store: memory(), authenticate: vi.fn(async () => principal), verifyPurchase: vi.fn(async (id: string) => ({ sessionId: id, scope, ownerKey: principal.ownerKey, paid: true, packet })), verifyAccount: vi.fn(async () => true), verifyNotice: vi.fn(() => { throw new Error("Synthetic unused signature verifier"); }) };
}
afterEach(() => vi.unstubAllEnvs());
describe("canonical production binding, synthetic only", () => {
  it("source gate refuses activation with environment configuration alone", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_synthetic"); vi.stubEnv("EVERYMCP_RECOVERY_ENABLED", "true");
    expect(getStarterBinding()).toBeNull();
  });
  it.each(["store", "authenticate", "verifyPurchase", "verifyAccount", "verifyNotice"] as const)("missing %s binding prevents checkout readiness", async (key) => {
    const d = dependencies(); const broken = { ...d, [key]: undefined } as unknown as Parameters<typeof createStarterBinding>[0];
    const b = createStarterBinding(broken);
    expect(await b.ready()).toBe(false); expect(await b.checkoutPrincipal(new Request("https://example.invalid"))).toBeNull();
  });
  it("account mismatch, unavailable store and unverified/wrong-scoped owner all deny charge readiness", async () => {
    const d = dependencies(); d.verifyAccount.mockResolvedValue(false);
    expect(await createStarterBinding(d).ready()).toBe(false);
    d.verifyAccount.mockResolvedValue(true); d.store = { transaction: async () => { throw new Error("no INSERT privilege"); } };
    expect(await createStarterBinding(d).ready()).toBe(false);
    d.store = memory(); d.authenticate.mockResolvedValue({ ...principal, scope: { ...scope, mode: "live" } });
    expect(await createStarterBinding(d).checkoutPrincipal(new Request("https://example.invalid"))).toBeNull();
    d.authenticate.mockRejectedValue(new Error("invalid token"));
    expect(await createStarterBinding(d).checkoutPrincipal(new Request("https://example.invalid"))).toBeNull();
  });
  it("return and webhook share an immutable first snapshot; subsequent catalog builder is never called", async () => {
    const store = memory(); const id = "cs_test_synthetic";
    const session = { id, livemode: false, metadata: { fulfillment_owner: principal.ownerKey, fulfillment_auth_project: project, pricing_policy: "usd4900-no-discount-v1" } } as unknown as Stripe.Checkout.Session;
    const verify = vi.fn(async () => ({ status: "paid" as const, session }));
    const builder = vi.fn(() => packet);
    const reader = purchaseReader(scope, project, verify, builder, store);
    const b = createStarterBinding({ ...dependencies(), store, verifyPurchase: reader });
    expect(await b.packet(id)).toBe(packet); expect(builder).toHaveBeenCalledTimes(1);
    builder.mockImplementation(() => { throw new Error("catalog changed"); });
    expect(await b.packet(id)).toBe(packet);
    const purchase = await reader(id, scope);
    await recordPayment(store, scope, { id: "evt_synthetic", type: "checkout.session.completed", sessionId: id, scope, payloadSha256: createHash("sha256").update("event").digest("hex") }, async () => purchase);
    expect(await b.packet(id)).toBe(packet); expect(builder).toHaveBeenCalledTimes(1);
    expect(await store.transaction((l) => Object.keys(l.receipts))).toEqual([receiptId(scope,id)]);
  });
  it("purchase reader refuses mismatched session owner/project/mode and unavailable verification", async () => {
    const session = { id: "cs_test_synthetic", livemode: false, metadata: { fulfillment_owner: principal.ownerKey, fulfillment_auth_project: "wrong", pricing_policy: "usd4900-no-discount-v1" } } as unknown as Stripe.Checkout.Session;
    await expect(purchaseReader(scope,project, async () => ({ status: "paid", session }))(session.id,scope)).rejects.toThrow("Owner metadata");
    await expect(purchaseReader(scope,project, async () => ({ status: "unavailable" }))(session.id,scope)).rejects.toThrow("unavailable");
    session.metadata = {}; session.livemode = true;
    await expect(purchaseReader(scope,project, async () => ({ status: "paid", session }))(session.id,scope)).rejects.toThrow("identity");
  });
});
describe("authoritative current-user ownership", () => {
  const request = () => new Request("https://example.invalid?owner=attacker", { headers: { Authorization: "Bearer synthetic_authorized_token" } });
  const user = { id: "00000000-0000-0000-0000-000000000001", email: principal.email, email_confirmed_at: "2026-10-11T00:00:00Z", is_anonymous: false };
  it("uses only the bearer owner's verified current user at the fixed project; no admin or mail API", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => Response.json(user));
    expect(await supabaseOwner(scope,project,"sb_publishable_synthetic",fetcher)(request())).toEqual(principal);
    expect(fetcher.mock.calls[0][0]).toBe(`https://${project}.supabase.co/auth/v1/user`);
    expect(fetcher.mock.calls[0][1]).toMatchObject({ redirect: "error", cache: "no-store", headers: { Authorization: "Bearer synthetic_authorized_token", apikey: "sb_publishable_synthetic" } });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it.each([{ ...user,email_confirmed_at: null }, { ...user,is_anonymous: true }, { ...user,id: "spoofed" }])("denies unconfirmed, anonymous or malformed principals", async (payload) => {
    expect(await supabaseOwner(scope,project,"sb_publishable_synthetic",async () => Response.json(payload))(request())).toBeNull();
  });
  it("denies expired tokens, absent tokens and oversized API responses", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response("expired", {status:401}));
    const authenticate = supabaseOwner(scope,project,"sb_publishable_synthetic",fetcher);
    expect(await authenticate(request())).toBeNull(); expect(await authenticate(new Request("https://example.invalid"))).toBeNull(); expect(fetcher).toHaveBeenCalledTimes(1);
    await expect(supabaseOwner(scope,project,"sb_publishable_synthetic",async () => new Response("x".repeat(64001)))(request())).rejects.toThrow("large");
    expect(() => supabaseOwner(scope,project,"service_role_synthetic")).toThrow();
  });
});
describe("durable PostgreSQL transaction adapter without a database", () => {
  function fake(fail?: string, permissions = true) {
    const calls: { sql: string; values?: unknown[] }[] = [];
    let failures = fail ? 1 : 0;
    const release = vi.fn();
    const client: SqlClient = { async query<Row>(sql: string, values?: unknown[]) {
      calls.push({ sql, values });
      if (sql === "COMMIT" && failures-- > 0) throw Object.assign(new Error("synthetic commit failure"), { code: fail });
      return { rows: (sql.includes("AS ready") ? [{ ready: permissions }] : []) as Row[] };
    }, release };
    const connect = vi.fn(async () => client);
    return { calls, release, connect, store: new PostgresStore({connect}, scope) };
  }
  it("serializes scoped parameterized writes and commits immutable event IDs", async () => {
    const f = fake(); const key = "a".repeat(64); const hash = "b".repeat(64);
    await f.store.transaction((l) => { l.events[key] = hash; });
    expect(f.calls[0].sql).toBe("BEGIN ISOLATION LEVEL SERIALIZABLE");
    expect(f.calls.find((c) => c.sql.startsWith("INSERT"))?.values).toEqual([scope.accountId,scope.mode,key,hash]);
    for (const c of f.calls.filter((c) => c.sql.includes("WHERE account_id"))) expect(c.values).toEqual([scope.accountId,scope.mode]);
    expect(f.calls.at(-1)?.sql).toBe("COMMIT"); expect(f.release).toHaveBeenCalledOnce();
  });
  it.each(["40001","40P01","23505"])("retries a %s commit failure, with rollback and release", async (code) => {
    const f = fake(code); await f.store.transaction(() => true);
    expect(f.connect).toHaveBeenCalledTimes(2); expect(f.calls.some((c) => c.sql === "ROLLBACK")).toBe(true); expect(f.release).toHaveBeenCalledTimes(2);
  });
  it("missing insert/isolation permissions blocks readiness and nonretryable commit failure refuses acknowledgement", async () => {
    const denied = fake(undefined,false); await expect(denied.store.transaction(() => true)).rejects.toThrow("permissions");
    expect(denied.calls.some((c) => c.sql.startsWith("INSERT"))).toBe(false);
    const f = fake("08006"); await expect(f.store.transaction(() => true)).rejects.toThrow("commit failure"); expect(f.connect).toHaveBeenCalledOnce();
  });
});
