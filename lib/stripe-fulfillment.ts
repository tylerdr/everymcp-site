import Stripe from "stripe";

export type PaidSessionResult =
  | { status: "paid"; session: Stripe.Checkout.Session }
  | { status: "missing" | "unavailable" | "invalid" | "not_paid" };

export async function verifyPaidSession(
  sessionId: string | null,
  expectedPlan: string
): Promise<PaidSessionResult> {
  if (!sessionId) {
    return { status: "missing" };
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!stripeSecretKey) {
    return { status: "unavailable" };
  }

  try {
    const stripe = new Stripe(stripeSecretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (
      session.mode !== "payment" ||
      session.status !== "complete" ||
      session.payment_status !== "paid" ||
      session.metadata?.plan !== expectedPlan
    ) {
      return { status: "not_paid" };
    }

    return { status: "paid", session };
  } catch {
    return { status: "invalid" };
  }
}
