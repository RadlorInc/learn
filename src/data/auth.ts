'use client'

/**
 * Auth adapter — the single browser-side owner of `supabase.auth.*`.
 *
 * Pages and feature hooks call these helpers instead of importing the Supabase
 * client, so infrastructure never leaks into the UI layer.
 */
import { createClient } from '@/data/supabase/client'
import type { AuthChangeEvent, Session, Subscription, User } from '@supabase/supabase-js'

/** Current session (local storage read, no network). Null when signed out. */
export async function getCurrentSession(): Promise<Session | null> {
  const { data: { session } } = await createClient().auth.getSession()
  return session
}

/** Current user, verified against the auth server. Null when signed out. */
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await createClient().auth.getUser()
  return user
}

/** Email + password sign-up. Sends a confirmation email that returns to `emailRedirectTo`. */
export function signUpWithEmail(email: string, password: string, emailRedirectTo: string) {
  return createClient().auth.signUp({ email, password, options: { emailRedirectTo } })
}

/** Durable account-access log → `auth_events` (insert-only; reads are dashboard-only).
 *  Supabase's own auth logs are short-retention platform logs and `last_sign_in_at` is
 *  latest-only, so without this a login history simply does not exist. Best-effort:
 *  never throws, never blocks the auth flow it rides on. `client_id` dedupes retries.
 *  NOTE `logout` only captures the explicit sign-out tap — closing the tab logs nothing
 *  (true of any SPA); play activity/retention math reads `sessions`, not this. */
export function logAuthEvent(event: 'login' | 'logout', userId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- learner_events pattern: table not in generated types
  return (createClient() as any)
    .from('auth_events')
    .insert({ user_id: userId, event, client_id: crypto.randomUUID() })
    .then(() => undefined, () => undefined)
}

/** Email + password sign-in. Logs a durable `login` event on success. */
export function signInWithEmail(email: string, password: string) {
  return createClient().auth.signInWithPassword({ email, password }).then((res) => {
    if (!res.error && res.data.user) void logAuthEvent('login', res.data.user.id)
    return res
  })
}

/** Google OAuth — the browser navigates away to Google on success. */
export function signInWithGoogleOAuth(redirectTo: string) {
  return createClient().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, queryParams: { access_type: 'offline', prompt: 'consent' } },
  })
}

/** Subscribe to auth-state changes; returns the subscription so the caller can unsubscribe. */
export function onAuthStateChange(
  cb: (event: AuthChangeEvent, session: Session | null) => void,
): { subscription: Subscription } {
  const { data } = createClient().auth.onAuthStateChange(cb)
  return { subscription: data.subscription }
}
