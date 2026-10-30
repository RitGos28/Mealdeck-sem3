import { DESIGNS } from "../designs";

// Serves the redesign mockups as whole HTML documents, outside the app's
// layout, so each one looks exactly as it was designed. Static sample data.
export const dynamic = "force-static";

export function generateStaticParams() {
  return DESIGNS.map((_, i) => ({ n: String(i + 1) }));
}

export async function GET(_request, { params }) {
  const { n } = await params;
  const i = Number(n) - 1;
  const design = DESIGNS[i];
  if (!/^\d+$/.test(n) || !design) return new Response("Not found", { status: 404 });

  const link = (k, label) =>
    DESIGNS[k] ? `<a href="/trial/redesign1/${k + 1}">${label}</a>` : `<span>${label}</span>`;
  const pills = DESIGNS.map((_, k) =>
    k === i ? `<b>${k + 1}</b>` : `<a href="/trial/redesign1/${k + 1}">${k + 1}</a>`).join("");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Redesign ${design.title}</title>
${design.head}
<style>
html,body{background:#E9ECE8}
.frame{margin:24px auto 0;width:390px;box-shadow:0 20px 60px -20px rgba(20,40,30,.35);border-radius:28px;overflow:hidden}
.trial{max-width:390px;margin:16px auto 32px;font:14px/1.4 Inter,system-ui,sans-serif;color:#3E4C44;text-align:center}
.trial h1{font-size:15px;margin:0 0 10px;color:#14201A}
.trial nav{display:flex;justify-content:center;gap:6px;flex-wrap:wrap}
.trial nav a,.trial nav b,.trial nav span{min-width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;border-radius:10px;background:#fff;color:#1F6B43;text-decoration:none;font-weight:600}
.trial nav b{background:#1F6B43;color:#fff}
.trial nav span{color:#B4BDB6}
.trial p{margin:10px 0 0;font-size:12px;color:#6B756F}
@media (max-width:430px){
  .frame{margin:0;width:100%;border-radius:0;box-shadow:none}
  .frame>div{width:100%!important;height:100dvh!important}
}
</style>
</head>
<body>
<div class="frame">${design.body}</div>
<div class="trial">
<h1>Option ${design.title}</h1>
<nav>${link(i - 1, "←")}${pills}${link(i + 1, "→")}</nav>
<p>Mockup with sample data. Buttons don't do anything yet.</p>
</div>
</body>
</html>`;

  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
