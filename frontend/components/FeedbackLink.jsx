"use client";

// Opens the tester's own email app with a short template, so feedback
// arrives dated in our inbox (the evidence Google Play's production
// application asks for) and the app itself collects nothing extra. The page
// and phone are filled in when it's tapped.
export const FEEDBACK_EMAIL = "ritwik@mealdeck.in";

export function feedbackHref() {
  const page = typeof window === "undefined" ? "" : window.location.pathname + window.location.search;
  const phone = typeof navigator === "undefined" ? "" : navigator.userAgent.replace(/\s+/g, " ").slice(0, 160);
  const body = [
    "What were you trying to do?",
    "",
    "",
    "What happened instead (or what could be better)?",
    "",
    "",
    "Anything else?",
    "",
    "",
    "---",
    `Page: ${page}`,
    `Phone/browser: ${phone}`,
  ].join("\n");
  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent("MealDeck feedback")}&body=${encodeURIComponent(body)}`;
}

export default function FeedbackLink({ className, children = "Send feedback" }) {
  return (
    <a
      href={`mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent("MealDeck feedback")}`}
      onClick={(event) => {
        event.preventDefault();
        window.location.href = feedbackHref();
      }}
      className={className}
    >
      {children}
    </a>
  );
}
