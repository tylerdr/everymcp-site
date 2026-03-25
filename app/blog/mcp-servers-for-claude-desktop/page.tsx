import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best MCP Servers for Claude Desktop (2026) — Top Picks",
  description:
    "The best MCP servers for Claude Desktop in 2026. Add file access, web search, database connections, code execution, and more to Claude with these top Model Context Protocol servers.",
  alternates: {
    canonical: "/blog/mcp-servers-for-claude-desktop"
  },
  openGraph: {
    title: "Best MCP Servers for Claude Desktop (2026) — Top Picks",
    description:
      "Supercharge Claude Desktop with the best MCP servers for file access, web search, databases, code execution, and more.",
    url: "https://everymcp.com/blog/mcp-servers-for-claude-desktop",
    type: "article"
  }
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Best MCP Servers for Claude Desktop (2026) — Top Picks",
  description:
    "The best MCP servers for Claude Desktop in 2026. Add file access, web search, database connections, code execution, and more to Claude with these top Model Context Protocol servers.",
  url: "https://everymcp.com/blog/mcp-servers-for-claude-desktop",
  datePublished: "2026-03-25",
  dateModified: "2026-03-25",
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

export default function MCPServersForClaudeDesktop() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-16">
          {/* Breadcrumb */}
          <nav className="mb-8 text-sm text-gray-400">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/blog" className="hover:text-white transition-colors">
              Blog
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-300">MCP Servers for Claude Desktop</span>
          </nav>

          {/* Header */}
          <header className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm mb-6">
              <span>⚡</span>
              <span>Claude Desktop • MCP</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
              Best MCP Servers for Claude Desktop (2026)
            </h1>
            <p className="text-xl text-gray-400 leading-relaxed">
              Claude Desktop supports Model Context Protocol (MCP) natively, which means you can
              give Claude real tools — file access, web search, database queries, code execution,
              and more. Here are the top MCP servers to install right now.
            </p>
            <div className="flex items-center gap-4 mt-6 text-sm text-gray-500">
              <time dateTime="2026-03-25">March 25, 2026</time>
              <span>·</span>
              <span>8 min read</span>
              <span>·</span>
              <Link href="/servers" className="text-violet-400 hover:text-violet-300 transition-colors">
                Browse all MCP servers →
              </Link>
            </div>
          </header>

          {/* Intro */}
          <section className="mb-12 prose prose-invert max-w-none">
            <p className="text-gray-300 leading-relaxed mb-4">
              Claude Desktop ships with a built-in MCP client. That means every MCP server listed on{" "}
              <Link href="/" className="text-violet-400 hover:text-violet-300">EveryMCP</Link> is
              potentially one config entry away from being available to Claude. The question is: which
              ones are actually worth installing?
            </p>
            <p className="text-gray-300 leading-relaxed">
              We&apos;ve tested dozens of servers across categories. Below are the picks that actually
              improve Claude&apos;s day-to-day usefulness — covering your filesystem, the web, your
              databases, and your development workflow.
            </p>
          </section>

          {/* Quick setup box */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-12">
            <h2 className="text-lg font-semibold text-white mb-3">Quick Setup Reminder</h2>
            <p className="text-gray-400 text-sm mb-3">
              To add an MCP server to Claude Desktop, edit your{" "}
              <code className="bg-gray-800 px-1.5 py-0.5 rounded text-violet-300 text-xs">
                claude_desktop_config.json
              </code>{" "}
              file:
            </p>
            <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
              <li>macOS: <code className="text-gray-300 text-xs">~/Library/Application Support/Claude/claude_desktop_config.json</code></li>
              <li>Windows: <code className="text-gray-300 text-xs">%APPDATA%\Claude\claude_desktop_config.json</code></li>
            </ul>
          </div>

          {/* Category sections */}
          <div className="space-y-14">

            {/* File system */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-2">1. Filesystem Access</h2>
              <p className="text-gray-400 mb-6">
                Give Claude the ability to read, write, and manage files on your local machine. This
                unlocks project-level context — no more copy-pasting files into the chat window.
              </p>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">@modelcontextprotocol/server-filesystem</h3>
                    <p className="text-sm text-violet-400">Official Anthropic server</p>
                  </div>
                  <span className="px-2 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-full">
                    Most Popular
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  The official filesystem MCP server from Anthropic. Lets Claude read, write, create,
                  and delete files within directories you specify. You control exactly which paths are
                  accessible — Claude can&apos;t touch anything outside those boundaries.
                </p>
                <div className="bg-gray-950 rounded-lg p-4 text-xs font-mono text-gray-300 overflow-x-auto">
                  <pre>{`{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/projects"]
    }
  }
}`}</pre>
                </div>
              </div>
            </section>

            {/* Web search */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-2">2. Web Search & Browsing</h2>
              <p className="text-gray-400 mb-6">
                Claude&apos;s training data has a cutoff. MCP web servers give it live access to the
                internet — current news, documentation, prices, and anything else that changes.
              </p>

              <div className="space-y-4">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Brave Search MCP</h3>
                      <p className="text-sm text-violet-400">brave-search</p>
                    </div>
                    <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs rounded-full">
                      Privacy-first
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Uses the Brave Search API to give Claude real-time web search without tracking.
                    Free tier available. Requires a Brave Search API key but setup takes under 5 minutes.
                    Great for research tasks, fact-checking, and finding recent documentation.
                  </p>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-1">Fetch MCP</h3>
                  <p className="text-sm text-violet-400 mb-3">@modelcontextprotocol/server-fetch</p>
                  <p className="text-gray-400 text-sm">
                    Official Anthropic server for fetching URLs. Claude can retrieve any public webpage,
                    API endpoint, or RSS feed. No API key needed. Pairs well with web search — first
                    search for relevant URLs, then fetch the full content.
                  </p>
                </div>
              </div>
            </section>

            {/* Database */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-2">3. Database Access</h2>
              <p className="text-gray-400 mb-6">
                Connect Claude directly to your databases and let it write and run queries in natural
                language. Perfect for analytics, data exploration, and ad-hoc reporting.
              </p>

              <div className="space-y-4">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-1">SQLite MCP</h3>
                  <p className="text-sm text-violet-400 mb-3">@modelcontextprotocol/server-sqlite</p>
                  <p className="text-gray-400 text-sm">
                    Official SQLite server. Claude can run queries, explore schema, and create tables
                    in any SQLite database file you point it at. Zero infrastructure — just a file path.
                    Great for local data projects or prototyping.
                  </p>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">PostgreSQL MCP</h3>
                      <p className="text-sm text-violet-400">mcp-server-postgres</p>
                    </div>
                    <span className="px-2 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs rounded-full">
                      Production Ready
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Connect Claude to any PostgreSQL database. Full read/write access with schema
                    inspection. Claude can explore your data model, write complex JOINs, and generate
                    reports on demand. Use read-only credentials for safety in production environments.
                  </p>
                </div>
              </div>
            </section>

            {/* Dev tools */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-2">4. Development Tools</h2>
              <p className="text-gray-400 mb-6">
                These servers turn Claude into an active participant in your development workflow —
                reading your repos, running tests, and managing issues.
              </p>

              <div className="space-y-4">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">GitHub MCP</h3>
                      <p className="text-sm text-violet-400">@modelcontextprotocol/server-github</p>
                    </div>
                    <span className="px-2 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-full">
                      Essential
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Official GitHub integration. Claude can read repository files, list issues and PRs,
                    create issues, and comment on pull requests — all through natural language. Requires
                    a GitHub personal access token. One of the highest-value MCP servers for developers.
                  </p>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-1">Git MCP</h3>
                  <p className="text-sm text-violet-400 mb-3">mcp-server-git</p>
                  <p className="text-gray-400 text-sm">
                    Read git history, blame, diffs, and branch information from local repositories.
                    Great for understanding why code was written a certain way — ask Claude to explain
                    a commit history or find when a bug was introduced.
                  </p>
                </div>
              </div>
            </section>

            {/* Productivity */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-2">5. Productivity & Notes</h2>
              <p className="text-gray-400 mb-6">
                Connect Claude to the tools you already live in — your notes, tasks, and knowledge base.
              </p>

              <div className="space-y-4">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-1">Notion MCP</h3>
                  <p className="text-sm text-violet-400 mb-3">@notionhq/notion-mcp-server</p>
                  <p className="text-gray-400 text-sm">
                    Official server from Notion. Claude can search, read, and create pages in your
                    Notion workspace. Ask Claude to summarize your meeting notes, find a document, or
                    draft a new page directly into your workspace.
                  </p>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-1">Memory MCP</h3>
                  <p className="text-sm text-violet-400 mb-3">@modelcontextprotocol/server-memory</p>
                  <p className="text-gray-400 text-sm">
                    Gives Claude persistent memory using a knowledge graph stored locally. Claude can
                    remember facts across conversations — your preferences, project context, names, and
                    ongoing tasks. Pairs with any other server to make Claude more context-aware over time.
                  </p>
                </div>
              </div>
            </section>

          </div>

          {/* How to choose */}
          <section className="mt-14 mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">How to Choose What to Install</h2>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Don&apos;t install everything at once. Start with the servers that match how you actually
              work today:
            </p>
            <div className="space-y-4">
              {[
                {
                  role: "Engineer / Developer",
                  pick: "Filesystem + GitHub + Git",
                  why: "Get Claude reading your codebase and managing issues immediately."
                },
                {
                  role: "Data Analyst",
                  pick: "PostgreSQL or SQLite + Filesystem",
                  why: "Natural language queries on your actual data."
                },
                {
                  role: "Researcher / Writer",
                  pick: "Brave Search + Fetch + Notion",
                  why: "Live web access plus a direct line to your notes."
                },
                {
                  role: "General Power User",
                  pick: "Filesystem + Memory + Fetch",
                  why: "File access, persistent memory, and web browsing in one config."
                }
              ].map((item) => (
                <div key={item.role} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex gap-4">
                  <div className="flex-1">
                    <div className="text-white font-medium mb-1">{item.role}</div>
                    <div className="text-violet-400 text-sm font-mono mb-1">{item.pick}</div>
                    <div className="text-gray-400 text-sm">{item.why}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-2xl p-8 mb-12 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">Find More MCP Servers</h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              EveryMCP indexes hundreds of MCP servers across every category. Search by use case, filter
              by tags, and find exactly what you need.
            </p>
            <Link
              href="/servers"
              className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition-colors"
            >
              Browse All MCP Servers
              <span>→</span>
            </Link>
          </div>

          {/* Related posts */}
          <section>
            <h2 className="text-xl font-bold text-white mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  href: "/blog/best-mcp-servers-2026",
                  title: "Best MCP Servers in 2026",
                  desc: "Top Model Context Protocol tools ranked by adoption."
                },
                {
                  href: "/blog/how-to-build-an-mcp-server",
                  title: "How to Build an MCP Server",
                  desc: "Step-by-step guide to building your own MCP server."
                },
                {
                  href: "/blog/mcp-servers-for-github",
                  title: "MCP Servers for GitHub",
                  desc: "Best MCP tools for GitHub workflows and automation."
                },
                {
                  href: "/blog/mcp-servers-for-databases",
                  title: "MCP Servers for Databases",
                  desc: "Connect your AI agent to any database with MCP."
                }
              ].map((post) => (
                <Link
                  key={post.href}
                  href={post.href}
                  className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-5 transition-colors group"
                >
                  <div className="text-white font-medium group-hover:text-violet-300 transition-colors mb-1">
                    {post.title}
                  </div>
                  <div className="text-gray-400 text-sm">{post.desc}</div>
                </Link>
              ))}
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
