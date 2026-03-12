import { redirect } from "next/navigation";

export const metadata = {
  title: "Pricing — EveryMCP",
  description: "MCP implementation pricing and service packages.",
};

export default function PricingPage() {
  redirect("/services");
}
