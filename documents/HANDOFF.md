# EveryMCP release handoff — 2026-09-22

## Current audit handoff

- EveryMCP source is based on production SHA `100a1296`; branch `fix/raster-og-favicon` carries the bounded social-asset fix.
- The existing `public/og-default.svg` remains the source artwork. `public/og-default.png` is a 1200x630 raster render, and `public/favicon.png` is a 64x64 crop of its existing teal mark.
- `app/layout.tsx` serves the PNG for Open Graph/Twitter and both favicon slots; Organization JSON-LD points to the same PNG.
- `scripts/verify-brand-assets.mjs` runs from both `npm test` and `npm run build`.
- `npm test`, `npm run lint`, and `npm run build` passed locally. The build used network access only to fetch the already configured Google Fonts.
- PR review and production deployment remain pending; no merge or deploy was performed in this lane.

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
