import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best MCP Servers for AI Coding Assistants (2026): Claude, Copilot & More",
  description:
    "Discover the best MCP servers to supercharge AI coding assistants like Claude, GitHub Copilot, Cursor, and Windsurf. From code execution to database access and Git integration.",
  alternates: {
    canonical: "/blog/mcp-servers-for-ai-coding-assistants"
  },
  openGraph: {
    title: "Best MCP Servers for AI Coding Assistants (2026)",
    description:
      "Supercharge Claude, Copilot, Cursor, and Windsurf with the best MCP servers for AI coding assistants.",
    url: "https://everymcp.com/blog/mcp-servers-for-ai-coding-assistants",
    type: "article"
  }
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Best MCP Servers for AI Coding Assistants (2026): Claude, Copilot & More",
  description:
    "Discover the best MCP servers to supercharge AI coding assistants like Claude, GitHub Copilot, Cursor, and Windsurf.",
  url: "https://everymcp.com/blog/mcp-servers-for-ai-coding-assistants",
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

const servers = [
  {
    name: "GitHub MCP Server",
    slug: "github",
    category: "Version Control",
    description:
      "The must-have MCP server for any coding assistant. Enables AI to read repos, create branches, open pull requests, comment on issues, and interact with the full GitHub API — all without leaving your editor.",
    useCases: ["Create PRs from natural language", "Review and comment on issues", "Search code across repos", "Fetch file contents and diffs"]
  },
  {
    name: "PostgreSQL MCP Server",
    slug: "postgresql",
    category: "Databases",
    description:
      "Gives AI coding assistants direct read access to your PostgreSQL schema and data. AI can introspect tables, write and validate queries, and help debug data issues without you needing to copy-paste schema definitions.",
    useCases: ["Schema-aware query generation", "Debug data inconsistencies", "Auto-complete SQL with real column names", "Explain query plans"]
  },
  {
    name: "Filesystem MCP Server",
    slug: "filesystem",
    category: "File Management",
    description:
      "The foundational MCP server for local development. Allows AI assistants to read, write, and navigate your local filesystem — enabling refactors that span dozens of files and project-wide search.",
    useCases: ["Multi-file refactoring", "Project-wide search and replace", "Create new files from templates", "Analyze project structure"]
  },
  {
    name: "Code Execution MCP Server",
    slug: "code-execution",
    category: "Code Execution",
    description:
      "Lets AI coding assistants run code in a sandboxed environment and see real output. Essential for test-driven workflows where the AI writes code, runs tests, observes failures, and iterates.",
    useCases: ["Run unit tests and see failures", "Execute scripts and debug output", "Validate generated code", "Iterative code refinement"]
  },
  {
    name: "Docker MCP Server",
    slug: "docker",
    category: "Infrastructure",
    description:
      "Bridges AI assistants to your Docker environment. AI can inspect running containers, read logs, manage images, and help debug containerized services — crucial for microservices development.",
    useCases: ["Inspect container logs", "Debug service startup failures", "List running containers and ports", "Manage Docker Compose services"]
  },
  {
    name: "Brave Search MCP Server",
    slug: "brave-search",
    category: "Web Search",
    description:
      "Gives AI coding assistants real-time web access for looking up documentation, finding library examples, and researching APIs. Prevents hallucinated library versions and outdated code patterns.",
    useCases: ["Look up current library docs", "Find code examples for new APIs", "Research package compatibility", "Get latest security advisories"]
  },
  {
    name: "Slack MCP Server",
    slug: "slack",
    category: "Communication",
    description:
      "Connects AI to your team's Slack workspace. Useful for coding assistants that need context from team conversations — understanding decisions made in threads, finding previously discussed solutions, or posting status updates.",
    useCases: ["Find decisions from team threads", "Post build status updates", "Search for bug reports in channels", "Create alerts from code events"]
  },
  {
    name: "Linear MCP Server",
    slug: "linear",
    category: "Project Management",
    description:
      "Integrates AI coding assistants with Linear for issue tracking. AI can read issue descriptions to understand requirements, update issue status as work progresses, and link commits to tickets automatically.",
    useCases: ["Read issue requirements", "Update issue status from code", "Create issues from TODO comments", "Link PRs to Linear tickets"]
  }
];

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {/* Header */}
        <div className="mb-10">
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
              AI Coding
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
              March 25, 2026
            </span>
          </div>
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Best MCP Servers for AI Coding Assistants (2026)
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            AI coding assistants — Claude Code, GitHub Copilot, Cursor, Windsurf — are only as powerful as the context they can access.
            MCP servers are the connective tissue that links your AI to your codebase, databases, infrastructure, and tools.
            Here are the essential MCP servers every developer should add to their coding workflow.
          </p>
        </div>

        {/* Why MCP Matters for Coding */}
        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">
            Why MCP Servers Transform AI Coding Assistants
          </h2>
          <p className="mb-4 text-gray-700 leading-relaxed">
            Out of the box, AI coding assistants work with whatever you paste into the chat window.
            That&apos;s fine for isolated snippets — but real codebases are interconnected. A bug in your API handler
            might trace back to a database schema mismatch, a misconfigured Docker container, or a decision
            buried in a Slack thread from six months ago.
          </p>
          <p className="mb-4 text-gray-700 leading-relaxed">
            <strong>Model Context Protocol (MCP)</strong> gives AI assistants standardized access to external systems.
            Instead of you manually copying schema definitions, test outputs, or issue descriptions into the chat,
            the AI can fetch them directly — in real time, with the right permissions.
          </p>
          <p className="text-gray-700 leading-relaxed">
            The result: AI that can actually understand your entire stack, not just the snippet you pasted.
          </p>
        </section>

        {/* Server List */}
        <section className="mb-10">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">
            8 Essential MCP Servers for AI Coding Assistants
          </h2>
          <div className="space-y-8">
            {servers.map((server, i) => (
              <div key={server.slug} className="rounded-xl border border-gray-200 p-6">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-blue-600">
                      {server.category}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900">
                      {i + 1}. {server.name}
                    </h3>
                  </div>
                </div>
                <p className="mb-4 text-gray-700 leading-relaxed">{server.description}</p>
                <div>
                  <p className="mb-2 text-sm font-semibold text-gray-800">Key use cases:</p>
                  <ul className="space-y-1">
                    {server.useCases.map((uc) => (
                      <li key={uc} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="mt-0.5 text-green-500">✓</span>
                        {uc}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How to Set Up */}
        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">
            How to Add MCP Servers to Your Coding Assistant
          </h2>
          <p className="mb-4 text-gray-700 leading-relaxed">
            Most AI coding assistants support MCP through a configuration file. The setup process is similar across tools:
          </p>
          <ol className="mb-4 space-y-3 list-decimal list-inside text-gray-700">
            <li className="leading-relaxed">
              <strong>Find your config file.</strong> For Claude Desktop, it&apos;s <code className="rounded bg-gray-100 px-1 py-0.5 text-sm">claude_desktop_config.json</code>.
              For Cursor, check your <code className="rounded bg-gray-100 px-1 py-0.5 text-sm">.cursor/mcp.json</code>.
              For Windsurf, use the MCP settings panel.
            </li>
            <li className="leading-relaxed">
              <strong>Add the server definition.</strong> Each server has an <code className="rounded bg-gray-100 px-1 py-0.5 text-sm">mcpServers</code> entry with a command and optional arguments/env vars.
            </li>
            <li className="leading-relaxed">
              <strong>Restart your assistant.</strong> Most tools pick up config changes on restart.
            </li>
            <li className="leading-relaxed">
              <strong>Test the connection.</strong> Ask your AI to list available tools — it should now include your new server&apos;s capabilities.
            </li>
          </ol>
          <p className="text-gray-700 leading-relaxed">
            For a full list of available servers with setup instructions,{" "}
            <Link href="/" className="text-blue-600 underline hover:text-blue-800">
              browse the EveryMCP directory
            </Link>
            .
          </p>
        </section>

        {/* Recommended Stack */}
        <section className="mb-10 rounded-xl bg-blue-50 p-6">
          <h2 className="mb-3 text-xl font-bold text-gray-900">
            Recommended Starter Stack
          </h2>
          <p className="mb-4 text-gray-700 leading-relaxed">
            If you&apos;re just getting started, install these three MCP servers first — they cover the most common coding assistant use cases:
          </p>
          <ol className="space-y-2 list-decimal list-inside text-gray-700">
            <li><strong>Filesystem</strong> — Gives AI access to your local project files</li>
            <li><strong>GitHub</strong> — Connects AI to your version control and issue tracker</li>
            <li><strong>Brave Search</strong> — Keeps AI documentation lookups current and accurate</li>
          </ol>
          <p className="mt-4 text-sm text-gray-600">
            Once these are working, add a database server (PostgreSQL or SQLite) and a code execution server to unlock the full test-and-iterate loop.
          </p>
        </section>

        {/* Related Posts */}
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Related Guides</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/blog/mcp-servers-for-github" className="text-blue-600 hover:underline">
                Best MCP Servers for GitHub →
              </Link>
            </li>
            <li>
              <Link href="/blog/mcp-servers-for-cursor-and-vscode" className="text-blue-600 hover:underline">
                MCP Servers for Cursor and VS Code →
              </Link>
            </li>
            <li>
              <Link href="/blog/mcp-servers-for-claude-desktop" className="text-blue-600 hover:underline">
                MCP Servers for Claude Desktop →
              </Link>
            </li>
            <li>
              <Link href="/blog/mcp-servers-for-database-access" className="text-blue-600 hover:underline">
                MCP Servers for Database Access →
              </Link>
            </li>
            <li>
              <Link href="/blog/best-mcp-servers-2026" className="text-blue-600 hover:underline">
                Best MCP Servers Overall in 2026 →
              </Link>
            </li>
          </ul>
        </section>

        {/* CTA */}
        <section className="rounded-xl border border-blue-200 bg-blue-50 p-6 text-center">
          <h2 className="mb-2 text-xl font-bold text-gray-900">
            Find the Right MCP Server for Your Stack
          </h2>
          <p className="mb-4 text-gray-600">
            Browse 100+ MCP servers organized by category, use case, and AI tool compatibility.
          </p>
          <Link
            href="/"
            className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Browse the MCP Directory →
          </Link>
        </section>
      </main>
    </>
  );
}
