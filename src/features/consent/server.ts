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
export async function userFromBearer(req: Request): Promise<string | null> {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return null
  const url = env('NEXT_PUBLIC_SUPABASE_URL'), anon = env('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  const r = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` }, cache: 'no-store' })
  if (!r.ok) return null
  const u = await r.json().catch(() => null)
  return typeof u?.id === 'string' ? u.id : null
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
    'You are receiving this because you have a Milo account.',
    `Unsubscribe from updates like this: ${unsubscribeUrl}`,
    `Radlor Inc.\n${POSTAL_ADDRESS}`,
    'We will still send you essential messages about your account and your subscription, such as receipts and renewal reminders.',
  ]
  const html = lines.map(l => `<p style="color:#666;font-size:12px">${l
    .replace(unsubscribeUrl, `<a href="${unsubscribeUrl}">${unsubscribeUrl}</a>`).replace('\n', '<br>')}</p>`).join('')
  return { subject: m.subject, text: `${m.text}\n\n--\n${lines.join('\n\n')}`, html: `${m.html}<hr>${html}` }
}

/** Best-effort: used only where a scheduled B3 must not arrive (a grant that lost a race, a withdrawal). */
export async function cancelEmail(id: string): Promise<boolean> {
  try {
    const r = await fetch(`${RESEND()}/emails/${encodeURIComponent(id)}/cancel`, {
      method: 'POST', headers: { Authorization: `Bearer ${env('RESEND_API_KEY')}` }, cache: 'no-store',
    })
    return r.ok
  } catch { return false }
}
