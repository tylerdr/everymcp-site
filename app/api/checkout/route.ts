import { NextResponse } from "next/server";
import Stripe from "stripe";
import { siteUrl } from "@/lib/site";

export const runtime = "nodejs";

type Plan = "implementation" | "sponsor";

const planConfig: Record<Plan, { amount: number; name: string; description: string }> = {
  implementation: {
    amount: 200000,
    name: "EveryMCP Implementation Package",
    description: "Fixed-fee MCP implementation sprint"
  },
  sponsor: {
    amount: 50000,
    name: "EveryMCP Sponsor Placement",
    description: "Featured sponsor slot on directory and newsletter"
  }
};

const priceIdByPlan: Partial<Record<Plan, string>> = {
  implementation: process.env.STRIPE_IMPLEMENTATION_PRICE_ID,
  sponsor: process.env.STRIPE_SPONSOR_PRICE_ID
};

function parseBody(value: unknown): { plan?: Plan; email?: string } {
  if (!value || typeof value !== "object") {
    return {};
  }

  const payload = value as { plan?: string; email?: string };
  const validPlan = payload.plan === "implementation" || payload.plan === "sponsor" ? payload.plan : undefined;

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

    const stripe = new Stripe(stripeSecretKey);
    const selectedPlan = planConfig[plan];
    const configuredPrice = priceIdByPlan[plan]?.trim();

    const lineItem = configuredPrice
      ? { price: configuredPrice, quantity: 1 }
      : {
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
      success_url: `${siteUrl}/checkout/success?plan=${plan}`,
      cancel_url: `${siteUrl}/${plan === "sponsor" ? "sponsor" : "services"}?checkout=cancelled`,
      allow_promotion_codes: true,
      metadata: {
        plan
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
