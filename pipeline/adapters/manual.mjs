// Manual/local listings: every *.json in data/manual/ is either a normalized
// listing array or an object with a "listings" array. Includes the demo set.
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const DIR = path.join(path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url)))), "data", "manual");

export default {
  name: "manual",
  async fetch() {
    let files;
    try {
      files = (await readdir(DIR)).filter((f) => f.endsWith(".json"));
    } catch {
      return [];
    }
    const all = [];
    for (const f of files) {
      const parsed = JSON.parse(await readFile(path.join(DIR, f), "utf8"));
      all.push(...(Array.isArray(parsed) ? parsed : parsed.listings ?? []));
    }
    return all;
  },
};
