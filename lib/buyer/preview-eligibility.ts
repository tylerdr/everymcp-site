import { env } from "node:process";

// Server-only, unset by default. Exact addresses; no domain or alias expansion.
export function previewBuyerAllowed(email: string, configuration = env) {
  const configured = configuration.EVERYMCP_PREVIEW_BUYER_EMAILS;
  if (!configured || configured.length > 1024) return false;
  const buyers = configured.split(",").map((value) => value.trim().toLowerCase());
  if (buyers.length !== 2 || new Set(buyers).size !== 2 || buyers.some((value) =>
    value.length > 254 || !/^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(value))) return false;
  return buyers.includes(email.trim().toLowerCase());
}
