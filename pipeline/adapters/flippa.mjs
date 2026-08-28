// Flippa official listings API (https://developers.flippa.com).
// Inactive until FLIPPA_API_KEY is set — the orchestrator treats an empty
// result as "source contributed nothing", so this is safe to ship disabled.
const API = "https://api.flippa.com/v3/listings";

function toListing(item) {
  const a = item.attributes ?? item;
  const mrr = a.profit_per_month ?? a.revenue_per_month ?? null;
  return {
    id: `flippa:${item.id}`,
    source: "flippa",
    source_url: a.html_url ?? `https://flippa.com/${item.id}`,
    name: a.title ?? a.property_name ?? `Listing ${item.id}`,
    description: a.summary ?? "",
    category: a.industry ?? a.property_type ?? "Unknown",
    asking_price: a.current_price ?? a.buy_it_now_price ?? null,
    mrr,
    revenue_30d: a.revenue_per_month ?? null,
    profit_margin_pct:
      a.revenue_per_month && a.profit_per_month
        ? Math.round((a.profit_per_month / a.revenue_per_month) * 100)
        : null,
    growth_30d_pct: null,
    revenue_verified: Boolean(a.has_verified_revenue),
    founded_date: a.established_at ?? null,
    listed_at: (a.started_at ?? "").slice(0, 10) || null,
    offer_count: a.bid_count ?? null,
    previous_asking_price: null,
  };
}

export default {
  name: "flippa",
  async fetch() {
    const key = process.env.FLIPPA_API_KEY;
    if (!key) {
      console.log("[flippa] FLIPPA_API_KEY not set — skipping");
      return [];
    }
    const url = `${API}?filter[property_type]=saas,app&filter[sale_method]=classified&page[size]=100`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
    if (!res.ok) throw new Error(`Flippa API ${res.status}`);
    const body = await res.json();
    return (body.data ?? []).map(toListing).filter((l) => l.asking_price);
  },
};
