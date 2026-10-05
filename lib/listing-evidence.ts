import evidenceData from "../data/listing-evidence.json";
import observationNotes from "../data/listing-observation-notes.json";

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
    observationReceiptUrl?: string;
  }>;
};

// Curated receipts only. No build-time or request-time network discovery.
export const listingEvidence = evidenceData as ListingEvidence[];
export function getListingEvidence(slug: string): ListingEvidence | undefined {
  const entry = listingEvidence.find((item) => item.slug === slug);
  if (!entry) return undefined;
  return {
    ...entry,
    references: entry.references.map((reference) => {
      const observation = observationNotes.find((note) =>
        note.slug === slug && note.sourceUrl === reference.url && reference.kind === "publisher");
      return observation ? {
        ...reference,
        note: `${reference.note} ${observation.note}`,
        observationReceiptUrl: observation.receiptUrl
      } : { ...reference };
    })
  };
}

export function formatSourceCheckDate(checkedAt: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC"
  }).format(new Date(checkedAt)) + " UTC";
}
