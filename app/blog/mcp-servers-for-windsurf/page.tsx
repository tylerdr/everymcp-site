import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best MCP Servers for Windsurf IDE (2026)",
  description:
    "Supercharge Windsurf IDE with the best MCP servers. Connect your AI coding assistant to databases, APIs, GitHub, Slack, web search, and more via Model Context Protocol.",
  alternates: {
    canonical: "/blog/mcp-servers-for-windsurf"
  },
  openGraph: {
    title: "Best MCP Servers for Windsurf IDE (2026)",
    description:
      "Supercharge Windsurf IDE with the best MCP servers — connect to databases, GitHub, APIs, and more.",
    url: "https://everymcp.com/blog/mcp-servers-for-windsurf",
    type: "article"
  }
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Best MCP Servers for Windsurf IDE (2026)",
  description:
    "Supercharge Windsurf IDE with the best MCP servers. Connect your AI coding assistant to databases, APIs, GitHub, Slack, web search, and more via Model Context Protocol.",
  url: "https://everymcp.com/blog/mcp-servers-for-windsurf",
  datePublished: "2026-03-24",
  dateModified: "2026-03-24",
  author: {
    "@type": "Organization",
    name: "EveryMCP",
    url: "https://everymcp.com"
  },
  publisher: {
    "@type": "Organization",
    name: "EveryMCP",
    url: "https://everymcp.com"
  }
};

const servers = [
  {
    name: "GitHub MCP Server",
    category: "Code & Version Control",
    description:
      "Let Windsurf's Cascade AI read issues, PRs, commits, and file trees directly from GitHub. Cascade can draft PR descriptions, auto-label issues, and answer questions about your codebase history without leaving the editor.",
    useCases: ["Search issues and PRs", "Read file contents from any branch", "Create or update issues"],
    slug: "github"
  },
  {
    name: "PostgreSQL MCP Server",
    category: "Databases",
    description:
      "Connect Windsurf directly to your PostgreSQL database. Cascade can read your schema, run read-only queries, and help you write migrations or debug slow queries with full context about your actual data structure.",
    useCases: ["Inspect table schemas", "Run exploratory queries", "Generate migration SQL"],
    slug: "postgresql"
  },
  {
    name: "Filesystem MCP Server",
    category: "File Management",
    description:
      "Give Cascade access to local directories beyond the current project. Useful for monorepos, reading shared config files, or pulling in documentation from a separate docs folder.",
    useCases: ["Read files outside the project root", "List directory trees", "Write generated files to disk"],
    slug: "filesystem"
  },
  {
    name: "Brave Search MCP Server",
    category: "Web & Research",
    description:
      "Let Cascade search the web in real time while you code. Instantly pull in documentation, Stack Overflow answers, package changelogs, or CVE details without switching browser tabs.",
    useCases: ["Search for library docs", "Look up error messages", "Find recent security advisories"],
    slug: "brave-search"
  },
  {
    name: "Slack MCP Server",
    category: "Communication",
    description:
      "Give Cascade context from your team's Slack conversations. Read threads about a bug, pull in a spec discussed in a channel, or post a build status update — all without leaving Windsurf.",
    useCases: ["Read channel messages and threads", "Search for decisions made in Slack", "Post messages to channels"],
    slug: "slack"
  },
  {
    name: "Linear MCP Server",
    category: "Project Management",
    description:
      "Connect Windsurf to your Linear issue tracker. Cascade can read the active sprint, pull issue details into context, and update issue status as you complete work.",
    useCases: ["Fetch issue details", "List active sprint tasks", "Update issue status"],
    slug: "linear"
  },
  {
    name: "Puppeteer MCP Server",
    category: "Browser Automation",
    description:
      "Give Cascade a real browser. Useful for end-to-end testing, scraping reference data, or verifying that a UI change actually looks right before you commit.",
    useCases: ["Screenshot pages for visual QA", "Run browser-based tests", "Scrape data for seeding"],
    slug: "puppeteer"
  },
  {
    name: "Memory MCP Server",
    category: "AI Context",
    description:
      "Persist project-specific facts across Cascade sessions. Store architecture decisions, coding conventions, or team preferences so Cascade remembers them every time you open the project.",
    useCases: ["Store architecture decisions", "Persist coding style rules", "Save recurring context"],
    slug: "memory"
  }
];

export default function MCPServersForWindsurf() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-16">
          {/* Breadcrumb */}
          <nav className="mb-8 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-300 transition-colors">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/blog" className="hover:text-gray-300 transition-colors">
              Blog
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-400">MCP Servers for Windsurf</span>
          </nav>

          {/* Header */}
          <header className="mb-12">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1 text-xs text-indigo-400 mb-6">
              <span>⚡</span>
              <span>IDE Integration Guide</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
              Best MCP Servers for Windsurf IDE (2026)
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed mb-6">
              Windsurf's Cascade AI becomes dramatically more capable when you connect it to external
              tools via Model Context Protocol (MCP). Here are the top MCP servers that Windsurf
              developers are using in 2026 to build faster.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <time dateTime="2026-03-24">March 24, 2026</time>
              <span>·</span>
              <span>8 min read</span>
              <span>·</span>
              <span>{servers.length} servers reviewed</span>
            </div>
          </header>

          {/* Intro */}
          <section className="prose prose-invert max-w-none mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Why MCP + Windsurf Is a Game Changer
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Windsurf (by Codeium) ships with Cascade — one of the most capable agentic AI coding
              assistants available. But Cascade's power multiplies when you give it real-world context
              through MCP servers. Instead of reasoning from file contents alone, Cascade can query
              your live database, read GitHub issues, search the web, or pull in Slack threads as it
              writes and reviews code.
            </p>
            <p className="text-gray-300 leading-relaxed mb-4">
              Windsurf supports MCP natively. You configure servers in{" "}
              <code className="bg-gray-800 px-1.5 py-0.5 rounded text-indigo-300 text-sm">
                ~/.codeium/windsurf/mcp_config.json
              </code>{" "}
              and they become available to Cascade in every project.
            </p>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
              <p className="text-sm font-semibold text-gray-300 mb-2">Quick config example:</p>
              <pre className="text-xs text-green-400 overflow-x-auto">{`{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "ghp_..." }
    }
  }
}`}</pre>
            </div>
          </section>

          {/* Server List */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-8">
              Top MCP Servers for Windsurf
            </h2>
            <div className="space-y-8">
              {servers.map((server, index) => (
                <div
                  key={server.slug}
                  className="border border-gray-800 rounded-xl p-6 bg-gray-900/50 hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-gray-600 text-sm font-mono">#{index + 1}</span>
                        <h3 className="text-lg font-semibold text-white">{server.name}</h3>
                      </div>
                      <span className="inline-block text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full px-2.5 py-0.5">
                        {server.category}
                      </span>
                    </div>
                    <Link
                      href={`/mcp/${server.slug}`}
                      className="text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 rounded-lg px-3 py-1.5 whitespace-nowrap transition-colors"
                    >
                      View details →
                    </Link>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed mb-4">
                    {server.description}
                  </p>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Common Use Cases
                    </p>
                    <ul className="space-y-1">
                      {server.useCases.map((uc) => (
                        <li key={uc} className="flex items-center gap-2 text-sm text-gray-400">
                          <span className="text-indigo-500">→</span>
                          {uc}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Setup Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">
              How to Enable MCP Servers in Windsurf
            </h2>
            <ol className="space-y-4 text-gray-300">
              {[
                {
                  step: "Open Windsurf Settings",
                  detail: "Go to Settings → MCP Servers, or edit ~/.codeium/windsurf/mcp_config.json directly."
                },
                {
                  step: "Add a server entry",
                  detail: "Each server needs a command, args, and optionally env vars for credentials."
                },
                {
                  step: "Restart Windsurf",
                  detail: "Reload the window or restart the app. The MCP server will appear in Cascade's tool list."
                },
                {
                  step: "Invoke from Cascade",
                  detail: "Just ask Cascade to use the tool. It will call the MCP server automatically when relevant."
                }
              ].map(({ step, detail }, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-sm font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-white">{step}</p>
                    <p className="text-sm text-gray-400 mt-0.5">{detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* CTA */}
          <section className="border border-indigo-500/20 rounded-xl p-8 bg-indigo-500/5 text-center mb-12">
            <h2 className="text-xl font-semibold text-white mb-3">
              Find More MCP Servers
            </h2>
            <p className="text-gray-400 mb-6">
              Browse 500+ MCP servers indexed by category, capability, and compatibility.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Explore EveryMCP Directory →
            </Link>
          </section>

          {/* Related Posts */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-6">Related Guides</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { href: "/blog/mcp-servers-for-cursor-and-vscode", title: "MCP Servers for Cursor & VS Code" },
                { href: "/blog/mcp-servers-for-github-copilot", title: "MCP Servers for GitHub Copilot" },
                { href: "/blog/how-to-build-an-mcp-server", title: "How to Build an MCP Server" },
                { href: "/blog/best-mcp-servers-2026", title: "Best MCP Servers in 2026" }
              ].map(({ href, title }) => (
                <Link
                  key={href}
                  href={href}
                  className="block border border-gray-800 rounded-lg p-4 hover:border-gray-600 hover:bg-gray-900 transition-colors"
                >
                  <span className="text-sm text-gray-300 hover:text-white transition-colors">
                    {title} →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
