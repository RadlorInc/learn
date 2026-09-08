'use client'
/**
 * The single place a sign-in is recorded.
 *
 * ⚠️ WHY THIS REPLACES THREE CALL SITES. `auth_events` held ONE row against at least 18 real
 * logins in six weeks (measured from `auth.sessions`, 7 distinct users, both providers). The write
 * was fired from three scattered places — `signInWithEmail`, the OAuth callback, and the
 * set-password landing — and every one of them ended in
 * `.then(() => undefined, () => undefined)`, so a failure was invisible. Six weeks passed with
 * nobody noticing, and the login panel had no data to draw.
 *
 * ⚠️ AND THE MECHANISM WAS NOT ONLY THE SWALLOWED ERROR. The OAuth callback returned EARLY when a
 * session already existed — and supabase-js processes the OAuth hash during client construction,
 * so that branch usually won and the logging line below it never ran. Fixing the swallow alone
 * would have left most logins unrecorded; fixing the early return alone would have left the
 * failures invisible. Both are gone.
 *
 * ⚠️ ONE LISTENER, MOUNTED ONCE, ON THE EVENT ITSELF. `onAuthStateChange` fires AFTER the session
 * exists, so it cannot race the client attaching its token — which is the other thing that could
 * have been silently failing and could not be told apart from the early return. There is nothing
 * left for a caller to forget, which is the property that matters: a wire every caller must
 * remember is the shape this repo has already paid three months for.
 */
import { useEffect } from 'react'
import { createClient } from '@/data/supabase/client'
import { reportCrash } from '@/infra/reportCrash'

/**
 * ⚠️ A RECOVERED SESSION ALSO ARRIVES AS `SIGNED_IN`, AND THAT IS NOT A LOGIN. supabase-js emits
 * `SIGNED_IN` from `_recoverAndRefresh` — i.e. on EVERY page load that finds a session in storage
 * (GoTrueClient `_recoverAndRefresh`, measured 2026-09-07). Keyed on the event alone, this wrote a
 * `login` row per hard reload: the /admin login panel counted page loads, and the nightly E2E —
 * whose Supabase host is a placeholder — went red on all 216 chapter loads with a DNS error.
 *
 * The fact that separates a sign-in from a recovery is whether a session ALREADY EXISTED when the
 * page loaded. Read once, at module load, before any client can be constructed (the client is
 * built lazily from a render or an effect, and both run after module evaluation), and cleared by
 * `SIGNED_OUT` so a sign-out-then-sign-in inside one SPA session is still recorded.
 */
const STORAGE_KEY = 'milo-auth'   // client.ts `storageKey` — the one place a session is persisted
export function hadSessionAtLoad(): boolean {
  try { return typeof localStorage !== 'undefined' && !!localStorage.getItem(STORAGE_KEY) } catch { return false }
}

export default function AuthEventLogger() {
  useEffect(() => {
    const supabase = createClient()
    let holdsSession = hadSessionAtLoad()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') { holdsSession = false; return }
      if (event !== 'SIGNED_IN' || !session?.user) return
      if (holdsSession) return               // recovery, token refresh, tab focus — not a login
      holdsSession = true
      void record('login', session.user.id)
    })
    return () => subscription.unsubscribe()
  }, [])
  return null
}

/**
 * ⚠️ THE FAILURE IS OBSERVABLE. Not `.then(() => undefined, () => undefined)`. A best-effort write
 * may fail — it must never block a sign-in — but "may fail" and "fails invisibly" are different
 * things, and only the second hides for six weeks. A failure now reaches the same sink as a crash.
 */
export async function record(event: 'login' | 'logout', userId: string): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (createClient() as any)
      .from('auth_events')
      .insert({ user_id: userId, event, client_id: crypto.randomUUID() })
    if (error) {
      reportCrash(new Error(`auth_events ${event} insert failed: ${error.message} (code ${error.code ?? '?'})`),
        'auth.record')
      return false
    }
    return true
  } catch (e) {
    reportCrash(e, 'auth.record')
    return false
  }
}
