// Turning menu items into dishes for display. Each size is its own menu item
// (own price, own sold-out state), named "Dish (Size)": "Chicken Korma
// (250gm)", "Chicken Korma (400gm)". When two or more items in the same
// category share a base name, they're shown as one dish with size options.

const VARIANT = /\s*\(([^()]+)\)\s*$/;

export function splitVariant(name) {
  const match = name.match(VARIANT);
  return match ? { base: name.slice(0, match.index).trim(), label: match[1].trim() } : { base: name, label: null };
}

// items → [{ key, base, category, variants: [{ label, item }], items }]
// A dish with one variant keeps its full name and label: null.
export function groupDishes(items) {
  const byKey = new Map();
  for (const item of items) {
    const { base, label } = splitVariant(item.name);
    const key = `${item.category ?? ""}|${base}`;
    if (!byKey.has(key)) byKey.set(key, { key, base, category: item.category ?? null, entries: [] });
    byKey.get(key).entries.push({ label, item });
  }
  const dishes = [];
  for (const group of byKey.values()) {
    if (group.entries.length > 1 && group.entries.every((entry) => entry.label)) {
      const variants = [...group.entries].sort((a, b) => a.item.price - b.item.price);
      dishes.push({ key: group.key, base: group.base, category: group.category, variants, items: variants.map((v) => v.item) });
    } else {
      // Not a size group: each item stands alone under its own full name.
      for (const entry of group.entries) {
        dishes.push({ key: `${group.key}|${entry.item.id}`, base: entry.item.name, category: group.category, variants: [{ label: null, item: entry.item }], items: [entry.item] });
      }
    }
  }
  // Keep the menu's own order: by each dish's first item.
  const order = new Map(items.map((item, i) => [item.id, i]));
  return dishes.sort((a, b) => Math.min(...a.items.map((it) => order.get(it.id))) - Math.min(...b.items.map((it) => order.get(it.id))));
}

// One dish for a single item (craving list, deal, order again): its sizes
// aren't offered there, but its free choices still are.
export function dishFor(item) {
  return { key: `single|${item.id}`, base: item.name, category: item.category ?? null, variants: [{ label: null, item }], items: [item] };
}

export function needsSheet(dish) {
  return dish.variants.length > 1 || dish.items.some((item) => item.choices?.length);
}

// "Bread: Butter Roti ×2 · Style: Gravy" in the item's group order, as the
// server stores it; "" when there are no choices.
export function choiceText(item, picked) {
  return (item.choices ?? []).map((group) => `${group.name}: ${picked?.[group.name] ?? "?"}`).join(" · ");
}

export function lineKey(itemId, picked, item) {
  const text = item ? choiceText(item, picked) : "";
  return text ? `${itemId}|${text}` : String(itemId);
}

// How many of this dish (any size, any choices) are in the bag.
export function bagCount(cart, dish) {
  const ids = new Set(dish.items.map((item) => item.id));
  return Object.values(cart).reduce((sum, entry) => sum + (ids.has(entry.item.id) ? entry.quantity : 0), 0);
}

// Vendor/admin editing: choices as one line of text,
// "Bread: Butter Naan ×1 / Butter Roti ×2; Style: Dry / Gravy".
export function formatChoices(groups) {
  return (groups ?? []).map((group) => `${group.name}: ${group.options.join(" / ")}`).join("; ");
}

// The reverse; the server does the real validation (2–8 options, unique...).
export function parseChoices(text) {
  return (text ?? "").split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
    const colon = part.indexOf(":");
    const name = colon < 0 ? part : part.slice(0, colon).trim();
    const options = colon < 0 ? [] : part.slice(colon + 1).split("/").map((option) => option.trim()).filter(Boolean);
    return { name, options };
  });
}
