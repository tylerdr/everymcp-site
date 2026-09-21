# EveryMCP paid-path hardening plan — 2026-09-21

## Objective

Keep the initial offer automated for a successful Stripe return while preventing an unbound or misleading production checkout. Bind the entitlement to the exact `$49` USD starter product/version, an explicitly configured Stripe mode/account, and a stable idempotency key. Improve transient failure handling and make the delivered kit a grounded selection/setup/rollout packet from the current EveryMCP catalog.

## Bounded work

1. Add shared product constants and strict Stripe configuration checks (`STRIPE_MODE`, `STRIPE_ACCOUNT_ID`, and key-prefix agreement).
2. Verify checkout session line item amount, currency, quantity, product metadata, version, and live/test mode before delivery.
3. Add client/server checkout idempotency and generic retry-safe provider errors.
4. Upgrade Next.js and the matching ESLint config to the patched 14.x release.
5. Generate a substantive starter kit from the repository’s grounded catalog data, including a selection matrix, worked filesystem configuration example, client template, validation checklist, and rollback record.
6. Render the paid CTA as closed unless the required Stripe configuration is present; describe delivery as a successful-return download until durable recovery infrastructure exists.
7. Run focused tests, lint/build/type checks where possible, inspect the hosted preview, and report exact external provider gaps. No real charge, new credential, storage provider, or broad SEO migration.

## Acceptance

- Unknown/misbound Stripe mode, account, product, price, version, currency, quantity, or unpaid session cannot unlock the artifact.
- A repeated checkout attempt reuses its Stripe idempotency key.
- Provider timeout/5xx responses are retryable and do not expose raw provider detail.
- The generated artifact contains grounded current catalog examples and truthful limits.
- Production CTA remains closed while the existing env lacks the new mode/account invariants.
- Canonical, sitemap, robots, performance, design, and future Sprinter compatibility remain bounded and unchanged unless an obvious issue is directly fixed.
