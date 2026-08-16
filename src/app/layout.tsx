import type { Metadata, Viewport } from 'next'
import { Fredoka, Nunito, IBM_Plex_Sans, IBM_Plex_Mono, Gaegu } from 'next/font/google'
import { MiloErrorBoundary } from '@/shared/ui/ErrorBoundary'
import StorageGate from '@/shared/ui/StorageGate'

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
const gaegu = Gaegu({ subsets: ['latin'], weight: ['400', '700'], variable: '--f-gaegu', display: 'swap' })

const FONT_VARS = [fredoka, nunito, plexSans, plexMono, gaegu].map(f => f.variable).join(' ')

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#F26B2C',
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: "Milo's Story Mode",
  description: "Milo's interactive learning adventure for kids",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Milo',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'Milo',
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
        <script src="/sw-register.js" />
      </body>
    </html>
  )
}