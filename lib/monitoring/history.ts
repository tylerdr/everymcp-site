import { z } from "zod";
import { LEGACY_NODE_HISTORY_POLICY, renderNodeHistoryV1 } from "./history-v1-renderer";
export { LEGACY_NODE_HISTORY_POLICY } from "./history-v1-renderer";
import { canonicalJson, isDue, sha256, timestamp as instant, validateSourceReport, type SourceReport } from "./source-contract";

export const NODE_HISTORY_POLICY = "source-receipt-history-node-v2";
export const SERVICE_HISTORY_POLICY = "source-receipt-history-service-v1";
export type NodeSnapshot = {
  report: SourceReport;
  evidence: {
    receiptSha256: string;
    sourceSha256: string;
    executionId: string;
    deploymentId: string;
    gitSha: string;
    startedAt: string;
    completedAt: string;
    origin: "vercel-next-custody-v1" | "vercel-next-custody-v2";
    evidenceClass: "synthetic-fixture" | "server-collection";
  };
};
export type ServiceSnapshot = {
  report: SourceReport;
  evidence: {
    receiptSha256: string;
    sourceSha256: string;
    executionId: string;
    startedAt: string;
    completedAt: string;
    evidenceClass: "synthetic-fixture" | "server-collection";
    origin: "everymcp-service-custody-v1" | "everymcp-service-custody-v2";
    serviceId: string;
    keyId: string;
  };
};
type HistoryEvidence = NodeSnapshot["evidence"] | ServiceSnapshot["evidence"];
type Snapshot<E extends HistoryEvidence> = { report: SourceReport; evidence: E };
type Source = SourceReport["sources"][number];
type Observation = NonNullable<Source["observation"]>;
type Citation<E extends HistoryEvidence = NodeSnapshot["evidence"]> = E & { pointer: string; receiptGeneratedAt: string };
type Attempt<E extends HistoryEvidence> = { observation: Observation; evidence: Citation<E> };
type EventKind = "baseline" | "inconclusive" | "source_missing_at_check" | "source_reachable_again" | "source_body_changed";
export type DocumentComparison = {
  state: "unavailable" | "captured_representation_unchanged" | "captured_representation_changed";
  reason: string;
  changes: { sectionId: string; kind: "added" | "removed" | "changed" }[];
  beforeBodyObservedAt?: string | null;
  afterBodyObservedAt?: string | null;
};
type HistoryEvent<E extends HistoryEvidence> = Attempt<E> & {
  id: string;
  kind: EventKind;
  beforeObservation?: Observation;
  beforeEvidence?: Citation<E>;
  documentComparison?: DocumentComparison;
};
type HistorySource<E extends HistoryEvidence> = Pick<Source, "url" | "relationships" | "observation" | "lastSuccessfulObservation" | "runDisposition" | "reviewFindings"> & {
  state: Observation["state"] | "not_checked";
  freshnessAsOf: "unchecked" | "stale" | "current";
  events: HistoryEvent<E>[];
  evidence: Citation<E>;
};
type History<E extends HistoryEvidence, P extends string> = {
  schemaVersion: 1;
  historyPolicyVersion: P;
  sourcePolicyVersion: string;
  asOf: string;
  selectedSlugs: string[];
  receipts: (E & { generatedAt: string })[];
  summary: {
    selectedSlugCount: number;
    sourceCount: number;
    stateCounts: Record<string, number>;
    staleOrUnchecked: number;
    datedObservationCount: number;
    eventCounts: Record<string, number>;
  };
  publication: SourceReport["publication"];
  assessment: SourceReport["assessment"];
  inventoryFindings: SourceReport["inventoryFindings"];
  entries: (SourceReport["listings"][number] & { name: string; sources: HistorySource<E>[] })[];
};
export type NodeHistory = History<NodeSnapshot["evidence"], typeof NODE_HISTORY_POLICY | typeof LEGACY_NODE_HISTORY_POLICY>;
export type ServiceHistory = History<ServiceSnapshot["evidence"], typeof SERVICE_HISTORY_POLICY>;

const lexical = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const same = (a: unknown, b: unknown) => canonicalJson(a).equals(canonicalJson(b));

export function compareNodeDocuments(before: Observation, after: Observation): DocumentComparison {
  const old = before.documentProjection, current = after.documentProjection;
  if (!old || !current) return { state: "unavailable", reason: "not_captured", changes: [] };
  if (old.state !== "captured" || current.state !== "captured") {
    return { state: "unavailable", reason: `${old.reason} / ${current.reason}`, changes: [] };
  }
  if (old.sourceUrl !== current.sourceUrl || old.sourceIdentity !== current.sourceIdentity || old.profileVersion !== current.profileVersion) {
    throw new Error("Changed source identity cannot be compared");
  }
  const oldSections = new Map(old.sections.map(section => [section.id, section]));
  const newSections = new Map(current.sections.map(section => [section.id, section]));
  const changes: DocumentComparison["changes"] = [];
  for (const id of [...new Set([...oldSections.keys(), ...newSections.keys()])].sort(lexical)) {
    const a = oldSections.get(id), b = newSections.get(id);
    const kind = !a ? "added" : !b ? "removed" : a.contentHash !== b.contentHash ? "changed" : null;
    if (kind) changes.push({ sectionId: id, kind });
  }
  return {
    state: old.projectionHash === current.projectionHash ? "captured_representation_unchanged" : "captured_representation_changed",
    reason: "bounded_static_projection_only", changes,
    beforeBodyObservedAt: old.bodyObservedAt, afterBodyObservedAt: current.bodyObservedAt,
  };
}

/** Pure, bounded history generation. Custody authentication is the caller's admission boundary. */
export function buildNodeHistory(snapshots: NodeSnapshot[], asOf: string, catalog: unknown[], curated: unknown[], slugs: string[]): NodeHistory {
  return buildHistory(snapshots, asOf, catalog, curated, slugs, NODE_HISTORY_POLICY, validateNodeEvidence);
}
function validateNodeEvidence(evidence: NodeSnapshot["evidence"]): void {
  if (!["vercel-next-custody-v1", "vercel-next-custody-v2"].includes(evidence.origin)) throw new Error("Unsupported history evidence origin");
}
const serviceEvidence = z.object({
  receiptSha256: z.string().regex(/^[a-f0-9]{64}$/), sourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
  executionId: z.string().min(1).max(128).regex(/^[\x21-\x7e]+$/), startedAt: z.string(), completedAt: z.string(),
  evidenceClass: z.enum(["synthetic-fixture", "server-collection"]), origin: z.enum(["everymcp-service-custody-v1", "everymcp-service-custody-v2"]),
  serviceId: z.string().min(1).max(128).regex(/^[\x21-\x7e]+$/), keyId: z.string().min(1).max(128).regex(/^[\x21-\x7e]+$/),
}).strict();
function validateServiceEvidence(evidence: ServiceSnapshot["evidence"]): void { serviceEvidence.parse(evidence); }
export function buildServiceHistory(snapshots: ServiceSnapshot[], asOf: string, catalog: unknown[], curated: unknown[], slugs: string[]): ServiceHistory {
  return buildHistory(snapshots, asOf, catalog, curated, slugs, SERVICE_HISTORY_POLICY, validateServiceEvidence);
}
function buildHistory<E extends HistoryEvidence, P extends string>(snapshots: Snapshot<E>[], asOf: string, catalog: unknown[], curated: unknown[], slugs: string[], policy: P, validateEvidence: (evidence: E) => void): History<E, P> {
  const now = instant(asOf);
  if (!Array.isArray(snapshots) || snapshots.length < 1 || snapshots.length > 32) throw new Error("History needs one to 32 receipts");
  const names = new Map(z.array(z.object({ slug: z.string(), name: z.string() })).parse(catalog).map(item => [item.slug, item.name]));
  if (!Array.isArray(slugs) || slugs.length < 1 || slugs.length > 100 || slugs.some(slug => typeof slug !== "string" || !names.has(slug))) {
    throw new Error("Invalid selected slugs");
  }
  const selected = [...new Set(slugs)].sort(lexical);
  const unique = new Map<string, Snapshot<E>>(), executions = new Map<string, string>();
  for (const snapshot of snapshots) {
    const report = validateSourceReport(snapshot.report, catalog, curated);
    const evidence = snapshot.evidence;
    if (sha256(canonicalJson(report)) !== evidence.sourceSha256) throw new Error("Source SHA-256 mismatch");
    validateEvidence(evidence);
    if (evidence.evidenceClass !== "synthetic-fixture" && evidence.evidenceClass !== "server-collection") throw new Error("Unsupported history evidence classification");
    if (instant(report.generatedAt) > now || instant(evidence.completedAt) > now || instant(evidence.startedAt) > instant(evidence.completedAt)) {
      throw new Error("Invalid or future history execution dates");
    }
    if (executions.has(evidence.executionId) && executions.get(evidence.executionId) !== evidence.receiptSha256) throw new Error("Conflicting receipts from one execution");
    executions.set(evidence.executionId, evidence.receiptSha256);
    const old = unique.get(evidence.receiptSha256);
    if (old && !same(old, snapshot)) throw new Error("Conflicting duplicate receipt");
    unique.set(evidence.receiptSha256, snapshot);
  }
  const ordered = [...unique.values()].sort((a, b) => instant(a.report.generatedAt) - instant(b.report.generatedAt) || lexical(a.evidence.receiptSha256, b.evidence.receiptSha256));
  const latest = ordered[ordered.length - 1];
  const attempts = new Map<string, Map<number, Attempt<E>>>();
  const findings = new Map<string, Map<string, Source["reviewFindings"][number]>>();
  const lastAttempt = new Map<string, Observation>(), lastSuccess = new Map<string, Observation>();
  const citation = (snapshot: Snapshot<E>, index: number, suffix = ""): Citation<E> => ({ ...snapshot.evidence, pointer: `/sources/${index}${suffix}`, receiptGeneratedAt: snapshot.report.generatedAt });
  for (const snapshot of ordered) {
    snapshot.report.sources.forEach((source, index) => {
      const dated = attempts.get(source.url) ?? new Map<number, Attempt<E>>();
      attempts.set(source.url, dated);
      for (const [field, previous] of [["observation", lastAttempt], ["lastSuccessfulObservation", lastSuccess]] as const) {
        const observation = source[field], prior = previous.get(source.url);
        if (prior && (!observation || instant(observation.checkedAt) < instant(prior.checkedAt))) throw new Error("Observation chronology regressed");
        if (!observation) continue;
        previous.set(source.url, observation);
        const time = instant(observation.checkedAt);
        if (time > now) throw new Error("Future history observation");
        const old = dated.get(time);
        const withoutDate = (value: Observation) => ({ ...value, checkedAt: null });
        if (old && !same(withoutDate(old.observation), withoutDate(observation))) throw new Error("Conflicting observations");
        if (!old) dated.set(time, { observation, evidence: citation(snapshot, index, `/${field}`) });
      }
      const merged = findings.get(source.url) ?? new Map<string, Source["reviewFindings"][number]>();
      findings.set(source.url, merged);
      for (const finding of source.reviewFindings) {
        const old = merged.get(finding.kind);
        merged.set(finding.kind, old ? {
          ...old,
          firstObservedAt: instant(old.firstObservedAt) <= instant(finding.firstObservedAt) ? old.firstObservedAt : finding.firstObservedAt,
          lastObservedAt: instant(old.lastObservedAt) >= instant(finding.lastObservedAt) ? old.lastObservedAt : finding.lastObservedAt,
        } : { ...finding });
      }
    });
  }
  const rows = new Map<string, HistorySource<E>>();
  latest.report.sources.forEach((source, index) => {
    const dated = [...(attempts.get(source.url)?.values() ?? [])].sort((a, b) => instant(a.observation.checkedAt) - instant(b.observation.checkedAt));
    const events: HistoryEvent<E>[] = [];
    let previous: Attempt<E> | undefined, success: Attempt<E> | undefined, conclusive: Attempt<E> | undefined;
    const add = (kind: EventKind, attempt: Attempt<E>, before?: Attempt<E>) => {
      const identity = { url: source.url, kind, observation: { ...attempt.observation, checkedAt: new Date(instant(attempt.observation.checkedAt)).toISOString() }, ...(before ? { before: { state: before.observation.state, contentHash: before.observation.contentHash } } : {}) };
      events.push({ id: sha256(canonicalJson(identity)), kind, ...attempt,
        ...(before ? { beforeObservation: before.observation, beforeEvidence: before.evidence } : {}),
        ...(kind === "source_body_changed" && before ? { documentComparison: compareNodeDocuments(before.observation, attempt.observation) } : {}),
      });
    };
    for (const attempt of dated) {
      const observation = attempt.observation;
      if (!previous) add("baseline", attempt);
      else if (observation.state === "unknown") add("inconclusive", attempt, previous);
      else if (conclusive?.observation.state === "reachable" && observation.state === "missing_at_check") add("source_missing_at_check", attempt, conclusive);
      else if (conclusive?.observation.state === "missing_at_check" && observation.state === "reachable") add("source_reachable_again", attempt, conclusive);
      if (observation.state === "reachable") {
        if (success && success.observation.contentHash !== observation.contentHash) add("source_body_changed", attempt, success);
        success = attempt;
      }
      if (observation.state !== "unknown") conclusive = attempt;
      previous = attempt;
    }
    if (previous && (!source.observation || instant(previous.observation.checkedAt) > instant(source.observation.checkedAt))) throw new Error("Observation chronology regressed");
    rows.set(source.url, {
      url: source.url, relationships: source.relationships, observation: source.observation,
      lastSuccessfulObservation: source.lastSuccessfulObservation, state: source.observation?.state ?? "not_checked",
      freshnessAsOf: !source.observation ? "unchecked" : isDue(source, source.observation, asOf) ? "stale" : "current",
      runDisposition: source.runDisposition,
      reviewFindings: [...(findings.get(source.url)?.values() ?? [])].sort((a, b) => Buffer.compare(canonicalJson(a), canonicalJson(b))),
      events, evidence: citation(latest, index),
    });
  });
  const entries = latest.report.listings.filter(listing => selected.includes(listing.slug)).sort((a, b) => lexical(a.slug, b.slug)).map(listing => ({
    ...listing, name: names.get(listing.slug)!, sources: [...rows.values()].filter(source => source.relationships.some(relation => relation.slug === listing.slug)).sort((a, b) => lexical(a.url, b.url)),
  }));
  const selectedRows = [...new Map(entries.flatMap(entry => entry.sources.map(source => [source.url, source] as const))).values()].sort((a, b) => lexical(a.url, b.url));
  const counts = (values: string[]) => {
    const result: Record<string, number> = {};
    for (const value of values.sort(lexical)) result[value] = (result[value] ?? 0) + 1;
    return result;
  };
  return {
    schemaVersion: 1, historyPolicyVersion: policy, sourcePolicyVersion: latest.report.policyVersion, asOf, selectedSlugs: selected,
    receipts: ordered.map(snapshot => ({ ...snapshot.evidence, generatedAt: snapshot.report.generatedAt })),
    summary: { selectedSlugCount: selected.length, sourceCount: selectedRows.length, stateCounts: counts(selectedRows.map(source => source.state)), staleOrUnchecked: selectedRows.filter(source => source.freshnessAsOf !== "current").length, datedObservationCount: selectedRows.reduce((sum, source) => sum + (attempts.get(source.url)?.size ?? 0), 0), eventCounts: counts(selectedRows.flatMap(source => source.events.map(event => event.kind))) },
    publication: latest.report.publication, assessment: latest.report.assessment, inventoryFindings: latest.report.inventoryFindings, entries,
  };
}

function markdown(value: string): string {
  return value.replace(/([\\`*_{}\[\]()#+.!|<>-])/g, "\\$1").replace(/[\r\n]/g, " ");
}
function code(value: string): string {
  const longest = Math.max(0, ...[...value.matchAll(/`+/g)].map(match => match[0].length));
  const fence = "`".repeat(longest + 1);
  return `${fence} ${value.replace(/[\r\n]/g, " ")} ${fence}`;
}
function sourceLink(url: string): string {
  return `[${markdown(url)}](<${url.replace(/[<>]/g, value => encodeURIComponent(value))}>)`;
}
function citeNode(evidence: Citation, pointer = evidence.pointer): string {
  return `evidence class ${code(evidence.evidenceClass)}${evidence.evidenceClass === "synthetic-fixture" ? " (fictional identifiers; no actual Vercel execution claimed)" : ""} · origin ${code(evidence.origin)} · execution ${code(evidence.executionId)} · deployment ${code(evidence.deploymentId)} · git ${code(evidence.gitSha)} · ${code(pointer)} · custody receipt ${code(evidence.receiptSha256)} · source payload ${code(evidence.sourceSha256)}`;
}
function citeService(evidence: Citation<ServiceSnapshot["evidence"]>, pointer = evidence.pointer): string {
  return `EveryMCP service-recorded observation · evidence class ${code(evidence.evidenceClass)}${evidence.evidenceClass === "synthetic-fixture" ? " (fictional observations, signer and identifiers)" : ""} · origin ${code(evidence.origin)} · service ${code(evidence.serviceId)} · key ${code(evidence.keyId)} · execution ${code(evidence.executionId)} · ${code(pointer)} · custody receipt ${code(evidence.receiptSha256)} · source payload ${code(evidence.sourceSha256)}`;
}
function clip(value: string, budget: number): { quote: string; cut: boolean; used: number } {
  // Python also treats NEL as whitespace. Counting JS's additional FEFF boundary is conservative.
  const words = [...value.matchAll(/[^\s\u0085]+/gu)];
  const match = budget > 0 ? words[Math.min(budget, words.length) - 1] : undefined;
  const end = match ? (match.index ?? 0) + match[0].length : 0;
  const quote = [...value.slice(0, end)].slice(0, 160).join("");
  return { quote, cut: quote !== value, used: [...quote.matchAll(/[^\s\u0085]+/gu)].length };
}

export function renderNodeHistory(report: NodeHistory): Buffer {
  if (![NODE_HISTORY_POLICY, LEGACY_NODE_HISTORY_POLICY].includes(report.historyPolicyVersion) || report.schemaVersion !== 1) throw new Error("Unsupported history renderer policy");
  checkHistoryEvidence(report, validateNodeEvidence);
  if (report.historyPolicyVersion === LEGACY_NODE_HISTORY_POLICY) return renderNodeHistoryV1(report);
  return renderHistory(report, NODE_HISTORY_POLICY, citeNode,
    "Unchanged or cached evidence is not a new check. Unresolved findings remain visible after recovery. Each citation identifies its evidence class. Synthetic fixtures use fictional custody identifiers and do not establish an actual Vercel execution. Server-collection custody requires caller admission; hashes establish content integrity, not collector identity by themselves.");
}
export function renderServiceHistory(report: ServiceHistory): Buffer {
  if (report.historyPolicyVersion !== SERVICE_HISTORY_POLICY || report.schemaVersion !== 1) throw new Error("Unsupported service history renderer policy");
  checkHistoryEvidence(report, validateServiceEvidence);
  return renderHistory(report, SERVICE_HISTORY_POLICY, citeService,
    "Unchanged or cached evidence is not a new check. Unresolved findings remain visible after recovery. Each citation identifies its service, signing key and evidence class. Synthetic fixtures contain fictional observations and identifiers. Receipt dates are service-reported dates.",
    "EveryMCP service-recorded observations carry signer/credential-holder endorsement only. This does not establish truthful fetching, independent time, a particular build or platform provenance, or MCP compatibility/security. Hashes bind recorded bytes; service identifiers and signing keys do not independently verify the observations.");
}
function checkHistoryEvidence<E extends HistoryEvidence, P extends string>(report: History<E, P>, validateEvidence: (evidence: E) => void): void {
  for (const receipt of report.receipts) validateEvidence(Object.fromEntries(Object.entries(receipt).filter(([key]) => key !== "generatedAt")) as E);
  const check = (citation: Citation<E>) => validateEvidence(Object.fromEntries(Object.entries(citation).filter(([key]) => key !== "pointer" && key !== "receiptGeneratedAt")) as E);
  for (const entry of report.entries) for (const source of entry.sources) {
    check(source.evidence);
    for (const event of source.events) { check(event.evidence); if (event.beforeEvidence) check(event.beforeEvidence); }
  }
}
function renderHistory<E extends HistoryEvidence, P extends string>(report: History<E, P>, policy: string, cite: (evidence: Citation<E>, pointer?: string) => string, notice: string, endorsement?: string): Buffer {
  const summary = report.summary;
  const lines = ["# Public source history", "", `As of: ${report.asOf}`, "", `Policy: ${policy}.`, "", ...(endorsement ? [endorsement, ""] : []),
    `${summary.selectedSlugCount} selected listings; ${summary.sourceCount} distinct source URLs; ${summary.datedObservationCount} distinct dated observations in ${report.receipts.length} supplied receipts.`,
    `Latest evidence states: ${Object.entries(summary.stateCounts).map(([state, count]) => `${state}: ${count}`).join(", ")}. Stale or unchecked sources: ${summary.staleOrUnchecked}.`, "",
    "Review-required evidence. Receipt dates are observation dates, not proof that monitoring is running now. No automatic delivery or paid entitlement is established.",
    "HTTP observations do not establish MCP compatibility, tool behavior, security or publisher identity. Missing-at-check means HTTP 404/410 at that time; unknown is inconclusive. Neither proves continuous downtime, outage duration or uptime. Raw source-body changes can include page chrome.",
    notice, ""];
  lines.push("## Latest captured change", "",
    "Previews prioritize the newest complete changed projection: at most 12 quoted words before and 12 after per source. Older comparisons retain their dates and evidence below. These short previews may not contain the changed passage; operational impact remains unknown.", "");
  const sources = new Map(report.entries.flatMap(entry => entry.sources.map(source => [source.url, source] as const)));
  for (const [url, source] of [...sources].sort(([a], [b]) => lexical(a, b))) {
    lines.push(`### ${sourceLink(url)}`, "", `Latest observation: ${source.state} at ${source.observation?.checkedAt ?? "not checked"}; freshness ${source.freshnessAsOf} as of ${report.asOf}.`);
    const event = [...source.events].reverse().find(item => item.kind === "source_body_changed" && item.documentComparison?.state === "captured_representation_changed" && item.beforeObservation && item.beforeEvidence);
    if (!event?.beforeObservation || !event.beforeEvidence || !event.documentComparison) {
      lines.push("No complete captured document change is available. Unknown or incomplete evidence is not unchanged content.", ""); continue;
    }
    lines.push(`Latest captured change: ${event.documentComparison.beforeBodyObservedAt} → ${event.documentComparison.afterBodyObservedAt}; compared HTTP observations ${event.beforeObservation.checkedAt} → ${event.observation.checkedAt}.`);
    if (source.observation && instant(source.observation.checkedAt) > instant(event.observation.checkedAt)) lines.push("This comparison predates the latest observation above; its scope remains the captured sections and dates shown.");
    const budgets = { Before: 12, After: 12 };
    if (!event.documentComparison.changes.length) lines.push("Captured section order or omission categories changed; no matched-section text change is identified.");
    for (const change of event.documentComparison.changes) {
      lines.push(`- Section ${code(change.sectionId)}: ${change.kind}.`);
      for (const [side, observation, evidence] of [["Before", event.beforeObservation, event.beforeEvidence], ["After", event.observation, event.evidence]] as const) {
        const projection = observation.documentProjection;
        const index = projection?.sections.findIndex(section => section.id === change.sectionId) ?? -1;
        if (!projection || index < 0) { lines.push(`  ${side}: section absent in this captured representation.`); continue; }
        const section = projection.sections[index];
        lines.push(`  ${side}: ${cite(evidence, `${evidence.pointer}/documentProjection/sections/${index}`)} · section SHA-256 \`${section.contentHash}\`.`);
        for (const field of ["heading", "excerpt"] as const) {
          const allowance = field === "heading" ? Math.min(2, budgets[side]) : budgets[side];
          const result = clip(section[field], allowance); budgets[side] -= result.used;
          const truncated = field === "heading" ? section.headingTruncated : section.excerptTruncated;
          if (result.quote) lines.push(`  ${side} ${field} preview: “${markdown(result.quote)}”${result.cut || truncated ? " [truncated]" : ""}`);
          else if (section[field] || truncated) lines.push(`  ${side} ${field} preview omitted: quote budget or capture limit.`);
        }
      }
    }
    lines.push("");
  }
  const labels: Record<EventKind, string> = { baseline: "Baseline observation", inconclusive: "Inconclusive check", source_missing_at_check: "Source missing at check", source_reachable_again: "Source reachable again", source_body_changed: "Complete source bytes changed" };
  for (const entry of report.entries) {
    lines.push(`## ${markdown(entry.name)} (${code(entry.slug)})`, "");
    for (const source of entry.sources) {
      const observation = source.observation;
      const roles = [...new Set(source.relationships.filter(relation => relation.slug === entry.slug).map(relation => `${relation.role}/${relation.identityEvidence}`))].sort(lexical).join(", ");
      lines.push(`- ${sourceLink(source.url)} (${markdown(roles)}): ${source.state} at ${observation?.checkedAt ?? "not checked"}; HTTP ${observation?.httpStatus ?? "null"} / ${markdown(observation?.reason ?? "no_observation")}; freshness ${source.freshnessAsOf}; disposition ${markdown(source.runDisposition)}.`, `  Evidence: ${cite(source.evidence)}.`);
      if (source.lastSuccessfulObservation) lines.push(`  Last successful observation: ${source.lastSuccessfulObservation.checkedAt} · complete-body SHA-256 \`${source.lastSuccessfulObservation.contentHash}\`.`);
      for (const event of source.events) {
        const after = event.observation;
        lines.push(`  - ${labels[event.kind]} at ${after.checkedAt} (HTTP ${after.httpStatus ?? "null"} / ${markdown(after.reason)}) · ${cite(event.evidence)}.`);
        if (event.beforeObservation && event.beforeEvidence) {
          lines.push(`    Compared with ${event.beforeObservation.state} at ${event.beforeObservation.checkedAt}: ${cite(event.beforeEvidence)}.`);
          if (event.kind === "source_body_changed") lines.push(`    Complete-body SHA-256 \`${event.beforeObservation.contentHash}\` → \`${after.contentHash}\`. Inspect the source and your pinned revision before changing an integration; semantic impact is unknown.`);
        }
      }
      for (const finding of source.reviewFindings) lines.push(`  - Review required: ${markdown(finding.kind)} (${finding.firstObservedAt} to ${finding.lastObservedAt}).`);
    }
    lines.push("");
  }
  lines.push("## Captured document comparisons", "",
    "Static source evidence, not a semantic or compatibility assessment. Sections include text and hashed attribute values/link destinations; scripts, styles and comments may be omitted. No linked destination is fetched.",
    "Short excerpts are bounded previews, not necessarily the changed passage. Full-page text is not retained. Section matching uses heading identity/occurrence; renamed headings appear as removed/added. Section order or omitted-content categories can change without a matched-section change.",
    "HTML tag/attribute names, attribute order and character-reference spelling normalize; text, numbers, commands, timestamps, attribute values and preformatted whitespace remain significant. Equal captured representation never establishes that all changes are incidental.", "");
  for (const [url, source] of [...sources].sort(([a], [b]) => lexical(a, b))) {
    const projection = source.observation?.documentProjection;
    lines.push(`### ${sourceLink(url)}`, "", `Current capture: ${projection?.state ?? "not_captured"} (${projection?.reason ?? (source.observation ? "legacy_body_not_retained" : "no_observation")}); source freshness as of ${report.asOf}: ${source.freshnessAsOf}.`);
    if (projection?.bodyObservedAt) lines.push(`Body captured at ${projection.bodyObservedAt}; HTTP observation at ${source.observation!.checkedAt}. Omitted material: ${projection.omissions.join(", ") || "none recorded"}.`);
    for (const event of source.events) {
      if (event.kind !== "source_body_changed" || !event.documentComparison || !event.beforeObservation || !event.beforeEvidence) continue;
      const comparison = event.documentComparison;
      lines.push(`- Comparison of ${event.beforeObservation.checkedAt} → ${event.observation.checkedAt}: ${comparison.state} (${markdown(comparison.reason)}).`);
      if (comparison.state === "unavailable") { lines.push("  No document-content conclusion is available; this is not evidence of unchanged content."); continue; }
      lines.push(`  Original body capture dates: ${comparison.beforeBodyObservedAt ?? "unknown"} → ${comparison.afterBodyObservedAt ?? "unknown"}. Historical comparison only; current source state may differ.`);
      if (comparison.state === "captured_representation_unchanged") { lines.push("  Captured representation unchanged; other differences unclassified. Inspect the cited source before changing an integration."); continue; }
      lines.push("  Review the identified sections against your pinned configuration; this report does not determine the operational effect.");
      for (const change of comparison.changes) {
        lines.push(`  - Section ${code(change.sectionId)}: ${change.kind}.`);
        for (const [side, observation, evidence] of [["Before", event.beforeObservation, event.beforeEvidence], ["After", event.observation, event.evidence]] as const) {
          const p = observation.documentProjection;
          const index = p?.sections.findIndex(section => section.id === change.sectionId) ?? -1;
          if (!p || index < 0) continue;
          const section = p.sections[index];
          lines.push(`    ${side}: ${cite(evidence, `${evidence.pointer}/documentProjection/sections/${index}`)} · section SHA-256 \`${section.contentHash}\`.`);
          lines.push(`    ${side} previews omitted here; the latest complete captured change receives the source quote budget above.`);
        }
      }
    }
    lines.push("");
  }
  return Buffer.from(lines.join("\n"), "utf8");
}
