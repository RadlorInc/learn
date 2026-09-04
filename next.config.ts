import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,

  typescript: {
    ignoreBuildErrors: false,
  },

  // Image optimization. `sharp` ships as next's own optionalDependency, so next/image transcodes the
  // heavy PNG/JPEG art to AVIF/WebP at the requested display size on demand. This is the single
  // biggest bandwidth/LCP win for the story art — measured on production, `garden.png` goes
  // 583,594 B of PNG → 81,391 B of AVIF at w=1280, a 7.2× cut, and one chapter's backdrops went
  // 2.3 MB → 277 KB. The 3–11 and 12–18 chapters reach it through `shared/ui/SceneBg`.
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 640, 768, 1024, 1280, 1536],
    imageSizes: [64, 96, 128, 256],
    /**
     * ⚠️ THIS NUMBER IS NOT WHAT PRODUCTION SERVES, AND THE DIFFERENCE IS VERCEL, NOT A BUG.
     * Measured on ONE commit, same source header, two optimizers:
     *
     *   next start (Next's own)   cache-control: public, max-age=31536000, must-revalidate
     *   Vercel                    cache-control: public, max-age=2592000, stale-while-revalidate=31536000
     *
     * Next treats `minimumCacheTTL` as a FLOOR; Vercel's optimizer passes the UPSTREAM image's
     * `Cache-Control` through instead — and the upstream is now the `/assets/:path*` rule in
     * `headers()` below, which deliberately says 30 days + a year of stale-while-revalidate rather
     * than `immutable` (see that rule for why: this repo has rewritten art in place before).
     *
     * So on prod the optimized variants inherit 30 days + SWR. That is FINE and arguably better —
     * stale-while-revalidate means no request ever blocks on a revalidation, and an in-place art
     * edit now propagates through the optimizer too instead of being pinned for a year. It is
     * recorded here only because the config saying `31536000` while prod says `2592000` is exactly
     * the kind of thing that eats an afternoon.
     *
     * The value STAYS a year: it is still the floor for Next's own optimizer (self-hosted, `next
     * start`, the C7 gate) and for any source that arrives without a `Cache-Control` of its own.
     *
     * ⚠️ Deliberately NOT gated. The behaviour is Vercel-side and invisible to `headers()`, so any
     * test written here could only assert that this file contains the number it contains — an inert
     * check that would read as coverage. Re-measure it with a `curl -I` against the live origin
     * after any change to the `/assets` rule.
     */
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
              /** 'wasm-unsafe-eval' + jsDelivr: the MediaPipe hand-tracking WASM loader.
               *  ⚠️ 'unsafe-eval' IN DEV ONLY, and it is not cosmetic: React's dev build calls
               *  `eval()` for its debugging features, so with it blocked EVERY page logs a console
               *  error — which made `npm run test:chapters` (the C7 gate, whose contract is "zero
               *  console errors") fail 210 of 211 against the dev server it is documented to drive.
               *  It went unnoticed because the gate was last run against production. Never shipped:
               *  this whole branch is dropped from the production header. */
              `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${process.env.NODE_ENV === 'production' ? '' : " 'unsafe-eval'"} https://cdn.jsdelivr.net`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              // 'self' only — the fonts are self-hosted now. data: stays for inlined glyphs.
              "font-src 'self' data:",
              /** ⚠️ WITHOUT THIS THE RECORDED VOICE IS SILENTLY DEAD ON MOBILE, and nothing in the
               *  app reports it. `media-src` was unset, so `default-src 'self'` was the fallback and
               *  it blocked the `data:` WAV that `unlockVoiceClips()` plays inside the intro tap —
               *  the mobile-autoplay unlock. Blocked, the element is never unlocked, so every
               *  ElevenLabs clip in bands 12–18 falls back to browser speech, which most Chrome
               *  installs do not have. Caught on PROD, in the console, after the CSP went enforcing;
               *  the clips themselves are 'self' (/audio/<voice>/*.mp3). */
              "media-src 'self' data:",
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
        /**
         * ⚠️ THE ART WAS BEING REVALIDATED ON EVERY SINGLE REQUEST. Measured on production:
         * `/assets/backgrounds/garden.png` came back `cache-control: public, max-age=0,
         * must-revalidate` — Next's default for `public/` — against a 583 KB body. That is 41 MB of
         * backdrops and sprite sheets plus 16 MB of voice clips, none of which has ever changed
         * under its own name, costing a conditional round-trip per file per load for every client
         * the service worker is not controlling: a first visit, the load right after an SW update,
         * a private window, and any phone that has evicted the SW cache. It is the single largest
         * scalability item in the app, and it is a header.
         *
         * NOT `immutable`: this repo has rewritten art IN PLACE before (the 83 MB → 58 MB
         * recompression pass rewrote 86 files under their existing names), so a year of immutable
         * would strand those clients for a year. A month of freshness with a year of
         * stale-while-revalidate gives the same zero-round-trip serve in the common case, and an
         * in-place art change still propagates on its own — immediately for SW-controlled clients,
         * since `sw.js`'s VERSION keys the asset cache and `npm run preflight` already fails a
         * shipped-file change that does not bump it.
         */
        source: '/assets/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=31536000' }],
      },
      {
        // Same argument, for the pre-rendered ElevenLabs voice clips (16 MB) and the PWA icons.
        source: '/audio/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=31536000' }],
      },
      {
        /**
         * ⚠️ THE VOICE MANIFEST IS AN INDEX, NOT AN ASSET, AND THE RULE BELOW WAS BURYING IT.
         * ⚠️ IT SITS AFTER THE GENERAL RULE ON PURPOSE — the LAST matching rule wins (measured
         * in assetCacheHeaders.test.ts), so placed above it this would have been inert.
         * `/audio/:path*` gives it 30 days of freshness plus a YEAR of stale-while-revalidate —
         * correct for a clip (content-addressed, can never go stale) and wrong for the one file
         * that says WHICH clips exist. Measured 2026-09-04 on the founder's Chrome: it answered
         * 433 keys against a live 670, so the new 17–18 clips were on the CDN and never asked
         * for, while 12–14 and 15–16 (already in the stale copy) played perfectly — a
         * band-shaped symptom with no band-shaped cause. Revalidate every time; it is 4 KB and
         * an unchanged one costs a 304.
         */
        source: '/audio/:voice/manifest.json',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }],
      },
      {
        source: '/audio/:voice/frag/fragments.json',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }],
      },
      {
        source: '/icons/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=31536000' }],
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