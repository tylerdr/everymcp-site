import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best MCP Servers for Cursor and VS Code in 2026",
  description:
    "Discover the best Model Context Protocol (MCP) servers for Cursor AI and VS Code. Supercharge your IDE with tools for GitHub, databases, web search, file management, and more.",
  alternates: {
    canonical: "/blog/mcp-servers-for-cursor-and-vscode"
  },
  openGraph: {
    title: "Best MCP Servers for Cursor and VS Code in 2026",
    description:
      "The top MCP servers to supercharge Cursor AI and VS Code with GitHub, databases, web search, and more.",
    url: "https://everymcp.com/blog/mcp-servers-for-cursor-and-vscode",
    type: "article"
  }
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Best MCP Servers for Cursor and VS Code in 2026",
  description:
    "Discover the best Model Context Protocol (MCP) servers for Cursor AI and VS Code. Supercharge your IDE with tools for GitHub, databases, web search, file management, and more.",
  url: "https://everymcp.com/blog/mcp-servers-for-cursor-and-vscode",
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

const servers = [
  {
    name: "GitHub MCP Server",
    category: "Version Control",
    description:
      "The most essential MCP server for developers. Gives Cursor and VS Code Copilot direct access to your GitHub repos — search code, read files, create issues, open pull requests, and manage branches without leaving your editor. Dramatically reduces context switching.",
    useCases: ["Search across repos", "Create and review PRs", "File issues and comments", "Check CI status"],
    difficulty: "Easy",
  },
  {
    name: "Filesystem MCP Server",
    category: "File Management",
    description:
      "Enables AI-assisted file operations across your local filesystem. The official reference implementation from Anthropic. Your AI can read, write, move, and search files — making large refactors and project-wide changes much smoother.",
    useCases: ["Bulk file refactoring", "Project search", "Move/rename files", "Read config files"],
    difficulty: "Easy",
  },
  {
    name: "PostgreSQL MCP Server",
    category: "Database",
    description:
      "Connect Cursor or Copilot to your PostgreSQL database for schema inspection, query generation, and data exploration. Ask your AI to write migrations, explain table relationships, or debug slow queries using live schema context.",
    useCases: ["Generate migrations", "Explain schemas", "Debug queries", "Data exploration"],
    difficulty: "Medium",
  },
  {
    name: "Brave Search MCP",
    category: "Web Search",
    description:
      "Gives your IDE AI real-time web search via the Brave Search API. Useful when you need your AI to pull in up-to-date docs, check package versions, or research library APIs without leaving your editor.",
    useCases: ["Look up latest docs", "Check package changelogs", "Research error messages", "Find code examples"],
    difficulty: "Easy",
  },
  {
    name: "Puppeteer MCP Server",
    category: "Browser Automation",
    description:
      "Lets AI agents drive a headless Chromium browser. Useful for testing web UIs, scraping data needed for your app, or validating that your code produces the right visual output. A power tool for full-stack developers.",
    useCases: ["UI testing", "Web scraping", "Screenshot generation", "Form automation"],
    difficulty: "Medium",
  },
  {
    name: "SQLite MCP Server",
    category: "Database",
    description:
      "Lightweight alternative to PostgreSQL MCP for projects using SQLite. Great for mobile apps, local-first tools, and prototypes. The AI can read your schema, run queries, and help design new tables.",
    useCases: ["Local database queries", "Schema design", "Prototype data modeling", "Mobile app development"],
    difficulty: "Easy",
  },
  {
    name: "Slack MCP Server",
    category: "Communication",
    description:
      "Connects your AI coding assistant to Slack for reading messages, posting updates, and triggering notifications. Useful for teams wanting to automate status updates or pull requirements from Slack threads directly into code.",
    useCases: ["Post deployment notices", "Read ticket threads", "Notify team of PRs", "Pull requirements"],
    difficulty: "Medium",
  },
  {
    name: "Memory MCP Server",
    category: "Persistence",
    description:
      "Gives your AI a persistent knowledge graph across sessions. Instead of re-explaining your project architecture every session, the AI builds and queries a memory of your codebase, team conventions, and past decisions.",
    useCases: ["Persist coding conventions", "Remember architecture decisions", "Track past bugs", "Onboard AI to your stack"],
    difficulty: "Medium",
  },
];

const difficultyColors: Record<string, string> = {
  Easy: "text-green-400 bg-green-400/10",
  Medium: "text-yellow-400 bg-yellow-400/10",
  Hard: "text-red-400 bg-red-400/10",
};

export default function MCPServersForCursorVSCode() {
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
            <span className="text-gray-400">MCP Servers for Cursor & VS Code</span>
          </nav>

          {/* Header */}
          <header className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                IDE Integrations
              </span>
              <span className="text-xs text-gray-500">March 22, 2026</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
              Best MCP Servers for Cursor and VS Code in 2026
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed">
              Model Context Protocol (MCP) servers unlock serious superpowers for AI-powered IDEs like Cursor and VS Code with GitHub Copilot. Here are the top MCP servers developers are using to supercharge their workflow in 2026.
            </p>
          </header>

          {/* What is MCP for IDEs */}
          <section className="mb-12 p-6 bg-gray-900 rounded-xl border border-gray-800">
            <h2 className="text-xl font-semibold text-white mb-3">What is MCP and Why Does It Matter for IDEs?</h2>
            <p className="text-gray-400 leading-relaxed mb-3">
              Model Context Protocol (MCP) is an open standard that lets AI assistants — including Cursor&apos;s built-in AI and VS Code&apos;s GitHub Copilot — connect to external tools and data sources. Think of MCP servers as plugins that give your AI real capabilities beyond just reading your open files.
            </p>
            <p className="text-gray-400 leading-relaxed">
              With the right MCP servers configured, your IDE&apos;s AI can query live databases, push commits, search the web, read Slack messages, and remember your architecture decisions across sessions. It transforms a code autocomplete tool into a full coding agent.
            </p>
          </section>

          {/* Server list */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Top MCP Servers for Cursor & VS Code</h2>
            <div className="space-y-6">
              {servers.map((server, i) => (
                <div key={server.name} className="p-6 bg-gray-900 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <span className="text-xs text-gray-500 font-medium">{i + 1}.</span>
                      <h3 className="text-lg font-semibold text-white inline ml-2">{server.name}</h3>
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                        {server.category}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${difficultyColors[server.difficulty]}`}>
                      {server.difficulty} setup
                    </span>
                  </div>
                  <p className="text-gray-400 leading-relaxed mb-4">{server.description}</p>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Use cases</p>
                    <div className="flex flex-wrap gap-2">
                      {server.useCases.map((uc) => (
                        <span key={uc} className="text-xs px-2 py-1 bg-gray-800 text-gray-300 rounded-md">
                          {uc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* How to configure */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">How to Configure MCP Servers in Cursor</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              Cursor supports MCP natively as of version 0.44. To add an MCP server:
            </p>
            <ol className="list-decimal list-inside space-y-3 text-gray-400">
              <li>Open Cursor Settings → Features → MCP</li>
              <li>Click <span className="text-gray-200 font-medium">&quot;Add new MCP server&quot;</span></li>
              <li>Choose the server type (stdio, SSE, or HTTP)</li>
              <li>Enter the server command or URL and any required environment variables</li>
              <li>Restart Cursor and verify the server shows as connected</li>
            </ol>
            <p className="text-gray-400 leading-relaxed mt-4">
              You can also configure MCP servers globally by editing <code className="text-gray-200 bg-gray-800 px-1 rounded">~/.cursor/mcp.json</code>, which is useful for servers you want available in every project.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">How to Configure MCP Servers in VS Code</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              VS Code supports MCP through GitHub Copilot (agent mode) as of early 2026. Configuration goes in your <code className="text-gray-200 bg-gray-800 px-1 rounded">.vscode/mcp.json</code> file or workspace settings:
            </p>
            <pre className="p-4 bg-gray-900 rounded-xl border border-gray-800 text-sm text-gray-300 overflow-x-auto mb-4">
{`{
  "servers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "\${env:GITHUB_TOKEN}"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/project"]
    }
  }
}`}
            </pre>
            <p className="text-gray-400 leading-relaxed">
              After saving the config, open the GitHub Copilot chat panel, switch to agent mode, and your MCP tools will be available.
            </p>
          </section>

          {/* Tips */}
          <section className="mb-12 p-6 bg-blue-950/30 rounded-xl border border-blue-800/30">
            <h2 className="text-xl font-semibold text-white mb-4">Pro Tips for Using MCP in Your IDE</h2>
            <ul className="space-y-3 text-gray-400">
              <li className="flex gap-3">
                <span className="text-blue-400 font-bold mt-0.5">→</span>
                <span><strong className="text-gray-200">Start with GitHub + Filesystem.</strong> These two servers alone cover 80% of developer use cases and are the most stable and well-documented.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400 font-bold mt-0.5">→</span>
                <span><strong className="text-gray-200">Use environment variables for secrets.</strong> Never hardcode API keys in your MCP config. Reference them as env vars to keep configs shareable.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400 font-bold mt-0.5">→</span>
                <span><strong className="text-gray-200">Scope filesystem access tightly.</strong> Point the filesystem server at your project root, not <code className="text-gray-300">~/</code>, to prevent accidental reads of sensitive files.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400 font-bold mt-0.5">→</span>
                <span><strong className="text-gray-200">Combine Memory + GitHub for agent projects.</strong> The Memory server lets your AI build a persistent map of your codebase that survives across Cursor sessions.</span>
              </li>
            </ul>
          </section>

          {/* CTA */}
          <section className="p-6 bg-gray-900 rounded-xl border border-gray-800 text-center">
            <h2 className="text-xl font-semibold text-white mb-2">Explore the Full MCP Directory</h2>
            <p className="text-gray-400 mb-4">
              EveryMCP indexes hundreds of MCP servers with search, filtering by category, and direct install commands. Find the right server for your stack in seconds.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Browse All MCP Servers →
            </Link>
          </section>

          {/* Related */}
          <section className="mt-12">
            <h3 className="text-lg font-semibold text-white mb-4">Related Articles</h3>
            <div className="grid gap-3">
              {[
                { href: "/blog/mcp-servers-for-ai-agents", label: "MCP Servers for AI Agents" },
                { href: "/blog/best-mcp-servers-2026", label: "Best MCP Servers in 2026" },
                { href: "/blog/how-to-choose-an-mcp-server", label: "How to Choose an MCP Server" },
                { href: "/blog/mcp-servers-for-github-copilot", label: "MCP Servers for GitHub Copilot" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm"
                >
                  <span>→</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
