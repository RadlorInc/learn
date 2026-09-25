// @vitest-environment node
/**
 * BUG-02 (docs/review/LATENT-BUGS.md): a stale device must not roll a child's standing back on the account, and must
 * not make the database pay `level_up` again for a climb already paid. Migration 20260926100200.
 *
 * Driven in the repo's REAL schema (baseline + every migration, _schema.ts) as the parent's `authenticated` role — the
 * caller the browser is. Every write carries an explicit answer time, the way the client sends it.
 *
 * The property checked: level / streak / mastered on the account are those of the write with the NEWEST answer time;
 * an older write changes none of them and pays no level_up. Not checked here: clock skew between real devices.
 *
 * ⚠️ The rule is "newest answer wins", NOT "never lower": the ladder lowers a level on purpose (adaptive.ts `step`,
 * worked steps → one level down, mastered false). The demotion test below is what fails a `greatest()` "fix".
 */
import { describe, it, expect, beforeAll } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema, grantedConsent, FIXTURE_NOTICE } from './_schema'

const PARENT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const LESSON = 'g5m1-t1'
let db: PGlite

beforeAll(async () => {
  ({ db } = await loadSchema())
  await db.exec(`insert into auth.users (id, email, email_confirmed_at) values ('${PARENT}', 'p@x.test', now())`)
}, 180_000)

async function kid(name: string) {
  const consent = await grantedConsent(db, PARENT)
  return (await db.query<{ id: string }>(`insert into public.learners (display_name, avatar_index, age_group, created_by, consent_id, attested_notice_version)
    values ('${name}', 0, '9-11', '${PARENT}', '${consent}', '${FIXTURE_NOTICE}') returning id`)).rows[0].id
}

/** One upload, as the parent's browser. `at` = the answer time the device stamped, or null = a bundle that sends none. */
async function send(L: string, level: number, streak: number, mastered: boolean, at: string | null, outcome = 'first') {
  await db.exec(`select set_config('test.uid', '${PARENT}', false)`)
  await db.exec('set role authenticated')
  try {
    const t = at === null ? '' : `, p_answered_at => '${at}'`
    await db.query(`select public.record_lesson_progress(p_learner => '${L}', p_lesson => '${LESSON}', p_done => false,
      p_level => ${level}, p_streak => ${streak}, p_mastered => ${mastered}, p_outcome => '${outcome}', p_event => gen_random_uuid()${t})`)
  } finally { await db.exec('reset role') }
}
const state = async (L: string) => (await db.query<{ level: number; streak: number; mastered: boolean; ups: number }>(`
  select p.level, p.streak, p.mastered,
         (select count(*)::int from public.point_events e where e.learner_id = p.learner_id and e.reason = 'level_up') as ups
    from public.lesson_progress p where p.learner_id = '${L}' and p.lesson_id = '${LESSON}'`)).rows[0]

// Answer times, oldest first. Written out, not computed from the code under test.
const T = (h: number) => `2026-09-20T${String(h).padStart(2, '0')}:00:00Z`

describe('BUG-02 two devices on one child', () => {
  it('POSITIVE CONTROL: one device climbing 0→1→2 is stored at level 2 and paid exactly two level-ups', async () => {
    const L = await kid('Solo')
    await send(L, 0, 1, false, T(1)); await send(L, 1, 0, false, T(2)); await send(L, 1, 1, false, T(3)); await send(L, 2, 0, false, T(4))
    expect(await state(L)).toEqual({ level: 2, streak: 0, mastered: false, ups: 2 })
  })

  it('a stale device (older answer time) does not move the account back, and the climb back is not paid again', async () => {
    const L = await kid('Two')
    // Device A climbs to level 2 and masters, answering at 10:00–12:00.
    await send(L, 1, 0, false, T(10)); await send(L, 2, 0, false, T(11)); await send(L, 2, 0, true, T(12))
    // Device B, offline since 09:00, uploads its level-0 standing now.
    await send(L, 0, 1, false, T(9))
    const afterB = await state(L)
    // Device A answers again from its own standing.
    await send(L, 2, 1, true, T(13))
    const end = await state(L)
    expect({ afterB_level: afterB.level, afterB_mastered: afterB.mastered, end_level: end.level, levelUpsPaid: end.ups })
      .toEqual({ afterB_level: 2, afterB_mastered: true, end_level: 2, levelUpsPaid: 2 })
  })

  it('a NEWER demotion is kept: worked steps at the top level lower the level and un-master, as the ladder says', async () => {
    const L = await kid('Down')
    await send(L, 1, 0, false, T(10)); await send(L, 2, 0, true, T(11))
    await send(L, 1, 0, false, T(12), 'worked')
    expect(await state(L)).toMatchObject({ level: 1, streak: 0, mastered: false, ups: 2 })
  })

  it('a newer upload from the OTHER device still advances the level and pays its level-up', async () => {
    const L = await kid('Swap')
    await send(L, 1, 0, false, T(10))            // device A
    await send(L, 2, 0, false, T(11))            // device B, newer, one level higher
    expect(await state(L)).toMatchObject({ level: 2, ups: 2 })
  })

  it('a device clock in the future is clamped to now, so an honest later answer still wins', async () => {
    const L = await kid('Clock')
    await send(L, 3, 0, false, '2099-01-01T00:00:00Z')
    await send(L, 1, 0, false, new Date(Date.now() + 1000).toISOString())   // honest, a second later than "now" above
    expect((await state(L)).level).toBe(1)
  })

  it('a bundle that sends no answer time behaves exactly as before the fix (the write is taken as of now)', async () => {
    const L = await kid('Old')
    await send(L, 2, 0, false, T(10))
    await send(L, 0, 0, false, null)
    expect((await state(L)).level).toBe(0)
  })
})
