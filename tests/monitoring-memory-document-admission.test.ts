import { createPrivateKey, sign } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createMemoryDocumentAdmission, memoryDocumentJobIdentity, MEMORY_DOCUMENT_SUBJECT, MEMORY_DOCUMENT_SUBJECT_SHA256, MEMORY_DOCUMENT_DOMAINS, type MemoryDocumentAdmissionConfiguration } from "../lib/monitoring/memory-document-admission";
import { canonicalJson, normalizeSourceUrl, sha256 } from "../lib/monitoring/source-contract";
import { validateServiceOriginal } from "../lib/monitoring/service-records";
import { createCompatibilityEvidenceGate } from "../lib/monitoring/compatibility-evidence";
import { evidenceFixture } from "./fixtures/monitoring-node/compatibility-evidence-fixture";
import { FICTIONAL_PRIVATE_ONE, FICTIONAL_PRIVATE_TWO } from "./fixtures/monitoring-node/service-fixture";
import { SERVICE_VERIFICATION } from "./fixtures/monitoring-node/service-public-fixture";

// Published RFC8032 fixtures only. No key generation, network, current provider data or SQL.
function signed(value: object, role: "observation" | "review", domain = MEMORY_DOCUMENT_DOMAINS[role]) {
  const key = createPrivateKey(role === "observation" ? FICTIONAL_PRIVATE_ONE : FICTIONAL_PRIVATE_TWO);
  return { ...value, signature: sign(null, Buffer.concat([Buffer.from(domain), canonicalJson(value)]), key).toString("base64url") };
}
function fixture(body = Buffer.from("# Fictional Memory release\n\nOptional exampleLimit parameter added. This is invented test content.\n")) {
  const scope = { accountId: "acct_fictional", mode: "test" as const, productKey: "source-history-fixture" };
  const key = (index: number, authorityId: string) => ({ ...SERVICE_VERIFICATION.keys[index], authorityId });
  const job: MemoryDocumentAdmissionConfiguration["job"] = { policy: "everymcp-memory-document-job-v1", scope, ownerKey: "a".repeat(64), watchlistId: "b".repeat(64), watchlistVersion: 1, subjectSha256: MEMORY_DOCUMENT_SUBJECT_SHA256, periodStart: "2026-11-11T11:59:40Z", periodEnd: "2026-11-12T11:59:40Z" };
  const robotsBody = Buffer.from("User-agent: *\nAllow: /\n");
  const connection = (url: string, bytes: Buffer, start: string, end: string, durationMs: number) => ({ requestedUrl: url, finalUrl: url, redirects: 0, method: "GET", credentials: "none", tlsVerified: true, tlsHostname: "raw.githubusercontent.com", addresses: ["8.8.8.8"], pinnedAddress: "8.8.8.8", startedAt: start, completedAt: end, durationMs, status: 200, complete: true, encoding: "identity", receivedBytes: bytes.length, bodySha256: sha256(bytes) });
  const review = {
    policy: "everymcp-memory-document-review-v1", permissionPolicy: "memory-project-docs-ccby4-with-legacy-mit-v1", subjectSha256: MEMORY_DOCUMENT_SUBJECT_SHA256, scope: { ...scope },
    documentUrl: MEMORY_DOCUMENT_SUBJECT.documentUrl, repositoryOwner: "modelcontextprotocol", repository: "servers", branch: "main", bodySha256: sha256(body), bodyBytes: body.length,
    licenseEvidenceUrl: "https://github.com/modelcontextprotocol/servers/blob/main/LICENSE", licenseBlobOid: "c".repeat(40), provenanceEvidenceSha256: "d".repeat(64),
    reviewedAt: "2026-11-12T11:59:50Z", validUntil: "2026-11-20T00:00:00Z", reviewerId: "fictional-document-reviewer", decision: "eligible_exact_bytes_under_reviewed_policy",
    exclusions: { specifications: "absent", doubtfulThirdPartyContent: "absent", sensitiveContent: "absent", linkedDestinations: "not_covered" },
    attribution: { title: "Fictional Memory changelog", creatorAttributions: ["Fictional author"], copyrightNotices: ["Fictional fixture notice"], sourceUrl: MEMORY_DOCUMENT_SUBJECT.documentUrl, licenseUrl: "https://creativecommons.org/licenses/by/4.0/", licenseNotice: "Fictional documentation-policy fixture: CC BY 4.0 with applicable original MIT contributions preserved", legacyMitNotice: "Fictional original-license notice; not actual copied upstream content", modificationNotice: "Original fictional bytes; later excerpts must be identified", warrantyNotice: "Fictional no-warranty fixture", recipientReuse: "underlying_licensed_material_remains_reusable", endorsement: "none" },
    authorityId: "fictional-review", keyId: SERVICE_VERIFICATION.keys[1].keyId, evidenceClass: "synthetic-fixture",
  };
  const config: MemoryDocumentAdmissionConfiguration = { job, executionId: "10000000-0000-4000-8000-000000000001", nonce: "20000000-0000-4000-8000-000000000001", asOf: "2026-11-12T12:00:00Z", evidenceClass: "synthetic-fixture", producer: key(0, "fictional-producer"), reviewer: key(1, "fictional-review"), reviewBytes: Buffer.alloc(0), expectedReviewSha256: "0".repeat(64), notBefore: "2026-11-12T00:00:00Z", lastHostRequestCompletedAt: "2026-11-12T11:58:00Z" };
  const record = {
    policy: "everymcp-memory-document-observation-v1", sourcePolicy: MEMORY_DOCUMENT_SUBJECT.sourcePolicy, subjectSha256: MEMORY_DOCUMENT_SUBJECT_SHA256, jobId: memoryDocumentJobIdentity(job), scope: { ...scope },
    executionId: config.executionId, nonce: config.nonce, startedAt: "2026-11-12T11:59:40Z", completedAt: "2026-11-12T11:59:45Z",
    repositoryOwner: "modelcontextprotocol", repository: "servers", branch: "main", licenseEvidenceUrl: review.licenseEvidenceUrl, licenseBlobOid: review.licenseBlobOid,
    requests: { source: 1, robots: 1, durationMs: 3000 },
    robots: connection("https://raw.githubusercontent.com/robots.txt", robotsBody, "2026-11-12T11:59:40Z", "2026-11-12T11:59:41Z", 1000),
    source: { ...connection(MEMORY_DOCUMENT_SUBJECT.documentUrl, body, "2026-11-12T11:59:42Z", "2026-11-12T11:59:44Z", 2000), contentType: "text/markdown; charset=utf-8", disposition: "checked_this_run", cache: "not_reused" },
    authorityId: "fictional-producer", keyId: SERVICE_VERIFICATION.keys[0].keyId, evidenceClass: "synthetic-fixture",
  };
  const reviewAgain = () => { config.reviewBytes = canonicalJson(signed(review, "review")); config.expectedReviewSha256 = sha256(config.reviewBytes); };
  reviewAgain();
  const request = () => ({ observationBytes: canonicalJson(signed(record, "observation")), body, robotsBody });
  return { config, review, record, body, robotsBody, request, reviewAgain };
}
function set(object: object, path: string, value: unknown) {
  const parts = path.split("."); let target = object as Record<string, unknown>;
  for (const key of parts.slice(0, -1)) target = target[key] as Record<string, unknown>;
  target[parts.at(-1)!] = value;
}
const accepted = (f: ReturnType<typeof fixture>) => createMemoryDocumentAdmission(f.config)(f.request());
describe("prospective unbound Memory document assertion admission", () => {
  it("binds exact fictional bytes, canonical owned job and distinct review role without granting rights", () => {
    const f = fixture(), request = f.request(), saved = sha256(request.observationBytes), result = createMemoryDocumentAdmission(f.config)(request);
    expect(result).toMatchObject({ status: "admissible_service_assertion", provenance: "service_asserted", bodySha256: sha256(f.body), catalogSource: MEMORY_DOCUMENT_SUBJECT.catalogSource, documentUrl: MEMORY_DOCUMENT_SUBJECT.documentUrl, assessment: { rightsGranted: false, replayProtection: "not_provided", custody: "not_provided", runtimeCompatibility: "unverified", potentialWorkflowImpact: "not_assessed" } });
    expect(sha256(request.observationBytes)).toBe(saved); expect(JSON.stringify(result)).not.toContain(f.body.toString());
  });
  it("requires provenance before use and refuses unknown or changed exact bytes", () => {
    const f = fixture(); f.config.reviewBytes = Buffer.alloc(0); expect(() => createMemoryDocumentAdmission(f.config)).toThrow();
    const g = fixture(); g.review.bodySha256 = "0".repeat(64); g.reviewAgain(); expect(accepted(g)).toMatchObject({ status: "abstain", reason: "review_mismatch" });
    const h = fixture(); h.record.licenseBlobOid = "0".repeat(40); expect(accepted(h)).toMatchObject({ reason: "review_mismatch" });
  });
  it.each([
    ["source.requestedUrl", MEMORY_DOCUMENT_SUBJECT.catalogSource], ["source.requestedUrl", MEMORY_DOCUMENT_SUBJECT.documentUrl + "?raw=1"],
    ["source.finalUrl", MEMORY_DOCUMENT_SUBJECT.documentUrl + "#section"], ["source.requestedUrl", MEMORY_DOCUMENT_SUBJECT.documentUrl.replace("main/", "other/")],
    ["source.requestedUrl", MEMORY_DOCUMENT_SUBJECT.documentUrl.replace("raw.githubusercontent.com", "sub.raw.githubusercontent.com")],
    ["source.requestedUrl", MEMORY_DOCUMENT_SUBJECT.documentUrl.replace("https://", "https://user:pass@")],
    ["source.requestedUrl", MEMORY_DOCUMENT_SUBJECT.documentUrl.replace("CHANGELOG", "README")], ["source.redirects", 1], ["source.credentials", "cookie"],
    ["source.tlsVerified", false], ["source.tlsHostname", "github.com"], ["source.addresses", ["127.0.0.1"]], ["source.addresses", ["8.8.8.8", "10.0.0.1"]], ["source.pinnedAddress", "1.1.1.1"],
    ["source.status", 304], ["source.complete", false], ["source.encoding", "gzip"], ["source.cache", "reused"], ["source.disposition", "fresh_cache"],
    ["source.contentType", "text/html"], ["source.contentType", "text/plain; charset=latin1"], ["source.receivedBytes", 1], ["source.bodySha256", "0".repeat(64)],
    ["repositoryOwner", "other"], ["branch", "master"], ["requests.source", 2], ["requests.robots", 2], ["requests.durationMs", 30001], ["source.durationMs", 8001],
    ["source.completedAt", "2026-11-12T12:00:01Z"], ["completedAt", "2026-11-12T12:00:11Z"], ["nonce", "20000000-0000-4000-8000-000000000002"],
    ["policy", "everymcp-service-custody-v2"], ["scope.accountId", "acct_other"], ["source.extraSuccessFlag", true],
  ])("refuses producer-signed disallowed %s", (path, value) => { const f = fixture(); set(f.record, path, value); expect(accepted(f).status).toBe("abstain"); });
  it.each([
    ["permissionPolicy", "all-public-content-is-free"], ["repositoryOwner", "other"], ["branch", "other"], ["documentUrl", MEMORY_DOCUMENT_SUBJECT.catalogSource],
    ["exclusions.doubtfulThirdPartyContent", "unknown"], ["exclusions.sensitiveContent", "unknown"], ["exclusions.specifications", "present"],
    ["attribution.creatorAttributions", []], ["attribution.licenseNotice", ""], ["attribution.legacyMitNotice", ""], ["attribution.modificationNotice", ""],
    ["attribution.recipientReuse", "subscriber-exclusive"], ["attribution.endorsement", "official"], ["decision", "unreviewed"], ["validUntil", "2026-11-12T11:59:59Z"],
  ])("requires trusted review fields %s", (path, value) => { const f = fixture(); set(f.review, path, value); f.reviewAgain(); expect(() => createMemoryDocumentAdmission(f.config)).toThrow(); });
  it("refuses replay into changed owner, scope, job version, period or execution", () => {
    for (const [path, value] of [["job.ownerKey", "e".repeat(64)], ["job.watchlistVersion", 2], ["job.periodStart", "2026-11-10T11:59:40Z"], ["executionId", "10000000-0000-4000-8000-000000000002"]] as const) {
      const f = fixture(); set(f.config, path, value); expect(accepted(f)).toMatchObject({ reason: "job_mismatch" });
    }
    const f = fixture(); f.config.job.scope = { ...f.config.job.scope, accountId: "acct_other" }; expect(() => createMemoryDocumentAdmission(f.config)).toThrow();
  });
  it("does not accept caller authority fields or old receipt objects", () => {
    const f = fixture(), gate = createMemoryDocumentAdmission(f.config);
    for (const extras of [{ ownerKey: f.config.job.ownerKey }, { paid: true }, { reviewed: true }, { publicKey: f.config.producer.publicKey }]) expect(gate({ ...f.request(), ...extras }).status).toBe("abstain");
    expect(gate(evidenceFixture().input.originals.after).status).toBe("abstain");
  });
  it("checks domains, role/key separation, public-only trust, signatures and revocation", () => {
    const f = fixture(), gate = createMemoryDocumentAdmission(f.config);
    expect(gate({ ...f.request(), observationBytes: canonicalJson(signed(f.record, "observation", MEMORY_DOCUMENT_DOMAINS.review)) })).toMatchObject({ reason: "untrusted_observation" });
    const request = f.request(); request.observationBytes[30] ^= 1; expect(gate(request).status).toBe("abstain");
    f.config.reviewer.publicKey = f.config.producer.publicKey; expect(() => createMemoryDocumentAdmission(f.config)).toThrow(/must differ/);
    for (const role of ["producer", "reviewer"] as const) { const g = fixture(); g.config[role].revoked = true; expect(() => createMemoryDocumentAdmission(g.config)).toThrow(); }
    const g = fixture(); g.config.producer.publicKey = FICTIONAL_PRIVATE_ONE; expect(() => createMemoryDocumentAdmission(g.config)).toThrow();
    const h = fixture(); h.config.evidenceClass = "service-recorded"; h.config.producer.fixtureOnly = false; h.config.reviewer.fixtureOnly = false; expect(() => createMemoryDocumentAdmission(h.config)).toThrow();
  });
  it("refuses stale, future, unknown-cooldown and too-frequent claims", () => {
    const f = fixture(); f.config.asOf = "2026-11-19T11:59:44Z"; expect(accepted(f)).toMatchObject({ reason: "stale_observation" });
    const g = fixture(); g.config.notBefore = "2026-11-12T11:59:41Z"; expect(accepted(g)).toMatchObject({ reason: "invalid_chronology" });
    const h = fixture(); h.config.lastHostRequestCompletedAt = "2026-11-12T11:59:40Z"; expect(accepted(h)).toMatchObject({ reason: "robots_refused" });
  });
  it.each(["User-agent: *\nDisallow: /\n", "User-agent: *\nCrawl-delay: 12\n", "<html>Not robots</html>", "User-agent: *\nMystery: x\n"])("recomputes robots refusal from signed bytes", robots => {
    const f = fixture(), bytes = Buffer.from(robots); f.record.robots.bodySha256 = sha256(bytes); f.record.robots.receivedBytes = bytes.length;
    expect(createMemoryDocumentAdmission(f.config)({ ...f.request(), robotsBody: bytes })).toMatchObject({ reason: "robots_refused" });
  });
  it("only permits explicit complete empty404/410 absence, not failed or contradictory robots", () => {
    for (const status of [404, 410]) { const f = fixture(); f.record.robots.status = status; f.record.robots.receivedBytes = 0; f.record.robots.bodySha256 = sha256(Buffer.alloc(0)); expect(createMemoryDocumentAdmission(f.config)({ ...f.request(), robotsBody: Buffer.alloc(0) }).status).toBe("admissible_service_assertion"); }
    for (const status of [304, 401, 403, 429, 500]) { const f = fixture(); f.record.robots.status = status; expect(accepted(f).status).toBe("abstain"); }
  });
  it("bounds UTF8 bodies, signed envelopes and all material without truncating", () => {
    for (const body of [Buffer.alloc(0), Buffer.alloc(16385, 97), Buffer.from([0xff]), Buffer.from("text\u0000secret")]) {
      const f = fixture(body); if (body.length === 0 || body.length > 16384) expect(() => createMemoryDocumentAdmission(f.config)).toThrow(); else expect(accepted(f).status).toBe("abstain");
    }
    const f = fixture(Buffer.alloc(16384, 97)); expect(accepted(f).status).toBe("admissible_service_assertion");
    const gate = createMemoryDocumentAdmission(f.config); expect(gate({ ...f.request(), observationBytes: Buffer.alloc(8193) }).status).toBe("abstain");
    const robotsBody = Buffer.alloc(60000, 32); expect(gate({ ...f.request(), robotsBody })).toMatchObject({ reason: "budget_exceeded" });
    expect(gate({ ...f.request(), observationBytes: Buffer.from('{"policy":"x","policy":"y"}\n') }).status).toBe("abstain");
    expect(gate({ ...f.request(), observationBytes: Buffer.from(JSON.stringify(signed(f.record, "observation"))) }).status).toBe("abstain");
  });
  it("snapshots trusted configuration and returns isolated metadata; repeated validation is not durable dedupe", () => {
    const f = fixture(), gate = createMemoryDocumentAdmission(f.config), request = f.request(), first = gate(request);
    if (first.status !== "admissible_service_assertion") throw new Error("Fixture refused");
    first.attribution.creatorAttributions[0] = "edited"; first.assessment.rightsGranted = true;
    f.config.reviewBytes.fill(0); f.config.job.ownerKey = "f".repeat(64);
    expect(gate(request)).toMatchObject({ status: "admissible_service_assertion", attribution: { creatorAttributions: ["Fictional author"] }, assessment: { rightsGranted: false, replayProtection: "not_provided" } });
  });
  it("keeps legacy host policy, receipt policies and frozen gate bytes unchanged", () => {
    expect(() => normalizeSourceUrl(MEMORY_DOCUMENT_SUBJECT.documentUrl)).toThrow();
    expect(sha256(readFileSync("lib/monitoring/compatibility-evidence.ts"))).toBe("3c2f48fa2501394ae0635a5c0ab036333289ab3ef07838857ecbfd0938053748");
    expect(sha256(readFileSync("documents/compatibility-evidence-contract-v1.json"))).toBe("51d94c783f1968532ec87c9cff791bdf156681f6ef4dd6f134b88e6ae2d2186d");
    const f = evidenceFixture(); expect(createCompatibilityEvidenceGate(f.config)(f.input).status).toBe("ready_for_document_review");
    const memory = fixture(); expect(() => validateServiceOriginal(memory.request() as never)).toThrow();
  });
});
