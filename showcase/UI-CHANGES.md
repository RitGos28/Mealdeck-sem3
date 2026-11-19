# UI clean-up for the showcase (uncommitted)

**The running demo on :3000 does not show any of this yet.** It's a production build (`next build` + `next start`), so these changes appear only after a rebuild or restart, e.g. `./demo.sh public --no-tunnel`. That command also resets the demo data. I did not run `next build` or restart :3000.

I tested the changes on a separate dev server (:3001, now stopped). ESLint passes on every changed file, and no page has console errors or page errors. All demo.md flows are untouched: search, Deal, the Mess import, the dish sheet (Similar for less, sold-out times, votes) and the vendor menu.

## Changes

| File | Before → after | Why |
|---|---|---|
| `frontend/components/student/PickupChips.jsx` | ~48 time chips in the green band (ASAP, 8:00 … 7:45) → ASAP + the next 3 times + a "Later" link that shows the rest. A later time that's already picked stays visible. The desktop side panel is unchanged | Biggest piece of clutter on the home page. Tested: 4 chips → 49 after "Later"; a picked 1:00 still shows after a reload |
| `frontend/components/layout/SimulatedDataBanner.jsx` | Three-line mint box with a dashed border: "Demo data. The votes, Deal me a dish keeps and orders on this copy are simulated, and real stalls are shown menu only, as on mealdeck.in." → one short line with a dashed outline and no fill: "Demo data: votes, Deal keeps and orders here are simulated." | Shorter but still on every page. "Menu only" is already shown on each stall |
| `frontend/components/student/MostLoved.jsx` | Removed the sub-paragraph "From students' "Amazing" votes and Deal me a dish keeps, last 7 days." | Each card already says "23 said amazing · kept 2× in Deal" |
| `frontend/components/MealDeckApp.jsx` | Combos card subtitle "Mini meals, thalis and combos from every stall, cheapest first" → "Thalis and mini meals, cheapest first" | Repeated the title |
| `frontend/components/MealDeckApp.jsx` | "Stalls" heading: dropped the "7 on campus" count | Not needed; the list is right there |
| `frontend/components/MealDeckApp.jsx` | Menu-only stall banner: "**Quench isn't taking pre-orders on MealDeck yet.** Here's the menu so you can decide; order at the counter for now." → "**Menu only.** Quench isn't taking pre-orders yet; order at the counter." The wrapper also changed from `<p>` to `<div>` | Shorter. The `<p>` contained PreorderAsk's `<div>`/`<p>`, which caused a React "cannot be a descendant of <p>" hydration error on stall pages. That bug existed before; I fixed it because I was editing that line |
| `frontend/components/student/BrowseViews.jsx` | By craving: removed "Tap one to see it from every stall, cheapest first." | Explanatory microcopy |
| `frontend/components/menu/DishVotes.jsx` | "Had this? Only the totals are shown, never who voted." → "Had this?" | Shorter sheet. The sheet shows only totals anyway |
| `frontend/components/menu/DishDetailSheet.jsx` | Removed "Order at the counter for now." under the disabled "X isn't taking pre-orders yet" button | The button and the stall banner already say this |
| `frontend/components/student/PreorderAsk.jsx` | "We count these and show the stall how many students asked." → "The stall sees how many students asked." | Shorter |
| `frontend/components/student/DietSwitch.jsx` (Account) | "The menu, Deal me a dish and your passport suggestions start veg-only. You can still order non-veg, for a friend say: the bag will just remind you." → "Menu, Deal and passport show veg only at first. You can still order non-veg." | Long helper text |
| `frontend/components/student/deal/DealView.jsx` | "Deals learn from what students keep, and from your own keeps and skips. You can turn that off in Account." → "Deals learn from your keeps and skips. Turn it off in Account." Logged out: "…Log in to have them learn your taste too." → "…Log in so they learn yours too." | Shorter; keeps the off-switch pointer that demo.md mentions |
| `frontend/components/student/mess/MessPage.jsx` | Footer note: four sentences, including the "Checked" explanation → "Free for hostellers. Students add the menu each morning; if 3 say it's wrong, the most common correction replaces it." | Wall of text at the bottom of Mess |
| `frontend/app/orders/page.js` | "Live updates — we'll show when it's ready" → "Updates live. We'll show when it's ready" | Decorative em dash |
| `frontend/app/globals.css` | Removed the mint radial-gradient glow in the top-right corner of `body` | Decorative glow. It was only visible on pages with no green band (vendor pages); the plain cream background stays |
| `frontend/components/vendor/NewOrderAlerts.jsx` | "🔔 Alerts: on" / "🔕 Alerts: off" → "Alerts: on" / "Alerts: off" | Emoji used as icons |
| `frontend/components/vendor/VendorMenu.jsx` | 🍽️ placeholder for dishes with no photo → small grey "No photo" | Emoji used as an icon |
| `frontend/components/vendor/VendorMenu.jsx` | Category hint "(optional — each category is its own row on the menu; type a new name to add one)" → "(optional; type a new one to add it)" | Em dash; long helper text |

## Considered and left alone

- **The "independent student project, not an official Bennett University service" footer.** Required.
- **"Menu only" status on 6 of 7 stall rows.** It's the stall's status, and it's what sets Bistro (pre-order preview) apart.
- **The category line under each stall** (e.g. "Burgers · Thick Shakes · …"). It's already one truncated line and helps people choose a stall.
- **The "Can't decide? Deal me a dish · a quick game" card, the Mess today card and the By stall / By craving switch.** These are the demo features.
- **The Account toggle "Learn from my Deal me a dish swipes".** Its text ("Turning this off deletes them") is privacy wording that demo.md relies on.
- **The Mess import help text** ("the screenshots are never uploaded…"). It's part of the demo pitch.
- **"New stamp!" / "Ready now!" exclamations.** They're real events (a passport stamp, an order ready), not cheerful filler.
- **"✓" in "Checked ✓", "✓ Pre-order placed" and the survey "Saved ✓".** A text checkmark is a normal status mark, not an emoji icon.
- **Rounded cards on the Account page** (a passport card, then two toggle cards, then a list card). This would need a layout refactor, so I skipped it this close to the demo.
- **The vendor "Manage menu" intro and the "Choices" hint.** Long, but plain and useful to a vendor.
- **Everything under `frontend/app/trial/` and the admin pages.** Not student-facing.
- **No AI-buzzword copy found.** I grepped for "seamless", "effortless", "discover", "elevate", "unlock", "curated", "favourite", "whether you" and "magic": no user-visible hits. There are no sparkle icons or decorative blobs either.

## Things to check before judges arrive (I did not change these)

1. **The Mess import button is hidden right now.** `MessPage` shows "Fill from MyCamu screenshots" only when at least one meal is empty. On :3000 all four meals for today are already filled ("Added by a student · 1:17 AM"), so the 2:15 step in demo.md won't have its button. Either reset the data (`./demo.sh public --no-tunnel`, if the simulated history doesn't pre-fill today) or show it on a fresh day.
2. **Vendor section suggestions didn't appear for "Paneer Tikka Roll" at Bistro / Kathi.** Tried on both :3000 and :3001 (headless, about 2 s after typing), so my changes didn't cause it. Bistro has only 3 dishes. Worth trying by hand, or using a stall with a bigger menu.
3. **Deal and By craving were empty at 6:30 AM** ("No open stall has a dish that fits"), because no stall was open yet. They should fill once stalls open; worth checking at demo time.
4. Running `next dev` (re)generated `frontend/AGENTS.md`. It's gitignored, so it's harmless.

## Screenshots (430×932 @2x)

- Before (from :3000): `/private/tmp/claude-501/-Users-ritwikg-Mealdeck-demo/facd52fb-3a1a-49b3-b6a1-4f06b2aa6c08/scratchpad/agent-ui/before/` contains `home.png`, `craving.png`, `search.png`, `dish.png`, `stall.png`, `combos.png`, `deal.png`, `mess.png`, `account.png`, `orders.png`, `vendor.png`, `vendor-menu.png`
- After (from :3001): `/private/tmp/claude-501/-Users-ritwikg-Mealdeck-demo/facd52fb-3a1a-49b3-b6a1-4f06b2aa6c08/scratchpad/agent-ui/after/` has the same file names, plus `pickup-selected-later.png`

## Showcase copy review

Re-rendered with `showcase/tools/render.py`; all four posters are one page with the footer visible. Design left as is: no glows, emoji or extra badges to remove, and the brand colours/fonts are unchanged.

| File | Before → after | Why |
|---|---|---|
| `posters/hero.html`, `slides/index.html` (slide 1) | "Every campus stall. One menu." → "Every campus stall's menu in one place." | Two-fragment slogan; now says it plainly (matches demo.md) |
| `posters/hero.html` | "Find a dish without walking to every counter." → "Check before you walk over." | Shorter |
| `posters/hero.html` (CSS) | `.fan` could shrink (cards' tops were clipped); now `flex: none`, h1 24→21 mm, a few margins trimmed | The card fan showed cut-off prices and the band was pushed down |
| `posters/ml.html` | "Small models, each one checked against a baseline." → "The ML in MealDeck: small models, tested." | Deal, the mess guess and OCR have tests but no baseline number, so "each one" overclaimed |
| `posters/ml.html` | Lede "…and each one has a number we can show you." → "…and cost nothing per use." | Same overclaim; also freed a line so the footer fits |
| `posters/ml.html` | "…trains on a simulator until one does." → "…pickup time is trained on 1,600 simulated orders, tested on 400." | Exact numbers from ml/README.md |
| `posters/wait.html` | "the Bistro / Kathi stall takes pre-orders" → "a made-up stall (Bistro / Kathi) takes pre-orders" | Bistro / Kathi is fictional; a reader could think a real stall takes pre-orders |
| `posters/testers.html` | "Got an Android phone? Help us test the app." → "Android users: help us test the app." (balanced wrap) | Rhetorical question; the old wrap left "app." alone on a line |
| `posters/testers.html` | "tested it for two weeks. We need you for that group." → "tested it for 14 days. We need Android users for that group." | Same 14 days as the steps; less salesy |
| `slides/index.html` slide 1 | "…what other students rate. On your phone, before you walk over." → "…what other students thought. Check on your phone before you walk over." | Fragment sentence |
| slide 4 | "Can't decide? Swipe." → "Swipe when you can't decide." | Rhetorical question |
| slide 5 | "Screenshot in, menu out." → "Fill it in from a screenshot." | "X in, Y out" slogan |
| slide 6 | "Cheaper, nearby, still in stock." + "Often sold out by 5:45 PM." → "Open any dish." + "You see cheaper look-alikes at other stalls (Similar, for less), the time it usually sells out, and how many students said Amazing or Not worth it." | Slogan triplet, and "still in stock" / a specific 5:45 PM weren't real (the screenshot shows no sold-out time) |
| slide 7 | Kicker "When will it be ready?" → "Pickup time"; h1 "Pickup time, predicted." → "Predicting when it's ready." | Rhetorical question |
| slide 7 | "trains on 2,000 simulated orders" → "trained on 1,600 simulated orders and tested on 400 more" | 2,000 was train + test together |
| slide 7 | Footer "Small models, each checked against a baseline" → "demo.mealdeck.in" | Same overclaim as the ML poster |
| `print-kit/stickers.html` | "Every campus stall, one menu" → "Every campus stall's menu"; "Live menus, today" → "The real site, live menus" | Slogan; "today" was filler |

Not changed, worth a look: the phone screenshots in `assets/app/` show the Next.js dev "N" badge (bottom left), and `deal.png` shows "No open stall has a dish that fits", greyed-out button. Retaking them from the demo would look better. Untouched: tester-signup, deck-cards, table-tent, bunting, demo-mess page (copy already plain and accurate).
