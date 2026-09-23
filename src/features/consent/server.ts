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
 */
export async function sendEmail(to: string, m: Rendered, idempotencyKey: string, scheduledAt?: Date): Promise<string> {
  const r = await fetch(`${RESEND()}/emails`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env('RESEND_API_KEY')}`, 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({
      from: EMAIL_FROM, reply_to: EMAIL_REPLY_TO, to: [to], subject: m.subject, html: m.html, text: m.text,
      ...(scheduledAt ? { scheduled_at: scheduledAt.toISOString() } : {}),
    }),
    cache: 'no-store',
  })
  const body = await r.json().catch(() => null)
  if (!r.ok || typeof body?.id !== 'string') throw new Error(`resend ${r.status}: ${body?.message ?? body?.name ?? 'no id returned'}`)
  return body.id
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
