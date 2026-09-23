# Prompts Log

*Verbatim record of Tyler's instructions. Append-only, newest first. Do not edit or paraphrase existing entries.*

*Tyler's input is scarce and valuable. Exact words are preserved so scope never gets lost or misremembered.*

---

## YYYY-MM-DD HH:MM UTC — [brief topic]

**Tyler's exact words:**
> [paste verbatim]

**Context:** [Session branch / what was happening when this came in]
**Action taken:** [How the agent responded / what it built]
**Spec impact:** [Did this update SPEC.md? Which section?]

---

## 2026-09-22 UTC — Bounded brand asset audit

**Tyler's exact words:**
> Own exclusive visual/metadata asset audit and bounded fixes for buildownsell, everymcp, getfoundinchat, hireagentbuilders, portcoaudit, potentialpools, roofingreels, winemakeros. Audit homepage + representative real offer page: favicon/manifest, logos/brand consistency, OG/Twitter served image decode/dimensions/render, title/description/canonical/robots/sitemap, broken assets, image alt/performance. Fix actual high-value deficiencies via focused commits/tests and normal PRs; do not merge until review.

**Context:** Portfolio brand audit, EveryMCP lane, production source SHA `100a1296`.
**Action taken:** Converted the existing EveryMCP OG artwork to a 1200x630 PNG, derived a 64x64 favicon from its existing accent mark, updated metadata/JSON-LD, and added a binary asset contract.
**Spec impact:** No product scope change.

---

2026-09-20: User requests validation of all TaiDurden-listed sites, offers, revenue paths, email signups and forms; prioritize bounded fixes.

## 2026-09-22 UTC — EveryMCP marketplace and listing guides

**Coordinator instruction:**
> Retain the MCP server directory and add a directory of relevant marketplaces/platforms plus official source-backed listing guides/checklists for ChatGPT, Claude, Meta Muse, Grok and longtail. Make any done-for-you listing service clearly future/closed with no orders or fulfillment claims. Use verified official sources, distinguish community directory vs first-party app store vs registry and local plugin vs hosted MCP, and do not perform external directory submissions, legal acceptance, or new spend.

**Context:** Fresh `tylerdr/everymcp-site` main clone at `ed202c69200a288015fcb01f8ec670b11581456c`; feature lane `work/everymcp-marketplace-guides`.
**Action taken:** Implementing a bounded, source-aware marketplace guide directory while preserving the existing MCP server directory and checkout boundary.
**Spec impact:** Adds a planned marketplace and official listing-guide feature; fulfillment remains closed.
