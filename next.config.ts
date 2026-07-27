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

  // Tighten tree-shaking on the Supabase client so authed routes only pull what they use.
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js'],
  },

  async headers() {
    return [
      {
        // Baseline hardening on every route.
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },                         // clickjacking: not embeddable
          { key: 'X-Content-Type-Options', value: 'nosniff' },               // no MIME sniffing
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // V3: force HTTPS for 2 years incl. subdomains (Vercel serves HTTPS but adds no HSTS itself).
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // V3: deny every powerful feature. The camera grant existed only for the AR hand-tracking
          // games under /play/* — those are deleted and nothing calls getUserMedia now, so the app
          // was advertising a capability it cannot use. (Milo's voice is speechSynthesis, which is
          // output-only and needs no Permissions-Policy grant.)
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          // V3/V4 — CSP. The app is fully STATIC-rendered, so a nonce-based strict CSP is not viable
          // (Next requires dynamic rendering on every page for nonces — killing static/CDN caching and
          // risking the AR + OAuth flows). So we split it:
          //
          //  1) ENFORCED subset below — only directives with no legitimate use in this app, so they
          //     cannot break anything: no <object>/<embed>, no <base> hijack, no external framing,
          //     forms post only to self/Google, and http subresources auto-upgrade. Real protection now.
          //     (Deliberately NO default-src here — that would cascade and restrict scripts/fetch/img.)
          {
            key: 'Content-Security-Policy',
            value: [
              "object-src 'none'",
              "base-uri 'self'",
              "frame-ancestors 'none'",
              "form-action 'self' https://accounts.google.com",
              // upgrade-insecure-requests is production-only: Safari (unlike Chrome) applies it
              // even on http://localhost, rewriting EVERY subresource to https:// — the plain-HTTP
              // dev server can't answer, so no JS/CSS loads and the app never hydrates (blank splash).
              ...(process.env.NODE_ENV === 'production' ? ['upgrade-insecure-requests'] : []),
            ].join('; '),
          },
          //  2) REPORT-ONLY full strict policy — collects real violations (toward enforcing script-src
          //     via experimental SRI, plus the exact connect/img/style allowlist) WITHOUT breaking the
          //     app. Add a report-uri + flip to enforced once the reports are clean. The app now ships
          //     no inline scripts of its own (SW registration moved to /public/sw-register.js), so the
          //     only remaining script-src gap is Next's own static-hydration inline scripts.
          {
            key: 'Content-Security-Policy-Report-Only',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self' https://accounts.google.com",
              "object-src 'none'",
            ].join('; '),
          },
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