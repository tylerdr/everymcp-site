import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createNodeCollector } from "../lib/monitoring/collector";
import { admitRuntimeReceipt, createMonitoringRuntime, type Job } from "../lib/monitoring/runtime";
import { sha256, type SourceReport } from "../lib/monitoring/source-contract";
import { AUTHORITY, FictionalCustody, fixture, harness, OWNER, request, SCOPE, WATCHLIST } from "./fixtures/monitoring-node/runtime-fixture";
import { loopback } from "./fixtures/monitoring-node/loopback";
const close: (() => Promise<void>)[] = [], directories: string[] = [];
afterEach(async () => { for (const cleanup of close.splice(0)) await cleanup(); for (const dir of directories.splice(0)) rmSync(dir, { recursive: true, force: true }); });
const URL = "https://github.com/example/mcp";
const HTML = '<html><body><h1>Requirements</h1><p>Node 18 required.</p><pre>npm install example@1\n  --save</pre></body></html>';
function captureJob(stamp: string, prior: string[] = [], sourceUrls = [URL], slugs = ["example-mcp"]): Job {
  return { scope: SCOPE, ownerKey: OWNER, watchlistId: WATCHLIST, version: 1, slugs, periodStart: new Date(Date.parse(stamp) - 86400000).toISOString(), periodEnd: stamp, kind: "capture", sourceUrls, receiptIds: prior };
}
async function source(h: ReturnType<typeof harness>, receiptId: string) {
  const original = (await h.store.getExecutionByReceipt(receiptId))!;
  return JSON.parse(original.sourceBytes!.toString()) as SourceReport;
}
describe("real Node collector to custody, useful history and original recovery using loopback fixtures", () => {
  it("captures two meaningful periods through real streams, preserves v2 predecessor provenance, and recovers identical bytes in another process", async () => {
    let body = HTML;
    const local = await loopback((req,res) => {
      if (req.url === "/robots.txt") { res.setHeader("Content-Type", "text/plain"); res.end("User-agent: *\nAllow: /\n"); }
      else { res.setHeader("Content-Type", "text/html; charset=utf-8"); res.setHeader("ETag", '"fictional"'); res.end(body); }
    }); close.push(local.close);
    const dir = mkdtempSync(join(tmpdir(), "everymcp-loopback-custody-")); directories.push(dir);
    const h = harness(new FictionalCustody(dir)); h.deps.collectCanonicalSources = createNodeCollector({ now: h.deps.now, transport: local.transport });
    h.setClock("2026-11-01T00:00:00Z"); const one = await h.runtime.run(request(), h.add(captureJob("2026-11-01T00:00:00Z")));
    body = HTML.replace("Node 18", "Node 20").replace("example@1", "example@2"); h.setClock("2026-11-09T00:00:00Z");
    const two = await h.runtime.run(request(), h.add(captureJob("2026-11-09T00:00:00Z", [one.receiptId])));
    const report = await h.report([one.receiptId, two.receiptId]), original = (await h.runtime.recover(request(), report.jobId))!;
    expect(original.toString()).toContain("Node 18 required"); expect(original.toString()).toContain("Node 20 required"); expect(original.toString()).toContain("captured_representation_changed"); expect(original.toString()).toContain("vercel-next-custody-v2");
    const row = await h.store.getExecutionByReceipt(two.receiptId); expect(JSON.parse(row!.receiptBytes.toString()).inputReceiptIds).toEqual([one.receiptId]);
    expect(local.calls.map(call => call.path)).toEqual(["/robots.txt", "/example/mcp", "/robots.txt", "/example/mcp"]);
    expect(local.calls[3].headers["if-none-match"]).toBe('"fictional"');
    writeFileSync(join(dir, "expected.json"), JSON.stringify(report));
    const output = execFileSync(process.execPath, ["node_modules/vitest/vitest.mjs", "run", "tests/fixtures/monitoring-node/recover-process.test.ts", "--maxWorkers=1", "--minWorkers=1"], { cwd: process.cwd(), env: { ...process.env, EVERYMCP_FICTIONAL_RECOVERY_DIR: dir }, timeout: 30000, encoding: "utf8" });
    expect(output).toContain("1 passed"); expect(readFileSync(join(dir, "fresh-process-report.md"))).toEqual(original); expect(sha256(original)).toBe(report.reportSha256);
    const evidenceDir = process.env.EVERYMCP_COLLECTOR_EVIDENCE_DIR;
    if (evidenceDir) for (const name of ["expected.json", "fictional-custody.json", "fresh-process-report.md"]) copyFileSync(join(dir, name), join(evidenceDir, name));
  }, 10000);

  it("reuses validated 304 body/projection dates, keeps fresh cache honest and retains success through incomplete checks", async () => {
    let status = 200;
    const local = await loopback((req,res) => { if (req.url === "/robots.txt") { res.statusCode = 404; res.end(); } else { res.statusCode = status; res.setHeader("Content-Type", "text/html"); res.setHeader("ETag", '"old"'); res.end(status === 304 ? undefined : HTML); } }); close.push(local.close);
    const h = harness(); h.deps.collectCanonicalSources = createNodeCollector({ now: h.deps.now, transport: local.transport });
    h.setClock("2026-11-01T00:00:00Z"); const first = await h.runtime.run(request(), h.add(captureJob("2026-11-01T00:00:00Z")));
    status = 304; h.setClock("2026-11-09T00:00:00Z"); const next = await h.runtime.run(request(), h.add(captureJob("2026-11-09T00:00:00Z", [first.receiptId])));
    const second = await source(h, next.receiptId); expect(second.sources[0].observation?.reason).toBe("not_modified"); expect(second.sources[0].observation?.documentProjection?.bodyObservedAt).toBe("2026-11-01T00:00:00.000Z");
    const count = local.calls.length; h.setClock("2026-11-10T00:00:00Z"); const cached = await h.runtime.run(request(), h.add(captureJob("2026-11-10T00:00:00Z", [next.receiptId])));
    expect(local.calls.length).toBe(count); expect((await source(h, cached.receiptId)).sources[0].runDisposition).toBe("fresh_cache");
    status = 206; h.setClock("2026-11-18T00:00:00Z"); const partial = await h.runtime.run(request(), h.add(captureJob("2026-11-18T00:00:00Z", [cached.receiptId])));
    const last = (await source(h, partial.receiptId)).sources[0]; expect(last.observation?.state).toBe("unknown"); expect(last.observation?.contentHash).toBeNull(); expect(last.observation?.documentProjection?.state).toBe("incomplete"); expect(last.lastSuccessfulObservation).toEqual(second.sources[0].lastSuccessfulObservation);
  }, 10000);

  it("keeps robots unknown/disallowed separate from source state and refuses pacing that cannot fit the run", async () => {
    let policy = "User-agent: *\nDisallow: /example\n", contentType = "text/plain";
    const local = await loopback((req,res) => { res.setHeader("Content-Type", contentType); res.end(req.url === "/robots.txt" ? policy : HTML); }); close.push(local.close);
    const h = harness(); h.deps.collectCanonicalSources = createNodeCollector({ now: h.deps.now, transport: local.transport });
    let day = 1;
    for (const [text, type, disposition] of [[policy, "text/plain", "robots_disallowed"], ["User-agent: *\nVisit-time: 0100-0200", "text/plain", "robots_unknown"], ["User-agent: *\nAllow: /", "text/plain; charset=latin1", "robots_unknown"], ["User-agent: *\nCrawl-delay: 31", "text/plain", "run_budget"]]) {
      policy = text; contentType = type; const stamp = `2026-11-${String(day++).padStart(2,"0")}T00:00:00Z`; h.setClock(stamp);
      const handle = await h.runtime.run(request(), h.add(captureJob(stamp))), report = await source(h, handle.receiptId);
      expect(report.summary.attemptsThisRun).toBe(0); expect(report.sources[0].runDisposition).toBe(disposition); expect(report.sources[0].observation).toBeNull(); expect(report.sources[0].stale).toBe(true);
    }
    expect(local.calls.every(call => call.path === "/robots.txt")).toBe(true);
  });

  it("stops a host on 429, preserves cooldown across admitted periods, and bounds source attempts", async () => {
    const local = await loopback((req,res) => { if (req.url === "/robots.txt") { res.statusCode = 404; res.end(); } else { res.statusCode = 429; res.setHeader("Retry-After", "3600"); res.end("rate limited"); } }); close.push(local.close);
    const h = harness(); const catalog = [...fixture.catalog, { id: "other-mcp", slug: "other-mcp", name: "Fictional other", repo: "https://github.com/example/other" }];
    h.deps.loadInventory = async () => ({ catalog, curated: [] }); h.deps.collectCanonicalSources = createNodeCollector({ now: h.deps.now, transport: local.transport });
    const urls = [URL, "https://github.com/example/other"], slugs = ["example-mcp", "other-mcp"];
    h.setClock("2026-11-01T00:00:00Z"); const one = await h.runtime.run(request(), h.add(captureJob("2026-11-01T00:00:00Z", [], urls, slugs)));
    const first = await source(h, one.receiptId); expect(first.summary.attemptsThisRun).toBe(1); expect(first.sources[1].runDisposition).toBe("host_backoff"); expect(first.sources[0].observation?.retryAfterSeconds).toBe(3600);
    const count = local.calls.length; h.setClock("2026-11-01T00:30:00Z"); const two = await h.runtime.run(request(), h.add(captureJob("2026-11-01T00:30:00Z", [one.receiptId], urls, slugs)));
    expect(local.calls.length).toBe(count); expect((await source(h, two.receiptId)).summary.attemptsThisRun).toBe(0);
  }, 5000);

  it("rejects off-watchlist/multi-host jobs and corrupted, changed-inventory or wrong-stage predecessors before requests", async () => {
    const local = await loopback((_req,res) => { res.statusCode = 404; res.end(); }); close.push(local.close);
    const h = harness(); h.deps.collectCanonicalSources = createNodeCollector({ now: h.deps.now, transport: local.transport }); h.setClock("2026-11-01T00:00:00Z");
    const collector = h.deps.collectCanonicalSources;
    const limits = { maxSourceAttempts: 2 as const, maxRobotsRequests: 1 as const, signal: new AbortController().signal, deadline: "2026-11-01T00:00:30Z" };
    await expect(collector(captureJob("2026-11-01T00:00:00Z", [], ["https://github.com/elsewhere/repo"]), limits, { inventory: { catalog: fixture.catalog, curated: [] }, previous: null })).rejects.toThrow(/cohort/);
    const multiCatalog = [...fixture.catalog, { id: "other", slug: "other", name: "Other", repo: "https://docs.cursor.com/example" }];
    await expect(collector(captureJob("2026-11-01T00:00:00Z", [], [URL, "https://docs.cursor.com/example"], ["example-mcp", "other"]), limits, { inventory: { catalog: multiCatalog, curated: [] }, previous: null })).rejects.toThrow(/cohort/);
    expect(local.calls).toHaveLength(0);
    const handle = await h.capture(0); // Real collector through the existing synthetic job helper.
    const count = local.calls.length; h.setClock("2026-11-09T00:00:00Z");
    const original = h.store.state.originals[handle.receiptId].source; h.store.state.originals[handle.receiptId].source = Buffer.from("{}\n").toString("base64");
    await expect(h.runtime.run(request(), h.add(captureJob("2026-11-09T00:00:00Z", [handle.receiptId])))).rejects.toThrow(/Capture original mismatch/); expect(local.calls.length).toBe(count);
    h.store.state.originals[handle.receiptId].source = original;
    await expect(admitRuntimeReceipt(h.deps, handle.receiptId, captureJob("2026-11-09T00:00:00Z"), { catalog: multiCatalog, curated: [] })).rejects.toThrow(/inventory changed/);
    const report = await h.report([handle.receiptId]); h.setClock("2026-11-13T00:00:00Z");
    await expect(h.runtime.run(request(), h.add(captureJob("2026-11-13T00:00:00Z", [report.receiptId])))).rejects.toThrow(/capture predecessor/);
    expect(local.calls.length).toBe(count);
  }, 5000);

  it("retains last success and reports unknown for redirected, oversized, truncated, timed-out and rejected 304 bodies", async () => {
    let mode = "good";
    const local = await loopback((req,res) => {
      if (req.url === "/robots.txt") { res.statusCode = 404; res.end(); return; }
      res.setHeader("Content-Type", "text/html");
      if (mode === "redirect") { res.writeHead(302, { Location: "http://127.0.0.1/private" }); res.end("redirect"); }
      else if (mode === "large") { res.writeHead(200); res.write(Buffer.alloc(1024 * 1024)); res.end("extra"); }
      else if (mode === "truncated") { res.setHeader("Content-Length", "100"); res.end("short"); }
      else if (mode === "timeout") { res.writeHead(200); res.write("partial"); }
      else if (mode === "bad304") { res.writeHead(304, { "Content-Encoding": "gzip" }); res.end(); }
      else res.end(HTML);
    }); close.push(local.close);
    const h = harness(); const curated = [{ slug: "example-mcp", references: [] }]; h.deps.loadInventory = async () => ({ catalog: fixture.catalog, curated });
    h.deps.collectCanonicalSources = createNodeCollector({ now: h.deps.now, transport: { evidenceClass: "synthetic-fixture", get: value => local.transport.get({ ...value, timeoutMs: Math.min(value.timeoutMs, 80) }) } });
    h.setClock("2026-11-01T00:00:00Z"); const baseline = await h.runtime.run(request(), h.add(captureJob("2026-11-01T00:00:00Z")));
    const success = (await source(h, baseline.receiptId)).sources[0].lastSuccessfulObservation;
    let prior = baseline.receiptId, day = 2;
    for (const [next, reason] of [["redirect", "redirect_not_followed"], ["large", "partial_or_oversized_body"], ["truncated", "transport_failure"], ["timeout", "timeout"], ["bad304", "scanner_policy_refusal"]]) {
      mode = next; const stamp = `2026-11-${String(day++).padStart(2,"0")}T00:00:00Z`; h.setClock(stamp);
      const handle = await h.runtime.run(request(), h.add(captureJob(stamp, [prior]))); prior = handle.receiptId;
      const entry = (await source(h, prior)).sources[0];
      expect(entry.observation?.reason).toBe(reason); expect(entry.observation?.state).toBe("unknown"); expect(entry.observation?.contentHash).toBeNull(); expect(entry.observation?.documentProjection?.state).toBe("incomplete"); expect(entry.lastSuccessfulObservation).toEqual(success);
    }
    expect(local.calls.filter(call => call.path === "/example/mcp")).toHaveLength(6);
  }, 12000);

  it.each([false, true])("retains robots 429 cooldown without inventing a source observation (truncated=%s)", async (truncated) => {
    let limited = true;
    const local = await loopback((req,res) => { if (req.url === "/robots.txt") { res.statusCode = limited ? 429 : 404; res.setHeader("Retry-After", "1800"); if (limited && truncated) { res.setHeader("Content-Length", "100"); res.end("short"); } else res.end(); } else { res.setHeader("Content-Type", "text/html"); res.end(HTML); } }); close.push(local.close);
    const h = harness(); h.deps.collectCanonicalSources = createNodeCollector({ now: h.deps.now, transport: local.transport });
    h.setClock("2026-11-01T00:00:00Z"); const first = await h.runtime.run(request(), h.add(captureJob("2026-11-01T00:00:00Z")));
    h.setClock("2026-11-01T00:30:00Z"); const next = await h.runtime.run(request(), h.add(captureJob("2026-11-01T00:30:00Z", [first.receiptId])));
    expect(local.calls).toHaveLength(1); const skipped = await source(h, next.receiptId); expect(skipped.sources[0].observation).toBeNull(); expect(skipped.sources[0].runDisposition).toBe("host_backoff"); expect(skipped.summary.robotsRequestsThisRun).toBe(0); expect(skipped.robotsPolicies).toEqual((await source(h, first.receiptId)).robotsPolicies);
    limited = false; h.setClock("2026-11-02T00:01:00Z"); const resumed = await h.runtime.run(request(), h.add(captureJob("2026-11-02T00:01:00Z", [next.receiptId])));
    expect((await source(h, resumed.receiptId)).sources[0].observation?.state).toBe("reachable"); expect(local.calls).toHaveLength(3);
  }, 5000);

  it("carries active robots cooldowns across intervening captures on another allowlisted host", async () => {
    const local = await loopback((req,res) => { if (req.url === "/robots.txt") { res.statusCode = req.headers.host === "github.com" ? 429 : 404; res.end(); } else { res.setHeader("Content-Type", "text/plain"); res.end("fictional other source"); } }); close.push(local.close);
    const h = harness(); const cursor = "https://docs.cursor.com/fixture";
    const catalog = [...fixture.catalog, { id: "cursor-mcp", slug: "cursor-mcp", name: "Fictional cursor", repo: cursor }];
    h.deps.loadInventory = async () => ({ catalog, curated: [] }); h.deps.collectCanonicalSources = createNodeCollector({ now: h.deps.now, transport: local.transport });
    const slugs = ["cursor-mcp", "example-mcp"];
    h.setClock("2026-11-01T00:00:00Z"); const first = await h.runtime.run(request(), h.add(captureJob("2026-11-01T00:00:00Z", [], [URL], slugs)));
    h.setClock("2026-11-01T00:01:00Z"); const other = await h.runtime.run(request(), h.add(captureJob("2026-11-01T00:01:00Z", [first.receiptId], [cursor], slugs)));
    const count = local.calls.length; h.setClock("2026-11-01T00:02:00Z"); const last = await h.runtime.run(request(), h.add(captureJob("2026-11-01T00:02:00Z", [other.receiptId], [URL], slugs)));
    expect(local.calls.length).toBe(count); expect(count).toBe(3);
    const report = await source(h, last.receiptId); expect(report.sources.find(item => item.url === URL)?.runDisposition).toBe("host_backoff"); expect(report.robotsPolicies).toEqual((await source(h, first.receiptId)).robotsPolicies);
  }, 5000);

  it("cannot bind a synthetic loopback collector as server-collected evidence", async () => {
    const local = await loopback((_req,res) => res.end("unused")); close.push(local.close);
    const h = harness(); h.deps.evidenceClass = "server-collection"; h.deps.authorizeRuntime = async () => ({ ...AUTHORITY, authorityClass: "verified-runtime" }); h.deps.verifyExecutionWriter = async () => true;
    h.deps.collectCanonicalSources = createNodeCollector({ now: h.deps.now, transport: local.transport });
    const runtime = createMonitoringRuntime(h.deps); h.setClock("2026-11-01T00:00:00Z");
    await expect(runtime.run(request(), h.add(captureJob("2026-11-01T00:00:00Z")))).rejects.toThrow(/evidence class/); expect(local.calls).toHaveLength(0);
  });
});
