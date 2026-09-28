// @vitest-environment node
/**
 * RE-CONSENT AFTER A MATERIAL NOTICE CHANGE — driven through the REAL one: 20260928100000 (notice-v7, KG–2), which
 * the founder chose to register with `reconsent_required = true` so that every parent is asked again.
 *
 * Built the only faithful way: the schema BEFORE the migration, families who consented to notice-v6 (what the app sent
 * until then), then the migration itself. It must (a) stop new collection for every child whose consent predates it,
 * and (b) be recoverable: the parent answers a fresh B1 on notice-v7, the grant carries every child onto the new
 * consent, and the old one is closed. The first version of consent-once failed (b) — the gate re-read the stored row
 * mid-update and rolled the grant back, freezing every parent with children for ever (found 2026-09-24).
 *
 * It also measures two claims written elsewhere, rather than trusting them:
 *   · the migration header's deploy-order warning — a parent answering a notice-v6 request once v7 is applied (the old
 *     app still live) is refused, and nothing moves;
 *   · the founder's count SQL (docs/legal/sql/notice-v7-before.sql / -proof.sql), run on this schema, returns the
 *     numbers this fixture was built to give — written out by hand.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema, applyFrom, grantedConsent, NOTICE_V7 } from './_schema'

const P = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'   // v6 consent, two children
const Q = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'   // v6 consent, no children yet
const W = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'   // withdrew — not asked again
const R = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'   // an unanswered request
let db: PGlite
const kids: string[] = []
let oldConsent = ''

const tryq = (sql: string) => db.query(sql).then(() => 'OK', e => (e as Error).message)
const sql = async (f: string) =>
  (await db.query<{ check: string; result: string }>(readFileSync(resolve(__dirname, '../../docs/legal/sql', f), 'utf8'))).rows
const fails = (rows: { check: string; result: string }[]) => rows.filter(r => !r.check.startsWith('INFO') && r.result !== 'PASS').map(r => r.check)
const info = (rows: { check: string; result: string }[], k: string) => rows.find(r => r.check.startsWith(`INFO ${k}`))!.result

beforeAll(async () => {
  ({ db } = await loadSchema({ before: NOTICE_V7 }))
  await db.exec(`create schema if not exists supabase_migrations;
    create table if not exists supabase_migrations.schema_migrations (version text primary key);`)
  for (const [id, e] of [[P, 'p'], [Q, 'q'], [W, 'w'], [R, 'r']])
    await db.exec(`insert into auth.users (id, email, email_confirmed_at) values ('${id}', '${e}@x.test', now());
      insert into public.profiles (id, role) values ('${id}', 'parent') on conflict (id) do update set role = excluded.role;`)
  oldConsent = await grantedConsent(db, P, 'account', 'notice-v6')
  for (const n of ['Ana', 'Ben'])
    kids.push((await db.query<{ id: string }>(`insert into public.learners (display_name, age_group, created_by, consent_id, attested_notice_version)
      values ('${n}', '9-11', '${P}', '${oldConsent}', 'notice-v6') returning id`)).rows[0].id)
  await grantedConsent(db, Q, 'account', 'notice-v6')
  await db.exec(`update public.parental_consents set state = 'withdrawn', withdrawn_at = now() where id = '${await grantedConsent(db, W, 'account', 'notice-v6')}'`)
  await db.query(`select * from public.consent_request('${R}', 'notice-v6', 'privacy@x', 'terms@x', 'en', 'tok-open', interval '7 days', 'account', now())`)
}, 120_000)

describe('notice-v7: every parent is asked again', () => {
  it('before: the count SQL passes and counts the two current accounts, their two children and the open request', async () => {
    // Control: before the migration these children accept data — so the refusals below are the migration's doing.
    expect(await tryq(`insert into public.learner_events (learner_id, event, props) values ('${kids[0]}', 'lesson_start', '{}')`)).toBe('OK')
    const before = await sql('notice-v7-before.sql')
    expect(fails(before)).toEqual([])
    expect(info(before, 'accounts asked again')).toBe('2')
    expect(info(before, 'children paused')).toBe('2')
    expect(info(before, 'open requests')).toBe('1')
    // Control for the proof: run BEFORE the apply, it does not pass — so it can tell the two states apart.
    expect(fails(await sql('notice-v7-proof.sql')).length).toBeGreaterThan(0)

    await applyFrom(db, NOTICE_V7)
    await db.exec(`insert into supabase_migrations.schema_migrations values ('20260928100000')`)
    const after = await sql('notice-v7-proof.sql')
    expect(fails(after)).toEqual([])
    expect(info(after, 'accounts still to answer')).toBe('2')
    expect(info(after, 'accounts that have answered')).toBe('0')
  })

  it('(a) new collection stops: child data, a changed child and a new child are all refused', async () => {
    expect(await tryq(`insert into public.learner_events (learner_id, event, props) values ('${kids[0]}', 'lesson_start', '{}')`))
      .toMatch(/no granted parental consent/)
    expect(await tryq(`update public.learners set display_name = 'Anna' where id = '${kids[0]}'`)).toMatch(/no granted parental consent/)
    expect(await tryq(`insert into public.learners (display_name, age_group, created_by, consent_id, attested_notice_version)
      values ('Cy', '9-11', '${P}', '${oldConsent}', 'notice-v6')`)).toMatch(/no granted parental consent for this account/)
  })

  it('the wrong deploy order: answering a notice-v6 request once v7 is applied is refused, and nothing moves', async () => {
    const [{ consent_id: stale }] = (await db.query<{ consent_id: string }>(`select * from public.consent_request(
      '${P}', 'notice-v6', 'privacy@x', 'terms@x', 'en', 'tok-stale', interval '7 days', 'account', now())`)).rows
    await db.exec(`select public.consent_record_request_sent('${stale}', 're_b1_stale')`)
    expect(await tryq(`select public.consent_grant('tok-stale', 're_b3_stale', now() + interval '1 day')`)).toMatch(/no granted parental consent for learner/)
    const rows = (await db.query<{ consent_id: string }>(`select consent_id from public.learners where created_by = '${P}'`)).rows
    expect(rows.map(x => x.consent_id)).toEqual([oldConsent, oldConsent])
  })

  it('(b) the parent re-consents on notice-v7: the grant succeeds, both children move onto it, the old consent closes', async () => {
    const [{ consent_id: fresh }] = (await db.query<{ consent_id: string }>(`select * from public.consent_request(
      '${P}', 'notice-v7', 'privacy@x', 'terms@x', 'en', 'tok-reconsent', interval '7 days', 'account', now())`)).rows
    await db.exec(`select public.consent_record_request_sent('${fresh}', 're_b1_new')`)
    const [{ r }] = (await db.query<{ r: string }>(`select public.consent_grant('tok-reconsent', 're_b3_new', now() + interval '1 day') as r`)).rows
    expect(r).toBe('granted')

    const rows = (await db.query<{ consent_id: string }>(`select consent_id from public.learners where created_by = '${P}' order by display_name`)).rows
    expect(rows.map(x => x.consent_id)).toEqual([fresh, fresh])
    const [{ state }] = (await db.query<{ state: string }>(`select state from public.parental_consents where id = '${oldConsent}'`)).rows
    expect(state).toBe('withdrawn')
    // …and collection resumes for the children the parent kept.
    expect(await tryq(`insert into public.learner_events (learner_id, event, props) values ('${kids[0]}', 'lesson_start', '{}')`)).toBe('OK')
    const proof = await sql('notice-v7-proof.sql')
    expect(info(proof, 'accounts still to answer')).toBe('1')
    expect(info(proof, 'accounts that have answered')).toBe('1')
  })
})
