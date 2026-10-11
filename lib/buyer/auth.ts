import { createClient } from "@supabase/supabase-js";
import { getStarterBinding } from "@/lib/recovery/binding";
import { safeBuyerReturn } from "./context";
import { clearBuyerCookie, sameOriginMutation, sessionCookie } from "./session";
import type { Principal } from "@/lib/recovery/owner";
type AuthAdapters = {
  requestCode(email: string): Promise<boolean>;
  verifyCode(email: string, code: string): Promise<{ accessToken: string; expiresIn: number } | null>;
  authenticate(request: Request): Promise<Principal | null>;
};
const json = (data: unknown, status=200, extra: Record<string,string>={}) => Response.json(data,{status,headers:{"Cache-Control":"private, no-store",...extra}});
const emailValid = (email: unknown): email is string => typeof email === "string" && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
async function body(request: Request) {
  if (!sameOriginMutation(request)) return null;
  if (!request.body) return null;
  const reader = request.body.getReader(), chunks: Uint8Array[] = [];
  let size = 0, timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => { timer=setTimeout(()=>{void reader.cancel().catch(()=>{});reject(new Error("Body timeout"));},3000); });
  try {
    for (;;) { const {done,value}=await Promise.race([reader.read(),deadline]);if(done)break;size+=value.byteLength;if(size>2048)return null;chunks.push(value); }
  } catch { return null; } finally {clearTimeout(timer);void reader.cancel().catch(()=>{});}
  const text = Buffer.concat(chunks).toString("utf8");
  try { return JSON.parse(text) as {email?: unknown;code?: unknown;returnTo?: unknown}; } catch { return null; }
}
export function createBuyerAuth(adapters: AuthAdapters) {
  return {
    async requestCode(request: Request) {
      const value = await body(request); if (!emailValid(value?.email)) return json({error:"Enter a valid email address."},400);
      try { if (!await adapters.requestCode(value.email)) return json({error:"Email verification is unavailable. Retry later."},503); }
      catch { return json({error:"Email verification is unavailable. Retry later."},503); }
      // Generic response does not reveal whether an account already exists.
      return json({message:"If email delivery is available, check your inbox for the confirmation code."});
    },
    async verifyCode(request: Request) {
      const value = await body(request); if (!emailValid(value?.email) || typeof value?.code !== "string" || !/^\d{6,10}$/.test(value.code)) return json({error:"Enter your email and confirmation code."},400);
      try {
        const session = await adapters.verifyCode(value.email,value.code);
        if (!session) return json({error:"The code is invalid or expired. Request a new code."},401);
        // Never grant rights from the verify payload/user metadata alone. Reuse the
        // canonical fixed-project, current-user, confirmed-email owner adapter.
        const principal = await adapters.authenticate(new Request(request.url,{headers:{Authorization:"Bearer " + session.accessToken}}));
        if (!principal || principal.email.toLowerCase() !== value.email.toLowerCase()) return json({error:"Email verification could not be confirmed. Sign in again."},401);
        return json({returnTo:safeBuyerReturn(value.returnTo)},200,{"Set-Cookie":sessionCookie(session.accessToken,session.expiresIn)});
      } catch { return json({error:"Verification is temporarily unavailable. Retry later."},503); }
    },
    async session(request: Request) {
      try { const principal = await adapters.authenticate(request); return principal ? json({authenticated:true}) : json({error:"Sign in again to continue."},401,{"Set-Cookie":clearBuyerCookie}); }
      catch { return json({error:"Buyer verification is temporarily unavailable."},503); }
    }
  };
}
export function getBuyerAuth(): ReturnType<typeof createBuyerAuth> | null {
  const binding = getStarterBinding(); // Hard sourcefalse exits before config/client/provider operations.
  if (!binding) return null;
  const project = process.env.EVERYMCP_AUTH_PROJECT, key = process.env.EVERYMCP_AUTH_PUBLISHABLE_KEY;
  if (!project || !/^[a-z]{20}$/.test(project) || !key?.startsWith("sb_publishable_")) return null;
  const client = createClient(`https://${project}.supabase.co`,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:(url,init)=>fetch(url,{...init,redirect:"error",signal:AbortSignal.timeout(5000)})}});
  return createBuyerAuth({authenticate:binding.authenticate,requestCode:async(email)=>{
    const {error}=await client.auth.signInWithOtp({email,options:{shouldCreateUser:true}});return !error;
  },verifyCode:async(email,token)=>{
    const {data,error}=await client.auth.verifyOtp({email,token,type:"email"});
    return !error && data.session ? {accessToken:data.session.access_token,expiresIn:Math.min(data.session.expires_in, (data.session.expires_at || 0)-Math.floor(Date.now()/1000))} : null;
  }});
}
export const buyerUnavailable = () => json({error:"Buyer sign-in setup is pending. No payment was taken."},503);
export function signOutBuyer(request: Request) {
  if (!sameOriginMutation(request)) return json({error:"Invalid sign-out request."},400);
  // This browser's session only; no global session/provider/user setting change.
  return json({signedOut:true},200,{"Set-Cookie":clearBuyerCookie});
}
