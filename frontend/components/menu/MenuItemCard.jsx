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
    <article className={`group overflow-hidden rounded-2xl border border-[#e1e8de] bg-white shadow-[0_12px_30px_-24px_rgba(21,55,33,.7)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_-22px_rgba(21,55,33,.45)] ${available ? "" : "opacity-60"}`}>
      <div className="relative h-44 overflow-hidden bg-[#e8eee5]"><Image src={item.image} alt={item.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px" className="object-cover transition duration-500 group-hover:scale-105" /><span className={available ? "absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[#347042] shadow-sm" : "absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[#aa5043] shadow-sm"}>{available ? "● Available" : "● Sold out"}</span></div>
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2"><VegDot veg={item.veg} /><span className="font-semibold">{item.name}</span></div>
          <span className="whitespace-nowrap font-semibold">₹{item.price}</span>
        </div>

        {available && <div className="flex flex-wrap gap-2">
          <button className="rounded-full bg-[#173725] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#28573a]" onClick={() => onAddToCart(item)}>Add to bag +</button>
          <button className="rounded-full border border-[#e5e7e0] bg-transparent px-3 py-1.5 text-xs font-semibold text-gray-500 transition-colors hover:border-[#12180f] hover:text-[#12180f] disabled:cursor-default disabled:opacity-50" disabled={reporting} onClick={handleReport}>{reporting ? "Reporting…" : "Report out of stock →"}</button>
        </div>}
        {reportMessage && <p className="text-xs text-gray-500">{reportMessage}</p>}
      </div>
    </article>
  );
}
