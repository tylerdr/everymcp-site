import { formatSourceCheckDate, type ListingEvidence } from "@/lib/listing-evidence";

export function ListingSourceEvidence({ evidence }: { evidence: ListingEvidence }) {
  return (
    <section aria-labelledby="source-evidence-heading" className="mt-6 rounded-2xl border border-border bg-muted/50 p-5 text-foreground">
      <h2 id="source-evidence-heading" className="text-lg font-bold">Source evidence</h2>
      <p className="mt-2 text-sm leading-6">{evidence.summary}</p>
      <p className="mt-3 text-xs leading-6 text-muted-foreground">
        Previously indexed repository: HTTP {evidence.indexedRepository.httpStatus} on{" "}
        <time dateTime={evidence.indexedRepository.checkedAt}>{formatSourceCheckDate(evidence.indexedRepository.checkedAt)}</time>.
        {" "}This is a dated observation; source availability can change.
      </p>
      <ul className="mt-4 space-y-4">
        {evidence.references.map((reference) => (
          <li key={reference.url}>
            <a href={reference.url} target="_blank" rel="noreferrer" className="break-words text-sm font-bold text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {reference.label} ↗
            </a>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {reference.kind === "publisher" ? "Publisher documentation" : "Separate community implementation"}
              {" · "}HTTP {reference.httpStatus}{" · "}
              <time dateTime={reference.checkedAt}>{formatSourceCheckDate(reference.checkedAt)}</time>
            </p>
            <p className="mt-1 text-sm leading-6">{reference.note}</p>
            {reference.observationReceiptUrl ? (
              <a href={reference.observationReceiptUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                Read the observation record ↗
              </a>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs leading-6 text-muted-foreground">
        {evidence.checkMethod} A reachable source does not establish tool behavior, security, or compatibility with your client.
      </p>
    </section>
  );
}
