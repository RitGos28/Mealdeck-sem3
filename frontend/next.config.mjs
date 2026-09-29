const BACKEND_URL = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8080";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emits .next/standalone (a minimal server.js plus only the node_modules
  // it traces as needed), so the Docker runtime image skips `npm ci`.
  output: "standalone",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  // Local dev only in practice: under docker-compose, nginx sends /api/*
  // straight to the backend before it reaches Next. Note this is resolved
  // at `next build` time, so the Dockerfile passes BACKEND_INTERNAL_URL as
  // a build arg.
  //
  // Proxies the whole /api/* surface to the backend at the routing layer, so
  // client components can just call relative /api/... paths same-origin (no
  // CORS) without a hand-written route handler per backend endpoint — this
  // covers every future mutation (auth, ordering, etc.), not just today's one.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }];
  },
};

export default nextConfig;
