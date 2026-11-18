"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Reports each page opened, for the anonymous daily totals admins see
// (PageViewService): just the page and whether it came from the QR code. No
// cookies, no IDs. A QR code links to "/?src=qr"; the marker is removed from
// the address bar once counted, so sharing the link doesn't count as a scan.
export default function VisitBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    let source = "direct";
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get("src") === "qr") {
        source = "qr";
        url.searchParams.delete("src");
        window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
      }
    } catch {
      // Count it as a direct visit.
    }
    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, source }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
