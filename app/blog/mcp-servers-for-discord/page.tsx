import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best MCP Servers for Discord in 2026 — AI Bots, Automation & Moderation",
  description:
    "Discover the top MCP servers for Discord. Connect your AI agent to Discord channels, send messages, manage roles, read server history, and build AI-powered Discord bots with Claude or any LLM.",
  alternates: {
    canonical: "/blog/mcp-servers-for-discord"
  },
  openGraph: {
    title: "Best MCP Servers for Discord in 2026 — AI Bots, Automation & Moderation",
    description:
      "Top MCP servers for Discord — connect AI agents to your server, automate moderation, and build Discord bots.",
    url: "https://everymcp.com/blog/mcp-servers-for-discord",
    type: "article"
  }
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Best MCP Servers for Discord in 2026 — AI Bots, Automation & Moderation",
  description:
    "Discover the top MCP servers for Discord. Connect your AI agent to Discord channels, send messages, manage roles, read server history, and build AI-powered Discord bots with Claude or any LLM.",
  url: "https://everymcp.com/blog/mcp-servers-for-discord",
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
  },
  image: "https://everymcp.com/og-image.png",
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": "https://everymcp.com/blog/mcp-servers-for-discord"
  }
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is an MCP server for Discord?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "An MCP (Model Context Protocol) server for Discord is a connector that lets AI agents like Claude read and send Discord messages, manage channels, handle moderation tasks, and interact with Discord's API — all through natural language commands."
      }
    },
    {
      "@type": "Question",
      name: "Can I use Claude with Discord via MCP?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. By connecting a Discord MCP server to Claude Desktop or any MCP-compatible client, you can give Claude access to your Discord server. Claude can then read message history, send announcements, manage roles, and automate community tasks."
      }
    },
    {
      "@type": "Question",
      name: "What can AI agents do on Discord with MCP?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "With a Discord MCP server, AI agents can: read channel messages and threads, send messages and replies, create and manage channels, handle role assignments, run moderation actions, search message history, and even respond to events in real time."
      }
    },
    {
      "@type": "Question",
      name: "Do I need a Discord bot token to use MCP with Discord?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most Discord MCP servers require a Discord Bot Token and optionally a User Token for certain actions. You create a bot in the Discord Developer Portal, invite it to your server with the required permissions, and provide the token to the MCP server configuration."
      }
    }
  ]
};

export default function DiscordMCPPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <main className="mx-auto max-w-3xl px-4 py-12 text-gray-900">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-indigo-600">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/blog" className="hover:text-indigo-600">Blog</Link>
          <span className="mx-2">/</span>
          <span>MCP Servers for Discord</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">Discord</span>
            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">Community</span>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">Automation</span>
          </div>
          <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight">
            Best MCP Servers for Discord in 2026
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Discord has become the backbone of developer communities, gaming servers, and online businesses. 
            With MCP (Model Context Protocol) servers, you can now give AI agents like Claude direct access 
            to your Discord server — automating moderation, sending announcements, and building intelligent bots 
            without writing custom integration code.
          </p>
          <p className="mt-2 text-sm text-gray-400">Updated April 4, 2026 · 7 min read</p>
        </header>

        {/* What is Discord MCP */}
        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-semibold">What Is a Discord MCP Server?</h2>
          <p className="mb-4 text-gray-700 leading-relaxed">
            An MCP server acts as a bridge between an AI language model and an external service like Discord. 
            Instead of building a custom bot from scratch with Discord.js or Python, you configure an MCP server 
            that exposes Discord's API as structured tools your AI can call.
          </p>
          <p className="mb-4 text-gray-700 leading-relaxed">
            Once connected, your AI agent can read channel history, send messages, manage members, 
            create threads — all through natural conversation. It's like giving your AI a Discord account 
            with configurable permissions.
          </p>
          <p className="text-gray-700 leading-relaxed">
            This unlocks powerful workflows: AI community managers, automated support bots, smart announcement 
            systems, and moderation assistants that understand context rather than just pattern-matching keywords.
          </p>
        </section>

        {/* Top Use Cases */}
        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-semibold">Top Use Cases for Discord + MCP</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: "🤖",
                title: "AI Community Manager",
                desc: "Have Claude monitor your server, answer common questions, and escalate issues to human mods automatically."
              },
              {
                icon: "📣",
                title: "Smart Announcements",
                desc: "Generate and post channel announcements, changelogs, or event summaries using AI that understands your community's tone."
              },
              {
                icon: "🛡️",
                title: "Moderation Automation",
                desc: "Detect rule violations in context, issue warnings, and manage role assignments without rigid keyword filters."
              },
              {
                icon: "🔔",
                title: "Event Notifications",
                desc: "Connect Discord to your CI/CD, app alerts, or Stripe webhooks — AI formats and routes notifications to the right channels."
              },
              {
                icon: "📚",
                title: "Knowledge Base",
                desc: "Index your server's message history so your AI can answer 'has this been discussed before?' queries instantly."
              },
              {
                icon: "🎟️",
                title: "Support Triage",
                desc: "Auto-categorize support requests into threads, assign appropriate roles, and draft initial responses for human review."
              }
            ].map((item) => (
              <div key={item.title} className="rounded-lg border border-gray-200 p-4">
                <div className="mb-2 text-2xl">{item.icon}</div>
                <h3 className="mb-1 font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured MCP Servers */}
        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-semibold">Best Discord MCP Servers</h2>
          <p className="mb-6 text-gray-600">
            Here are the most capable Discord MCP servers available today, covering different use cases from 
            full community management to targeted messaging automation.
          </p>

          {/* Server 1 */}
          <div className="mb-6 rounded-xl border border-gray-200 p-6">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">discord-mcp</h3>
                <p className="text-sm text-gray-500">Open Source · TypeScript · Bot Token Required</p>
              </div>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">Most Popular</span>
            </div>
            <p className="mb-4 text-gray-700 leading-relaxed">
              The most widely used Discord MCP server. Exposes core Discord API capabilities as MCP tools, 
              including reading/sending messages, listing channels, managing guild members, and fetching 
              server information. Works with Claude Desktop, Cline, and any MCP-compatible client.
            </p>
            <div className="mb-4">
              <p className="mb-2 text-sm font-semibold text-gray-700">Key capabilities:</p>
              <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
                <li>Read messages from any channel your bot has access to</li>
                <li>Send messages and replies in channels or DMs</li>
                <li>List guild members, roles, and channel structure</li>
                <li>Search message history by keyword or user</li>
                <li>Create and archive threads</li>
              </ul>
            </div>
            <div className="rounded-md bg-gray-50 p-3">
              <p className="mb-1 text-xs font-semibold text-gray-500">Quick Setup (claude_desktop_config.json)</p>
              <code className="text-xs text-gray-700 font-mono whitespace-pre-wrap">{`{
  "mcpServers": {
    "discord": {
      "command": "npx",
      "args": ["-y", "discord-mcp"],
      "env": {
        "DISCORD_TOKEN": "your-bot-token-here"
      }
    }
  }
}`}</code>
            </div>
          </div>

          {/* Server 2 */}
          <div className="mb-6 rounded-xl border border-gray-200 p-6">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">mcp-discord</h3>
                <p className="text-sm text-gray-500">Open Source · Python · Bot + User Token Support</p>
              </div>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">Feature Rich</span>
            </div>
            <p className="mb-4 text-gray-700 leading-relaxed">
              A Python-based Discord MCP server with broader API coverage. Supports both bot tokens 
              (for server operations) and user tokens (for reading DMs and personal actions). Includes 
              moderation tools, reaction management, and embed creation.
            </p>
            <div className="mb-4">
              <p className="mb-2 text-sm font-semibold text-gray-700">Key capabilities:</p>
              <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
                <li>Full message CRUD (create, read, edit, delete)</li>
                <li>Role and permission management</li>
                <li>Add/remove reactions on messages</li>
                <li>Create rich embeds with custom formatting</li>
                <li>Ban/kick/timeout moderation actions</li>
                <li>Webhook creation and management</li>
              </ul>
            </div>
            <div className="rounded-md bg-gray-50 p-3">
              <p className="mb-1 text-xs font-semibold text-gray-500">Install</p>
              <code className="text-xs text-gray-700 font-mono">pip install mcp-discord</code>
            </div>
          </div>

          {/* Server 3 */}
          <div className="mb-6 rounded-xl border border-gray-200 p-6">
            <div className="mb-3">
              <h3 className="text-xl font-bold text-gray-900">@modelcontextprotocol/server-discord</h3>
              <p className="text-sm text-gray-500">Community · TypeScript · Focused on Read Operations</p>
            </div>
            <p className="mb-4 text-gray-700 leading-relaxed">
              A lightweight Discord MCP server focused on read-heavy workflows. Ideal for use cases 
              where you want your AI to have awareness of Discord activity without write access. 
              Good for building dashboards, summarizing discussions, or monitoring server health.
            </p>
            <div className="mb-4">
              <p className="mb-2 text-sm font-semibold text-gray-700">Best for:</p>
              <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
                <li>Summarizing channel discussions for standups</li>
                <li>Monitoring server activity reports</li>
                <li>Extracting insights from community conversations</li>
                <li>Read-only audits and compliance checks</li>
              </ul>
            </div>
          </div>
        </section>

        {/* How to Set Up */}
        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-semibold">How to Set Up a Discord MCP Server</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">1</div>
              <div>
                <h3 className="mb-1 font-semibold">Create a Discord Bot</h3>
                <p className="text-sm text-gray-600">
                  Go to the <strong>Discord Developer Portal</strong> → Applications → New Application. 
                  Under the Bot section, enable the bot and copy your Bot Token. 
                  Enable required Privileged Gateway Intents (Message Content, Server Members if needed).
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">2</div>
              <div>
                <h3 className="mb-1 font-semibold">Invite Bot to Your Server</h3>
                <p className="text-sm text-gray-600">
                  Under OAuth2 → URL Generator, select "bot" scope and the permissions your MCP use case requires 
                  (Read Messages, Send Messages, Manage Roles, etc.). Use the generated URL to invite the bot.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">3</div>
              <div>
                <h3 className="mb-1 font-semibold">Configure Your MCP Client</h3>
                <p className="text-sm text-gray-600">
                  Add the Discord MCP server to your <code className="rounded bg-gray-100 px-1 text-xs">claude_desktop_config.json</code>, 
                  Cline settings, or other MCP client configuration. Provide the Bot Token as an environment variable.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">4</div>
              <div>
                <h3 className="mb-1 font-semibold">Test with a Simple Command</h3>
                <p className="text-sm text-gray-600">
                  Ask Claude: <em>"List the channels in my Discord server"</em> or <em>"Read the last 10 messages in #general."</em> 
                  If it works, you're connected. Start building your automation workflows.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-semibold">Security Best Practices</h2>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
            <p className="mb-3 font-semibold text-amber-800">⚠️ Handle Discord tokens with care</p>
            <ul className="space-y-2 text-sm text-amber-900">
              <li>• <strong>Never commit tokens to Git.</strong> Use environment variables or a secrets manager.</li>
              <li>• <strong>Use least-privilege permissions.</strong> Only grant the Discord permissions your MCP use case actually needs.</li>
              <li>• <strong>Create a dedicated bot account.</strong> Don't use your personal Discord token — create a bot with specific roles.</li>
              <li>• <strong>Audit tool calls.</strong> Review what your AI agent is sending before allowing write access in production servers.</li>
              <li>• <strong>Rate limit awareness.</strong> Discord enforces strict rate limits. Configure your MCP server to handle 429 responses gracefully.</li>
            </ul>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-semibold">Discord MCP Server Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="pb-3 pr-4 font-semibold text-gray-700">Server</th>
                  <th className="pb-3 pr-4 font-semibold text-gray-700">Language</th>
                  <th className="pb-3 pr-4 font-semibold text-gray-700">Read</th>
                  <th className="pb-3 pr-4 font-semibold text-gray-700">Write</th>
                  <th className="pb-3 font-semibold text-gray-700">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { name: "discord-mcp", lang: "TypeScript", read: "✅", write: "✅", mod: "Partial" },
                  { name: "mcp-discord", lang: "Python", read: "✅", write: "✅", mod: "✅ Full" },
                  { name: "server-discord", lang: "TypeScript", read: "✅", write: "❌", mod: "❌" },
                ].map((row) => (
                  <tr key={row.name} className="text-gray-600">
                    <td className="py-3 pr-4 font-medium text-gray-900">{row.name}</td>
                    <td className="py-3 pr-4">{row.lang}</td>
                    <td className="py-3 pr-4">{row.read}</td>
                    <td className="py-3 pr-4">{row.write}</td>
                    <td className="py-3">{row.mod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-10">
          <h2 className="mb-6 text-2xl font-semibold">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              {
                q: "What is an MCP server for Discord?",
                a: "An MCP (Model Context Protocol) server for Discord is a connector that lets AI agents like Claude read and send Discord messages, manage channels, handle moderation tasks, and interact with Discord's API — all through natural language commands."
              },
              {
                q: "Can I use Claude with Discord via MCP?",
                a: "Yes. By connecting a Discord MCP server to Claude Desktop or any MCP-compatible client, you can give Claude access to your Discord server. Claude can then read message history, send announcements, manage roles, and automate community tasks."
              },
              {
                q: "What can AI agents do on Discord with MCP?",
                a: "With a Discord MCP server, AI agents can: read channel messages and threads, send messages and replies, create and manage channels, handle role assignments, run moderation actions, search message history, and respond to events in real time."
              },
              {
                q: "Do I need a Discord bot token to use MCP with Discord?",
                a: "Most Discord MCP servers require a Discord Bot Token. Create a bot in the Discord Developer Portal, invite it to your server with the required permissions, and provide the token to the MCP server configuration."
              },
              {
                q: "Is it safe to connect an AI agent to Discord?",
                a: "With proper permissions and bot-scoped tokens, it's safe. Use least-privilege permissions, never expose your token in code, and consider running your AI agent in a test server first before granting access to production communities."
              }
            ].map((item) => (
              <div key={item.q} className="border-b border-gray-100 pb-6">
                <h3 className="mb-2 font-semibold text-gray-900">{item.q}</h3>
                <p className="text-gray-600 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl bg-indigo-50 p-8 text-center">
          <h2 className="mb-3 text-2xl font-bold text-gray-900">Find More MCP Servers</h2>
          <p className="mb-6 text-gray-600">
            Browse the full directory of MCP servers for Discord, Slack, Teams, and hundreds of other integrations.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/directory"
              className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-700"
            >
              Browse All MCP Servers →
            </Link>
            <Link
              href="/blog/mcp-servers-for-slack-and-communication"
              className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Slack & Communication MCP Servers
            </Link>
          </div>
        </section>

        {/* Related Posts */}
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Related Guides</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { href: "/blog/mcp-servers-for-slack-and-communication", title: "MCP Servers for Slack & Communication" },
              { href: "/blog/mcp-servers-for-multi-agent-systems", title: "MCP Servers for Multi-Agent Systems" },
              { href: "/blog/mcp-servers-for-ai-agents", title: "Best MCP Servers for AI Agents" },
              { href: "/blog/best-mcp-servers-2026", title: "Best MCP Servers Overall in 2026" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg border border-gray-200 p-4 text-sm font-medium text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50"
              >
                {link.title} →
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
