import { describe, expect, it, vi } from "vitest";
import Stripe from "stripe";
import { readCurrentRights, reconcileProductCash } from "../lib/stripe-current-rights";
import { previewRecoveryEnabled, purchaseReader, createStarterBinding } from "../lib/recovery/binding";
import { stripeNoticeResolver, stripeNoticeVerifier } from "../lib/recovery/stripe-notice";
import { createRecoveryHandlers } from "../lib/recovery/handlers";
import { recordPayment, receiptId, type Ledger, type EntitlementStore, type PaymentNotice } from "../lib/recovery/entitlements";
import { buildStarterKit } from "../lib/starter-kit";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const scope = {accountId:"acct_1Re4ltEQ7c58oLZ4",mode:"test" as const};
const project = "abcdefghijklmnopqrst";
const owner = "a".repeat(64);
const session = {id:"cs_test_one",payment_intent:"pi_one",amount_total:5390,currency:"usd",livemode:false,metadata:{product_key:"everymcp-starter-kit",fulfillment_owner:owner,fulfillment_auth_project:project,pricing_policy:"usd4900-no-discount-v1"},total_details:{amount_tax:490}} as unknown as Stripe.Checkout.Session;
function fixture() {
  const state = { refunded:0, disputes:[] as {status:string}[], fail:false, refundStatus:"succeeded" };
  const client = {
    paymentIntents:{retrieve:vi.fn(async()=>({id:"pi_one",latest_charge:"ch_one",status:"succeeded",livemode:false}))},
    charges:{retrieve:vi.fn(async()=>({id:"ch_one",payment_intent:"pi_one",livemode:false,currency:"usd",status:"succeeded",paid:true,captured:true,amount:5390,amount_captured:5390,amount_refunded:state.refunded,balance_transaction:"txn_collect",disputed:!!state.disputes.length}))},
    refunds:{list:vi.fn(async()=>({has_more:false,data:state.refunded ? [{id:"re_one",charge:"ch_one",currency:"usd",amount:state.refunded,status:state.refundStatus,created:20,balance_transaction:"txn_refund"}]:[]}))},
    disputes:{list:vi.fn(async()=>({has_more:false,data:state.disputes.map(d=>({...d,charge:"ch_one",currency:"usd",livemode:false,balance_transactions:[]}))}))},
    balanceTransactions:{retrieve:vi.fn(async(key:string)=>{if(state.fail)throw Error("outage");return {id:key,currency:"usd",amount:key==="txn_collect"?5390:-state.refunded,created:key==="txn_collect"?10:20};})},
    checkout:{sessions:{list:vi.fn(async()=>({has_more:false,data:[session]}))}}
  };
  return {state,client:client as unknown as Stripe,mocks:client};
}
function memory() {
  let ledger:Ledger={events:{},receipts:{}};
  const store:EntitlementStore={transaction:async change=>{const next=structuredClone(ledger); const result=change(next);ledger=next;return result;}};
  return {store,ledger:()=>ledger};
}
const notice=(id:string,type="checkout.session.completed"):PaymentNotice=>({id,type,sessionId:session.id,scope,payloadSha256:createHash("sha256").update(id).digest("hex")});
describe("fresh refund and dispute rights",()=>{
  it("full refund denies original packet and recovery/list while preserving immutable custody",async()=>{
    const {state,client}=fixture();const {store,ledger}=memory();
    const verify=purchaseReader(scope,project,async()=>{const rights=await readCurrentRights(client,session);return {status:rights.allowed?"paid" as const:"revoked" as const,session,rights};},buildStarterKit,store);
    await recordPayment(store,scope,notice("paid"),verify);
    const original=structuredClone(ledger().receipts);
    const handlers=createRecoveryHandlers({store,scope,authenticate:async()=>({scope,ownerKey:owner}),verifyPurchase:verify,verifyNotice:()=>notice("unused")});
    const url="https://example.com/api/fulfillment/recovery?receipt="+receiptId(scope,session.id);
    expect((await handlers.recovery(new Request(url))).status).toBe(200);
    const binding=createStarterBinding({scope,authProject:project,store:{...store,checkReadiness:async()=>true},authenticate:async()=>({scope,ownerKey:owner,email:"fixture@example.test"}),verifyPurchase:verify,verifyAccount:async()=>true,verifyNotice:()=>notice("fixture")});
    expect(await binding.packet(session.id)).toBe(original[receiptId(scope,session.id)].packet);
    state.refunded=5390;
    expect(await binding.packet(session.id)).toBeNull();
    expect((await handlers.recovery(new Request(url))).status).toBe(404);
    expect(await (await handlers.recovery(new Request("https://example.com/api/fulfillment/recovery"))).json()).toEqual({receipts:[]});
    expect(ledger().receipts).toEqual(original);
    expect((await verify(session.id,scope)).paid).toBe(false);
  });
  it("duplicate/out-of-order reversal and old completed event never restore refunded rights or alter original",async()=>{
    const {state,client}=fixture();const {store,ledger}=memory();
    const verify=purchaseReader(scope,project,async()=>{const rights=await readCurrentRights(client,session);return {status:rights.allowed?"paid" as const:"revoked" as const,session,rights};},buildStarterKit,store);
    await recordPayment(store,scope,notice("paid"),verify);const original=structuredClone(ledger().receipts);
    state.refunded=5390;
    expect(await recordPayment(store,scope,notice("refund","charge.refunded"),verify)).toBe("recorded");
    expect(await recordPayment(store,scope,notice("refund","charge.refunded"),verify)).toBe("duplicate");
    await recordPayment(store,scope,notice("late-paid"),verify);
    expect((await verify(session.id,scope)).paid).toBe(false);expect(ledger().receipts).toEqual(original);
  });
  it("partial refund retains whole packet and excludes proportional tax in net cash",async()=>{
    const {state,client}=fixture();state.refunded=1100;
    const rights=await readCurrentRights(client,session);
    expect(rights).toMatchObject({allowed:true,reason:"partial-refund",netProductCents:3900});
    expect(reconcileProductCash([{sessionId:session.id,rights:{...rights,test:false}}],0,30)).toMatchObject({collectionCents:4900,refundCents:1000,netRefundCents:3900,mrrCents:0});
  });
  it.each(["needs_response","under_review","lost"])("%s dispute denies; won restores only if not fully refunded",async status=>{
    const {state,client}=fixture();state.disputes=[{status}];expect((await readCurrentRights(client,session)).allowed).toBe(false);
    state.disputes=[{status:"won"}];expect((await readCurrentRights(client,session)).allowed).toBe(true);
    state.refunded=5390;expect((await readCurrentRights(client,session)).allowed).toBe(false);
  });
  it("provider failure and pending refund mismatch remain unknown and retryable",async()=>{
    const {state,client}=fixture();state.fail=true;await expect(readCurrentRights(client,session)).rejects.toThrow("outage");
    state.fail=false;state.refunded=5390;state.refundStatus="pending";await expect(readCurrentRights(client,session)).rejects.toThrow("pending");
  });
  it("reconciliation deduplicates immutable balance transactions, excludes tests and respects exclusive month end",async()=>{
    const {client}=fixture();const rights={...await readCurrentRights(client,session),test:false};
    expect(reconcileProductCash([{sessionId:"a",rights},{sessionId:"b",rights},{sessionId:"test",rights:{...rights,test:true}}],10,11).collectionCents).toBe(4900);
    expect(reconcileProductCash([{sessionId:"a",rights}],0,10).collectionCents).toBe(0);
    expect(()=>reconcileProductCash([{sessionId:"a",rights},{sessionId:"a",rights}],0,30)).toThrow("Duplicate");
  });
  it("signed reversal resolves only matching payment and product; unrelated order is ignored",async()=>{
    const {client,mocks}=fixture();const resolver=stripeNoticeResolver(client,scope);
    const reversal={...notice("reverse","charge.refunded"),sessionId:"",chargeId:"ch_one"};
    expect((await resolver(reversal))?.sessionId).toBe(session.id);
    mocks.checkout.sessions.list.mockResolvedValueOnce({has_more:false,data:[{...session,metadata:{product_key:"another-product"}} as Stripe.Checkout.Session]});
    expect(await resolver(reversal)).toBeNull();
    await expect(resolver({...reversal,paymentIntentId:"pi_other"})).rejects.toThrow("payment mismatch");
  });
  it("signed charge event does not masquerade as a session",()=>{
    const key="whsec_fixture";const stripe=new Stripe("sk_test_fixture");
    const raw=JSON.stringify({id:"evt_signed",type:"charge.refunded",livemode:false,data:{object:{id:"ch_one",payment_intent:"pi_one"}}});
    const signature=stripe.webhooks.generateTestHeaderString({payload:raw,secret:key});
    expect(stripeNoticeVerifier(key,scope)(raw,signature)).toMatchObject({sessionId:"",chargeId:"ch_one",paymentIntentId:"pi_one"});
  });
  it("preview opt-in cannot open production, development, live or another sandbox",()=>{
    const env={NEXT_PUBLIC_SITE_URL:"https://everymcp-test.vercel.app",VERCEL_URL:"everymcp-test.vercel.app",VERCEL_ENV:"preview",EVERYMCP_PREVIEW_RECOVERY:"named-sandbox-v1",STRIPE_MODE:"test",STRIPE_ACCOUNT_ID:scope.accountId};
    expect(previewRecoveryEnabled(env)).toBe(true);
    for(const patch of [{NEXT_PUBLIC_SITE_URL:"https://everymcp.com"},{NEXT_PUBLIC_SITE_URL:"https://attacker.vercel.app"},{VERCEL_ENV:"production"},{VERCEL_ENV:"development"},{STRIPE_MODE:"live"},{STRIPE_ACCOUNT_ID:"acct_other"},{EVERYMCP_PREVIEW_RECOVERY:""}])expect(previewRecoveryEnabled({...env,...patch})).toBe(false);
  });
  it("refund of one order leaves another original and current rights untouched",async()=>{
    const {store,ledger}=memory();let revoked=false;
    const verify=async(id:string)=>({sessionId:id,scope,ownerKey:owner,paid:id!=="cs_test_one" || !revoked,packet:buildStarterKit()});
    await recordPayment(store,scope,notice("first"),verify);
    await recordPayment(store,scope,{...notice("second"),sessionId:"cs_test_two"},verify);
    const original=structuredClone(ledger().receipts);revoked=true;
    await recordPayment(store,scope,notice("reversal","charge.refunded"),verify);
    const handlers=createRecoveryHandlers({store,scope,authenticate:async()=>({scope,ownerKey:owner}),verifyPurchase:verify,verifyNotice:()=>notice("unused")});
    const get=(id:string)=>handlers.recovery(new Request("https://example.com/api/fulfillment/recovery?receipt="+receiptId(scope,id)));
    expect((await get("cs_test_one")).status).toBe(404);expect((await get("cs_test_two")).status).toBe(200);
    expect(ledger().receipts).toEqual(original);
  });
  it("sandbox SQL has four exact named-account policies and no historical live-account literal",()=>{
    const sql=readFileSync("documents/recovery-sandbox-isolation-proposal.sql","utf8");
    expect(sql.match(/acct_1Re4ltEQ7c58oLZ4/g)).toHaveLength(4);
    expect(sql).not.toContain("acct_1Re4lnCrDNIXmbyx");
    expect(sql.match(/AND mode = 'test'/g)).toHaveLength(4);
  });

});
