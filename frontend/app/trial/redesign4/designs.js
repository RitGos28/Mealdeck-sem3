// How students pick a restaurant, in the live redesign's look (green band,
// white sheet): 1–2 stalls home + a stall page with pinned tabs (chosen),
// 3–4 an alternative "craving-first" home. Real dishes and prices from the
// transcribed menus. Static mockups: nothing here talks to the backend.

const GREEN = "#163D29";
const SERIF = "'DM Serif Display', Georgia, serif";
const veg = `<svg width="13" height="13" viewBox="0 0 14 14" role="img" aria-label="Vegetarian"><rect x="1" y="1" width="12" height="12" rx="2" fill="none" stroke="#1F7A3E" stroke-width="1.5"/><circle cx="7" cy="7" r="3" fill="#1F7A3E"/></svg>`;
const nonVeg = `<svg width="13" height="13" viewBox="0 0 14 14" role="img" aria-label="Non-vegetarian"><rect x="1" y="1" width="12" height="12" rx="2" fill="none" stroke="#9A3412" stroke-width="1.5"/><path d="M7 3.6L10.4 10H3.6Z" fill="#9A3412"/></svg>`;
const initials = (name) => name.replace(/[^A-Za-z ]/g, "").split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("");
const chevron = (dir = "right") => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink: 0">${dir === "down" ? '<path d="M6 9l6 6 6-6"/>' : dir === "left" ? '<path d="M15 6l-6 6 6 6"/>' : '<path d="M9 6l6 6-6 6"/>'}</svg>`;

const head = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&amp;family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
<style>body{margin:0}button,input{font:inherit}input::placeholder{color:#B9D3C1}</style>`;

const frame = (inner) => `
<div style="width: 390px; height: 844px; box-sizing: border-box; background: ${GREEN}; color: #14201A; font-family: Inter, system-ui, sans-serif; position: relative; overflow: hidden; display: flex; flex-direction: column">${inner}
  ${tabs()}
</div>`;

const tab = (label, icon, current) => `
  <a href="#" ${current ? 'aria-current="page"' : ""} style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; color: ${current ? GREEN : "#5C6B62"}; text-decoration: none; font-size: 12px; font-weight: ${current ? 600 : 500}">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg>${label}</a>`;
const tabs = () => `
  <nav aria-label="Main" style="position: absolute; left: 0; right: 0; bottom: 0; height: 72px; padding-bottom: 8px; box-sizing: border-box; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); background: #FFFFFF; border-top: 1px solid #E6EAE5; z-index: 5">
    ${tab("Menu", '<path d="M4 6h16M4 12h16M4 18h10"/>', true)}
    ${tab("My orders", '<path d="M7 3h10v18l-5-3-5 3z"/>')}
    ${tab("Account", '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>')}
  </nav>`;

const search = (placeholder = "Search dishes, drinks or stalls") => `
  <label style="display: flex; align-items: center; gap: 10px; height: 44px; padding: 0 14px; border-radius: 12px; background: rgba(255,255,255,.12); margin-top: 14px">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D6EBDC" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
    <span style="position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0)">Search</span>
    <input placeholder="${placeholder}" style="flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; font-size: 16px; color: #FFFFFF">
  </label>`;

const homeBand = `
  <div style="padding: 14px 20px 20px; color: #FFFFFF">
    <span style="font-family: ${SERIF}; font-size: 23px">MealDeck</span>
    <h1 style="margin: 12px 0 2px; font-family: ${SERIF}; font-size: 30px; line-height: 1.1; font-weight: 400">Good afternoon</h1>
    <p style="margin: 0; font-size: 14px; color: #C3DDCB">3 stalls open · mess lunch is up</p>
    ${search()}
  </div>`;

const sheet = (inner, extra = "") => `
  <main style="flex: 1; overflow: hidden; background: #FFFFFF; border-radius: 24px 24px 0 0; padding: 18px 20px 96px; ${extra}">${inner}</main>`;

const sectionTitle = (text, aside = "") => `
  <div style="display: flex; align-items: baseline; justify-content: space-between; margin: 0 0 10px">
    <h2 style="margin: 0; font-family: ${SERIF}; font-size: 20px; font-weight: 400">${text}</h2>${aside}
  </div>`;

const messCard = `
  <div style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 16px; background: #E3EFE6; margin-bottom: 16px">
    <div style="flex: 1; min-width: 0">
      <div style="font-size: 12px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: #1F4D33">Mess today · Lunch</div>
      <div style="margin-top: 3px; font-size: 14px; color: #14201A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">Rajma, jeera rice, aloo gobi, roti, salad</div>
      <div style="margin-top: 2px; font-size: 12px; color: #3E5A48">₹70 for day scholars · free for hostellers</div>
    </div>
    <span style="color: #1F4D33">${chevron()}</span>
  </div>`;

const againCard = (name, price) => `
  <div style="flex-shrink: 0; width: 200px; display: flex; align-items: center; gap: 10px; padding: 8px 6px 8px 8px; border-radius: 14px; border: 1px solid #E6EAE5">
    <div style="width: 36px; height: 36px; flex-shrink: 0; border-radius: 999px; background: #E3EFE6; color: #1F4D33; display: flex; align-items: center; justify-content: center; font-family: ${SERIF}; font-size: 14px">${initials(name)}</div>
    <div style="flex: 1; min-width: 0"><div style="font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${name}</div><div style="font-size: 12px; color: #5C6B62">₹${price}</div></div>
    <button type="button" aria-label="Add ${name} again" style="width: 36px; height: 36px; flex-shrink: 0; border: 0; border-radius: 999px; background: ${GREEN}; color: #FFFFFF; font-size: 18px">+</button>
  </div>`;

const stallCard = ({ name, status, statusInk, meta, cats, tile }) => `
  <a href="#" style="display: flex; align-items: center; gap: 14px; padding: 12px; border-radius: 16px; border: 1px solid #E6EAE5; text-decoration: none; color: #14201A">
    <div style="width: 52px; height: 52px; flex-shrink: 0; border-radius: 14px; background: ${tile}; color: #1F4D33; display: flex; align-items: center; justify-content: center; font-family: ${SERIF}; font-size: 20px">${initials(name)}</div>
    <div style="flex: 1; min-width: 0">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px">
        <span style="font-family: ${SERIF}; font-size: 18px">${name}</span>
        <span style="display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: ${statusInk}"><span style="width: 7px; height: 7px; border-radius: 999px; background: ${statusInk}"></span>${status}</span>
      </div>
      <div style="margin-top: 2px; font-size: 13px; color: #5C6B62">${meta}</div>
      <div style="margin-top: 2px; font-size: 12px; color: #8A968F; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${cats}</div>
    </div>
  </a>`;

const STALLS = [
  { name: "SnapEats", status: "Open", statusInk: "#1F6B43", meta: "146 dishes · 1 in queue", cats: "Combos · Cold beverages · Snacks · Tandoori", tile: "#E3EFE6" },
  { name: "House of Chow", status: "Open", statusInk: "#1F6B43", meta: "230 dishes · no queue", cats: "Chinese · Noodles · Momos · Shakes", tile: "#F6EBD9" },
  { name: "Paid Mess", status: "Open", statusInk: "#1F6B43", meta: "231 dishes · 3 in queue", cats: "North Indian · Tandoori · Biryani · Rolls", tile: "#E6ECF5" },
  { name: "Quench", status: "Paused", statusInk: "#9A5B13", meta: "Busy right now · back soon", cats: "Shakes · Juices · Sodas", tile: "#F1F2F0" },
];

// 1 — Stalls home.
const stallsHome = frame(`${homeBand}${sheet(`
  ${messCard}
  ${sectionTitle("Order again")}
  <div style="display: flex; gap: 8px; margin: 0 -20px 18px; padding: 0 20px; overflow: hidden">${againCard("Veg Kathi Roll", 99)}${againCard("Cold Coffee", 85)}</div>
  ${sectionTitle("Stalls", '<span style="font-size: 13px; color: #5C6B62">4 on campus</span>')}
  <div style="display: flex; flex-direction: column; gap: 8px">${STALLS.map(stallCard).join("")}</div>
`)}`);

// 2 — Stall page: pinned tabs, folded categories.
const stallTab = (label, on) => `<button type="button" role="tab" aria-selected="${on}" style="flex-shrink: 0; height: 36px; padding: 0 14px; border-radius: 999px; border: 1px solid ${on ? GREEN : "#DCE2DB"}; background: ${on ? GREEN : "#FFFFFF"}; color: ${on ? "#FFFFFF" : "#14201A"}; font-size: 14px; font-weight: 600; white-space: nowrap">${label}</button>`;
const folded = (name, count) => `
  <div style="display: flex; align-items: center; justify-content: space-between; min-height: 48px; border-bottom: 1px solid #EEF1ED">
    <span style="font-size: 15px; font-weight: 600">${name}</span><span style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #5C6B62">${count}${chevron()}</span>
  </div>`;
const row = (name, price, isVeg = true, qty = 0) => `
  <div style="display: flex; align-items: center; gap: 12px; padding: 9px 0; border-bottom: 1px solid #EEF1ED">
    <div style="width: 44px; height: 44px; flex-shrink: 0; border-radius: 999px; background: #E3EFE6; color: #1F4D33; display: flex; align-items: center; justify-content: center; font-family: ${SERIF}; font-size: 15px">${initials(name)}</div>
    <div style="flex: 1; min-width: 0"><div style="display: flex; align-items: center; gap: 6px">${isVeg ? veg : nonVeg}<span style="font-size: 15px; font-weight: 500">${name}</span></div><div style="margin-top: 2px; font-size: 14px; color: #5C6B62">₹${price}</div></div>
    ${qty ? `<div style="display: flex; align-items: center; height: 38px; border-radius: 999px; border: 1px solid ${GREEN}; color: ${GREEN}"><span style="width: 32px; text-align: center; font-size: 18px">−</span><span style="min-width: 12px; text-align: center; font-size: 14px; font-weight: 600">${qty}</span><span style="width: 32px; text-align: center; font-size: 18px">+</span></div>`
          : `<button type="button" aria-label="Add ${name}" style="width: 38px; height: 38px; border-radius: 999px; border: 1px solid #DCE2DB; background: #FFFFFF; font-size: 18px">+</button>`}
  </div>`;
const stallPage = frame(`
  <div style="padding: 14px 20px 18px; color: #FFFFFF">
    <div style="display: flex; align-items: center; gap: 6px; font-size: 14px; color: #D6EBDC">${chevron("left")}All stalls</div>
    <div style="display: flex; align-items: flex-end; justify-content: space-between; margin-top: 10px">
      <div><h1 style="margin: 0; font-family: ${SERIF}; font-size: 30px; font-weight: 400; line-height: 1.1">SnapEats</h1><p style="margin: 2px 0 0; font-size: 14px; color: #C3DDCB">Open till 10 pm · 1 in queue · 146 dishes</p></div>
    </div>
    ${search("Search SnapEats")}
  </div>
  ${sheet(`
    <div role="tablist" aria-label="Stalls" style="display: flex; gap: 6px; margin: -4px -20px 12px; padding: 0 20px 10px; overflow: hidden; border-bottom: 1px solid #E6EAE5">
      ${stallTab("SnapEats", true)}${stallTab("House of Chow")}${stallTab("Paid Mess")}${stallTab("Quench")}
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px">
      <div style="display: flex; padding: 3px; border-radius: 999px; background: #F0F3EF; font-size: 13px"><span style="padding: 7px 12px; border-radius: 999px; background: #FFFFFF; font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,.1)">All</span><span style="padding: 7px 12px; color: #5C6B62">Food</span><span style="padding: 7px 12px; color: #5C6B62">Drinks</span></div>
      <span style="font-size: 13px; color: #5C6B62">Sort: Relevance ▾</span>
    </div>
    ${folded("Hot Beverages", 3)}${folded("Chai Nagri", 4)}
    <div style="display: flex; align-items: center; justify-content: space-between; min-height: 48px; border-bottom: 1px solid #EEF1ED"><span style="font-size: 15px; font-weight: 600">Veg Kathi Rolls</span><span style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #5C6B62">8${chevron("down")}</span></div>
    ${row("Veg Kathi Roll", 99, true, 1)}${row("Paneer Tikka Roll", 129)}${row("Aloo Tikki Roll", 89)}
    ${folded("Non Veg Kathi Rolls", 8)}
  `)}
  <a href="#" aria-label="Bag" style="position: absolute; right: 16px; bottom: 86px; height: 52px; padding: 0 18px 0 14px; border-radius: 999px; background: ${GREEN}; color: #FFFFFF; text-decoration: none; display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; box-shadow: 0 12px 28px -10px rgba(20,60,38,.6); z-index: 6">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>1 · ₹99</a>`);

// 3 — Alternative: craving-first home.
const CRAVINGS = [["Rolls", "#F6EBD9", "3 stalls"], ["Momos", "#E3EFE6", "3 stalls"], ["Chinese", "#FBE7E1", "2 stalls"], ["Biryani", "#F3ECD8", "2 stalls"], ["Shakes", "#E6ECF5", "3 stalls"], ["Chai & coffee", "#EFE7DF", "3 stalls"], ["Sandwiches", "#EAF0E2", "2 stalls"], ["Tandoori", "#F7E3DC", "3 stalls"]];
const craving = ([name, bg, sub]) => `
  <a href="#" style="display: flex; flex-direction: column; justify-content: flex-end; height: 74px; padding: 10px 12px; border-radius: 16px; background: ${bg}; text-decoration: none; color: #14201A; box-sizing: border-box">
    <span style="font-family: ${SERIF}; font-size: 18px; line-height: 1.1">${name}</span><span style="font-size: 12px; color: #5C6B62">${sub}</span>
  </a>`;
const miniStall = (s) => `
  <a href="#" style="flex-shrink: 0; width: 150px; padding: 10px 12px; border-radius: 14px; border: 1px solid #E6EAE5; text-decoration: none; color: #14201A">
    <div style="font-family: ${SERIF}; font-size: 16px">${s.name}</div>
    <div style="display: flex; align-items: center; gap: 5px; margin-top: 3px; font-size: 12px; font-weight: 600; color: ${s.statusInk}"><span style="width: 6px; height: 6px; border-radius: 999px; background: ${s.statusInk}"></span>${s.status}</div>
    <div style="margin-top: 2px; font-size: 12px; color: #5C6B62">${s.meta.split(" · ")[0]}</div>
  </a>`;
const cravingHome = frame(`${homeBand}${sheet(`
  ${messCard}
  ${sectionTitle("What are you craving?")}
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 18px">${CRAVINGS.map(craving).join("")}</div>
  ${sectionTitle("Stalls", '<span style="font-size: 13px; color: #5C6B62">See all ›</span>')}
  <div style="display: flex; gap: 8px; margin: 0 -20px; padding: 0 20px; overflow: hidden">${STALLS.map(miniStall).join("")}</div>
`)}`);

// 4 — A craving opened: momos from every stall, cheapest first.
const offer = (stall, name, price, isVeg, note) => `
  <div style="display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #EEF1ED">
    <div style="flex: 1; min-width: 0">
      <div style="display: flex; align-items: center; gap: 6px">${isVeg ? veg : nonVeg}<span style="font-size: 15px; font-weight: 500">${name}</span></div>
      <div style="margin-top: 2px; font-size: 13px; color: #5C6B62">${stall}${note ? ` · ${note}` : ""}</div>
    </div>
    <span style="font-size: 15px; font-weight: 600">₹${price}</span>
    <button type="button" aria-label="Add ${name} from ${stall}" style="width: 38px; height: 38px; border-radius: 999px; border: 1px solid #DCE2DB; background: #FFFFFF; font-size: 18px">+</button>
  </div>`;
const cravingOpen = frame(`
  <div style="padding: 14px 20px 18px; color: #FFFFFF">
    <div style="display: flex; align-items: center; gap: 6px; font-size: 14px; color: #D6EBDC">${chevron("left")}Home</div>
    <h1 style="margin: 10px 0 2px; font-family: ${SERIF}; font-size: 30px; font-weight: 400; line-height: 1.1">Momos</h1>
    <p style="margin: 0; font-size: 14px; color: #C3DDCB">20 options at 3 stalls · cheapest first</p>
    <div style="display: flex; gap: 6px; margin-top: 14px">
      ${["Veg", "Chicken", "Steamed", "Fried / Kurkure"].map((c, i) => `<span style="height: 34px; padding: 0 12px; border-radius: 999px; border: 1px solid ${i === 0 ? "#FFFFFF" : "rgba(255,255,255,.25)"}; background: ${i === 0 ? "#FFFFFF" : "transparent"}; color: ${i === 0 ? GREEN : "#FFFFFF"}; font-size: 13px; font-weight: 600; display: flex; align-items: center; white-space: nowrap">${c}</span>`).join("")}
    </div>
  </div>
  ${sheet(`
    ${offer("Paid Mess", "Veg Momos, Steamed", 70, true, "4 pcs")}
    ${offer("House of Chow", "Veg Steam Momos", 95, true, "8 pcs · no queue")}
    ${offer("SnapEats", "Veg Momos, Steamed", 99, true, "8 pcs")}
    ${offer("SnapEats", "Veg Momos, Fried", 119, true, "8 pcs")}
    ${offer("House of Chow", "Veg Kurkure Momos", 120, true, "8 pcs")}
    ${offer("Paid Mess", "Veg Momos, Steamed", 130, true, "8 pcs · 3 in queue")}
    ${offer("Paid Mess", "Veg Momos, Tandoori", 150, true, "8 pcs")}
  `)}`);

export const DESIGNS = [
  { title: "1 · Stalls home", head, body: stallsHome },
  { title: "2 · Stall page with tabs", head, body: stallPage },
  { title: "3 · Alternative: craving-first home", head, body: cravingHome },
  { title: "4 · Alternative: a craving opened", head, body: cravingOpen },
];
