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
import { matchesStarterEntitlement } from "@/lib/stripe-entitlement";

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
    if (
      !matchesStarterEntitlement({
        mode: session.mode,
        status: session.status,
        paymentStatus: session.payment_status,
        liveMode: session.livemode,
        sessionPlan: session.metadata?.plan,
        sessionProductKey: session.metadata?.product_key,
        sessionProductVersion: session.metadata?.product_version,
        currency: session.currency,
        amountSubtotal: session.amount_subtotal,
        quantity: lineItem?.quantity,
        unitAmount: price?.unit_amount,
        priceCurrency: price?.currency,
        productKey: productMetadata?.everymcp_product,
        productVersion: productMetadata?.product_version,
        productName,
        expectedPlan,
        expectedProductKey: expectedProduct.productKey,
        expectedProductVersion: expectedProduct.version,
        expectedAmount: expectedProduct.amount,
        expectedCurrency: expectedProduct.currency,
        expectedQuantity: expectedProduct.quantity,
        expectedProductName: expectedProduct.name,
        legacyProductVersion: "2026-09-20",
        expectedLiveMode: stripeConfiguration.mode === "live"
      })
    ) {
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
