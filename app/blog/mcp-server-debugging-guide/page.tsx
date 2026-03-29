import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How to Debug MCP Servers: A Complete Troubleshooting Guide",
  description:
    "Step-by-step guide to debugging Model Context Protocol servers. Learn how to diagnose connection errors, tool call failures, authentication issues, and performance problems in MCP integrations.",
  alternates: {
    canonical: "/blog/mcp-server-debugging-guide"
  },
  openGraph: {
    title: "How to Debug MCP Servers: A Complete Troubleshooting Guide",
    description:
      "Diagnose and fix common MCP server issues — connection errors, tool failures, auth problems, and more.",
    url: "https://everymcp.com/blog/mcp-server-debugging-guide",
    type: "article"
  }
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "How to Debug MCP Servers: A Complete Troubleshooting Guide",
  description:
    "Step-by-step guide to debugging Model Context Protocol servers. Learn how to diagnose connection errors, tool call failures, authentication issues, and performance problems in MCP integrations.",
  url: "https://everymcp.com/blog/mcp-server-debugging-guide",
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

export default function MCPServerDebuggingGuide() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-16">
          {/* Breadcrumb */}
          <nav className="mb-8 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-300 transition-colors">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/blog" className="hover:text-gray-300 transition-colors">
              Blog
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-400">MCP Server Debugging Guide</span>
          </nav>

          {/* Header */}
          <header className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-1 rounded-full">
                Developer Guide
              </span>
              <span className="text-xs text-gray-500">March 29, 2026</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
              How to Debug MCP Servers: A Complete Troubleshooting Guide
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed">
              MCP servers are powerful — until something breaks. This guide walks you through diagnosing
              and fixing the most common Model Context Protocol issues, from connection failures to silent
              tool call errors.
            </p>
          </header>

          {/* TOC */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-10">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              In this guide
            </h2>
            <ol className="space-y-2 text-sm text-gray-300">
              <li><a href="#understand-mcp-lifecycle" className="hover:text-white transition-colors">1. Understanding the MCP Connection Lifecycle</a></li>
              <li><a href="#connection-errors" className="hover:text-white transition-colors">2. Connection Errors & Server Not Found</a></li>
              <li><a href="#tool-call-failures" className="hover:text-white transition-colors">3. Tool Call Failures & Silent Errors</a></li>
              <li><a href="#auth-issues" className="hover:text-white transition-colors">4. Authentication & Permission Issues</a></li>
              <li><a href="#performance" className="hover:text-white transition-colors">5. Slow Responses & Timeouts</a></li>
              <li><a href="#logging" className="hover:text-white transition-colors">6. Enabling Debug Logging</a></li>
              <li><a href="#inspector" className="hover:text-white transition-colors">7. Using the MCP Inspector</a></li>
              <li><a href="#common-errors" className="hover:text-white transition-colors">8. Common Error Reference</a></li>
            </ol>
          </div>

          {/* Article Body */}
          <div className="prose prose-invert prose-gray max-w-none space-y-10">

            <section id="understand-mcp-lifecycle">
              <h2 className="text-2xl font-bold text-white mb-4">1. Understanding the MCP Connection Lifecycle</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Before you can debug MCP servers effectively, you need a mental model of how connections
                work. Every MCP session follows three phases:
              </p>
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-4">
                <ol className="space-y-3 text-sm text-gray-300">
                  <li><span className="text-white font-semibold">1. Initialization</span> — The client (Claude Desktop, Cursor, etc.) spawns the server process or connects via HTTP/SSE. The server sends its capabilities (tools, resources, prompts).</li>
                  <li><span className="text-white font-semibold">2. Tool Discovery</span> — The client lists available tools. If this fails, no tools appear in the AI interface.</li>
                  <li><span className="text-white font-semibold">3. Tool Execution</span> — The AI calls a specific tool. The server executes it and returns results as structured content.</li>
                </ol>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Most bugs live in one of these three phases. Pinpointing which phase fails first narrows
                your debugging surface dramatically.
              </p>
            </section>

            <section id="connection-errors">
              <h2 className="text-2xl font-bold text-white mb-4">2. Connection Errors & Server Not Found</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                The most common MCP complaint: <em>"The server doesn't appear in my client."</em> Here's how to
                systematically diagnose it.
              </p>

              <h3 className="text-lg font-semibold text-white mb-3">Check your config file</h3>
              <p className="text-gray-300 leading-relaxed mb-3">
                For Claude Desktop, your MCP config lives at:
              </p>
              <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm text-green-400 overflow-x-auto mb-4">
{`# macOS
~/Library/Application Support/Claude/claude_desktop_config.json

# Windows
%APPDATA%\\Claude\\claude_desktop_config.json`}
              </pre>
              <p className="text-gray-300 leading-relaxed mb-3">
                Validate your JSON is syntactically correct. A single misplaced comma silently breaks the
                entire config. Use <code className="text-orange-400 bg-gray-800 px-1 rounded">jq . claude_desktop_config.json</code> or an
                online JSON validator.
              </p>

              <h3 className="text-lg font-semibold text-white mb-3">Verify the server binary exists</h3>
              <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm text-green-400 overflow-x-auto mb-4">
{`# If using npx:
npx -y @your-mcp-server/package --help

# If using a local path:
node /path/to/your/server.js --help`}
              </pre>
              <p className="text-gray-300 leading-relaxed">
                If the binary doesn't start cleanly from the terminal, it won't start from the client either.
                Always test server startup in isolation first.
              </p>

              <h3 className="text-lg font-semibold text-white mb-3 mt-5">Check for port conflicts (HTTP/SSE servers)</h3>
              <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm text-green-400 overflow-x-auto mb-4">
{`# Find what's using port 3000
lsof -i :3000
# or
netstat -tlnp | grep 3000`}
              </pre>
            </section>

            <section id="tool-call-failures">
              <h2 className="text-2xl font-bold text-white mb-4">3. Tool Call Failures & Silent Errors</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                The server connects but tool calls return empty results, errors, or the AI says it
                "couldn't complete the action." These are often the trickiest bugs.
              </p>

              <h3 className="text-lg font-semibold text-white mb-3">Return value shape matters</h3>
              <p className="text-gray-300 leading-relaxed mb-3">
                MCP tools must return content in the correct format. A common mistake is returning a raw
                string instead of the required content array:
              </p>
              <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm text-green-400 overflow-x-auto mb-4">
{`// ❌ Wrong — raw string
return "success";

// ✅ Correct — content array
return {
  content: [{ type: "text", text: "success" }]
};`}
              </pre>

              <h3 className="text-lg font-semibold text-white mb-3">Schema validation failures</h3>
              <p className="text-gray-300 leading-relaxed mb-3">
                If the AI passes arguments that don't match your tool's JSON Schema, the call fails before
                reaching your handler. Make your schemas explicit:
              </p>
              <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm text-green-400 overflow-x-auto mb-4">
{`{
  "name": "search_records",
  "description": "Search database records",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "Search query" },
      "limit": { "type": "number", "default": 10 }
    },
    "required": ["query"]
  }
}`}
              </pre>

              <h3 className="text-lg font-semibold text-white mb-3">Unhandled promise rejections</h3>
              <p className="text-gray-300 leading-relaxed">
                In Node.js MCP servers, unhandled promise rejections often swallow errors silently. Always
                wrap async tool handlers in try/catch and return structured error content rather than
                throwing:
              </p>
              <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm text-green-400 overflow-x-auto mt-3">
{`async function handleToolCall(name, args) {
  try {
    const result = await doSomething(args);
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  } catch (err) {
    return {
      content: [{ type: "text", text: \`Error: \${err.message}\` }],
      isError: true
    };
  }
}`}
              </pre>
            </section>

            <section id="auth-issues">
              <h2 className="text-2xl font-bold text-white mb-4">4. Authentication & Permission Issues</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                API keys, OAuth tokens, and file permissions cause a large share of MCP failures in
                production. Here's what to check.
              </p>

              <div className="space-y-4">
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-2">Environment variables not reaching the server</h3>
                  <p className="text-gray-400 text-sm mb-2">
                    When Claude Desktop spawns your server, it may not inherit your shell's environment.
                    Pass secrets explicitly in the config:
                  </p>
                  <pre className="text-xs text-green-400 overflow-x-auto">
{`{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["server.js"],
      "env": {
        "API_KEY": "sk-your-key-here"
      }
    }
  }
}`}
                  </pre>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-2">File system permission errors</h3>
                  <p className="text-gray-400 text-sm">
                    MCP servers that access the file system may fail if Claude Desktop runs as a different
                    user or in a sandboxed context. Verify the server process can read/write the target
                    directories: <code className="text-orange-400">ls -la /path/to/directory</code>
                  </p>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-2">Token expiry mid-session</h3>
                  <p className="text-gray-400 text-sm">
                    OAuth tokens expire. If your MCP server works initially but fails after a period of
                    time, implement token refresh logic. Store refresh tokens securely and renew access
                    tokens before they expire.
                  </p>
                </div>
              </div>
            </section>

            <section id="performance">
              <h2 className="text-2xl font-bold text-white mb-4">5. Slow Responses & Timeouts</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                MCP clients typically have a 30–60 second timeout for tool calls. If your server makes
                heavy API calls or database queries, you may hit this limit.
              </p>

              <h3 className="text-lg font-semibold text-white mb-3">Common causes</h3>
              <ul className="space-y-2 text-gray-300 mb-4">
                <li className="flex items-start gap-2"><span className="text-orange-400 mt-1">→</span><span>N+1 queries — fetching records one at a time instead of in bulk</span></li>
                <li className="flex items-start gap-2"><span className="text-orange-400 mt-1">→</span><span>Missing database indexes on fields used in tool queries</span></li>
                <li className="flex items-start gap-2"><span className="text-orange-400 mt-1">→</span><span>External API calls with no timeout set (can hang indefinitely)</span></li>
                <li className="flex items-start gap-2"><span className="text-orange-400 mt-1">→</span><span>Returning too much data — the AI doesn't need entire database dumps</span></li>
              </ul>

              <h3 className="text-lg font-semibold text-white mb-3">Set explicit timeouts on external calls</h3>
              <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm text-green-400 overflow-x-auto">
{`// Always set a timeout for external HTTP calls
const response = await fetch(url, {
  signal: AbortSignal.timeout(10000) // 10 seconds
});`}
              </pre>
            </section>

            <section id="logging">
              <h2 className="text-2xl font-bold text-white mb-4">6. Enabling Debug Logging</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Structured logging is your best friend when debugging MCP servers. The key constraint:
                <strong className="text-white"> MCP uses stdio for communication</strong>, so your server must
                write logs to stderr, never stdout.
              </p>
              <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm text-green-400 overflow-x-auto mb-4">
{`// ❌ Never — this corrupts the MCP protocol
console.log("debug info");

// ✅ Correct — write to stderr
console.error("[MCP Debug] Tool called:", toolName, args);`}
              </pre>

              <h3 className="text-lg font-semibold text-white mb-3">Claude Desktop logs location</h3>
              <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm text-green-400 overflow-x-auto">
{`# macOS
~/Library/Logs/Claude/mcp*.log
# or
~/Library/Logs/Claude/mcp-server-YOUR_SERVER_NAME.log

# Windows
%APPDATA%\\Claude\\logs\\`}
              </pre>
              <p className="text-gray-300 leading-relaxed mt-3">
                Tail these logs in real time while reproducing your issue:
                <code className="text-orange-400 bg-gray-800 px-1 ml-2 rounded">tail -f ~/Library/Logs/Claude/mcp*.log</code>
              </p>
            </section>

            <section id="inspector">
              <h2 className="text-2xl font-bold text-white mb-4">7. Using the MCP Inspector</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                The official <strong className="text-white">MCP Inspector</strong> is the fastest way to test
                your server without a full client setup. It gives you a UI to connect to any MCP server
                and invoke tools directly.
              </p>
              <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm text-green-400 overflow-x-auto mb-4">
{`# Install and run the inspector
npx @modelcontextprotocol/inspector

# Or point it at a specific server
npx @modelcontextprotocol/inspector node server.js`}
              </pre>
              <p className="text-gray-300 leading-relaxed mb-4">
                The Inspector opens a web UI (usually at <code className="text-orange-400">localhost:5173</code>) where you can:
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2"><span className="text-green-400 mt-1">✓</span><span>Browse all tools, resources, and prompts your server exposes</span></li>
                <li className="flex items-start gap-2"><span className="text-green-400 mt-1">✓</span><span>Call tools with custom arguments and see raw responses</span></li>
                <li className="flex items-start gap-2"><span className="text-green-400 mt-1">✓</span><span>View the full JSON-RPC message exchange in real time</span></li>
                <li className="flex items-start gap-2"><span className="text-green-400 mt-1">✓</span><span>Test error handling without spinning up a full AI client</span></li>
              </ul>
            </section>

            <section id="common-errors">
              <h2 className="text-2xl font-bold text-white mb-4">8. Common Error Reference</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 pr-4 text-gray-400 font-medium">Error / Symptom</th>
                      <th className="text-left py-3 text-gray-400 font-medium">Likely Cause</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {[
                      ["Server doesn't appear in client", "Bad JSON config, server crashes on start, wrong command path"],
                      ["Tool list is empty", "Server fails during initialization, capability declaration missing"],
                      ["Tool call returns nothing", "Wrong return format — wrap in content array"],
                      ["'Method not found' error", "Server doesn't implement the called JSON-RPC method"],
                      ["Timeout on every call", "External API hanging, no timeout set, N+1 database queries"],
                      ["Works locally, fails in CI", "Missing env vars, different Node version, missing npm install"],
                      ["Partial results only", "Response truncated — reduce data returned per call"],
                      ["Auth error after 1 hour", "OAuth token expired — implement refresh flow"],
                    ].map(([error, cause]) => (
                      <tr key={error}>
                        <td className="py-3 pr-4 text-orange-400 font-mono text-xs">{error}</td>
                        <td className="py-3 text-gray-300">{cause}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Summary */}
            <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Debugging Checklist</h2>
              <ol className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2"><span className="text-blue-400 font-bold">1.</span><span>Validate your config JSON is syntactically valid</span></li>
                <li className="flex items-start gap-2"><span className="text-blue-400 font-bold">2.</span><span>Test server startup in the terminal independently</span></li>
                <li className="flex items-start gap-2"><span className="text-blue-400 font-bold">3.</span><span>Check Claude Desktop logs at <code className="text-orange-400">~/Library/Logs/Claude/</code></span></li>
                <li className="flex items-start gap-2"><span className="text-blue-400 font-bold">4.</span><span>Use MCP Inspector to call tools without a full AI client</span></li>
                <li className="flex items-start gap-2"><span className="text-blue-400 font-bold">5.</span><span>Verify all logs go to stderr, never stdout</span></li>
                <li className="flex items-start gap-2"><span className="text-blue-400 font-bold">6.</span><span>Wrap async handlers in try/catch and return structured errors</span></li>
                <li className="flex items-start gap-2"><span className="text-blue-400 font-bold">7.</span><span>Set explicit timeouts on all external HTTP calls</span></li>
                <li className="flex items-start gap-2"><span className="text-blue-400 font-bold">8.</span><span>Check env vars are explicitly passed in the MCP server config</span></li>
              </ol>
            </section>

          </div>

          {/* CTA */}
          <div className="mt-16 bg-gradient-to-br from-blue-950/50 to-purple-950/50 border border-blue-800/30 rounded-xl p-8 text-center">
            <h2 className="text-xl font-bold text-white mb-3">
              Find the Right MCP Server for Your Stack
            </h2>
            <p className="text-gray-400 mb-6 text-sm">
              Browse 400+ MCP servers organized by category, tool, and use case. Stop searching — start building.
            </p>
            <Link
              href="/directory"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
            >
              Browse the MCP Directory →
            </Link>
          </div>

          {/* Related posts */}
          <div className="mt-12 pt-8 border-t border-gray-800">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Related Articles
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { href: "/blog/how-to-build-an-mcp-server", title: "How to Build an MCP Server" },
                { href: "/blog/mcp-server-security-best-practices", title: "MCP Server Security Best Practices" },
                { href: "/blog/best-mcp-servers-2026", title: "Best MCP Servers in 2026" },
                { href: "/blog/what-is-mcp-model-context-protocol", title: "What is MCP? Model Context Protocol Explained" },
              ].map((post) => (
                <Link
                  key={post.href}
                  href={post.href}
                  className="block p-4 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-600 transition-colors text-sm text-gray-300 hover:text-white"
                >
                  {post.title} →
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
