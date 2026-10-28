# Revenue sensitivity — assumptions, not a forecast

Observed guide traffic, provider clicks, paid conversion and revenue are unknown.
The actual [analytics reads](analytics-read.json) returned disabled analytics;
repository synthetic browser fixtures establish no demand or collected revenue.
The old article's title and buyer-oriented subject establish intent only. We
cannot rank this page by actual visits. Paid activation remains unproved.

## Starter-kit sensitivity

`gross = qualified guide visits × offer-click rate × click-to-paid rate × $49`.
All traffic and rates below are assumptions for a hypothetical month with working
payment and fulfillment. The $49 price is the existing source-defined offer.
Expected fractional orders are model averages, not partially completed purchases.

| Assumed guide visits | Assumed offer CTR | Assumed click → paid | Expected orders | Gross USD |
| ---: | ---: | ---: | ---: | ---: |
| 250 | 2% | 2% | 0.1 | 4.90 |
| 1,000 | 5% | 5% | 2.5 | 122.50 |
| 5,000 | 10% | 10% | 50 | 2,450.00 |

At $49, $10,000 gross requires 205 whole orders ($10,045). At assumed 5% offer
click-through and 5% purchase conversion, that is 82,000 qualified guide visits.
This is a scale requirement, not evidence the site can generate it. Taxes,
refunds, disputes, fees, payout delays and operating costs are excluded; gross
is not net collections, profit or MRR. PR30 owns actual revenue reconciliation.
With checkout unavailable, paid orders from this path cannot be projected by
these activated-case rates. This change does not open checkout.

## Conditional affiliate sensitivity

`first-month expected commission = visits × provider CTR × eligible-paid
conversion × eligible subscription spend × commission rate`.

Assume 1,000 visits, 5% provider CTR, 3% eligible-paid conversion, and $50 eligible
monthly spend. $50 is a math input, not a Firecrawl price quote. The result is
$11.25 at 15%, or $18.75 at 25%. The rates reflect the conflicting primary-source
program descriptions in [AFFILIATE-REVIEW.md](AFFILIATE-REVIEW.md), not a verified
contract. No lifetime value or recurring cohort forecast is inferred.

These examples additionally require accepted participation, a valid referral
link, qualifying non-Enterprise subscriptions, attribution and payable receipts.
The implemented page has ordinary links without affiliate tracking. These
scenarios therefore describe a future conditional path; they do not assign
current commissions to this page. Churn, refunds, ineligible purchases, lost
attribution and payout thresholds can reduce or delay proceeds.

Reproduce the numbers without network access:

```sh
node documents/monetization-2026-10-28/revenue-sensitivity.mjs
```

The checked output is [revenue-sensitivity.json](revenue-sensitivity.json). Its
null observed fields deliberately differ from zero. Do not sum the two channels
as an acquisition forecast without accounting for shared visitors and selection.
