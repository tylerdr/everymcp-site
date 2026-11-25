import { lookup } from "node:dns/promises";
import { Agent, request as httpsRequest, type RequestOptions } from "node:https";
import { BlockList, isIP } from "node:net";
import type { ClientRequest, IncomingMessage } from "node:http";
import { performance } from "node:perf_hooks";
import { normalizeSourceUrl } from "./source-contract";

export const SOURCE_BODY_LIMIT = 1024 * 1024;
export const ROBOTS_BODY_LIMIT = 65536;
export const USER_AGENT = "EveryMCP-SourceMonitor/1.0 (+https://everymcp.com/methodology)";
export type TransportFailure = "scanner_policy_refusal" | "timeout" | "tls_failure" | "dns_failure" | "transport_failure" | "partial_or_oversized_body";
export type ResponseBytes = { status: number | null; headers: Record<string, string>; body: Buffer; complete: boolean; receivedBytes: number; durationMs: number; failure: TransportFailure | null };
export type GetInput = { sourceUrl: string; kind: "source" | "robots"; timeoutMs: number; signal: AbortSignal; etag?: string | null; lastModified?: string | null };
export type SourceTransport = { readonly evidenceClass: "synthetic-fixture" | "server-collection"; get(input: GetInput): Promise<ResponseBytes> };
type Address = { address: string; family: number };
export type FixtureTransportIO = {
  resolve(hostname: string): Promise<Address[]>;
  dial(options: RequestOptions, onResponse: (response: IncomingMessage) => void): ClientRequest;
};
const denied4 = new BlockList();
for (const [address, prefix] of [["0.0.0.0",8],["10.0.0.0",8],["100.64.0.0",10],["127.0.0.0",8],["169.254.0.0",16],["172.16.0.0",12],["192.0.0.0",24],["192.0.2.0",24],["192.88.99.0",24],["192.168.0.0",16],["198.18.0.0",15],["198.51.100.0",24],["203.0.113.0",24],["224.0.0.0",4],["240.0.0.0",4]] as const) denied4.addSubnet(address, prefix, "ipv4");
const global6 = new BlockList(); global6.addSubnet("2000::", 3, "ipv6");
const denied6 = new BlockList();
// Conservatively exclude special-use/transition/documentation ranges, including globally
// reachable exceptions. IPv4-mapped, translation, local, multicast and zone forms are refused.
for (const [address, prefix] of [["2001::",23],["2001:db8::",32],["2002::",16],["3fff::",20]] as const) denied6.addSubnet(address, prefix, "ipv6");
export function isPublicAddress(address: string): boolean {
  if (address.includes("%")) return false;
  const family = isIP(address);
  return family === 4 ? !denied4.check(address, "ipv4") : family === 6 && global6.check(address, "ipv6") && !denied6.check(address, "ipv6");
}
export function safeConditional(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 && value.length <= 256 && /^[\x20-\x7e]+$/.test(value) ? value : null;
}
function failure(error: unknown): TransportFailure {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  if (/CERT|TLS|SSL|SELF_SIGNED|UNABLE_TO_VERIFY|DEPTH_ZERO/.test(code)) return "tls_failure";
  if (["ENOTFOUND", "EAI_AGAIN", "EAI_FAIL", "ENODATA"].includes(code)) return "dns_failure";
  return "transport_failure";
}
function makeTransport(io: FixtureTransportIO, evidenceClass: SourceTransport["evidenceClass"]): SourceTransport {
  return Object.freeze({ evidenceClass, async get(input: GetInput): Promise<ResponseBytes> {
    const began = performance.now();
    let request: ClientRequest | undefined, response: IncomingMessage | undefined, agent: Agent | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined, finished = false;
    let status: number | null = null, receivedBytes = 0;
    const headers: Record<string, string> = {};
    return new Promise<ResponseBytes>((resolve) => {
      const finish = (reason: TransportFailure | null, body = Buffer.alloc(0)) => {
        if (finished) return; finished = true;
        clearTimeout(timer); input.signal.removeEventListener("abort", abort);
        response?.destroy(); request?.destroy(); agent?.destroy();
        resolve({ status, headers, body: reason ? Buffer.alloc(0) : body, complete: reason === null, receivedBytes, durationMs: Math.max(0, Math.ceil(performance.now() - began)), failure: reason });
      };
      const abort = () => finish("timeout");
      if (input.signal.aborted) { finish("timeout"); return; }
      input.signal.addEventListener("abort", abort, { once: true });
      const timeout = Math.min(8000, input.timeoutMs);
      if (!Number.isFinite(timeout) || timeout <= 0) { finish("timeout"); return; }
      timer = setTimeout(abort, timeout);
      let url: URL;
      try {
        // Canonical equality refuses URL parser repairs (case, .git, default-port and path aliases).
        if (normalizeSourceUrl(input.sourceUrl) !== input.sourceUrl) throw new Error("Noncanonical source URL");
        url = new URL(input.sourceUrl);
      } catch { finish("scanner_policy_refusal"); return; }
      const maxBytes = input.kind === "robots" ? ROBOTS_BODY_LIMIT : SOURCE_BODY_LIMIT;
      void (async () => {
        let addresses: Address[];
        try { addresses = await io.resolve(url.hostname); }
        catch { if (!finished) finish("dns_failure"); return; }
        if (finished || input.signal.aborted) return; // Late DNS must never start a socket.
        if (!addresses.length || addresses.length > 32 || addresses.some(row => !isPublicAddress(row.address) || isIP(row.address) !== row.family)) { finish("scanner_policy_refusal"); return; }
        const address = addresses[0];
        const requestHeaders: Record<string, string> = { Host: url.hostname, "User-Agent": USER_AGENT, Accept: input.kind === "robots" ? "text/plain" : "text/html, text/markdown, text/plain", "Accept-Encoding": "identity", Connection: "close" };
        if (input.kind === "source") {
          const etag = safeConditional(input.etag), modified = safeConditional(input.lastModified);
          if (etag) requestHeaders["If-None-Match"] = etag;
          if (modified) requestHeaders["If-Modified-Since"] = modified;
        }
        const agentOptions: ConstructorParameters<typeof Agent>[0] & { proxyEnv: Record<string, string> } = { keepAlive: false, maxSockets: 1, proxyEnv: {} };
        agent = new Agent(agentOptions);
        const options: RequestOptions & { autoSelectFamily: false } = {
          protocol: "https:", hostname: url.hostname, port: 443, servername: url.hostname,
          method: "GET", path: input.kind === "robots" ? "/robots.txt" : url.pathname,
          headers: requestHeaders, agent, rejectUnauthorized: true, maxHeaderSize: 16384,
          family: address.family, autoSelectFamily: false,
          lookup: (_hostname, lookupOptions, callback) => {
            if (lookupOptions.all) callback(null, [{ address: address.address, family: address.family }]);
            else callback(null, address.address, address.family);
          },
        };
        try {
          request = io.dial(options, (incoming) => {
            if (finished) { incoming.destroy(); return; }
            response = incoming; status = incoming.statusCode ?? null;
            const wanted = new Set(["content-type", "content-encoding", "content-length", "etag", "last-modified", "retry-after"]), seen = new Set<string>();
            for (let i = 0; i < incoming.rawHeaders.length; i += 2) {
              const key = incoming.rawHeaders[i].toLowerCase(), value = incoming.rawHeaders[i + 1];
              if (!wanted.has(key)) continue;
              if (seen.has(key) || value.length > 1024 || /[^\x20-\x7e]/.test(value)) { finish("scanner_policy_refusal"); return; }
              seen.add(key); headers[key] = value;
            }
            if (status === null || status < 200 || status > 599 || (headers["content-encoding"] || "identity").trim().toLowerCase() !== "identity") { finish("scanner_policy_refusal"); return; }
            const declared = headers["content-length"];
            if (declared !== undefined && (!/^\d+$/.test(declared) || !Number.isSafeInteger(Number(declared)))) { finish("transport_failure"); return; }
            if (declared !== undefined && Number(declared) > maxBytes && status !== 304) { finish("partial_or_oversized_body"); return; }
            const chunks: Buffer[] = [];
            incoming.on("data", (chunk: Buffer) => {
              if (finished) return;
              receivedBytes += Math.min(chunk.length, maxBytes + 1 - receivedBytes);
              if (receivedBytes > maxBytes) { finish("partial_or_oversized_body"); return; }
              chunks.push(Buffer.from(chunk));
            });
            incoming.on("aborted", () => finish("transport_failure"));
            incoming.on("error", () => finish("transport_failure"));
            incoming.on("end", () => {
              if (!incoming.complete || status !== 304 && declared !== undefined && receivedBytes !== Number(declared)) { finish("transport_failure"); return; }
              finish(null, Buffer.concat(chunks));
            });
          });
          request.on("error", error => finish(failure(error)));
          request.on("upgrade", (_response, socket) => { socket.destroy(); finish("scanner_policy_refusal"); });
          if (finished) request.destroy(); else request.end();
        } catch (error) { finish(failure(error)); }
      })();
    });
  } });
}
/** Production transport has no override/loopback/proxy/certificate-disable option. No request occurs until get(). */
export function createPublicSourceTransport(): SourceTransport {
  return makeTransport({ resolve: hostname => lookup(hostname, { all: true, verbatim: true }), dial: (options, onResponse) => httpsRequest(options, onResponse) }, "server-collection");
}
/** Explicit test dependency injection; this origin is always synthetic, never provider-attested. */
export function createFixtureSourceTransport(io: FixtureTransportIO): SourceTransport { return makeTransport(io, "synthetic-fixture"); }
