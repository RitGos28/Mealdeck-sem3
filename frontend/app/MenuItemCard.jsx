"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function VegDot({ veg }) {
  return <span className={`veg-dot${veg ? "" : " nonveg"}`} aria-hidden="true" />;
}

export default function MenuItemCard({ item }) {
  const router = useRouter();
  const [reporting, setReporting] = useState(false);

  async function handleReport() {
    setReporting(true);
    try {
      const res = await fetch(`/api/menu-items/${item.id}/report`, { method: "POST" });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      // Re-fetch the server component's data so the new state (and any
      // auto-hide at the report threshold) shows immediately.
      router.refresh();
    } finally {
      setReporting(false);
    }
  }

  return (
    <div className={`item-card${item.available ? "" : " unavailable"}`}>
      <div className="item-top">
        <div className="item-name-row">
          <VegDot veg={item.veg} />
          <span className="item-name">{item.name}</span>
        </div>
        <span className="item-price">₹{item.price}</span>
      </div>
      <span className={`badge ${item.available ? "available" : "unavailable"}`}>
        {item.available ? "Available now" : "Out of stock"}
      </span>
      {item.available && (
        <button className="report-btn" disabled={reporting} onClick={handleReport}>
          {reporting ? "Reporting…" : "Report out of stock →"}
        </button>
      )}
    </div>
  );
}
