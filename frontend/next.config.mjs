const BACKEND_URL = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8080";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  // Proxies the whole /api/* surface to the backend at the routing layer, so
  // client components can just call relative /api/... paths same-origin (no
  // CORS) without a hand-written route handler per backend endpoint — this
  // covers every future mutation (auth, ordering, etc.), not just today's one.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }];
  },
};

export default nextConfig;
