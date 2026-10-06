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
import { safeUrl } from '@/infra/safeUrl'

const SEND_CAP = 10
const sent = new Set<string>()
const RESIZE_OBSERVER_NOTICE = /^ResizeObserver loop (completed with undelivered notifications|limit exceeded)/

let installed = false

/**
 * Catch the errors the React ErrorBoundary never sees: plain runtime throws outside render,
 * and unhandled promise rejections. The Safari boot failure this repo already shipped once was
 * an unhandled rejection from a stale cached chunk — invisible to every other seam we have.
 * Each goes to the local breadcrumb AND to /api/report-error, like a render crash.
 * Idempotent; safe to call from a component that may remount.
 */
export function installErrorCapture(): void {
  if (installed || typeof window === 'undefined') return
  installed = true
  window.addEventListener('error', (e) => {
    // Chrome's "ResizeObserver loop …" is a notice that layout settled a frame late, not a fault: nothing breaks and the
    // child sees nothing. Reported, it filled the ops digest's error count (6 in two days from /test, 5–6 Oct).
    if (RESIZE_OBSERVER_NOTICE.test(e.message ?? '')) {
      try { recordError(e.message, 'window') } catch { /* storage can be blocked */ }
      return
    }
    reportCrash(e.error instanceof Error ? e.error : new Error(e.message || 'script error'), 'window')
  })
  window.addEventListener('unhandledrejection', (e) => {
    reportCrash(e.reason instanceof Error ? e.reason : new Error(String((e.reason as { message?: string })?.message ?? e.reason)), 'promise')
  })
}

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
  //    Once per source+message, and at most SEND_CAP a page load: page errors and refused uploads come through here
  //    too, and one broken page firing in a loop must not spend the route's limit (or a sink's bill) on itself.
  const seen = `${source}|${err?.message ?? String(error)}`
  if (sent.has(seen) || sent.size >= SEND_CAP) return
  sent.add(seen)
  try {
    const token = safeAccessToken()
    void fetch('/api/report-error', {
      method: 'POST',
      // The server keeps `learnerId` only when this session can read that learner.
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      keepalive: true,
      body: JSON.stringify({
        message: err?.message,
        stack: err?.stack,
        source,
        digest: extra?.digest,
        componentStack: extra?.componentStack,
        // Path + allowlisted params only: fragments and queries carry consent/auth tokens (SEC-06).
        url: typeof window !== 'undefined' ? safeUrl(window.location.href) : undefined,
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

/** Read synchronously for the same reason: the stored session (client.ts `storageKey`). */
function safeAccessToken(): string | undefined {
  try {
    const t = JSON.parse(localStorage.getItem('milo-auth') ?? 'null')?.access_token
    return typeof t === 'string' ? t : undefined
  } catch { return undefined }
}
