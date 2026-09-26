// @vitest-environment node
/**
 * SEC-16 (docs/review/SECURITY-AUDIT.md) — `is_chapter_entitled` / `entitled_chapters` answer only a caller who has
 * access to that learner.
 *
 * Property checked: a signed-in account with NO `learner_access` row for a learner is refused (42501) by both
 * functions; the owner, the child's own 'self' login and service_role still get a boolean answer; and the
 * `learner_progress` WITH CHECK, which calls `is_chapter_entitled`, still admits the owner's own write.
 * Built on the real schema (baseline + every migration) in PGlite — nothing retyped.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema, grantedConsent, FIXTURE_NOTICE } from './_schema'

const OWNER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const CHILD = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'     // the child's own login (access_role 'self')
const STRANGER = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'  // signed in, no link to the learner
let db: PGlite
let learner: string

async function as(role: 'authenticated' | 'service_role', uid: string | null, sql: string): Promise<{ rows?: Record<string, unknown>[]; code?: string }> {
  await db.exec(`select set_config('test.uid', '${uid ?? ''}', false)`)
  await db.exec(`set role ${role}`)
  try { return { rows: (await db.query<Record<string, unknown>>(sql)).rows } }
  catch (e) { return { code: (e as { code?: string }).code ?? (e as Error).message } }
  finally { await db.exec('reset role') }
}
const one = (learnerId: string) => `select public.is_chapter_entitled('${learnerId}', 'g3m1') as v`
const many = (learnerId: string) => `select public.entitled_chapters('${learnerId}', array['g3m1']) as v`

beforeAll(async () => {
  ({ db } = await loadSchema())
  await db.exec(`insert into auth.users (id, email, email_confirmed_at) values
    ('${OWNER}', 'o@x.test', now()), ('${CHILD}', 'kid@x.test', now()), ('${STRANGER}', 's@x.test', now())`)
  const consent = await grantedConsent(db, OWNER)
  ;[{ id: learner }] = (await db.query<{ id: string }>(`insert into public.learners (display_name, avatar_index, age_group, created_by, consent_id, attested_notice_version)
    values ('Kid', 0, '6-8', '${OWNER}', '${consent}', '${FIXTURE_NOTICE}') returning id`)).rows
  await db.exec(`insert into public.learner_access (learner_id, parent_id, access_role) values
    ('${learner}', '${OWNER}', 'owner'), ('${learner}', '${CHILD}', 'self') on conflict do nothing`)
}, 120_000)

describe('a stranger is refused', () => {
  it('is_chapter_entitled: 42501, no answer', async () => {
    expect(await as('authenticated', STRANGER, one(learner))).toEqual({ code: '42501' })
  })
  it('entitled_chapters: 42501, no answer', async () => {
    expect(await as('authenticated', STRANGER, many(learner))).toEqual({ code: '42501' })
  })
})

describe('every legitimate caller still gets its answer (paired GRANT half)', () => {
  for (const [who, role, uid] of [['owner', 'authenticated', OWNER], ['the child\'s own login', 'authenticated', CHILD], ['service_role (no uid)', 'service_role', null]] as const) {
    it(`${who}: is_chapter_entitled returns a boolean`, async () => {
      const r = await as(role, uid, one(learner))
      expect(r.code).toBeUndefined()
      expect(typeof r.rows?.[0].v).toBe('boolean')
    })
    it(`${who}: entitled_chapters returns { g3m1: boolean }`, async () => {
      const r = await as(role, uid, many(learner))
      expect(r.code).toBeUndefined()
      expect(Object.keys(r.rows?.[0].v as object)).toEqual(['g3m1'])
      expect(typeof (r.rows?.[0].v as Record<string, unknown>).g3m1).toBe('boolean')
    })
  }
  it('the learner_progress WITH CHECK (which calls is_chapter_entitled) still admits the owner', async () => {
    const [{ id: chapter }] = (await db.query<{ id: string }>(`select id from public.chapters order by id limit 1`)).rows
    const r = await as('authenticated', OWNER, `insert into public.learner_progress (learner_id, chapter) values ('${learner}', '${chapter}') returning learner_id`)
    expect(r).toEqual({ rows: [{ learner_id: learner }] })
  })
})
