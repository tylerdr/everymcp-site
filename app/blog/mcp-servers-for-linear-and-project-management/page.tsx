import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best MCP Servers for Linear and Project Management in 2026",
  description:
    "Discover the best Model Context Protocol (MCP) servers for Linear, Jira, Asana, and project management. Let your AI agent create issues, update sprints, and triage backlogs automatically.",
  alternates: {
    canonical: "/blog/mcp-servers-for-linear-and-project-management"
  },
  openGraph: {
    title: "Best MCP Servers for Linear and Project Management in 2026",
    description:
      "The top MCP servers to connect your AI agent to Linear, Jira, Asana, and other project management tools.",
    url: "https://everymcp.com/blog/mcp-servers-for-linear-and-project-management",
    type: "article"
  }
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Best MCP Servers for Linear and Project Management in 2026",
  description:
    "Discover the best Model Context Protocol (MCP) servers for Linear, Jira, Asana, and project management. Let your AI agent create issues, update sprints, and triage backlogs automatically.",
  url: "https://everymcp.com/blog/mcp-servers-for-linear-and-project-management",
  datePublished: "2026-04-02",
  dateModified: "2026-04-02",
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
    name: "Linear MCP Server",
    category: "Issue Tracking",
    description:
      "The most popular MCP server for engineering teams using Linear. Your AI can create issues, update statuses, assign to team members, add to cycles, and search across your entire backlog — all from natural language. Especially powerful when combined with a GitHub MCP server for automatic issue linking.",
    useCases: ["Create and triage issues", "Update issue status and priority", "Search backlog", "Manage cycles and sprints"],
    difficulty: "Easy",
  },
  {
    name: "Jira MCP Server",
    category: "Issue Tracking",
    description:
      "Connects your AI agent to Atlassian Jira for full CRUD on issues, sprints, and epics. Supports both Jira Cloud and Jira Server. Lets AI coding assistants automatically create bug reports from stack traces, update story points, and generate sprint summaries — reducing the manual overhead that slows most engineering teams.",
    useCases: ["Create bug reports from logs", "Update story points", "Generate sprint reports", "Search across projects"],
    difficulty: "Medium",
  },
  {
    name: "Asana MCP Server",
    category: "Task Management",
    description:
      "Brings Asana tasks, projects, and teams into your AI agent's context. Ideal for cross-functional teams that mix engineering and operations. Your AI can create tasks, add subtasks, set due dates, and update projects — making it easy to keep project tracking in sync with actual work.",
    useCases: ["Create and assign tasks", "Add subtasks with context", "Update project status", "Query team workload"],
    difficulty: "Easy",
  },
  {
    name: "Notion MCP Server",
    category: "Docs & Wiki",
    description:
      "Gives AI agents read and write access to Notion pages, databases, and blocks. Great for teams that use Notion as their project wiki or spec repository. Your AI can pull in product requirements, update project status pages, append meeting notes, and create new documents automatically.",
    useCases: ["Read product specs", "Update status pages", "Create meeting notes", "Query project databases"],
    difficulty: "Easy",
  },
  {
    name: "GitHub Projects MCP Server",
    category: "Project Tracking",
    description:
      "Access GitHub Projects v2 boards through the standard GitHub MCP server. Lets AI agents move cards between columns, add issues to project boards, and query project progress — keeping your GitHub-native workflow connected to your AI toolchain without a third-party app.",
    useCases: ["Move project cards", "Add issues to boards", "Query column status", "Track project velocity"],
    difficulty: "Easy",
  },
  {
    name: "Trello MCP Server",
    category: "Kanban",
    description:
      "Connects AI agents to Trello boards, lists, and cards. Useful for smaller teams or marketing/ops workflows that live in Trello. Your AI can create cards, move them across lists, add checklists, and pull board summaries — turning Trello into a fully AI-connected workflow.",
    useCases: ["Create and move cards", "Add checklists", "Query board status", "Archive completed cards"],
    difficulty: "Easy",
  },
  {
    name: "Shortcut (Clubhouse) MCP Server",
    category: "Issue Tracking",
    description:
      "Integrates Shortcut's stories, epics, and iterations into your AI workflow. Popular with product-led engineering teams for its clean story/epic/milestone hierarchy. AI agents can create stories from user feedback, link epics, and update iteration progress in real time.",
    useCases: ["Create stories from feedback", "Link to epics", "Update iteration status", "Search stories"],
    difficulty: "Medium",
  },
  {
    name: "ClickUp MCP Server",
    category: "All-in-One PM",
    description:
      "ClickUp's MCP integration exposes tasks, docs, goals, and time tracking to your AI agent. Best for teams that have consolidated all project management into ClickUp. Your AI can create tasks with custom fields, log time, update goals, and generate status reports across spaces and folders.",
    useCases: ["Create tasks with custom fields", "Log time entries", "Update goals", "Generate status reports"],
    difficulty: "Medium",
  },
];

export default function MCPServersForLinearPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link
            href="/blog"
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
          >
            ← Back to Blog
          </Link>
        </div>

        <header className="mb-10">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
            <span>April 2, 2026</span>
            <span>·</span>
            <span>8 min read</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
            Best MCP Servers for Linear and Project Management in 2026
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            Engineering teams spend hours a week updating tickets, writing sprint summaries, and triaging backlogs.
            With the right MCP servers, your AI agent handles all of it — creating issues from bug reports, moving
            cards when PRs merge, and keeping your project tracker in sync with your actual codebase automatically.
          </p>
        </header>

        <section className="mb-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">Why connect AI agents to project management?</h2>
          <p className="text-blue-800 dark:text-blue-300 text-sm leading-relaxed">
            Project management is one of the highest-leverage places to apply MCP servers. Most tracking is
            pure information relay — moving status from your code to your ticket system. An AI agent with
            access to both GitHub and Linear (or Jira) can close the loop automatically: when a PR merges,
            the issue moves to Done. When a test fails, a bug is filed with the stack trace pre-filled.
            These integrations compound over time as your AI builds context about your project history.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Top Project Management MCP Servers
          </h2>
          <div className="space-y-6">
            {servers.map((server, index) => (
              <div
                key={index}
                className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-white dark:bg-gray-800/50"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {server.name}
                    </h3>
                    <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      {server.category}
                    </span>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-medium px-3 py-1 rounded-full ${
                      server.difficulty === "Easy"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                        : server.difficulty === "Medium"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                    }`}
                  >
                    {server.difficulty} setup
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                  {server.description}
                </p>
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Common use cases
                  </p>
                  <ul className="grid grid-cols-2 gap-1">
                    {server.useCases.map((uc, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300"
                      >
                        <span className="text-green-500">✓</span>
                        {uc}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Combining project management MCP servers with other tools
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            Project management MCP servers are most powerful when combined with your code and communication
            tools. Here are the most effective stacks:
          </p>
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Engineering stack</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <strong>GitHub MCP + Linear MCP + Slack MCP</strong> — Your AI can close the full loop:
                detect a failed CI run on GitHub, file an issue in Linear with the error details, and
                post a summary to your Slack engineering channel. Zero human relay.
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Product team stack</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Notion MCP + Linear MCP + Slack MCP</strong> — PRDs in Notion get turned into
                Linear issues automatically. Sprint updates in Linear get summarized to Slack channels.
                Your AI keeps product and engineering in sync without meetings.
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Support-to-engineering stack</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Intercom/Zendesk MCP + Jira MCP</strong> — Customer complaints get triaged and
                converted into engineering tickets with reproduction steps pre-filled. Closes the loop
                from support to ship faster than any manual process.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Tips for setting up project management MCP servers
          </h2>
          <ul className="space-y-3">
            {[
              "Use read-only tokens during initial setup — you can always add write permissions once you've verified the server works correctly with your workspace.",
              "Start with a single project or team space before granting organization-wide access. Project management tools have broad side effects when AI can write freely.",
              "Define clear field-mapping conventions early. If your AI creates issues, decide up front which labels, priorities, and custom fields it should populate.",
              "Combine with a memory MCP server so your AI agent remembers project conventions, recurring issue types, and team preferences across sessions.",
              "Log AI-created issues separately at first (e.g., with an 'ai-created' label) so you can audit quality before trusting them at full velocity.",
            ].map((tip, i) => (
              <li key={i} className="flex gap-3 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Find project management MCP servers on EveryMCP
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            EveryMCP indexes hundreds of MCP servers across every category. Search for your project
            management tool to find the latest server implementations, compare options, and get setup
            instructions in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/directory"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Browse MCP directory →
            </Link>
            <Link
              href="/blog"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              More MCP guides
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
