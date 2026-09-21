export type Plan = "starter" | "implementation" | "sponsor";

type Product = {
  amount: number;
  name: string;
  description: string;
  fulfillment: "download" | "manual";
};

export const products: Record<Plan, Product> = {
  starter: {
    amount: 4900,
    name: "EveryMCP MCP Integration Starter Kit",
    description: "Self-serve MCP selection, setup, and rollout packet",
    fulfillment: "download"
  },
  implementation: {
    amount: 200000,
    name: "EveryMCP Implementation Package",
    description: "Fixed-fee MCP implementation sprint",
    fulfillment: "manual"
  },
  sponsor: {
    amount: 50000,
    name: "EveryMCP Sponsor Placement",
    description: "Featured sponsor slot on directory and newsletter",
    fulfillment: "manual"
  }
};

export function isPlan(value: unknown): value is Plan {
  return value === "starter" || value === "implementation" || value === "sponsor";
}
