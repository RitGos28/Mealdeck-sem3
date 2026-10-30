"use client";

import Link from "next/link";
import { useCurrentUser } from "../../lib/useCurrentUser";

const TABS = [
  { id: "menu", label: "Menu", href: "/", icon: <path d="M4 6h16M4 12h16M4 18h10" /> },
  { id: "orders", label: "My orders", href: "/orders", icon: <path d="M7 3h10v18l-5-3-5 3z" /> },
  { id: "account", label: "Account", href: "/account", icon: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></> },
];

function Icon({ children, size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;
}

export function BagIcon({ size = 24 }) {
  return <Icon size={size}><path d="M6 8h12l-1 12H7L6 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></Icon>;
}

// My orders and Account need a login; send logged-out visitors there first.
function tabHref(tab, user) {
  return tab.id !== "menu" && user === null ? `/login?next=${tab.href}` : tab.href;
}

// The student app's frame: a deep-green band (logo, page heading, controls)
// over a white sheet. Phones and portrait tablets get bottom tabs and a
// floating bag button; wide screens put the links and bag in the band.
// `children` may be a function of the current user, so pages don't fetch
// /api/auth/me a second time.
export default function StudentShell({ active, band, bandAside, bag, wide = false, children }) {
  const container = wide ? "max-w-6xl lg:max-w-[1400px]" : "max-w-6xl";
  const [user] = useCurrentUser();
  const showBag = bag && bag.count > 0;

  return (
    <div className="student-shell flex min-h-screen flex-col bg-deck">
      <header className="text-white">
        <div className={`mx-auto ${container} px-5 pt-4 pb-6 sm:px-8 lg:pt-3 ${band ? "lg:pb-6" : "lg:pb-8"}`}>
          <div className="flex min-h-11 items-center justify-between gap-3">
            <Link href="/" className="font-serif text-2xl lg:text-[22px]">MealDeck</Link>
            <div className="flex items-center gap-2">
              {bandAside}
              <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
                {TABS.map((tab) => (
                  <Link key={tab.id} href={tabHref(tab, user)} aria-current={active === tab.id ? "page" : undefined} className={`rounded-full px-3.5 py-2 text-[13px] font-semibold ${active === tab.id ? "bg-white/15 text-white" : "text-on-deck hover:bg-white/10 hover:text-white"}`}>{tab.label}</Link>
                ))}
              </nav>
              {bag && (
                <button type="button" onClick={bag.onOpen} className="hidden h-10 items-center gap-2 rounded-full bg-white px-3.5 text-[13px] font-semibold text-deck hover:bg-mint lg:flex" aria-label={`Bag, ${bag.count} item${bag.count === 1 ? "" : "s"}, ₹${bag.total}`}>
                  <BagIcon size={20} />{bag.count > 0 ? <>{bag.count} · ₹{bag.total}</> : "Bag"}
                </button>
              )}
            </div>
          </div>
          {band}
        </div>
      </header>

      <main className="flex-1 rounded-t-3xl bg-white text-ink">
        <div className={`mx-auto ${container} px-5 pt-6 pb-32 sm:px-8 lg:pt-5 lg:pb-16`}>
          {typeof children === "function" ? children(user) : children}
        </div>
      </main>

      {showBag && (
        <button type="button" onClick={bag.onOpen} className="fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-20 flex h-14 items-center gap-2.5 rounded-full bg-deck pr-5 pl-4 text-[15px] font-semibold text-white shadow-[0_12px_28px_-10px_rgba(20,60,38,.6)] hover:bg-deck-hover lg:hidden" aria-label={`View bag, ${bag.count} item${bag.count === 1 ? "" : "s"}, ₹${bag.total}`}>
          <span className="relative flex">
            <BagIcon />
            <span className="absolute -top-2 -right-2.5 flex size-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-deck">{bag.count}</span>
          </span>
          ₹{bag.total}
        </button>
      )}

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        {TABS.map((tab) => (
          <Link key={tab.id} href={tabHref(tab, user)} aria-current={active === tab.id ? "page" : undefined} className={`flex h-16 flex-col items-center justify-center gap-1 text-xs ${active === tab.id ? "font-semibold text-deck" : "font-medium text-muted hover:text-ink"}`}>
            <Icon>{tab.icon}</Icon>{tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
