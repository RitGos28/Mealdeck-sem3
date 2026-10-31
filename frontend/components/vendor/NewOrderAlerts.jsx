"use client";

import { useEffect, useRef, useState } from "react";

// Lets a busy stall notice new orders without watching the screen: a chime,
// a system notification while the tab is in the background, and an unread
// count in the tab title. On by default; the vendor's choice is remembered
// in this browser.
const STORAGE_KEY = "mealdeck.vendorAlerts";

function readEnabled() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

function saveEnabled(enabled) {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    // Private window or blocked storage: the switch still works for this visit.
  }
}

// Two rising notes, made with Web Audio so there's no sound file to ship.
function chime(audio) {
  const start = audio.currentTime;
  [880, 1320].forEach((frequency, index) => {
    const at = start + index * 0.18;
    const tone = audio.createOscillator();
    const volume = audio.createGain();
    tone.frequency.value = frequency;
    volume.gain.setValueAtTime(0.0001, at);
    volume.gain.exponentialRampToValueAtTime(0.3, at + 0.02);
    volume.gain.exponentialRampToValueAtTime(0.0001, at + 0.4);
    tone.connect(volume).connect(audio.destination);
    tone.start(at);
    tone.stop(at + 0.45);
  });
}

// watching: false for past days, which never get new orders. The first list
// after watching starts is what's already there, so it doesn't alert.
export function useNewOrderAlerts(orders, watching) {
  const [enabled, setEnabled] = useState(true);
  const seen = useRef(null);
  const audio = useRef(null);
  const unread = useRef(0);
  const baseTitle = useRef(null);

  // Read after mount, not in useState: the server render has no storage.
  useEffect(() => {
    setEnabled(readEnabled()); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  // Browsers only let a page make sound after the user has interacted with
  // it, so any tap on the page unlocks the audio. iOS Safari only counts a
  // finished tap (touchend/click), not pointerdown, and suspends the audio
  // again when the phone locks or the tab is hidden, so every tap re-unlocks
  // it rather than just the first.
  useEffect(() => {
    if (!enabled) return undefined;
    function unlock() {
      audio.current ??= new AudioContext();
      if (audio.current.state !== "running") audio.current.resume().catch(() => {});
    }
    const events = ["touchend", "click", "keydown"];
    events.forEach((name) => window.addEventListener(name, unlock));
    return () => events.forEach((name) => window.removeEventListener(name, unlock));
  }, [enabled]);

  useEffect(() => {
    function clearUnread() {
      if (document.hidden || unread.current === 0) return;
      unread.current = 0;
      document.title = baseTitle.current;
    }
    document.addEventListener("visibilitychange", clearUnread);
    return () => document.removeEventListener("visibilitychange", clearUnread);
  }, []);

  useEffect(() => {
    if (!watching) {
      seen.current = null;
      return;
    }
    if (!orders) return;
    const fresh = seen.current ? orders.filter((order) => order.status === "PLACED" && !seen.current.has(order.id)) : [];
    seen.current = new Set(orders.map((order) => order.id));
    if (fresh.length === 0 || !enabled) return;

    if (audio.current?.state === "running") chime(audio.current);
    if (document.hidden) {
      if (unread.current === 0) baseTitle.current = document.title;
      unread.current += fresh.length;
      document.title = `(${unread.current}) New order${unread.current === 1 ? "" : "s"} · ${baseTitle.current}`;
      if ("Notification" in window && Notification.permission === "granted") {
        const first = fresh[0];
        new Notification(fresh.length === 1 ? `New order #${first.id}` : `${fresh.length} new orders`, {
          body: fresh.length === 1 ? `${first.customerName} · ${first.items.map((item) => `${item.quantity}× ${item.menuItemName}`).join(", ")}` : "Open MealDeck to accept them.",
          tag: "mealdeck-new-order",
        });
      }
    }
  }, [orders, watching, enabled]);

  // Called from the switch's click, which counts as the interaction that
  // unlocks sound and lets the browser ask about notifications.
  function toggle() {
    const next = !enabled;
    setEnabled(next);
    saveEnabled(next);
    if (!next) return;
    audio.current ??= new AudioContext();
    audio.current.resume().then(() => chime(audio.current), () => {});
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
  }

  return { enabled, toggle };
}

export function AlertsToggle({ alerts }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={alerts.enabled}
      onClick={alerts.toggle}
      title={alerts.enabled ? "A chime and a notification when a new order comes in" : "Turn on new-order alerts"}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${alerts.enabled ? "bg-[#0f2419] text-white hover:bg-[#1a3827]" : "border border-[#c9d1c2] bg-white text-[#12180f] hover:border-[#3f6b3a]"}`}
    >
      {alerts.enabled ? "New-order alerts on" : "New-order alerts off"}
    </button>
  );
}
