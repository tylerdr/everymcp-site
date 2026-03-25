import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best MCP Servers for PostgreSQL in 2026 — Query Databases with AI",
  description:
    "Discover the top MCP servers for PostgreSQL. Let your AI agent run SQL queries, explore schemas, and analyze data directly from Claude, GPT-4, or any LLM — no SQL expertise required.",
  alternates: {
    canonical: "/blog/mcp-servers-for-postgres"
  },
  openGraph: {
    title: "Best MCP Servers for PostgreSQL in 2026 — Query Databases with AI",
    description:
      "Top MCP servers for PostgreSQL — let your AI agent run queries, explore schemas, and analyze data.",
    url: "https://everymcp.com/blog/mcp-servers-for-postgres",
    type: "article"
  }
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Best MCP Servers for PostgreSQL in 2026 — Query Databases with AI",
  description:
    "Discover the top MCP servers for PostgreSQL. Let your AI agent run SQL queries, explore schemas, and analyze data directly from Claude, GPT-4, or any LLM.",
  url: "https://everymcp.com/blog/mcp-servers-for-postgres",
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

export default function MCPServersForPostgres() {
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
            <p className="text-sm text-muted-foreground mb-3">March 25, 2026 · 9 min read</p>
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Best MCP Servers for PostgreSQL in 2026
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              PostgreSQL powers millions of applications — from SaaS startups to enterprise data
              warehouses. With the right MCP server, your AI agent can query tables, explore
              schemas, generate reports, and debug slow queries directly inside your chat interface.
              No SQL client needed.
            </p>
          </header>

          <section className="prose prose-neutral dark:prose-invert max-w-none">
            <h2>Why Connect Your AI to PostgreSQL?</h2>
            <p>
              Database work is time-consuming: writing complex JOINs, tracking down schema details,
              analyzing query performance, generating ad-hoc reports. Most of that cognitive load
              can be offloaded to an AI agent — if it has direct access to your database. MCP
              (Model Context Protocol) servers bridge your Postgres instance and your LLM, giving
              the AI read (and optionally write) access through a secure, structured interface.
            </p>
            <p>
              The result: ask your AI "show me the top 10 customers by revenue this quarter" and
              get back actual data, not a generic SQL snippet.
            </p>

            <h2>What to Look for in a PostgreSQL MCP Server</h2>
            <ul>
              <li>
                <strong>Schema introspection</strong> — Can the AI see your tables, columns, and
                relationships automatically?
              </li>
              <li>
                <strong>Read-only mode</strong> — Prevents accidental writes during exploration.
              </li>
              <li>
                <strong>Connection pooling</strong> — Handles concurrent queries without overloading
                your DB.
              </li>
              <li>
                <strong>Query safety</strong> — Blocks destructive operations (DROP, TRUNCATE) by
                default.
              </li>
              <li>
                <strong>SSL support</strong> — Essential for production databases.
              </li>
            </ul>

            <h2>Top MCP Servers for PostgreSQL</h2>

            <h3>1. @modelcontextprotocol/server-postgres</h3>
            <p>
              The official Postgres MCP server from Anthropic. It connects to any PostgreSQL
              instance via a standard connection string and exposes tools for running queries and
              listing schema objects. It's the safest starting point — read-only by default and
              well-maintained.
            </p>
            <p>
              <strong>Best for:</strong> Developers who want a quick, trustworthy connection to
              their Postgres database without configuration overhead.
            </p>
            <p>
              <strong>Key features:</strong> Schema listing, table inspection, SELECT query
              execution, read-only enforcement.
            </p>
            <p>
              <strong>Install:</strong>{" "}
              <code>npx @modelcontextprotocol/server-postgres postgresql://user:pass@host/db</code>
            </p>

            <h3>2. mcp-server-postgresql (Community)</h3>
            <p>
              A community-built alternative with broader tool coverage. In addition to read
              queries, it supports write operations gated behind an explicit confirmation step —
              useful for AI agents that need to insert or update rows as part of a workflow.
            </p>
            <p>
              <strong>Best for:</strong> Agentic workflows where the AI needs to both read and
              modify data (e.g., updating a status field after processing a record).
            </p>
            <p>
              <strong>Key features:</strong> Full CRUD support, transaction rollback on error,
              parameterized queries, configurable allow/deny lists for tables.
            </p>

            <h3>3. Supabase MCP Server</h3>
            <p>
              If your PostgreSQL is hosted on Supabase, the official Supabase MCP server is your
              best bet. It goes beyond raw SQL — it also exposes Supabase's storage, auth, and
              edge function APIs. Your AI can query user tables, check auth logs, and inspect
              storage buckets in the same conversation.
            </p>
            <p>
              <strong>Best for:</strong> Supabase users who want unified AI access to their entire
              backend, not just the database layer.
            </p>
            <p>
              <strong>Key features:</strong> Database queries, Row Level Security awareness,
              storage API, auth user lookup, function invocation.
            </p>

            <h3>4. pgmcp (Postgres-native MCP)</h3>
            <p>
              A Rust-based MCP server that runs as a lightweight sidecar to your Postgres instance.
              Designed for high-throughput workloads, it supports streaming result sets and
              connection multiplexing. Ideal for data-heavy environments where query response size
              matters.
            </p>
            <p>
              <strong>Best for:</strong> Engineering teams querying large datasets or running
              analytical workloads via AI agents.
            </p>
            <p>
              <strong>Key features:</strong> Streaming results, connection pool management, EXPLAIN
              ANALYZE support, query timeout enforcement.
            </p>

            <h3>5. mcp-database-server (Multi-DB)</h3>
            <p>
              Not exclusively Postgres, but worth including: this server supports PostgreSQL,
              MySQL, and SQLite through a unified interface. If your stack spans multiple database
              types, a single MCP server that handles all of them is operationally simpler.
            </p>
            <p>
              <strong>Best for:</strong> Teams with polyglot database environments who want one
              MCP config rather than three.
            </p>
            <p>
              <strong>Key features:</strong> Multi-database support, unified query API, schema
              diffing across databases.
            </p>

            <h2>Setting Up the Official Postgres MCP Server</h2>
            <p>Here's the fastest path from zero to querying your database with Claude:</p>

            <h3>Step 1: Add to your Claude Desktop config</h3>
            <p>
              Open <code>~/.config/claude/claude_desktop_config.json</code> (macOS:{" "}
              <code>~/Library/Application Support/Claude/claude_desktop_config.json</code>) and add:
            </p>
            <pre className="bg-muted rounded-md p-4 overflow-x-auto text-sm">
              <code>{`{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://username:password@localhost:5432/mydb"
      ]
    }
  }
}`}</code>
            </pre>

            <h3>Step 2: Restart Claude Desktop</h3>
            <p>
              After saving the config, restart Claude Desktop. You should see a database icon or
              "postgres" listed in the connected tools panel.
            </p>

            <h3>Step 3: Test the connection</h3>
            <p>Ask Claude:</p>
            <blockquote>
              "List all tables in my database and describe the structure of the users table."
            </blockquote>
            <p>
              If the server is connected, Claude will query your database schema and return a
              structured summary. From there, you can start asking analytical questions in plain
              English.
            </p>

            <h2>Security Best Practices</h2>
            <p>
              Giving an AI access to your database is powerful — and requires care. Follow these
              practices:
            </p>
            <ul>
              <li>
                <strong>Create a dedicated read-only user.</strong> Never connect with your admin
                credentials. Create a role with SELECT-only permissions on the schemas the AI needs.
              </li>
              <li>
                <strong>Limit schema visibility.</strong> Use a search_path or explicit schema
                grants to expose only the tables that are relevant.
              </li>
              <li>
                <strong>Use SSL.</strong> All production connections should use{" "}
                <code>?sslmode=require</code> in the connection string.
              </li>
              <li>
                <strong>Never embed credentials in version control.</strong> Use environment
                variables or a secrets manager to pass the connection string.
              </li>
              <li>
                <strong>Monitor query logs.</strong> Enable <code>log_statement = 'all'</code>{" "}
                temporarily to audit what the AI is querying.
              </li>
            </ul>

            <h2>What Your AI Can Do With Postgres Access</h2>
            <p>Once connected, common use cases include:</p>
            <ul>
              <li>
                <strong>Business intelligence:</strong> "What's our MRR by plan tier this month?"
              </li>
              <li>
                <strong>Customer support:</strong> "Find all orders placed by user@example.com in
                the last 30 days."
              </li>
              <li>
                <strong>Debugging:</strong> "Show me all failed payment records from yesterday."
              </li>
              <li>
                <strong>Schema exploration:</strong> "Explain the relationship between the orders
                and line_items tables."
              </li>
              <li>
                <strong>Performance:</strong> "Which queries are taking the longest to run? Show me
                the top 5 from pg_stat_statements."
              </li>
            </ul>

            <h2>PostgreSQL vs. Other Databases: MCP Coverage</h2>
            <p>
              PostgreSQL has the best MCP server ecosystem of any database today. MySQL is a
              close second; SQLite and MongoDB have solid options too. If you're evaluating
              databases for a new project and AI-assisted data work matters to you, Postgres is
              the clear winner from an MCP tooling standpoint.
            </p>
            <p>
              See also:{" "}
              <Link
                href="/blog/mcp-servers-for-database-access"
                className="text-primary hover:underline"
              >
                MCP Servers for Database Access
              </Link>{" "}
              for a broader comparison across database types.
            </p>

            <h2>Find More PostgreSQL MCP Servers</h2>
            <p>
              The MCP ecosystem is growing fast. New Postgres-focused servers are published every
              week — some with specialized features like vector search support (pgvector), TimescaleDB
              integration, or PostGIS spatial queries. Browse the full database category on EveryMCP
              to find the right tool for your stack.
            </p>

            <div className="mt-8 p-6 bg-muted rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Browse PostgreSQL MCP Servers</h3>
              <p className="text-muted-foreground mb-4">
                Search and filter hundreds of MCP servers — including the full list of database
                integrations — on EveryMCP.
              </p>
              <Link
                href="/search?q=postgres"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
              >
                Search PostgreSQL Servers →
              </Link>
            </div>
          </section>
        </article>

        <div className="mt-12 pt-8 border-t">
          <h3 className="text-lg font-semibold mb-4">Related Articles</h3>
          <div className="grid gap-3">
            <Link
              href="/blog/mcp-servers-for-database-access"
              className="text-primary hover:underline"
            >
              MCP Servers for Database Access →
            </Link>
            <Link
              href="/blog/mcp-servers-for-databases"
              className="text-primary hover:underline"
            >
              Best MCP Servers for Databases in 2026 →
            </Link>
            <Link
              href="/blog/mcp-servers-for-data-analysis"
              className="text-primary hover:underline"
            >
              MCP Servers for Data Analysis →
            </Link>
            <Link
              href="/blog/mcp-servers-for-github"
              className="text-primary hover:underline"
            >
              MCP Servers for GitHub →
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
