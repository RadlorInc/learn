'use client'
/**
 * The last line of defence: the ROOT LAYOUT itself crashed.
 *
 * ⚠️ THIS FILE REPLACES THE ROOT LAYOUT, so it must render its own `<html>` and `<body>` — and it
 * gets **no global stylesheet and no fonts**. That is why `CrashScreen` is styled entirely inline;
 * a screen that reached for `globals.css` would render as unstyled black-on-white text at the exact
 * moment it is meant to reassure a child.
 *
 * ⚠️ AND THE PROP IS `retry`, NOT `reset` — see `app/error.tsx`.
 *
 * ⚠️ `metadata` CANNOT BE EXPORTED from an error boundary (it must be a Client Component), so the
 * tab title comes from React's own `<title>`. Without it the tab reads as the raw URL.
 */
import { useEffect } from 'react'
import { reportCrash } from '@/infra/reportCrash'
import { CRASH_UI, CrashScreen } from '@/shared/ui/CrashScreen'

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => { reportCrash(error, 'root-layout', { digest: error?.digest }) }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <title>Milo — something went wrong</title>
        <CrashScreen
          title="Oops! Milo needs a moment"
          body="Something went wrong while starting up. Nothing is lost — your stars and progress are saved."
          primary={{ label: 'Try again', onClick: retry }}
          secondary={{ label: 'Go back home', href: '/menu' }}
          digest={error?.digest}
          style={CRASH_UI.page}
        />
      </body>
    </html>
  )
}
