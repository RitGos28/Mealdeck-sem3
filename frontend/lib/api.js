// Client-side calls use relative /api/... paths, which next.config.mjs
// rewrites to the backend -- so the session cookie stays same-origin.
export async function api(path, { method = "GET", body } = {}) {
  const response = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    let message = `Something went wrong (${response.status})`;
    try {
      // The backend answers errors as problem+json; `detail` is the
      // human-readable reason ("The 12:30 slot just filled up").
      const problem = await response.json();
      if (problem.detail) message = problem.detail;
    } catch {
      // No JSON body; keep the generic message.
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// Backend times arrive as "12:30" or "12:30:00".
export function formatTime(value) {
  const [hours, minutes] = value.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${((hours + 11) % 12) + 1}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

// Instants (e.g. noShowAt) shown as campus wall-clock time.
export function formatInstant(value) {
  return new Date(value).toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" });
}

export function toSlotValue(value) {
  return value.slice(0, 5);
}
