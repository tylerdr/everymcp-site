import { createServiceRecordedRuntime, type ServiceRuntimeDependencies } from "./service-runtime";
import { MonitoringUnavailable, type JobCommit } from "./runtime";
import { controlEqual, validateCanonicalJob, type MonitoringControlStore } from "./control-contract";
import type { createOwnedMonitoringWorkflow } from "./owned-workflow";
import { SERVICE_RECEIPT_POLICY_V2, serviceJobIdentity, type ServiceCustodyStore, type ServiceOriginal, type ServiceStart } from "./service-records";

/** Binds the actual owned-job adapters at custody as well as runtime rights boundaries.
 * Older service/Python/Node constructors and their original verification policies are unchanged.
 */
export function createOwnedServiceRuntime(base: Omit<ServiceRuntimeDependencies, "loadJob" | "currentRights">, workflow: ReturnType<typeof createOwnedMonitoringWorkflow>, control: MonitoringControlStore) {
  if (!controlEqual(base.scope, control.scope)) throw new MonitoringUnavailable("Owned runtime scope unavailable");
  const unavailable = () => new MonitoringUnavailable("Canonical execution binding unavailable");
  async function check(start: ServiceStart) {
    if (start.policy !== SERVICE_RECEIPT_POLICY_V2) throw unavailable();
    const found = await control.getCanonicalJob(start.jobId);
    if (!found) throw unavailable();
    const row = validateCanonicalJob(found, base.scope);
    if (!controlEqual(start.job, row.job) || start.inventorySha256 !== row.inventorySha256 || Date.parse(start.startedAt) < Date.parse(row.createdAt) || Date.parse(start.startedAt) >= Date.parse(row.expiresAt)) throw unavailable();
  }
  async function checkCommit(commit: JobCommit) {
    const row = await control.getCanonicalJob(commit.jobId);
    if (!row || !controlEqual(validateCanonicalJob(row, base.scope).job, commit.job)) throw unavailable();
  }
  const store: ServiceCustodyStore = {
    async beginExecution(start) { await check(start); return base.store.beginExecution(start); },
    async completeExecution(id: string, original: ServiceOriginal) { await check(original.start); return base.store.completeExecution(id, original); },
    async getExecutionByReceipt(id) { const result = await base.store.getExecutionByReceipt(id); if (result) await check(result.start); return result; },
    async getJob(id) { const result = await base.store.getJob(id); if (result) await checkCommit(result); return result; },
    async commitJobIfAbsent(commit) { await checkCommit(commit); const result = await base.store.commitJobIfAbsent(commit); await checkCommit(result); return result; },
  };
  return createServiceRecordedRuntime({ ...base, store, receiptPolicy: SERVICE_RECEIPT_POLICY_V2,
    async loadReportContext(job) {
      const row = await control.getCanonicalJob(serviceJobIdentity(job));
      if (!row || !controlEqual(validateCanonicalJob(row, base.scope).job, job)) throw unavailable();
      return { watchlistSha256: row.watchlistSha256, coverage: row.coverage };
    }, loadJob: workflow.loadJob, currentRights: workflow.currentRights });
}
