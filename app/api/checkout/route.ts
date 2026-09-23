import { NextResponse } from "next/server";
import Stripe from "stripe";
import { isPlan, products } from "@/lib/products";
import { siteUrl } from "@/lib/site";
import {
  getStripeConfiguration,
  isTransientStripeError,
  verifyStripeAccount
} from "@/lib/stripe-config";

export const runtime = "nodejs";

const attributionValuePattern = /^[a-z0-9][a-z0-9_-]{0,63}$/;

type CheckoutRequest = {
  plan?: keyof typeof products;
  email?: string;
  source?: string;
  goal?: string;
};

function boundedAttribution(value: unknown) {
  return typeof value === "string" && attributionValuePattern.test(value) ? value : undefined;
}

function parseBody(value: unknown): CheckoutRequest {
  if (!value || typeof value !== "object") {
    return {};
  }

  const payload = value as { plan?: string; email?: string; source?: unknown; goal?: unknown };
  const validPlan = isPlan(payload.plan) ? payload.plan : undefined;

  return {
    plan: validPlan,
    email: typeof payload.email === "string" && payload.email.length > 0 ? payload.email : undefined,
    source: boundedAttribution(payload.source),
    goal: boundedAttribution(payload.goal)
  };
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid checkout request" }, { status: 400 });
    }

    const { plan, email, source, goal } = parseBody(body);

    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const selectedPlan = products[plan];
    if (selectedPlan.fulfillment !== "download") {
      return NextResponse.json(
        { error: "This offer requires manual scoping and is not available for self-serve checkout." },
        { status: 409 }
      );
    }

    const idempotencyKey = request.headers.get("Idempotency-Key")?.trim();
    if (!idempotencyKey || !/^[A-Za-z0-9_-]{16,255}$/.test(idempotencyKey)) {
      return NextResponse.json({ error: "Checkout attempt key is required" }, { status: 400 });
    }

    const stripeConfiguration = getStripeConfiguration();
    if (!stripeConfiguration) {
      return NextResponse.json(
        { error: "Checkout is temporarily unavailable. No payment was taken." },
        { status: 503, headers: { "Retry-After": "10" } }
      );
    }

    const accountCheck = await verifyStripeAccount(stripeConfiguration);
    if (accountCheck !== "valid") {
      return NextResponse.json(
        { error: "Checkout is temporarily unavailable. No payment was taken." },
        { status: 503, headers: { "Retry-After": "10" } }
      );
    }

    // Build the price inline so a stale shared Stripe price cannot route buyers into another product.
    const lineItem = {
      price_data: {
        currency: selectedPlan.currency,
        product_data: {
          name: selectedPlan.name,
          description: selectedPlan.description,
          metadata: {
            everymcp_product: selectedPlan.productKey,
            product_version: selectedPlan.version
          }
        },
        unit_amount: selectedPlan.amount
      },
      quantity: selectedPlan.quantity
    };

    const session = await stripeConfiguration.client.checkout.sessions.create(
      {
        mode: "payment",
        line_items: [lineItem],
        customer_email: email,
        success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/pricing?checkout=cancelled#starter-kit`,
        allow_promotion_codes: true,
        metadata: {
          plan,
          product_key: selectedPlan.productKey,
          product_version: selectedPlan.version,
          ...(source ? { acquisition_source: source } : {}),
          ...(goal ? { acquisition_goal: goal } : {})
        }
      },
      { idempotencyKey }
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (isTransientStripeError(error)) {
      return NextResponse.json(
        { error: "Checkout is temporarily unavailable. No payment was taken." },
        { status: 503, headers: { "Retry-After": "10" } }
      );
    }

    if (error instanceof Stripe.errors.StripeError) {
      console.error("Stripe checkout session creation failed", {
        type: error.type,
        code: error.code,
        statusCode: error.statusCode,
        requestId: error.requestId
      });
      return NextResponse.json({ error: "Checkout could not be started" }, { status: 502 });
    }

    console.error("Unexpected checkout error", {
      type: error instanceof Error ? error.name : "UnknownError"
    });

    return NextResponse.json({ error: "Checkout could not be started" }, { status: 500 });
  }
}
