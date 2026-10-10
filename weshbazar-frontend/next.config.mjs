/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Media is served by the backend (dev: PUBLIC_STORAGE_BASE_URL). Add the
    // production CDN/object-storage host here once known. Remote patterns are
    // required for next/image to optimize backend-hosted listing images.
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/media/**',
      },
    ],
  },
  async headers() {
    return [
      {
        // Private/admin surfaces must never be indexable (master prompt §20).
        source: '/admin/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/account/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
};

export default nextConfig;
