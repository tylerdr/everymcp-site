import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best MCP Servers for Jira in 2026 — AI Agents for Issue Tracking",
  description:
    "Discover the top MCP servers for Jira integration. Let Claude and other AI agents create issues, update sprints, query backlogs, and automate project management workflows with Model Context Protocol.",
  alternates: {
    canonical: "/blog/mcp-servers-for-jira"
  },
  openGraph: {
    title: "Best MCP Servers for Jira in 2026 — AI Agents for Issue Tracking",
    description:
      "Top MCP servers for Jira — let your AI agent create issues, manage sprints, and automate project workflows.",
    url: "https://everymcp.com/blog/mcp-servers-for-jira",
    type: "article"
  }
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Best MCP Servers for Jira in 2026 — AI Agents for Issue Tracking",
  description:
    "Discover the top MCP servers for Jira integration. Let Claude and other AI agents create issues, update sprints, query backlogs, and automate project management workflows with Model Context Protocol.",
  url: "https://everymcp.com/blog/mcp-servers-for-jira",
  datePublished: "2026-03-26",
  dateModified: "2026-03-26",
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

export default function MCPJiraPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <div className="mb-8">
          <Link
            href="/blog"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back to Blog
          </Link>
        </div>

        <header className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
              Integrations
            </span>
            <span className="text-xs text-gray-400">March 26, 2026</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
            Best MCP Servers for Jira in 2026 — AI Agents for Issue Tracking
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Jira is where engineering work lives. With the right MCP server, your AI agent can read
            the backlog, create issues, update sprint status, and surface blockers — all without
            leaving your chat interface. Here are the best MCP servers for Jira in 2026.
          </p>
        </header>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Why Connect Your AI Agent to Jira?
          </h2>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Jira holds more engineering context than almost any other tool in your stack — sprint
            goals, acceptance criteria, bug histories, team velocity. When your AI agent has access
            to that context via MCP, it can do things like:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-4">
            <li>Create well-formatted issues from a one-line description</li>
            <li>Query the backlog and surface high-priority blocked tickets</li>
            <li>Move issues through sprint states without leaving your editor</li>
            <li>Draft release notes from resolved issues in the current sprint</li>
            <li>Correlate Jira issues with GitHub PRs for traceability</li>
            <li>Triage incoming bug reports and assign to the right team member</li>
          </ul>
          <p className="text-gray-600 leading-relaxed">
            Instead of context-switching into Jira, your AI does the Jira work while you stay in flow.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Top MCP Servers for Jira
          </h2>

          <div className="space-y-8">
            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  @modelcontextprotocol/server-jira
                </h3>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                  Official
                </span>
              </div>
              <p className="text-gray-600 mb-4 leading-relaxed">
                The reference Jira MCP server from the MCP community. Supports issue CRUD, sprint
                management, project queries, and JQL (Jira Query Language) directly from your AI
                agent. Works with both Jira Cloud and Jira Server/Data Center via the Atlassian REST
                API.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Key capabilities:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Create, read, update, and delete Jira issues</li>
                  <li>• JQL query support — ask natural language, get issues</li>
                  <li>• Sprint board read/write (move issues, update status)</li>
                  <li>• Attachment upload and comment threading</li>
                  <li>• Project and user search</li>
                </ul>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-2">Install via npx:</p>
                <code className="text-sm text-green-400 font-mono">
                  npx @modelcontextprotocol/server-jira --jira-url https://yourorg.atlassian.net
                </code>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  jira-mcp (community)
                </h3>
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                  Community
                </span>
              </div>
              <p className="text-gray-600 mb-4 leading-relaxed">
                A popular community-built Jira MCP server with a focus on developer workflows. Adds
                bulk operations, Confluence page linking, and richer sprint analytics on top of the
                Atlassian API. Good choice if your team uses Jira + Confluence together.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Standout features:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Bulk issue creation from structured input</li>
                  <li>• Sprint velocity and burndown summary tools</li>
                  <li>• Confluence page creation linked to Jira epics</li>
                  <li>• Label and component management</li>
                </ul>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <code className="text-sm text-green-400 font-mono">
                  npx jira-mcp --token YOUR_API_TOKEN
                </code>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  atlassian-mcp
                </h3>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                  Suite
                </span>
              </div>
              <p className="text-gray-600 mb-4 leading-relaxed">
                A broader Atlassian suite MCP server that covers Jira, Confluence, and Bitbucket in
                a single server. If your team lives in the Atlassian ecosystem, this gives your AI
                agent the broadest context — read a Confluence spec, create the Jira epic, and open
                the Bitbucket PR all in one conversation.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Use this if:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Your team uses Jira + Confluence + Bitbucket together</li>
                  <li>• You want cross-product linking in one server</li>
                  <li>• You need Confluence page read/write from your agent</li>
                </ul>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <code className="text-sm text-green-400 font-mono">
                  npx atlassian-mcp
                </code>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Setting Up a Jira MCP Server in Claude Desktop
          </h2>
          <p className="text-gray-600 mb-4 leading-relaxed">
            To add a Jira MCP server to Claude Desktop, edit your{" "}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">
              claude_desktop_config.json
            </code>{" "}
            file:
          </p>
          <div className="bg-gray-900 rounded-lg p-5 mb-4 overflow-x-auto">
            <pre className="text-sm text-gray-300 font-mono whitespace-pre">{`{
  "mcpServers": {
    "jira": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-jira"],
      "env": {
        "JIRA_URL": "https://yourorg.atlassian.net",
        "JIRA_USER": "you@yourcompany.com",
        "JIRA_API_TOKEN": "your-api-token-here"
      }
    }
  }
}`}</pre>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Get your Jira API token from{" "}
            <span className="font-medium text-gray-800">id.atlassian.com → Security → API tokens</span>.
            Never commit your token — use environment variables or a secrets manager.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Example Prompts with a Jira MCP Server
          </h2>
          <div className="space-y-4">
            {[
              {
                prompt: "Show me all P1 bugs in the PAYMENTS project that are unassigned.",
                what: "JQL query + formatted result table",
              },
              {
                prompt: "Create a Jira story: 'Add dark mode toggle to settings page' in the WEBAPP project, sprint 14, estimate 3 points.",
                what: "Full issue creation with fields",
              },
              {
                prompt: "Summarize what was completed in the last sprint for the INFRA project.",
                what: "Sprint summary from resolved issues",
              },
              {
                prompt: "Move WEBAPP-441 to In Review and add a comment: 'PR is up at github.com/...'",
                what: "Issue state transition + comment",
              },
              {
                prompt: "Draft release notes for version 2.4 based on resolved issues in the current sprint.",
                what: "Release note generation from issue data",
              },
            ].map((item, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                <p className="text-sm font-medium text-gray-800 mb-1 font-mono">
                  &ldquo;{item.prompt}&rdquo;
                </p>
                <p className="text-xs text-gray-500">→ {item.what}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Jira MCP vs Linear MCP: Which Should You Use?
          </h2>
          <p className="text-gray-600 mb-4 leading-relaxed">
            If your team hasn&apos;t locked into a project tracker yet, it&apos;s worth comparing the two
            dominant options:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-3 font-semibold text-gray-700 border border-gray-200">Feature</th>
                  <th className="text-left p-3 font-semibold text-gray-700 border border-gray-200">Jira MCP</th>
                  <th className="text-left p-3 font-semibold text-gray-700 border border-gray-200">Linear MCP</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["JQL / filtering", "✅ Full JQL", "✅ GraphQL-based"],
                  ["Sprint management", "✅ Yes", "✅ Cycles"],
                  ["Confluence integration", "✅ Via atlassian-mcp", "❌ No"],
                  ["API maturity", "✅ Very mature", "✅ Very mature"],
                  ["Setup complexity", "⚠️ More config", "✅ Simple OAuth"],
                  ["Best for", "Enterprise teams", "Fast-moving startups"],
                ].map(([feature, jira, linear], i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="p-3 border border-gray-200 text-gray-700 font-medium">{feature}</td>
                    <td className="p-3 border border-gray-200 text-gray-600">{jira}</td>
                    <td className="p-3 border border-gray-200 text-gray-600">{linear}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-gray-500 text-sm mt-3">
            Both are well-supported in the MCP ecosystem.{" "}
            <Link href="/blog/mcp-servers-for-linear-and-project-management" className="text-blue-600 hover:underline">
              See our Linear MCP guide →
            </Link>
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Security Considerations
          </h2>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Jira often contains sensitive project data — roadmaps, security bug reports, customer
            escalations. Before connecting your AI agent:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>
              <span className="font-medium text-gray-800">Scope API token permissions</span> — create
              a dedicated service account with read-only access where possible
            </li>
            <li>
              <span className="font-medium text-gray-800">Use project-scoped tokens</span> — Atlassian
              supports project-level access restrictions for API tokens
            </li>
            <li>
              <span className="font-medium text-gray-800">Audit agent actions</span> — Jira logs all
              API activity; review periodically
            </li>
            <li>
              <span className="font-medium text-gray-800">Rotate tokens regularly</span> — treat MCP
              API tokens like any other credential in your rotation policy
            </li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Bottom Line</h2>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Jira MCP servers turn your AI agent into a project management powerhouse. Instead of
            switching tabs to file a ticket or check sprint status, you can do it all from your
            editor or chat interface — with full context from your codebase or conversation.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Start with <strong>@modelcontextprotocol/server-jira</strong> for standard workflows. Add
            the atlassian-mcp suite if your team uses Confluence and Bitbucket too.
          </p>
        </section>

        <section className="border-t border-gray-200 pt-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Related Guides</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                href: "/blog/mcp-servers-for-linear-and-project-management",
                title: "MCP Servers for Linear & Project Management",
                desc: "Linear, Asana, Notion, and more",
              },
              {
                href: "/blog/mcp-servers-for-github",
                title: "MCP Servers for GitHub",
                desc: "PRs, issues, and code from your AI agent",
              },
              {
                href: "/blog/mcp-servers-for-slack-and-communication",
                title: "MCP Servers for Slack",
                desc: "Connect your agent to team communication",
              },
              {
                href: "/blog/mcp-servers-for-ai-agents",
                title: "MCP Servers for AI Agents",
                desc: "Build powerful multi-step AI workflows",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-all"
              >
                <p className="font-medium text-gray-900 mb-1">{item.title}</p>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-12 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <h3 className="font-semibold text-gray-900 mb-2">Find More MCP Servers</h3>
          <p className="text-gray-600 text-sm mb-4">
            Browse the complete directory of MCP servers — search by category, use case, or
            integration.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Explore EveryMCP →
          </Link>
        </div>
      </main>
    </>
  );
}
