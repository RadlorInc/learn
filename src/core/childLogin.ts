/**
 * Child logins (founder's call, 2026-09-17): the adult who created a learner — parent or teacher — gives that child a
 * username and password. Supabase Auth needs an email, so a child's account carries one built from the username.
 * Nobody ever sees or types it: the login box takes a username, and `loginEmail` turns it back into the address.
 *
 * ⚠️ `.invalid` is reserved (RFC 2606) and can never be routed, so no mail can ever reach, or be sent "to", a child.
 * ⚠️ CHANGING CHILD_EMAIL_DOMAIN LOCKS OUT EVERY EXISTING CHILD — their accounts keep the old address.
 */
export const CHILD_EMAIL_DOMAIN = 'learner.adaptivelearn.invalid'
/**
 * The shortest password the app lets anyone set: a child's (set by their adult, or their own at first sign-in), a
 * teacher's temporary one (core/classRoster), and an adult's own. It matches Supabase Auth's minimum password length,
 * which applies only when a password is SET — a 6- or 7-character password set before the minimum rose still signs in,
 * so nothing checks this at sign-in.
 */
export const MIN_PASSWORD = 8

/** 3–20 characters: lowercase letters, digits, dot, underscore; starts with a letter or digit. */
const USERNAME = /^[a-z0-9][a-z0-9._]{2,19}$/

/** The username as stored, or null if it is not one. Case and outer spaces are forgiven — a child types "Aarav7 ". */
export function normalizeUsername(input: string): string | null {
  const u = input.trim().toLowerCase()
  return USERNAME.test(u) ? u : null
}

export const childEmail = (username: string) => `${username}@${CHILD_EMAIL_DOMAIN}`

/** The username inside a child's address, or null for an adult's email. */
export function usernameFromEmail(email: string | null | undefined): string | null {
  const suffix = `@${CHILD_EMAIL_DOMAIN}`
  return email && email.toLowerCase().endsWith(suffix) ? email.slice(0, -suffix.length).toLowerCase() : null
}

/** What the login box sends to Supabase: an email as typed, or a username turned into its address. */
export function loginEmail(input: string): string {
  const t = input.trim()
  if (t.includes('@')) return t
  const u = normalizeUsername(t)
  return u ? childEmail(u) : t
}
