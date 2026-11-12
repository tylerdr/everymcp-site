/** FICTIONAL INPUTS ONLY. This store is a single-process test harness, never a hosted adapter. */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import golden from "./python-golden.json";
import { canonicalJson, sha256, type SourceReport } from "../../../lib/monitoring/source-contract";
import { createMonitoringRuntime, jobIdentity, type CustodyStore, type ExecutionStart, type Job, type JobCommit, type OriginalExecution, type RuntimeAuthorization, type RuntimeDependencies, type Scope } from "../../../lib/monitoring/runtime";
export const fixture = golden;
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
type Saved = { start: ExecutionStart; receipt: string; source: string | null; report: string | null };
type State = { starts: Record<string, ExecutionStart>; originals: Record<string, Saved>; jobs: Record<string, JobCommit> };
export class FictionalCustody implements CustodyStore {
  state: State;
  constructor(readonly directory?: string) {
    const path = directory && join(directory, "fictional-custody.json");
    this.state = path && existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) as State : { starts: {}, originals: {}, jobs: {} };
  }
  save() { if (this.directory) writeFileSync(join(this.directory, "fictional-custody.json"), JSON.stringify(this.state)); }
  async beginExecution(start: ExecutionStart) {
    if (this.state.starts[start.executionId] || Object.values(this.state.starts).some(row => row.nonce === start.nonce)) throw new Error("Duplicate execution or nonce");
    this.state.starts[start.executionId] = clone(start); this.save();
  }
  async completeExecution(id: string, original: OriginalExecution) {
    const start = this.state.starts[id];
    if (!start || !canonicalJson(start).equals(canonicalJson(original.start)) || Object.values(this.state.originals).some(row => row.start.executionId === id)) throw new Error("Immutable execution conflict");
    this.state.originals[sha256(original.receiptBytes)] = { start: clone(start), receipt: original.receiptBytes.toString("base64"), source: original.sourceBytes?.toString("base64") ?? null, report: original.reportBytes?.toString("base64") ?? null }; this.save();
  }
  async getExecutionByReceipt(id: string): Promise<OriginalExecution | null> {
    const row = this.state.originals[id];
    return row ? { start: clone(row.start), status: "completed", receiptBytes: Buffer.from(row.receipt, "base64"), sourceBytes: row.source === null ? null : Buffer.from(row.source, "base64"), reportBytes: row.report === null ? null : Buffer.from(row.report, "base64") } : null;
  }
  async getJob(id: string) { return this.state.jobs[id] ? clone(this.state.jobs[id]) : null; }
  async commitJobIfAbsent(commit: JobCommit) {
    if (!this.state.jobs[commit.jobId]) { this.state.jobs[commit.jobId] = clone(commit); this.save(); }
    return clone(this.state.jobs[commit.jobId]);
  }
}
export const SCOPE: Scope = { accountId: "acct_fictional", mode: "test", productKey: "source-history-fixture" };
export const OWNER = "a".repeat(64), WATCHLIST = "b".repeat(64);
export const AUTHORITY: RuntimeAuthorization = { method: "deployment-bound-ledger-writer-v1", authorityClass: "synthetic-fixture", teamId: "team_fictional", projectId: "prj_fictional", environment: "preview", deploymentId: "dpl_fictional", gitSha: "1".repeat(40), authorizationId: "c".repeat(64), validFrom: "2026-11-01T00:00:00Z", validUntil: "2026-12-01T00:00:00Z" };
export const request = () => new Request("https://fictional.invalid/api/monitoring/run", { method: "POST" });
export function harness(store = new FictionalCustody()) {
  let clock = new Date("2026-11-12T00:00:04Z");
  let payload: SourceReport | null = null;
  const jobs = new Map<string, Job>();
  const calls = { collect: 0, inventory: 0, writer: 0 };
  const deps: RuntimeDependencies = {
    scope: SCOPE, evidenceClass: "synthetic-fixture", store,
    authenticateWorker: async () => ({ scope: SCOPE, workerKey: "d".repeat(64) }),
    authenticateOwner: async () => ({ scope: SCOPE, ownerKey: OWNER }),
    loadJob: async id => jobs.get(id) ?? null,
    currentRights: async (job, action) => ({ scope: job.scope, ownerKey: job.ownerKey, watchlistId: job.watchlistId, version: job.version, periodStart: job.periodStart, periodEnd: job.periodEnd, action, decision: "active" }),
    authorizeRuntime: async () => clone(AUTHORITY),
    // Explicit fictional authority; this is NOT a Vercel signature or hosted writer verification.
    verifyExecutionWriter: async start => { calls.writer++; return start.evidenceClass === "synthetic-fixture" && canonicalJson(start.runtime).equals(canonicalJson(AUTHORITY)); },
    loadInventory: async () => { calls.inventory++; return { catalog: clone(golden.catalog), curated: clone(golden.curated) }; },
    collectCanonicalSources: async (_job, limits) => {
      calls.collect++;
      if (!payload || limits.maxSourceAttempts !== 2 || limits.maxRobotsRequests !== 1 || limits.signal.aborted) throw new Error("Invalid fictional collection");
      clock = new Date(Date.parse(payload.generatedAt) + 1000); return clone(payload);
    },
    now: () => new Date(clock),
  };
  const runtime = createMonitoringRuntime(deps);
  function add(job: Job) { const id = jobIdentity(job); jobs.set(id, clone(job)); return id; }
  async function capture(index: number) {
    payload = clone(golden.reports[index]) as SourceReport;
    clock = new Date(Date.parse(payload.generatedAt) - 2000);
    const job: Job = { scope: SCOPE, ownerKey: OWNER, watchlistId: WATCHLIST, version: 1, slugs: ["example-mcp"], periodStart: new Date(+clock - 86400000).toISOString(), periodEnd: clock.toISOString(), kind: "capture", sourceUrls: ["https://github.com/example/mcp"], receiptIds: [] };
    return runtime.run(request(), add(job));
  }
  async function report(receiptIds: string[]) {
    clock = new Date("2026-11-12T00:00:04Z");
    const job: Job = { scope: SCOPE, ownerKey: OWNER, watchlistId: WATCHLIST, version: 1, slugs: ["example-mcp"], periodStart: "2026-11-01T00:00:00Z", periodEnd: "2026-11-12T00:00:00Z", kind: "report", sourceUrls: [], receiptIds };
    return runtime.run(request(), add(job));
  }
  return { deps, runtime, store, jobs, calls, add, capture, report, setClock: (stamp: string) => { clock = new Date(stamp); } };
}
