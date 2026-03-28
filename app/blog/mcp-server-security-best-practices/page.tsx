import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "MCP Server Security Best Practices in 2026",
  description:
    "Secure your MCP servers the right way. Learn authentication, authorization, input validation, transport security, and auditing best practices for Model Context Protocol deployments.",
  alternates: {
    canonical: "/blog/mcp-server-security-best-practices"
  },
  openGraph: {
    title: "MCP Server Security Best Practices in 2026",
    description:
      "Everything you need to know to keep your MCP servers secure — from OAuth scopes to tool sandboxing and audit logging.",
    url: "https://everymcp.com/blog/mcp-server-security-best-practices",
    type: "article"
  }
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "MCP Server Security Best Practices in 2026",
  description:
    "Secure your MCP servers the right way. Learn authentication, authorization, input validation, transport security, and auditing best practices for Model Context Protocol deployments.",
  url: "https://everymcp.com/blog/mcp-server-security-best-practices",
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
  }
};

export default function MCPServerSecurityBestPracticesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <main className="min-h-screen bg-gray-950 text-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-16">
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500 mb-8">
            <Link href="/" className="hover:text-gray-300">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/blog" className="hover:text-gray-300">
              Blog
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-400">MCP Server Security Best Practices</span>
          </nav>

          <h1 className="text-4xl font-bold text-white mb-4">
            MCP Server Security Best Practices in 2026
          </h1>
          <p className="text-gray-400 text-sm mb-8">Updated March 2026 · 10 min read</p>

          <p className="text-gray-300 text-lg leading-relaxed mb-8">
            Model Context Protocol (MCP) servers give AI agents real-world power — access to
            databases, APIs, file systems, and cloud services. That power comes with real risk.
            A misconfigured or poorly authenticated MCP server can leak sensitive data, enable
            privilege escalation, or give an AI agent runaway capabilities. This guide covers
            the security practices every MCP server operator should implement.
          </p>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-10">
            <h2 className="text-white font-semibold text-lg mb-3">Quick Security Checklist</h2>
            <ul className="space-y-2 text-gray-300 text-sm">
              {[
                "Use OAuth 2.0 or API key authentication — never anonymous access",
                "Apply least-privilege scopes to every tool",
                "Validate and sanitize all tool inputs",
                "Use HTTPS/WSS transport — no plaintext",
                "Enable audit logging for all tool invocations",
                "Rate-limit calls per client and per tool",
                "Sandbox tool execution environments",
                "Rotate credentials on a schedule",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <h2 className="text-2xl font-bold text-white mb-4">1. Authentication: Who Can Connect?</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            The first line of defense is verifying the identity of any client that connects to your
            MCP server. There are three common approaches:
          </p>

          <div className="space-y-4 mb-8">
            <div className="border border-gray-800 rounded-lg p-5">
              <h3 className="text-white font-semibold mb-2">OAuth 2.0 (Recommended)</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                OAuth 2.0 with PKCE is the gold standard for MCP servers exposed to third-party
                AI clients. It provides scoped tokens, short-lived access, and a clear revocation
                path. Use Authorization Code Flow for human-in-the-loop setups; Client Credentials
                for machine-to-machine server communication.
              </p>
            </div>
            <div className="border border-gray-800 rounded-lg p-5">
              <h3 className="text-white font-semibold mb-2">API Keys</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                For internal or single-tenant deployments, API keys are simpler. Store them in
                environment variables (never hard-coded), hash them in your database, and rotate
                them at least quarterly. Treat each key as a secret at the same level as a
                database password.
              </p>
            </div>
            <div className="border border-gray-800 rounded-lg p-5">
              <h3 className="text-white font-semibold mb-2">mTLS (Advanced)</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Mutual TLS is appropriate for high-security environments where both client and
                server present certificates. It eliminates bearer token risks but adds operational
                overhead. Best for enterprise deployments connecting to sensitive internal systems.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-4">2. Authorization: What Can Each Client Do?</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            Authentication proves identity. Authorization defines what that identity is allowed to do.
            MCP servers expose tools — and each tool represents a real action with real consequences.
          </p>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-6">
            <h3 className="text-white font-semibold mb-3">Least Privilege by Tool</h3>
            <p className="text-gray-400 text-sm mb-3">
              Map each tool to a minimum required permission scope. Don&apos;t give a client that
              only needs read access write permissions &quot;just in case.&quot; Examples:
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-800">
                  <th className="pb-2">Tool</th>
                  <th className="pb-2">Minimum Scope</th>
                  <th className="pb-2">Never Grant</th>
                </tr>
              </thead>
              <tbody className="text-gray-400 divide-y divide-gray-800">
                <tr>
                  <td className="py-2">read_file</td>
                  <td>fs:read</td>
                  <td>fs:write, fs:delete</td>
                </tr>
                <tr>
                  <td className="py-2">query_database</td>
                  <td>db:select</td>
                  <td>db:insert, db:drop</td>
                </tr>
                <tr>
                  <td className="py-2">send_email</td>
                  <td>mail:send</td>
                  <td>mail:delete, mail:admin</td>
                </tr>
                <tr>
                  <td className="py-2">run_code</td>
                  <td>exec:sandboxed</td>
                  <td>exec:host, exec:root</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-2xl font-bold text-white mb-4">3. Input Validation</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            AI models generate tool call arguments dynamically. A model can be prompted —
            intentionally or accidentally — to pass malicious arguments to your tools. Treat
            every tool input as untrusted user input.
          </p>

          <div className="space-y-3 mb-8">
            {[
              {
                title: "Schema validation",
                desc: "Define strict JSON schemas for every tool parameter. Reject calls that don't conform before execution.",
              },
              {
                title: "SQL injection prevention",
                desc: "Never interpolate tool arguments directly into SQL queries. Use parameterized queries or ORMs for all database tools.",
              },
              {
                title: "Path traversal prevention",
                desc: "For file system tools, resolve and normalize paths, then assert they're within an allowed root directory.",
              },
              {
                title: "Size limits",
                desc: "Cap the length of string inputs and the size of file/data payloads to prevent denial-of-service via oversized requests.",
              },
              {
                title: "Prompt injection awareness",
                desc: "Be aware that tool outputs returned to the model could contain adversarial content designed to hijack the agent's next action.",
              },
            ].map((item) => (
              <div key={item.title} className="border-l-2 border-blue-500 pl-4">
                <span className="text-white font-semibold">{item.title}: </span>
                <span className="text-gray-400 text-sm">{item.desc}</span>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-white mb-4">4. Transport Security</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            All MCP traffic should be encrypted in transit. For HTTP-based transports, enforce
            HTTPS and redirect HTTP to HTTPS with HSTS headers. For WebSocket-based transports,
            use WSS (WebSocket Secure). Never deploy an MCP server on a public network without
            TLS — credentials, tool outputs, and potentially sensitive data flow over this channel.
          </p>
          <p className="text-gray-300 leading-relaxed mb-8">
            If you&apos;re running MCP servers locally for development, use a localhost binding
            (127.0.0.1) rather than 0.0.0.0 to avoid accidentally exposing the server to your
            local network. For production, place MCP servers behind a reverse proxy (nginx,
            Caddy, Cloudflare) rather than exposing Node.js directly to the internet.
          </p>

          <h2 className="text-2xl font-bold text-white mb-4">5. Audit Logging</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            Every tool invocation should produce an audit log entry. This is non-negotiable for
            any MCP server with access to sensitive systems. Log:
          </p>
          <ul className="space-y-2 text-gray-300 mb-8 list-disc list-inside">
            <li>Client identity (API key ID or OAuth subject)</li>
            <li>Tool name and sanitized arguments (redact secrets)</li>
            <li>Timestamp and latency</li>
            <li>Success or failure, with error codes</li>
            <li>IP address or client identifier</li>
          </ul>
          <p className="text-gray-300 leading-relaxed mb-8">
            Ship logs to a centralized system (Datadog, CloudWatch, Loki) rather than relying
            on local disk logs that can be lost or tampered with. Set up alerts for anomalous
            patterns: unusual call volumes, repeated failures, or calls to sensitive tools at
            unexpected hours.
          </p>

          <h2 className="text-2xl font-bold text-white mb-4">6. Rate Limiting</h2>
          <p className="text-gray-300 leading-relaxed mb-8">
            Rate limiting protects against both abuse and runaway AI agents. Implement limits at
            multiple levels: per API key (requests per minute), per tool (calls per hour), and
            globally (total server throughput). For expensive operations — code execution, external
            API calls, large file reads — apply tighter per-tool limits. Use exponential backoff
            responses (HTTP 429 with Retry-After header) so well-behaved clients can recover
            gracefully.
          </p>

          <h2 className="text-2xl font-bold text-white mb-4">7. Sandboxing Execution Environments</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            Tools that execute code or run subprocesses are particularly dangerous. Any MCP server
            with a code execution or shell tool should sandbox that execution:
          </p>
          <div className="space-y-3 mb-8">
            {[
              { name: "Docker containers", desc: "Run code execution in ephemeral containers with no network access and a read-only filesystem." },
              { name: "gVisor / Firecracker", desc: "For stronger isolation without full VM overhead, kernel-level sandboxing prevents container escapes." },
              { name: "Resource limits", desc: "Set CPU, memory, and disk I/O limits to prevent a single tool call from starving the host." },
              { name: "No persistent state", desc: "Execution environments should be destroyed after each tool call — no persistent home directories or shared state between runs." },
            ].map((item) => (
              <div key={item.name} className="flex items-start gap-3">
                <span className="text-purple-400 font-mono text-sm mt-0.5">→</span>
                <div>
                  <span className="text-white font-semibold">{item.name}: </span>
                  <span className="text-gray-400 text-sm">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-white mb-4">8. Credential Rotation and Secrets Management</h2>
          <p className="text-gray-300 leading-relaxed mb-8">
            MCP servers often hold credentials for the external services they wrap: database
            passwords, API keys, OAuth client secrets. Store these in a proper secrets manager
            (AWS Secrets Manager, HashiCorp Vault, Doppler) rather than environment files on disk.
            Rotate API keys quarterly at minimum, and immediately after any suspected exposure.
            Use separate credentials for each deployment environment — never share production
            secrets with development.
          </p>

          <h2 className="text-2xl font-bold text-white mb-4">Common MCP Security Mistakes</h2>
          <div className="space-y-3 mb-10">
            {[
              "Running an MCP server with no authentication because it's \"only internal\"",
              "Giving AI agents admin-level database credentials when read-only suffices",
              "Logging tool arguments without redacting API keys, tokens, or PII",
              "Accepting file paths from tool arguments without validating against an allowlist",
              "Trusting tool output that will be fed back to the model without sanitization",
              "Not testing what happens when the AI generates an unexpected argument type",
            ].map((mistake) => (
              <div key={mistake} className="flex items-start gap-2 text-sm">
                <span className="text-red-400 mt-0.5">✗</span>
                <span className="text-gray-400">{mistake}</span>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-white mb-4">Security Resources</h2>
          <div className="space-y-3 mb-10">
            {[
              {
                name: "MCP Specification",
                desc: "The official spec covers authentication and authorization requirements",
                href: "https://modelcontextprotocol.io",
              },
              {
                name: "OWASP API Security Top 10",
                desc: "Most MCP vulnerabilities map to standard API security failures",
                href: "https://owasp.org/www-project-api-security/",
              },
              {
                name: "NIST SSDF",
                desc: "Secure software development framework for production MCP server deployments",
                href: "https://csrc.nist.gov/Projects/ssdf",
              },
            ].map((resource) => (
              <a
                key={resource.name}
                href={resource.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-4 border border-gray-800 rounded-lg hover:border-gray-600 transition-colors group"
              >
                <div>
                  <div className="text-white font-semibold group-hover:text-blue-400 transition-colors">
                    {resource.name}
                  </div>
                  <div className="text-gray-500 text-sm">{resource.desc}</div>
                </div>
              </a>
            ))}
          </div>

          <div className="bg-blue-950 border border-blue-800 rounded-lg p-6 mb-10">
            <h2 className="text-white font-semibold text-lg mb-2">
              Find Secure, Well-Maintained MCP Servers
            </h2>
            <p className="text-gray-300 text-sm mb-4">
              EveryMCP indexes thousands of MCP servers with details on authentication methods,
              maintenance status, and community trust signals — so you can pick servers you can
              actually trust in production.
            </p>
            <Link
              href="/"
              className="inline-block bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              Browse the MCP Directory →
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-white mb-4">Related Reading</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                href: "/blog/mcp-servers-for-security-and-authentication",
                title: "MCP Servers for Security & Auth",
                desc: "The best MCP servers for identity, access control, and secrets",
              },
              {
                href: "/blog/how-to-build-an-mcp-server",
                title: "How to Build an MCP Server",
                desc: "Step-by-step guide from tool definition to production deploy",
              },
              {
                href: "/blog/mcp-servers-for-production-ai-agents",
                title: "MCP Servers for Production AI Agents",
                desc: "Production-grade MCP setups for autonomous agent deployments",
              },
              {
                href: "/blog/top-mcp-servers-for-developers",
                title: "Top MCP Servers for Developers",
                desc: "The most-used MCP servers across the developer community",
              },
            ].map((post) => (
              <Link
                key={post.href}
                href={post.href}
                className="border border-gray-800 rounded-lg p-4 hover:border-gray-600 transition-colors"
              >
                <div className="text-white font-semibold text-sm mb-1">{post.title}</div>
                <div className="text-gray-500 text-xs">{post.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
