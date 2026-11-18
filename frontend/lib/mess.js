// Helpers for "Mess today" (the campus mess menu students write).

// Which meal is on now, by campus time: breakfast to 10:30, lunch to 15:00,
// snacks to 18:00, then dinner. (Assumed windows, not the mess's own hours.)
export function currentMeal(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const minutes = Number(parts.find((p) => p.type === "hour").value) * 60 + Number(parts.find((p) => p.type === "minute").value);
  if (minutes < 10 * 60 + 30) return "BREAKFAST";
  if (minutes < 15 * 60) return "LUNCH";
  if (minutes < 18 * 60) return "SNACKS";
  return "DINNER";
}

// What a plate costs a day scholar; hostellers pay nothing (it's in their fees).
export function priceText(priceInr) {
  return priceInr == null ? "Price at the counter" : `₹${priceInr} day scholars`;
}
