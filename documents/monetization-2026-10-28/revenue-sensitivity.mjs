// Offline scenario math only. No traffic import, provider calls or revenue proof.
import assert from "node:assert/strict";

const price = 49;
const scenarios = [
  { scenario: "small_cohort", visits: 250, offerClickRate: 0.02, clickToPaidRate: 0.02 },
  { scenario: "working_assumption", visits: 1000, offerClickRate: 0.05, clickToPaidRate: 0.05 },
  { scenario: "strong_assumption", visits: 5000, offerClickRate: 0.10, clickToPaidRate: 0.10 }
].map((row) => {
  const offerClicks = row.visits * row.offerClickRate;
  const expectedOrders = offerClicks * row.clickToPaidRate;
  return { ...row, offerClicks, expectedOrders, grossUsd: Number((expectedOrders * price).toFixed(2)) };
});
const affiliate = [0.15, 0.25].map((commissionRate) => ({
  assumedVisits: 1000,
  assumedProviderClickRate: 0.05,
  assumedClickToEligiblePaidRate: 0.03,
  assumedMonthlyEligibleSpendUsd: 50,
  commissionRate,
  firstMonthExpectedCommissionUsd: Number((1000 * 0.05 * 0.03 * 50 * commissionRate).toFixed(2))
}));
assert.deepEqual(scenarios.map(({ grossUsd }) => grossUsd), [4.9, 122.5, 2450]);
assert.deepEqual(affiliate.map(({ firstMonthExpectedCommissionUsd }) => firstMonthExpectedCommissionUsd), [11.25, 18.75]);
const targetOrders = Math.ceil(10000 / price);
assert.equal(targetOrders, 205);
console.log(JSON.stringify({
  label: "ASSUMPTIONS ONLY — not forecast, collected revenue or observed traffic",
  observedTraffic: null,
  observedPaidConversion: null,
  observedRevenue: null,
  checkoutActivationProved: false,
  affiliateActivationProved: false,
  starterPriceUsd: price,
  scenarios,
  targetGrossUsd: 10000,
  targetOrders,
  targetVisitsAtWorkingRates: Math.ceil(targetOrders / (0.05 * 0.05)),
  affiliate
}, null, 2));
