import Stripe from "stripe";
import { createHash } from "node:crypto";
import type { PaymentNotice, Scope } from "./entitlements";

// The signing secret must be bound to the approved account/mode endpoint by the
// deployment operator. A standard-account event has no account field; the
// authoritative purchase adapter must independently retrieve/compare account ID.
export function stripeNoticeVerifier(secret: string, scope: Scope) {
  return (raw: string, signature: string): PaymentNotice => {
    const event = Stripe.webhooks.constructEvent(raw, signature, secret);
    if (event.livemode !== (scope.mode === "live") || (event.account && event.account !== scope.accountId)) throw new Error("Webhook scope mismatch");
    const object = event.data.object;
    const sessionId = "id" in object && typeof object.id === "string" ? object.id : "";
    return { id: event.id, type: event.type, sessionId, scope: { ...scope }, payloadSha256: createHash("sha256").update(raw).digest("hex") };
  };
}
