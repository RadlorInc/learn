'use client'

/** Auth / profile data access. */
import { db } from '@/data/repositories/_shared'
import { logAuthEvent } from '@/data/auth'
import { clearActiveLearner } from '@/data/supabase/useLearnerSession'
import { clearPendingDiagnostic } from '@/infra/storage/pendingDiagnostic'
import type { UserRole } from '@/data/supabase/types'

export async function getProfile() {
  const supabase = db()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  return data as { id: string; role: UserRole | null; display_name: string; avatar_index: number } | null
}

/**
 * The signed-in user's role, or null if they haven't picked Teacher/Parent yet
 * (a fresh signup — the app shows the one-time role picker on that signal).
 */
export async function getMyRole(): Promise<UserRole | null> {
  const supabase = db()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  return (data as { role: UserRole | null } | null)?.role ?? null
}

/** Persist the user's Teacher/Parent choice on their own profile row (RLS: own row only). */
export async function setMyRole(role: UserRole): Promise<boolean> {
  const supabase = db()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { error } = await supabase.from('profiles').update({ role }).eq('id', user.id)
  return !error
}

/** Where a given role lands after login: teachers start on Grades, everyone else on the dashboard. */
export const homeForRole = (role: UserRole | null): string =>
  role === 'teacher' ? '/parent/grades' : '/parent'

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
  clearPendingDiagnostic()    // V9: don't leave a child's name + gap profile in localStorage after sign-out
  window.location.href = '/auth'
}
