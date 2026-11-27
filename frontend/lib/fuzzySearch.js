// Typo-tolerant dish search: "panner tika" finds Paneer Tikka, "manchoorian"
// finds Manchurian, "chiken" finds Chicken.
//
// A small model fitted on the menu itself:
//  - every word in every dish name and category is split into character
//    trigrams (" pa", "pan", "ane", ...), so near-misses share most pieces;
//  - each menu word gets an IDF weight learned from how many dishes use it, so
//    a rare word ("tikka") counts more than one on half the menu ("veg");
//  - a typed word matches menu words by trigram overlap (Dice coefficient),
//    or as a prefix while it's still being typed ("pan" -> paneer).
// A dish matches when every typed word matches one of its words; dishes are
// ranked by the IDF-weighted similarity. Pure functions, no browser APIs.

export const MIN_SIMILARITY = 0.45;

export function normalize(text) {
  return (text ?? "").toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function words(text) {
  return normalize(text).split(" ").filter((w) => w.length > 0);
}

function trigrams(word) {
  const padded = ` ${word} `;
  const grams = new Set();
  for (let i = 0; i < padded.length - 2; i += 1) grams.add(padded.slice(i, i + 3));
  return grams;
}

// Dice coefficient of two trigram sets: 1 for identical, 0 for nothing shared.
function dice(a, b) {
  let shared = 0;
  for (const g of a) if (b.has(g)) shared += 1;
  return (2 * shared) / (a.size + b.size);
}

// Edit distance where swapping two neighbouring letters counts as one edit
// (optimal string alignment): "briyani" -> "biryani" is 1, "chikn" ->
// "chicken" is 2. Catches short typos that share few trigrams.
function editDistance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j += 1) d[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

// Words in a dish's name count fully; words only in its menu section (e.g.
// "Hot Coffee" over an "Espresso") count for less.
const CATEGORY_WEIGHT = 0.5;
// Edit-distance similarity needs to be at least this to count on its own.
const MIN_EDIT_SIMILARITY = 0.6;

// items: [{ id, name, category }]. Returns an index for search().
export function buildIndex(items) {
  const vocab = new Map(); // word -> { grams, docs }
  const itemWords = new Map(); // item id -> Map(word -> 1 for name words, CATEGORY_WEIGHT for section-only words)
  for (const item of items) {
    const ws = new Map();
    for (const w of words(item.category)) ws.set(w, CATEGORY_WEIGHT);
    for (const w of words(item.name)) ws.set(w, 1);
    itemWords.set(item.id, ws);
    for (const w of ws.keys()) {
      if (!vocab.has(w)) vocab.set(w, { grams: trigrams(w), docs: 0 });
      vocab.get(w).docs += 1;
    }
  }
  const n = Math.max(items.length, 1);
  for (const entry of vocab.values()) entry.idf = Math.log(1 + n / entry.docs);
  return { vocab, itemWords };
}

// The menu words a typed word could mean, with how close each is (0-1).
function candidates(index, typed, isLast) {
  const grams = trigrams(typed);
  const found = new Map();
  for (const [word, entry] of index.vocab) {
    let sim = word === typed ? 1 : dice(grams, entry.grams);
    if (sim < 1 && typed.length >= 4 && Math.abs(word.length - typed.length) <= 3) {
      const edit = 1 - editDistance(typed, word) / Math.max(typed.length, word.length);
      if (edit >= MIN_EDIT_SIMILARITY) sim = Math.max(sim, edit);
    }
    // Still typing the last word: a prefix counts as a strong match.
    if (isLast && typed.length >= 2 && word.startsWith(typed)) sim = Math.max(sim, 0.9);
    // Short words need to be exact or prefixes; trigrams of "ka" mean little.
    if (typed.length <= 2 && !word.startsWith(typed)) continue;
    if (sim >= MIN_SIMILARITY) found.set(word, sim);
  }
  return found;
}

// query -> Map(item id -> score), best first. Empty map when nothing matches.
// requireAll: false scores dishes that match only some of the typed words
// (used to find similar dishes, not for search).
export function search(index, query, { requireAll = true } = {}) {
  const typed = words(query);
  if (typed.length === 0) return new Map();
  const perWord = typed.map((w, i) => candidates(index, w, i === typed.length - 1));
  const scores = [];
  for (const [id, ws] of index.itemWords) {
    let score = 0;
    let all = true;
    for (const cands of perWord) {
      let best = 0;
      for (const [w, weight] of ws) {
        const sim = cands.get(w);
        // Cubed, so a close match beats a loose one on a rarer word
        // ("cofee": coffee at 0.83 must outrank cone at 0.6).
        const value = sim ? sim ** 3 * weight * index.vocab.get(w).idf : 0;
        if (value > best) best = value;
      }
      if (best === 0 && requireAll) { all = false; break; }
      score += best;
    }
    if (all && score > 0) scores.push([id, score]);
  }
  scores.sort((a, b) => b[1] - a[1]);
  return new Map(scores);
}

// For "Did you mean …?": the closest menu word to each typed word, when the
// typed word isn't on the menu itself.
export function suggestion(index, query) {
  const typed = words(query);
  let changed = false;
  const fixed = typed.map((w) => {
    if (index.vocab.has(w)) return w;
    const cands = [...candidates(index, w, false)].sort((a, b) => b[1] - a[1]);
    if (cands.length === 0) return w;
    changed = true;
    return cands[0][0];
  });
  return changed ? fixed.join(" ") : null;
}
