import { readFileSync } from "node:fs";

const path = "lib/marketplaces.ts";
const content = readFileSync(path, "utf8");
const pageContent = readFileSync("app/marketplaces/page.tsx", "utf8");
const searchableContent = `${content}\n${pageContent}`.toLowerCase();
const requiredSlugs = [
  "chatgpt",
  "claude",
  "grok",
  "grok-build",
  "meta-muse",
  "mcp-registry",
  "smithery",
  "glama"
];

for (const slug of requiredSlugs) {
  if (!content.includes(`slug: "${slug}"`)) {
    throw new Error(`Marketplace guide is missing required slug: ${slug}`);
  }
}

if (!content.includes('marketplaceLastChecked = "2026-09-22"')) {
  throw new Error("Marketplace sources must include the current checked date");
}

const sourceUrls = [...content.matchAll(/url: "https:\/\/[^\"]+"/g)];
if (sourceUrls.length < requiredSlugs.length) {
  throw new Error("Every marketplace guide must include an official or platform source URL");
}

for (const requiredPhrase of [
  "first-party-directory",
  "first-party-connection",
  "official-registry",
  "community-directory",
  "community-marketplace",
  "hosted-remote-mcp",
  "local-plugin-or-desktop",
  "future / closed",
  "No orders"
]) {
  if (!searchableContent.includes(requiredPhrase.toLowerCase())) {
    throw new Error(`Marketplace feature is missing boundary or category: ${requiredPhrase}`);
  }
}

console.log(
  "MARKETPLACE_GUIDE_CONTRACT",
  JSON.stringify({ passed: true, guides: requiredSlugs.length, sourceUrls: sourceUrls.length })
);
