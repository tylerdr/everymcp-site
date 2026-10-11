// Actual React components + actual server factories/routes, synthetic adapters.
// All HTTP is loopback. No provider, database, token or payment resource is used.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { build } from "esbuild";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
const require=createRequire(import.meta.url),root=resolve(".");
let playwright;
try {playwright=require("playwright");} catch {playwright=require("/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");}
const dir=await mkdtemp(join(tmpdir(),"everymcp-buyer-browser-"));
function load(source,deps){const module={exports:{}};const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;new Function("require","module","exports",compiled)((id)=>id in deps?deps[id]:require(id),module,module.exports);return module.exports;}
await build({stdin:{contents:`export {createBuyerAuth, signOutBuyer} from './lib/buyer/auth';export {supabaseOwner} from './lib/recovery/owner';export {createStarterBinding} from './lib/recovery/binding';export {recordPayment,receiptId} from './lib/recovery/entitlements';export {buildStarterKit} from './lib/starter-kit';export {GET as defaultSession} from './app/api/buyer/session/route';`,resolveDir:root,sourcefile:"synthetic-server.ts",loader:"ts"},outfile:join(dir,"server.cjs"),bundle:true,platform:"node",format:"cjs",packages:"external",alias:{"@":root}});
// External packages resolve relative to this repository, not temporary output.
const serverCode=await readFile(join(dir,"server.cjs"),"utf8");const actual=load(serverCode,{});
await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import{BuyerSignIn}from'./components/BuyerSignIn';import{BuyerPurchases}from'./components/BuyerPurchases';import{CheckoutButton}from'./components/CheckoutButton';import{ListingStarterKitHandoff}from'./components/ListingStarterKitHandoff';import{FulfillmentDownload}from'./components/FulfillmentDownload';import{safeBuyerReturn}from'./lib/buyer/context';const u=new URL(location.href);let view;if(u.pathname.startsWith('/mcp/'))view=<ListingStarterKitHandoff slug="revenuecat-mcp"/>;else if(u.pathname==='/pricing')view=<CheckoutButton plan="starter" label="Continue to checkout — $49" source={u.searchParams.get('source')||undefined} listing={u.searchParams.get('listing')||undefined} goal={u.searchParams.get('goal')||undefined}/>;else if(u.pathname==='/buyer/purchases')view=<BuyerPurchases receipt={u.searchParams.get('receipt')||undefined}/>;else if(u.pathname==='/checkout/success')view=<FulfillmentDownload href="/api/fulfillment/starter-kit?session_id=cs_test_synthetic" signInHref={window.__signInHref}/>;else view=<BuyerSignIn available={u.pathname!=='/buyer/disabled'} returnTo={safeBuyerReturn(u.searchParams.get('return_to'))}/>;const root=document.getElementById('root');if(root)createRoot(root).render(view);`,resolveDir:root,sourcefile:"synthetic-client.tsx",loader:"tsx"},outfile:join(dir,"client.js"),bundle:true,platform:"browser",format:"iife",jsx:"automatic",alias:{"@":root},plugins:[{name:"isolated-router-and-analytics",setup(b){b.onResolve({filter:/^(next\/link|@vercel\/analytics)$/},args=>({path:args.path,namespace:"fixture"}));b.onLoad({filter:/.*/,namespace:"fixture"},args=>({contents:args.path==="next/link"?`import React from 'react';export default function Link({children,...props}){return React.createElement('a',props,children)}`:`export const track=(event,properties)=>{window.__events.push({event,properties})}`,loader:"js",resolveDir:root}));}}]});
const scope={accountId:"acct_synthetic",mode:"test"},project="abcdefghijklmnopqrst";
const tokens={"buyer-a@example.invalid":"synthetic_buyer_a_verified_token","buyer-b@example.invalid":"synthetic_buyer_b_verified_token"};
let providerFixtureReads=0,codeFixtureRequests=0,checkoutMockCreates=0;
const authenticate=actual.supabaseOwner(scope,project,"sb_publishable_synthetic",async(_url,init)=>{
 providerFixtureReads++;const bearer=init.headers.Authorization.slice(7), email=Object.keys(tokens).find((key)=>tokens[key]===bearer);
 return email?Response.json({id:email.startsWith("buyer-a")?"00000000-0000-0000-0000-000000000001":"00000000-0000-0000-0000-000000000002",email,email_confirmed_at:"2026-10-11T00:00:00Z",is_anonymous:false}):new Response("expired",{status:401});
});
const auth=actual.createBuyerAuth({authenticate,requestCode:async()=>{codeFixtureRequests++;return true;},verifyCode:async(email,code)=>code==="123456"&&tokens[email]?{accessToken:tokens[email],expiresIn:3600}:null});
let ledger={events:{},receipts:{}};
const store={checkReadiness:async()=>true,transaction:async(change)=>{const next=structuredClone(ledger),result=change(next);ledger=next;return result;}};
const original=actual.buildStarterKit("research"),digest=createHash("sha256").update(original).digest("hex"),sessionId="cs_test_synthetic";
const principalA=await authenticate(new Request("https://example.invalid",{headers:{Authorization:"Bearer "+tokens["buyer-a@example.invalid"]}}));
const purchase={sessionId,scope,ownerKey:principalA.ownerKey,paid:true,packet:original};
await actual.recordPayment(store,scope,{id:"evt_browser",type:"checkout.session.completed",sessionId,scope,payloadSha256:"a".repeat(64)},async()=>purchase);
const binding=actual.createStarterBinding({scope,authProject:project,store,authenticate,verifyPurchase:async()=>purchase,verifyAccount:async()=>true,verifyNotice:()=>{throw new Error("unused synthetic verifier");}});
const receipt=actual.receiptId(scope,sessionId),paidSession={id:sessionId,livemode:false,metadata:{fulfillment_owner:principalA.ownerKey,fulfillment_auth_project:project,pricing_policy:"usd4900-no-discount-v1",acquisition_source:"listing",acquisition_listing:"revenuecat-mcp"}};
let origin="";let checkoutParams;
const checkout=load(await readFile(join(root,"app/api/checkout/route.ts"),"utf8"),{"@/lib/recovery/binding":{getStarterBinding:()=>binding},"@/lib/stripe-config":{getStripeConfiguration:()=>({accountId:scope.accountId,mode:scope.mode,client:{checkout:{sessions:{create:async(params)=>{checkoutMockCreates++;checkoutParams=params;return{url:origin+"/checkout/success?session_id="+sessionId};}}}}}),verifyStripeAccount:async()=>"valid",isTransientStripeError:()=>false},"@/lib/products":load(await readFile(join(root,"lib/products.ts"),"utf8"),{}),"@/lib/site":{siteUrl:"https://everymcp.test"},"@/lib/buyer/context":load(await readFile(join(root,"lib/buyer/context.ts"),"utf8"),{}),"@/lib/buyer/session":load(await readFile(join(root,"lib/buyer/session.ts"),"utf8"),{})});
const fulfillment=load(await readFile(join(root,"app/api/fulfillment/starter-kit/route.ts"),"utf8"),{"@/lib/recovery/binding":{getStarterBinding:()=>binding},"@/lib/stripe-fulfillment":{verifyPaidSession:async()=>({status:"paid",session:paidSession})},"@/lib/starter-kit":{buildStarterKit:()=>{throw new Error("must not rebuild stored packet");},starterKitFilename:"everymcp-mcp-integration-starter-kit.md"}});
const client=await readFile(join(dir,"client.js"));
const server=createServer(async(req,res)=>{try{
 const chunks=[];for await(const chunk of req)chunks.push(chunk);
 const request=new Request(origin+req.url,{method:req.method,headers:req.headers,...req.method!=="GET"?{body:Buffer.concat(chunks)}:{}});
 const url=new URL(request.url);let response;
 if(url.pathname==="/client.js")response=new Response(client,{headers:{"Content-Type":"text/javascript"}});
 else if(url.pathname==="/api/buyer/request-code")response=await auth.requestCode(request);
 else if(url.pathname==="/api/buyer/verify-code")response=await auth.verifyCode(request);
 else if(url.pathname==="/api/buyer/session")response=await auth.session(request);
 else if(url.pathname==="/api/buyer/sign-out")response=actual.signOutBuyer(request);
 else if(url.pathname==="/api/checkout")response=await checkout.POST(request);
 else if(url.pathname==="/api/fulfillment/recovery")response=await binding.handlers.recovery(request);
 else if(url.pathname==="/api/fulfillment/starter-kit")response=await fulfillment.GET(request);
 else{
  let markup='<div id="root"></div>',signInHref="";
  if(url.pathname==="/checkout/success"){
   const page=load(await readFile(join(root,"app/checkout/success/page.tsx"),"utf8"),{"next/headers":{headers:()=>request.headers},"@/lib/recovery/binding":{getStarterBinding:()=>binding},"@/lib/stripe-fulfillment":{verifyPaidSession:async()=>({status:"paid",session:paidSession})},"@/lib/site":{siteUrl:origin},"@/lib/recovery/entitlements":{receiptId:actual.receiptId},"@/lib/buyer/context":load(await readFile(join(root,"lib/buyer/context.ts"),"utf8"),{}),"@/components/FulfillmentDownload":{FulfillmentDownload:(props)=>{signInHref=props.signInHref||"";return React.createElement("div",{id:"root"});}}});
   markup=renderToStaticMarkup(await page.default({searchParams:{session_id:sessionId}}));
  }
  response=new Response(`<!doctype html><html><body>${markup}<script>window.__events=[];window.__signInHref=${JSON.stringify(signInHref)}</script><script src="/client.js"></script></body></html>`,{headers:{"Content-Type":"text/html"}});
 }
 res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch(error){res.writeHead(500);res.end(String(error));}});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));origin="http://localhost:"+server.address().port;
const browser=await playwright.chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||"/usr/bin/chromium"});
try{
 const context=await browser.newContext({acceptDownloads:true}),page=await context.newPage(),errors=[];
 page.on("pageerror",error=>errors.push(error.message));
 await context.route("**/*",route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
 const signIn=async(p,email,invalid=false)=>{await p.getByLabel("Email address").fill(email);await p.getByRole("button",{name:"Send confirmation code",exact:true}).click();await p.getByLabel("Confirmation code").waitFor();if(invalid){await p.getByLabel("Confirmation code").fill("000000");await p.getByRole("button",{name:"Verify email and continue",exact:true}).click();await p.getByText("The code is invalid or expired. Request a new code.",{exact:true}).waitFor();}await p.getByLabel("Confirmation code").fill("123456");await p.getByRole("button",{name:"Verify email and continue",exact:true}).click();await p.waitForURL(url=>url.pathname!=="/buyer/sign-in");};
 await page.goto(origin+"/mcp/revenuecat-mcp");await page.getByRole("link",{name:"Review the rollout packet — $49",exact:true}).click();
 await page.getByRole("button",{name:"Continue to checkout — $49",exact:true}).click();await page.waitForURL("**/buyer/sign-in?*");
 assert.equal(new URL(page.url()).searchParams.get("return_to"),"/pricing?source=listing&listing=revenuecat-mcp#starter-kit");assert.equal(checkoutMockCreates,0);
 await signIn(page,"buyer-a@example.invalid",true);assert.equal(new URL(page.url()).searchParams.get("listing"),"revenuecat-mcp");
 assert.equal(await page.evaluate(()=>document.cookie),"");const cookies=await context.cookies();assert.equal(cookies[0].httpOnly,true);assert.equal(cookies[0].secure,true);assert.equal(cookies[0].sameSite,"Lax");assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
 await page.getByRole("button",{name:"Continue to checkout — $49",exact:true}).click();await page.waitForURL("**/checkout/success?*");
 assert.equal(checkoutMockCreates,1);assert.equal(checkoutParams.metadata.fulfillment_owner,principalA.ownerKey);assert.equal(checkoutParams.allow_promotion_codes,false);assert.equal(new URL(checkoutParams.cancel_url).searchParams.get("listing"),"revenuecat-mcp");
 const download=page.waitForEvent("download");await page.getByRole("button",{name:"Download your starter kit",exact:true}).click();const file=await download;assert.equal(await readFile(await file.path(),"utf8"),original);
 await page.goto(origin+"/buyer/purchases?receipt="+receipt);await page.getByRole("button",{name:"Download your starter kit",exact:true}).waitFor();await context.clearCookies();
 await page.getByRole("button",{name:"Download your starter kit",exact:true}).click();await page.getByRole("link",{name:"Sign in to retry this purchase",exact:true}).waitFor();await page.getByRole("link",{name:"Sign in to retry this purchase",exact:true}).click();await signIn(page,"buyer-a@example.invalid");await page.getByRole("button",{name:"Download your starter kit",exact:true}).waitFor();assert.equal(checkoutMockCreates,1);
 const deniedContext=await browser.newContext(),denied=await deniedContext.newPage();await denied.goto(origin+"/buyer/sign-in?return_to="+encodeURIComponent("/buyer/purchases?receipt="+receipt));await signIn(denied,"buyer-b@example.invalid");await denied.getByText("No recoverable purchase is available for this account.",{exact:false}).waitFor();assert.equal(await denied.getByRole("button",{name:"Download your starter kit",exact:true}).count(),0);
 assert.equal((await deniedContext.request.get(origin+"/api/fulfillment/recovery?receipt="+receipt+"&owner="+principalA.ownerKey)).status(),404);assert.equal((await deniedContext.request.get(origin+"/api/fulfillment/starter-kit?session_id="+sessionId)).status(),404);
 await denied.goto(origin+"/checkout/success?session_id="+sessionId);assert.equal(await denied.getByRole("button",{name:"Download your starter kit",exact:true}).count(),0);await denied.getByText("Sign in with the email used for this purchase",{exact:false}).waitFor();
 await page.goto(origin+"/buyer/sign-in?return_to="+encodeURIComponent("https://attacker.invalid/steal"));await signIn(page,"buyer-a@example.invalid");assert.equal(new URL(page.url()).pathname,"/pricing");assert.equal(new URL(page.url()).origin,origin);
 await context.clearCookies();await page.goto(origin+"/pricing?source=stack-planner&goal=research#starter-kit");await page.getByRole("button",{name:"Continue to checkout — $49",exact:true}).click();await page.waitForURL("**/buyer/sign-in?*");assert.equal(new URL(page.url()).searchParams.get("return_to"),"/pricing?source=stack-planner&goal=research#starter-kit");await signIn(page,"buyer-a@example.invalid");assert.equal(new URL(page.url()).searchParams.get("goal"),"research");assert.equal(checkoutMockCreates,1);
 await page.goto(origin+"/buyer/purchases?receipt="+receipt);await page.getByRole("button",{name:"Sign out of this browser",exact:true}).click();await page.getByRole("link",{name:"Sign in to recover your purchases",exact:true}).waitFor();assert.equal((await context.cookies()).length,0);
 await page.goto(origin+"/buyer/disabled");assert.equal(await page.getByRole("button",{name:"Send confirmation code",exact:true}).isDisabled(),true);
 assert.equal((await actual.defaultSession(new Request(origin+"/api/buyer/session"))).status,503);
 assert.deepEqual(errors,[]);
 const receiptProof={checkedAt:new Date().toISOString(),syntheticOnly:true,actualReactComponents:true,actualAuthRecoveryCheckoutReturnHandlers:true,listingOfferPreserved:true,plannerGoalPreserved:true,browserSignOut:true,expiredCodeDenied:true,HttpOnlySecureCookie:true,noBrowserTokenStorage:true,sessionExpiryRecoveryWithoutRepurchase:true,otherBuyerDenied:true,unsafeReturnSanitized:true,disabledSource503:true,storedArtifactSha256:digest,checkoutMockCreates,actualProviderCalls:0,actualDbQueries:0,actualCredentials:0,actualEmails:0,providerFixtureReads,codeFixtureRequests,pageErrors:errors};
 await writeFile(process.argv[2]||"/tmp/everymcp-buyer-browser.json",JSON.stringify(receiptProof,null,2)+"\n");console.log(JSON.stringify(receiptProof));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));await rm(dir,{recursive:true,force:true});}
