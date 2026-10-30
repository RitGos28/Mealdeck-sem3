import { DESIGNS } from "../designs";
import { trialResponse } from "../../shell";

// Static sample data, so every page is prerendered at build time.
export const dynamic = "force-static";

export function generateStaticParams() {
  return DESIGNS.map((_, i) => ({ n: String(i + 1) }));
}

export async function GET(_request, { params }) {
  return trialResponse(DESIGNS, "/trial/redesign3", (await params).n);
}
