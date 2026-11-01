// Shared helpers for the student browse views: stall status, stall tints and
// the "By craving" groups.

const TINTS = ["#E3EFE6", "#F6EBD9", "#E6ECF5", "#FBE7E1", "#F3ECD8", "#EFE7DF", "#EAF0E2", "#F7E3DC"];

// A stable pastel per stall, so a stall keeps its colour across pages.
export function stallTint(stall) {
  return TINTS[Number(stall.id) % TINTS.length];
}

// What the student can do at this stall right now. Demo data has no hours,
// so sample stalls always count as open.
export function stallStatus(stall, demoMode) {
  // Pilot launch: menu shown, pre-orders not open at this stall (yet).
  if (stall.listingOnly) return { label: "Menu only", live: false, listing: true };
  if (stall.closedToday) return { label: "Closed today", live: false };
  if (stall.ordersPaused) return { label: "Paused", live: false, paused: true };
  if (!demoMode && !stall.open) return { label: "Closed now", live: false };
  return { label: "Open", live: true };
}

// Whether "Deal me a dish" can deal from this stall: one taking orders, or
// a menu-only stall that's open now (you'd order at its counter). Not a
// stall that's closed or has paused.
export function dealable(stall, demoMode) {
  if (stallStatus(stall, demoMode).live) return true;
  return Boolean(stall.listingOnly) && !stall.closedToday && !stall.ordersPaused && (demoMode || stall.open);
}

// Drinks are told apart by their category ("Cold Beverages", "Chai Nagri"),
// or by the dish name when the stall hasn't set one.
const DRINK_WORDS = /beverage|drink|shake|juice|coffee|chai|\btea\b|soda|lassi|mojito|smoothie|cooler|frappe|lemonade|water|cola|coke|pepsi|sprite|latte|cappuccino|espresso|milk/i;
export function isDrink(item) {
  return DRINK_WORDS.test(item.category ?? "") || (!item.category && DRINK_WORDS.test(item.name));
}

// The stall's biggest categories, as a one-line hint of what it serves.
// Diet-only headings ("Veg", "Non Veg") say nothing about the food, so
// they're skipped.
const GENERIC_CATEGORY = /^(non[ -]?)?veg(etarian)?$/i;

export function topCategories(stall, count = 4) {
  const sizes = new Map();
  for (const item of stall.items) {
    if (item.category && !GENERIC_CATEGORY.test(item.category.trim())) sizes.set(item.category, (sizes.get(item.category) ?? 0) + 1);
  }
  return [...sizes.entries()].sort((a, b) => b[1] - a[1]).slice(0, count).map(([name]) => name);
}

// Cravings are matched on dish names, so they work across stalls that name
// their categories differently. A craving with no dishes isn't shown.
export const CRAVINGS = [
  { id: "rolls", name: "Rolls", tint: "#F6EBD9", pattern: /\broll|wrap|kathi|frankie/i },
  { id: "momos", name: "Momos", tint: "#E3EFE6", pattern: /momo/i },
  { id: "noodles", name: "Noodles", tint: "#FBE7E1", pattern: /noodle|chow ?mein|hakka|maggi/i },
  { id: "fried-rice", name: "Fried rice", tint: "#F3ECD8", pattern: /fried rice/i },
  { id: "biryani", name: "Biryani", tint: "#EFE7DF", pattern: /biryani|biriyani/i },
  { id: "burgers", name: "Burgers", tint: "#F7E3DC", pattern: /burger/i },
  { id: "sandwiches", name: "Sandwiches", tint: "#EAF0E2", pattern: /sandwich|\bsub\b/i },
  { id: "pasta", name: "Pasta", tint: "#E6ECF5", pattern: /pasta|pazzta|penne|\bmac\b/i },
  { id: "dosa", name: "Dosa & idli", tint: "#F3ECD8", pattern: /dosa|idli|uttapam|vada|upma/i },
  { id: "paratha", name: "Paratha", tint: "#EFE7DF", pattern: /paratha|parantha|kulcha/i },
  { id: "paneer", name: "Paneer", tint: "#F6EBD9", pattern: /paneer/i },
  { id: "chicken", name: "Chicken", tint: "#FBE7E1", pattern: /chicken/i },
  { id: "thali", name: "Meals & thalis", tint: "#EAF0E2", pattern: /thali|meal|combo|rajma|chole|\bdal\b/i },
  { id: "snacks", name: "Fries & snacks", tint: "#F7E3DC", pattern: /fries|nugget|samosa|pakora|pakoda|nachos|wedges/i },
  { id: "shakes", name: "Shakes", tint: "#E6ECF5", pattern: /shake/i },
  { id: "cold-coffee", name: "Cold coffee", tint: "#E3EFE6", pattern: /cold coffee|frappe/i },
  { id: "chai", name: "Chai & coffee", tint: "#EFE7DF", pattern: /\bchai\b|\btea\b|(?<!cold )coffee|cappuccino|latte|espresso/i },
  { id: "juices", name: "Juices & mocktails", tint: "#EAF0E2", pattern: /juice|mojito|mocktail|lemonade|soda|cooler/i },
  { id: "desserts", name: "Desserts", tint: "#F7E3DC", pattern: /brownie|ice cream|sundae|waffle|pastry|cake|gulab/i },
];

// Every dish matching a craving, across stalls taking orders right now, so
// "from ₹70" never points at a stall you can't order from. Cheapest first;
// each entry is { item, stall }.
export function cravingDishes(craving, stalls, demoMode) {
  const dishes = [];
  for (const stall of stalls) {
    if (!stallStatus(stall, demoMode).live) continue;
    for (const item of stall.items) {
      if (item.available && craving.pattern.test(item.name)) dishes.push({ item, stall });
    }
  }
  return dishes.sort((a, b) => a.item.price - b.item.price);
}

export function cravingSummary(dishes) {
  if (dishes.length === 0) return null;
  const stallCount = new Set(dishes.map((dish) => dish.stall.id)).size;
  return `${stallCount} stall${stallCount === 1 ? "" : "s"} · from ₹${dishes[0].item.price}`;
}
