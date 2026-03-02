import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        // Serve pre-generated audio from .next/static/audio/ on Amplify.
        // In dev mode, Next.js serves from public/ directly so this is a no-op.
        source: "/audio/:path*",
        destination: "/_next/static/audio/:path*",
      },
    ];
  },
};

export default nextConfig;
