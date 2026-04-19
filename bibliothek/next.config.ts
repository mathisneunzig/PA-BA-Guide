import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Include email HTML templates in the standalone build
  outputFileTracingIncludes: {
    '/**': ['./lib/email/templates/**'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'covers.openlibrary.org' }, // Open Library book covers
      { protocol: 'https', hostname: 'books.google.com' },        // Google Books covers
    ],
  },
  // Ensure uploaded covers in public/uploads are served at runtime
  async headers() {
    return [
      {
        source: '/api/uploads/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]
  },
  // Redirect legacy /uploads/ paths to the API route that serves runtime-uploaded files
  async redirects() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
        permanent: false,
      },
    ]
  },
};

export default nextConfig;
