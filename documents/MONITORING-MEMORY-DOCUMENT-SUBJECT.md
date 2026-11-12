# Prospective Memory documentation subject — 2026-11-12

Source-only, unbound admission of authenticated declarations. This is not a collector,
an activated monitoring product, an ownership/entitlement grant or a legal clearance.
The module is imported only by its synthetic tests. No existing allowlist, inventory,
route, receipt policy, renderer or frozen compatibility validator changes.

## Exact subject and separate namespace

`everymcp-document-subject-v1`, document `memory-changelog`, revision `1`, relates
the catalog slug `memory` and its directory source
`https://github.com/modelcontextprotocol/servers/tree/main/src/memory` to the
prospective document
`https://raw.githubusercontent.com/modelcontextprotocol/servers/main/src/memory/CHANGELOG.md`.
The canonical subject includes both identities and explicitly says
`associated_document_not_directory_coverage`. Its SHA256 is an identity, not authority.
The document never substitutes for the directory or claims complete listing coverage.

The new source-policy, job, observation, review and admission identifiers are,
respectively, `everymcp-memory-changelog-source-v1`,
`everymcp-memory-document-job-v1`, `everymcp-memory-document-observation-v1`,
`everymcp-memory-document-review-v1` and `everymcp-memory-document-admission-v1`.
The old URL policy still rejects this host. Old service receipts and the frozen
evidence gate do not accept the new format; there is no cross-version fallback.
This module is not a successor two-period evidence validator and emits no quotations.

## Trust and verifiable checks

Trusted server code must load the canonical scope/owner/watchlist/version/period,
subject, allocated execution/nonce, clock, current cooldown state and exact reviewed
record digest. The job digest binds that configuration in the new namespace.
The public request contains only observation bytes, document bytes and robots bytes.
Extra owner, key, paid, reviewed or success flags are rejected. Construct the factory
afresh after current authentication, ownership and generation-rights checks; those
checks and hosted bindings are not provided here. Configuring this factory from a
client request would violate its trust boundary.

Two distinct configured Ed25519 public keys verify two domain-separated roles:
`everymcp-memory-document:observation:v1` plus NUL, and
`everymcp-memory-document:review:v1` plus NUL, each followed by canonical JSON of the
record without its signature. Different key IDs over the same key are refused.
Distinct roles do not prove independent people or organizations. Keys are public-only,
have explicit validity/revocation fields, and known RFC test vectors cannot be used
as service authority. No production key or signing/registration mechanism is added.

The producer signs exact source/robots URLs, bytes/hashes, HTTP status, complete/noncached
disposition, media, identity encoding, times/counts, resolved/pinned addresses and TLS
claims. The validator checks internal consistency, public-address policy, exact host/path/
branch (including no query, fragment, credentials, subdomain or redirect), complete HTTP200,
strict UTF8 plain text/Markdown, and conservative robots permission from signed robots bytes.
Only complete empty404/410 robots absence is accepted; failures/unknown parsing refuse.
No HTML or charset conversion, decompression, body repair or truncation occurs.

Limits are one source request and one robots request, each at most8seconds and total
capture at most30seconds; one host; document at most16KiB; robots at most64KiB;
each signed envelope at most8KiB; and all four supplied byte strings together at most64KiB.
The one-source restriction is narrower than the frozen two-source ceiling. Existing
public-IP and robots parsers are reused without modifying transport behavior.
Robots minimum intervals and trusted scheduler not-before/previous-host-request state
must agree. `lastHostRequestCompletedAt:null` means trusted known-empty history, never
unknown history. Sources become stale at seven days, matching the existing nonpriority
Memory policy; that is observation freshness, not a selected storage lifetime.

Signatures authenticate service assertions, not independent proof of truthful fetching,
TLS/DNS, time/latestness, platform execution, upstream ownership or permission. An
authorized compromised signer can lie. Output explicitly says `service_asserted`,
`rightsGranted:false`, compatibility `unverified`, impact `not_assessed`, and custody/
replay protection `not_provided`. Matching a configured execution prevents cross-job
reuse, but repeated validation of the same record is intentionally idempotent. A future
protected ledger must enforce nonce uniqueness and canonical winner selection.

## Exact-byte review and licensing boundary

The separate review attestation binds the exact document hash/length, scope/subject,
repository owner/path/branch, license evidence URL/blob identity, provenance-evidence
digest, reviewer identity and validity interval. It requires reviewed assertions that
specifications, doubtful third-party material and sensitive content are absent, plus
source/title/creator/copyright/license/warranty/modification notices, retained applicable
MIT notice, no endorsement and recipients' reuse rights. Missing, revoked, expired,
changed-owner/license/subject or uncertain declarations refuse. Producer keys cannot
sign an eligible review. These assertions are trusted review decisions, not a text
classifier or a hash-based proof of copyright ownership/sensitive-content absence.

The [MCP LICENSE](https://github.com/modelcontextprotocol/servers/blob/main/LICENSE)
explicitly assigns documentation excluding specifications to CC BY4.0 and preserves
applicable original MIT contributions during the code-licensing transition. That
documentation-specific statement is stronger than a package badge, but is not a
guarantee covering every historical contribution or third-party example.
[CC BY4.0](https://creativecommons.org/licenses/by/4.0/legalcode.en) requires applicable
attribution, source/license and modification notices, preserves recipient reuse, and
does not confer endorsement/privacy/trademark rights. Product access terms must not
misrepresent or restrict recipients' underlying licensed material rights.
GitHub-hosted UI and linked issues/examples/websites are separate material;
[hosting terms](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service)
are separate from repository licensing. No agreement is accepted by this source work.

Only metadata and a bounded changelog excerpt were reviewed before implementation.
The observed11735-byte changelog blob `70aa2bdac74e36123aed6e146055a1137c2bf61f` and
license blob `4a93985763241755401a10678395303de4e720ba` are historical metadata, not
hardcoded eligibility or captured bodies. All test bodies/reviews are fictional.

A new document body requires its own trusted exact-byte review. The implementation
therefore DOES NOT establish unattended eligibility of unseen upstream content.
No automated review authority is implemented or claimed. This is a real unresolved
prerequisite for fully automated paid monitoring, not a hidden manual fulfillment
promise. On uncertainty, refuse the whole document; redacting parts would violate
the complete-body contract. URL/owner/license-policy changes need fresh reviewed
configuration or a new version, never a permissive fallback.

## Custody and useful reports remain separate

The earlier two-complete-set option remains only a proposal: previous/current original
bodies and their authentic bindings, at most32KiB raw for this one document, atomic
winner selection and no reconstruction from previews. No body store, deletion role,
operational expiry, backup deletion guarantee or customer retention policy is selected
or implemented. The unapproved90-day earned-report proposal remains unselected.

Later authorized composition could compare two admitted snapshots, retain dates and
source/receipt identities, and provide bounded source-linked change evidence. It still
needs immutable custody, genuine two-period collection, fresh rights and licensed
attribution. A separate comparison contract must retain the frozen aggregate24word/source,
eight-quote/160character,64KiB new-material and90day history limits rather than imply
the frozen old validator admits these records. Profile relevance, required migration,
runtime compatibility and commercial value are not inferred here.

## Scope and checks

Only the new module, synthetic tests and this standalone document belong to this slice.
Shared handoff/package files overlap reserved PR30/33/35 and remain untouched. No full
monitored body, collector, external model/provider, native SQL/namespace, configuration,
schedule, storage, payment, price, merge or production action is part of this work.
V1 failed-corpus evidence and V2 corrected-repeat evidence remain frozen; neither is
relabeled a semantic impact classifier or real paid acceptance. Focused test, lint,
typecheck and exact draft Preview receipts accompany publication separately.
