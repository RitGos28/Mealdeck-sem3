// Copies the OCR engine (tesseract.js worker + WebAssembly core) and the
// English model into public/ocr, so the MyCamu screenshot reader loads them
// from MealDeck itself instead of a third-party CDN. Runs before `next dev`
// and `next build` (package.json pre-scripts); public/ocr is gitignored.
import { copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const modules = path.join(root, "node_modules");
const out = path.join(root, "public", "ocr");
mkdirSync(out, { recursive: true });

const files = [
  ["tesseract.js/dist/worker.min.js", "worker.min.js"],
  // LSTM-only builds (what the reader uses); the worker picks the one the
  // browser supports: relaxed SIMD, SIMD, or plain.
  ["tesseract.js-core/tesseract-core-lstm.wasm.js", "tesseract-core-lstm.wasm.js"],
  ["tesseract.js-core/tesseract-core-simd-lstm.wasm.js", "tesseract-core-simd-lstm.wasm.js"],
  ["tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js", "tesseract-core-relaxedsimd-lstm.wasm.js"],
  // The compact "best_int" English model (~3 MB, gzipped).
  ["@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz", "eng.traineddata.gz"],
];
for (const [from, to] of files) copyFileSync(path.join(modules, from), path.join(out, to));
console.log(`OCR assets copied to public/ocr (${files.length} files)`);
