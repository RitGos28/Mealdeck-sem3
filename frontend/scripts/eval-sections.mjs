// Measures the section suggester (lib/sectionSuggest.js) on the real menus:
// each dish is hidden, together with its other sizes ("Biryani (Half)" and
// "(Full)" go together, so a sibling can't give the answer away), and its
// section is predicted from the rest of the same stall's menu.
// Usage: node scripts/eval-sections.mjs [menu dir]   (default ../menu)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const { suggestSections } = await import(path.join(here, "../lib/sectionSuggest.js"));

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
const stalls = new Map();
let id = 0;
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".csv"))) {
  for (const line of fs.readFileSync(path.join(dir, f), "utf8").split(/\r?\n/).slice(1).filter(Boolean)) {
    const [stall, category, name] = parseCsv(line);
    if (!stalls.has(stall)) stalls.set(stall, []);
    stalls.get(stall).push({ id: id++, name, category });
  }
}
const base = (name) => name.replace(/\s*\([^)]*\)\s*$/, "").trim().toLowerCase();

let n = 0, top1 = 0, top3 = 0, baseline = 0, none = 0;
const perStall = [];
for (const [stall, items] of stalls) {
  let s1 = 0, sn = 0;
  for (const item of items) {
    const rest = items.filter((other) => base(other.name) !== base(item.name));
    if (rest.length === 0) continue;
    n++; sn++;
    const guess = suggestSections(rest, item.name);
    if (guess.length === 0) none++;
    if (guess[0]?.category === item.category) { top1++; s1++; }
    if (guess.some((g) => g.category === item.category)) top3++;
    // Baseline: always suggest the stall's biggest section.
    const counts = new Map();
    for (const other of rest) counts.set(other.category, (counts.get(other.category) ?? 0) + 1);
    const biggest = [...counts].sort((a, b) => b[1] - a[1])[0][0];
    if (biggest === item.category) baseline++;
  }
  perStall.push(`  ${stall.padEnd(28)} ${String(new Set(items.map((i) => i.category)).size).padStart(3)} sections  top-1 ${Math.round((100 * s1) / sn)}%`);
}
const pct = (x) => `${Math.round((100 * x) / n)}%`;
console.log(perStall.join("\n"));
console.log(`\n${n} dishes, each predicted with it (and its sizes) hidden`);
console.log(`baseline (always the stall's biggest section): ${pct(baseline)}`);
console.log(`suggested section is right, first suggestion:  ${pct(top1)}`);
console.log(`right section among the 3 chips shown:         ${pct(top3)}`);
console.log(`no suggestion (nothing similar on the menu):   ${pct(none)}`);
