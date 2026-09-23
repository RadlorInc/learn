// @vitest-environment node
/**
 * B3 ("Yesterday you gave permission…") IS CANCELLED ON EVERY PATH THAT ENDS A GRANTED CONSENT.
 *
 * Each path is driven for real on the repo's schema (PGlite), then the SERVER's drain runs with
 * `fetch` pointed at that same database for Supabase and at a recording stand-in for Resend. So the
 * assertion is the whole chain: the path ended the consent → the id survived → Resend was asked to
 * cancel THAT id → the outcome is recorded.
 *
 * ⚠️ The ids are written out per test ('re_withdraw', 're_delete', 're_close'), never read back from
 * the queue: a check that cancels whatever the queue holds would pass on a queue that captured the
 * wrong id. And the account-close case first proves the consent ROW is gone — the id's only other
 * home — so "cancelled" there cannot be explained by the row surviving.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema, grantedConsent } from './_schema'

let db: PGlite
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows

// ── the stand-ins: Supabase's RPC endpoint backed by PGlite, and Resend recording its calls ─────────
const resendCalls: string[] = []
let resendAnswer: (id: string) => { status: number; body: unknown } = () => ({ status: 200, body: { object: 'email' } })

async function fakeFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  const url = String(input instanceof Request ? input.url : input)
  const rpc = url.match(/^http:\/\/sb\.test\/rest\/v1\/rpc\/(\w+)$/)
  if (rpc) {
    const args = JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>
    const names = Object.keys(args)
    const exists = (await q(`select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = $1`, [rpc[1]])).length > 0
    if (!exists) return new Response(JSON.stringify({ code: 'PGRST202', message: 'Could not find the function' }), { status: 404 })
    await db.exec('set role service_role')
    try {
      const res = await db.query(`select * from public.${rpc[1]}(${names.map((n, i) => `${n} => $${i + 1}`).join(', ')})`, names.map(n => args[n]))
      return rpc[1] === 'consent_b3_record' ? new Response(null, { status: 204 }) : new Response(JSON.stringify(res.rows), { status: 200 })
    } finally { await db.exec('reset role') }
  }
  const cancel = url.match(/^http:\/\/resend\.test\/emails\/([^/]+)\/cancel$/)
  if (cancel) {
    const id = decodeURIComponent(cancel[1])
    resendCalls.push(id)
    const a = resendAnswer(id)
    return new Response(JSON.stringify(a.body), { status: a.status })
  }
  throw new Error(`unexpected fetch ${url}`)
}

const drain = async () => (await import('@/features/consent/server')).drainB3Cancellations()
const queued = async (id: string) => (await q<{ cancel_result: string | null; queued_because: string }>(
  `select cancel_result, queued_because from public.consent_b3_cancellations where provider_id = $1`, [id]))[0]

// ── people ──────────────────────────────────────────────────────────────────────────────────────
async function parent(id: string, email: string) {
  await db.exec(`insert into auth.users (id, email, email_confirmed_at) values ('${id}', '${email}', now());
    insert into public.profiles (id, role) values ('${id}', 'parent') on conflict (id) do update set role = excluded.role;`)
}
/** A child whose consent is granted and whose B3, id `b3`, is due tomorrow. */
async function child(parentId: string, b3: string, due = "now() + interval '1 day'") {
  const consent = await grantedConsent(db, parentId)
  await db.exec(`update public.parental_consents set second_email_provider_id = '${b3}', second_notice_scheduled_for = ${due} where id = '${consent}'`)
  const [{ token_hash: token }] = await q<{ token_hash: string }>(`select token_hash from public.parental_consents where id = '${consent}'`)
  const [{ id }] = await q<{ id: string }>(`insert into public.learners (display_name, avatar_index, age_group, created_by, consent_id)
    values ('Kid', 0, '6-8', '${parentId}', '${consent}') returning id`)
  await db.exec(`insert into public.learner_access (learner_id, parent_id, access_role) values ('${id}', '${parentId}', 'owner') on conflict do nothing`)
  return { id, consent, token }
}
async function asUser(uid: string, sql: string, jwt: Record<string, unknown> = {}) {
  await db.exec(`select set_config('test.uid', '${uid}', false), set_config('test.jwt', '${JSON.stringify(jwt)}', false)`)
  await db.exec('set role authenticated')
  try { await db.query(sql) } finally { await db.exec('reset role') }
}

const P = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const P2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

beforeAll(async () => {
  ({ db } = await loadSchema())
  await parent(P, 'p@x.test')
  await parent(P2, 'closer@x.test')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://sb.test')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service')
  vi.stubEnv('RESEND_API_KEY', 'resend')
  vi.stubEnv('RESEND_API_URL', 'http://resend.test')
  vi.stubGlobal('fetch', fakeFetch)
}, 120_000)
afterAll(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })
beforeEach(() => { resendCalls.length = 0; resendAnswer = () => ({ status: 200, body: { object: 'email' } }) })

describe('every path that ends a granted consent cancels its B3', () => {
  it('the email-link withdrawal', async () => {
    const kid = await child(P, 're_withdraw')
    expect((await q<{ s: string }>(`select public.consent_withdraw('${kid.token}') s`))[0].s).toBe('withdrawn')
    await drain()
    expect(resendCalls).toContain('re_withdraw')
    expect((await queued('re_withdraw'))?.cancel_result).toBe('cancelled')
  })

  it('"Delete <name>\'s profile" (delete_learner, as the owner)', async () => {
    const kid = await child(P, 're_delete')
    await asUser(P, `select public.delete_learner('${kid.id}')`)
    expect((await q(`select 1 from public.learners where id = '${kid.id}'`)).length, 'the child was not deleted').toBe(0)
    await drain()
    expect(resendCalls).toContain('re_delete')
    expect((await queued('re_delete'))?.cancel_result).toBe('cancelled')
  })

  it('"Close your account" — the consent row is GONE, and its B3 is still cancelled', async () => {
    const kid = await child(P2, 're_close')
    const count = `select count(*)::int n from public.parental_consents where id = '${kid.consent}'`
    expect((await q<{ n: number }>(count))[0].n, 'control: the consent row exists before').toBe(1)

    const now = Math.floor(Date.now() / 1000)
    await asUser(P2, `select public.delete_my_account('closer@x.test')`,
      { email: 'closer@x.test', iat: now, amr: [{ method: 'password', timestamp: now - 30 }] })
    expect((await q<{ n: number }>(count))[0].n, 'the cascade should have deleted the consent row — the id\'s only other home').toBe(0)

    await drain()
    expect(resendCalls).toContain('re_close')
    expect(await queued('re_close')).toEqual({ cancel_result: 'cancelled', queued_because: 'deleted' })
  })

  it('expiry is not a path: a granted consent cannot become expired, and the nightly sweep leaves it alone', async () => {
    // A granted consent whose request link is long past its window — the one a sweep COULD touch.
    const [{ id }] = await q<{ id: string }>(`insert into public.parental_consents
      (parent_id, method, state, notice_version, privacy_version, terms_version, email_address, confirmed_at,
       token_hash, expires_at, request_email_provider_id, request_email_sent_at, second_email_provider_id, second_notice_scheduled_for)
      values ('${P}', 'email_plus', 'granted', 'n', 'p', 't', 'p@x.test', now(), md5(random()::text), now() - interval '1 day',
              're_b1', now(), 're_stays', now() + interval '1 day') returning id`)
    await expect(q(`update public.parental_consents set state = 'expired' where id = '${id}'`)).rejects.toThrow(/cannot move from granted to expired/)
    // Control that the sweep is live: a pending one past its window IS expired by it.
    const [{ id: pend }] = await q<{ id: string }>(`insert into public.parental_consents
      (parent_id, method, state, notice_version, privacy_version, terms_version, email_address, token_hash, expires_at)
      values ('${P}', 'email_plus', 'pending', 'n', 'p', 't', 'p@x.test', md5(random()::text), now() - interval '1 day') returning id`)
    await q(`select public.consent_expire_stale()`)
    expect((await q<{ state: string }>(`select state from public.parental_consents where id = '${pend}'`))[0].state).toBe('expired')
    expect((await q<{ state: string }>(`select state from public.parental_consents where id = '${id}'`))[0].state).toBe('granted')
    // Positive twin of every test above: a consent that still stands keeps its B3.
    await drain()
    expect(resendCalls).not.toContain('re_stays')
    expect(await queued('re_stays')).toBeUndefined()
  })

  it('a B3 that has already gone out is not queued', async () => {
    const kid = await child(P, 're_sent', "now() - interval '1 hour'")
    await q(`select public.consent_withdraw('${kid.token}')`)
    expect(await queued('re_sent')).toBeUndefined()
  })
})

describe('the drain is idempotent and never blocks on Resend', () => {
  it('a second drain calls Resend for nothing already settled', async () => {
    await drain()
    expect(resendCalls).toEqual([])
  })

  it('Resend refusing (already cancelled or sent) is recorded, not thrown, and not retried', async () => {
    const kid = await child(P, 're_refused')
    resendAnswer = () => ({ status: 422, body: { name: 'invalid_parameter', message: 'Email cannot be canceled' } })
    await asUser(P, `select public.delete_learner('${kid.id}')`)
    await expect(drain()).resolves.toBeGreaterThan(0)
    expect((await queued('re_refused'))?.cancel_result).toBe('refused: 422 Email cannot be canceled')
    resendCalls.length = 0
    await drain()
    expect(resendCalls).not.toContain('re_refused')
  })

  it('Resend down: the deletion already happened, the failure is recorded, and the next drain retries', async () => {
    const kid = await child(P, 're_down')
    resendAnswer = () => ({ status: 503, body: { message: 'unavailable' } })
    await asUser(P, `select public.delete_learner('${kid.id}')`)
    await drain()
    expect((await queued('re_down'))?.cancel_result).toBe('error: 503 unavailable')
    resendAnswer = () => ({ status: 200, body: {} })
    await drain()
    expect((await queued('re_down'))?.cancel_result).toBe('cancelled')
  })

  it('a racing drain cannot overwrite "cancelled" with the refusal its duplicate cancel gets back', async () => {
    await q(`select public.consent_b3_record('re_down', 'refused: 422 already canceled')`)
    expect((await queued('re_down'))?.cancel_result).toBe('cancelled')
  })
})

describe('the queue is the server\'s alone', () => {
  it('anon and authenticated can neither read it nor call the drain functions; service_role can', async () => {
    for (const role of ['anon', 'authenticated']) {
      for (const sql of ['select * from public.consent_b3_cancellations', 'select * from public.consent_b3_due()', `select public.consent_b3_record('x', 'cancelled')`]) {
        await db.exec(`set role ${role}`)
        try { await expect(db.query(sql), `${role}: ${sql}`).rejects.toThrow(/permission denied/) } finally { await db.exec('reset role') }
      }
    }
    await db.exec('set role service_role')
    try { expect((await db.query('select * from public.consent_b3_due()')).rows).toBeDefined() } finally { await db.exec('reset role') }
  })
})

describe('before the migration exists, the drain reports that rather than failing', () => {
  it('returns null on PGRST202', async () => {
    await db.exec('alter function public.consent_b3_due() rename to consent_b3_due_hidden')
    try { expect(await drain()).toBeNull() } finally { await db.exec('alter function public.consent_b3_due_hidden() rename to consent_b3_due') }
  })
})
