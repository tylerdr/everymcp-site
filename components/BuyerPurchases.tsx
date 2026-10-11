"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FulfillmentDownload } from "@/components/FulfillmentDownload";
import { buyerSignIn } from "@/lib/buyer/context";
type Receipt={id:string;packetSha256:string};
export function BuyerPurchases({receipt}:{receipt?:string}) {
 const [state,setState]=useState<"loading"|"ready"|"signed-out"|"failed">("loading"),[receipts,setReceipts]=useState<Receipt[]>([]),[message,setMessage]=useState("");
 const returnTo="/buyer/purchases"+(receipt?"?receipt="+receipt:"");
 const [attempt,setAttempt]=useState(0);
 useEffect(()=>{
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);
  let active=true;setMessage("");setState("loading");
  void fetch("/api/fulfillment/recovery",{cache:"no-store",signal:controller.signal}).then(async(response)=>{
   if(!active)return;
   if(response.status===401){setState("signed-out");return;}
   if(!response.ok) throw new Error("Purchase recovery is temporarily unavailable. Keep your checkout return link and retry later.");
   const data=await response.json() as {receipts?:Receipt[]};
   if(!Array.isArray(data.receipts)||data.receipts.some((item)=>!/^[a-f0-9]{64}$/.test(item.id)||!/^[a-f0-9]{64}$/.test(item.packetSha256)))throw new Error("Purchase recovery is temporarily unavailable.");
   if(!active)return;
   setReceipts(data.receipts);setState("ready");
  }).catch((error)=>{if(!active)return;if(!controller.signal.aborted){setMessage(error instanceof Error?error.message:"Recovery unavailable.");setState("failed");}else{setMessage("Recovery timed out. Retry here.");setState("failed");}}).finally(()=>clearTimeout(timeout));
  return ()=>{active=false;clearTimeout(timeout);controller.abort();};
 },[attempt]);
 async function signOut(){try{const response=await fetch("/api/buyer/sign-out",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}",signal:AbortSignal.timeout(10000)});if(response.ok){setReceipts([]);setState("signed-out");}else{setMessage("Sign-out could not be confirmed. Retry.");}}catch{setMessage("Sign-out could not be confirmed. Retry.");}}
 if(state==="loading")return <p role="status">Checking your purchases...</p>;
 if(state==="signed-out")return <div className="space-y-4"><p role="status">Sign in with the email used for your purchase. An expired session does not mean you need to pay again.</p><Button asChild><Link href={buyerSignIn(returnTo)}>Sign in to recover your purchases</Link></Button></div>;
 if(state==="failed")return <div className="space-y-4"><p role="status">{message}</p><Button onClick={()=>setAttempt((value)=>value+1)}>Retry purchase recovery</Button></div>;
 const visible=receipt?receipts.filter((item)=>item.id===receipt):receipts;
 return <div className="space-y-6"><p>Only purchases linked to your verified buyer account appear here.</p>{visible.length===0?<p role="status">No recoverable purchase is available for this account. Historical purchases may still use their original checkout return link.</p>:visible.map((item,index)=><article key={item.id} className="rounded-xl border border-border p-5"><h2 className="mb-3 font-semibold">MCP Integration Starter Kit{visible.length>1?` — purchase ${index+1}`:""}</h2><FulfillmentDownload href={"/api/fulfillment/recovery?receipt="+item.id} signInHref={buyerSignIn("/buyer/purchases?receipt="+item.id)} /></article>)}<Button variant="outline" onClick={()=>void signOut()}>Sign out of this browser</Button>{message&&<p role="status">{message}</p>}</div>;
}
