// The food passport: which campus dishes a student has tried. A dish only
// counts once the vendor has marked an order with it "Picked up"
// (COMPLETED); placed, ready, no-show or cancelled orders never stamp it.

const STAMPED = "COMPLETED";

// Ink colours for stamps, one per stall, darker cousins of the stall tints.
const INKS = ["#1F6B43", "#8A5A12", "#2B4C7E", "#8C3B2E", "#6B5A1E", "#5B4636", "#3F6B3A", "#7A3B4E"];

export function stallInk(stall) {
  return INKS[Number(stall.id) % INKS.length];
}

// Newest first by pickup day, then by order number.
function byNewest(a, b) {
  return (b.pickupDate ?? "").localeCompare(a.pickupDate ?? "") || b.id - a.id;
}

// orders: GET /api/orders (the student's own). stalls: GET /api/stalls.
export function buildPassport(orders, stalls) {
  const menu = new Map();
  for (const stall of stalls) for (const item of stall.items) menu.set(String(item.id), { item, stall });

  // menuItemId -> { count, first, last, firstOrderId }, from picked-up orders.
  const tried = new Map();
  const picked = orders.filter((order) => order.status === STAMPED).sort((a, b) => -byNewest(a, b));
  for (const order of picked) {
    for (const line of order.items ?? []) {
      const key = String(line.menuItemId);
      const entry = tried.get(key);
      if (entry) {
        entry.count += line.quantity;
        entry.last = order.pickupDate;
      } else {
        tried.set(key, { count: line.quantity, first: order.pickupDate, last: order.pickupDate, firstOrderId: order.id, name: line.menuItemName });
      }
    }
  }

  // Only dishes still on a menu count towards the totals.
  const triedOnMenu = [...tried.keys()].filter((key) => menu.has(key));
  const total = menu.size;

  const perStall = stalls.map((stall) => {
    const sections = new Map();
    let stallTried = 0;
    for (const item of stall.items) {
      const name = item.category || "More";
      if (!sections.has(name)) sections.set(name, { name, total: 0, tried: 0, times: 0 });
      const section = sections.get(name);
      section.total += 1;
      const entry = tried.get(String(item.id));
      if (entry) {
        section.tried += 1;
        section.times += entry.count;
        stallTried += 1;
      }
    }
    return { stall, tried: stallTried, total: stall.items.length, sections: [...sections.values()] };
  });

  // Latest stamps, newest first: one per dish, dated by its first pickup.
  const stamps = triedOnMenu
    .map((key) => ({ ...tried.get(key), ...menu.get(key) }))
    .sort((a, b) => (b.first ?? "").localeCompare(a.first ?? "") || b.firstOrderId - a.firstOrderId);

  const monthStart = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }).slice(0, 8) + "01";
  const newThisMonth = stamps.filter((stamp) => (stamp.first ?? "") >= monthStart).length;

  return {
    tried, total,
    triedCount: triedOnMenu.length,
    perStall,
    stallsStamped: perStall.filter((entry) => entry.tried > 0).length,
    stamps,
    newThisMonth,
    suggestions: suggest(orders, tried, menu, stalls),
  };
}

// "Next to try": untried dishes near what the student usually orders. Their
// usual is the dish they've ordered most (any status, it's about taste);
// suggestions come from the same stall and section first, closest in price,
// then a first dish at a stall they've never been stamped at.
function suggest(orders, tried, menu, stalls) {
  const counts = new Map();
  for (const order of orders) {
    if (order.status === "CANCELLED") continue;
    for (const line of order.items ?? []) counts.set(String(line.menuItemId), (counts.get(String(line.menuItemId)) ?? 0) + line.quantity);
  }
  const usualKey = [...counts.entries()].filter(([key]) => menu.has(key)).sort((a, b) => b[1] - a[1])[0]?.[0];
  const usual = usualKey ? menu.get(usualKey) : null;
  const orderable = (stall, item) => item.available && !stall.closedToday && !stall.ordersPaused && !tried.has(String(item.id));
  const picks = [];
  const add = (stall, item, why) => {
    if (picks.length < 3 && !picks.some((pick) => pick.item.id === item.id)) picks.push({ stall, item, why });
  };

  if (usual) {
    const { item: usualItem, stall } = usual;
    stall.items
      .filter((item) => orderable(stall, item) && item.category === usualItem.category && item.id !== usualItem.id)
      .sort((a, b) => Math.abs(a.price - usualItem.price) - Math.abs(b.price - usualItem.price))
      .slice(0, 2)
      .forEach((item) => add(stall, item, `Like your ${usualItem.name}`));
  }
  const unstamped = stalls.filter((stall) => !stall.items.some((item) => tried.has(String(item.id))));
  for (const stall of unstamped) {
    const target = usual?.item.price ?? 120;
    const item = stall.items.filter((dish) => orderable(stall, dish)).sort((a, b) => Math.abs(a.price - target) - Math.abs(b.price - target))[0];
    if (item) add(stall, item, `Your first stamp at ${stall.name}`);
  }
  if (usual) {
    const { stall } = usual;
    stall.items.filter((item) => orderable(stall, item)).sort((a, b) => a.price - b.price).forEach((item) => add(stall, item, `New at ${stall.name}`));
  }
  return { usual, picks };
}

// The dishes in this picked-up order that earned a new stamp: ones never
// picked up in any earlier order.
export function newStampsFrom(order, passport) {
  return (order.items ?? []).filter((line) => passport.tried.get(String(line.menuItemId))?.firstOrderId === order.id);
}
