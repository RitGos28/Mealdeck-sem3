// "Similar, for less": dishes at other stalls that are like this one and
// cheaper. Uses the menu-wide similarity model from lib/fuzzySearch.js: a
// candidate's score for this dish's name, divided by the dish's score for
// its own name, says how alike they are (1 = same words). Only close matches
// count, veg stays veg (and non-veg stays non-veg), sizes are compared like
// with like, add-ons are left out, and the same stall is skipped (its own
// sizes are already on the dish).
import { search } from "./fuzzySearch.js";

export const MIN_LIKENESS = 0.6;

// Extras and add-ons aren't a meal of their own.
const ADD_ON = /add-?on|\bextra\b/i;
// "(Half)", "(Small)", "(Regular)", ... A half plate isn't a cheaper version
// of a full one, it's less food: only compare like with like.
const SIZE = /\((half|full|small|regular|medium|large|mini|single|double)\b/i;
const sizeOf = (name) => (name.match(SIZE)?.[1] ?? "").toLowerCase();

// index: buildIndex over every dish. entries: Map(item id -> { item, stall }).
// Returns up to `limit` [{ item, stall, likeness, saving }], closest first.
export function similarForLess(index, entries, dishItem, dishStall, { limit = 3 } = {}) {
  const scores = search(index, dishItem.name, { requireAll: false });
  const self = scores.get(dishItem.id);
  if (!self) return [];
  const found = [];
  for (const [id, score] of scores) {
    const entry = entries.get(id);
    if (!entry || entry.stall.id === dishStall.id) continue;
    const { item, stall } = entry;
    const likeness = score / self;
    if (likeness < MIN_LIKENESS || !item.available || ADD_ON.test(item.name)) continue;
    if (dishItem.veg !== item.veg) continue; // veg stays veg, chicken stays chicken
    const size = sizeOf(item.name);
    if (size && size !== sizeOf(dishItem.name)) continue;
    const saving = Number(dishItem.price) - Number(item.price);
    if (saving <= 0) continue;
    found.push({ item, stall, likeness, saving });
  }
  found.sort((a, b) => b.likeness - a.likeness || b.saving - a.saving);
  // One per stall, so three cheaper rolls aren't all from the same counter.
  const seen = new Set();
  return found.filter((f) => !seen.has(f.stall.id) && seen.add(f.stall.id)).slice(0, limit);
}
