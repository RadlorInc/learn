// @vitest-environment node
/**
 * CAN-SPAM: A SUPPRESSED ADDRESS GETS NO COMMERCIAL MAIL — AND STILL GETS EVERY TRANSACTIONAL ONE.
 *
 * The table is the REAL migration in the repo's real schema (pglite, `_schema.ts`). The server code
 * reaches it over PostgREST, so `fetch` is answered by a small translator that runs the exact
 * filters the code sends (`col=eq.v`, `col=is.null`, `select=`) as SQL against that table, AS
 * `service_role` — the role the server really uses. Resend is the other half of `fetch`: every
 * message the code tries to deliver is captured, so "no mail" is read off the send log, never
 * inferred from a return value.
 *
 * ⚠️ Expected text (the footer, the address) is written out here or read from docs/legal/09 — never
 * imported from the code under test, which would only prove the code equals itself.
 */
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import type { PGlite } from '@electric-sql/pglite'
import { applyFile, loadSchema } from './_schema'

let db: PGlite
const resend: { to: string[]; subject: string; html: string; text: string; headers?: Record<string, string>; scheduled_at?: string }[] = []

/** PostgREST, for the one table and the filter shapes the code uses — run for real, as service_role. */
async function postgrest(url: URL, init: RequestInit): Promise<Response> {
  const table = url.pathname.split('/').pop()!
  const where: string[] = [], args: unknown[] = []
  let cols = '*'
  for (const [k, v] of url.searchParams) {
    if (k === 'select') { cols = v; continue }
    if (!/^[a-z_]+$/.test(k)) throw new Error(`unexpected column ${k}`)
    if (v === 'is.null') where.push(`${k} is null`)
    else if (v.startsWith('eq.')) { args.push(v.slice(3)); where.push(`${k} = $${args.length}`) }
    else throw new Error(`unsupported filter ${k}=${v}`)
  }
  const w = where.length ? ` where ${where.join(' and ')}` : ''
  const method = init.method ?? 'GET'
  await db.exec('set role service_role')
  try {
    if (method === 'GET') {
      const r = await db.query(`select ${cols} from public.${table}${w}`, args)
      return Response.json(r.rows)
    }
    const body = JSON.parse(String(init.body)) as Record<string, unknown>
    const keys = Object.keys(body)
    if (method === 'POST') {
      await db.query(`insert into public.${table} (${keys.join(',')}) values (${keys.map((_, i) => `$${i + 1}`).join(',')})`, keys.map(k => body[k]))
      return new Response(null, { status: 201 })
    }
    if (method === 'PATCH') {
      const set = keys.map((k, i) => `${k} = $${args.length + i + 1}`).join(',')
      await db.query(`update public.${table} set ${set}${w}`, [...args, ...keys.map(k => body[k])])
      return new Response(null, { status: 204 })
    }
    throw new Error(`unsupported method ${method}`)
  } catch (e) {
    const code = (e as { code?: string }).code
    return Response.json({ code, message: String(e) }, { status: code === '23505' ? 409 : code === '42501' ? 403 : 400 })
  } finally { await db.exec('reset role') }
}

/**
 * ⚠️ SUPABASE GRANTS EVERY NEW public TABLE TO anon AND authenticated BY DEFAULT PRIVILEGE; plain
 * Postgres does not. Built naively, pglite is a world where the migration's `revoke` has nothing to
 * remove — a planted break deleting it stayed green (break-check exit 1, measured 2026-09-23). So the
 * schema is loaded up to this migration, the platform's default is installed, and then this migration
 * and everything after it run into it, as they do on the real platform.
 */
const MIGRATION = '20260923190000_email_suppressions.sql'
async function loadAsSupabase(): Promise<PGlite> {
  const { db } = await loadSchema({ before: MIGRATION })
  await db.exec('alter default privileges in schema public grant all on tables to anon, authenticated, service_role')
  for (const f of readdirSync(resolve(__dirname, '../../supabase/migrations')).filter(f => f.endsWith('.sql') && f >= MIGRATION).sort()) {
    await applyFile(db, f)
  }
  return db
}

beforeAll(async () => {
  db = await loadAsSupabase()
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://supabase.test'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role'
  process.env.RESEND_API_KEY = 'test-resend'
  delete process.env.RESEND_API_URL
  vi.stubGlobal('fetch', async (input: string | URL, init: RequestInit = {}) => {
    const url = new URL(String(input))
    if (url.host === 'supabase.test') return postgrest(url, init)
    if (url.href === 'https://api.resend.com/emails') {
      resend.push(JSON.parse(String(init.body)))
      return Response.json({ id: `re_${resend.length}` })
    }
    throw new Error(`unexpected fetch ${url.href}`)
  })
}, 60_000)

beforeEach(async () => { resend.length = 0; await db.exec('delete from public.email_suppressions') })

const MSG = { subject: 'News', html: '<p>Hello</p>', text: 'Hello' }
const server = () => import('@/features/consent/server')
const tokenOf = async (email: string) =>
  (await db.query<{ token: string }>('select token from public.email_suppressions where email = $1', [email])).rows[0]?.token

describe('the suppression list binds commercial mail and nothing else', () => {
  it('a suppressed address receives NO commercial email but STILL receives a transactional one', async () => {
    const { sendEmail, unsubscribe } = await server()
    expect(await sendEmail('commercial', 'p@x.test', MSG, 'k1')).toMatch(/^re_/)
    expect(await unsubscribe((await tokenOf('p@x.test'))!)).toBe('unsubscribed')
    resend.length = 0

    expect(await sendEmail('commercial', 'p@x.test', MSG, 'k2'), 'a commercial send to a suppressed address must say so').toBe('suppressed')
    expect(resend, 'a suppressed address was mailed a commercial email').toHaveLength(0)

    expect(await sendEmail('transactional', 'p@x.test', MSG, 'k3')).toMatch(/^re_/)
    expect(resend.map(m => m.to), 'suppression must never stop a transactional email').toEqual([['p@x.test']])
  })

  it('suppression ignores case and surrounding space in the address', async () => {
    const { sendEmail, unsubscribe } = await server()
    await sendEmail('commercial', 'p@x.test', MSG, 'k1')
    await unsubscribe((await tokenOf('p@x.test'))!)
    resend.length = 0
    expect(await sendEmail('commercial', '  P@X.Test ', MSG, 'k2')).toBe('suppressed')
    expect(resend).toHaveLength(0)
  })

  it('a transactional email never touches the list and never carries the commercial footer', async () => {
    const { sendEmail } = await server()
    await sendEmail('transactional', 'q@x.test', MSG, 'k1')
    expect(await tokenOf('q@x.test')).toBeUndefined()
    expect(resend[0].headers?.['List-Unsubscribe']).toBeUndefined()
    expect(resend[0].text).toBe('Hello')
  })

  it('a commercial email cannot be scheduled — the list is checked when it is sent, not when it goes out', async () => {
    const { sendEmail } = await server()
    // The overloads already refuse this at compile time; the runtime refusal is for a caller that casts past them.
    const untyped = sendEmail as unknown as (...a: unknown[]) => Promise<string>
    await expect(untyped('commercial', 'p@x.test', MSG, 'k1', new Date(Date.now() + 3600_000))).rejects.toThrow('cannot be scheduled')
    expect(resend).toHaveLength(0)
  })

  it('refuses to send commercial mail when the list cannot be read (table missing = migration not applied)', async () => {
    const { sendEmail } = await server()
    await db.exec('alter table public.email_suppressions rename to email_suppressions_away')
    try {
      await expect(sendEmail('commercial', 'p@x.test', MSG, 'k1')).rejects.toThrow()
      expect(resend).toHaveLength(0)
      expect(await sendEmail('transactional', 'p@x.test', MSG, 'k2')).toMatch(/^re_/)
    } finally { await db.exec('alter table public.email_suppressions_away rename to email_suppressions') }
  })
})

describe('the commercial footer and headers (docs/legal/09 §2, §4; RFC 8058)', () => {
  const doc = readFileSync(resolve(__dirname, '../../docs/legal/09-email-compliance.md'), 'utf8')
  const address = doc.match(/postal address\*\* must appear: ([^—\n]+?) —/)![1]

  it('the address this test reads out of doc 09 §2.4 is the one it expects (positive control)', () => {
    expect(address).toBe('254 Chapman Rd, Ste 208 #28608, Newark, DE 19702')
  })

  it('carries the §4 footer, the address, a one-click link with an opaque token, and the RFC 8058 headers', async () => {
    const { sendEmail } = await server()
    await sendEmail('commercial', 'p@x.test', MSG, 'k1')
    const m = resend[0], token = (await tokenOf('p@x.test'))!
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    for (const body of [m.text, m.html]) {
      expect(body).toContain('You are receiving this because you have a Milo account.')
      expect(body).toContain('Unsubscribe from updates like this')
      expect(body).toContain('Radlor Inc.')
      expect(body).toContain(address)
      expect(body).toContain('We will still send you essential messages about your account')
      expect(body).toContain(`/email/unsubscribe#t=${token}`)
      expect(body, 'the address must never appear in a link').not.toMatch(/unsubscribe[^\s"<]*p(%40|@)x\.test/)
    }
    expect(m.text.startsWith('Hello'), 'the footer is appended, the message is kept').toBe(true)
    expect(m.headers?.['List-Unsubscribe']).toMatch(new RegExp(`^<https://[^>]+/api/email/unsubscribe\\?t=${token}>$`))
    expect(m.headers?.['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click')
  })

  it('every email to an address carries the same working token', async () => {
    const { sendEmail } = await server()
    await sendEmail('commercial', 'p@x.test', MSG, 'k1')
    await sendEmail('commercial', 'p@x.test', MSG, 'k2')
    const token = (await tokenOf('p@x.test'))!
    expect(resend.map(m => m.headers?.['List-Unsubscribe']?.includes(token))).toEqual([true, true])
  })
})

describe('the unsubscribe route', () => {
  const post = async (t: string) => {
    const { POST } = await import('@/app/api/email/unsubscribe/route')
    const r = await POST(new Request(`http://x/api/email/unsubscribe?t=${t}`, {
      method: 'POST', body: 'List-Unsubscribe=One-Click',
      headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-forwarded-for': `10.1.0.${Math.random() * 250 | 0}` },
    }))
    return { status: r.status, body: await r.json() }
  }
  const suppressed = async () =>
    (await db.query<{ email: string }>('select email from public.email_suppressions where suppressed_at is not null order by email')).rows.map(r => r.email)

  it('suppresses the address the token belongs to, and nothing else', async () => {
    const { sendEmail } = await server()
    await sendEmail('commercial', 'a@x.test', MSG, 'k1')
    await sendEmail('commercial', 'b@x.test', MSG, 'k2')
    const r = await post((await tokenOf('a@x.test'))!)
    expect(r).toEqual({ status: 200, body: { status: 'unsubscribed' } })
    expect(await suppressed()).toEqual(['a@x.test'])
  })

  it('a second press keeps the first time it took effect', async () => {
    const { sendEmail } = await server()
    await sendEmail('commercial', 'a@x.test', MSG, 'k1')
    const t = (await tokenOf('a@x.test'))!
    await post(t)
    const first = (await db.query<{ s: string }>('select suppressed_at::text s from public.email_suppressions')).rows[0].s
    expect((await post(t)).body.status).toBe('unsubscribed')
    expect((await db.query<{ s: string }>('select suppressed_at::text s from public.email_suppressions')).rows[0].s).toBe(first)
  })

  it('an unknown or malformed token changes nothing', async () => {
    const { sendEmail } = await server()
    await sendEmail('commercial', 'a@x.test', MSG, 'k1')
    expect((await post('B'.repeat(43))).body.status).toBe('unknown')
    expect((await post('not-a-token')).body.status).toBe('unknown')
    expect(await suppressed()).toEqual([])
  })

  it('answers no GET — a mail scanner prefetching the link must not unsubscribe anyone', async () => {
    expect((await import('@/app/api/email/unsubscribe/route') as Record<string, unknown>).GET).toBeUndefined()
  })
})

describe('the table is service-role only (RLS on, no policies, no client privileges)', () => {
  const as = async <T>(role: string, sql: string) => {
    await db.exec(`set role ${role}`)
    try { return await db.query<T>(sql) } finally { await db.exec('reset role') }
  }
  /** The SQLSTATE a statement ends with — 'ok' when it runs. An assertion on this names the refusal. */
  const outcome = (role: string, sql: string) => as(role, sql).then(() => 'ok', (e: { code?: string }) => e.code ?? String(e))
  for (const role of ['anon', 'authenticated']) {
    it(`${role} can neither read nor write it`, async () => {
      expect(await outcome(role, 'select * from public.email_suppressions'), `${role} could read the list`).toBe('42501')
      expect(await outcome(role, `insert into public.email_suppressions (email, token) values ('z@x.test', '${'C'.repeat(43)}')`), `${role} could add to the list`).toBe('42501')
      expect(await outcome(role, 'update public.email_suppressions set suppressed_at = null'), `${role} could re-subscribe someone`).toBe('42501')
    })
  }
  it('…and service_role, the real caller, can (the positive twin)', async () => {
    await as('service_role', `insert into public.email_suppressions (email, token) values ('z@x.test', '${'C'.repeat(43)}')`)
    await as('service_role', `update public.email_suppressions set suppressed_at = now() where email = 'z@x.test'`)
    expect((await as<{ n: number }>('service_role', 'select count(*)::int n from public.email_suppressions where suppressed_at is not null')).rows[0].n).toBe(1)
  })
  it('RLS is enabled and there are no policies', async () => {
    const r = await db.query<{ rls: boolean; n: number }>(`select c.relrowsecurity rls, (select count(*)::int from pg_policy p where p.polrelid = c.oid) n
      from pg_class c where c.oid = 'public.email_suppressions'::regclass`)
    expect(r.rows[0]).toEqual({ rls: true, n: 0 })
  })
})
