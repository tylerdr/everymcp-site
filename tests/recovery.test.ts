import Stripe from "stripe";
import { stripeNoticeVerifier } from "../lib/recovery/stripe-notice";
import { mkdtemp, rm, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { LocalFileStore } from "../lib/recovery/local-file-store";
import { recordPayment, recoverPacket, receiptId, type PaymentNotice, type VerifiedPurchase } from "../lib/recovery/entitlements";
import { createRecoveryHandlers } from "../lib/recovery/handlers";
import { GET } from "../app/api/fulfillment/recovery/route";
import { POST } from "../app/api/stripe/webhook/route";
const scope = { accountId: "acct_synthetic", mode: "test" as const };
const packet = "# EveryMCP MCP Integration Starter Kit\n" + Array.from({ length: 7 }, (_, i) => `\n## ${i + 1}. Synthetic section\nfixture content\n`).join("") + "\n## What this paid packet includes\nSynthetic immutable paid snapshot";
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const notice = (id = "evt_1", type = "checkout.session.completed"): PaymentNotice => ({ id, type, sessionId: "cs_test_synthetic", scope, payloadSha256: sha(id) });
const purchase = (paid = true): VerifiedPurchase => ({ sessionId: notice().sessionId, scope, ownerKey: "verified-owner-a", paid, packet });
const dirs: string[] = [];
async function fixture() { const dir = await mkdtemp(join(tmpdir(), "everymcp-recovery-")); dirs.push(dir); return { dir, store: new LocalFileStore(dir) }; }
afterEach(async () => { await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true }))); });

describe("disabled durable entitlement proof", () => {
  it("persists concurrent duplicates exactly once across independent store instances and restart", async () => {
    const { dir } = await fixture();
    const results = await Promise.all(Array.from({ length: 12 }, () => recordPayment(new LocalFileStore(dir), scope, notice(), async () => purchase())));
    expect(results.filter((r) => r === "recorded")).toHaveLength(1);
    expect(results.filter((r) => r === "duplicate")).toHaveLength(11);
    expect(await recoverPacket(new LocalFileStore(dir), scope, purchase().ownerKey, receiptId(scope, notice().sessionId))).toBe(packet);
  });
  it("preserves paid snapshot across out-of-order failure and changed packet", async () => {
    const { store } = await fixture();
    await recordPayment(store, scope, notice("pending"), async () => purchase(false));
    await recordPayment(store, scope, notice("paid", "checkout.session.async_payment_succeeded"), async () => purchase());
    await recordPayment(store, scope, notice("late-failure", "checkout.session.async_payment_failed"), async () => purchase(false));
    await recordPayment(store, scope, notice("later"), async () => ({ ...purchase(), packet: packet + " updated" }));
    expect(await recoverPacket(store, scope, purchase().ownerKey, receiptId(scope, notice().sessionId))).toBe(packet);
  });
  it("retries failed authoritative verification without marking event processed", async () => {
    const { store } = await fixture();
    await expect(recordPayment(store, scope, notice(), async () => { throw new Error("synthetic unavailable"); })).rejects.toThrow();
    expect(await recordPayment(store, scope, notice(), async () => purchase())).toBe("recorded");
  });
  it("rolls back thrown transactions and rejects conflicting duplicates", async () => {
    const { store } = await fixture();
    await expect(store.transaction((l) => { l.events.failed = "not committed"; throw new Error("failure"); })).rejects.toThrow();
    expect(await store.transaction((l) => l.events.failed)).toBeUndefined();
    await recordPayment(store, scope, notice(), async () => purchase());
    await expect(recordPayment(store, scope, { ...notice(), payloadSha256: sha("different") }, async () => purchase())).rejects.toThrow("Conflicting");
  });
  it("denies cross-owner/account/mode reads and account mismatched notices", async () => {
    const { store } = await fixture();
    await recordPayment(store, scope, notice(), async () => purchase());
    const id = receiptId(scope, notice().sessionId);
    expect(await recoverPacket(store, scope, "other", id)).toBeNull();
    expect(await recoverPacket(store, { ...scope, mode: "live" }, purchase().ownerKey, id)).toBeNull();
    expect(await recoverPacket(store, { ...scope, accountId: "acct_other" }, purchase().ownerKey, id)).toBeNull();
    await expect(recordPayment(store, { ...scope, mode: "live" }, notice(), async () => purchase())).rejects.toThrow("scope");
  });
  it("fails closed on corrupt immutable snapshot", async () => {
    const { store, dir } = await fixture();
    await recordPayment(store, scope, notice(), async () => purchase());
    const ledger = JSON.parse(await readFile(join(dir, "ledger.json"), "utf8"));
    ledger.receipts[receiptId(scope, notice().sessionId)].packet += "tampered";
    await writeFile(join(dir, "ledger.json"), JSON.stringify(ledger));
    await expect(recoverPacket(store, scope, purchase().ownerKey, receiptId(scope, notice().sessionId))).rejects.toThrow("integrity");
  });
  it("recovers a lost return through verified owner listing; ignores query owner spoofing", async () => {
    const { store, dir } = await fixture();
    await recordPayment(store, scope, notice(), async () => purchase());
    const handlers = createRecoveryHandlers({ store: new LocalFileStore(dir), scope, verifyNotice: () => notice(), verifyPurchase: async () => purchase(), authenticate: async () => ({ scope, ownerKey: purchase().ownerKey }) });
    const list = await handlers.recovery(new Request("https://synthetic.local/recovery"));
    const { receipts } = await list.json();
    expect(receipts).toEqual([{ id: receiptId(scope, notice().sessionId), packetSha256: sha(packet) }]);
    const downloaded = await handlers.recovery(new Request("https://synthetic.local/recovery?receipt=" + receipts[0].id));
    expect(await downloaded.text()).toBe(packet);
    const other = createRecoveryHandlers({ store, scope, verifyNotice: () => notice(), verifyPurchase: async () => purchase(), authenticate: async () => ({ scope, ownerKey: "other" }) });
    expect((await other.recovery(new Request("https://synthetic.local/recovery?receipt=" + receipts[0].id + "&ownerKey=verified-owner-a"))).status).toBe(404);
  });
  it("rejects invalid signatures; retries persistence failures; never trusts unsigned body", async () => {
    const { store } = await fixture();
    const raw = "synthetic signed raw event";
    let available = false;
    const handlers = createRecoveryHandlers({ store, scope, authenticate: async () => null, verifyNotice: (body, signature) => { if (signature !== "synthetic-valid" || body !== raw) throw new Error("signature"); return { ...notice(), payloadSha256: sha(body) }; }, verifyPurchase: async () => { if (!available) throw new Error("unavailable"); return purchase(); } });
    const request = (signature: string) => new Request("https://synthetic.local/webhook", { method: "POST", body: raw, headers: { "stripe-signature": signature } });
    expect((await handlers.webhook(request("invalid"))).status).toBe(400);
    expect((await handlers.webhook(request("synthetic-valid"))).status).toBe(503);
    available = true;
    expect((await handlers.webhook(request("synthetic-valid"))).status).toBe(200);
    expect((await handlers.webhook(request("synthetic-valid"))).status).toBe(200);
    expect((await handlers.recovery(new Request("https://synthetic.local/recovery"))).status).toBe(401);
  });
  it("uses real Stripe SDK signature verification with synthetic raw events only", async () => {
    const secret = "whsec_synthetic_local_fixture_only";
    const raw = JSON.stringify({ id: "evt_local", type: "checkout.session.completed", livemode: false, data: { object: { id: "cs_test_synthetic" } } });
    const signature = Stripe.webhooks.generateTestHeaderString({ payload: raw, secret });
    const verify = stripeNoticeVerifier(secret, scope);
    expect(verify(raw, signature).sessionId).toBe("cs_test_synthetic");
    expect(() => verify(raw + " ", signature)).toThrow();
    expect(() => stripeNoticeVerifier(secret, { ...scope, mode: "live" })(raw, signature)).toThrow("scope");
    const crossAccount = JSON.stringify({ id: "evt_local", type: "checkout.session.completed", livemode: false, account: "acct_other", data: { object: { id: "cs_test_synthetic" } } });
    expect(() => verify(crossAccount, Stripe.webhooks.generateTestHeaderString({ payload: crossAccount, secret }))).toThrow("scope");
  });
  it("keeps public handlers unconditionally disabled", async () => { expect((await GET()).status).toBe(503); expect((await POST()).status).toBe(503); });
});
