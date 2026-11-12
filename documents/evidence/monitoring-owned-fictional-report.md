# Owned monitoring report

Policy: source-receipt-history-owned-service-v1.
As of: 2026-11-22T00:01:11.000Z.

EveryMCP service-recorded observations carry signer/credential-holder endorsement only. They do not establish truthful fetching, independent time, a particular build/platform, or MCP compatibility/security.

Period coverage: gaps; 3 available of 4 expected periods; 1 missing.
Missing periods are coverage gaps, not successful checks or evidence of unchanged content.

- Missing expected period ending 2026-11-08T00:00:11.000Z.

Canonical report context (bound by the enclosing receipt's report digest/signature):

```json
{"coverage":{"availablePeriods":3,"expectedPeriods":4,"missingPeriodEnds":["2026-11-08T00:00:11.000Z"],"state":"gaps"},"watchlistSha256":"6b382af1992a85d630ed5fa0fee4a8b983d7d1920cafeb4b9a6ea97c7d02be68"}
```

## Latest observation assessment

Each state describes only the latest recorded bounded static representation. Stale, missing or incomplete current evidence remains unknown. Bounded preview truncation does not erase complete section hashes. Scripts, styles, comments or declarations may be omitted; linked destinations and dynamic behavior are not assessed.

- [https://github\.com/example/mcp](<https://github.com/example/mcp>) — latest state: **unknown**. The latest observation is missing, inconclusive, incomplete or lacks a complete captured projection.
  Latest HTTP state: unknown; observation 2026-11-22T00:00:11.000Z; freshness current.
  Omitted material in the current static representation: none recorded.

## Source history comparison component

The comparison component below retains actual receipt/source hashes, observation dates, projection limits and balanced previews. A historical change does not replace the latest-state assessment or fill missing expected periods.
# Public source history

As of: 2026-11-22T00:01:11.000Z

Policy: source-receipt-history-service-v1.

EveryMCP service-recorded observations carry signer/credential-holder endorsement only. This does not establish truthful fetching, independent time, a particular build or platform provenance, or MCP compatibility/security. Hashes bind recorded bytes; service identifiers and signing keys do not independently verify the observations.

1 selected listings; 1 distinct source URLs; 3 distinct dated observations in 3 supplied receipts.
Latest evidence states: unknown: 1. Stale or unchecked sources: 0.

Review-required evidence. Receipt dates are observation dates, not proof that monitoring is running now. No automatic delivery or paid entitlement is established.
HTTP observations do not establish MCP compatibility, tool behavior, security or publisher identity. Missing-at-check means HTTP 404/410 at that time; unknown is inconclusive. Neither proves continuous downtime, outage duration or uptime. Raw source-body changes can include page chrome.
Unchanged or cached evidence is not a new check. Unresolved findings remain visible after recovery. Each citation identifies its service, signing key and evidence class. Synthetic fixtures contain fictional observations and identifiers. Receipt dates are service-reported dates.

## Latest captured change

Previews prioritize the newest complete changed projection: at most 12 quoted words before and 12 after per source. Older comparisons retain their dates and evidence below. These short previews may not contain the changed passage; operational impact remains unknown.

### [https://github\.com/example/mcp](<https://github.com/example/mcp>)

Latest observation: unknown at 2026-11-22T00:00:11.000Z; freshness current as of 2026-11-22T00:01:11.000Z.
Latest captured change: 2026-11-01T00:00:11.000Z → 2026-11-15T00:00:11.000Z; compared HTTP observations 2026-11-01T00:00:11.000Z → 2026-11-15T00:00:11.000Z.
This comparison predates the latest observation above; its scope remains the captured sections and dates shown.
- Section ` e50ea20e523b99228763d5ef540305db8397c36ad5efa3e574bd1d5e47c9f24e:1 `: changed.
  Before: EveryMCP service-recorded observation · evidence class ` synthetic-fixture ` (fictional observations, signer and identifiers) · origin ` everymcp-service-custody-v2 ` · service ` fictional-everymcp ` · key ` fictional-rfc8032-one ` · execution ` 7dfa8da2-d3b4-4016-ac72-115518c016d8 ` · ` /sources/0/observation/documentProjection/sections/1 ` · custody receipt ` 403c66237c5d201bf3d4d5d0158e1ba0440d824faba5529d321a76fe905a4c19 ` · source payload ` 2b7b1954a15abf42b0e5fa6ddca3b87db83da271091155ddfb4cbc3b1b10eaec ` · section SHA-256 `0db8c3ffde4a16d74daf7b429c8fd6c5ee61bd3d5aee010c8b67ddf76de72ab6`.
  Before heading preview: “Requirements”
  Before excerpt preview: “Node 18 required\.”
  After: EveryMCP service-recorded observation · evidence class ` synthetic-fixture ` (fictional observations, signer and identifiers) · origin ` everymcp-service-custody-v2 ` · service ` fictional-everymcp ` · key ` fictional-rfc8032-one ` · execution ` c388827c-cc6f-4963-85b1-576c0b51e89d ` · ` /sources/0/observation/documentProjection/sections/1 ` · custody receipt ` c944c114826628f624c74b51e44940cde196ef4a41d5e3faa8c5a6f2eb08a6b2 ` · source payload ` 1d9d667f6714d3d29e3f54944f94488299d21d0e7a20df232722064dd3c04c7d ` · section SHA-256 `27902d71d1bfdc27cb4618ef2be5635e6028e32941b84a56da9bd3d8dc45f9c3`.
  After heading preview: “Requirements”
  After excerpt preview: “Node 20 required\.”

## Fictional monitoring fixture (` example-mcp `)

- [https://github\.com/example/mcp](<https://github.com/example/mcp>) (indexed\_repository/unknown): unknown at 2026-11-22T00:00:11.000Z; HTTP 206 / partial\_or\_oversized\_body; freshness current; disposition checked\_this\_run.
  Evidence: EveryMCP service-recorded observation · evidence class ` synthetic-fixture ` (fictional observations, signer and identifiers) · origin ` everymcp-service-custody-v2 ` · service ` fictional-everymcp ` · key ` fictional-rfc8032-one ` · execution ` cabbddc8-8bf7-4fec-882f-3ca7ebd04836 ` · ` /sources/0 ` · custody receipt ` e0d7f791fbf350c287d6d41da599532f21a2136334030a9efe188bd9c562f233 ` · source payload ` 0d803aeafa0d3f562fa19ac2e1076ad6afe40cbb8f971f7366009718579af5c1 `.
  Last successful observation: 2026-11-15T00:00:11.000Z · complete-body SHA-256 `008e0ebfd456be9261796327a7ecc33ce25dd014a29b3758b00559146d0d4a88`.
  - Baseline observation at 2026-11-01T00:00:11.000Z (HTTP 200 / http\_success) · EveryMCP service-recorded observation · evidence class ` synthetic-fixture ` (fictional observations, signer and identifiers) · origin ` everymcp-service-custody-v2 ` · service ` fictional-everymcp ` · key ` fictional-rfc8032-one ` · execution ` 7dfa8da2-d3b4-4016-ac72-115518c016d8 ` · ` /sources/0/observation ` · custody receipt ` 403c66237c5d201bf3d4d5d0158e1ba0440d824faba5529d321a76fe905a4c19 ` · source payload ` 2b7b1954a15abf42b0e5fa6ddca3b87db83da271091155ddfb4cbc3b1b10eaec `.
  - Complete source bytes changed at 2026-11-15T00:00:11.000Z (HTTP 200 / http\_success) · EveryMCP service-recorded observation · evidence class ` synthetic-fixture ` (fictional observations, signer and identifiers) · origin ` everymcp-service-custody-v2 ` · service ` fictional-everymcp ` · key ` fictional-rfc8032-one ` · execution ` c388827c-cc6f-4963-85b1-576c0b51e89d ` · ` /sources/0/observation ` · custody receipt ` c944c114826628f624c74b51e44940cde196ef4a41d5e3faa8c5a6f2eb08a6b2 ` · source payload ` 1d9d667f6714d3d29e3f54944f94488299d21d0e7a20df232722064dd3c04c7d `.
    Compared with reachable at 2026-11-01T00:00:11.000Z: EveryMCP service-recorded observation · evidence class ` synthetic-fixture ` (fictional observations, signer and identifiers) · origin ` everymcp-service-custody-v2 ` · service ` fictional-everymcp ` · key ` fictional-rfc8032-one ` · execution ` 7dfa8da2-d3b4-4016-ac72-115518c016d8 ` · ` /sources/0/observation ` · custody receipt ` 403c66237c5d201bf3d4d5d0158e1ba0440d824faba5529d321a76fe905a4c19 ` · source payload ` 2b7b1954a15abf42b0e5fa6ddca3b87db83da271091155ddfb4cbc3b1b10eaec `.
    Complete-body SHA-256 `7ce0a3e879a7226c348478272fe0dc3657c8944572e36bf83c1c687877c66d33` → `008e0ebfd456be9261796327a7ecc33ce25dd014a29b3758b00559146d0d4a88`. Inspect the source and your pinned revision before changing an integration; semantic impact is unknown.
  - Inconclusive check at 2026-11-22T00:00:11.000Z (HTTP 206 / partial\_or\_oversized\_body) · EveryMCP service-recorded observation · evidence class ` synthetic-fixture ` (fictional observations, signer and identifiers) · origin ` everymcp-service-custody-v2 ` · service ` fictional-everymcp ` · key ` fictional-rfc8032-one ` · execution ` cabbddc8-8bf7-4fec-882f-3ca7ebd04836 ` · ` /sources/0/observation ` · custody receipt ` e0d7f791fbf350c287d6d41da599532f21a2136334030a9efe188bd9c562f233 ` · source payload ` 0d803aeafa0d3f562fa19ac2e1076ad6afe40cbb8f971f7366009718579af5c1 `.
    Compared with reachable at 2026-11-15T00:00:11.000Z: EveryMCP service-recorded observation · evidence class ` synthetic-fixture ` (fictional observations, signer and identifiers) · origin ` everymcp-service-custody-v2 ` · service ` fictional-everymcp ` · key ` fictional-rfc8032-one ` · execution ` c388827c-cc6f-4963-85b1-576c0b51e89d ` · ` /sources/0/observation ` · custody receipt ` c944c114826628f624c74b51e44940cde196ef4a41d5e3faa8c5a6f2eb08a6b2 ` · source payload ` 1d9d667f6714d3d29e3f54944f94488299d21d0e7a20df232722064dd3c04c7d `.
  - Review required: source\_body\_changed (2026-11-15T00:00:11.000Z to 2026-11-15T00:00:11.000Z).

## Captured document comparisons

Static source evidence, not a semantic or compatibility assessment. Sections include text and hashed attribute values/link destinations; scripts, styles and comments may be omitted. No linked destination is fetched.
Short excerpts are bounded previews, not necessarily the changed passage. Full-page text is not retained. Section matching uses heading identity/occurrence; renamed headings appear as removed/added. Section order or omitted-content categories can change without a matched-section change.
HTML tag/attribute names, attribute order and character-reference spelling normalize; text, numbers, commands, timestamps, attribute values and preformatted whitespace remain significant. Equal captured representation never establishes that all changes are incidental.

### [https://github\.com/example/mcp](<https://github.com/example/mcp>)

Current capture: incomplete (body_unavailable); source freshness as of 2026-11-22T00:01:11.000Z: current.
- Comparison of 2026-11-01T00:00:11.000Z → 2026-11-15T00:00:11.000Z: captured_representation_changed (bounded\_static\_projection\_only).
  Original body capture dates: 2026-11-01T00:00:11.000Z → 2026-11-15T00:00:11.000Z. Historical comparison only; current source state may differ.
  Review the identified sections against your pinned configuration; this report does not determine the operational effect.
  - Section ` e50ea20e523b99228763d5ef540305db8397c36ad5efa3e574bd1d5e47c9f24e:1 `: changed.
    Before: EveryMCP service-recorded observation · evidence class ` synthetic-fixture ` (fictional observations, signer and identifiers) · origin ` everymcp-service-custody-v2 ` · service ` fictional-everymcp ` · key ` fictional-rfc8032-one ` · execution ` 7dfa8da2-d3b4-4016-ac72-115518c016d8 ` · ` /sources/0/observation/documentProjection/sections/1 ` · custody receipt ` 403c66237c5d201bf3d4d5d0158e1ba0440d824faba5529d321a76fe905a4c19 ` · source payload ` 2b7b1954a15abf42b0e5fa6ddca3b87db83da271091155ddfb4cbc3b1b10eaec ` · section SHA-256 `0db8c3ffde4a16d74daf7b429c8fd6c5ee61bd3d5aee010c8b67ddf76de72ab6`.
    Before previews omitted here; the latest complete captured change receives the source quote budget above.
    After: EveryMCP service-recorded observation · evidence class ` synthetic-fixture ` (fictional observations, signer and identifiers) · origin ` everymcp-service-custody-v2 ` · service ` fictional-everymcp ` · key ` fictional-rfc8032-one ` · execution ` c388827c-cc6f-4963-85b1-576c0b51e89d ` · ` /sources/0/observation/documentProjection/sections/1 ` · custody receipt ` c944c114826628f624c74b51e44940cde196ef4a41d5e3faa8c5a6f2eb08a6b2 ` · source payload ` 1d9d667f6714d3d29e3f54944f94488299d21d0e7a20df232722064dd3c04c7d ` · section SHA-256 `27902d71d1bfdc27cb4618ef2be5635e6028e32941b84a56da9bd3d8dc45f9c3`.
    After previews omitted here; the latest complete captured change receives the source quote budget above.
