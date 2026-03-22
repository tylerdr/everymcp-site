import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best MCP Servers for GitHub Copilot & VS Code in 2026",
  description:
    "Extend GitHub Copilot and VS Code with the best MCP servers. Connect Copilot to databases, search, APIs, and infrastructure tools using Model Context Protocol.",
  alternates: {
    canonical: "/blog/mcp-servers-for-github-copilot"
  },
  openGraph: {
    title: "Best MCP Servers for GitHub Copilot & VS Code in 2026",
    description:
      "The top MCP servers to connect GitHub Copilot and VS Code to databases, search, APIs, and real-time tools.",
    url: "https://everymcp.com/blog/mcp-servers-for-github-copilot",
    type: "article"
  }
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Best MCP Servers for GitHub Copilot & VS Code in 2026",
  description:
    "Extend GitHub Copilot and VS Code with the best MCP servers — connecting your coding assistant to databases, search, APIs, and real-world tools.",
  url: "https://everymcp.com/blog/mcp-servers-for-github-copilot",
  datePublished: "2026-03-22",
  dateModified: "2026-03-22",
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

export default function MCPServersForCopilotPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <main className="min-h-screen bg-gray-950 text-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-16">
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500 mb-8">
            <Link href="/" className="hover:text-purple-400 transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/blog" className="hover:text-purple-400 transition-colors">Blog</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-300">MCP Servers for GitHub Copilot</span>
          </nav>

          {/* Header */}
          <header className="mb-10">
            <div className="inline-block px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-xs font-medium mb-4">
              GitHub Copilot · VS Code · MCP Guide
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
              Best MCP Servers for GitHub Copilot & VS Code in 2026
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              GitHub Copilot added MCP support in 2025, and VS Code followed shortly after. Now your
              coding assistant can reach outside the editor and pull in live data from databases,
              APIs, search engines, and your own infrastructure — without leaving VS Code.
            </p>
            <div className="mt-4 text-sm text-gray-500">
              Published March 22, 2026 · 9 min read
            </div>
          </header>

          {/* Intro */}
          <section className="mb-10 prose prose-invert prose-purple max-w-none">
            <p className="text-gray-300 leading-relaxed">
              The Model Context Protocol turns GitHub Copilot from a code completion engine into a
              full AI agent. With the right MCP servers installed, Copilot can query your production
              database, search the web, read your Notion docs, inspect your Kubernetes cluster, and
              commit changes to GitHub — all from a single chat session in VS Code.
            </p>
            <p className="text-gray-300 leading-relaxed mt-4">
              This guide covers the best MCP servers to connect to GitHub Copilot and VS Code,
              organized by use case. All servers listed here work with the VS Code MCP extension
              and GitHub Copilot's agent mode.
            </p>
          </section>

          {/* How to Set Up MCP in VS Code */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">How to Set Up MCP in VS Code</h2>
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
              <p className="text-gray-300 text-sm leading-relaxed">
                VS Code supports MCP servers via the{" "}
                <span className="text-purple-400 font-medium">.vscode/mcp.json</span> config file
                in your workspace, or globally via User Settings. Add a server once, and it's
                available in every Copilot chat session.
              </p>
              <pre className="mt-4 text-sm text-green-400 overflow-x-auto">
{`// .vscode/mcp.json
{
  "servers": {
    "postgres": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://..."
      }
    }
  }
}`}
              </pre>
            </div>
            <p className="text-gray-400 text-sm">
              Each server entry specifies a transport type (stdio or http), the command to run, and
              any environment variables. VS Code starts the server process when you open a Copilot
              chat that needs it.
            </p>
          </section>

          {/* Database MCP Servers */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Database MCP Servers</h2>
            <p className="text-gray-400 mb-6">
              The most common use case: give Copilot read access to your database so it can write
              queries, explain schemas, and debug data issues with actual table context.
            </p>

            <div className="space-y-4">
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">PostgreSQL MCP Server</h3>
                    <p className="text-purple-400 text-sm mt-0.5">@modelcontextprotocol/server-postgres</p>
                  </div>
                  <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/20">Official</span>
                </div>
                <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                  Anthropic's official Postgres server. Exposes read-only tools for listing schemas,
                  describing tables, running SELECT queries, and explaining query plans. Safe for
                  production connections — write operations are blocked by default.
                </p>
                <div className="mt-3 flex gap-2 flex-wrap">
                  <span className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded">PostgreSQL</span>
                  <span className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded">Supabase</span>
                  <span className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded">Neon</span>
                  <span className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded">RDS</span>
                </div>
              </div>

              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">SQLite MCP Server</h3>
                    <p className="text-purple-400 text-sm mt-0.5">@modelcontextprotocol/server-sqlite</p>
                  </div>
                  <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/20">Official</span>
                </div>
                <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                  The zero-setup database server. Point it at a local .db file and Copilot can
                  query it directly. Ideal for local development databases, test fixtures, or
                  any SQLite-backed application.
                </p>
              </div>

              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h3 className="text-lg font-semibold text-white">MySQL MCP Server</h3>
                <p className="text-purple-400 text-sm mt-0.5">mysql-mcp-server</p>
                <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                  Community-built MySQL server with schema introspection and query execution.
                  Supports MySQL 5.7+ and MariaDB. Good for legacy stacks still running MySQL.
                </p>
              </div>
            </div>
          </section>

          {/* Search MCP Servers */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Web Search MCP Servers</h2>
            <p className="text-gray-400 mb-6">
              Let Copilot look things up in real time — documentation, Stack Overflow answers,
              library changelogs, CVEs. Dramatically reduces hallucination on version-specific questions.
            </p>

            <div className="space-y-4">
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Brave Search MCP</h3>
                    <p className="text-purple-400 text-sm mt-0.5">@modelcontextprotocol/server-brave-search</p>
                  </div>
                  <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/20">Official</span>
                </div>
                <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                  Real-time web search powered by Brave's independent index. Requires a free Brave
                  Search API key. The go-to for adding web awareness to any MCP-compatible host.
                  Works perfectly in VS Code + Copilot.
                </p>
              </div>

              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h3 className="text-lg font-semibold text-white">Fetch MCP</h3>
                <p className="text-purple-400 text-sm mt-0.5">@modelcontextprotocol/server-fetch</p>
                <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                  Simple URL fetching — pulls the content of any URL and returns it as text.
                  Useful for reading documentation pages, API references, or changelogs that
                  aren't in your training data. Pairs well with search.
                </p>
              </div>
            </div>
          </section>

          {/* Dev Tools MCP Servers */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Developer Toolchain MCP Servers</h2>
            <p className="text-gray-400 mb-6">
              Connect Copilot to the rest of your dev stack — issue trackers, CI pipelines,
              error monitoring, and cloud infrastructure.
            </p>

            <div className="space-y-4">
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">GitHub MCP Server</h3>
                    <p className="text-purple-400 text-sm mt-0.5">@modelcontextprotocol/server-github</p>
                  </div>
                  <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/20">Official</span>
                </div>
                <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                  Maintained by GitHub. Lets Copilot search repos, read files across branches,
                  create issues, open pull requests, and check CI status — without leaving the
                  chat interface. Particularly powerful for cross-repo navigation.
                </p>
              </div>

              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h3 className="text-lg font-semibold text-white">Linear MCP Server</h3>
                <p className="text-purple-400 text-sm mt-0.5">linear-mcp</p>
                <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                  Pull Linear issues, sprint cycles, and project status into Copilot context.
                  Great for implementation sessions — Copilot can read the actual ticket
                  requirements rather than relying on your summary.
                </p>
              </div>

              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h3 className="text-lg font-semibold text-white">Sentry MCP Server</h3>
                <p className="text-purple-400 text-sm mt-0.5">sentry-mcp</p>
                <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                  Fetch live error events, stack traces, and issue metadata from Sentry. When
                  debugging, Copilot can read the actual error data — not just your description
                  of it. Dramatically speeds up bug investigation sessions.
                </p>
              </div>
            </div>
          </section>

          {/* File System */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">File System MCP Servers</h2>

            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Filesystem MCP Server</h3>
                  <p className="text-purple-400 text-sm mt-0.5">@modelcontextprotocol/server-filesystem</p>
                </div>
                <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/20">Official</span>
              </div>
              <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                Sandboxed read/write access to a local directory tree. While VS Code + Copilot
                already has some file awareness through the editor, the Filesystem MCP server
                gives more explicit, structured access — useful for large codebases where
                navigation context matters.
              </p>
              <div className="mt-3 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-400 text-xs">
                  ⚠️ Security note: Always scope the allowed path to your project directory, not your home
                  folder. The server will only access files within the configured root.
                </p>
              </div>
            </div>
          </section>

          {/* Infrastructure */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Infrastructure MCP Servers</h2>

            <div className="space-y-4">
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Cloudflare MCP Server</h3>
                    <p className="text-purple-400 text-sm mt-0.5">@cloudflare/mcp-server-cloudflare</p>
                  </div>
                  <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/20">Official</span>
                </div>
                <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                  Built and maintained by Cloudflare. Covers Workers scripts, KV namespaces, R2
                  buckets, D1 databases, and Analytics. If you deploy on Cloudflare, this server
                  turns Copilot into a first-class Cloudflare admin interface.
                </p>
              </div>

              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h3 className="text-lg font-semibold text-white">Docker MCP Server</h3>
                <p className="text-purple-400 text-sm mt-0.5">docker-mcp</p>
                <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                  List containers, inspect images, view logs, and run exec commands in running
                  containers. Useful for debugging local environments and asking Copilot to
                  diagnose container issues using real runtime data.
                </p>
              </div>
            </div>
          </section>

          {/* Recommended Stack */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">Recommended Starter Stack</h2>
            <p className="text-gray-400 mb-6">
              For most developers, this combination covers 90% of use cases:
            </p>
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <ol className="space-y-3">
                {[
                  { n: 1, name: "Brave Search MCP", reason: "Real-time web lookups. Install first." },
                  { n: 2, name: "GitHub MCP", reason: "Cross-repo navigation and PR management." },
                  { n: 3, name: "PostgreSQL or SQLite MCP", reason: "Database context for your specific stack." },
                  { n: 4, name: "Fetch MCP", reason: "Pull docs and APIs on demand." },
                  { n: 5, name: "Sentry MCP (if you use it)", reason: "Real error data speeds up debugging 10x." }
                ].map((item) => (
                  <li key={item.n} className="flex gap-3 items-start">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-xs flex items-center justify-center font-bold">
                      {item.n}
                    </span>
                    <div>
                      <span className="text-white font-medium">{item.name}</span>
                      <span className="text-gray-500 text-sm ml-2">— {item.reason}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-gradient-to-br from-purple-900/30 to-gray-900 border border-purple-500/20 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Browse the Full MCP Directory</h2>
            <p className="text-gray-400 mb-6">
              600+ verified MCP servers indexed by category, language, and use case.
              Find the right server in seconds.
            </p>
            <Link
              href="/directory"
              className="inline-block px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-colors"
            >
              Explore All MCP Servers →
            </Link>
          </section>

          {/* Related Posts */}
          <section className="mt-14">
            <h2 className="text-xl font-bold text-white mb-4">Related Guides</h2>
            <div className="space-y-3">
              {[
                { href: "/blog/best-mcp-servers-2026", title: "Best MCP Servers in 2026: Top Tools Ranked" },
                { href: "/blog/mcp-servers-for-database-access", title: "Best MCP Servers for Database Access" },
                { href: "/blog/how-to-choose-an-mcp-server", title: "How to Choose the Right MCP Server" }
              ].map((post) => (
                <Link
                  key={post.href}
                  href={post.href}
                  className="block text-purple-400 hover:text-purple-300 text-sm transition-colors"
                >
                  → {post.title}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
