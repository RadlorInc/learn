// @vitest-environment node
/**
 * Stopping a game early charges only the time played (migrations 20261001180000, 20261001190000), and "Paused" stops the
 * paid clock (20261017120000), in the repo's real schema as the
 * roles a browser has. Each refusal has its positive twin: "a stranger cannot stop it" and "nobody can" are the same
 * green otherwise.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema, grantedConsent, FIXTURE_NOTICE } from './_schema'

const PARENT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const CHILD = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const OTHER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const KID = '11111111-1111-4111-8111-111111111111'
let db: PGlite

beforeAll(async () => {
  ({ db } = await loadSchema())
  await db.exec(`insert into auth.users (id, email, email_confirmed_at) values
      ('${PARENT}', 'p@x.test', now()), ('${CHILD}', 'kid@learner.adaptivelearn.invalid', now()), ('${OTHER}', 'o@x.test', now())`)
  const consent = await grantedConsent(db, PARENT)
  await db.exec(`
    insert into public.learners (id, display_name, created_by, age_group, consent_id, attested_notice_version) values ('${KID}', 'Kid', '${PARENT}', '3-5', '${consent}', '${FIXTURE_NOTICE}');
    insert into public.learner_access (learner_id, parent_id, access_role) values ('${KID}', '${CHILD}', 'self');
    insert into public.point_events (learner_id, reason, points) values ('${KID}', 'problem', 100);`)
}, 120_000)

async function as(uid: string, sql: string): Promise<{ v?: Record<string, unknown>; err?: string }> {
  await db.exec(`select set_config('test.uid', '${uid}', false)`)
  await db.exec('set role authenticated')
  try { return { v: Object.values((await db.query<Record<string, unknown>>(sql)).rows[0])[0] as Record<string, unknown> } }
  catch (e) { return { err: (e as Error).message } } finally { await db.exec('reset role') }
}
const rpc = async (uid: string, call: string) => { const r = await as(uid, `select public.${call}`); if (r.err) throw new Error(r.err); return r.v! }
const wallet = () => rpc(CHILD, `game_wallet('${KID}')`)
/** Pretend `m` minutes and `s` seconds of the running game have gone by. */
const elapse = (m: number, s = 0) => db.exec(`update public.point_events set ends_at = ends_at - interval '${m} minutes ${s} seconds' where reason = 'game' and ends_at > now()`)

describe('stopping a game early', () => {
  it('charges the seconds played (1 point per 7.5 s, up to a whole point); the daily limit counts a started minute', async () => {
    expect((await rpc(CHILD, `start_game_time('${KID}', 5)`)).balance).toBe(60)
    await elapse(1, 28)                                                   // 88 s (+ the test's own ms) = 11.7 → 12 of 40: 28 back
    expect(await rpc(CHILD, `end_game_time('${KID}')`)).toEqual({ ok: true, refunded: 28 })
    const w = await wallet()
    expect([w.balance, w.minutes_used_today, w.playing_until]).toEqual([88, 2, null])
  })

  it('the founder\'s case: 2 minutes bought, stopped at 1:17 — 11 points paid, 5 back (it was 0)', async () => {
    await rpc(CHILD, `start_game_time('${KID}', 2)`)
    await elapse(1, 17)                                                   // 77 s × 8/60 = 10.3 → 11
    expect(await rpc(CHILD, `end_game_time('${KID}')`)).toEqual({ ok: true, refunded: 5 })
    expect((await wallet()).balance).toBe(77)
  })

  it('stopping when nothing is running gives nothing back', async () => {
    expect(await rpc(CHILD, `end_game_time('${KID}')`)).toEqual({ ok: true, refunded: 0 })
    expect((await wallet()).balance).toBe(77)
  })

  it('stopped at once still costs 1 point — never a free game, never more back than was paid', async () => {
    await rpc(CHILD, `start_game_time('${KID}', 3)`)
    expect(await rpc(PARENT, `end_game_time('${KID}')`)).toEqual({ ok: true, refunded: 23 })   // the parent may stop it too
    expect((await wallet()).balance).toBe(76)
    expect(await rpc(CHILD, `end_game_time('${KID}')`)).toEqual({ ok: true, refunded: 0 })     // a second stop: nothing
  })

  it('another family cannot stop it, and a stranger\'s call changes nothing', async () => {
    await rpc(CHILD, `start_game_time('${KID}', 2)`)
    expect((await as(OTHER, `select public.end_game_time('${KID}')`)).err ?? 'ALLOWED').toMatch(/forbidden/)
    expect((await wallet()).playing_until).not.toBeNull()
    expect((await rpc(CHILD, `end_game_time('${KID}')`)).ok).toBe(true)
  })

  it('anon cannot call it at all', async () => {
    await db.exec('set role anon')
    try { await expect(db.query(`select public.end_game_time('${KID}')`)).rejects.toThrow(/permission denied/) }
    finally { await db.exec('reset role') }
  })
})

/** The running or paused ticket, as stored. */
const ticket = async () => (await db.query<{ ends_in: number; paused_left_s: number | null; points: number; minutes: number }>(
  `select extract(epoch from ends_at - now())::float8 as ends_in, paused_left_s, points, minutes from public.point_events
    where learner_id = '${KID}' and reason = 'game' order by created_at desc, ends_at desc limit 1`)).rows[0]

describe('"Paused" really pauses the paid game time', () => {
  it('pause: the wallet shows it paused with the seconds it had left, and nothing is running', async () => {
    await rpc(CHILD, `start_game_time('${KID}', 3)`)                      // 180 s
    await elapse(1, 0)                                                    // 120 s left (less the test's own ms)
    const w = await rpc(CHILD, `pause_game_time('${KID}')`)
    expect([w.paused_left, w.playing_until]).toEqual([120, null])
    expect((await wallet()).paused_left).toBe(120)
    expect((await ticket()).paused_left_s).toBe(120)
  })

  it('time standing still while paused costs nothing: the paused seconds do not shrink', async () => {
    await db.exec(`update public.point_events set ends_at = ends_at - interval '10 minutes' where paused_left_s is not null`)   // paused 10 min ago
    expect((await wallet()).paused_left).toBe(120)
    expect((await rpc(CHILD, `pause_game_time('${KID}')`)).paused_left).toBe(120)                                               // a second pause: no change
  })

  it('resume: running again with exactly the seconds it had left (ends_at moved on by the pause)', async () => {
    const w = await rpc(CHILD, `resume_game_time('${KID}')`)
    expect(w.paused_left).toBeNull()
    expect(Date.parse(w.playing_until as string) - Date.now()).toBeGreaterThan(118_000)
    expect(Date.parse(w.playing_until as string) - Date.now()).toBeLessThanOrEqual(120_000)
    const t = await ticket()
    expect([t.paused_left_s, Math.round(t.ends_in)]).toEqual([null, 120])
    expect((await rpc(CHILD, `resume_game_time('${KID}')`)).paused_left).toBeNull()   // a second resume: no change
  })

  it('stopping while paused refunds by the seconds played, not by the time the pause lasted', async () => {
    await elapse(0, 30)                                                   // 60 s before the pause + 30 s after: 90 s left
    await rpc(CHILD, `pause_game_time('${KID}')`)
    await db.exec(`update public.point_events set ends_at = ends_at - interval '1 hour' where paused_left_s is not null`)   // left paused an hour
    const before = (await wallet()).balance as number
    // 3 minutes = 24 points; 90 s played = 12 points; 12 back
    expect(await rpc(CHILD, `end_game_time('${KID}')`)).toEqual({ ok: true, refunded: 12 })
    const w = await wallet()
    expect([w.balance, w.paused_left, w.playing_until]).toEqual([before + 12, null, null])
    const t = await ticket()
    expect([t.points, t.minutes, t.paused_left_s]).toEqual([-12, 2, null])
  })

  it('starting while paused resumes the same ticket: no new charge, no second row', async () => {
    await rpc(CHILD, `start_game_time('${KID}', 2)`)
    await rpc(CHILD, `pause_game_time('${KID}')`)
    const before = (await wallet()).balance as number
    const rows = async () => (await db.query<{ n: number }>(`select count(*)::int as n from public.point_events where learner_id = '${KID}' and reason = 'game'`)).rows[0].n
    const n = await rows()
    const r = await rpc(CHILD, `start_game_time('${KID}', 5)`)
    expect([r.ok, r.balance]).toEqual([true, before])
    expect(r.playing_until).not.toBeNull()
    expect(await rows()).toBe(n)
    expect((await wallet()).paused_left).toBeNull()
    await rpc(CHILD, `end_game_time('${KID}')`)
  })

  it('another family cannot pause or resume it (42501), and their call changes nothing; this child\'s adult can', async () => {
    await rpc(CHILD, `start_game_time('${KID}', 2)`)
    expect((await as(OTHER, `select public.pause_game_time('${KID}')`)).err ?? 'ALLOWED').toMatch(/forbidden/)
    expect((await wallet()).playing_until).not.toBeNull()
    expect((await rpc(PARENT, `pause_game_time('${KID}')`)).paused_left).toBeGreaterThan(0)
    expect((await as(OTHER, `select public.resume_game_time('${KID}')`)).err ?? 'ALLOWED').toMatch(/forbidden/)
    expect((await wallet()).paused_left).toBeGreaterThan(0)
    expect((await rpc(PARENT, `resume_game_time('${KID}')`)).playing_until).not.toBeNull()
    await rpc(CHILD, `end_game_time('${KID}')`)
  })

  it('anon cannot call pause or resume at all', async () => {
    for (const f of ['pause_game_time', 'resume_game_time']) {
      await db.exec('set role anon')
      try { await expect(db.query(`select public.${f}('${KID}')`)).rejects.toThrow(/permission denied/) }
      finally { await db.exec('reset role') }
    }
  })
})
