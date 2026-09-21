import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import assert from "node:assert/strict";
import ts from "typescript";

const require = createRequire(import.meta.url);

function loadTypeScriptModule(path) {
  const source = readFileSync(path, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText;
  const module = { exports: {} };
  new Function("require", "exports", "module", compiled)(require, module.exports, module);
  return module.exports;
}

const { matchesStarterEntitlement } = loadTypeScriptModule("lib/stripe-entitlement.ts");
const { isTransientStripeFailure } = loadTypeScriptModule("lib/stripe-errors.ts");

const valid = {
  mode: "payment",
  status: "complete",
  paymentStatus: "paid",
  liveMode: false,
  sessionPlan: "starter",
  sessionProductKey: "everymcp-starter-kit",
  sessionProductVersion: "2026-09-21",
  currency: "usd",
  amountSubtotal: 4900,
  quantity: 1,
  unitAmount: 4900,
  priceCurrency: "usd",
  productKey: "everymcp-starter-kit",
  productVersion: "2026-09-21",
  productName: "EveryMCP MCP Integration Starter Kit",
  expectedPlan: "starter",
  expectedProductKey: "everymcp-starter-kit",
  expectedProductVersion: "2026-09-21",
  expectedAmount: 4900,
  expectedCurrency: "usd",
  expectedQuantity: 1,
  expectedProductName: "EveryMCP MCP Integration Starter Kit",
  legacyProductVersion: "2026-09-20",
  expectedLiveMode: false
};

assert.equal(matchesStarterEntitlement(valid), true, "valid current entitlement should pass");

for (const [field, value] of [
  ["amountSubtotal", 4901],
  ["currency", "eur"],
  ["productKey", "wrong-product"],
  ["sessionProductVersion", "wrong-version"],
  ["liveMode", true],
  ["paymentStatus", "unpaid"]
]) {
  assert.equal(matchesStarterEntitlement({ ...valid, [field]: value }), false, `${field} mismatch should fail`);
}

assert.equal(
  matchesStarterEntitlement({
    ...valid,
    sessionProductKey: undefined,
    sessionProductVersion: "2026-09-20",
    productKey: undefined,
    productVersion: undefined
  }),
  true,
  "legacy paid sessions should remain recoverable"
);

assert.equal(isTransientStripeFailure("StripeConnectionError", undefined), true);
assert.equal(isTransientStripeFailure("StripeAPIError", 503), true);
assert.equal(isTransientStripeFailure("StripeRateLimitError", 429), true);
assert.equal(isTransientStripeFailure("StripeInvalidRequestError", 400), false);

console.log("STRIPE_ENTITLEMENT_BEHAVIOR", JSON.stringify({
  passed: true,
  exactBoundaryCases: 6,
  legacyRecovery: true,
  transientClassification: true
}));
