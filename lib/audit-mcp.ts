import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import type { CallToolResult, FetchLike } from "@modelcontextprotocol/client";
import { createMcpHandler } from "mcp-handler";
import { isIP } from "node:net";
import { z } from "zod";

export const AUDIT_MCP_SCHEMA_VERSION = "everymcp.audit-site.1" as const;
export const READINESS_SCHEMA_VERSION = "everymcp.audit-mcp-readiness.1" as const;
export const AUDIT_MCP_ENABLED_ENV = "EVERYMCP_AUDIT_MCP_ENABLED";
export const AUDIT_MCP_RATE_LIMIT_ENV = "EVERYMCP_AUDIT_MCP_EDGE_RATE_LIMIT_READY";
export const GETFOUND_READY_ENV = "GETFOUNDINCHAT_AUDIT_MCP_READY";

const MAX_URL_LENGTH = 2048;
const MAX_REQUEST_BYTES = 32_768;
const MAX_PROVIDER_RESPONSE_BYTES = 750_000;
const PROVIDER_TIMEOUT_MS = 18_000;
const DEFAULT_PAGE_LIMIT = 3;

const OG_FIXER_ENDPOINT = "https://ogfixer.com/api/mcp";
const GETFOUND_ENDPOINT = "https://www.getfoundinchat.com/api/mcp";

type Environment = Record<string, string | undefined>;
export type ProviderId = "brandkit" | "ogfixer" | "getfoundinchat";
export type ProviderStatus = "ready" | "pending";
export type ProviderCallId = "ogfixer" | "getfoundinchat";
export type ProviderFailureCode =
  | "provider_unavailable"
  | "provider_timeout"
  | "provider_contract_mismatch"
  | "provider_tool_error"
  | "provider_response_too_large";

export interface ProviderAvailability {
  id: ProviderId;
  status: ProviderStatus;
  endpoint: string | null;
  tool: string | null;
  reportContract: string | null;
  evidenceLevel: string;
  reason: string | null;
}

export interface AuditMcpGate {
  enabled: boolean;
  edgeRateLimitReady: boolean;
  status: "active" | "setup-pending";
  reason: string | null;
}

export type ProviderCaller = (
  provider: ProviderCallId,
  url: string,
  pageLimit: number,
  signal: AbortSignal
) => Promise<CallToolResult>;

export interface AuditMcpDependencies {
  environment?: Environment;
  providerCaller?: ProviderCaller;
  now?: () => number;
}

interface ProviderResult {
  provider: ProviderId;
  tool: string | null;
  endpoint: string | null;
  reportContract: string | null;
  status: "completed" | "pending" | "error";
  evidenceLevel: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  providerResult?: CallToolResult;
  error?: { code: ProviderFailureCode };
  reason?: string;
}

interface AuditSiteReport {
  schemaVersion: typeof AUDIT_MCP_SCHEMA_VERSION;
  status: "completed" | "partial" | "unavailable" | "rejected";
  requested: {
    url: string;
    pageLimit: number;
  };
  startedAt: string;
  completedAt: string;
  durationMs: number;
  providerResults: ProviderResult[];
  limitations: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getAuditMcpGate(environment: Environment = process.env): AuditMcpGate {
  const enabled = environment[AUDIT_MCP_ENABLED_ENV] === "true";
  const edgeRateLimitReady = environment[AUDIT_MCP_RATE_LIMIT_ENV] === "true";

  if (!edgeRateLimitReady) {
    return {
      enabled,
      edgeRateLimitReady,
      status: "setup-pending",
      reason: "The durable production edge rate-limit rule has not been independently verified."
    };
  }

  if (!enabled) {
    return {
      enabled,
      edgeRateLimitReady,
      status: "setup-pending",
      reason: "The MCP route remains disabled until an operator explicitly enables it after the edge rule is verified."
    };
  }

  return {
    enabled,
    edgeRateLimitReady,
    status: "active",
    reason: null
  };
}

export function getProviderAvailability(environment: Environment = process.env): ProviderAvailability[] {
  const getFoundReady = environment[GETFOUND_READY_ENV] === "true";

  return [
    {
      id: "brandkit",
      status: "pending",
      endpoint: null,
      tool: null,
      reportContract: null,
      evidenceLevel: "none",
      reason: "BrandKit's hosted MCP is live under scoped auth, but EveryMCP lacks an approved production brandbook, credential/read permission, and exact tool/schema handoff."
    },
    {
      id: "ogfixer",
      status: "ready",
      endpoint: OG_FIXER_ENDPOINT,
      tool: "audit_url",
      reportContract: "ogfixer.mcp.audit.v1",
      evidenceLevel: "provider-reported metadata, asset checks, findings, and proof gaps",
      reason: "The provider's own request limit is best-effort per runtime; EveryMCP's edge rate-limit gate is still required."
    },
    {
      id: "getfoundinchat",
      status: getFoundReady ? "ready" : "pending",
      endpoint: GETFOUND_ENDPOINT,
      tool: "gfic.audit_site",
      reportContract: "gfic.site-audit.1",
      evidenceLevel: "provider-reported page checks, coverage, confidence, evidence, and nested rubric reports",
      reason: getFoundReady
        ? null
        : "The production MCP endpoint reports setup-pending until its firewall/rate-limit readiness receipt is verified."
    }
  ];
}

export function getAuditMcpReadiness(environment: Environment = process.env) {
  const gate = getAuditMcpGate(environment);
  const providers = getProviderAvailability(environment);
  const readyProviderCount = providers.filter((provider) => provider.status === "ready").length;

  return {
    schemaVersion: READINESS_SCHEMA_VERSION,
    endpoint: "/api/mcp",
    activation: gate,
    availability: readyProviderCount === providers.length
      ? "ready"
      : readyProviderCount === 0
        ? "unavailable"
        : "partial",
    providers,
    availableTools: gate.status === "active" ? ["get_audit_capabilities", "audit_site"] : [],
    bounds: {
      sitesPerCall: 1,
      getFoundPageLimit: { minimum: 1, maximum: 5, default: DEFAULT_PAGE_LIMIT },
      providerTimeoutMs: PROVIDER_TIMEOUT_MS,
      inboundRequestBytes: MAX_REQUEST_BYTES,
      providerResponseBytes: MAX_PROVIDER_RESPONSE_BYTES,
      portfolioAudit: "not exposed; no safe caller identity or tenant scope is established"
    }
  } as const;
}

export function validatePublicAuditUrl(value: string): { ok: true; url: string } | { ok: false } {
  if (value.length === 0 || value.length > MAX_URL_LENGTH || value.trim() !== value) return { ok: false };
  if (!/^https?:\/\//i.test(value)) return { ok: false };
  if (value.includes("?") || value.includes("#")) return { ok: false };

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { ok: false };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return { ok: false };
  const authority = value.slice(value.indexOf("://") + 3).split(/[/?#]/, 1)[0] ?? "";
  if (authority.includes("@") || parsed.username || parsed.password || parsed.search || parsed.hash) return { ok: false };
  if (parsed.port !== "") return { ok: false };

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, "");
  if (!hostname.includes(".") || isIP(hostname.replace(/^\[|\]$/g, "")) !== 0) return { ok: false };
  if (hostname.split(".").some((label) => label.length === 0 || label.length > 63)) return { ok: false };

  const reservedSuffixes = ["localhost", "local", "internal", "test", "invalid", "example", "home", "lan"];
  if (reservedSuffixes.some((suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`))) {
    return { ok: false };
  }

  return { ok: true, url: parsed.toString() };
}

function toMcpResult(value: Record<string, unknown>, isError = false) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value) }],
    structuredContent: value,
    ...(isError ? { isError: true } : {})
  };
}

function statusResult(
  provider: ProviderAvailability,
  now: () => number,
  caller: ProviderCaller,
  url: string,
  pageLimit: number
): Promise<ProviderResult> | ProviderResult {
  if (provider.status !== "ready" || (provider.id !== "ogfixer" && provider.id !== "getfoundinchat")) {
    return {
      provider: provider.id,
      tool: provider.tool,
      endpoint: provider.endpoint,
      reportContract: provider.reportContract,
      status: "pending",
      evidenceLevel: provider.evidenceLevel,
      reason: provider.reason ?? "No verified executable provider tool is available."
    };
  }

  return runProvider(provider, now, caller, url, pageLimit);
}

async function runProvider(
  provider: ProviderAvailability,
  now: () => number,
  caller: ProviderCaller,
  url: string,
  pageLimit: number
): Promise<ProviderResult> {
  const started = now();
  const startedAt = new Date(started).toISOString();
  const abortSignal = AbortSignal.timeout(PROVIDER_TIMEOUT_MS);

  try {
    const providerResult = await caller(provider.id as ProviderCallId, url, pageLimit, abortSignal);
    if (!isRecord(providerResult) || providerResult.isError === true) {
      throw new ProviderCallFailure("provider_tool_error");
    }
    assertProviderResultContract(provider.id as ProviderCallId, providerResult);

    const serialized = JSON.stringify(providerResult);
    if (typeof serialized !== "string" || new TextEncoder().encode(serialized).byteLength > MAX_PROVIDER_RESPONSE_BYTES) {
      throw new ProviderCallFailure("provider_response_too_large");
    }

    const completed = now();
    return {
      provider: provider.id,
      tool: provider.tool,
      endpoint: provider.endpoint,
      reportContract: provider.reportContract,
      status: "completed",
      evidenceLevel: provider.evidenceLevel,
      startedAt,
      completedAt: new Date(completed).toISOString(),
      durationMs: Math.max(0, completed - started),
      providerResult
    };
  } catch (error) {
    const completed = now();
    const code = toProviderFailureCode(error, abortSignal.aborted);
    return {
      provider: provider.id,
      tool: provider.tool,
      endpoint: provider.endpoint,
      reportContract: provider.reportContract,
      status: "error",
      evidenceLevel: "none",
      startedAt,
      completedAt: new Date(completed).toISOString(),
      durationMs: Math.max(0, completed - started),
      error: { code }
    };
  }
}

class ProviderCallFailure extends Error {
  readonly code: ProviderFailureCode;

  constructor(code: ProviderFailureCode) {
    super(code);
    this.name = "ProviderCallFailure";
    this.code = code;
  }
}

function toProviderFailureCode(error: unknown, timedOut: boolean): ProviderFailureCode {
  if (error instanceof ProviderCallFailure) return error.code;
  if (timedOut || (error instanceof Error && error.name === "TimeoutError")) return "provider_timeout";
  if (error instanceof Error && /too large/i.test(error.message)) return "provider_response_too_large";
  if (error instanceof Error && /contract/i.test(error.message)) return "provider_contract_mismatch";
  return "provider_unavailable";
}

function jsonObject(value: unknown): Record<string, unknown> | null {
  return isRecord(value) ? value : null;
}

function assertProviderResultContract(provider: ProviderCallId, result: CallToolResult): void {
  const expected = provider === "ogfixer" ? "ogfixer.mcp.audit.v1" : "gfic.site-audit.1";
  const versionField = provider === "ogfixer" ? "schemaVersion" : "version";
  const structured = jsonObject(result.structuredContent);

  if (structured?.[versionField] === expected) return;

  const textContent = result.content.find((content) => content.type === "text");
  if (textContent?.type === "text") {
    try {
      const parsed = jsonObject(JSON.parse(textContent.text));
      if (parsed?.[versionField] === expected) return;
    } catch {
      // A non-JSON text block does not establish the expected versioned report contract.
    }
  }

  throw new ProviderCallFailure("provider_contract_mismatch");
}

function assertProviderToolContract(
  provider: ProviderCallId,
  inputSchema: unknown,
  annotations: unknown
): void {
  const schema = jsonObject(inputSchema);
  const properties = schema ? jsonObject(schema.properties) : null;
  const required = schema && Array.isArray(schema.required) ? schema.required : null;
  const urlProperty = properties ? jsonObject(properties.url) : null;
  const annotationObject = jsonObject(annotations);

  if (
    !schema ||
    schema.type !== "object" ||
    !properties ||
    !urlProperty ||
    urlProperty.type !== "string" ||
    !required ||
    required.length !== 1 ||
    required[0] !== "url"
  ) {
    throw new ProviderCallFailure("provider_contract_mismatch");
  }
  if (annotationObject?.readOnlyHint !== true || annotationObject.destructiveHint !== false) {
    throw new ProviderCallFailure("provider_contract_mismatch");
  }

  if (provider === "ogfixer") {
    const propertyNames = Object.keys(properties).sort();
    if (propertyNames.join(",") !== "brandContract,pageScope,url") {
      throw new ProviderCallFailure("provider_contract_mismatch");
    }
    const pageScope = properties ? jsonObject(properties.pageScope) : null;
    const choices = pageScope && Array.isArray(pageScope.enum)
      ? pageScope.enum.filter((item): item is string => typeof item === "string")
      : [];
    if (
      pageScope?.type !== "string" ||
      choices.length !== 3 ||
      !choices.includes("homepage") ||
      !choices.includes("page") ||
      !choices.includes("template")
    ) {
      throw new ProviderCallFailure("provider_contract_mismatch");
    }
    return;
  }

  const propertyNames = Object.keys(properties).sort();
  if (propertyNames.join(",") !== "pageLimit,url") {
    throw new ProviderCallFailure("provider_contract_mismatch");
  }
  const pageLimit = properties ? jsonObject(properties.pageLimit) : null;
  if (
    !pageLimit ||
    pageLimit.type !== "integer" ||
    pageLimit.minimum !== 1 ||
    pageLimit.maximum !== 5
  ) {
    throw new ProviderCallFailure("provider_contract_mismatch");
  }
}

function providerEndpoint(provider: ProviderCallId): URL {
  return new URL(provider === "ogfixer" ? OG_FIXER_ENDPOINT : GETFOUND_ENDPOINT);
}

async function readBoundedResponse(response: Response, maximumBytes: number): Promise<Response> {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maximumBytes) {
    await response.body?.cancel();
    throw new ProviderCallFailure("provider_response_too_large");
  }
  if (!response.body || response.status === 204 || response.status === 304) return response;

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > maximumBytes) {
        await reader.cancel();
        throw new ProviderCallFailure("provider_response_too_large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new Response(bytes, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
}

async function callVerifiedProvider(
  provider: ProviderCallId,
  url: string,
  pageLimit: number,
  timeoutSignal: AbortSignal
): Promise<CallToolResult> {
  const endpoint = providerEndpoint(provider);
  const toolName = provider === "ogfixer" ? "audit_url" : "gfic.audit_site";
  const localFetch: FetchLike = async (input, init) => {
    const inputUrl = input instanceof Request
      ? input.url
      : input instanceof URL
        ? input.href
        : String(input);
    const target = new URL(inputUrl);
    if (
      target.origin !== endpoint.origin ||
      target.pathname !== endpoint.pathname ||
      target.search !== "" ||
      target.hash !== ""
    ) {
      throw new Error("The remote MCP endpoint is outside the fixed provider allowlist.");
    }

    const requestMethod = init?.method ?? (input instanceof Request ? input.method : "GET");
    if (requestMethod.toUpperCase() !== "POST") throw new Error("Only POST is allowed to fixed MCP endpoints.");

    const headers = new Headers(input instanceof Request ? input.headers : undefined);
    new Headers(init?.headers).forEach((value, key) => headers.set(key, value));
    if (headers.has("authorization")) throw new Error("No provider credentials are configured for this public audit call.");

    const requestSignal = init?.signal;
    const signal = requestSignal
      ? AbortSignal.any([requestSignal, timeoutSignal])
      : timeoutSignal;
    const response = await fetch(input, {
      ...init,
      method: requestMethod,
      headers,
      redirect: "error",
      signal
    });
    return readBoundedResponse(response, MAX_PROVIDER_RESPONSE_BYTES);
  };

  const client = new Client(
    { name: "everymcp-audit-bundle", version: "1.0.0" },
    { versionNegotiation: { mode: "legacy" }, listMaxPages: 1 }
  );
  const transport = new StreamableHTTPClientTransport(endpoint, {
    fetch: localFetch,
    onInsufficientScope: "throw"
  });

  try {
    await client.connect(transport);
    const listing = await client.listTools({ cursor: undefined }, { cacheMode: "bypass" });
    const tool = listing.tools.find((candidate) => candidate.name === toolName);
    if (!tool) throw new ProviderCallFailure("provider_contract_mismatch");
    assertProviderToolContract(provider, tool.inputSchema, tool.annotations);

    const args = provider === "ogfixer"
      ? { url, pageScope: new URL(url).pathname === "/" ? "homepage" : "page" }
      : { url, pageLimit };
    const result = await client.callTool({ name: toolName, arguments: args }, { toolDefinition: tool });
    if (result.isError === true) throw new ProviderCallFailure("provider_tool_error");
    return result;
  } finally {
    await client.close();
  }
}

const defaultProviderCaller: ProviderCaller = (provider, url, pageLimit, signal) =>
  callVerifiedProvider(provider, url, pageLimit, signal);

export function createAuditMcpHandler(dependencies: AuditMcpDependencies = {}) {
  const environment = dependencies.environment ?? process.env;
  const now = dependencies.now ?? (() => Date.now());
  const caller = dependencies.providerCaller ?? defaultProviderCaller;

  return createMcpHandler((server) => {
    server.registerTool(
      "get_audit_capabilities",
      {
        title: "Get SEO, AEO, and GEO audit readiness",
        description: "Return EveryMCP bundle and provider readiness without scanning a site.",
        inputSchema: z.object({}).strict(),
        annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false }
      },
      async () => toMcpResult(getAuditMcpReadiness(environment) as unknown as Record<string, unknown>)
    );

    server.registerTool(
      "audit_site",
      {
        title: "Audit a public site for SEO, AEO, GEO, and brand assets",
        description: "Run the verified read-only provider audits for one public site. GetFoundInChat can scan 1–5 pages; OGFixer checks one URL. Pending providers are reported without being called. Provider reports and scores remain separate; this tool does not invent a unified score. Requires the EveryMCP public rate-limit gate to be activated.",
        inputSchema: z.object({
          url: z.string().min(8).max(MAX_URL_LENGTH).describe("Public HTTP(S) page URL without credentials, query, or fragment."),
          pageLimit: z.number().int().min(1).max(5).optional().describe("GetFoundInChat page cap, 1 to 5; defaults to 3.")
        }).strict(),
        annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true }
      },
      async ({ url, pageLimit }) => {
        const started = now();
        const startedAt = new Date(started).toISOString();
        const validated = validatePublicAuditUrl(url);
        const boundedPageLimit = pageLimit ?? DEFAULT_PAGE_LIMIT;

        if (!validated.ok) {
          const rejected: AuditSiteReport = {
            schemaVersion: AUDIT_MCP_SCHEMA_VERSION,
            status: "rejected",
            requested: { url, pageLimit: boundedPageLimit },
            startedAt,
            completedAt: new Date(now()).toISOString(),
            durationMs: Math.max(0, now() - started),
            providerResults: [],
            limitations: ["Target must be a public HTTP(S) hostname URL without credentials, query, fragment, IP literal, or nonstandard port."]
          };
          return toMcpResult(rejected as unknown as Record<string, unknown>, true);
        }

        const availability = getProviderAvailability(environment);
        const providerResults = await Promise.all(
          availability.map((provider) => statusResult(provider, now, caller, validated.url, boundedPageLimit))
        );
        const completedCount = providerResults.filter((provider) => provider.status === "completed").length;
        const hasPending = providerResults.some((provider) => provider.status === "pending");
        const hasError = providerResults.some((provider) => provider.status === "error");
        const status: AuditSiteReport["status"] = completedCount === 0
          ? "unavailable"
          : hasPending || hasError
            ? "partial"
            : "completed";
        const completed = now();

        const report: AuditSiteReport = {
          schemaVersion: AUDIT_MCP_SCHEMA_VERSION,
          status,
          requested: { url: validated.url, pageLimit: boundedPageLimit },
          startedAt,
          completedAt: new Date(completed).toISOString(),
          durationMs: Math.max(0, completed - started),
          providerResults,
          limitations: [
            "Provider results are independent and are returned without a blended score.",
            "Each upstream provider is responsible for DNS, redirect, and private-address checks when it fetches the target.",
            "This tool does not access Search Console, analytics, AI-engine query placement, or deployment/browser proof unless an upstream report explicitly includes that evidence.",
            "Results are not persisted; no write or remediation action is performed."
          ]
        };

        return toMcpResult(report as unknown as Record<string, unknown>);
      }
    );
  }, {
    serverInfo: { name: "everymcp-audit-bundle", version: "1.0.0" },
    maxSubscriptions: 0
  });
}

export async function boundMcpRequest(request: Request): Promise<Request | Response> {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    await request.body?.cancel();
    return requestTooLargeResponse();
  }
  if (!request.body) return request;

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > MAX_REQUEST_BYTES) {
        await reader.cancel();
        return requestTooLargeResponse();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body: bytes,
    signal: request.signal
  });
}

function requestTooLargeResponse(): Response {
  return Response.json({
    error: {
      code: "MCP_REQUEST_TOO_LARGE",
      message: `MCP requests are limited to ${MAX_REQUEST_BYTES} bytes.`
    }
  }, { status: 413, headers: { "Cache-Control": "no-store" } });
}

export function createGatedAuditMcpHandler(
  handler: (request: Request) => Promise<Response>,
  environment: () => Environment = () => process.env
): (request: Request) => Promise<Response> {
  return async (request) => {
    const gate = getAuditMcpGate(environment());
    if (gate.status !== "active") {
      return Response.json({
        error: {
          code: "MCP_SETUP_PENDING",
          message: gate.reason,
          readiness: "/api/mcp/readiness",
          requiredEnvironment: [AUDIT_MCP_RATE_LIMIT_ENV, AUDIT_MCP_ENABLED_ENV]
        }
      }, {
        status: 503,
        headers: { "Cache-Control": "no-store", "Retry-After": "300" }
      });
    }

    const boundedRequest = await boundMcpRequest(request);
    if (boundedRequest instanceof Response) return boundedRequest;
    return handler(boundedRequest);
  };
}
