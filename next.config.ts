import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: false,

  typescript: {
    ignoreBuildErrors: false,
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