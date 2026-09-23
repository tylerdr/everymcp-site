export const marketplaceLastChecked = "2026-09-22";

export type MarketplaceKind =
  | "first-party-directory"
  | "first-party-connection"
  | "official-registry"
  | "community-directory"
  | "community-marketplace";

export type MarketplaceMode =
  | "hosted-remote-mcp"
  | "local-plugin-or-desktop"
  | "both";

export type MarketplaceAudience = "core" | "longtail";

export type MarketplaceSource = {
  label: string;
  url: string;
};

export type MarketplaceGuide = {
  slug: string;
  name: string;
  kind: MarketplaceKind;
  mode: MarketplaceMode;
  audience: MarketplaceAudience;
  summary: string;
  listingLabel: string;
  listingUrl: string;
  status: "verified-path" | "portal-gated";
  eligibility: string;
  review: string;
  cost: string;
  unknowns: string[];
  checklist: string[];
  sources: MarketplaceSource[];
};

export const marketplaceKindLabels: Record<MarketplaceKind, string> = {
  "first-party-directory": "First-party directory",
  "first-party-connection": "First-party connection",
  "official-registry": "Official registry",
  "community-directory": "Community directory",
  "community-marketplace": "Community marketplace"
};

export const marketplaceModeLabels: Record<MarketplaceMode, string> = {
  "hosted-remote-mcp": "Hosted remote MCP",
  "local-plugin-or-desktop": "Local plugin or desktop",
  both: "Hosted and local"
};

export const marketplaceAudienceLabels: Record<MarketplaceAudience, string> = {
  core: "Core platform path",
  longtail: "Longtail ecosystem"
};

export const marketplaceGuides: MarketplaceGuide[] = [
  {
    slug: "chatgpt",
    name: "ChatGPT / OpenAI app submission",
    kind: "first-party-directory",
    mode: "hosted-remote-mcp",
    audience: "core",
    summary:
      "A first-party ChatGPT app and plugin submission path for remote MCP servers. A custom UI is optional; submission, review, and publication are separate steps.",
    listingLabel: "OpenAI plugin submission guide",
    listingUrl: "https://developers.openai.com/plugins/deploy/submission",
    status: "verified-path",
    eligibility:
      "The checked guide calls for organization Apps Management write access, a verified developer or business identity, a public HTTPS server, and domain verification.",
    review:
      "Prepare listing details, auth and demo information, tool annotations, starter prompts, availability, policy attestations, and five positive plus three negative test cases. Approval is not implied by submitting a URL.",
    cost:
      "No submission fee is stated on the checked OpenAI page. Confirm current account, regional, and portal terms before submitting.",
    unknowns: [
      "Account-specific approval timing and country availability.",
      "Whether a particular EveryMCP endpoint meets the current scan and policy requirements."
    ],
    checklist: [
      "Publish a stable HTTPS remote MCP endpoint and verify the domain challenge before preparing the listing.",
      "Document auth, demo credentials, data handling, and every tool's read-only or destructive behavior.",
      "Add tool annotations, starter prompts, and exactly five positive plus three negative test cases for the portal review.",
      "Record the submitted version, source commit, availability countries, and rollback contact in the release packet."
    ],
    sources: [
      {
        label: "OpenAI submission requirements",
        url: "https://developers.openai.com/plugins/deploy/submission"
      }
    ]
  },
  {
    slug: "claude",
    name: "Claude Connectors Directory",
    kind: "first-party-directory",
    mode: "both",
    audience: "core",
    summary:
      "Anthropic's first-party directory accepts remote MCP servers through the Claude.ai portal. Desktop extensions are a separate path with different packaging requirements.",
    listingLabel: "Claude directory submission guide",
    listingUrl: "https://claude.com/docs/connectors/building/submission",
    status: "verified-path",
    eligibility:
      "The checked guide requires a Team or Enterprise organization and directory-management permission. Remote entries can use OAuth, a custom connection, or no auth when appropriate.",
    review:
      "Directory entries are expected to meet security and functionality standards, use clear titles and annotations, maintain accurate docs, and respond to user or review issues. Inclusion is a reviewed directory decision.",
    cost:
      "No directory submission fee is stated on the checked guide. Confirm organization plan and portal terms before submitting.",
    unknowns: [
      "Review timing and current regional availability.",
      "Whether a local desktop extension or a remote server is the correct path for a particular client workflow."
    ],
    checklist: [
      "Choose the remote directory path or the separate desktop-extension path before packaging anything.",
      "Define OAuth, custom-connection, or no-auth behavior and document the minimum scopes and data flow.",
      "Use descriptive titles, tool annotations, setup instructions, and an honest privacy and support contact.",
      "Keep a versioned test account, a rollback plan, and a response owner available for directory review."
    ],
    sources: [
      {
        label: "Claude Connectors Directory submission",
        url: "https://claude.com/docs/connectors/building/submission"
      }
    ]
  },
  {
    slug: "grok",
    name: "Grok custom connector / Remote MCP",
    kind: "first-party-connection",
    mode: "hosted-remote-mcp",
    audience: "core",
    summary:
      "Grok's custom connector path lets an account add a remote MCP server. It is a connection workflow, not evidence of a public marketplace listing or catalog admission.",
    listingLabel: "xAI Grok connector documentation",
    listingUrl: "https://docs.x.ai/grok/connectors",
    status: "verified-path",
    eligibility:
      "The connection needs a server URL and label, with authorization or headers when the server requires them. xAI's remote-MCP documentation identifies Streaming HTTP and SSE as supported transports.",
    review:
      "The checked connector and remote-MCP docs describe how to connect a server; they do not claim a public directory review or publication process. Treat a successful custom connection as client setup only.",
    cost:
      "No connector listing fee is stated in the checked xAI docs. API, account, or model usage terms remain account-specific.",
    unknowns: [
      "Which account tiers and product surfaces expose custom connectors at the time of connection.",
      "Any separate review or publication path beyond adding a connector to an account."
    ],
    checklist: [
      "Expose a stable HTTPS endpoint and confirm the transport is Streaming HTTP or SSE before adding it.",
      "Set a precise server label, authorization method, and minimum headers or scopes; never paste production secrets into a shared test.",
      "Exercise tools with read-only fixtures first, then test write boundaries and failure responses.",
      "Record the connector URL, client account, test date, and removal steps as connection evidence rather than a listing receipt."
    ],
    sources: [
      {
        label: "Grok custom connectors",
        url: "https://docs.x.ai/grok/connectors"
      },
      {
        label: "xAI Remote MCP tools",
        url: "https://docs.x.ai/developers/tools/remote-mcp"
      }
    ]
  },
  {
    slug: "grok-build",
    name: "Grok Build plugin marketplace",
    kind: "first-party-directory",
    mode: "hosted-remote-mcp",
    audience: "core",
    summary:
      "The xAI plugin marketplace is a reviewed catalog path for Grok Build. It uses repository contributions and is separate from the Grok Bot custom-connector workflow.",
    listingLabel: "xAI plugin marketplace repository",
    listingUrl: "https://github.com/xai-org/plugin-marketplace",
    status: "verified-path",
    eligibility:
      "Prepare the marketplace plugin configuration and a public, reviewable source commit. The exact acceptance rules belong to the repository and its current contribution process.",
    review:
      "The repository is a catalog contribution path with pull-request review and a pinned source commit. A PR or merged catalog entry is separate from a working Grok custom connector.",
    cost:
      "No listing fee is stated in the checked repository materials. Confirm current repository guidance and any product terms before opening a contribution.",
    unknowns: [
      "Current review timing, eligibility, and required plugin metadata for a specific submission.",
      "Whether the catalog accepts every remote MCP shape or requires additional plugin configuration."
    ],
    checklist: [
      "Read the repository contribution instructions and build the plugin from a pinned, reviewable source commit.",
      "Separate public tool descriptions, auth setup, and destructive-action boundaries from private development secrets.",
      "Test the plugin from a clean checkout and include reproducible install and rollback steps in the PR.",
      "Keep the catalog PR, its review state, and any Grok connection test as separate evidence records."
    ],
    sources: [
      {
        label: "xAI plugin marketplace",
        url: "https://github.com/xai-org/plugin-marketplace"
      },
      {
        label: "Grok custom connectors",
        url: "https://docs.x.ai/grok/connectors"
      }
    ]
  },
  {
    slug: "meta-muse",
    name: "Meta Muse Connector Platform",
    kind: "first-party-directory",
    mode: "hosted-remote-mcp",
    audience: "core",
    summary:
      "Muse presents a first-party connector submission and directory flow. Its public page describes review gates, while detailed protocol and auth requirements remain behind the submission portal.",
    listingLabel: "Muse Connector Platform",
    listingUrl: "https://muse.ai/platform",
    status: "portal-gated",
    eligibility:
      "The public page links to a submission portal that requires sign-in or a work email. Detailed eligibility and connector protocol requirements were not available without entering that portal.",
    review:
      "Muse publicly describes functional, security, and legal review plus end-to-end testing before directory publication. Featured placement is an editorial decision after approval.",
    cost:
      "No submission fee is stated on the checked public page. Confirm any plan, review, or hosting terms inside the authorized portal.",
    unknowns: [
      "MCP compatibility, transport, auth, metadata, and package requirements.",
      "Who may submit, what evidence the portal requires, review timing, and any current cost or regional limits."
    ],
    checklist: [
      "Prepare a plain product description, public support contact, data-flow summary, and test environment before opening the portal.",
      "Have functional, security, legal, and end-to-end test evidence ready; do not infer protocol requirements from the landing page.",
      "Confirm the portal's current connector contract and authorized submitter eligibility before creating an account or submission.",
      "Record portal status and unknowns as open items until written requirements and an approval receipt exist."
    ],
    sources: [
      {
        label: "Muse Connector Platform",
        url: "https://muse.ai/platform"
      }
    ]
  },
  {
    slug: "mcp-registry",
    name: "Official MCP Registry",
    kind: "official-registry",
    mode: "both",
    audience: "longtail",
    summary:
      "The MCP project's vendor-neutral registry publishes server metadata for downstream clients and aggregators. It is a registry, not a client-specific app store.",
    listingLabel: "Registry publishing quickstart",
    listingUrl: "https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/quickstart.mdx",
    status: "verified-path",
    eligibility:
      "The quickstart covers package ownership verification, an npm or other supported artifact, registry authentication, and a server.json entry. Remote-server support is documented as a separate path.",
    review:
      "The registry is in preview and uses validation, status, and community moderation. The official project warns that breaking changes or data resets may occur before general availability.",
    cost:
      "No registry fee is stated in the checked docs. Package hosting, npm, GitHub, and account costs remain separate from the registry metadata entry.",
    unknowns: [
      "Preview behavior, data durability, and schema changes before general availability.",
      "Whether a given hosted endpoint should use the remote-server path or a package entry."
    ],
    checklist: [
      "Choose the package or remote-server path and read its current ownership-verification requirements.",
      "Publish the underlying artifact where required, then validate server.json with the official publisher tool.",
      "Authenticate with the intended namespace, publish a version, and retain the registry response as a receipt.",
      "Monitor status and schema changes because the registry is explicitly in preview."
    ],
    sources: [
      {
        label: "Official MCP Registry",
        url: "https://registry.modelcontextprotocol.io/docs"
      },
      {
        label: "Registry publishing quickstart",
        url: "https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/quickstart.mdx"
      },
      {
        label: "Registry preview announcement",
        url: "https://blog.modelcontextprotocol.io/posts/2025-09-08-mcp-registry-preview/"
      }
    ]
  },
  {
    slug: "smithery",
    name: "Smithery",
    kind: "community-marketplace",
    mode: "both",
    audience: "longtail",
    summary:
      "Smithery is a community distribution marketplace that supports hosted URL releases and local MCPB bundles, with a gateway and discovery experience layered around the server.",
    listingLabel: "Smithery publish overview",
    listingUrl: "https://smithery.mintlify.app/build",
    status: "verified-path",
    eligibility:
      "The checked docs describe URL-based publishing for Streamable HTTP servers and local MCPB publishing. API publishing requires a Smithery API key and namespace.",
    review:
      "Smithery's publish docs describe accepted release types and generated endpoints. Current quality, review, and distribution terms should be checked in the portal for the specific release.",
    cost:
      "No listing price is stated in the checked publish docs. Confirm current account, gateway, hosting, and usage terms before publishing.",
    unknowns: [
      "Current plan limits, moderation or review policy, and distribution guarantees.",
      "Which hosted or local release shape best matches the server's auth and operational model."
    ],
    checklist: [
      "Choose a deployed Streamable HTTP URL or a local MCPB bundle and keep the source version reproducible.",
      "Create or confirm the namespace and API credentials only in the authorized publishing environment.",
      "Document auth, environment variables, support contact, and the generated MCP endpoint before sharing it.",
      "Record the release status, warnings, generated URL, and any gateway or usage terms."
    ],
    sources: [
      {
        label: "Smithery publish overview",
        url: "https://smithery.mintlify.app/build"
      },
      {
        label: "Smithery publish API",
        url: "https://smithery.mintlify.app/api-reference/servers/publish-a-server"
      }
    ]
  },
  {
    slug: "glama",
    name: "Glama MCP registry and gateway",
    kind: "community-directory",
    mode: "both",
    audience: "longtail",
    summary:
      "Glama is a community directory and gateway that indexes GitHub servers and public remote connectors, with tool-level discovery and optional hosted access.",
    listingLabel: "Glama submission FAQ",
    listingUrl: "https://glama.ai/mcp/faq",
    status: "verified-path",
    eligibility:
      "The checked FAQ describes GitHub repository submissions and HTTPS Streamable HTTP connectors. Optional test credentials or OAuth details can help Glama verify a private connector path.",
    review:
      "Glama describes automated license, security, and health checks for indexing. Unhealthy connectors remain pending; healthy submissions are public by default and discoverable.",
    cost:
      "Glama's public homepage says listing a server is free. Hosting, gateway, managed credentials, and usage features have separate terms that should be checked before enabling them.",
    unknowns: [
      "Current indexing, claim, and connector verification behavior for a particular server.",
      "Whether a local package or remote endpoint should be listed first for the intended audience."
    ],
    checklist: [
      "Use a public GitHub repository for a local server or an HTTPS Streamable HTTP endpoint for a remote connector.",
      "Prepare a concise name, description, tool metadata, and the minimum test credential or OAuth flow needed for health checks.",
      "Review the public-by-default behavior and sensitive-data logging implications before enabling a hosted gateway.",
      "Retain the listing, health result, claim or challenge receipt, and deprecation path as separate evidence."
    ],
    sources: [
      {
        label: "Glama MCP submission FAQ",
        url: "https://glama.ai/mcp/faq"
      },
      {
        label: "Glama registry and gateway overview",
        url: "https://glama.ai/"
      }
    ]
  }
];

export const marketplaceKindFilters: Array<{ value: MarketplaceKind | "all"; label: string }> = [
  { value: "all", label: "All destination types" },
  { value: "first-party-directory", label: "First-party directories" },
  { value: "first-party-connection", label: "First-party connections" },
  { value: "official-registry", label: "Official registry" },
  { value: "community-directory", label: "Community directories" },
  { value: "community-marketplace", label: "Community marketplaces" }
];

export const marketplaceModeFilters: Array<{ value: MarketplaceMode | "all"; label: string }> = [
  { value: "all", label: "All integration modes" },
  { value: "hosted-remote-mcp", label: "Hosted remote MCP" },
  { value: "local-plugin-or-desktop", label: "Local plugin or desktop" },
  { value: "both", label: "Hosted and local" }
];

export function getMarketplaceGuide(slug: string): MarketplaceGuide | undefined {
  return marketplaceGuides.find((guide) => guide.slug === slug);
}

export function filterMarketplaceGuides(
  kind?: MarketplaceKind,
  mode?: MarketplaceMode
): MarketplaceGuide[] {
  return marketplaceGuides.filter((guide) => {
    const matchesKind = !kind || guide.kind === kind;
    const matchesMode = !mode || guide.mode === mode || guide.mode === "both";
    return matchesKind && matchesMode;
  });
}
