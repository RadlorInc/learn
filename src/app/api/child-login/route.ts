import { NextResponse } from 'next/server'
import { callerKey, overLimit } from '../_rateLimit'
import { CHILD_MIN_PASSWORD, childEmail, normalizeUsername, usernameFromEmail } from '@/core/childLogin'

/**
 * A child's username and password, set by the adult who CREATED that learner — a parent or a teacher
 * (`learners.created_by`). GET lists the logins for the caller's learners, POST sets or changes one, DELETE removes it.
 *
 * ⚠️⚠️ THIS ROUTE HOLDS THE SERVICE ROLE AND IS THE ONLY PLACE A CHILD ACCOUNT IS MADE. Read it whole before changing it.
 *
 * WHO THE CALLER IS comes from their token, verified by Supabase (`/auth/v1/user`), never from the body.
 * WHETHER THEY MAY ACT on a learner is asked with THEIR OWN token: `learners?id=…&created_by=<them>` under RLS.
 * A viewer parent (invited, not the creator) is refused — same rule as `learners: update`.
 * The service role is used only for what a client cannot do at all: create or change an auth user, and write the
 * child's `learner_access` row and `profiles.role`.
 *
 * WHAT THE CHILD CAN THEN DO: a `learner_access` row with `access_role = 'self'` (migration 20260917120000). Every
 * policy guarding a child's data reads `learner_access.parent_id = auth.uid()`, so the child reaches their OWN record
 * and nothing else. Updating or deleting the learner is `created_by`-only, so a child cannot change their topics,
 * rename themselves, or delete anything.
 *
 * ⚠️ `profiles.role = 'learner'` is what sends the child to their lessons. It is a UX label, NOT a permission: the
 * child owns their profile row and can rewrite it (see CLAUDE.md, "a column a client can write"). Rewriting it grants
 * nothing — their data access comes only from the `self` row, which they cannot create or widen.
 */
export const dynamic = 'force-dynamic'

const LIMIT = 20
const WINDOW_MS = 60_000
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Env = { url: string; anon: string; service: string }
const json = (body: unknown, status = 200) => NextResponse.json(body, { status })

function env(): Env | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  // ⚠️ NO ANON FALLBACK: without the service role nothing here can work, and pretending would be worse.
  return url && anon && service ? { url, anon, service } : null
}

const asService = (e: Env, path: string, init: RequestInit = {}) => fetch(`${e.url}${path}`, {
  ...init, headers: { apikey: e.service, Authorization: `Bearer ${e.service}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
})

/** The caller's user id from their token, or null. `fetch` does not throw on 401 — `ok` is checked. */
async function caller(req: Request, e: Env): Promise<{ id: string; token: string } | null> {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return null
  const r = await fetch(`${e.url}/auth/v1/user`, { headers: { apikey: e.anon, Authorization: `Bearer ${token}` } }).catch(() => null)
  if (!r?.ok) return null
  const u = (await r.json().catch(() => null)) as { id?: string } | null
  return u?.id ? { id: u.id, token } : null
}

/** Learners this caller CREATED, read with the caller's own token (RLS applies). */
async function ownLearners(e: Env, who: { id: string; token: string }, learnerId?: string) {
  const q = `/rest/v1/learners?select=id,display_name&created_by=eq.${who.id}${learnerId ? `&id=eq.${learnerId}` : ''}`
  const r = await fetch(`${e.url}${q}`, { headers: { apikey: e.anon, Authorization: `Bearer ${who.token}` } }).catch(() => null)
  if (!r?.ok) return null
  return (await r.json()) as { id: string; display_name: string }[]
}

/** The child accounts linked to these learners. */
async function selfRows(e: Env, learnerIds: string[]) {
  if (!learnerIds.length) return []
  const r = await asService(e, `/rest/v1/learner_access?select=learner_id,parent_id&access_role=eq.self&learner_id=in.(${learnerIds.join(',')})`)
  if (!r.ok) return null
  return (await r.json()) as { learner_id: string; parent_id: string }[]
}

/** Common start: rate limit, configuration, caller, and (for one learner) ownership. */
async function begin(req: Request, learnerId?: unknown) {
  if (overLimit(callerKey(req, 'child-login'), LIMIT, WINDOW_MS)) return { res: json({ ok: false, error: 'rate_limited' }, 429) }
  const e = env()
  if (!e) return { res: json({ ok: false, error: 'not_configured' }, 503) }
  const who = await caller(req, e)
  if (!who) return { res: json({ ok: false, error: 'unauthenticated' }, 401) }
  if (learnerId === undefined) return { e, who }
  if (typeof learnerId !== 'string' || !UUID.test(learnerId)) return { res: json({ ok: false, error: 'bad_request' }, 400) }
  const own = await ownLearners(e, who, learnerId)
  if (own === null) return { res: json({ ok: false, error: 'lookup_failed' }, 502) }
  if (own.length !== 1) return { res: json({ ok: false, error: 'not_owner' }, 403) }
  return { e, who, learner: own[0] }
}

export async function GET(req: Request) {
  const b = await begin(req)
  if ('res' in b) return b.res
  const own = await ownLearners(b.e, b.who)
  if (own === null) return json({ ok: false, error: 'lookup_failed' }, 502)
  const rows = await selfRows(b.e, own.map(l => l.id))
  if (rows === null) return json({ ok: false, error: 'lookup_failed' }, 502)
  const logins: Record<string, string> = {}
  for (const row of rows) {
    const r = await asService(b.e, `/auth/v1/admin/users/${row.parent_id}`)
    if (!r.ok) continue
    const u = usernameFromEmail(((await r.json()) as { email?: string }).email)
    if (u) logins[row.learner_id] = u
  }
  return json({ ok: true, logins })
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { learnerId?: unknown; username?: unknown; password?: unknown }
  const b = await begin(req, body.learnerId)
  if ('res' in b) return b.res
  const learner = b.learner!   // begin() with a learnerId returns one or a refusal
  const username = typeof body.username === 'string' ? normalizeUsername(body.username) : null
  const password = typeof body.password === 'string' ? body.password : ''
  if (!username) return json({ ok: false, error: 'bad_username' }, 400)
  if (password.length < CHILD_MIN_PASSWORD || password.length > 72) return json({ ok: false, error: 'weak_password' }, 400)

  const rows = await selfRows(b.e, [learner.id])
  if (rows === null) return json({ ok: false, error: 'lookup_failed' }, 502)
  const taken = async (r: Response) => r.status === 422 && /exist|registered/i.test(await r.clone().text())

  // Already has a login: change its username and/or password in place.
  if (rows.length) {
    const r = await asService(b.e, `/auth/v1/admin/users/${rows[0].parent_id}`, {
      method: 'PUT', body: JSON.stringify({ email: childEmail(username), password, email_confirm: true }),
    })
    if (await taken(r)) return json({ ok: false, error: 'username_taken' }, 409)
    if (!r.ok) return json({ ok: false, error: 'update_failed' }, 502)
    return json({ ok: true, username })
  }

  // New login: the account (pre-confirmed — nobody can confirm a `.invalid` address), then the link, then the role.
  const c = await asService(b.e, '/auth/v1/admin/users', {
    method: 'POST', body: JSON.stringify({ email: childEmail(username), password, email_confirm: true, user_metadata: { full_name: learner.display_name } }),
  })
  if (await taken(c)) return json({ ok: false, error: 'username_taken' }, 409)
  const created = c.ok ? ((await c.json()) as { id?: string }) : null
  if (!created?.id) return json({ ok: false, error: 'create_failed' }, 502)

  const link = await asService(b.e, '/rest/v1/learner_access', {
    method: 'POST', body: JSON.stringify({ learner_id: learner.id, parent_id: created.id, access_role: 'self' }),
  })
  const role = link.ok ? await asService(b.e, '/rest/v1/profiles', {
    method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ id: created.id, role: 'learner', display_name: learner.display_name }),
  }) : null
  if (!link.ok || !role?.ok) {
    // ⚠️ Roll back rather than leave a half-made account: without the link it signs in to nothing, and without the
    // role the child is offered the Teacher/Parent picker. Deleting the user cascades the access row.
    await asService(b.e, `/auth/v1/admin/users/${created.id}`, { method: 'DELETE' })
    return json({ ok: false, error: 'link_failed' }, 502)
  }
  return json({ ok: true, username })
}

export async function DELETE(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { learnerId?: unknown }
  const b = await begin(req, body.learnerId)
  if ('res' in b) return b.res
  const rows = await selfRows(b.e, [b.learner!.id])
  if (rows === null) return json({ ok: false, error: 'lookup_failed' }, 502)
  for (const row of rows) {
    const r = await asService(b.e, `/auth/v1/admin/users/${row.parent_id}`, { method: 'DELETE' })
    if (!r.ok && r.status !== 404) return json({ ok: false, error: 'delete_failed' }, 502)
  }
  return json({ ok: true })
}
