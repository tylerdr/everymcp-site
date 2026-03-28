import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best MCP Servers for Supabase (2026) — Query, Auth & Storage via AI",
  description:
    "Discover the best MCP servers for Supabase. Connect Claude, Cursor, and other AI assistants directly to your Supabase database, auth, storage, and Edge Functions.",
  alternates: {
    canonical: "/blog/mcp-servers-for-supabase"
  },
  openGraph: {
    title: "Best MCP Servers for Supabase (2026)",
    description:
      "Connect AI assistants to Supabase databases, auth, storage, and Edge Functions using these MCP servers.",
    url: "https://everymcp.com/blog/mcp-servers-for-supabase",
    type: "article"
  }
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Best MCP Servers for Supabase (2026) — Query, Auth & Storage via AI",
  description:
    "Discover the best MCP servers for Supabase. Connect Claude, Cursor, and other AI assistants directly to your Supabase database, auth, storage, and Edge Functions.",
  url: "https://everymcp.com/blog/mcp-servers-for-supabase",
  datePublished: "2026-03-28",
  dateModified: "2026-03-28",
  author: {
    "@type": "Organization",
    name: "EveryMCP",
    url: "https://everymcp.com"
  },
  publisher: {
    "@type": "Organization",
    name: "EveryMCP",
    url: "https://everymcp.com"
  },
  image: "https://everymcp.com/og-image.png"
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <main className="max-w-3xl mx-auto px-4 py-12 text-gray-900">
        <div className="mb-6">
          <Link href="/blog" className="text-sm text-blue-600 hover:underline">
            ← Back to Blog
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-4 leading-tight">
          Best MCP Servers for Supabase (2026)
        </h1>
        <p className="text-gray-500 text-sm mb-8">Updated March 28, 2026 · 6 min read</p>

        <p className="text-lg text-gray-700 mb-8">
          Supabase has become the go-to backend for modern web apps — Postgres at the core, with
          built-in auth, realtime, storage, and Edge Functions. MCP servers bridge Supabase with
          AI assistants like Claude, Cursor, and Windsurf, so you can query your database, manage
          users, and debug edge functions entirely in natural language.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4">Why Use MCP with Supabase?</h2>
        <p className="text-gray-700 mb-4">
          Most database work is repetitive: writing queries, checking schema, looking up user
          records, debugging RLS policies. MCP servers expose Supabase's capabilities as tools
          that AI agents can call on your behalf — without you switching context to the Supabase
          dashboard or writing boilerplate SQL every time.
        </p>
        <p className="text-gray-700 mb-4">Common use cases include:</p>
        <ul className="list-disc pl-6 text-gray-700 mb-8 space-y-2">
          <li>Asking Claude to query production data and summarize results</li>
          <li>Generating and running migrations from a plain-English description</li>
          <li>Debugging row-level security policies by testing them live</li>
          <li>Listing and managing auth users without leaving your editor</li>
          <li>Uploading and organizing files in Supabase Storage</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4">Top MCP Servers for Supabase</h2>

        <h3 className="text-xl font-semibold mt-8 mb-2">1. supabase-mcp (Official)</h3>
        <p className="text-gray-700 mb-4">
          Supabase's own MCP server is the most complete option. It exposes read and write access
          to your Postgres database via the Supabase REST API and Management API. It supports
          running SQL queries, listing tables, inspecting schema, and managing projects.
        </p>
        <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-1">
          <li><strong>Tools exposed:</strong> list_tables, execute_sql, get_schema, create_table, apply_migration</li>
          <li><strong>Auth:</strong> Supabase personal access token</li>
          <li><strong>Best for:</strong> Developers who want deep database + management access</li>
        </ul>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <p className="text-sm font-mono text-gray-700">
            npx @supabase/mcp-server-supabase --access-token YOUR_TOKEN
          </p>
        </div>

        <h3 className="text-xl font-semibold mt-8 mb-2">2. postgres-mcp (via Supabase connection string)</h3>
        <p className="text-gray-700 mb-4">
          If you prefer direct Postgres access rather than the Supabase REST API, a generic
          postgres MCP server works equally well. Connect it to your Supabase Postgres connection
          string (pooler or direct) and you get full SQL execution, schema inspection, and query
          analysis.
        </p>
        <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-1">
          <li><strong>Tools exposed:</strong> query, describe_table, list_schemas, explain</li>
          <li><strong>Auth:</strong> Postgres connection string (pooler preferred)</li>
          <li><strong>Best for:</strong> Power users who want raw SQL flexibility</li>
        </ul>
        <p className="text-gray-700 mb-6">
          Find your connection string in the Supabase dashboard under{" "}
          <strong>Settings → Database → Connection string</strong>. Use the Transaction Pooler
          URL to avoid connection limits.
        </p>

        <h3 className="text-xl font-semibold mt-8 mb-2">3. supabase-storage-mcp</h3>
        <p className="text-gray-700 mb-4">
          A lightweight MCP server focused exclusively on Supabase Storage. Useful when you need
          an AI assistant to list buckets, upload files, manage permissions, or generate signed
          URLs — without exposing full database access.
        </p>
        <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-1">
          <li><strong>Tools exposed:</strong> list_buckets, upload_file, get_signed_url, delete_file</li>
          <li><strong>Auth:</strong> Supabase service role key</li>
          <li><strong>Best for:</strong> Media-heavy apps, file management workflows</li>
        </ul>

        <h3 className="text-xl font-semibold mt-8 mb-2">4. supabase-auth-mcp</h3>
        <p className="text-gray-700 mb-4">
          Exposes Supabase Auth operations as MCP tools: list users, look up by email, update
          metadata, and manage roles. Particularly useful for support engineers and admins who
          need to investigate auth issues without digging through the dashboard.
        </p>
        <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-1">
          <li><strong>Tools exposed:</strong> list_users, get_user, update_user_metadata, delete_user</li>
          <li><strong>Auth:</strong> Supabase service role key</li>
          <li><strong>Best for:</strong> Admin workflows, user lookup, role management</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4">Setting Up Supabase MCP in Claude Desktop</h2>
        <p className="text-gray-700 mb-4">
          Add the official Supabase MCP server to your Claude Desktop config file:
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <pre className="text-sm font-mono text-gray-700 whitespace-pre-wrap">{`{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "@supabase/mcp-server-supabase",
        "--access-token",
        "YOUR_SUPABASE_PERSONAL_ACCESS_TOKEN"
      ]
    }
  }
}`}</pre>
        </div>
        <p className="text-gray-700 mb-8">
          Get your personal access token from{" "}
          <strong>Supabase Dashboard → Account → Access Tokens</strong>. Use a token with
          read-only scope for safety in production environments.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4">Setting Up Supabase MCP in Cursor</h2>
        <p className="text-gray-700 mb-4">
          In Cursor, add the MCP server via <strong>Settings → MCP</strong>:
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
          <pre className="text-sm font-mono text-gray-700 whitespace-pre-wrap">{`{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["@supabase/mcp-server-supabase", "--access-token", "YOUR_TOKEN"]
    }
  }
}`}</pre>
        </div>

        <h2 className="text-2xl font-bold mt-10 mb-4">Security Best Practices</h2>
        <ul className="list-disc pl-6 text-gray-700 mb-8 space-y-2">
          <li>
            <strong>Use the anon key for read-only access</strong> — never expose your service
            role key unless the MCP server explicitly needs admin operations.
          </li>
          <li>
            <strong>Enable Row Level Security (RLS)</strong> — even when querying via MCP, RLS
            policies apply when using the anon or authenticated key.
          </li>
          <li>
            <strong>Use read-only personal access tokens</strong> — Supabase lets you scope
            tokens; prefer project-scoped read tokens for database exploration.
          </li>
          <li>
            <strong>Audit what the AI executes</strong> — review queries before allowing writes
            to production tables, especially for destructive operations.
          </li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4">Common Prompts That Work Well</h2>
        <p className="text-gray-700 mb-4">Once your Supabase MCP server is connected, try:</p>
        <ul className="list-disc pl-6 text-gray-700 mb-8 space-y-2">
          <li>"List all tables in my public schema and describe their columns"</li>
          <li>"Find all users who signed up in the last 7 days"</li>
          <li>"Show me the 10 most recent rows in the orders table"</li>
          <li>"Write and execute a migration to add a `status` column to the jobs table"</li>
          <li>"Check if RLS is enabled on all tables in the public schema"</li>
          <li>"List all storage buckets and their public/private setting"</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4">Comparing Supabase MCP to Direct Dashboard Access</h2>
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-200 px-4 py-2 text-left">Task</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Dashboard</th>
                <th className="border border-gray-200 px-4 py-2 text-left">MCP + AI</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Find a user by email", "Search in Auth UI", "\"Find user by email john@example.com\""],
                ["Write a migration", "SQL editor, manual schema check", "Describe change → auto-generated + executed"],
                ["Debug RLS policy", "Manual policy editor + test", "\"Why can't user X see table Y?\""],
                ["Query production data", "Table editor or SQL editor", "Natural language query → instant results"],
                ["Schema exploration", "Click through table list", "\"Describe all tables and their relationships\""],
              ].map(([task, dashboard, mcp]) => (
                <tr key={task} className="border-b border-gray-100">
                  <td className="border border-gray-200 px-4 py-2 font-medium">{task}</td>
                  <td className="border border-gray-200 px-4 py-2 text-gray-600">{dashboard}</td>
                  <td className="border border-gray-200 px-4 py-2 text-green-700">{mcp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="text-2xl font-bold mt-10 mb-4">Related MCP Servers</h2>
        <ul className="list-disc pl-6 text-gray-700 mb-8 space-y-2">
          <li>
            <Link href="/blog/mcp-servers-for-postgres" className="text-blue-600 hover:underline">
              MCP Servers for Postgres
            </Link>{" "}
            — for direct Postgres access beyond Supabase
          </li>
          <li>
            <Link href="/blog/mcp-servers-for-database-access" className="text-blue-600 hover:underline">
              MCP Servers for Database Access
            </Link>{" "}
            — broader database tooling overview
          </li>
          <li>
            <Link href="/blog/mcp-servers-for-aws-and-cloud" className="text-blue-600 hover:underline">
              MCP Servers for AWS and Cloud
            </Link>{" "}
            — if you're deploying beyond Supabase
          </li>
        </ul>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-10">
          <h3 className="text-lg font-semibold mb-2">Find More MCP Servers on EveryMCP</h3>
          <p className="text-gray-700 mb-4">
            Browse the full directory of MCP servers — filtered by category, client, and use case.
          </p>
          <Link
            href="/directory"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Explore the MCP Directory →
          </Link>
        </div>
      </main>
    </>
  );
}
