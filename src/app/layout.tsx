import type { Metadata, Viewport } from 'next'
import { preload } from 'react-dom'
import { MiloErrorBoundary } from '@/shared/ui/ErrorBoundary'
import StorageGate from '@/shared/ui/StorageGate'
import { APP_NAME, SITE_URL } from './site'

import { OfflineBanner } from '@/infra/useOfflineSync'
import AuthEventLogger from '@/infra/AuthEventLogger'
import './fonts.css'
import './globals.css'
import { ToastProvider } from '@/shared/ui/Toast'

/**
 * ⚠️ THE FONTS ARE SELF-HOSTED FROM THE REPO — `public/fonts/` + `./fonts.css` — AND NOTHING FETCHES THEM FROM GOOGLE,
 * NOT EVEN THE BUILD. Two steps got here:
 *   1. (2026-08) three CSS `@import`s to `fonts.googleapis.com` → `next/font/google`: the CSP's `font-src 'self'` could
 *      then be enforced, no render-blocking @import chain, and no child's browser talks to Google.
 *   2. (2026-09-26) `next/font/google` → files in the repo: it downloaded every face from Google AT BUILD TIME, and
 *      that download failed intermittently (`Can't resolve '@vercel/turbopack-next/internal/font/google/font'` —
 *      2 of ~15 local builds and one CI run on 26 Sep). A failed production build keeps the old deploy serving with
 *      nothing red. `fonts.css` is that build's own output with only the url()s rewritten, so nothing looks different.
 *
 * ⚠️ WHY NOT `next/font/local`: Google splits each family into unicode-range slices (Gaegu ~90 per weight, many of
 * them carrying chalkboard symbols like ← ▶ △) and `next/font/local` cannot give each file its own range, so a
 * one-file-per-weight version would change which glyphs render. Plain CSS keeps every slice.
 *
 * ⚠️ PRELOADS: the same seven latin files `next/font/google` preloaded (Fredoka, Nunito, IBM Plex Sans, IBM Plex Mono
 * ×4). Gaegu is deliberately NOT preloaded — it is the chalkboard face, and preloading its slices cost 671 KB on every
 * page (measured 2026-08-19); it loads on demand where a chalkboard renders.
 *
 * ⚠️ THE WEIGHTS MUST MATCH WHAT THE CSS ASKS FOR: Fredoka 500–700, Nunito 600–900, Plex Sans/Mono 400–700,
 * Gaegu 400/700. A missing weight renders as a synthesised bold, which nobody sees until a founder does.
 */
const FONT_PRELOADS = [
  '5d52bd6c4cb3f315', // Fredoka latin (variable, 500–700)
  '07454f8ad8aaac57', // Nunito latin (variable, 600–900)
  '03fc1b4a8d284b5e', // IBM Plex Sans latin (variable, 400–700)
  '99e609270109b47d', // IBM Plex Mono latin 400
  'effe91970fc4db64', // IBM Plex Mono latin 500
  '23b7a97ae3b5c134', // IBM Plex Mono latin 600
  'a7e15459c1805da0', // IBM Plex Mono latin 700
]

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#EFF8FF',
  viewportFit: 'cover',
}

/**
 * ⚠️ `metadataBase` IS WHAT MAKES EVERY OTHER URL HERE ABSOLUTE. Without it Next emits a relative
 * `og:image`, which every scraper (WhatsApp, iMessage, Slack, X) drops — so a shared link previewed
 * as a blank card, which is the single most likely way a parent meets this product.
 *
 * The `template` gives every page a suffix without each page repeating it; `/help` and
 * `/legal/[slug]` already export their own titles and now inherit the brand for free.
 *
 * ⚠️ THE PRODUCT IS RADLIC (renamed 2026-09-24 from AdaptiveLearn, which was renamed from Milo) AND THERE IS NO
 * MASCOT. Every naming position — the title, the manifest, the wordmark, the legal definitions — reads `APP_NAME`;
 * nothing speaks or apologises as a character. `renameGate.test.ts` fails if either name, or the fox as a brand,
 * comes back.
 *
 * ⚠️ THE DESCRIPTION SAYS WHAT THE PRODUCT DOES, NOT WHAT IT IS CALLED. "<Name>'s interactive
 * learning adventure for kids" contains no word a parent would type. This one names the job
 * (lessons that adapt) and the grades, because the description is the only sentence most people read.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${APP_NAME} — math lessons that adapt to your child, grades 3 to 8`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    'Math for grades 3 to 8: each lesson explains one idea step by step, then practice adapts to what your child gets right and wrong. You choose the lessons. No timer, no red crosses.',
  applicationName: APP_NAME,
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    title: `${APP_NAME} — math lessons that adapt to your child, grades 3 to 8`,
    description:
      'Math for grades 3 to 8: a lesson that explains one idea step by step, then practice that adapts to your child.',
    url: '/',
    // ⚠️ No `images` here on purpose — `app/opengraph-image.tsx` supplies the 1200×630 card.
    // Naming one back would override the file-based route and reinstate the square.
  },
  twitter: {
    // The card image is `opengraph-image.tsx`'s 1200×630 — `summary` would crop it to a small square (SEO-05).
    card: 'summary_large_image',
    title: `${APP_NAME} — math lessons that adapt to your child, grades 3 to 8`,
    description:
      'Math for grades 3 to 8: a lesson that explains one idea step by step, then practice that adapts to your child.',
  },
  manifest: '/manifest.json',
  /* ⚠️ `default`, NOT `black-translucent` (changed 2026-09-19). Translucent lays every page UNDER the iPhone's status
     bar when the app is opened from the home screen — the dashboard's Home / Learners bar sat under the clock and could
     not be tapped — and no page reserved the space. `default` makes iOS start the page below the bar, for every page at
     once, which no future page can forget. */
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': APP_NAME,
    'msapplication-TileColor': '#0B4FA8',
    'msapplication-tap-highlight': 'no',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  for (const f of FONT_PRELOADS) preload(`/fonts/${f}.woff2`, { as: 'font', type: 'font/woff2', crossOrigin: '' })
  return (
    // suppressHydrationWarning: /text-size.js sets `data-text` on <html> before React hydrates (Review 1 Q5).
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts -- deliberate: the chosen text size must apply before
            the first paint, or the page jumps. Static, not inline, like /sw-register.js. */}
        <script src="/text-size.js" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144.png" />
        <link rel="apple-touch-icon" sizes="128x128" href="/icons/icon-128.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body>
        <MiloErrorBoundary>
          <StorageGate>
            {/* One listener for the whole app: every sign-in, every provider, every route. */}
            <AuthEventLogger />
            {children}
            <OfflineBanner />
          </StorageGate>
          <ToastProvider />
        </MiloErrorBoundary>
        {/* SW registration lives in a static /public file (not inline) so the app ships no
            inline scripts of its own — a prerequisite for a strict script-src CSP. See next.config.ts.
            No `defer`: it must run mid-parse — if the HTML stream never finishes, a deferred
            script (and its localhost self-heal) would never execute. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts -- deliberate, see above: this
            must run mid-parse, and `defer` would skip it entirely on a stream that never ends. */}
        <script src="/sw-register.js" />
      </body>
    </html>
  )
}