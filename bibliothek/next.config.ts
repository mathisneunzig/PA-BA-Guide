import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'covers.openlibrary.org' }, // Open Library book covers
      { protocol: 'https', hostname: 'books.google.com' },        // Google Books covers
    ],
  },
};

export default nextConfig;
