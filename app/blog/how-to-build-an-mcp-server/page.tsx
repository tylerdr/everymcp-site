import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How to Build an MCP Server: Step-by-Step Guide for Developers",
  description:
    "Learn how to build an MCP server from scratch. This step-by-step guide covers the Model Context Protocol SDK, tools, resources, and prompts — with working TypeScript and Python examples.",
  alternates: {
    canonical: "/blog/how-to-build-an-mcp-server"
  },
  openGraph: {
    title: "How to Build an MCP Server: Step-by-Step Guide for Developers",
    description:
      "Learn how to build an MCP server from scratch with TypeScript or Python — tools, resources, prompts, and deployment covered.",
    url: "https://everymcp.com/blog/how-to-build-an-mcp-server",
    type: "article"
  }
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "How to Build an MCP Server: Step-by-Step Guide for Developers",
  description:
    "Learn how to build an MCP server from scratch. This step-by-step guide covers the Model Context Protocol SDK, tools, resources, and prompts — with working TypeScript and Python examples.",
  url: "https://everymcp.com/blog/how-to-build-an-mcp-server",
  datePublished: "2026-03-22",
  dateModified: "2026-03-22",
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

export default function HowToBuildAnMCPServer() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <div className="mb-8">
          <Link href="/blog" className="text-sm text-blue-600 hover:underline">
            ← Back to Blog
          </Link>
        </div>

        <header className="mb-10">
          <div className="text-sm text-gray-500 mb-3">March 22, 2026 · 10 min read</div>
          <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-4">
            How to Build an MCP Server: Step-by-Step Guide for Developers
          </h1>
          <p className="text-xl text-gray-600">
            The Model Context Protocol (MCP) lets you give AI models structured, real-time access to
            your data and tools. Here&apos;s how to build your own MCP server from scratch — with
            working code examples in TypeScript and Python.
          </p>
        </header>

        <article className="prose prose-gray max-w-none">
          <h2>What Is an MCP Server?</h2>
          <p>
            An MCP server is a lightweight process that exposes <strong>tools</strong>,{" "}
            <strong>resources</strong>, and <strong>prompts</strong> to AI clients like Claude,
            Cursor, or any MCP-compatible application. Think of it as an API adapter purpose-built
            for AI — instead of returning raw JSON for a frontend, you&apos;re returning structured
            context that an LLM can reason over.
          </p>
          <p>
            The protocol was created by Anthropic and is now an open standard. When you build an MCP
            server, your tools become available to any AI that speaks MCP — today that includes
            Claude Desktop, Cursor, VS Code Copilot, and many more.
          </p>

          <h2>The Three Primitives</h2>
          <p>Every MCP server is built from three core building blocks:</p>
          <ul>
            <li>
              <strong>Tools</strong> — executable functions the AI can call (like{" "}
              <code>search_database</code> or <code>send_email</code>)
            </li>
            <li>
              <strong>Resources</strong> — read-only data the AI can fetch (like files, API
              responses, or database records)
            </li>
            <li>
              <strong>Prompts</strong> — reusable prompt templates with parameters
            </li>
          </ul>
          <p>
            Most MCP servers focus on tools — they&apos;re the most commonly used primitive and the
            easiest to get started with.
          </p>

          <h2>Prerequisites</h2>
          <p>Before you start, you&apos;ll need:</p>
          <ul>
            <li>Node.js 18+ (for TypeScript) or Python 3.10+ (for Python)</li>
            <li>
              Basic familiarity with async/await and REST APIs
            </li>
            <li>An MCP client to test with (Claude Desktop is the easiest)</li>
          </ul>

          <h2>Option 1: TypeScript MCP Server</h2>
          <p>
            The TypeScript SDK is the most mature and widely used. Start by installing the package:
          </p>
          <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
            <code>{`npm init -y
npm install @modelcontextprotocol/sdk`}</code>
          </pre>

          <p>
            Then create your server file. Here&apos;s a minimal example that exposes a{" "}
            <code>get_weather</code> tool:
          </p>
          <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
            <code>{`import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "weather-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Declare your tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_weather",
      description: "Get current weather for a city",
      inputSchema: {
        type: "object",
        properties: {
          city: { type: "string", description: "City name" },
        },
        required: ["city"],
      },
    },
  ],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "get_weather") {
    const city = request.params.arguments?.city as string;
    // Call your real weather API here
    return {
      content: [
        {
          type: "text",
          text: \`Weather in \${city}: 72°F, partly cloudy\`,
        },
      ],
    };
  }
  throw new Error("Unknown tool");
});

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);`}</code>
          </pre>

          <p>
            Run it with <code>npx ts-node server.ts</code> (or compile first with{" "}
            <code>tsc</code>). The server communicates over stdio — that&apos;s how MCP clients like
            Claude Desktop launch and talk to it.
          </p>

          <h2>Option 2: Python MCP Server</h2>
          <p>
            The Python SDK uses a decorator-based API that&apos;s very clean. Install it first:
          </p>
          <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
            <code>{`pip install mcp`}</code>
          </pre>
          <p>Then build the same weather server in Python:</p>
          <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
            <code>{`from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp import types

app = Server("weather-server")

@app.list_tools()
async def list_tools():
    return [
        types.Tool(
            name="get_weather",
            description="Get current weather for a city",
            inputSchema={
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "City name"}
                },
                "required": ["city"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "get_weather":
        city = arguments["city"]
        # Call your real weather API here
        return [types.TextContent(type="text", text=f"Weather in {city}: 72°F, partly cloudy")]
    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as streams:
        await app.run(*streams, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())`}</code>
          </pre>

          <h2>Connecting to Claude Desktop</h2>
          <p>
            To test your server, add it to Claude Desktop&apos;s config. Open{" "}
            <code>~/Library/Application Support/Claude/claude_desktop_config.json</code> on macOS
            (or the equivalent on Windows/Linux) and add:
          </p>
          <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
            <code>{`{
  "mcpServers": {
    "weather": {
      "command": "node",
      "args": ["/path/to/your/server.js"]
    }
  }
}`}</code>
          </pre>
          <p>
            Restart Claude Desktop and you&apos;ll see a hammer icon in the chat interface. Click it
            to see your tools — Claude can now call <code>get_weather</code> whenever it&apos;s
            relevant.
          </p>

          <h2>Adding Resources</h2>
          <p>
            Resources let you expose read-only data. They&apos;re identified by URIs and can
            represent anything from files to live API data:
          </p>
          <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
            <code>{`server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: "file:///data/config.json",
      name: "App Configuration",
      mimeType: "application/json",
    },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === "file:///data/config.json") {
    const content = await fs.readFile("./config.json", "utf-8");
    return {
      contents: [{ uri: request.params.uri, mimeType: "application/json", text: content }],
    };
  }
  throw new Error("Resource not found");
});`}</code>
          </pre>

          <h2>Error Handling Best Practices</h2>
          <p>MCP servers should handle errors gracefully. Key patterns:</p>
          <ul>
            <li>
              <strong>Return errors in content</strong> — don&apos;t throw for tool logic failures.
              Return a text content block with the error message so the AI can understand what went
              wrong.
            </li>
            <li>
              <strong>Throw for protocol errors</strong> — unknown tools, missing required params,
              and auth failures should throw.
            </li>
            <li>
              <strong>Validate inputs</strong> — always validate required fields before calling
              downstream APIs.
            </li>
            <li>
              <strong>Timeout long operations</strong> — wrap slow API calls in a timeout to prevent
              hanging the AI client.
            </li>
          </ul>

          <h2>Deploying Your MCP Server</h2>
          <p>
            Most MCP servers run locally via stdio — they&apos;re launched by the AI client as a
            child process. But you can also deploy them as HTTP servers using the SSE (Server-Sent
            Events) transport for remote access.
          </p>
          <p>For local distribution:</p>
          <ul>
            <li>
              Publish to npm (TypeScript) or PyPI (Python) so users can install with{" "}
              <code>npx</code> or <code>uvx</code>
            </li>
            <li>
              Use <code>npx your-package</code> as the command in config — no install required
            </li>
            <li>Bundle with pkg or nexe for zero-dependency executables</li>
          </ul>
          <p>For remote/cloud deployment:</p>
          <ul>
            <li>Use the SSE transport instead of stdio</li>
            <li>Deploy to Railway, Fly.io, or any Node.js/Python host</li>
            <li>Add OAuth or API key auth for multi-user servers</li>
          </ul>

          <h2>Common Patterns and Use Cases</h2>
          <p>Once you have the basics down, MCP servers are incredibly versatile:</p>
          <ul>
            <li>
              <strong>Database access</strong> — expose SQL query tools so AI can fetch live data
            </li>
            <li>
              <strong>File system</strong> — let AI read/write project files (be careful with write
              permissions)
            </li>
            <li>
              <strong>API wrappers</strong> — turn any REST API into MCP tools (GitHub, Slack,
              Linear, etc.)
            </li>
            <li>
              <strong>Code execution</strong> — run sandboxed code and return results
            </li>
            <li>
              <strong>Memory/state</strong> — persist information between AI conversations
            </li>
          </ul>

          <h2>Discovering Existing MCP Servers</h2>
          <p>
            Before building from scratch, it&apos;s worth checking if someone has already built what
            you need.{" "}
            <Link href="/" className="text-blue-600 hover:underline">
              EveryMCP
            </Link>{" "}
            indexes thousands of MCP servers with search, filtering by category, and detailed
            documentation. The ecosystem is growing fast — new servers ship every day.
          </p>
          <p>Popular categories include:</p>
          <ul>
            <li>
              <Link href="/servers?category=database" className="text-blue-600 hover:underline">
                Database MCP servers
              </Link>{" "}
              (PostgreSQL, MySQL, SQLite, MongoDB)
            </li>
            <li>
              <Link href="/servers?category=developer-tools" className="text-blue-600 hover:underline">
                Developer tools
              </Link>{" "}
              (GitHub, GitLab, Jira, Linear)
            </li>
            <li>
              <Link href="/servers?category=productivity" className="text-blue-600 hover:underline">
                Productivity
              </Link>{" "}
              (Notion, Google Drive, Slack)
            </li>
          </ul>

          <h2>Next Steps</h2>
          <p>
            Building an MCP server is one of the fastest ways to give AI models real capabilities.
            Start small — one tool, one resource — and iterate. The SDK handles the protocol so you
            can focus on your logic.
          </p>
          <p>
            Once you&apos;ve shipped your first server,{" "}
            <Link href="/submit" className="text-blue-600 hover:underline">
              submit it to EveryMCP
            </Link>{" "}
            so developers can discover it. The MCP ecosystem grows when builders share their work.
          </p>

          <hr className="my-8" />
          <p className="text-sm text-gray-500">
            Looking for MCP servers to use right now?{" "}
            <Link href="/" className="text-blue-600 hover:underline">
              Browse the EveryMCP directory →
            </Link>
          </p>
        </article>

        <div className="mt-12 pt-8 border-t">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Articles</h3>
          <ul className="space-y-2">
            <li>
              <Link
                href="/blog/best-mcp-servers-2026"
                className="text-blue-600 hover:underline"
              >
                Best MCP Servers in 2026: Top Tools Ranked
              </Link>
            </li>
            <li>
              <Link
                href="/blog/mcp-servers-for-claude-ai"
                className="text-blue-600 hover:underline"
              >
                MCP Servers for Claude AI: Top Picks
              </Link>
            </li>
            <li>
              <Link
                href="/blog/how-to-choose-an-mcp-server"
                className="text-blue-600 hover:underline"
              >
                How to Choose the Right MCP Server for Your Project
              </Link>
            </li>
          </ul>
        </div>
      </main>
    </>
  );
}
