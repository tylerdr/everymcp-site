import { z } from "zod";
import { coverageSchema } from "./control-contract";
import { compareNodeDocuments } from "./history";
import { buildServiceHistory, renderServiceHistory, type ServiceSnapshot } from "./service-history";
import { OWNED_SERVICE_REPORT_POLICY } from "./service-records";
import { canonicalJson, timestamp, type Observation } from "./source-contract";

export const ownedReportContextSchema = z.object({ watchlistSha256: z.string().regex(/^[a-f0-9]{64}$/), coverage: coverageSchema }).strict();
export type OwnedReportContext = z.infer<typeof ownedReportContextSchema>;
type LatestState = { state: "changed" | "unchanged" | "unknown" | "baseline"; description: string };
function captured(observation: Observation | null): observation is Observation {
  return !!observation && observation.state === "reachable" && observation.bodyComplete && observation.documentProjection?.state === "captured";
}
function latestState(current: Observation | null, freshness: string, prior: Observation[]): LatestState {
  if (freshness !== "current") return { state: "unknown", description: "The latest source evidence is stale or unchecked; it does not establish a current comparison." };
  if (!captured(current)) return { state: "unknown", description: "The latest observation is missing, inconclusive, incomplete or lacks a complete captured projection." };
  const before = prior.filter(observation => observation.state === "reachable" && timestamp(observation.checkedAt) < timestamp(current.checkedAt)).sort((a, b) => timestamp(b.checkedAt) - timestamp(a.checkedAt))[0];
  if (!before) return { state: "baseline", description: `First complete captured representation at ${current.documentProjection!.bodyObservedAt}; no earlier successful representation is available for comparison.` };
  if (!captured(before)) return { state: "unknown", description: "The earlier successful observation lacks a complete captured projection; no content comparison is available." };
  const comparison = compareNodeDocuments(before, current);
  const dates = `${comparison.beforeBodyObservedAt} → ${comparison.afterBodyObservedAt}; HTTP observations ${before.checkedAt} → ${current.checkedAt}`;
  if (comparison.state === "captured_representation_changed") return { state: "changed", description: `Captured representation changed (${dates}). Operational effect is unknown.` };
  if (comparison.state === "captured_representation_unchanged") return { state: "unchanged", description: `Captured representation unchanged (${dates}); other differences remain unclassified. This does not establish globally unchanged content.` };
  return { state: "unknown", description: "Complete captured representations could not be compared." };
}
function link(url: string): string {
  const label = url.replace(/([\\`*_{}\[\]()#+.!|<>-])/g, "\\$1");
  return `[${label}](<${url.replace(/[<>]/g, character => encodeURIComponent(character))}>)`;
}

/** The complete returned bytes, including canonical context, are the immutable signed payload.
 * Construction accepts admitted source snapshots; it neither collects nor invents missing receipts. */
export function renderOwnedServiceReport(snapshots: ServiceSnapshot[], asOf: string, catalog: unknown[], curated: unknown[], slugs: string[], context: OwnedReportContext): Buffer {
  const checked = ownedReportContextSchema.parse(context), asOfTime = timestamp(asOf);
  const ends = checked.coverage.missingPeriodEnds.map(timestamp);
  if (checked.coverage.availablePeriods !== snapshots.length || new Set(ends).size !== ends.length || ends.some(end => end > asOfTime) || ends.some((end, index) => index > 0 && end <= ends[index - 1])) throw new Error("Owned report coverage mismatch");
  const history = buildServiceHistory(snapshots, asOf, catalog, curated, slugs);
  if (history.receipts.length !== checked.coverage.availablePeriods) throw new Error("Owned report duplicate period evidence");
  const coverage = checked.coverage;
  const lines = ["# Owned monitoring report", "", `Policy: ${OWNED_SERVICE_REPORT_POLICY}.`, `As of: ${asOf}.`, "",
    "EveryMCP service-recorded observations carry signer/credential-holder endorsement only. They do not establish truthful fetching, independent time, a particular build/platform, or MCP compatibility/security.", "",
    `Period coverage: ${coverage.state}; ${coverage.availablePeriods} available of ${coverage.expectedPeriods} expected periods; ${coverage.missingPeriodEnds.length} missing.`,
    "Missing periods are coverage gaps, not successful checks or evidence of unchanged content.", ""];
  for (const end of coverage.missingPeriodEnds) lines.push(`- Missing expected period ending ${end}.`);
  lines.push("", "Canonical report context (bound by the enclosing receipt's report digest/signature):", "", "```json", canonicalJson(checked).toString("utf8").trimEnd(), "```", "",
    "## Latest observation assessment", "",
    "Each state describes only the latest recorded bounded static representation. Stale, missing or incomplete current evidence remains unknown. Bounded preview truncation does not erase complete section hashes. Scripts, styles, comments or declarations may be omitted; linked destinations and dynamic behavior are not assessed.", "");
  const sources = new Map(history.entries.flatMap(entry => entry.sources.map(source => [source.url, source] as const)));
  for (const [url, source] of [...sources].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
    const observations: Observation[] = [];
    for (const snapshot of snapshots) {
      const row = snapshot.report.sources.find(candidate => candidate.url === url);
      if (row?.observation) observations.push(row.observation);
      if (row?.lastSuccessfulObservation) observations.push(row.lastSuccessfulObservation);
    }
    const assessment = latestState(source.observation, source.freshnessAsOf, observations);
    lines.push(`- ${link(url)} — latest state: **${assessment.state}**. ${assessment.description}`,
      `  Latest HTTP state: ${source.state}; observation ${source.observation?.checkedAt ?? "not checked"}; freshness ${source.freshnessAsOf}.`);
    const projection = source.observation?.documentProjection;
    lines.push(`  Omitted material in the current static representation: ${projection?.omissions.join(", ") || "none recorded"}.`);
  }
  lines.push("", "## Source history comparison component", "", "The comparison component below retains actual receipt/source hashes, observation dates, projection limits and balanced previews. A historical change does not replace the latest-state assessment or fill missing expected periods.", "");
  return Buffer.concat([Buffer.from(lines.join("\n"), "utf8"), renderServiceHistory(history)]);
}
