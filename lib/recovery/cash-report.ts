import { getStripeConfiguration, verifyStripeAccount } from "../stripe-config";
import { verifyPaidSession } from "../stripe-fulfillment";
import { reconcileProductCash } from "../stripe-current-rights";
import { STARTER_KIT_PRODUCT_KEY } from "../products";

// Internal operator API, deliberately no public route. Enumerate all sessions so
// delayed captures and refunds of older purchases are included in the cash window.
// Any provider error/page cap aborts; never emit a misleading partial total.
export async function collectProductCash(start: number, end: number, pageCap = 100) {
  if (!Number.isInteger(pageCap) || pageCap < 1 || pageCap > 100) throw new Error("Invalid report page cap");
  const config = getStripeConfiguration();
  if (!config || await verifyStripeAccount(config) !== "valid") throw new Error("Cash account unavailable");
  const rows = [];
  let cursor: string | undefined;
  for (let page = 0; ; page++) {
    if (page === pageCap) throw new Error("Cash report incomplete: page cap");
    const sessions = await config.client.checkout.sessions.list({ limit: 100, ...(cursor ? {starting_after: cursor} : {}) });
    for (const session of sessions.data) {
      if (session.metadata?.product_key !== STARTER_KIT_PRODUCT_KEY && !(session.metadata?.plan === "starter" && session.metadata?.product_version === "2026-09-20")) continue;
      const result = await verifyPaidSession(session.id, "starter");
      if (result.status === "unavailable" || result.status === "invalid" || result.status === "missing") throw new Error("Cash verification incomplete");
      if (result.status === "paid" || result.status === "revoked") {
        if (!result.rights || result.session.livemode !== (config.mode === "live")) throw new Error("Cash scope mismatch");
        rows.push({sessionId: session.id, rights: result.rights});
      } else if (session.payment_status === "paid") throw new Error("Paid product reconciliation mismatch");
    }
    if (!sessions.has_more) break;
    cursor = sessions.data.at(-1)?.id;
    if (!cursor) throw new Error("Cash pagination unavailable");
  }
  return { ...reconcileProductCash(rows, start, end), accountId: config.accountId, mode: config.mode, asOf: new Date().toISOString(), coverage: "all-enumerated-product-sessions", verifiedSessions: rows.length, testSessions: rows.filter(r => r.rights.test).length };
}
