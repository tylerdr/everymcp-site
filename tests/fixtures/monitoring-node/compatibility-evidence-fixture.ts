/** New fictional document evidence, independent of the private twelve-case experiment.
 * Published RFC test keys only; no collection, account, provider or native database execution. */
import { fixtureProducer } from "./service-fixture";
import { fixture, OWNER, SCOPE, WATCHLIST } from "./runtime-fixture";
import { canonicalJson, inventoryDigest, isDue, sha256, sourceInventory, type SourceReport } from "../../../lib/monitoring/source-contract";
import { projectDocument } from "../../../lib/monitoring/document-projection";
import { SERVICE_RECEIPT_POLICY_V2, serviceJobIdentity, type ServiceOriginal } from "../../../lib/monitoring/service-records";
export const ROUTE = "https://github.com/fictional/route", GUIDE = "https://github.com/fictional/guide";
export const INVENTORY = { catalog: [{ id: "fixture-route", slug: "fixture-route", name: "Fictional route", repo: ROUTE }, { id: "fixture-guide", slug: "fixture-guide", name: "Fictional guide", repo: GUIDE }], curated: [] };
export const SUBJECT = { scope: SCOPE, ownerKey: OWNER, watchlistId: WATCHLIST, version: 1, slugs: ["fixture-guide", "fixture-route"], sourceUrls: [GUIDE, ROUTE] };
export const PROFILE = { profileId: "fictional-routing", steps: [{ stepId: "route", description: "Declared fictional route dependency; not a verified relationship", sourceUrls: [ROUTE] }, { stepId: "launch", description: "Declared fictional guide dependency", sourceUrls: [GUIDE] }] };
const preamble = "# Fictional route evidence\n" + "This long introduction describes only synthetic documents and contains no actual product behavior. ".repeat(4);
export function bodies(phase: "before" | "after") {
  return [{ phase, url: GUIDE, bytes: Buffer.from("# Fictional guide\nUse the fictional local demonstration only.\n") }, { phase, url: ROUTE, bytes: Buffer.from(preamble + (phase === "before" ? "routeKey is optional.\n" : "routeKey is required.\n") + "Résumé 🧭 is a fictional label.\n") }];
}
export function quote(phase: "before" | "after", text: string, url = ROUTE, stepId = "route") {
  const body = bodies(phase).find(item => item.url === url)!.bytes, startByte = body.indexOf(Buffer.from(text));
  if (startByte < 0) throw new Error("Unknown fictional quote");
  return { phase, url, stepId, startByte, endByte: startByte + Buffer.byteLength(text), text };
}
export function original(phase: "before" | "after", mutate?: (report: SourceReport) => void, subject = SUBJECT): ServiceOriginal {
  const producer = fixtureProducer(), day = phase === "before" ? "01" : "08", id = phase === "before" ? "1" : "2";
  const time = (seconds: string) => `2026-11-${day}T00:00:${seconds}Z`;
  const inventory = sourceInventory(INVENTORY.catalog, INVENTORY.curated), report = structuredClone(fixture.reports[0]) as SourceReport;
  report.generatedAt = time("02"); report.listings = inventory.listings; report.rejectedInputs = []; report.inventoryFindings = []; report.robotsPolicies = [];
  report.sources = [...inventory.sources.values()].sort((a, b) => a.url.localeCompare(b.url)).map(identity => {
    const bytes = bodies(phase).find(row => row.url === identity.url)!.bytes;
    const observation = { ...structuredClone(report.sources[0].observation!), checkedAt: time("01"), httpStatus: 200, state: "reachable" as const, reason: "http_success", contentHash: sha256(bytes), bodyComplete: true, receivedBytes: bytes.length, durationMs: 0 };
    observation.documentProjection = projectDocument(bytes, { "content-type": "text/markdown; charset=utf-8" }, identity, observation);
    return { ...identity, observation, lastSuccessfulObservation: structuredClone(observation), stale: isDue(identity, observation, report.generatedAt), reviewFindings: [], runDisposition: "checked_this_run" };
  });
  report.summary = { listingCount: 2, distinctListingIdCount: 2, uniqueSourceCount: 2, attemptsThisRun: 2, httpRequestsThisRun: 2, robotsRequestsThisRun: 0, stateCounts: { reachable: 2 }, staleOrUnchecked: 0, receivedBytesThisRun: report.sources.reduce((n, source) => n + source.observation!.receivedBytes, 0), requestDurationMsThisRun: 0 };
  mutate?.(report);
  const job = { ...subject, kind: "capture" as const, periodStart: new Date(Date.parse(time("00")) - 86400000).toISOString(), periodEnd: time("00"), receiptIds: [] };
  const start = producer.signStart({ schemaVersion: 1, policy: SERVICE_RECEIPT_POLICY_V2, executionId: `11111111-1111-4111-8111-11111111111${id}`, nonce: `22222222-2222-4222-8222-22222222222${id}`, job, jobId: serviceJobIdentity(job), inventorySha256: inventoryDigest(INVENTORY.catalog, INVENTORY.curated), runtime: producer.authorization(time("00")), evidenceClass: "synthetic-fixture", startedAt: time("00") });
  const sourceBytes = canonicalJson(report);
  const receipt = producer.signReceipt(start, { schemaVersion: 1, policy: start.policy, executionId: start.executionId, nonce: start.nonce, jobId: start.jobId, inventorySha256: start.inventorySha256, runtime: start.runtime, evidenceClass: "synthetic-fixture", stage: "capture", startedAt: start.startedAt, completedAt: time("03"), startSha256: sha256(canonicalJson(start)), sourceSha256: sha256(sourceBytes), sourceLength: sourceBytes.length, reportSha256: null, reportLength: 0, reportPolicy: null, inputReceiptIds: [] });
  return { start, status: "completed", receiptBytes: canonicalJson(receipt), sourceBytes, reportBytes: null };
}
export function evidenceFixture() {
  const before = original("before"), after = original("after"), producer = fixtureProducer();
  const config = { verifier: producer.verifier, subject: SUBJECT, inventory: INVENTORY, expectedReceiptIds: { before: sha256(before.receiptBytes), after: sha256(after.receiptBytes) }, asOf: "2026-11-08T00:00:04Z" };
  const input = { profile: structuredClone(PROFILE), originals: { before, after }, bodies: [...bodies("before"), ...bodies("after")], quotes: [quote("before", "routeKey is optional."), quote("after", "routeKey is required.")] };
  return { config, input };
}
