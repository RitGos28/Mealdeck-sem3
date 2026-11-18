// Combined direction from the redesign1 options: overall look of 7 (green
// band, white sheet), a compact version of 9's pickup picker, 8's "Order
// again", and 10's bottom tabs, round bag button and All/Veg toggle.
// Static mockup with sample data: nothing here talks to the backend.

const GREEN = "#163D29";
const veg = `<svg width="14" height="14" viewBox="0 0 14 14" role="img" aria-label="Vegetarian"><rect x="1" y="1" width="12" height="12" rx="2" fill="none" stroke="#1F7A3E" stroke-width="1.5"/><circle cx="7" cy="7" r="3" fill="#1F7A3E"/></svg>`;
const nonVeg = `<svg width="14" height="14" viewBox="0 0 14 14" role="img" aria-label="Non-vegetarian"><rect x="1" y="1" width="12" height="12" rx="2" fill="none" stroke="#9A3412" stroke-width="1.5"/><path d="M7 3.6L10.4 10H3.6Z" fill="#9A3412"/></svg>`;
const initials = (name) => name.split(" ").map((w) => w[0]).slice(0, 2).join("");

const slot = (time, note, { on, full } = {}) => `
  <button type="button" role="radio" aria-checked="${!!on}" style="flex-shrink: 0; height: 38px; padding: 0 12px; border-radius: 999px; border: 1px solid ${on ? "#FFFFFF" : "rgba(255,255,255,.22)"}; background: ${on ? "#FFFFFF" : "transparent"}; color: ${on ? GREEN : full ? "rgba(255,255,255,.4)" : "#FFFFFF"}; display: flex; align-items: center; gap: 6px; white-space: nowrap">
    <span style="font-size: 14px; font-weight: 600">${time}</span><span style="font-size: 12px; opacity: .75">${note}</span>
  </button>`;

const again = (name, price) => `
  <div style="flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; padding: 8px 6px 8px 8px; border-radius: 14px; border: 1px solid #E6EAE5">
    <div style="width: 38px; height: 38px; flex-shrink: 0; border-radius: 999px; background: #E3EFE6; color: #1F4D33; display: flex; align-items: center; justify-content: center; font-family: 'DM Serif Display', Georgia, serif; font-size: 15px">${initials(name)}</div>
    <div style="flex: 1; min-width: 0">
      <div style="font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${name}</div>
      <div style="font-size: 12px; color: #5C6B62">₹${price}</div>
    </div>
    <button type="button" aria-label="Add ${name} again" style="width: 40px; height: 40px; flex-shrink: 0; border: 0; border-radius: 999px; background: ${GREEN}; color: #FFFFFF; font-size: 20px">+</button>
  </div>`;

const item = ({ name, price, isVeg = true, qty = 0, soldOut = false }) => `
  <div style="display: flex; align-items: center; gap: 14px; padding: 10px 0; border-bottom: 1px solid #EEF1ED">
    <div style="width: 50px; height: 50px; flex-shrink: 0; border-radius: 999px; background: #E3EFE6; color: #1F4D33; display: flex; align-items: center; justify-content: center; font-family: 'DM Serif Display', Georgia, serif; font-size: 18px; opacity: ${soldOut ? 0.5 : 1}">${initials(name)}</div>
    <div style="flex: 1; min-width: 0">
      <div style="display: flex; align-items: center; gap: 6px">${isVeg ? veg : nonVeg}<span style="font-size: 15px; font-weight: 500; color: ${soldOut ? "#6B756F" : "#14201A"}">${name}</span></div>
      <div style="margin-top: 2px; font-size: 14px; color: #5C6B62">${soldOut ? "Sold out today" : "₹" + price}</div>
    </div>
    ${soldOut ? "" : qty
      ? `<div style="display: flex; align-items: center; height: 40px; border-radius: 999px; border: 1px solid ${GREEN}; color: ${GREEN}">
          <button type="button" aria-label="Remove one" style="width: 36px; height: 40px; border: 0; background: transparent; color: inherit; font-size: 18px">−</button>
          <span style="min-width: 14px; text-align: center; font-size: 14px; font-weight: 600">${qty}</span>
          <button type="button" aria-label="Add one" style="width: 36px; height: 40px; border: 0; background: transparent; color: inherit; font-size: 18px">+</button>
        </div>`
      : `<button type="button" aria-label="Add ${name}" style="width: 40px; height: 40px; border-radius: 999px; border: 1px solid #DCE2DB; background: #FFFFFF; color: #14201A; font-size: 20px">+</button>`}
  </div>`;

const stall = (name, meta, items) => `
  <section style="margin-top: 22px">
    <div style="display: flex; align-items: baseline; justify-content: space-between">
      <h2 style="margin: 0; font-family: 'DM Serif Display', Georgia, serif; font-size: 22px; font-weight: 400">${name}</h2>
      <span style="font-size: 13px; color: #5C6B62">${meta}</span>
    </div>
    ${items.map(item).join("")}
  </section>`;

const tab = (label, icon, current) => `
  <a href="#" ${current ? 'aria-current="page"' : ""} style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; color: ${current ? GREEN : "#5C6B62"}; text-decoration: none; font-size: 12px; font-weight: ${current ? 600 : 500}">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg>${label}</a>`;

const body = `
<div style="width: 390px; height: 844px; box-sizing: border-box; background: ${GREEN}; color: #14201A; font-family: Inter, system-ui, sans-serif; position: relative; overflow: hidden; display: flex; flex-direction: column">
  <div style="padding: 14px 20px 22px; color: #FFFFFF">
    <div style="display: flex; align-items: center; justify-content: space-between">
      <span style="font-family: 'DM Serif Display', Georgia, serif; font-size: 23px">MealDeck</span>
      <div role="group" aria-label="Diet" style="display: flex; padding: 3px; border-radius: 999px; background: rgba(255,255,255,.12)">
        <button type="button" aria-pressed="true" style="height: 32px; padding: 0 14px; border: 0; border-radius: 999px; background: #FFFFFF; color: ${GREEN}; font-size: 13px; font-weight: 600">All</button>
        <button type="button" aria-pressed="false" style="height: 32px; padding: 0 14px; border: 0; border-radius: 999px; background: transparent; color: #D6EBDC; font-size: 13px; font-weight: 500">Veg</button>
      </div>
    </div>
    <h1 style="margin: 14px 0 2px; font-family: 'DM Serif Display', Georgia, serif; font-size: 30px; line-height: 1.1; font-weight: 400">Good afternoon</h1>
    <p style="margin: 0; font-size: 14px; color: #C3DDCB">4 stalls open · pick up between classes</p>
    <label style="display: flex; align-items: center; gap: 10px; height: 44px; padding: 0 14px; border-radius: 12px; background: rgba(255,255,255,.12); margin-top: 14px">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D6EBDC" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
      <span style="position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0)">Search the menu</span>
      <input placeholder="Search dishes or drinks" style="flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; font-size: 16px; color: #FFFFFF">
    </label>
    <div style="display: flex; align-items: center; gap: 10px; margin-top: 12px">
      <span style="flex-shrink: 0; font-size: 12px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: #C3DDCB">Pickup</span>
      <div role="radiogroup" aria-label="Pickup time" style="display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; margin-right: -20px; padding-right: 20px">
        ${slot("ASAP", "~10 min")}${slot("12:45", "3 left", { on: true })}${slot("1:00", "6 left")}${slot("1:15", "Full", { full: true })}
      </div>
    </div>
  </div>
  <main style="flex: 1; overflow: hidden; background: #FFFFFF; border-radius: 24px 24px 0 0; padding: 20px 20px 110px">
    <h2 style="margin: 0 0 10px; font-family: 'DM Serif Display', Georgia, serif; font-size: 20px; font-weight: 400">Order again</h2>
    <div style="display: flex; gap: 10px">${again("Masala Dosa", 70)}${again("Cold Coffee", 60)}</div>
    ${stall("South Indian Corner", "4 in queue · ~10 min", [
      { name: "Masala Dosa", price: 70, qty: 1 },
      { name: "Idli Vada", price: 55 },
      { name: "Filter Coffee", price: 25, soldOut: true },
    ])}
    ${stall("Campus Cafe", "11 in queue · ~15 min", [
      { name: "Paneer Tikka Wrap", price: 110, qty: 1 },
      { name: "Chicken Kathi Roll", price: 130, isVeg: false },
    ])}
  </main>
  <a href="#" aria-label="Bag, 2 items, ₹180" style="position: absolute; right: 20px; bottom: 92px; height: 56px; padding: 0 20px 0 16px; border-radius: 999px; background: ${GREEN}; color: #FFFFFF; text-decoration: none; display: flex; align-items: center; gap: 10px; font-size: 15px; font-weight: 600; box-shadow: 0 12px 28px -10px rgba(20,60,38,.6)">
    <span style="position: relative; display: flex">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>
      <span style="position: absolute; top: -8px; right: -10px; min-width: 20px; height: 20px; border-radius: 999px; background: #FFFFFF; color: ${GREEN}; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center">2</span>
    </span>₹180</a>
  <nav aria-label="Main" style="position: absolute; left: 0; right: 0; bottom: 0; height: 76px; padding-bottom: 10px; box-sizing: border-box; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); background: #FFFFFF; border-top: 1px solid #E6EAE5">
    ${tab("Menu", '<path d="M4 6h16M4 12h16M4 18h10"/>', true)}
    ${tab("My orders", '<path d="M7 3h10v18l-5-3-5 3z"/>')}
    ${tab("Account", '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>')}
  </nav>
</div>`;

export const DESIGNS = [{
  title: "1 · Combined (7 + 8 + 9 + 10)",
  head: `<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&amp;family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
<style>body{margin:0}button,input{font:inherit}input::placeholder{color:#B9D3C1}</style>`,
  body,
}];
