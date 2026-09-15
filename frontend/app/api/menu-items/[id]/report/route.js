const BACKEND_URL = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8080";

// Same-origin proxy: the browser only ever talks to this Next.js route, never
// directly to the Spring Boot backend, so the backend needs no CORS config —
// mirrors mealdeck_deployed/frontend's documented "relative /api/... paths,
// proxied" pattern (nginx does the proxying there; this route does it here).
export async function POST(request, { params }) {
  const { id } = await params;
  const res = await fetch(`${BACKEND_URL}/api/menu-items/${id}/report`, { method: "POST" });
  return new Response(null, { status: res.status });
}
