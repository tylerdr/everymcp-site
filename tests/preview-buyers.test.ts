import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import type { Ledger } from "../lib/recovery/entitlements";
import { receiptId } from "../lib/recovery/entitlements";
import { ownerKey } from "../lib/recovery/owner";
import { buyerCookie } from "../lib/buyer/session";

const doubles = vi.hoisted(() => ({
  send: vi.fn(), verify: vi.fn(), user: vi.fn(), checkout: vi.fn(), paid: vi.fn(),
  transaction: vi.fn(), ready: vi.fn()
}));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ auth: {
  signInWithOtp: doubles.send, verifyOtp: doubles.verify
} }) }));
vi.mock("pg", () => ({ Pool: class {} }));
vi.mock("../lib/recovery/postgres-store", () => ({ PostgresStore: class {
  transaction = doubles.transaction;
  checkReadiness = doubles.ready;
} }));
vi.mock("../lib/stripe-config", () => ({
  getStripeConfiguration: () => ({ accountId: "acct_1Re4ltEQ7c58oLZ4", mode: "test",
    client: { checkout: { sessions: { create: doubles.checkout } } } }),
  verifyStripeAccount: async () => "valid", isTransientStripeError: () => false
}));
vi.mock("../lib/stripe-fulfillment", () => ({ verifyPaidSession: doubles.paid }));

const a = "buyer-a@example.invalid", b = "buyer-b@example.invalid", outsider = "unrelated@example.invalid";
const origin = "https://everymcp-review.vercel.app", project = "wcacimdgzcdehcbtjkbk";
const scope = { accountId: "acct_1Re4ltEQ7c58oLZ4", mode: "test" as const };
const token = "synthetic_verified_access_token", userId = "00000000-0000-0000-0000-000000000001";
const owner = ownerKey(scope, project, userId);
const sessionId = "cs_test_synthetic_owned", id = receiptId(scope, sessionId);
const packet = "# EveryMCP MCP Integration Starter Kit\n" + Array.from({ length: 7 }, (_, i) => `\n## ${i + 1}. Synthetic section\nExample only.\n`).join("") + "\n## What this paid packet includes\nSynthetic fixture.";
const packetSha256 = createHash("sha256").update(packet).digest("hex");
let ledger: Ledger;
const request = (path: string, data?: unknown, headers: Record<string, string> = {}) => new Request(origin + path, {
  ...(data === undefined ? {} : { method: "POST", body: JSON.stringify(data) }),
  headers: { Origin: origin, "Content-Type": "application/json", ...headers }
});
async function routes() {
  const [send, verify, session, checkout, recovery, download] = await Promise.all([
    import("../app/api/buyer/request-code/route"), import("../app/api/buyer/verify-code/route"),
    import("../app/api/buyer/session/route"), import("../app/api/checkout/route"),
    import("../app/api/fulfillment/recovery/route"), import("../app/api/fulfillment/starter-kit/route")
  ]);
  return { send: send.POST, verify: verify.POST, session: session.GET, checkout: checkout.POST,
    recovery: recovery.GET, download: download.GET };
}
function currentUser(email: string) {
  doubles.user.mockImplementation(async () => Response.json({ id: userId, email,
    email_confirmed_at: "2026-01-01T00:00:00Z", is_anonymous: false }));
}
async function publicReply(response: Response) {
  return { status: response.status, headers: Object.fromEntries(response.headers), body: await response.text() };
}
beforeEach(() => {
  vi.resetModules(); vi.resetAllMocks();
  const env = { VERCEL_ENV: "preview", VERCEL_URL: "everymcp-review.vercel.app", NEXT_PUBLIC_SITE_URL: origin,
    EVERYMCP_PREVIEW_RECOVERY: "named-sandbox-v1", STRIPE_MODE: "test", STRIPE_ACCOUNT_ID: scope.accountId,
    EVERYMCP_AUTH_PROJECT: project, EVERYMCP_AUTH_PUBLISHABLE_KEY: "sb_publishable_synthetic",
    EVERYMCP_RECEIPT_DATABASE_ENDPOINT: "aws-0-review-only.pooler.supabase.com:6543",
    EVERYMCP_RECEIPT_DATABASE_URL: `postgresql://everymcp_receipt_server.${project}:synthetic@aws-0-review-only.pooler.supabase.com:6543/postgres`,
    EVERYMCP_STRIPE_WEBHOOK_SECRET: "whsec_synthetic", EVERYMCP_PREVIEW_BUYER_EMAILS: `${a},${b}` };
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  vi.stubEnv("EVERYMCP_RECEIPT_DATABASE_CA_CERT", undefined);
  vi.stubGlobal("fetch", doubles.user); currentUser(a);
  doubles.send.mockResolvedValue({ error: null });
  doubles.verify.mockResolvedValue({ error: null, data: { session: { access_token: token,
    expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600 } } });
  doubles.checkout.mockResolvedValue({ url: "https://checkout.example.invalid/synthetic" });
  doubles.ready.mockResolvedValue(true);
  ledger = { events: {}, receipts: { [id]: { id, sessionId, scope, ownerKey: owner, packet, packetSha256 } } };
  doubles.transaction.mockImplementation(async (change: (value: Ledger) => unknown) => change(ledger));
  doubles.paid.mockResolvedValue({ status: "paid", session: { id: sessionId, livemode: false,
    metadata: { fulfillment_owner: owner, fulfillment_auth_project: project, pricing_policy: "usd4900-no-discount-v1" } } });
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("controlled Preview buyer routes, fictional identities and provider doubles only", () => {
  it.each([a, b])("allows exact tester %s and preserves confirmation/recovery intent", async (email) => {
    const route = await routes(); currentUser(email);
    const sent = await route.send(request("/api/buyer/request-code", { email }));
    expect(sent.status).toBe(200);
    expect(doubles.send).toHaveBeenCalledExactlyOnceWith({ email, options: { shouldCreateUser: true } });
    const verified = await route.verify(request("/api/buyer/verify-code", { email, code: "123456", returnTo: "/buyer/purchases?receipt=" + id }));
    expect(verified.status).toBe(200);
    expect(await verified.json()).toEqual({ returnTo: "/buyer/purchases?receipt=" + id });
    expect(verified.headers.get("set-cookie")).toBe(`${buyerCookie}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=900`);
    expect(doubles.verify).toHaveBeenCalledExactlyOnceWith({ email, token: "123456", type: "email" });
    const headers = { Cookie: `${buyerCookie}=${token}` };
    expect((await route.session(request("/api/buyer/session", undefined, headers))).status).toBe(200);
    expect(await (await route.recovery(request("/api/fulfillment/recovery", undefined, headers))).json()).toEqual({ receipts: [{ id, packetSha256 }] });
    const recovered = await route.recovery(request("/api/fulfillment/recovery?receipt=" + id, undefined, headers));
    expect(recovered.status).toBe(200); expect(await recovered.text()).toBe(packet);
  });
  it("normalizes case and surrounding whitespace, without alias or domain expansion", async () => {
    vi.stubEnv("EVERYMCP_PREVIEW_BUYER_EMAILS", `  BUYER-A@EXAMPLE.INVALID , ${b.toUpperCase()}  `);
    currentUser(" BUYER-A@EXAMPLE.INVALID "); const route = await routes();
    expect((await route.send(request("/api/buyer/request-code", { email: " Buyer-A@Example.Invalid " }))).status).toBe(200);
    expect(doubles.send).toHaveBeenCalledExactlyOnceWith({ email: a, options: { shouldCreateUser: true } });
    expect((await route.verify(request("/api/buyer/verify-code", { email: " Buyer-A@Example.Invalid ", code: "123456" }))).status).toBe(200);
    expect(doubles.verify).toHaveBeenCalledExactlyOnceWith({ email: a, token: "123456", type: "email" });
    doubles.send.mockClear();
    for (const email of ["buyer-a+other@example.invalid", "buyer.a@example.invalid", "other@example.invalid", "buyer-a@example.invalid.attacker.invalid"]) {
      expect((await route.send(request("/api/buyer/request-code", { email }))).status).toBe(200);
    }
    expect(doubles.send).not.toHaveBeenCalled();
  });
  it.each([undefined, "", a, `${a},${b},${outsider}`, `${a}, ${a.toUpperCase()}`, `${a},invalid`, `${a},${b},`])("fails closed for absent/invalid actor configuration %s", async (configured) => {
    vi.stubEnv("EVERYMCP_PREVIEW_BUYER_EMAILS", configured); const route = await routes();
    const response = await route.send(request("/api/buyer/request-code", { email: a }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: "If email delivery is available, check your inbox for the confirmation code." });
    expect((await route.verify(request("/api/buyer/verify-code", { email: a, code: "123456" }))).status).toBe(401);
    expect((await route.session(request("/api/buyer/session", undefined, { Authorization: "Bearer " + token }))).status).toBe(401);
    expect(doubles.send).not.toHaveBeenCalled(); expect(doubles.verify).not.toHaveBeenCalled();
  });
  it("returns byte-identical generic public replies for eligible and ineligible valid emails", async () => {
    const route = await routes();
    const allowed = await publicReply(await route.send(request("/api/buyer/request-code", { email: a })));
    doubles.send.mockClear();
    const denied = await publicReply(await route.send(request("/api/buyer/request-code", { email: outsider })));
    expect(denied).toEqual(allowed); expect(doubles.send).not.toHaveBeenCalled();
    const response = await route.verify(request("/api/buyer/verify-code", { email: outsider, code: "123456" }));
    expect(response.status).toBe(401); expect(response.headers.has("set-cookie")).toBe(false);
    expect(doubles.verify).not.toHaveBeenCalled(); expect(doubles.user).not.toHaveBeenCalled();
  });
  it.each(["success", "rejection", "exception"])("hides sandbox OTP provider %s in the generic reply", async (outcome) => {
    const route = await routes();
    if (outcome === "rejection") doubles.send.mockResolvedValue({ error: { status: 429 } });
    if (outcome === "exception") doubles.send.mockRejectedValue(new Error("synthetic provider outage"));
    const denied = await publicReply(await route.send(request("/api/buyer/request-code", { email: outsider })));
    expect(doubles.send).not.toHaveBeenCalled();
    const allowed = await publicReply(await route.send(request("/api/buyer/request-code", { email: a })));
    expect(allowed).toEqual(denied); expect(allowed.status).toBe(200);
    expect(allowed.body).toBe(JSON.stringify({ message: "If email delivery is available, check your inbox for the confirmation code." }));
    expect(doubles.send).toHaveBeenCalledExactlyOnceWith({ email: a, options: { shouldCreateUser: true } });
    expect(doubles.verify).not.toHaveBeenCalled(); expect(doubles.user).not.toHaveBeenCalled();
    doubles.verify.mockResolvedValue({ error: { status: 403, code: "otp_expired" } });
    const failed = await route.verify(request("/api/buyer/verify-code", { email: a, code: "123456" }));
    expect(failed.status).toBe(401); expect(failed.headers.has("set-cookie")).toBe(false);
    expect(doubles.user).not.toHaveBeenCalled();
  });
  it.each(["rejection", "exception"])("retains non-sandbox OTP provider %s errors", async (outcome) => {
    const { createBuyerAuth } = await import("../lib/buyer/auth");
    const send = vi.fn(async () => { if (outcome === "exception") throw new Error("synthetic outage"); return false; });
    const auth = createBuyerAuth({ requestCode: send, verifyCode: vi.fn(), authenticate: vi.fn() });
    const response = await auth.requestCode(request("/api/buyer/request-code", { email: a }));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Email verification is unavailable. Retry later." });
    expect(send).toHaveBeenCalledExactlyOnceWith(a);
  });
  it.each(["cookie", "bearer"])("denies unrelated preauthenticated %s across all owner routes", async (transport) => {
    currentUser(outsider); const route = await routes();
    const headers: Record<string, string> = transport === "cookie" ? { Cookie: `${buyerCookie}=${token}` } : { Authorization: "Bearer " + token };
    const paths = [
      [route.session, "/api/buyer/session"], [route.recovery, "/api/fulfillment/recovery"],
      [route.recovery, "/api/fulfillment/recovery?receipt=" + id],
      [route.download, "/api/fulfillment/starter-kit?session_id=" + sessionId]
    ] as const;
    for (const [handler, path] of paths) expect((await handler(request(path, undefined, headers))).status).toBe(401);
    expect((await route.checkout(request("/api/checkout", { plan: "starter" }, { ...headers, "Idempotency-Key": "synthetic_attempt_123456" }))).status).toBe(401);
    expect(doubles.checkout).not.toHaveBeenCalled(); expect(doubles.send).not.toHaveBeenCalled();
  });
  it("rejects a different authoritative user after an eligible code submission", async () => {
    currentUser(outsider); const route = await routes();
    const response = await route.verify(request("/api/buyer/verify-code", { email: a, code: "123456" }));
    expect(response.status).toBe(401); expect(response.headers.has("set-cookie")).toBe(false);
    expect(doubles.verify).toHaveBeenCalledOnce();
  });
  it("does not retain removed eligibility in a cached binding", async () => {
    const route = await routes(), input = () => request("/api/buyer/session", undefined, { Authorization: "Bearer " + token });
    expect((await route.session(input())).status).toBe(200);
    vi.stubEnv("EVERYMCP_PREVIEW_BUYER_EMAILS", undefined);
    expect((await route.session(input())).status).toBe(401);
    await route.send(request("/api/buyer/request-code", { email: a }));
    expect(doubles.send).not.toHaveBeenCalled();
  });
  it("retains eligible checkout, cross-owner denial and legacy ownerless delivery", async () => {
    const route = await routes(), headers = { Authorization: "Bearer " + token };
    expect((await route.checkout(request("/api/checkout", { plan: "starter" }, { ...headers, "Idempotency-Key": "synthetic_attempt_123456" }))).status).toBe(200);
    expect(doubles.checkout).toHaveBeenCalledOnce();
    ledger.receipts[id].ownerKey = "b".repeat(64);
    expect((await route.recovery(request("/api/fulfillment/recovery?receipt=" + id, undefined, headers))).status).toBe(404);
    doubles.paid.mockResolvedValue({ status: "paid", session: { id: sessionId, livemode: false, metadata: { fulfillment_owner: "b".repeat(64) } } });
    expect((await route.download(request("/api/fulfillment/starter-kit?session_id=" + sessionId, undefined, headers))).status).toBe(404);
    vi.stubEnv("EVERYMCP_PREVIEW_BUYER_EMAILS", undefined);
    ledger.receipts[id].ownerKey = "legacy:" + createHash("sha256").update(JSON.stringify([scope, sessionId])).digest("hex");
    doubles.paid.mockResolvedValue({ status: "paid", session: { id: sessionId, livemode: false, metadata: {} } });
    doubles.user.mockClear();
    const legacy = await route.download(request("/api/fulfillment/starter-kit?session_id=" + sessionId));
    expect(legacy.status).toBe(200); expect(await legacy.text()).toBe(packet); expect(doubles.user).not.toHaveBeenCalled();
  });
  it("retains Origin and opt-in gates before any OTP provider call", async () => {
    const route = await routes();
    expect((await route.send(request("/api/buyer/request-code", { email: a }, { Origin: "https://other.invalid" }))).status).toBe(400);
    for (const [key, value] of [["VERCEL_ENV", "production"], ["EVERYMCP_PREVIEW_RECOVERY", ""], ["STRIPE_MODE", "live"], ["NEXT_PUBLIC_SITE_URL", "https://other.invalid"]]) {
      const original = process.env[key]; vi.stubEnv(key, value);
      expect((await route.send(request("/api/buyer/request-code", { email: a }))).status).toBe(503);
      vi.stubEnv(key, original);
    }
    expect(doubles.send).not.toHaveBeenCalled();
  });
});
