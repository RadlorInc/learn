'use client'
/**
 * The route-segment error screen — what a child sees when a page crashes.
 *
 * ⚠️ `MiloErrorBoundary` IN `layout.tsx` DOES NOT COVER THIS. That boundary is a React component
 * *inside* the tree, so it catches client render errors below it and cannot catch an error thrown
 * while the server renders the segment. Without this file that case falls through to Next's own
 * error screen — a grey page with "Application error: a client-side exception has occurred" — in
 * front of a five-year-old.
 *
 * ⚠️ THE PROP IS `retry`, NOT `reset`. This is the Next version this repo actually runs (see
 * AGENTS.md), and every example written from memory says `reset` — which type-checks as an unused
 * prop, renders a button, and does nothing when pressed. A dead button is the worst outcome in this
 * app; the docs are `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md`.
 */
import { useEffect } from 'react'
import { reportCrash } from '@/infra/reportCrash'
import { CRASH_UI, CrashScreen } from '@/shared/ui/CrashScreen'

export default function SegmentError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => { reportCrash(error, 'route-segment', { digest: error?.digest }) }, [error])

  return (
    <CrashScreen
      title="Oops! Something went wrong"
      /** It used to promise "Nothing is lost". Answers are saved on the device as they are made, so what was saved
       *  before the crash is still there — but the one in hand when it broke may not be, and a device that cannot
       *  write (private browsing, a full disk) saves nothing. Say only what is true on every device. */
      body="What you finished before this should still be saved. Let's try that again."
      primary={{ label: 'Try again', onClick: retry }}
      secondary={{ label: 'Go back home', href: '/modules' }}
      digest={error?.digest}
      style={CRASH_UI.page}
    />
  )
}
