// @vitest-environment node
/**
 * The free trial (20261001120000, reshaped by 20261001140000): the PARENT picks two topics — two lessons of one module,
 * or two KG–2 story chapters — once; opening a topic never picks one.
 *
 * Built on the real schema (baseline + every migration) in PGlite, with the paywall ON, as the owner, as the child's
 * own login and as a stranger. Checked: the choice rules and that it is final; a child's login cannot choose; opening
 * a topic claims nothing; only the chosen topics open, for every child of the family; trial_topics is what the child's
 * home shows; a seated child plays anything and has no trial; with the paywall OFF everything opens.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema, grantedConsent, FIXTURE_NOTICE } from './_schema'

const OWNER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const CHILD = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'     // kid1's own login (access_role 'self')
const STRANGER = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
let db: PGlite
let kid1: string, kid2: string, paidKid: string

async function as(uid: string | null, sql: string): Promise<{ v?: unknown; code?: string }> {
  await db.exec(`select set_config('test.uid', '${uid ?? ''}', false)`)
  await db.exec(`set role ${uid ? 'authenticated' : 'service_role'}`)
  try { return { v: (await db.query<{ v: unknown }>(sql)).rows[0]?.v } }
  catch (e) { return { code: (e as { code?: string }).code ?? (e as Error).message } }
  finally { await db.exec('reset role') }
}
const open = (uid: string | null, learner: string, topic: string) => as(uid, `select public.claim_topic('${learner}', '${topic}') as v`)
const choose = (uid: string, topics: string[]) => as(uid, `select public.choose_free_topics(array[${topics.map(t => `'${t}'`).join(',')}]::text[]) as v`)
const trial = (uid: string, learner: string) => as(uid, `select public.trial_topics('${learner}') as v`)
const chosen = async () => (await db.query<{ topic: string }>(`select topic from public.free_topics where account_id = '${OWNER}' order by topic`)).rows.map(r => r.topic)
const enforce = (on: boolean) => db.exec(`update public.billing_config set enforced = ${on}`)

beforeAll(async () => {
  ({ db } = await loadSchema())
  await db.exec(`insert into auth.users (id, email, email_confirmed_at) values
    ('${OWNER}', 'o@x.test', now()), ('${CHILD}', 'kid@x.test', now()), ('${STRANGER}', 's@x.test', now())`)
  const consent = await grantedConsent(db, OWNER)
  const kid = async (name: string) => (await db.query<{ id: string }>(`insert into public.learners (display_name, avatar_index, age_group, created_by, consent_id, attested_notice_version)
    values ('${name}', 0, '6-8', '${OWNER}', '${consent}', '${FIXTURE_NOTICE}') returning id`)).rows[0].id
  kid1 = await kid('One'); kid2 = await kid('Two'); paidKid = await kid('Paid')
  await db.exec(`insert into public.learner_access (learner_id, parent_id, access_role) values
    ('${kid1}', '${OWNER}', 'owner'), ('${kid2}', '${OWNER}', 'owner'), ('${paidKid}', '${OWNER}', 'owner'), ('${kid1}', '${CHILD}', 'self')
    on conflict do nothing`)
  const sub = (await db.query<{ id: string }>(`insert into public.subscriptions (account_id, status, seats_paid) values ('${OWNER}', 'active', 1) returning id`)).rows[0].id
  await db.exec(`insert into public.subscription_seats (subscription_id, seat_index, learner_id) values ('${sub}', 1, '${paidKid}')`)
}, 120_000)

describe('paywall OFF (today)', () => {
  it('opens every topic, and the child has no trial (null)', async () => {
    await enforce(false)
    expect(await open(OWNER, kid1, 'g3m1-t1')).toEqual({ v: true })
    expect(await trial(OWNER, kid1)).toEqual({ v: null })
  })
})

describe('paywall ON: the parent picks two, once', () => {
  beforeAll(() => enforce(true))

  it('before the parent chooses: nothing opens and the child home is empty', async () => {
    expect(await open(CHILD, kid1, 'g3m1-t1')).toEqual({ v: false })
    expect(await trial(CHILD, kid1)).toEqual({ v: [] })
    expect(await chosen()).toEqual([])   // opening a topic never chooses one
  })
  it('a seated child plays anything and has no trial', async () => {
    expect(await open(OWNER, paidKid, 'g8m4-t1')).toEqual({ v: true })
    expect(await open(OWNER, paidKid, 'g3m1')).toEqual({ v: true })
    expect(await trial(OWNER, paidKid)).toEqual({ v: null })
  })
  it('refuses: two modules, a lesson and a chapter, three topics, a duplicate, an unknown id', async () => {
    for (const bad of [['g3m1-t1', 'g4m2-t1'], ['g3m1-t1', 'c:counting'], ['g3m1-t1', 'g3m1-t2', 'g3m1-t3'], ['g3m1-t1', 'g3m1-t1'], ['nope']]) {
      expect(await choose(OWNER, bad), bad.join(' + ')).toEqual({ code: 'P0F01' })
    }
    expect(await chosen()).toEqual([])
  })
  it('a child\'s own login cannot choose for the family', async () => {
    expect(await choose(CHILD, ['g3m1-t1', 'g3m1-t2'])).toEqual({ code: '42501' })
  })
  it('two topics of one module are accepted', async () => {
    expect(await choose(OWNER, ['g3m5-t1', 'g3m5-t2'])).toEqual({ v: ['g3m5-t1', 'g3m5-t2'] })
    expect(await chosen()).toEqual(['g3m5-t1', 'g3m5-t2'])
  })
  it('and the choice is final', async () => {
    expect(await choose(OWNER, ['c:counting', 'c:shapes'])).toEqual({ code: 'P0F01' })
    expect(await chosen()).toEqual(['g3m5-t1', 'g3m5-t2'])
  })
  it('the chosen two open, for every child of the family; nothing else does', async () => {
    expect(await open(CHILD, kid1, 'g3m5-t1')).toEqual({ v: true })
    expect(await open(OWNER, kid2, 'g3m5-t2')).toEqual({ v: true })
    expect(await open(OWNER, kid1, 'g3m5-t3')).toEqual({ v: false })
    expect(await open(OWNER, kid2, 'c:counting')).toEqual({ v: false })
    expect(await open(OWNER, kid1, 'g3m5')).toEqual({ v: false })   // mixed practice: paid only
  })
  it('the child home shows exactly the two', async () => {
    expect(await trial(CHILD, kid1)).toEqual({ v: ['g3m5-t1', 'g3m5-t2'] })
  })
  it('a stranger is refused (42501)', async () => {
    expect(await open(STRANGER, kid1, 'g3m5-t1')).toEqual({ code: '42501' })
    expect(await trial(STRANGER, kid1)).toEqual({ code: '42501' })
  })
  it('a client cannot write free_topics directly; the owner reads their own two', async () => {
    expect((await as(OWNER, `insert into public.free_topics (account_id, topic) values ('${OWNER}', 'g3m1-t4') returning 1 as v`)).code).toBe('42501')
    expect(await as(OWNER, `select count(*)::int as v from public.free_topics`)).toEqual({ v: 2 })
    expect(await as(STRANGER, `select count(*)::int as v from public.free_topics`)).toEqual({ v: 0 })
  })
})

describe('KG–2: any two story chapters', () => {
  it('are accepted for a family that has not chosen', async () => {
    await db.exec(`delete from public.free_topics where account_id = '${OWNER}'`)
    expect(await choose(OWNER, ['c:counting', 'c:money'])).toEqual({ v: ['c:counting', 'c:money'] })
    expect(await as(OWNER, `select public.is_chapter_entitled('${kid1}', 'counting') as v`)).toEqual({ v: true })
    expect(await as(OWNER, `select public.is_chapter_entitled('${kid1}', 'shapes') as v`)).toEqual({ v: false })
  })
})

describe('a purchase seats the family\'s children (20261001150000)', () => {
  it('a new empty seat is filled with the oldest unseated child, who then has no trial', async () => {
    expect(await trial(OWNER, kid1)).not.toEqual({ v: null })        // on the trial before
    const sub = (await db.query<{ id: string }>(`select id from public.subscriptions where account_id = '${OWNER}'`)).rows[0].id
    await db.exec(`insert into public.subscription_seats (subscription_id, seat_index) values ('${sub}', 2)`)   // as materialize_seats does
    const seated = (await db.query<{ n: string }>(`select l.display_name as n from public.subscription_seats st join public.learners l on l.id = st.learner_id where st.seat_index = 2`)).rows
    expect(seated).toEqual([{ n: 'One' }])                               // kid1 was added first
    expect(await trial(OWNER, kid1)).toEqual({ v: null })
    expect(await open(OWNER, kid1, 'g5m1-t1')).toEqual({ v: true })
    expect(await trial(OWNER, kid2)).not.toEqual({ v: null })            // no seat left for kid2
  })
  it('a child added later takes an empty seat', async () => {
    const sub = (await db.query<{ id: string }>(`select id from public.subscriptions where account_id = '${OWNER}'`)).rows[0].id
    await db.exec(`insert into public.subscription_seats (subscription_id, seat_index) values ('${sub}', 3)`)   // kid2 takes it
    await db.exec(`insert into public.subscription_seats (subscription_id, seat_index) values ('${sub}', 4)`)   // nobody left: stays empty
    const consent = (await db.query<{ c: string }>(`select consent_id as c from public.learners where id = '${kid1}'`)).rows[0].c
    const late = (await db.query<{ id: string }>(`insert into public.learners (display_name, avatar_index, age_group, created_by, consent_id, attested_notice_version)
      values ('Late', 0, '6-8', '${OWNER}', '${consent}', '${FIXTURE_NOTICE}') returning id`)).rows[0].id
    expect((await db.query(`select 1 from public.subscription_seats where learner_id = '${late}' and seat_index = 4`)).rows.length).toBe(1)
  })
})
