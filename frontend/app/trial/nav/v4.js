// Variety 4: "Deal me a dish". MealDeck as an actual deck of cards: when you
// don't know what you want, the app deals you one dish card at a time from the
// open stalls (keep or skip), and each stall's menu is a set of small decks
// (one per category) instead of a 230-row list.
import { MENUS } from "./data.js";
import {
  head, frame, band, logo, bigTitle, backLink, sheet, sectionTitle, chip, chipRow, tile, vegMark,
  dishRow, STALLS, MESS_TODAY, statusDot, bagPill, bagIcon, chevron, GREEN, SERIF, INK, MUTED, LINE, MINT, MINT_INK, ON_DECK,
} from "./kit.js";

export const TITLE = "Deal me a dish";
export const IDEA = "Not sure what to eat? MealDeck deals you dish cards from the open stalls; keep the ones you like, skip the rest, and every stall's menu is a set of small decks you flip through.";

const stallOf = (name) => STALLS.find((s) => s.name === name);
const cat = (stall, name) => MENUS[stall].categories.find((c) => c.name === name);
const dish = (stall, category, name) => ({ ...cat(stall, category).items.find((i) => i.name === name), stall, category });
const priceRange = (items) => {
  const p = items.filter((i) => !/Add-On/.test(i.name)).map((i) => i.price);
  const lo = Math.min(...p);
  const hi = Math.max(...p);
  return lo === hi ? `₹${lo}` : `₹${lo}–${hi}`;
};
const base = (name) => name.replace(/\s*\((Half|Full)\)/, "");
const kinds = (items) => [...new Set(items.filter((i) => !/Add-On/.test(i.name)).map((i) => base(i.name)))];
const upper = `font-size: 12px; font-weight: 600; letter-spacing: .05em; text-transform: uppercase`;

// ---- the playing-card dish card -------------------------------------------
const corner = (d, flip = false) => `
  <div aria-hidden="true" style="position: absolute; ${flip ? "right: 14px; bottom: 12px; transform: rotate(180deg)" : "left: 14px; top: 12px"}; display: flex; flex-direction: column; align-items: center; gap: 3px; color: ${INK}">
    <span style="font-family: ${SERIF}; font-size: 20px; line-height: 1">₹${d.price}</span>${vegMark(d.veg)}
  </div>`;

function dishCard(d, { w = 300, h = 440, rot = 0, x = 0, y = 0, z = 1, blank = false, tint } = {}) {
  const s = stallOf(d.stall);
  const pos = `position: absolute; left: 50%; top: 0; width: ${w}px; height: ${h}px; margin-left: ${-w / 2 + x}px; margin-top: ${y}px; transform: rotate(${rot}deg); z-index: ${z}`;
  if (blank) {
    return `<div aria-hidden="true" style="${pos}; border-radius: 24px; background: ${tint ?? "#FFFFFF"}; border: 1px solid ${LINE}; box-shadow: 0 10px 24px -14px rgba(20,60,38,.45)"></div>`;
  }
  return `
  <article aria-label="${d.name}, ₹${d.price}, ${d.stall}" style="${pos}; box-sizing: border-box; border-radius: 24px; background: #FFFFFF; border: 1px solid ${LINE}; box-shadow: 0 22px 40px -18px rgba(20,60,38,.55); overflow: hidden">
    ${corner(d)}${corner(d, true)}
    <div style="height: 200px; margin: 16px 54px 0; border-radius: 18px; background: ${s.tint}; display: flex; align-items: center; justify-content: center">
      ${tile(d.name, 112, "#FFFFFF")}
    </div>
    <div style="padding: 22px 26px 0; text-align: center">
      <div style="${upper}; color: ${MINT_INK}">${d.stall} · ${d.category}</div>
      <h2 style="margin: 8px 0 0; font-family: ${SERIF}; font-size: 30px; line-height: 1.1; font-weight: 400">${d.name}</h2>
      <div style="margin-top: 10px; display: flex; justify-content: center; gap: 8px; font-size: 13px; color: ${MUTED}">${statusDot(s)}<span>${s.queue}</span></div>
    </div>
  </article>`;
}

const roundBtn = (label, glyph, { primary = false, size = 64 } = {}) => `
  <button type="button" aria-label="${label}" style="width: ${size}px; height: ${size}px; border-radius: 999px; border: ${primary ? "0" : `1.5px solid #DCE2DB`}; background: ${primary ? GREEN : "#FFFFFF"}; color: ${primary ? "#FFFFFF" : INK}; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 22px -14px rgba(20,60,38,.6)">${glyph}</button>`;
const xGlyph = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>`;
const keepGlyph = `<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.3-9.2C1.4 8.4 3.7 5 7 5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.3 0 5.6 3.4 4.3 6.8C19.5 16.4 12 21 12 21z"/></svg>`;
const undoGlyph = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>`;

const pill = (label, { primary = true, small = false } = {}) => `<button type="button" style="height: ${small ? 44 : 52}px; padding: 0 ${small ? 18 : 24}px; border-radius: 999px; border: ${primary ? "0" : "1px solid #DCE2DB"}; background: ${primary ? GREEN : "#FFFFFF"}; color: ${primary ? "#FFFFFF" : INK}; font-size: ${small ? 14 : 16}px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; white-space: nowrap">${label}</button>`;

const bagButton = (count = 0) => `<a href="#" aria-label="Bag, ${count} items" style="position: relative; width: 44px; height: 44px; border-radius: 999px; background: rgba(255,255,255,.12); color: #FFFFFF; display: flex; align-items: center; justify-content: center">${bagIcon(20)}${count ? `<span style="position: absolute; top: 4px; right: 4px; min-width: 16px; height: 16px; border-radius: 999px; background: #FFFFFF; color: ${GREEN}; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center">${count}</span>` : ""}</a>`;
const topRow = (left, count = 0) => `<div style="display: flex; align-items: center; justify-content: space-between; min-height: 44px">${left}${bagButton(count)}</div>`;

// Sample dishes for the deal (real menu items)
const deal = [
  dish("SnapEats", "Veg Kathi Rolls", "Paneer Makhani Roll"),
  dish("House of Chow", "Momos (8 Pcs)", "Veg Kurkure Momos"),
  dish("Paid Mess", "Amritsari Kulcha Combo", "Paneer Kulcha (Single)"),
];

// ---- 1 · Home ----------------------------------------------------------------
const miniCard = (name, tint, rot, x, z) => `<div aria-hidden="true" style="position: absolute; left: 50%; top: 10px; width: 78px; height: 104px; margin-left: ${-39 + x}px; transform: rotate(${rot}deg); z-index: ${z}; border-radius: 12px; background: #FFFFFF; border: 1px solid ${LINE}; box-shadow: 0 10px 18px -10px rgba(20,60,38,.5); display: flex; align-items: center; justify-content: center">${tile(name, 46, tint)}</div>`;

const stallDeck = (s) => {
  const stack = s.open ? `box-shadow: 4px 4px 0 -1px #FFFFFF, 4px 4px 0 0 ${LINE}, 8px 8px 0 -1px #FFFFFF, 8px 8px 0 0 ${LINE}` : "";
  return `
  <a href="#" aria-label="${s.name}, ${s.status}, ${s.dishes} dishes, ${s.queue}" style="display: block; position: relative; padding: 12px; border-radius: 16px; border: 1px solid ${LINE}; background: #FFFFFF; text-decoration: none; color: inherit; ${stack}; ${s.open ? "" : "opacity: .62"}">
    <div style="display: flex; align-items: center; justify-content: space-between">${tile(s.name, 32, s.tint, "10px")}${statusDot(s)}</div>
    <div style="margin-top: 6px; font-family: ${SERIF}; font-size: 17px; line-height: 1.15; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${s.name}</div>
    <div style="margin-top: 2px; font-size: 12px; color: ${MUTED}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${s.dishes} dishes · ${s.queue}</div>
  </a>`;
};

const home = frame(`
  ${band(`${topRow(logo)}${bigTitle("Can't decide?", "3 stalls open now · 605 dishes to try")}`, "14px 20px 22px")}
  ${sheet(`
    <section aria-label="Deal me a hand" style="position: relative; border-radius: 20px; background: ${GREEN}; color: #FFFFFF; padding: 16px 16px 16px; overflow: hidden">
      <div style="display: flex; gap: 12px; align-items: center">
        <div style="flex: 1; min-width: 0">
          <div style="${upper}; color: ${ON_DECK}">Deal me a hand</div>
          <div style="margin-top: 6px; font-family: ${SERIF}; font-size: 22px; line-height: 1.15">10 dishes, one at a time. Keep what looks good.</div>
        </div>
        <div style="position: relative; width: 120px; height: 124px; flex-shrink: 0">
          ${miniCard("Veg Kurkure Momos", "#F6EBD9", -12, -22, 1)}${miniCard("Paneer Kulcha", "#E6ECF5", 10, 22, 2)}${miniCard("Paneer Makhani Roll", "#E3EFE6", 0, 0, 3)}
        </div>
      </div>
      ${chipRow([["Veg only", true], ["Under ₹150", true], ["Food & drinks", false]].map(([l, on]) => chip(l, { on, dark: true })).join(""), "margin-top: 14px")}
      <button type="button" style="margin-top: 12px; width: 100%; height: 52px; border-radius: 999px; border: 0; background: #FFFFFF; color: ${GREEN}; font-size: 16px; font-weight: 600">Deal me 10 dishes</button>
    </section>
    <div style="margin-top: 16px">${sectionTitle("Or pick a stall's deck", "4 on campus")}</div>
    <div style="display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 14px 16px; padding-right: 8px">${STALLS.map(stallDeck).join("")}</div>
    <a href="#" style="display: flex; align-items: center; gap: 10px; min-height: 48px; margin-top: 12px; padding: 0 14px; border-radius: 14px; background: ${MINT}; color: ${MINT_INK}; text-decoration: none; font-size: 14px"><span style="font-weight: 600; flex-shrink: 0">Mess lunch</span><span style="flex: 1; min-width: 0; color: ${INK}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${MESS_TODAY.dishes}</span>${chevron()}</a>
  `)}`);

// ---- 2 · Dealing ---------------------------------------------------------------
const progress = (n, of) => `<div aria-label="Card ${n} of ${of}" style="display: flex; gap: 4px; margin-top: 14px">${Array.from({ length: of }, (_, i) => `<span style="flex: 1; height: 4px; border-radius: 999px; background: ${i < n ? "#FFFFFF" : "rgba(255,255,255,.22)"}"></span>`).join("")}</div>`;

const dealing = frame(`
  ${band(`${topRow(backLink("Home"), 0)}
    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 8px"><span style="font-family: ${SERIF}; font-size: 24px">Card 4 of 10</span><span style="font-size: 13px; color: ${ON_DECK}">Veg · under ₹150 · 2 kept</span></div>
    ${progress(4, 10)}`)}
  ${sheet(`
    <div style="position: relative; height: 468px; margin-top: 8px">
      ${dishCard(deal[1], { blank: true, rot: 6, x: 14, y: 8, z: 1, tint: "#F6EBD9" })}
      ${dishCard(deal[2], { blank: true, rot: -4, x: -10, y: 4, z: 2, tint: "#E6ECF5" })}
      ${dishCard(deal[0], { z: 3 })}
    </div>
    <div style="display: flex; align-items: flex-start; justify-content: center; gap: 22px; margin-top: 4px">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 12px; color: ${MUTED}">${roundBtn("Undo last card", undoGlyph, { size: 48 })}Undo</div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 12px; color: ${MUTED}">${roundBtn("Skip this dish", xGlyph)}Skip</div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: ${GREEN}">${roundBtn("Keep this dish", keepGlyph, { primary: true })}Keep</div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 12px; color: ${MUTED}"><button type="button" aria-label="Add Paneer Makhani Roll to bag now" style="width: 48px; height: 48px; border-radius: 999px; border: 1.5px solid #DCE2DB; background: #FFFFFF; font-size: 22px; color: ${INK}">+</button>Bag it</div>
    </div>
    <p style="margin: 16px 0 0; text-align: center; font-size: 13px; color: ${MUTED}">Swipe right to keep, left to skip</p>
  `, "padding-top: 22px")}`, { tabBar: false });

// ---- 3 · Your hand --------------------------------------------------------------
const kept = [
  { ...deal[0], qty: 1 },
  dish("SnapEats", "Street Flavours", "Chole Bhature"),
  dish("SnapEats", "Dimsums & Cigar Spring Rolls", "Paneer Momos (8 Pcs) (Fried)"),
  dish("House of Chow", "Wraps", "Chilli Paneer Wrap"),
  dish("Paid Mess", "Amritsari Kulcha Combo", "Paneer Kulcha (Single)"),
];
const fanCard = (d, i, n) => {
  const s = stallOf(d.stall);
  const mid = (n - 1) / 2;
  return `<div aria-hidden="true" style="position: absolute; left: 50%; top: ${Math.abs(i - mid) * 6}px; width: 74px; height: 100px; margin-left: ${-37 + (i - mid) * 52}px; transform: rotate(${(i - mid) * 7}deg); z-index: ${i}; border-radius: 12px; background: #FFFFFF; border: 1px solid ${LINE}; box-shadow: 0 10px 18px -10px rgba(0,0,0,.45); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px">${tile(d.name, 40, s.tint)}<span style="font-size: 11px; font-weight: 600; color: ${INK}">₹${d.price}</span></div>`;
};
const byStall = {};
for (const d of kept) (byStall[d.stall] ??= []).push(d);

const hand = frame(`
  ${band(`${topRow(backLink("Keep dealing"), 1)}
    <div style="position: relative; height: 118px; margin-top: 6px">${kept.map((d, i) => fanCard(d, i, kept.length)).join("")}</div>
    <div style="text-align: center"><span style="font-family: ${SERIF}; font-size: 26px">Your hand</span><div style="font-size: 13px; color: ${ON_DECK}">5 kept from 10 cards · 3 stalls</div></div>`, "14px 20px 18px")}
  ${sheet(`
    <p style="margin: 0 0 12px; padding: 10px 12px; border-radius: 12px; background: ${MINT}; color: ${MINT_INK}; font-size: 13px">3 of your picks are at SnapEats, so one pickup covers them.</p>
    ${Object.entries(byStall).map(([stall, ds]) => `
      <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 6px"><span style="${upper}; color: ${MUTED}">${stall}</span><span style="font-size: 12px; color: ${MUTED}">${stallOf(stall).queue}</span></div>
      ${ds.map((d) => dishRow(d, { qty: d.qty ?? 0, sub: d.category })).join("")}`).join("")}
  `, "padding-top: 16px")}
  ${bagPill(1, deal[0].price)}`);

// ---- 4 · Stall as decks -----------------------------------------------------------
const chow = MENUS["House of Chow"];
const DRINKS = ["Chai Pe Charcha", "Shakes", "Exotic Shakes", "Coolers", "Mojitos"];
const foodCats = chow.categories.filter((c) => !DRINKS.includes(c.name));
const catDeck = (c, tint) => `
  <a href="#" aria-label="${c.name}, ${c.count} dishes" style="display: block; position: relative; min-height: 92px; box-sizing: border-box; padding: 10px 12px; border-radius: 14px; background: #FFFFFF; border: 1px solid ${LINE}; text-decoration: none; color: inherit; box-shadow: 3px 3px 0 -1px #FFFFFF, 3px 3px 0 0 ${LINE}, 6px 6px 0 -1px ${tint}, 6px 6px 0 0 ${LINE}">
    <div style="font-size: 14px; font-weight: 600; line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden">${c.name}</div>
    <div style="margin-top: 4px; font-size: 12px; color: ${MINT_INK}; font-weight: 600">${c.count} dishes <span style="font-weight: 400; color: ${MUTED}">· ${priceRange(c.items)}</span></div>
    <div style="margin-top: 5px; font-size: 12px; line-height: 1.35; color: ${MUTED}; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden">${kinds(c.items).slice(0, 3).join(", ")}</div>
  </a>`;

const stallPage = frame(`
  ${band(`${topRow(backLink("Home"), 1)}${bigTitle("House of Chow", "Open till 9 pm · No queue · 230 dishes in 25 decks")}
    <div style="display: flex; gap: 8px; margin-top: 14px">
      <button type="button" style="height: 44px; padding: 0 16px; border-radius: 999px; border: 0; background: #FFFFFF; color: ${GREEN}; font-size: 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px">${keepGlyph.replace('width="28" height="28"', 'width="16" height="16"')}Deal from this stall</button>
      <button type="button" style="height: 44px; padding: 0 16px; border-radius: 999px; border: 1px solid rgba(255,255,255,.3); background: transparent; color: #FFFFFF; font-size: 14px; font-weight: 600">Search menu</button>
    </div>`)}
  ${sheet(`
    ${chipRow([chip("Food · 20 decks", { on: true }), chip("Drinks · 5"), chip("Veg")].join(""), "margin-bottom: 14px")}
    <div style="display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 14px 16px; padding-right: 6px">
      ${foodCats.slice(0, 10).map((c, i) => catDeck(c, ["#F6EBD9", "#E6ECF5", "#E3EFE6"][i % 3])).join("")}
    </div>
  `, "padding-top: 16px")}`);

// ---- 5 · A deck spread open ---------------------------------------------------------
const noodles = cat("House of Chow", "Noodles");
const nextDeck = cat("House of Chow", "Momos (8 Pcs)");
const sizes = (items) => {
  const out = {};
  for (const it of items) (out[base(it.name)] ??= { name: base(it.name), veg: it.veg, opts: [] }).opts.push({ size: (it.name.match(/\((Half|Full)\)/) ?? [])[1] ?? "One size", price: it.price });
  return Object.values(out);
};
const sizeBtn = (o, on, name) => `<button type="button" aria-label="Add ${name}, ${o.size} ₹${o.price}" style="min-width: 44px; height: 44px; padding: 0 12px; border-radius: 999px; border: 1px solid ${on ? GREEN : "#DCE2DB"}; background: ${on ? GREEN : "#FFFFFF"}; color: ${on ? "#FFFFFF" : INK}; font-size: 13px; font-weight: 600; white-space: nowrap">${o.size} ₹${o.price}</button>`;
const kindRow = (k, inBag) => `
  <div style="display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #EEF1ED">
    ${tile(k.name, 44, "#F6EBD9")}
    <div style="flex: 1; min-width: 0">
      <div style="display: flex; align-items: center; gap: 6px">${vegMark(k.veg)}<span style="font-size: 15px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${k.name}</span></div>
      <div style="display: flex; gap: 6px; margin-top: 6px">${k.opts.map((o, i) => sizeBtn(o, inBag && i === 0, k.name)).join("")}</div>
    </div>
  </div>`;
const noodleKinds = sizes(noodles.items);
const top = noodleKinds[0];

const deckOpen = frame(`
  ${band(`${topRow(backLink("House of Chow"), 2)}${bigTitle("Noodles", "Deck 3 of 25 · 18 dishes in 9 kinds · ₹85–160")}`)}
  ${sheet(`
    ${chipRow([chip("All 9 kinds", { on: true }), chip("Veg · 6"), chip("Cheapest first")].join(""), "margin-bottom: 14px")}
    <div style="display: flex; align-items: center; gap: 14px; padding: 12px 14px; border-radius: 18px; border: 1px solid ${LINE}; box-shadow: 0 14px 26px -18px rgba(20,60,38,.55)">
      <div style="position: relative; width: 56px; height: 72px; flex-shrink: 0">
        <div aria-hidden="true" style="position: absolute; inset: 0; transform: rotate(-8deg); border-radius: 10px; background: #F6EBD9"></div>
        <div style="position: absolute; inset: 0; border-radius: 10px; background: #FFFFFF; border: 1px solid ${LINE}; display: flex; align-items: center; justify-content: center">${tile(top.name, 36, "#F6EBD9")}</div>
      </div>
      <div style="flex: 1; min-width: 0"><div style="font-family: ${SERIF}; font-size: 19px; line-height: 1.15">Can't pick a noodle?</div><div style="margin-top: 2px; font-size: 12px; color: ${MUTED}">One card at a time, this deck only</div></div>
      <button type="button" style="height: 44px; padding: 0 16px; border-radius: 999px; border: 0; background: ${GREEN}; color: #FFFFFF; font-size: 14px; font-weight: 600">Deal</button>
    </div>
    <div style="margin-top: 6px">${noodleKinds.map((k, i) => kindRow(k, i === 0)).join("")}</div>
    <a href="#" style="display: flex; align-items: center; justify-content: center; gap: 4px; min-height: 44px; font-size: 14px; font-weight: 600; color: ${GREEN}; text-decoration: none">Show all 9 kinds ${chevron("down", 16)}</a>
    <a href="#" aria-label="Next deck: ${nextDeck.name}" style="display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 16px; background: ${MINT}; color: ${MINT_INK}; text-decoration: none; margin-right: 150px">
      <div style="flex: 1; min-width: 0"><div style="${upper}">Next deck</div><div style="font-size: 14px; font-weight: 600; color: ${INK}; white-space: nowrap">Momos · ${nextDeck.count}</div></div>${chevron()}
    </a>
  `, "padding-top: 16px")}
  ${bagPill(2, deal[0].price + noodles.items[0].price)}`);

export const DESIGNS = [
  { title: "1 · Home: deal or pick a stall", head, body: home },
  { title: "2 · Dealing dish cards", head, body: dealing },
  { title: "3 · Your hand of kept dishes", head, body: hand },
  { title: "4 · A stall as small decks", head, body: stallPage },
  { title: "5 · One deck spread open", head, body: deckOpen },
];
