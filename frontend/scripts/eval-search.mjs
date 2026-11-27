// Evaluates typo-tolerant search (lib/fuzzySearch.js) against plain substring
// search on the real menus. Usage: node scripts/eval-search.mjs [menu dir]
// (default ../menu; only snapeats.csv is committed, so pass a folder with all
// the stall CSVs for the full numbers). The typo list was written by hand and
// the model was tuned on it, so also try typos it has never seen.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const { buildIndex, search, suggestion } = await import(path.join(here, "../lib/fuzzySearch.js"));

function parseCsv(line) {
  const out = []; let cell = ""; let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === '"' && line[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true; else if (c === ",") { out.push(cell); cell = ""; } else cell += c;
  }
  out.push(cell); return out;
}
const dir = process.argv[2] ?? path.join(here, "../../menu");
const items = [];
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".csv"))) {
  const lines = fs.readFileSync(path.join(dir, f), "utf8").split(/\r?\n/).slice(1).filter(Boolean);
  for (const l of lines) { const c = parseCsv(l); items.push({ id: items.length, stall: c[0], category: c[1], name: c[2] }); }
}
const index = buildIndex(items);

// [typed query, what the student means (a substring every correct hit's name contains)]
const cases = [
  ["panner tikka", "paneer tikka"], ["paner", "paneer"], ["manchoorian", "manchurian"], ["manchurain", "manchurian"],
  ["chiken burger", "chicken burger"], ["chikn", "chicken"], ["cofee", "coffee"], ["cold cofee", "cold coffee"],
  ["biriyani", "biryani"], ["briyani", "biryani"], ["momos", "momo"], ["maggie", "maggi"], ["shezwan", "schezwan"],
  ["szechwan", ["schezwan","szechaun","szechwan"]], ["dosaa", "dosa"], ["masla dosa", "masala dosa"], ["frid rice", "fried rice"],
  ["noodels", "noodle"], ["sandwhich", "sandwich"], ["sandwitch", "sandwich"], ["lassi", "lassi"], ["lasi", "lassi"],
  ["chola bhatura", "chole bhature"], ["chhole", "chole"], ["paratha", "paratha"], ["parantha", "parantha"],
  ["mojito", "mojito"], ["mohito", "mojito"], ["kathi rol", "kathi roll"], ["shake", "shake"], ["oreo shak", "oreo shake"],
  ["tandori", "tandoori"], ["butter nan", "butter naan"], ["dal makhni", "dal makhani"], ["kadai paneer", "kadai paneer"],
  ["chilly paneer", "chilli paneer"], ["chilli panner", "chilli paneer"], ["cheese pizza", "pizza"], ["fries", "fries"],
  ["peri peri frys", "peri peri fries"],
];

const contains = (name, want) => [].concat(want).some((w) => name.toLowerCase().includes(w));
let fuzzyHit = 0, substrHit = 0, fuzzyTop = 0, applicable = 0;
const rows = [];
for (const [q, want] of cases) {
  const relevant = items.filter((it) => contains(it.name, want));
  if (relevant.length === 0) { rows.push(`  (skip) "${q}": no dish contains "${want}"`); continue; }
  applicable++;
  const substr = items.filter((it) => it.name.toLowerCase().includes(q));
  const fz = [...search(index, q).keys()].map((id) => items[id]);
  const sHit = substr.some((it) => contains(it.name, want));
  const fHit = fz.slice(0, 10).some((it) => contains(it.name, want));
  const fTop = fz.length > 0 && contains(fz[0].name, want);
  substrHit += sHit; fuzzyHit += fHit; fuzzyTop += fTop;
  const sug = suggestion(index, q);
  rows.push(`  ${fHit ? "✓" : "✗"} "${q}" -> ${fz.length} results, top: ${fz[0]?.name ?? "-"}${sug ? `   (did you mean "${sug}"?)` : ""}   [today: ${sHit ? "found" : "nothing"}]`);
}
console.log(rows.join("\n"));
console.log(`\n${items.length} dishes, ${index.vocab.size} distinct words, ${applicable} typo/spelling queries`);
console.log(`today's substring search finds the right dish: ${substrHit}/${applicable} (${Math.round(100 * substrHit / applicable)}%)`);
console.log(`typo-tolerant search, right dish in top 10:     ${fuzzyHit}/${applicable} (${Math.round(100 * fuzzyHit / applicable)}%)`);
console.log(`typo-tolerant search, right dish ranked #1:     ${fuzzyTop}/${applicable} (${Math.round(100 * fuzzyTop / applicable)}%)`);
const t0 = performance.now(); for (let i = 0; i < 200; i++) search(index, "chilli panner"); console.log(`speed: ${((performance.now() - t0) / 200).toFixed(2)} ms per query`);
