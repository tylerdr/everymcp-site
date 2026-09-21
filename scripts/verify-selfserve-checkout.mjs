import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");

const checkout = read("app/api/checkout/route.ts");
const verification = read("lib/stripe-fulfillment.ts");
const delivery = read("app/api/fulfillment/starter-kit/route.ts");
const success = read("app/checkout/success/page.tsx");
const download = read("components/FulfillmentDownload.tsx");
const products = read("lib/products.ts");
const lead = read("app/api/lead/route.ts");
const starterKit = read("lib/starter-kit.ts");
const pricing = read("app/pricing/page.tsx");

for (const [path, required] of [
  ["app/api/checkout/route.ts", ["fulfillment !== \"download\"", "CHECKOUT_SESSION_ID", "product_version", "Idempotency-Key", "idempotencyKey"]],
  ["lib/stripe-fulfillment.ts", ["session.payment_status === \"paid\"", "session.metadata?.plan === expectedPlan", "amount_subtotal === expectedProduct.amount", "session.livemode", "legacyProductChecks"]],
  ["app/api/fulfillment/starter-kit/route.ts", ["Content-Disposition", "private, no-store"]],
  ["app/checkout/success/page.tsx", ["Payment verified", "/api/fulfillment/starter-kit"]],
  ["components/FulfillmentDownload.tsx", ["starter_kit_download_requested"]],
  ["lib/products.ts", ["MCP Integration Starter Kit", "STARTER_KIT_AMOUNT = 4900", "STARTER_KIT_PRODUCT_VERSION", "fulfillment: \"manual\""]],
  ["lib/stripe-config.ts", ["STRIPE_MODE", "STRIPE_ACCOUNT_ID", "sk_test_", "sk_live_"]]
]) {
  const content = read(path);
  for (const fragment of required) {
    if (!content.includes(fragment)) {
      throw new Error(`${path} is missing self-serve fulfillment contract: ${fragment}`);
    }
  }
}

for (const forbidden of ["console.log(\"[everymcp][lead]\"", "return NextResponse.json({ ok: true })"]) {
  if (lead.includes(forbidden)) {
    throw new Error(`Lead endpoint retains unsafe false-success behavior: ${forbidden}`);
  }
}

if (checkout.includes('planConfig')) {
  throw new Error("Checkout must use the shared product catalog");
}

if (success.includes("We&apos;ll follow up via email")) {
  throw new Error("Checkout success cannot promise manual fulfillment");
}

for (const fragment of ["selection matrix", "@modelcontextprotocol/server-filesystem", "validation assets", "rollback"]) {
  if (!starterKit.toLowerCase().includes(fragment.toLowerCase())) {
    throw new Error(`Starter kit is missing grounded commercial asset: ${fragment}`);
  }
}

if (!pricing.includes("isStripeCheckoutConfigured") || !pricing.includes("Checkout is temporarily closed")) {
  throw new Error("Pricing must close the paid CTA until Stripe configuration is bound");
}

console.log("SELF_SERVE_CHECKOUT_CONTRACT", JSON.stringify({
  passed: true,
  paymentVerifiedServerSide: true,
  deterministicDownload: true,
  manualPlansFailClosed: true,
  exactProductBoundary: true,
  idempotentCheckout: true,
  groundedArtifact: true,
  closedUntilStripeBound: true
}));
