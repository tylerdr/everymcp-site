import Stripe from "stripe";
import { createHash } from "node:crypto";
import { STARTER_KIT_PRODUCT_KEY } from "../products";
import type { PaymentNotice, Scope } from "./entitlements";

// The signing secret must be bound to the approved account/mode endpoint by the
// deployment operator. A standard-account event has no account field; the
// authoritative purchase adapter must independently retrieve/compare account ID.
export function stripeNoticeVerifier(secret: string, scope: Scope) {
  return (raw: string, signature: string): PaymentNotice => {
    const event = Stripe.webhooks.constructEvent(raw, signature, secret);
    if (event.livemode !== (scope.mode === "live") || (event.account && event.account !== scope.accountId)) throw new Error("Webhook scope mismatch");
    const object = event.data.object;
    const data = object as unknown as {id: string; payment_intent?: string | {id:string} | null; charge?: string | {id:string} | null};
    const ref = (value: typeof data.payment_intent) => typeof value === "string" ? value : value?.id;
    const sessionId = event.type.startsWith("checkout.session.") ? data.id : "";
    return { id: event.id, type: event.type, sessionId, paymentIntentId: ref(data.payment_intent), chargeId: event.type === "charge.refunded" ? data.id : ref(data.charge), scope: { ...scope }, payloadSha256: createHash("sha256").update(raw).digest("hex") };
  };
}

// Resolve signed reversal references in this account; never interpret a charge or
// dispute ID as a Checkout session or trust its metadata to grant/revoke rights.
export function stripeNoticeResolver(client: Stripe, scope: Scope) {
  return async (notice: PaymentNotice): Promise<PaymentNotice | null> => {
    if (notice.sessionId) return notice;
    if (!["charge.refunded", "refund.created", "refund.updated", "refund.failed", "charge.dispute.created", "charge.dispute.updated", "charge.dispute.closed", "charge.dispute.funds_withdrawn", "charge.dispute.funds_reinstated"].includes(notice.type)) return null;
    let pi = notice.paymentIntentId;
    if (notice.chargeId) {
      const charge = await client.charges.retrieve(notice.chargeId);
      if (charge.id !== notice.chargeId || charge.livemode !== (scope.mode === "live")) throw new Error("Reversal charge mismatch");
      const linked = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
      if (pi && linked !== pi) throw new Error("Reversal payment mismatch");
      pi = linked;
    }
    if (!pi) throw new Error("Missing reversal payment");
    const sessions = await client.checkout.sessions.list({ payment_intent: pi, limit: 2 });
    if (sessions.has_more || sessions.data.length > 1) throw new Error("Ambiguous reversal session");
    const session = sessions.data[0];
    if (!session || (session.metadata?.product_key !== STARTER_KIT_PRODUCT_KEY && !(session.metadata?.plan === "starter" && session.metadata?.product_version === "2026-09-20"))) return null;
    const linked = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
    if (linked !== pi || session.livemode !== (scope.mode === "live")) throw new Error("Reversal session mismatch");
    return { ...notice, sessionId: session.id };
  };
}
