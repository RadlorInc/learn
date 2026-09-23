// @vitest-environment node
/**
 * VERIFIABLE PARENTAL CONSENT — the gate, driven in the repo's real schema.
 *
 * ⚠️ WHAT MAKES THIS A PROOF RATHER THAN A DESCRIPTION. Every refusal below is paired with the
 * write that must SUCCEED, and the success is asserted first wherever the order allows. A gate that
 * refuses everything passes a refusal-only suite perfectly and is an outage; that is the failure
 * this file is shaped to catch. (Until D6 it also held a grandfathered child; D6 removed every child and
 * the exemption — the migration itself is proven in `consentZeroExemptions.test.ts`.)
 *
 * ⚠️ AND THE GATE IS DRIVEN THROUGH THE PATHS THAT ACTUALLY BYPASS RLS. `record_lesson_progress`
 * and friends are SECURITY DEFINER and owned by postgres, so RLS never applies to them — measured
 * on production. A suite that only inserted as `authenticated` would be testing the one path the
 * real defect was never on. `asOwner()` runs as the table owner, which is what those functions do.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema, applyFrom, legacyChild, CONSENT_ONCE } from './_schema'

const PARENT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const OTHER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const V = { notice: 'notice-v1', privacy: 'privacy-2026-09-06', terms: 'terms-2026-09-06' }

let db: PGlite

/** Run as the table owner — the privilege level every SECURITY DEFINER write path really has. */
async function asOwner(sql: string): Promise<{ rows?: Record<string, unknown>[]; err?: string; code?: string }> {
  try { return { rows: (await db.query<Record<string, unknown>>(sql)).rows } }
  catch (e) { const x = e as { message: string; code?: string }; return { err: x.message, code: x.code } }
}

/** A consent row in a given state, carrying everything the real flow would have written by then.
 *  Consent-once: the flow writes ACCOUNT scope; `child` is the pre-2026-09-24 per-child shape. */
const newConsent = (state: 'pending' | 'granted', scope: 'account' | 'child' = 'account', parent = PARENT) => `
  insert into public.parental_consents
    (parent_id, method, state, notice_version, privacy_version, terms_version, email_address,
     token_hash, expires_at, request_email_provider_id, request_email_sent_at, scope
     ${state === 'granted' ? ', confirmed_at, second_email_provider_id, second_notice_scheduled_for' : ''})
  values
    ('${parent}', 'email_plus', '${state}', '${V.notice}', '${V.privacy}', '${V.terms}', 'p@x.test',
     md5(random()::text), now() + interval '7 days', 're_b1', now(), '${scope}'
     ${state === 'granted' ? ", now(), 're_b3_' || md5(random()::text), now() + interval '1 day'" : ''})
  returning id`
/** The child insert the app makes: the account consent's id, and the notice version the parent's tick attested. */
const addChild = (name: string, consent: string, attest: string | null = V.notice) => `insert into public.learners
  (display_name, avatar_index, age_group, created_by, consent_id, attested_notice_version)
  values ('${name}', 0, '6-8', '${PARENT}', '${consent}', ${attest === null ? 'null' : `'${attest}'`}) returning id`
const NO_ACCOUNT_CONSENT = 'no granted parental consent for this account — refusing to create a child'
const NO_ATTESTATION = 'no parental attestation for this child — refusing to create them'

beforeAll(async () => {
  ({ db } = await loadSchema())
  await db.exec(`insert into auth.users (id, email, email_confirmed_at) values
    ('${PARENT}', 'p@x.test', now()), ('${OTHER}', 'o@x.test', now())`)

}, 120_000)

describe('the consent gate', () => {
  // ─────────────────────────── PROOF ① ───────────────────────────
  it('① refuses to create a child with no consent record', async () => {
    const r = await asOwner(`insert into public.learners
      (display_name, avatar_index, age_group, created_by)
      values ('Unconsented', 0, '6-8', '${PARENT}') returning id`)
    /**
     * ⚠️ ANCHORED ON THE LEARNERS GATE'S OWN WORDS, NOT on the generic phrase — and that precision was
     * bought by `npm run break`. With the INSERT branch deliberately opened, a looser version of this test
     * still PASSED on the broken state: the insert went through, `init_learner_stats` fired AFTER INSERT,
     * and the child-table gate refused the learner_stats write instead. A gate that "passes because
     * something else caught it" cannot report which half broke. (Consent-once reworded the refusal: it now
     * names the ACCOUNT, because a child is no longer created under a consent of its own.)
     */
    expect(r.err ?? 'ALLOWED').toContain(NO_ACCOUNT_CONSENT)
    expect(r.code, 'the refusal must carry the consent SQLSTATE, not a generic one').toBe('P0C01')

    // …and a PENDING consent is not a granted one. Without this, "has a consent row" would pass
    // for a parent who was emailed and never clicked, which is the entire population email-plus
    // exists to distinguish.
    const pending = (await db.query<{ id: string }>(newConsent('pending'))).rows[0].id
    expect((await asOwner(addChild('Pending', pending))).err ?? 'ALLOWED').toContain(NO_ACCOUNT_CONSENT)

    // Consent-once: a GRANTED PER-CHILD consent — the pre-2026-09-24 shape, unbound — can no longer create
    // any child. Before, this exact row was the way a child came into existence.
    const perChild = (await db.query<{ id: string }>(newConsent('granted', 'child'))).rows[0].id
    expect((await asOwner(addChild('Per-child', perChild))).err ?? 'ALLOWED').toContain(NO_ACCOUNT_CONSENT)

    // …nor can ANOTHER parent's granted account consent: the consent must be the child's creator's own.
    const theirs = (await db.query<{ id: string }>(newConsent('granted', 'account', OTHER))).rows[0].id
    expect((await asOwner(addChild('Borrowed', theirs))).err ?? 'ALLOWED').toContain(NO_ACCOUNT_CONSENT)

    // Positive control on the corpus itself: nothing was created by any attempt.
    const n = await asOwner(`select count(*)::int as n from public.learners where created_by = '${PARENT}'`)
    expect(n.rows![0].n, 'a refused insert still created a row').toBe(0)
  })

  it('①b refuses a child with no parental attestation, or one for a notice the parent did not agree to', async () => {
    const c = (await db.query<{ id: string }>(newConsent('granted'))).rows[0].id
    const none = await asOwner(addChild('Unattested', c, null))
    expect(none.err ?? 'ALLOWED').toContain(NO_ATTESTATION)
    expect(none.code).toBe('P0C01')
    const wrong = await asOwner(addChild('Other notice', c, 'notice-v2'))
    expect(wrong.err ?? 'ALLOWED').toContain(NO_ATTESTATION)
    const n = await asOwner(`select count(*)::int as n from public.learners where created_by = '${PARENT}'`)
    expect(n.rows![0].n, 'a refused insert still created a row').toBe(0)
  })

  // ─────────────────────────── PROOF ② ───────────────────────────
  it('② creates children once a granted ACCOUNT consent exists — several under one, none bound to it', async () => {
    const c = (await db.query<{ id: string }>(newConsent('granted'))).rows[0].id
    const r = await asOwner(addChild('Consented', c))
    expect(r.err).toBeUndefined()
    const kid = r.rows![0].id as string

    // The consent stays the ACCOUNT's: it names no child, and records what the parent agreed to.
    const rec = await asOwner(`select learner_id::text, state, scope, notice_version, privacy_version,
      terms_version, confirmed_at is not null as has_time from public.parental_consents where id = '${c}'`)
    expect(rec.rows![0]).toMatchObject({
      learner_id: null, state: 'granted', scope: 'account',
      notice_version: V.notice, privacy_version: V.privacy, terms_version: V.terms, has_time: true,
    })

    // The child carries the attestation, stamped by the DATABASE — who, when, how — whatever a client sent.
    const att = await asOwner(`select consent_id::text, attested_by::text, attested_at is not null as at,
      attested_notice_version, attestation_method from public.learners where id = '${kid}'`)
    expect(att.rows![0]).toMatchObject({ consent_id: c, attested_by: PARENT, at: true,
      attested_notice_version: V.notice, attestation_method: 'checkbox' })

    // A second child under the SAME consent — the point of consent-once (was: "one consent, one child").
    const second = await asOwner(addChild('Sibling', c))
    expect(second.err).toBeUndefined()

    // And a product event for each child is now accepted — the gate lets real work through.
    for (const k of [kid, second.rows![0].id as string]) {
      const ev = await asOwner(`insert into public.lesson_progress (learner_id, lesson_id, done)
        values ('${k}', 'g5m1-t1', true)`)
      expect(ev.err).toBeUndefined()
    }

    // The attestation is fixed once recorded; the rest of the row is not (positive twin first).
    expect((await asOwner(`update public.learners set display_name = 'Renamed' where id = '${kid}'`)).err).toBeUndefined()
    for (const set of [`attested_at = now() - interval '1 day'`, `attested_notice_version = 'notice-v2'`,
                       `attested_by = '${OTHER}'`, `attestation_method = 'per_child_consent'`]) {
      const u = await asOwner(`update public.learners set ${set} where id = '${kid}'`)
      expect(u.code, `${set} was allowed`).toBe('P0C02')
    }
  })

  // ─────────────────────────── PROOF ③ ───────────────────────────
  it('③ refuses a product event after the account consent is withdrawn — for every child it covers', async () => {
    const c = (await db.query<{ id: string }>(newConsent('granted'))).rows[0].id
    const kid = (await db.query<{ id: string }>(addChild('Withdrawn', c))).rows[0].id
    const sibling = (await db.query<{ id: string }>(addChild('Withdrawn sibling', c))).rows[0].id

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
      // …and every child the account consent covers, not only the first.
      `insert into public.lesson_progress (learner_id, lesson_id, done) values ('${sibling}', 'g5m1-t2', true)`,
    ]) {
      const r = await asOwner(sql)
      expect(r.code, `${sql.slice(0, 48)}… was allowed after withdrawal`).toBe('P0C01')
    }
  })

  // ─────────────────────────── PROOF ④ (since D6) ───────────────────────────
  it('④ there is no exemption: no column, no view, no grandfather branch — and consent_id is NOT NULL', async () => {
    const col = await asOwner(`select count(*)::int as n from information_schema.columns
      where table_schema = 'public' and table_name = 'learners' and column_name = 'consent_exempt_at'`)
    expect(col.rows![0].n).toBe(0)
    expect((await asOwner(`select to_regclass('public.consent_exempt_learners')::text as v`)).rows![0].v).toBeNull()
    const def = await asOwner(`select pg_get_functiondef('public.consent_ok(uuid)'::regprocedure) as d`)
    expect(String(def.rows![0].d)).toMatch(/parental_consents/)        // control: we read the real body
    expect(String(def.rows![0].d)).not.toMatch(/exempt/i)
    const nn = await asOwner(`select attnotnull as nn from pg_attribute
      where attrelid = 'public.learners'::regclass and attname = 'consent_id'`)
    expect(nn.rows![0].nn).toBe(true)
  })

  it('a child with no consent record cannot exist even with the trigger out of the way — by structure', async () => {
    // The table owner disables the trigger (as a careless migration could); NOT NULL still refuses.
    await db.exec(`alter table public.learners disable trigger trg_enforce_learner_consent`)
    const r = await asOwner(`insert into public.learners (display_name, avatar_index, age_group, created_by)
      values ('No Record', 0, '6-8', '${PARENT}')`)
    await db.exec(`alter table public.learners enable trigger trg_enforce_learner_consent`)
    expect(r.err ?? 'ALLOWED').toMatch(/consent_id/)
    expect(r.code).toBe('23502')                                       // not_null_violation
  })

  it('…and neither can a child with no attestation — the attestation columns are NOT NULL, by structure', async () => {
    const c = (await db.query<{ id: string }>(newConsent('granted'))).rows[0].id
    await db.exec(`alter table public.learners disable trigger trg_enforce_learner_consent`)
    const r = await asOwner(`insert into public.learners (display_name, avatar_index, age_group, created_by, consent_id,
      attested_notice_version) values ('No Stamp', 0, '6-8', '${PARENT}', '${c}', '${V.notice}')`)
    await db.exec(`alter table public.learners enable trigger trg_enforce_learner_consent`)
    // Without the trigger nothing stamps who/when/how — and the row cannot exist without them.
    expect(r.err ?? 'ALLOWED').toMatch(/attested_by|attested_at|attestation_method/)
    expect(r.code).toBe('23502')
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

/**
 * A CHILD WHO EXISTED BEFORE CONSENT-ONCE. Built the way production's was — the schema up to just before the
 * migration, a per-child consent, the child under it — and then the migration file itself is applied. Rule 2's
 * one deliberate reading (LOOP-STATE C0): a granted per-child consent bound to THIS child keeps this child valid,
 * and can create no other.
 */
describe('a child created under a per-child consent, carried over by the migration', () => {
  let old: PGlite
  let legacy: { id: string; consent: string; token: string }
  const run = async (sql: string) => { try { return { rows: (await old.query<Record<string, unknown>>(sql)).rows } }
    catch (e) { const x = e as { message: string; code?: string }; return { err: x.message, code: x.code } } }

  beforeAll(async () => {
    ({ db: old } = await loadSchema({ before: CONSENT_ONCE }))
    await old.exec(`insert into auth.users (id, email, email_confirmed_at) values ('${PARENT}', 'p@x.test', now())`)
    legacy = await legacyChild(old, PARENT, 'Before')
    await applyFrom(old, CONSENT_ONCE)
  }, 120_000)

  it('gets its attestation from its own consent — nothing invented', async () => {
    const r = await run(`select l.attested_by::text, l.attested_at = c.confirmed_at as same_time, l.attested_notice_version,
      l.attestation_method, c.scope, c.learner_id::text from public.learners l join public.parental_consents c on c.id = l.consent_id
      where l.id = '${legacy.id}'`)
    expect(r.rows![0]).toMatchObject({ attested_by: PARENT, same_time: true, attested_notice_version: 'notice-v3',
      attestation_method: 'per_child_consent', scope: 'child', learner_id: legacy.id })
  })

  it('keeps working — its data is accepted', async () => {
    expect((await run(`insert into public.lesson_progress (learner_id, lesson_id, done) values ('${legacy.id}', 'g3m1-t1', true)`)).err).toBeUndefined()
  })

  it('its consent creates no other child, attested or not', async () => {
    const r = await run(`insert into public.learners (display_name, avatar_index, age_group, created_by, consent_id, attested_notice_version)
      values ('Second', 0, '6-8', '${PARENT}', '${legacy.consent}', 'notice-v3')`)
    expect(r.err ?? 'ALLOWED').toContain(NO_ACCOUNT_CONSENT)
  })

  it('withdrawing that consent stops its data, as before', async () => {
    await old.exec(`update public.parental_consents set state = 'withdrawn', withdrawn_at = now() where id = '${legacy.consent}'`)
    const r = await run(`insert into public.lesson_progress (learner_id, lesson_id, done) values ('${legacy.id}', 'g3m1-t2', true)`)
    expect(r.code).toBe('P0C01')
  })
})
