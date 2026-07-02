import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: false,

  typescript: {
    ignoreBuildErrors: false,
  },

  // Image optimization. `sharp` is already a dependency, so next/image transcodes the
  // heavy PNG/JPEG art to AVIF/WebP at the requested display size on demand and caches
  // it for a year. This is the single biggest bandwidth/LCP win for the story art
  // (originals are 2–3 MB each) — as <img> tags migrate to next/image they inherit it.
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 640, 768, 1024, 1280, 1536],
    imageSizes: [64, 96, 128, 256],
    minimumCacheTTL: 31536000,
  },

  // Tighten tree-shaking on the Supabase clients so authed routes only pull what they use.
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', '@supabase/ssr'],
  },

  async headers() {
    return [
      {
        // Baseline hardening on every route. (No Content-Security-Policy yet — the app leans on
        // inline styles + Google Fonts + Supabase, so a CSP needs its own careful allowlist pass.)
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },                         // clickjacking: not embeddable
          { key: 'X-Content-Type-Options', value: 'nosniff' },               // no MIME sniffing
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
    ]
  },
}

export default nextConfig