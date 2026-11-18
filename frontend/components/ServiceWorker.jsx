"use client";

import { useEffect } from "react";

// Registers public/sw.js (the offline screen) in production builds only, so
// local development never runs a stale worker.
export default function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
