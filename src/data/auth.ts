'use client'

/**
 * Auth adapter — the single browser-side owner of `supabase.auth.*`.
 *
 * Pages and feature hooks call these helpers instead of importing the Supabase
 * client, so infrastructure never leaks into the UI layer.
 */
import { createClient } from '@/data/supabase/client'
import { record } from '@/infra/AuthEventLogger'
import type { AuthChangeEvent, EmailOtpType, Session, Subscription, User } from '@supabase/supabase-js'

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

/**
 * Email + password sign-up, with ONE email (founder, 2026-09-25). The account is created by `/api/auth/signup`, which
 * sends our own email — for a parent it confirms the address AND asks for consent; for a teacher it only confirms.
 * Supabase's own confirmation email is not used for this path. The link lands on `/auth/confirm`.
 */
export type SignUpResult = 'ok' | 'exists' | 'weak_password' | 'invalid' | 'rate_limited' | 'failed'
export async function signUpOneEmail(body: { email: string; password: string; firstName: string | null; role: 'parent' | 'teacher'; lang: 'en' | 'es' }): Promise<SignUpResult> {
  const r = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (r.ok) return 'ok'
  const e = (await r.json().catch(() => null))?.error
  return e === 'exists' || e === 'weak_password' || e === 'invalid' || e === 'rate_limited' ? e : 'failed'
}

/**
 * Invite / recovery link → a session, from the `token_hash` in the URL.
 *
 * The invite email links to `/auth/set-password?token_hash=…&type=invite` rather than to the
 * default `{{ .ConfirmationURL }}`, which lands on the Site URL with the tokens in the hash and
 * leaves the invited person signed in with NO password ever set — able to get in exactly once.
 */
export function verifyEmailToken(tokenHash: string, type: EmailOtpType) {
  return createClient().auth.verifyOtp({ token_hash: tokenHash, type })
}

/**
 * Mail a password-reset link. The link lands on `/auth/set-password` carrying
 * `type=recovery`, which that page ALREADY handles — its own header comment says
 * `type` is read from the query "so the same page serves a `recovery` link if a
 * reset flow is ever added". This is that flow; nothing new receives it.
 *
 * ⚠️ The caller must NOT branch its message on the result. Supabase returns success
 * for an address that has no account, and that is the behaviour we want: telling a
 * caller "no such account" is the account-enumeration leak V10 closed on signup.
 */
export function sendPasswordReset(email: string, redirectTo: string) {
  return createClient().auth.resetPasswordForEmail(email, { redirectTo })
}

/** Set the signed-in user's password. Requires a session (from an invite link or a sign-in). */
export function setPassword(password: string) {
  return createClient().auth.updateUser({ password })
}

/**
 * A child whose teacher gave them a TEMPORARY password (a class list) must choose their own before anything else.
 * The flag lives in user_metadata, set by /api/child-login; the child clears it with the same call that sets the
 * new password. Read from the local session — no network.
 */
export async function mustChangePassword(): Promise<boolean> {
  const { data: { session } } = await createClient().auth.getSession()
  return session?.user?.user_metadata?.must_change_password === true
}

export function setOwnPassword(password: string) {
  return createClient().auth.updateUser({ password, data: { must_change_password: false } })
}

/** Durable account-access log → `auth_events` (insert-only; reads are dashboard-only).
 *  Supabase's own auth logs are short-retention platform logs and `last_sign_in_at` is
 *  latest-only, so without this a login history simply does not exist. Best-effort:
 *  never throws, never blocks the auth flow it rides on. `client_id` dedupes retries.
 *  NOTE `logout` only captures the explicit sign-out tap — closing the tab logs nothing
 *  (true of any SPA); play activity/retention math reads `sessions`, not this. */
export function logAuthEvent(event: 'login' | 'logout', userId: string): Promise<boolean> {
  // ⚠️ NOW A THIN FORWARDER TO THE OBSERVABLE WRITE. This used to end in
  // `.then(() => undefined, () => undefined)` — a failure vanished, and `auth_events` held ONE row
  // against at least 18 real logins over six weeks with nobody able to notice.
  // ⚠️ AND SIGN-INS ARE NO LONGER LOGGED FROM HERE. A single global `onAuthStateChange` listener
  // (infra/AuthEventLogger) records every login, on every provider and route, and cannot race the
  // client attaching its token. This remains only for LOGOUT, which has no auth-state event of its
  // own that fires reliably before the token is revoked.
  return record(event, userId)
}

/** Email + password sign-in. Logs a durable `login` event on success. */
export function signInWithEmail(email: string, password: string) {
  // No logging here: the global listener records the SIGNED_IN this produces. Logging in both
  // places would double-count, and logging only here would miss every OAuth sign-in.
  return createClient().auth.signInWithPassword({ email, password })
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
