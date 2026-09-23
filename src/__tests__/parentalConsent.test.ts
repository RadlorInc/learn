// @vitest-environment node
/**
 * VERIFIABLE PARENTAL CONSENT — the gate, driven in the repo's real schema.
 *
 * ⚠️ WHAT MAKES THIS A PROOF RATHER THAN A DESCRIPTION. Every refusal below is paired with the
 * write that must SUCCEED, and the success is asserted first wherever the order allows. A gate that
 * refuses everything passes a refusal-only suite perfectly and is an outage; that is the failure
 * this file is shaped to catch, and it is why proof ④ (a grandfathered child still saving progress)
 * carries the same weight as proof ①.
 *
 * ⚠️ AND THE GATE IS DRIVEN THROUGH THE PATHS THAT ACTUALLY BYPASS RLS. `record_lesson_progress`
 * and friends are SECURITY DEFINER and owned by postgres, so RLS never applies to them — measured
 * on production. A suite that only inserted as `authenticated` would be testing the one path the
 * real defect was never on. `asOwner()` runs as the table owner, which is what those functions do.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema } from './_schema'

const PARENT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const OLD_PARENT = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const V = { notice: 'notice-v1', privacy: 'privacy-2026-09-06', terms: 'terms-2026-09-06' }

let db: PGlite
let grandfathered: string

/** Run as the table owner — the privilege level every SECURITY DEFINER write path really has. */
async function asOwner(sql: string): Promise<{ rows?: Record<string, unknown>[]; err?: string; code?: string }> {
  try { return { rows: (await db.query<Record<string, unknown>>(sql)).rows } }
  catch (e) { const x = e as { message: string; code?: string }; return { err: x.message, code: x.code } }
}

/** A consent row in a given state, carrying everything the real flow would have written by then. */
const newConsent = (state: 'pending' | 'granted') => `
  insert into public.parental_consents
    (parent_id, method, state, notice_version, privacy_version, terms_version, email_address,
     token_hash, expires_at, request_email_provider_id, request_email_sent_at
     ${state === 'granted' ? ', confirmed_at, second_email_provider_id, second_notice_scheduled_for' : ''})
  values
    ('${PARENT}', 'email_plus', '${state}', '${V.notice}', '${V.privacy}', '${V.terms}', 'p@x.test',
     md5(random()::text), now() + interval '7 days', 're_b1', now()
     ${state === 'granted' ? ", now(), 're_b3', now() + interval '1 day'" : ''})
  returning id`

beforeAll(async () => {
  ({ db } = await loadSchema())
  await db.exec(`insert into auth.users (id, email, email_confirmed_at) values
    ('${PARENT}', 'p@x.test', now()), ('${OLD_PARENT}', 'old@x.test', now())`)

  /**
   * ⚠️ A CHILD THAT PRE-DATES THE GATE, MADE THE ONLY WAY ONE HONESTLY CAN: the trigger is dropped,
   * the row is inserted as it would have been before this migration existed, and the trigger is put
   * back. Stamping `consent_exempt_at` by hand on a row created AFTER the gate would be testing a
   * world the migration never produces — the migration's own UPDATE is what stamps the real 26, and
   * this reproduces a row in exactly that state.
   */
  // DISABLE, never drop-and-recreate: re-typing a trigger definition is how a gate silently comes
  // back different from the one the migration installed. `learner_stats` is disabled too because
  // `init_learner_stats` fires AFTER INSERT on learners and writes it — before this migration that
  // row was created freely, and this reproduces that, not a world where the gate half-applied.
  await db.exec(`alter table public.learners      disable trigger trg_enforce_learner_consent;
                 alter table public.learner_stats disable trigger trg_enforce_child_consent;`)
  grandfathered = (await db.query<{ id: string }>(`insert into public.learners
    (display_name, avatar_index, age_group, created_by) values ('Existing', 0, '6-8', '${OLD_PARENT}')
    returning id`)).rows[0].id
  /**
   * The migration's own §2 UPDATE, run in the same window it runs in: BEFORE the gate exists.
   * ⚠️ That ordering is not incidental. Once `trg_enforce_learner_consent` is live, this very
   * statement is refused — a child with neither consent nor exemption cannot be updated into
   * having one. That is deliberate (the exemption must not be reachable as a post-hoc opt-out) and
   * it means grandfathering anyone later takes a deliberate migration, not a support action.
   */
  await db.exec(`update public.learners set consent_exempt_at = coalesce(consent_exempt_at, now())
                  where consent_id is null and consent_exempt_at is null`)
  await db.exec(`alter table public.learners      enable trigger trg_enforce_learner_consent;
                 alter table public.learner_stats enable trigger trg_enforce_child_consent;`)
}, 120_000)

describe('the consent gate', () => {
  // ─────────────────────────── PROOF ① ───────────────────────────
  it('① refuses to create a child with no consent record', async () => {
    const r = await asOwner(`insert into public.learners
      (display_name, avatar_index, age_group, created_by)
      values ('Unconsented', 0, '6-8', '${PARENT}') returning id`)
    /**
     * ⚠️ ANCHORED ON THE LEARNERS GATE'S OWN WORDS ('refusing to create them'), NOT on the generic
     * phrase — and that precision was bought by `npm run break`. With the INSERT branch deliberately
     * opened, this test still PASSED on the broken state: the insert went through, `init_learner_stats`
     * fired AFTER INSERT, and the child-table gate refused the learner_stats write instead. Two
     * independent layers is good news for the system and bad news for a check that cannot tell them
     * apart — a gate that "passes because something else caught it" cannot report which half broke.
     */
    expect(r.err ?? 'ALLOWED').toContain('refusing to create them')
    expect(r.code, 'the refusal must carry the consent SQLSTATE, not a generic one').toBe('P0C01')

    // …and a PENDING consent is not a granted one. Without this, "has a consent row" would pass
    // for a parent who was emailed and never clicked, which is the entire population email-plus
    // exists to distinguish.
    const pending = (await db.query<{ id: string }>(newConsent('pending'))).rows[0].id
    const r2 = await asOwner(`insert into public.learners
      (display_name, avatar_index, age_group, created_by, consent_id)
      values ('Pending', 0, '6-8', '${PARENT}', '${pending}') returning id`)
    expect(r2.err ?? 'ALLOWED').toContain('refusing to create them')

    // Positive control on the corpus itself: nothing was created by either attempt.
    const n = await asOwner(`select count(*)::int as n from public.learners where created_by = '${PARENT}'`)
    expect(n.rows![0].n, 'a refused insert still created a row').toBe(0)
  })

  // ─────────────────────────── PROOF ② ───────────────────────────
  it('② creates the child once a granted consent exists, and binds the two', async () => {
    const c = (await db.query<{ id: string }>(newConsent('granted'))).rows[0].id
    const r = await asOwner(`insert into public.learners
      (display_name, avatar_index, age_group, created_by, consent_id)
      values ('Consented', 0, '6-8', '${PARENT}', '${c}') returning id`)
    expect(r.err).toBeUndefined()
    const kid = r.rows![0].id as string

    // The consent now names the child it covers — the fact the record has to be able to answer.
    const bound = await asOwner(`select learner_id::text, state, notice_version, privacy_version,
      terms_version, confirmed_at is not null as has_time from public.parental_consents where id = '${c}'`)
    expect(bound.rows![0]).toMatchObject({
      learner_id: kid, state: 'granted',
      notice_version: V.notice, privacy_version: V.privacy, terms_version: V.terms, has_time: true,
    })

    // And a product event for that child is now accepted — the gate lets real work through.
    const ev = await asOwner(`insert into public.lesson_progress (learner_id, lesson_id, done)
      values ('${kid}', 'g5m1-t1', true)`)
    expect(ev.err).toBeUndefined()
  })

  // ─────────────────────────── PROOF ③ ───────────────────────────
  it('③ refuses a product event after the consent is withdrawn', async () => {
    const c = (await db.query<{ id: string }>(newConsent('granted'))).rows[0].id
    const kid = (await db.query<{ id: string }>(`insert into public.learners
      (display_name, avatar_index, age_group, created_by, consent_id)
      values ('Withdrawn', 0, '6-8', '${PARENT}', '${c}') returning id`)).rows[0].id

    // Control FIRST: this exact write succeeds while consent stands, so the refusal below is
    // attributable to the withdrawal and not to anything else about the row.
    expect((await asOwner(`insert into public.learner_events (learner_id, event, props, client_id)
      values ('${kid}', 'session_start', '{}', 'before-withdrawal')`)).err).toBeUndefined()

    await db.exec(`update public.parental_consents
                      set state = 'withdrawn', withdrawn_at = now() where id = '${c}'`)

    const after = await asOwner(`insert into public.learner_events (learner_id, event, props, client_id)
      values ('${kid}', 'session_start', '{}', 'after-withdrawal')`)
    expect(after.err ?? 'ALLOWED').toContain('no granted parental consent')
    expect(after.code).toBe('P0C01')

    // Every other surface too — a gate that held only for one table would be the narrowest
    // possible version of this defect.
    for (const sql of [
      `insert into public.lesson_progress (learner_id, lesson_id, done) values ('${kid}', 'g5m1-t2', true)`,
      `insert into public.point_events (learner_id, reason, points) values ('${kid}', 'problem', 5)`,
      `update public.learners set display_name = 'Renamed' where id = '${kid}'`,
    ]) {
      const r = await asOwner(sql)
      expect(r.code, `${sql.slice(0, 48)}… was allowed after withdrawal`).toBe('P0C01')
    }
  })

  // ─────────────────────────── PROOF ④ ───────────────────────────
  it('④ a grandfathered child keeps saving progress — the 26 are not frozen', async () => {
    expect((await asOwner(`select consent_exempt_at is not null as ex, consent_id::text
      from public.learners where id = '${grandfathered}'`)).rows![0])
      .toMatchObject({ ex: true, consent_id: null })

    for (const sql of [
      `insert into public.lesson_progress (learner_id, lesson_id, done) values ('${grandfathered}', 'g3m1-t1', true)`,
      `insert into public.point_events (learner_id, reason, points) values ('${grandfathered}', 'problem', 3)`,
      `insert into public.learner_events (learner_id, event, props, client_id) values ('${grandfathered}', 'session_start', '{}', 'gf-1')`,
      `update public.learners set display_name = 'Renamed Fine' where id = '${grandfathered}'`,
    ]) {
      const r = await asOwner(sql)
      expect(r.err, `a grandfathered child was blocked: ${sql.slice(0, 60)}`).toBeUndefined()
    }
  })

  // ─────────────────────── the exemption is enumerable ───────────────────────
  it('the grandfathered set can be listed and counted, and a new child can never join it', async () => {
    const list = await asOwner('select learner_id::text, display_name from public.consent_exempt_learners')
    expect(list.rows).toHaveLength(1)
    expect(list.rows![0].display_name).toBe('Renamed Fine')

    // ⚠️ The exemption must not be reachable as an opt-out, or the gate is one column wide.
    const c = (await db.query<{ id: string }>(newConsent('granted'))).rows[0].id
    const sneak = await asOwner(`insert into public.learners
      (display_name, avatar_index, age_group, created_by, consent_id, consent_exempt_at)
      values ('Sneak', 0, '6-8', '${PARENT}', '${c}', now())`)
    expect(sneak.err ?? 'ALLOWED').toContain('may not be set on a new child')
  })

  // ─────────────────────── coverage, derived not trusted ───────────────────────
  it('every table holding a field about a child carries the gate', async () => {
    const { rows } = await db.query<{ tbl: string; gated: boolean }>(`
      select c.relname as tbl,
             exists (select 1 from pg_trigger t
                      where t.tgrelid = c.oid and not t.tgisinternal
                        and t.tgname = 'trg_enforce_child_consent') as gated
        from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r'
         and exists (select 1 from pg_attribute a where a.attrelid = c.oid
                      and a.attname = 'learner_id' and a.attnum > 0 and not a.attisdropped)
       order by 1`)

    expect(rows.length, 'positive control: the derivation found no child tables at all')
      .toBeGreaterThan(10)

    /**
     * ⚠️ WRITTEN OUT BY HAND, not read from the migration's own array. Importing the exemption list
     * from the thing under test would assert that the code equals itself and would pass through any
     * change to it. Adding a table here is meant to take a second edit and a moment's thought about
     * whether it really holds no field about a child.
     */
    const EXEMPT = ['learner_access', 'learner_invites', 'parental_consents', 'subscription_seats']
    const ungated = rows.filter(r => !r.gated).map(r => r.tbl)
    expect(ungated.sort(), 'a table holds a child\'s data and is not gated — either attach the ' +
      'trigger or add it to the exemption list with a reason').toEqual([...EXEMPT].sort())
  })
})
