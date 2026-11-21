import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });

/** Build the allowed remote pattern for backend media. The backend emits
 *  absolute image URLs whose origin is deploy-time configurable
 *  (`NEXT_PUBLIC_MEDIA_BASE_URL`, shared with `src/lib/env.ts`), so a static
 *  `remotePatterns` list cannot know the host ahead of time. Derive it at
 *  config time and keep a localhost/media default for dev. */
function mediaRemotePattern() {
  const raw =
    process.env.NEXT_PUBLIC_MEDIA_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'http://localhost:3000';
  try {
    const url = new URL(raw);
    return {
      protocol: url.protocol.slice(0, -1), // 'http:' -> 'http'
      hostname: url.hostname,
      port: url.port || undefined,
      pathname: '/**',
    };
  } catch {
    return { protocol: 'http', hostname: 'localhost', port: '3000', pathname: '/media/**' };
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Keep the configured public media host and the local API origin allowed.
    // With a Cloudflare tunnel exposing only Next.js, the Next image optimizer
    // runs on this machine and can fetch media from the local backend.
    remotePatterns: [
      mediaRemotePattern(),
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    // Reverse proxy for the frozen API: browser calls stay same-origin
    // (`/api/v1/*`) and Next.js forwards them to the backend in the background,
    // so CORS disappears permanently. Server Components still call the backend
    // directly via API_SERVER_BASE_URL (src/lib/env.ts).
    const backend =
      process.env.API_SERVER_BASE_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      'http://localhost:3000';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backend}/api/v1/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
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

export default withBundleAnalyzer(nextConfig);
