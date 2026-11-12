/** Fictional Stripe HTTP responses only; this transport never opens a socket. */
import type Stripe from "stripe";
import { RIGHTS_POLICY, type BillingAuthorization, type BillingBinding } from "../../../lib/monitoring/control-contract";
import type { RecurringRightsConfig } from "../../../lib/monitoring/recurring-rights";

export const NOW = "2026-11-12T00:00:00.000Z";
export const START = Date.parse("2026-11-01T00:00:00.000Z") / 1000;
export const END = Date.parse("2026-12-01T00:00:00.000Z") / 1000;
export const scope = { accountId: "acct_Fictional", mode: "test" as const, productKey: "fictional-monitoring" };
export const binding: BillingBinding = { scope, ownerKey: "a".repeat(64), customerId: "cus_Fictional", subscriptionId: "sub_Fictional", enabled: true };
export const config: RecurringRightsConfig = { scope, secretKey: "rk_test_FictionalOnlyNotACredential", productId: "prod_Fictional", priceId: "price_Fictional", currency: "usd", interval: "month", intervalCount: 1, policy: RIGHTS_POLICY, now: () => new Date(NOW) };
export function page<T>(data: T[] = []) { return { object: "list", data, has_more: false, url: "/fictional" }; }
export function bill(suffix = "Current", start = START, end = END) {
  const invoiceId = `in_${suffix}`, intentId = `pi_${suffix}`, chargeId = `ch_${suffix}`;
  const payment = { id: `inpay_${suffix}`, object: "invoice_payment", invoice: invoiceId, livemode: false, currency: "usd", status: "paid", amount_paid: 1200, amount_requested: 1200, payment: { type: "payment_intent", payment_intent: intentId } };
  return {
    invoice: { id: invoiceId, object: "invoice", livemode: false, customer: binding.customerId, customer_account: null, currency: "usd", status: "paid", parent: { type: "subscription_details", subscription_details: { subscription: binding.subscriptionId } }, billing_reason: "subscription_cycle", collection_method: "charge_automatically", amount_due: 1200, amount_paid: 1200, amount_remaining: 0, amount_overpaid: 0, total: 1200, subtotal: 1200, starting_balance: 0, ending_balance: 0, pre_payment_credit_notes_amount: 0, post_payment_credit_notes_amount: 0, discounts: [] as unknown[], total_discount_amounts: [], total_pretax_credit_amounts: [], total_taxes: [], status_transitions: { paid_at: start + 10, finalized_at: start + 1 }, from_invoice: null, on_behalf_of: null },
    lines: page([{ id: `il_${suffix}`, invoice: invoiceId, livemode: false, currency: "usd", amount: 1200, subtotal: 1200, quantity: 1, parent: { type: "subscription_item_details", subscription_item_details: { subscription: binding.subscriptionId, subscription_item: "si_Fictional", proration: false } }, pricing: { type: "price_details", price_details: { price: config.priceId, product: config.productId }, unit_amount_decimal: "1200" }, period: { start, end }, discounts: [] as unknown[], discount_amounts: [], pretax_credit_amounts: [], taxes: [] }]),
    payments: page([payment]), allocations: page([structuredClone(payment)]),
    intent: { id: intentId, object: "payment_intent", livemode: false, customer: binding.customerId, customer_account: null, currency: "usd", status: "succeeded", amount: 1200, amount_received: 1200, amount_capturable: 0, latest_charge: chargeId, on_behalf_of: null, transfer_data: null, application_fee_amount: null },
    charge: { id: chargeId, object: "charge", livemode: false, customer: binding.customerId, currency: "usd", status: "succeeded", paid: true, captured: true, amount: 1200, amount_captured: 1200, amount_refunded: 0, refunded: false, disputed: false, payment_intent: intentId, on_behalf_of: null, transfer_data: null, application_fee_amount: null },
    refunds: page<Record<string, unknown>>(), disputes: page<Record<string, unknown>>(), notes: page<Record<string, unknown>>(),
  };
}
export class FictionalRecurringHttp implements Stripe.HttpClient<Stripe.HttpClientResponse<object, never>> {
  readonly calls: { path: string; method: string; timeout: number; version: unknown }[] = [];
  account = { id: scope.accountId, object: "account" };
  customer = { id: binding.customerId, object: "customer", livemode: false };
  current = bill();
  previous: ReturnType<typeof bill> | null = null;
  subscription = {
    id: binding.subscriptionId, object: "subscription", livemode: false, customer: binding.customerId, currency: "usd", status: "active",
    items: page([{ id: "si_Fictional", subscription: binding.subscriptionId, quantity: 1, current_period_start: START, current_period_end: END, billing_thresholds: null, discounts: [], price: { id: config.priceId, livemode: false, product: config.productId, type: "recurring", currency: "usd", recurring: { interval: "month", interval_count: 1, usage_type: "licensed" }, billing_scheme: "per_unit", unit_amount: 1200, unit_amount_decimal: "1200", custom_unit_amount: null, transform_quantity: null } }]),
    latest_invoice: "in_Current", cancel_at: null as number | null, cancel_at_period_end: false, canceled_at: null as number | null, ended_at: null as number | null,
    pause_collection: null as unknown, pending_update: null as unknown, pending_setup_intent: null, schedule: null as string | null, discounts: [], on_behalf_of: null, transfer_data: null,
  };
  statusCode = 200;
  hang = false;
  delayMs = 0;
  onRequest?: (path: string, count: number) => void;
  getClientName() { return "fictional-recurring-provider"; }
  previousAuthorization(): BillingAuthorization {
    const start = Date.parse("2026-10-01T00:00:00Z") / 1000;
    this.previous = bill("Previous", start, START);
    return { policy: RIGHTS_POLICY, scope, ownerKey: binding.ownerKey, customerId: binding.customerId, subscriptionId: binding.subscriptionId, invoiceId: "in_Previous", periodStart: new Date(start * 1000).toISOString(), periodEnd: new Date(START * 1000).toISOString() };
  }
  async makeRequest(host: string, port: string | number, path: string, method: "GET" | "POST" | "PUT" | "DELETE", headers: object, data: string | null, protocol: Stripe.HttpProtocol, timeout: number): Promise<Stripe.HttpClientResponse<object, never>> {
    if (host !== "api.stripe.com" || String(port) !== "443" || protocol !== "https" || method !== "GET" || data) throw new Error("Fictional GET-only transport");
    const projected = headers as Record<string, unknown>;
    this.calls.push({ path, method, timeout, version: projected["Stripe-Version"] });
    this.onRequest?.(path, this.calls.length);
    if (this.hang) return new Promise(() => {});
    if (this.delayMs) await new Promise(resolve => setTimeout(resolve, this.delayMs));
    const url = new URL(path, "https://fictional.invalid");
    let payload: object | undefined;
    if (url.pathname === "/v1/account") payload = this.account;
    else if (url.pathname === `/v1/customers/${binding.customerId}`) payload = this.customer;
    else if (url.pathname === `/v1/subscriptions/${binding.subscriptionId}`) payload = this.subscription;
    else for (const record of [this.current, this.previous]) {
      if (!record) continue;
      if (url.pathname === `/v1/invoices/${record.invoice.id}`) payload = record.invoice;
      else if (url.pathname === `/v1/invoices/${record.invoice.id}/lines`) payload = record.lines;
      else if (url.pathname === "/v1/invoice_payments" && url.searchParams.get("invoice") === record.invoice.id) payload = record.payments;
      else if (url.pathname === "/v1/invoice_payments" && url.searchParams.get("payment[payment_intent]") === record.intent.id) payload = record.allocations;
      else if (url.pathname === `/v1/payment_intents/${record.intent.id}`) payload = record.intent;
      else if (url.pathname === `/v1/charges/${record.charge.id}`) payload = record.charge;
      else if (url.pathname === "/v1/refunds" && url.searchParams.get("charge") === record.charge.id) payload = record.refunds;
      else if (url.pathname === "/v1/disputes" && url.searchParams.get("charge") === record.charge.id) payload = record.disputes;
      else if (url.pathname === "/v1/credit_notes" && url.searchParams.get("invoice") === record.invoice.id) payload = record.notes;
    }
    if (!payload) throw new Error("Unexpected fictional API path");
    const copy = structuredClone(this.statusCode === 200 ? payload : { error: { type: "permission_error", message: "Fictional permission failure" } });
    const status = this.statusCode;
    return { getStatusCode: () => status, getHeaders: () => ({ "content-type": "application/json", "request-id": "req_Fictional", "stripe-version": "2026-02-25.clover" }), getRawResponse: () => copy, toStream: () => { throw new Error("No fixture streaming"); }, toJSON: async () => copy };
  }
}
