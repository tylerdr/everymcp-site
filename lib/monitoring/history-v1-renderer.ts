// Frozen renderer for existing source-receipt-history-node-v1 originals. Do not revise output.
import type { NodeHistory } from "./history";
export const LEGACY_NODE_HISTORY_POLICY = "source-receipt-history-node-v1";
type Citation = NodeHistory["entries"][number]["sources"][number]["evidence"];
type EventKind = NodeHistory["entries"][number]["sources"][number]["events"][number]["kind"];
const lexical = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

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
function cite(evidence: Citation, pointer = evidence.pointer): string {
  return `evidence class ${code(evidence.evidenceClass)}${evidence.evidenceClass === "synthetic-fixture" ? " (fictional identifiers; no actual Vercel execution claimed)" : ""} · origin ${code(evidence.origin)} · execution ${code(evidence.executionId)} · deployment ${code(evidence.deploymentId)} · git ${code(evidence.gitSha)} · ${code(pointer)} · custody receipt ${code(evidence.receiptSha256)} · source payload ${code(evidence.sourceSha256)}`;
}
function clip(value: string, budget: number): { quote: string; cut: boolean; used: number } {
  // Python also treats NEL as whitespace. Counting JS's additional FEFF boundary is conservative.
  const words = [...value.matchAll(/[^\s\u0085]+/gu)];
  const match = budget > 0 ? words[Math.min(budget, words.length) - 1] : undefined;
  const end = match ? (match.index ?? 0) + match[0].length : 0;
  const quote = [...value.slice(0, end)].slice(0, 160).join("");
  return { quote, cut: quote !== value, used: [...quote.matchAll(/[^\s\u0085]+/gu)].length };
}

export function renderNodeHistoryV1(report: NodeHistory): Buffer {
  if (report.historyPolicyVersion !== LEGACY_NODE_HISTORY_POLICY || report.schemaVersion !== 1) throw new Error("Unsupported history renderer policy");
  const summary = report.summary;
  const lines = ["# Public source history", "", `As of: ${report.asOf}`, "", `Policy: ${LEGACY_NODE_HISTORY_POLICY}.`, "",
    `${summary.selectedSlugCount} selected listings; ${summary.sourceCount} distinct source URLs; ${summary.datedObservationCount} distinct dated observations in ${report.receipts.length} supplied receipts.`,
    `Latest evidence states: ${Object.entries(summary.stateCounts).map(([state, count]) => `${state}: ${count}`).join(", ")}. Stale or unchecked sources: ${summary.staleOrUnchecked}.`, "",
    "Review-required evidence. Receipt dates are observation dates, not proof that monitoring is running now. No automatic delivery or paid entitlement is established.",
    "HTTP observations do not establish MCP compatibility, tool behavior, security or publisher identity. Missing-at-check means HTTP 404/410 at that time; unknown is inconclusive. Neither proves continuous downtime, outage duration or uptime. Raw source-body changes can include page chrome.",
    "Unchanged or cached evidence is not a new check. Unresolved findings remain visible after recovery. Each citation identifies its evidence class. Synthetic fixtures use fictional custody identifiers and do not establish an actual Vercel execution. Server-collection custody requires caller admission; hashes establish content integrity, not collector identity by themselves.", ""];
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
  const sources = new Map(report.entries.flatMap(entry => entry.sources.map(source => [source.url, source] as const)));
  for (const [url, source] of [...sources].sort(([a], [b]) => lexical(a, b))) {
    const projection = source.observation?.documentProjection;
    lines.push(`### ${sourceLink(url)}`, "", `Current capture: ${projection?.state ?? "not_captured"} (${projection?.reason ?? (source.observation ? "legacy_body_not_retained" : "no_observation")}); source freshness as of ${report.asOf}: ${source.freshnessAsOf}.`);
    if (projection?.bodyObservedAt) lines.push(`Body captured at ${projection.bodyObservedAt}; HTTP observation at ${source.observation!.checkedAt}. Omitted material: ${projection.omissions.join(", ") || "none recorded"}.`);
    let budget = 24;
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
          for (const field of ["heading", "excerpt"] as const) {
            const result = clip(section[field], budget); budget -= result.used;
            const truncated = field === "heading" ? section.headingTruncated : section.excerptTruncated;
            if (result.quote) lines.push(`    ${side} ${field} preview: “${markdown(result.quote)}”${result.cut || truncated ? " [truncated]" : ""}`);
            else if (section[field] || truncated) lines.push(`    ${side} ${field} preview omitted: quote budget or capture limit.`);
          }
        }
      }
    }
    lines.push("");
  }
  return Buffer.from(lines.join("\n"), "utf8");
}
