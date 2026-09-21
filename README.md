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

## Deploy to Vercel
```bash
vercel login
vercel --prod
```

Then in Vercel project settings, add and assign the `everymcp.com` domain.
