"use client";

import { useEffect, useSyncExternalStore } from "react";
import { api } from "./api";

// What students think of dishes, fetched once per page and shared by every
// component that shows it (a menu has hundreds of dish rows; they must not
// each fetch). Each store loads on first use; refresh() reloads it.

function store(path, fallback) {
  let value = fallback;
  let loading = null;
  const listeners = new Set();
  const emit = () => listeners.forEach((listener) => listener());
  const load = () => {
    loading = api(path).then(
      (result) => { value = result ?? fallback; emit(); },
      () => { value = fallback; emit(); },
    );
    return loading;
  };
  return {
    subscribe(listener) {
      listeners.add(listener);
      if (!loading) load();
      return () => listeners.delete(listener);
    },
    get: () => value,
    refresh: load,
    set(next) { value = next; emit(); },
  };
}

const EMPTY_OBJECT = {};
const EMPTY_LIST = [];

// { [menuItemId]: { amazing, notWorthIt } }
export const voteCounts = store("/api/votes", EMPTY_OBJECT);
// [{ menuItemId, stallId, amazing, notWorthIt, keeps }]
export const mostLoved = store("/api/hot", EMPTY_LIST);
// [{ stallId, minutes, simulated }]: empty unless wait estimates are on.
export const stallWaits = store("/api/stalls/waits", EMPTY_LIST);
// [{ menuItemId, usually: "14:00:00", days, windowDays }]: dishes that often sell out.
export const soldOutTimes = store("/api/sold-out-times", EMPTY_LIST);
// { simulatedData }: true on a local demo run with simulated history.
export const demoInfo = store("/api/demo-info", { simulatedData: false });

export function useStore(s) {
  return useSyncExternalStore(s.subscribe, s.get, s.get);
}

// The logged-in student's own votes: { votes: { [id]: bool }, pickedUp: [ids] }.
// Separate, because it needs a login and changes as they vote.
let myVotesValue = null;
const myVotesListeners = new Set();
function setMyVotes(next) {
  myVotesValue = next;
  myVotesListeners.forEach((listener) => listener());
}

export function useMyVotes(isStudent) {
  const value = useSyncExternalStore(
    (listener) => { myVotesListeners.add(listener); return () => myVotesListeners.delete(listener); },
    () => myVotesValue,
    () => null,
  );
  useEffect(() => {
    if (!isStudent || myVotesValue) return;
    api("/api/account/votes").then(setMyVotes, () => {});
  }, [isStudent]);
  return isStudent ? value : null;
}

// vote: "AMAZING", "NOT_WORTH_IT", or null to take it back. Updates the
// student's votes and the shared totals straight away.
export async function castVote(menuItemId, vote) {
  const before = myVotesValue?.votes?.[menuItemId];
  const saved = await api(`/api/account/votes/${menuItemId}`, { method: "PUT", body: { vote } });
  const now = saved?.vote === "AMAZING" ? true : saved?.vote === "NOT_WORTH_IT" ? false : undefined;
  const votes = { ...(myVotesValue?.votes ?? {}) };
  if (now === undefined) delete votes[menuItemId]; else votes[menuItemId] = now;
  setMyVotes({ ...(myVotesValue ?? { pickedUp: [] }), votes });
  const counts = { ...voteCounts.get() };
  const current = { ...(counts[menuItemId] ?? { amazing: 0, notWorthIt: 0 }) };
  if (before === true) current.amazing -= 1;
  if (before === false) current.notWorthIt -= 1;
  if (now === true) current.amazing += 1;
  if (now === false) current.notWorthIt += 1;
  counts[menuItemId] = current;
  voteCounts.set(counts);
}
