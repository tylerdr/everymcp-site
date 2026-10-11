import { NextResponse } from "next/server";
import Stripe from "stripe";
import { isPlan, products } from "@/lib/products";
import { getStarterBinding } from "@/lib/recovery/binding";
import { cookieToken, sameOriginMutation } from "@/lib/buyer/session";
import { buyerIntent, pricingIntent } from "@/lib/buyer/context";
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
  listing?: string;
};

function boundedAttribution(value: unknown) {
  return typeof value === "string" && attributionValuePattern.test(value) ? value : undefined;
}

function parseBody(value: unknown): CheckoutRequest {
  if (!value || typeof value !== "object") {
    return {};
  }

  const payload = value as { plan?: string; email?: string; source?: unknown; goal?: unknown; listing?: unknown };
  const validPlan = isPlan(payload.plan) ? payload.plan : undefined;

  return {
    plan: validPlan,
    email: typeof payload.email === "string" && payload.email.length > 0 ? payload.email : undefined,
    source: boundedAttribution(payload.source),
    goal: boundedAttribution(payload.goal),
    listing: buyerIntent({source:payload.source,listing:payload.listing}).listing
  };
}

export async function POST(request: Request) {
  try {
    if (cookieToken(request) && !sameOriginMutation(request)) return NextResponse.json({error:"Invalid checkout origin"},{status:400});
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid checkout request" }, { status: 400 });
    }

    const { plan, source, goal, listing } = parseBody(body);

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

    const binding = getStarterBinding();
    if (!binding) return NextResponse.json({ error: "Durable checkout setup pending. No payment was taken." }, { status: 503 });
    if (!await binding.ready()) return NextResponse.json({ error: "Durable delivery is temporarily unavailable. No payment was taken." }, { status: 503 });
    const principal = await binding.authenticate(request).catch(() => undefined);
    if (principal === undefined) return NextResponse.json({ error: "Buyer verification is temporarily unavailable. No payment was taken." }, { status: 503 });
    if (!principal) return NextResponse.json({ error: "Sign in again with your buyer email. No payment was taken." }, { status: 401 });
    const stripeConfiguration = getStripeConfiguration();
    if (!stripeConfiguration || stripeConfiguration.accountId !== binding.scope.accountId || stripeConfiguration.mode !== binding.scope.mode) {
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

    const cancel = new URL(pricingIntent(buyerIntent({ source, goal, listing })), siteUrl);
    cancel.searchParams.set("checkout", "cancelled");
    const session = await stripeConfiguration.client.checkout.sessions.create(
      {
        mode: "payment",
        line_items: [lineItem],
        customer_email: principal.email,
        success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancel.toString(),
        allow_promotion_codes: false,
        metadata: {
          ...binding.ownerMetadata(principal),
          plan,
          product_key: selectedPlan.productKey,
          product_version: selectedPlan.version,
          ...(source ? { acquisition_source: source } : {}),
          ...(listing && buyerIntent({ source, listing }).listing ? { acquisition_listing: listing } : {}),
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
