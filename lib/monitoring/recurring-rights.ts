import Stripe from "stripe";
import { z } from "zod";
import { billingAuthorizationSchema, billingBindingSchema, controlEqual, RIGHTS_POLICY, type BillingAuthorization, type BillingBinding } from "./control-contract";
import { scopeSchema } from "./runtime";

const configSchema = z.object({ scope: scopeSchema, secretKey: z.string().regex(/^(?:sk|rk)_(?:test|live)_[A-Za-z0-9]+$/), productId: z.string().regex(/^prod_[A-Za-z0-9]+$/), priceId: z.string().regex(/^price_[A-Za-z0-9]+$/), currency: z.string().regex(/^[a-z]{3}$/), interval: z.enum(["month", "year"]), intervalCount: z.number().int().min(1).max(12), policy: z.literal(RIGHTS_POLICY) }).strict();
export type RecurringRightsConfig = z.infer<typeof configSchema> & { now: () => Date };
export type RecurringRightsDecision = { decision: "active" | "denied" | "unknown"; reason: string; authorization?: BillingAuthorization };
class Refusal extends Error { constructor(readonly decision: "denied" | "unknown", readonly reason: string) { super(reason); } }
function need(condition: unknown, reason: string, decision: "denied" | "unknown" = "unknown"): asserts condition { if (!condition) throw new Refusal(decision, reason); }
function config(value: unknown): RecurringRightsConfig {
  try {
    need(value && typeof value === "object" && !Array.isArray(value), "configuration_unavailable");
    const { now, ...data } = value as Record<string, unknown>;
    need(typeof now === "function", "configuration_unavailable");
    const parsed = configSchema.parse(data);
    need(parsed.secretKey.startsWith(`sk_${parsed.scope.mode}_`) || parsed.secretKey.startsWith(`rk_${parsed.scope.mode}_`), "configuration_unavailable");
    return { ...parsed, now: now as () => Date };
  } catch { throw new Error("Invalid recurring rights configuration"); }
}
const number = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const reference = z.union([z.string().min(1), z.object({ id: z.string().min(1), deleted: z.literal(false).optional() })]);
const id = (value: z.infer<typeof reference>) => typeof value === "string" ? value : value.id;
const empty = z.array(z.unknown()).max(0);
const list = <T extends z.ZodType>(item: T) => z.object({ object: z.literal("list"), data: z.array(item).max(100), has_more: z.literal(false) });
const priceSchema = z.object({ id: z.string(), livemode: z.boolean(), product: reference, type: z.string(), currency: z.string(), recurring: z.object({ interval: z.string(), interval_count: number, usage_type: z.string() }).nullable(), billing_scheme: z.string(), unit_amount: number.nullable(), unit_amount_decimal: z.string().nullable(), custom_unit_amount: z.null(), transform_quantity: z.null() });
const itemSchema = z.object({ id: z.string(), subscription: z.string(), quantity: number, current_period_start: number, current_period_end: number, billing_thresholds: z.null(), discounts: empty, price: priceSchema });
const subscriptionSchema = z.object({ id: z.string(), object: z.literal("subscription"), livemode: z.boolean(), customer: reference, currency: z.string(), status: z.string(), items: list(itemSchema), latest_invoice: reference.nullable(), cancel_at: number.nullable(), cancel_at_period_end: z.boolean(), canceled_at: number.nullable(), ended_at: number.nullable(), pause_collection: z.unknown(), pending_update: z.unknown(), pending_setup_intent: reference.nullable(), schedule: reference.nullable(), discounts: empty, on_behalf_of: reference.nullable(), transfer_data: z.unknown() });
const invoiceSchema = z.object({ id: z.string(), object: z.literal("invoice"), livemode: z.boolean(), customer: reference.nullable(), customer_account: z.string().nullable(), currency: z.string(), status: z.string().nullable(), parent: z.object({ type: z.string(), subscription_details: z.object({ subscription: reference }).nullable() }).nullable(), billing_reason: z.string().nullable(), collection_method: z.string(), amount_due: number, amount_paid: number, amount_remaining: number, amount_overpaid: number, total: z.number().int(), subtotal: z.number().int(), starting_balance: z.number().int(), ending_balance: z.number().int().nullable(), pre_payment_credit_notes_amount: number, post_payment_credit_notes_amount: number, discounts: empty, total_discount_amounts: empty.nullable(), total_pretax_credit_amounts: empty.nullable(), total_taxes: empty.nullable(), status_transitions: z.object({ paid_at: number.nullable(), finalized_at: number.nullable() }), from_invoice: z.null(), on_behalf_of: reference.nullable() });
const lineSchema = z.object({ id: z.string(), invoice: z.string().nullable(), livemode: z.boolean(), amount: z.number().int(), subtotal: z.number().int(), currency: z.string(), quantity: number.nullable(), parent: z.object({ type: z.string(), subscription_item_details: z.object({ subscription: z.string().nullable(), subscription_item: z.string(), proration: z.boolean() }).nullable() }).nullable(), pricing: z.object({ type: z.string(), price_details: z.object({ price: reference, product: z.string() }).optional(), unit_amount_decimal: z.string().nullable() }).nullable(), period: z.object({ start: number, end: number }), discounts: empty, discount_amounts: empty.nullable(), pretax_credit_amounts: empty.nullable(), taxes: empty.nullable() });
const paymentSchema = z.object({ id: z.string(), object: z.literal("invoice_payment"), invoice: reference, livemode: z.boolean(), currency: z.string(), status: z.string(), amount_paid: number.nullable(), amount_requested: number, payment: z.object({ type: z.string(), payment_intent: reference.optional() }) });
const intentSchema = z.object({ id: z.string(), object: z.literal("payment_intent"), livemode: z.boolean(), customer: reference.nullable(), customer_account: z.string().nullable(), currency: z.string(), status: z.string(), amount: number, amount_received: number, amount_capturable: number, latest_charge: reference.nullable(), on_behalf_of: reference.nullable(), transfer_data: z.unknown(), application_fee_amount: number.nullable() });
const chargeSchema = z.object({ id: z.string(), object: z.literal("charge"), livemode: z.boolean(), customer: reference.nullable(), currency: z.string(), status: z.string(), paid: z.boolean(), captured: z.boolean(), amount: number, amount_captured: number, amount_refunded: number, refunded: z.boolean(), disputed: z.boolean(), payment_intent: reference.nullable(), on_behalf_of: reference.nullable(), transfer_data: z.unknown(), application_fee_amount: number.nullable() });
type Subscription = z.infer<typeof subscriptionSchema>;
type Invoice = z.infer<typeof invoiceSchema>;

/** Explicit draft policy: current paid service is required for generation AND historical recovery.
 * This reader performs no enrollment, mutation, entitlement write or cash/MRR accounting. */
export function createRecurringRightsReader(input: unknown, options: { httpClient?: Stripe.HttpClient } = {}) {
  const settings = config(input), mode = settings.scope.mode === "live";
  const transport = options.httpClient ?? Stripe.createNodeHttpClient();
  // Each evaluation gets its own SDK/transport budget; no account/subscription result is cached.
  return async (value: BillingBinding, original?: BillingAuthorization): Promise<RecurringRightsDecision> => {
    const deadline = performance.now() + 20000;
    let requests = 0;
    async function bounded<T>(promise: Promise<T>, end: number): Promise<T> {
      let timer: ReturnType<typeof setTimeout> | undefined;
      try { return await Promise.race([promise, new Promise<never>((_resolve, reject) => { timer = setTimeout(() => reject(new Refusal("unknown", "provider_deadline")), Math.max(0, end - performance.now())); })]); }
      finally { clearTimeout(timer); }
    }
    const client = new Stripe(settings.secretKey, {
      apiVersion: "2026-02-25.clover", maxNetworkRetries: 0, timeout: 1500,
      httpClient: {
        getClientName: () => "bounded-recurring-rights",
        async makeRequest(host, port, path, method, headers, data, protocol, timeout) {
          need(method === "GET" && host === "api.stripe.com" && String(port) === "443" && protocol === "https" && ++requests <= 24 && performance.now() < deadline, "provider_budget");
          const end = Math.min(deadline, performance.now() + 1500);
          const response = await bounded(transport.makeRequest(host, port, path, method, headers, data, protocol, Math.min(timeout, Math.max(1, end - performance.now()))), end);
          return { getStatusCode: () => response.getStatusCode(), getHeaders: () => response.getHeaders(), getRawResponse: () => response.getRawResponse(), toStream: callback => response.toStream(callback), toJSON: () => bounded(response.toJSON(), end) };
        },
      },
    });
    const seconds = () => { const date = settings.now(); need(date instanceof Date && Number.isFinite(date.getTime()), "clock_unavailable"); return date.getTime() / 1000; };
    const sameMode = (actual: boolean) => need(actual === mode, "provider_mode_mismatch", "denied");
    try {
      const binding = billingBindingSchema.parse(value);
      need(controlEqual(binding.scope, settings.scope), "binding_scope_mismatch", "denied");
      need(binding.enabled, "binding_disabled", "denied");
      const initialTime = seconds();
      const previous = original === undefined ? undefined : billingAuthorizationSchema.parse(original);
      if (previous) need(controlEqual(previous.scope, binding.scope) && previous.ownerKey === binding.ownerKey && previous.customerId === binding.customerId && previous.subscriptionId === binding.subscriptionId && Date.parse(previous.periodStart) < Date.parse(previous.periodEnd), "original_binding_mismatch", "denied");
      const account = z.object({ id: z.string(), object: z.literal("account") }).parse(await client.accounts.retrieve());
      need(account.id === settings.scope.accountId, "provider_account_mismatch", "denied");
      const customer = z.object({ id: z.string(), object: z.literal("customer"), livemode: z.boolean(), deleted: z.literal(false).optional() }).parse(await client.customers.retrieve(binding.customerId));
      sameMode(customer.livemode); need(customer.id === binding.customerId, "provider_customer_mismatch", "denied");
      function checkSubscription(raw: unknown, at: number): Subscription {
        const sub = subscriptionSchema.parse(raw); sameMode(sub.livemode);
        need(sub.id === binding.subscriptionId && id(sub.customer) === binding.customerId, "subscription_binding_mismatch", "denied");
        need(sub.currency === settings.currency, "subscription_currency_mismatch", "denied");
        need(sub.status !== "paused", "subscription_paused");
        need(sub.status === "active" && sub.ended_at === null, "subscription_inactive", "denied");
        need(sub.pause_collection === null && sub.pending_update === null && sub.pending_setup_intent === null && sub.schedule === null && sub.on_behalf_of === null && sub.transfer_data === null, "subscription_unsupported_state");
        need(sub.items.data.length === 1, "subscription_mixed_items");
        const item = sub.items.data[0], price = item.price; sameMode(price.livemode);
        need(item.subscription === sub.id && item.quantity === 1, "subscription_item_mismatch", "denied");
        need(price.id === settings.priceId && id(price.product) === settings.productId && price.currency === settings.currency && price.type === "recurring", "recurring_price_mismatch", "denied");
        need(price.recurring && price.recurring.interval === settings.interval && price.recurring.interval_count === settings.intervalCount && price.recurring.usage_type === "licensed" && price.billing_scheme === "per_unit" && price.unit_amount !== null && price.unit_amount > 0 && price.unit_amount_decimal === String(price.unit_amount), "recurring_price_unsupported");
        need(item.current_period_start < item.current_period_end, "subscription_period_malformed");
        need(at >= item.current_period_start && at < item.current_period_end, "subscription_period_inactive", "denied");
        need(sub.cancel_at === null || sub.cancel_at === item.current_period_end, "subscription_cancellation_ambiguous");
        need(sub.latest_invoice !== null, "subscription_invoice_missing"); return sub;
      }
      const subscription = checkSubscription(await client.subscriptions.retrieve(binding.subscriptionId), initialTime), item = subscription.items.data[0];
      const currentInvoiceId = id(subscription.latest_invoice!);
      async function checkInvoice(invoiceId: string, start: number, end: number): Promise<Invoice> {
        const invoice = invoiceSchema.parse(await client.invoices.retrieve(invoiceId)); sameMode(invoice.livemode);
        need(invoice.id === invoiceId && invoice.customer && id(invoice.customer) === binding.customerId && invoice.customer_account === null && invoice.parent?.type === "subscription_details" && invoice.parent.subscription_details && id(invoice.parent.subscription_details.subscription) === binding.subscriptionId, "invoice_binding_mismatch", "denied");
        need(invoice.currency === settings.currency, "invoice_currency_mismatch", "denied");
        need(invoice.status === "paid", "invoice_unpaid", "denied");
        need(invoice.pre_payment_credit_notes_amount === 0 && invoice.post_payment_credit_notes_amount === 0, "invoice_credited", "denied");
        need(["subscription_create", "subscription_cycle"].includes(invoice.billing_reason ?? "") && invoice.collection_method === "charge_automatically" && invoice.on_behalf_of === null, "invoice_unsupported_settlement");
        need(invoice.amount_due > 0 && invoice.amount_due === invoice.amount_paid && invoice.amount_due === invoice.total && invoice.total === invoice.subtotal && invoice.amount_remaining === 0 && invoice.amount_overpaid === 0 && invoice.starting_balance === 0 && invoice.ending_balance === 0, "invoice_ambiguous_amounts");
        need(invoice.status_transitions.paid_at !== null && invoice.status_transitions.finalized_at !== null && invoice.status_transitions.finalized_at <= invoice.status_transitions.paid_at && invoice.status_transitions.paid_at <= seconds(), "invoice_payment_time_unavailable");
        const lines = list(lineSchema).parse(await client.invoices.listLineItems(invoiceId, { limit: 100 }));
        need(lines.data.length === 1, "invoice_mixed_lines");
        const line = lines.data[0]; sameMode(line.livemode);
        need(line.invoice === invoiceId && line.parent?.type === "subscription_item_details" && line.parent.subscription_item_details?.subscription === binding.subscriptionId && line.parent.subscription_item_details.subscription_item === item.id, "invoice_line_binding_mismatch", "denied");
        need(!line.parent.subscription_item_details.proration && line.quantity === 1 && line.period.start === start && line.period.end === end, "invoice_period_unsupported");
        need(line.pricing?.type === "price_details" && line.pricing.price_details && id(line.pricing.price_details.price) === settings.priceId && line.pricing.price_details.product === settings.productId && line.currency === settings.currency, "invoice_price_mismatch", "denied");
        need(line.amount === item.price.unit_amount && line.subtotal === line.amount && invoice.total === line.amount && line.pricing.unit_amount_decimal === String(line.amount), "invoice_price_amount_unsupported");
        const payments = list(paymentSchema).parse(await client.invoicePayments.list({ invoice: invoiceId, limit: 100 }));
        need(payments.data.length === 1, "invoice_split_payment");
        const payment = payments.data[0]; sameMode(payment.livemode);
        need(id(payment.invoice) === invoiceId && payment.currency === settings.currency && payment.status === "paid" && payment.amount_paid === invoice.amount_paid && payment.amount_requested === invoice.amount_due && payment.payment.type === "payment_intent" && payment.payment.payment_intent, "invoice_payment_unsupported");
        const intentId = id(payment.payment.payment_intent);
        const allocations = list(paymentSchema).parse(await client.invoicePayments.list({ payment: { type: "payment_intent", payment_intent: intentId }, limit: 100 }));
        need(allocations.data.length === 1 && controlEqual(allocations.data[0], payment), "payment_allocation_ambiguous");
        const intent = intentSchema.parse(await client.paymentIntents.retrieve(intentId)); sameMode(intent.livemode);
        need(intent.id === intentId && intent.customer && id(intent.customer) === binding.customerId && intent.customer_account === null && intent.currency === settings.currency, "payment_binding_mismatch", "denied");
        need(intent.status === "succeeded", "payment_incomplete", "denied");
        need(intent.amount === invoice.amount_paid && intent.amount_received === intent.amount && intent.amount_capturable === 0 && intent.latest_charge && intent.on_behalf_of === null && intent.transfer_data === null && intent.application_fee_amount === null, "payment_amount_unsupported");
        const chargeId = id(intent.latest_charge), charge = chargeSchema.parse(await client.charges.retrieve(chargeId)); sameMode(charge.livemode);
        need(charge.id === chargeId && charge.customer && id(charge.customer) === binding.customerId && charge.payment_intent && id(charge.payment_intent) === intentId && charge.currency === settings.currency, "charge_binding_mismatch", "denied");
        need(charge.status === "succeeded" && charge.paid && charge.captured, "charge_unpaid", "denied");
        need(charge.amount === intent.amount && charge.amount_captured === charge.amount && charge.on_behalf_of === null && charge.transfer_data === null && charge.application_fee_amount === null, "charge_amount_unsupported");
        const refunds = list(z.object({ id: z.string(), object: z.literal("refund"), charge: reference.nullable(), payment_intent: reference.nullable(), currency: z.string(), amount: number, status: z.string().nullable() })).parse(await client.refunds.list({ charge: chargeId, limit: 100 }));
        for (const refund of refunds.data) {
          need(refund.charge && id(refund.charge) === chargeId && refund.payment_intent && id(refund.payment_intent) === intentId && refund.currency === settings.currency && refund.amount > 0 && refund.amount <= charge.amount, "refund_binding_unavailable");
          need(refund.status !== "succeeded", "payment_refunded", "denied");
          need(refund.status === "failed" || refund.status === "canceled", "refund_pending_or_unknown");
        }
        need(charge.amount_refunded === 0 && !charge.refunded, "refund_state_ambiguous");
        const disputes = list(z.object({ id: z.string(), object: z.literal("dispute"), charge: reference, payment_intent: reference.nullable(), currency: z.string(), amount: number, livemode: z.boolean(), status: z.string() })).parse(await client.disputes.list({ charge: chargeId, limit: 100 }));
        for (const dispute of disputes.data) {
          sameMode(dispute.livemode);
          need(id(dispute.charge) === chargeId && dispute.payment_intent && id(dispute.payment_intent) === intentId && dispute.currency === settings.currency && dispute.amount > 0 && dispute.amount <= charge.amount, "dispute_binding_unavailable");
          need(!["warning_needs_response", "warning_under_review", "needs_response", "under_review", "lost"].includes(dispute.status), "payment_disputed", "denied");
          throw new Refusal("unknown", "dispute_restoration_unsupported");
        }
        need(!charge.disputed, "dispute_state_ambiguous");
        const notes = list(z.object({ id: z.string(), object: z.literal("credit_note"), invoice: reference, customer: reference, currency: z.string(), livemode: z.boolean(), amount: number, status: z.string(), voided_at: number.nullable() })).parse(await client.creditNotes.list({ invoice: invoiceId, limit: 100 }));
        for (const note of notes.data) {
          sameMode(note.livemode);
          need(id(note.invoice) === invoiceId && id(note.customer) === binding.customerId && note.currency === settings.currency, "credit_note_binding_unavailable");
          need(note.status !== "issued", "invoice_credit_note_issued", "denied");
          need(note.status === "void" && note.voided_at !== null && note.voided_at <= seconds(), "credit_note_state_unsupported");
        }
        return invoice;
      }
      const currentInvoice = await checkInvoice(currentInvoiceId, item.current_period_start, item.current_period_end);
      const authorization: BillingAuthorization = { policy: RIGHTS_POLICY, scope: binding.scope, ownerKey: binding.ownerKey, customerId: binding.customerId, subscriptionId: binding.subscriptionId, invoiceId: currentInvoiceId, periodStart: new Date(item.current_period_start * 1000).toISOString(), periodEnd: new Date(item.current_period_end * 1000).toISOString() };
      let priorInvoice: Invoice | undefined;
      if (previous) {
        if (previous.invoiceId === currentInvoiceId) need(controlEqual(previous, authorization), "original_period_mismatch", "denied");
        else {
          const start = Date.parse(previous.periodStart) / 1000, end = Date.parse(previous.periodEnd) / 1000;
          need(end <= item.current_period_start, "original_period_unsupported");
          priorInvoice = await checkInvoice(previous.invoiceId, start, end);
        }
      }
      const fresh = checkSubscription(await client.subscriptions.retrieve(binding.subscriptionId), seconds());
      need(controlEqual(fresh, subscription), "subscription_changed_during_check");
      async function recheckInvoice(invoiceId: string, earlier: Invoice) {
        const freshInvoice = invoiceSchema.parse(await client.invoices.retrieve(invoiceId));
        need(freshInvoice.status === "paid", "invoice_unpaid", "denied");
        need(freshInvoice.pre_payment_credit_notes_amount === 0 && freshInvoice.post_payment_credit_notes_amount === 0, "invoice_credited", "denied");
        need(controlEqual(freshInvoice, earlier), "invoice_changed_during_check");
      }
      await recheckInvoice(currentInvoiceId, currentInvoice);
      if (previous && priorInvoice) await recheckInvoice(previous.invoiceId, priorInvoice);
      need(performance.now() < deadline, "provider_deadline");
      return { decision: "active", reason: "current_paid_subscription", authorization };
    } catch (error) {
      return error instanceof Refusal ? { decision: error.decision, reason: error.reason } : { decision: "unknown", reason: "provider_evidence_unavailable" };
    }
  };
}
