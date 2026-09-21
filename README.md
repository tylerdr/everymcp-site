# EveryMCP.com MVP

Production-ready Next.js App Router project for the EveryMCP directory MVP.

## Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS

## Features
- Homepage with hero, search, category grid, featured MCP servers, and implementation CTA
- `/directory` searchable and filterable MCP directory
- `/category/[slug]` category landing pages with SEO copy and related categories
- `/mcp/[slug]` individual MCP detail pages
- `/services` implementation service page with $2,000 package and lead form
- Reusable lead form posting to `/api/lead`
- SEO basics: metadata, `sitemap.xml`, and `robots.txt`

## Data
- MCP dataset in `data/mcps.json`
- 50 real MCP servers sourced from:
  - `github.com/modelcontextprotocol/servers`
  - `github.com/punkpeye/awesome-mcp-servers`

## Local Run
```bash
npm install
npm run dev
```

## Stripe Checkout Environment Variables
The self-serve MCP Integration Starter Kit uses one inline-price Stripe Checkout Session. Checkout stays closed until the secret key, explicit mode, and account identity are all configured consistently. Add the values to `.env.local` and the Vercel project settings:

```bash
NEXT_PUBLIC_SITE_URL=https://everymcp.com
STRIPE_SECRET_KEY=sk_test_... # or sk_live_..., matching STRIPE_MODE
STRIPE_MODE=test # or live
STRIPE_ACCOUNT_ID=acct_... # the account returned by the configured key
```

The app verifies the completed paid session, exact `$49` USD line item, quantity, product metadata, version, account, and live/test mode before unlocking the deterministic starter-kit download. Checkout uses a client-generated idempotency key so a retried request reuses the same Stripe session. The download is available after a successful return to the checkout page; durable recovery after a lost return requires a configured webhook and entitlement store, which are not part of this repository yet. Implementation and sponsor offers remain inquiry-only until their human fulfillment paths are configured.

## Lead capture environment variables
The public form posts to `/api/lead` and remains fail-closed until an approved existing storage/confirmation adapter is bound. Configure both values only when the adapter implements the `everymcp.lead.v1` contract: atomically store the opt-in record under the supplied `Idempotency-Key`, enqueue/accept the transactional confirmation, and return JSON with `confirmation_status` set to `accepted`, `queued`, or `sent`. The app never reports success without that confirmation state.

```bash
EVERYMCP_LEAD_STORAGE_URL=https://existing-approved-adapter.example/lead
EVERYMCP_LEAD_STORAGE_TOKEN=... # server-only; do not expose or log
```

The form sends name, email, request context, intent, consent, and the existing `/methodology` resource path to the adapter. Retries reuse a deterministic key derived from the normalized email and intent; no manual mailto fallback is presented. The current production environment does not contain these variables, so production lead capture remains explicitly unavailable until the owner supplies the existing provider binding.

## Deploy to Vercel
```bash
vercel login
vercel --prod
```

Then in Vercel project settings, add and assign the `everymcp.com` domain.
