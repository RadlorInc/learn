// @vitest-environment node
/**
 * /admin activation (N8) — `admin_activation()` on the REAL schema (baseline + every migration), with every
 * expected value worked out BY HAND in the comments below, never by running the query under test.
 *
 * What this file must prove, and why each:
 *   · the number can take MORE THAN ONE value — a metric that can only return one is decoration (CLAUDE.md);
 *   · "activated" survives a child who KEPT GOING past day 7 (lesson_progress.updated_at is the LAST touch);
 *   · a real 0 comes back as 0 and a below-floor cohort as NULL — "nothing" and "withheld" must differ;
 *   · a non-admin is refused, AND the real caller role (`authenticated`) can execute it while `anon` cannot.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema, grantedConsent, FIXTURE_NOTICE } from './_schema'

const ADMIN = '0000aaaa-0000-4000-8000-000000000001'
const P = (n: number) => `0000a${String(n).padStart(3, '0')}-0000-4000-8000-000000000000`
const L = (n: number) => `0000b${String(n).padStart(3, '0')}-0000-4000-8000-000000000000`

/**
 * ── THE FIXTURE. T = signup of every eligible account = now() − 20 days (one cohort week). ──────────────
 *
 *  acct  who               child created   lesson_progress.updated_at   point_events            added  activated
 *  ────  ────────────────  ─────────────   ──────────────────────────   ─────────────────────   ─────  ─────────
 *  P1    role NULL         —               —                             —                       no     no
 *  P2    parent            T+1d            —                             —                       YES    no
 *  P3    parent            T+1d            T+2d                          —                       YES    YES
 *  P4    parent            T+1d            T+10d (kept going)            problem at T+2d         YES    YES  ← point_events clause
 *  P5    parent            T+1d            T+9d                          problem at T+9d         YES    no   (too late)
 *  P6    parent            T+8d (late)     T+9d                          —                       no     no
 *  P7    parent            T+1d            T+12d                         GAME at T+2d only       YES    no   (game is not lesson work)
 *  P8    parent, INTERNAL  T+1d            T+2d                          —                       excluded
 *  P9    TEACHER           T+1d            T+2d                          —                       excluded
 *  P11   role 'learner' (a child login's profile), signed up T          →  excluded
 *  P10   parent, signed up now()−2d, child + lesson work               → too_new, not eligible
 *  ADMIN internal
 *  (P1 keeps the NULL role handle_new_user gives every new profile — measured; P2..P8, P10 are set to 'parent'.)
 *
 *  BY HAND: eligible = P1..P7 = 7 · added = P2,P3,P4,P5,P7 = 5 · activated = P3,P4 = 2 · too_new = P10 = 1
 */
const T = `(now() - interval '20 days')`

let db: PGlite
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const run = async (min = 1): Promise<any> =>
  (await db.query<{ v: unknown }>(`select public.admin_activation(${min}) as v`)).rows[0].v
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const totals = (v: any) => {
  const sum = (k: string) => v.cohorts.reduce((t: number, c: Record<string, number | null>) => t + (c[k] ?? 0), 0)
  return { eligible: sum('eligible'), added: sum('added'), activated: sum('activated'), too_new: sum('too_new') }
}

async function account(id: string, signup: string, opts: { internal?: boolean; role?: string } = {}) {
  await db.exec(`insert into auth.users (id, email, email_confirmed_at) values ('${id}', '${id}@x.test', now())`)
  await db.exec(`update public.profiles set created_at = ${signup}, is_internal = ${!!opts.internal}
                 ${opts.role ? `, role = '${opts.role}'` : ''} where id = '${id}'`)
}
async function child(parent: string, id: string, created: string) {
  const consent = await grantedConsent(db, parent)
  await db.exec(`insert into public.learners (id, display_name, created_by, age_group, consent_id, attested_notice_version)
                 values ('${id}', 'Kid', '${parent}', '3-5', '${consent}', '${FIXTURE_NOTICE}');
                 update public.learners set created_at = ${created} where id = '${id}'`)
}
const progress = (l: string, at: string, lesson = 'g3m2-t1') =>
  db.exec(`insert into public.lesson_progress (learner_id, lesson_id, done, updated_at) values ('${l}', '${lesson}', false, ${at})`)
const points = (l: string, reason: string, at: string) =>
  db.exec(`insert into public.point_events (learner_id, reason, lesson_id, points, created_at)
           values ('${l}', '${reason}', ${reason === 'game' ? 'null' : `'g3m2-t1'`}, ${reason === 'game' ? -10 : 2}, ${at})`)

beforeAll(async () => {
  ;({ db } = await loadSchema())
  await account(ADMIN, T, { internal: true })
  await db.exec(`insert into public.admin_users (user_id) values ('${ADMIN}')`)
  await account(P(1), T)
  for (let n = 2; n <= 7; n++) await account(P(n), T, { role: 'parent' })
  await account(P(8), T, { internal: true, role: 'parent' })
  await account(P(9), T, { role: 'teacher' })
  await account(P(11), T, { role: 'learner' })
  await account(P(10), `(now() - interval '2 days')`, { role: 'parent' })

  await child(P(2), L(2), `${T} + interval '1 day'`)
  await child(P(3), L(3), `${T} + interval '1 day'`); await progress(L(3), `${T} + interval '2 days'`)
  await child(P(4), L(4), `${T} + interval '1 day'`); await progress(L(4), `${T} + interval '10 days'`)
  await points(L(4), 'problem', `${T} + interval '2 days'`)
  await child(P(5), L(5), `${T} + interval '1 day'`); await progress(L(5), `${T} + interval '9 days'`)
  await points(L(5), 'problem', `${T} + interval '9 days'`)
  await child(P(6), L(6), `${T} + interval '8 days'`); await progress(L(6), `${T} + interval '9 days'`)
  await child(P(7), L(7), `${T} + interval '1 day'`); await progress(L(7), `${T} + interval '12 days'`)
  await points(L(7), 'game', `${T} + interval '2 days'`)
  await child(P(8), L(8), `${T} + interval '1 day'`); await progress(L(8), `${T} + interval '2 days'`)
  await child(P(9), L(9), `${T} + interval '1 day'`); await progress(L(9), `${T} + interval '2 days'`)
  await child(P(10), L(10), `(now() - interval '1 day')`); await progress(L(10), `now()`)

  await db.exec(`select set_config('test.uid', '${ADMIN}', false)`)
}, 120_000)

describe('admin_activation — values worked out by hand', () => {
  it('fixture A: eligible 7, added 5, activated 2, too new 1', async () => {
    const v = await run(1)
    expect(totals(v)).toEqual({ eligible: 7, added: 5, activated: 2, too_new: 1 })
    // P1..P7 share ONE signup week, so exactly one cohort carries the eligible accounts.
    expect(v.cohorts.filter((c: { eligible: number }) => c.eligible > 0)).toHaveLength(1)
  })

  it('fixture B: a different world gives a different number (the metric is not one-valued)', async () => {
    // P2's child now does lesson work on day 3 → activated 2 → 3; nothing else moves.
    await progress(L(2), `${T} + interval '3 days'`)
    expect(totals(await run(1))).toEqual({ eligible: 7, added: 5, activated: 3, too_new: 1 })
    await db.exec(`delete from public.lesson_progress where learner_id = '${L(2)}'`)
    expect(totals(await run(1)).activated).toBe(2)
  })

  it('a real 0 is 0, and a cohort below the floor is withheld (NULL) — the two never look alike', async () => {
    await db.exec(`update public.lesson_progress set updated_at = ${T} + interval '30 days' where learner_id in ('${L(3)}','${L(4)}');
                   update public.point_events set created_at = ${T} + interval '30 days' where learner_id = '${L(4)}'`)
    const zero = (await run(7)).cohorts.find((c: { eligible: number }) => c.eligible === 7)
    expect(zero.activated).toBe(0)          // eligible 7 >= floor 7: shown, and it is 0
    expect(zero.added).toBe(5)
    const hidden = (await run(8)).cohorts.find((c: { eligible: number }) => c.eligible === 7)
    expect(hidden.activated).toBeNull()     // eligible 7 < floor 8: withheld
    expect(hidden.added).toBeNull()
    await db.exec(`update public.lesson_progress set updated_at = case learner_id when '${L(3)}' then ${T} + interval '2 days'
                     else ${T} + interval '10 days' end where learner_id in ('${L(3)}','${L(4)}');
                   update public.point_events set created_at = ${T} + interval '2 days' where learner_id = '${L(4)}'`)
    expect(totals(await run(1)).activated).toBe(2)
  })
})

describe('admin_activation — who may call it', () => {
  it('a signed-in NON-admin is refused with 42501; the admin (positive control) is served', async () => {
    await db.exec(`select set_config('test.uid', '${P(1)}', false)`)
    await expect(run(1)).rejects.toThrow(/not an administrator/)
    await db.exec(`select set_config('test.uid', '${ADMIN}', false)`)
    expect(totals(await run(1)).eligible).toBe(7)
  })

  it('as the REAL caller role: authenticated (admin) is served, anon is refused EXECUTE', async () => {
    await db.exec(`set role authenticated`)
    try { expect(totals(await run(1)).eligible).toBe(7) } finally { await db.exec(`reset role`) }
    await db.exec(`set role anon`)
    try { await expect(run(1)).rejects.toThrow(/permission denied/) } finally { await db.exec(`reset role`) }
  })
})

describe('the page invariant (runs in the browser on every load)', () => {
  it('passes on the real payload and flags activated > added', async () => {
    const { checkActivation } = await import('@/features/admin/invariants')
    expect(checkActivation(await run(1))).toEqual([])
    expect(checkActivation({ cohorts: [{ cohort_week: 'w', eligible: 5, added: 2, activated: 3 }] }).map(v => v.id)).toEqual(['A2'])
    expect(checkActivation({ cohorts: [{ cohort_week: 'w', eligible: 5, added: 6, activated: 1 }] }).map(v => v.id)).toEqual(['A1'])
  })
})
