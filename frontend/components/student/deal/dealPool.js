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

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// A shuffled hand that spreads across stalls and sections: at most three
// dishes per stall and one per stall section, so ten cards aren't ten
// noodles from one counter. If the spread rules leave the hand short, the
// rest is filled from whatever is left.
export function dealHand(pool, size = HAND_SIZE) {
  const shuffled = shuffle(pool);
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
