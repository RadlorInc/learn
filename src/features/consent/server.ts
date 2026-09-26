/**
 * The server half of email-plus: Resend, the service-role RPCs, tokens and document versions.
 * Server-only — it reads two secrets. Neither is NEXT_PUBLIC_, so Next never inlines them into a
 * browser bundle; `server-only` would say so louder but is not installed and not worth a dependency.
 *
 * ⚠️ RESEND IS CALLED DIRECTLY OVER HTTP, NOT THROUGH SUPABASE AUTH'S SMTP RELAY AND NOT THROUGH AN SDK.
 * The auth mailer only sends its own templates (sign-up, reset, magic link), so it cannot carry these
 * emails. The SMTP credentials behind it are a Resend API key too, but SMTP from the app would need a
 * mail library for no gain, and SMTP cannot schedule — B3's "a day later" is Resend's `scheduled_at`,
 * which only the HTTP API has. One POST is the whole integration, so there is no dependency either.
 *
 * ⚠️ AND NO ERROR FROM HERE GOES THROUGH `reportCrash` — that path writes `error_events` with a
 * `learner_id`, which the consent gate refuses for exactly the children whose consent is missing.
 */
import { firstNameOf } from './firstName'
import { createHash, randomBytes } from 'node:crypto'
import { pageBySlug, type LegalPage } from '@/app/legal/registry'
import { readPublic } from '@/app/legal/source'
import { SITE_URL } from '@/app/site'
import { EMAIL_FROM, EMAIL_REPLY_TO } from './config'
import type { Rendered } from './email'

export class ConfigMissing extends Error {}

function env(name: string): string {
  const v = process.env[name]
  if (!v) throw new ConfigMissing(name)
  return v
}

/** Every secret the flow needs, checked BEFORE anything is written — a missing Resend key discovered
 *  after the pending row exists leaves a request that was never sent. Names the variable it lacks. */
export function requireConfig(): void {
  for (const n of ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY']) env(n)
}

// ── tokens: 32 random bytes in the link, only the hash in the database ──
export const newToken = () => randomBytes(32).toString('base64url')
export const hashToken = (t: string) => createHash('sha256').update(t).digest('hex')
export const looksLikeToken = (t: unknown): t is string => typeof t === 'string' && /^[A-Za-z0-9_-]{43}$/.test(t)

/**
 * The Privacy Policy and Terms have no version numbers, so what the parent could open is identified by
 * its CONTENT and its switch: slug, `dark` or `live`, and a hash of the public text in docs/legal/.
 * ⚠️ While a page is dark the parent could open only its banner — the `@dark` is how a consent row
 * says so, rather than recording a document nobody could read. Change a word and the version changes.
 */
const docVersion = (p: LegalPage) =>
  `${p.slug}@${p.published ? 'live' : 'dark'}#${createHash('sha256').update(readPublic(p)).digest('hex').slice(0, 12)}`
export const PRIVACY_VERSION = docVersion(pageBySlug('privacy')!)
export const TERMS_VERSION = docVersion(pageBySlug('terms')!)

/**
 * When the parent ticked "I'm a parent or legal guardian… and I agree" — as the browser reports it, so
 * only a plausible time is kept: a real ISO timestamp, not in the future (a minute of clock skew
 * allowed), and not older than 30 days. Anything else is null, and the database records now() instead.
 */
const ACK_MAX_AGE_MS = 30 * 86_400_000
export function ackTime(v: unknown, now = Date.now()): string | null {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(v)) return null
  const t = Date.parse(v)
  if (!Number.isFinite(t) || t > now + 60_000 || t < now - ACK_MAX_AGE_MS) return null
  return new Date(t).toISOString()
}

// ── Supabase, as the service role ──
export interface RpcError { status: number; code?: string; message?: string }

export async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const url = env('NEXT_PUBLIC_SUPABASE_URL'), key = env('SUPABASE_SERVICE_ROLE_KEY')
  const r = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
    cache: 'no-store',
  })
  const body = await r.json().catch(() => null)
  if (!r.ok) throw { status: r.status, code: body?.code, message: body?.message } satisfies RpcError
  return body as T
}

/** A child's display name, read as the service role (the link's reader is not signed in). */
export async function learnerName(id: string): Promise<string | null> {
  const url = env('NEXT_PUBLIC_SUPABASE_URL'), key = env('SUPABASE_SERVICE_ROLE_KEY')
  const r = await fetch(`${url}/rest/v1/learners?id=eq.${encodeURIComponent(id)}&select=display_name`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store',
  })
  const rows = await r.json().catch(() => null)
  return r.ok && typeof rows?.[0]?.display_name === 'string' ? rows[0].display_name : null
}

/** The signed-in adult behind a bearer token, verified by the auth server — never a claim we decode. */
export async function adultFromBearer(req: Request): Promise<{ id: string; email: string | null; firstName: string | null } | null> {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return null
  const url = env('NEXT_PUBLIC_SUPABASE_URL'), anon = env('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  const r = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` }, cache: 'no-store' })
  if (!r.ok) return null
  const u = await r.json().catch(() => null)
  return typeof u?.id === 'string' ? { id: u.id, email: typeof u.email === 'string' ? u.email : null, firstName: firstNameOf(u.user_metadata) } : null
}
export const userFromBearer = async (req: Request): Promise<string | null> => (await adultFromBearer(req))?.id ?? null

/**
 * Create an email/password account WITHOUT Supabase sending its own confirmation email, and get the link's token
 * so we can send ONE email of our own (founder, 2026-09-25). `generate_link` never emails (measured on a local stack:
 * the inbox stayed empty), creates the user unconfirmed with `data` as user_metadata, applies the same password rules
 * as a normal sign-up, and for an address that exists UNCONFIRMED issues a fresh token — so signing up again is also
 * "send it again". An address that exists CONFIRMED answers `email_exists`.
 */
export type SignupLink =
  | { ok: true; userId: string; hashedToken: string; metadata: Record<string, unknown>; repeat: boolean; signupCount: number }
  | { ok: false; reason: 'exists' | 'weak_password' | 'invalid'; message?: string }
export async function generateSignupLink(email: string, password: string, data: Record<string, unknown>): Promise<SignupLink> {
  const url = env('NEXT_PUBLIC_SUPABASE_URL'), key = env('SUPABASE_SERVICE_ROLE_KEY')
  const r = await fetch(`${url}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'signup', email, password, data }),
    cache: 'no-store',
  })
  const b = await r.json().catch(() => null)
  if (r.ok && typeof b?.id === 'string' && typeof b?.hashed_token === 'string') {
    // SEC-01: an account created by THIS call has `created_at` ≈ `confirmation_sent_at` (measured: the token is stamped
    // ~0.1 s BEFORE the row); a repeat sign-up re-stamps `confirmation_sent_at` and keeps the old `created_at`. Both
    // come from the auth server's clock, so there is no skew with ours. 1 s absorbs the stamping order.
    const repeat = Date.parse(b.confirmation_sent_at) - Date.parse(b.created_at) > 1000
    const n = Number(b.app_metadata?.signup_count)
    return { ok: true, userId: b.id, hashedToken: b.hashed_token, metadata: b.user_metadata ?? {}, repeat, signupCount: Number.isInteger(n) && n > 0 ? n : 1 }
  }
  if (b?.error_code === 'email_exists' || b?.error_code === 'user_already_exists') return { ok: false, reason: 'exists' }
  if (b?.error_code === 'weak_password') return { ok: false, reason: 'weak_password', message: b?.msg }
  if (r.status === 400 || r.status === 422) return { ok: false, reason: 'invalid', message: b?.msg }
  throw new Error(`generate_link ${r.status}: ${b?.error_code ?? b?.msg ?? 'no body'}`)
}

/**
 * SEC-01 (Rafi's N2): on a REPEAT sign-up for an unconfirmed address, nobody's password may survive — the first
 * sign-up's password is kept by `generate_link` (measured), and the first sign-up may have been an attacker's. This
 * replaces it with 32 random bytes nobody knows and counts the sign-up (`app_metadata`, which only the service role
 * can write). `/auth/confirm` then asks whoever holds the inbox for a new password (count > 1); if they leave before
 * setting one, "Forgot password" is the way in — there is no state in which a password chosen before the
 * confirmation opens the account.
 * ⚠️ Measured on a local stack (2026-09-26): this admin update CLEARS `confirmation_sent_at`, so the token issued just
 * before it stops verifying (403 otp_expired). The caller issues a fresh link AFTER this call; `generate_link` keeps
 * the password it finds, so the random one stays.
 */
export async function scrambleUnconfirmedPassword(userId: string, signupCount: number): Promise<void> {
  const url = env('NEXT_PUBLIC_SUPABASE_URL'), key = env('SUPABASE_SERVICE_ROLE_KEY')
  const r = await fetch(`${url}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: randomBytes(32).toString('base64url'), app_metadata: { signup_count: signupCount } }),
    cache: 'no-store',
  })
  if (!r.ok) throw new Error(`admin update ${r.status}`)
}

/**
 * SEC-04: when Supabase last issued a sign-up link for this address, if the address is still UNCONFIRMED; else null.
 * Read BEFORE `generate_link`, because that call is the thing to avoid: measured on a local stack (2026-09-26) it
 * sets `confirmation_sent_at` to now AND rotates the token, so the link in the email already sent stops working (403).
 * Its own response therefore cannot say when the last email went — it always says "now".
 * `filter` is a case-sensitive SUBSTRING match (measured: `x<addr>` matches too; stored emails are lowercase), so
 * the exact address is picked out of the page.
 * ponytail: one page of 1000. An address buried under 1000+ other accounts containing it reads as "never sent" and
 * falls back to today's behaviour (send); page through `x-total-count` if accounts ever get near that.
 */
export async function lastSignupLinkAt(email: string): Promise<{ at: number; metadata: Record<string, unknown> } | null> {
  const url = env('NEXT_PUBLIC_SUPABASE_URL'), key = env('SUPABASE_SERVICE_ROLE_KEY')
  const e = email.trim().toLowerCase()
  const r = await fetch(`${url}/auth/v1/admin/users?filter=${encodeURIComponent(e)}&per_page=1000`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store',
  })
  const b = await r.json().catch(() => null)
  // Fail OPEN (send as today) — the cooldown must never stop a real sign-up — but say so, so "could not look" never
  // reads as "nothing was sent".
  if (!r.ok || !Array.isArray(b?.users)) { console.error('[auth/signup] cooldown lookup failed', r.status); return null }
  const u = (b.users as { email?: string; email_confirmed_at?: string | null; confirmation_sent_at?: string | null; user_metadata?: Record<string, unknown> }[])
    .find(x => x.email === e)
  if (!u || u.email_confirmed_at) return null
  // N2: the FIRST sign-up's role and first name, re-sent with the repeat so `generate_link` does not replace them.
  // `confirmation_sent_at` is null right after SEC-01's password reset (measured), which reads as "not recently sent".
  const at = u.confirmation_sent_at ? Date.parse(u.confirmation_sent_at) : NaN
  return { at: Number.isFinite(at) ? at : 0, metadata: u.user_metadata ?? {} }
}

// ── Resend ──
/** Resend's API unless overridden. The override exists for ONE reason: the local end-to-end run points
 *  it at a stand-in that records messages instead of delivering them. Unset in every real environment. */
const RESEND = () => process.env.RESEND_API_URL || 'https://api.resend.com'
/**
 * Send (or schedule) one message. The idempotency key makes a retried request — a double click, a
 * network retry — return the SAME message rather than a second one, which is also what lets a repeat
 * grant click be told apart from a fresh one without cancelling the real B3.
 *
 * ⚠️ EVERY SEND DECLARES ITS KIND (docs/legal/09 §1; "if unsure, treat it as commercial").
 *   transactional — consent, security, receipts: sent to anyone, never reads the suppression list.
 *   commercial    — anything promotional: refused for a suppressed address (returns `SUPPRESSED`, no
 *                   Resend call), otherwise sent with the §4 footer, a one-click unsubscribe link and
 *                   the RFC 8058 headers. If the list cannot be read, it THROWS rather than sends.
 */
export function sendEmail(kind: 'transactional', to: string, m: Rendered, idempotencyKey: string, scheduledAt?: Date): Promise<string>
export function sendEmail(kind: 'commercial', to: string, m: Rendered, idempotencyKey: string): Promise<string | typeof SUPPRESSED>
export async function sendEmail(kind: EmailKind, to: string, m: Rendered, idempotencyKey: string, scheduledAt?: Date): Promise<string> {
  let headers: Record<string, string> | undefined
  if (kind === 'commercial') {
    // A scheduled email would be checked against the list now and delivered later, after an unsubscribe.
    if (scheduledAt) throw new Error('a commercial email cannot be scheduled')
    to = normalEmail(to)
    const s = await suppression(to)
    if (s.suppressed) return SUPPRESSED
    m = withCommercialFooter(m, `${SITE_URL}/email/unsubscribe#t=${s.token}`)
    headers = { 'List-Unsubscribe': `<${SITE_URL}/api/email/unsubscribe?t=${s.token}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }
  }
  const r = await fetch(`${RESEND()}/emails`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env('RESEND_API_KEY')}`, 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({
      from: EMAIL_FROM, reply_to: EMAIL_REPLY_TO, to: [to], subject: m.subject, html: m.html, text: m.text,
      ...(headers ? { headers } : {}),
      ...(scheduledAt ? { scheduled_at: scheduledAt.toISOString() } : {}),
    }),
    cache: 'no-store',
  })
  const body = await r.json().catch(() => null)
  if (!r.ok || typeof body?.id !== 'string') throw new Error(`resend ${r.status}: ${body?.message ?? body?.name ?? 'no id returned'}`)
  return body.id
}

// ── commercial email: the suppression list and the footer (CAN-SPAM, docs/legal/09 §2, §4, §7) ──
export type EmailKind = 'transactional' | 'commercial'
export const SUPPRESSED = 'suppressed' as const
/** docs/legal/09 §2.4 — "the same address used everywhere else". */
const POSTAL_ADDRESS = '254 Chapman Rd, Ste 208 #28608, Newark, DE 19702'
const normalEmail = (e: string) => e.trim().toLowerCase()

/** PostgREST on `email_suppressions`, as the service role (the table has no client privileges at all). */
async function suppressions(query: string, init: RequestInit = {}): Promise<unknown[]> {
  const url = env('NEXT_PUBLIC_SUPABASE_URL'), key = env('SUPABASE_SERVICE_ROLE_KEY')
  const r = await fetch(`${url}/rest/v1/email_suppressions${query}`, {
    ...init, cache: 'no-store',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal', ...init.headers },
  })
  if (r.status === 409) return [] // a concurrent insert of the same address won; the caller re-reads
  if (!r.ok) throw new Error(`email_suppressions ${r.status}`)
  return init.method ? [] : (await r.json()) as unknown[]
}

/** The address's unsubscribe token (issued on its first commercial email, then reused) and whether it has unsubscribed. */
async function suppression(email: string): Promise<{ token: string; suppressed: boolean }> {
  const q = `?email=eq.${encodeURIComponent(email)}&select=token,suppressed_at`
  for (let tries = 0; tries < 2; tries++) {
    const [row] = await suppressions(q) as { token: string; suppressed_at: string | null }[]
    if (row) return { token: row.token, suppressed: row.suppressed_at !== null }
    await suppressions('', { method: 'POST', body: JSON.stringify({ email, token: newToken() }) })
  }
  throw new Error('email_suppressions: row not readable after insert')
}

/** Take the address behind `token` off commercial email, permanently. The first press's time is kept. */
export async function unsubscribe(token: string): Promise<'unsubscribed' | 'unknown'> {
  const t = encodeURIComponent(token)
  await suppressions(`?token=eq.${t}&suppressed_at=is.null`, { method: 'PATCH', body: JSON.stringify({ suppressed_at: new Date().toISOString() }) })
  const [row] = await suppressions(`?token=eq.${t}&select=suppressed_at`) as { suppressed_at: string | null }[]
  return row?.suppressed_at ? 'unsubscribed' : 'unknown'
}

/**
 * docs/legal/09 §4's footer, appended. ⚠️ §4's "Manage your email preferences" line is left out: there
 * is no preferences page, and a link to nothing is worse than no link. Add it with the page.
 */
function withCommercialFooter(m: Rendered, unsubscribeUrl: string): Rendered {
  const lines = [
    'You are receiving this because you have a Radlic account.',
    `Unsubscribe from updates like this: ${unsubscribeUrl}`,
    `Radlor Inc.\n${POSTAL_ADDRESS}`,
    'We will still send you essential messages about your account and your subscription, such as receipts and renewal reminders.',
  ]
  const html = lines.map(l => `<p style="color:#3D6FB8;font-size:12px">${l
    .replace(unsubscribeUrl, `<a href="${unsubscribeUrl}">${unsubscribeUrl}</a>`).replace('\n', '<br>')}</p>`).join('')
  return { subject: m.subject, text: `${m.text}\n\n--\n${lines.join('\n\n')}`, html: `${m.html}<hr>${html}` }
}

/**
 * Cancel one scheduled message and say what happened, as the string the queue records:
 * 'cancelled' · 'refused: …' (Resend said no — already cancelled, already sent, unknown id; retrying
 * cannot change that) · 'error: …' (Resend unreachable, rate-limited or 5xx; worth retrying).
 * Never throws: a cancel is always best-effort next to the thing that asked for it.
 */
export async function cancelOutcome(id: string): Promise<string> {
  try {
    const r = await fetch(`${RESEND()}/emails/${encodeURIComponent(id)}/cancel`, {
      method: 'POST', headers: { Authorization: `Bearer ${env('RESEND_API_KEY')}` }, cache: 'no-store',
    })
    if (r.ok) return 'cancelled'
    const b = await r.json().catch(() => null)
    const why = `${r.status} ${b?.message ?? b?.name ?? ''}`.trim()
    return r.status >= 500 || r.status === 429 ? `error: ${why}` : `refused: ${why}`
  } catch (e) { return `error: ${e instanceof Error ? e.message : String(e)}` }
}

/** Best-effort: a grant that lost a race (its B3 was never recorded anywhere, so it is not queued). */
export const cancelEmail = async (id: string): Promise<boolean> => (await cancelOutcome(id)) === 'cancelled'

/**
 * Cancel every B3 the database has queued and record each outcome (20260923200000). The queue is
 * filled by a trigger in the same transaction that ends a consent — withdrawal, deleting the child,
 * closing the account — so the id cannot be lost to the cascade that deletes the consent row.
 * Idempotent: a settled row is never picked again, and a second cancel of the same message is
 * recorded as 'refused', not thrown.
 * Returns how many it tried, or null when the queue does not exist yet (client deployed before the
 * migration) — the caller decides whether it has a fallback.
 */
export async function drainB3Cancellations(): Promise<number | null> {
  let due: { provider_id: string }[]
  try { due = await rpc<{ provider_id: string }[]>('consent_b3_due', {}) } catch (e) {
    if ((e as RpcError)?.code === 'PGRST202') return null
    throw e
  }
  for (const { provider_id } of due) {
    await rpc('consent_b3_record', { p_provider_id: provider_id, p_result: await cancelOutcome(provider_id) })
  }
  return due.length
}
