/** Fictional Auth responses. No Supabase request, user, key or session is real. */
import { buyerCookie } from "../../../lib/buyer/session";
import { SCOPE } from "./runtime-fixture";
export const OWNER_CONFIG = { scope: { ...SCOPE }, project: "a".repeat(20), publishableKey: "sb_publishable_fictional_fixture_only" };
export const AUTH_URL = `https://${OWNER_CONFIG.project}.supabase.co/auth/v1/user`;
export const TOKEN_A = "fictional-bearer-owner-a", TOKEN_B = "fictional-bearer-owner-b";
export const USER_A = { id: "11111111-1111-4111-8111-111111111111", email: "owner-a@example.invalid", email_confirmed_at: "2026-11-01T00:00:00.000000Z", is_anonymous: false };
export const USER_B = { ...USER_A, id: "22222222-2222-4222-8222-222222222222", email: "owner-b@example.invalid" };
export function authResponse(body: BodyInit | null = JSON.stringify(USER_A), init?: ResponseInit, url = AUTH_URL) {
  const response = new Response(body, { headers: { "content-type": "application/json" }, ...init });
  Object.defineProperty(response, "url", { value: url });
  return response;
}
export function ownerRequest(token = TOKEN_A, url = "https://fictional.invalid/api/monitoring/recovery") {
  return new Request(url, { headers: { cookie: `${buyerCookie}=${token}` } });
}
