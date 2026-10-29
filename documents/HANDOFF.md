# EveryMCP handoff — 2026-10-29

Branch `fix/lead-outcome-uncertainty-20261029` starts at current production/main f181b0fc450ba4ef7bd24b86c27ff1b255521c9d. It fixes false certainty after a lead-provider timeout/transient/lost response: API503 `saved: null`, honest same-details retry guidance, and a free methodology link from form errors. Missing configuration remains explicitly unavailable with no provider call. Existing success confirmation contract is unchanged.

Fourteen real adapter/route tests use a synthetic provider, including saved-then-lost response followed by duplicate confirmation with the same key. Full43-test suite, all build contracts, lint, standalone tsc and 753-page build pass. Actual local form failure retains entered details and allows the methodology link to open. Parent independently reviewed core source. Draft PR/cloud build evidence belongs in the PR; no merge or promotion authorized in this sprint.

The key remains normalized email plus intent. Different inquiries with the same email/intent share that key, and same-details retry is guidance rather than enforced client state. No exactly-once guarantee. Provider retention/atomicity/confirmation acceptance still requires a real hosted receipt; production metadata has no EVERYMCP_LEAD_STORAGE_URL or TOKEN. No credentials or provider binding were changed.

Commerce PR29 (`feature/durable-starter-recovery`, head9d41a585dc714813974e5b652dee901c8de2c7d8) remains owned separately; this branch does not edit its checkout, fulfillment, recovery or auth code. Checkout remains closed. Prior durable DB/Auth/private storage/test-mode acceptance blockers still apply. SpecSprint/Peaked and other portfolio offers are outside this branch. No customers contacted, payment, revenue or live provider capture established.

The AGENTS.md legacy venture STATUS path is absent on this host. A current repository-local status is saved in documents/VENTURE-STATUS.md rather than creating a second venture workspace.

Local browser follow-up also passed against a synthetic loopback provider: first POST retained the key and destroyed its response socket; the actual form showed unknown outcome with the free resource link; retrying unchanged details returned409/queued and rendered confirmation. This proves the local transport/UI contract only, not real provider persistence or email delivery. Both local servers were stopped afterward.
