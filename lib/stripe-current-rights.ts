import type Stripe from "stripe";

export type CashEntry = { id: string; created: number; kind: "collection" | "refund" | "dispute"; productCents: number };
export type CurrentRights = { allowed: boolean; reason: "paid" | "partial-refund" | "refunded" | "disputed"; collectedCents: number; refundedCents: number; taxCents: number; netProductCents: number; entries: CashEntry[]; test: boolean };
const id = (value: string | { id: string } | null) => typeof value === "string" ? value : value?.id;
const integer = (n: unknown): n is number => Number.isSafeInteger(n) && Number(n) >= 0;

// Fresh provider reads on EVERY delivery; no event payload or cached receipt grants rights.
// Partial goodwill refunds retain the complete packet; full refunds revoke future access.
export async function readCurrentRights(client: Stripe, session: Stripe.Checkout.Session): Promise<CurrentRights> {
  const piId = id(session.payment_intent);
  if (!piId || !integer(session.amount_total) || !session.amount_total) throw new Error("Missing payment provenance");
  const pi = await client.paymentIntents.retrieve(piId);
  const chargeId = id(pi.latest_charge);
  if (pi.id !== piId || pi.status !== "succeeded" || pi.livemode !== session.livemode || !chargeId) throw new Error("Payment identity mismatch");
  const charge = await client.charges.retrieve(chargeId);
  const total = session.amount_total;
  const tax = session.total_details?.amount_tax ?? 0;
  if (charge.id !== chargeId || id(charge.payment_intent) !== piId || charge.livemode !== session.livemode || charge.currency !== session.currency || charge.status !== "succeeded" || !charge.paid || !charge.captured || charge.amount !== total || charge.amount_captured !== total || !integer(charge.amount_refunded) || charge.amount_refunded > total || !integer(tax) || tax > total) throw new Error("Charge identity mismatch");
  // Full pagination with a hard bound: exceeding it is unknown, never a partial pass.
  const refunds: Stripe.Refund[] = [];
  let cursor: string | undefined;
  for (let page = 0; ; page++) {
    if (page === 10) throw new Error("Refund page limit");
    const list = await client.refunds.list({ charge: chargeId, limit: 100, ...(cursor ? { starting_after: cursor } : {}) });
    refunds.push(...list.data);
    if (!list.has_more) break;
    cursor = list.data.at(-1)?.id;
    if (!cursor) throw new Error("Invalid refund page");
  }
  const seen = new Set<string>();
  let refunded = 0;
  const succeeded: Stripe.Refund[] = [];
  for (const refund of refunds) {
    if (seen.has(refund.id) || id(refund.charge) !== chargeId || refund.currency !== charge.currency || !integer(refund.amount)) throw new Error("Refund identity mismatch");
    seen.add(refund.id);
    if (refund.status === "succeeded") { refunded += refund.amount; succeeded.push(refund); }
    else if (!["failed", "canceled", "pending", "requires_action"].includes(refund.status || "")) throw new Error("Unknown refund status");
  }
  // Charge's cumulative value can include pending refunds. Refuse ambiguous snapshots
  // rather than reporting uncollected cash or granting access during inconsistent reads.
  if (refunded !== charge.amount_refunded) throw new Error("Refund reconciliation pending");
  const disputes = await client.disputes.list({ charge: chargeId, limit: 100 });
  if (disputes.has_more || disputes.data.some(d => id(d.charge) !== chargeId || d.livemode !== session.livemode || d.currency !== charge.currency)) throw new Error("Dispute identity mismatch");
  const blocked = disputes.data.some(d => !["won", "warning_closed"].includes(d.status));
  if (charge.disputed && disputes.data.length === 0) throw new Error("Missing dispute provenance");
  const product = total - tax;
  const productPart = (amount: number) => Math.round(amount * product / total);
  const entries: CashEntry[] = [];
  async function entry(btId: string | { id: string } | null, kind: CashEntry["kind"], amount: number) {
    const key = id(btId);
    if (!key) throw new Error("Missing cash provenance");
    const bt = await client.balanceTransactions.retrieve(key);
    if (bt.id !== key || bt.currency !== charge.currency || bt.amount !== amount || !integer(bt.created)) throw new Error("Cash provenance mismatch");
    entries.push({ id: key, created: bt.created, kind, productCents: Math.sign(amount) * productPart(Math.abs(amount)) });
  }
  await entry(charge.balance_transaction, "collection", total);
  // Cumulative allocation avoids rounding drift across many partial refunds.
  let cumulative = 0;
  for (const refund of succeeded.sort((a,b) => a.created - b.created || a.id.localeCompare(b.id))) {
    const before = productPart(cumulative); cumulative += refund.amount;
    await entry(refund.balance_transaction, "refund", -refund.amount);
    entries[entries.length - 1].productCents = -(productPart(cumulative) - before);
  }
  for (const dispute of disputes.data) for (const bt of dispute.balance_transactions) await entry(bt, "dispute", bt.amount);
  if (new Set(entries.map(e => e.id)).size !== entries.length) throw new Error("Duplicate cash provenance");
  return { allowed: !blocked && refunded < total, reason: blocked ? "disputed" : refunded === total ? "refunded" : refunded ? "partial-refund" : "paid", collectedCents: total, refundedCents: refunded, taxCents: tax, netProductCents: product - productPart(refunded), entries, test: !session.livemode };
}

// Account/product verification is performed by verifyPaidSession before this is called.
// Exclusive upper UTC bound permits exact America/Los_Angeles month boundaries.
export function reconcileProductCash(rows: { sessionId: string; rights: CurrentRights }[], start: number, end: number) {
  if (!integer(start) || !integer(end) || end <= start) throw new Error("Invalid cash window");
  const entries = new Map<string, CashEntry>();
  const sessions = new Set<string>();
  for (const row of rows) {
    if (sessions.has(row.sessionId)) throw new Error("Duplicate session");
    sessions.add(row.sessionId);
    if (row.rights.test) continue;
    for (const event of row.rights.entries) {
      const prior = entries.get(event.id);
      if (prior && JSON.stringify(prior) !== JSON.stringify(event)) throw new Error("Conflicting cash entry");
      entries.set(event.id, event);
    }
  }
  const values = [...entries.values()].filter(e => e.created >= start && e.created < end);
  const sum = (kind: CashEntry["kind"]) => values.filter(e => e.kind === kind).reduce((n,e) => n + e.productCents, 0);
  return { taxAllocation: "proportional-approximation" as const, finalTaxReconciliationRequired: rows.some(({rights}) => !rights.test && rights.taxCents > 0 && (rights.refundedCents > 0 || rights.entries.some(e => e.kind === "dispute"))), collectionCents: sum("collection"), refundCents: Math.abs(sum("refund")), netRefundCents: sum("collection") + sum("refund"), disputeAdjustmentCents: sum("dispute"), cashAfterDisputesCents: values.reduce((n,e) => n+e.productCents,0), mrrCents: 0, coverage: "provided-verified-sessions-only" as const };
}
