import { beforeEach, afterEach, expect, it, vi } from "vitest";
import type Stripe from "stripe";
const state = vi.hoisted(() => ({ strict: false, mode: "test", session: {} as Stripe.Checkout.Session, retrieve: vi.fn(), current: {} as Stripe.Checkout.Session, refunded: 0, dispute: false, unavailable: false, charge: vi.fn() }));
vi.mock("../lib/stripe-config", () => {
  const client = {
    checkout: {sessions: {retrieve: async (...args: unknown[]) => { state.current = await state.retrieve(...args); return state.current; }}},
    paymentIntents: {retrieve: async (id: string) => { if (state.unavailable) throw new Error("Synthetic provider outage"); return {id,latest_charge:"ch_synthetic",status:"succeeded",livemode:state.current.livemode}; }},
    charges: {retrieve: state.charge},
    refunds: {list: async () => ({has_more:false,data:state.refunded ? [{id:"re_synthetic",charge:"ch_synthetic",currency:"usd",amount:state.refunded,status:"succeeded",created:20,balance_transaction:"txn_refund"}] : []})},
    disputes: {list: async () => ({has_more:false,data:state.dispute ? [{id:"dp_synthetic",charge:"ch_synthetic",currency:"usd",livemode:state.current.livemode,status:"needs_response",balance_transactions:[]}] : []})},
    balanceTransactions: {retrieve: async (id:string) => ({id,currency:"usd",amount:id === "txn_refund" ? -state.refunded : state.current.amount_total,created:id === "txn_refund" ? 20 : 10})}
  };
  return ({
  getStripeConfiguration: () => state.strict ? { mode:state.mode,accountId:"acct_synthetic",client } : null,
  getStripeRecoveryConfiguration: () => ({ mode:state.mode,client }),
  verifyStripeAccount: async () => "valid", isStripeConfigurationError: () => false, isStripeNotFoundError: () => false, isTransientStripeError: () => false
}); });
import { verifyPaidSession } from "../lib/stripe-fulfillment";
function session(legacy=false) {
  return { id:"cs_test_synthetic",payment_intent:"pi_synthetic",mode:"payment",status:"complete",payment_status:"paid",livemode:state.mode === "live",currency:"usd",amount_subtotal:4900,amount_total:4900,total_details:{amount_discount:0,amount_tax:0,amount_shipping:0},metadata:{plan:"starter",product_key:"everymcp-starter-kit",product_version:legacy?"2026-09-20":"2026-09-21",...legacy?{}:{pricing_policy:"usd4900-no-discount-v1"}},line_items:{data:[{quantity:1,price:{unit_amount:4900,currency:"usd",product:{name:"EveryMCP MCP Integration Starter Kit",metadata:{everymcp_product:"everymcp-starter-kit",product_version:"2026-09-21"}}}}]} } as unknown as Stripe.Checkout.Session;
}
beforeEach(() => { state.charge.mockImplementation(async (id:string) => ({id,payment_intent:"pi_synthetic",livemode:state.current.livemode,currency:"usd",status:"succeeded",paid:true,captured:true,amount:state.current.amount_total,amount_captured:state.current.amount_total,amount_refunded:state.refunded,balance_transaction:"txn_collect",disputed:state.dispute})); });
afterEach(() => {state.strict=false;state.mode="test";state.retrieve.mockReset();state.charge.mockReset();state.refunded=0;state.dispute=false;state.unavailable=false;});
it.each([
 ["valid",{},"paid"],
 ["legitimate tax",{amount_total:5390,total_details:{amount_discount:0,amount_tax:490,amount_shipping:0}},"paid"],
 ["discount",{amount_total:4400,total_details:{amount_discount:500,amount_tax:0,amount_shipping:0}},"not_paid"],
 ["unpaid",{payment_status:"unpaid"},"not_paid"],
 ["mismatched collected total",{amount_total:4899},"not_paid"],
 ["missing total detail",{total_details:null},"not_paid"],
 ["wrong mode",{livemode:true},"not_paid"]
] as const)("authoritative session mapping enforces new price policy: %s",async (_name,patch,status) => {state.strict=true;state.session={...session(),...patch} as Stripe.Checkout.Session;state.retrieve.mockResolvedValue(state.session);expect((await verifyPaidSession(state.session.id,"starter")).status).toBe(status);expect(state.retrieve).toHaveBeenCalledOnce();expect(state.charge).toHaveBeenCalledTimes(status === "paid" ? 1 : 0);});
it.each(["test","live"])("preserves legitimate reconciled historical %s paid rights through recovery configuration",async (mode)=>{state.mode=mode;const old=session(true);old.id=`cs_${mode}_synthetic`;old.amount_total=4900;state.retrieve.mockResolvedValue(old);expect((await verifyPaidSession(old.id,"starter")).status).toBe("paid");old.amount_total=4400;old.total_details!.amount_discount=500;expect((await verifyPaidSession(old.id,"starter")).status).toBe("paid");old.amount_total=4300;expect((await verifyPaidSession(old.id,"starter")).status).toBe("not_paid");});

it.each(["full refund","partial refund","open dispute","provider outage"])("composed authoritative reader preserves current rights: %s",async(kind)=>{
 state.strict=true;state.session=session();state.retrieve.mockResolvedValue(state.session);
 expect((await verifyPaidSession(state.session.id,"starter")).status).toBe("paid");
 if(kind==="full refund")state.refunded=4900;
 if(kind==="partial refund")state.refunded=1000;
 if(kind==="open dispute")state.dispute=true;
 if(kind==="provider outage")state.unavailable=true;
 const result=await verifyPaidSession(state.session.id,"starter");
 expect(result.status).toBe(kind==="partial refund"?"paid":kind==="provider outage"?"unavailable":"revoked");
 if(kind==="partial refund" && result.status==="paid")expect(result.rights).toMatchObject({netProductCents:3900,reason:"partial-refund"});
});
