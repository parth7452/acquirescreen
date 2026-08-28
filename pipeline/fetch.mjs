#!/usr/bin/env node
// Orchestrator: run all adapters, merge into data/listings.json.
// Owns dedupe, first_seen_at, and price_history — adapters just return listings.
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import manual from "./adapters/manual.mjs";
import flippa from "./adapters/flippa.mjs";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, "data", "listings.json");
const ADAPTERS = [manual, flippa];

const today = new Date().toISOString().slice(0, 10);

function validate(l, adapterName) {
  const required = ["id", "source", "name", "asking_price"];
  const missing = required.filter((k) => l[k] === undefined || l[k] === null);
  if (missing.length) {
    console.warn(`[${adapterName}] skipping listing missing ${missing.join(",")}:`, l.name ?? l.id);
    return false;
  }
  return true;
}

async function loadPrevious() {
  try {
    return JSON.parse(await readFile(OUT, "utf8"));
  } catch {
    return { listings: [] };
  }
}

const previous = await loadPrevious();
const prevById = new Map(previous.listings.map((l) => [l.id, l]));

let fresh = [];
const sourceCounts = {};
for (const adapter of ADAPTERS) {
  try {
    const listings = (await adapter.fetch()) ?? [];
    const valid = listings.filter((l) => validate(l, adapter.name));
    sourceCounts[adapter.name] = valid.length;
    fresh = fresh.concat(valid);
  } catch (err) {
    // One broken source must not take down the refresh.
    console.error(`[${adapter.name}] failed:`, err.message);
    sourceCounts[adapter.name] = `error: ${err.message}`;
  }
}

// Dedupe by id (first adapter wins), then carry over history from previous runs.
const seen = new Set();
const merged = [];
for (const l of fresh) {
  if (seen.has(l.id)) continue;
  seen.add(l.id);
  const prev = prevById.get(l.id);
  const first_seen_at = prev?.first_seen_at ?? today;
  let price_history = prev?.price_history ?? [];
  const last = price_history[price_history.length - 1];
  if (!last || last.price !== l.asking_price) {
    price_history = [...price_history, { date: today, price: l.asking_price }];
  }
  merged.push({ ...l, first_seen_at, price_history });
}

merged.sort((a, b) => (b.listed_at ?? "").localeCompare(a.listed_at ?? ""));

const out = {
  generated_at: new Date().toISOString(),
  sources: sourceCounts,
  listings: merged,
};
await writeFile(OUT, JSON.stringify(out, null, 2) + "\n");
console.log(`Wrote ${merged.length} listings to ${path.relative(ROOT, OUT)}`, sourceCounts);
