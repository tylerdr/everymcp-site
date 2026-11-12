import { z } from "zod";
import { MonitoringDenied, MonitoringUnavailable, type Job, type Rights, type Scope } from "./runtime";
import { canonicalJson, inventoryDigest, inventorySourceUrls, sha256, timestamp } from "./source-contract";
import { serviceJobIdentity, validateServiceOriginal, type ServiceCustodyStore } from "./service-records";
import type { ServiceVerifier } from "./service-authority";
import { createWatchlistSelectionQualifier, WatchlistSelectionError } from "./watchlist-selection";
import { controlEqual as same, controlHash, watchlistInputSchema, validateWatchlist, validateCanonicalJob, WatchlistConflict, type BillingAuthorization, type BillingBinding, type CanonicalJob, type MonitoringControlStore, type Watchlist } from "./control-contract";

type Inventory = { catalog: unknown[]; curated: unknown[] };
export type RecurringDecision = { decision: "active" | "denied" | "unknown"; reason: string; authorization?: BillingAuthorization };
export type RecurringReader = (binding: BillingBinding, original?: BillingAuthorization) => Promise<RecurringDecision>;
const scheduleSchema = z.object({ cadenceSeconds: z.number().int().min(86400).max(2592000), historyPeriods: z.number().int().min(2).max(32), maxJobAgeSeconds: z.number().int().min(60).max(86400) }).strict();
export type MonitoringSchedule = z.infer<typeof scheduleSchema>;
type Dependencies = { scope: Scope; configurationStore?: MonitoringControlStore; control: MonitoringControlStore; custody: ServiceCustodyStore; verifier: ServiceVerifier; readRights: RecurringReader; loadInventory(): Promise<Inventory>; now(): Date; schedule: MonitoringSchedule };
export type Coverage = { expectedPeriods: number; availablePeriods: number; missingPeriodEnds: string[]; state: "complete" | "gaps" };
const denied = () => new MonitoringDenied("Monitoring access denied");
const unavailable = () => new MonitoringUnavailable("Monitoring configuration or rights unavailable");
const copy = <T,>(value: T): T => JSON.parse(canonicalJson(value).toString()) as T;

/** Server-owned selection: no caller URL, invoice, owner, period, receipt or entitlement inputs. */
export function createOwnedMonitoringWorkflow(input: Dependencies) {
  const schedule = scheduleSchema.parse(input.schedule), scope = copy(input.scope);
  if (schedule.historyPeriods * schedule.cadenceSeconds > 90 * 86400 || schedule.maxJobAgeSeconds > schedule.cadenceSeconds || !same(scope, input.control.scope) || input.configurationStore && !same(scope, input.configurationStore.scope) || !same(scope, input.verifier.scope)) throw unavailable();
  function now() { const value = input.now(); if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw unavailable(); return value.toISOString(); }
  function period(watch: Watchlist, index: number, kind: Job["kind"] = "capture") {
    const anchor = Math.ceil(timestamp(watch.configuredAt) / 1000) * 1000 + 1000;
    const end = anchor + index * schedule.cadenceSeconds * 1000;
    return { periodStart: index ? new Date(end - schedule.cadenceSeconds * 1000).toISOString() : watch.configuredAt, periodEnd: new Date(end + (kind === "report" ? schedule.maxJobAgeSeconds * 1000 : 0)).toISOString() };
  }
  function due(watch: Watchlist, at: string, kind: Job["kind"]) {
    const first = timestamp(period(watch, 0, kind).periodEnd);
    if (timestamp(at) < first) return null;
    const index = Math.floor((timestamp(at) - first) / (schedule.cadenceSeconds * 1000));
    const selected = period(watch, index, kind), expiresAt = new Date(timestamp(selected.periodEnd) + schedule.maxJobAgeSeconds * 1000).toISOString();
    return { index, ...selected, expiresAt, expired: timestamp(at) >= timestamp(expiresAt) };
  }
  function jobFor(watch: Watchlist, index: number, kind: Job["kind"], receiptIds: string[] = []): Job {
    return { scope, ownerKey: watch.ownerKey, watchlistId: watch.watchlistId, version: watch.version, slugs: watch.slugs, ...period(watch, index, kind), kind, sourceUrls: kind === "capture" ? watch.sourceUrls : [], receiptIds };
  }
  async function current(owner: string) { controlHash.parse(owner); const row = await input.control.getWatchlist(owner); return row && validateWatchlist(row, scope); }
  async function configure(owner: string, body: unknown) {
    controlHash.parse(owner); if (!input.configurationStore) throw unavailable();
    const request = watchlistInputSchema.parse(body), slugs = [...new Set(request.slugs)].sort();
    if (slugs.length !== request.slugs.length) throw new WatchlistConflict("Duplicate listing selection");
    const replay = await input.configurationStore.getMutation(owner, request.mutationId);
    if (replay) {
      const original = validateWatchlist(replay, scope);
      if (original.ownerKey !== owner || original.requestSha256 !== sha256(canonicalJson({ ...request, slugs }))) throw new WatchlistConflict("Mutation reference already used");
      return original;
    }
    const inventory = await input.loadInventory();
    const selection = createWatchlistSelectionQualifier(inventory.catalog, inventory.curated)(slugs);
    if (selection.reasons.length) throw new WatchlistSelectionError(selection);
    const { sourceUrls } = selection;
    return input.configurationStore.saveWatchlist({ ...request, slugs, ownerKey: owner, sourceUrls, inventorySha256: inventoryDigest(inventory.catalog, inventory.curated), configuredAt: now() });
  }
  async function stored(id: string) { const row = await input.control.getCanonicalJob(id); return row && validateCanonicalJob(row, scope); }
  async function generationConfiguration(row: CanonicalJob, at: string) {
    const watch = await current(row.job.ownerKey);
    if (!watch || !watch.enabled || watch.version !== row.job.version || sha256(canonicalJson(watch)) !== row.watchlistSha256 || watch.inventorySha256 !== row.inventorySha256 || timestamp(at) < timestamp(row.createdAt) || timestamp(at) >= timestamp(row.expiresAt)) return false;
    const inventory = await input.loadInventory();
    if (inventoryDigest(inventory.catalog, inventory.curated) !== row.inventorySha256) return false;
    const selected = due(watch, at, row.job.kind);
    return !!selected && !selected.expired && row.expiresAt === selected.expiresAt && same(row.job, jobFor(watch, selected.index, row.job.kind, row.job.receiptIds));
  }
  async function readBoundRights(owner: string, original?: BillingAuthorization) {
    const binding = await input.control.getBinding(owner);
    if (!binding || !binding.enabled) return { decision: "denied", reason: "not_enrolled" } as const;
    if (!same(binding.scope, scope) || binding.ownerKey !== owner || original && (binding.customerId !== original.customerId || binding.subscriptionId !== original.subscriptionId)) return { decision: "unknown", reason: "binding_conflict" } as const;
    return input.readRights(binding, original);
  }
  async function currentRights(job: Job, action: "generate" | "recover"): Promise<Rights> {
    const base = { scope: job.scope, ownerKey: job.ownerKey, watchlistId: job.watchlistId, version: job.version, periodStart: job.periodStart, periodEnd: job.periodEnd, action };
    try {
      if (!same(job.scope, scope)) return { ...base, decision: "denied" };
      const row = await stored(serviceJobIdentity(job));
      if (!row || !same(row.job, job)) return { ...base, decision: "unknown" };
      const version = await input.control.getVersion(job.ownerKey, job.version);
      if (!version || sha256(canonicalJson(validateWatchlist(version, scope))) !== row.watchlistSha256 || !same(job.slugs, version.slugs) || !same(job.sourceUrls, job.kind === "capture" ? version.sourceUrls : [])) return { ...base, decision: "unknown" };
      if (action === "generate" && !await generationConfiguration(row, now())) return { ...base, decision: "denied" };
      const result = await readBoundRights(job.ownerKey, row.authorization);
      if (result.decision !== "active" || !result.authorization) return { ...base, decision: result.decision === "active" ? "unknown" : result.decision };
      if (action === "generate" && (timestamp(job.periodStart) < timestamp(result.authorization.periodStart) || timestamp(job.periodEnd) > timestamp(result.authorization.periodEnd) || !await generationConfiguration(row, now()))) return { ...base, decision: "denied" };
      return { ...base, decision: "active" };
    } catch { return { ...base, decision: "unknown" }; }
  }
  async function loadJob(id: string): Promise<Job | null> {
    controlHash.parse(id); const row = await stored(id);
    return row && await generationConfiguration(row, now()) ? copy(row.job) : null;
  }
  async function captureAt(watch: Watchlist, index: number) {
    const expected = jobFor(watch, index, "capture"), id = serviceJobIdentity(expected), commit = await input.custody.getJob(id);
    if (!commit) return null;
    const plan = await stored(id);
    if (!plan || commit.jobId !== id || !same(commit.job, plan.job) || !same({ ...commit.job, receiptIds: [] }, expected) || plan.watchlistSha256 !== sha256(canonicalJson(watch))) throw unavailable();
    const original = await input.custody.getExecutionByReceipt(commit.receiptId);
    if (!original || !input.verifier.verifyOriginal(original)) throw unavailable();
    const { start, receipt } = validateServiceOriginal(original);
    if (sha256(original.receiptBytes) !== commit.receiptId || start.jobId !== id || !same(start.job, plan.job) || receipt.stage !== "capture" || start.inventorySha256 !== watch.inventorySha256 || timestamp(receipt.completedAt) > timestamp(now())) throw unavailable();
    return { receiptId: commit.receiptId, completedAt: receipt.completedAt };
  }
  async function prepare(owner: string, kind: Job["kind"]) {
    controlHash.parse(owner); z.enum(["capture", "report"]).parse(kind);
    const watch = await current(owner), at = now();
    if (!watch || !watch.enabled) throw denied();
    const selected = due(watch, at, kind);
    if (!selected || selected.expired) return { state: "not_due" as const, jobId: null, coverage: null };
    const inventory = await input.loadInventory();
    if (inventoryDigest(inventory.catalog, inventory.curated) !== watch.inventorySha256 || !same(inventorySourceUrls(inventory.catalog, inventory.curated, watch.slugs), watch.sourceUrls)) throw new WatchlistConflict("Catalog changed; save a new watchlist version");
    const expected = jobFor(watch, selected.index, kind), id = serviceJobIdentity(expected), existing = await stored(id);
    if (existing) {
      const rights = await currentRights(existing.job, "generate");
      if (rights.decision === "denied") throw denied(); if (rights.decision !== "active") throw unavailable();
      return { state: "ready" as const, jobId: id, coverage: existing.coverage };
    }
    const receiptIds: string[] = [], missing: string[] = [];
    const first = Math.max(0, selected.index - schedule.historyPeriods + 1), last = kind === "capture" ? selected.index - 1 : selected.index;
    let currentCapture = false;
    for (let index = first; index <= last; index++) {
      const capture = await captureAt(watch, index);
      if (capture && (kind !== "report" || timestamp(capture.completedAt) <= timestamp(selected.periodEnd))) { receiptIds.push(capture.receiptId); if (index === selected.index) currentCapture = true; }
      else missing.push(period(watch, index).periodEnd);
    }
    const coverage: Coverage = { expectedPeriods: Math.max(0, last - first + 1), availablePeriods: receiptIds.length, missingPeriodEnds: missing, state: missing.length ? "gaps" : "complete" };
    if (kind === "report" && !currentCapture) return { state: "waiting_for_capture" as const, jobId: null, coverage };
    const result = await readBoundRights(owner);
    if (result.decision === "denied") throw denied(); if (result.decision !== "active" || !result.authorization) throw unavailable();
    const job = jobFor(watch, selected.index, kind, kind === "capture" ? receiptIds.slice(-1) : receiptIds);
    // Never backdate a capture/report or refresh an expired job under its old identity.
    const row: CanonicalJob = { jobId: id, job, watchlistSha256: sha256(canonicalJson(watch)), inventorySha256: watch.inventorySha256, createdAt: at, expiresAt: selected.expiresAt, authorization: result.authorization, coverage };
    const winner = await input.control.putCanonicalJob(row);
    if (!same(winner.job, job) || (await currentRights(winner.job, "generate")).decision !== "active") throw unavailable();
    return { state: "ready" as const, jobId: winner.jobId, coverage: winner.coverage };
  }
  return { configure, current, prepare, loadJob, currentRights };
}
