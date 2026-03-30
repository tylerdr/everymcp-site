import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best MCP Servers for Obsidian — Connect Your AI to Your Knowledge Base",
  description:
    "Discover the best MCP servers for Obsidian. Connect Claude, GPT-4, and other AI models to your Obsidian vault for AI-powered note creation, search, and knowledge management.",
  alternates: {
    canonical: "/blog/mcp-servers-for-obsidian"
  },
  openGraph: {
    title: "Best MCP Servers for Obsidian — Connect Your AI to Your Knowledge Base",
    description:
      "The best MCP servers for Obsidian: connect your AI assistant to your personal knowledge base for smarter notes, search, and insights.",
    url: "https://everymcp.com/blog/mcp-servers-for-obsidian",
    type: "article"
  }
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Best MCP Servers for Obsidian — Connect Your AI to Your Knowledge Base",
  description:
    "Discover the best MCP servers for Obsidian. Connect Claude, GPT-4, and other AI models to your Obsidian vault for AI-powered note creation, search, and knowledge management.",
  url: "https://everymcp.com/blog/mcp-servers-for-obsidian",
  datePublished: "2026-03-30",
  dateModified: "2026-03-30",
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
  keywords: [
    "MCP servers for Obsidian",
    "Obsidian AI integration",
    "MCP Obsidian vault",
    "AI note taking Obsidian",
    "Model Context Protocol Obsidian"
  ]
};

export default function MCPServersObsidian() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/blog" className="text-sm text-muted-foreground hover:underline">
            ← All posts
          </Link>
        </div>

        <article>
          <header className="mb-10">
            <p className="text-sm text-muted-foreground mb-3">March 30, 2026 · Knowledge Management</p>
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Best MCP Servers for Obsidian
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Obsidian is already powerful on its own. But when you connect it to an AI model via MCP, your knowledge base becomes an active collaborator — surfacing connections, drafting notes, and answering questions from everything you&apos;ve ever written.
            </p>
          </header>

          <section className="prose prose-neutral dark:prose-invert max-w-none space-y-8">

            <div>
              <h2 className="text-2xl font-semibold mb-3">Why Connect Obsidian to MCP?</h2>
              <p>
                Obsidian is a local-first, Markdown-based note-taking app used by researchers, developers, writers, and knowledge workers. Its graph view and backlinks make it a powerful personal knowledge management (PKM) tool.
              </p>
              <p className="mt-3">
                MCP (Model Context Protocol) lets AI models like Claude or GPT-4 read and write to external systems. When you expose your Obsidian vault via an MCP server, your AI assistant gains the ability to:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-1">
                <li>Search your notes by topic or keyword</li>
                <li>Read specific notes and summarize them</li>
                <li>Create new notes from your conversations</li>
                <li>Update existing notes with new information</li>
                <li>Answer questions using your personal knowledge base</li>
                <li>Find connections between ideas you hadn&apos;t noticed</li>
              </ul>
              <p className="mt-3">
                This is the difference between an AI that knows general knowledge and one that knows <em>your</em> knowledge.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">Top MCP Servers for Obsidian</h2>

              <div className="border rounded-lg p-5 mb-4">
                <h3 className="text-lg font-semibold mb-1">1. obsidian-mcp</h3>
                <p className="text-sm text-muted-foreground mb-2">Best for: full CRUD access to your vault</p>
                <p>
                  The most widely used MCP server for Obsidian. It exposes your vault as a filesystem of Markdown notes, with tools for reading, writing, searching, and listing files. Works with Claude Desktop and any MCP-compatible client.
                </p>
                <div className="mt-3 space-y-1 text-sm">
                  <p><strong>Key tools:</strong></p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><code>read_note</code> — fetch a note by path or title</li>
                    <li><code>create_note</code> — write a new note to a specified folder</li>
                    <li><code>search_notes</code> — full-text search across the vault</li>
                    <li><code>list_notes</code> — browse vault structure</li>
                    <li><code>update_note</code> — append or overwrite note content</li>
                  </ul>
                </div>
                <p className="mt-3 text-sm">
                  <strong>Setup:</strong> Configure your vault path in Claude Desktop&apos;s MCP settings. Works with any local Obsidian vault — no Obsidian plugin required.
                </p>
              </div>

              <div className="border rounded-lg p-5 mb-4">
                <h3 className="text-lg font-semibold mb-1">2. obsidian-local-rest-api + MCP bridge</h3>
                <p className="text-sm text-muted-foreground mb-2">Best for: users who want to use the Obsidian Local REST API plugin</p>
                <p>
                  The Obsidian Local REST API community plugin exposes your vault over HTTP. Paired with a lightweight MCP server that wraps these endpoints, your AI gets access to vault contents, daily notes, search, and more — all running locally.
                </p>
                <div className="mt-3 space-y-1 text-sm">
                  <p><strong>Capabilities include:</strong></p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Get and update the active note</li>
                    <li>Create daily notes automatically</li>
                    <li>Search vault with Obsidian&apos;s native search engine</li>
                    <li>Execute vault commands</li>
                  </ul>
                </div>
                <p className="mt-3 text-sm">
                  <strong>Setup:</strong> Install the Local REST API plugin in Obsidian, enable it, and configure your MCP client to connect to <code>localhost:27123</code>.
                </p>
              </div>

              <div className="border rounded-lg p-5 mb-4">
                <h3 className="text-lg font-semibold mb-1">3. filesystem MCP server (official)</h3>
                <p className="text-sm text-muted-foreground mb-2">Best for: simple read/write access without Obsidian-specific features</p>
                <p>
                  Anthropic&apos;s official filesystem MCP server works with any directory — including your Obsidian vault. It&apos;s less Obsidian-aware but completely reliable and well-documented. Use this if you just need to read notes or paste content into your vault from a conversation.
                </p>
                <div className="mt-3 space-y-1 text-sm">
                  <p><strong>Best for:</strong></p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Drafting a note and saving it to your vault</li>
                    <li>Reading a long note for AI analysis</li>
                    <li>Organizing files between folders</li>
                  </ul>
                </div>
              </div>

              <div className="border rounded-lg p-5 mb-4">
                <h3 className="text-lg font-semibold mb-1">4. Smart Connections MCP (experimental)</h3>
                <p className="text-sm text-muted-foreground mb-2">Best for: semantic search and AI-powered note linking</p>
                <p>
                  Smart Connections is a popular Obsidian plugin that uses embeddings to find semantically related notes. Some users have built MCP wrappers on top of its local AI features, allowing Claude to find the notes most relevant to a given query — not just keyword matches, but actual semantic similarity.
                </p>
                <p className="mt-3 text-sm">
                  This is early-stage but promising for power users with large vaults who want smarter retrieval.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">Practical Use Cases</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Capture meeting notes hands-free</h3>
                  <p>
                    Speak or type your meeting notes into Claude, and have it format them and save to your Obsidian vault under a consistent naming convention. Your AI handles the friction between thinking and filing.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-1">Answer questions from your own writing</h3>
                  <p>
                    &ldquo;What did I decide about the API architecture last month?&rdquo; — Claude searches your notes and gives you the answer. No more hunting through folders. This is second-brain retrieval on demand.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-1">Draft new content from existing notes</h3>
                  <p>
                    Point Claude at a set of notes on a topic, and ask it to synthesize them into a blog post, report, or proposal. Your accumulated thinking becomes a first draft instantly.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-1">Build a daily note automatically</h3>
                  <p>
                    Set up a Claude workflow that reads yesterday&apos;s note, pulls your calendar events, and writes today&apos;s daily note template — pre-populated and ready to go.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-1">Find orphaned notes and suggest links</h3>
                  <p>
                    Ask Claude to read a set of notes and suggest internal links you should add. This is the killer feature for large, link-heavy vaults where you know connections exist but haven&apos;t made them explicit.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">How to Set Up Obsidian MCP with Claude Desktop</h2>
              <p>
                The quickest path to AI + Obsidian is using Claude Desktop with the <code>obsidian-mcp</code> server:
              </p>
              <ol className="list-decimal pl-6 mt-3 space-y-3">
                <li>
                  <strong>Install Claude Desktop</strong> from <code>claude.ai/download</code>
                </li>
                <li>
                  <strong>Open your Claude Desktop config</strong> at <code>~/Library/Application Support/Claude/claude_desktop_config.json</code> (macOS) or <code>%APPDATA%\Claude\claude_desktop_config.json</code> (Windows)
                </li>
                <li>
                  <strong>Add the MCP server config:</strong>
                  <pre className="bg-muted rounded p-3 mt-2 text-sm overflow-x-auto">{`{
  "mcpServers": {
    "obsidian": {
      "command": "npx",
      "args": [
        "-y",
        "obsidian-mcp",
        "/path/to/your/vault"
      ]
    }
  }
}`}</pre>
                </li>
                <li>
                  <strong>Restart Claude Desktop.</strong> You should see the Obsidian tools available in any new conversation.
                </li>
                <li>
                  <strong>Test it:</strong> Ask Claude &ldquo;List my most recent notes&rdquo; or &ldquo;Search my notes for [topic].&rdquo;
                </li>
              </ol>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">Security Considerations</h2>
              <p>
                Your Obsidian vault is personal. Before connecting it to any AI model, consider:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li><strong>Scope access carefully.</strong> Point the MCP server at a specific subfolder rather than your entire vault if you have sensitive notes.</li>
                <li><strong>Read-only mode.</strong> Some MCP server implementations allow read-only access. Use this if you don&apos;t need the AI to write back.</li>
                <li><strong>Local-only.</strong> The best Obsidian MCP servers run entirely locally — your notes never leave your machine. Verify this before connecting.</li>
                <li><strong>Audit tool permissions.</strong> In Claude Desktop, you can see exactly which tools an MCP server exposes before you use them.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">What to Look for in an Obsidian MCP Server</h2>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li><strong>Search quality</strong> — Does it support full-text search? Semantic search?</li>
                <li><strong>Frontmatter support</strong> — Can it read and write YAML frontmatter, not just body content?</li>
                <li><strong>Folder structure awareness</strong> — Does it understand vault organization or treat everything as a flat list?</li>
                <li><strong>Daily notes</strong> — Does it support Obsidian&apos;s daily notes format?</li>
                <li><strong>Template support</strong> — Can it apply note templates when creating new files?</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">The Bottom Line</h2>
              <p>
                Obsidian + MCP is one of the highest-leverage AI integrations available to knowledge workers. You&apos;ve already done the hard work of building a personal knowledge base. MCP makes that knowledge accessible to your AI — turning passive notes into active context.
              </p>
              <p className="mt-3">
                Start with <code>obsidian-mcp</code> and the official filesystem server. Once you see how useful it is to ask questions against your own notes, you won&apos;t go back to using AI without it.
              </p>
            </div>

            <div className="border-t pt-6 mt-8">
              <p className="text-sm text-muted-foreground mb-4">
                Looking for more MCP integrations? Browse the full directory:
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/blog/mcp-servers-for-notion" className="text-sm text-primary hover:underline">MCP for Notion →</Link>
                <Link href="/blog/mcp-servers-for-google-workspace" className="text-sm text-primary hover:underline">MCP for Google Workspace →</Link>
                <Link href="/blog/mcp-servers-for-llm-memory" className="text-sm text-primary hover:underline">MCP for LLM Memory →</Link>
                <Link href="/blog/mcp-servers-for-file-management" className="text-sm text-primary hover:underline">MCP for File Management →</Link>
                <Link href="/directory" className="text-sm text-primary hover:underline">Browse all MCP servers →</Link>
              </div>
            </div>

          </section>
        </article>
      </main>
    </>
  );
}
