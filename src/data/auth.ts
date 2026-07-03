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

/** Email + password sign-in. */
export function signInWithEmail(email: string, password: string) {
  return createClient().auth.signInWithPassword({ email, password })
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
