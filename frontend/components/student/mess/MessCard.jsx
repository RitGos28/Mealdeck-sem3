"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { currentMeal, priceText } from "../../../lib/mess";

// The home page's way in to Mess today: the meal on now, in one line.
// Hidden if the menu can't be loaded, so a hiccup never breaks the home page.
export default function MessCard() {
  const [meal, setMeal] = useState(null);

  useEffect(() => {
    let active = true;
    api("/api/mess/today").then(
      (today) => active && setMeal(today.meals.find((m) => m.meal === currentMeal()) ?? null),
      () => {},
    );
    return () => { active = false; };
  }, []);

  if (!meal) return null;
  const added = meal.items.length > 0;
  return (
    <Link href="/mess" className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl bg-mint px-4 py-3 hover:bg-[#D8E8DC]">
      <span className="min-w-0">
        <span className="block text-xs font-semibold tracking-wide text-mint-ink uppercase">Mess today · {meal.label}</span>
        <span className={`mt-0.5 block truncate text-[15px] ${added ? "text-ink" : "text-muted"}`}>{added ? meal.items.join(", ") : "Not added yet. Tap to add it"}</span>
        <span className="mt-0.5 block text-xs text-[#3E5A48]">{priceText(meal.priceInr)} · free for hostellers</span>
      </span>
      <span aria-hidden="true" className="text-xl text-mint-ink">›</span>
    </Link>
  );
}
