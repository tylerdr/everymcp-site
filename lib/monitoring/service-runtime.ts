import { randomUUID } from "node:crypto";
import { z } from "zod";
import { buildServiceHistory, renderServiceHistory, type ServiceSnapshot } from "./service-history";
import { MAX_REPORT_BYTES, MonitoringDenied, MonitoringUnavailable, scopeSchema, type Job, type JobCommit, type RuntimeDependencies } from "./runtime";
import { canonicalJson, inventoryDigest, inventorySourceUrls, MAX_SOURCE_BYTES, parseCanonical, sha256, timestamp, validateSourceReport, type SourceReport } from "./source-contract";
import { checkServiceJob, sameServiceValue as same, SERVICE_RECEIPT_POLICY, SERVICE_REPORT_POLICY, serviceJobIdentity, serviceJobSchema, validateServiceOriginal, type ServiceCustodyStore, type ServiceOriginal, type ServiceReceipt, type ServiceStart } from "./service-records";
import type { ServiceProducer, ServiceVerifier } from "./service-authority";

export type ServiceRuntimeDependencies = Pick<RuntimeDependencies, "scope" | "evidenceClass" | "authenticateOwner" | "loadJob" | "currentRights" | "loadInventory" | "collectCanonicalSources" | "now"> & { store: ServiceCustodyStore; verifier: ServiceVerifier; producer?: ServiceProducer };
const HASH = z.string().regex(/^[a-f0-9]{64}$/);
const copy = <T,>(value: T): T => JSON.parse(canonicalJson(value).toString()) as T;
function now(deps: ServiceRuntimeDependencies): string {
  const date = deps.now(); if (!(date instanceof Date) || !Number.isFinite(date.getTime())) throw new MonitoringUnavailable("Service clock unavailable"); return date.toISOString();
}
async function rights(deps: ServiceRuntimeDependencies, job: Job, action: "generate" | "recover") {
  const result = await deps.currentRights(copy(job), action);
  const expected = { scope: job.scope, ownerKey: job.ownerKey, watchlistId: job.watchlistId, version: job.version, periodStart: job.periodStart, periodEnd: job.periodEnd, action };
  if (!result || !["active", "denied", "unknown"].includes(result.decision) || !same(result, { ...expected, decision: result.decision }) || result.decision === "unknown") throw new MonitoringUnavailable("Current service rights unavailable");
  if (result.decision !== "active") throw new MonitoringDenied("Access denied");
}
function sourceWindow(report: SourceReport, start: ServiceStart, completedAt: string) {
  if (report.mode !== "check" || timestamp(report.generatedAt) < timestamp(start.startedAt) || timestamp(report.generatedAt) > timestamp(completedAt) || Number(report.summary.attemptsThisRun) > 2 || Number(report.summary.robotsRequestsThisRun) > 1 || Number(report.summary.requestDurationMsThisRun) > 30000) throw new MonitoringUnavailable("Service capture chronology or budget mismatch");
  for (const source of report.sources) {
    if (source.runDisposition === "dry_run") throw new MonitoringUnavailable("Dry run is not a service observation");
    if (source.runDisposition === "checked_this_run") {
      if (!start.job.sourceUrls.includes(source.url) || !source.observation || timestamp(source.observation.checkedAt) < timestamp(start.startedAt)) throw new MonitoringUnavailable("Unexpected service observation");
    } else if (source.observation && timestamp(source.observation.checkedAt) >= timestamp(start.startedAt)) throw new MonitoringUnavailable("Uncounted service observation");
  }
}
function verifyStored(deps: ServiceRuntimeDependencies, original: ServiceOriginal, id: string) {
  const result = validateServiceOriginal(original);
  if (sha256(original.receiptBytes) !== id || !same(result.start.job.scope, deps.scope) || result.start.evidenceClass !== deps.evidenceClass || timestamp(result.receipt.completedAt) > timestamp(now(deps)) || !deps.verifier.verifyOriginal(original)) throw new MonitoringUnavailable("Service-recorded original verification failed");
  return result;
}
/** Service-only admission. There is deliberately no fallback to a legacy/platform verifier. */
export async function admitServiceReceipt(deps: ServiceRuntimeDependencies, id: string, job: Job, inventory: { catalog: unknown[]; curated: unknown[] }) {
  HASH.parse(id);
  if (!same(job.scope, deps.scope)) throw new MonitoringDenied("Service admission scope mismatch");
  const original = await deps.store.getExecutionByReceipt(id);
  if (!original) throw new MonitoringUnavailable("Service original unavailable");
  const { start, receipt } = verifyStored(deps, original, id);
  if (start.job.ownerKey !== job.ownerKey || start.job.watchlistId !== job.watchlistId || start.job.version > job.version) throw new MonitoringDenied("Service receipt ownership mismatch");
  if (start.inventorySha256 !== inventoryDigest(inventory.catalog, inventory.curated)) throw new MonitoringUnavailable("Service inventory changed");
  let source: SourceReport | null = null;
  if (receipt.stage === "capture") {
    source = validateSourceReport(parseCanonical(original.sourceBytes!), inventory.catalog, inventory.curated);
    sourceWindow(source, start, receipt.completedAt);
  }
  return { start, receipt, original, source };
}

/** Actual service-recorded workflow; missing producer only permits verified recovery.
 * Source signatures authenticate service assertions, not independent platform/fetch/time truth.
 * The existing hosted factory remains null; this constructor does not configure anything.
 */
export function createServiceRecordedRuntime(deps: ServiceRuntimeDependencies) {
  scopeSchema.parse(deps.scope);
  if (!deps.verifier || !same(deps.scope, deps.verifier.scope) || deps.evidenceClass !== deps.verifier.evidenceClass || deps.evidenceClass === "synthetic-fixture" && deps.scope.mode !== "test" || deps.producer && (!same(deps.scope, deps.producer.verifier.scope) || deps.producer.verifier.serviceId !== deps.verifier.serviceId || deps.producer.verifier.evidenceClass !== deps.evidenceClass)) throw new MonitoringUnavailable("Service authority binding unavailable");
  async function readCommitted(commit: JobCommit, expected: Job) {
    if (commit.jobId !== serviceJobIdentity(expected) || commit.jobId !== serviceJobIdentity(commit.job) || !same(commit.job.scope, deps.scope) || !same(commit.job.slugs, expected.slugs) || !same(commit.job.sourceUrls, expected.sourceUrls)) throw new MonitoringUnavailable("Service committed job conflict");
    const original = await deps.store.getExecutionByReceipt(commit.receiptId);
    if (!original) throw new MonitoringUnavailable("Service original unavailable");
    const { start, receipt } = verifyStored(deps, original, commit.receiptId);
    if (!same(start.job, commit.job) || start.jobId !== commit.jobId) throw new MonitoringUnavailable("Service period original mismatch");
    // An old period returns its exact original; no new inventory/collector inputs.
    return { original, receipt };
  }
  const handle = (commit: JobCommit, receipt: ServiceReceipt) => ({ jobId: commit.jobId, receiptId: commit.receiptId, kind: receipt.stage, reportSha256: receipt.reportSha256, reportLength: receipt.reportLength, evidenceClass: receipt.evidenceClass, origin: SERVICE_RECEIPT_POLICY });
  async function run(request: Request, id: string) {
    HASH.parse(id);
    const producer = deps.producer;
    if (!producer) throw new MonitoringUnavailable("Service producer unavailable");
    const worker = await producer.authenticateWorker(request);
    if (!worker || !same(worker.scope, deps.scope) || !HASH.safeParse(worker.workerKey).success) throw new MonitoringDenied("Service producer authentication required");
    const loaded = await deps.loadJob(id);
    if (!loaded) throw new MonitoringUnavailable("Canonical service job unavailable");
    const job = serviceJobSchema.parse(copy(loaded)); checkServiceJob(job, now(deps));
    if (serviceJobIdentity(job) !== id || !same(job.scope, deps.scope)) throw new MonitoringDenied("Service job scope mismatch");
    await rights(deps, job, "generate");
    const existing = await deps.store.getJob(id);
    if (existing) return handle(existing, (await readCommitted(existing, job)).receipt);
    const inventory = await deps.loadInventory(), inventorySha256 = inventoryDigest(inventory.catalog, inventory.curated);
    const allowed = inventorySourceUrls(inventory.catalog, inventory.curated, job.slugs);
    if (job.kind === "capture" && job.sourceUrls.some(url => !allowed.includes(url))) throw new MonitoringUnavailable("Source outside canonical service watchlist");
    const startedAt = now(deps), runtime = producer.authorization(startedAt);
    const start = producer.signStart({ schemaVersion: 1, policy: SERVICE_RECEIPT_POLICY, executionId: randomUUID(), nonce: randomUUID(), job, jobId: id, inventorySha256, runtime, evidenceClass: deps.evidenceClass, startedAt });
    if (!deps.verifier.verifyStart(start)) throw new MonitoringUnavailable("Service start authorization unavailable");
    await deps.store.beginExecution(start);
    let sourceBytes: Buffer | null = null, reportBytes: Buffer | null = null;
    if (job.kind === "capture") {
      const collectorClass = deps.collectCanonicalSources.evidenceClass;
      if (collectorClass && collectorClass !== deps.evidenceClass || deps.evidenceClass === "server-collection" && collectorClass !== "server-collection") throw new MonitoringUnavailable("Service collector evidence class mismatch");
      let previous: SourceReport | null = null;
      if (job.receiptIds.length) {
        const prior = await admitServiceReceipt(deps, job.receiptIds[0], job, inventory);
        if (!prior.source || prior.receipt.stage !== "capture" || timestamp(prior.receipt.completedAt) >= timestamp(startedAt)) throw new MonitoringUnavailable("Invalid service predecessor");
        previous = prior.source;
      }
      const controller = new AbortController(); let timer: ReturnType<typeof setTimeout> | undefined;
      const expired = new Promise<never>((_resolve, reject) => { timer = setTimeout(() => { controller.abort(); reject(new MonitoringUnavailable("Service capture deadline exceeded")); }, 30000); });
      let payload: unknown;
      try { payload = await Promise.race([deps.collectCanonicalSources(copy(job), { maxSourceAttempts: 2, maxRobotsRequests: 1, deadline: new Date(timestamp(startedAt) + 30000).toISOString(), signal: controller.signal }, { inventory: copy(inventory), previous: previous && copy(previous) }), expired]); }
      finally { clearTimeout(timer); controller.abort(); }
      const source = validateSourceReport(payload, inventory.catalog, inventory.curated);
      sourceBytes = canonicalJson(source);
      if (sourceBytes.length > MAX_SOURCE_BYTES) throw new MonitoringUnavailable("Service source budget exceeded");
      sourceWindow(source, start, now(deps));
    } else {
      const snapshots: ServiceSnapshot[] = [], executions = new Set<string>();
      for (const receiptId of job.receiptIds) {
        const admitted = await admitServiceReceipt(deps, receiptId, job, inventory), receipt = admitted.receipt;
        if (!admitted.source || receipt.stage !== "capture" || timestamp(receipt.completedAt) > timestamp(job.periodEnd) || executions.has(receipt.executionId)) throw new MonitoringUnavailable("Invalid/duplicate service capture");
        executions.add(receipt.executionId);
        snapshots.push({ report: admitted.source, evidence: { receiptSha256: receiptId, sourceSha256: receipt.sourceSha256!, executionId: receipt.executionId, serviceId: receipt.runtime.serviceId, keyId: receipt.runtime.keyId, startedAt: receipt.startedAt, completedAt: receipt.completedAt, origin: SERVICE_RECEIPT_POLICY, evidenceClass: receipt.evidenceClass } });
      }
      reportBytes = renderServiceHistory(buildServiceHistory(snapshots, job.periodEnd, inventory.catalog, inventory.curated, job.slugs));
      if (reportBytes.length > MAX_REPORT_BYTES) throw new MonitoringUnavailable("Service report budget exceeded");
    }
    const completedAt = now(deps), elapsed = timestamp(completedAt) - timestamp(startedAt);
    if (elapsed < 0 || elapsed > (job.kind === "capture" ? 30000 : 60000)) throw new MonitoringUnavailable("Service execution interval exceeded");
    await rights(deps, job, "generate");
    const receipt = producer.signReceipt(start, { schemaVersion: 1, policy: SERVICE_RECEIPT_POLICY, executionId: start.executionId, nonce: start.nonce, jobId: id, inventorySha256, runtime, evidenceClass: deps.evidenceClass, stage: job.kind, startedAt, completedAt, startSha256: sha256(canonicalJson(start)), sourceSha256: sourceBytes && sha256(sourceBytes), sourceLength: sourceBytes?.length ?? 0, reportSha256: reportBytes && sha256(reportBytes), reportLength: reportBytes?.length ?? 0, reportPolicy: reportBytes ? SERVICE_REPORT_POLICY : null, inputReceiptIds: job.receiptIds });
    const original: ServiceOriginal = { start, status: "completed", receiptBytes: canonicalJson(receipt), sourceBytes, reportBytes };
    if (!deps.verifier.verifyOriginal(original)) throw new MonitoringUnavailable("Service completion verification failed");
    const receiptId = sha256(original.receiptBytes);
    await deps.store.completeExecution(start.executionId, original);
    await admitServiceReceipt(deps, receiptId, job, inventory);
    await rights(deps, job, "generate");
    const winner = await deps.store.commitJobIfAbsent({ jobId: id, receiptId, job });
    return handle(winner, (await readCommitted(winner, job)).receipt);
  }
  async function recover(request: Request, id: string): Promise<Buffer | null> {
    if (!HASH.safeParse(id).success) return null;
    const principal = await deps.authenticateOwner(request);
    if (!principal || !same(principal.scope, deps.scope) || !HASH.safeParse(principal.ownerKey).success) return null;
    const commit = await deps.store.getJob(id);
    if (!commit || commit.jobId !== id || serviceJobIdentity(commit.job) !== id || !same(commit.job.scope, principal.scope) || commit.job.ownerKey !== principal.ownerKey || commit.job.kind !== "report") return null;
    checkServiceJob(commit.job, now(deps));
    try { await rights(deps, commit.job, "recover"); } catch (error) { if (error instanceof MonitoringDenied) return null; throw error; }
    const saved = await readCommitted(commit, commit.job);
    try { await rights(deps, commit.job, "recover"); } catch (error) { if (error instanceof MonitoringDenied) return null; throw error; }
    return Buffer.from(saved.original.reportBytes!);
  }
  return { run, recover };
}
