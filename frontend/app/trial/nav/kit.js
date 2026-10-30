// Shared building blocks for the navigation mockups under /trial/nav, in the
// live redesign's look: deep-green band, white rounded sheet, DM Serif
// Display headings over Inter. Everything returns static HTML strings for a
// 390×844 phone frame. See v1.js for how a variety uses them.

export const GREEN = "#163D29";
export const SERIF = "'DM Serif Display', Georgia, serif";
export const INK = "#14201A";
export const MUTED = "#5C6B62";
export const LINE = "#E6EAE5";
export const MINT = "#E3EFE6";
export const MINT_INK = "#1F4D33";
export const ON_DECK = "#C3DDCB";

export const head = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&amp;family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
<style>body{margin:0}button,input{font:inherit}input::placeholder{color:#B9D3C1}</style>`;

export const veg = `<svg width="13" height="13" viewBox="0 0 14 14" role="img" aria-label="Vegetarian" style="flex-shrink:0"><rect x="1" y="1" width="12" height="12" rx="2" fill="none" stroke="#1F7A3E" stroke-width="1.5"/><circle cx="7" cy="7" r="3" fill="#1F7A3E"/></svg>`;
export const nonVeg = `<svg width="13" height="13" viewBox="0 0 14 14" role="img" aria-label="Non-vegetarian" style="flex-shrink:0"><rect x="1" y="1" width="12" height="12" rx="2" fill="none" stroke="#9A3412" stroke-width="1.5"/><path d="M7 3.6L10.4 10H3.6Z" fill="#9A3412"/></svg>`;
export const vegMark = (isVeg) => (isVeg ? veg : nonVeg);

export const initials = (name) => name.replace(/[^A-Za-z ]/g, "").split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("");

export function chevron(dir = "right", size = 18) {
  const path = { down: '<path d="M6 9l6 6 6-6"/>', up: '<path d="M18 15l-6-6-6 6"/>', left: '<path d="M15 6l-6 6 6 6"/>', right: '<path d="M9 6l6 6-6 6"/>' }[dir];
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0">${path}</svg>`;
}

export const bagIcon = (size = 22) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>`;

const TAB_ICONS = {
  menu: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  orders: '<path d="M7 3h10v18l-5-3-5 3z"/>',
  account: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  mess: '<path d="M4 11h16M6 11a6 6 0 0 1 12 0M12 5V3M5 15h14l-1 4H6z"/>',
  stalls: '<path d="M3 9l1.5-5h15L21 9M4 9v11h16V9M3 9h18M9 20v-6h6v6"/>',
};

/** Bottom tab bar. `items` = [[id, label], ...]; defaults to Menu / My orders / Account. */
export function tabs(active = "menu", items = [["menu", "Menu"], ["orders", "My orders"], ["account", "Account"]]) {
  return `
  <nav aria-label="Main" style="position: absolute; left: 0; right: 0; bottom: 0; height: 72px; padding-bottom: 8px; box-sizing: border-box; display: grid; grid-template-columns: repeat(${items.length}, minmax(0, 1fr)); background: #FFFFFF; border-top: 1px solid ${LINE}; z-index: 5">
    ${items.map(([id, label]) => `<a href="#" ${id === active ? 'aria-current="page"' : ""} style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; color: ${id === active ? GREEN : MUTED}; text-decoration: none; font-size: 12px; font-weight: ${id === active ? 600 : 500}"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TAB_ICONS[id] ?? TAB_ICONS.menu}</svg>${label}</a>`).join("")}
  </nav>`;
}

/** The 390×844 phone frame: green background, `inner` stacked top to bottom, bottom tabs unless `tabBar` is false. */
export function frame(inner, { activeTab = "menu", tabItems, tabBar = true, overlay = "" } = {}) {
  return `
<div style="width: 390px; height: 844px; box-sizing: border-box; background: ${GREEN}; color: ${INK}; font-family: Inter, system-ui, sans-serif; position: relative; overflow: hidden; display: flex; flex-direction: column">${inner}
  ${tabBar ? tabs(activeTab, tabItems) : ""}${overlay}
</div>`;
}

/** Green band content (top of the screen). */
export const band = (inner, pad = "14px 20px 20px") => `<div style="padding: ${pad}; color: #FFFFFF">${inner}</div>`;
export const logo = `<span style="font-family: ${SERIF}; font-size: 23px">MealDeck</span>`;
export const bigTitle = (text, sub = "") => `<h1 style="margin: 12px 0 2px; font-family: ${SERIF}; font-size: 30px; line-height: 1.1; font-weight: 400">${text}</h1>${sub ? `<p style="margin: 0; font-size: 14px; color: ${ON_DECK}">${sub}</p>` : ""}`;
export const backLink = (label) => `<div style="display: flex; align-items: center; gap: 6px; font-size: 14px; color: #D6EBDC">${chevron("left")}${label}</div>`;

export function searchBox(placeholder = "Search dishes, drinks or stalls", value = "") {
  return `
  <label style="display: flex; align-items: center; gap: 10px; height: 44px; padding: 0 14px; border-radius: 12px; background: rgba(255,255,255,.12); margin-top: 14px">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D6EBDC" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
    <span style="position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0)">Search</span>
    <input placeholder="${placeholder}" value="${value}" style="flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; font-size: 16px; color: #FFFFFF">
  </label>`;
}

/** White rounded sheet that fills the rest of the screen. */
export const sheet = (inner, style = "") => `<main style="flex: 1; overflow: hidden; background: #FFFFFF; border-radius: 24px 24px 0 0; padding: 18px 20px 96px; ${style}">${inner}</main>`;

export const sectionTitle = (text, aside = "") => `
  <div style="display: flex; align-items: baseline; justify-content: space-between; margin: 0 0 10px">
    <h2 style="margin: 0; font-family: ${SERIF}; font-size: 20px; font-weight: 400">${text}</h2>${aside ? `<span style="font-size: 13px; color: ${MUTED}">${aside}</span>` : ""}
  </div>`;

/** Pill chip. `on` = selected; `dark` = on the green band. */
export function chip(label, { on = false, dark = false } = {}) {
  const bg = on ? (dark ? "#FFFFFF" : GREEN) : dark ? "transparent" : "#FFFFFF";
  const fg = on ? (dark ? GREEN : "#FFFFFF") : dark ? "#FFFFFF" : INK;
  const border = on ? (dark ? "#FFFFFF" : GREEN) : dark ? "rgba(255,255,255,.25)" : "#DCE2DB";
  return `<span style="flex-shrink: 0; height: 36px; padding: 0 14px; border-radius: 999px; border: 1px solid ${border}; background: ${bg}; color: ${fg}; font-size: 14px; font-weight: 600; display: inline-flex; align-items: center; white-space: nowrap">${label}</span>`;
}
export const chipRow = (chips, style = "") => `<div style="display: flex; gap: 6px; overflow: hidden; ${style}">${chips}</div>`;

/** Initials tile (no photos in mockups). */
export const tile = (name, size = 44, bg = MINT, radius = "999px") => `<div style="width: ${size}px; height: ${size}px; flex-shrink: 0; border-radius: ${radius}; background: ${bg}; color: ${MINT_INK}; display: flex; align-items: center; justify-content: center; font-family: ${SERIF}; font-size: ${Math.round(size * 0.36)}px">${initials(name)}</div>`;

export const plusButton = (name) => `<button type="button" aria-label="Add ${name}" style="width: 38px; height: 38px; flex-shrink: 0; border-radius: 999px; border: 1px solid #DCE2DB; background: #FFFFFF; font-size: 18px; color: ${INK}">+</button>`;
export const stepper = (qty) => `<div style="display: flex; align-items: center; height: 38px; flex-shrink: 0; border-radius: 999px; border: 1px solid ${GREEN}; color: ${GREEN}"><span style="width: 32px; text-align: center; font-size: 18px">−</span><span style="min-width: 12px; text-align: center; font-size: 14px; font-weight: 600">${qty}</span><span style="width: 32px; text-align: center; font-size: 18px">+</span></div>`;

/** A dish row: tile, veg mark, name, price (+ optional sub line), + or stepper. */
export function dishRow({ name, price, veg: isVeg = true }, { qty = 0, sub = "", showTile = true } = {}) {
  return `
  <div style="display: flex; align-items: center; gap: 12px; padding: 9px 0; border-bottom: 1px solid #EEF1ED">
    ${showTile ? tile(name) : ""}
    <div style="flex: 1; min-width: 0"><div style="display: flex; align-items: center; gap: 6px">${vegMark(isVeg)}<span style="font-size: 15px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${name}</span></div><div style="margin-top: 2px; font-size: 14px; color: ${MUTED}">₹${price}${sub ? ` · ${sub}` : ""}</div></div>
    ${qty ? stepper(qty) : plusButton(name)}
  </div>`;
}

/** A folded (or open) category header row. */
export const categoryHeader = (name, count, open = false) => `
  <div style="display: flex; align-items: center; justify-content: space-between; min-height: 48px; border-bottom: 1px solid #EEF1ED">
    <span style="font-size: 15px; font-weight: 600">${name}</span><span style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: ${MUTED}">${count}${chevron(open ? "down" : "right")}</span>
  </div>`;

export const MESS_TODAY = { meal: "Lunch", dishes: "Rajma, jeera rice, aloo gobi, roti, salad", price: "₹70 for day scholars · free for hostellers" };
export const messCard = (meal = MESS_TODAY) => `
  <div style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 16px; background: ${MINT}; margin-bottom: 16px">
    <div style="flex: 1; min-width: 0">
      <div style="font-size: 12px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: ${MINT_INK}">Mess today · ${meal.meal}</div>
      <div style="margin-top: 3px; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${meal.dishes}</div>
      <div style="margin-top: 2px; font-size: 12px; color: #3E5A48">${meal.price}</div>
    </div>
    <span style="color: ${MINT_INK}">${chevron()}</span>
  </div>`;

/** Stall facts for mockups (statuses/queues are sample values). */
export const STALLS = [
  { name: "SnapEats", status: "Open", open: true, queue: "1 in queue", hours: "Open till 10 pm", dishes: 144, tags: "Combos · Cold beverages · Snacks · Tandoori", tint: "#E3EFE6" },
  { name: "House of Chow", status: "Open", open: true, queue: "No queue", hours: "Open till 9 pm", dishes: 230, tags: "Chinese · Noodles · Momos · Shakes", tint: "#F6EBD9" },
  { name: "Paid Mess", status: "Open", open: true, queue: "3 in queue", hours: "Open till 10 pm", dishes: 231, tags: "North Indian · Tandoori · Biryani · Rolls", tint: "#E6ECF5" },
  { name: "Quench", status: "Paused", open: false, queue: "Busy right now", hours: "Back soon", dishes: 24, tags: "Shakes · Juices · Sodas", tint: "#F1F2F0" },
];
export const statusDot = (stall) => {
  const ink = stall.open ? "#1F6B43" : "#9A5B13";
  return `<span style="display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: ${ink}"><span style="width: 7px; height: 7px; border-radius: 999px; background: ${ink}"></span>${stall.status}</span>`;
};

/** Floating bag pill above the bottom tabs. */
export const bagPill = (count, total) => `
  <a href="#" aria-label="Bag" style="position: absolute; right: 16px; bottom: 86px; height: 52px; padding: 0 18px 0 14px; border-radius: 999px; background: ${GREEN}; color: #FFFFFF; text-decoration: none; display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; box-shadow: 0 12px 28px -10px rgba(20,60,38,.6); z-index: 6">${bagIcon()}${count} · ₹${total}</a>`;

/** Dimmed backdrop + bottom sheet overlay (pass as frame's `overlay`). */
export const bottomSheet = (inner, height = "62%") => `
  <div style="position: absolute; inset: 0; background: rgba(11,31,20,.5); z-index: 8"></div>
  <div role="dialog" aria-modal="true" style="position: absolute; left: 0; right: 0; bottom: 0; height: ${height}; background: #FFFFFF; border-radius: 24px 24px 0 0; padding: 10px 20px 24px; box-sizing: border-box; z-index: 9; overflow: hidden">
    <div style="width: 40px; height: 4px; border-radius: 999px; background: #DCE2DB; margin: 0 auto 12px"></div>${inner}
  </div>`;
