import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best MCP Servers for Kubernetes in 2026 — Manage Clusters with AI",
  description:
    "Discover the top MCP servers for Kubernetes. Let your AI agent inspect pods, apply manifests, debug deployments, and manage cluster resources directly from Claude or any LLM.",
  alternates: {
    canonical: "/blog/mcp-servers-for-kubernetes"
  },
  openGraph: {
    title: "Best MCP Servers for Kubernetes in 2026 — Manage Clusters with AI",
    description:
      "Top MCP servers for Kubernetes — let your AI agent inspect pods, apply manifests, and debug cluster issues.",
    url: "https://everymcp.com/blog/mcp-servers-for-kubernetes",
    type: "article"
  }
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Best MCP Servers for Kubernetes in 2026 — Manage Clusters with AI",
  description:
    "Discover the top MCP servers for Kubernetes. Let your AI agent inspect pods, apply manifests, debug deployments, and manage cluster resources directly from Claude or any LLM.",
  url: "https://everymcp.com/blog/mcp-servers-for-kubernetes",
  datePublished: "2026-03-24",
  dateModified: "2026-03-24",
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

export default function MCPServersForKubernetes() {
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
            <p className="text-sm text-muted-foreground mb-3">March 24, 2026 · 9 min read</p>
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Best MCP Servers for Kubernetes in 2026
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Your AI agent can now inspect pods, apply manifests, tail logs, and debug failing
              deployments — all in natural language. Here are the best Model Context Protocol
              servers for Kubernetes cluster management in 2026.
            </p>
          </header>

          <section className="prose prose-neutral dark:prose-invert max-w-none">
            <h2>Why Kubernetes + MCP Changes How You Operate Clusters</h2>
            <p>
              Kubernetes is powerful but notoriously complex. Debugging a CrashLoopBackOff requires
              juggling <code>kubectl describe</code>, <code>kubectl logs</code>, and a mental model of
              how services, deployments, and ingress objects interact. With a Kubernetes MCP server,
              your LLM gets <strong>live read/write access</strong> to your cluster — and can reason
              about multi-resource problems in a single conversation.
            </p>
            <p>
              This means you can ask Claude to find all pods consuming more than 500MB of memory,
              diagnose why a rollout is stuck, compare a failing deployment&apos;s config against a
              working one, or draft the YAML to fix it — without leaving your chat interface.
            </p>

            <h2>Top MCP Servers for Kubernetes</h2>

            <h3>1. kubernetes-mcp-server (Community Standard)</h3>
            <p>
              The most widely adopted Kubernetes MCP server provides a comprehensive interface to
              the Kubernetes API. It supports all standard resource types — Pods, Deployments,
              Services, ConfigMaps, Secrets, Ingresses, and more — through a clean set of MCP tools.
            </p>
            <ul>
              <li>List, describe, and get any Kubernetes resource</li>
              <li>Apply and delete manifests (YAML or JSON)</li>
              <li>Stream pod logs with label selectors</li>
              <li>Exec into containers for live debugging</li>
              <li>Port-forward to services from within the agent session</li>
              <li>Scale deployments and statefulsets</li>
            </ul>
            <p>
              <strong>Best for:</strong> Platform engineers and SREs who want full cluster access from
              their AI assistant.
            </p>
            <p>
              <strong>Auth:</strong> Uses your local kubeconfig — whichever context is active. Supports
              multi-context switching via tool calls.
            </p>
            <p>
              <Link href="/directory" className="text-primary hover:underline">
                Browse Kubernetes MCP servers on EveryMCP →
              </Link>
            </p>

            <h3>2. kubectl-mcp (Lightweight Wrapper)</h3>
            <p>
              A lighter alternative that wraps <code>kubectl</code> directly, exposing it as an MCP
              tool surface. If you already have kubectl configured and want minimal setup overhead,
              this is a fast option to get running.
            </p>
            <ul>
              <li>Mirrors kubectl commands as MCP tools</li>
              <li>Supports all kubectl verbs: get, describe, apply, delete, rollout</li>
              <li>Handles multiple namespaces and contexts</li>
              <li>Smaller attack surface — no custom API logic, just kubectl</li>
            </ul>
            <p>
              <strong>Best for:</strong> Teams already comfortable with kubectl who want AI assistance
              without a heavy new dependency.
            </p>
            <p>
              <strong>Caveat:</strong> Output is text-formatted kubectl output rather than structured
              JSON — which means LLMs may struggle with complex parsing tasks.
            </p>

            <h3>3. helm-mcp-server (Helm Chart Management)</h3>
            <p>
              If your team deploys with Helm, this server adds MCP-level access to your Helm releases
              and repositories. You can ask your AI agent to list installed releases, check chart
              versions, inspect values, or simulate upgrades.
            </p>
            <ul>
              <li>List all Helm releases across namespaces</li>
              <li>Show values for any installed release</li>
              <li>Diff current vs. proposed values before upgrading</li>
              <li>Install, upgrade, and rollback releases</li>
              <li>Search Helm chart repositories</li>
            </ul>
            <p>
              <strong>Best for:</strong> Teams using Helm for application lifecycle management.
            </p>
            <p>
              <strong>Pro tip:</strong> Pair this with a Git MCP server to let your agent pull chart
              changes from a PR and simulate the Helm upgrade before merging.
            </p>

            <h3>4. argo-mcp (ArgoCD / GitOps Workflows)</h3>
            <p>
              For GitOps-first teams running ArgoCD, this server exposes ArgoCD applications,
              sync status, and deployment history as MCP resources. Your AI agent can diagnose
              drift, trigger syncs, and review app health without opening the ArgoCD UI.
            </p>
            <ul>
              <li>List all ArgoCD applications and their sync status</li>
              <li>Detect and explain resource drift</li>
              <li>Trigger manual syncs</li>
              <li>View rollout history and compare revisions</li>
            </ul>
            <p>
              <strong>Best for:</strong> Platform teams running GitOps workflows with ArgoCD.
            </p>

            <h2>Key Use Cases for AI-Powered Kubernetes Management</h2>

            <h3>Incident Response</h3>
            <p>
              When an alert fires at 2am, you want answers fast. With a Kubernetes MCP server, you
              can describe the symptoms to your AI assistant and get a structured diagnosis: which
              pods are failing, what the error logs show, whether resource limits are the culprit,
              and what the recommended fix is — in one conversation.
            </p>

            <h3>Capacity Planning</h3>
            <p>
              Ask your agent to analyze resource requests vs. actual usage across namespaces, identify
              over-provisioned workloads, and generate a report. Tasks that used to require custom
              scripts or Grafana dashboards become natural language queries.
            </p>

            <h3>Onboarding New Developers</h3>
            <p>
              New engineers often struggle to understand a team&apos;s Kubernetes setup. An AI agent with
              cluster access can give them an interactive tour — explaining what each deployment does,
              how services are connected, and where the configuration lives — without pulling a senior
              engineer away from their work.
            </p>

            <h3>Security Auditing</h3>
            <p>
              Ask your agent to scan for common misconfigurations: containers running as root, missing
              resource limits, overly permissive RBAC roles, or secrets stored as plain ConfigMaps.
              MCP servers give the LLM the access it needs to reason across your entire cluster
              configuration at once.
            </p>

            <h2>Safety Considerations</h2>
            <p>
              Giving an AI agent write access to a Kubernetes cluster is powerful — and requires care.
              A few best practices:
            </p>
            <ul>
              <li>
                <strong>Start with read-only kubeconfig</strong> for development and staging clusters,
                and require explicit confirmation before applying to production.
              </li>
              <li>
                <strong>Use RBAC to scope permissions</strong> — create a dedicated ServiceAccount
                for your MCP server with only the resource types it needs.
              </li>
              <li>
                <strong>Log all write operations</strong> — most production MCP setups pipe tool
                calls to an audit log so you can replay or revert changes.
              </li>
              <li>
                <strong>Test in a namespace-isolated environment</strong> before granting cluster-wide
                access.
              </li>
            </ul>

            <h2>How to Get Started</h2>
            <p>
              Most Kubernetes MCP servers install via npm or can be run as a Docker container. The
              setup typically takes under five minutes if you already have a kubeconfig:
            </p>
            <ol>
              <li>Install the MCP server binary or Docker image</li>
              <li>Point it at your kubeconfig (default: <code>~/.kube/config</code>)</li>
              <li>Add it to your MCP client config (Claude Desktop, Cursor, etc.)</li>
              <li>Start a conversation and ask it to list your pods</li>
            </ol>
            <p>
              From there, you can progressively expand permissions as you build trust in the workflow.
            </p>

            <h2>Find More Kubernetes and Infrastructure MCP Servers</h2>
            <p>
              EveryMCP indexes hundreds of MCP servers across every category. If you&apos;re building
              an AI-powered infrastructure automation workflow, you&apos;ll also want to check out our
              coverage of:
            </p>
            <ul>
              <li>
                <Link href="/blog/mcp-servers-for-docker-and-kubernetes" className="text-primary hover:underline">
                  MCP servers for Docker and Kubernetes
                </Link>
              </li>
              <li>
                <Link href="/blog/mcp-servers-for-monitoring-and-observability" className="text-primary hover:underline">
                  MCP servers for monitoring and observability
                </Link>
              </li>
              <li>
                <Link href="/blog/mcp-servers-for-cicd-and-devops" className="text-primary hover:underline">
                  MCP servers for CI/CD and DevOps
                </Link>
              </li>
              <li>
                <Link href="/blog/mcp-servers-for-security-and-authentication" className="text-primary hover:underline">
                  MCP servers for security and authentication
                </Link>
              </li>
            </ul>
            <p>
              <Link href="/directory" className="text-primary hover:underline font-medium">
                Browse the full MCP server directory →
              </Link>
            </p>
          </section>
        </article>
      </main>
    </>
  );
}
