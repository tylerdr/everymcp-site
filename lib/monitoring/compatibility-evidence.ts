import { z } from "zod";
import type { ServiceVerifier } from "./service-authority";
import { serviceDateSchema, serviceJobSchema, validateServiceOriginal, type ServiceOriginal } from "./service-records";
import { canonicalJson, inventoryDigest, inventorySourceUrls, isDue, parseCanonical, sha256, timestamp, validateSourceReport } from "./source-contract";
import { projectDocument } from "./document-projection";
import { createWatchlistSelectionQualifier } from "./watchlist-selection";

export const COMPATIBILITY_EVIDENCE_POLICY = "everymcp-compatibility-evidence-v1";
export const COMPATIBILITY_EVIDENCE_LIMITS = Object.freeze({ bodyBytes: 16384, supplementBytes: 65536, profileBytes: 8192, urlCharacters: 2048, sources: 2, steps: 12, quotes: 8, quoteCharacters: 160, quoteWordsPerSource: 24, historyDays: 90 });
const hash = z.string().regex(/^[a-f0-9]{64}$/), identifier = z.string().regex(/^[a-z0-9][a-z0-9._-]{0,63}$/);
const safeText = (max: number) => z.string().min(1).max(max).refine(value => value.length <= max && Buffer.from(value, "utf8").toString("utf8") === value && !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\u202a-\u202e\u2066-\u2069]/.test(value));
const url = z.string().max(2048).url();
const subjectSchema = serviceJobSchema.pick({ scope: true, ownerKey: true, watchlistId: true, version: true, slugs: true, sourceUrls: true }).extend({ slugs: z.array(identifier).min(1).max(2), sourceUrls: z.array(url).min(1).max(2) }).strict();
const profileSchema = z.object({ profileId: identifier, steps: z.array(z.object({ stepId: identifier, description: safeText(240), sourceUrls: z.array(url).min(1).max(2) }).strict()).min(1).max(12) }).strict();
const phase = z.enum(["before", "after"]);
const requestSchema = z.object({
  profile: profileSchema,
  originals: z.object({ before: z.custom<ServiceOriginal>(), after: z.custom<ServiceOriginal>() }).strict(),
  bodies: z.array(z.object({ phase, url, bytes: z.custom<Buffer>(Buffer.isBuffer).refine(value => value.length <= 16384) }).strict()).max(4),
  quotes: z.array(z.object({ phase, url, stepId: identifier, startByte: z.number().int().min(0).max(16384), endByte: z.number().int().min(1).max(16384), text: safeText(320).refine(value => value.length <= 320 && [...value].length <= 160) }).strict()).min(1).max(8),
}).strict();
type Subject = z.infer<typeof subjectSchema>;
type Configuration = { verifier: ServiceVerifier; subject: Subject; inventory: { catalog: unknown[]; curated: unknown[] }; expectedReceiptIds: { before: string; after: string }; asOf: string };
type Refusal = "invalid_request" | "invalid_evidence" | "unverified_receipt" | "subject_mismatch" | "inventory_mismatch" | "source_cohort_mismatch" | "invalid_chronology" | "stale_evidence" | "complete_evidence_unavailable" | "unsupported_media" | "missing_body" | "body_binding_mismatch" | "invalid_encoding" | "projection_mismatch" | "invalid_quote" | "quote_budget_exceeded" | "profile_source_mismatch" | "supplement_budget_exceeded";
class Refused extends Error { constructor(readonly reason: Refusal) { super(reason); } }
function requireEvidence(value: unknown, reason: Refusal): asserts value { if (!value) throw new Refused(reason); }
const same = (a: unknown, b: unknown) => canonicalJson(a).equals(canonicalJson(b));
const sort = (values: string[]) => [...values].sort();
const WORDS = /[^\u0009-\u000d\u001c-\u0020\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+/gu;
const assessment = { documentContractChange: "not_assessed", potentialWorkflowImpact: "not_assessed", runtimeCompatibility: "unverified", rightsGranted: false } as const;

/** Pure, unbound evidence gate, NOT an impact classifier or a collection/retention change.
 * Configuration must be server-selected after owner/current-rights checks. Signatures endorse
 * service assertions; they do not independently prove fetching, observation time or latestness. */
export function createCompatibilityEvidenceGate(configuration: Configuration) {
  const subject = subjectSchema.parse(configuration.subject), asOfText = serviceDateSchema.parse(configuration.asOf), asOf = timestamp(asOfText);
  const inventory = JSON.parse(canonicalJson(configuration.inventory).toString()) as Configuration["inventory"];
  const inventorySha256 = inventoryDigest(inventory.catalog, inventory.curated);
  const expected = z.object({ before: hash, after: hash }).strict().parse(configuration.expectedReceiptIds);
  const selection = createWatchlistSelectionQualifier(inventory.catalog, inventory.curated)(subject.slugs);
  if (expected.before === expected.after || selection.reasons.length || !same(subject.scope, configuration.verifier.scope) || !same(subject.slugs, sort([...new Set(subject.slugs)])) || !same(subject.sourceUrls, inventorySourceUrls(inventory.catalog, inventory.curated, subject.slugs)) || new Set(subject.sourceUrls.map(url => new URL(url).hostname)).size !== 1) throw new Error("Compatibility evidence configuration unavailable");
  const verifier = configuration.verifier;
  return (input: unknown) => {
    try {
      const parsed = requestSchema.safeParse(input);
      requireEvidence(parsed.success, "invalid_request");
      const request = parsed.data, profileBytes = canonicalJson(request.profile);
      const metadata = canonicalJson({ profile: request.profile, quotes: request.quotes, bodies: request.bodies.map(({ phase, url }) => ({ phase, url })) });
      requireEvidence(profileBytes.length <= 8192 && metadata.length + request.bodies.reduce((n, body) => n + body.bytes.length, 0) <= 65536, "supplement_budget_exceeded");
      const steps = new Map(request.profile.steps.map(step => [step.stepId, step]));
      requireEvidence(steps.size === request.profile.steps.length && request.profile.steps.every(step => new Set(step.sourceUrls).size === step.sourceUrls.length && step.sourceUrls.every(url => subject.sourceUrls.includes(url))) && same(sort([...new Set(request.profile.steps.flatMap(step => step.sourceUrls))]), subject.sourceUrls), "profile_source_mismatch");
      const keys = request.bodies.map(body => `${body.phase}\0${body.url}`);
      requireEvidence(new Set(keys).size === keys.length && request.bodies.every(body => subject.sourceUrls.includes(body.url)), "invalid_request");
      const checked = (["before", "after"] as const).map(name => {
        const original = request.originals[name];
        requireEvidence(verifier.verifyOriginal(original), "unverified_receipt");
        const { start, receipt } = validateServiceOriginal(original);
        requireEvidence(sha256(original.receiptBytes) === expected[name] && receipt.stage === "capture", "unverified_receipt");
        const actual = Object.fromEntries(Object.keys(subject).map(key => [key, start.job[key as keyof typeof start.job]]));
        requireEvidence(same(actual, subject), "subject_mismatch");
        requireEvidence(start.inventorySha256 === inventorySha256, "inventory_mismatch");
        const report = validateSourceReport(parseCanonical(original.sourceBytes!), inventory.catalog, inventory.curated);
        // Apply the service capture window to the whole inventory, not only quoted sources.
        // This gate does not change admission policy for any existing receipt consumer.
        requireEvidence(report.mode === "check" && Number(report.summary.attemptsThisRun) <= 2 && Number(report.summary.robotsRequestsThisRun) <= 1 && Number(report.summary.requestDurationMsThisRun) <= 30000, "invalid_evidence");
        requireEvidence(timestamp(report.generatedAt) >= timestamp(start.startedAt) && timestamp(report.generatedAt) <= timestamp(receipt.completedAt) && timestamp(receipt.completedAt) <= asOf, "invalid_chronology");
        for (const source of report.sources) {
          requireEvidence(source.runDisposition !== "dry_run", "invalid_evidence");
          if (source.runDisposition === "checked_this_run") {
            requireEvidence(subject.sourceUrls.includes(source.url) && source.observation && timestamp(source.observation.checkedAt) >= timestamp(start.startedAt), "source_cohort_mismatch");
          } else if (source.observation) requireEvidence(timestamp(source.observation.checkedAt) < timestamp(start.startedAt), "invalid_chronology");
        }
        const documents = subject.sourceUrls.map(url => {
          const index = report.sources.findIndex(source => source.url === url), source = report.sources[index], obs = source?.observation;
          requireEvidence(source && obs && source.runDisposition === "checked_this_run" && obs.state === "reachable" && obs.httpStatus === 200 && obs.bodyComplete && obs.documentProjection?.state === "captured", "complete_evidence_unavailable");
          requireEvidence(timestamp(obs.checkedAt) >= timestamp(start.startedAt) && timestamp(obs.checkedAt) <= timestamp(receipt.completedAt), "invalid_chronology");
          requireEvidence(!isDue(source, obs, name === "after" ? asOfText : receipt.completedAt), "stale_evidence");
          const media = obs.documentProjection.mediaType;
          requireEvidence(media === "text/plain" || media === "text/markdown", "unsupported_media");
          const body = request.bodies.find(item => item.phase === name && item.url === url);
          requireEvidence(body, "missing_body");
          requireEvidence(body.bytes.length === obs.receivedBytes && sha256(body.bytes) === obs.contentHash, "body_binding_mismatch");
          let text: string;
          try { text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(body.bytes); } catch { throw new Refused("invalid_encoding"); }
          requireEvidence(Buffer.from(text, "utf8").equals(body.bytes), "invalid_encoding");
          const projection = projectDocument(body.bytes, { "content-type": `${media}; charset=utf-8` }, source, obs);
          requireEvidence(same(projection, obs.documentProjection), "projection_mismatch");
          return { url, phase: name, body: body.bytes, observedAt: obs.checkedAt, bodySha256: obs.contentHash!, mediaType: media, receiptSha256: expected[name], sourcePayloadSha256: receipt.sourceSha256!, pointer: `/sources/${index}/observation`, previewTruncated: obs.documentProjection.sections.some(section => section.headingTruncated || section.excerptTruncated) };
        });
        return { name, start, receipt, documents };
      });
      requireEvidence(checked[0].start.executionId !== checked[1].start.executionId && checked[0].start.nonce !== checked[1].start.nonce && timestamp(checked[0].receipt.completedAt) < timestamp(checked[1].start.startedAt) && timestamp(checked[1].receipt.completedAt) - timestamp(checked[0].start.startedAt) <= 90 * 86400000 && timestamp(checked[0].start.job.periodEnd) < timestamp(checked[1].start.job.periodEnd), "invalid_chronology");
      const documents = checked.flatMap(item => item.documents), used = new Map<string, number>();
      const quotes = request.quotes.map(quote => {
        const document = documents.find(item => item.phase === quote.phase && item.url === quote.url), step = steps.get(quote.stepId);
        requireEvidence(document && step?.sourceUrls.includes(quote.url) && quote.startByte < quote.endByte && quote.endByte <= document.body.length, "invalid_quote");
        const span = document.body.subarray(quote.startByte, quote.endByte);
        let text: string;
        try { text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(span); } catch { throw new Refused("invalid_quote"); }
        requireEvidence(text === quote.text && Buffer.from(text, "utf8").equals(span), "invalid_quote");
        const words = [...text.matchAll(WORDS)].length, count = (used.get(quote.url) ?? 0) + words;
        requireEvidence(words > 0 && count <= 24, "quote_budget_exceeded"); used.set(quote.url, count);
        const { body, ...citation } = document; void body;
        return { ...quote, citation, workflowAssociation: "profile_declared_not_verified" as const };
      });
      return { policy: COMPATIBILITY_EVIDENCE_POLICY, status: "ready_for_document_review" as const, profileSha256: sha256(profileBytes), assessment: { ...assessment },
        evidenceClass: verifier.evidenceClass, provenanceLimit: "Service-recorded assertions; not independent fetching/time/latestness or runtime proof", quotes,
        sources: subject.sourceUrls.map(url => { const before = checked[0].documents.find(item => item.url === url)!, after = checked[1].documents.find(item => item.url === url)!;
          return { url, beforeBodySha256: before.bodySha256, afterBodySha256: after.bodySha256, byteComparison: before.bodySha256 === after.bodySha256 ? "source_bytes_unchanged" : "source_bytes_changed" }; }) };
    } catch (error) {
      return { policy: COMPATIBILITY_EVIDENCE_POLICY, status: "abstain" as const, reason: error instanceof Refused ? error.reason : "invalid_evidence", assessment: { ...assessment }, quotes: [] };
    }
  };
}
