# Machine learning in MealDeck

MealDeck is a student-built campus menu guide with live out-of-stock reports (pre-ordering is built and waiting for stalls to opt in). The rule for ML here: **it should be useful to a student today, not just a demo.** Each feature below says what it learns from, how it's measured, and whether it runs on real data yet.

| Feature | What it learns from | Useful today? |
|---|---|---|
| Typo-tolerant search | The 1,086 dishes on the real menus | ✅ Yes |
| Section suggestions for vendors | Each stall's own menu | ✅ Yes |
| Deal me a dish that learns your taste | Students' keeps and skips | ✅ Yes, from the first swipe |
| "Often sold out by 2 PM" | Out-of-stock reports | ✅ Once ~2 weeks of reports exist |
| Mess menu guess | Menus students posted on past weeks | ✅ Once ~2 weeks of menus exist |
| MyCamu screenshot → mess menu | OCR on the phone + our parser | ✅ Yes |
| "Similar, for less" | Dish-name similarity across stalls | ✅ Yes |
| Pickup ETA | **Simulated** orders | ❌ Demo only, until real pre-orders exist |

A local demo with simulated history (orders, votes, swipes, sold-out events, past mess menus) runs with `DEMO_HISTORY=true` and shows a "Demo data" banner. None of it is ever shown on mealdeck.in.

---

## 1. Typo-tolerant search — `frontend/lib/fuzzySearch.js`

"panner tika" finds Paneer Tikka; "manchoorian" finds Manchurian.

- **Model:** every word in every dish name and section is split into character trigrams (" pa", "pan", "ane", …). A typed word matches menu words by trigram overlap (Dice) or edit distance (with swapped letters counting as one edit), weighted by how rare the word is on the menu (IDF), with name words counting more than section words. Fitted on the menu itself; runs in the browser in under 1 ms.
- **Measured** (`node frontend/scripts/eval-search.mjs <menu dir>`), 39 misspelled queries over the 1,086 real dishes:

| | Right dish found |
|---|---|
| Search before this (substring) | 10 / 39 (26%) |
| Typo-tolerant, in the top 10 | 39 / 39 (100%) |
| Typo-tolerant, ranked first | 34 / 39 (87%) |

- **Caveat:** the typo list was written by us and the model was tuned on it. A fair final number needs typos it has never seen (ask students to type dishes badly).

## 2. Section suggestions for vendors — `frontend/lib/sectionSuggest.js`

When a stall adds "Paneer Tikka Roll", it suggests the stall's own section ("Veg Kathi Rolls") as one-tap chips. Sections are each stall's own names, so every stall's menu is its own training set.

- **Model:** k-nearest neighbours (k = 7) using the search similarity; neighbours vote for their section, weighted by similarity.
- **Measured** (`node frontend/scripts/eval-sections.mjs <menu dir>`): every dish hidden in turn, **together with its other sizes** so a "(Half)" can't give away its "(Full)":

| | Accuracy |
|---|---|
| Baseline: always the stall's biggest section | 14% |
| First suggestion right | **69%** |
| Right section among the 3 chips | **83%** |

  Best at Hotspot (91%) and Southern Stories (88%); weakest at Quench (51%), whose sections genuinely overlap (cold coffee vs shakes).

## 3. Deal me a dish learns your taste — `backend/.../DealLearningService.java`, `DealModel.java`

- **Model:** online logistic regression on sparse dish features (stall, section, price band, veg, words in the name, so liking paneer at one stall carries to another). Two models: a **shared** one from everyone's swipes and a **personal** one per student that learns how they differ (`score = sigmoid(shared + personal)`). Every finished hand is one more training step; the deal is drawn with those odds plus a floor, so new dishes still get shown.
- **Tested:** after six hands keeping rolls and skipping coffee, rolls score > 0.7, coffee < 0.3, and an unseen "Chicken Kathi Roll" scores above the coffee (`DishesTests`).
- **Privacy:** on by default for logged-in students, explained on the privacy page; the Account switch turns it off, deletes their swipes and retrains the shared model without them; account deletion does the same.

## 4. "Often sold out by 2 PM" — `backend/.../SoldOutService.java`

- **Data:** when a dish becomes sold out (three student reports, or the stall unticks it) MealDeck now keeps the dish and the time, **not who reported it**. The reports themselves still reset at midnight.
- **Model:** for each dish, the first sell-out time on each day over four weeks; the median, pulled towards the stall's typical time when the dish has few days (a shrinkage estimate); shown once it sold out on 3+ days: "Often sold out by 2:00 PM (18 of the last 28 days)".
- **Tested:** the third report records one event, the fourth doesn't; old events and thin data are ignored (`DishesTests`).

## 5. Mess menu guess — `backend/.../MessPredictionService.java`

"Probably: rajma, jeera rice, roti" for a meal nobody has posted yet today.

- **Model:** the mess runs on a weekly rotation (MyCamu itself labels meals "Lunch(Wed)"), so the same weekday in the last six weeks votes, recent weeks counting more (×0.8 per week back); dishes with half the vote are the guess. Needs two weeks of that meal.
- **Tested:** learns the usual dishes, ignores one-offs and other weekdays, follows a rotation change, refuses to guess from one week, steps aside once the real menu is posted (`MessPredictionTests`).
- Always labelled a guess; "Looks right? Check it and add it" opens the normal form prefilled, so a student confirms before anything is posted.

## 6. MyCamu screenshot → mess menu — `frontend/lib/messScreenshot.js`, `MessScreenshotImport.jsx`

A hosteller picks screenshots of MyCamu's mess page; the dishes are read and prefilled per meal for them to check.

- **OCR** is Tesseract (tesseract.js 7), a pretrained neural network, running **in the student's browser**: the screenshot is never uploaded, and the engine and model are served from MealDeck itself, not a CDN.
- **Our parser** finds meals by their text, not their position (the list scrolls): headers like "Lunch 12:00 PM - 03:00 PM", labels like "Lunch(Wed)-Aloo Jeera", the "Wednesday · Select" footer; it strips calorie notes, re-joins wrapped lines, flags a meal cut off at the bottom and a screenshot of the wrong day.
- **Measured:** the four real screenshots from 2026-11-18 (one per meal): all four meals found, complete, right day, every dish matching a hand transcription; ~150 ms per screenshot.

## 7. "Similar, for less" — `frontend/lib/similarDishes.js`

In a dish's details: cheaper dishes like it at other stalls, using the search similarity. Veg stays veg and non-veg stays non-veg, sizes are compared like with like (a half plate isn't a cheaper full one), add-ons are left out. 29% of the 1,086 dishes get at least one genuine cheaper look-alike (e.g. Oreo Shake ₹147 → ₹85 at two other stalls).

## 8. Pickup ETA (demo only) — `ml/`, `backend/.../EtaService.java`

Predicts minutes to prepare a basket, from the dishes, the hour, the weekday and the queue ahead.

**The training data is SIMULATED**: `simulate.py` builds orders from the real menus with a hand-written kitchen formula plus noise, so the accuracy below measures how well the model recovers that formula, not a real kitchen. It's off by default (`mealdeck.ml.eta.enabled`) and only switched on for local demos.

```bash
python3 ml/simulate.py --menu-dir menu     # writes ml/data/simulated_orders.csv
python3 ml/train_eta.py                    # metrics + ml/models/eta-model.joblib
python3 ml/serve_eta.py                    # model on http://127.0.0.1:8099
```

| Model (400 held-out simulated orders) | MAE | RMSE | R² | within ±3 min |
|---|---|---|---|---|
| Mean baseline | 6.13 | 7.74 | -0.01 | 29% |
| Linear regression | 2.27 | 3.07 | 0.84 | 74% |
| Random forest | 2.13 | 3.12 | 0.84 | 76% |

Random forest 5-fold CV MAE: 2.27 ± 0.04 min. The forest only edges past linear regression because the simulator is mostly additive; real kitchens (batching, one cook switching stations) are less linear.

**The real-data story:** a student who ordered at a campus counter at 12:40 on 2026-11-18 got their food at about 13:11: a 31-minute wait. With a pre-order for 1 PM the wait is zero, and the stall can batch three of the same dish into one. Real `readyAt` times from pre-orders replace the simulator as soon as a stall opts in.

---

## Running the local demo

```bash
python3 ml/serve_eta.py                                           # ETA model (needs scikit-learn)
cd backend && SPRING_PROFILES_ACTIVE=demo ML_ETA_ENABLED=true DEMO_HISTORY=true \
  DEMO_MENU_DIR=/path/to/all/menu/csvs ./mvnw spring-boot:run
cd frontend && npm run build && npx next start -p 3000            # or npm run dev
```

Demo logins (local only): student `student@bennett.edu.in` / `student123`, vendor `bistro@mealdeck.in` / `vendor123`. With real menus loaded, every real stall is menu only, as on mealdeck.in; the fictional "Bistro / Kathi" previews pre-ordering and its wait estimate.
