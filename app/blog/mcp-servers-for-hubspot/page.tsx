import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best MCP Servers for HubSpot in 2026 — CRM & Marketing Automation with AI",
  description:
    "Discover the top MCP servers for HubSpot integration. Let your AI agent read contacts, update deals, trigger workflows, and automate CRM tasks directly from Claude or any LLM.",
  alternates: {
    canonical: "/blog/mcp-servers-for-hubspot"
  },
  openGraph: {
    title: "Best MCP Servers for HubSpot in 2026 — CRM & Marketing Automation with AI",
    description:
      "Top MCP servers for HubSpot — let your AI agent manage contacts, deals, and marketing workflows without leaving your chat.",
    url: "https://everymcp.com/blog/mcp-servers-for-hubspot",
    type: "article"
  }
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Best MCP Servers for HubSpot in 2026 — CRM & Marketing Automation with AI",
  description:
    "Discover the top MCP servers for HubSpot integration. Let your AI agent read contacts, update deals, trigger workflows, and automate CRM tasks directly from Claude or any LLM.",
  url: "https://everymcp.com/blog/mcp-servers-for-hubspot",
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

export default function MCPServersForHubSpot() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/blog" className="text-sm text-muted-foreground hover:underline">
            ← Back to Blog
          </Link>
        </div>

        <article>
          <header className="mb-10">
            <p className="text-sm text-muted-foreground mb-3">March 31, 2026 · 8 min read</p>
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Best MCP Servers for HubSpot in 2026
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Your AI agent can now read contact records, update pipeline deals, enroll leads into
              workflows, and query CRM data — all without leaving a chat window. Here are the best
              Model Context Protocol servers for HubSpot in 2026.
            </p>
          </header>

          <section className="prose prose-neutral dark:prose-invert max-w-none">
            <h2>Why HubSpot + MCP Changes CRM Work</h2>
            <p>
              HubSpot is powerful but notorious for being click-heavy. Finding a contact, updating a
              deal stage, pulling a list of overdue follow-ups, or creating a new company record all
              require navigating nested menus. With a HubSpot MCP server, your LLM gets{" "}
              <strong>direct API access</strong> to your CRM — so you can ask natural-language
              questions and take actions in seconds.
            </p>
            <p>
              Sales reps can ask &quot;Show me all deals closing this month that haven&apos;t had an
              activity in 7 days&quot; and get a live answer. Marketing teams can trigger enrollment
              in a nurture sequence without opening the HubSpot UI. Founders can pull pipeline health
              reports on demand. MCP makes HubSpot conversational.
            </p>

            <h2>Top MCP Servers for HubSpot</h2>

            <h3>1. HubSpot MCP Server (Official)</h3>
            <p>
              HubSpot launched an official MCP server in early 2026, giving AI agents structured
              access to Contacts, Companies, Deals, Tickets, and custom objects. It uses OAuth or a
              private app access token for authentication.
            </p>
            <ul>
              <li>Search, create, and update contacts and companies</li>
              <li>Read and move deals through pipeline stages</li>
              <li>Create and close support tickets</li>
              <li>Query associations between CRM objects</li>
              <li>Read engagement history (emails, calls, meetings)</li>
            </ul>
            <p>
              <strong>Best for:</strong> Teams already on HubSpot CRM who want immediate AI access
              to their live data.
            </p>
            <p>
              <strong>Auth:</strong> HubSpot private app access token (recommended) or OAuth.
            </p>

            <h3>2. mcp-hubspot (Community)</h3>
            <p>
              A popular open-source MCP server with broader coverage than the official server,
              including Marketing Hub endpoints like email campaigns, lists, and forms. Built by the
              community and actively maintained on GitHub.
            </p>
            <ul>
              <li>Full CRM object CRUD (contacts, deals, companies, tickets)</li>
              <li>Marketing Hub: email stats, lists, form submissions</li>
              <li>Workflow enrollment and unenrollment</li>
              <li>HubDB table read access</li>
              <li>Blog post and landing page metadata</li>
            </ul>
            <p>
              <strong>Best for:</strong> Marketing teams that need AI access across both CRM and
              Marketing Hub.
            </p>

            <h3>3. hubspot-mcp-tools</h3>
            <p>
              A lightweight server focused on sales productivity: it adds higher-level tools that
              compose multiple API calls into single useful operations, like &quot;get all deals
              assigned to a rep with their last activity&quot; or &quot;summarize this
              contact&apos;s full history.&quot;
            </p>
            <ul>
              <li>Composite deal-health queries (stage + activity + close date)</li>
              <li>Contact 360 view (CRM data + engagement timeline)</li>
              <li>Pipeline velocity reporting</li>
              <li>Auto-draft follow-up emails based on deal context</li>
            </ul>
            <p>
              <strong>Best for:</strong> Sales teams wanting AI-assisted pipeline management without
              complex prompt engineering.
            </p>

            <h2>Common HubSpot MCP Workflows</h2>

            <h3>Pipeline Reviews Without the Slides</h3>
            <p>
              Instead of pulling a CSV and building a deck, ask your AI: &quot;Which deals in the
              Proposal stage haven&apos;t had contact in two weeks?&quot; The MCP server fetches live
              deal data and engagement logs, and your LLM synthesizes a clean answer — or a list you
              can act on immediately.
            </p>

            <h3>Contact Enrichment on Demand</h3>
            <p>
              Paste a company name or LinkedIn URL into your chat and ask the AI to find or create
              the contact in HubSpot, fill in missing properties, and log the source. With the right
              MCP server connected, this becomes a single prompt instead of a 5-minute manual task.
            </p>

            <h3>Workflow Enrollment from Chat</h3>
            <p>
              Sales ops teams use HubSpot workflows for follow-up sequences, but enrolling specific
              contacts often requires jumping into the UI. With MCP, a rep can say &quot;Enroll this
              contact in the 30-day nurture sequence&quot; and the AI handles the API call.
            </p>

            <h3>Reporting Without Reports</h3>
            <p>
              HubSpot&apos;s built-in reports are powerful but rigid. With MCP, you can ask ad-hoc
              questions like &quot;How many new contacts came in from the LinkedIn channel last
              quarter?&quot; and get a live answer without building a custom report dashboard.
            </p>

            <h2>Setting Up a HubSpot MCP Server</h2>
            <p>
              Most HubSpot MCP servers use a private app access token. Create one at:{" "}
              <strong>Settings → Integrations → Private Apps</strong>. Grant the scopes you need
              (CRM objects, marketing, etc.) and copy the token.
            </p>
            <p>Minimal config for Claude Desktop:</p>
            <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-sm">
{`{
  "mcpServers": {
    "hubspot": {
      "command": "npx",
      "args": ["-y", "@hubspot/mcp-server"],
      "env": {
        "HUBSPOT_ACCESS_TOKEN": "pat-na1-your-token-here"
      }
    }
  }
}`}
            </pre>
            <p>
              For broader Marketing Hub access, use the community <code>mcp-hubspot</code> server
              instead — it covers email campaigns, lists, and workflow management that the official
              server doesn&apos;t expose yet.
            </p>

            <h2>What to Watch Out For</h2>
            <p>
              HubSpot&apos;s API has <strong>rate limits</strong>: 100 requests per 10 seconds on
              most plans. If your AI is doing large batch operations (enriching 500 contacts at once),
              you&apos;ll want to build in pacing or use a server that handles retries automatically.
            </p>
            <p>
              Write operations — updating deal stages, enrolling contacts in workflows — should
              always be reviewed before executing in production. Ask your AI to{" "}
              <em>show you what it will do</em> before confirming. Good MCP servers support a
              dry-run or preview mode for destructive operations.
            </p>

            <h2>Choosing the Right HubSpot MCP Server</h2>
            <p>
              If you only need CRM data (contacts, deals, companies), the{" "}
              <strong>official HubSpot MCP server</strong> is the safest choice — it&apos;s
              maintained by HubSpot and will stay in sync with API changes. If you need Marketing
              Hub access or want higher-level composite operations, the{" "}
              <strong>community mcp-hubspot</strong> server adds significant value.
            </p>
            <p>
              Either way, HubSpot + MCP is one of the highest-ROI integrations available today.
              Sales and marketing teams that spend hours a week in the HubSpot UI can offload most of
              that navigation to their AI agent — and get better answers faster.
            </p>

            <h2>Browse All HubSpot MCP Servers</h2>
            <p>
              EveryMCP indexes the full ecosystem of HubSpot-related MCP servers, including
              community tools, specialized integrations, and enterprise options.
            </p>
          </section>

          <div className="mt-10 pt-8 border-t">
            <div className="flex flex-col gap-3">
              <Link
                href="/directory?q=hubspot"
                className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-3 font-medium hover:bg-primary/90 transition-colors"
              >
                Browse HubSpot MCP Servers →
              </Link>
              <Link
                href="/blog"
                className="inline-flex items-center justify-center rounded-md border px-6 py-3 font-medium hover:bg-muted transition-colors"
              >
                More MCP Guides
              </Link>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t">
            <h2 className="text-xl font-semibold mb-4">Related Guides</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/blog/mcp-servers-for-salesforce-and-crm" className="text-primary hover:underline">
                  Best MCP Servers for Salesforce & CRM
                </Link>
              </li>
              <li>
                <Link href="/blog/mcp-servers-for-email" className="text-primary hover:underline">
                  Best MCP Servers for Email
                </Link>
              </li>
              <li>
                <Link href="/blog/mcp-servers-for-zapier-and-n8n" className="text-primary hover:underline">
                  Best MCP Servers for Zapier & n8n
                </Link>
              </li>
            </ul>
          </div>
        </article>
      </main>
    </>
  );
}
