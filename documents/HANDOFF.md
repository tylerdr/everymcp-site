# EveryMCP handoff — 2026-10-07, checkout indexing draft

## Current work

- Fresh authorized origin main remains d9f2629914847608f7d6641490cd024659fbba06, production PR23. Existing open PR24 owns its separate production-evidence handoff; no checkout edits there. New branch fix/checkout-success-noindex prepares a draft PR only, no merge/release.
- Confirmed transactional indexing-policy gap: /checkout/success returns200 error text for a missing payment session but lacks noindex. Adds only robots index:false/follow:true to page metadata; canonical, force-dynamic rendering, payment verification, fulfillment, price/product and output copy remain unchanged. No Neon/redirect/sitemap change.
- Focused existing checkout verifier renders the actual page with five synthetic outcomes (missing, unavailable, invalid, not_paid, paid), checks verification arguments, error messages, gated encoded download URL and metadata. No Stripe client or network request. Existing six entitlement boundary cases pass. Lint/types pass; production build acceptance recorded before draft publication.

## Evidence and limits

- October7 original GSC emails confirm sitemap soft404/duplicate-without-user-canonical and sitewide404 categories, without samples/counts/crawl dates/traffic data. No authorized GSC sample connector/session available. The checkout URL is outside the sitemap: this draft is NOT an established fix for the sitemap alert. Affected URLs, Google-selected canonical and crawl dates remain needed before other corrections.
- Read-only production triage confirmed642 unique sitemap URLs/616 listing routes, bounded valid samples200/self-canonical, unknown listing404/noindex, HTTP and slash308, www apex canonical. Both Neon aliases preserved. Raw triage record remains /tmp/everymcp-gsc-triage/current-production.json; no private mail/customer content copied into repository.
- Earlier actual scheduled source run37250925389 at October5 01:18UTC succeeded, schema/hash-verified receipt3ddaa186. Separate October5 22:47slot remained unobserved through October6 00:23:30UTC; cause unknown. No schedule/dispatch changes or new source/MCP probes in this task.
- Unknown scores/badges/capabilities and publication/commerce/provider holds remain. Original one-use endpoint proof consumed; do not repeat it. Parent coordinates any future review/release. PR24 and this draft may need routine documentation reconciliation if merged in a different order.

## Identity and workspace

Repository-local author/committer: Tyler Dreher <tyler@sprinterconsulting.com>, existing authenticated tylerdr credentials. No identity/history/security changes elsewhere, direct main push, billing change or live payments. Prepared with OpenAI Codex assistance. Only owned tylerdr/everymcp-site changed. Mac venture STATUS unavailable; cloud VENTURE-STATUS.md records the handoff.
