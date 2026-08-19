import type { Metadata, Viewport } from 'next'
import { Fredoka, Nunito, IBM_Plex_Sans, IBM_Plex_Mono, Gaegu } from 'next/font/google'
import { MiloErrorBoundary } from '@/shared/ui/ErrorBoundary'
import StorageGate from '@/shared/ui/StorageGate'
import { SITE_URL } from './site'

import { OfflineBanner } from '@/infra/useOfflineSync'
import './globals.css'
import { ToastProvider } from '@/shared/ui/Toast'

/**
 * ⚠️ THE FONTS ARE SELF-HOSTED, AND THAT IS THREE FIXES IN ONE. They used to be three CSS
 * `@import`s to `fonts.googleapis.com` in `globals.css`, which meant:
 *   1. **the CSP could never be enforced** — `font-src 'self' data:` does not allow gstatic, so
 *      turning the report-only policy on would have rendered the entire product in fallback
 *      system fonts. This is what unblocks that.
 *   2. CSS `@import` is the slowest way to load a font — a render-blocking request chain on the
 *      critical path, paid by a child on a slow phone.
 *   3. every child's browser made a request to Google, which is a third-party data flow a COPPA
 *      data-map has to account for. Now there are none.
 * Found by the all-chapters gate, which caught an intermittent `fonts.gstatic.com` 404.
 *
 * ⚠️ THE WEIGHTS MUST MATCH WHAT THE CSS ACTUALLY ASKS FOR. These are not a guess: they are the
 * exact sets the three `@import` URLs requested. Dropping one renders that weight as a synthesised
 * bold, which is the kind of thing nobody sees until a founder does.
 *
 * `display: 'swap'` keeps text visible while the font loads — the same behaviour the `&display=swap`
 * in the old URLs bought, and the right call for a reading app.
 */
const fredoka = Fredoka({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--f-fredoka', display: 'swap' })
const nunito = Nunito({ subsets: ['latin'], weight: ['600', '700', '800', '900'], variable: '--f-nunito', display: 'swap' })
const plexSans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--f-plex-sans', display: 'swap' })
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--f-plex-mono', display: 'swap' })
/**
 * ⚠️ `preload: false` IS LOAD-BEARING AND IT IS THE WHOLE FONT BUDGET.
 *
 * `next/font/google` defaults to `preload: true`, which emits a `<link rel="preload">` for EVERY
 * unicode-range subset of the family — on every page. Gaegu is a Korean face, so that is ~45 ranges
 * × 2 weights = **90 preload links**. Measured on production 2026-08-19: the landing page preloaded
 * **90 Gaegu files, 671 KB — 82% of all font bytes and ~40% of the entire first visit — while
 * rendering ZERO elements in it.** The other four families are 1–4 files and 29–39 KB each.
 *
 * Gaegu is the chalkboard face (`--font-chalk`), used only inside teen-band chapters. It still
 * loads there, on demand, per unicode-range, and `display: 'swap'` means the board renders in the
 * fallback for a beat rather than blocking. Do not turn preload back on to fix a flash of fallback
 * text on the chalkboard — that trade costs every child on every page 671 KB.
 *
 * The other four stay preloaded deliberately: Fredoka is the landing page's LCP text, and none of
 * them is big enough to be worth the risk of a late swap.
 */
const gaegu = Gaegu({ subsets: ['latin'], weight: ['400', '700'], variable: '--f-gaegu', display: 'swap', preload: false })

const FONT_VARS = [fredoka, nunito, plexSans, plexMono, gaegu].map(f => f.variable).join(' ')

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#F26B2C',
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
 * ⚠️ MILO IS THE CHARACTER. ADAPTIVELEARN IS THE PRODUCT. Only naming positions — the title,
 * the manifest, the wordmark, the legal definitions — carry the product name. Everywhere the pony
 * is doing something (speaking, asking, tripping over an error) he stays Milo, and that is
 * deliberate: it is the Duo/Duolingo split, not an inconsistency. Do not "fix" it either way.
 *
 * ⚠️ THE DESCRIPTION SAYS WHAT THE PRODUCT DOES, NOT WHAT IT IS CALLED. "Milo's interactive
 * learning adventure for kids" contains no word a parent would type. This one names the job
 * (find the gap) and the ages, because the description is the only sentence most people read.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AdaptiveLearn — find the gap that's holding your child back in math",
    template: '%s · AdaptiveLearn',
  },
  description:
    'A short placement check finds the deepest gap under your child’s math — not the newest thing they got wrong — then a plan fixes it. Ages 3–18. No timer, no score, no red crosses.',
  applicationName: 'AdaptiveLearn',
  openGraph: {
    type: 'website',
    siteName: 'AdaptiveLearn',
    title: "AdaptiveLearn — find the gap that's holding your child back in math",
    description:
      'A short placement check finds the deepest gap under your child’s math, then a plan fixes it. Ages 3–18.',
    url: '/',
    // ⚠️ No `images` here on purpose — `app/opengraph-image.tsx` supplies the 1200×630 card.
    // Naming one back would override the file-based route and reinstate the square.
  },
  twitter: {
    card: 'summary',
    title: "AdaptiveLearn — find the gap that's holding your child back in math",
    description:
      'A short placement check finds the deepest gap under your child’s math, then a plan fixes it. Ages 3–18.',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AdaptiveLearn',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'AdaptiveLearn',
    'msapplication-TileColor': '#F26B2C',
    'msapplication-tap-highlight': 'no',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={FONT_VARS}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144.png" />
        <link rel="apple-touch-icon" sizes="128x128" href="/icons/icon-128.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        <MiloErrorBoundary>
          <StorageGate>
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