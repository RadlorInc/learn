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
import { loadSchema, applyFrom, legacyChild, CONSENT_ONCE } from './_schema'

const PARENT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const STRANGER = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
const KIDLOGIN = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
let db: PGlite
let n = 0
const NOTICE = 'notice-v1'
const NO_ACCOUNT_CONSENT = 'no granted parental consent for this account — refusing to create a child'

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

/**
 * A fresh confirmed parent. Consent-once makes a parent's history matter — one current account consent at a
 * time, a new request expires the older pending ones — so each test gets its own, and the tests stay independent.
 */
async function newParent(): Promise<string> {
  const id = `aaaaaaaa-aaaa-4aaa-8aaa-${String(++n).padStart(12, '0')}`
  await db.exec(`insert into auth.users (id, email, email_confirmed_at) values ('${id}', 'p${n}@x.test', now());
    insert into public.profiles (id, role) values ('${id}', 'parent') on conflict (id) do update set role = excluded.role`)
  return id
}

/** The server's request step: the notice was shown, the parent ticked and pressed continue — for the ACCOUNT. */
async function request(ttl = '7 days', parent = PARENT, scope = 'account', notice = NOTICE) {
  const hash = `h-${++n}`
  const r = await svc(`select * from public.consent_request('${parent}', '${notice}', 'privacy#p1', 'terms#t1', 'en', '${hash}',
    interval '${ttl}', '${scope}', now() - interval '1 minute')`)
  const id = r.rows?.[0]?.consent_id as string
  // …and B1 accepted by Resend, which the server records before any link in it can be clicked.
  if (id) await svc(`select public.consent_record_request_sent('${id}', 're_b1_${n}')`)
  return { hash, id, r }
}
const grant = (hash: string, b3: string | null = "'re_b3'", at = "now() + interval '1 day'") =>
  svc(`select public.consent_grant('${hash}', ${b3}, ${b3 === null ? 'null' : at}) as s`)
/** The app's add-a-child insert: the account consent's id and the notice version the parent's tick attested. */
const createChild = (consent: string | null, parent = PARENT, attest: string | null = NOTICE) => svc(`insert into public.learners
  (display_name, avatar_index, age_group, created_by, consent_id, attested_notice_version)
  values ('Kid', 0, '6-8', '${parent}', ${consent ? `'${consent}'` : 'null'}, ${attest ? `'${attest}'` : 'null'}) returning id`)

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
    const P = await newParent()
    const { id } = await request('7 days', P)
    // Positive twin first: the parent's read works, so the refusals below are about WRITING.
    const mine = await as('authenticated', P, `select id::text from public.parental_consents where id = '${id}'`)
    expect(mine.rows).toHaveLength(1)
    expect((await as('authenticated', STRANGER, `select id from public.parental_consents where id = '${id}'`)).rows).toHaveLength(0)

    /**
     * ⚠️ THE SELF-GRANT. The first draft of the Phase 1 migration granted UPDATE here, scoped to the
     * parent's own row — and the gate decides on this row's `state`. This line is that hole, driven.
     */
    const selfGrant = await as('authenticated', P,
      `update public.parental_consents set state = 'granted', confirmed_at = now() where id = '${id}'`)
    expect(selfGrant.err ?? 'ALLOWED').toMatch(/permission denied for table parental_consents/)
    const selfInsert = await as('authenticated', P, `insert into public.parental_consents
      (parent_id, method, state, notice_version, privacy_version, terms_version, email_address, token_hash, expires_at, scope)
      values ('${P}', 'email_plus', 'pending', 'n', 'p', 't', 'x@x.test', 'self', now(), 'account')`)
    expect(selfInsert.err ?? 'ALLOWED').toMatch(/permission denied for table parental_consents/)
  })

  it('the transition functions are the server\'s alone', async () => {
    const P = await newParent()
    const { hash } = await request('7 days', P)
    for (const role of ['authenticated', 'anon'] as const) {
      const r = await as(role, P, `select public.consent_grant('${hash}', 're_x', now())`)
      expect(r.err ?? 'ALLOWED', `${role} could call consent_grant`).toMatch(/permission denied for function consent_grant/)
    }
    expect((await grant(hash)).rows![0].s, 'positive twin: the server can').toBe('granted')
    // …and a repeat click is told so, rather than looking like a fresh grant or a failure.
    expect((await grant(hash)).rows![0].s).toBe('already_granted')
  })

  it('withdrawing the whole account is the signed-in adult\'s own, and the internal step is nobody\'s', async () => {
    const P = await newParent()
    const { hash, id } = await request('7 days', P)
    await grant(hash)
    const kid = (await createChild(id, P)).rows![0].id as string
    expect((await as('anon', null, `select public.withdraw_my_consent()`)).err ?? 'ALLOWED').toMatch(/permission denied for function withdraw_my_consent/)
    for (const role of ['authenticated', 'service_role', 'anon'] as const)
      expect((await as(role, P, `select public.consent_withdraw_account('${P}')`)).err ?? 'ALLOWED', `${role} reached consent_withdraw_account`)
        .toMatch(/permission denied for function consent_withdraw_account/)
    // A STRANGER's call acts on the stranger only — P's child and consent are untouched…
    expect((await as('authenticated', STRANGER, `select public.withdraw_my_consent() as s`)).rows![0].s).toBe('withdrawn')
    expect(await one(`select count(*)::int as n from public.learners where id = '${kid}'`)).toEqual({ n: 1 })
    expect(await one(`select state from public.parental_consents where id = '${id}'`)).toEqual({ state: 'granted' })
    // …and P's own call is the positive twin: it works, and it acts on P.
    expect((await as('authenticated', P, `select public.withdraw_my_consent() as s`)).rows![0].s).toBe('withdrawn')
    expect(await one(`select count(*)::int as n from public.learners where id = '${kid}'`)).toEqual({ n: 0 })
    expect(await one(`select state from public.parental_consents where id = '${id}'`)).toEqual({ state: 'withdrawn' })
  })
})

describe('request', () => {
  it('stamps the versions the parent was shown, the ACCOUNT scope and the tick, and addresses the ACCOUNT\'s email', async () => {
    const P = await newParent()
    const { id, r } = await request('7 days', P)
    expect(r.rows![0].email).toBe(`p${n - 1}@x.test`)
    expect(await one(`select state, notice_version, privacy_version, terms_version, lang, email_address = '${r.rows![0].email}' as addr,
      scope, learner_id, parent_ack_at < requested_at as ack_before,
      expires_at > now() + interval '6 days 23 hours' as ttl_ok from public.parental_consents where id = '${id}'`))
      .toMatchObject({ state: 'pending', notice_version: NOTICE, privacy_version: 'privacy#p1',
        terms_version: 'terms#t1', lang: 'en', addr: true, scope: 'account', learner_id: null, ack_before: true, ttl_ok: true })
  })

  it('a child\'s own login cannot ask for consent, even with a parent role set on its profile', async () => {
    // The role is client-writable (setMyRole), so it is not what stops this — the address is.
    const r = await request('7 days', KIDLOGIN)
    expect(r.r.code).toBe('P0C03')
  })

  it('only ACCOUNT consent can be asked for, and only for a notice version the database knows', async () => {
    const P = await newParent()
    for (const [scope, notice] of [['child', NOTICE], ['account', 'notice-v999']]) {
      const r = await request('7 days', P, scope, notice)
      expect(r.r.code, `${scope}/${notice} was accepted`).toBe('P0C04')
    }
    expect(await one(`select count(*)::int as n from public.parental_consents where parent_id = '${P}'`)).toEqual({ n: 0 })
    // Positive twin: the same parent, account scope, a known notice.
    expect((await request('7 days', P)).id).toBeTruthy()
  })

  it('a new request expires the parent\'s older pending one, so only the newest email\'s link can grant', async () => {
    const P = await newParent()
    const first = await request('7 days', P)
    const second = await request('7 days', P)
    expect(await one(`select state from public.parental_consents where id = '${first.id}'`)).toEqual({ state: 'expired' })
    expect((await grant(first.hash)).rows![0].s).toBe('expired')
    expect((await grant(second.hash)).rows![0].s).toBe('granted')
  })
})

describe('grant', () => {
  it('a request made now is method "email" and grants with NO second email (one email, 2026-09-25)', async () => {
    const P = await newParent()
    const { hash, id } = await request('7 days', P)
    expect((await grant(hash, null)).rows![0].s).toBe('granted')
    expect(await one(`select method, state, second_email_provider_id from public.parental_consents where id = '${id}'`))
      .toEqual({ method: 'email', state: 'granted', second_email_provider_id: null })
  })

  it('an EMAIL-PLUS row is still refused without its second email — the old evidence keeps its rule', async () => {
    const P = await newParent()
    const hash = `ep-${++n}`
    await db.exec(`insert into public.parental_consents (parent_id, method, state, notice_version, privacy_version, terms_version,
      email_address, token_hash, expires_at, scope, request_email_provider_id)
      values ('${P}', 'email_plus', 'pending', '${NOTICE}', 'p', 't', 'x@x.test', '${hash}', now() + interval '7 days', 'account', 're_b1')`)
    const noB3 = await grant(hash, null)
    expect(noB3.err ?? 'ALLOWED').toContain('parental_consents_email_plus_second_notice')
    // …and the refusal left it pending, so a grant with its second email still succeeds (positive twin).
    expect(await one(`select state from public.parental_consents where token_hash = '${hash}'`)).toEqual({ state: 'pending' })
    expect((await grant(hash)).rows![0].s).toBe('granted')
  })

  it('at sign-up: a request for an UNCONFIRMED parent is made by the server alone, claims no on-screen tick, and a teacher gets none', async () => {
    const id = `bbbbbbbb-bbbb-4bbb-8bbb-${String(++n).padStart(12, '0')}`, teacher = `cccccccc-cccc-4ccc-8ccc-${String(++n).padStart(12, '0')}`
    await db.exec(`insert into auth.users (id, email, raw_user_meta_data) values
      ('${id}', 'signup${n}@x.test', '{"role":"parent"}'), ('${teacher}', 'teach${n}@x.test', '{"role":"teacher"}')`)
    const call = (who: string, h: string) => `select * from public.consent_request_at_signup('${who}', '${NOTICE}', 'p', 't', 'en', '${h}', interval '7 days')`
    const r = await svc(call(id, `su-${n}`))
    const c = r.rows?.[0]?.consent_id as string
    expect(await one(`select method, state, scope, parent_ack_at from public.parental_consents where id = '${c}'`))
      .toEqual({ method: 'email', state: 'pending', scope: 'account', parent_ack_at: null })
    expect((await svc(call(teacher, `su-t-${n}`))).err ?? 'ALLOWED').toMatch(/cannot request parental consent/)
    for (const role of ['authenticated', 'anon'] as const)
      expect((await as(role, id, call(id, `su-x-${n}`))).err ?? 'ALLOWED', `${role} could call it`).toMatch(/permission denied for function consent_request_at_signup/)
  })

  it('a child is refused before the grant and created after it — and one account consent covers several', async () => {
    const P = await newParent()
    const { hash, id } = await request('7 days', P)
    const before = await createChild(id, P)
    expect(before.err ?? 'ALLOWED').toContain(NO_ACCOUNT_CONSENT)

    await grant(hash)
    const after = await createChild(id, P)
    expect(after.err).toBeUndefined()
    // Consent-once (was: "one consent, one child", with the consent bound to it): the account consent names no
    // child, and a second child under it is created — each with its own attestation.
    expect(await one(`select learner_id from public.parental_consents where id = '${id}'`)).toEqual({ learner_id: null })
    const second = await createChild(id, P)
    expect(second.err).toBeUndefined()
    expect(await one(`select count(*)::int as n from public.learners where consent_id = '${id}' and attestation_method = 'checkbox'`)).toEqual({ n: 2 })
    // …and it is still THIS parent's: another parent cannot hang a child on it.
    const Q = await newParent()
    expect((await createChild(id, Q)).err ?? 'ALLOWED').toContain(NO_ACCOUNT_CONSENT)
  })

  it('a parent already holding a current account consent is told so; the new request is closed, not granted', async () => {
    const P = await newParent()
    const a = await request('7 days', P)
    expect((await grant(a.hash)).rows![0].s).toBe('granted')
    const b = await request('7 days', P)
    expect((await grant(b.hash)).rows![0].s).toBe('already_consented')
    expect(await one(`select state from public.parental_consents where id = '${b.id}'`)).toEqual({ state: 'expired' })
    expect(await one(`select state from public.parental_consents where id = '${a.id}'`)).toEqual({ state: 'granted' })
  })
})

describe('decline', () => {
  it('leaves a terminal row, no child, and cannot be turned into a grant afterwards', async () => {
    const P = await newParent()
    const { hash, id } = await request('7 days', P)
    expect((await svc(`select public.consent_decline('${hash}') as s`)).rows![0].s).toBe('declined')
    expect(await one(`select state, declined_at is not null as stamped from public.parental_consents where id = '${id}'`))
      .toEqual({ state: 'declined', stamped: true })
    expect(await one(`select count(*)::int as n from public.learners where consent_id = '${id}'`)).toEqual({ n: 0 })
    // A late click on the grant link finds nothing to grant.
    expect((await grant(hash)).rows![0].s).toBe('declined')
    expect((await createChild(id, P)).err ?? 'ALLOWED').toContain(NO_ACCOUNT_CONSENT)
  })
})

describe('withdraw', () => {
  it('an ACCOUNT link withdraws the account: every child of the parent deleted, every consent ended, another family untouched', async () => {
    const P = await newParent()
    const { hash, id } = await request('7 days', P)
    await grant(hash)
    const kids = [(await createChild(id, P)).rows![0].id as string, (await createChild(id, P)).rows![0].id as string]
    // Control: this write lands while consent stands.
    expect((await owner(`insert into public.lesson_progress (learner_id, lesson_id, done) values ('${kids[0]}', 'g3m1-t1', true)`)).err).toBeUndefined()
    // A pending request of the same parent — an old B1 still in the inbox — and a second family.
    const pend = await request('7 days', P)
    const Q = await newParent()
    const q = await request('7 days', Q)
    await grant(q.hash)
    const theirs = (await createChild(q.id, Q)).rows![0].id as string

    expect(await one(`select state from public.parental_consents where id = '${id}'`)).toEqual({ state: 'granted' })
    expect((await svc(`select public.consent_withdraw('${hash}') as s`)).rows![0].s).toBe('withdrawn')
    expect(await one(`select state, withdrawn_at is not null as stamped from public.parental_consents where id = '${id}'`))
      .toEqual({ state: 'withdrawn', stamped: true })
    expect(await one(`select count(*)::int as n from public.learners where created_by = '${P}'`)).toEqual({ n: 0 })
    // (read as the table owner: the server's role has no grant on lesson_progress, and this is a read-back)
    expect((await owner(`select count(*)::int as n from public.lesson_progress where learner_id in ('${kids.join("','")}')`)).rows![0]).toEqual({ n: 0 })
    // The old B1 cannot re-grant: the pending request was expired with the rest.
    expect((await grant(pend.hash)).rows![0].s).toBe('expired')
    // The other family: child, data and consent exactly as they were.
    expect(await one(`select count(*)::int as n from public.learners where id = '${theirs}'`)).toEqual({ n: 1 })
    expect(await one(`select state from public.parental_consents where id = '${q.id}'`)).toEqual({ state: 'granted' })
    expect((await owner(`insert into public.lesson_progress (learner_id, lesson_id, done) values ('${theirs}', 'g3m1-t1', true)`)).err).toBeUndefined()
    // Idempotent: a second click finds nothing granted.
    expect((await svc(`select public.consent_withdraw('${hash}') as s`)).rows![0].s).toBe('withdrawn')
    // And adding a child afterwards needs a fresh account consent.
    expect((await createChild(id, P)).err ?? 'ALLOWED').toContain(NO_ACCOUNT_CONSENT)
  })

  it('cannot be undone — a withdrawn consent never becomes granted again, by any role', async () => {
    const P = await newParent()
    const { hash, id } = await request('7 days', P)
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
    const P = await newParent()
    const { hash, id } = await request('-1 minute', P)
    expect((await grant(hash)).rows![0].s).toBe('expired')
    expect(await one(`select state from public.parental_consents where id = '${id}'`)).toEqual({ state: 'expired' })
  })

  it('an expired consent lets no child through — exactly like no consent at all', async () => {
    const P = await newParent()
    const { id } = await request('-1 minute', P)
    expect((await svc('select public.consent_expire_stale() as n')).rows![0].n).toBeGreaterThanOrEqual(1)
    expect(await one(`select state from public.parental_consents where id = '${id}'`)).toEqual({ state: 'expired' })
    const withExpired = await createChild(id, P)
    const withNone = await createChild(null, P)
    expect(withExpired.err ?? 'ALLOWED').toContain(NO_ACCOUNT_CONSENT)
    expect(withExpired.err, 'an expired consent must be refused the same way as no consent').toBe(withNone.err)
  })

  it('the sweep leaves a request that is still inside its window alone', async () => {
    const P = await newParent()
    const { id } = await request('7 days', P)
    await svc('select public.consent_expire_stale()')
    expect(await one(`select state from public.parental_consents where id = '${id}'`)).toEqual({ state: 'pending' })
  })
})

describe('what the parent saw stays what the parent saw', () => {
  it('no write, by any role, can change the versions, the scope or the tick on a consent after it is recorded', async () => {
    const P = await newParent()
    const { hash, id } = await request('7 days', P)
    await grant(hash)   // a grant must not refresh them either
    expect(await one(`select notice_version from public.parental_consents where id = '${id}'`)).toEqual({ notice_version: NOTICE })
    for (const set of [`notice_version = 'notice-v2'`, `scope = 'child'`, `parent_ack_at = now()`]) {
      const r = await db.query(`update public.parental_consents set ${set} where id = '${id}'`)
        .then(() => ({ code: undefined as string | undefined }), e => ({ code: (e as { code?: string }).code }))
      expect(r.code, `${set} was allowed`).toBe('P0C02')
    }
  })
})

/**
 * THE LEGACY LINK. A B3 sent before consent-once carries a PER-CHILD token. It must still withdraw — and delete —
 * exactly its own child, and nothing else of the parent's. Built the only faithful way: the schema before the
 * migration, two per-child children, then the migration itself.
 */
describe('withdraw — a per-child link from before consent-once', () => {
  let old: PGlite
  let a: { id: string; consent: string; token: string }, b: { id: string; consent: string; token: string }
  const run = async (sql: string) => (await old.query<Record<string, unknown>>(sql)).rows[0]
  beforeAll(async () => {
    ({ db: old } = await loadSchema({ before: CONSENT_ONCE }))
    await old.exec(`insert into auth.users (id, email, email_confirmed_at) values ('${PARENT}', 'parent@x.test', now())`)
    a = await legacyChild(old, PARENT, 'Legacy A')
    b = await legacyChild(old, PARENT, 'Legacy B')
    await applyFrom(old, CONSENT_ONCE)
  }, 120_000)

  it('deletes just its child and withdraws just its consent', async () => {
    await old.exec(`set role service_role`)
    try { expect((await run(`select public.consent_withdraw('${a.token}') as s`)).s).toBe('withdrawn') } finally { await old.exec('reset role') }
    expect(await run(`select count(*)::int as n from public.learners where id = '${a.id}'`)).toEqual({ n: 0 })
    expect(await run(`select state, learner_id from public.parental_consents where id = '${a.consent}'`)).toEqual({ state: 'withdrawn', learner_id: null })
    // The sibling, under its own per-child consent, is untouched and still accepts data.
    expect(await run(`select count(*)::int as n from public.learners where id = '${b.id}'`)).toEqual({ n: 1 })
    expect(await run(`select state from public.parental_consents where id = '${b.consent}'`)).toEqual({ state: 'granted' })
    await old.exec(`insert into public.lesson_progress (learner_id, lesson_id, done) values ('${b.id}', 'g3m1-t1', true)`)
  })
})
