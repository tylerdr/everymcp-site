import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best MCP Servers for Trello in 2026 — Manage Boards & Cards with AI",
  description:
    "Discover the top MCP servers for Trello. Let your AI agent create cards, move tasks, manage boards, and automate Trello workflows directly from Claude, GPT-4, or any LLM.",
  alternates: {
    canonical: "/blog/mcp-servers-for-trello"
  },
  openGraph: {
    title: "Best MCP Servers for Trello in 2026 — Manage Boards & Cards with AI",
    description:
      "Top MCP servers for Trello — let your AI agent create cards, move tasks, and automate Trello workflows.",
    url: "https://everymcp.com/blog/mcp-servers-for-trello",
    type: "article"
  }
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Best MCP Servers for Trello in 2026 — Manage Boards & Cards with AI",
  description:
    "Discover the top MCP servers for Trello. Let your AI agent create cards, move tasks, manage boards, and automate Trello workflows directly from Claude, GPT-4, or any LLM.",
  url: "https://everymcp.com/blog/mcp-servers-for-trello",
  datePublished: "2026-04-04",
  dateModified: "2026-04-04",
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

export default function TrelloMCPPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/blog" className="text-sm text-gray-500 hover:text-gray-700">
            ← Blog
          </Link>
        </div>

        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Best MCP Servers for Trello in 2026
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Manage boards, create cards, and automate Trello workflows using AI agents via the Model Context Protocol.
        </p>

        <div className="prose prose-gray max-w-none">
          <p>
            Trello's kanban-style boards remain one of the most popular ways to track work — but manually moving cards, updating descriptions, and keeping lists current is a constant drag on productivity. MCP servers for Trello let AI agents like Claude, GPT-4o, and Gemini interact directly with your Trello workspace, turning natural language instructions into real board actions.
          </p>

          <h2>What is an MCP Server?</h2>
          <p>
            The <strong>Model Context Protocol (MCP)</strong> is an open standard developed by Anthropic that gives AI models a standardized way to call external tools and services. An MCP server sits between your AI assistant and a third-party platform (like Trello), exposing a set of typed tools the model can call — for example, <code>create_card</code>, <code>move_card</code>, or <code>list_boards</code>.
          </p>
          <p>
            Once you connect a Trello MCP server to your AI client (Claude Desktop, Cursor, Cline, Windsurf, etc.), you can give natural language commands like <em>"Create a card in the 'In Progress' list for fixing the login bug and assign it to Sarah"</em> and the agent handles the API call automatically.
          </p>

          <h2>Top MCP Servers for Trello</h2>

          <h3>1. Trello MCP (Community)</h3>
          <p>
            The most widely used community Trello MCP server wraps the official Trello REST API using your personal API key and token. It supports:
          </p>
          <ul>
            <li>Listing boards, lists, and cards</li>
            <li>Creating, updating, and archiving cards</li>
            <li>Moving cards between lists</li>
            <li>Adding labels, due dates, and member assignments</li>
            <li>Creating checklists and checklist items</li>
            <li>Adding comments to cards</li>
          </ul>
          <p>
            <strong>Best for:</strong> Developers who want full CRUD access to Trello boards via Claude or any MCP-compatible client.
          </p>
          <p>
            <strong>Setup:</strong> Generate a Trello API key at <code>trello.com/app-key</code>, then create a token with read/write access. Pass these as environment variables when starting the MCP server.
          </p>

          <h3>2. Trello via Zapier MCP</h3>
          <p>
            Zapier's MCP server exposes hundreds of app integrations — including Trello — as AI-callable tools. If you're already using Zapier for automations, this is the fastest path to Trello AI control with no additional setup.
          </p>
          <ul>
            <li>Create cards from any trigger or prompt</li>
            <li>Update card fields and move between boards</li>
            <li>Trigger multi-step Zaps from your AI agent</li>
          </ul>
          <p>
            <strong>Best for:</strong> Non-technical users or teams that want AI-powered Trello + multi-app automations without writing code.
          </p>

          <h3>3. Trello via n8n MCP</h3>
          <p>
            n8n's self-hosted automation platform also ships an MCP server that includes Trello nodes. This is a strong choice for teams that want on-premise control, custom workflows, and the ability to combine Trello actions with database writes, webhook triggers, or other internal tools.
          </p>
          <ul>
            <li>Full Trello API coverage via n8n nodes</li>
            <li>Combine Trello actions with Slack, Notion, Postgres, and more</li>
            <li>Self-hosted — data never leaves your infrastructure</li>
          </ul>
          <p>
            <strong>Best for:</strong> Engineering teams and privacy-conscious organizations running n8n internally.
          </p>

          <h3>4. Atlassian MCP (Jira + Trello)</h3>
          <p>
            Atlassian's official MCP server (in preview) covers both Jira and Trello under one integration. If your team uses both products, this unified server saves you from managing multiple credentials and clients.
          </p>
          <ul>
            <li>Query and update Jira issues alongside Trello cards</li>
            <li>Unified project context across Atlassian products</li>
            <li>OAuth-based auth with Atlassian account</li>
          </ul>
          <p>
            <strong>Best for:</strong> Atlassian-heavy shops using both Jira for engineering and Trello for ops/marketing.
          </p>

          <h2>Example Use Cases</h2>

          <h3>Daily Standup Automation</h3>
          <p>
            Ask your AI agent: <em>"Show me all cards assigned to me that moved to 'Done' yesterday and all cards currently 'In Progress'."</em> The agent queries Trello, formats a standup summary, and can post it to Slack — all in one prompt.
          </p>

          <h3>Sprint Planning from Notes</h3>
          <p>
            Paste your meeting notes into Claude and say: <em>"Create Trello cards for each action item in the 'Sprint 14' list and assign them to the people mentioned."</em> The agent parses the notes and creates the cards automatically.
          </p>

          <h3>Card Triage and Cleanup</h3>
          <p>
            <em>"Archive all cards in the 'Done' list older than 30 days and move any overdue cards to 'Blocked'."</em> Bulk operations that would take 20 minutes manually happen instantly.
          </p>

          <h3>Cross-Tool Workflows</h3>
          <p>
            Combine Trello MCP with GitHub MCP: when a PR is merged, the agent automatically moves the corresponding Trello card to 'Done' and adds the PR link as a comment.
          </p>

          <h2>How to Connect a Trello MCP Server</h2>

          <h3>Claude Desktop</h3>
          <p>Add the server to your <code>claude_desktop_config.json</code>:</p>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto"><code>{`{
  "mcpServers": {
    "trello": {
      "command": "npx",
      "args": ["-y", "mcp-server-trello"],
      "env": {
        "TRELLO_API_KEY": "your_api_key",
        "TRELLO_TOKEN": "your_token"
      }
    }
  }
}`}</code></pre>

          <h3>Cursor / Cline / Windsurf</h3>
          <p>
            These editors support MCP via their settings panel or a <code>.mcp.json</code> config file at the project root. Add the same server config and your Trello credentials, then restart the editor.
          </p>

          <h2>Trello API Credentials</h2>
          <ol>
            <li>Go to <strong>trello.com/app-key</strong> and log in</li>
            <li>Copy your <strong>API Key</strong></li>
            <li>Click <strong>Generate a Token</strong> and authorize read/write access</li>
            <li>Pass both values as environment variables to the MCP server</li>
          </ol>
          <p>
            Keep your token private — it has write access to all your Trello boards.
          </p>

          <h2>Choosing the Right Trello MCP Server</h2>
          <table className="w-full border-collapse text-sm mt-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-200 px-3 py-2 text-left">Server</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Best For</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Hosting</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-200 px-3 py-2">Community Trello MCP</td>
                <td className="border border-gray-200 px-3 py-2">Full API control</td>
                <td className="border border-gray-200 px-3 py-2">Local / Cloud</td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-3 py-2">Zapier MCP</td>
                <td className="border border-gray-200 px-3 py-2">No-code teams</td>
                <td className="border border-gray-200 px-3 py-2">Zapier Cloud</td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-3 py-2">n8n MCP</td>
                <td className="border border-gray-200 px-3 py-2">Self-hosted / privacy</td>
                <td className="border border-gray-200 px-3 py-2">Self-hosted</td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-3 py-2">Atlassian MCP</td>
                <td className="border border-gray-200 px-3 py-2">Jira + Trello together</td>
                <td className="border border-gray-200 px-3 py-2">Atlassian Cloud</td>
              </tr>
            </tbody>
          </table>

          <h2>Explore More MCP Servers</h2>
          <p>
            Looking for MCP servers for other project management tools? Check out our guides on:
          </p>
          <ul>
            <li>
              <Link href="/blog/mcp-servers-for-linear-and-project-management" className="text-blue-600 hover:underline">
                MCP Servers for Linear & Project Management
              </Link>
            </li>
            <li>
              <Link href="/blog/mcp-servers-for-notion" className="text-blue-600 hover:underline">
                MCP Servers for Notion
              </Link>
            </li>
            <li>
              <Link href="/blog/mcp-servers-for-jira" className="text-blue-600 hover:underline">
                MCP Servers for Jira
              </Link>
            </li>
            <li>
              <Link href="/blog/mcp-servers-for-slack-and-communication" className="text-blue-600 hover:underline">
                MCP Servers for Slack & Communication
              </Link>
            </li>
          </ul>
          <p>
            Or{" "}
            <Link href="/directory" className="text-blue-600 hover:underline">
              browse the full MCP server directory
            </Link>{" "}
            to find servers for any tool or use case.
          </p>
        </div>
      </main>
    </>
  );
}
