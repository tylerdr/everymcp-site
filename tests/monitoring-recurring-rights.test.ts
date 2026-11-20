import { afterEach, describe, expect, it, vi } from "vitest";
import { createRecurringRightsReader } from "../lib/monitoring/recurring-rights";
import { binding, config, END, FictionalRecurringHttp, NOW, START } from "./fixtures/monitoring-node/recurring-provider-fixture";

const clone = <T,>(value: T): T => structuredClone(value);
const reader = (http: FictionalRecurringHttp) => createRecurringRightsReader(config, { httpClient: http });
function refund(http: FictionalRecurringHttp, status = "succeeded") {
  return { id: "re_Fictional", object: "refund", charge: http.current.charge.id, payment_intent: http.current.intent.id, currency: "usd", amount: 100, status };
}
function dispute(http: FictionalRecurringHttp, status: string) {
  return { id: "dp_Fictional", object: "dispute", charge: http.current.charge.id, payment_intent: http.current.intent.id, currency: "usd", amount: 1200, livemode: false, status };
}
afterEach(() => vi.useRealTimers());

describe("fresh narrow recurring billing rights via real Stripe SDK and fictional HTTP", () => {
  it("traverses the exact modern graph and returns only current authorization after fresh rereads", async () => {
    const http = new FictionalRecurringHttp(), result = await reader(http)(binding);
    expect(result).toEqual({ decision: "active", reason: "current_paid_subscription", authorization: { policy: config.policy, scope: binding.scope, ownerKey: binding.ownerKey, customerId: binding.customerId, subscriptionId: binding.subscriptionId, invoiceId: "in_Current", periodStart: new Date(START * 1000).toISOString(), periodEnd: new Date(END * 1000).toISOString() } });
    expect(http.calls).toHaveLength(14);
    expect(http.calls[0].path).toBe("/v1/account");
    expect(http.calls[1].path).toBe(`/v1/customers/${binding.customerId}`);
    expect(http.calls.every(call => call.method === "GET" && call.timeout <= 1500 && call.version === "2026-02-25.clover")).toBe(true);
    expect(http.calls.filter(call => call.path.includes("limit=")).every(call => new URL(call.path, "https://fictional.invalid").searchParams.get("limit") === "100")).toBe(true);
    expect(http.calls.some(call => new URL(call.path, "https://fictional.invalid").searchParams.get("payment[payment_intent]") === "pi_Current")).toBe(true);
  });

  it("strictly parses configuration and never reads environment or caller paid flags", async () => {
    for (const change of [{ extra: true }, { secretKey: "rk_live_Fictional" }, { intervalCount: 13 }, { currency: "USD" }, { now: "not a function" }, { policy: "kit-purchase" }]) {
      expect(() => createRecurringRightsReader({ ...config, ...change })).toThrow("Invalid recurring rights configuration");
    }
    const http = new FictionalRecurringHttp();
    expect((await reader(http)({ ...binding, paid: true } as typeof binding)).decision).toBe("unknown");
    expect(http.calls).toHaveLength(0);
    expect((await reader(http)({ ...binding, enabled: false })).decision).toBe("denied");
    expect(http.calls).toHaveLength(0);
  });

  it("refuses wrong account before reading subscriptions and checks fresh account identity every call", async () => {
    const http = new FictionalRecurringHttp(), read = reader(http);
    http.account.id = "acct_Other";
    expect(await read(binding)).toEqual({ decision: "denied", reason: "provider_account_mismatch" });
    expect(http.calls).toHaveLength(1);
    http.account.id = config.scope.accountId;
    expect((await read(binding)).decision).toBe("active");
    expect(http.calls.filter(call => call.path === "/v1/account")).toHaveLength(2);
    http.account.id = "acct_Changed";
    expect((await read(binding)).decision).toBe("denied");
  });

  it("rejects wrong mode/customer/product/price and one-time kit prices", async () => {
    const changes = [
      (http: FictionalRecurringHttp) => { http.customer.livemode = true; },
      (http: FictionalRecurringHttp) => { http.subscription.customer = "cus_Other"; },
      (http: FictionalRecurringHttp) => { http.subscription.items.data[0].price.id = "price_Kit"; },
      (http: FictionalRecurringHttp) => { http.subscription.items.data[0].price.product = "prod_Kit"; },
      (http: FictionalRecurringHttp) => { http.subscription.items.data[0].price.type = "one_time"; },
      (http: FictionalRecurringHttp) => { http.current.invoice.customer = "cus_Other"; },
      (http: FictionalRecurringHttp) => { http.current.invoice.parent.subscription_details.subscription = "sub_Other"; },
      (http: FictionalRecurringHttp) => { http.current.lines.data[0].pricing.price_details.price = "price_Kit"; },
      (http: FictionalRecurringHttp) => { http.current.intent.customer = "cus_Other"; },
      (http: FictionalRecurringHttp) => { http.current.charge.payment_intent = "pi_Other"; },
    ];
    for (const change of changes) { const http = new FictionalRecurringHttp(); change(http); expect((await reader(http)(binding)).decision).toBe("denied"); }
  });

  it("denies unpaid, expired and immediately canceled service but respects scheduled period-end cancellation", async () => {
    for (const status of ["canceled", "unpaid", "past_due", "incomplete", "incomplete_expired", "trialing"]) {
      const http = new FictionalRecurringHttp(); http.subscription.status = status;
      expect((await reader(http)(binding)).decision).toBe("denied");
    }
    const expired = new FictionalRecurringHttp(); expired.subscription.items.data[0].current_period_end = START + 1;
    expect((await reader(expired)(binding)).decision).toBe("denied");
    const scheduled = new FictionalRecurringHttp();
    scheduled.subscription.cancel_at_period_end = true; scheduled.subscription.cancel_at = END; scheduled.subscription.canceled_at = START + 20;
    expect((await reader(scheduled)(binding)).decision).toBe("active");
    scheduled.subscription.cancel_at = END - 100;
    expect((await reader(scheduled)(binding)).decision).toBe("unknown");
    const unpaid = new FictionalRecurringHttp(); unpaid.current.invoice.status = "open";
    expect((await reader(unpaid)(binding)).decision).toBe("denied");
  });

  it("does not infer rights from active status with pause, pending changes or schedules", async () => {
    for (const change of [
      (http: FictionalRecurringHttp) => { http.subscription.status = "paused"; },
      (http: FictionalRecurringHttp) => { http.subscription.pause_collection = { behavior: "void" }; },
      (http: FictionalRecurringHttp) => { http.subscription.pending_update = { expires_at: END }; },
      (http: FictionalRecurringHttp) => { http.subscription.schedule = "sub_sched_Fictional"; },
    ]) { const http = new FictionalRecurringHttp(); change(http); expect((await reader(http)(binding)).decision).toBe("unknown"); }
  });

  it("denies successful partial refunds and leaves pending refunds unknown", async () => {
    const http = new FictionalRecurringHttp(); http.current.refunds.data = [refund(http)]; http.current.charge.amount_refunded = 100;
    expect(http.current.charge.refunded).toBe(false);
    expect(await reader(http)(binding)).toEqual({ decision: "denied", reason: "payment_refunded" });
    http.current.refunds.data[0].status = "pending"; http.current.charge.amount_refunded = 0;
    expect((await reader(http)(binding)).decision).toBe("unknown");
    http.current.refunds.data[0].status = "failed";
    expect((await reader(http)(binding)).decision).toBe("active");
  });

  it("checks independent credit notes even when the invoice is paid and charge has no refund", async () => {
    const http = new FictionalRecurringHttp();
    http.current.notes.data = [{ id: "cn_Fictional", object: "credit_note", invoice: http.current.invoice.id, customer: binding.customerId, currency: "usd", livemode: false, amount: 100, status: "issued", voided_at: null, out_of_band_amount: 100 }];
    expect(await reader(http)(binding)).toEqual({ decision: "denied", reason: "invoice_credit_note_issued" });
    expect(http.calls.some(call => call.path.startsWith("/v1/credit_notes"))).toBe(true);
    const total = new FictionalRecurringHttp(); total.current.invoice.post_payment_credit_notes_amount = 100;
    expect((await reader(total)(binding)).decision).toBe("denied");
  });

  it("denies open/lost disputes and refuses automatic restoration after won/closed warnings", async () => {
    for (const status of ["warning_needs_response", "warning_under_review", "needs_response", "under_review", "lost", "won", "warning_closed", "prevented"]) {
      const http = new FictionalRecurringHttp(); http.current.disputes.data = [dispute(http, status)]; http.current.charge.disputed = true;
      expect((await reader(http)(binding)).decision).toBe(["won", "warning_closed", "prevented"].includes(status) ? "unknown" : "denied");
    }
  });

  it("refuses split/out-of-band payments, mixed/proration lines and balance/discount/tax ambiguity", async () => {
    for (const change of [
      (http: FictionalRecurringHttp) => { http.current.payments.data.push(clone(http.current.payments.data[0])); },
      (http: FictionalRecurringHttp) => { http.current.payments.data[0].payment.type = "payment_record"; },
      (http: FictionalRecurringHttp) => { http.current.allocations.data.push(clone(http.current.allocations.data[0])); },
      (http: FictionalRecurringHttp) => { http.current.lines.data.push(clone(http.current.lines.data[0])); },
      (http: FictionalRecurringHttp) => { http.subscription.items.data.push(clone(http.subscription.items.data[0])); },
      (http: FictionalRecurringHttp) => { http.current.lines.data[0].parent.subscription_item_details.proration = true; },
      (http: FictionalRecurringHttp) => { http.current.invoice.starting_balance = -100; },
      (http: FictionalRecurringHttp) => { http.current.invoice.discounts = ["di_Fictional"]; },
      (http: FictionalRecurringHttp) => { Object.assign(http.current.invoice, { total_taxes: [{ amount: 100 }] }); },
      (http: FictionalRecurringHttp) => { http.current.intent.amount_received = 1000; },
      (http: FictionalRecurringHttp) => { http.current.charge.amount_captured = 1000; },
    ]) { const http = new FictionalRecurringHttp(); change(http); expect((await reader(http)(binding)).decision).toBe("unknown"); }
  });

  it("requires complete bounded pages rather than silently ignoring extra evidence", async () => {
    for (const change of [
      (http: FictionalRecurringHttp) => { http.subscription.items.has_more = true; },
      (http: FictionalRecurringHttp) => { http.current.lines.has_more = true; },
      (http: FictionalRecurringHttp) => { http.current.payments.has_more = true; },
      (http: FictionalRecurringHttp) => { http.current.refunds.has_more = true; },
      (http: FictionalRecurringHttp) => { http.current.disputes.has_more = true; },
      (http: FictionalRecurringHttp) => { http.current.notes.has_more = true; },
    ]) { const http = new FictionalRecurringHttp(); change(http); expect((await reader(http)(binding)).decision).toBe("unknown"); expect(http.calls.length).toBeLessThanOrEqual(24); }
  });

  it("independently checks a prior original invoice and still returns the current authorization", async () => {
    const http = new FictionalRecurringHttp(), original = http.previousAuthorization();
    const result = await reader(http)(binding, original);
    expect(result.decision).toBe("active"); expect(result.authorization?.invoiceId).toBe("in_Current");
    expect(http.calls).toHaveLength(24);
    expect(http.calls.filter(call => call.path === "/v1/invoices/in_Previous")).toHaveLength(2);
    http.previous!.refunds.data = [{ ...refund(http), charge: "ch_Previous", payment_intent: "pi_Previous" }];
    expect((await reader(http)(binding, original)).decision).toBe("denied");
    const forged = { ...original, ownerKey: "b".repeat(64) };
    const isolated = new FictionalRecurringHttp();
    expect((await reader(isolated)(binding, forged)).decision).toBe("denied"); expect(isolated.calls).toHaveLength(0);
    const period = new FictionalRecurringHttp(), saved = period.previousAuthorization();
    const wrongPeriod = { ...saved, periodStart: new Date(START * 1000 - 1000).toISOString() };
    expect((await reader(period)(binding, wrongPeriod)).decision).toBe("unknown");
    const foreign = new FictionalRecurringHttp(), foreignOriginal = foreign.previousAuthorization();
    foreign.previous!.invoice.customer = "cus_Other";
    expect((await reader(foreign)(binding, foreignOriginal)).decision).toBe("denied");
  });

  it("checks exact stored authorization even when its invoice is still the current invoice", async () => {
    const http = new FictionalRecurringHttp(), read = reader(http), initial = await read(binding);
    expect(initial.authorization).toBeDefined();
    expect((await read(binding, initial.authorization)).decision).toBe("active");
    const wrong = { ...initial.authorization!, periodStart: new Date(START * 1000 + 1000).toISOString() };
    expect((await read(binding, wrong)).decision).toBe("denied");
  });

  it("rereads current service and invoice status before granting, including recovery", async () => {
    const http = new FictionalRecurringHttp(); let reads = 0;
    http.onRequest = path => { if (path === `/v1/subscriptions/${binding.subscriptionId}` && ++reads === 2) http.subscription.status = "past_due"; };
    expect((await reader(http)(binding)).decision).toBe("denied");
    const invoice = new FictionalRecurringHttp(); let invoices = 0;
    invoice.onRequest = path => { if (path === "/v1/invoices/in_Current" && ++invoices === 2) invoice.current.invoice.status = "void"; };
    expect((await reader(invoice)(binding)).decision).toBe("denied");
    const currentRequired = new FictionalRecurringHttp(), original = currentRequired.previousAuthorization(); currentRequired.subscription.status = "canceled";
    expect((await reader(currentRequired)(binding, original)).decision).toBe("denied");
  });

  it("fails unknown on provider permission errors, malformed responses and bounded timeouts without retry", async () => {
    const denied = new FictionalRecurringHttp(); denied.statusCode = 403;
    expect((await reader(denied)(binding)).decision).toBe("unknown"); expect(denied.calls).toHaveLength(1);
    const malformed = new FictionalRecurringHttp(); Object.assign(malformed.customer, { deleted: true });
    expect((await reader(malformed)(binding)).decision).toBe("unknown");
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const hanging = new FictionalRecurringHttp(); hanging.hang = true;
    const promise = reader(hanging)(binding); await vi.advanceTimersByTimeAsync(1600);
    expect((await promise).decision).toBe("unknown"); expect(hanging.calls).toHaveLength(1);
  });

  it("enforces the total 20-second deadline across a multi-invoice read", async () => {
    vi.useFakeTimers({ toFake: ["performance", "setTimeout", "clearTimeout"] });
    const http = new FictionalRecurringHttp(); http.delayMs = 1400;
    const promise = reader(http)(binding, http.previousAuthorization());
    await vi.advanceTimersByTimeAsync(20001);
    expect((await promise).decision).toBe("unknown"); expect(http.calls.length).toBeLessThanOrEqual(24);
    expect(NOW).toBe("2026-11-12T00:00:00.000Z");
  });
});
