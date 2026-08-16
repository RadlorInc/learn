import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: false,

  typescript: {
    ignoreBuildErrors: false,
  },

  // Image optimization. `sharp` ships as next's own optionalDependency, so next/image transcodes the
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
          // ⚠️ `camera=(self)` is granted for ONE feature: the 9–11 Factor Lab, which is answered by
          // holding fingers up to a webcam (story/FactorLab.tsx). Hand landmarks are computed
          // ON-DEVICE and no frame ever leaves the browser. It was deliberately revoked in the July
          // audit when the /play AR track was deleted — if this chapter ever goes, revoke it again.
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(), interest-cohort=()' },
          /**
           *  CSP — ONE ENFORCED POLICY (2026-08-16). It used to be two headers: a small enforced
           *  subset plus a Report-Only full policy. Browsers AND multiple CSP headers together, so
           *  keeping both once the full one is enforced is redundant and makes the real policy hard
           *  to read. The subset's directives are all folded in below.
           *
           *  The app is fully STATIC-rendered, so a nonce-based strict CSP is not viable — Next
           *  requires dynamic rendering on every page for nonces, which would kill static/CDN
           *  caching and risk the AR + OAuth flows.
           *
           *  It stayed Report-Only for months for one reason: the fonts came from
           *  `fonts.googleapis.com` at runtime, so enforcing `font-src 'self'` would have rendered
           *  the entire product in fallback system fonts. `next/font` now self-hosts all five
           *  families, which is what unblocked this.
           *
           *  ⚠️ AND ENFORCING THE POLICY AS IT WAS WRITTEN WOULD HAVE KILLED EVERY AR CHAPTER —
           *     the 9–11 band's defining feature. `@mediapipe/tasks-vision` fetches its WASM from
           *     jsDelivr and its hand model from storage.googleapis.com AT RUNTIME, instantiates
           *     WebAssembly (which needs `wasm-unsafe-eval`), and runs its detector in a worker
           *     created from a `blob:` URL. `default-src 'self'` blocks all three, and the failure
           *     is silent unless you actually open the camera. Every entry below that is not
           *     `'self'` is here for a reason that was verified by driving the app, not assumed.
           *
           *  Two `'unsafe-inline'`s remain, both load-bearing rather than lazy:
           *   • script-src — Next inlines its own hydration payload (`self.__next_f.push`). The app
           *     ships no inline scripts OF ITS OWN (SW registration lives in /public/sw-register.js
           *     for exactly this reason); removing this needs Next's nonce support via middleware,
           *     which is a bigger change than launch week should carry.
           *   • style-src — this codebase styles almost everything with React inline `style` props.
           *     Removing it is a rewrite, not a config change.
           *  Enforcing WITH them is still a large win: it blocks every script, frame, form target
           *  and connection origin that is not on this list.
           */
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // 'wasm-unsafe-eval' + jsDelivr: the MediaPipe hand-tracking WASM loader.
              "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              // 'self' only — the fonts are self-hosted now. data: stays for inlined glyphs.
              "font-src 'self' data:",
              // Supabase (REST + realtime), and the two origins MediaPipe pulls its model from.
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://cdn.jsdelivr.net https://storage.googleapis.com",
              // MediaPipe runs its detector in a blob: worker; our own service worker is 'self'.
              "worker-src 'self' blob:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self' https://accounts.google.com",
              "object-src 'none'",
              /**
               * ⚠️ PRODUCTION ONLY. Safari (unlike Chrome) applies this even on http://localhost,
               * rewriting EVERY subresource to https:// — the plain-HTTP dev server cannot answer,
               * so no JS/CSS loads and the app never hydrates (blank splash).
               */
              ...(process.env.NODE_ENV === 'production' ? ['upgrade-insecure-requests'] : []),
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