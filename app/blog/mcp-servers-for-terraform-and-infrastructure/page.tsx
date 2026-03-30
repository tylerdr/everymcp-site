import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best MCP Servers for Terraform & Infrastructure as Code in 2026",
  description:
    "Discover the top MCP servers for Terraform and infrastructure as code. Let your AI agent plan, apply, and manage cloud infrastructure directly from Claude, GPT-4, or any LLM.",
  alternates: {
    canonical: "/blog/mcp-servers-for-terraform-and-infrastructure"
  },
  openGraph: {
    title: "Best MCP Servers for Terraform & Infrastructure as Code in 2026",
    description:
      "Top MCP servers for Terraform — let your AI agent plan, apply, and manage cloud infrastructure from any LLM.",
    url: "https://everymcp.com/blog/mcp-servers-for-terraform-and-infrastructure",
    type: "article"
  }
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Best MCP Servers for Terraform & Infrastructure as Code in 2026",
  description:
    "Discover the top MCP servers for Terraform and infrastructure as code. Let your AI agent plan, apply, and manage cloud infrastructure directly from Claude, GPT-4, or any LLM.",
  url: "https://everymcp.com/blog/mcp-servers-for-terraform-and-infrastructure",
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
  }
};

export default function MCPServersForTerraform() {
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
            <p className="text-sm text-muted-foreground mb-3">March 30, 2026 · 9 min read</p>
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Best MCP Servers for Terraform &amp; Infrastructure as Code in 2026
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Infrastructure as code just got an AI co-pilot. The best MCP servers for Terraform let
              your LLM plan changes, inspect state, query provider docs, and manage cloud resources
              — all without leaving your AI assistant. Here&apos;s what to use in 2026.
            </p>
          </header>

          <section className="prose prose-neutral dark:prose-invert max-w-none">
            <h2>Why Terraform + MCP Is a Game Changer</h2>
            <p>
              Terraform manages some of the most critical and expensive resources your team owns —
              production databases, networking, IAM roles, Kubernetes clusters. Getting it wrong
              costs real money and real downtime.
            </p>
            <p>
              Traditionally, working with Terraform meant context-switching between terminal, docs,
              state files, and your editor. With a Terraform MCP server, your AI agent gets{" "}
              <strong>live access to your infrastructure state</strong> — it can read current
              resource configurations, plan changes, check for drift, and even apply updates with
              proper safeguards.
            </p>
            <p>
              The result: faster infrastructure reviews, better change management, and AI-assisted
              debugging of complex dependency graphs — all within a single conversation.
            </p>

            <h2>Top MCP Servers for Terraform</h2>

            <h3>1. terraform-mcp-server (HashiCorp)</h3>
            <p>
              The official Terraform MCP server from HashiCorp gives your AI agent direct access to
              the Terraform Registry — providers, modules, resource documentation, and version
              metadata. This is the first stop for any Terraform workflow.
            </p>
            <p>
              <strong>Key capabilities:</strong>
            </p>
            <ul>
              <li>Search and retrieve provider documentation</li>
              <li>List available modules from the Terraform Registry</li>
              <li>Fetch resource schemas and argument references</li>
              <li>Query module inputs, outputs, and dependencies</li>
              <li>Look up provider version compatibility</li>
            </ul>
            <p>
              This server is read-only and safe to use in any environment. It&apos;s particularly
              useful when writing new Terraform configurations — your AI can pull exact argument
              names and types without hallucinating from outdated training data.
            </p>

            <h3>2. terraform-state-mcp</h3>
            <p>
              This community server exposes your Terraform state files to your AI agent. Connect it
              to local state, S3 backends, or Terraform Cloud workspaces to give your LLM a live
              view of what&apos;s actually deployed.
            </p>
            <p>
              <strong>Key capabilities:</strong>
            </p>
            <ul>
              <li>Read current resource state across workspaces</li>
              <li>Compare planned changes against actual state</li>
              <li>Identify resource drift without running terraform plan</li>
              <li>List all managed resources by type or tag</li>
            </ul>
            <p>
              Use this server carefully in production environments — always scope access to
              read-only credentials and never expose state files containing secrets without
              appropriate masking.
            </p>

            <h3>3. terraform-cloud-mcp</h3>
            <p>
              Purpose-built for Terraform Cloud and Terraform Enterprise users. This server
              integrates with the TFC API to give your AI agent visibility into runs, workspaces,
              variables, and policy checks.
            </p>
            <p>
              <strong>Key capabilities:</strong>
            </p>
            <ul>
              <li>List and inspect workspace run history</li>
              <li>Fetch plan output and apply logs</li>
              <li>Check Sentinel policy evaluation results</li>
              <li>Manage workspace variables (read/write)</li>
              <li>Trigger runs programmatically</li>
            </ul>
            <p>
              This is especially powerful for platform engineering teams managing many workspaces.
              Your AI agent can audit configurations across your entire organization, spot
              misconfigurations, and help standardize variable definitions.
            </p>

            <h3>4. infracost-mcp</h3>
            <p>
              Infracost estimates cloud costs for Terraform changes before you apply them. The
              Infracost MCP server brings this analysis directly into your AI conversations.
            </p>
            <p>
              <strong>Key capabilities:</strong>
            </p>
            <ul>
              <li>Estimate monthly cost of planned Terraform changes</li>
              <li>Compare costs between current and proposed configurations</li>
              <li>Break down costs by resource type</li>
              <li>Flag unexpectedly expensive resource configurations</li>
            </ul>
            <p>
              Pair this with terraform-cloud-mcp to build an AI-powered cost governance workflow —
              your agent can review PRs for both correctness and cost impact before they merge.
            </p>

            <h3>5. checkov-mcp (Security Scanning)</h3>
            <p>
              Checkov is the leading open-source static analysis tool for Terraform. The Checkov
              MCP server lets your AI agent run security and compliance scans inline as you write
              or review infrastructure code.
            </p>
            <p>
              <strong>Key capabilities:</strong>
            </p>
            <ul>
              <li>Scan Terraform files for security misconfigurations</li>
              <li>Check against CIS benchmarks and NIST controls</li>
              <li>Identify overpermissive IAM policies</li>
              <li>Flag unencrypted storage or open security groups</li>
              <li>Suggest remediation for failed checks</li>
            </ul>

            <h2>How to Set Up Terraform MCP Servers</h2>
            <p>
              Most Terraform MCP servers follow the same setup pattern. Here&apos;s how to get the
              official HashiCorp terraform-mcp-server running with Claude Desktop:
            </p>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`{
  "mcpServers": {
    "terraform": {
      "command": "npx",
      "args": ["-y", "@hashicorp/terraform-mcp-server"]
    }
  }
}`}</code>
            </pre>
            <p>
              For Terraform Cloud integration, you&apos;ll need to pass your TFC API token as an
              environment variable:
            </p>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`{
  "mcpServers": {
    "terraform-cloud": {
      "command": "npx",
      "args": ["-y", "terraform-cloud-mcp"],
      "env": {
        "TFC_TOKEN": "your-terraform-cloud-token"
      }
    }
  }
}`}</code>
            </pre>

            <h2>Key Use Cases</h2>

            <h3>Writing and Reviewing Infrastructure Code</h3>
            <p>
              The most immediate use case is AI-assisted Terraform authoring. With the HashiCorp
              registry MCP server connected, your LLM can write accurate resource configurations
              using live documentation rather than hallucinated argument names.
            </p>
            <p>
              Ask your AI: &ldquo;Write a Terraform module for an EKS cluster with autoscaling, and
              include the latest argument signatures for the aws_eks_cluster resource.&rdquo; The
              server fetches the current provider docs and generates accurate, up-to-date code.
            </p>

            <h3>Infrastructure State Analysis</h3>
            <p>
              Connect your AI to live state and ask questions like: &ldquo;Which of our RDS
              instances are not encrypted at rest?&rdquo; or &ldquo;List all S3 buckets managed by
              Terraform and their versioning status.&rdquo;
            </p>
            <p>
              This turns your AI agent into an infrastructure auditor that can scan your entire
              deployed footprint in seconds.
            </p>

            <h3>Change Impact Analysis</h3>
            <p>
              Before applying changes, run them past your AI agent with both the state MCP and the
              infracost MCP connected. Your agent can explain what will change, estimate the cost
              impact, flag security issues, and surface any dependency risks — all before you type
              <code>terraform apply</code>.
            </p>

            <h3>Incident Response</h3>
            <p>
              When something breaks in production, Terraform state MCP servers become your first
              line of investigation. Your AI can quickly correlate recent infrastructure changes
              with the incident timeline, identify misconfigurations, and suggest rollback paths.
            </p>

            <h2>Security Considerations</h2>
            <p>
              Infrastructure MCP servers carry higher security stakes than most. Before deploying
              any Terraform MCP integration, consider:
            </p>
            <ul>
              <li>
                <strong>Read-only vs. write access:</strong> Start with read-only permissions.
                Enable write access only for specific, scoped workflows with human approval in the
                loop.
              </li>
              <li>
                <strong>State file secrets:</strong> Terraform state often contains sensitive values
                (passwords, keys). Use remote backends with encryption and ensure MCP servers never
                log or expose raw state output.
              </li>
              <li>
                <strong>Workspace scoping:</strong> Limit MCP server access to specific workspaces
                rather than your entire organization.
              </li>
              <li>
                <strong>Audit logging:</strong> Log all AI-initiated Terraform operations for
                compliance and change management purposes.
              </li>
            </ul>

            <h2>Comparing Terraform MCP Servers</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4">Server</th>
                    <th className="text-left py-2 pr-4">Best For</th>
                    <th className="text-left py-2 pr-4">Write Access</th>
                    <th className="text-left py-2">Auth Required</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 pr-4 font-medium">terraform-mcp-server</td>
                    <td className="py-2 pr-4">Registry docs lookup</td>
                    <td className="py-2 pr-4">No</td>
                    <td className="py-2">No</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4 font-medium">terraform-state-mcp</td>
                    <td className="py-2 pr-4">State analysis</td>
                    <td className="py-2 pr-4">Optional</td>
                    <td className="py-2">Backend creds</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4 font-medium">terraform-cloud-mcp</td>
                    <td className="py-2 pr-4">TFC/TFE teams</td>
                    <td className="py-2 pr-4">Yes</td>
                    <td className="py-2">TFC API token</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4 font-medium">infracost-mcp</td>
                    <td className="py-2 pr-4">Cost estimation</td>
                    <td className="py-2 pr-4">No</td>
                    <td className="py-2">Infracost API key</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium">checkov-mcp</td>
                    <td className="py-2 pr-4">Security scanning</td>
                    <td className="py-2 pr-4">No</td>
                    <td className="py-2">No</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2>The Future of AI-Assisted Infrastructure</h2>
            <p>
              Terraform MCP servers represent the early edge of a shift toward{" "}
              <strong>AI-native infrastructure management</strong>. As these tools mature, we can
              expect:
            </p>
            <ul>
              <li>
                AI agents that can autonomously handle routine infrastructure maintenance with
                human approval gates
              </li>
              <li>
                Natural language infrastructure queries replacing complex CLI commands
              </li>
              <li>
                Proactive cost and security recommendations surfaced before changes are proposed
              </li>
              <li>
                AI-generated infrastructure documentation that stays in sync with actual state
              </li>
            </ul>
            <p>
              The foundation is being built now. If you work with Terraform regularly, adding MCP
              server integrations to your workflow today is a low-risk, high-reward move.
            </p>

            <h2>Getting Started</h2>
            <p>
              The fastest path to a useful Terraform MCP setup is to start with the official
              HashiCorp registry server — it requires no authentication and immediately improves
              the accuracy of AI-generated Terraform code. From there, layer in state access and
              Terraform Cloud integration as your team&apos;s comfort with AI-assisted
              infrastructure grows.
            </p>
            <p>
              Browse the full catalog of infrastructure and DevOps MCP servers on{" "}
              <Link href="/directory" className="underline underline-offset-2">
                EveryMCP
              </Link>{" "}
              — we index hundreds of servers across every category so you can find the right tool
              without the research overhead.
            </p>
          </section>
        </article>

        <div className="mt-12 pt-8 border-t">
          <h3 className="font-semibold mb-4">Related Articles</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                href="/blog/mcp-servers-for-aws-and-cloud"
                className="text-muted-foreground hover:underline"
              >
                Best MCP Servers for AWS &amp; Cloud Infrastructure →
              </Link>
            </li>
            <li>
              <Link
                href="/blog/mcp-servers-for-docker-and-kubernetes"
                className="text-muted-foreground hover:underline"
              >
                Best MCP Servers for Docker &amp; Kubernetes →
              </Link>
            </li>
            <li>
              <Link
                href="/blog/mcp-servers-for-cicd-and-devops"
                className="text-muted-foreground hover:underline"
              >
                Best MCP Servers for CI/CD &amp; DevOps →
              </Link>
            </li>
            <li>
              <Link
                href="/blog/mcp-servers-for-security-and-authentication"
                className="text-muted-foreground hover:underline"
              >
                Best MCP Servers for Security &amp; Authentication →
              </Link>
            </li>
          </ul>
        </div>
      </main>
    </>
  );
}
