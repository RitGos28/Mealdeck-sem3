"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

function VegDot({ veg }) {
  const color = veg ? "border-[#2f7d32] bg-[#2f7d32]" : "border-[#b3261e] bg-[#b3261e]";
  return <span className={`flex size-2.5 shrink-0 items-center justify-center rounded-sm border-[1.5px] ${color}`} aria-hidden="true"><span className="size-[5px] rounded-full bg-white" /></span>;
}

export default function MenuItemCard({ item, demoMode, onAddToCart }) {
  const router = useRouter();
  const [reporting, setReporting] = useState(false);
  const [locallyUnavailable, setLocallyUnavailable] = useState(false);
  const available = item.available && !locallyUnavailable;

  async function handleReport() {
    if (demoMode) {
      setLocallyUnavailable(true);
      return;
    }
    setReporting(true);
    try {
      const response = await fetch(`/api/menu-items/${item.id}/report`, { method: "POST" });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      router.refresh();
    } finally {
      setReporting(false);
    }
  }

  return (
    <article className={`overflow-hidden rounded-[14px] border border-[#e5e7e0] bg-white ${available ? "" : "opacity-60"}`}>
      <div className="relative h-40 bg-[#e8eee5]"><Image src={item.image} alt={item.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px" className="object-cover" /></div>
      <div className="flex flex-col gap-2.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2"><VegDot veg={item.veg} /><span className="font-semibold">{item.name}</span></div>
          <span className="whitespace-nowrap font-semibold">₹{item.price}</span>
        </div>
        <span className={`self-start rounded-full px-2.5 py-1 text-xs font-semibold ${available ? "bg-[#dbead6] text-[#3f6b3a]" : "bg-[#fbe9e7] text-[#9a4a3f]"}`}>{available ? "Available now" : "Out of stock"}</span>
        {available && <div className="flex flex-wrap gap-2">
          <button className="rounded-full bg-[#0f2419] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#1a3827]" onClick={() => onAddToCart(item)}>Add to cart</button>
          <button className="rounded-full border border-[#e5e7e0] bg-transparent px-3 py-1.5 text-xs font-semibold text-gray-500 transition-colors hover:border-[#12180f] hover:text-[#12180f] disabled:cursor-default disabled:opacity-50" disabled={reporting} onClick={handleReport}>{reporting ? "Reporting…" : "Report out of stock →"}</button>
        </div>}
      </div>
    </article>
  );
}
