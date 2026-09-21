# Self serve starter kit plan — 2026-09-20

1. Add a small paid MCP Integration Starter Kit to the existing Stripe checkout configuration.
2. Verify checkout sessions server side with `session_id` and expose a deterministic, reusable download only after Stripe reports `payment_status=paid` for that product.
3. Keep implementation and sponsorship paths closed to payment until their human fulfillment dependencies are configured; route those offers to the existing manual inquiry fallback.
4. Add explicit success, missing-session, unpaid, invalid-session, and Stripe-unavailable states without logging visitor or payment payloads.
5. Run claim, lint, type, build, and focused HTTP checks, then update the session docs and report the exact provider and live-payment blockers.
