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


const hex = /^[a-f0-9]{64}$/;
const isMap = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
export function assertLedger(ledger: Ledger): void {
  if (!ledger || !isMap(ledger.events) || !isMap(ledger.receipts)) throw new Error("Invalid receipt ledger");
  for (const [key, value] of Object.entries(ledger.events)) {
    if (!hex.test(key) || typeof value !== "string" || !hex.test(value)) throw new Error("Invalid event ledger");
  }
  for (const [key, receipt] of Object.entries(ledger.receipts)) {
    if (!receipt || typeof receipt !== "object" || !receipt.scope || typeof receipt.scope.accountId !== "string" || !receipt.scope.accountId.startsWith("acct_") || !["test", "live"].includes(receipt.scope.mode) || typeof receipt.sessionId !== "string" || !receipt.sessionId || typeof receipt.ownerKey !== "string" || !receipt.ownerKey || typeof receipt.packet !== "string" || !validPacket(receipt.packet) || !hex.test(receipt.packetSha256) || sha(receipt.packet) !== receipt.packetSha256 || key !== receipt.id || receipt.id !== receiptId(receipt.scope, receipt.sessionId)) throw new Error("Receipt integrity failure");
  }
}
function validPacket(packet: string) {
  return packet.startsWith("# EveryMCP MCP Integration Starter Kit\n") && Array.from(packet.matchAll(/^## ([1-7])\. .+$/gm), (match) => match[1]).join("") === "1234567" && packet.includes("\n## What this paid packet includes\n") && Buffer.byteLength(packet) <= 1_000_000;
}

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
  if (typeof purchase.paid !== "boolean" || (purchase.paid && (typeof purchase.ownerKey !== "string" || !purchase.ownerKey || typeof purchase.packet !== "string" || !validPacket(purchase.packet)))) throw new Error("Invalid verified purchase");
  return store.transaction((ledger) => {
    assertLedger(ledger);
    const id = receiptId(configured, purchase.sessionId);
    const existing = ledger.receipts[id];
    if (existing && (!sameScope(existing.scope, configured) || existing.ownerKey !== purchase.ownerKey)) throw new Error("Receipt owner conflict");
    const eventKey = receiptId(configured, notice.id);
    if (ledger.events[eventKey]) {
      if (ledger.events[eventKey] !== notice.payloadSha256) throw new Error("Conflicting duplicate event");
      return "duplicate" as const;
    }
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
    assertLedger(ledger);
    const receipt = ledger.receipts[id];
    if (!receipt || !sameScope(receipt.scope, scope) || receipt.ownerKey !== ownerKey) return null;
    if (sha(receipt.packet) !== receipt.packetSha256) throw new Error("Receipt integrity failure");
    return receipt.packet;
  });
}
