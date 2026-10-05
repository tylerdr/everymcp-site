# Public discovery declaration contract — v1, draft

This slice defines evidence a listing page could later explain: a server's declared identity and capabilities, observed tool names and schemas, public auth challenge hints, and Apps references. It executes only owned synthetic HTTP fixtures. It does not inspect a directory server or change a public listing. A declaration describes what a server says; it does not establish functionality, security, publisher identity or compatibility with a buyer's environment.

## Deliverables and provenance

- [Profiles and exact clause references](public-discovery/profiles.json), [receipt schema](public-discovery/evidence.schema.json), and [pinned source provenance](public-discovery/spec-provenance.json).
- `scripts/discovery_contract.py` performs offline declaration normalization. `scripts/run_discovery_fixtures.py` creates its own loopback HTTP listener and runs the selected profile against it. No endpoint URL, credential, client registration, command/install, live flag, MCP SDK, paid/model dependency or gateway is accepted.
- Two small protocol declaration schemas are derived from actual official JSON artifacts at commit `75db1e987cbbba6d170315dc99d0dfc440754aef`. Their local transitive definition closures are pinned by SHA-256; schema metadata descriptions/examples/comments were removed while every name inside property/definition maps is preserved, with original licensing included. These are official message-shape inputs, not a reused private/shared runtime. Hashes check integrity, not origin authentication on their own.
- Apps interpretation is pinned separately to stable `2026-01-26`, ext-apps commit `82221c0c8ce7661efa6771c9d461511b1650495f`. Draft Apps/runtime code was not adopted.
- Library resolves the requested research ZIP as version 0 and 33,036 bytes. Its prescribed helper failed twice; the ZIP has no readable Library text. The archive SHA and its eight files were **not revalidated or read in this cloud slice**. Previous parent/Mac review does not turn that unavailable archive into executable policy. `readyForExecutableUse=false`; no packed shared contract is available or reused.

## Profiles remain separate

| Property | MCP 2026-07-28 / Streamable HTTP | MCP 2025-11-25 / Streamable HTTP |
| --- | --- | --- |
| First declaration request | `server/discover` | `initialize`, then `notifications/initialized` |
| Version/capabilities | Required per-request `_meta`; empty relevant client capabilities, client identity included | Initialization version/capabilities; require exact selected legacy version |
| HTTP request headers | Version and `Mcp-Method` mirror each body; JSON and SSE accepted | Version on subsequent requests; optional assigned session on subsequent requests |
| Session | Never requested/carried; unexpected assignment is unknown/incompatible with this observer | Optional synthetic session lives in memory; receipt records assignment boolean only |
| Catalogs | `tools/list`, `resources/list`, only for declared capabilities | Same list-only methods after initialized acknowledgment |
| Cache declarations | Current `ttlMs`, `cacheScope` shape required; captured without reuse | No modern cache requirements inferred |
| Fallback | None; errors remain attributable unknowns | None; a different negotiated version is unsupported by this explicit profile |

The current [discovery specification](https://modelcontextprotocol.io/specification/2026-07-28/server/discover) and [per-request metadata](https://modelcontextprotocol.io/specification/2026-07-28/basic#meta) differ from the [legacy lifecycle](https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle). This is a bounded observer, not a general client or conformance suite. Current result fields are required conservatively; absent `resultType` in a modern-selected receipt is unknown rather than silently coerced using legacy defaults. Other versions, stdio and deprecated HTTP+SSE are explicit unsupported states with zero requests. HTTP 404, timeout, missing method, denied auth or scanner refusal cannot identify a failed MCP implementation.

## Evidence semantics and future display

Receipts contain a simulated UTC fixture clock, explicit `observedAtBasis=fixture_clock`, fixture ID and canonical case SHA, selected version/transport/actor, ordered request and complete-response hashes, JSON pointers and separate declaration states. Partial payload hashes are never presented as complete response hashes. Fixture receipts are synthetic examples, never live check dates. The shape rejects assigning a fixture to a catalog listing; `listingRelationship=null` is mandatory here.

| Evidence | Useful future statement after endpoint relationship and publication review | What stays unknown |
| --- | --- | --- |
| Discovery | “This endpoint declared these capabilities and this software name/version at this check.” | Publisher ownership; working integrations; security |
| Tool list | Names/descriptions and optional annotations, with per-page hashes/pointers | Tool execution/results; truth of read-only/safety hints |
| Schemas | Original bounded schema, dialect, canonical hash and syntax state | Instance/semantic conformance; unsupported dialects or unresolved references; `x-mcp-header` behavior |
| Partial list | Observed declarations remain separately attributable | Complete count; any unobserved page or item |
| Auth | “These requests encountered this Bearer challenge / metadata URI.” | Valid credentials, scopes, client registration, protected-resource metadata, universal anonymous access |
| Apps | Advertised UI extension settings, tool `ui.resourceUri`/explicit visibility, listed UI resource URI/MIME | Extension negotiation, fetched HTML, rendering, CSP, permissions, Apps execution/security |

`declared` means a final bounded response matches the selected declaration shape. Optional capability absence is `not_declared`, with no failure claim. Incomplete/unsupported/blocked data is `unknown` with a precise observer reason and no complete count. Earlier observed items remain in their own declaration arrays when a later page fails. A UI tool reference is separate from advertised extension support. No implied Apps default visibility or inferred security behavior is filled in.

Descriptions, identity and annotations are unverified plain data. Consumers must escape text, avoid executing or obeying embedded prose, and never auto-fetch icons, schemas, auth metadata, UI URIs or links. Schema inspection only supports bounded 2020-12 syntax. It never validates tool arguments/results or resolves remote references. Captured private cache hints do not confer publication eligibility. All runtime/security assessments remain unknown; score, badge and applicable denominator remain null. Every receipt is review-required and ineligible for publication.

Before a real receipt can be attached to a page, a separately reviewed contract revision must bind the exact listing slug, preserved legacy ID, exact endpoint URL/path, cited publisher/community source, relationship role and relationship review timestamp. Legacy ID alone is insufficient because the two Neon slugs share an ID. A repository/reference URL is not an MCP endpoint; no endpoint is guessed from names or source 200s. Saved receipts are independently checked against the actual committed source case: canonical case/request/body hashes, selected profile/method/status, existing result pointers, exact declaration projections, schema hashes, cache/auth hints, response transport refusals and complete coverage of every observed catalog page/item. The fixture acceptance test also verifies committed replay SHA and examples byte-for-value. This validation authenticates neither a live server nor a publisher. V1 deliberately permits only synthetic attribution. The existing source-monitor relationships and public notes remain authoritative for their separate dated HTTP observations.

## Boundaries and gates before any live probe

The current implementation binds `127.0.0.1` on an OS-selected port and connects only to the listener it owns. It uses a literal IPv4 socket with no resolver/proxy/environment auth. Only POST to `/mcp` is possible. It never follows a redirect, auth hint, schema reference, icon or UI resource. It never launches stdio, reads credentials, executes tools or services server-initiated requests. JSON/SSE peer requests and `input_required` results remain unknown. SSE notifications are ignored and included only in the complete body hash.

Current ceilings: 8,192 status/header bytes, 65,536 body bytes, 24 JSON depth, 4,096 nodes, 16,384 bytes per retained schema, 40 items per catalogue, three pages per catalogue, eight sequential requests, one-second complete request deadline and eight-second run deadline. Oversized headers/bodies, compressed bodies, duplicate JSON keys, non-finite numbers, wrong/ambiguous IDs, incomplete SSE, repeated cursors, duplicate catalog identities and page/item exhaustion remain unknown. SIGALRM bounds the entire header/body request against trickle reads; the runner is explicitly main-thread/POSIX only. This does not claim all production network risks have been implemented or reviewed.

| Live-probe gate | Current state | Required separate acceptance |
| --- | --- | --- |
| Endpoint authority and SSRF | No public endpoint path exists | Reviewed listing→source→endpoint allowlist, exact HTTPS origin/path; reject userinfo, unsafe ports/schemes, private/link-local/multicast/reserved/encoded hosts |
| DNS rebinding / TLS | DNS is unused by the owned fixture connection | Validate all answers as public, pin selected address through connect, validate original-host TLS/SNI/certificate, verify peer, never re-resolve/reconnect implicitly |
| Redirects / derived URLs | All redirects refused; links remain inert | Keep refusal; auth metadata, UI/schema/icon references cannot enlarge target authority |
| Size / time / streaming | Local adversarial ceilings tested | Review production TLS/headers/chunking/compression/SSE parsing, whole-operation deadline, aggregate requests, bytes, hosts and concurrency; no retry/fallback budget expansion |
| Auth / side effects | No auth/client registration/tools/resources content | Anonymous public declarations only, source authority/policy review, no cookie/token/env/registration; reject interaction requests |
| Cache / attribution | Disabled; hints only | Explicit endpoint+profile+auth context+request+page key, bounded storage/TTL, public/private partition, expiry unknowns, immutable authenticated receipts; no private body reuse/publication |
| Publication / scoring | Disabled, null assessments | Independent risk and exact-head acceptance; separate reviewed facts/display proposal; versioned executable grading policy before any score or badge |

No live probing is authorized by passing these local fixtures or merging this tooling. Source-monitor collection/pacing/robots/cache/workflow behavior is untouched. This draft must remain unreleased until its risk and acceptance review; scheduled source-run proof remains a separate task.

## Reproduce and accept

Use the existing pinned validator environment; no new dependencies:

```bash
python3 -m venv tmp/discovery/venv
tmp/discovery/venv/bin/python -m pip install --disable-pip-version-check -r scripts/requirements-source-monitor.txt
mkdir -p tmp/source-monitor
tmp/discovery/venv/bin/python -m unittest discover -s tests -p 'test_public_discovery.py' -v
tmp/discovery/venv/bin/python -m unittest discover -s tests -p 'test_source_monitor.py' -v
tmp/discovery/venv/bin/python -m unittest discover -s tests -p 'test_source_receipt_import.py' -v
tmp/discovery/venv/bin/python scripts/run_discovery_fixtures.py > tmp/discovery/local-receipt.json
tmp/discovery/venv/bin/python scripts/monitor_sources.py --dry-run
```

The known importer symlink fixture requires `tmp/source-monitor` to exist; creating that ignored test directory changes no collector code. The new PR-only fixture workflow runs these checks with read-only permissions and no scheduled/observe job. Its output stays under ignored `tmp/discovery`; it neither restores a runtime cache nor writes catalog evidence.

Draft acceptance: separate profile happy paths plus adversarial/unknown fixtures; independent source-artifact and receipt checks; all source regression tests; npm tests/lint/typecheck/build; exact-head hosted fixture CI and READY preview. This establishes the bounded tooling only. A later release requires the reviewed exact commit and a matching READY production/domain deployment, unchanged five priority listings and original notes/canonicals, nine commerce/free-utility routes, 616 listing sitemap URLs and existing provider/payment holds. No new live MCP check, capability badge or scheduler-success claim may be published with that release.
