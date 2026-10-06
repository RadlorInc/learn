// @vitest-environment node
/**
 * BOUNCE SUPPRESSION (20261007000000): A PERMANENT BOUNCE OR A COMPLAINT STOPS EVERY EMAIL TO THAT ADDRESS.
 *
 * The table is the REAL migration in the repo's real schema (pglite, `_schema.ts`), with Supabase's default
 * privileges installed first so the migration's `revoke` has something to remove (see emailSuppression.test.ts).
 * The webhook route and `sendEmail` reach it over PostgREST; `fetch` is answered by a small translator that runs the
 * exact requests the code sends, AS `service_role`. Resend is the other half of `fetch`: every message the code tries
 * to deliver is captured, so "no mail" is read off the send log.
 *
 * ⚠️ Expected values are written here: the hash is node's sha256 of the literal lowercase address, never the
 * code's own `emailHash`.
 */
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { createHash, createHmac } from 'node:crypto'
import type { PGlite } from '@electric-sql/pglite'
import { applyFrom, loadSchema } from './_schema'

let db: PGlite
const resend: { to: string[] }[] = []
const events: { message: string }[] = []
const sha = (e: string) => createHash('sha256').update(e).digest('hex')

async function postgrest(url: URL, init: RequestInit): Promise<Response> {
  const table = url.pathname.split('/').pop()!
  if (table === 'error_events') { events.push(JSON.parse(String(init.body))); return new Response(null, { status: 201 }) }
  await db.exec('set role service_role')
  try {
    if ((init.method ?? 'GET') === 'GET') {
      const [col, v] = [...url.searchParams].find(([k]) => k !== 'select')!
      if (!/^[a-z_0-9]+$/.test(col) || !v.startsWith('eq.')) throw new Error(`unsupported filter ${col}=${v}`)
      return Response.json((await db.query(`select ${url.searchParams.get('select')} from public.${table} where ${col} = $1`, [v.slice(3)])).rows)
    }
    // POST ?on_conflict=<col> with Prefer: resolution=merge-duplicates — PostgREST's upsert: the sent columns overwrite.
    const pk = url.searchParams.get('on_conflict')
    if (!pk || !String((init.headers as Record<string, string>).Prefer).includes('resolution=merge-duplicates')) throw new Error('not an upsert')
    const body = JSON.parse(String(init.body)) as Record<string, unknown>, keys = Object.keys(body)
    await db.query(`insert into public.${table} (${keys}) values (${keys.map((_, i) => `$${i + 1}`)})
      on conflict (${pk}) do update set ${keys.map(k => `${k} = excluded.${k}`)}`, keys.map(k => body[k]))
    return new Response(null, { status: 201 })
  } catch (e) {
    const code = (e as { code?: string }).code
    // PostgREST answers a relation that does not exist with 404 (PGRST205).
    return Response.json({ code, message: String(e) }, { status: code === '42P01' ? 404 : code === '42501' ? 403 : 400 })
  } finally { await db.exec('reset role') }
}

const MIGRATION = '20261007000000_email_undeliverable.sql'
const SECRET = 'whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw'   // Svix's documented example secret

beforeAll(async () => {
  ;({ db } = await loadSchema({ before: MIGRATION }))
  await db.exec('alter default privileges in schema public grant all on tables to anon, authenticated, service_role')
  await applyFrom(db, MIGRATION)
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://supabase.test'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role'
  process.env.RESEND_API_KEY = 'test-resend'
  process.env.RESEND_WEBHOOK_SECRET = SECRET
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon'
  delete process.env.RESEND_API_URL
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.stubGlobal('fetch', async (input: string | URL, init: RequestInit = {}) => {
    const url = new URL(String(input))
    // GoTrue's /user: the bearer IS the signed-in adult's address here, so each test picks whose screen it is.
    if (url.host === 'supabase.test' && url.pathname === '/auth/v1/user') {
      const who = String((init.headers as Record<string, string>).Authorization).replace('Bearer ', '')
      return Response.json({ id: '00000000-0000-4000-8000-000000000001', email: who })
    }
    if (url.host === 'supabase.test') return postgrest(url, init)
    if (url.href === 'https://api.resend.com/emails') {
      resend.push(JSON.parse(String(init.body)))
      return Response.json({ id: `re_${resend.length}` })
    }
    throw new Error(`unexpected fetch ${url.href}`)
  })
}, 60_000)

beforeEach(async () => { resend.length = 0; events.length = 0; await db.exec('delete from public.email_undeliverable') })

/** A Resend event shaped as Resend's docs show it (webhooks → email.bounced / email.complained), signed Svix-style. */
async function deliver(type: string, to: string[], bounceType?: string) {
  const body = JSON.stringify({
    type, created_at: '2026-10-06T10:00:00.000Z',
    data: {
      email_id: '56761188-7520-42d8-8898-ff6fc54ce618', from: 'Radlic <hello@radlic.com>', to, subject: 'Please confirm',
      ...(bounceType ? { bounce: { message: 'mailbox does not exist', subType: 'General', type: bounceType } } : {}),
    },
  })
  const id = 'msg_1', ts = String(Math.floor(Date.now() / 1000))
  const sig = createHmac('sha256', Buffer.from(SECRET.slice(6), 'base64')).update(`${id}.${ts}.${body}`).digest('base64')
  const { POST } = await import('@/app/api/email/resend-webhook/route')
  const r = await POST(new Request('http://x/api/email/resend-webhook', {
    method: 'POST', body, headers: { 'svix-id': id, 'svix-timestamp': ts, 'svix-signature': `v1,${sig}` },
  }))
  return r.status
}
const rows = async () =>
  (await db.query<{ email_sha256: string; reason: string }>('select email_sha256, reason from public.email_undeliverable order by reason')).rows

const MSG = { subject: 'Hi', html: '<p>Hi</p>', text: 'Hi' }
const server = () => import('@/features/consent/server')

describe('the webhook lists a permanent bounce and a complaint — and nothing softer', () => {
  it('a Permanent bounce lists the recipient, as a hash of the lowercase address and never the address', async () => {
    expect(await deliver('email.bounced', ['Typo.Parent@Example.test'], 'Permanent')).toBe(200)
    expect(await rows()).toEqual([{ email_sha256: sha('typo.parent@example.test'), reason: 'bounced' }])
    const dump = JSON.stringify((await db.query('select * from public.email_undeliverable')).rows)
    expect(dump.toLowerCase(), 'the address itself was stored').not.toContain('typo.parent')
    expect(events.map(e => e.message), 'the event row is still written, type only').toEqual(['[resend] email.bounced'])
  })

  it('a complaint lists the recipient as "complained"', async () => {
    expect(await deliver('email.complained', ['p@x.test'])).toBe(200)
    expect(await rows()).toEqual([{ email_sha256: sha('p@x.test'), reason: 'complained' }])
  })

  it('a Transient or Undetermined bounce (full mailbox, greylist) lists nobody, but is still counted', async () => {
    expect(await deliver('email.bounced', ['p@x.test'], 'Transient')).toBe(200)
    expect(await deliver('email.bounced', ['p@x.test'], 'Undetermined')).toBe(200)
    expect(await deliver('email.bounced', ['p@x.test'])).toBe(200)
    expect(await rows()).toEqual([])
    expect(events).toHaveLength(3)
  })

  it('a delivered email lists nobody', async () => {
    expect(await deliver('email.delivered', ['p@x.test'])).toBe(200)
    expect(await rows()).toEqual([])
  })

  it('without the table (migration not applied yet): 200 and the event row, as before', async () => {
    await db.exec('alter table public.email_undeliverable rename to email_undeliverable_away')
    try {
      expect(await deliver('email.bounced', ['p@x.test'], 'Permanent')).toBe(200)
      expect(events.map(e => e.message)).toEqual(['[resend] email.bounced'])
    } finally { await db.exec('alter table public.email_undeliverable_away rename to email_undeliverable') }
  })
})

describe('sendEmail sends nothing to a listed address, of any kind', () => {
  it('a listed address: throws Undeliverable, Resend is never called, and the sink row names no address', async () => {
    await deliver('email.bounced', ['typo@x.test'], 'Permanent')
    events.length = 0
    const { sendEmail, Undeliverable } = await server()
    const err = await sendEmail('transactional', '  TYPO@x.test ', MSG, 'k1').then(() => null, (e: unknown) => e)
    expect(resend, 'a listed address was mailed').toHaveLength(0)
    expect(err, 'the caller was not told the address is undeliverable').toBeInstanceOf(Undeliverable)
    expect(events.map(e => e.message)).toEqual(['[email] not sent: the address bounced earlier'])
    expect(JSON.stringify(events)).not.toContain('typo')
  })

  it('…and a DIFFERENT address still sends (the positive twin)', async () => {
    await deliver('email.bounced', ['typo@x.test'], 'Permanent')
    const { sendEmail } = await server()
    expect(await sendEmail('transactional', 'fixed@x.test', MSG, 'k1')).toMatch(/^re_/)
    expect(resend.map(m => m.to)).toEqual([['fixed@x.test']])
  })

  it('without the table, mail is sent as before (fails open)', async () => {
    await db.exec('alter table public.email_undeliverable rename to email_undeliverable_away')
    try {
      const { sendEmail } = await server()
      expect(await sendEmail('transactional', 'p@x.test', MSG, 'k1')).toMatch(/^re_/)
    } finally { await db.exec('alter table public.email_undeliverable_away rename to email_undeliverable') }
  })
})

describe('GET /api/email/deliverable: the Waiting card asks about the caller\'s OWN address, as a boolean', () => {
  const ask = async (bearer?: string) => {
    const { GET } = await import('@/app/api/email/deliverable/route')
    const r = await GET(new Request('http://x/api/email/deliverable', bearer ? { headers: { authorization: `Bearer ${bearer}` } } : {}))
    return { status: r.status, body: await r.json() }
  }
  it('listed → true; a different signed-in adult → false (the twin); signed out → 401', async () => {
    await deliver('email.bounced', ['typo@x.test'], 'Permanent')
    expect(await ask('typo@x.test')).toEqual({ status: 200, body: { undeliverable: true } })
    expect(await ask('fixed@x.test')).toEqual({ status: 200, body: { undeliverable: false } })
    expect((await ask()).status).toBe(401)
  })
})

describe('the table is service-role only (RLS on, no policies, no client privileges)', () => {
  const outcome = async (role: string, sql: string) => {
    await db.exec(`set role ${role}`)
    try { await db.query(sql); return 'ok' } catch (e) { return (e as { code?: string }).code ?? String(e) } finally { await db.exec('reset role') }
  }
  const row = `('${'a'.repeat(64)}', 'bounced')`
  for (const role of ['anon', 'authenticated']) {
    it(`${role} can neither read nor write it`, async () => {
      expect(await outcome(role, 'select * from public.email_undeliverable'), `${role} could read the list`).toBe('42501')
      expect(await outcome(role, `insert into public.email_undeliverable (email_sha256, reason) values ${row}`), `${role} could list an address`).toBe('42501')
      expect(await outcome(role, 'delete from public.email_undeliverable'), `${role} could lift a listing`).toBe('42501')
    })
  }
  it('…and service_role, the real caller, can read and write (the positive twin)', async () => {
    expect(await outcome('service_role', `insert into public.email_undeliverable (email_sha256, reason) values ${row}`)).toBe('ok')
    expect(await outcome('service_role', `update public.email_undeliverable set reason = 'complained'`)).toBe('ok')
    expect(await outcome('service_role', 'select * from public.email_undeliverable')).toBe('ok')
  })
  it('…but not delete: Supabase\'s default privilege grants it everything, and lifting a listing is an operator\'s write', async () => {
    expect(await outcome('service_role', 'delete from public.email_undeliverable'), 'the server could lift a listing').toBe('42501')
  })
  it('RLS is enabled and there are no policies', async () => {
    const { rows: [t] } = await db.query<{ rls: boolean }>(`select relrowsecurity rls from pg_class where oid = 'public.email_undeliverable'::regclass`)
    expect(t.rls).toBe(true)
    const { rows: p } = await db.query(`select 1 from pg_policies where tablename = 'email_undeliverable'`)
    expect(p).toEqual([])
  })
})
