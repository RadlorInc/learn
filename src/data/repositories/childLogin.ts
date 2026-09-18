'use client'

/** Child logins (username + password), set by the adult who created the learner. The server half is /api/child-login. */
import { db } from '@/data/repositories/_shared'
import { getMyLearners } from '@/data/repositories/learners'
import { setActiveLearner } from '@/data/supabase/useLearnerSession'
import { mustChangePassword } from '@/data/auth'

export type ChildLoginError =
  | 'bad_username' | 'weak_password' | 'username_taken' | 'not_owner' | 'not_configured' | 'rate_limited' | 'unauthenticated' | 'failed'

async function call(method: 'GET' | 'POST' | 'DELETE', body?: unknown): Promise<{ ok: true; [k: string]: unknown } | { ok: false; error: ChildLoginError }> {
  const { data: { session } } = await db().auth.getSession()
  if (!session) return { ok: false, error: 'unauthenticated' }
  try {
    const r = await fetch('/api/child-login', {
      method, headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    // ⚠️ fetch does not throw on 4xx/5xx — read the body's `ok`, never assume it.
    const j = (await r.json().catch(() => null)) as { ok?: boolean; error?: string } | null
    if (r.ok && j?.ok) return j as { ok: true }
    const known: ChildLoginError[] = ['bad_username', 'weak_password', 'username_taken', 'not_owner', 'not_configured', 'rate_limited', 'unauthenticated']
    return { ok: false, error: known.includes(j?.error as ChildLoginError) ? j!.error as ChildLoginError : 'failed' }
  } catch { return { ok: false, error: 'failed' } }
}

/** learnerId → username, for the learners this account created. `null` = could not find out (not "none"). */
export async function getChildLogins(): Promise<Record<string, string> | null> {
  const r = await call('GET')
  return r.ok ? (r.logins as Record<string, string>) : null
}

export const setChildLogin = (learnerId: string, username: string, password: string, temporary = false) => call('POST', { learnerId, username, password, temporary })
export const removeChildLogin = (learnerId: string) => call('DELETE', { learnerId })

/**
 * A signed-in CHILD's way in: their own learner becomes the active one, then their lessons — or, when their
 * password is still the temporary one from a class list, the page where they choose their own.
 * ⚠️ Returns '/modules' even when the learner could not be read, so a child is never dropped on the parent dashboard;
 * the modules page works without an active learner (progress just is not attributed).
 */
export async function enterAsChild(): Promise<string> {
  try {
    const [mine] = await getMyLearners()
    if (mine) setActiveLearner(mine)
  } catch { /* offline: still their lessons */ }
  // A temporary password from a class list: choose their own first.
  return (await mustChangePassword()) ? '/auth/new-password' : '/modules'
}
