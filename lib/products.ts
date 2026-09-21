export type Plan = "starter" | "implementation" | "sponsor";

export const STARTER_KIT_PRODUCT_KEY = "everymcp-starter-kit";
export const STARTER_KIT_PRODUCT_VERSION = "2026-09-21";
export const STARTER_KIT_AMOUNT = 4900;
export const STARTER_KIT_CURRENCY = "usd" as const;
export const STARTER_KIT_QUANTITY = 1;

export type Product = {
  amount: number;
  currency: "usd";
  quantity: number;
  name: string;
  description: string;
  fulfillment: "download" | "manual";
  productKey: string;
  version: string;
};

export const products: Record<Plan, Product> = {
  starter: {
    amount: STARTER_KIT_AMOUNT,
    currency: STARTER_KIT_CURRENCY,
    quantity: STARTER_KIT_QUANTITY,
    name: "EveryMCP MCP Integration Starter Kit",
    description: "Self-serve MCP selection, setup, and rollout packet downloaded after a successful checkout return",
    fulfillment: "download",
    productKey: STARTER_KIT_PRODUCT_KEY,
    version: STARTER_KIT_PRODUCT_VERSION
  },
  implementation: {
    amount: 200000,
    currency: STARTER_KIT_CURRENCY,
    quantity: 1,
    name: "EveryMCP Implementation Package",
    description: "Fixed-fee MCP implementation sprint",
    fulfillment: "manual",
    productKey: "everymcp-implementation",
    version: "2026-09-20"
  },
  sponsor: {
    amount: 50000,
    currency: STARTER_KIT_CURRENCY,
    quantity: 1,
    name: "EveryMCP Sponsor Placement",
    description: "Featured sponsor slot on directory and newsletter",
    fulfillment: "manual",
    productKey: "everymcp-sponsor",
    version: "2026-09-20"
  }
};

export function isPlan(value: unknown): value is Plan {
  return value === "starter" || value === "implementation" || value === "sponsor";
}
