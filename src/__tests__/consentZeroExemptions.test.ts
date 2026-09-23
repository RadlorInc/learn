// @vitest-environment node
/**
 * D6 — ZERO EXEMPTIONS (migration 20260923170000), driven on the repo's real schema.
 *
 * The world it meets is built the way production's was: the schema up to just BEFORE this migration,
 * with children that PRE-DATE the gate (made with the gate's triggers disabled — the same window the
 * 26 real ones were made in — then stamped by 20260923120000's own §2 update, reproduced here), one
 * child created WITH a consent the way the app does, that child's own login, and crash rows. Then the
 * migration file itself is applied, and every claim in its header is asserted.
 *
 * ⚠️ The one claim that is easy to get wrong: deleting the consented child must WITHDRAW its consent.
 * A plain `delete from learners` leaves it `granted` with learner_id null — unused — and the add-a-child
 * flow reuses an unused granted consent, silently pre-authorising the next child.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema, applyFile, applyFrom, CONSENT_ONCE } from './_schema'

const D6 = '20260923170000_consent_zero_exemptions.sql'
const OWNER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const KID_LOGIN = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
let db: PGlite
const one = async <T,>(sql: string) => (await db.query<Record<string, T>>(sql)).rows[0]
const tryq = async (sql: string) => { try { await db.query(sql); return { ok: true as const } } catch (e) { const x = e as { message: string; code?: string }; return { ok: false as const, err: x.message, code: x.code } } }
const grant = (tag: string) => `
  insert into public.parental_consents (parent_id, method, state, notice_version, privacy_version, terms_version,
    email_address, confirmed_at, token_hash, expires_at, request_email_provider_id, request_email_sent_at,
    second_email_provider_id, second_notice_scheduled_for)
  values ('${OWNER}', 'email_plus', 'granted', 'notice-v3', 'p', 't', 'o@x.test', now(), md5('${tag}'),
          now() + interval '7 days', 're_b1', now(), 're_b3', now() + interval '1 day') returning id`

let oldKid: string, newKid: string, newConsent: string
beforeAll(async () => {
  ({ db } = await loadSchema({ before: D6 }))
  await db.exec(`insert into auth.users (id, email, email_confirmed_at) values
    ('${OWNER}', 'o@x.test', now()), ('${KID_LOGIN}', 'kid@learner.adaptivelearn.invalid', now())`)
  // Two children from before the gate (see header), then 20260923120000's own §2 stamp.
  await db.exec(`alter table public.learners      disable trigger trg_enforce_learner_consent;
                 alter table public.learner_stats disable trigger trg_enforce_child_consent;
                 alter table public.learner_access disable trigger user;
                 alter table public.error_events  disable trigger trg_enforce_child_consent;`)
  oldKid = (await one<string>(`insert into public.learners (display_name, avatar_index, age_group, created_by)
    values ('Old One', 0, '6-8', '${OWNER}') returning id::text`)).id
  await db.exec(`insert into public.learners (display_name, avatar_index, age_group, created_by) values ('Old Two', 1, '6-8', '${OWNER}');
    insert into public.learner_access (learner_id, parent_id, access_role) values ('${oldKid}', '${KID_LOGIN}', 'self');
    insert into public.error_events (learner_id, message, source) values ('${oldKid}', 'tagged', 'client'), (null, 'untagged', 'client');
    update public.learners set consent_exempt_at = coalesce(consent_exempt_at, now()) where consent_id is null and consent_exempt_at is null;`)
  await db.exec(`alter table public.learners      enable trigger trg_enforce_learner_consent;
                 alter table public.learner_stats enable trigger trg_enforce_child_consent;
                 alter table public.learner_access enable trigger user;
                 alter table public.error_events  enable trigger trg_enforce_child_consent;`)
  // A child created the way the app creates one: a granted consent, passed as consent_id.
  newConsent = (await one<string>(grant('new') + '::text')).id
  newKid = (await one<string>(`insert into public.learners (display_name, avatar_index, age_group, created_by, consent_id)
    values ('New One', 2, '6-8', '${OWNER}', '${newConsent}') returning id::text`)).id

  // The world D6 meets — asserted, so an empty fixture cannot make the "after" checks vacuous.
  expect((await one<number>(`select count(*)::int as n from public.learners`)).n).toBe(3)
  expect((await one<number>(`select count(consent_exempt_at)::int as n from public.learners`)).n).toBe(2)
  expect((await one<boolean>(`select exists(select 1 from auth.users where id = '${KID_LOGIN}') as e`)).e).toBe(true)

  await applyFile(db, D6)
}, 120_000)

describe('D6 — every child cleared, and the exemption gone', () => {
  it('no child remains; adults and their profiles stay', async () => {
    expect((await one<number>(`select count(*)::int as n from public.learners`)).n).toBe(0)
    expect((await one<boolean>(`select exists(select 1 from auth.users where id = '${OWNER}') as e`)).e).toBe(true)
    expect((await one<number>(`select count(*)::int as n from public.profiles where id = '${OWNER}'`)).n).toBe(1)
  })

  it("a child's own login goes with the child", async () => {
    expect((await one<boolean>(`select exists(select 1 from auth.users where id = '${KID_LOGIN}') as e`)).e).toBe(false)
  })

  it("the consented child's consent is WITHDRAWN, kept as evidence, and cannot be reused", async () => {
    const c = await one<string>(`select state, learner_id::text as l from public.parental_consents where id = '${newConsent}'`)
    expect(c).toMatchObject({ state: 'withdrawn', l: null })
    const reuse = await tryq(`insert into public.learners (display_name, avatar_index, age_group, created_by, consent_id)
      values ('Reuse', 0, '6-8', '${OWNER}', '${newConsent}')`)
    expect(reuse.ok ? 'ALLOWED' : reuse.code).toBe('P0C01')
  })

  it('crash rows tagged to a child are gone; an untagged one stays', async () => {
    expect((await one<number>(`select count(*)::int as n from public.error_events where learner_id is not null`)).n).toBe(0)
    expect((await one<number>(`select count(*)::int as n from public.error_events where message = 'untagged'`)).n).toBe(1)
  })

  it('the exemption is gone and consent_id is NOT NULL', async () => {
    expect((await one<number>(`select count(*)::int as n from information_schema.columns
      where table_name = 'learners' and column_name = 'consent_exempt_at'`)).n).toBe(0)
    expect((await one<string>(`select to_regclass('public.consent_exempt_learners')::text as v`)).v).toBeNull()
    expect((await one<boolean>(`select attnotnull as nn from pg_attribute
      where attrelid = 'public.learners'::regclass and attname = 'consent_id'`)).nn).toBe(true)
  })

  it('both halves of the gate afterwards (as of D6): no consent → refused; a fresh granted consent → created', async () => {
    const none = await tryq(`insert into public.learners (display_name, avatar_index, age_group, created_by)
      values ('None', 0, '6-8', '${OWNER}')`)
    expect(none.ok ? 'ALLOWED' : none.code).toMatch(/P0C01|23502/)
    const fresh = (await one<string>(grant('fresh') + '::text')).id
    const made = await tryq(`insert into public.learners (display_name, avatar_index, age_group, created_by, consent_id)
      values ('Fresh', 0, '6-8', '${OWNER}', '${fresh}')`)
    expect(made.ok ? 'CREATED' : made.err).toBe('CREATED')
  })
})

/**
 * …AND D6's WORLD UNDER EVERY LATER MIGRATION. The describe above proves D6 as it was written, on the schema it
 * met. Consent-once (20260924100000) changed what "a fresh granted consent" can do, so D6's positive half — a new
 * per-child consent creates a child — is no longer true, and leaving it as the last word would state a gate that
 * no longer exists. Here the rest of the migrations are applied on top of D6's result (plus the one child D6's own last test made) and the gate is
 * asserted as it now stands. Runs after the describe above (vitest runs suites in order on the one database).
 */
describe('after consent-once: D6 holds, and the gate is the account gate', () => {
  beforeAll(async () => { await applyFrom(db, CONSENT_ONCE) }, 120_000)

  it('the migration applies on D6\'s result: the one post-D6 child is carried over with its consent\'s attestation', async () => {
    // 'Fresh' — made by the last D6 test above, under a per-child consent, as the app did then.
    const kids = (await db.query<Record<string, unknown>>(`select l.display_name, l.attestation_method, l.attested_by::text,
      l.attested_notice_version, c.scope from public.learners l join public.parental_consents c on c.id = l.consent_id`)).rows
    expect(kids).toEqual([{ display_name: 'Fresh', attestation_method: 'per_child_consent', attested_by: OWNER,
      attested_notice_version: 'notice-v3', scope: 'child' }])
    expect((await one<number>(`select count(*)::int as n from information_schema.columns
      where table_name = 'learners' and column_name = 'consent_exempt_at'`)).n).toBe(0)
    expect((await one<boolean>(`select attnotnull as nn from pg_attribute
      where attrelid = 'public.learners'::regclass and attname = 'consent_id'`)).nn).toBe(true)
  })

  it('D6\'s withdrawn consent still cannot be reused', async () => {
    const reuse = await tryq(`insert into public.learners (display_name, avatar_index, age_group, created_by, consent_id, attested_notice_version)
      values ('Reuse', 0, '6-8', '${OWNER}', '${newConsent}', 'notice-v3')`)
    expect(reuse.ok ? 'ALLOWED' : reuse.code).toBe('P0C01')
  })

  it('both halves now: no consent or a fresh PER-CHILD consent → refused; an account consent + attestation → created', async () => {
    const none = await tryq(`insert into public.learners (display_name, avatar_index, age_group, created_by)
      values ('None', 0, '6-8', '${OWNER}')`)
    expect(none.ok ? 'ALLOWED' : none.code).toMatch(/P0C01|23502/)
    // D6's positive half, re-run as written: now REFUSED — a per-child consent creates no child after consent-once.
    const perChild = (await one<string>(grant('fresh-after') + '::text')).id
    const old = await tryq(`insert into public.learners (display_name, avatar_index, age_group, created_by, consent_id, attested_notice_version)
      values ('Per-child', 0, '6-8', '${OWNER}', '${perChild}', 'notice-v3')`)
    expect(old.ok ? 'ALLOWED' : old.err).toContain('no granted parental consent for this account')
    // The positive half as it now stands.
    const account = (await one<string>(`insert into public.parental_consents (parent_id, method, state, notice_version, privacy_version, terms_version,
        email_address, confirmed_at, token_hash, expires_at, request_email_provider_id, request_email_sent_at,
        second_email_provider_id, second_notice_scheduled_for, scope)
      values ('${OWNER}', 'email_plus', 'granted', 'notice-v3', 'p', 't', 'o@x.test', now(), md5('account'),
              now() + interval '7 days', 're_b1', now(), 're_b3_account', now() + interval '1 day', 'account') returning id::text`)).id
    const made = await tryq(`insert into public.learners (display_name, avatar_index, age_group, created_by, consent_id, attested_notice_version)
      values ('Fresh', 0, '6-8', '${OWNER}', '${account}', 'notice-v3')`)
    expect(made.ok ? 'CREATED' : made.err).toBe('CREATED')
  })
})
