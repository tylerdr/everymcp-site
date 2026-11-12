# Actual catalog qualification — 2026-11-12

This is an **offline eligibility check**, not a public-source fetch or hosted monitoring result. The universe is all 616 distinct listing routes in `data/mcps.json`, all five curated rows in `data/listing-evidence.json`, and all 189,420 unordered pairs of distinct routes. Catalog IDs are not unique: both Neon routes remain separate slug selections even though they share an ID and URL.

The pinned canonical inventory digest is `77fb866960540c586bcc1b7203e42ccdb680be2eab43543d602d126a1ba85e20`. File SHA256s are `e00842c3b6446e28e6f9c09c6b16bc5032575eb3ca60e6cedcd250a5f686b347` (catalog) and `8c8a8cc88437b3d9b58811271c646a3d66e897fda7e4266fe6df4c6229ac4a54` (curated evidence). These inputs contain 585 canonical URLs and zero rejected URL inputs. No source URL or curated attribution was changed.

| Selection universe | Within unchanged capture limits | Outside limits |
| --- | ---: | ---: |
| One listing | 614 / 616 (99.7%) | 2 |
| Two distinct listings | 184,528 / 189,420 (97.4%) | 4,892 |

Pair rejection counts are disjoint: 3,065 exceed two unique URLs (some also span multiple hosts); another 1,827 use at most two URLs but multiple hosts. None lacks a canonical URL. Eligibility means the union of **all** selected references fits at most two URLs on one host. It does not mean that any URL is reachable, maintained, safe, compatible, or permitted by current robots rules. Duplicate route identities are not extra tools or revenue opportunities.

## Representative customer selections

| Requested selection | Canonical scope and outcome |
| --- | --- |
| `filesystem` | One GitHub source; eligible. |
| `filesystem` + `memory` | Two distinct paths under `github.com/modelcontextprotocol/servers/tree/main/src/`; eligible. |
| `filesystem` + `filesystem-mcp` | Both route relationships retained; one shared Filesystem URL, not two independent sources. |
| `neon-mcp` + `neon-mcp-server` | Both slug identities retained; one shared `https://github.com/neondatabase/mcp-server-neon` source. |
| `icloud-mcp` | Both `https://github.com/picklepilot/icloud-mcp` and the **separate** community reference `https://github.com/robworks-code/icloud-drive-mcp`; eligible. No identity replacement or renewed maintenance claim. |
| `redash-mcp` / `heap-mcp` individually | Each keeps its indexed repository plus its separate community reference; each uses two GitHub URLs and is eligible. |
| `cursor-mcp`, `coingecko`, `convex` individually | Each has one documentation URL on its own approved host; eligible. Pairing any with a GitHub-only listing is unsupported because it spans two hosts. |
| `icloud-mcp` + `memory` | Three unique GitHub URLs; rejected for `too_many_source_urls`. |
| `cursor-mcp` + `filesystem` | Two URLs on two hosts; rejected for `multiple_source_hosts`. |

Two single listings remain deliberately unsupported:

- **RevenueCat:** `https://github.com/revenuecat/revenuecat-mcp`, `https://www.revenuecat.com/docs/tools/mcp`, `https://www.revenuecat.com/docs/tools/mcp/setup` — three URLs, two hosts.
- **Hotjar:** `https://github.com/community/hotjar-mcp`, `https://contentsquare.com/hotjar/`, `https://contentsquare.com/platform/capabilities/mcp-server/` — three URLs, two hosts. The Contentsquare references do not establish legacy Hotjar compatibility.

Both receive `too_many_source_urls` and `multiple_source_hosts`. This is the declared capture boundary, not a normalization bug. Supporting them fully would require a separately reviewed multi-job coverage/aggregation design that retains every relationship and makes partial coverage visible; silently selecting only the publisher docs would change the monitored subject. This qualification implements neither that design nor broader limits.

## Bounded usability correction

Previously, all unsupported selections returned HTTP409 with “Watchlist changed; reload and review your selection,” even for a fresh, unchanged configuration. Reloading could never fix RevenueCat's three-reference scope. The actual configuration path now uses a pure server-inventory qualifier and returns HTTP422 with safe reason codes and source/host counts. Malformed client fields remain400; stale versions and conflicting mutation replays remain409. Exact successful mutation replay still precedes current-inventory resolution. Any rejected reference in a future inventory makes its selection unavailable rather than silently disappearing beside a valid reference.

No caller URL, ownership, paid flag or price confers authority. No source cap, DNS/transport allowlist, robots/cooldown, timeout, byte limit, receipt version or evidence interpretation changed. This is an unbound handler improvement, not an activated customer route.

## Acceptance boundary

The actual-catalog suite calls the same qualifier for every route/pair, then exercises representative actual handlers and adapters. Full 616-listing/585-source inventories are retained during synthetic Filesystem+Memory and iCloud journeys; only the selected two URLs receive fictional loopback observations. Unselected sources remain unchecked. Baseline, unchanged, changed and partial-response unknown states, stale catalog edits, same-original retry, cross-owner denial and public-key-only fresh-process recovery are checked. No public URL is fetched and the fixture content is explicitly fictional, even though source identities are real.

Source snapshots, test outcomes and original hashes are recorded in [the qualification receipt](evidence/monitoring-catalog-qualification-20261112.json). Native PostgreSQL, actual provider/Auth/payment acceptance, public robots/DNS/TLS, hosted collection, delivery and live performance remain unrun. The existing namespace failure and all activation holds are unchanged. The separate [90-day earned-original recovery proposal](MONITORING-RECOVERY-POLICY-ALTERNATIVE.md) is not selected or implemented.
