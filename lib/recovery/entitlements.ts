import { createHash } from "node:crypto";

export type Scope = { accountId: string; mode: "test" | "live" };
export type VerifiedPurchase = { sessionId: string; scope: Scope; ownerKey: string; paid: boolean; packet: string };
export type Receipt = { id: string; sessionId: string; scope: Scope; ownerKey: string; packet: string; packetSha256: string };
export type Ledger = { events: Record<string, string>; receipts: Record<string, Receipt> };
// Production adapter must provide a SERIALIZABLE transaction with durable commit.
export interface EntitlementStore {
  transaction<T>(change: (ledger: Ledger) => T): Promise<T>;
}
export type PaymentNotice = { id: string; type: string; sessionId: string; scope: Scope; payloadSha256: string };
const acceptedEvents = new Set(["checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.async_payment_failed"]);
const sha = (value: string) => createHash("sha256").update(value).digest("hex");
export const receiptId = (scope: Scope, session: string) => sha(JSON.stringify([scope.accountId, scope.mode, session]));
export function sameScope(a: Scope, b: Scope) { return a.accountId === b.accountId && a.mode === b.mode; }

export async function recordPayment(
  store: EntitlementStore, configured: Scope, notice: PaymentNotice,
  verifyPurchase: (session: string, scope: Scope) => Promise<VerifiedPurchase>
) {
  if (!sameScope(configured, notice.scope)) throw new Error("Payment scope mismatch");
  if (!acceptedEvents.has(notice.type)) return "ignored" as const;
  if (!notice.id || !notice.sessionId || !/^[a-f0-9]{64}$/.test(notice.payloadSha256)) throw new Error("Invalid payment notice");
  // Retrieve current authoritative entitlement, not event-order/payload metadata.
  // Failure propagates before commit, allowing Stripe's retry to process the event.
  const purchase = await verifyPurchase(notice.sessionId, configured);
  if (!sameScope(configured, purchase.scope) || purchase.sessionId !== notice.sessionId) throw new Error("Purchase scope mismatch");
  if (purchase.paid && (!purchase.ownerKey || (!purchase.packet.startsWith("# EveryMCP MCP Integration Starter Kit\n") || Array.from(purchase.packet.matchAll(/^## ([1-7])\. .+$/gm), (match) => match[1]).join("") !== "1234567" || !purchase.packet.includes("\n## What this paid packet includes\n")) || Buffer.byteLength(purchase.packet) > 1_000_000)) throw new Error("Invalid verified purchase");
  return store.transaction((ledger) => {
    const eventKey = receiptId(configured, notice.id);
    if (ledger.events[eventKey]) {
      if (ledger.events[eventKey] !== notice.payloadSha256) throw new Error("Conflicting duplicate event");
      return "duplicate" as const;
    }
    const id = receiptId(configured, purchase.sessionId);
    const existing = ledger.receipts[id];
    if (existing && (!sameScope(existing.scope, configured) || existing.ownerKey !== purchase.ownerKey)) throw new Error("Receipt owner conflict");
    // A later pending/failure notification cannot revoke an already paid snapshot.
    if (purchase.paid && !existing) ledger.receipts[id] = {
      id, sessionId: purchase.sessionId, scope: { ...configured }, ownerKey: purchase.ownerKey,
      packet: purchase.packet, packetSha256: sha(purchase.packet)
    };
    ledger.events[eventKey] = notice.payloadSha256;
    return purchase.paid || existing ? "recorded" as const : "pending" as const;
  });
}

// ownerKey must originate from a verified server-side identity adapter, never a body/query field.
export async function recoverPacket(store: EntitlementStore, scope: Scope, ownerKey: string, id: string) {
  if (!ownerKey || !/^[a-f0-9]{64}$/.test(id)) return null;
  return store.transaction((ledger) => {
    const receipt = ledger.receipts[id];
    if (!receipt || !sameScope(receipt.scope, scope) || receipt.ownerKey !== ownerKey) return null;
    if (sha(receipt.packet) !== receipt.packetSha256) throw new Error("Receipt integrity failure");
    return receipt.packet;
  });
}
