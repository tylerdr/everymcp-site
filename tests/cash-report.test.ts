import { beforeEach, expect, it, vi } from "vitest";
const state=vi.hoisted(()=>({mode:"live",fail:false,more:false,calls:0}));
vi.mock("../lib/stripe-config",()=>({getStripeConfiguration:()=>({accountId:"acct_seller",mode:state.mode,client:{checkout:{sessions:{list:async()=>{state.calls++;return {has_more:state.more,data:[{id:"cs_owned",metadata:{product_key:"everymcp-starter-kit"},payment_status:"paid"},{id:"cs_other",metadata:{product_key:"other"}}]};}}}}}),verifyStripeAccount:async()=>"valid"}));
vi.mock("../lib/stripe-fulfillment",()=>({verifyPaidSession:async()=>state.fail?{status:"unavailable"}:{status:"revoked",session:{livemode:state.mode==="live"},rights:{allowed:false,reason:"refunded",collectedCents:4900,refundedCents:4900,taxCents:0,netProductCents:0,test:state.mode!=="live",entries:[{id:"txn_old",kind:"collection",created:1,productCents:4900},{id:"txn_refund",kind:"refund",created:20,productCents:-4900}]}}}));
import { collectProductCash } from "../lib/recovery/cash-report";
beforeEach(()=>{state.mode="live";state.fail=false;state.more=false;state.calls=0;});
it("enumerates older orders and reconciles current-window refunds separately from MRR",async()=>{
 const report=await collectProductCash(10,30);
 expect(report).toMatchObject({taxAllocation:"proportional-approximation",finalTaxReconciliationRequired:false,verifiedSessions:1,collectionCents:0,refundCents:4900,netRefundCents:-4900,mrrCents:0,mode:"live"});
});
it("never counts test receipts as actual collections",async()=>{state.mode="test";expect(await collectProductCash(0,30)).toMatchObject({collectionCents:0,refundCents:0,testSessions:1});});
it("refuses an unknown provider result instead of reporting zero",async()=>{state.fail=true;await expect(collectProductCash(0,30)).rejects.toThrow("incomplete");});
it("page exhaustion produces no partial report",async()=>{state.more=true;await expect(collectProductCash(0,30,1)).rejects.toThrow("page cap");expect(state.calls).toBe(1);});

it("numeric reconciliation carries an explicit partial-tax approximation warning",async()=>{
 const {reconcileProductCash}=await import("../lib/stripe-current-rights");
 expect(reconcileProductCash([{sessionId:"taxed",rights:{allowed:true,reason:"partial-refund",collectedCents:5390,refundedCents:1100,taxCents:490,netProductCents:3900,test:false,entries:[]}}],0,30)).toMatchObject({taxAllocation:"proportional-approximation",finalTaxReconciliationRequired:true});
});

it("cross-window partial allocation still requires tax reconciliation after cumulative full refund",async()=>{
 const {reconcileProductCash}=await import("../lib/stripe-current-rights");
 const rows=[{sessionId:"taxed-full",rights:{allowed:false,reason:"refunded" as const,collectedCents:5390,refundedCents:5390,taxCents:490,netProductCents:0,test:false,entries:[
  {id:"txn_collect",kind:"collection" as const,created:1,productCents:4900},
  {id:"txn_oct_partial",kind:"refund" as const,created:20,productCents:-1000},
  {id:"txn_nov_rest",kind:"refund" as const,created:40,productCents:-3900}
 ]}}];
 expect(reconcileProductCash(rows,10,30)).toMatchObject({refundCents:1000,netRefundCents:-1000,taxAllocation:"proportional-approximation",finalTaxReconciliationRequired:true});
 expect(reconcileProductCash(rows,30,50)).toMatchObject({refundCents:3900,finalTaxReconciliationRequired:true});
});
