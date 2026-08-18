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

/**
 * Google OAuth — the browser navigates away to Google on success.
 *
 * ⚠️ NO `access_type: 'offline'` AND NO `prompt: 'consent'`, DELIBERATELY. Both were here and
 * neither earned its place:
 *   · `access_type: 'offline'` asks Google for a REFRESH token, i.e. permission to act for the
 *     parent while they are away. Nothing in this app has ever read `provider_token` or
 *     `provider_refresh_token` — we sign the parent in and never touch Google again. Asking for a
 *     credential you do not use is the kind of thing a privacy-minded parent is right to object to.
 *   · `prompt: 'consent'` FORCES the full consent screen on EVERY sign-in. Google's default already
 *     shows it the first time; forcing it means a returning parent re-approves the same scopes every
 *     single time instead of just picking their account.
 * The scopes are unchanged (`email profile`), so no existing user has to re-consent and no
 * identity changes — `sub` is what Supabase keys on, and that is untouched.
 */
export function signInWithGoogleOAuth(redirectTo: string) {
  return createClient().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  })
}

/** Subscribe to auth-state changes; returns the subscription so the caller can unsubscribe. */
export function onAuthStateChange(
  cb: (event: AuthChangeEvent, session: Session | null) => void,
): { subscription: Subscription } {
  const { data } = createClient().auth.onAuthStateChange(cb)
  return { subscription: data.subscription }
}
