import { PostgresStore, type SqlClient } from "../lib/recovery/postgres-store";
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
function deps() { return { scope,authProject:"abcdefghijklmnopqrst",store:{checkReadiness:async () => true,transaction: async <T,>(f: (l: {events: Record<string,string>;receipts: Record<string,never>}) => T) => f({events:{},receipts:{}})}, authenticate:async () => principal,verifyPurchase:async (id:string) => ({sessionId:id,scope,ownerKey:principal.ownerKey,paid:false,packet:""}),verifyAccount:async () => true,verifyNotice:() => {throw new Error("Synthetic unused signature verifier");} }; }
function request(plan="starter") { return new Request("https://example.invalid/api/checkout",{method:"POST",headers:{"Content-Type":"application/json","Idempotency-Key":"synthetic_attempt_123"},body:JSON.stringify({plan,email:"attacker@example.invalid",owner:"attacker",source:"listing"})}); }
afterEach(() => {mock.binding=null;mock.account="acct_synthetic";mock.mode="test";mock.create.mockClear();});
it("legacy Stripe configuration alone cannot open chargeable checkout", async () => { expect((await POST(request())).status).toBe(503);expect(mock.create).not.toHaveBeenCalled(); });
it.each(["store","authenticate","verifyPurchase","verifyAccount","verifyNotice"] as const)("missing %s binding prevents the actual checkout create call",async (key) => { mock.binding=createStarterBinding({...deps(),[key]:undefined} as unknown as Parameters<typeof createStarterBinding>[0]);expect((await POST(request())).status).toBe(503);expect(mock.create).not.toHaveBeenCalled(); });
it("store failure and mismatched account/mode prevent creation",async () => {
 mock.binding=createStarterBinding({...deps(),store:{checkReadiness:async () => true,transaction:async () => {throw new Error("unavailable");}}});expect((await POST(request())).status).toBe(503);
 mock.binding=createStarterBinding(deps());mock.account="acct_other";expect((await POST(request())).status).toBe(503);mock.account="acct_synthetic";mock.mode="live";expect((await POST(request())).status).toBe(503);expect(mock.create).not.toHaveBeenCalled();
});
it("valid synthetic checkout stamps server owner and unchanged $49 offer with promotions disabled",async () => {mock.binding=createStarterBinding(deps());expect((await POST(request())).status).toBe(200);expect(mock.create).toHaveBeenCalledOnce();expect(mock.create.mock.calls[0][0]).toMatchObject({customer_email:principal.email,allow_promotion_codes:false,metadata:{fulfillment_owner:principal.ownerKey,fulfillment_auth_project:"abcdefghijklmnopqrst",pricing_policy:"usd4900-no-discount-v1"},line_items:[{quantity:1,price_data:{unit_amount:4900,currency:"usd"}}]});});
it.each(["sponsor","consulting"])("manual %s offer cannot create checkout",async(plan)=>{mock.binding=createStarterBinding(deps());expect((await POST(request(plan))).status).not.toBe(200);expect(mock.create).not.toHaveBeenCalled();});

it.each(["live", "other-account", "receipt-policy"])("actual checkout refuses a store with grants but denied %s INSERT policy", async (variant) => {
 const configured: Scope = variant === "live" ? { ...scope, mode: "live" } : variant === "other-account" ? { ...scope, accountId: "acct_other" } : scope;
 let probes = 0;
 const client: SqlClient = { async query<Row>(sql: string) {
   if (sql.startsWith("INSERT")) { probes++; if (variant !== "receipt-policy" || sql.includes("paid_receipts")) throw Object.assign(new Error("test-only RLS denies configured scope"), { code: "42501" }); }
   return { rows: (sql.includes("AS isolated") ? [{ isolated: true }] : sql.includes("AS ready") ? [{ ready: true }] : []) as Row[] };
 }, release() {} };
 mock.account=configured.accountId;mock.mode=configured.mode;
 mock.binding=createStarterBinding({ ...deps(), scope: configured, authenticate: async () => ({...principal,scope:configured}), store: new PostgresStore({connect: async () => client},configured) });
 expect((await POST(request())).status).toBe(503);expect(probes).toBe(variant === "receipt-policy" ? 2 : 1);expect(mock.create).not.toHaveBeenCalled();
});
it("actual checkout refuses a store lacking scoped write readiness proof",async()=>{
 const d=deps();const {checkReadiness: _removed,...store}=d.store;
 mock.binding=createStarterBinding({...d,store} as unknown as Parameters<typeof createStarterBinding>[0]);
 expect((await POST(request())).status).toBe(503);expect(mock.create).not.toHaveBeenCalled();
});

it("expired buyer denies checkout with401 and zero session creation",async()=>{mock.binding=createStarterBinding({...deps(),authenticate:async()=>null});expect((await POST(request())).status).toBe(401);expect(mock.create).not.toHaveBeenCalled();});
it("cookie-authenticated cross-origin checkout refuses creation",async()=>{mock.binding=createStarterBinding(deps());const value=request();const headers=new Headers(value.headers);headers.set("Cookie","__Host-everymcp-buyer=synthetic_verified_access_token");headers.set("Origin","https://attacker.invalid");const body=await value.text();expect((await POST(new Request(value.url,{method:"POST",headers,body}))).status).toBe(400);expect(mock.create).not.toHaveBeenCalled();});

it("authoritative owner outage refuses checkout with503 and zero creation",async()=>{mock.binding=createStarterBinding({...deps(),authenticate:async()=>{throw new Error("owner unavailable");}});expect((await POST(request())).status).toBe(503);expect(mock.create).not.toHaveBeenCalled();});
