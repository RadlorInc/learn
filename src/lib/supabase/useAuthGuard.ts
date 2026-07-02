'use client'
/**
 * useAuthGuard — a lightweight client-side gate for the authenticated app shell
 * (/menu, /game). The app has no server middleware guard (session lives in
 * localStorage, not cookies, so a Next proxy can't see it), and these pages
 * previously rendered the full authenticated UI to a logged-out / expired user
 * who still had a stale `milo_active_learner` in sessionStorage.
 *
 * This checks for a locally-persisted Supabase session via getSession() — which
 * reads localStorage WITHOUT a network round-trip, so it still works OFFLINE (a
 * signed-in child on a plane keeps playing). It is a UX-correctness gate, NOT the
 * security boundary — RLS remains the real boundary server-side — so it fails OPEN
 * on a transient read error rather than kicking a playing child out.
 *
 *   const authed = useAuthGuard()
 *   if (authed === 'checking') return <AuthSplash />
 */
import { useEffect, useState } from 'react'
import { createClient } from './client'

export type AuthGuardStatus = 'checking' | 'authed'

export function useAuthGuard(): AuthGuardStatus {
  const [status, setStatus] = useState<AuthGuardStatus>('checking')
  useEffect(() => {
    let cancelled = false
    createClient().auth.getSession()
      .then(({ data }) => {
        if (cancelled) return
        if (data.session) setStatus('authed')
        else window.location.href = '/auth'   // no local session at all → bounce
      })
      .catch(() => { if (!cancelled) setStatus('authed') })   // fail open — RLS still guards writes
    return () => { cancelled = true }
  }, [])
  return status
}
