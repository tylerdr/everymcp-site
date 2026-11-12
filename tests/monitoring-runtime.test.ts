import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { admitRuntimeReceipt, createMonitoringRuntime, getMonitoringRuntime, jobIdentity, MonitoringDenied, type RuntimeReceipt } from "../lib/monitoring/runtime";
import { canonicalJson, sha256 } from "../lib/monitoring/source-contract";
import { AUTHORITY, FictionalCustody, fixture, harness, OWNER, request, SCOPE } from "./fixtures/monitoring-node/runtime-fixture";
const inventory = { catalog: fixture.catalog, curated: fixture.curated };
const directories: string[] = [];
afterEach(() => { vi.useRealTimers(); for (const dir of directories.splice(0)) rmSync(dir, { recursive: true, force: true }); });
async function completed() {
  const h = harness(), a = await h.capture(0), b = await h.capture(3), report = await h.report([a.receiptId, b.receiptId]);
  return { h, a, b, report };
}

describe("separate Node capture, custody admission, report and recovery", () => {
  it("uses real product construction with fictional observations, immutable original bytes and current recovery rights", async () => {
    const { h, a, b, report } = await completed();
    const bytes = await h.runtime.recover(request(), report.jobId);
    expect(bytes).not.toBeNull();
    expect(sha256(bytes!)).toBe(report.reportSha256);
    expect(bytes!.toString()).toContain("Node 18 required");
    expect(bytes!.toString()).toContain("Node 20 required");
    expect(bytes!.toString()).toContain(a.receiptId);
    expect(bytes!.toString()).toContain(b.receiptId);
    expect(bytes!.toString()).toContain("fictional identifiers; no actual Vercel execution claimed");
    expect(h.calls.collect).toBe(2);
    h.deps.loadInventory = async () => { throw new Error("Recovery must not load/regenerate against current inventory"); };
    h.deps.collectCanonicalSources = async () => { throw new Error("Recovery cannot collect"); };
    h.jobs.get(report.jobId)!.receiptIds = [b.receiptId];
    expect(await h.runtime.run(request(), report.jobId)).toEqual(report);
    expect(await createMonitoringRuntime(h.deps).recover(request(), report.jobId)).toEqual(bytes);
    const active = h.deps.currentRights;
    h.deps.currentRights = async (job, action) => ({ ...await active(job, action), decision: action === "generate" ? "denied" : "active" });
    await expect(h.runtime.run(request(), report.jobId)).rejects.toBeInstanceOf(MonitoringDenied);
    expect(await h.runtime.recover(request(), report.jobId)).toEqual(bytes);
    h.deps.currentRights = async (job, action) => ({ ...await active(job, action), decision: "denied" });
    expect(await h.runtime.recover(request(), report.jobId)).toBeNull();
  });

  it("recovers original bytes in a separate Node process without collector, inventory, job loader or generation", async () => {
    const dir = mkdtempSync(join(tmpdir(), "everymcp-fictional-custody-")); directories.push(dir);
    const h = harness(new FictionalCustody(dir)), a = await h.capture(0), b = await h.capture(3), report = await h.report([a.receiptId, b.receiptId]);
    writeFileSync(join(dir, "expected.json"), JSON.stringify(report));
    const output = execFileSync(process.execPath, ["node_modules/vitest/vitest.mjs", "run", "tests/fixtures/monitoring-node/recover-process.test.ts", "--maxWorkers=1", "--minWorkers=1"], { cwd: process.cwd(), env: { ...process.env, EVERYMCP_FICTIONAL_RECOVERY_DIR: dir }, encoding: "utf8", timeout: 30000 });
    expect(output).toContain("1 passed");
    const recovered = readFileSync(join(dir, "fresh-process-report.md"));
    expect(recovered).toEqual(await h.runtime.recover(request(), report.jobId));
    expect(sha256(recovered)).toBe(report.reportSha256);
    const evidenceDir = process.env.EVERYMCP_NODE_EVIDENCE_DIR;
    if (evidenceDir) for (const name of ["fictional-custody.json", "expected.json", "fresh-process-report.md"]) copyFileSync(join(dir, name), join(evidenceDir, name));
  }, 35000);

  it("rejects tampered receipt/source/report bytes and misassociated committed capture indexes", async () => {
    const { h, a, b, report } = await completed();
    const original = structuredClone(h.store.state);
    const job = h.jobs.get(report.jobId)!;
    h.store.state.originals[a.receiptId].receipt = Buffer.from("{}\n").toString("base64");
    await expect(admitRuntimeReceipt(h.deps, a.receiptId, job, inventory)).rejects.toThrow();
    h.store.state = structuredClone(original);
    h.store.state.originals[a.receiptId].source = Buffer.from("{}\n").toString("base64");
    await expect(admitRuntimeReceipt(h.deps, a.receiptId, job, inventory)).rejects.toThrow(/Capture original mismatch/);
    h.store.state = structuredClone(original);
    h.store.state.originals[report.receiptId].report = Buffer.from("tampered").toString("base64");
    await expect(h.runtime.recover(request(), report.jobId)).rejects.toThrow(/integrity/);
    h.store.state = structuredClone(original);
    h.store.state.jobs[b.jobId].receiptId = a.receiptId;
    await expect(h.runtime.run(request(), b.jobId)).rejects.toThrow(/another job/);
  });

  it("refuses a same-owner report returned under another job index and rechecks rights after reading", async () => {
    const { h, report } = await completed();
    const originalGet = h.store.getJob.bind(h.store);
    const valid = (await originalGet(report.jobId))!;
    h.store.getJob = async () => valid;
    expect(await h.runtime.recover(request(), "f".repeat(64))).toBeNull();
    h.store.getJob = originalGet;
    const active = h.deps.currentRights; let checks = 0;
    h.deps.currentRights = async (job, action) => ({ ...await active(job, action), decision: ++checks === 1 ? "active" : "denied" });
    expect(await h.runtime.recover(request(), report.jobId)).toBeNull();
    h.deps.currentRights = async (job, action) => ({ ...await active(job, action), decision: "unknown" });
    await expect(h.runtime.recover(request(), report.jobId)).rejects.toThrow(/Current rights unavailable/);
  });

  it("rejects altered execution cross-bindings, invented receipt handles and non-original completion", async () => {
    const h = harness(), a = await h.capture(0), job = h.jobs.get(a.jobId)!;
    const row = h.store.state.originals[a.receiptId], original = structuredClone(row);
    await expect(admitRuntimeReceipt(h.deps, "0".repeat(64), job, inventory)).rejects.toThrow(/unavailable/);
    row.start.nonce = "11111111-1111-4111-8111-111111111111";
    await expect(admitRuntimeReceipt(h.deps, a.receiptId, job, inventory)).rejects.toThrow(/cross-binding/);
    h.store.state.originals[a.receiptId] = original;
    const execution = (await h.store.getExecutionByReceipt(a.receiptId))!;
    await expect(h.store.beginExecution(execution.start)).rejects.toThrow(/Duplicate/);
    await expect(h.store.beginExecution({ ...execution.start, executionId: "11111111-1111-4111-8111-111111111111" })).rejects.toThrow(/nonce/);
    await expect(h.store.completeExecution(execution.start.executionId, execution)).rejects.toThrow(/Immutable/);
    delete h.store.state.originals[a.receiptId];
    await expect(admitRuntimeReceipt(h.deps, a.receiptId, job, inventory)).rejects.toThrow(/unavailable/);
  });

  it("never treats caller metadata, project-only verification or a fixture authority as verified runtime", async () => {
    const h = harness(); h.deps.verifyExecutionWriter = async () => false;
    await expect(h.capture(0)).rejects.toThrow(/independently authorized/);
    expect(h.calls.collect).toBe(0); expect(Object.keys(h.store.state.starts)).toHaveLength(0);
    const live = harness(); live.deps.evidenceClass = "server-collection";
    await expect(live.capture(0)).rejects.toThrow(/Runtime authorization/);
    expect(live.calls.collect).toBe(0);
    const expiring = harness(); expiring.deps.authorizeRuntime = async () => ({ ...AUTHORITY, validUntil: "2026-10-31T00:00:00Z" });
    await expect(expiring.capture(0)).rejects.toThrow(/Runtime authorization/);
    expect(() => createMonitoringRuntime({ ...h.deps, scope: { ...SCOPE, mode: "live" } })).toThrow(/test scope/);
    expect(getMonitoringRuntime()).toBeNull();
  });

  it("enforces worker, owner, scope, exact rights binding and revocation before commit", async () => {
    const { h, report } = await completed();
    h.deps.authenticateOwner = async () => ({ scope: SCOPE, ownerKey: "f".repeat(64) });
    expect(await h.runtime.recover(request(), report.jobId)).toBeNull();
    h.deps.authenticateOwner = async () => ({ scope: { ...SCOPE, accountId: "acct_other" }, ownerKey: OWNER });
    expect(await h.runtime.recover(request(), report.jobId)).toBeNull();
    h.deps.authenticateWorker = async () => null;
    await expect(h.runtime.run(request(), report.jobId)).rejects.toBeInstanceOf(MonitoringDenied);
    const denied = harness(); const active = denied.deps.currentRights; let checks = 0;
    denied.deps.currentRights = async (job, action) => ({ ...await active(job, action), decision: ++checks === 1 ? "active" : "denied" });
    await expect(denied.capture(0)).rejects.toBeInstanceOf(MonitoringDenied);
    expect(Object.keys(denied.store.state.jobs)).toHaveLength(0);
    expect(Object.keys(denied.store.state.originals)).toHaveLength(0);
    const mismatch = harness(); mismatch.deps.currentRights = async (job, action) => ({ ...await active(job, action), watchlistId: "f".repeat(64) });
    await expect(mismatch.capture(0)).rejects.toThrow(/Current rights unavailable/);
    expect(mismatch.calls.collect).toBe(0);
  });

  it("rejects cross-owner, future, duplicate, replayed and wrong-stage report inputs", async () => {
    const h = harness(), a = await h.capture(0);
    await expect(h.report([a.receiptId, a.receiptId])).rejects.toThrow(/stage inputs/);
    const row = h.store.state.originals[a.receiptId];
    const original = structuredClone(row);
    row.start.job.ownerKey = "f".repeat(64);
    await expect(h.report([a.receiptId])).rejects.toBeInstanceOf(MonitoringDenied);
    h.store.state.originals[a.receiptId] = original;
    const report = await h.report([a.receiptId]);
    const next = { ...h.jobs.get(report.jobId)!, periodEnd: "2026-11-13T00:00:00Z", receiptIds: [report.receiptId] };
    h.setClock("2026-11-13T00:00:04Z");
    await expect(h.runtime.run(request(), h.add(next))).rejects.toThrow(/capture receipt/);
    const receipt = JSON.parse(Buffer.from(original.receipt, "base64").toString()) as RuntimeReceipt;
    receipt.completedAt = "2026-11-20T00:00:00Z";
    const changed = canonicalJson(receipt), id = sha256(changed);
    h.store.state.originals[id] = { ...original, receipt: changed.toString("base64") };
    await expect(admitRuntimeReceipt(h.deps, id, next, inventory)).rejects.toThrow(/interval/);
  });

  it("uses a hard capture deadline and refuses out-of-window or off-watchlist observations", async () => {
    const h = harness(); vi.useFakeTimers(); let signal: AbortSignal | undefined;
    h.deps.collectCanonicalSources = async (_job, limits) => { signal = limits.signal; return new Promise(() => undefined); };
    const run = expect(h.capture(0)).rejects.toThrow(/deadline/);
    await vi.advanceTimersByTimeAsync(30001); await run;
    expect(signal?.aborted).toBe(true); expect(Object.keys(h.store.state.jobs)).toHaveLength(0);
    vi.useRealTimers();
    const bad = harness(); bad.deps.collectCanonicalSources = async () => structuredClone(fixture.reports[3]);
    await expect(bad.capture(0)).rejects.toThrow(/chronology/);
    const outside = harness(); const a = await outside.capture(0); const job = { ...outside.jobs.get(a.jobId)!, periodEnd: "2026-11-02T00:00:00Z", sourceUrls: ["https://github.com/other/project"] };
    outside.setClock("2026-11-02T00:00:00Z");
    await expect(outside.runtime.run(request(), outside.add(job))).rejects.toThrow(/outside canonical watchlist/);
  });

  it("returns the same committed original after a lost acknowledgement and concurrent duplicate work", async () => {
    const h = harness(), commit = h.store.commitJobIfAbsent.bind(h.store); let first = true;
    h.store.commitJobIfAbsent = async value => { const result = await commit(value); if (first) { first = false; throw new Error("Lost acknowledgement"); } return result; };
    await expect(h.capture(0)).rejects.toThrow(/Lost acknowledgement/);
    const id = [...h.jobs.keys()][0], saved = h.store.state.jobs[id];
    const recovered = await h.runtime.run(request(), id);
    expect(recovered.receiptId).toBe(saved.receiptId); expect(h.calls.collect).toBe(1);
    const c = harness(); const capture = await c.capture(0); const reportJob = { ...c.jobs.get(capture.jobId)!, kind: "report" as const, periodEnd: "2026-11-12T00:00:00Z", sourceUrls: [], receiptIds: [capture.receiptId] }; c.setClock("2026-11-12T00:00:04Z");
    const reportId = c.add(reportJob);
    const results = await Promise.all([c.runtime.run(request(), reportId), c.runtime.run(request(), reportId)]);
    expect(results[0]).toEqual(results[1]);
    expect(jobIdentity(reportJob)).toBe(reportId);
    expect(Object.keys(c.store.state.jobs)).toHaveLength(2);
  });
});
