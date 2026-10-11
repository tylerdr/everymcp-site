import { createHash } from "node:crypto";
import type { Scope } from "./entitlements";

export type Principal = { ownerKey: string; scope: Scope; email: string };
export function ownerKey(scope: Scope, project: string, userId: string) {
  return createHash("sha256").update(JSON.stringify(["everymcp-starter-kit", scope.accountId, scope.mode, project, userId])).digest("hex");
}
// Each bearer token can retrieve ONLY its own authoritative current user. No
// admin/service_role key, auth.users lookup, email OTP, signup or other-product data.
export function supabaseOwner(scope: Scope, project: string, publishableKey: string, fetcher: typeof fetch = fetch) {
  if (!/^[a-z]{20}$/.test(project) || !publishableKey.startsWith("sb_publishable_")) throw new Error("Invalid owner binding");
  return async (request: Request): Promise<Principal | null> => {
    const authorization = request.headers.get("authorization");
    if (!authorization || !/^Bearer [A-Za-z0-9_.-]{16,8192}$/.test(authorization)) return null;
    const response = await fetcher(`https://${project}.supabase.co/auth/v1/user`, {
      headers: { apikey: publishableKey, Authorization: authorization }, redirect: "error", cache: "no-store", signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) return null;
    const reader = response.body?.getReader();
    if (!reader) return null;
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > 64_000) throw new Error("Owner response too large");
        chunks.push(value);
      }
    } finally { await reader.cancel().catch(() => {}); }
    const text = Buffer.concat(chunks).toString("utf8");
    const user = JSON.parse(text) as { id?: unknown; email?: unknown; email_confirmed_at?: unknown; is_anonymous?: unknown };
    if (typeof user.id !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(user.id) || typeof user.email !== "string" || !user.email || typeof user.email_confirmed_at !== "string" || !Number.isFinite(Date.parse(user.email_confirmed_at)) || user.is_anonymous === true) return null;
    return { scope: { ...scope }, ownerKey: ownerKey(scope, project, user.id), email: user.email };
  };
}
