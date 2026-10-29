import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import vm from "node:vm";

// Execute the actual component's handler and analytics boundary, without React,
// JSX rendering, providers, credentials or network. Node24 matches Vercel runtime.
const source = readFileSync(process.argv[2] || "components/CheckoutButton.tsx", "utf8");
const helperStart = source.indexOf("function trackCheckout(");
const helper = helperStart < 0 ? "" : source.slice(helperStart, source.indexOf("export function CheckoutButton", helperStart));
const start = source.indexOf("  async function handleCheckout() {");
const end = source.indexOf("\n  return (", start);
assert.ok(start >= 0 && end > start, "actual handler must be present");
const program = stripTypeScriptTypes(helper + source.slice(start,end) + "\nglobalThis.runCheckout = handleCheckout;", {mode:"strip"});
let passed = 0;
async function check(name, options={}) {
  const events=[], calls=[], states=[], errors=[];
  const location = {href:"",assign(url){events.push(["assign",url]);}};
  const context = vm.createContext({
    Promise, AbortSignal, crypto:{randomUUID:()=>"fixture_checkout_attempt"},
    plan:"starter",email:undefined,source:"stack-planner",goal:"research",listing:undefined,idempotencyKey:null,
    setIdempotencyKey(key){context.idempotencyKey=key;},setIsLoading(value){states.push(value);},setError(value){errors.push(value);},
    pricingIntent:()=>"/pricing?source=stack-planner&goal=research",buyerSignIn:path=>"/buyer/sign-in?returnTo="+encodeURIComponent(path),
    track(event,properties){events.push([event,properties]);if(event===options.failAt){if(options.async)return Promise.reject(Error("analytics failed"));if(options.pending)return new Promise(()=>{});throw Error("analytics failed");}},
    fetch:async(url,init)=>{calls.push({url,init});return url==="/api/buyer/session"?{status:options.signedOut?401:200,ok:!options.signedOut}:{status:options.denied?503:200,ok:!options.denied,json:async()=>options.denied?{error:"Delivery unavailable. No payment was taken."}:{url:"https://checkout.stripe.com/c/pay/cs_test_fixture"}};},
    window:{location}
  });
  vm.runInContext(program,context);
  await context.runCheckout();
  await new Promise(resolve=>setImmediate(resolve));
  if(options.signedOut){assert.equal(calls.length,1);assert.match(events.find(e=>e[0]==="assign")?.[1]||"",/^\/buyer\/sign-in\?/);assert.equal(location.href,"");}
  else {
    assert.equal(calls.length,2);assert.equal(calls[1].init.headers["Idempotency-Key"],"fixture_checkout_attempt");
    assert.deepEqual(JSON.parse(calls[1].init.body),{plan:"starter",source:"stack-planner",goal:"research"});
    if(options.denied){assert.equal(location.href,"");assert.equal(states.at(-1),false);assert.match(errors.at(-1),/No payment was taken/);}
    else assert.equal(location.href,"https://checkout.stripe.com/c/pay/cs_test_fixture");
  }
  passed++;console.log("PASS",name);
}
await check("sync started telemetry failure does not block checkout",{failAt:"checkout_started"});
await check("sync created telemetry failure does not block redirect",{failAt:"checkout_session_created"});
await check("rejected started telemetry cannot reject checkout",{failAt:"checkout_started",async:true});
await check("rejected created telemetry cannot reject redirect",{failAt:"checkout_session_created",async:true});
await check("pending telemetry is never awaited",{failAt:"checkout_started",pending:true});
await check("identity401 still redirects before any checkout",{signedOut:true,failAt:"checkout_started"});
await check("checkout denial remains visible and retryable",{denied:true,failAt:"checkout_started"});
console.log(`${passed} actual-handler checks passed; zero provider calls.`);
