export const categories = [
  {
    slug: "web-search-research",
    name: "Web Search & Research",
    blurb:
      "Servers that collect, summarize, and cite web information for assistants and agents."
  },
  {
    slug: "development-tools",
    name: "Development Tools",
    blurb:
      "Repositories and tooling servers for code workflows, docs, and local developer operations."
  },
  {
    slug: "file-systems-storage",
    name: "File Systems & Storage",
    blurb:
      "MCP servers for local files, object storage, and structured content access."
  },
  {
    slug: "databases",
    name: "Databases",
    blurb:
      "MCP connectors for SQL and vector databases used in modern application stacks."
  },
  {
    slug: "cloud-services",
    name: "Cloud Services",
    blurb:
      "Integrations for AWS, GCP, Cloudflare, and cloud-native infrastructure tooling."
  },
  {
    slug: "communication",
    name: "Communication",
    blurb:
      "Email, chat, calendar, and workspace integrations for operational workflows."
  },
  {
    slug: "browser-automation",
    name: "Browser Automation",
    blurb:
      "Servers that automate browsers and web sessions for testing and workflow execution."
  },
  {
    slug: "data-analysis",
    name: "Data Analysis",
    blurb:
      "Analytics, observability, metrics, and reporting integrations for data-heavy teams."
  },
  {
    slug: "memory-context",
    name: "Memory & Context",
    blurb:
      "Persistent memory and context services that improve long-running agent sessions."
  },
  {
    slug: "ai-ml-tools",
    name: "AI & ML Tools",
    blurb:
      "Specialized AI tooling servers for model workflows, research, and applied ML tasks."
  }
] as const;

export type CategorySlug = (typeof categories)[number]["slug"];
