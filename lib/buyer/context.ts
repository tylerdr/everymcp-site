import type { StackGoalId } from "@/lib/stack-planner";
export type BuyerIntent = { source?: "listing" | "stack-planner"; listing?: string; goal?: StackGoalId };
const goals = new Set(["research", "ship-software", "automate-ops", "analyze-data", "agent-memory"]);
export function buyerIntent(values: { source?: unknown; listing?: unknown; goal?: unknown }): BuyerIntent {
  const source = values.source === "listing" || values.source === "stack-planner" ? values.source : undefined;
  return { ...(source ? { source } : {}), ...(source === "listing" && typeof values.listing === "string" && /^[a-z0-9][a-z0-9-]{0,127}$/.test(values.listing) ? { listing: values.listing } : {}), ...(source === "stack-planner" && typeof values.goal === "string" && goals.has(values.goal) ? { goal: values.goal as StackGoalId } : {}) };
}
export function pricingIntent(values: BuyerIntent) {
  const intent = buyerIntent(values), params = new URLSearchParams();
  for (const [key,value] of Object.entries(intent)) params.set(key,value);
  return "/pricing" + (params.size ? "?" + params : "") + "#starter-kit";
}
export function safeBuyerReturn(value: unknown): string {
  if (typeof value !== "string" || value.length > 1024 || !value.startsWith("/") || value.startsWith("//") || /[\\\r\n]/.test(value)) return pricingIntent({});
  const url = new URL(value,"https://everymcp.invalid");
  if (url.pathname === "/pricing") return pricingIntent(buyerIntent(Object.fromEntries(url.searchParams)));
  if (url.pathname === "/buyer/purchases") {
    const receipt = url.searchParams.get("receipt");
    return "/buyer/purchases" + (receipt && /^[a-f0-9]{64}$/.test(receipt) ? "?receipt=" + receipt : "");
  }
  return pricingIntent({});
}
export const buyerSignIn = (returnTo: string) => "/buyer/sign-in?return_to=" + encodeURIComponent(safeBuyerReturn(returnTo));
