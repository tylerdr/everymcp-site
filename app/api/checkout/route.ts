import { NextResponse } from "next/server";
import Stripe from "stripe";
import { isPlan, products } from "@/lib/products";
import { siteUrl } from "@/lib/site";

export const runtime = "nodejs";

function parseBody(value: unknown): { plan?: keyof typeof products; email?: string } {
  if (!value || typeof value !== "object") {
    return {};
  }

  const payload = value as { plan?: string; email?: string };
  const validPlan = isPlan(payload.plan) ? payload.plan : undefined;

  return {
    plan: validPlan,
    email: typeof payload.email === "string" && payload.email.length > 0 ? payload.email : undefined
  };
}

export async function POST(request: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!stripeSecretKey) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  try {
    const { plan, email } = parseBody(await request.json());

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

    const stripe = new Stripe(stripeSecretKey);

    // Build the price inline so a stale shared Stripe price cannot route buyers into another product.
    const lineItem = {
      price_data: {
        currency: "usd",
        product_data: {
          name: selectedPlan.name,
          description: selectedPlan.description
        },
        unit_amount: selectedPlan.amount
      },
      quantity: 1
    };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [lineItem],
      customer_email: email,
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/pricing?checkout=cancelled#starter-kit`,
      allow_promotion_codes: true,
      metadata: {
        plan,
        product_version: "2026-09-20"
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      console.error("Stripe checkout session creation failed", {
        type: error.type,
        code: error.code,
        message: error.message,
        requestId: error.requestId
      });

      return NextResponse.json(
        {
          error: "Stripe checkout session creation failed",
          detail: error.message,
          code: error.code,
          requestId: error.requestId
        },
        { status: 502 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown checkout error";
    console.error("Unexpected checkout error", { message });

    return NextResponse.json({ error: "Checkout failed", detail: message }, { status: 500 });
  }
}
