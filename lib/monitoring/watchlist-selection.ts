import { WatchlistConflict } from "./control-contract";
import { sourceInventory } from "./source-contract";

export type SelectionReason = "canonical_source_unavailable" | "too_many_source_urls" | "multiple_source_hosts";
export type WatchlistSelection = { sourceUrls: string[]; sourceCount: number; hostCount: number; reasons: SelectionReason[] };

/** Only server-loaded inventory supplies URLs. All references and slug relationships count.
 * Eligibility is a capture bound, never a reachability, publisher or compatibility claim. */
export function createWatchlistSelectionQualifier(catalog: unknown[], curated: unknown[]) {
  const inventory = sourceInventory(catalog, curated);
  const urlsBySlug = new Map(inventory.listings.map(listing => [listing.slug, new Set<string>()]));
  const rejected = new Set(inventory.rejected.map(input => input.slug));
  for (const source of inventory.sources.values()) for (const relation of source.relationships) urlsBySlug.get(relation.slug)!.add(source.url);
  return (slugs: readonly string[]): WatchlistSelection => {
    const sourceUrls = [...new Set(slugs.flatMap(slug => [...urlsBySlug.get(slug) || []]))].sort();
    const sourceCount = sourceUrls.length, hostCount = new Set(sourceUrls.map(url => new URL(url).hostname)).size;
    const reasons: SelectionReason[] = [];
    if (!slugs.length || slugs.some(slug => !urlsBySlug.get(slug)?.size || rejected.has(slug))) reasons.push("canonical_source_unavailable");
    if (sourceCount > 2) reasons.push("too_many_source_urls");
    if (hostCount > 1) reasons.push("multiple_source_hosts");
    return { sourceUrls, sourceCount, hostCount, reasons };
  };
}

export class WatchlistSelectionError extends WatchlistConflict {
  constructor(readonly selection: WatchlistSelection) {
    super("Select at most two canonical sources on one host; every listing reference must be usable");
  }
}
