import type Stripe from "stripe";
import { afterEach, expect, it, vi } from "vitest";
import { createStarterBinding, type StarterBinding } from "../lib/recovery/binding";
import type { Principal } from "../lib/recovery/owner";
import type { Scope } from "../lib/recovery/entitlements";
const mock = vi.hoisted(() => ({ binding: null as StarterBinding | null, create: vi.fn(async (_params: Stripe.Checkout.SessionCreateParams, _options: Stripe.RequestOptions) => ({ url:"https://checkout.stripe.invalid/synthetic" })), account: "acct_synthetic", mode: "test" }));
vi.mock("../lib/recovery/binding", async (original) => ({ ...await original<typeof import("../lib/recovery/binding")>(), getStarterBinding: () => mock.binding }));
vi.mock("../lib/stripe-config", () => ({ getStripeConfiguration: () => ({ accountId: mock.account, mode: mock.mode, client: { checkout: { sessions: { create: mock.create } } } }), verifyStripeAccount: async () => "valid", isTransientStripeError: () => false }));
import { POST } from "../app/api/checkout/route";
const scope: Scope = { accountId:"acct_synthetic",mode:"test" };
const principal: Principal = {scope,ownerKey:"a".repeat(64),email:"verified@example.invalid"};
function deps() { return { scope,authProject:"abcdefghijklmnopqrst",store:{transaction: async <T,>(f: (l: {events: Record<string,string>;receipts: Record<string,never>}) => T) => f({events:{},receipts:{}})}, authenticate:async () => principal,verifyPurchase:async (id:string) => ({sessionId:id,scope,ownerKey:principal.ownerKey,paid:false,packet:""}),verifyAccount:async () => true,verifyNotice:() => {throw new Error("Synthetic unused signature verifier");} }; }
function request(plan="starter") { return new Request("https://example.invalid/api/checkout",{method:"POST",headers:{"Content-Type":"application/json","Idempotency-Key":"synthetic_attempt_123"},body:JSON.stringify({plan,email:"attacker@example.invalid",owner:"attacker",source:"listing"})}); }
afterEach(() => {mock.binding=null;mock.account="acct_synthetic";mock.mode="test";mock.create.mockClear();});
it("legacy Stripe configuration alone cannot open chargeable checkout", async () => { expect((await POST(request())).status).toBe(503);expect(mock.create).not.toHaveBeenCalled(); });
it.each(["store","authenticate","verifyPurchase","verifyAccount","verifyNotice"] as const)("missing %s binding prevents the actual checkout create call",async (key) => { mock.binding=createStarterBinding({...deps(),[key]:undefined} as unknown as Parameters<typeof createStarterBinding>[0]);expect((await POST(request())).status).toBe(503);expect(mock.create).not.toHaveBeenCalled(); });
it("store failure and mismatched account/mode prevent creation",async () => {
 mock.binding=createStarterBinding({...deps(),store:{transaction:async () => {throw new Error("unavailable");}}});expect((await POST(request())).status).toBe(503);
 mock.binding=createStarterBinding(deps());mock.account="acct_other";expect((await POST(request())).status).toBe(503);mock.account="acct_synthetic";mock.mode="live";expect((await POST(request())).status).toBe(503);expect(mock.create).not.toHaveBeenCalled();
});
it("valid synthetic checkout stamps server owner and unchanged $49 offer with promotions disabled",async () => {mock.binding=createStarterBinding(deps());expect((await POST(request())).status).toBe(200);expect(mock.create).toHaveBeenCalledOnce();expect(mock.create.mock.calls[0][0]).toMatchObject({customer_email:principal.email,allow_promotion_codes:false,metadata:{fulfillment_owner:principal.ownerKey,fulfillment_auth_project:"abcdefghijklmnopqrst",pricing_policy:"usd4900-no-discount-v1"},line_items:[{quantity:1,price_data:{unit_amount:4900,currency:"usd"}}]});});
it.each(["sponsor","consulting"])("manual %s offer cannot create checkout",async(plan)=>{mock.binding=createStarterBinding(deps());expect((await POST(request(plan))).status).not.toBe(200);expect(mock.create).not.toHaveBeenCalled();});
