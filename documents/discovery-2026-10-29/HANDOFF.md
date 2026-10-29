# Web retrieval discovery — 2026-10-29

## Verified starting point
Remote main and READY production were PR31 merge `6f65782485a57709fe274ff3b40038640a867c7c`, deployment `dpl_3YfvS7ks61YedttY2eXYY5kp7QMu`, canonical https://everymcp.com. This is the rollback candidate. Live verified-TLS GETs showed 642 sitemap URLs, no blog hub or reviewed guide, and no guide links from Browser Automation or Web Search & Research. Production pricing explicitly said checkout is temporarily closed.

Open commerce PR29 head `9d41a585dc714813974e5b652dee901c8de2c7d8` and reconciliation PR30 head `f26945c2148c66f941f517694d5dc316bcfc5398` were checked for overlap. Neither changes the two runtime files in this lane. No shared checkout, planner, pricing, catalog or root handoff edits.

## Change
Two relevant category pages now offer the existing reviewed guide and the complete free evaluation worksheet, using semantic links and the existing shadcn Button. The sitemap adds only the blog hub and reviewed guide with their actual Oct28 review date. All 642 existing URLs, including 616 listing URLs, are retained. Other categories retain their existing presentation.

The existing guide contains its own commercial disclosure and links to the actual starter-kit sample. This discovery change adds no affiliate IDs, provider claims, prices or payment availability claims. The worksheet is available without an account; paid checkout remains outside this lane.

## Validation and release gate
Full lint and standalone TypeScript passed. `local-receipt.json` records local Chromium checks: mobile/no overflow, both categories, JavaScript enabled/disabled, keyboard guide navigation and full worksheet download bytes, guide-to-pricing sample anchor, closed checkout, unrelated category, unique sitemap URLs/date/counts, no browser page errors. Production verified-TLS HTTP comparison proves the 642 previous sitemap URLs remain in the candidate. The local check script is retained as `verify-discovery.py`.

Vercel automatic preview/build must pass at the exact pushed head before normal merge; existing user authority permits reviewed Tai Durden release. No GitHub Actions dispatch or config changes. Post-release receipt must bind production deployment, SHA and canonical responses. No direct production browser acceptance is asserted: Oct28 Chromium rejected the environment certificate chain, and proxied rendering from that session is not direct acceptance. No bridge, replay, trust change or certificate bypass is used here.

## Measurement and next cash action
Oct29 Vercel pageview lookup returned HTTP400 `web_analytics_not_enabled` (request `iad1:cle1:iad1:sfo1::g4lmq-1793235319438-29e7d4e94f1d`). Traffic, guide clicks, conversion and cash are unknown; this work establishes discoverable paths, not indexing or traffic growth. Analytics was not enabled or reconfigured.

Hypothetical sensitivity only: 100/1,000/10,000 relevant category visits × 5% guide clicks × 10% offer clicks × 2% purchase conversion × $49 = $0.49/$4.90/$49 gross, before fees/refunds, **only after an active verified checkout**. Every factor is an assumption; none is observed traffic or collected cash. With the currently closed route, this funnel cannot collect new checkout revenue.

Next cash action belongs to the shared-commerce owner: resolve the approved Stripe binding and durable fulfillment/recovery prerequisites, obtain explicitly authorized sandbox evidence, then verify the enabled customer journey before accepting paid traffic. Distribution lane can measure guide intent only after authorized analytics is available. No external promotion or provider signup was performed.

## Backlog / status / changelog
- Completed: identify live discovery gap; add two category entry points and two sitemap entries; focused local/browser/link checks.
- Release: pending exact-head Vercel build, normal merge and production readback; see PR receipt for terminal outcome.
- Blocked measurement: Web Analytics disabled. Not zero traffic.
- Blocked cash proof: checkout closed; no payment was attempted or collected in this task.
- No change to product scope. Isolated session docs preserve the active commerce owners' shared root files.
