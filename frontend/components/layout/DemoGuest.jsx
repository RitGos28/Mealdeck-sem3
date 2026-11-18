"use client";

import { useEffect } from "react";

// Demo builds only (NEXT_PUBLIC_DEMO_GUEST=1, set by demo.sh): a visitor who
// isn't logged in gets a temporary guest student account, so judges can try
// Deal, votes and the mess import without signing up. The page reloads once
// so everything picks up the session. On mealdeck.in this renders nothing
// and makes no request.
export default function DemoGuest() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEMO_GUEST !== "1") return;
    const path = window.location.pathname;
    if (path.startsWith("/vendor") || path.startsWith("/admin")) return;
    let tried = false;
    try {
      tried = sessionStorage.getItem("demoGuestTried") === "1";
      sessionStorage.setItem("demoGuestTried", "1");
    } catch {
      // No storage: still try once per page load.
    }
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((me) => {
        if (me?.role || tried) return;
        return fetch("/api/demo/guest", { method: "POST" }).then((r) => {
          if (r.ok) window.location.reload();
        });
      })
      .catch(() => {});
  }, []);
  return null;
}
