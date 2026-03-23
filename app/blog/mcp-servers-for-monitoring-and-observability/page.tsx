import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best MCP Servers for Monitoring & Observability in 2026",
  description:
    "Discover the top MCP servers for monitoring and observability. Query logs, traces, and metrics from Datadog, Grafana, Prometheus, and more — directly from your AI assistant.",
  alternates: {
    canonical: "/blog/mcp-servers-for-monitoring-and-observability"
  },
  openGraph: {
    title: "Best MCP Servers for Monitoring & Observability in 2026",
    description:
      "Top MCP servers for monitoring and observability — query Datadog, Grafana, Prometheus, and more from your AI agent.",
    url: "https://everymcp.com/blog/mcp-servers-for-monitoring-and-observability",
    type: "article"
  }
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Best MCP Servers for Monitoring & Observability in 2026",
  description:
    "Discover the top MCP servers for monitoring and observability. Query logs, traces, and metrics from Datadog, Grafana, Prometheus, and more — directly from your AI assistant.",
  url: "https://everymcp.com/blog/mcp-servers-for-monitoring-and-observability",
  datePublished: "2026-03-23",
  dateModified: "2026-03-23",
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

const servers = [
  {
    name: "Datadog MCP Server",
    slug: "datadog",
    description:
      "Query Datadog metrics, logs, and traces. Get incident context, run monitor checks, and analyze dashboards — all from Claude or your coding assistant.",
    capabilities: [
      "Query metrics and time-series data",
      "Search and filter logs",
      "List and trigger monitors",
      "Inspect dashboards and widgets",
      "Pull APM traces and service maps"
    ],
    bestFor: "Teams using Datadog as their primary observability platform"
  },
  {
    name: "Grafana MCP Server",
    slug: "grafana",
    description:
      "Interact with Grafana dashboards and Loki logs. Ask your AI to pull panel data, query Loki for recent errors, or check alert states without leaving your editor.",
    capabilities: [
      "Query Grafana dashboards and panels",
      "Search and tail Loki logs",
      "List and evaluate alerting rules",
      "Retrieve datasource health",
      "Explore metric metadata"
    ],
    bestFor: "Open-source observability stacks with Grafana + Loki + Prometheus"
  },
  {
    name: "Prometheus MCP Server",
    slug: "prometheus",
    description:
      "Run PromQL queries directly through your AI assistant. Pull instant and range vectors, inspect targets, and debug alerting rules without switching context.",
    capabilities: [
      "Execute PromQL instant and range queries",
      "List scrape targets and their health",
      "Query alert and recording rules",
      "Inspect label sets and metric names",
      "Evaluate alertmanager silence state"
    ],
    bestFor: "Kubernetes and cloud-native teams using Prometheus as their metrics backend"
  },
  {
    name: "AWS CloudWatch MCP Server",
    slug: "aws-cloudwatch",
    description:
      "Query CloudWatch metrics, logs, and alarms from your AI agent. Diagnose Lambda cold starts, ECS task failures, or RDS slowdowns without opening the AWS console.",
    capabilities: [
      "Get CloudWatch metric statistics",
      "Query CloudWatch Logs Insights",
      "List and describe alarms",
      "Inspect log groups and streams",
      "Pull X-Ray traces (with X-Ray extension)"
    ],
    bestFor: "AWS-native teams monitoring serverless, containers, or managed services"
  },
  {
    name: "New Relic MCP Server",
    slug: "new-relic",
    description:
      "Run NRQL queries and pull New Relic insights through natural language. Surface error rates, apdex scores, and deployment events from your AI coding assistant.",
    capabilities: [
      "Execute NRQL queries",
      "Get entity health summaries",
      "Pull error traces and stack frames",
      "List recent deployments",
      "Query distributed trace spans"
    ],
    bestFor: "Full-stack observability on New Relic One with distributed tracing"
  },
  {
    name: "PagerDuty MCP Server",
    slug: "pagerduty",
    description:
      "Interact with PagerDuty incidents, on-call schedules, and service status from your AI assistant. Acknowledge alerts, pull incident timelines, and query runbooks in one place.",
    capabilities: [
      "List and acknowledge active incidents",
      "Get on-call schedule for a service",
      "Pull incident notes and timeline",
      "Create and resolve incidents",
      "Query service integrations"
    ],
    bestFor: "Incident response teams that want AI-assisted triage and resolution"
  }
];

export default function MCPMonitoringPage() {
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
          <span>MCP Servers for Monitoring & Observability</span>
        </nav>

        <header className="mb-10">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-3">
            MCP Server Guide
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
            Best MCP Servers for Monitoring &amp; Observability in 2026
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Querying logs, metrics, and traces shouldn&apos;t require a browser tab. These MCP servers
            connect your AI assistant to Datadog, Grafana, Prometheus, CloudWatch, and more —
            so you can investigate incidents and debug production issues without breaking your flow.
          </p>
          <p className="text-sm text-gray-400 mt-4">Updated March 23, 2026 · 7 min read</p>
        </header>

        <section className="prose prose-gray max-w-none mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Why Observability + MCP Is a Perfect Match
          </h2>
          <p className="text-gray-700 mb-4">
            Observability tooling generates enormous amounts of structured data: time-series metrics,
            log streams, distributed traces, alerts. That data is already machine-readable. MCP servers
            expose it to language models without any scraping or manual export.
          </p>
          <p className="text-gray-700 mb-4">
            The result: you can ask your AI assistant &quot;why is p99 latency spiking on the checkout
            service?&quot; and get an answer grounded in your actual Datadog data — not a hallucinated guess.
          </p>
          <p className="text-gray-700 mb-4">
            This guide covers the most capable MCP servers for monitoring platforms, what they can
            actually do, and which stack each one fits best.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Top MCP Servers for Monitoring</h2>
          <div className="space-y-8">
            {servers.map((server, i) => (
              <div key={server.slug} className="border border-gray-200 rounded-xl p-6 hover:border-indigo-200 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">#{i + 1}</span>
                    <h3 className="text-xl font-bold text-gray-900 mt-1">{server.name}</h3>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{server.description}</p>
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">Key Capabilities</h4>
                  <ul className="space-y-1">
                    {server.capabilities.map((cap) => (
                      <li key={cap} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                        {cap}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-indigo-50 rounded-lg px-4 py-2">
                  <span className="text-xs font-semibold text-indigo-700">Best for: </span>
                  <span className="text-xs text-indigo-600">{server.bestFor}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="prose prose-gray max-w-none mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Comparison at a Glance
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 border border-gray-200 font-semibold">Server</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold">Best Platform</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold">Logs</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold">Metrics</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold">Traces</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold">Alerts</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Datadog", platform: "Datadog", logs: true, metrics: true, traces: true, alerts: true },
                  { name: "Grafana", platform: "Grafana + Loki", logs: true, metrics: true, traces: false, alerts: true },
                  { name: "Prometheus", platform: "Prometheus", logs: false, metrics: true, traces: false, alerts: true },
                  { name: "CloudWatch", platform: "AWS", logs: true, metrics: true, traces: true, alerts: true },
                  { name: "New Relic", platform: "New Relic One", logs: true, metrics: true, traces: true, alerts: false },
                  { name: "PagerDuty", platform: "PagerDuty", logs: false, metrics: false, traces: false, alerts: true },
                ].map((row) => (
                  <tr key={row.name} className="hover:bg-gray-50">
                    <td className="p-3 border border-gray-200 font-medium">{row.name}</td>
                    <td className="p-3 border border-gray-200 text-gray-600">{row.platform}</td>
                    <td className="p-3 border border-gray-200 text-center">{row.logs ? "✅" : "—"}</td>
                    <td className="p-3 border border-gray-200 text-center">{row.metrics ? "✅" : "—"}</td>
                    <td className="p-3 border border-gray-200 text-center">{row.traces ? "✅" : "—"}</td>
                    <td className="p-3 border border-gray-200 text-center">{row.alerts ? "✅" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="prose prose-gray max-w-none mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            How to Set Up a Monitoring MCP Server
          </h2>
          <p className="text-gray-700 mb-4">
            Most monitoring MCP servers follow the same pattern. Here&apos;s how to add the Datadog MCP
            server to Claude Desktop as an example:
          </p>
          <div className="bg-gray-900 rounded-xl p-5 mb-4 overflow-x-auto">
            <pre className="text-green-400 text-sm font-mono whitespace-pre">{`// claude_desktop_config.json
{
  "mcpServers": {
    "datadog": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-datadog"],
      "env": {
        "DD_API_KEY": "your_api_key",
        "DD_APP_KEY": "your_app_key",
        "DD_SITE": "datadoghq.com"
      }
    }
  }
}`}</pre>
          </div>
          <p className="text-gray-700 mb-4">
            Once configured, you can ask Claude: &quot;Show me the error rate for the payment service
            over the last hour&quot; and get a real answer from your Datadog data.
          </p>
          <p className="text-gray-700 mb-4">
            For Grafana, swap in your Grafana URL and API token. For Prometheus, point to your
            Prometheus endpoint. The pattern is consistent across all monitoring MCP servers.
          </p>
        </section>

        <section className="prose prose-gray max-w-none mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Real-World Use Cases
          </h2>
          <div className="grid gap-4">
            {[
              {
                title: "Incident Triage",
                desc: "Ask your AI: 'What changed in the last 30 minutes that correlates with the latency spike?' It queries metrics, logs, and recent deployments simultaneously."
              },
              {
                title: "On-Call Handoffs",
                desc: "Generate a context-aware incident summary by pulling PagerDuty history, Datadog metric anomalies, and recent Loki logs in one shot."
              },
              {
                title: "Capacity Planning",
                desc: "Query Prometheus for resource utilization trends across your fleet and get an AI-generated recommendation on when to scale."
              },
              {
                title: "SLA Reporting",
                desc: "Pull uptime data, error rates, and p99 latency from CloudWatch and format it into a stakeholder-ready report in seconds."
              }
            ].map((uc) => (
              <div key={uc.title} className="border-l-4 border-indigo-400 pl-4 py-1">
                <h3 className="font-semibold text-gray-900 mb-1">{uc.title}</h3>
                <p className="text-gray-600 text-sm">{uc.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Related Guides</h2>
          <div className="grid gap-3">
            {[
              { href: "/blog/mcp-servers-for-database-access", label: "MCP Servers for Database Access" },
              { href: "/blog/mcp-servers-for-github", label: "MCP Servers for GitHub" },
              { href: "/blog/mcp-servers-for-ai-agents", label: "MCP Servers for AI Agents" },
              { href: "/blog/top-mcp-servers-for-developers", label: "Top MCP Servers for Developers" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                <span>→</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-indigo-50 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Find the Right Monitoring MCP Server
          </h2>
          <p className="text-gray-600 mb-6">
            Browse all MCP servers in the EveryMCP directory — filtered by category, platform, and use case.
          </p>
          <Link
            href="/"
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Browse MCP Directory →
          </Link>
        </section>
      </main>
    </>
  );
}
