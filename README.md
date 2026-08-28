# AcquireScreen

Deal-flow screener for micro-acquirers. Aggregates SaaS/startup acquisition
listings into one normalized dashboard with IB-grade screens: valuation
multiples, margin and growth flags, price-cut detection, and a quick-diligence
memo per listing.

**Buyer:** searchfunders, micro-PE, and first-time SaaS acquirers who currently
refresh multiple marketplace tabs by hand.

## How it works

```
pipeline/fetch.mjs          orchestrator: runs adapters, merges, dedupes,
                            computes derived metrics, tracks price history
pipeline/adapters/*.mjs     one adapter per listing source
data/listings.json          normalized output the dashboard reads
index.html                  static dashboard (GitHub Pages friendly)
.github/workflows/refresh.yml  daily scheduled refresh
```

The dashboard is a single static page — deployable on GitHub Pages (Settings →
Pages → Deploy from a branch → `main` / root), Vercel, or anywhere. It reads
`data/listings.json` as a sibling path, so keep the two together.

## Data sources & compliance

Sourcing is **adapter-based and compliance-first**. Marketplace terms differ,
and several explicitly prohibit scraping:

| Source | Status | Notes |
|---|---|---|
| Demo dataset | ✅ shipped | Fictional listings (`data/manual/demo.json`) so the product works out of the box. Clearly flagged in the UI. |
| Manual entry | ✅ shipped | Drop normalized JSON files into `data/manual/` — e.g. deals sourced directly or shared by brokers. |
| Flippa | 🔑 adapter ready | Uses Flippa's official listings API; set `FLIPPA_API_KEY` (free from Flippa) and it activates. |
| TrustMRR | ⛔ blocked on permission | Their Terms prohibit scraping and redistribution of API-derived data. Do **not** add a scraper. Path: official API/partnership with written permission. |
| Acquire.com | ⛔ not implemented | Requires login; review ToS before any integration. |

Run locally:

```bash
node pipeline/fetch.mjs        # refresh data/listings.json
python3 -m http.server 8080    # then open http://localhost:8080
```

## Normalized listing schema

```jsonc
{
  "id": "source:slug",
  "source": "demo | manual | flippa | ...",
  "source_url": "https://...",
  "name": "...",
  "description": "...",
  "category": "...",
  "asking_price": 50000,          // USD
  "mrr": 1200,                    // USD/mo
  "revenue_30d": 1350,            // trailing 30d gross revenue
  "profit_margin_pct": 82,        // 0-100 or null
  "growth_30d_pct": -3,           // or null
  "revenue_verified": true,       // payment-provider verified vs self-reported
  "founded_date": "2024-06-01",   // or null
  "listed_at": "2026-08-10",
  "offer_count": 4,               // or null
  "previous_asking_price": 60000, // or null — non-null means a price cut
  "first_seen_at": "2026-08-28",  // set by pipeline
  "price_history": [{"date": "2026-08-28", "price": 50000}]
}
```

Derived at read time (dashboard): ARR multiple (`asking_price / (mrr*12)`),
screen flags (rich/fair/cheap multiple, thin margin, negative growth, young
product, price cut / motivated seller, unverified revenue).

## Roadmap

- [ ] Flippa API key + first live source
- [ ] Email/Slack alerts on saved-screen matches (the paid feature)
- [ ] Category median multiples from accumulated history
- [ ] Auth + Stripe (Lemon Squeezy) for subscriptions
- [ ] TrustMRR partnership conversation
