// "Deal me a dish": which dishes can be dealt, and dealing a hand of them.
import { dealable, isDrink } from "../browse";

export const HAND_SIZE = 10;
const PER_STALL = 3;
const ADD_ON = /add-?on|\bextra\b/i;

export const DEFAULT_FILTERS = { vegOnly: false, under150: false, kind: "food" };

// Every dish that could be dealt with these filters: available, at a stall
// open right now (taking pre-orders, or menu only: order at the counter),
// and not an add-on. Each entry is { item, stall }.
export function dealPool(stalls, filters, demoMode) {
  const pool = [];
  for (const stall of stalls) {
    if (!dealable(stall, demoMode)) continue;
    for (const item of stall.items) {
      if (!item.available || ADD_ON.test(item.name)) continue;
      if (filters.vegOnly && !item.veg) continue;
      if (filters.under150 && item.price >= 150) continue;
      if (filters.kind !== "both" && (filters.kind === "drinks") !== isDrink(item)) continue;
      pool.push({ item, stall });
    }
  }
  return pool;
}

// How much the model's score counts. Every dish keeps a floor weight, so a
// dish the model doesn't fancy still turns up now and then: the model only
// learns about dishes people actually get to see.
const FLOOR = 0.25;

// A random order in which each dish is more likely to come early the higher
// its weight (weighted sampling without replacement: sort by u^(1/w)).
// Without scores every dish weighs the same: a plain shuffle.
function weightedShuffle(list, scores) {
  return list
    .map((entry) => {
      const weight = scores ? FLOOR + (scores[entry.item.id] ?? 0.5) : 1;
      return { entry, key: Math.random() ** (1 / weight) };
    })
    .sort((a, b) => b.key - a.key)
    .map(({ entry }) => entry);
}

// A hand that spreads across stalls and sections: at most three dishes per
// stall and one per stall section, so ten cards aren't ten noodles from one
// counter. If the spread rules leave the hand short, the rest is filled from
// whatever is left. `scores` (menu item id -> chance of being kept, from the
// Deal model) makes likely keeps come up more often.
export function dealHand(pool, size = HAND_SIZE, scores = null) {
  const shuffled = weightedShuffle(pool, scores);
  const hand = [];
  const perStall = new Map();
  const sections = new Set();
  for (const entry of shuffled) {
    if (hand.length === size) break;
    const section = `${entry.stall.id}/${entry.item.category ?? ""}`;
    if ((perStall.get(entry.stall.id) ?? 0) >= PER_STALL || sections.has(section)) continue;
    hand.push(entry);
    perStall.set(entry.stall.id, (perStall.get(entry.stall.id) ?? 0) + 1);
    sections.add(section);
  }
  for (const entry of shuffled) {
    if (hand.length === size) break;
    if (!hand.includes(entry)) hand.push(entry);
  }
  return hand;
}

export function filterSummary(filters) {
  const parts = [];
  if (filters.vegOnly) parts.push("Veg");
  if (filters.under150) parts.push("under ₹150");
  parts.push(filters.kind === "both" ? "food & drinks" : filters.kind);
  return parts.join(" · ");
}
