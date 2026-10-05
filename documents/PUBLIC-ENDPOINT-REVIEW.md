# Publisher endpoint proposal — pending parent approval

PR19's controlled fixture tooling is released as `a0320ef98efbc4df2478bb9180dab94da1f33024`. The matching READY production/domain deployment `dpl_8FMUnPpVURsMGDLPAkr5NCfZ6XbX` passed nine-route/canonical, 616-listing sitemap, original dated notes/references, free planner and commerce/provider regression readback at `2026-10-05T00:59:37Z`. [Release proof](public-discovery/pr19-production-release-2026-10-05.json) records that acceptance. Merging it did not authorize public MCP requests.

This next draft prepares one useful public declaration proof, with executable network safety checks and exact attribution. **No public MCP request has been made.** `LIVE_EXECUTION_ENABLED=False`, the manifest remains `pending_parent_review`, and `--run-reviewed` refuses before DNS or sockets. Parent review of the exact endpoint, code head/source hashes, plan hash, request methods and ceilings is the next gate. The proposed adapter is neither a general MCP client nor a conformance/security evaluator.

## Exact source relationships

[endpoint-review.json](public-discovery/endpoint-review.json) preserves all five priority route identities and the existing source references. It proposes only the endpoint explicitly named in the [RevenueCat publisher documentation, Access section](https://www.revenuecat.com/docs/tools/mcp): `https://mcp.revenuecat.ai/mcp`, port 443, literal path `/mcp`. Relationship: `revenuecat-mcp` slug / `revenuecat-mcp` legacy ID → publisher citation → documented endpoint. The publisher documents API v2 Bearer-key or account OAuth access; the observer uses neither. An anonymous 401 would be useful dated challenge evidence, with capabilities still unknown.

| Priority listing | Endpoint proposal | Evidence boundary |
| --- | --- | --- |
| RevenueCat | Exact URL above | Publisher-documented endpoint; protocol/version/auth behavior has not been observed |
| Redash | Unknown | [Reviewed separate community source](https://github.com/suthio/redash-mcp) documents localhost/self-hosting; example hostnames are not target authority |
| iCloud | Unknown | [Archived community source](https://github.com/robworks-code/icloud-drive-mcp) uses a signed-in local sync folder; no Apple-published endpoint was identified |
| Heap | Unknown | [Separate community source](https://github.com/rivit-studio/heap-mcp-server) documents localhost HTTP and missing built-in auth; no public publisher endpoint was identified |
| Hotjar | Unknown | [Contentsquare publisher page](https://contentsquare.com/platform/capabilities/mcp-server/) describes MCP but names no exact hosted endpoint; the [reviewed technical index](https://docs.contentsquare.com/llms.txt) adds no endpoint. Legacy-account compatibility remains unknown |

These are bounded source-review findings, not claims that no other endpoint exists. Community deployments and a successor publisher are never silently assigned to the old listing. The missing historical indexed sources remain separate dated observations. No URL is guessed or derived from a repository, API hostname, example, icon, schema, challenge or UI URI.

## Official protocol reconciliation

The official [`latest` specification](https://modelcontextprotocol.io/specification/latest) resolved directly to **2026-07-28** during this review. Its [discovery operation](https://modelcontextprotocol.io/specification/2026-07-28/server/discover), [per-request metadata](https://modelcontextprotocol.io/specification/2026-07-28/basic#meta) and [Streamable HTTP revision](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http) support the existing modern profile: POST `server/discover`, required request version/client-capability metadata, matching version and method headers, and no initialize/session/GET-stream. This observer explicitly refuses unsupported versions, interactions and private cache declarations instead of coercing an earlier-era response.

The separately selected **2025-11-25** profile retains [initialize/initialized lifecycle](https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle) and [optional session/version headers](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports). The legacy exact version must match before any list request. No discovered supported version changes the plan. The unavailable research ZIP is not an executable input. PR19's pinned official declaration schemas and stable Apps interpretation remain unchanged. The core normalizer has two narrow corrections: schema syntax inspection propagates deadline cancellation rather than swallowing `TimeoutError`, and decoded JSON rejects lone-surrogate keys/values before hashing/projection. Both have collected-receipt regressions.

## Review the exact request plan

[Committed canonical unexecuted plan](public-discovery/endpoint-proposal.json) contains every exact request template and source hash; CI requires byte-for-byte regeneration. `scripts/propose_public_discovery.py` prints canonical JSON with the exact request bodies, fixed headers, conditions, endpoint relationship, manifest SHA and hashes of every policy/normalization/transport source artifact. It accepts no URL, tool, credential or installation argument. Repeat its default run after any change; a plan hash changes with the source files.

1. Modern: `server/discover` ID 1; only after a valid selected-version response, `tools/list` ID 2 if tools are declared and `resources/list` ID 3 if resources are declared.
2. Legacy: separate `initialize` ID 1; require exact 2025-11-25, then `notifications/initialized`; require empty 202 acknowledgment, then `tools/list` ID 3 and `resources/list` ID 4 only for declared capabilities. An assigned valid legacy session value exists only in process memory and is sent only to the same fixed endpoint; it is never retained in a receipt.

Both profiles are explicitly included in the proposal, rather than inferred fallback. Auth/access/rate/redirect/transport/privacy refusal safety-skips remaining endpoint requests and profiles. A bounded HTTP or RPC rejection remains an attributable unknown; it can never establish a failed MCP or downgrade a score. Each list has one first page only. If `nextCursor` exists, keep individually cited observed declarations and an unknown complete count; never follow it. No tools/call, resources/read, prompts/get, auth metadata, registration, sampling/elicitation, subscriptions, icon/schema/UI fetch, Apps rendering or stdio exists in this adapter.

Fixed HTTP headers: Host `mcp.revenuecat.ai`; Content-Type JSON; Accept JSON and SSE; Accept-Encoding identity; Origin `https://everymcp.com`; identifying EveryMCP observer User-Agent. Modern version/method headers mirror the request. Legacy version headers apply after initialize; only the transient assigned session is additional. Bodies use empty relevant client capabilities and observer identity. No proxy, cookie, authorization, token, environment credential, custom CA or caller-controlled header is loaded. Unknown declarations and schema descriptions remain inert untrusted data.

## Executable ceilings and network review

| Limit | Proposed ceiling |
| --- | --- |
| Target authority | One compiled endpoint/host/path; manifest and current listing/source relationship must agree |
| Requests | At most 7 sequential POSTs; no retries, redirect following, reconnect/address fallback or cursor pages |
| Time | 8-second DNS/TCP/TLS/header/body/interpretation work budget; 60 seconds aggregate online collection; up to 250 ms cancellation cleanup; main-thread POSIX SIGALRM; at least one second between same-host attempts |
| Responses | 8 KiB headers, 64 KiB decoded body, 8 KiB framing per response; 573,447 aggregate wire bytes including possible one-byte limit-detection sentinels |
| Catalogs | One page and at most 40 items per list; incomplete totals remain unknown |
| Parser | Existing strict duplicate/nonfinite/depth/node/schema limits, exactly one matching JSON-RPC result; bounded finite SSE only |
| DNS/TLS | Fixed-host libc resolver in an owned subprocess killed/reaped at deadline; at most 8 answers; parent revalidates all literals and rejects the entire answer set if any is nonpublic/special/mapped/transition; use one checked literal socket address, original-host SNI and verified certificate, and compare TCP/TLS peer to that pin |
| Framing | Reject ambiguous/duplicate headers, CL/TE conflict, compression, partial/extra frames, chunk extensions/trailers and framing/body excess; close every connection |
| State/storage | No runtime cache/reuse. Private/no-store/Set-Cookie/modern-private-cache responses are not retained as public metadata. Approved outputs would be private content-addressed exclusive receipts under ignored operational storage; no catalog writes |

The direct transport intentionally ignores proxy environment configuration and refuses custom TLS trust/key-log environment configuration before DNS. This cloud environment has such a TLS override, so it will stop with `custom_tls_environment_refused` if later enabled here. During the owned production regression check, direct Python HTTPS also returned connection refused; the normal platform proxy path succeeded. **Direct pinned egress to RevenueCat has not been tested or authorized.** Do not remove the platform override, route through a proxy or weaken pinning/TLS to obtain a result. A compatible authorized execution environment is an execution prerequisite, not evidence against RevenueCat.

## Receipt meaning and acceptance

The candidate live-receipt version is separate from PR19's synthetic-only schema. It binds the exact source→endpoint→slug relationship, selected profile, observer UTC run/profile/attempt/completion times, fixed request hashes, checked DNS/TLS/peer trace, complete response header/body hashes, retained bounded complete bodies and JSON-pointer citations. Legacy session values and raw auth/cookie headers are never stored. Auth captures only bounded inert Bearer/metadata-URI hints with `followed=false` and `authenticationVerified=false`; auth/HTTP-error bodies are not parsed or retained, including any bytes prefetched into the bounded header buffer. `validate_receipt()` uses the same pure global state machine as the collector to rebuild both declarations and unknown outcomes. It rejects any request after a safety halt, contradictory summaries, reordered or missing planned methods, non-allowlisted stored headers, source body/hash mismatch, impossible header/body/framing counts and request/run/pace timing excess. Complete public semantic-error bodies are retained for reason replay; private bodies are suppressed with bounded boolean evidence. Observer UTC times are second precision; monotonic offsets enforce the work/cancellation bounds. Offline receipt replay/write is separate from the online collection budget. These hashes establish internal integrity, **not authenticated server origin**, publisher ownership or runtime/security success; trusted execution provenance and independent readback remain required before any public use.

Unsupported, refused, timed-out, truncated, private or partial data stays unknown with the concrete observer reason. Optional absence is `not_declared`. Every score/badge/applicability denominator remains null, runtime/security unknown, and publication review-required/ineligible. A 200 or declaration must never be described as protocol compliance, certification, working tools or universal anonymous access.

```bash
tmp/discovery/venv/bin/python scripts/propose_public_discovery.py
tmp/discovery/venv/bin/python -m unittest discover -s tests -p 'test_public_endpoint_review.py' -v
```

The PR-only fixture workflow runs these controlled tests and the unexecuted proposal, with the existing pinned validator and read-only permissions. It contains no public observe job, schedule, credentials, live flag, model provider or publication step. Independent exact-head risk review and parent review of the exact final plan precede any enablement or live run. Release review and scheduler proof remain separate.
