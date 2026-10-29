"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";

function VegDot({ veg }) {
  const color = veg ? "border-[#2f7d32] bg-[#2f7d32]" : "border-[#b3261e] bg-[#b3261e]";
  return <span className={`flex size-2.5 shrink-0 items-center justify-center rounded-sm border-[1.5px] ${color}`} aria-hidden="true"><span className="size-[5px] rounded-full bg-white" /></span>;
}

export default function MenuItemCard({ item, demoMode, onAddToCart }) {
  const router = useRouter();
  const [reporting, setReporting] = useState(false);
  const [locallyUnavailable, setLocallyUnavailable] = useState(false);
  const [reportMessage, setReportMessage] = useState(null);
  const available = item.available && !locallyUnavailable;

  async function handleReport() {
    if (demoMode) {
      setLocallyUnavailable(true);
      return;
    }
    setReporting(true);
    setReportMessage(null);
    try {
      await api(`/api/menu-items/${item.id}/report`, { method: "POST" });
      setReportMessage("Thanks, reported.");
      router.refresh();
    } catch (err) {
      // Reporting needs a student login; anyone else gets 401/403.
      if (err.status === 401 || err.status === 403) {
        router.push("/login?next=/");
        return;
      }
      setReportMessage(err.message);
    } finally {
      setReporting(false);
    }
  }

  return (
    <article className={`group flex overflow-hidden rounded-2xl border border-[#e1e8de] bg-white shadow-[0_12px_30px_-24px_rgba(21,55,33,.7)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_-22px_rgba(21,55,33,.45)] sm:block ${available ? "" : "opacity-60"}`}>
      <div className="relative min-h-32 w-28 shrink-0 overflow-hidden bg-[#e8eee5] sm:h-44 sm:min-h-0 sm:w-auto"><Image src={item.image} alt={item.name} fill sizes="(max-width: 640px) 112px, (max-width: 1024px) 50vw, 280px" className="object-cover transition duration-500 group-hover:scale-105" /><span className={available ? "absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[11px] font-bold text-[#347042] shadow-sm sm:left-3 sm:top-3 sm:px-2.5" : "absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[11px] font-bold text-[#aa5043] shadow-sm sm:left-3 sm:top-3 sm:px-2.5"}>{available ? "● Available" : "● Sold out"}</span></div>
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2"><VegDot veg={item.veg} /><span className="font-semibold">{item.name}</span></div>
          <span className="whitespace-nowrap font-semibold">₹{item.price}</span>
        </div>

        {available && <div className="flex flex-wrap gap-2">
          <button className="rounded-full bg-[#173725] px-3.5 py-2.5 text-xs sm:py-2 font-semibold text-white transition-colors hover:bg-[#28573a]" onClick={() => onAddToCart(item)}>Add to bag +</button>
          <button className="rounded-full border border-[#e5e7e0] bg-transparent px-3 py-2 text-xs sm:py-1.5 font-semibold text-gray-500 transition-colors hover:border-[#12180f] hover:text-[#12180f] disabled:cursor-default disabled:opacity-50" disabled={reporting} onClick={handleReport}>{reporting ? "Reporting…" : "Report out of stock →"}</button>
        </div>}
        {reportMessage && <p className="text-xs text-gray-500">{reportMessage}</p>}
      </div>
    </article>
  );
}
