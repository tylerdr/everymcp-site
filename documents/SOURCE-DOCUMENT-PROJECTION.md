# Bounded document comparisons — code-only candidate

PR36 now carries a coherent `public-source-v2` capture/receipt contract and `source-receipt-history-v2` consumer. An illustrative fictional requirement change (Node 18 → Node 20) reaches the actual report producer with old/new bounded previews, section hashes, receipt pointers, source links and original observation dates. See [the fictional generated report](source-monitor-reviews/projection-fictional-example-2026-11-12.md). Its response bytes and run/job metadata are test fixtures, not a publisher change or an actual collection run.

## Capture and coverage

`observe()` passes only response bytes already obtained by the existing collector into `source_document_projection.py`. No new request, redirect, linked destination, JavaScript, provider, credential or dependency is used. Collection rules and the Actions hold remain unchanged. A future authorized collection would emit v2; no collection was executed for this change.

The projection is bound to the exact URL, canonical relationship fingerprint, complete-body hash, original body-observation time and `static-document-v1` profile. Successful complete UTF-8 `text/html`, `text/plain` and `text/markdown` responses are eligible. Missing/unsupported media, encodings or charsets, unsafe control text, malformed/unbalanced markup, incomplete bodies and exceeded extraction limits produce explicit unavailable states, never equality. This is a conservative static representation, not a browser DOM or rendered-content assessment. Strict markup handling may refuse otherwise browser-readable pages.

HTML parsing uses the standard library: tag/attribute name case, attribute order, quote syntax and character-reference spelling can normalize. Tag/token order, all attribute values (including link destinations), numbers, versions, commands, timestamps and all text/preformatted whitespace affect hashes. Duplicate attributes refuse extraction. Script/style bodies, comments and declarations are omitted and recorded; their opening/closing tags and attributes remain significant. No navigation/footer/timestamp stripping or semantic inference occurs. Plain text and Markdown are one section with exact whitespace retained.

Limits are 16 sections, 20,000 tokens, depth 128, 64 attributes per tag, 256-character attribute names and 8,192-character values, under the existing 1 MiB complete-response cap. Any extraction limit refuses the entire comparison; equal retained prefixes never establish equality. Headings/section occurrence identify sections, so renames appear as removed/added and repeated headings remain positional within that heading identity. Reordering can alter the overall projection without a matched-section hash change.

Full bodies, normalized token streams and attribute values are not persisted. Their hashes plus **bounded heading/excerpt fragments** are persisted: at most 24 whitespace-delimited words total per projection, with 160-character fragment limits and explicit truncation flags. The Markdown renderer separately enforces 24 words across every comparison side/event for a source URL in the whole report, including sources shared by multiple listings. Quotes are escaped and extracted destinations remain inert. This v2 contract is no longer described as entirely body-free. Hashes alone authenticate neither collector origin nor excerpt truth: admitted receipt hashes and canonical execution provenance remain required.

## What buyers can conclude

- Different captured sections identify where to review a pinned configuration and show short observed before/after previews where the budget permits. A preview is not necessarily the changed passage; that limitation is explicit.
- Different raw hashes with equal projections say only: **“Captured representation unchanged; other differences unclassified.”** This does not classify unexamined differences as noise or claim an unchanged document.
- Incomplete, unsupported, absent or legacy content remains unavailable. Source/relationship changes fail admission/comparison rather than silently joining another identity.
- Dates and stale state remain visible. A later HTTP 304 retains the earlier body-capture date and projection; it does not invent a new body capture. Unknown checks preserve prior evidence without implying unchanged content during the gap.
- HTTP/document evidence does not establish compatibility, tool execution, security, outage duration, uptime or operational impact. There are no model-generated interpretations.

## Compatibility and recovery

The schema admits unchanged v1 receipts and v1 caches. Legacy observations have no invented text; new reports explicitly display `not_captured`. New caches/receipts use version 2 and retain the identity-bound projection when present. Receipt checks validate projection structure, bound excerpts, hash/date consistency and exact source relationships.

The original v1 renderer is retained byte-for-byte. Recovery dispatches by the stored history policy. The worker validates both v1/v2 job identities; a retry checks a previously committed v1 job before preparing a new v2 report for that period. Existing owner/current-rights checks remain in force. There is no production binding or hosted worker, and no concurrent deployed-version migration has been exercised.

## Executed evidence

The focused projection suite covers fictional meaningful changes, syntax-only changes, omitted content, numbers/commands/link destinations/whitespace, incomplete and unsupported inputs, extraction bounds, duplicate/malformed markup, stale dates, source remapping, tampered metadata, 304 lineage, shared excerpt budgets, real producer/persistence and fresh-process recovery. Source-monitor, importer/history and worker regressions also pass. Run without live collection:

```sh
python -m unittest discover -s tests -p 'test_document_projection.py' -v
python -m unittest discover -s tests -p 'test_source_monitor.py' -v
python -m unittest discover -s tests -p 'test_source_receipt*.py' -v
python -m unittest discover -s tests -p 'test_monitoring_workflow.py' -v
```

The standalone fictional producer result and independent fresh-process recovery both contain 6,718 bytes, SHA-256 `9677ce1dad46e84f8e54529749de244a0bc026f16675e70a2d2827040c811d88`. Its local immutable bundle is `e1faf6dfa2a9faf1992c4db97c43013778c3f190f842dcf0e8fc7f118aeda115`. Fake identity/rights and fake execution metadata are clearly separated from actual local producer/storage behavior. The existing actual v1 historical report still recovers exactly: 4,861 bytes, SHA-256 `187072dc5ef9342e21c415bf29ee4b97e5e430763e72a68d031f788b67c33237`.

Two genuine authorized capture periods for the same source identity remain required before claiming recurring document-change monitoring. No live collector, Actions, scheduler, SQL, Auth, provider, payment, email, offer, price or terms were activated. Vercel verifies the application build, not Python execution or paid monitoring.
