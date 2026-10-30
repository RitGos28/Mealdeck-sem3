import { VARIANTS } from "./variants";

// Index of the navigation varieties, each linking to its first screen.
export const dynamic = "force-static";

export function GET() {
  const rows = VARIANTS.map((variant, i) => `
    <li><a href="/trial/nav/${i + 1}/1"><b>${i + 1} · ${variant.TITLE}</b><span>${variant.IDEA}</span><em>${variant.DESIGNS.length} screens</em></a></li>`).join("");
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>MealDeck navigation options</title>
<style>
body{margin:0;background:#E9ECE8;font:15px/1.45 Inter,system-ui,sans-serif;color:#14201A}
main{max-width:640px;margin:0 auto;padding:32px 16px}
h1{font:400 30px Georgia,serif;margin:0 0 4px}p{margin:0 0 20px;color:#5C6B62}
ul{list-style:none;margin:0;padding:0;display:grid;gap:10px}
a{display:grid;gap:2px;padding:14px 16px;border-radius:16px;background:#fff;color:inherit;text-decoration:none;border:1px solid #E6EAE5}
a:hover{border-color:#163D29}span{color:#3E4C44}em{font-style:normal;font-size:13px;color:#6B756F}
</style></head><body><main>
<h1>How students pick a restaurant</h1><p>Ten navigation ideas for the menu, each as a few phone screens with real dishes.</p>
<ul>${rows}</ul></main></body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
