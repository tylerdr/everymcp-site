import { readFileSync } from "node:fs";

const coreSurfaces = [
  "app/page.tsx",
  "app/layout.tsx",
  "app/directory/page.tsx",
  "app/pricing/page.tsx",
  "app/mcp/[slug]/page.tsx",
  "components/SiteFooter.tsx",
  "components/SiteHeader.tsx",
  "public/llms.txt"
];

const forbidden = [
  /verified MCP servers/i,
  /verified servers sourced from official MCP lists/i,
  /50 real MCP servers sourced from official lists/i,
  /The Complete MCP Directory/i
];

for (const path of coreSurfaces) {
  const content = readFileSync(path, "utf8");
  for (const pattern of forbidden) {
    if (pattern.test(content)) throw new Error(`${path} contains unsupported catalog claim: ${pattern}`);
  }
}

const methodology = readFileSync("app/methodology/page.tsx", "utf8");
if (!methodology.includes("Indexed is not verified")) throw new Error("Methodology must define the indexed/verified boundary");
if (!methodology.includes("registry.modelcontextprotocol.io")) throw new Error("Methodology must point to the official MCP Registry");

const detail = readFileSync("app/mcp/[slug]/page.tsx", "utf8");
for (const required of ["not security-audited", "requested permissions", "Installation reference"]) {
  if (!detail.includes(required)) throw new Error(`Detail page missing trust boundary: ${required}`);
}

console.log("CATALOG_CLAIM_CONTRACT", JSON.stringify({ passed: true, coreSurfaces: coreSurfaces.length, officialRegistryReferenced: true }));
