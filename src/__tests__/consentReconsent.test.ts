// @vitest-environment node
/**
 * NOTICE-V7 (20260928100000), DRIVEN THROUGH THE REAL MIGRATION — the founder's rule of 2026-09-28:
 * existing families are NOT blocked. A Grade 3–8 child's band (9-11, 12-14) is what notice-v6 describes, so a v6
 * consent stays valid for them. notice-v7 is required only for a child in Kindergarten (3-5) or Grades 1–2 (6-8), and
 * for adding a child (the attestation names the notice the sheet showed — v7 — even under a v6 account consent).
 *
 * Built the only faithful way: the schema BEFORE the migration, families who consented to notice-v6 (what the app sent
 * until then), then the migration. Every expectation is written out by hand. It also measures two claims written
 * elsewhere rather than trusting them: the founder's count SQL (docs/legal/sql/notice-v7-before.sql / -proof.sql),
 * including its STOP-CHECK hashes, returns what this fixture was built to give; and a v6 parent can get from "KG child
 * refused" to "KG child accepted" by answering one consent email (the upgrade path in consent_grant).
 *
 * The last block keeps the original guard of this file: a notice marked `reconsent_required` stops collection, and the
 * re-consent recovers it (the first consent-once froze every parent with children for ever; found 2026-09-24).
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema, applyFrom, grantedConsent, NOTICE_V7, FIXTURE_NOTICE } from './_schema'

const P = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'   // v6 consent: Ana (Grade 4), Kit (KG), Gus (Grade 1)
const Q = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'   // v6 consent: Dee (Grade 7)
const W = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'   // withdrew
const R = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'   // an unanswered request
let db: PGlite
const kid: Record<string, string> = {}
let v6 = ''

const tryq = (sql: string) => db.query(sql).then(() => 'OK', e => (e as Error).message)
const event = (name: string) => tryq(`insert into public.learner_events (learner_id, event, props) values ('${kid[name]}', 'lesson_start', '{}')`)
const addChild = (name: string, band: string, attested: string) => db.query<{ id: string }>(`insert into public.learners
  (display_name, age_group, created_by, consent_id, attested_notice_version) values ('${name}', '${band}', '${P}', '${v6}', '${attested}') returning id`)
  .then(r => { kid[name] = r.rows[0].id; return 'OK' }, e => (e as Error).message)
const sql = async (f: string) =>
  (await db.query<{ check: string; result: string }>(readFileSync(resolve(__dirname, '../../docs/legal/sql', f), 'utf8'))).rows
const fails = (rows: { check: string; result: string }[]) => rows.filter(r => !r.check.startsWith('INFO') && r.result !== 'PASS').map(r => r.check)
const info = (rows: { check: string; result: string }[], k: string) => rows.find(r => r.check.startsWith(`INFO ${k}`))!.result
async function answer(parent: string, notice: string, tok: string) {
  const [{ consent_id }] = (await db.query<{ consent_id: string }>(`select * from public.consent_request('${parent}', '${notice}',
    'privacy@x', 'terms@x', 'en', '${tok}', interval '7 days', 'account', now())`)).rows
  await db.exec(`select public.consent_record_request_sent('${consent_id}', 're_b1_${tok}')`)
  const [{ r }] = (await db.query<{ r: string }>(`select public.consent_grant('${tok}', 're_b3_${tok}', now() + interval '1 day') as r`)).rows
  return { r, consent_id }
}

beforeAll(async () => {
  ({ db } = await loadSchema({ before: NOTICE_V7 }))
  await db.exec(`create schema if not exists supabase_migrations;
    create table if not exists supabase_migrations.schema_migrations (version text primary key);`)
  for (const [id, e] of [[P, 'p'], [Q, 'q'], [W, 'w'], [R, 'r']])
    await db.exec(`insert into auth.users (id, email, email_confirmed_at) values ('${id}', '${e}@x.test', now());
      insert into public.profiles (id, role) values ('${id}', 'parent') on conflict (id) do update set role = excluded.role;`)
  v6 = await grantedConsent(db, P, 'account', 'notice-v6')
  for (const [n, band] of [['Ana', '9-11'], ['Kit', '3-5'], ['Gus', '6-8']]) expect(await addChild(n, band, 'notice-v6')).toBe('OK')
  const q6 = await grantedConsent(db, Q, 'account', 'notice-v6')
  kid.Dee = (await db.query<{ id: string }>(`insert into public.learners (display_name, age_group, created_by, consent_id, attested_notice_version)
    values ('Dee', '12-14', '${Q}', '${q6}', 'notice-v6') returning id`)).rows[0].id
  await db.exec(`update public.parental_consents set state = 'withdrawn', withdrawn_at = now() where id = '${await grantedConsent(db, W, 'account', 'notice-v6')}'`)
  await db.query(`select * from public.consent_request('${R}', 'notice-v6', 'privacy@x', 'terms@x', 'en', 'tok-open', interval '7 days', 'account', now())`)
}, 120_000)

describe('notice-v7: only the new bands and new children need it', () => {
  it('before: the STOP-CHECK passes and the counts are one KG child, one Grade 1–2 child, one adult, no Grade 3–8 child refused', async () => {
    // Control: before the migration the KG child accepts data — so a refusal below is the migration's doing.
    expect(await event('Kit')).toBe('OK')
    const before = await sql('notice-v7-before.sql')
    expect(fails(before)).toEqual([])
    expect(info(before, 'children in Kindergarten')).toBe('1')
    expect(info(before, 'children in Grades 1-2')).toBe('1')
    expect(info(before, 'adults of those children')).toBe('1')
    expect(info(before, 'Grade 3-8 children the gate refuses')).toBe('0')
    expect(info(before, 'open consent requests')).toBe('1')
    // Control for the proof: run BEFORE the apply it cannot pass (it errors: notice_names_band does not exist yet) —
    // so it can tell the two states apart.
    expect(await sql('notice-v7-proof.sql').then(r => fails(r).length, () => 'error')).not.toBe(0)

    await applyFrom(db, NOTICE_V7)
    await db.exec(`insert into supabase_migrations.schema_migrations values ('20260928100000')`)
    const after = await sql('notice-v7-proof.sql')
    expect(fails(after)).toEqual([])
    expect(info(after, 'Grade 3-8 children the gate refuses')).toBe(info(before, 'Grade 3-8 children the gate refuses'))
    expect(info(after, 'KG / Grades 1-2 children waiting')).toBe('2')
    expect(info(after, 'adults who have agreed to notice-v7')).toBe('0')
  })

  it('existing Grade 3–8 families are not blocked: data and changes still accepted on a v6 consent', async () => {
    expect(await event('Ana')).toBe('OK')
    expect(await event('Dee')).toBe('OK')
    expect(await tryq(`update public.learners set display_name = 'Anna' where id = '${kid.Ana}'`)).toBe('OK')
  })

  it('a KG or Grade 1–2 child on a v6 consent is refused: data, and changes to their record', async () => {
    for (const n of ['Kit', 'Gus']) {
      expect(await event(n), n).toMatch(/no granted parental consent/)
      expect(await tryq(`update public.learners set display_name = 'X' where id = '${kid[n]}'`), n).toMatch(/does not name learner .*grade band/)
    }
  })

  it('adding a child: attested against v7 under a v6 consent — created, and the record shows v7; never an older or v6-for-KG one', async () => {
    expect(await addChild('Nia', '9-11', 'notice-v7')).toBe('OK')
    expect((await db.query<{ v: string }>(`select attested_notice_version as v from public.learners where id = '${kid.Nia}'`)).rows[0].v).toBe('notice-v7')
    expect(await addChild('Kai', '3-5', 'notice-v7')).toBe('OK')          // v7 names KG: the new KG child is covered
    expect(await event('Kai')).toBe('OK')
    expect(await addChild('Old', '3-5', 'notice-v6')).toMatch(/does not name this child's grade band/)
    expect(await addChild('Older', '9-11', 'notice-v5')).toMatch(/no parental attestation/)
  })

  it('moving a Grade 3–8 child into KG on a v6 consent is refused', async () => {
    expect(await tryq(`update public.learners set age_group = '3-5' where id = '${kid.Ana}'`)).toMatch(/does not name learner .*grade band/)
  })

  it('a request a child\'s refused write asked for (p_acked => false) records no "I agree"; the app\'s own still does', async () => {
    const ack = async (acked: string, tok: string) => {
      const [{ consent_id }] = (await db.query<{ consent_id: string }>(`select consent_id from public.consent_request(p_parent => '${R}',
        p_notice_version => 'notice-v7', p_privacy_version => 'p', p_terms_version => 't', p_lang => 'en', p_token_hash => '${tok}',
        p_ttl => interval '7 days', p_scope => 'account', p_ack_at => null${acked})`)).rows
      return (await db.query<{ a: string | null }>(`select parent_ack_at::text as a from public.parental_consents where id = '${consent_id}'`)).rows[0].a
    }
    expect(await ack(', p_acked => false', 'tok-noack')).toBeNull()
    expect(await ack('', 'tok-ack'), 'control: without the argument the old behaviour — stamped now').not.toBeNull()
  })

  it('control: a parent answering the SAME notice they already hold is still told "already consented"', async () => {
    expect((await answer(Q, 'notice-v6', 'tok-q6')).r).toBe('already_consented')
  })

  it('the v6 parent answers one notice-v7 email: granted, every child moved onto it, v6 closed, KG and Grade 1 accepted', async () => {
    const { r, consent_id } = await answer(P, 'notice-v7', 'tok-v7')
    expect(r).toBe('granted')
    const rows = (await db.query<{ consent_id: string }>(`select distinct consent_id from public.learners where created_by = '${P}'`)).rows
    expect(rows.map(x => x.consent_id)).toEqual([consent_id])
    expect((await db.query<{ state: string }>(`select state from public.parental_consents where id = '${v6}'`)).rows[0].state).toBe('withdrawn')
    for (const n of ['Kit', 'Gus', 'Ana']) expect(await event(n), n).toBe('OK')
    expect(await tryq(`update public.learners set age_group = '3-5' where id = '${kid.Ana}'`)).toBe('OK')
    const proof = await sql('notice-v7-proof.sql')
    expect(info(proof, 'KG / Grades 1-2 children waiting')).toBe('0')
    expect(info(proof, 'adults who have agreed to notice-v7')).toBe('1')
  })
})

describe('a notice marked reconsent_required: collection stops, and one re-consent recovers it', () => {
  let d: PGlite
  const T = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
  const kids: string[] = []
  let old = ''
  const q = (s: string) => d.query(s).then(() => 'OK', e => (e as Error).message)
  beforeAll(async () => {
    ({ db: d } = await loadSchema())
    await d.exec(`insert into auth.users (id, email, email_confirmed_at) values ('${T}', 't@x.test', now());
      insert into public.profiles (id, role) values ('${T}', 'parent') on conflict (id) do update set role = excluded.role;`)
    old = await grantedConsent(d, T)
    for (const n of ['Ana', 'Ben'])
      kids.push((await d.query<{ id: string }>(`insert into public.learners (display_name, age_group, created_by, consent_id, attested_notice_version)
        values ('${n}', '9-11', '${T}', '${old}', '${FIXTURE_NOTICE}') returning id`)).rows[0].id)
    // A test-only later notice that demands asking again (the mechanism v7 deliberately does NOT use).
    await d.exec(`insert into public.consent_notice_versions (version, seq, reconsent_required, note) values ('notice-test-next', 99, true, 'test')`)
  }, 120_000)

  it('(a) new collection stops', async () => {
    expect(await q(`insert into public.learner_events (learner_id, event, props) values ('${kids[0]}', 'lesson_start', '{}')`)).toMatch(/no granted parental consent/)
  })
  it('(b) re-consent on the new notice: granted, both children moved, the old consent closed, collection resumes', async () => {
    const [{ consent_id: fresh }] = (await d.query<{ consent_id: string }>(`select * from public.consent_request(
      '${T}', 'notice-test-next', 'privacy@x', 'terms@x', 'en', 'tok-next', interval '7 days', 'account', now())`)).rows
    await d.exec(`select public.consent_record_request_sent('${fresh}', 're_b1_next')`)
    const [{ r }] = (await d.query<{ r: string }>(`select public.consent_grant('tok-next', 're_b3_next', now() + interval '1 day') as r`)).rows
    expect(r).toBe('granted')
    expect((await d.query<{ consent_id: string }>(`select consent_id from public.learners where created_by = '${T}'`)).rows.map(x => x.consent_id)).toEqual([fresh, fresh])
    expect((await d.query<{ state: string }>(`select state from public.parental_consents where id = '${old}'`)).rows[0].state).toBe('withdrawn')
    expect(await q(`insert into public.learner_events (learner_id, event, props) values ('${kids[0]}', 'lesson_start', '{}')`)).toBe('OK')
  })
})
