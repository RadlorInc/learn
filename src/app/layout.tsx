import type { Metadata, Viewport } from 'next'
import { MiloErrorBoundary } from '@/shared/ui/ErrorBoundary'
import StorageGate from '@/shared/ui/StorageGate'

import { OfflineBanner } from '@/infra/useOfflineSync'
import './globals.css'
import { ToastProvider } from '@/shared/ui/Toast'

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
    <html lang="en">
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