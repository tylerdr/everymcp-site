import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best MCP Servers for Claude AI: Supercharge Your Claude Setup",
  description:
    "Discover the best MCP servers to connect with Claude AI. From file system access to web search, databases, and APIs — extend Claude's capabilities with Model Context Protocol tools.",
  alternates: {
    canonical: "/blog/mcp-servers-for-claude-ai"
  },
  openGraph: {
    title: "Best MCP Servers for Claude AI: Supercharge Your Claude Setup",
    description:
      "The top MCP servers to extend Claude AI with file access, web search, databases, code execution, and more.",
    url: "https://everymcp.com/blog/mcp-servers-for-claude-ai",
    type: "article"
  }
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Best MCP Servers for Claude AI: Supercharge Your Claude Setup",
  description:
    "Discover the best MCP servers to connect with Claude AI. From file system access to web search, databases, and APIs — extend Claude's capabilities with Model Context Protocol tools.",
  url: "https://everymcp.com/blog/mcp-servers-for-claude-ai",
  datePublished: "2026-03-21",
  dateModified: "2026-03-21",
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

export default function MCPServersForClaudePage() {
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
            <span className="text-gray-300">MCP Servers for Claude AI</span>
          </nav>

          {/* Header */}
          <header className="mb-10">
            <div className="inline-block px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-xs font-medium mb-4">
              Claude AI · MCP Guide
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
              Best MCP Servers for Claude AI: Supercharge Your Claude Setup
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              Claude is already one of the most capable AI assistants available — but with the right
              MCP servers connected, it transforms into something far more powerful. This guide covers
              the top Model Context Protocol servers to connect with Claude Desktop, Claude Code, and
              the Claude API.
            </p>
            <div className="mt-4 text-sm text-gray-500">
              Published March 21, 2026 · 8 min read
            </div>
          </header>

          {/* Intro */}
          <section className="mb-10 prose prose-invert prose-purple max-w-none">
            <p className="text-gray-300 leading-relaxed">
              The Model Context Protocol (MCP) is Anthropic&apos;s open standard for giving AI models
              structured access to external tools, data sources, and services. Claude supports MCP
              natively — and the ecosystem has exploded with hundreds of servers covering everything
              from local file access to real-time web search and database queries.
            </p>
            <p className="text-gray-300 leading-relaxed mt-4">
              Whether you&apos;re a developer building Claude-powered apps or a power user running
              Claude Desktop, connecting the right MCP servers is the single highest-leverage upgrade
              you can make.
            </p>
          </section>

          {/* TOC */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-10">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">In This Guide</h2>
            <ol className="space-y-2 text-purple-400 text-sm">
              <li><a href="#filesystem" className="hover:text-purple-300 transition-colors">1. Filesystem & Local Access</a></li>
              <li><a href="#web-search" className="hover:text-purple-300 transition-colors">2. Web Search & Browsing</a></li>
              <li><a href="#databases" className="hover:text-purple-300 transition-colors">3. Databases & Data Access</a></li>
              <li><a href="#code" className="hover:text-purple-300 transition-colors">4. Code Execution & Dev Tools</a></li>
              <li><a href="#productivity" className="hover:text-purple-300 transition-colors">5. Productivity & Integrations</a></li>
              <li><a href="#memory" className="hover:text-purple-300 transition-colors">6. Memory & Knowledge</a></li>
              <li><a href="#setup" className="hover:text-purple-300 transition-colors">7. How to Set Up MCP with Claude</a></li>
            </ol>
          </div>

          {/* Section 1 */}
          <section id="filesystem" className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">1. Filesystem & Local Access</h2>
            <p className="text-gray-300 leading-relaxed mb-6">
              By default, Claude can&apos;t read files on your computer. The filesystem MCP server
              changes that instantly — giving Claude read and write access to directories you specify.
            </p>

            <div className="space-y-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">@modelcontextprotocol/server-filesystem</h3>
                  <span className="text-xs px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full">Official</span>
                </div>
                <p className="text-gray-400 text-sm mb-3">
                  The official Anthropic filesystem MCP server. Gives Claude read/write access to any
                  directory. Essential for code review, file organization, document editing, and local
                  project work.
                </p>
                <div className="bg-gray-950 rounded-lg p-3 text-xs font-mono text-gray-400">
                  npx @modelcontextprotocol/server-filesystem /path/to/directory
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">Desktop Commander</h3>
                  <span className="text-xs px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full">Popular</span>
                </div>
                <p className="text-gray-400 text-sm">
                  Extends filesystem access with terminal command execution, process management, and
                  full desktop control. One of the most-installed MCP servers in the community.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section id="web-search" className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">2. Web Search & Browsing</h2>
            <p className="text-gray-300 leading-relaxed mb-6">
              Claude&apos;s training data has a knowledge cutoff. Web search MCP servers give it real-time
              access to current information — essential for research, fact-checking, and staying
              up-to-date.
            </p>

            <div className="space-y-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">Brave Search MCP</h3>
                  <span className="text-xs px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full">Official</span>
                </div>
                <p className="text-gray-400 text-sm mb-3">
                  Official Brave Search integration. No tracking, strong privacy defaults, fast API
                  responses. Free tier available with 2,000 queries/month. Best all-around search
                  server for Claude.
                </p>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">Puppeteer MCP</h3>
                  <span className="text-xs px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full">Official</span>
                </div>
                <p className="text-gray-400 text-sm">
                  Full browser automation — Claude can navigate pages, click, fill forms, take
                  screenshots, and extract content from any website. Ideal for complex web research
                  and automation tasks.
                </p>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">Fetch MCP</h3>
                  <span className="text-xs px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full">Popular</span>
                </div>
                <p className="text-gray-400 text-sm">
                  Lightweight URL fetching. Claude can pull any web page, API response, or document
                  directly into context. Simpler than Puppeteer — great for reading docs and articles.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section id="databases" className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">3. Databases & Data Access</h2>
            <p className="text-gray-300 leading-relaxed mb-6">
              Connect Claude directly to your databases for natural language querying, schema exploration,
              and data analysis — no SQL expertise required from the user.
            </p>

            <div className="space-y-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">PostgreSQL MCP</h3>
                  <span className="text-xs px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full">Official</span>
                </div>
                <p className="text-gray-400 text-sm">
                  Read-only access to PostgreSQL databases. Claude can explore schemas, run queries,
                  and analyze your data. Works with Supabase, Neon, and any standard Postgres instance.
                </p>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">SQLite MCP</h3>
                  <span className="text-xs px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full">Official</span>
                </div>
                <p className="text-gray-400 text-sm">
                  Local SQLite database access with read/write support. Perfect for local development,
                  app data analysis, and lightweight data storage during Claude sessions.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section id="code" className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">4. Code Execution & Dev Tools</h2>
            <p className="text-gray-300 leading-relaxed mb-6">
              Give Claude the ability to actually run code — not just write it. These servers
              unlock testing, debugging, and full development workflows.
            </p>

            <div className="space-y-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">GitHub MCP</h3>
                  <span className="text-xs px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full">Official</span>
                </div>
                <p className="text-gray-400 text-sm">
                  Full GitHub integration — Claude can read repos, create PRs, review code, manage
                  issues, and interact with the GitHub API. Essential for software teams using Claude
                  in their development workflow.
                </p>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">Git MCP</h3>
                  <span className="text-xs px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full">Official</span>
                </div>
                <p className="text-gray-400 text-sm">
                  Local git repository operations — read history, diffs, commits, and branches.
                  Claude can analyze your codebase history and understand how your project evolved.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section id="productivity" className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">5. Productivity & Integrations</h2>
            <p className="text-gray-300 leading-relaxed mb-6">
              Connect Claude to the tools you already use daily. These integrations turn Claude
              into a true productivity co-pilot across your entire workflow.
            </p>

            <div className="space-y-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">Slack MCP</h3>
                  <span className="text-xs px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full">Popular</span>
                </div>
                <p className="text-gray-400 text-sm">
                  Read Slack channels, threads, and DMs. Claude can summarize conversations, find
                  decisions, draft responses, and help you catch up on missed discussions.
                </p>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">Google Drive MCP</h3>
                  <span className="text-xs px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full">Official</span>
                </div>
                <p className="text-gray-400 text-sm">
                  Access Google Drive files, Docs, and Sheets. Claude can read, summarize, and
                  analyze your documents directly from Drive without downloading anything.
                </p>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">Linear MCP</h3>
                  <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">Community</span>
                </div>
                <p className="text-gray-400 text-sm">
                  Query and update Linear issues directly from Claude. Great for engineering teams
                  who want to discuss tickets, update statuses, and manage sprints conversationally.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section id="memory" className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">6. Memory & Knowledge</h2>
            <p className="text-gray-300 leading-relaxed mb-6">
              Claude&apos;s context window doesn&apos;t persist between conversations. Memory MCP servers
              solve this — letting Claude remember facts, preferences, and information across sessions.
            </p>

            <div className="space-y-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">Memory MCP (Knowledge Graph)</h3>
                  <span className="text-xs px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full">Official</span>
                </div>
                <p className="text-gray-400 text-sm">
                  Persistent memory using a local knowledge graph. Claude can store and retrieve
                  entities, relationships, and facts across conversations — giving it genuine
                  long-term memory.
                </p>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">Qdrant MCP</h3>
                  <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">Community</span>
                </div>
                <p className="text-gray-400 text-sm">
                  Semantic search over your knowledge base using vector embeddings. Claude can find
                  relevant documents and context even when the exact terms don&apos;t match.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7 - Setup */}
          <section id="setup" className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">7. How to Set Up MCP Servers with Claude</h2>
            <p className="text-gray-300 leading-relaxed mb-6">
              Setting up MCP servers for Claude Desktop takes about 5 minutes. Here&apos;s the quick version:
            </p>

            <div className="space-y-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">1</span>
                  <h3 className="font-semibold text-white">Open Claude Desktop settings</h3>
                </div>
                <p className="text-gray-400 text-sm ml-9">
                  Go to Claude Desktop → Settings → Developer → Edit Config. This opens your
                  <code className="text-purple-400 bg-gray-950 px-1 rounded">claude_desktop_config.json</code> file.
                </p>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">2</span>
                  <h3 className="font-semibold text-white">Add server configuration</h3>
                </div>
                <div className="ml-9 bg-gray-950 rounded-lg p-3 text-xs font-mono text-gray-300">
                  <pre>{`{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-filesystem",
        "/Users/yourname/Documents"
      ]
    }
  }
}`}</pre>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">3</span>
                  <h3 className="font-semibold text-white">Restart Claude Desktop</h3>
                </div>
                <p className="text-gray-400 text-sm ml-9">
                  Quit and reopen Claude Desktop. The MCP server icon will appear in the toolbar
                  when servers are connected and available.
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <div className="bg-gradient-to-br from-purple-900/30 to-gray-900 border border-purple-500/20 rounded-2xl p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-white mb-3">Find Every MCP Server in One Place</h2>
            <p className="text-gray-400 mb-6 max-w-lg mx-auto">
              EveryMCP indexes hundreds of MCP servers with detailed descriptions, setup guides,
              and category filters. Find exactly what you need for your Claude setup.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Browse All MCP Servers →
            </Link>
          </div>

          {/* Related Posts */}
          <div className="border-t border-gray-800 pt-8">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">More Guides</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/blog/best-mcp-servers-2026" className="group bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-purple-500/40 transition-colors">
                <div className="text-xs text-purple-400 mb-1">Guide</div>
                <div className="text-white font-medium group-hover:text-purple-300 transition-colors text-sm">Best MCP Servers in 2026</div>
              </Link>
              <Link href="/blog/mcp-servers-for-web-scraping" className="group bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-purple-500/40 transition-colors">
                <div className="text-xs text-purple-400 mb-1">Guide</div>
                <div className="text-white font-medium group-hover:text-purple-300 transition-colors text-sm">MCP Servers for Web Scraping</div>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
