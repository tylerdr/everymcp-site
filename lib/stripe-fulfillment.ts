import Stripe from "stripe";
import { products, type Plan } from "@/lib/products";
import {
  getStripeConfiguration,
  getStripeRecoveryConfiguration,
  isStripeConfigurationError,
  isStripeNotFoundError,
  isTransientStripeError,
  verifyStripeAccount
} from "@/lib/stripe-config";

export type PaidSessionResult =
  | { status: "paid"; session: Stripe.Checkout.Session }
  | { status: "missing" | "unavailable" | "invalid" | "not_paid" };

export async function verifyPaidSession(
  sessionId: string | null,
  expectedPlan: Plan
): Promise<PaidSessionResult> {
  if (!sessionId) {
    return { status: "missing" };
  }

  if (!/^cs_(?:test_|live_)?[A-Za-z0-9_]+$/.test(sessionId)) {
    return { status: "invalid" };
  }

  const strictConfiguration = getStripeConfiguration();
  const stripeConfiguration = strictConfiguration ?? getStripeRecoveryConfiguration();
  if (!stripeConfiguration) {
    return { status: "unavailable" };
  }

  if (strictConfiguration) {
    const accountCheck = await verifyStripeAccount(strictConfiguration);
    if (accountCheck !== "valid") {
      return { status: "unavailable" };
    }
  }

  const expectedProduct = products[expectedPlan];

  try {
    const session = await stripeConfiguration.client.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items.data.price.product"]
    });
    const lineItems = session.line_items?.data || [];
    const lineItem = lineItems.length === 1 ? lineItems[0] : null;
    const price = lineItem?.price;
    const product = price && typeof price.product === "object" ? price.product : null;
    const productMetadata = product && !("deleted" in product && product.deleted) ? product.metadata : null;
    const productName = product && !("deleted" in product && product.deleted) ? product.name : null;
    const commonPaymentChecks =
      session.mode === "payment" &&
      session.status === "complete" &&
      session.payment_status === "paid" &&
      session.livemode === (stripeConfiguration.mode === "live") &&
      session.metadata?.plan === expectedPlan &&
      session.currency === expectedProduct.currency &&
      session.amount_subtotal === expectedProduct.amount &&
      lineItem?.quantity === expectedProduct.quantity &&
      price?.unit_amount === expectedProduct.amount &&
      price?.currency === expectedProduct.currency;
    const currentProductChecks =
      session.metadata?.product_key === expectedProduct.productKey &&
      session.metadata?.product_version === expectedProduct.version &&
      productMetadata?.everymcp_product === expectedProduct.productKey &&
      productMetadata?.product_version === expectedProduct.version;
    const legacyProductChecks =
      session.metadata?.product_version === "2026-09-20" &&
      productName === expectedProduct.name;

    if (!commonPaymentChecks || (!currentProductChecks && !legacyProductChecks)) {
      return { status: "not_paid" };
    }

    return { status: "paid", session };
  } catch (error) {
    if (isTransientStripeError(error) || isStripeConfigurationError(error)) {
      return { status: "unavailable" };
    }

    if (isStripeNotFoundError(error)) {
      return { status: "invalid" };
    }

    return { status: "invalid" };
  }
}
