# Web retrieval worksheet campaign assets

Prepared October 28, 2026. Draft assets only: nothing sent, scheduled, submitted,
posted or purchased. These copies describe the branch implementation. Use only
after an owner approves and releases it; the production route still has the old
article until then. No audience size, traffic, customer result or sales claim.

## Positioning

Audience: a developer who has picked a web-data use case but has not decided
between retrieval, browser interaction and hosted extraction. This is inferred
from page intent, not an observed high-traffic cohort. The free value is an
editable decision record with a concrete synthetic fixture. The optional offer
is the existing $49 general MCP rollout packet, with its actual sample first.

## Newsletter block — ready copy

**Subject:** Before you connect a web-scraping MCP, test one page

A web-data workflow starts with an output, not a tool ranking. Do you need page
text, browser interaction or a hosted extraction service?

Our updated guide compares Fetch, Microsoft Playwright MCP and Firecrawl using
their own documentation. It includes a small synthetic example and a free
Markdown worksheet for expected fields, access boundaries and failure cases.
No signup is needed for the worksheet.

Read the guide and download it:
https://everymcp.com/blog/mcp-servers-for-web-scraping

If you need a general MCP selection and rollout packet, the guide also links to
EveryMCP's $49 starter-kit sample and current checkout availability. The kit's
worked client configuration uses Filesystem; it does not provide a configured
scraping integration or provider credits. Provider links contain no affiliate
tracking. EveryMCP sells the optional kit.

## Short social post — ready copy

Choosing a web-scraping MCP? Start with the output: page text, browser interaction,
or hosted extraction. We made a free worksheet with a synthetic fixture,
expected fields and failure cases. Publisher sources included; no signup.
https://everymcp.com/blog/mcp-servers-for-web-scraping

## Community answer — ready copy, for relevant permissioned contexts only

I work on EveryMCP. We put together a guide for choosing between plain retrieval,
browser interaction and hosted extraction, with links to Fetch, Microsoft
Playwright MCP and Firecrawl's own documentation. The useful part is the free
Markdown worksheet: define expected fields, remove one field, simulate a refusal
and record what actually happened. The example is synthetic; it is not a provider
benchmark. The guide also mentions our optional paid rollout packet, and the
provider links have no affiliate tracking.
https://everymcp.com/blog/mcp-servers-for-web-scraping

## Optional external-campaign URLs

These are attribution labels for a future authorized distribution, not receipts
that a campaign ran. Do not add these UTMs to internal guide-to-pricing links.

- Newsletter: https://everymcp.com/blog/mcp-servers-for-web-scraping?utm_source=everymcp_newsletter&utm_medium=email&utm_campaign=web_retrieval_worksheet_20261028
- Organic social: https://everymcp.com/blog/mcp-servers-for-web-scraping?utm_source=owned_social&utm_medium=social&utm_campaign=web_retrieval_worksheet_20261028

## Measurement contract and decision

Current receipt: [analytics-read.json](analytics-read.json). Vercel Web Analytics
is not enabled for the confirmed project; there is no observed denominator.
No telemetry configuration change is part of this lane.

The new client event is `web_retrieval_resource_clicked`, with only fixed
`article: web-scraping` and `resource: worksheet | offer | planner`. It carries no
session, URL, user-entered content or customer identifier. A worksheet click
means intent, not a completed download. An offer click means intent, not a paid
order. Browser tests can prove local invocation only. Telemetry errors cannot
block the links. The event does not enter checkout metadata; PR29 retains its
existing source/goal/listing contract. Do not claim sales attribution from this
event or divide unjoined purchases by these clicks.

Once separately authorized analytics are available, verify backend receipt and
exclude QA before starting a 14-day or 100-guide-visitor observation, whichever
comes later. Report the actual window, bot/QA exclusions and available visitor
semantics. If only event counts are available, report them as counts rather than
unique-person conversion. At least five offer-click events per 100 guide visits
is a provisional directional continue threshold, not statistical lift. Fewer
requires checking sample usefulness and instrument receipt before changing copy.
Paid conversion requires a separately verified purchase join and activated
checkout; PR29/PR30 retain ownership of those proofs.
