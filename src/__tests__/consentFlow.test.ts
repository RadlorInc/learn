// @vitest-environment node
/**
 * EMAIL-PLUS, THE DATABASE HALF — every transition driven through the functions the server calls,
 * as the role the server calls them with, in the repo's real schema.
 *
 * ⚠️ EACH ASSERTION IS ANCHORED ON THE MECHANISM IT NAMES, NOT ON "SOMETHING REFUSED". Phase 1's
 * proof ① passed with its own gate removed, because a different trigger caught the insert one step
 * later; a check that cannot tell which layer held will report success while the layer it describes
 * is gone. So a refusal here is matched on its own constraint name, SQLSTATE or message, and every
 * `npm run break` against this file removes one layer and must turn exactly its own test red.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema } from './_schema'

const PARENT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const STRANGER = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
const KIDLOGIN = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
let db: PGlite
let n = 0

type R = { rows?: Record<string, unknown>[]; err?: string; code?: string }
async function as(role: 'service_role' | 'authenticated' | 'anon', uid: string | null, sql: string): Promise<R> {
  await db.exec(`select set_config('test.uid', '${uid ?? ''}', false)`)
  await db.exec(`set role ${role}`)
  try { return { rows: (await db.query<Record<string, unknown>>(sql)).rows } }
  catch (e) { const x = e as { message: string; code?: string }; return { err: x.message, code: x.code } }
  finally { await db.exec('reset role') }
}
const svc = (sql: string) => as('service_role', null, sql)
const one = async (sql: string) => (await svc(sql)).rows![0]
/** As the table owner — the privilege `record_lesson_progress` and the other DEFINER writers run with,
 *  and the path RLS never sees. That is where the gate has to hold. */
const owner = (sql: string): Promise<R> => db.query<Record<string, unknown>>(sql)
  .then(r => ({ rows: r.rows }), e => ({ err: (e as Error).message, code: (e as { code?: string }).code }))

/** The server's request step: the notice was shown, the parent pressed continue. */
async function request(ttl = '7 days', parent = PARENT) {
  const hash = `h-${++n}`
  const r = await svc(`select * from public.consent_request('${parent}', 'notice-v1', 'privacy#p1', 'terms#t1', 'en', '${hash}', interval '${ttl}')`)
  const id = r.rows?.[0]?.consent_id as string
  // …and B1 accepted by Resend, which the server records before any link in it can be clicked.
  if (id) await svc(`select public.consent_record_request_sent('${id}', 're_b1_${n}')`)
  return { hash, id, r }
}
const grant = (hash: string, b3: string | null = "'re_b3'", at = "now() + interval '1 day'") =>
  svc(`select public.consent_grant('${hash}', ${b3}, ${b3 === null ? 'null' : at}) as s`)
const createChild = (consent: string | null) => svc(`insert into public.learners
  (display_name, avatar_index, age_group, created_by, consent_id)
  values ('Kid', 0, '6-8', '${PARENT}', ${consent ? `'${consent}'` : 'null'}) returning id`)

beforeAll(async () => {
  ({ db } = await loadSchema())
  await db.exec(`insert into auth.users (id, email, email_confirmed_at) values
    ('${PARENT}', 'parent@x.test', now()), ('${STRANGER}', 'other@x.test', now()),
    ('${KIDLOGIN}', 'kid@learner.adaptivelearn.invalid', now())`)
  await db.exec(`insert into public.profiles (id, role) values
      ('${PARENT}', 'parent'), ('${STRANGER}', 'parent'), ('${KIDLOGIN}', 'parent')
    on conflict (id) do update set role = excluded.role`)
}, 120_000)

describe('the consent record cannot be written from a browser', () => {
  it('a parent can read their own consent and cannot write any consent at all', async () => {
    const { id } = await request()
    // Positive twin first: the parent's read works, so the refusals below are about WRITING.
    const mine = await as('authenticated', PARENT, `select id::text from public.parental_consents where id = '${id}'`)
    expect(mine.rows).toHaveLength(1)
    expect((await as('authenticated', STRANGER, `select id from public.parental_consents where id = '${id}'`)).rows).toHaveLength(0)

    /**
     * ⚠️ THE SELF-GRANT. The first draft of the Phase 1 migration granted UPDATE here, scoped to the
     * parent's own row — and the gate decides on this row's `state`. This line is that hole, driven.
     */
    const selfGrant = await as('authenticated', PARENT,
      `update public.parental_consents set state = 'granted', confirmed_at = now() where id = '${id}'`)
    expect(selfGrant.err ?? 'ALLOWED').toMatch(/permission denied for table parental_consents/)
    const selfInsert = await as('authenticated', PARENT, `insert into public.parental_consents
      (parent_id, method, state, notice_version, privacy_version, terms_version, email_address, token_hash, expires_at)
      values ('${PARENT}', 'email_plus', 'pending', 'n', 'p', 't', 'x@x.test', 'self', now())`)
    expect(selfInsert.err ?? 'ALLOWED').toMatch(/permission denied for table parental_consents/)
  })

  it('the transition functions are the server\'s alone', async () => {
    const { hash } = await request()
    for (const role of ['authenticated', 'anon'] as const) {
      const r = await as(role, PARENT, `select public.consent_grant('${hash}', 're_x', now())`)
      expect(r.err ?? 'ALLOWED', `${role} could call consent_grant`).toMatch(/permission denied for function consent_grant/)
    }
    expect((await grant(hash)).rows![0].s, 'positive twin: the server can').toBe('granted')
    // …and a repeat click is told so, rather than looking like a fresh grant or a failure.
    expect((await grant(hash)).rows![0].s).toBe('already_granted')
  })
})

describe('request', () => {
  it('stamps the versions the parent was shown and addresses the ACCOUNT\'s email, not a supplied one', async () => {
    const { id, r } = await request()
    expect(r.rows![0].email).toBe('parent@x.test')
    expect(await one(`select state, notice_version, privacy_version, terms_version, lang, email_address,
      expires_at > now() + interval '6 days 23 hours' as ttl_ok from public.parental_consents where id = '${id}'`))
      .toMatchObject({ state: 'pending', notice_version: 'notice-v1', privacy_version: 'privacy#p1',
        terms_version: 'terms#t1', lang: 'en', email_address: 'parent@x.test', ttl_ok: true })
  })

  it('a child\'s own login cannot ask for consent, even with a parent role set on its profile', async () => {
    // The role is client-writable (setMyRole), so it is not what stops this — the address is.
    const r = await request('7 days', KIDLOGIN)
    expect(r.r.code).toBe('P0C03')
  })
})

describe('grant', () => {
  it('is refused unless the second email has been scheduled — B3 is a precondition, not a follow-up', async () => {
    const { hash } = await request()
    const noB3 = await grant(hash, null)
    expect(noB3.err ?? 'ALLOWED').toContain('parental_consents_email_plus_second_notice')
    // …and the refusal left it pending, so the parent's next click can still succeed.
    expect(await one(`select state from public.parental_consents where token_hash = '${hash}'`)).toEqual({ state: 'pending' })
    expect((await grant(hash)).rows![0].s).toBe('granted')
  })

  it('a child is refused before the grant and created after it — once', async () => {
    const { hash, id } = await request()
    const before = await createChild(id)
    expect(before.err ?? 'ALLOWED').toContain('refusing to create them')

    await grant(hash)
    const after = await createChild(id)
    expect(after.err).toBeUndefined()
    expect(await one(`select learner_id::text from public.parental_consents where id = '${id}'`))
      .toEqual({ learner_id: after.rows![0].id })

    // One consent, one child. Anchored on the gate's own words: the unique index behind it would
    // also refuse, with a different message, and must not be what this test is measuring.
    const second = await createChild(id)
    expect(second.err ?? 'ALLOWED').toContain('refusing to create them')
  })
})

describe('decline', () => {
  it('leaves a terminal row, no child, and cannot be turned into a grant afterwards', async () => {
    const { hash, id } = await request()
    expect((await svc(`select public.consent_decline('${hash}') as s`)).rows![0].s).toBe('declined')
    expect(await one(`select state, declined_at is not null as stamped from public.parental_consents where id = '${id}'`))
      .toEqual({ state: 'declined', stamped: true })
    expect(await one(`select count(*)::int as n from public.learners where consent_id = '${id}'`)).toEqual({ n: 0 })
    // A late click on the grant link finds nothing to grant.
    expect((await grant(hash)).rows![0].s).toBe('declined')
    expect((await createChild(id)).err ?? 'ALLOWED').toContain('refusing to create them')
  })
})

describe('withdraw', () => {
  it('moves granted to withdrawn and every later write for the child is refused', async () => {
    const { hash, id } = await request()
    await grant(hash)
    const kid = (await createChild(id)).rows![0].id as string
    // Control: this write lands while consent stands.
    expect((await owner(`insert into public.lesson_progress (learner_id, lesson_id, done) values ('${kid}', 'g3m1-t1', true)`)).err).toBeUndefined()

    expect(await one(`select state from public.parental_consents where id = '${id}'`)).toEqual({ state: 'granted' })
    expect((await svc(`select public.consent_withdraw('${hash}') as s`)).rows![0].s).toBe('withdrawn')
    expect(await one(`select state, withdrawn_at is not null as stamped from public.parental_consents where id = '${id}'`))
      .toEqual({ state: 'withdrawn', stamped: true })

    const w = await owner(`insert into public.lesson_progress (learner_id, lesson_id, done) values ('${kid}', 'g3m1-t2', true)`)
    expect(w.code).toBe('P0C01')
  })

  it('cannot be undone — a withdrawn consent never becomes granted again, by any role', async () => {
    const { hash, id } = await request()
    await grant(hash)
    await svc(`select public.consent_withdraw('${hash}')`)
    // As the table OWNER, the most privileged writer there is: the state machine is in a trigger.
    const r = await db.query(`update public.parental_consents set state = 'granted' where id = '${id}'`)
      .then(() => ({ code: undefined as string | undefined }), e => ({ code: (e as { code?: string }).code }))
    expect(r.code).toBe('P0C02')
  })
})

describe('expiry — a pending request nobody answers', () => {
  it('a link clicked after the window is refused, and the row is marked expired then and there', async () => {
    const { hash, id } = await request('-1 minute')
    expect((await grant(hash)).rows![0].s).toBe('expired')
    expect(await one(`select state from public.parental_consents where id = '${id}'`)).toEqual({ state: 'expired' })
  })

  it('an expired consent lets no child through — exactly like no consent at all', async () => {
    const { id } = await request('-1 minute')
    expect((await svc('select public.consent_expire_stale() as n')).rows![0].n).toBeGreaterThanOrEqual(1)
    expect(await one(`select state from public.parental_consents where id = '${id}'`)).toEqual({ state: 'expired' })
    const withExpired = await createChild(id)
    const withNone = await createChild(null)
    expect(withExpired.err ?? 'ALLOWED').toContain('refusing to create them')
    expect(withExpired.err, 'an expired consent must be refused the same way as no consent').toBe(withNone.err)
  })

  it('the sweep leaves a request that is still inside its window alone', async () => {
    const { id } = await request('7 days')
    await svc('select public.consent_expire_stale()')
    expect(await one(`select state from public.parental_consents where id = '${id}'`)).toEqual({ state: 'pending' })
  })
})

describe('what the parent saw stays what the parent saw', () => {
  it('no write, by any role, can change the versions on a consent after it is recorded', async () => {
    const { hash, id } = await request()
    await grant(hash)   // a grant must not refresh them either
    expect(await one(`select notice_version from public.parental_consents where id = '${id}'`)).toEqual({ notice_version: 'notice-v1' })
    const r = await db.query(`update public.parental_consents set notice_version = 'notice-v2' where id = '${id}'`)
      .then(() => ({ code: undefined as string | undefined }), e => ({ code: (e as { code?: string }).code }))
    expect(r.code).toBe('P0C02')
  })
})
