'use client'
/**
 * One way a client-side crash gets reported, shared by every boundary that catches one:
 * `MiloErrorBoundary` (React render errors), `app/error.tsx` (a route segment) and
 * `app/global-error.tsx` (the root layout itself).
 *
 * ⚠️ EXTRACTED ON THE SECOND CALLER, NOT THE FOURTH. The boundary inlined this fetch, and C2 was
 * about to paste it into two more files — which is exactly how this repo ended up with `boardBand`
 * in four places.
 *
 * ⚠️ AND IT CAN NEVER THROW. This runs *inside* an error handler, so a failure here does not
 * produce a log line — it replaces a recoverable error with a blank screen, which is the one
 * outcome worse than the crash it is reporting. Every step is guarded separately: a wedged
 * IndexedDB (private browsing, a known failure mode on iPad) must not stop the network report, and
 * a dead network must not stop the local breadcrumb.
 */
import { recordError } from '@/infra/storage/lastError'
import { getActiveLearner } from '@/data/supabase/useLearnerSession'

export function reportCrash(
  error: unknown,
  source: string,
  extra?: { componentStack?: string; digest?: string },
): void {
  const err = error as { message?: string; stack?: string } | undefined

  // 1. The local breadcrumb — this is what travels to support in the diagnostic block the parent
  //    pastes into an email, and it is often the ONLY record, since most of these failures leave
  //    no server-side trace at all.
  try { recordError(error, source) } catch { /* storage can be blocked; keep going */ }

  // 2. The network report — forwards to the monitoring sink when one is configured, else lands in
  //    Vercel logs. `keepalive` so it survives the navigation a crash usually triggers.
  try {
    void fetch('/api/report-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        message: err?.message,
        stack: err?.stack,
        source,
        digest: extra?.digest,
        componentStack: extra?.componentStack,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        /**
         * WHO it happened to. Without this a log is a pile of stack traces that cannot be matched
         * to the parent who wrote in. Read synchronously — an async session lookup would race the
         * navigation, and learner → owning account is one join away in the DB anyway.
         */
        learnerId: safeLearnerId(),
      }),
    }).catch(() => {})
  } catch { /* ignore */ }
}

/** The session lookup is the one part most likely to throw during a root-layout crash. */
function safeLearnerId(): string | undefined {
  try { return getActiveLearner()?.id } catch { return undefined }
}
