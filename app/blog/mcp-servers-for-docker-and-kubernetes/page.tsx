import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best MCP Servers for Docker & Kubernetes in 2026 — AI-Powered Container Management",
  description:
    "Discover the top MCP servers for Docker and Kubernetes. Let your AI agent inspect containers, manage pods, tail logs, and automate deployments directly from Claude or any LLM.",
  alternates: {
    canonical: "/blog/mcp-servers-for-docker-and-kubernetes"
  },
  openGraph: {
    title: "Best MCP Servers for Docker & Kubernetes in 2026 — AI-Powered Container Management",
    description:
      "Top MCP servers for Docker and Kubernetes — inspect containers, manage pods, tail logs, and automate deployments with AI.",
    url: "https://everymcp.com/blog/mcp-servers-for-docker-and-kubernetes",
    type: "article"
  }
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Best MCP Servers for Docker & Kubernetes in 2026 — AI-Powered Container Management",
  description:
    "Discover the top MCP servers for Docker and Kubernetes. Let your AI agent inspect containers, manage pods, tail logs, and automate deployments directly from Claude or any LLM.",
  url: "https://everymcp.com/blog/mcp-servers-for-docker-and-kubernetes",
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

export default function MCPServersForDockerKubernetes() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/blog" className="text-sm text-muted-foreground hover:underline">
            ← All Guides
          </Link>
        </div>

        <article>
          <header className="mb-10">
            <h1 className="text-3xl font-bold tracking-tight mb-4">
              Best MCP Servers for Docker &amp; Kubernetes in 2026
            </h1>
            <p className="text-lg text-muted-foreground">
              Container infrastructure is powerful but verbose. MCP servers let your AI agent
              inspect running containers, tail pod logs, scale deployments, and diagnose failures —
              all in plain English.
            </p>
            <p className="text-sm text-muted-foreground mt-4">Updated March 2026 · 8 min read</p>
          </header>

          <section className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
            <h2>Why Use an MCP Server for Container Management?</h2>
            <p>
              Kubectl commands are powerful but require memorizing flags, YAML schemas, and
              resource names. Docker CLI is similarly verbose. MCP servers bridge your AI assistant
              directly to container runtimes so you can ask natural-language questions like
              &quot;which pods are crash-looping?&quot; or &quot;show me the last 100 lines from
              the api container&quot; and get immediate, actionable answers.
            </p>
            <p>
              The result: faster incident response, easier onboarding for junior devs, and a
              tighter feedback loop between writing code and running it.
            </p>

            <h2>Top MCP Servers for Docker &amp; Kubernetes</h2>

            <h3>1. Docker MCP Server (Official)</h3>
            <p>
              The official Docker MCP server exposes the Docker Engine API through a clean set of
              tools: list containers, inspect images, tail logs, exec into containers, start/stop
              services, and manage networks and volumes. It works against your local Docker daemon
              or a remote host via <code>DOCKER_HOST</code>.
            </p>
            <ul>
              <li>List running and stopped containers with status and port mappings</li>
              <li>Pull and inspect images, check sizes and layers</li>
              <li>Tail container logs (with line limits and timestamps)</li>
              <li>Start, stop, restart, and remove containers</li>
              <li>Exec commands inside running containers</li>
              <li>Inspect Docker Compose project state</li>
            </ul>
            <p>
              <strong>Best for:</strong> Local development, Docker Compose workflows, quick
              container debugging.
            </p>

            <h3>2. Kubernetes MCP Server</h3>
            <p>
              The Kubernetes MCP server connects to your cluster via <code>kubeconfig</code> and
              exposes a wide set of tools for reading and managing cluster state. You can query
              pods, deployments, services, config maps, and secrets — and apply or patch manifests
              on the fly.
            </p>
            <ul>
              <li>Get pods, deployments, services, ingresses across namespaces</li>
              <li>Tail pod logs with container selection</li>
              <li>Describe resources (events, conditions, resource requests)</li>
              <li>Apply YAML manifests from text or file</li>
              <li>Scale deployments and stateful sets</li>
              <li>Port-forward to pods for local debugging</li>
              <li>List and decode secrets (with appropriate RBAC)</li>
            </ul>
            <p>
              <strong>Best for:</strong> Day-to-day cluster operations, incident response,
              platform engineers who want AI assistance without context switching.
            </p>

            <h3>3. Helm MCP Server</h3>
            <p>
              Helm charts are the standard packaging format for Kubernetes, but <code>values.yaml</code>{" "}
              files and release histories are hard to navigate. The Helm MCP server lets your AI
              list releases, inspect values, check upgrade history, and even render templates — so
              you can understand what&apos;s deployed without digging through charts manually.
            </p>
            <ul>
              <li>List all Helm releases across namespaces</li>
              <li>Get current values for any release</li>
              <li>Show release history and rollback options</li>
              <li>Render chart templates with custom values</li>
              <li>Search Helm repositories for available charts</li>
            </ul>
            <p>
              <strong>Best for:</strong> Teams using Helm for deployments, understanding what
              version of a chart is deployed and why.
            </p>

            <h3>4. mcp-server-k8s-lens (Lens Integration)</h3>
            <p>
              Lens is one of the most popular Kubernetes IDEs. This MCP server hooks into the Lens
              API to surface the same cluster context inside your AI chat. If your team already
              uses Lens, this gives AI access to the same view without needing raw kubeconfig
              access.
            </p>
            <p>
              <strong>Best for:</strong> Teams already on Lens who want AI chat alongside the
              visual dashboard.
            </p>

            <h3>5. Prometheus + Alertmanager MCP Server</h3>
            <p>
              Observability and container management overlap heavily. Prometheus MCP servers let
              you execute PromQL queries, inspect alert rules, and check active alerts — so your AI
              can correlate &quot;pod is crash-looping&quot; with &quot;error rate spiked 3 minutes
              ago&quot; in a single conversation.
            </p>
            <ul>
              <li>Execute arbitrary PromQL queries</li>
              <li>List active and pending alerts</li>
              <li>Inspect alert rule definitions</li>
              <li>Get metric cardinality and label values</li>
            </ul>
            <p>
              <strong>Best for:</strong> Site reliability engineers combining deployment context
              with metrics during incidents.
            </p>

            <h2>Real-World Use Cases</h2>

            <h3>Incident Triage</h3>
            <p>
              When something breaks in production, ask your AI: &quot;List all pods not in Running
              state and show me the last 50 log lines from each.&quot; Instead of running five
              kubectl commands and mentally correlating output, you get a single synthesized
              summary with the most likely root cause highlighted.
            </p>

            <h3>Deployment Review</h3>
            <p>
              Before releasing, have your AI check: &quot;What&apos;s the current image tag on the
              api deployment, what resource limits are set, and are there any recent warning events?&quot;
              This catches misconfigurations that slip through code review.
            </p>

            <h3>Cost Optimization</h3>
            <p>
              Ask &quot;which deployments have no resource requests set&quot; or &quot;show me pods
              using more than 500m CPU&quot; — questions that are tedious to answer manually become
              instant with an MCP-connected AI.
            </p>

            <h3>Onboarding New Engineers</h3>
            <p>
              A new engineer can ask &quot;explain the architecture of our Kubernetes cluster&quot;
              and get a plain-English walkthrough of namespaces, services, and ingress rules
              derived from live cluster state — not outdated documentation.
            </p>

            <h2>Setting Up the Kubernetes MCP Server</h2>
            <p>
              Here&apos;s the minimal config for Claude Desktop (or any MCP-compatible client):
            </p>
            <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-sm">
{`{
  "mcpServers": {
    "kubernetes": {
      "command": "npx",
      "args": ["-y", "@flux159/mcp-server-kubernetes"],
      "env": {
        "KUBECONFIG": "/home/youruser/.kube/config"
      }
    }
  }
}`}
            </pre>
            <p>
              Make sure the service account or user in your kubeconfig has appropriate RBAC
              permissions. For read-only use (monitoring, inspection), a ClusterRole with{" "}
              <code>get</code>, <code>list</code>, and <code>watch</code> on core resources is
              sufficient.
            </p>

            <h2>Docker Compose Config</h2>
            <p>For local Docker development, the Docker MCP server needs socket access:</p>
            <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-sm">
{`{
  "mcpServers": {
    "docker": {
      "command": "npx",
      "args": ["-y", "@docker/mcp-server"],
      "env": {
        "DOCKER_HOST": "unix:///var/run/docker.sock"
      }
    }
  }
}`}
            </pre>
            <p>
              On macOS with Docker Desktop, the socket path is usually{" "}
              <code>/var/run/docker.sock</code> or{" "}
              <code>~/.docker/run/docker.sock</code> depending on the version.
            </p>

            <h2>Security Considerations</h2>
            <p>
              Container management MCP servers have significant blast radius. Follow these
              practices:
            </p>
            <ul>
              <li>
                <strong>Use read-only RBAC in production.</strong> Separate read and write
                kubeconfigs and only give the MCP server write access when you need it.
              </li>
              <li>
                <strong>Review before apply.</strong> For manifest apply operations, have the AI
                show you the diff first.
              </li>
              <li>
                <strong>Never expose the Docker socket remotely</strong> without TLS and
                authentication — it&apos;s equivalent to root access to the host.
              </li>
              <li>
                <strong>Audit log all MCP tool calls</strong> in production environments where
                compliance matters.
              </li>
            </ul>

            <h2>Choosing the Right Tool for Your Setup</h2>
            <p>
              Start with the <strong>official Docker MCP server</strong> if you&apos;re primarily
              working locally with Docker Compose. Add the <strong>Kubernetes MCP server</strong>{" "}
              once you move to a cluster environment — it unlocks the most useful day-to-day
              workflows. Layer in <strong>Helm MCP</strong> if your team uses Helm charts, and
              consider <strong>Prometheus MCP</strong> if you want AI-assisted incident response.
            </p>
            <p>
              The combination of a container MCP server with a code editor MCP (like GitHub) gives
              you end-to-end visibility from code commit to running pod — all in a single AI
              conversation.
            </p>

            <h2>Browse All Container MCP Servers</h2>
            <p>
              EveryMCP indexes Docker, Kubernetes, and cloud-native MCP servers — including
              community tools, specialized integrations, and enterprise options.
            </p>
          </section>

          <div className="mt-10 pt-8 border-t">
            <div className="flex flex-col gap-3">
              <Link
                href="/directory?q=docker"
                className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-3 font-medium hover:bg-primary/90 transition-colors"
              >
                Browse Container MCP Servers →
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
                <Link href="/blog/mcp-servers-for-monitoring-and-observability" className="text-primary hover:underline">
                  Best MCP Servers for Monitoring &amp; Observability
                </Link>
              </li>
              <li>
                <Link href="/blog/mcp-servers-for-github" className="text-primary hover:underline">
                  Best MCP Servers for GitHub
                </Link>
              </li>
              <li>
                <Link href="/blog/top-mcp-servers-for-developers" className="text-primary hover:underline">
                  Top MCP Servers for Developers
                </Link>
              </li>
            </ul>
          </div>
        </article>
      </main>
    </>
  );
}
