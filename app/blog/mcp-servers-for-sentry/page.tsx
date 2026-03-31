import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best MCP Servers for Sentry in 2026 — Error Tracking with AI",
  description:
    "Discover the top MCP servers for Sentry integration. Let your AI agent query errors, inspect stack traces, triage issues, and resolve bugs directly from Claude, GPT-4, or any LLM.",
  alternates: {
    canonical: "/blog/mcp-servers-for-sentry"
  },
  openGraph: {
    title: "Best MCP Servers for Sentry in 2026 — Error Tracking with AI",
    description:
      "Top MCP servers for Sentry — let your AI agent query errors, inspect stack traces, and triage issues automatically.",
    url: "https://everymcp.com/blog/mcp-servers-for-sentry",
    type: "article"
  }
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Best MCP Servers for Sentry in 2026 — Error Tracking with AI",
  description:
    "Discover the top MCP servers for Sentry integration. Let your AI agent query errors, inspect stack traces, triage issues, and resolve bugs directly from Claude, GPT-4, or any LLM.",
  url: "https://everymcp.com/blog/mcp-servers-for-sentry",
  datePublished: "2026-03-31",
  dateModified: "2026-03-31",
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

export default function MCPServersForSentry() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/blog" className="text-sm text-muted-foreground hover:underline">
            ← All Articles
          </Link>
        </div>

        <header className="mb-10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <span>March 31, 2026</span>
            <span>·</span>
            <span>8 min read</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Best MCP Servers for Sentry in 2026
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Your AI agent can now query Sentry errors, inspect stack traces, and help triage issues — without you leaving your editor. Here are the best MCP servers for Sentry integration.
          </p>
        </header>

        <article className="prose prose-gray dark:prose-invert max-w-none">
          <h2>Why Connect Sentry to Your AI Agent?</h2>
          <p>
            Sentry captures errors, performance regressions, and crashes across your stack. But switching between your editor, Sentry&apos;s dashboard, and your LLM chat every time a new issue fires is slow and context-switching-heavy.
          </p>
          <p>
            MCP (Model Context Protocol) servers solve this. They expose Sentry&apos;s API to any compatible AI agent — Claude, GPT-4, Gemini — so your assistant can pull live error data, suggest fixes, and even file follow-up tasks, all without you leaving your workflow.
          </p>
          <p>
            In 2026, engineering teams using Sentry + MCP report faster mean-time-to-resolution and fewer context switches per bug. Here&apos;s what&apos;s available today.
          </p>

          <h2>Top MCP Servers for Sentry</h2>

          <h3>1. sentry-mcp (Official)</h3>
          <p>
            Sentry&apos;s own MCP server is the most complete option. It supports OAuth authentication with your Sentry account, full project scoping, and exposes tools for:
          </p>
          <ul>
            <li>Listing and searching issues by project, environment, and assignee</li>
            <li>Fetching full stack traces and breadcrumbs for any event</li>
            <li>Updating issue status (resolve, ignore, merge)</li>
            <li>Querying performance spans and slow transaction data</li>
            <li>Retrieving release health and crash-free session rates</li>
          </ul>
          <p>
            Setup uses a Sentry API token scoped to your org. The server runs locally via npx and works with Claude Desktop, Cursor, and any MCP-compatible host.
          </p>
          <p>
            <strong>Best for:</strong> Teams that want the full Sentry surface area in their AI agent.
          </p>

          <h3>2. mcp-server-sentry (Community)</h3>
          <p>
            A lightweight community-built alternative focused on read-only error triage. Useful when you want to give your AI agent visibility into errors without granting write access (resolve/ignore/merge).
          </p>
          <p>
            Key tools exposed:
          </p>
          <ul>
            <li><code>get_sentry_issue</code> — fetch an issue by ID or URL</li>
            <li><code>list_sentry_issues</code> — paginated issue list with filters</li>
            <li><code>get_sentry_event</code> — raw event data including request headers, user context, and extra metadata</li>
          </ul>
          <p>
            The server accepts a SENTRY_AUTH_TOKEN env var and a SENTRY_ORG slug. No OAuth required — simpler setup for solo developers.
          </p>
          <p>
            <strong>Best for:</strong> Individual developers who want quick error lookups without write permissions.
          </p>

          <h3>3. sentry-ai-assistant (Experimental)</h3>
          <p>
            A more opinionated server that wraps Sentry&apos;s Issues API and adds heuristic context: it automatically fetches related GitHub commits (via the Sentry-GitHub integration) when you query an issue, so your AI agent sees both the error and the code that likely caused it.
          </p>
          <p>
            Still experimental, but promising for teams using Sentry&apos;s commit tracking.
          </p>
          <p>
            <strong>Best for:</strong> Teams with deep Sentry-GitHub integration who want AI triage with code context baked in.
          </p>

          <h2>What Can Your AI Agent Do With Sentry?</h2>
          <p>
            Once connected, a well-prompted AI agent can:
          </p>
          <ul>
            <li><strong>Triage new issues automatically</strong> — "What are the top 5 unresolved errors from the last 24 hours in production?"</li>
            <li><strong>Explain stack traces in plain language</strong> — paste an issue ID and ask "what caused this and what&apos;s the likely fix?"</li>
            <li><strong>Correlate errors with deployments</strong> — "Did error rates spike after the v2.4.1 release?"</li>
            <li><strong>Draft fix descriptions</strong> — "Write a PR description for the fix to issue SENTRY-1234"</li>
            <li><strong>Create Jira/Linear tickets</strong> — use multiple MCP servers together to go from Sentry error → Linear issue in one agent turn</li>
          </ul>

          <h2>Setting Up Sentry MCP in Claude Desktop</h2>
          <p>
            Add the following to your Claude Desktop <code>claude_desktop_config.json</code>:
          </p>
          <pre><code>{`{
  "mcpServers": {
    "sentry": {
      "command": "npx",
      "args": ["-y", "@sentry/mcp-server@latest"],
      "env": {
        "SENTRY_AUTH_TOKEN": "your-token-here",
        "SENTRY_ORG": "your-org-slug"
      }
    }
  }
}`}</code></pre>
          <p>
            Generate a Sentry API token at <strong>Settings → Developer Settings → Auth Tokens</strong>. Scope it to <code>project:read</code>, <code>event:read</code>, and <code>org:read</code> for read-only access, or add <code>event:write</code> and <code>issue:write</code> for full triage access.
          </p>

          <h2>Sentry MCP vs. Manual Dashboard</h2>
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Manual Dashboard</th>
                <th>AI Agent + MCP</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Find top errors this week</td>
                <td>2–3 clicks + filter setup</td>
                <td>1 natural language prompt</td>
              </tr>
              <tr>
                <td>Explain a stack trace</td>
                <td>Copy + paste into ChatGPT separately</td>
                <td>Agent fetches + explains in context</td>
              </tr>
              <tr>
                <td>Mark issue as resolved</td>
                <td>Open issue → click Resolve</td>
                <td>Agent resolves via tool call</td>
              </tr>
              <tr>
                <td>Cross-reference with code</td>
                <td>Manual GitHub search</td>
                <td>Agent correlates via multiple MCP servers</td>
              </tr>
            </tbody>
          </table>

          <h2>Common Use Cases by Role</h2>

          <h3>Backend Engineers</h3>
          <p>
            Connect Sentry + GitHub MCP servers so your agent can read an error and immediately look up the relevant file history, blame, and recent commits. Ask: "What changed in <code>payments/processor.py</code> in the last 30 days that might explain this NullPointerException?"
          </p>

          <h3>DevOps / SRE Teams</h3>
          <p>
            Pair Sentry MCP with your monitoring tools (Datadog, Grafana) to build an AI-powered incident correlation workflow. When an alert fires, your agent checks both performance metrics and error volume at once.
          </p>

          <h3>Tech Leads</h3>
          <p>
            Use Sentry MCP for weekly error reviews: "Give me a summary of the top 10 recurring errors this week, their affected users, and which are assigned vs. unassigned." Turn this into a standup briefing in seconds.
          </p>

          <h2>Limitations to Know</h2>
          <ul>
            <li><strong>Rate limits:</strong> Sentry&apos;s API has rate limits per org/token. High-frequency agent queries can hit them. Use caching where possible.</li>
            <li><strong>Self-hosted Sentry:</strong> The official MCP server supports self-hosted instances but requires pointing to your own Sentry URL.</li>
            <li><strong>Attachments:</strong> Binary attachments (crash dumps, minidumps) are not exposed via the MCP API yet.</li>
          </ul>

          <h2>Find More Sentry-Compatible MCP Servers</h2>
          <p>
            Browse the full directory of error tracking, monitoring, and DevOps MCP servers at{" "}
            <Link href="/directory" className="underline">
              everymcp.com/directory
            </Link>
            . Filter by category to find servers that work alongside Sentry for a complete observability + AI workflow.
          </p>

          <h2>Related Guides</h2>
          <ul>
            <li>
              <Link href="/blog/mcp-servers-for-monitoring-and-observability" className="underline">
                Best MCP Servers for Monitoring and Observability
              </Link>
            </li>
            <li>
              <Link href="/blog/mcp-servers-for-github" className="underline">
                Best MCP Servers for GitHub
              </Link>
            </li>
            <li>
              <Link href="/blog/mcp-servers-for-cicd-and-devops" className="underline">
                Best MCP Servers for CI/CD and DevOps
              </Link>
            </li>
            <li>
              <Link href="/blog/mcp-servers-for-jira" className="underline">
                Best MCP Servers for Jira
              </Link>
            </li>
          </ul>
        </article>

        <footer className="mt-16 pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            Know an MCP server we missed?{" "}
            <Link href="/sponsor" className="underline">
              Submit it to the directory
            </Link>
            .
          </p>
        </footer>
      </main>
    </>
  );
}
