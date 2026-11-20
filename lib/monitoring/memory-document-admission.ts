import { createPublicKey, verify, type KeyObject } from "node:crypto";
import { z } from "zod";
import { scopeSchema } from "./runtime";
import { canonicalJson, parseCanonical, sha256, timestamp } from "./source-contract";
import { isPublicAddress } from "./transport";
import { robotsPermission } from "./robots";

/** Unbound prospective contract. No collector, inventory, route, signer or storage registration. */
export const MEMORY_DOCUMENT_SUBJECT = Object.freeze({
  policy: "everymcp-document-subject-v1", documentId: "memory-changelog", revision: 1,
  sourcePolicy: "everymcp-memory-changelog-source-v1", listingSlug: "memory",
  catalogSource: "https://github.com/modelcontextprotocol/servers/tree/main/src/memory",
  documentUrl: "https://raw.githubusercontent.com/modelcontextprotocol/servers/main/src/memory/CHANGELOG.md",
  relationship: "associated_document_not_directory_coverage",
} as const);
export const MEMORY_DOCUMENT_SUBJECT_SHA256 = sha256(canonicalJson(MEMORY_DOCUMENT_SUBJECT));
export const MEMORY_DOCUMENT_ADMISSION_POLICY = "everymcp-memory-document-admission-v1";
export const MEMORY_DOCUMENT_DOMAINS = Object.freeze({
  observation: "everymcp-memory-document:observation:v1\0",
  review: "everymcp-memory-document:review:v1\0",
});
export const MEMORY_DOCUMENT_LIMITS = Object.freeze({ bodyBytes: 16384, robotsBytes: 65536, envelopeBytes: 8192, totalBytes: 65536, sourceRequests: 1, robotsRequests: 1, requestMs: 8000, captureMs: 30000, freshnessMs: 7 * 86400000, historyMs: 90 * 86400000 });
const URL = MEMORY_DOCUMENT_SUBJECT.documentUrl, ROBOTS = "https://raw.githubusercontent.com/robots.txt";
const LICENSE = "https://github.com/modelcontextprotocol/servers/blob/main/LICENSE";
const CC = "https://creativecommons.org/licenses/by/4.0/";
const HASH = z.string().regex(/^[a-f0-9]{64}$/), OID = z.string().regex(/^[a-f0-9]{40}$/);
const name = z.string().regex(/^[a-z0-9][a-z0-9._-]{0,79}$/);
const date = z.string().refine(value => { try { timestamp(value); return true; } catch { return false; } });
const text = (max: number) => z.string().min(1).max(max).refine(value => Buffer.from(value).toString() === value && !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\u202a-\u202e\u2066-\u2069]/.test(value));
const signature = z.string().regex(/^[A-Za-z0-9_-]{86}$/).refine(value => Buffer.from(value, "base64url").toString("base64url") === value);
const bytes = (max: number) => z.custom<Buffer>(Buffer.isBuffer).refine(value => value.length <= max);
const same = (a: unknown, b: unknown) => canonicalJson(a).equals(canonicalJson(b));

const jobSchema = z.object({
  policy: z.literal("everymcp-memory-document-job-v1"), scope: scopeSchema,
  ownerKey: HASH, watchlistId: HASH, watchlistVersion: z.number().int().min(1).max(2147483647),
  subjectSha256: z.literal(MEMORY_DOCUMENT_SUBJECT_SHA256), periodStart: date, periodEnd: date,
}).strict();
export type MemoryDocumentJob = z.infer<typeof jobSchema>;
export function memoryDocumentJobIdentity(input: MemoryDocumentJob): string {
  const job = jobSchema.parse(input), duration = timestamp(job.periodEnd) - timestamp(job.periodStart);
  if (duration <= 0 || duration > MEMORY_DOCUMENT_LIMITS.historyMs) throw new Error("Invalid document job period");
  return sha256(canonicalJson(job));
}
const authoritySchema = z.object({ authorityId: name, keyId: name, publicKey: z.string().min(1).max(8192), validFrom: date, validUntil: date, revoked: z.boolean(), fixtureOnly: z.boolean() }).strict();
type Authority = z.infer<typeof authoritySchema>;
const identity = { authorityId: name, keyId: name, evidenceClass: z.enum(["synthetic-fixture", "service-recorded"]), signature };
const connection = z.object({
  requestedUrl: z.string().max(2048), finalUrl: z.string().max(2048), redirects: z.literal(0),
  method: z.literal("GET"), credentials: z.literal("none"), tlsVerified: z.literal(true),
  tlsHostname: z.literal("raw.githubusercontent.com"), addresses: z.array(z.string().max(64)).min(1).max(32), pinnedAddress: z.string().max(64),
  startedAt: date, completedAt: date, durationMs: z.number().int().min(0).max(8000),
  status: z.number().int(), complete: z.literal(true), encoding: z.literal("identity"),
  receivedBytes: z.number().int().min(0).max(65536), bodySha256: HASH,
}).strict();
const observationSchema = z.object({
  policy: z.literal("everymcp-memory-document-observation-v1"), sourcePolicy: z.literal(MEMORY_DOCUMENT_SUBJECT.sourcePolicy),
  subjectSha256: z.literal(MEMORY_DOCUMENT_SUBJECT_SHA256), jobId: HASH, scope: scopeSchema,
  executionId: z.string().uuid(), nonce: z.string().uuid(), startedAt: date, completedAt: date,
  repositoryOwner: z.literal("modelcontextprotocol"), repository: z.literal("servers"), branch: z.literal("main"),
  licenseEvidenceUrl: z.literal(LICENSE), licenseBlobOid: OID,
  requests: z.object({ source: z.literal(1), robots: z.literal(1), durationMs: z.number().int().min(0).max(30000) }).strict(),
  source: connection.extend({ contentType: z.string().max(128), disposition: z.literal("checked_this_run"), cache: z.literal("not_reused") }).strict(), robots: connection,
  ...identity,
}).strict();
const reviewSchema = z.object({
  policy: z.literal("everymcp-memory-document-review-v1"), permissionPolicy: z.literal("memory-project-docs-ccby4-with-legacy-mit-v1"),
  subjectSha256: z.literal(MEMORY_DOCUMENT_SUBJECT_SHA256), scope: scopeSchema, documentUrl: z.literal(URL),
  repositoryOwner: z.literal("modelcontextprotocol"), repository: z.literal("servers"), branch: z.literal("main"),
  bodySha256: HASH, bodyBytes: z.number().int().min(1).max(16384),
  licenseEvidenceUrl: z.literal(LICENSE), licenseBlobOid: OID, provenanceEvidenceSha256: HASH,
  reviewedAt: date, validUntil: date, reviewerId: name,
  decision: z.literal("eligible_exact_bytes_under_reviewed_policy"),
  exclusions: z.object({ specifications: z.literal("absent"), doubtfulThirdPartyContent: z.literal("absent"), sensitiveContent: z.literal("absent"), linkedDestinations: z.literal("not_covered") }).strict(),
  attribution: z.object({
    title: text(160), creatorAttributions: z.array(text(160)).min(1).max(12), copyrightNotices: z.array(text(320)).min(1).max(8),
    sourceUrl: z.literal(URL), licenseUrl: z.literal(CC), licenseNotice: text(320), legacyMitNotice: text(1600),
    modificationNotice: text(320), warrantyNotice: text(320), recipientReuse: z.literal("underlying_licensed_material_remains_reusable"), endorsement: z.literal("none"),
  }).strict(), ...identity,
}).strict();
const configSchema = z.object({
  job: jobSchema, executionId: z.string().uuid(), nonce: z.string().uuid(), asOf: date,
  evidenceClass: z.enum(["synthetic-fixture", "service-recorded"]), producer: authoritySchema, reviewer: authoritySchema,
  reviewBytes: bytes(8192), expectedReviewSha256: HASH,
  // Fresh canonical scheduler state; not a request flag or assertion of durable replay protection.
  notBefore: date, lastHostRequestCompletedAt: date.nullable(),
}).strict();
export type MemoryDocumentAdmissionConfiguration = z.infer<typeof configSchema>;
const requestSchema = z.object({ observationBytes: bytes(8192), body: bytes(16384), robotsBody: bytes(65536) }).strict();
const FIXTURE_PUBLIC = new Set(["d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a", "3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c"]);
function keyFor(authority: Authority, fixture: boolean, asOf: number): { key: KeyObject; raw: string } {
  if (authority.revoked || authority.fixtureOnly !== fixture || timestamp(authority.validFrom) > asOf || timestamp(authority.validUntil) < asOf || timestamp(authority.validFrom) >= timestamp(authority.validUntil) || !/^-----BEGIN PUBLIC KEY-----\r?\n(?:[A-Za-z0-9+/=]+\r?\n)+-----END PUBLIC KEY-----\r?\n?$/.test(authority.publicKey)) throw new Error("Document authority unavailable");
  const key = createPublicKey(authority.publicKey), der = key.export({ type: "spki", format: "der" }) as Buffer, raw = der.subarray(-32).toString("hex");
  if (key.asymmetricKeyType !== "ed25519" || !fixture && FIXTURE_PUBLIC.has(raw)) throw new Error("Invalid document authority");
  return { key, raw };
}
function signed<T extends { authorityId: string; keyId: string; evidenceClass: string; signature: string }>(record: T, authority: Authority, key: KeyObject, domain: string, evidenceClass: string): boolean {
  const { signature: sig, ...body } = record;
  return record.authorityId === authority.authorityId && record.keyId === authority.keyId && record.evidenceClass === evidenceClass && verify(null, Buffer.concat([Buffer.from(domain), canonicalJson(body)]), key, Buffer.from(sig, "base64url"));
}
type Reason = "invalid_request" | "untrusted_observation" | "job_mismatch" | "review_mismatch" | "invalid_chronology" | "stale_observation" | "transport_claim_refused" | "body_mismatch" | "unsupported_content" | "robots_refused" | "budget_exceeded";
class Refusal extends Error { constructor(readonly reason: Reason) { super(reason); } }
function requireFact(value: unknown, reason: Reason): asserts value { if (!value) throw new Refusal(reason); }
function utf8(body: Buffer): string {
  const value = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(body);
  requireFact(Buffer.from(value).equals(body) && !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\u202a-\u202e\u2066-\u2069]/.test(value), "unsupported_content");
  return value;
}
function checkConnection(c: z.infer<typeof connection>, url: string, body: Buffer, from: number, until: number) {
  requireFact(c.requestedUrl === url && c.finalUrl === url && c.addresses.every(isPublicAddress) && new Set(c.addresses).size === c.addresses.length && c.addresses.includes(c.pinnedAddress), "transport_claim_refused");
  const start = timestamp(c.startedAt), end = timestamp(c.completedAt);
  requireFact(start >= from && end >= start && end <= until && end - start === c.durationMs, "invalid_chronology");
  requireFact(c.receivedBytes === body.length && c.bodySha256 === sha256(body), "body_mismatch");
}

/** Server-only configuration is a trust boundary, not an HTTP request schema. Construct afresh
 * after canonical job/owner/current-rights checks. These checks are NOT performed or granted here.
 * Review asserts exact-byte eligibility; neither signatures nor text heuristics prove legal rights,
 * safe content, truthful collection/TLS/DNS or independent platform execution. No replay store. */
export function createMemoryDocumentAdmission(input: MemoryDocumentAdmissionConfiguration) {
  const parsed = configSchema.parse(input);
  const config = { ...parsed, reviewBytes: Buffer.from(parsed.reviewBytes) };
  const asOf = timestamp(config.asOf), jobId = memoryDocumentJobIdentity(config.job), fixture = config.evidenceClass === "synthetic-fixture";
  if (fixture && config.job.scope.mode !== "test" || timestamp(config.job.periodEnd) > asOf || timestamp(config.notBefore) > asOf || config.lastHostRequestCompletedAt && timestamp(config.lastHostRequestCompletedAt) > asOf) throw new Error("Document job unavailable");
  const producer = keyFor(config.producer, fixture, asOf), reviewer = keyFor(config.reviewer, fixture, asOf);
  if (producer.raw === reviewer.raw) throw new Error("Document producer and review keys must differ");
  const review = reviewSchema.parse(parseCanonical(config.reviewBytes, 8192));
  const reviewedAt = timestamp(review.reviewedAt);
  if (sha256(config.reviewBytes) !== config.expectedReviewSha256 || !signed(review, config.reviewer, reviewer.key, MEMORY_DOCUMENT_DOMAINS.review, config.evidenceClass) || !same(review.scope, config.job.scope) || reviewedAt > asOf || reviewedAt < timestamp(config.reviewer.validFrom) || reviewedAt > timestamp(config.reviewer.validUntil) || timestamp(review.validUntil) < asOf || timestamp(review.validUntil) < reviewedAt) throw new Error("Reviewed document provenance unavailable");
  return (input: unknown) => {
    try {
      const request = requestSchema.safeParse(input); requireFact(request.success, "invalid_request");
      const { observationBytes, body, robotsBody } = request.data;
      requireFact(observationBytes.length + config.reviewBytes.length + body.length + robotsBody.length <= 65536, "budget_exceeded");
      const record = observationSchema.parse(parseCanonical(observationBytes, 8192));
      requireFact(signed(record, config.producer, producer.key, MEMORY_DOCUMENT_DOMAINS.observation, config.evidenceClass), "untrusted_observation");
      requireFact(record.jobId === jobId && same(record.scope, config.job.scope) && record.executionId === config.executionId && record.nonce === config.nonce, "job_mismatch");
      const start = timestamp(record.startedAt), end = timestamp(record.completedAt);
      requireFact(start >= timestamp(config.job.periodEnd) && start >= timestamp(config.notBefore) && start >= timestamp(config.producer.validFrom) && end >= start && end - start <= 30000 && end <= asOf && end <= timestamp(config.producer.validUntil), "invalid_chronology");
      requireFact(asOf - timestamp(record.source.completedAt) < MEMORY_DOCUMENT_LIMITS.freshnessMs, "stale_observation");
      checkConnection(record.robots, ROBOTS, robotsBody, start, end); checkConnection(record.source, URL, body, start, end);
      requireFact(record.requests.durationMs === record.source.durationMs + record.robots.durationMs, "budget_exceeded");
      requireFact(record.source.status === 200 && body.length > 0 && /^(?:text\/plain|text\/markdown)(?:; ?charset=(?:utf-8|"utf-8"))?$/.test(record.source.contentType), "unsupported_content");
      const document = utf8(body); requireFact(document.trim().length > 0, "unsupported_content");
      requireFact(review.bodySha256 === sha256(body) && review.bodyBytes === body.length && record.licenseBlobOid === review.licenseBlobOid, "review_mismatch");
      // Exact-body review is deliberately required even if two versions share a short preview.
      let interval = 1000;
      if (record.robots.status === 200) {
        const permission = robotsPermission(utf8(robotsBody), URL);
        requireFact(permission.state === "allowed", "robots_refused"); interval = permission.minIntervalMs;
      } else requireFact([404, 410].includes(record.robots.status) && robotsBody.length === 0, "robots_refused");
      requireFact(timestamp(record.source.startedAt) - timestamp(record.robots.completedAt) >= interval && (!config.lastHostRequestCompletedAt || timestamp(record.robots.startedAt) - timestamp(config.lastHostRequestCompletedAt) >= interval), "robots_refused");
      return {
        policy: MEMORY_DOCUMENT_ADMISSION_POLICY, status: "admissible_service_assertion" as const,
        evidenceClass: config.evidenceClass, provenance: "service_asserted" as const,
        provenanceLimit: "Authenticated producer and exact-byte reviewer assertions; not independent fetch, TLS/DNS, licensing, content-safety, time, deployment or runtime proof",
        subjectSha256: MEMORY_DOCUMENT_SUBJECT_SHA256, jobId, executionId: record.executionId, nonce: record.nonce,
        observationSha256: sha256(observationBytes), reviewSha256: config.expectedReviewSha256,
        documentUrl: URL, catalogSource: MEMORY_DOCUMENT_SUBJECT.catalogSource, bodySha256: sha256(body), bodyBytes: body.length, observedAt: record.source.completedAt,
        attribution: JSON.parse(canonicalJson(review.attribution).toString()) as typeof review.attribution,
        assessment: { rightsGranted: false, replayProtection: "not_provided", custody: "not_provided", documentContractChange: "not_assessed", potentialWorkflowImpact: "not_assessed", runtimeCompatibility: "unverified" },
      };
    } catch (error) {
      return { policy: MEMORY_DOCUMENT_ADMISSION_POLICY, status: "abstain" as const, reason: error instanceof Refusal ? error.reason : "invalid_request", assessment: { rightsGranted: false, runtimeCompatibility: "unverified" } };
    }
  };
}
