'use client'

/** Auth / profile data access. */
import { db } from '@/data/repositories/_shared'
import { logAuthEvent } from '@/data/auth'
import { clearActiveLearner } from '@/data/supabase/useLearnerSession'
import type { UserRole } from '@/data/supabase/types'

/**
 * The signed-in user's role, or null if they haven't picked Teacher/Parent yet
 * (a fresh signup — the app shows the one-time role picker on that signal).
 *
 * ⚠️ THROWS when the role could not be READ (network, expired session, RLS). "Could not look" and
 * "looked, no role" must never be the same value: null is what shows the one-time RolePicker, and a
 * pick there writes over the real role (BUG-07). Callers already route a throw to their error UI.
 */
export async function getMyRole(): Promise<UserRole | null> {
  const supabase = db()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError && authError.name !== 'AuthSessionMissingError') throw authError
  if (!user) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  // PGRST116 = no profile row at all: a successful look that found nothing, i.e. no role yet.
  if (error && error.code !== 'PGRST116') throw error
  return (data as { role: UserRole | null } | null)?.role ?? null
}

/**
 * Persist the user's Teacher/Parent choice on their own profile row (RLS: own row only).
 * Only ever FIRST sets a role (`role is null`): the picker is one-time, so a picker shown on a stale or
 * wrong read can never overwrite a real role (BUG-07). Not a security boundary — the policy still allows it.
 */
export async function setMyRole(role: UserRole): Promise<boolean> {
  const supabase = db()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { error } = await supabase.from('profiles').update({ role }).eq('id', user.id).is('role', null)
  return !error
}

/** Where a given role lands after login: a child's own account on its lessons, adults on the dashboard. */
export const homeForRole = (role: UserRole | null): string =>
  role === 'learner' ? '/modules' : '/parent'

export async function signOut() {
  const supabase = db()
  // Log the logout BEFORE revoking the token (an insert after signOut would 401).
  // Race against a short timeout so a dead network can never hang the sign-out —
  // losing the event beats trapping the user in a signed-in state.
  try {
    const { data: { session } } = await supabase.auth.getSession()   // local read, no network
    if (session?.user) {
      await Promise.race([
        logAuthEvent('logout', session.user.id),
        new Promise<void>((r) => setTimeout(r, 800)),
      ])
    }
  } catch { /* best-effort — never block sign-out */ }
  await supabase.auth.signOut()
  clearActiveLearner()        // else the next account (same tab) briefly sees the previous child's profile
  window.location.href = '/auth'
}
