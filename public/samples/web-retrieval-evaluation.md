# Web retrieval evaluation worksheet

EveryMCP • October 28, 2026 • Free, editable example

Guide: https://everymcp.com/blog/mcp-servers-for-web-scraping

This is a proposed evaluation, not a provider benchmark or a completed test.
All observed results start as NOT RUN. Replace the example with your own
authorized use case. Do not put credentials or customer data in this record.

## 1. Worked example

Goal: read an approved product page and return its title, plan name and update
date with the source URL. Start with this synthetic content on a test page you
control; select a URL your client is authorized to access.

```html
<main>
  <h1>Widget A</h1>
  <p>Plan: Example</p>
  <p>Updated: 2026-10-01</p>
</main>
```

Expected fields: title = Widget A; plan = Example; updated = 2026-10-01;
source = the exact approved fixture URL. Missing fields stay missing.

Proposed boundary: one approved URL, no login, no writes, one attempt,
30-second timeout. These are exercise requirements, not claims about a
provider's defaults. Verify enforcement in your own client and network.

Decision hypothesis: try retrieval if the fields are in the initial HTML.
Evaluate a browser if interaction is required. Evaluate hosted extraction
only after confirming the tool, data destination, usage and cost limit.

## 2. Your decision record

- Workflow owner:
- Expected output and source attribution:
- Candidate / maintainer source URL:
- Pinned version or commit / client version:
- Approved fixture URL and real-site scope:
- Allowed tools / disallowed actions:
- Network and data destinations:
- Credential scope (none for this example):
- Approved usage and monetary limit:
- Timeout / maximum attempts:
- Where limits are enforced and how verified:
- Logs retained / deletion date:
- Rollback owner and disable action:

## 3. Evidence to collect

| Case | Expected behavior | Actual evidence |
| --- | --- | --- |
| Happy path | Exact fields and approved source URL | NOT RUN |
| Date removed | Missing date reported; no invented value | NOT RUN |
| 403 fixture | Refusal reported; no credential escalation | NOT RUN |
| Timeout fixture | Bounded failure; no silent retry loop | NOT RUN |
| Unapproved destination | Client/network boundary rejects access | NOT RUN |
| Disable action | Connection can no longer execute | NOT RUN |

- Test timestamp:
- Commands / synthetic input:
- Sanitized output location:
- Elapsed time / usage / observed cost:
- Differences from expected output:
- Remaining unknowns:
- Reviewer / decision (continue, change approach, stop):

## 4. Continue when the evidence supports it

Use only real pages you are authorized to access. A public source document is
not a runtime test or an independent security assessment. Re-evaluate when the
provider, version, data access or tool permissions change.

Maintainer references reviewed for the guide:
- Fetch: https://github.com/modelcontextprotocol/servers/tree/main/src/fetch
- Microsoft Playwright MCP: https://github.com/microsoft/playwright-mcp
- Firecrawl MCP: https://docs.firecrawl.dev/mcp-server

These are ordinary source links without affiliate tracking. EveryMCP sells an
optional general MCP Integration Starter Kit with a catalog selection matrix,
worked Filesystem client example and permission/rollout records. It does not
include provider credits, a configured scraping integration or managed setup.
See the actual sample, price and current availability:
https://everymcp.com/pricing#kit-preview
