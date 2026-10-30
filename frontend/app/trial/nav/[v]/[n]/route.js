import { VARIANTS } from "../../variants";
import { trialResponse } from "../../../shell";

// Static sample data, so every screen is prerendered at build time.
export const dynamic = "force-static";

export function generateStaticParams() {
  return VARIANTS.flatMap((variant, v) => variant.DESIGNS.map((_, n) => ({ v: String(v + 1), n: String(n + 1) })));
}

export async function GET(_request, { params }) {
  const { v, n } = await params;
  const variant = /^\d+$/.test(v) ? VARIANTS[Number(v) - 1] : undefined;
  if (!variant) return new Response("Not found", { status: 404 });
  const designs = variant.DESIGNS.map((design) => ({ ...design, title: `${v}.${design.title} (${variant.TITLE})` }));
  return trialResponse(designs, `/trial/nav/${v}`, n);
}
