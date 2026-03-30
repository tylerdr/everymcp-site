import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog — MCP Guides & Resources",
  description:
    "Practical guides, comparisons, and implementation resources for Model Context Protocol (MCP) servers and AI tooling.",
  alternates: {
    canonical: "/blog"
  }
};

const posts: { href: string; title: string; description: string; date: string; readTime: string; tag: string }[] = [
  {
    href: "/blog/mcp-servers-for-mongodb",
    title: "Best MCP Servers for MongoDB in 2026 — Query, Aggregate & Manage with AI",
    description:
      "Let your AI agent query MongoDB collections, run aggregation pipelines, inspect schemas, and manage documents — without leaving your chat window.",
    date: "March 30, 2026",
    readTime: "7 min read",
    tag: "Databases"
  },
  {
    href: "/blog/mcp-servers-for-figma-and-design",
    title: "Best MCP Servers for Figma & Design Tools in 2026",
    description:
      "Connect your AI agent to Figma and your design system. Extract tokens, generate code from components, automate handoffs, and close the gap between design and production.",
    date: "March 30, 2026",
    readTime: "7 min read",
    tag: "Design & UI"
  },
  {
    href: "/blog/mcp-servers-for-obsidian",
    title: "Best MCP Servers for Obsidian — Connect Your AI to Your Knowledge Base",
    description:
      "Connect Claude and other AI models to your Obsidian vault via MCP. Search notes, create new entries, answer questions from your knowledge base, and turn your second brain into an active AI collaborator.",
    date: "March 30, 2026",
    readTime: "9 min read",
    tag: "Knowledge Management"
  },
  {
    href: "/blog/mcp-server-debugging-guide",
    title: "How to Debug MCP Servers: A Complete Troubleshooting Guide",
    description:
      "Step-by-step guide to diagnosing and fixing common MCP server issues — connection errors, tool call failures, authentication problems, timeouts, and more.",
    date: "March 29, 2026",
    readTime: "9 min read",
    tag: "Developer Guide"
  },
  {
    href: "/blog/mcp-servers-for-openai",
    title: "Best MCP Servers for OpenAI & GPT-4 in 2026 — AI-to-AI Integrations",
    description:
      "Discover the top MCP servers for OpenAI integration. Connect GPT-4, DALL·E, Whisper, and OpenAI Assistants to Claude or any MCP-compatible client for powerful AI-to-AI workflows.",
    date: "March 29, 2026",
    readTime: "8 min read",
    tag: "MCP Guide"
  },
  {
    href: "/blog/mcp-servers-for-web-search",
    title: "Best MCP Servers for Web Search in 2026",
    description:
      "Give your AI agent real-time internet access. Discover the top MCP servers for web search — Brave, Tavily, Perplexity, SerpAPI, and Exa — so your LLM can research, fact-check, and stay current.",
    date: "March 29, 2026",
    readTime: "8 min read",
    tag: "Web & Research"
  },
  {
    href: "/blog/mcp-servers-for-openai-agents",
    title: "Best MCP Servers for OpenAI Agents (2026)",
    description:
      "The top MCP servers to use with OpenAI agents and the Agents SDK. Discover Model Context Protocol tools for web search, code execution, databases, files, and more — optimized for OpenAI agent workflows.",
    date: "March 29, 2026",
    readTime: "8 min read",
    tag: "AI Agents"
  },
  {
    href: "/blog/mcp-servers-for-multi-agent-systems",
    title: "Best MCP Servers for Multi-Agent Systems in 2026",
    description:
      "Discover the top MCP servers for building multi-agent AI pipelines. Connect orchestrators, sub-agents, shared memory, task queues, and observability layers with MCP.",
    date: "March 28, 2026",
    readTime: "9 min read",
    tag: "AI Agents"
  },
  {
    href: "/blog/mcp-servers-for-langchain-and-langgraph",
    title: "Best MCP Servers for LangChain and LangGraph (2026)",
    description:
      "Discover the best MCP servers to use with LangChain and LangGraph. Connect your AI agents to databases, APIs, files, browsers, and more with the Model Context Protocol.",
    date: "March 27, 2026",
    readTime: "9 min read",
    tag: "AI Agents"
  },
  {
    href: "/blog/mcp-servers-for-ollama-and-local-llms",
    title: "Best MCP Servers for Ollama & Local LLMs in 2026",
    description:
      "Connect Ollama, LM Studio, and other local LLMs to the MCP ecosystem. Run fully private AI workflows with no data leaving your machine — browse, code, search, and automate locally.",
    date: "March 27, 2026",
    readTime: "9 min read",
    tag: "Local AI"
  },
  {
    href: "/blog/mcp-servers-for-vector-databases",
    title: "Best MCP Servers for Vector Databases in 2026 — Pinecone, Weaviate & Qdrant",
    description:
      "Discover the top MCP servers for vector database integration. Let your AI agent query Pinecone, Weaviate, Qdrant, Chroma, and Milvus for RAG pipelines, semantic search, and embeddings.",
    date: "March 27, 2026",
    readTime: "9 min read",
    tag: "AI & RAG"
  },
  {
    href: "/blog/mcp-servers-for-shopify",
    title: "Best MCP Servers for Shopify in 2026 — AI-Powered eCommerce Automation",
    description:
      "Discover the top MCP servers for Shopify. Let your AI agent browse products, manage orders, update inventory, and automate eCommerce workflows directly from Claude or any LLM.",
    date: "March 26, 2026",
    readTime: "8 min read",
    tag: "eCommerce"
  },
  {
    href: "/blog/mcp-servers-for-linear-and-project-management",
    title: "Best MCP Servers for Linear & Project Management in 2026",
    description:
      "Discover the top MCP servers for Linear, Jira, Asana, and project management. Let your AI agent create issues, update sprints, and automate workflows directly from Claude or any LLM.",
    date: "March 26, 2026",
    readTime: "8 min read",
    tag: "Productivity"
  },
  {
    href: "/blog/mcp-servers-for-google-workspace",
    title: "Best MCP Servers for Google Workspace in 2026 — Docs, Sheets, Gmail & Calendar",
    description:
      "Connect your AI agent to Gmail, Google Docs, Sheets, Calendar, and Drive using MCP servers. Automate email triage, spreadsheet updates, document creation, and calendar management through natural language.",
    date: "March 25, 2026",
    readTime: "9 min read",
    tag: "Productivity"
  },
  {
    href: "/blog/mcp-servers-for-aws-and-cloud",
    title: "Best MCP Servers for AWS & Cloud in 2026 — Manage Infrastructure with AI",
    description:
      "Discover the top MCP servers for AWS, GCP, and Azure. Let your AI agent provision resources, query S3 buckets, manage Lambda functions, and automate cloud operations directly from Claude or any LLM.",
    date: "March 25, 2026",
    readTime: "9 min read",
    tag: "Cloud Infrastructure"
  },
  {
    href: "/blog/mcp-servers-for-browser-automation",
    title: "Best MCP Servers for Browser Automation in 2026",
    description:
      "Discover the best MCP servers for browser automation, web scraping, and UI testing. Control browsers with Playwright, Puppeteer, and Selenium through Model Context Protocol.",
    date: "March 24, 2026",
    readTime: "8 min read",
    tag: "Browser Automation"
  },
  {
    href: "/blog/mcp-servers-for-kubernetes",
    title: "Best MCP Servers for Kubernetes in 2026 — Manage Clusters with AI",
    description:
      "Discover the top MCP servers for Kubernetes. Let your AI agent inspect pods, apply manifests, debug deployments, and manage cluster resources directly from Claude or any LLM.",
    date: "March 24, 2026",
    readTime: "9 min read",
    tag: "DevOps"
  },
  {
    href: "/blog/mcp-servers-for-windsurf",
    title: "Best MCP Servers for Windsurf IDE (2026)",
    description:
      "Supercharge Windsurf's Cascade AI with MCP servers. Connect to GitHub, PostgreSQL, Slack, Linear, web search, and more — directly inside your IDE.",
    date: "March 24, 2026",
    readTime: "8 min read",
    tag: "IDE Integration"
  },
  {
    href: "/blog/mcp-servers-for-email",
    title: "Best MCP Servers for Email in 2026 — Gmail, Outlook & AI Automation",
    description:
      "Discover the top MCP servers for email integration. Let your AI agent read, send, and organize emails in Gmail or Outlook directly from Claude, GPT-4, or any LLM.",
    date: "March 24, 2026",
    readTime: "8 min read",
    tag: "Productivity"
  },
  {
    href: "/blog/mcp-servers-for-postgres",
    title: "Best MCP Servers for PostgreSQL in 2026 — Query Databases with AI",
    description:
      "Discover the top MCP servers for PostgreSQL. Let your AI agent run SQL queries, explore schemas, and analyze data directly from Claude, GPT-4, or any LLM — no SQL expertise required.",
    date: "March 25, 2026",
    readTime: "9 min read",
    tag: "Databases"
  },
  {
    href: "/blog/mcp-servers-for-databases",
    title: "Best MCP Servers for Databases in 2026 — SQL, Postgres & NoSQL with AI",
    description:
      "Discover the top MCP servers for database integration. Let your AI agent query PostgreSQL, MySQL, SQLite, MongoDB, and more — directly from Claude, GPT-4, or any LLM.",
    date: "March 23, 2026",
    readTime: "9 min read",
    tag: "Databases"
  },
  {
    href: "/blog/mcp-servers-for-airtable",
    title: "Best MCP Servers for Airtable in 2026 — AI Agents for No-Code Databases",
    description:
      "Discover the top MCP servers for Airtable integration. Let your AI agent read bases, create records, run automations, and sync data across no-code workflows from Claude or any LLM.",
    date: "March 28, 2026",
    readTime: "8 min read",
    tag: "No-Code"
  },
  {
    href: "/blog/mcp-servers-for-confluence",
    title: "Best MCP Servers for Confluence in 2026 — AI Access to Your Wiki",
    description:
      "Discover the top MCP servers for Confluence. Let your AI agent search pages, read documentation, create content, and navigate your team's knowledge base from Claude or any LLM.",
    date: "March 29, 2026",
    readTime: "8 min read",
    tag: "Productivity"
  },
  {
    href: "/blog/mcp-servers-for-obsidian",
    title: "Best MCP Servers for Obsidian in 2026 — AI-Powered Knowledge Management",
    description:
      "Discover the top MCP servers for Obsidian. Let your AI agent read notes, search your vault, create new entries, and traverse your knowledge graph from Claude or any LLM.",
    date: "March 29, 2026",
    readTime: "8 min read",
    tag: "Productivity"
  },
  {
    href: "/blog/mcp-servers-for-notion",
    title: "Best MCP Servers for Notion in 2026 — AI-Powered Knowledge Base Access",
    description:
      "Discover the top MCP servers for Notion integration. Let your AI agent read pages, create docs, search your workspace, and manage databases directly from Claude or any LLM.",
    date: "March 23, 2026",
    readTime: "8 min read",
    tag: "Productivity"
  },
  {
    href: "/blog/mcp-servers-for-docker-and-kubernetes",
    title: "Best MCP Servers for Docker & Kubernetes in 2026 — AI-Powered Container Management",
    description:
      "Discover the top MCP servers for Docker and Kubernetes. Let your AI agent inspect containers, manage pods, tail logs, and automate deployments directly from Claude or any LLM.",
    date: "March 23, 2026",
    readTime: "8 min read",
    tag: "DevOps"
  },
  {
    href: "/blog/mcp-server-security-best-practices",
    title: "MCP Server Security Best Practices in 2026",
    description:
      "Secure your MCP servers with authentication, least-privilege authorization, input validation, transport encryption, audit logging, and sandboxing. A practical security guide for MCP deployments.",
    date: "March 28, 2026",
    readTime: "10 min read",
    tag: "Security"
  },
  {
    href: "/blog/mcp-servers-for-security-and-authentication",
    title: "Best MCP Servers for Security & Authentication in 2026",
    description:
      "Discover MCP servers for secrets management, vulnerability scanning, IAM auditing, and identity providers. Let your AI manage credentials, scan for CVEs, and audit access controls.",
    date: "March 23, 2026",
    readTime: "8 min read",
    tag: "Security"
  },
  {
    href: "/blog/mcp-servers-for-monitoring-and-observability",
    title: "Best MCP Servers for Monitoring & Observability in 2026",
    description:
      "Query logs, metrics, and traces from Datadog, Grafana, Prometheus, CloudWatch, and more — directly from your AI assistant using Model Context Protocol servers.",
    date: "March 23, 2026",
    readTime: "7 min read",
    tag: "DevOps"
  },
  {
    href: "/blog/mcp-servers-for-file-management",
    title: "Best MCP Servers for File Management & Local Filesystem Access (2026)",
    description:
      "Give Claude, Cursor, or any MCP-compatible AI direct read/write access to your local files. The top filesystem MCP servers reviewed and compared.",
    date: "March 23, 2026",
    readTime: "8 min read",
    tag: "MCP Guide"
  },
  {
    href: "/blog/how-to-build-an-mcp-server",
    title: "How to Build an MCP Server: Step-by-Step Guide for Developers",
    description:
      "Learn how to build an MCP server from scratch with TypeScript or Python. Covers tools, resources, prompts, error handling, and deployment — with working code examples.",
    date: "March 22, 2026",
    readTime: "10 min read",
    tag: "Tutorial"
  },
  {
    href: "/blog/mcp-servers-for-stripe-and-payments",
    title: "Best MCP Servers for Stripe & Payments in 2026 — AI Billing Automation",
    description:
      "Discover the top MCP servers for Stripe and payment integration. Let your AI agent query customers, create invoices, handle subscriptions, and automate billing workflows.",
    date: "March 26, 2026",
    readTime: "7 min read",
    tag: "MCP Guide"
  },
  {
    href: "/blog/mcp-servers-for-financial-data",
    title: "Best MCP Servers for Financial Data & Trading in 2026",
    description:
      "Discover the top MCP servers for financial data, stock prices, market analysis, and trading automation. Connect your AI agent to real-time market data and financial APIs.",
    date: "March 26, 2026",
    readTime: "9 min read",
    tag: "MCP Guide"
  },
  {
    href: "/blog/mcp-servers-for-data-analysis",
    title: "Best MCP Servers for Data Analysis in 2026 — Pandas, SQL & Spreadsheets with AI",
    description:
      "Discover the top MCP servers for data analysis. Let your AI agent query databases, run Python/pandas, analyze CSVs, and generate charts — all from Claude or any LLM.",
    date: "March 24, 2026",
    readTime: "9 min read",
    tag: "MCP Guide"
  },
  {
    href: "/blog/mcp-servers-for-github",
    title: "Best MCP Servers for GitHub in 2026 — Code, PRs & Issues with AI",
    description:
      "Discover the top MCP servers for GitHub integration. Let your AI agent read code, open pull requests, manage issues, and automate workflows directly from Claude or any LLM.",
    date: "March 22, 2026",
    readTime: "8 min read",
    tag: "MCP Guide"
  },
  {
    href: "/blog/mcp-servers-for-home-automation",
    title: "Best MCP Servers for Home Automation in 2026 — Control Smart Homes with AI",
    description:
      "Discover the top MCP servers for home automation. Let your AI agent control smart home devices, automate routines, and integrate with Home Assistant, HomeKit, and more.",
    date: "March 28, 2026",
    readTime: "7 min read",
    tag: "Smart Home"
  },
  {
    href: "/blog/mcp-servers-for-zapier-and-n8n",
    title: "Best MCP Servers for Zapier and n8n Automation (2026)",
    description:
      "Discover the top MCP servers for integrating AI agents with Zapier, n8n, and workflow automation tools. Connect Claude and other LLMs to thousands of apps via Model Context Protocol.",
    date: "March 26, 2026",
    readTime: "7 min read",
    tag: "Workflow Automation"
  },
  {
    href: "/blog/mcp-servers-for-productivity-automation",
    title: "MCP Servers for Productivity & Automation: Top Tools in 2026",
    description:
      "Discover the best MCP servers for productivity and automation — calendar management, email, task tracking, file automation, and workflow orchestration.",
    date: "March 22, 2026",
    readTime: "9 min read",
    tag: "Productivity"
  },
  {
    href: "/blog/mcp-servers-for-cursor-and-vscode",
    title: "Best MCP Servers for Cursor and VS Code in 2026",
    description:
      "Discover the best MCP servers for Cursor AI and VS Code. Supercharge your IDE with GitHub, database, web search, memory, and browser automation tools.",
    date: "March 22, 2026",
    readTime: "8 min read",
    tag: "IDE Integrations"
  },
  {
    href: "/blog/mcp-servers-for-ai-agents",
    title: "Best MCP Servers for AI Agents in 2026",
    description:
      "Power your AI agents with the best MCP servers. Give autonomous agents access to web browsing, databases, code execution, email, and memory using Model Context Protocol.",
    date: "March 22, 2026",
    readTime: "9 min read",
    tag: "AI Agents"
  },
  {
    href: "/blog/mcp-servers-for-github-copilot",
    title: "Best MCP Servers for GitHub Copilot & VS Code in 2026",
    description:
      "Extend GitHub Copilot and VS Code with the best MCP servers — connecting your coding assistant to databases, search, APIs, and infrastructure tools.",
    date: "March 22, 2026",
    readTime: "9 min read",
    tag: "MCP Guide"
  },
  {
    href: "/blog/mcp-servers-for-claude-ai",
    title: "Best MCP Servers for Claude AI: Supercharge Your Claude Setup",
    description:
      "Discover the top MCP servers to extend Claude AI with file access, web search, databases, code execution, memory, and productivity integrations.",
    date: "March 21, 2026",
    readTime: "8 min read",
    tag: "MCP Guide"
  },
  {
    href: "/blog/mcp-servers-for-web-scraping",
    title: "Best MCP Servers for Web Scraping & Browser Automation in 2026",
    description:
      "Discover the top MCP servers for web scraping and browser automation. From Playwright to Puppeteer integrations, give your AI agent real-time web access.",
    date: "March 21, 2026",
    readTime: "8 min read",
    tag: "MCP Guide"
  },
  {
    href: "/blog/best-mcp-servers-2026",
    title: "Best MCP Servers in 2026: Top Model Context Protocol Tools Ranked",
    description:
      "The definitive guide to the best MCP servers in 2026 — ranked by developer adoption and capability across databases, search, file systems, and SaaS integrations.",
    date: "March 21, 2026",
    readTime: "9 min read",
    tag: "MCP Guide"
  },
  {
    href: "/blog/how-to-choose-an-mcp-server",
    title: "How to Choose the Right MCP Server for Your AI Application",
    description:
      "A practical framework for evaluating MCP servers before you commit — covering authentication, latency, tool surface area, and maintenance status.",
    date: "March 21, 2026",
    readTime: "7 min read",
    tag: "MCP Guide"
  },
  {
    href: "/blog/mcp-servers-for-python-development",
    title: "Best MCP Servers for Python Development in 2026",
    description:
      "Run code, manage packages, debug automatically — discover the top MCP servers for Python developers using Claude and other AI coding assistants.",
    date: "March 27, 2026",
    readTime: "9 min read",
    tag: "MCP Guide"
  },
  {
    href: "/blog/mcp-servers-for-typescript-and-nodejs",
    title: "Best MCP Servers for TypeScript & Node.js Development in 2026",
    description:
      "Run scripts, manage npm packages, debug TypeScript errors — discover the top MCP servers for Node.js developers using Claude and other AI coding assistants.",
    date: "March 27, 2026",
    readTime: "10 min read",
    tag: "MCP Guide"
  },
  {
    href: "/blog/top-mcp-servers-for-developers",
    title: "Top MCP Servers for Developers in 2025",
    description:
      "A curated guide to the best Model Context Protocol servers for production AI applications — databases, search, code execution, and more.",
    date: "March 20, 2026",
    readTime: "8 min read",
    tag: "MCP Guide"
  }
];

export default function BlogIndex() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <header className="mb-12">
        <p className="inline-flex rounded-full bg-sky/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.16em] text-sky">
          EveryMCP Blog
        </p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          MCP Guides & Resources
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Practical guides for developers building with Model Context Protocol.
        </p>
      </header>

      <div className="space-y-6">
        {posts.map((post) => (
          <Link
            key={post.href}
            href={post.href}
            className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-soft transition hover:border-sky/30 hover:shadow-md"
          >
            <p className="inline-flex rounded-full bg-sky/10 px-3 py-0.5 text-xs font-bold uppercase tracking-[0.12em] text-sky">
              {post.tag}
            </p>
            <h2 className="mt-3 text-xl font-bold text-ink">{post.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{post.description}</p>
            <p className="mt-3 text-xs text-slate-400">
              {post.date} · {post.readTime}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
