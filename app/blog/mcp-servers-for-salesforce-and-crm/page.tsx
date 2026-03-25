import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "MCP Servers for Salesforce & CRM: Connect AI Agents to Your CRM",
  description:
    "Discover the best MCP servers for Salesforce, HubSpot, and CRM tools. Connect Claude, Cursor, and other AI assistants directly to your CRM data using Model Context Protocol.",
  alternates: {
    canonical: "/blog/mcp-servers-for-salesforce-and-crm"
  },
  openGraph: {
    title: "MCP Servers for Salesforce & CRM: Connect AI Agents to Your CRM",
    description:
      "The best MCP servers for Salesforce, HubSpot, and CRM tools — connect AI agents directly to your customer data.",
    url: "https://everymcp.com/blog/mcp-servers-for-salesforce-and-crm",
    type: "article"
  }
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "MCP Servers for Salesforce & CRM: Connect AI Agents to Your CRM",
  description:
    "Discover the best MCP servers for Salesforce, HubSpot, and CRM tools. Connect Claude, Cursor, and other AI assistants directly to your CRM data using Model Context Protocol.",
  url: "https://everymcp.com/blog/mcp-servers-for-salesforce-and-crm",
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

export default function MCPServersForSalesforceAndCRM() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <nav className="text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-gray-900">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/blog" className="hover:text-gray-900">Blog</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">MCP Servers for Salesforce &amp; CRM</span>
        </nav>

        <article>
          <header className="mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
              MCP Servers for Salesforce &amp; CRM: Connect AI Agents to Your Customer Data
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Your CRM contains the most valuable context for any sales or customer-facing AI agent — contact history, deal stages, notes, and revenue data. MCP servers for Salesforce, HubSpot, and other CRM platforms let AI assistants like Claude read and write directly to your CRM without leaving the conversation.
            </p>
            <p className="text-sm text-gray-400 mt-4">Updated March 25, 2026</p>
          </header>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Why CRM + MCP Is a Big Deal</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Sales reps, account managers, and revenue ops teams spend hours copying data between their CRM and AI tools. With an MCP server for your CRM, you can ask Claude to pull up a contact&apos;s deal history, summarize recent activity, draft a follow-up email with full context, or log a call note — all within a single conversation.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Model Context Protocol makes this possible by giving AI assistants a standardized way to call CRM APIs as tools. Instead of manually copying contact details into a chat window, the AI fetches them directly.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Top MCP Servers for CRM</h2>

            <div className="space-y-8">
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">Salesforce MCP Server</h3>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">Official</span>
                </div>
                <p className="text-gray-700 mb-3">
                  The official Salesforce MCP server exposes SOQL query execution, object CRUD operations, and metadata retrieval. You can ask Claude to find leads by stage, update opportunity close dates, or pull account contact lists — all using natural language.
                </p>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside mb-4">
                  <li>SOQL query execution for leads, contacts, opportunities</li>
                  <li>Create, update, and delete Salesforce objects</li>
                  <li>Retrieve org metadata and field definitions</li>
                  <li>Support for Salesforce sandbox and production orgs</li>
                </ul>
                <p className="text-sm text-gray-500">
                  <strong>Best for:</strong> Enterprise sales teams using Salesforce CRM with Claude Desktop or Cursor
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">HubSpot MCP Server</h3>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">Popular</span>
                </div>
                <p className="text-gray-700 mb-3">
                  HubSpot&apos;s MCP integration covers contacts, companies, deals, tickets, and the marketing email API. It&apos;s especially useful for inbound-focused teams who want AI help qualifying leads, writing follow-ups, or analyzing pipeline health.
                </p>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside mb-4">
                  <li>Search and filter contacts, companies, and deals</li>
                  <li>Create and update CRM records</li>
                  <li>Access deal pipeline stages and properties</li>
                  <li>Trigger HubSpot workflows via API</li>
                </ul>
                <p className="text-sm text-gray-500">
                  <strong>Best for:</strong> Inbound sales and marketing teams using HubSpot
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">Pipedrive MCP Server</h3>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-medium">Community</span>
                </div>
                <p className="text-gray-700 mb-3">
                  A community-built MCP server for Pipedrive that wraps the Pipedrive REST API. Lets AI assistants manage deals, activities, and person records. Good for smaller sales teams that prefer Pipedrive&apos;s simplicity over Salesforce&apos;s complexity.
                </p>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside mb-4">
                  <li>Manage deals, persons, organizations, and activities</li>
                  <li>Pipeline stage querying and filtering</li>
                  <li>Note and activity logging</li>
                </ul>
                <p className="text-sm text-gray-500">
                  <strong>Best for:</strong> SMB sales teams on Pipedrive
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">Attio MCP Server</h3>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium">New</span>
                </div>
                <p className="text-gray-700 mb-3">
                  Attio is a next-gen CRM built for modern GTM teams, and its MCP server reflects that — structured around objects, lists, and records rather than legacy Salesforce-style entities. Great for startups and Series A/B companies running leaner sales motions.
                </p>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside mb-4">
                  <li>Query and filter custom objects and records</li>
                  <li>Access lists and workspace data</li>
                  <li>Native support for Attio&apos;s flexible schema</li>
                </ul>
                <p className="text-sm text-gray-500">
                  <strong>Best for:</strong> Startup and growth-stage companies using Attio
                </p>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">What You Can Do with a CRM MCP Server</h2>
            <p className="text-gray-700 mb-4">Once you connect your CRM to Claude or another MCP-compatible AI, here are real workflows that become possible:</p>
            <ul className="space-y-3 text-gray-700">
              <li className="flex gap-3">
                <span className="text-blue-500 font-bold mt-0.5">→</span>
                <span><strong>Pre-call research:</strong> &ldquo;Summarize all interactions with Acme Corp in the last 90 days&rdquo;</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-500 font-bold mt-0.5">→</span>
                <span><strong>Pipeline reviews:</strong> &ldquo;List all deals in the Proposal stage that haven&apos;t had activity in 2 weeks&rdquo;</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-500 font-bold mt-0.5">→</span>
                <span><strong>Follow-up drafting:</strong> &ldquo;Draft a follow-up email to John at TechCorp referencing our last call notes&rdquo;</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-500 font-bold mt-0.5">→</span>
                <span><strong>Data hygiene:</strong> &ldquo;Find all contacts with no email address and flag them for cleanup&rdquo;</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-500 font-bold mt-0.5">→</span>
                <span><strong>Logging:</strong> &ldquo;Log a call note for my meeting with Sarah at Stripe about renewal pricing&rdquo;</span>
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How to Set Up a CRM MCP Server</h2>
            <p className="text-gray-700 mb-4">
              Most CRM MCP servers follow the same setup pattern. Here&apos;s the general process for connecting to Salesforce or HubSpot:
            </p>
            <ol className="list-decimal list-inside space-y-3 text-gray-700">
              <li>Generate an API key or OAuth token from your CRM (Settings → Integrations → API)</li>
              <li>Install the MCP server package via npm or pip</li>
              <li>Add the server config to your <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">claude_desktop_config.json</code> or Cursor settings</li>
              <li>Set your API credentials as environment variables</li>
              <li>Restart Claude Desktop and test with a simple query like &ldquo;list my open deals&rdquo;</li>
            </ol>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
              <p className="text-sm font-mono text-gray-700">
                {`{
  "mcpServers": {
    "hubspot": {
      "command": "npx",
      "args": ["-y", "@hubspot/mcp-server"],
      "env": {
        "HUBSPOT_ACCESS_TOKEN": "your-token-here"
      }
    }
  }
}`}
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Security Considerations</h2>
            <p className="text-gray-700 mb-4">
              CRM data is sensitive. Before connecting your CRM to an AI assistant, consider:
            </p>
            <ul className="space-y-2 text-gray-700 list-disc list-inside">
              <li>Use read-only API keys when you don&apos;t need write access</li>
              <li>Scope OAuth permissions to only the objects you need (e.g., only Contacts, not billing data)</li>
              <li>Store API tokens as environment variables, never hardcoded in config files</li>
              <li>Review what data your AI tool provider logs or stores from tool calls</li>
              <li>Consider a staging or sandbox CRM environment for testing</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Find More MCP Servers</h2>
            <p className="text-gray-700 mb-4">
              CRM MCP servers are just one category. Browse the full EveryMCP directory to find servers for databases, APIs, cloud infrastructure, developer tools, and more.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/blog/mcp-servers-for-email" className="text-blue-600 hover:text-blue-800 underline text-sm">MCP Servers for Email</Link>
              <Link href="/blog/mcp-servers-for-google-workspace" className="text-blue-600 hover:text-blue-800 underline text-sm">MCP Servers for Google Workspace</Link>
              <Link href="/blog/mcp-servers-for-slack-and-communication" className="text-blue-600 hover:text-blue-800 underline text-sm">MCP Servers for Slack</Link>
              <Link href="/blog/mcp-servers-for-notion" className="text-blue-600 hover:text-blue-800 underline text-sm">MCP Servers for Notion</Link>
              <Link href="/blog/mcp-servers-for-productivity-automation" className="text-blue-600 hover:text-blue-800 underline text-sm">MCP Servers for Productivity</Link>
            </div>
          </section>

          <section className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Browse the Full MCP Directory</h2>
            <p className="text-gray-700 mb-4">
              EveryMCP indexes hundreds of MCP servers across every category. Search by tool, use case, or platform — and find exactly the right server for your AI workflow.
            </p>
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Explore the MCP Directory →
            </Link>
          </section>
        </article>
      </main>
    </>
  );
}
