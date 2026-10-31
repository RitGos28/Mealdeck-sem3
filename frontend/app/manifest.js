// The web app manifest: what Android (and the Play Store app, a Trusted Web
// Activity wrapping this site) uses for the app's name, icon, colours and
// launch screen.
export default function manifest() {
  return {
    id: "/",
    name: "MealDeck",
    short_name: "MealDeck",
    description: "Pre-order from campus food stalls and skip the queue. Pay at the counter when you pick up.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#163D29",
    theme_color: "#163D29",
    categories: ["food", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
