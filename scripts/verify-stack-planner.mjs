import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const plannerPage = read("app/plan/page.tsx");
const plannerModel = read("lib/stack-planner.ts");
const tracking = read("components/StackPlanTracking.tsx");
const homepage = read("app/page.tsx");
const pricing = read("app/pricing/page.tsx");
const checkoutButton = read("components/CheckoutButton.tsx");
const checkoutRoute = read("app/api/checkout/route.ts");
const sitemap = read("app/sitemap.ts");

const requiredGoals = ["research", "ship-software", "automate-ops", "analyze-data", "agent-memory"];
for (const goal of requiredGoals) {
  if (!plannerModel.includes(`id: "${goal}"`)) {
    throw new Error(`Stack planner is missing goal: ${goal}`);
  }
}

const categoryRoleCount = (plannerModel.match(/slug: "/g) || []).length;
if (categoryRoleCount < requiredGoals.length * 3) {
  throw new Error("Each stack-planner goal must define three catalog-backed capability slots");
}

if (!plannerModel.includes("sortedMcps.find") || !plannerModel.includes("mcp.category === slug")) {
  throw new Error("Stack planner recommendations must be selected from the current EveryMCP catalog");
}

if (!plannerModel.includes("buildStackBrief") || !plannerModel.includes("First integration sequence:")) {
  throw new Error("Stack planner must produce a portable implementation brief from the same catalog-backed plan");
}

if (!plannerPage.includes('action="/plan"') || !plannerPage.includes('name="goal"')) {
  throw new Error("Planner must keep a shareable GET-based goal flow");
}

if (!plannerPage.includes("getStackRecommendations") || !plannerPage.includes("Inspect listing")) {
  throw new Error("Planner must render real catalog recommendations with a listing handoff");
}

if (!plannerPage.includes("CopyStackBrief") || !plannerPage.includes("Take the shortlist with you")) {
  throw new Error("Planner must let buyers carry the useful result into their implementation workflow");
}

if (!tracking.includes('track("stack_plan_generated"') || !tracking.includes('track("stack_plan_starter_kit_clicked"')) {
  throw new Error("Planner value and paid-intent events must remain measurable");
}

if (!tracking.includes('track("stack_plan_brief_copied"') || !tracking.includes("navigator.clipboard.writeText")) {
  throw new Error("Portable plan activation must remain measurable and copy the actual generated brief");
}

if (!tracking.includes("source=stack-planner") || !tracking.includes("#starter-kit")) {
  throw new Error("Planner must preserve attribution into the existing starter-kit offer");
}

if (!pricing.includes('requestedSource === "stack-planner"') || !pricing.includes("source={source}") || !pricing.includes("goal={goal}")) {
  throw new Error("Pricing must preserve validated planner attribution into checkout");
}

if (!checkoutButton.includes("body: JSON.stringify({ plan, email, source, goal })") || !checkoutButton.includes('track("checkout_started", { plan, ...attribution })')) {
  throw new Error("Checkout must carry planner attribution into the existing checkout request and event");
}

if (!checkoutRoute.includes("acquisition_source: source") || !checkoutRoute.includes("acquisition_goal: goal") || !checkoutRoute.includes("attributionValuePattern")) {
  throw new Error("Stripe session metadata must retain bounded planner attribution");
}

if (!homepage.includes('href="/plan"') || !homepage.includes("Build my free stack")) {
  throw new Error("Homepage must expose the planner as a value-first acquisition path");
}

if (!sitemap.includes('"/plan"')) {
  throw new Error("Stack planner must be included in the sitemap");
}

console.log("Stack planner contract verified");
