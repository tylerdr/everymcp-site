import evidenceData from "../data/listing-evidence.json";

export type ListingSourceCheck = {
  url: string;
  httpStatus: number;
  checkedAt: string;
};

export type ListingEvidence = {
  slug: string;
  summary: string;
  indexedRepository: ListingSourceCheck;
  checkMethod: string;
  references: Array<ListingSourceCheck & {
    kind: "publisher" | "community";
    label: string;
    note: string;
  }>;
};

// Curated receipts only. No build-time or request-time network discovery.
export const listingEvidence = evidenceData as ListingEvidence[];
export const getListingEvidence = (slug: string) =>
  listingEvidence.find((entry) => entry.slug === slug);

export function formatSourceCheckDate(checkedAt: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC"
  }).format(new Date(checkedAt)) + " UTC";
}
