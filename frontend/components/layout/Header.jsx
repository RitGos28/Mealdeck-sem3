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
    <header className="bg-[radial-gradient(circle_at_top_left,_#0f2419_0%,_#0a1810_100%)] px-6 py-5 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-[10px] bg-[#a9c9a1] text-lg font-bold text-[#0a1810]">M</span>
          <span className="font-display text-xl font-bold">MealDeck</span>
        </Link>
        <div className="flex items-center gap-2 text-sm font-semibold">
          {itemCount !== undefined && <span className="rounded-full bg-white/10 px-3 py-1.5">Cart: {itemCount}</span>}
          {user?.role === "VENDOR" && <Link href="/vendor" className="rounded-full bg-white/10 px-3 py-1.5 hover:bg-white/20">Orders</Link>}
          {user && <span className="hidden max-w-48 truncate text-white/70 sm:inline">{user.email}</span>}
          {user && <button className="rounded-full border border-white/25 px-3 py-1.5 hover:bg-white/10" onClick={logout}>Log out</button>}
          {user === null && <Link href="/login" className="rounded-full border border-white/25 px-3 py-1.5 hover:bg-white/10">Log in</Link>}
        </div>
      </div>
    </header>
  );
}
