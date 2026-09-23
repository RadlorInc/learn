// @vitest-environment node
/**
 * WITHDRAWAL DELETES, AND SO DOES "DELETE <NAME>'S PROFILE" — THE SAME SET, TABLE BY TABLE.
 *
 * ⚠️ THE TABLE LIST IS WRITTEN OUT HERE, FROM docs/legal/06 PART B3, BY HAND. Deriving it from the
 * catalog would assert that the schema equals itself. The catalog is used for the OTHER direction:
 * after a deletion, no table carrying `learner_id` may still hold the child — so a table added
 * later that does not cascade is caught even though nobody put it in the list.
 *
 * ⚠️ DOCUMENT 06's VERIFICATION RULE, LITERALLY: "complete when a fresh query for that child's
 * identifier returns nothing — and when that same query has been seen returning rows before". So
 * every table is counted BEFORE (each must be > 0) and AFTER (each must be 0) by the same query.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema, applyFile, applyFrom, legacyChild, grantedConsent, CONSENT_ONCE, FIXTURE_NOTICE } from './_schema'

const DOC06 = ['learners', 'learner_access', 'lesson_progress', 'point_events', 'learner_stats',
  'learner_events', 'lesson_feedback', 'game_settings', 'error_events'] as const

const PARENT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const LPARENT = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'   // a family whose children pre-date consent-once
const OTHER = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'     // a second family, the control
const KIDLOGIN = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const MIGRATION = '20260923140000_withdrawal_deletes.sql'
let db: PGlite

const q = async <T = Record<string, unknown>>(sql: string) => (await db.query<T>(sql)).rows
const as = async (uid: string, sql: string) => {
  await db.exec(`select set_config('test.uid', '${uid}', false)`)
  await db.exec('set role authenticated')
  try { await db.query(sql); return null } catch (e) { return (e as Error).message } finally { await db.exec('reset role') }
}

/** Each parent's ONE account consent (consent-once), made on first use. */
const accountConsent: Record<string, string> = {}
/** A child under their parent's account consent, with a row in every table document 06 names, and optionally a login. */
async function seedChild(name: string, withLogin = false, parent = PARENT, login = KIDLOGIN): Promise<{ id: string; consent: string; token: string }> {
  const consent = accountConsent[parent] ??= await grantedConsent(db, parent)
  const [{ token_hash: token }] = await q<{ token_hash: string }>(`select token_hash from public.parental_consents where id = '${consent}'`)
  const [{ id }] = await q<{ id: string }>(`insert into public.learners (display_name, avatar_index, age_group, created_by, consent_id, attested_notice_version)
    values ('${name}', 0, '6-8', '${parent}', '${consent}', '${FIXTURE_NOTICE}') returning id`)
  await seedRows(id, parent, withLogin ? login : null)
  return { id, consent, token }
}
/** A row for the child in every table document 06 names (the learner row itself already exists). */
async function seedRows(id: string, parent: string, login: string | null) {
  await db.exec(`
    insert into public.learner_access (learner_id, parent_id, access_role) values ('${id}', '${parent}', 'owner') on conflict do nothing;
    insert into public.lesson_progress (learner_id, lesson_id, done) values ('${id}', 'g3m1-t1', true);
    insert into public.point_events (learner_id, reason, points) values ('${id}', 'problem', 5);
    insert into public.learner_stats (learner_id) values ('${id}') on conflict do nothing;
    insert into public.learner_events (learner_id, event) values ('${id}', 'session_start');
    insert into public.lesson_feedback (learner_id, lesson_id, screen, reasons) values ('${id}', 'g3m1-t1', '2', array['picture']);
    insert into public.game_settings (learner_id) values ('${id}') on conflict do nothing;
    insert into public.error_events (source, message, learner_id) values ('client', 'boom', '${id}');`)
  if (login) await db.exec(`
    insert into auth.users (id, email, email_confirmed_at) values ('${login}', '${login}@learner.adaptivelearn.invalid', now());
    insert into public.learner_access (learner_id, parent_id, access_role) values ('${id}', '${login}', 'self');`)
}

const countsFor = async (learner: string) => Object.fromEntries(await Promise.all(DOC06.map(async t =>
  [t, Number((await q<{ n: number }>(`select count(*)::int n from public.${t} where ${t === 'learners' ? 'id' : 'learner_id'} = '${learner}'`))[0].n)])))

/** Every public table with a learner_id column, from the catalog — the net under the hand-written list. */
const everyLearnerTable = async () => (await q<{ t: string }>(`select c.relname t from pg_class c
  join pg_namespace n on n.oid = c.relnamespace join pg_attribute a on a.attrelid = c.oid
  where n.nspname = 'public' and c.relkind = 'r' and a.attname = 'learner_id' and not a.attisdropped
    and c.relname <> 'parental_consents'`)).map(r => r.t)

describe('crash records whose child is gone — three before the migration, none after', () => {
  it('clears the orphans and adds the key that stops new ones', async () => {
    const pre = (await loadSchema({ before: MIGRATION })).db
    // Orphans predate the consent gate on production, so they are planted as they were written then.
    await pre.exec(`set session_replication_role = replica;
      insert into public.error_events (source, message, learner_id) values
        ('client', 'a', gen_random_uuid()), ('client', 'b', gen_random_uuid()), ('server', 'c', gen_random_uuid()),
        ('client', 'not about a child', null);
      set session_replication_role = origin;`)
    const orphans = `select count(*)::int n from public.error_events e where e.learner_id is not null
      and not exists (select 1 from public.learners l where l.id = e.learner_id)`
    expect((await pre.query<{ n: number }>(orphans)).rows[0].n).toBe(3)
    await applyFile(pre, MIGRATION)
    expect((await pre.query<{ n: number }>(orphans)).rows[0].n).toBe(0)
    // Positive control: the row that was never about a child is still there.
    expect((await pre.query<{ n: number }>(`select count(*)::int n from public.error_events where learner_id is null`)).rows[0].n).toBe(1)
    const fk = (await pre.query<{ d: string }>(`select confdeltype::text d from pg_constraint
      where conname = 'error_events_learner_id_fkey'`)).rows
    expect(fk, 'error_events has no foreign key to learners').toEqual([{ d: 'c' }])
  }, 120_000)
})

describe('deleting a child deletes every row document 06 lists', () => {
  let legacyA: { id: string; consent: string; token: string }, legacyB: { id: string; consent: string; token: string }
  beforeAll(async () => {
    // The schema up to consent-once, a family whose two children each have their OWN per-child consent (the
    // pre-2026-09-24 shape, with every document-06 row), then the migration itself — the faithful legacy world.
    ({ db } = await loadSchema({ before: CONSENT_ONCE }))
    await db.exec(`insert into auth.users (id, email, email_confirmed_at) values
        ('${PARENT}', 'parent@x.test', now()), ('${LPARENT}', 'legacy@x.test', now()), ('${OTHER}', 'other@x.test', now());
      insert into public.profiles (id, role) values ('${PARENT}', 'parent'), ('${LPARENT}', 'parent'), ('${OTHER}', 'parent')
        on conflict (id) do update set role = excluded.role;`)
    legacyA = await legacyChild(db, LPARENT, 'Legacy A')
    await seedRows(legacyA.id, LPARENT, 'c1c1c1c1-cccc-4ccc-8ccc-cccccccccccc')
    legacyB = await legacyChild(db, LPARENT, 'Legacy B')
    await seedRows(legacyB.id, LPARENT, null)
    await applyFrom(db, CONSENT_ONCE)
  }, 120_000)

  it('withdrawal by an ACCOUNT link — every child of the parent: rows before in every table, none after; the consent kept as withdrawn', async () => {
    const kid = await seedChild('Withdrawn', true)
    const sibling = await seedChild('Sibling')
    const other = await seedChild('Other family', false, OTHER)
    for (const k of [kid, sibling]) {
      const before = await countsFor(k.id)
      for (const t of DOC06)
        expect(before[t], `${t} had no row for the child BEFORE — a zero after would prove nothing`).toBeGreaterThan(0)
    }

    const [{ s }] = await q<{ s: string }>(`select public.consent_withdraw('${kid.token}') as s`)
    expect(s).toBe('withdrawn')

    // Consent-once (was: "only that child"): an account withdrawal ends the permission for EVERY child it covered.
    for (const k of [kid, sibling]) {
      expect(await countsFor(k.id)).toEqual(Object.fromEntries(DOC06.map(t => [t, 0])))
      for (const t of await everyLearnerTable())
        expect(Number((await q<{ n: number }>(`select count(*)::int n from public.${t} where learner_id = '${k.id}'`))[0].n), `${t} still holds the child`).toBe(0)
    }
    expect(await q(`select 1 from auth.users where id = '${KIDLOGIN}'`), "the child's own login survived").toEqual([])

    const [rec] = await q<{ state: string; learner_id: string | null; withdrawn_at: string | null }>(
      `select state, learner_id, withdrawn_at from public.parental_consents where id = '${kid.consent}'`)
    expect(rec, 'the consent record — the evidence — was deleted with the children').toBeDefined()
    expect(rec.state).toBe('withdrawn')
    expect(rec.learner_id).toBeNull()
    expect(rec.withdrawn_at).not.toBeNull()

    // The other family is untouched.
    expect(Object.values(await countsFor(other.id)).every(n => Number(n) > 0)).toBe(true)
  })

  it('withdrawal by a per-child link from before consent-once — just that child; the sibling untouched', async () => {
    const before = await countsFor(legacyA.id)
    for (const t of DOC06) expect(before[t], `${t} had no row for the legacy child BEFORE`).toBeGreaterThan(0)
    const [{ s }] = await q<{ s: string }>(`select public.consent_withdraw('${legacyA.token}') as s`)
    expect(s).toBe('withdrawn')
    expect(await countsFor(legacyA.id)).toEqual(Object.fromEntries(DOC06.map(t => [t, 0])))
    expect(await q(`select 1 from auth.users where id = 'c1c1c1c1-cccc-4ccc-8ccc-cccccccccccc'`), "the child's own login survived").toEqual([])
    expect((await q<{ state: string }>(`select state from public.parental_consents where id = '${legacyA.consent}'`))[0].state).toBe('withdrawn')
    // Only that child: the sibling on the same account, under its own per-child consent, is untouched.
    expect(Object.values(await countsFor(legacyB.id)).every(n => Number(n) > 0)).toBe(true)
    expect((await q<{ state: string }>(`select state from public.parental_consents where id = '${legacyB.consent}'`))[0].state).toBe('granted')
  })

  it('"Delete <name>\'s profile" on a pre-consent-once child — the same set, and ITS consent ended so it cannot be reused', async () => {
    const before = await countsFor(legacyB.id)
    for (const t of DOC06) expect(before[t]).toBeGreaterThan(0)
    expect(await as(LPARENT, `select public.delete_learner('${legacyB.id}')`)).toBeNull()
    expect(await countsFor(legacyB.id)).toEqual(Object.fromEntries(DOC06.map(t => [t, 0])))
    const [rec] = await q<{ state: string }>(`select state from public.parental_consents where id = '${legacyB.consent}'`)
    expect(rec.state, 'a granted per-child consent left with no child looks unused').toBe('withdrawn')
  })

  it('"Delete <name>\'s profile" under an ACCOUNT consent — the same set; the permission stands for the other children', async () => {
    const kid = await seedChild('Removed', false, OTHER)
    const before = await countsFor(kid.id)
    for (const t of DOC06.filter(t => t !== 'learner_access' || before[t] > 0)) expect(before[t]).toBeGreaterThan(0)

    expect(await as(OTHER, `select public.delete_learner('${kid.id}')`)).toBeNull()

    expect(await countsFor(kid.id)).toEqual(Object.fromEntries(DOC06.map(t => [t, 0])))
    const [rec] = await q<{ state: string; learner_id: string | null }>(`select state, learner_id from public.parental_consents where id = '${kid.consent}'`)
    // LOOP-STATE C0 "Delete one child: unchanged … The account consent and its B3 continue".
    expect(rec).toEqual({ state: 'granted', learner_id: null })
    const next = await seedChild('Next', false, OTHER)
    expect((await countsFor(next.id)).learners).toBe(1)
  })

  it('only the owner may delete, and the refusal is the ownership check', async () => {
    const kid = await seedChild('Kept', false, OTHER)
    const STRANGER = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
    await db.exec(`insert into auth.users (id, email) values ('${STRANGER}', 's@x.test') on conflict do nothing`)
    expect(await as(STRANGER, `select public.delete_learner('${kid.id}')`)).toMatch(/not_owner/)
    expect((await countsFor(kid.id)).learners).toBe(1)
  })
})
