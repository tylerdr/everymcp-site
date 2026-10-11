export type StarterEntitlementInput = {
  mode: string | null;
  status: string | null;
  paymentStatus: string | null;
  liveMode: boolean | null;
  sessionPlan: string | null | undefined;
  sessionProductKey: string | null | undefined;
  sessionProductVersion: string | null | undefined;
  currency: string | null;
  amountSubtotal: number | null;
  amountTotal: number | null;
  amountDiscount: number | null | undefined;
  amountTax: number | null | undefined;
  amountShipping: number | null | undefined;
  pricingPolicy: string | null | undefined;
  quantity: number | null | undefined;
  unitAmount: number | null | undefined;
  priceCurrency: string | null | undefined;
  productKey: string | null | undefined;
  productVersion: string | null | undefined;
  productName: string | null;
  expectedPlan: string;
  expectedProductKey: string;
  expectedProductVersion: string;
  expectedAmount: number;
  expectedCurrency: string;
  expectedQuantity: number;
  expectedProductName: string;
  legacyProductVersion: string;
  expectedLiveMode: boolean;
};

export function matchesStarterEntitlement(input: StarterEntitlementInput) {
  const amounts = [input.amountTotal, input.amountDiscount, input.amountTax, input.amountShipping];
  const validAmounts = amounts.every((amount) => typeof amount === "number" && Number.isSafeInteger(amount) && amount >= 0);
  const knownPolicy = !input.pricingPolicy || input.pricingPolicy === "usd4900-no-discount-v1";
  // Earlier sessions offered promotion codes. Preserve their already paid rights
  // under reconciled totals; every new session stamps the strict policy below.
  const collectedTotalChecks = validAmounts && knownPolicy && input.amountShipping === 0 &&
    (input.amountDiscount as number) <= input.expectedAmount &&
    input.amountTotal === input.expectedAmount - (input.amountDiscount as number) + (input.amountTax as number) &&
    (input.pricingPolicy !== "usd4900-no-discount-v1" || input.amountDiscount === 0);
  const commonPaymentChecks = collectedTotalChecks &&
    input.mode === "payment" &&
    input.status === "complete" &&
    input.paymentStatus === "paid" &&
    input.liveMode === input.expectedLiveMode &&
    input.sessionPlan === input.expectedPlan &&
    input.currency === input.expectedCurrency &&
    input.amountSubtotal === input.expectedAmount &&
    input.quantity === input.expectedQuantity &&
    input.unitAmount === input.expectedAmount &&
    input.priceCurrency === input.expectedCurrency;
  const currentProductChecks =
    input.sessionProductKey === input.expectedProductKey &&
    input.sessionProductVersion === input.expectedProductVersion &&
    input.productKey === input.expectedProductKey &&
    input.productVersion === input.expectedProductVersion;
  const legacyProductChecks =
    input.sessionProductVersion === input.legacyProductVersion &&
    input.productName === input.expectedProductName;

  return commonPaymentChecks && (currentProductChecks || legacyProductChecks);
}
