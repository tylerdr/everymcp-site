import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best MCP Servers for Cline (2026): Supercharge Your AI Coding Assistant",
  description:
    "Discover the best MCP servers for Cline, the AI coding assistant for VS Code. Connect Cline to GitHub, databases, web search, file systems, and more with Model Context Protocol.",
  alternates: {
    canonical: "/blog/mcp-servers-for-cline"
  },
  openGraph: {
    title: "Best MCP Servers for Cline (2026): Supercharge Your AI Coding Assistant",
    description:
      "The top MCP servers to connect Cline to your entire development stack — GitHub, databases, web search, and more.",
    url: "https://everymcp.com/blog/mcp-servers-for-cline",
    type: "article"
  }
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Best MCP Servers for Cline (2026): Supercharge Your AI Coding Assistant",
  description:
    "Discover the best MCP servers for Cline, the AI coding assistant for VS Code. Connect Cline to GitHub, databases, web search, file systems, and more with Model Context Protocol.",
  url: "https://everymcp.com/blog/mcp-servers-for-cline",
  datePublished: "2026-04-01",
  dateModified: "2026-04-01",
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

const mcpServers = [
  {
    name: "GitHub MCP Server",
    slug: "github",
    category: "Developer Tools",
    description:
      "Give Cline direct access to your GitHub repositories. Create branches, open pull requests, read issues, and push code — all from inside your editor without switching context.",
    useCases: ["Create PRs from Cline", "Read and comment on issues", "Search repository code", "Manage GitHub Actions"]
  },
  {
    name: "Filesystem MCP Server",
    slug: "filesystem",
    category: "File Management",
    description:
      "Extend Cline's file access beyond the current workspace. Read, write, and navigate files across your entire system — useful for monorepos and cross-project refactors.",
    useCases: ["Cross-project file access", "Read config files outside workspace", "Write generated assets", "Navigate complex directory trees"]
  },
  {
    name: "Postgres MCP Server",
    slug: "postgres",
    category: "Databases",
    description:
      "Connect Cline directly to your PostgreSQL database. Query schema, run migrations, and let Cline generate type-safe queries based on your actual table structure.",
    useCases: ["Schema-aware SQL generation", "Migration assistance", "Query optimization", "Data exploration"]
  },
  {
    name: "Web Search MCP Server",
    slug: "web-search",
    category: "Web & Search",
    description:
      "Give Cline live web search capability. When working with undocumented APIs, new libraries, or recent changes, Cline can search for up-to-date information without leaving your editor.",
    useCases: ["Look up latest library docs", "Find API examples", "Research error messages", "Check package versions"]
  },
  {
    name: "Supabase MCP Server",
    slug: "supabase",
    category: "Databases",
    description:
      "Connect Cline to your Supabase project. Read and write data, manage RLS policies, and generate type-safe queries against your real database schema.",
    useCases: ["Database schema inspection", "RLS policy generation", "Edge function development", "Data seeding"]
  },
  {
    name: "Browser Automation MCP Server",
    slug: "browser-automation",
    category: "Browser Automation",
    description:
      "Let Cline control a browser to test your code as it builds it. Navigate pages, fill forms, take screenshots, and run end-to-end tests — all inside a single coding session.",
    useCases: ["Automated UI testing", "Screenshot capture for debugging", "Form interaction testing", "Multi-page workflow validation"]
  },
  {
    name: "Slack MCP Server",
    slug: "slack-and-communication",
    category: "Communication",
    description:
      "Give Cline access to your team's Slack workspace. Read messages from relevant channels to understand context, get answers from teammates, or post updates when a build completes.",
    useCases: ["Read standup summaries", "Search for relevant discussions", "Post deploy notifications", "Understand feature requests"]
  },
  {
    name: "Docker MCP Server",
    slug: "docker-and-kubernetes",
    category: "DevOps",
    description:
      "Connect Cline to your Docker environment. List containers, inspect logs, run commands inside containers, and manage images — useful for debugging containerized apps.",
    useCases: ["Container log inspection", "Running commands in containers", "Image management", "Docker Compose coordination"]
  },
  {
    name: "Linear MCP Server",
    slug: "linear-and-project-management",
    category: "Project Management",
    description:
      "Connect Cline to your Linear issue tracker. Let Cline read the current sprint, understand task requirements, and update issue status as work is completed.",
    useCases: ["Read issue details before coding", "Update issue status", "Link commits to issues", "Sprint planning context"]
  },
  {
    name: "Sentry MCP Server",
    slug: "sentry",
    category: "Monitoring",
    description:
      "Give Cline access to your Sentry error tracker. When debugging production issues, Cline can read error details, stack traces, and occurrence data to understand root causes faster.",
    useCases: ["Error stack trace analysis", "Production bug debugging", "Error pattern identification", "Fix suggestions from real errors"]
  }
];

export default function McpServersForClinePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-8" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-gray-700">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/blog" className="hover:text-gray-700">Blog</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">MCP Servers for Cline</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-4">
            AI Coding Tools
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Best MCP Servers for Cline (2026)
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Cline is one of the most popular AI coding assistants for VS Code — and with Model Context Protocol support built in, you can connect it to your entire development stack in minutes.
          </p>
          <p className="text-sm text-gray-400">
            Published April 1, 2026 · 8 min read
          </p>
        </header>

        {/* Intro */}
        <section className="prose prose-gray max-w-none mb-12">
          <p>
            Cline (formerly Claude Dev) has become a go-to AI coding assistant for developers who want agentic capabilities inside VS Code. Unlike simpler autocomplete tools, Cline can plan, execute, and iterate on multi-step coding tasks — reading files, running terminal commands, and browsing the web.
          </p>
          <p>
            What makes Cline especially powerful in 2026 is its native support for the <strong>Model Context Protocol (MCP)</strong>. MCP servers are plugins that give Cline structured access to external tools and data sources — your database, issue tracker, monitoring platform, or any API — without unsafe workarounds.
          </p>
          <p>
            This guide covers the 10 best MCP servers to pair with Cline, what each one enables, and how to configure them.
          </p>
        </section>

        {/* What is MCP for Cline */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How MCP Works in Cline</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <p className="text-gray-700 mb-4">
              MCP is an open standard developed by Anthropic that lets AI assistants like Cline communicate with external tools using a consistent protocol. When you install an MCP server:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-1">→</span>
                <span>Cline discovers the tools that server exposes (read file, query database, send message, etc.)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-1">→</span>
                <span>When working on a task, Cline can call those tools directly with proper type checking</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-1">→</span>
                <span>Results come back as structured data Cline can reason about and act on</span>
              </li>
            </ul>
          </div>
          <p className="text-gray-700">
            To add an MCP server in Cline, open the Cline panel in VS Code, click the MCP Servers tab, and add your server configuration. Most servers are available as npm packages and require a simple JSON config entry.
          </p>
        </section>

        {/* Server List */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Top MCP Servers for Cline</h2>
          <div className="space-y-8">
            {mcpServers.map((server, index) => (
              <div key={server.slug} className="border border-gray-200 rounded-lg p-6 hover:border-indigo-300 transition-colors">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-indigo-200">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{server.name}</h3>
                      <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{server.category}</span>
                    </div>
                  </div>
                  <Link
                    href={`/mcp/${server.slug}`}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium whitespace-nowrap"
                  >
                    View details →
                  </Link>
                </div>
                <p className="text-gray-600 mb-4">{server.description}</p>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Use Cases</p>
                  <div className="flex flex-wrap gap-2">
                    {server.useCases.map((uc) => (
                      <span key={uc} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                        {uc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Configuration section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Configuring MCP Servers in Cline</h2>
          <p className="text-gray-700 mb-4">
            Adding MCP servers to Cline is straightforward. Cline stores its MCP configuration in <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">~/.cline/mcp-settings.json</code> (or in your VS Code workspace settings).
          </p>
          <div className="bg-gray-900 rounded-lg p-6 mb-6 overflow-x-auto">
            <pre className="text-sm text-gray-200 whitespace-pre">
{`{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-token-here"
      }
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://user:pass@localhost/db"
      }
    }
  }
}`}
            </pre>
          </div>
          <p className="text-gray-700">
            Each server entry specifies the command to run (usually <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">npx</code> with the package name) and any environment variables needed for authentication. Most servers publish official packages on npm — check the server&apos;s documentation for the exact package name and required credentials.
          </p>
        </section>

        {/* Tips section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Tips for Using MCP with Cline</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <span className="text-indigo-500 font-bold text-lg">1.</span>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Start with one server</p>
                <p className="text-gray-600">Adding too many MCP servers at once can make Cline&apos;s context larger and slower. Start with the server most relevant to your current project and add more as needed.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-indigo-500 font-bold text-lg">2.</span>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Use read-only credentials where possible</p>
                <p className="text-gray-600">For data sources like databases, use read-only credentials unless Cline needs to write. This limits blast radius if an AI action goes wrong.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-indigo-500 font-bold text-lg">3.</span>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Reference tools explicitly in your prompts</p>
                <p className="text-gray-600">Cline will discover MCP tools automatically, but explicitly mentioning them in prompts gets better results: &quot;Use the GitHub MCP server to find open issues labeled &apos;bug&apos; and write fixes for each one.&quot;</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-indigo-500 font-bold text-lg">4.</span>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Combine servers for compound workflows</p>
                <p className="text-gray-600">The real power comes from combining servers. Pair GitHub + Linear to let Cline read issue requirements, write code, and update the ticket in one flow. Pair Sentry + Filesystem to read a production error and apply a fix without leaving the editor.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-indigo-50 border border-indigo-100 rounded-xl p-8 text-center mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Find More MCP Servers for Cline
          </h2>
          <p className="text-gray-600 mb-6">
            Browse the full directory of 1,000+ MCP servers — filtered by category, language, and compatibility.
          </p>
          <Link
            href="/directory"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Browse All MCP Servers →
          </Link>
        </section>

        {/* Related Posts */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Related Guides</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/blog/mcp-servers-for-cursor-and-vscode" className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
              <p className="font-semibold text-gray-900 mb-1">MCP Servers for Cursor & VS Code</p>
              <p className="text-sm text-gray-500">Best MCP integrations for AI-powered editors</p>
            </Link>
            <Link href="/blog/mcp-servers-for-github-copilot" className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
              <p className="font-semibold text-gray-900 mb-1">MCP Servers for GitHub Copilot</p>
              <p className="text-sm text-gray-500">Extend Copilot with MCP tool integrations</p>
            </Link>
            <Link href="/blog/mcp-servers-for-claude-desktop" className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
              <p className="font-semibold text-gray-900 mb-1">MCP Servers for Claude Desktop</p>
              <p className="text-sm text-gray-500">Top MCP servers for Claude Desktop users</p>
            </Link>
            <Link href="/blog/how-to-build-an-mcp-server" className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
              <p className="font-semibold text-gray-900 mb-1">How to Build an MCP Server</p>
              <p className="text-sm text-gray-500">Step-by-step guide to building your own MCP server</p>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
