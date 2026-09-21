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
  const commonPaymentChecks =
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
