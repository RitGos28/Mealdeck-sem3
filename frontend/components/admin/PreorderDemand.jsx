"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

// How many students tapped "Want to pre-order here?" at each stall: the
// proof of demand to show a stall when asking it to join.
export default function PreorderDemand() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api("/api/admin/preorder-requests").then(setRows, (err) => setError(err.message));
  }, []);

  if (error) return <p className="mt-8 rounded-xl bg-[#fbe9e7] px-4 py-3 text-sm text-[#9a4a3f]" role="alert">{error}</p>;
  if (!rows) return null;
  const total = rows.reduce((sum, row) => sum + row.requests, 0);

  return (
    <section className="mt-8" aria-labelledby="demand-heading">
      <h2 id="demand-heading" className="font-display text-2xl font-bold">Asked for pre-ordering</h2>
      <p className="mt-1 text-sm text-gray-500">Students who tapped &ldquo;Want to pre-order here?&rdquo; on a menu-only stall. {total === 0 ? "Nobody yet." : `${total} in total.`}</p>
      <div className="mt-4 overflow-hidden rounded-2xl border border-[#e1e8dd] bg-white">
        <table className="w-full text-sm">
          <thead className="bg-[#f3f7f1] text-left text-xs font-semibold tracking-wide text-gray-500 uppercase"><tr><th className="px-4 py-2">Stall</th><th className="px-4 py-2 text-right">Students</th><th className="hidden px-4 py-2 sm:table-cell">Latest</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.stallId} className="border-t border-[#edf1ea]">
                <td className="px-4 py-2.5 font-semibold">{row.stallName}{row.takingOrders && <span className="ml-2 rounded-full bg-[#dbead6] px-2 py-0.5 text-xs font-semibold text-[#315c3d]">taking orders</span>}</td>
                <td className="px-4 py-2.5 text-right font-display text-lg font-bold tabular-nums">{row.requests}</td>
                <td className="hidden px-4 py-2.5 text-gray-500 sm:table-cell">{row.latest ? new Date(row.latest).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" }) : "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
