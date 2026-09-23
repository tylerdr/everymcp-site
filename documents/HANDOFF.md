# EveryMCP release handoff — 2026-09-22

## Current session

- Fresh feature branch `feature/marketplace-listing-guides-20260922` starts at main SHA `ed202c69200a288015fcb01f8ec670b11581456c`.
- Existing MCP server directory, self-serve starter kit, and implementation/sponsor payment boundaries remain in place.
- The branch adds a source-aware `/marketplaces` directory and eight static guide routes for first-party directories, first-party connections, the official registry, and community destinations.

## Marketplace guide feature

- `lib/marketplaces.ts` stores typed destination kind, integration mode, audience, official source URLs, eligibility, review path, cost statement, unknowns, and checklists. Sources were checked on 2026-09-22.
- Core guides cover ChatGPT/OpenAI, Claude, Grok custom connectors, Grok Build's plugin marketplace, and Meta Muse. The longtail set covers the official MCP Registry, Smithery, and Glama.
- `app/marketplaces/page.tsx` provides category and integration-mode URL filters, source and date boundaries, and a clear future/closed notice. `app/marketplaces/[slug]/page.tsx` renders each checklist and receipt boundary.
- Header, footer, homepage, blog resources, and sitemap link to the new directory. No external directory submission, platform-term acceptance, paid service order, or fulfillment claim was performed.

## Validation and browser evidence

- `npm test` passed all existing contracts plus `MARKETPLACE_GUIDE_CONTRACT` (8 guides, 14 source URLs).
- `npm run lint` passed with no warnings or errors.
- `npx tsc --noEmit` passed.
- `npm run build` passed with network access for the existing Google Fonts fetch and generated 752 static pages, including `/marketplaces` and all eight guide routes.
- Local browser preview at `http://127.0.0.1:3001` visually checked the marketplace index, `?kind=first-party-connection` filter, Grok guide, and Meta Muse portal-gated guide. Screenshots are in `outputs/evidence/everymcp-marketplaces/` in the audit workspace.

## Release boundary and next step

- PR, independent review, normal merge, and production deployment are pending root review.
- Root should verify the PR diff and Vercel preview, then run post-merge production QA for `/marketplaces`, representative guide routes, filters, title/canonical output, and the closed-service copy.
- The Meta Muse portal remains login-gated and its protocol/auth requirements are explicitly open. Platform status is not represented as approval.
