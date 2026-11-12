import { z } from "zod";
import { MAX_REPORT_BYTES, MonitoringUnavailable, scopeSchema, type Job, type JobCommit } from "./runtime";
import { canonicalJson, MAX_SOURCE_BYTES, parseCanonical, sha256, timestamp } from "./source-contract";

export const SERVICE_RECEIPT_POLICY = "everymcp-service-custody-v1";
export const SERVICE_REPORT_POLICY = "source-receipt-history-service-v1";
const HASH = z.string().regex(/^[a-f0-9]{64}$/);
export const serviceNameSchema = z.string().regex(/^[a-z0-9][a-z0-9._-]{0,79}$/);
export const serviceDateSchema = z.string().refine(value => { try { timestamp(value); return true; } catch { return false; } });
const evidence = z.enum(["synthetic-fixture", "server-collection"]);
const signature = z.string().regex(/^[A-Za-z0-9_-]{86}$/).refine(value => Buffer.from(value, "base64url").length === 64 && Buffer.from(value, "base64url").toString("base64url") === value);
export const serviceJobSchema = z.object({ scope: scopeSchema, ownerKey: HASH, watchlistId: HASH, version: z.number().int().min(1).max(2147483647), slugs: z.array(z.string().regex(/^[a-z0-9][a-z0-9._-]{0,100}$/)).min(1).max(100), periodStart: serviceDateSchema, periodEnd: serviceDateSchema, kind: z.enum(["capture", "report"]), sourceUrls: z.array(z.string()).max(2), receiptIds: z.array(HASH).max(32) }).strict();
export const serviceAuthorizationSchema = z.object({ method: z.literal("authenticated-service-record-v1"), authorityClass: z.enum(["synthetic-fixture", "service-recorded"]), serviceId: serviceNameSchema, keyId: serviceNameSchema, validFrom: serviceDateSchema, validUntil: serviceDateSchema }).strict();
export type ServiceAuthorization = z.infer<typeof serviceAuthorizationSchema>;
export const serviceStartSchema = z.object({ schemaVersion: z.literal(1), policy: z.literal(SERVICE_RECEIPT_POLICY), executionId: z.string().uuid(), nonce: z.string().uuid(), job: serviceJobSchema, jobId: HASH, inventorySha256: HASH, runtime: serviceAuthorizationSchema, evidenceClass: evidence, startedAt: serviceDateSchema, signature }).strict();
export const unsignedServiceStartSchema = serviceStartSchema.omit({ signature: true });
export type ServiceStart = z.infer<typeof serviceStartSchema>;
export type UnsignedServiceStart = z.infer<typeof unsignedServiceStartSchema>;
export const serviceReceiptSchema = z.object({ schemaVersion: z.literal(1), policy: z.literal(SERVICE_RECEIPT_POLICY), executionId: z.string().uuid(), nonce: z.string().uuid(), jobId: HASH, inventorySha256: HASH, runtime: serviceAuthorizationSchema, evidenceClass: evidence, stage: z.enum(["capture", "report"]), startedAt: serviceDateSchema, completedAt: serviceDateSchema, startSha256: HASH, sourceSha256: HASH.nullable(), sourceLength: z.number().int().min(0).max(MAX_SOURCE_BYTES), reportSha256: HASH.nullable(), reportLength: z.number().int().min(0).max(MAX_REPORT_BYTES), reportPolicy: z.literal(SERVICE_REPORT_POLICY).nullable(), inputReceiptIds: z.array(HASH).max(32), signature }).strict();
export const unsignedServiceReceiptSchema = serviceReceiptSchema.omit({ signature: true });
export type ServiceReceipt = z.infer<typeof serviceReceiptSchema>;
export type UnsignedServiceReceipt = z.infer<typeof unsignedServiceReceiptSchema>;
export type ServiceOriginal = { start: ServiceStart; status: "completed"; receiptBytes: Buffer; sourceBytes: Buffer | null; reportBytes: Buffer | null };
export interface ServiceCustodyStore {
  beginExecution(start: ServiceStart): Promise<void>;
  completeExecution(id: string, original: ServiceOriginal): Promise<void>;
  getExecutionByReceipt(id: string): Promise<ServiceOriginal | null>;
  getJob(id: string): Promise<JobCommit | null>;
  commitJobIfAbsent(commit: JobCommit): Promise<JobCommit>;
}
export const sameServiceValue = (a: unknown, b: unknown) => canonicalJson(a).equals(canonicalJson(b));
/** Different origin, different job namespace; renderer changes must keep this seed. */
export function serviceJobIdentity(input: Job): string {
  const { scope, ownerKey, watchlistId, version, slugs, periodStart, periodEnd, kind } = serviceJobSchema.parse(input);
  return sha256(canonicalJson({ origin: SERVICE_RECEIPT_POLICY, scope, ownerKey, watchlistId, version, slugs, periodStart, periodEnd, kind }));
}
export function checkServiceJob(input: Job, at: string): void {
  const job = serviceJobSchema.parse(input);
  if (!sameServiceValue(job.slugs, [...new Set(job.slugs)].sort()) || timestamp(job.periodStart) >= timestamp(job.periodEnd) || timestamp(job.periodEnd) > timestamp(at) || timestamp(job.periodEnd) - timestamp(job.periodStart) > 90 * 86400000) throw new MonitoringUnavailable("Invalid canonical service job");
  if (job.kind === "capture" && (!job.sourceUrls.length || job.receiptIds.length > 1 || new Set(job.sourceUrls).size !== job.sourceUrls.length) || job.kind === "report" && (!job.receiptIds.length || job.sourceUrls.length || new Set(job.receiptIds).size !== job.receiptIds.length)) throw new MonitoringUnavailable("Invalid service stage inputs");
}
export function validateServiceStart(input: unknown): ServiceStart {
  const start = serviceStartSchema.parse(input);
  if (canonicalJson(start).length > 65536 || start.jobId !== serviceJobIdentity(start.job)) throw new MonitoringUnavailable("Invalid service start");
  checkServiceJob(start.job, start.startedAt);
  const at = timestamp(start.startedAt);
  if (at < timestamp(start.runtime.validFrom) || at > timestamp(start.runtime.validUntil) || start.runtime.authorityClass === "synthetic-fixture" && (start.evidenceClass !== "synthetic-fixture" || start.job.scope.mode !== "test") || (start.runtime.authorityClass === "service-recorded") !== (start.evidenceClass === "server-collection")) throw new MonitoringUnavailable("Invalid service authority class or interval");
  return start;
}
/** Integrity/cross-binding only; signature trust is separately supplied by the fixed verifier. */
export function validateServiceOriginal(input: ServiceOriginal): { start: ServiceStart; receipt: ServiceReceipt } {
  const start = validateServiceStart(input.start);
  if (input.status !== "completed" || !Buffer.isBuffer(input.receiptBytes) || input.receiptBytes.length > 65536) throw new MonitoringUnavailable("Invalid service original");
  const receipt = serviceReceiptSchema.parse(parseCanonical(input.receiptBytes, 65536));
  if (receipt.startSha256 !== sha256(canonicalJson(start)) || receipt.jobId !== start.jobId || receipt.executionId !== start.executionId || receipt.nonce !== start.nonce || receipt.inventorySha256 !== start.inventorySha256 || !sameServiceValue(receipt.runtime, start.runtime) || receipt.evidenceClass !== start.evidenceClass || receipt.stage !== start.job.kind || receipt.startedAt !== start.startedAt || !sameServiceValue(receipt.inputReceiptIds, start.job.receiptIds)) throw new MonitoringUnavailable("Service record cross-binding mismatch");
  const elapsed = timestamp(receipt.completedAt) - timestamp(start.startedAt);
  if (elapsed < 0 || elapsed > (receipt.stage === "capture" ? 30000 : 60000) || timestamp(receipt.completedAt) > timestamp(start.runtime.validUntil)) throw new MonitoringUnavailable("Service record interval mismatch");
  if (receipt.stage === "capture") {
    if (!Buffer.isBuffer(input.sourceBytes) || input.sourceBytes.length < 1 || input.sourceBytes.length > MAX_SOURCE_BYTES || input.sourceBytes.length !== receipt.sourceLength || sha256(input.sourceBytes) !== receipt.sourceSha256 || input.reportBytes !== null || receipt.reportSha256 !== null || receipt.reportLength !== 0 || receipt.reportPolicy !== null) throw new MonitoringUnavailable("Service source bytes mismatch");
    parseCanonical(input.sourceBytes);
  } else if (!Buffer.isBuffer(input.reportBytes) || input.reportBytes.length < 1 || input.reportBytes.length > MAX_REPORT_BYTES || input.reportBytes.length !== receipt.reportLength || sha256(input.reportBytes) !== receipt.reportSha256 || input.sourceBytes !== null || receipt.sourceSha256 !== null || receipt.sourceLength !== 0 || receipt.reportPolicy !== SERVICE_REPORT_POLICY) throw new MonitoringUnavailable("Service report bytes mismatch");
  return { start, receipt };
}
