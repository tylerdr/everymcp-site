import { randomUUID } from "node:crypto";
import { z } from "zod";
import { buildNodeHistory, renderNodeHistory, type NodeSnapshot } from "./history";
import { canonicalJson, inventoryDigest, inventorySourceUrls, MAX_SOURCE_BYTES, parseCanonical, sha256, timestamp, validateSourceReport, type SourceReport } from "./source-contract";

export const LEGACY_RECEIPT_POLICY = "vercel-next-custody-v1";
export const RECEIPT_POLICY = "vercel-next-custody-v2";
export const LEGACY_REPORT_POLICY = "source-receipt-history-node-v1";
export const REPORT_POLICY = "source-receipt-history-node-v2";
// Freeze period identity across renderer upgrades: an existing original must always win.
const JOB_IDENTITY_RENDERER_SEED = LEGACY_REPORT_POLICY;
export const MAX_REPORT_BYTES = 2 * 1024 * 1024;
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const date = z.string().refine((value) => { try { timestamp(value); return true; } catch { return false; } });
export const scopeSchema = z.object({ accountId: z.string().regex(/^acct_[A-Za-z0-9]{1,64}$/), mode: z.enum(["test", "live"]), productKey: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80) }).strict();
const runtimeSchema = z.object({ method: z.literal("deployment-bound-ledger-writer-v1"), authorityClass: z.enum(["synthetic-fixture", "verified-runtime"]), teamId: z.string().regex(/^team_[A-Za-z0-9]+$/), projectId: z.string().regex(/^prj_[A-Za-z0-9]+$/), environment: z.enum(["preview", "production"]), deploymentId: z.string().regex(/^dpl_[A-Za-z0-9]+$/), gitSha: z.string().regex(/^[a-f0-9]{40}$/), authorizationId: hash, validFrom: date, validUntil: date }).strict();
export type Scope = z.infer<typeof scopeSchema>;
export type RuntimeAuthorization = z.infer<typeof runtimeSchema>;
export type Principal = { scope: Scope; ownerKey: string };
export type WorkerPrincipal = { scope: Scope; workerKey: string };
const jobSchema = z.object({ scope: scopeSchema, ownerKey: hash, watchlistId: hash, version: z.number().int().min(1).max(2147483647), slugs: z.array(z.string().regex(/^[a-z0-9][a-z0-9._-]{0,100}$/)).min(1).max(100), periodStart: date, periodEnd: date, kind: z.enum(["capture", "report"]), sourceUrls: z.array(z.string()).max(2), receiptIds: z.array(hash).max(32) }).strict();
export type Job = z.infer<typeof jobSchema>;
export type Rights = { scope: Scope; ownerKey: string; watchlistId: string; version: number; periodStart: string; periodEnd: string; action: "generate" | "recover"; decision: "active" | "denied" | "unknown" };
export const startSchema = z.object({ schemaVersion: z.literal(1), policy: z.enum([LEGACY_RECEIPT_POLICY, RECEIPT_POLICY]), executionId: z.string().uuid(), nonce: z.string().uuid(), job: jobSchema, jobId: hash, inventorySha256: hash, runtime: runtimeSchema, evidenceClass: z.enum(["synthetic-fixture", "server-collection"]), startedAt: date }).strict();
export type ExecutionStart = z.infer<typeof startSchema>;
export const receiptSchema = z.object({ schemaVersion: z.literal(1), policy: z.enum([LEGACY_RECEIPT_POLICY, RECEIPT_POLICY]), executionId: z.string().uuid(), nonce: z.string().uuid(), jobId: hash, inventorySha256: hash, runtime: runtimeSchema, evidenceClass: z.enum(["synthetic-fixture", "server-collection"]), stage: z.enum(["capture", "report"]), startedAt: date, completedAt: date, sourceSha256: hash.nullable(), reportSha256: hash.nullable(), reportLength: z.number().int().min(0).max(MAX_REPORT_BYTES), reportPolicy: z.enum([LEGACY_REPORT_POLICY, REPORT_POLICY]).nullable(), inputReceiptIds: z.array(hash).max(32) }).strict();
export type RuntimeReceipt = z.infer<typeof receiptSchema>;
export type OriginalExecution = { start: ExecutionStart; status: "completed"; receiptBytes: Buffer; sourceBytes: Buffer | null; reportBytes: Buffer | null };
export type JobCommit = { jobId: string; receiptId: string; job: Job };
export type Handle = { jobId: string; receiptId: string; kind: "capture" | "report"; reportSha256: string | null; reportLength: number; evidenceClass: "synthetic-fixture" | "server-collection" };

// This is an AUTHENTICATED storage boundary, not a public content-addressed file server.
// begin allocates unique execution ID + nonce; complete is atomic/immutable; job commit is CAS.
// No implementation here can write a hosted ledger. Never use an in-memory adapter in production.
export interface CustodyStore {
  beginExecution(start: ExecutionStart): Promise<void>;
  completeExecution(executionId: string, original: OriginalExecution): Promise<void>;
  getExecutionByReceipt(receiptId: string): Promise<OriginalExecution | null>;
  getJob(jobId: string): Promise<JobCommit | null>;
  commitJobIfAbsent(commit: JobCommit): Promise<JobCommit>;
}
export type CollectorContext = { inventory: { catalog: unknown[]; curated: unknown[] }; previous: SourceReport | null };
export type CollectorLimits = { maxSourceAttempts: 2; maxRobotsRequests: 1; deadline: string; signal: AbortSignal };
export type SourceCollector = ((job: Job, limits: CollectorLimits, context: CollectorContext) => Promise<unknown>) & { readonly evidenceClass?: "synthetic-fixture" | "server-collection" };
export type RuntimeDependencies = {
  scope: Scope;
  evidenceClass: "synthetic-fixture" | "server-collection";
  authenticateWorker(request: Request): Promise<WorkerPrincipal | null>;
  authenticateOwner(request: Request): Promise<Principal | null>;
  loadJob(jobId: string): Promise<Job | null>; // Server-derived configuration, never a posted watchlist.
  currentRights(job: Job, action: "generate" | "recover"): Promise<Rights>;
  authorizeRuntime(): Promise<RuntimeAuthorization | null>;
  // Must verify the actual writer's authorization for THIS deployment and execution using
  // independent protected custody/provider evidence. OIDC project claims + env vars are insufficient.
  verifyExecutionWriter(start: ExecutionStart, completedAt: string): Promise<boolean>;
  loadInventory(): Promise<{ catalog: unknown[]; curated: unknown[] }>;
  collectCanonicalSources: SourceCollector;
  store: CustodyStore;
  now(): Date;
};
export class MonitoringUnavailable extends Error {}
export class MonitoringDenied extends Error {}
const same = (a: unknown, b: unknown) => canonicalJson(a).equals(canonicalJson(b));
function copy<T>(value: T): T { return JSON.parse(canonicalJson(value).toString()) as T; }
export function jobIdentity(job: Job): string {
  const { scope, ownerKey, watchlistId, version, slugs, periodStart, periodEnd, kind } = jobSchema.parse(job);
  return sha256(canonicalJson({ scope, ownerKey, watchlistId, version, slugs, periodStart, periodEnd, kind, reportPolicy: JOB_IDENTITY_RENDERER_SEED }));
}
function checkJob(job: Job, now: string) {
  jobSchema.parse(job);
  if (!same(job.slugs, [...new Set(job.slugs)].sort()) || timestamp(job.periodStart) >= timestamp(job.periodEnd) || timestamp(job.periodEnd) > timestamp(now) || timestamp(job.periodEnd) - timestamp(job.periodStart) > 90 * 86400000) throw new MonitoringUnavailable("Invalid canonical job");
  if (job.kind === "capture" && (!job.sourceUrls.length || job.receiptIds.length > 1 || new Set(job.sourceUrls).size !== job.sourceUrls.length) || job.kind === "report" && (!job.receiptIds.length || job.sourceUrls.length || new Set(job.receiptIds).size !== job.receiptIds.length)) throw new MonitoringUnavailable("Invalid stage inputs");
}
function now(deps: RuntimeDependencies): string {
  const result = deps.now(); if (!(result instanceof Date) || !Number.isFinite(result.getTime())) throw new MonitoringUnavailable("Clock unavailable");
  return result.toISOString();
}
async function rights(deps: RuntimeDependencies, job: Job, action: "generate" | "recover") {
  const decision = await deps.currentRights(copy(job), action);
  const expected = { scope: job.scope, ownerKey: job.ownerKey, watchlistId: job.watchlistId, version: job.version, periodStart: job.periodStart, periodEnd: job.periodEnd, action };
  if (!decision || !["active", "denied", "unknown"].includes(decision.decision) || !same(decision, { ...expected, decision: decision.decision }) || decision.decision === "unknown") throw new MonitoringUnavailable("Current rights unavailable");
  if (decision.decision !== "active") throw new MonitoringDenied("Access denied");
}
function checkSourceWindow(report: SourceReport, start: ExecutionStart, completedAt: string) {
  if (report.mode !== "check" || timestamp(report.generatedAt) < timestamp(start.startedAt) || timestamp(report.generatedAt) > timestamp(completedAt)) throw new MonitoringUnavailable("Source execution chronology mismatch");
  if (Number(report.summary.attemptsThisRun) > 2 || Number(report.summary.robotsRequestsThisRun) > 1 || Number(report.summary.requestDurationMsThisRun) > 30000) throw new MonitoringUnavailable("Capture budget exceeded");
  for (const source of report.sources) {
    if (source.runDisposition === "dry_run") throw new MonitoringUnavailable("Dry run is not a collection receipt");
    if (source.runDisposition === "checked_this_run") {
      if (!start.job.sourceUrls.includes(source.url) || !source.observation || timestamp(source.observation.checkedAt) < timestamp(start.startedAt)) throw new MonitoringUnavailable("Unexpected source observation");
    } else if (source.observation && timestamp(source.observation.checkedAt) >= timestamp(start.startedAt)) throw new MonitoringUnavailable("Uncounted observation in execution");
  }
}

// No submitted receipt object can grant admission. Always retrieve originals from the fixed
// trusted store and independently authorize their actual execution writer.
export async function admitRuntimeReceipt(deps: RuntimeDependencies, receiptId: string, job: Job, inventory: { catalog: unknown[]; curated: unknown[] }): Promise<{ receipt: RuntimeReceipt; original: OriginalExecution; source: SourceReport | null }> {
  hash.parse(receiptId);
  if (!same(job.scope, deps.scope)) throw new MonitoringDenied("Admission scope mismatch");
  const original = await deps.store.getExecutionByReceipt(receiptId);
  if (!original || original.status !== "completed") throw new MonitoringUnavailable("Original execution unavailable");
  const start = startSchema.parse(original.start), receipt = receiptSchema.parse(parseCanonical(original.receiptBytes, 65536));
  if (sha256(original.receiptBytes) !== receiptId || !same(start.job.scope, job.scope) || start.job.ownerKey !== job.ownerKey || start.job.watchlistId !== job.watchlistId || start.job.version > job.version) throw new MonitoringDenied("Receipt scope mismatch");
  if (start.policy !== receipt.policy || start.jobId !== jobIdentity(start.job) || receipt.jobId !== start.jobId || receipt.executionId !== start.executionId || receipt.nonce !== start.nonce || receipt.stage !== start.job.kind || receipt.startedAt !== start.startedAt || receipt.inventorySha256 !== start.inventorySha256 || !same(receipt.runtime, start.runtime) || receipt.evidenceClass !== start.evidenceClass || receipt.evidenceClass !== deps.evidenceClass || !same(receipt.inputReceiptIds, start.job.receiptIds)) throw new MonitoringUnavailable("Execution cross-binding mismatch");
  checkJob(start.job, start.startedAt);
  if (start.policy === LEGACY_RECEIPT_POLICY && start.job.kind === "capture" && start.job.receiptIds.length) throw new MonitoringUnavailable("Legacy capture cannot have predecessor inputs");
  const begin = timestamp(start.startedAt), end = timestamp(receipt.completedAt), current = timestamp(now(deps));
  if (begin > end || end > current || end - begin > (receipt.stage === "capture" ? 30000 : 60000) || begin < timestamp(start.runtime.validFrom) || end > timestamp(start.runtime.validUntil)) throw new MonitoringUnavailable("Invalid execution interval");
  if (start.runtime.authorityClass === "synthetic-fixture" && (deps.evidenceClass !== "synthetic-fixture" || deps.scope.mode !== "test") || !await deps.verifyExecutionWriter(copy(start), receipt.completedAt)) throw new MonitoringUnavailable("Deployment-bound writer not verified");
  if (start.inventorySha256 !== inventoryDigest(inventory.catalog, inventory.curated)) throw new MonitoringUnavailable("Source inventory changed");
  let source: SourceReport | null = null;
  if (receipt.stage === "capture") {
    if (!original.sourceBytes || original.reportBytes !== null || receipt.reportSha256 !== null || receipt.reportLength !== 0 || receipt.reportPolicy !== null || receipt.inputReceiptIds.length > 1 || sha256(original.sourceBytes) !== receipt.sourceSha256) throw new MonitoringUnavailable("Capture original mismatch");
    source = validateSourceReport(parseCanonical(original.sourceBytes), inventory.catalog, inventory.curated);
    checkSourceWindow(source, start, receipt.completedAt);
  } else if (original.sourceBytes !== null || receipt.sourceSha256 !== null || !original.reportBytes || original.reportBytes.length > MAX_REPORT_BYTES || original.reportBytes.length !== receipt.reportLength || sha256(original.reportBytes) !== receipt.reportSha256 || ![LEGACY_REPORT_POLICY, REPORT_POLICY].includes(receipt.reportPolicy || "")) throw new MonitoringUnavailable("Report original mismatch");
  return { receipt, original, source };
}

export function createMonitoringRuntime(deps: RuntimeDependencies) {
  scopeSchema.parse(deps.scope);
  if (deps.evidenceClass === "synthetic-fixture" && deps.scope.mode !== "test") throw new MonitoringUnavailable("Synthetic evidence requires test scope");
  async function readCommitted(commit: JobCommit, job: Job, inventory?: { catalog: unknown[]; curated: unknown[] }) {
    if (commit.jobId !== jobIdentity(job) || commit.jobId !== jobIdentity(commit.job) || !same(commit.job.scope, job.scope) || commit.job.ownerKey !== job.ownerKey || !same(commit.job.slugs, job.slugs) || !same(commit.job.sourceUrls, job.sourceUrls)) throw new MonitoringUnavailable("Committed job conflict");
    // Recovery is byte custody, not regeneration against today's mutable inventory. For report
    // originals the inventory digest is checked against the stored trusted execution, below.
    if (job.kind === "report" && !inventory) {
      const original = await deps.store.getExecutionByReceipt(commit.receiptId);
      if (!original) throw new MonitoringUnavailable("Report unavailable");
      const receipt = receiptSchema.parse(parseCanonical(original.receiptBytes, 65536));
      const start = startSchema.parse(original.start);
      if (original.status !== "completed" || start.policy !== receipt.policy || sha256(original.receiptBytes) !== commit.receiptId || receipt.stage !== "report" || receipt.jobId !== commit.jobId || !same(start.job, commit.job) || !same(receipt.runtime, start.runtime) || receipt.executionId !== start.executionId || receipt.nonce !== start.nonce || receipt.startedAt !== start.startedAt || receipt.inventorySha256 !== start.inventorySha256 || !same(receipt.inputReceiptIds, start.job.receiptIds) || receipt.evidenceClass !== deps.evidenceClass || receipt.evidenceClass !== start.evidenceClass || ![LEGACY_REPORT_POLICY, REPORT_POLICY].includes(receipt.reportPolicy || "") || receipt.sourceSha256 !== null || original.sourceBytes !== null || !original.reportBytes || original.reportBytes.length !== receipt.reportLength || original.reportBytes.length > MAX_REPORT_BYTES || sha256(original.reportBytes) !== receipt.reportSha256) throw new MonitoringUnavailable("Stored report failed integrity checks");
      checkJob(start.job, start.startedAt);
      const begin = timestamp(start.startedAt), end = timestamp(receipt.completedAt);
      if (start.jobId !== commit.jobId || end < begin || end - begin > 60000 || end > timestamp(now(deps)) || begin < timestamp(start.runtime.validFrom) || end > timestamp(start.runtime.validUntil) || start.runtime.authorityClass === "synthetic-fixture" && (deps.evidenceClass !== "synthetic-fixture" || deps.scope.mode !== "test") || !await deps.verifyExecutionWriter(copy(start), receipt.completedAt)) throw new MonitoringUnavailable("Stored writer authorization unavailable");
      return { receipt, original };
    }
    const admitted = await admitRuntimeReceipt(deps, commit.receiptId, job, inventory || await deps.loadInventory());
    if (admitted.original.start.jobId !== commit.jobId || !same(admitted.original.start.job, commit.job)) throw new MonitoringUnavailable("Committed capture points to another job");
    return admitted;
  }
  const handle = (commit: JobCommit, receipt: RuntimeReceipt): Handle => ({ jobId: commit.jobId, receiptId: commit.receiptId, kind: receipt.stage, reportSha256: receipt.reportSha256, reportLength: receipt.reportLength, evidenceClass: receipt.evidenceClass });
  async function run(request: Request, jobId: string): Promise<Handle> {
    hash.parse(jobId);
    const worker = await deps.authenticateWorker(request);
    if (!worker || !same(worker.scope, deps.scope) || !hash.safeParse(worker.workerKey).success) throw new MonitoringDenied("Worker authentication required");
    const loaded = await deps.loadJob(jobId); if (!loaded) throw new MonitoringUnavailable("Canonical job unavailable");
    const job = jobSchema.parse(copy(loaded)); checkJob(job, now(deps));
    if (!same(job.scope, deps.scope) || jobIdentity(job) !== jobId) throw new MonitoringDenied("Job scope mismatch");
    await rights(deps, job, "generate");
    const existing = await deps.store.getJob(jobId);
    if (existing) return handle(existing, (await readCommitted(existing, job)).receipt);
    const inventory = await deps.loadInventory(), inventorySha256 = inventoryDigest(inventory.catalog, inventory.curated);
    const allowedSources = inventorySourceUrls(inventory.catalog, inventory.curated, job.slugs);
    if (job.kind === "capture" && job.sourceUrls.some((url) => !allowedSources.includes(url))) throw new MonitoringUnavailable("Capture source outside canonical watchlist");
    const runtime = runtimeSchema.parse(await deps.authorizeRuntime());
    const startedAt = now(deps);
    if (timestamp(startedAt) < timestamp(runtime.validFrom) || timestamp(startedAt) > timestamp(runtime.validUntil) || runtime.authorityClass === "synthetic-fixture" && (deps.evidenceClass !== "synthetic-fixture" || deps.scope.mode !== "test")) throw new MonitoringUnavailable("Runtime authorization unavailable");
    const start: ExecutionStart = { schemaVersion: 1, policy: RECEIPT_POLICY, executionId: randomUUID(), nonce: randomUUID(), job, jobId, inventorySha256, runtime, evidenceClass: deps.evidenceClass, startedAt };
    if (!await deps.verifyExecutionWriter(copy(start), startedAt)) throw new MonitoringUnavailable("Runtime writer is not independently authorized");
    await deps.store.beginExecution(copy(start));
    let sourceBytes: Buffer | null = null, reportBytes: Buffer | null = null;
    if (job.kind === "capture") {
      const collectorClass = deps.collectCanonicalSources.evidenceClass;
      if (collectorClass && collectorClass !== deps.evidenceClass || deps.evidenceClass === "server-collection" && collectorClass !== "server-collection") throw new MonitoringUnavailable("Collector evidence class unavailable or mismatched");
      let previous: SourceReport | null = null;
      if (job.receiptIds.length) {
        const prior = await admitRuntimeReceipt(deps, job.receiptIds[0], job, inventory);
        if (!prior.source || prior.receipt.stage !== "capture" || timestamp(prior.receipt.completedAt) >= timestamp(startedAt)) throw new MonitoringUnavailable("Invalid capture predecessor");
        previous = prior.source;
      }
      const controller = new AbortController();
      let timer: ReturnType<typeof setTimeout> | undefined;
      const expired = new Promise<never>((_resolve, reject) => { timer = setTimeout(() => { controller.abort(); reject(new MonitoringUnavailable("Capture deadline exceeded")); }, 30000); });
      let payload: unknown;
      try { payload = await Promise.race([deps.collectCanonicalSources(copy(job), { maxSourceAttempts: 2, maxRobotsRequests: 1, deadline: new Date(timestamp(startedAt) + 30000).toISOString(), signal: controller.signal }, { inventory: copy(inventory), previous: previous && copy(previous) }), expired]); }
      finally { clearTimeout(timer); controller.abort(); }
      const source = validateSourceReport(payload, inventory.catalog, inventory.curated);
      sourceBytes = canonicalJson(source);
      if (sourceBytes.length > MAX_SOURCE_BYTES) throw new MonitoringUnavailable("Source byte budget exceeded");
      checkSourceWindow(source, start, now(deps));
    } else {
      const snapshots: NodeSnapshot[] = [];
      const executions = new Set<string>();
      for (const receiptId of job.receiptIds) {
        const admitted = await admitRuntimeReceipt(deps, receiptId, job, inventory);
        if (!admitted.source || admitted.receipt.stage !== "capture" || timestamp(admitted.receipt.completedAt) > timestamp(job.periodEnd) || executions.has(admitted.receipt.executionId)) throw new MonitoringUnavailable("Invalid/duplicate capture receipt");
        executions.add(admitted.receipt.executionId);
        snapshots.push({ report: admitted.source, evidence: { receiptSha256: receiptId, sourceSha256: admitted.receipt.sourceSha256!, executionId: admitted.receipt.executionId, deploymentId: admitted.receipt.runtime.deploymentId, gitSha: admitted.receipt.runtime.gitSha, startedAt: admitted.receipt.startedAt, completedAt: admitted.receipt.completedAt, origin: admitted.receipt.policy, evidenceClass: admitted.receipt.evidenceClass } });
      }
      reportBytes = renderNodeHistory(buildNodeHistory(snapshots, job.periodEnd, inventory.catalog, inventory.curated, job.slugs));
      if (reportBytes.length > MAX_REPORT_BYTES) throw new MonitoringUnavailable("Report byte budget exceeded");
    }
    const completedAt = now(deps), elapsed = timestamp(completedAt) - timestamp(startedAt);
    if (elapsed < 0 || elapsed > (job.kind === "capture" ? 30000 : 60000) || timestamp(completedAt) > timestamp(runtime.validUntil)) throw new MonitoringUnavailable("Execution deadline exceeded");
    await rights(deps, job, "generate");
    const receipt: RuntimeReceipt = { schemaVersion: 1, policy: RECEIPT_POLICY, executionId: start.executionId, nonce: start.nonce, jobId, inventorySha256, runtime, evidenceClass: deps.evidenceClass, stage: job.kind, startedAt, completedAt, sourceSha256: sourceBytes && sha256(sourceBytes), reportSha256: reportBytes && sha256(reportBytes), reportLength: reportBytes?.length || 0, reportPolicy: reportBytes ? REPORT_POLICY : null, inputReceiptIds: job.receiptIds };
    const original: OriginalExecution = { start, status: "completed", receiptBytes: canonicalJson(receipt), sourceBytes, reportBytes };
    const receiptId = sha256(original.receiptBytes);
    await deps.store.completeExecution(start.executionId, original);
    // Verify committed original custody before exposing the period's handle.
    await admitRuntimeReceipt(deps, receiptId, job, inventory);
    await rights(deps, job, "generate");
    const winner = await deps.store.commitJobIfAbsent({ jobId, receiptId, job });
    return handle(winner, (await readCommitted(winner, job)).receipt);
  }
  async function recover(request: Request, jobId: string): Promise<Buffer | null> {
    if (!hash.safeParse(jobId).success) return null;
    const principal = await deps.authenticateOwner(request);
    if (!principal || !same(principal.scope, deps.scope) || !hash.safeParse(principal.ownerKey).success) return null;
    const commit = await deps.store.getJob(jobId);
    if (!commit || commit.jobId !== jobId || jobIdentity(commit.job) !== jobId || !same(commit.job.scope, principal.scope) || commit.job.ownerKey !== principal.ownerKey || commit.job.kind !== "report") return null;
    checkJob(commit.job, now(deps));
    try { await rights(deps, commit.job, "recover"); } catch (error) { if (error instanceof MonitoringDenied) return null; throw error; }
    const stored = await readCommitted(commit, commit.job);
    try { await rights(deps, commit.job, "recover"); } catch (error) { if (error instanceof MonitoringDenied) return null; throw error; }
    return Buffer.from(stored.original.reportBytes!);
  }
  return { run, recover };
}

// No environment flag or request header can enable this factory. Hosted collector,
// deployment-bound authorization, current rights and durable custody remain unbound.
export function getMonitoringRuntime(): ReturnType<typeof createMonitoringRuntime> | null { return null; }
