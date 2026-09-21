# Changelog

*Append-only, newest first. Never edit old entries.*

## 2026-09-20 — Add self-serve starter kit with verified Stripe delivery (Codex session)

**Branch:** `fix/selfserve-starter-kit-20260920` → PR pending
**Tyler's prompt:** Implement a primary or initial lower-ticket revenue path that sells and delivers without human intervention; manual email is only a fallback.

**Shipped:**
- `lib/products.ts`, `app/api/checkout/route.ts` — shared product catalog, $49 starter-kit session, product-version binding, and fail-closed manual plans.
- `lib/stripe-fulfillment.ts`, `app/checkout/success/page.tsx`, `app/api/fulfillment/starter-kit/route.ts` — server-side paid-session verification, explicit failure states, and retryable deterministic download.
- `lib/starter-kit.ts`, `components/FulfillmentDownload.tsx`, `components/CheckoutButton.tsx` — immediate Markdown deliverable and Vercel Analytics funnel events.
- `app/page.tsx`, `app/pricing/page.tsx`, `app/services/page.tsx`, `app/sponsor/page.tsx`, `app/sitemap.ts` — self-serve positioning, manual fulfillment boundaries, and indexable pricing/methodology routes.
- `scripts/verify-selfserve-checkout.mjs` — regression contract for payment verification and lead safety.

**Decisions:** Do not take payment for implementation or sponsorship until their fulfillment dependencies are configured. Use a Stripe Checkout Session as the entitlement proof for the static starter kit, avoiding invented storage or provider claims.
**Follow-up / tech debt created:** Run a labeled Stripe test-mode payment and receipt/download retry; configure production Stripe identity only if approved; separately verify Vercel Analytics event receipt and GSC sitemap submission.

---

## YYYY-MM-DD — [Brief description] (Claude Code / Codex session)

**Branch:** feature/name → merged to main (PR #N)
**Tyler's prompt:** "[verbatim or close paraphrase of the instruction that kicked this off]"

**Shipped:**
- `path/to/file.ts` — [what it does]
- `path/to/other.ts` — [what it does]

**Decisions:** ADR-001
**Follow-up / tech debt created:** [Any items added to BACKLOG.md]

---

2026-09-20: Replaced false-success lead capture with honest manual inquiry. Durable storage, operator notification and delivered-email proof remain open.
