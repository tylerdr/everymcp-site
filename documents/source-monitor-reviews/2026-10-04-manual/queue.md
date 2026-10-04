# Priority listing evidence review

As of: 2026-10-04T23:15:00Z · receipt generated: 2026-10-04T22:41:27Z

Receipt SHA-256: `2196cc1d41678e4ac23cda41751bfb5eceb6a2c114dc6a6a53ebda070c87d347`. [Collection run](https://github.com/tylerdr/everymcp-site/actions/runs/37240814694) · [Observe job / source logs](https://github.com/tylerdr/everymcp-site/actions/runs/37240814694/job/111549047496) · event: `workflow_dispatch` · head: `a3f2affc5a8e354428ecc66ed11c33ea1ec4dca8`.

This is an internal review queue. HTTP availability does not establish MCP behavior, publisher identity or capability conformance. Public catalog/evidence changes require a separate reviewed change; score, badge and applicability denominator remain null.

Freshness is calculated at the explicit as-of date using the existing UTC calendar-day cadence. An unknown attempt preserves the previous successful read and its date. Missing sources are dated HTTP observations; they are not failed MCP evaluations.

## [RevenueCat MCP](https://everymcp.com/mcp/revenuecat-mcp)

Stable identity: `revenuecat-mcp` / `revenuecat-mcp` · review required.

RevenueCat documents a cloud-hosted MCP server. Use its current publisher documentation rather than the previously indexed GitHub link.

| Source and relationship | Availability / status | Latest attempt | Last success | Freshness | Disposition |
| --- | --- | --- | --- | --- | --- |
| [https://github.com/revenuecat/revenuecat-mcp](https://github.com/RevenueCat/revenuecat-mcp) · indexed_repository · unknown | missing_at_check / 404 · http_missing_at_check | 2026-10-04T22:39:32Z | — | current | checked_this_run |
| [https://www.revenuecat.com/docs/tools/mcp](https://www.revenuecat.com/docs/tools/mcp) · separate_reference · publisher | reachable / 200 · http_success | 2026-10-04T22:39:37Z | 2026-10-04T22:39:37Z | current | checked_this_run |
| [https://www.revenuecat.com/docs/tools/mcp/setup](https://www.revenuecat.com/docs/tools/mcp/setup) · separate_reference · publisher | reachable / 200 · http_success | 2026-10-04T22:39:38Z | 2026-10-04T22:39:38Z | current | checked_this_run |

- [Previously indexed repository](https://github.com/RevenueCat/revenuecat-mcp): public note 2026-10-04T21:25:50Z (HTTP 404); receipt pointer `/sources/445`; comparison `same_observed_availability`.
  Review reasons: identity_and_capability_review_required, missing_at_check, newer_attempt_than_public_note, source_missing_at_check.
- [RevenueCat MCP documentation](https://www.revenuecat.com/docs/tools/mcp): public note 2026-10-04T21:25:50Z (HTTP 200); receipt pointer `/sources/583`; comparison `same_observed_availability`.
  Documents https://mcp.revenuecat.ai/mcp, subscription configuration, charts, and experiments. This is documentation evidence, not a connection or tool-execution test.
  Review reasons: identity_and_capability_review_required, newer_attempt_than_public_note.
- [RevenueCat MCP setup](https://www.revenuecat.com/docs/tools/mcp/setup): public note 2026-10-04T21:25:50Z (HTTP 200); receipt pointer `/sources/584`; comparison `same_observed_availability`.
  Documents OAuth where supported and API v2 secret-key authentication. Permissions depend on the account or key.
  Review reasons: identity_and_capability_review_required, newer_attempt_than_public_note.

## [Redash MCP](https://everymcp.com/mcp/redash-mcp)

Stable identity: `redash-mcp` / `redash-mcp` · review required.

The previously indexed repository could not be read at this check. Its publisher and capabilities remain unconfirmed. The implementation below is a separate community option, not a replacement identity.

| Source and relationship | Availability / status | Latest attempt | Last success | Freshness | Disposition |
| --- | --- | --- | --- | --- | --- |
| [https://github.com/redash/redash-mcp](https://github.com/redash/redash-mcp) · indexed_repository · unknown | missing_at_check / 404 · http_missing_at_check | 2026-10-04T22:39:31Z | — | current | checked_this_run |
| [https://github.com/suthio/redash-mcp](https://github.com/suthio/redash-mcp) · separate_reference · community | reachable / 200 · http_success | 2026-10-04T22:39:36Z | 2026-10-04T22:39:36Z | current | checked_this_run |

- [Previously indexed repository](https://github.com/redash/redash-mcp): public note 2026-10-04T21:25:50Z (HTTP 404); receipt pointer `/sources/435`; comparison `same_observed_availability`.
  Review reasons: identity_and_capability_review_required, missing_at_check, newer_attempt_than_public_note, source_missing_at_check.
- [suthio/redash-mcp — community option](https://github.com/suthio/redash-mcp): public note 2026-10-04T21:25:50Z (HTTP 200); receipt pointer `/sources/503`; comparison `same_observed_availability`.
  The creator documents query execution and dashboard access through the Redash API, with REDASH_URL and REDASH_API_KEY configuration. EveryMCP has not run these tools.
  Review reasons: identity_and_capability_review_required, newer_attempt_than_public_note.

## [iCloud MCP](https://everymcp.com/mcp/icloud-mcp)

Stable identity: `icloud-mcp` / `icloud-mcp` · review required.

The previously indexed repository could not be read at this check. Its publisher and claimed iCloud API, photo-library, and document-sync capabilities remain unconfirmed.

| Source and relationship | Availability / status | Latest attempt | Last success | Freshness | Disposition |
| --- | --- | --- | --- | --- | --- |
| [https://github.com/picklepilot/icloud-mcp](https://github.com/picklepilot/icloud-mcp) · indexed_repository · unknown | missing_at_check / 404 · http_missing_at_check | 2026-10-04T22:39:30Z | — | current | checked_this_run |
| [https://github.com/robworks-code/icloud-drive-mcp](https://github.com/robworks-code/icloud-drive-mcp) · separate_reference · community | reachable / 200 · http_success | 2026-10-04T22:39:35Z | 2026-10-04T22:39:35Z | current | checked_this_run |

- [Previously indexed repository](https://github.com/picklepilot/icloud-mcp): public note 2026-10-04T21:25:50Z (HTTP 404); receipt pointer `/sources/407`; comparison `same_observed_availability`.
  Review reasons: identity_and_capability_review_required, missing_at_check, newer_attempt_than_public_note, source_missing_at_check.
- [robworks-code/icloud-drive-mcp — community option](https://github.com/robworks-code/icloud-drive-mcp): public note 2026-10-04T21:25:51Z (HTTP 200); receipt pointer `/sources/450`; comparison `same_observed_availability`.
  Archived by its owner on October 2, 2026 and read-only at this check. This separate implementation uses the local iCloud Drive sync folder on macOS or Windows and documents file read, write, move, and delete tools. It is not an Apple-published server or evidence for the old listing; assess its maintenance status before use.
  Review reasons: identity_and_capability_review_required, newer_attempt_than_public_note.

## [Heap Analytics MCP Server](https://everymcp.com/mcp/heap-mcp)

Stable identity: `heap-mcp` / `heap-mcp` · review required.

The previously indexed repository could not be read at this check. Its publisher and analytics-query claims remain unconfirmed. The separate community option below has a different, write-oriented scope.

| Source and relationship | Availability / status | Latest attempt | Last success | Freshness | Disposition |
| --- | --- | --- | --- | --- | --- |
| [https://github.com/community/heap-mcp](https://github.com/community/heap-mcp) · indexed_repository · unknown | missing_at_check / 404 · http_missing_at_check | 2026-10-04T22:39:28Z | — | current | checked_this_run |
| [https://github.com/rivit-studio/heap-mcp-server](https://github.com/rivit-studio/heap-mcp-server) · separate_reference · community | reachable / 200 · http_success | 2026-10-04T22:39:33Z | 2026-10-04T22:39:33Z | current | checked_this_run |

- [Previously indexed repository](https://github.com/community/heap-mcp): public note 2026-10-04T21:25:50Z (HTTP 404); receipt pointer `/sources/121`; comparison `same_observed_availability`.
  Review reasons: identity_and_capability_review_required, missing_at_check, newer_attempt_than_public_note, source_missing_at_check.
- [rivit-studio/heap-mcp-server — community option](https://github.com/rivit-studio/heap-mcp-server): public note 2026-10-04T21:25:50Z (HTTP 200); receipt pointer `/sources/446`; comparison `same_observed_availability`.
  The creator documents events, profile/identity updates, and destructive user deletion. It explicitly excludes event/session queries, funnels, and retention reports. The maintainer says HTTP transport has no built-in authentication and must stay on localhost unless protected by additional controls; this is a community candidate, not a validated deployment.
  Review reasons: identity_and_capability_review_required, newer_attempt_than_public_note.

## [Hotjar MCP Server](https://everymcp.com/mcp/hotjar-mcp)

Stable identity: `hotjar-mcp` / `hotjar-mcp` · review required.

The previously indexed community repository could not be read at this check. Contentsquare documents the Hotjar transition and its own MCP integration; this does not establish compatibility with a legacy Hotjar account or verify the old community listing.

| Source and relationship | Availability / status | Latest attempt | Last success | Freshness | Disposition |
| --- | --- | --- | --- | --- | --- |
| [https://github.com/community/hotjar-mcp](https://github.com/community/hotjar-mcp) · indexed_repository · unknown | missing_at_check / 404 · http_missing_at_check | 2026-10-04T22:39:29Z | — | current | checked_this_run |
| [https://contentsquare.com/hotjar/](https://contentsquare.com/hotjar/) · separate_reference · publisher | reachable / 200 · http_success | 2026-10-04T22:39:26Z | 2026-10-04T22:39:26Z | current | checked_this_run |
| [https://contentsquare.com/platform/capabilities/mcp-server/](https://contentsquare.com/platform/capabilities/mcp-server/) · separate_reference · publisher | reachable / 200 · http_success | 2026-10-04T22:39:27Z | 2026-10-04T22:39:27Z | current | checked_this_run |

- [Previously indexed repository](https://github.com/community/hotjar-mcp): public note 2026-10-04T21:25:50Z (HTTP 404); receipt pointer `/sources/124`; comparison `same_observed_availability`.
  Review reasons: identity_and_capability_review_required, missing_at_check, newer_attempt_than_public_note, source_missing_at_check.
- [Hotjar transition — Contentsquare](https://contentsquare.com/hotjar/): public note 2026-10-04T21:25:50Z (HTTP 200); receipt pointer `/sources/0`; comparison `same_observed_availability`.
  Contentsquare explains that Hotjar is now Contentsquare and directs new users to Contentsquare.
  Review reasons: identity_and_capability_review_required, newer_attempt_than_public_note.
- [Contentsquare MCP documentation](https://contentsquare.com/platform/capabilities/mcp-server/): public note 2026-10-04T21:25:51Z (HTTP 200); receipt pointer `/sources/1`; comparison `same_observed_availability`.
  Documents access to Contentsquare insights from MCP-compatible AI tools. Account access, exact tool schemas, and legacy-account compatibility have not been tested here.
  Review reasons: identity_and_capability_review_required, newer_attempt_than_public_note.

Review exact source identity, curated notes, observation dates, last success and unresolved findings before proposing a public refresh. Keep community candidates separate, and retain the iCloud archive and Heap ingestion/deletion/localhost cautions unless new primary evidence justifies a reviewed correction.
