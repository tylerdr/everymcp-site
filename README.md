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
Add these to `.env.local` (and Vercel project settings):

```bash
NEXT_PUBLIC_SITE_URL=https://everymcp.com
STRIPE_SECRET_KEY=sk_live_or_test_key
STRIPE_IMPLEMENTATION_PRICE_ID=price_xxx   # optional fallback uses $2,000 inline price
STRIPE_SPONSOR_PRICE_ID=price_xxx          # optional fallback uses $500 inline price
```

## Deploy to Vercel
```bash
vercel login
vercel --prod
```

Then in Vercel project settings, add and assign the `everymcp.com` domain.
