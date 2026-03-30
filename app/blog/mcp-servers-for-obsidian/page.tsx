import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best MCP Servers for Obsidian in 2026 — AI-Powered Knowledge Management",
  description:
    "Discover the top MCP servers for Obsidian. Let your AI agent read notes, search your vault, create new entries, and traverse your knowledge graph directly from Claude, GPT-4, or any LLM.",
  alternates: {
    canonical: "/blog/mcp-servers-for-obsidian"
  },
  openGraph: {
    title: "Best MCP Servers for Obsidian in 2026 — AI-Powered Knowledge Management",
    description:
      "Top MCP servers for Obsidian — let your AI agent read notes, search your vault, and work with your personal knowledge base.",
    url: "https://everymcp.com/blog/mcp-servers-for-obsidian",
    type: "article"
  }
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Best MCP Servers for Obsidian in 2026 — AI-Powered Knowledge Management",
  description:
    "Discover the top MCP servers for Obsidian. Let your AI agent read notes, search your vault, create new entries, and traverse your knowledge graph directly from Claude, GPT-4, or any LLM.",
  url: "https://everymcp.com/blog/mcp-servers-for-obsidian",
  datePublished: "2026-03-29",
  dateModified: "2026-03-29",
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

export default function MCPServersForObsidian() {
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
            <p className="text-sm text-muted-foreground mb-3">March 29, 2026 · 8 min read</p>
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Best MCP Servers for Obsidian in 2026
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Your AI agent can now read your Obsidian notes, search your entire vault, create new
              entries, and navigate your knowledge graph — all from a single conversation. Here are
              the best Model Context Protocol servers for Obsidian in 2026.
            </p>
          </header>

          <section className="prose prose-neutral dark:prose-invert max-w-none">
            <h2>Why Obsidian + MCP Is a Game Changer</h2>
            <p>
              Obsidian is where serious knowledge workers store their most valuable thinking —
              fleeting notes, literature reviews, permanent notes, project logs, and linked ideas
              built up over years. The problem: your AI assistant has been completely cut off from
              all of it.
            </p>
            <p>
              With an Obsidian MCP server, your LLM gets <strong>direct, live access</strong> to
              your vault. It can read any note, search across thousands of files, create new
              entries in the right folders, and even follow wikilinks between connected ideas. Your
              second brain becomes your AI&apos;s first resource.
            </p>

            <h2>Top MCP Servers for Obsidian</h2>

            <h3>1. obsidian-mcp (Community Favorite)</h3>
            <p>
              The most widely used Obsidian MCP server. It exposes your vault as a set of tools your
              LLM can call: read a note by path, search notes by keyword or tag, list all notes in a
              folder, create or update notes, and append to existing ones. Works out of the box with
              Claude Desktop and any MCP-compatible client.
            </p>
            <p>
              <strong>Key tools:</strong> <code>read_note</code>, <code>search_notes</code>,{" "}
              <code>list_notes</code>, <code>create_note</code>, <code>append_to_note</code>
            </p>
            <p>
              <strong>Best for:</strong> Developers and power users who want full programmatic
              access to their vault without touching the Obsidian UI.
            </p>

            <h3>2. mcp-obsidian (REST API Bridge)</h3>
            <p>
              This server works by connecting to the{" "}
              <a
                href="https://github.com/coddingtonbear/obsidian-local-rest-api"
                target="_blank"
                rel="noopener noreferrer"
              >
                Obsidian Local REST API plugin
              </a>
              , which you install inside Obsidian itself. Once enabled, the MCP server can read and
              write notes in real time — even while Obsidian is open. This means your AI can create
              notes that appear instantly in your graph.
            </p>
            <p>
              <strong>Key tools:</strong> <code>get_note</code>, <code>patch_note</code>,{" "}
              <code>create_note</code>, <code>search_vault</code>, <code>list_directory</code>
            </p>
            <p>
              <strong>Best for:</strong> Users who want live, two-way sync between their LLM
              conversation and Obsidian — great for capturing AI-generated insights directly into
              your vault.
            </p>

            <h3>3. obsidian-mcp-tools (Graph-Aware)</h3>
            <p>
              A more advanced server that understands Obsidian&apos;s wikilink graph. Beyond basic
              read/write, it can retrieve backlinks for a note, list all outgoing links, find
              orphaned notes, and even surface related notes by link proximity. If your vault is
              heavily interconnected, this is the server that respects the structure you&apos;ve
              built.
            </p>
            <p>
              <strong>Key tools:</strong> <code>get_backlinks</code>,{" "}
              <code>get_outgoing_links</code>, <code>find_orphans</code>,{" "}
              <code>related_notes</code>
            </p>
            <p>
              <strong>Best for:</strong> PKM power users, Zettelkasten practitioners, and anyone
              who relies on link structure for navigation and discovery.
            </p>

            <h3>4. obsidian-mcp-server (Dataview Support)</h3>
            <p>
              This server adds support for{" "}
              <a
                href="https://github.com/blacksmithgu/obsidian-dataview"
                target="_blank"
                rel="noopener noreferrer"
              >
                Obsidian Dataview
              </a>{" "}
              queries — letting your LLM run structured queries across your vault&apos;s frontmatter
              and inline fields. Ask your AI to &quot;find all books I&apos;ve rated 5 stars&quot; or
              &quot;list all tasks marked done this week&quot; and it&apos;ll execute a Dataview query
              under the hood.
            </p>
            <p>
              <strong>Key tools:</strong> <code>dataview_query</code>, <code>get_metadata</code>,{" "}
              <code>list_by_tag</code>, <code>search_frontmatter</code>
            </p>
            <p>
              <strong>Best for:</strong> Users who track books, habits, projects, or contacts in
              Obsidian using Dataview and want their AI to query that structured data directly.
            </p>

            <h2>Setting Up an Obsidian MCP Server</h2>
            <p>
              Most Obsidian MCP servers follow the same setup pattern. Here&apos;s how to get
              obsidian-mcp running with Claude Desktop:
            </p>
            <ol>
              <li>
                <strong>Install the server:</strong> Clone or install via npm (
                <code>npm install -g obsidian-mcp</code>).
              </li>
              <li>
                <strong>Point it at your vault:</strong> Most servers require a{" "}
                <code>VAULT_PATH</code> environment variable or config option.
              </li>
              <li>
                <strong>Add to claude_desktop_config.json:</strong>
                <pre>
                  <code>{`{
  "mcpServers": {
    "obsidian": {
      "command": "obsidian-mcp",
      "env": {
        "VAULT_PATH": "/Users/you/MyVault"
      }
    }
  }
}`}</code>
                </pre>
              </li>
              <li>
                <strong>Restart Claude Desktop</strong> and verify the tools appear in the tool
                panel.
              </li>
            </ol>
            <p>
              For the REST API-based servers (like mcp-obsidian), you&apos;ll also need to install
              and enable the{" "}
              <strong>Obsidian Local REST API</strong> community plugin and note the API key it
              generates.
            </p>

            <h2>What You Can Build with Obsidian + MCP</h2>
            <p>
              Once your AI can read and write your vault, entirely new workflows open up:
            </p>
            <ul>
              <li>
                <strong>Capture meeting notes automatically:</strong> Tell your AI to summarize a
                transcript and save it as a new note in your{" "}
                <code>Meetings/</code> folder with the right frontmatter.
              </li>
              <li>
                <strong>Link-aware research:</strong> Ask your AI to find all notes related to a
                topic and synthesize them — it can follow wikilinks to pull the full context.
              </li>
              <li>
                <strong>Intelligent journaling:</strong> Have your AI append a daily summary to your
                journal note, pulling in tasks completed, decisions made, and open questions.
              </li>
              <li>
                <strong>Tag and metadata cleanup:</strong> Ask your AI to audit your vault for
                inconsistent tags, missing frontmatter, or orphaned notes and fix them in bulk.
              </li>
              <li>
                <strong>Writing from your notes:</strong> Feed your AI your research notes and
                permanent notes on a topic and ask it to draft a blog post or essay — with all
                sources in your vault, not hallucinated.
              </li>
            </ul>

            <h2>Obsidian MCP vs. Notion MCP: Which Should You Use?</h2>
            <p>
              Both are excellent choices, but they serve different users:
            </p>
            <ul>
              <li>
                <strong>Obsidian MCP</strong> is for individuals and solo researchers who own their
                data locally, live in plain markdown, and rely on a personal knowledge graph. Your
                vault is on your machine — no cloud dependency.
              </li>
              <li>
                <strong>
                  <Link href="/blog/mcp-servers-for-notion">Notion MCP</Link>
                </strong>{" "}
                is better for teams, collaborative wikis, and structured databases. Notion&apos;s API
                gives AI agents access to shared workspace content that multiple people contribute to.
              </li>
            </ul>
            <p>
              If you&apos;re a serious solo knowledge worker, Obsidian MCP is the move. If you work on
              a team that lives in Notion, go there instead.
            </p>

            <h2>Security Considerations</h2>
            <p>
              Your Obsidian vault likely contains sensitive personal information — passwords you&apos;ve
              noted, private reflections, confidential work documents. Before enabling any MCP server
              on your vault:
            </p>
            <ul>
              <li>
                Review which notes your AI should <em>not</em> access and store them in a
                sub-vault or excluded folder.
              </li>
              <li>
                Use a read-only MCP server configuration during initial testing.
              </li>
              <li>
                Check whether the server logs your note contents to disk or any external service.
              </li>
              <li>
                Prefer local-first servers (no cloud relay) for maximum privacy.
              </li>
            </ul>
            <p>
              Most community Obsidian MCP servers are open source — read the code before trusting
              them with your vault.
            </p>

            <h2>Find the Right MCP Server for Your Setup</h2>
            <p>
              The Obsidian MCP ecosystem is still maturing. New servers appear regularly as more
              developers connect their knowledge tools to LLMs. EveryMCP indexes the full MCP
              ecosystem so you can compare options, read real documentation, and find the server that
              fits your vault structure.
            </p>
            <p>
              <Link href="/" className="font-medium underline">
                Browse all MCP servers on EveryMCP →
              </Link>
            </p>
          </section>
        </article>

        <footer className="mt-16 pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            Related:{" "}
            <Link href="/blog/mcp-servers-for-notion" className="underline hover:text-foreground">
              MCP Servers for Notion
            </Link>{" "}
            ·{" "}
            <Link
              href="/blog/mcp-servers-for-llm-memory"
              className="underline hover:text-foreground"
            >
              MCP Servers for LLM Memory
            </Link>{" "}
            ·{" "}
            <Link href="/blog/mcp-servers-for-productivity-automation" className="underline hover:text-foreground">
              MCP Servers for Productivity Automation
            </Link>
          </p>
        </footer>
      </main>
    </>
  );
}
