import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import type { CallToolResult, FetchLike } from "@modelcontextprotocol/client";
import { createMcpHandler } from "mcp-handler";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  AUDIT_MCP_ENABLED_ENV,
  AUDIT_MCP_RATE_LIMIT_ENV,
  GETFOUND_READY_ENV,
  boundMcpRequest,
  createAuditMcpHandler,
  createGatedAuditMcpHandler,
  getAuditMcpGate,
  getAuditMcpReadiness,
  validatePublicAuditUrl
} from "../lib/audit-mcp";

type Handler = (request: Request) => Promise<Response>;

async function connect(handler: Handler) {
  const localFetch: FetchLike = async (input, init) => {
    const request = input instanceof Request ? input : new Request(input, init);
    return handler(request);
  };
  const client = new Client(
    { name: "everymcp-audit-mcp-test", version: "1.0.0" },
    { versionNegotiation: { mode: "legacy" } }
  );
  await client.connect(new StreamableHTTPClientTransport(
    new URL("https://everymcp.test/api/mcp"),
    { fetch: localFetch }
  ));
  return client;
}

function getStructuredContent(result: CallToolResult): Record<string, unknown> {
  if (result.structuredContent) return result.structuredContent as Record<string, unknown>;
  const firstText = result.content.find((item) => item.type === "text");
  if (!firstText || firstText.type !== "text") throw new Error("Tool did not return a structured report.");
  return JSON.parse(firstText.text) as Record<string, unknown>;
}

function toolResponse(report: Record<string, unknown>): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(report) }],
    structuredContent: report
  };
}

function remoteToolHandler(
  name: "audit_url" | "gfic.audit_site",
  callback: (args: Record<string, unknown>) => Record<string, unknown>
): Handler {
  return createMcpHandler((server) => {
    if (name === "audit_url") {
      server.registerTool("audit_url", {
        inputSchema: z.object({
          url: z.string(),
          pageScope: z.enum(["homepage", "page", "template"]).optional()
        }),
        annotations: { readOnlyHint: true, destructiveHint: false }
      }, async (args) => toolResponse(callback(args)));
      return;
    }

    server.registerTool("gfic.audit_site", {
      inputSchema: z.object({
        url: z.string(),
        pageLimit: z.number().int().min(1).max(5).optional()
      }),
      annotations: { readOnlyHint: true, destructiveHint: false }
    }, async (args) => toolResponse(callback(args)));
  }, { serverInfo: { name: `provider-${name}`, version: "1.0.0" }, maxSubscriptions: 0 });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("EveryMCP audit MCP", () => {
  it("stays setup-pending until edge rate limiting and explicit activation are both present", async () => {
    expect(getAuditMcpGate({})).toMatchObject({ status: "setup-pending", enabled: false, edgeRateLimitReady: false });
    expect(getAuditMcpGate({ [AUDIT_MCP_ENABLED_ENV]: "true" })).toMatchObject({ status: "setup-pending", enabled: true, edgeRateLimitReady: false });
    expect(getAuditMcpGate({
      [AUDIT_MCP_ENABLED_ENV]: "true",
      [AUDIT_MCP_RATE_LIMIT_ENV]: "true"
    })).toMatchObject({ status: "active", enabled: true, edgeRateLimitReady: true });

    let handlerCalled = false;
    const gated = createGatedAuditMcpHandler(async () => {
      handlerCalled = true;
      return new Response("unexpected");
    }, () => ({}));
    const response = await gated(new Request("https://everymcp.test/api/mcp", { method: "POST", body: "{}" }));

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({ error: { code: "MCP_SETUP_PENDING", readiness: "/api/mcp/readiness" } });
    expect(handlerCalled).toBe(false);
  });

  it("reports providers truthfully without an upstream call", () => {
    const readiness = getAuditMcpReadiness({});
    expect(readiness.schemaVersion).toBe("everymcp.audit-mcp-readiness.1");
    expect(readiness.activation.status).toBe("setup-pending");
    expect(readiness.providers.map((provider) => [provider.id, provider.status])).toEqual([
      ["brandkit", "pending"],
      ["ogfixer", "ready"],
      ["getfoundinchat", "pending"]
    ]);
    expect(readiness.availableTools).toEqual([]);
    expect(readiness.bounds.portfolioAudit).toContain("not exposed");
  });

  it("caps chunked MCP requests even when content-length is absent", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(32_769));
        controller.close();
      }
    });
    const requestInit = {
      method: "POST",
      body: stream,
      duplex: "half" as const
    } as RequestInit & { duplex: "half" };
    const request = new Request("https://everymcp.test/api/mcp", requestInit);

    const bounded = await boundMcpRequest(request);
    expect(bounded).toBeInstanceOf(Response);
    if (bounded instanceof Response) {
      expect(bounded.status).toBe(413);
      expect(await bounded.json()).toMatchObject({ error: { code: "MCP_REQUEST_TOO_LARGE" } });
    }
  });

  it("rejects private or ambiguous URL shapes before calling any provider", async () => {
    const invalidUrls = [
      "http://localhost/",
      "http://127.0.0.1/",
      "http://2130706433/",
      "http://0x7f.1/",
      "http://[::1]/",
      "http://[::ffff:127.0.0.1]/",
      "https://site.internal/",
      "https://user:pass@public.example.com/",
      "https://@public.example.com/",
      "https://public.example.com:8443/",
      "https://public.example.com:80/",
      "http://public.example.com:443/",
      "https://public.example.com/?q=secret",
      "https://public.example.com/?",
      "https://public.example.com/#fragment",
      "https:public.example.com/"
    ];
    for (const url of invalidUrls) expect(validatePublicAuditUrl(url).ok, url).toBe(false);
    expect(validatePublicAuditUrl("https://owned.example.com/docs/page").ok).toBe(true);

    const providerCaller = vi.fn(async (): Promise<CallToolResult> => toolResponse({ schemaVersion: "should-not-run" }));
    const handler = createAuditMcpHandler({ providerCaller });
    const client = await connect(handler);
    try {
      const result = await client.callTool({ name: "audit_site", arguments: { url: "http://127.0.0.1/" } });
      const report = getStructuredContent(result);
      expect(report.status).toBe("rejected");
      expect(providerCaller).not.toHaveBeenCalled();
    } finally {
      await client.close();
    }
  });

  it("exposes only bounded public-audit tools and preserves provider JSON in partial output", async () => {
    const sourceResult = toolResponse({
      schemaVersion: "ogfixer.mcp.audit.v1",
      findings: [{ id: "og-title", evidence: { observed: "A title" } }],
      proofGaps: ["deployment proof unavailable"]
    });
    const providerCaller = vi.fn(async (provider: "ogfixer" | "getfoundinchat", url: string, pageLimit: number) => {
      expect(provider).toBe("ogfixer");
      expect(url).toBe("https://owned.example.com/release");
      expect(pageLimit).toBe(4);
      return sourceResult;
    });
    const handler = createAuditMcpHandler({
      environment: {},
      providerCaller
    });
    const client = await connect(handler);
    try {
      const listing = await client.listTools();
      expect(listing.tools.map((tool) => tool.name).sort()).toEqual(["audit_site", "get_audit_capabilities"]);
      const auditTool = listing.tools.find((tool) => tool.name === "audit_site");
      expect(auditTool?.inputSchema.properties).toMatchObject({ url: { type: "string" }, pageLimit: { type: "integer", minimum: 1, maximum: 5 } });
      expect(Object.keys(auditTool?.inputSchema.properties ?? {}).sort()).toEqual(["pageLimit", "url"]);

      const result = await client.callTool({
        name: "audit_site",
        arguments: { url: "https://owned.example.com/release", pageLimit: 4 }
      });
      const report = getStructuredContent(result);
      expect(report).toMatchObject({ schemaVersion: "everymcp.audit-site.1", status: "partial" });
      const providerResults = report.providerResults as Array<Record<string, unknown>>;
      expect(providerResults.map((item) => [item.provider, item.status])).toEqual([
        ["brandkit", "pending"],
        ["ogfixer", "completed"],
        ["getfoundinchat", "pending"]
      ]);
      expect(providerResults[1].reportContract).toBe("ogfixer.mcp.audit.v1");
      expect(providerResults[1].providerResult).toEqual(sourceResult);
      expect("score" in report).toBe(false);
      expect(providerCaller).toHaveBeenCalledTimes(1);

      const capabilityResult = await client.callTool({ name: "get_audit_capabilities", arguments: {} });
      expect(getStructuredContent(capabilityResult).schemaVersion).toBe("everymcp.audit-mcp-readiness.1");
    } finally {
      await client.close();
    }
  });

  it("returns a bounded per-provider error when an upstream report exceeds the response cap", async () => {
    const oversizedResult: CallToolResult = {
      content: [{ type: "text", text: JSON.stringify({ schemaVersion: "ogfixer.mcp.audit.v1", payload: "x".repeat(750_100) }) }],
      structuredContent: { schemaVersion: "ogfixer.mcp.audit.v1", payload: "x".repeat(750_100) }
    };
    const handler = createAuditMcpHandler({
      environment: {},
      providerCaller: async () => oversizedResult
    });
    const client = await connect(handler);
    try {
      const result = await client.callTool({
        name: "audit_site",
        arguments: { url: "https://owned.example.com/release" }
      });
      const report = getStructuredContent(result);
      const providerResults = report.providerResults as Array<Record<string, unknown>>;
      expect(report.status).toBe("unavailable");
      expect(providerResults[1]).toMatchObject({ status: "error", error: { code: "provider_response_too_large" } });
      expect(providerResults[1].providerResult).toBeUndefined();
    } finally {
      await client.close();
    }
  });

  it("does not label an unversioned or changed source result as a completed provider report", async () => {
    const handler = createAuditMcpHandler({
      environment: {},
      providerCaller: async () => toolResponse({ schemaVersion: "unexpected.report.9" })
    });
    const client = await connect(handler);
    try {
      const result = await client.callTool({
        name: "audit_site",
        arguments: { url: "https://owned.example.com/release" }
      });
      const report = getStructuredContent(result);
      const providerResults = report.providerResults as Array<Record<string, unknown>>;
      expect(report.status).toBe("unavailable");
      expect(providerResults[1]).toMatchObject({ status: "error", error: { code: "provider_contract_mismatch" } });
      expect(providerResults[1].providerResult).toBeUndefined();
    } finally {
      await client.close();
    }
  });

  it("uses fixed upstream MCP endpoints, checks read-only tool schemas, and preserves both source results", async () => {
    const ogReport = { schemaVersion: "ogfixer.mcp.audit.v1", findings: [{ evidence: "metadata" }] };
    const gficReport = { version: "gfic.site-audit.1", pages: [{ report: { schemaVersion: "gfic.readiness.2" } }] };
    const ogHandler = remoteToolHandler("audit_url", (args) => ({ ...ogReport, requested: args }));
    const gficHandler = remoteToolHandler("gfic.audit_site", (args) => ({ ...gficReport, requested: args }));
    const requested: Array<{ href: string; redirect: RequestRedirect | undefined }> = [];

    vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      const href = input instanceof Request ? input.url : input instanceof URL ? input.href : String(input);
      requested.push({ href, redirect: init?.redirect });
      const url = new URL(href);
      const handler = url.href === "https://ogfixer.com/api/mcp" ? ogHandler
        : url.href === "https://www.getfoundinchat.com/api/mcp" ? gficHandler
          : null;
      if (!handler) throw new Error(`Unexpected provider endpoint: ${href}`);
      const request = input instanceof Request ? input : new Request(input, init);
      return handler(request);
    });

    const handler = createAuditMcpHandler({
      environment: { [GETFOUND_READY_ENV]: "true" }
    });
    const client = await connect(handler);
    try {
      const result = await client.callTool({
        name: "audit_site",
        arguments: { url: "https://owned.example.com/release", pageLimit: 2 }
      });
      const report = getStructuredContent(result);
      expect(report.status).toBe("partial");
      const providerResults = report.providerResults as Array<Record<string, unknown>>;
      expect(providerResults[1].status).toBe("completed");
      expect(providerResults[1].providerResult).toMatchObject({ structuredContent: ogReport });
      expect(providerResults[2].status).toBe("completed");
      expect(providerResults[2].providerResult).toMatchObject({ structuredContent: gficReport });
      expect(requested.length).toBeGreaterThanOrEqual(4);
      expect(requested.every((request) => request.redirect === "error")).toBe(true);
      expect(new Set(requested.map((request) => new URL(request.href).origin))).toEqual(
        new Set(["https://ogfixer.com", "https://www.getfoundinchat.com"])
      );
      expect(requested.every((request) => new URL(request.href).pathname === "/api/mcp")).toBe(true);
    } finally {
      await client.close();
    }
  });
});
