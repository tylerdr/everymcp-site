import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

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

// Render the real result page with synthetic verification outcomes only.
// No Stripe client, credentials, payment session retrieval or network calls.
const require = createRequire(import.meta.url);
let resultState = "missing";
let verificationArgs;
const pageModule = { exports: {} };
const compiled = ts.transpileModule(success, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX }
}).outputText;
const pageRequire = (id) => {
  if (id === "@/lib/stripe-fulfillment") return {
    verifyPaidSession: async (...args) => {
      verificationArgs = args;
      return { status: resultState };
    }
  };
  if (id === "@/components/FulfillmentDownload") return {
    FulfillmentDownload: ({ href }) => createElement("a", { href }, "Download your starter kit")
  };
  return require(id);
};
new Function("require", "module", "exports", compiled)(pageRequire, pageModule, pageModule.exports);
const resultPage = pageModule.exports;
assert.deepEqual(resultPage.metadata.robots, { index: false, follow: true });
assert.equal(resultPage.metadata.alternates.canonical, "/checkout/success");
assert.equal(resultPage.dynamic, "force-dynamic");
for (const [status, sessionId, expectedMessage] of [
  ["missing", undefined, "Open this page from a completed checkout"],
  ["unavailable", "cs_test_synthetic", "Checkout verification is temporarily unavailable"],
  ["invalid", "cs_test_synthetic", "This checkout link is invalid or expired"],
  ["not_paid", "cs_test_synthetic", "Payment is still pending"],
  ["paid", " cs_test_synthetic ", "Your starter kit is ready."]
]) {
  resultState = status;
  const markup = renderToStaticMarkup(await resultPage.default({ searchParams: { session_id: sessionId } }));
  assert.deepEqual(verificationArgs, [sessionId?.trim() || null, "starter"]);
  assert.ok(markup.includes(expectedMessage), status);
  assert.equal(markup.includes("/api/fulfillment/starter-kit?session_id="), status === "paid");
  if (status === "paid") assert.ok(markup.includes(encodeURIComponent(sessionId)));
}

for (const [path, required] of [
  ["app/api/checkout/route.ts", ["fulfillment !== \"download\"", "CHECKOUT_SESSION_ID", "product_version", "Idempotency-Key", "idempotencyKey"]],
  ["lib/stripe-fulfillment.ts", ["matchesStarterEntitlement", "session.payment_status", "session.metadata?.plan", "expectedProduct.amount", "stripeConfiguration.mode"]],
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
