import localFont from "next/font/local";
import "./globals.css";

// Self-hosted (app/fonts, SIL OFL), so `next build` never has to reach
// Google Fonts: a network blip there used to fail the Docker build.
const spaceGrotesk = localFont({
  variable: "--font-display",
  src: [
    { path: "./fonts/space-grotesk-latin-500-normal.woff2", weight: "500" },
    { path: "./fonts/space-grotesk-latin-700-normal.woff2", weight: "700" },
  ],
});

const inter = localFont({
  variable: "--font-body",
  src: [
    { path: "./fonts/inter-latin-400-normal.woff2", weight: "400" },
    { path: "./fonts/inter-latin-500-normal.woff2", weight: "500" },
    { path: "./fonts/inter-latin-600-normal.woff2", weight: "600" },
    { path: "./fonts/inter-latin-700-normal.woff2", weight: "700" },
  ],
});

// The student side's headings.
const dmSerif = localFont({
  variable: "--font-serif-face",
  src: [{ path: "./fonts/dm-serif-display-latin-400-normal.woff2", weight: "400" }],
});

export const metadata = {
  title: "MealDeck",
  description: "Live campus food availability, reported by students.",
};

// Tints the mobile browser's toolbar to match the green band.
export const viewport = {
  themeColor: "#163D29",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} ${dmSerif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
