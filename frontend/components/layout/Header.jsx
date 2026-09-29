"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { useCurrentUser } from "../../lib/useCurrentUser";

export default function Header({ itemCount }) {
  const router = useRouter();
  const [user, setUser] = useCurrentUser();

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push(user?.role === "VENDOR" ? "/vendor/login" : "/");
    router.refresh();
  }

  return (
    <header className="border-b border-white/10 bg-[#10261b] px-5 py-4 sm:px-6 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-[#d8f2b8] text-lg font-bold text-[#10261b] shadow-[0_0_0_5px_rgba(216,242,184,.1)]">M</span>
          <span><span className="font-display block text-xl font-bold tracking-tight">MealDeck</span><span className="hidden text-[10px] font-semibold uppercase tracking-[.16em] text-[#b8d4bd] sm:block">Campus pre-orders</span></span>
        </Link>
        <div className="flex items-center gap-2 text-sm font-semibold">
          {itemCount !== undefined && <span className="rounded-full bg-white/10 px-3 py-1.5">Bag <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-[#d8f2b8] text-xs text-[#10261b]">{itemCount}</span></span>}
          {user?.role === "VENDOR" && <Link href="/vendor" className="rounded-full bg-white/10 px-3 py-1.5 hover:bg-white/20">Orders</Link>}
          {user && <span className="hidden max-w-48 truncate text-white/70 sm:inline">{user.email}</span>}
          {user && <button className="rounded-full border border-white/25 px-3 py-1.5 hover:bg-white/10" onClick={logout}>Log out</button>}
          {user === null && <Link href="/login" className="rounded-full border border-white/25 px-3 py-1.5 hover:bg-white/10">Log in</Link>}
        </div>
      </div>
    </header>
  );
}
