import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components (Next 16 PPR) is intentionally disabled for v1:
  // every public page reads Firestore at request time, and the classic
  // dynamic-rendering model keeps that simple and predictable.
  cacheComponents: false,
  reactStrictMode: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    // Bundled campus/faculty photos are WebP sources; serve AVIF where the browser supports it.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
