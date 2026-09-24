/**
 * The parent's first name, from the account's metadata: `first_name` (typed on email signup), else the
 * first word of the name Google gave us (`given_name`, `full_name`, `name`). It goes into an email and a
 * greeting, and the account holder can write any string into their own metadata — so only letters,
 * spaces, hyphens and apostrophes survive (no markup, no link syntax), cut to 40 characters.
 */
export function firstNameOf(meta: Record<string, unknown> | null | undefined): string | null {
  const pick = [meta?.first_name, meta?.given_name, meta?.full_name, meta?.name].find(v => typeof v === 'string' && v.trim())
  if (typeof pick !== 'string') return null
  const first = pick.trim().split(/\s+/)[0].replace(/[^\p{L}\p{M}'’-]/gu, '').slice(0, 40)
  return first || null
}
