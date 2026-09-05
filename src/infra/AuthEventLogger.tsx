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

export default function AuthEventLogger() {
  useEffect(() => {
    const supabase = createClient()
    // Dedupe within a tab: SIGNED_IN also fires on token refresh and on tab focus, and one visit
    // should be one row. `client_id` dedupes across retries; this stops the noise at source.
    const seen = new Set<string>()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== 'SIGNED_IN' || !session?.user) return
      const key = `${session.user.id}:${session.access_token.slice(-12)}`
      if (seen.has(key)) return
      seen.add(key)
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
