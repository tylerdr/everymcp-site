import { afterEach, expect, it, vi } from "vitest";
import type Stripe from "stripe";
const state = vi.hoisted(() => ({ strict: false, mode: "test", session: {} as Stripe.Checkout.Session, retrieve: vi.fn() }));
vi.mock("../lib/stripe-config", () => ({
  getStripeConfiguration: () => state.strict ? { mode:state.mode,accountId:"acct_synthetic",client:{checkout:{sessions:{retrieve:state.retrieve}}} } : null,
  getStripeRecoveryConfiguration: () => ({ mode:state.mode,client:{checkout:{sessions:{retrieve:state.retrieve}}} }),
  verifyStripeAccount: async () => "valid", isStripeConfigurationError: () => false, isStripeNotFoundError: () => false, isTransientStripeError: () => false
}));
import { verifyPaidSession } from "../lib/stripe-fulfillment";
function session(legacy=false) {
  return { id:"cs_test_synthetic",mode:"payment",status:"complete",payment_status:"paid",livemode:state.mode === "live",currency:"usd",amount_subtotal:4900,amount_total:4900,total_details:{amount_discount:0,amount_tax:0,amount_shipping:0},metadata:{plan:"starter",product_key:"everymcp-starter-kit",product_version:legacy?"2026-09-20":"2026-09-21",...legacy?{}:{pricing_policy:"usd4900-no-discount-v1"}},line_items:{data:[{quantity:1,price:{unit_amount:4900,currency:"usd",product:{name:"EveryMCP MCP Integration Starter Kit",metadata:{everymcp_product:"everymcp-starter-kit",product_version:"2026-09-21"}}}}]} } as unknown as Stripe.Checkout.Session;
}
afterEach(() => {state.strict=false;state.mode="test";state.retrieve.mockReset();});
it.each([
 ["valid",{},"paid"],
 ["legitimate tax",{amount_total:5390,total_details:{amount_discount:0,amount_tax:490,amount_shipping:0}},"paid"],
 ["discount",{amount_total:4400,total_details:{amount_discount:500,amount_tax:0,amount_shipping:0}},"not_paid"],
 ["unpaid",{payment_status:"unpaid"},"not_paid"],
 ["mismatched collected total",{amount_total:4899},"not_paid"],
 ["missing total detail",{total_details:null},"not_paid"],
 ["wrong mode",{livemode:true},"not_paid"]
] as const)("authoritative session mapping enforces new price policy: %s",async (_name,patch,status) => {state.strict=true;state.session={...session(),...patch} as Stripe.Checkout.Session;state.retrieve.mockResolvedValue(state.session);expect((await verifyPaidSession(state.session.id,"starter")).status).toBe(status);expect(state.retrieve).toHaveBeenCalledOnce();});
it.each(["test","live"])("preserves legitimate reconciled historical %s paid rights through recovery configuration",async (mode)=>{state.mode=mode;const old=session(true);old.id=`cs_${mode}_synthetic`;old.amount_total=4900;state.retrieve.mockResolvedValue(old);expect((await verifyPaidSession(old.id,"starter")).status).toBe("paid");old.amount_total=4400;old.total_details!.amount_discount=500;expect((await verifyPaidSession(old.id,"starter")).status).toBe("paid");old.amount_total=4300;expect((await verifyPaidSession(old.id,"starter")).status).toBe("not_paid");});
