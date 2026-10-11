export const buyerCookie = "__Host-everymcp-buyer";
const tokenPattern = /^[A-Za-z0-9_.-]{16,3500}$/;
export function cookieToken(request: Request): string | null {
  const entries = (request.headers.get("cookie") || "").split(";").map((value) => value.trim()).filter((value) => value.startsWith(buyerCookie + "="));
  if (entries.length !== 1) return null;
  const token = entries[0].slice(buyerCookie.length + 1);
  return tokenPattern.test(token) ? token : null;
}
export function sessionCookie(token: string, expiresIn: number) {
  if (!tokenPattern.test(token) || !Number.isFinite(expiresIn) || expiresIn <= 0) throw new Error("Invalid buyer session");
  return `${buyerCookie}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${Math.floor(Math.min(expiresIn,900))}`;
}
export const clearBuyerCookie = `${buyerCookie}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
export function sameOriginMutation(request: Request) {
  const origin = request.headers.get("origin");
  return origin === new URL(request.url).origin && request.headers.get("content-type")?.split(";")[0] === "application/json";
}
