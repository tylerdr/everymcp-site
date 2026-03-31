import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "MCP Servers for Next.js and React Development in 2026",
  description:
    "The best MCP servers for Next.js and React developers in 2026. Connect AI coding agents to your frontend stack — component libraries, design tools, deployment platforms, and more.",
  alternates: {
    canonical: "/blog/mcp-servers-for-nextjs-and-react",
  },
  openGraph: {
    title: "MCP Servers for Next.js and React Development in 2026",
    description:
      "Best MCP servers for Next.js and React developers — design tools, deployment, component libraries, and more.",
    url: "https://everymcp.com/blog/mcp-servers-for-nextjs-and-react",
    type: "article",
  },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "MCP Servers for Next.js and React Development in 2026",
  description:
    "The best MCP servers for Next.js and React developers in 2026. Connect AI coding agents to your frontend stack.",
  url: "https://everymcp.com/blog/mcp-servers-for-nextjs-and-react",
  datePublished: "2026-03-31",
  dateModified: "2026-03-31",
  author: {
    "@type": "Organization",
    name: "EveryMCP",
    url: "https://everymcp.com",
  },
  publisher: {
    "@type": "Organization",
    name: "EveryMCP",
    url: "https://everymcp.com",
  },
};

const servers = [
  {
    name: "Vercel MCP",
    category: "Deployment",
    description:
      "Trigger deployments, inspect build logs, manage environment variables, and roll back releases from within your AI agent. Eliminates context-switching between your editor and the Vercel dashboard.",
    use_cases: ["Deploy previews", "Env var management", "Rollback"],
    npm: "vercel-mcp-server",
  },
  {
    name: "Figma MCP",
    category: "Design",
    description:
      "Pull component specs, design tokens, and layout data directly from Figma files. AI agents can translate design decisions into Tailwind classes or React component props without manual handoff.",
    use_cases: ["Design token extraction", "Component inspection", "Design-to-code"],
    npm: "figma-mcp",
  },
  {
    name: "shadcn/ui MCP",
    category: "Component Library",
    description:
      "Browse, install, and configure shadcn/ui components via natural language. Ask your agent to add a data table with sorting and it handles the CLI command, imports, and wiring.",
    use_cases: ["Component install", "Theme config", "Variant selection"],
    npm: "shadcn-mcp",
  },
  {
    name: "GitHub MCP",
    category: "Version Control",
    description:
      "Open PRs, review diffs, create issues, and manage branches without leaving your agent session. Especially useful for AI-generated code that needs human review before merge.",
    use_cases: ["PR creation", "Code review", "Branch management"],
    npm: "mcp-server-github",
  },
  {
    name: "Browser Automation MCP",
    category: "Testing",
    description:
      "Drive a headless browser to test your Next.js app end-to-end. Agents can navigate routes, interact with components, screenshot pages, and assert on DOM state — fully automated.",
    use_cases: ["E2E testing", "Visual regression", "Interaction testing"],
    npm: "mcp-server-playwright",
  },
  {
    name: "Supabase MCP",
    category: "Backend / Database",
    description:
      "Query tables, run migrations, and manage auth policies in Supabase — the most popular backend for Next.js apps. Agents can scaffold full-stack features end-to-end.",
    use_cases: ["Schema migrations", "Row-level security", "Auth management"],
    npm: "supabase-mcp",
  },
  {
    name: "Stripe MCP",
    category: "Payments",
    description:
      "Inspect Stripe products, prices, and customer subscriptions from your agent. Great for debugging checkout flows or generating pricing page copy based on live product data.",
    use_cases: ["Product inspection", "Subscription queries", "Webhook debugging"],
    npm: "stripe-mcp",
  },
  {
    name: "Web Search MCP",
    category: "Research",
    description:
      "Let agents look up the latest Next.js docs, React RFC discussions, or npm package changelogs during code generation. Keeps suggestions grounded in current APIs rather than stale training data.",
    use_cases: ["Docs lookup", "Package research", "Error debugging"],
    npm: "mcp-server-brave-search",
  },
];

export default function MCPServersForNextjsReact() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-16">
          {/* Breadcrumb */}
          <nav className="mb-8 text-sm text-gray-400">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-200">MCP Servers for Next.js &amp; React</span>
          </nav>

          {/* Header */}
          <header className="mb-12">
            <div className="inline-block bg-sky-500/10 border border-sky-500/20 rounded-full px-3 py-1 text-xs font-semibold text-sky-400 uppercase tracking-wider mb-4">
              Frontend Development
            </div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              MCP Servers for Next.js and React Development in 2026
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              Model Context Protocol lets AI coding agents reach into your entire frontend toolchain
              — design files, component libraries, deployment pipelines, and databases. Here are
              the MCP servers that matter most for Next.js and React work.
            </p>
            <div className="flex items-center gap-4 mt-6 text-sm text-gray-500">
              <time dateTime="2026-03-31">March 31, 2026</time>
              <span>·</span>
              <span>7 min read</span>
              <span>·</span>
              <span>EveryMCP</span>
            </div>
          </header>

          {/* Intro */}
          <section className="mb-12">
            <p className="text-gray-300 leading-relaxed mb-4">
              The typical Next.js project involves at least half a dozen separate tools: a design
              system in Figma, a component library like shadcn/ui, a backend in Supabase or Prisma,
              a deployment pipeline on Vercel, payments via Stripe, and version control on GitHub.
              Before MCP, an AI coding assistant could only see your local files. It had to guess
              at the right Vercel env var name, hallucinate shadcn component props, or suggest
              deprecated Next.js APIs.
            </p>
            <p className="text-gray-300 leading-relaxed mb-4">
              With MCP, agents get live tool access. They can read your actual Figma token values,
              install the right shadcn component variant, deploy a preview branch, and open a PR
              — all in one conversation. The eight servers below cover the core Next.js / React
              toolchain.
            </p>
          </section>

          {/* Server Cards */}
          <section className="mb-12 space-y-6">
            {servers.map((server, idx) => (
              <article
                key={server.name}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-sky-500/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                      {idx + 1}. {server.category}
                    </span>
                    <h2 className="text-xl font-bold text-white mt-1">{server.name}</h2>
                  </div>
                  <code className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded shrink-0">
                    {server.npm}
                  </code>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">{server.description}</p>
                <div className="flex flex-wrap gap-2">
                  {server.use_cases.map((uc) => (
                    <span
                      key={uc}
                      className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full"
                    >
                      {uc}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </section>

          {/* Workflow patterns */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Agentic Workflows for Next.js Teams</h2>
            <div className="space-y-5">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="font-semibold text-white mb-2">🎨 Design → code in one step</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Connect Figma MCP + shadcn MCP. Describe the component you want, the agent reads
                  the Figma frame for spacing and color tokens, maps them to your Tailwind config,
                  and scaffolds the component with the correct shadcn primitives — no manual handoff.
                </p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="font-semibold text-white mb-2">🚀 Feature branch to preview URL</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  After generating a feature, the agent uses GitHub MCP to create a branch and
                  commit, then Vercel MCP to trigger a preview deployment. It returns the preview
                  URL for your review — the whole loop without leaving the chat.
                </p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="font-semibold text-white mb-2">🧪 Generate + test immediately</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Pair Browser Automation MCP with any code-generation agent. After writing a new
                  Next.js page, the agent spins up a Playwright session, visits the route, and
                  asserts on the rendered output — catching errors before they reach review.
                </p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="font-semibold text-white mb-2">💳 Live pricing page generation</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Use Stripe MCP to read your actual products and prices, then generate a pricing
                  page component that references real price IDs. Eliminates the hardcoding that
                  breaks every time you change a plan.
                </p>
              </div>
            </div>
          </section>

          {/* Config snippet */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">Minimal Config for a Next.js Agent Stack</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Add this to your{" "}
              <code className="text-sky-400 text-xs bg-gray-800 px-1 py-0.5 rounded">
                .claude/settings.json
              </code>{" "}
              or equivalent MCP client config to wire up the core frontend toolchain:
            </p>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 font-mono text-xs text-gray-300 overflow-x-auto">
              <pre>{`{
  "mcpServers": {
    "github": {
      "command": "mcp-server-github",
      "env": { "GITHUB_TOKEN": "<your-pat>" }
    },
    "vercel": {
      "command": "vercel-mcp-server",
      "env": { "VERCEL_TOKEN": "<your-token>" }
    },
    "supabase": {
      "command": "supabase-mcp",
      "env": { "SUPABASE_URL": "<url>", "SUPABASE_KEY": "<key>" }
    },
    "stripe": {
      "command": "stripe-mcp",
      "env": { "STRIPE_SECRET_KEY": "<sk_...>" }
    }
  }
}`}</pre>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-gradient-to-br from-sky-900/30 to-gray-900 border border-sky-500/20 rounded-2xl p-8 text-center mb-12">
            <h2 className="text-xl font-bold text-white mb-3">Browse All MCP Servers</h2>
            <p className="text-gray-400 text-sm mb-6">
              Explore 50+ verified MCP servers filtered by category, runtime, and language.
            </p>
            <Link
              href="/directory"
              className="inline-block bg-sky-500 hover:bg-sky-400 text-white font-semibold px-6 py-3 rounded-full text-sm transition-colors"
            >
              Open the Directory →
            </Link>
          </section>

          {/* Related */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4">Related Articles</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { title: "MCP Servers for Vercel & Deployment", href: "/blog/mcp-servers-for-vercel-and-deployment" },
                { title: "MCP Servers for Figma & Design", href: "/blog/mcp-servers-for-figma-and-design" },
                { title: "MCP Servers for Supabase", href: "/blog/mcp-servers-for-supabase" },
                { title: "MCP Servers for TypeScript & Node.js", href: "/blog/mcp-servers-for-typescript-and-nodejs" },
              ].map((post) => (
                <Link
                  key={post.href}
                  href={post.href}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-sky-500/40 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-200 hover:text-white transition-colors">
                    {post.title} →
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
