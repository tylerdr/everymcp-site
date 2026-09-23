import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const plannerPage = read("app/plan/page.tsx");
const plannerModel = read("lib/stack-planner.ts");
const tracking = read("components/StackPlanTracking.tsx");
const homepage = read("app/page.tsx");
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

if (!plannerPage.includes('action="/plan"') || !plannerPage.includes('name="goal"')) {
  throw new Error("Planner must keep a shareable GET-based goal flow");
}

if (!plannerPage.includes("getStackRecommendations") || !plannerPage.includes("Inspect listing")) {
  throw new Error("Planner must render real catalog recommendations with a listing handoff");
}

if (!tracking.includes('track("stack_plan_generated"') || !tracking.includes('track("stack_plan_starter_kit_clicked"')) {
  throw new Error("Planner value and paid-intent events must remain measurable");
}

if (!tracking.includes("source=stack-planner") || !tracking.includes("#starter-kit")) {
  throw new Error("Planner must preserve attribution into the existing starter-kit offer");
}

if (!homepage.includes('href="/plan"') || !homepage.includes("Build my free stack")) {
  throw new Error("Homepage must expose the planner as a value-first acquisition path");
}

if (!sitemap.includes('"/plan"')) {
  throw new Error("Stack planner must be included in the sitemap");
}

console.log("Stack planner contract verified");
