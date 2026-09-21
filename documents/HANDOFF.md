# EveryMCP release handoff — 2026-09-20

## Shipped on the release branch

- PR1 (`c77d92a`) corrected catalog provenance and added the methodology/install-risk boundary.
- PR2 (`2c979b9`) removed visitor PII logging and false lead success; lead placements are an explicit manual `mailto:` fallback and the obsolete endpoint returns `503` without reading the body.
- The follow-up self-serve branch adds a $49 MCP Integration Starter Kit. Stripe creates an inline-price Checkout Session with a product-version metadata binding and a `{CHECKOUT_SESSION_ID}` return URL. The success page and download route retrieve that session server side and unlock the deterministic Markdown kit only when `status=complete`, `payment_status=paid`, and `metadata.plan=starter` all match.
- Implementation and sponsor payments are closed to self-serve checkout until their human fulfillment dependencies are configured. Their pages state the manual inquiry boundary.

## Current proof and next step

- Local claim and self-serve contract checks pass. Full local lint/typecheck/build attempts were stopped after sustained Next/TypeScript process stalls under concurrent workspace load; Vercel exact-head checks are the release gate for the new PR.
- Production currently reflects merged PR1/PR2. The self-serve branch is not live until its PR is reviewed, merged, and deployed.
- No storage record is created for the starter kit; delivery is a static deterministic artifact gated by a Stripe session. No paid or sandbox card transaction was run. Stripe test/live key configuration and a no-charge sandbox receipt remain external validation gates.
- Vercel Analytics is loaded globally and checkout/download events are instrumented, but event receipt is not independently proven here. No GA4 measurement ID is configured in source. GSC property and sitemap submission remain root-owned.
