// @vitest-environment node
/**
 * RE-CONSENT AFTER A MATERIAL NOTICE CHANGE (consent-once, founder's item 4).
 *
 * Marking a notice version `reconsent_required` must (a) stop new collection for every child whose consent predates
 * it, and (b) be recoverable: the parent answers a fresh B1, the grant carries every child onto the new consent, and
 * the old one is closed. The first version of the migration failed (b) — the gate re-read the stored row mid-update and
 * rolled the grant back, freezing every parent with children for ever (found by the suite's probe, 2026-09-24).
 */
import { describe, it, expect, beforeAll } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema, grantedConsent, FIXTURE_NOTICE } from './_schema'

const P = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
let db: PGlite
const kids: string[] = []
let oldConsent = ''

const tryq = (sql: string) => db.query(sql).then(() => 'OK', e => (e as Error).message)

beforeAll(async () => {
  ({ db } = await loadSchema())
  await db.exec(`insert into auth.users (id, email, email_confirmed_at) values ('${P}', 'p@x.test', now());
    insert into public.profiles (id, role) values ('${P}', 'parent') on conflict (id) do update set role = excluded.role;`)
  oldConsent = await grantedConsent(db, P)
  for (const n of ['Ana', 'Ben'])
    kids.push((await db.query<{ id: string }>(`insert into public.learners (display_name, age_group, created_by, consent_id, attested_notice_version)
      values ('${n}', '9-11', '${P}', '${oldConsent}', '${FIXTURE_NOTICE}') returning id`)).rows[0].id)
  // A material change: every consent to an older version stops counting.
  await db.exec(`update public.consent_notice_versions set reconsent_required = true where version = 'notice-v5'`)
}, 120_000)

describe('re-consent after a material notice change', () => {
  it('(a) new collection stops: child data, a changed child and a new child are all refused', async () => {
    expect(await tryq(`insert into public.learner_events (learner_id, event, props) values ('${kids[0]}', 'lesson_start', '{}')`))
      .toMatch(/no granted parental consent/)
    expect(await tryq(`update public.learners set display_name = 'Anna' where id = '${kids[0]}'`)).toMatch(/no granted parental consent/)
    expect(await tryq(`insert into public.learners (display_name, age_group, created_by, consent_id, attested_notice_version)
      values ('Cy', '9-11', '${P}', '${oldConsent}', '${FIXTURE_NOTICE}')`)).toMatch(/no granted parental consent for this account/)
  })

  it('(b) the parent re-consents: the grant succeeds, both children move onto it, the old consent closes', async () => {
    const [{ consent_id: fresh }] = (await db.query<{ consent_id: string }>(`select * from public.consent_request(
      '${P}', 'notice-v5', 'privacy@dark#x', 'terms@dark#x', 'en', 'tok-reconsent', interval '7 days', 'account', now())`)).rows
    await db.exec(`select public.consent_record_request_sent('${fresh}', 're_b1_new')`)
    const [{ r }] = (await db.query<{ r: string }>(`select public.consent_grant('tok-reconsent', 're_b3_new', now() + interval '1 day') as r`)).rows
    expect(r).toBe('granted')

    const rows = (await db.query<{ consent_id: string }>(`select consent_id from public.learners where created_by = '${P}' order by display_name`)).rows
    expect(rows.map(x => x.consent_id)).toEqual([fresh, fresh])
    const [{ state }] = (await db.query<{ state: string }>(`select state from public.parental_consents where id = '${oldConsent}'`)).rows
    expect(state).toBe('withdrawn')
    // …and collection resumes for the children the parent kept.
    expect(await tryq(`insert into public.learner_events (learner_id, event, props) values ('${kids[0]}', 'lesson_start', '{}')`)).toBe('OK')
  })
})
