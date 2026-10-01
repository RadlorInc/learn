// @vitest-environment node
/**
 * The free trial (20261001120000): a family gets ANY two topics — lessons or KG–2 chapters — then pays.
 *
 * Built on the real schema (baseline + every migration) in PGlite, with the paywall ON, as the owner and as the
 * child's own login. Checked: two different children of one family share the two; a claimed topic re-opens free;
 * the third is refused; a claimed chapter entitles in is_chapter_entitled; a seated child never uses a slot; a
 * stranger is refused; with the paywall OFF everything opens and nothing is recorded.
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
const claim = (uid: string | null, learner: string, topic: string) => as(uid, `select public.claim_topic('${learner}', '${topic}') as v`)
const used = async () => Number((await db.query<{ n: number }>(`select count(*)::int as n from public.free_topics where account_id = '${OWNER}'`)).rows[0].n)
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
  it('opens every topic and records nothing', async () => {
    await enforce(false)
    for (const t of ['g3m1-t1', 'g3m1-t2', 'g3m1-t3']) expect(await claim(OWNER, kid1, t)).toEqual({ v: true })
    expect(await used()).toBe(0)
  })
})

describe('paywall ON: two per family', () => {
  beforeAll(() => enforce(true))

  it('a seated child plays anything and uses no slot', async () => {
    expect(await claim(OWNER, paidKid, 'g8m4-t1')).toEqual({ v: true })
    expect(await used()).toBe(0)
  })
  it('first topic, from the child\'s own login', async () => {
    expect(await claim(CHILD, kid1, 'g3m5-t1')).toEqual({ v: true })
    expect(await used()).toBe(1)
  })
  it('second topic, a KG–2 chapter, from a SIBLING — same family pool', async () => {
    expect(await claim(OWNER, kid2, 'c:counting')).toEqual({ v: true })
    expect(await used()).toBe(2)
  })
  it('the third is refused, for either child', async () => {
    expect(await claim(OWNER, kid1, 'g3m5-t2')).toEqual({ v: false })
    expect(await claim(OWNER, kid2, 'c:shapes')).toEqual({ v: false })
    expect(await used()).toBe(2)
  })
  it('a claimed topic re-opens free, for every child of the family', async () => {
    expect(await claim(OWNER, kid2, 'g3m5-t1')).toEqual({ v: true })
    expect(await claim(CHILD, kid1, 'c:counting')).toEqual({ v: true })
  })
  it('is_chapter_entitled follows the claims', async () => {
    expect(await as(OWNER, `select public.is_chapter_entitled('${kid1}', 'counting') as v`)).toEqual({ v: true })
    expect(await as(OWNER, `select public.is_chapter_entitled('${kid1}', 'shapes') as v`)).toEqual({ v: false })
  })
  it('a stranger is refused (42501) and claims nothing', async () => {
    expect(await claim(STRANGER, kid1, 'g3m1-t1')).toEqual({ code: '42501' })
  })
  it('a module\'s mixed practice is paid only: refused without a seat, open with one, never a free slot', async () => {
    await db.exec(`delete from public.free_topics where account_id = '${OWNER}' and topic = 'g3m5-t1'`)   // a slot free again
    expect(await claim(OWNER, kid1, 'g3m1')).toEqual({ v: false })
    expect(await claim(OWNER, paidKid, 'g3m1')).toEqual({ v: true })
    expect(await used()).toBe(1)
    await db.exec(`insert into public.free_topics (account_id, topic) values ('${OWNER}', 'g3m5-t1')`)
  })
  it('an id the app does not have is refused', async () => {
    expect(await claim(OWNER, kid1, 'nope')).toEqual({ code: 'P0L01' })
  })
  it('a client cannot write free_topics directly', async () => {
    expect((await as(OWNER, `insert into public.free_topics (account_id, topic) values ('${OWNER}', 'g3m1-t4') returning 1 as v`)).code).toBe('42501')
    expect((await as(OWNER, `delete from public.free_topics returning 1 as v`)).code).toBe('42501')
  })
  it('the owner reads their own two', async () => {
    expect(await as(OWNER, `select count(*)::int as v from public.free_topics`)).toEqual({ v: 2 })
    expect(await as(STRANGER, `select count(*)::int as v from public.free_topics`)).toEqual({ v: 0 })
  })
})
