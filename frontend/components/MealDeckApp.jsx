"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MenuSection from "./menu/MenuSection";
import MenuItemCard from "./menu/MenuItemCard";
import Cart from "./cart/Cart";
import Checkout from "./checkout/Checkout";
import StudentShell from "./student/StudentShell";
import PickupChips from "./student/PickupChips";
import OrderAgain from "./student/OrderAgain";
import { bagCount, choiceText, dishFor, groupDishes, lineKey, needsSheet } from "../lib/menuDishes";

// Menu sections that are combos or meals ("Classic Indian Combos", "Veg Mini Meal", "Pick A Meal").
const COMBO = /combo|meal|thali/i;
import BagSheet from "./BagSheet";
import NotOfficial from "./layout/NotOfficial";
import CustomiseSheet from "./menu/CustomiseSheet";
import { BackLink, CravingGrid, SectionTitle, StallList, StallTabs, ViewSwitch, useStallSubtitle } from "./student/BrowseViews";
import { CRAVINGS, cravingDishes, isDrink, stallStatus } from "./student/browse";
import { DealBody, DealEntry, DealHeading, useDeal } from "./student/deal/DealView";

// The bag survives the trip to /login and back (ordering needs a login),
// but only for this tab. Storage can be unavailable (private mode, blocked
// site data), so every access is guarded and the page works without it.
const CART_KEY = "mealdeck.cart";

function loadCart() {
  try {
    return JSON.parse(sessionStorage.getItem(CART_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveCart(cart) {
  try {
    sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    // Not saved; the bag just won't survive a reload.
  }
}

const DISH_IMAGES = {
  "paneer kathi roll": "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80",
  "chicken kathi roll": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80",
  "veg sandwich": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80",
  "cold coffee": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",
  "chicken burger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
  "fresh lime soda": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
  "oreo shake": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80",
};

const DISH_IMAGE_KEYWORDS = [
  ["dosa", "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80"],
  ["idli", "https://images.unsplash.com/photo-1630409351217-bc4fa6422075?auto=format&fit=crop&w=800&q=80"],
  ["roll", "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80"],
  ["wrap", "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80"],
  ["sandwich", "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80"],
  ["burger", "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80"],
  ["fries", "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80"],
  ["coffee", "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80"],
  ["soda", "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80"],
  ["shake", "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80"],
];

// The vendor's own photo, else a stock photo matched on the dish name. No
// match gives null, so the row shows an initials tile rather than a random
// dish that might not be what's served.
function imageForDish(item) {
  if (item.image) return item.image;
  const name = item.name.trim().toLowerCase();
  if (DISH_IMAGES[name]) return DISH_IMAGES[name];
  return DISH_IMAGE_KEYWORDS.find(([keyword]) => name.includes(keyword))?.[1] ?? null;
}

// Wide screens (lg+) keep the bag in a sticky column beside the menu;
// narrower ones open it as a bottom sheet. The server snapshot says
// "desktop" so the column is in the first HTML (CSS hides it on phones)
// and the bag is only ever rendered once, so Checkout isn't doubled.
const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribeDesktop(onChange) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function useIsDesktop() {
  return useSyncExternalStore(subscribeDesktop, () => window.matchMedia(DESKTOP_QUERY).matches, () => true);
}

// "Good evening, Ritwik": the student's first name when they're logged in.
function greetingFor(user) {
  const first = user?.name?.trim().split(/\s+/)[0];
  return first ? `${greeting()}, ${first}` : greeting();
}

// Campus time of day, whatever the device's time zone.
function greeting() {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", hourCycle: "h23" }).format(new Date()));
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}

function VegToggle({ vegOnly, onChange }) {
  const option = (active) => `h-10 rounded-full px-4 text-[13px] transition-colors focus-visible:outline-white ${active ? "bg-white font-semibold text-deck" : "font-medium text-on-deck hover:text-white"}`;
  return (
    <div role="group" aria-label="Diet" className="flex rounded-full bg-white/12 p-0.5">
      <button type="button" aria-pressed={!vegOnly} onClick={() => onChange(false)} className={option(!vegOnly)}>All</button>
      <button type="button" aria-pressed={vegOnly} onClick={() => onChange(true)} className={option(vegOnly)}>Veg</button>
    </div>
  );
}

const SORTS = [["relevance", "Relevance"], ["price-asc", "Price: low to high"], ["price-desc", "Price: high to low"]];
const DIETS = [["all", "All"], ["veg", "Veg only"], ["nonveg", "Non-veg"]];
const KINDS = [["all", "Everything"], ["food", "Food"], ["drinks", "Drinks"]];


function SearchField({ value, onChange, onBand = false, placeholder = "Search dishes or drinks" }) {
  return (
    <label className={`flex h-11 items-center gap-2.5 rounded-xl px-3.5 ${onBand ? "bg-white/12 focus-within:ring-2 focus-within:ring-white" : "border border-field bg-white focus-within:border-deck focus-within:ring-2 focus-within:ring-mint"}`}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={`shrink-0 ${onBand ? "text-on-deck" : "text-muted"}`} aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
      <span className="sr-only">{placeholder}</span>
      <input type="search" className={`min-w-0 flex-1 bg-transparent text-base outline-none focus-visible:outline-none sm:text-[15px] [&::-webkit-search-cancel-button]:hidden ${onBand ? "text-white placeholder:text-[#B9D3C1]" : "text-ink placeholder:text-muted"}`} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      {value && <button type="button" className={`-mr-2 flex size-9 shrink-0 items-center justify-center rounded-full text-lg ${onBand ? "text-on-deck hover:bg-white/10 hover:text-white focus-visible:outline-white" : "text-muted hover:bg-mint hover:text-ink"}`} onClick={() => onChange("")} aria-label="Clear search">×</button>}
    </label>
  );
}

// A labelled list of options where exactly one is chosen.
function ChoiceList({ label, options, value, onChange }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-xs font-semibold tracking-[.04em] text-muted uppercase">{label}</legend>
      {options.map(([id, text]) => (
        <label key={id} className="flex min-h-8 cursor-pointer items-center gap-2.5 rounded-lg px-2 text-[13px] hover:bg-white">
          <input type="radio" name={label} value={id} checked={value === id} onChange={() => onChange(id)} className="size-4 accent-[#163D29]" />
          <span className={value === id ? "font-semibold text-ink" : "text-ink"}>{text}</span>
        </label>
      ))}
    </fieldset>
  );
}

// Wide screens only: search, pickup time, filters and the stalls, in a
// sticky column beside the menu.
function SidePanel({ greetingText, stalls, menuStalls, demoMode, openCount, search, onSearch, searchPlaceholder, diet, onDiet, kind, onKind, sort, onSort, activeStallId, onOpenStall }) {
  return (
    <aside aria-label="Filters" className="sticky top-5 max-h-[calc(100vh-2.5rem)] space-y-5 overflow-y-auto rounded-2xl bg-[#F4F6F3] p-4 text-[13px]">
      <div>
        <h1 className="font-serif text-[22px] leading-tight" suppressHydrationWarning>{greetingText}</h1>
        <p className="mt-0.5 text-muted">{openCount === 0 ? "No stalls open right now" : `${openCount} stall${openCount === 1 ? "" : "s"} open`} · pick up between classes</p>
      </div>
      <SearchField value={search} onChange={onSearch} placeholder={searchPlaceholder} />
      <div>
        <p className="mb-2 text-xs font-semibold tracking-[.04em] text-muted uppercase">Pickup time</p>
        <PickupChips stalls={stalls} variant="panel" />
        <p className="mt-2 text-xs text-muted">We pre-select this time at checkout.</p>
      </div>
      <ChoiceList label="Show" options={KINDS} value={kind} onChange={onKind} />
      <ChoiceList label="Diet" options={DIETS} value={diet} onChange={onDiet} />
      <ChoiceList label="Sort by" options={SORTS} value={sort} onChange={onSort} />
      <StallNav stalls={menuStalls} demoMode={demoMode} activeId={activeStallId} onOpen={onOpenStall} />
    </aside>
  );
}

// Wide screens only: a sticky list of stalls that opens each one's page,
// with what's happening at each.
function StallNav({ stalls, demoMode, activeId, onOpen }) {
  return (
    <nav aria-label="Stalls">
      <p className="mb-2 text-xs font-semibold tracking-[.04em] text-muted uppercase">Stalls</p>
      <ul className="space-y-1">
        {stalls.map((stall) => {
          const { label: status, live } = stallStatus(stall, demoMode);
          const active = String(stall.id) === String(activeId);
          return (
            <li key={stall.id}>
              <a href={`/?stall=${stall.id}`} aria-current={active ? "page" : undefined} onClick={(event) => { event.preventDefault(); onOpen(stall.id); }} className={`flex min-h-10 items-center justify-between gap-2 rounded-xl px-2 py-2 ${active ? "bg-white shadow-[0_1px_3px_rgba(0,0,0,.08)]" : "hover:bg-white"}`}>
                <span className="min-w-0">
                  <span className="block truncate font-serif text-[15px] leading-tight">{stall.name}</span>
                  <span className={`flex items-center gap-1.5 text-xs ${live ? "text-deck" : "text-muted"}`}>
                    <span className={`size-1.5 rounded-full ${live ? "bg-veg" : stall.ordersPaused ? "bg-danger" : "bg-field"}`} aria-hidden="true" />{status}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted">{stall.items.length}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// Which home view the student last picked, remembered on this device.
const HOME_VIEW_KEY = "mealdeck.homeView";

function loadHomeView() {
  try {
    return localStorage.getItem(HOME_VIEW_KEY) === "craving" ? "craving" : "stall";
  } catch {
    return "stall";
  }
}

function saveHomeView(view) {
  try {
    localStorage.setItem(HOME_VIEW_KEY, view);
  } catch {
    // Not remembered; it still switches for this visit.
  }
}

// One client page with four views, picked by the URL so links and the back
// button work: the stalls home (/), a stall's menu (/?stall=6), a craving
// across stalls (/?craving=momos) and the "Deal me a dish" game (/?deal=1). Staying on one page keeps the bag,
// checkout and the menu data without a reload between views.
export default function MenuExperience({ stalls, demoMode }) {
  const router = useRouter();
  const params = useSearchParams();
  const [cart, setCart] = useState({});
  const [cartLoaded, setCartLoaded] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  // The dish being customised in the sheet: { dish, stall }, or null.
  const [customising, setCustomising] = useState(null);
  const [search, setSearch] = useState("");
  const [diet, setDiet] = useState("all");
  const [sort, setSort] = useState("relevance");
  const [kind, setKind] = useState("all");
  const [homeView, setHomeView] = useState("stall");
  const navigated = useRef(false);
  const vegOnly = diet === "veg";
  const isDesktop = useIsDesktop();

  // Read after mount, not in useState: the server render has no storage.
  useEffect(() => {
    setCart(loadCart()); // eslint-disable-line react-hooks/set-state-in-effect
    setCartLoaded(true);
    setHomeView(loadHomeView());
  }, []);

  useEffect(() => {
    if (cartLoaded) saveCart(cart);
  }, [cart, cartLoaded]);

  const menuStalls = useMemo(() => stalls.map((stall) => ({
    ...stall,
    items: stall.items.map((item) => ({
      ...item,
      image: imageForDish(item),
    })),
  // Stalls taking pre-orders first (pilot launch), otherwise in their own
  // order; sort is stable, so the server's order holds within each group.
  })).sort((a, b) => Number(Boolean(a.listingOnly)) - Number(Boolean(b.listingOnly))), [stalls]);

  const activeStall = menuStalls.find((stall) => String(stall.id) === params.get("stall")) ?? null;
  const activeCraving = activeStall ? null : CRAVINGS.find((craving) => craving.id === params.get("craving")) ?? null;
  const dealing = !activeStall && !activeCraving && params.has("deal");
  const combos = !activeStall && !activeCraving && !dealing && params.has("combos");
  const view = activeStall ? "stall" : activeCraving ? "craving" : dealing ? "deal" : combos ? "combos" : "home";
  const deal = useDeal(menuStalls, demoMode);
  const stallSubtitle = useStallSubtitle(activeStall, demoMode);

  // Demo data has no hours, so every sample stall counts as open.
  const openCount = menuStalls.filter((stall) => stallStatus(stall, demoMode).live).length;

  // Bags saved before choices existed were keyed by item id alone, which
  // is still the key for a plain dish, so they load as they are.
  const cartItems = useMemo(() => Object.entries(cart).map(([key, entry]) => ({ ...entry, key })), [cart]);
  const itemCount = cartItems.reduce((count, entry) => count + entry.quantity, 0);
  const total = cartItems.reduce((sum, entry) => sum + entry.item.price * entry.quantity, 0);
  const query = search.trim().toLowerCase();
  const filtering = Boolean(query) || diet !== "all" || kind !== "all";

  const matches = (item) => (diet === "all" || (diet === "veg") === item.veg)
    && (kind === "all" || (kind === "drinks") === isDrink(item))
    && item.name.toLowerCase().includes(query);
  const order = (items) => sort === "relevance" ? items : [...items].sort((a, b) => sort === "price-asc" ? a.price - b.price : b.price - a.price);

  // Home only turns into search results once something is typed.
  const searchResults = view === "home" && query
    ? menuStalls.map((stall) => ({ ...stall, items: order(stall.items.filter(matches)) })).filter((stall) => stall.items.length > 0)
    : [];
  const stallMatches = view === "home" && query ? menuStalls.filter((stall) => stall.name.toLowerCase().includes(query)) : [];
  const stallMenu = activeStall ? { ...activeStall, items: order(filtering ? activeStall.items.filter(matches) : activeStall.items) } : null;
  const cravingList = activeCraving
    ? cravingDishes(activeCraving, menuStalls, demoMode).filter(({ item }) => matches(item)).sort((a, b) => sort === "price-desc" ? b.item.price - a.item.price : a.item.price - b.item.price)
    : [];
  const cravingStallCount = new Set(cravingList.map(({ stall }) => stall.id)).size;

  // Views change with pushState (Next keeps useSearchParams in step), so
  // the back button walks back through them. Hopping between stall tabs
  // replaces the entry instead, so back goes to wherever the tabs began.
  function go(url, { replace = false } = {}) {
    if (replace) window.history.replaceState(null, "", url);
    else {
      window.history.pushState(null, "", url);
      navigated.current = true;
    }
    setSearch("");
    window.scrollTo({ top: 0 });
  }
  const openStall = (id) => go(`/?stall=${id}`, { replace: view === "stall" });
  const openCraving = (id) => go(`/?craving=${id}`);
  const openDeal = () => go("/?deal=1");
  const openCombos = () => go("/?combos=1");

  // Combos & meals across open stalls: one row per dish (sizes grouped),
  // cheapest first, filtered like the craving list.
  const comboDishes = view === "combos"
    ? menuStalls.filter((stall) => stallStatus(stall, demoMode).live).flatMap((stall) =>
      groupDishes(stall.items.filter((item) => COMBO.test(item.category ?? "") && item.available && matches(item))).map((dish) => ({ dish, stall })))
      .sort((a, b) => Math.min(...a.dish.items.map((i) => Number(i.price))) - Math.min(...b.dish.items.map((i) => Number(i.price))))
    : [];
  function goHome() {
    if (navigated.current) {
      window.history.back();
      setSearch("");
    } else {
      go("/");
    }
  }

  function changeHomeView(next) {
    setHomeView(next);
    saveHomeView(next);
  }

  // A bag line is a dish plus its free choices: "Veg Manchurian · Gravy"
  // and "· Dry" are separate lines. Plain dishes keep the item id as key.
  function addToCart(item, stall, choices = null, quantity = 1) {
    const key = lineKey(item.id, choices, item);
    setCart((current) => ({
      ...current,
      [key]: {
        item,
        stallId: stall.id,
        stallName: stall.name,
        choices: choices && Object.keys(choices).length ? choices : null,
        choiceText: choiceText(item, choices),
        quantity: (current[key]?.quantity ?? 0) + quantity,
      },
    }));
  }

  // Every "add" goes through here: dishes with sizes or choices open the
  // customise sheet, everything else is added straight away.
  // `onAdded` runs only once the dish is really in the bag (not if the
  // customise sheet is dismissed), e.g. so the deal counts it as bagged.
  function requestAdd(dish, stall, onAdded) {
    if (needsSheet(dish)) setCustomising({ dish, stall, onAdded });
    else {
      addToCart(dish.items[0], stall);
      onAdded?.();
    }
  }
  const requestAddItem = (item, stall, onAdded) => requestAdd(dishFor(item), stall, onAdded);

  // `placed=1` makes My orders show the receipt toast once.
  function handlePlaced(orderCodes) {
    setCart({});
    setCheckingOut(false);
    setSheetOpen(false);
    router.push(`/orders?codes=${orderCodes.join(",")}&placed=1`);
  }

  function changeQuantity(itemId, change) {
    setCart((current) => {
      const entry = current[itemId];
      if (!entry) return current;
      const quantity = entry.quantity + change;
      if (quantity <= 0) {
        const { [itemId]: removed, ...remaining } = current;
        return remaining;
      }
      return { ...current, [itemId]: { ...entry, quantity } };
    });
  }

  function openBag() {
    if (isDesktop) {
      const column = document.getElementById("bag");
      column?.scrollIntoView({ block: "start" });
      column?.focus({ preventScroll: true });
    } else {
      setSheetOpen(true);
    }
  }

  function clearFilters() {
    setSearch("");
    setDiet("all");
    setKind("all");
  }

  // deletion: the account's deletion status (from StudentShell). In the
  // final hour there's no checkout; before that, no pickups past the cutoff.
  function bagContent(user, deletion) {
    const status = deletion?.status;
    return checkingOut && cartItems.length > 0 && user?.role === "STUDENT" && !status?.orderingBlocked
      ? <Checkout cartItems={cartItems} total={total} user={user} onBack={() => setCheckingOut(false)} onPlaced={handlePlaced} latestPickup={status?.orderingBlockedFrom ?? null} />
      : <Cart cartItems={cartItems} itemCount={itemCount} total={total} changeQuantity={changeQuantity} onCheckout={() => setCheckingOut(true)} demoMode={demoMode} user={user} orderingBlocked={Boolean(status?.orderingBlocked)} />;
  }

  const searchPlaceholder = activeStall ? `Search ${activeStall.name}` : activeCraving ? `Search ${activeCraving.name.toLowerCase()}` : "Search dishes, drinks or stalls";
  const heading = activeStall
    ? { back: "All stalls", title: activeStall.name, sub: stallSubtitle }
    : view === "combos"
      ? { back: "Home", title: "Combos & meals", sub: comboDishes.length === 0 ? "Nothing matches right now" : `${comboDishes.length} combos at ${new Set(comboDishes.map(({ stall }) => stall.id)).size} stalls · cheapest first` }
    : activeCraving
      ? { back: "Home", title: activeCraving.name, sub: cravingList.length === 0 ? "Nothing matches right now" : `${cravingList.length} dish${cravingList.length === 1 ? "" : "es"} at ${cravingStallCount} stall${cravingStallCount === 1 ? "" : "s"} · ${sort === "price-desc" ? "priciest" : "cheapest"} first` }
      : null;

  const band = (user) => view === "deal" ? <DealHeading deal={deal} onHome={goHome} /> : heading ? (
    <>
      <div className="mt-1.5"><BackLink label={heading.back} onClick={goHome} /></div>
      <div className="md:flex md:items-end md:justify-between md:gap-8">
        <div className="min-w-0">
          <h1 className="font-serif text-[30px] leading-[1.1] md:text-4xl">{heading.title}</h1>
          <p className="mt-0.5 text-sm text-on-deck">{heading.sub}</p>
        </div>
        <div className="mt-3.5 md:mt-0 md:w-80"><SearchField value={search} onChange={setSearch} onBand placeholder={searchPlaceholder} /></div>
      </div>
    </>
  ) : (
    <>
      <div className="mt-3.5 md:mt-6 md:flex md:items-end md:justify-between md:gap-8">
        <div>
          <h1 className="font-serif text-[30px] leading-[1.1] md:text-4xl" suppressHydrationWarning>{greetingFor(user)}</h1>
          <p className="mt-0.5 text-sm text-on-deck">
            {openCount === 0 ? "No stalls open right now" : `${openCount} stall${openCount === 1 ? "" : "s"} open`} · pick up between classes
          </p>
        </div>
        <div className="mt-3.5 md:mt-0 md:w-80"><SearchField value={search} onChange={setSearch} onBand placeholder={searchPlaceholder} /></div>
      </div>
      <PickupChips stalls={stalls} />
    </>
  );

  // Desktop has no band, so stall and craving pages head their own column.
  const desktopHeading = isDesktop && heading && (
    <div>
      <BackLink label={heading.back} onClick={goHome} onBand={false} />
      <h1 className="font-serif text-[28px] leading-tight">{heading.title}</h1>
      <p className="mt-0.5 text-sm text-muted">{heading.sub}</p>
    </div>
  );

  const showsFilters = view === "stall" || (view === "home" && query);
  const filterRow = !isDesktop && showsFilters && (
    <div className="flex items-center justify-between gap-3">
      <div role="group" aria-label="Show" className="flex rounded-full bg-[#F0F3EF] p-0.5">
        {KINDS.map(([id, text]) => (
          <button key={id} type="button" aria-pressed={kind === id} onClick={() => setKind(id)} className={`h-9 rounded-full px-3 text-[13px] transition-colors ${kind === id ? "bg-white font-semibold text-ink shadow-[0_1px_3px_rgba(0,0,0,.1)]" : "font-medium text-muted hover:text-ink"}`}>{id === "all" ? "All" : text}</button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm text-muted">
        <span className="sr-only">Sort</span>
        <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-10 rounded-full border border-field bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-deck">
          {SORTS.map(([id, text]) => <option key={id} value={id}>{text}</option>)}
        </select>
      </label>
    </div>
  );

  const noMatches = (message) => (
    <div className="rounded-2xl border border-dashed border-field px-6 py-12 text-center">
      <p className="font-serif text-xl">No dishes found</p>
      <p className="mt-1 text-sm text-muted">{message}</p>
      <button type="button" className="mt-3 h-11 rounded-full px-4 text-sm font-semibold text-deck underline underline-offset-4 hover:bg-mint" onClick={clearFilters}>Show everything</button>
    </div>
  );

  function content(user) {
    if (view === "deal") {
      return (
        <>
          {isDesktop && <div className="max-w-md"><DealHeading deal={deal} onHome={goHome} onBand={false} /></div>}
          <div className="max-w-md lg:max-w-xl">
            <DealBody deal={deal} demoMode={demoMode} cart={cart} onAdd={requestAddItem} onChangeQuantity={changeQuantity} onHome={goHome} />
          </div>
        </>
      );
    }
    if (view === "stall") {
      return (
        <>
          {!isDesktop && <StallTabs stalls={menuStalls} activeId={activeStall.id} onOpen={openStall} />}
          {desktopHeading}
          {activeStall.listingOnly && (
            <p className="rounded-2xl bg-[#F0F2EF] px-4 py-3 text-sm text-ink">
              <strong>{activeStall.name} isn&apos;t taking pre-orders on MealDeck yet.</strong> Here&apos;s the menu so you can decide; order at the counter for now.
            </p>
          )}
          {filterRow}
          {stallMenu.items.length > 0
            ? <MenuSection key={activeStall.id} stall={stallMenu} demoMode={demoMode} cart={cart} onAddToCart={requestAdd} onChangeQuantity={changeQuantity} expandAll={filtering} isDesktop={isDesktop} bare />
            : noMatches(query ? `Nothing at ${activeStall.name} matches "${search.trim()}".` : "Nothing on this menu matches those filters.")}
        </>
      );
    }
    if (view === "combos") {
      return (
        <>
          {desktopHeading}
          {comboDishes.length > 0 ? (
            <ul className="grid grid-cols-1 md:grid-cols-2 md:gap-x-8 lg:grid-cols-[repeat(auto-fill,minmax(172px,1fr))] lg:gap-3">
              {comboDishes.map(({ dish, stall }) => (
                <li key={`${stall.id}|${dish.key}`}>
                  <MenuItemCard dish={dish} demoMode={demoMode} sub={`${stall.name} · ${dish.category}`} quantity={bagCount(cart, dish)} onAddToCart={() => requestAdd(dish, stall)} onChangeQuantity={(delta) => changeQuantity(dish.items[0].id, delta)} />
                </li>
              ))}
            </ul>
          ) : noMatches("No combos match those filters right now.")}
        </>
      );
    }
    if (view === "craving") {
      return (
        <>
          {desktopHeading}
          {cravingList.length > 0 ? (
            <ul className="grid grid-cols-1 md:grid-cols-2 md:gap-x-8 lg:grid-cols-[repeat(auto-fill,minmax(172px,1fr))] lg:gap-3">
              {cravingList.map(({ item, stall }) => (
                <li key={item.id}>
                  <MenuItemCard item={item} demoMode={demoMode} sub={stall.name} browseOnly={stall.listingOnly} dish={dishFor(item)} quantity={bagCount(cart, dishFor(item))} onAddToCart={() => requestAddItem(item, stall)} onChangeQuantity={(delta) => changeQuantity(item.id, delta)} />
                </li>
              ))}
            </ul>
          ) : noMatches("Try the other filters, or another craving.")}
        </>
      );
    }
    if (query) {
      const dishCount = searchResults.reduce((count, stall) => count + stall.items.length, 0);
      return (
        <>
          {filterRow}
          <p className="text-sm text-muted">{dishCount} dish{dishCount === 1 ? "" : "es"} at {searchResults.length} stall{searchResults.length === 1 ? "" : "s"}</p>
          {stallMatches.length > 0 && <StallList stalls={stallMatches} demoMode={demoMode} onOpen={openStall} />}
          {searchResults.length > 0
            ? <div>{searchResults.map((stall) => <MenuSection key={stall.id} stall={stall} demoMode={demoMode} cart={cart} onAddToCart={requestAdd} onChangeQuantity={changeQuantity} expandAll isDesktop={isDesktop} />)}</div>
            : stallMatches.length === 0 && noMatches("Try another search, or browse every stall.")}
        </>
      );
    }
    return (
      <>
        <ViewSwitch view={homeView} onChange={changeHomeView} />
        {demoMode && <p className="rounded-2xl bg-mint px-4 py-3 text-sm text-mint-ink">Showing sample menu data. Start the backend to load live availability.</p>}
        {homeView === "craving" ? (
          <section>
            <SectionTitle>What are you craving?</SectionTitle>
            <CravingGrid stalls={menuStalls} demoMode={demoMode} onOpen={openCraving} />
          </section>
        ) : (
          <>
            <DealEntry stalls={menuStalls} demoMode={demoMode} onOpen={openDeal} />
            <button type="button" onClick={openCombos} className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3 text-left hover:bg-[#F6F8F5]">
              <span><span className="block font-serif text-lg leading-tight">Combos &amp; meals</span><span className="block text-[13px] text-muted">Mini meals, thalis and combos from every stall, cheapest first</span></span>
              <span aria-hidden="true" className="text-xl text-muted">›</span>
            </button>
            <OrderAgain stalls={menuStalls} user={user} onAdd={requestAddItem} />
            <section>
              <SectionTitle aside={`${menuStalls.length} on campus`}>Stalls</SectionTitle>
              {menuStalls.length > 0 ? <StallList stalls={menuStalls} demoMode={demoMode} onOpen={openStall} /> : <p className="py-10 text-center text-muted">No stalls yet.</p>}
            </section>
          </>
        )}
      </>
    );
  }

  return (
    <StudentShell
      active="menu"
      wide
      bandAside={isDesktop || view === "deal" || (view === "home" && !query) ? null : <VegToggle vegOnly={vegOnly} onChange={(veg) => setDiet(veg ? "veg" : "all")} />}
      band={isDesktop ? null : band}
      bag={{ count: itemCount, total, onOpen: openBag }}
      focus={view === "deal" && deal.phase === "dealing"}
    >
      {(user, deletion) => (
        <>
          <div className="mx-auto max-w-3xl lg:grid lg:max-w-none lg:grid-cols-[220px_minmax(0,1fr)_280px] lg:gap-7 xl:grid-cols-[230px_minmax(0,1fr)_300px] xl:gap-8">
            {isDesktop && (
              <div className="hidden lg:block">
                <SidePanel greetingText={greetingFor(user)} stalls={stalls} menuStalls={menuStalls} demoMode={demoMode} openCount={openCount} search={search} onSearch={setSearch} searchPlaceholder={searchPlaceholder} diet={diet} onDiet={setDiet} kind={kind} onKind={setKind} sort={sort} onSort={setSort} activeStallId={activeStall?.id} onOpenStall={openStall} />
              </div>
            )}
            <div className="min-w-0 space-y-6">
              {content(user)}
              <NotOfficial className="pt-6 pb-2" />
            </div>
            {isDesktop && (
              <div id="bag" tabIndex={-1} className="hidden scroll-mt-6 outline-none lg:block">
                <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto">{bagContent(user, deletion)}</div>
              </div>
            )}
          </div>
          {!isDesktop && sheetOpen && <BagSheet onClose={() => setSheetOpen(false)}>{bagContent(user, deletion)}</BagSheet>}
          {customising && (
            <CustomiseSheet
              key={customising.dish.key}
              dish={customising.dish}
              lastLine={cartItems.filter((entry) => customising.dish.items.some((item) => item.id === entry.item.id)).at(-1)}
              onAdd={(item, choices, quantity) => {
                addToCart(item, customising.stall, choices, quantity);
                customising.onAdded?.();
              }}
              onClose={() => setCustomising(null)}
            />
          )}
        </>
      )}
    </StudentShell>
  );
}
