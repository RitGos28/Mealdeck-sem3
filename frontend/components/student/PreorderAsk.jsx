"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";

// "Want to pre-order here?" on a stall that's menu only: one tap tells us
// you'd use pre-ordering at this stall (tap again to take it back). We count
// the taps per stall to show the stall how many students asked. Logged-out
// visitors are sent to log in first.
export default function PreorderAsk({ stall, className = "" }) {
  const router = useRouter();
  // loading | loggedOut | none | asked | error
  const [state, setState] = useState("loading");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    api("/api/preorder-requests").then(
      (ids) => active && setState(ids.includes(stall.id) ? "asked" : "none"),
      (err) => active && setState(err.status === 401 || err.status === 403 ? "loggedOut" : "error"),
    );
    return () => { active = false; };
  }, [stall.id]);

  if (state === "loading" || state === "error") return null;

  async function toggle() {
    if (state === "loggedOut") {
      router.push(`/login?next=${encodeURIComponent(`/?stall=${stall.id}`)}`);
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await api(`/api/preorder-requests/${stall.id}`, { method: state === "asked" ? "DELETE" : "PUT" });
      setState(state === "asked" ? "none" : "asked");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  const asked = state === "asked";
  return (
    <div className={className}>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={asked}
        className={`flex min-h-11 items-center rounded-full px-4 text-sm font-semibold transition-colors disabled:opacity-60 ${asked ? "bg-mint text-mint-ink hover:bg-[#D8E8DC]" : "border border-deck text-deck hover:bg-mint"}`}
      >
        {asked ? "✓ You asked for pre-orders here · undo" : state === "loggedOut" ? "Want to pre-order here? Log in to say so" : "Want to pre-order here?"}
      </button>
      <p className="mt-1.5 text-xs text-muted">We count these and show the stall how many students asked.</p>
      {message && <p role="alert" className="mt-1 text-xs text-danger">{message}</p>}
    </div>
  );
}
