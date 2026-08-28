# AcquireScreen — operating instructions

Product: deal-flow screener for micro-acquirers (searchfunders, micro-PE,
first-time SaaS buyers). See README.md for architecture and schema.

## Rules any Claude session must follow here

1. **Compliance-first sourcing.** Never add a scraper for a source whose Terms
   prohibit it. TrustMRR's Terms prohibit scraping/harvesting and providing
   API-derived datasets to others — do not fetch or reconstruct their data,
   even for "seed" content. Flippa integration goes through their official
   API with a key. Check the ToS of any new source before writing an adapter,
   and record the verdict in README's source table.
2. **All data flows through `pipeline/fetch.mjs`.** Adapters return arrays of
   normalized listings (schema in README). The orchestrator owns dedupe,
   `first_seen_at`, and `price_history` — adapters never write files.
3. **Demo data stays clearly demo.** Fictional listings live in
   `data/manual/demo.json` with `"source": "demo"`; the dashboard shows a
   banner whenever demo listings are present. Never present demo listings as
   real deals.
4. **The dashboard stays static** (single `index.html` + `data/listings.json`
   sibling fetch) until there's a real reason for a backend. GitHub Pages
   serves it from `main` / root.
5. Keep computed screens (multiple bands, margin/growth flags) in one place in
   `index.html` (`computeFlags`) so the screening logic is auditable.

## Relationship to startup-outreach repo

Same owner (Parth). The origin story and market research for this product live
in `startup-outreach/research/5k-mrr-ideas-2026-08.md` and
`top-5-product-plays.md` (branch `claude/scale-5k-mrr-ideas-3zz96i`).
