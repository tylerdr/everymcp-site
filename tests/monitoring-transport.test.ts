import { createServer } from "node:net";
import { request } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createFixtureSourceTransport, isPublicAddress, ROBOTS_BODY_LIMIT, SOURCE_BODY_LIMIT, type GetInput } from "../lib/monitoring/transport";
import { loopback } from "./fixtures/monitoring-node/loopback";
const cleanups: (() => Promise<void>)[] = [];
afterEach(async () => { vi.useRealTimers(); for (const close of cleanups.splice(0)) await close(); });
const input = (path = "/example/mcp", extra: Partial<GetInput> = {}): GetInput => ({ sourceUrl: "https://github.com" + path, kind: "source", timeoutMs: 1000, signal: new AbortController().signal, ...extra });
describe("bounded Node source transport with synthetic loopback dialing", () => {
  it("reads complete bytes, pins a validated address, preserves TLS identity and sends only bounded conditional headers", async () => {
    const local = await loopback((_req,res) => { res.setHeader("Content-Type", "text/plain; charset=utf-8"); res.end("fixture body"); }); cleanups.push(local.close);
    const result = await local.transport.get(input(undefined, { etag: '"old"', lastModified: "bad\r\nInjected: x" }));
    expect(local.transport.evidenceClass).toBe("synthetic-fixture"); expect(result.complete).toBe(true); expect(result.body.toString()).toBe("fixture body");
    const opts = local.options[0]; expect(opts).toMatchObject({ protocol: "https:", hostname: "github.com", port: 443, servername: "github.com", rejectUnauthorized: true, maxHeaderSize: 16384 });
    const callback = vi.fn(); opts.lookup!("github.com", { family: 4, hints: 0, all: false }, callback); expect(callback).toHaveBeenCalledWith(null, "93.184.216.34", 4);
    expect(local.calls[0].headers["if-none-match"]).toBe('"old"'); expect(local.calls[0].headers["if-modified-since"]).toBeUndefined();
    expect(local.calls[0].headers.host).toBe("github.com"); expect(local.calls[0].headers["accept-encoding"]).toBe("identity"); expect(local.calls[0].headers.cookie).toBeUndefined(); expect(local.calls[0].headers.authorization).toBeUndefined();
  });
  it("rejects unsafe URL forms before DNS and every mixed/special-use DNS answer before dialing", async () => {
    const resolve = vi.fn(async () => [{ address: "93.184.216.34", family: 4 }, { address: "127.0.0.1", family: 4 }]), dial = vi.fn();
    const transport = createFixtureSourceTransport({ resolve, dial });
    for (const sourceUrl of ["http://github.com/example/mcp", "https://github.com:443/example/mcp", "https://user@github.com/example/mcp", "https://github.com/example/../mcp", "https://github.com/example/%2e%2e", "https://github.com/example/mcp?key=x", "https://127.1/example/mcp", "https://github.com.evil.invalid/example/mcp", "https://github.com/example/mcp#x"]) expect((await transport.get(input(undefined, { sourceUrl }))).failure).toBe("scanner_policy_refusal");
    expect(resolve).not.toHaveBeenCalled();
    expect((await transport.get(input())).failure).toBe("scanner_policy_refusal"); expect(dial).not.toHaveBeenCalled();
    for (const address of ["0.0.0.0","10.0.0.1","100.64.0.1","127.0.0.1","169.254.169.254","172.16.0.1","192.168.1.1","192.0.2.1","198.18.0.1","203.0.113.1","224.1.1.1","255.255.255.255","::1","::ffff:127.0.0.1","::ffff:8.8.8.8","fe80::1","fc00::1","ff02::1","64:ff9b::808:808","2001:db8::1","2002:7f00:1::","3fff::1","fe80::1%eth0"]) expect(isPublicAddress(address), address).toBe(false);
    expect(isPublicAddress("8.8.8.8")).toBe(true); expect(isPublicAddress("2606:4700::1111")).toBe(true);
  });
  it("never dials after DNS deadline/abort and does not retry failed resolution or TLS", async () => {
    vi.useFakeTimers(); let settle!: (rows: { address: string; family: number }[]) => void;
    const dial = vi.fn(), resolve = vi.fn(() => new Promise<{ address: string; family: number }[]>(done => { settle = done; }));
    const transport = createFixtureSourceTransport({ resolve, dial });
    const pending = transport.get(input(undefined, { timeoutMs: 20 })); await vi.advanceTimersByTimeAsync(21); expect((await pending).failure).toBe("timeout");
    settle([{ address: "93.184.216.34", family: 4 }]); await Promise.resolve(); expect(dial).not.toHaveBeenCalled();
    const controller = new AbortController(); const aborted = transport.get(input(undefined, { signal: controller.signal })); controller.abort(); expect((await aborted).failure).toBe("timeout"); settle([{ address: "93.184.216.34", family: 4 }]); await Promise.resolve(); expect(dial).not.toHaveBeenCalled();
    const failed = createFixtureSourceTransport({ resolve: async () => { throw new Error("DNS failure fixture"); }, dial }); expect((await failed.get(input())).failure).toBe("dns_failure");
    const tls = createFixtureSourceTransport({ resolve: async () => [{ address: "93.184.216.34", family: 4 }], dial: () => { throw Object.assign(new Error("fictional TLS failure"), { code: "ERR_TLS_CERT_ALTNAME_INVALID" }); } }); expect((await tls.get(input())).failure).toBe("tls_failure");
  });
  it("bounds body/header bytes, refuses encoding and keeps redirects unfollowed", async () => {
    const local = await loopback((req,res) => {
      if (req.url?.endsWith("/large")) { res.writeHead(200); res.write(Buffer.alloc(SOURCE_BODY_LIMIT)); res.end("extra"); }
      else if (req.url?.endsWith("/headers")) { res.setHeader("x-big", "a".repeat(20000)); res.end("body"); }
      else if (req.url?.endsWith("/gzip")) { res.setHeader("Content-Encoding", "gzip"); res.end("encoded"); }
      else if (req.url === "/robots.txt") res.end("a".repeat(ROBOTS_BODY_LIMIT + 1));
      else { res.writeHead(302, { Location: "http://127.0.0.1/private" }); res.end("redirect fixture"); }
    }); cleanups.push(local.close);
    for (const [path, reason] of [["large", "partial_or_oversized_body"],["headers","transport_failure"],["gzip","scanner_policy_refusal"]]) { const result = await local.transport.get(input("/example/mcp/" + path)); expect(result.failure).toBe(reason); expect(result.body.length).toBe(0); expect(result.receivedBytes).toBeLessThanOrEqual(SOURCE_BODY_LIMIT + 1); }
    expect((await local.transport.get(input(undefined, { kind: "robots" }))).failure).toBe("partial_or_oversized_body");
    const before = local.calls.length, redirect = await local.transport.get(input()); expect(redirect.status).toBe(302); expect(local.calls.length).toBe(before + 1);
  });
  it("discards truncated framing and times out stalled headers/body streams", async () => {
    const raw = createServer(socket => { socket.once("data", () => socket.end("HTTP/1.1 200 OK\r\nContent-Length: 100\r\n\r\nshort")); });
    await new Promise<void>(resolve => raw.listen(0, "127.0.0.1", resolve)); cleanups.push(() => new Promise(resolve => raw.close(() => resolve())));
    const port = (raw.address() as AddressInfo).port;
    const transport = createFixtureSourceTransport({ resolve: async () => [{ address: "93.184.216.34", family: 4 }], dial: (opts, callback) => request({ hostname: "127.0.0.1", port, path: opts.path, agent: false }, callback) });
    const truncated = await transport.get(input()); expect(truncated.failure).toBe("transport_failure"); expect(truncated.body.length).toBe(0);
    const local = await loopback((req,res) => { if (req.url?.endsWith("/body")) { res.writeHead(200); res.write("partial"); } }); cleanups.push(local.close);
    for (const path of ["/example/mcp/headers", "/example/mcp/body"]) { const result = await local.transport.get(input(path, { timeoutMs: 30 })); expect(result.failure).toBe("timeout"); expect(result.body.length).toBe(0); }
  });
});
