// Turns the text read (OCR) from a MyCamu mess-menu screenshot into meals
// and dishes. MyCamu shows one meal per card in a scrolling list:
//
//   Lunch 12:00 PM - 03:00 PM          <- header: meal + serving time
//   Lunch(Wed)-Aloo Jeera              <- label: meal, day, then the first dish
//   Kadhi Pakora                       <- one dish per line
//   Jam- (276 Kcal),Brown- (282 Kcal) & White Bread-   <- calorie notes, wrapped lines
//   Wednesday            Select        <- end of the card
//
// A screenshot can start or end anywhere in that list, so nothing here
// depends on position: cards are found by their text. A card whose start
// scrolled off the top is still recognised by its "Meal(Day)-" label; one
// cut off at the bottom is returned with complete: false, so the student can
// add another screenshot instead of saving half a meal. Pure functions, no
// browser APIs, so they can be tested in Node.

export const MEALS = ["BREAKFAST", "LUNCH", "SNACKS", "DINNER"];
const MEAL_WORDS = [
  ["BREAKFAST", /^break\s*fast/i],
  ["LUNCH", /^lunch/i],
  ["SNACKS", /^(snacks?|hi-?\s*tea|high\s*tea|evening\s*snacks?)/i],
  ["DINNER", /^dinner/i],
];
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

// Screen furniture that is never a dish (the "Select" button and the bottom
// navigation bar end a card instead; see FOOTER and NAV_BAR).
const NOISE = /^(.*bennett university.*|\d{1,2}[:.]\d{2}\b.*|[^\p{L}]*)$/iu;
// MyCamu's bottom navigation bar: the end of the visible screen.
const NAV_BAR = /\b(apps|accessibility|settings)\b/i;
// OCR of the nav-bar icons ("BH T ti!", "FH T EX"): no word of 3+ letters.
const ICON_JUNK = /^(?!.*\p{L}{3}).*$/u;

function mealOf(text) {
  for (const [meal, pattern] of MEAL_WORDS) if (pattern.test(text)) return meal;
  return null;
}

// "Wed", "wednesday", OCR'd "Wednesdav" -> 2 (Monday = 0), or null.
function dayIndex(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length < 3) return null;
  const i = DAYS.findIndex((day) => day.startsWith(w.slice(0, 3)));
  return i === -1 ? null : i;
}

// "Breakfast 07:30 AM - 09:30 AM"
const HEADER = /^(break\s*fast|lunch|snacks?|hi-?\s*tea|high\s*tea|dinner)\b[^a-z]*\d{1,2}\s*[:.]\s*\d{2}/i;
// "Lunch(Wed)-Aloo Jeera", OCR may lose the brackets or the dash.
const LABEL = /^(break\s*fast|lunch|snacks?|hi-?\s*tea|high\s*tea|dinner)\s*[([{]?\s*([a-z]{3,9})\s*[)\]}]?\s*[-–—:]\s*(.*)$/i;
// "Wednesday   Select", "Wednesday", or just "Select" (OCR often misses the
// faint cyan day name): the end of a card.
const FOOTER = /^((mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?\s*(select)?|select)$/i;

// Calorie notes in any OCR spelling: "(276 Kcal)", "(30 KcaI)", "302 kcal".
const CALORIES = /[([{]?\s*\d{1,4}\s*k\s*c\s*a\s*[l1i|]\s*[)\]}]?/gi;

// One card's raw lines -> clean dish names.
export function cleanDishes(lines) {
  // Re-join lines MyCamu wrapped: a line that starts mid-thought, or follows
  // one that ends mid-thought (open bracket or quote, trailing dash/slash/comma).
  const joined = [];
  for (const raw of lines) {
    const line = raw.trim();
    const prev = joined.at(-1);
    const prevOpen = prev !== undefined && (
      /[-/,(&]\s*$/.test(prev)
      || (prev.match(/\(/g) ?? []).length > (prev.match(/\)/g) ?? []).length
      || ((prev.match(/"/g) ?? []).length % 2 === 1)
    );
    if (prev !== undefined && (prevOpen || /^[a-z(/)&,]/.test(line) || /^k\s*cal/i.test(line))) {
      joined[joined.length - 1] = `${prev} ${line}`;
    } else {
      joined.push(line);
    }
  }
  const dishes = [];
  for (const line of joined) {
    const text = line
      .replace(CALORIES, " ")
      .replace(/["“”]/g, "")
      .replace(/\s*-\s*(?=[,/&]|$)/g, "") // "Jam- ," -> "Jam,"   "Milk- /" -> "Milk/"
      .replace(/\s*\/\s*/g, " / ")
      .replace(/\s*&\s*/g, " & ") // "Brown& White" -> "Brown & White"
      .replace(/\s+/g, " ")
      .trim();
    for (const part of text.split(/[,;]/)) {
      const dish = part.replace(/^[\s\-–—:.&]+|[\s\-–—:.&]+$/g, "").trim();
      if (dish.length >= 2 && !NOISE.test(dish) && !ICON_JUNK.test(dish) && !dishes.some((d) => d.toLowerCase() === dish.toLowerCase())) {
        dishes.push(dish.length > 60 ? dish.slice(0, 60).trim() : dish);
      }
    }
  }
  return dishes;
}

// OCR text -> { meals: [{ meal, day, dishes, complete }], ignoredTop }.
// day: 0 = Monday ... 6 = Sunday, or null if the label was cut off.
// ignoredTop: lines before the first recognisable card (the end of a card
// whose top scrolled away; we can't tell which meal it was).
export function parseMessText(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !NOISE.test(l));
  const meals = [];
  let current = null;
  let ignoredTop = 0;

  const close = (complete) => {
    if (current) {
      meals.push({ meal: current.meal, day: current.day, dishes: cleanDishes(current.lines), complete });
      current = null;
    }
  };

  for (const line of lines) {
    if (NAV_BAR.test(line)) {
      close(false); // the screen ends here; an open card may continue below
      break;
    }
    if (ICON_JUNK.test(line)) continue;
    const label = line.match(LABEL);
    if (HEADER.test(line) && !(label && label[3])) {
      close(false); // a new card started before the old one's footer: it was cut short
      current = { meal: mealOf(line), day: null, lines: [] };
      continue;
    }
    if (label) {
      const meal = mealOf(label[1]);
      if (!current || current.meal !== meal || current.lines.length > 0) {
        close(false);
        current = { meal, day: null, lines: [] };
      }
      current.day = dayIndex(label[2]);
      if (label[3]) current.lines.push(label[3]);
      continue;
    }
    if (FOOTER.test(line)) {
      if (current && current.day === null) current.day = dayIndex(line);
      close(true);
      continue;
    }
    if (current) current.lines.push(line);
    else ignoredTop += 1;
  }
  close(false); // ran off the bottom of the screenshot
  return { meals: meals.filter((m) => m.meal && m.dishes.length > 0), ignoredTop };
}

// Several screenshots (in any order, overlapping) -> one dish list per meal.
// A complete card beats a cut-off one for the same meal.
export function mergeMeals(results) {
  const best = new Map();
  for (const { meals } of results) {
    for (const m of meals) {
      const have = best.get(m.meal);
      if (!have || (m.complete && !have.complete) || (m.complete === have.complete && m.dishes.length > have.dishes.length)) {
        best.set(m.meal, m);
      }
    }
  }
  return MEALS.filter((meal) => best.has(meal)).map((meal) => best.get(meal));
}

// Monday = 0, in campus time.
export function campusWeekday(date = new Date()) {
  const name = date.toLocaleDateString("en-US", { weekday: "long", timeZone: "Asia/Kolkata" }).toLowerCase();
  return DAYS.indexOf(name);
}

export const DAY_NAMES = DAYS.map((d) => d[0].toUpperCase() + d.slice(1));
