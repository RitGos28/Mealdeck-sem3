"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

// The logged-in student's account-deletion status from
// /api/account/deletion: { scheduledFor, orderingBlockedFrom,
// orderingBlocked, graceHours }, or null for anyone who isn't a student.
// Re-checked every minute while a deletion is pending, so the final-hour
// warning switches on without a reload.
export function useAccountDeletion(user) {
  const [status, setStatus] = useState(null);
  const student = user?.role === "STUDENT";

  const refresh = useCallback(() => {
    if (!student) return Promise.resolve(null);
    return api("/api/account/deletion").then((next) => { setStatus(next); return next; }, () => null);
  }, [student]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!status?.scheduledFor) return undefined;
    const timer = setInterval(refresh, 60_000);
    return () => clearInterval(timer);
  }, [status?.scheduledFor, refresh]);

  async function request(password) {
    const next = await api("/api/account/deletion", { method: "POST", body: { password } });
    setStatus(next);
    return next;
  }

  async function cancel() {
    const next = await api("/api/account/deletion", { method: "DELETE" });
    setStatus(next);
    return next;
  }

  return { status: student ? status : null, request, cancel, refresh };
}

// "11:42 pm tomorrow" style, in campus time.
export function formatDeletionTime(instant) {
  if (!instant) return "";
  const when = new Date(instant);
  const zone = { timeZone: "Asia/Kolkata" };
  const time = when.toLocaleTimeString("en-IN", { ...zone, hour: "numeric", minute: "2-digit" });
  const day = (date) => date.toLocaleDateString("en-CA", zone);
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 86_400_000);
  const label = day(when) === day(today) ? "today" : day(when) === day(tomorrow) ? "tomorrow" : when.toLocaleDateString("en-IN", { ...zone, weekday: "short", day: "numeric", month: "short" });
  return `${time} ${label}`;
}
