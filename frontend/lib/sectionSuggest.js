// Suggests which of a stall's own menu sections a new dish belongs in, from
// the dishes already on that stall's menu: "Paneer Tikka Roll" at a stall with
// a "Veg Kathi Rolls" section -> "Veg Kathi Rolls".
//
// k-nearest neighbours: the stall's dishes whose names are most similar
// (the same trigram + IDF similarity as search, lib/fuzzySearch.js) vote for
// their section, each vote weighted by how similar it is. Sections are the
// stall's own words, so there's no fixed list of categories to learn: every
// stall's menu is its own training set, and it improves as the menu grows.
// Measured with scripts/eval-sections.mjs.
import { buildIndex, search } from "./fuzzySearch.js";

export const NEIGHBOURS = 7;

// items: the stall's dishes [{ id, name, category }]. Returns up to `limit`
// sections, best first: [{ category, share }] where share is that section's
// part of the neighbours' vote (0-1). Empty when nothing is similar enough.
export function suggestSections(items, name, { limit = 3, index = null } = {}) {
  const labelled = items.filter((item) => item.category && item.category.trim());
  if (labelled.length === 0 || !name || !name.trim()) return [];
  // Names only: the section names are what's being predicted.
  const idx = index ?? buildIndex(labelled.map((item) => ({ id: item.id, name: item.name })));
  const near = [...search(idx, name, { requireAll: false })].slice(0, NEIGHBOURS);
  if (near.length === 0) return [];
  const byId = new Map(labelled.map((item) => [item.id, item]));
  const votes = new Map();
  let total = 0;
  for (const [id, score] of near) {
    const item = byId.get(id);
    if (!item) continue;
    votes.set(item.category.trim(), (votes.get(item.category.trim()) ?? 0) + score);
    total += score;
  }
  return [...votes]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([category, vote]) => ({ category, share: vote / total }));
}
