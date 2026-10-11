"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { safeBuyerReturn } from "@/lib/buyer/context";
export function BuyerSignIn({returnTo,available}:{returnTo:string;available:boolean}) {
  const [email,setEmail]=useState(""), [code,setCode]=useState("");
  const [sent,setSent]=useState(false), [busy,setBusy]=useState(false), [message,setMessage]=useState("");
  async function submit(action:"request-code"|"verify-code") {
    setBusy(true);setMessage("");
    try {
      const response=await fetch("/api/buyer/"+action,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:email.trim(),...(action==="verify-code"?{code,returnTo}: {})}),signal:AbortSignal.timeout(10000)});
      const result=await response.json() as {error?:string;returnTo?:string};
      if (!response.ok) throw new Error(result.error || "Sign-in is temporarily unavailable.");
      if (action==="verify-code") { window.location.assign(safeBuyerReturn(result.returnTo));return; }
      setSent(true);setMessage("Check your inbox for the confirmation code. New buyers can create their account by verifying their email.");
    } catch(error) { setMessage(error instanceof Error ? error.message : "Sign-in is temporarily unavailable."); }
    finally {setBusy(false);setCode("");}
  }
  return <div className="space-y-5">
    <p className="text-muted-foreground">Sign in or create a buyer account with your email. No payment is taken here.</p>
    {!available && <p role="status">Buyer sign-in is temporarily unavailable while setup is completed. Your offer and free directory remain available.</p>}
    <form className="space-y-4" onSubmit={(event)=>{event.preventDefault();void submit(sent?"verify-code":"request-code");}}>
      <label className="block space-y-2"><span>Email address</span><Input type="email" autoComplete="email" value={email} required maxLength={254} disabled={busy||!available||sent} onChange={(event)=>setEmail(event.target.value)} /></label>
      {sent && <label className="block space-y-2"><span>Confirmation code</span><Input value={code} autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6,10}" required maxLength={10} disabled={busy} onChange={(event)=>setCode(event.target.value)} /></label>}
      <Button type="submit" disabled={busy||!available}>{busy?"Please wait...":sent?"Verify email and continue":"Send confirmation code"}</Button>
      {sent && <Button type="button" variant="outline" disabled={busy} onClick={()=>{setSent(false);setCode("");setMessage("");}}>Use another email or request a new code</Button>}
    </form>
    {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
    <Button asChild variant="outline"><Link href={safeBuyerReturn(returnTo)}>Return to your offer or purchase</Link></Button>
  </div>;
}
