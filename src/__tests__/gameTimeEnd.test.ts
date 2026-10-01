// @vitest-environment node
/**
 * Stopping a game early gives the unused minutes back (migration 20261001180000), in the repo's real schema as the
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
  it('gives back the minutes not played; a started minute counts as played', async () => {
    expect((await rpc(CHILD, `start_game_time('${KID}', 5)`)).balance).toBe(60)
    await elapse(1, 30)                                                   // 1½ minutes in: 2 played, 3 back
    expect(await rpc(CHILD, `end_game_time('${KID}')`)).toEqual({ ok: true, refunded: 24 })
    const w = await wallet()
    expect([w.balance, w.minutes_used_today, w.playing_until]).toEqual([84, 2, null])
  })

  it('stopping when nothing is running gives nothing back', async () => {
    expect(await rpc(CHILD, `end_game_time('${KID}')`)).toEqual({ ok: true, refunded: 0 })
    expect((await wallet()).balance).toBe(84)
  })

  it('stopped at once still costs the first minute — never a free game, never more back than was paid', async () => {
    await rpc(CHILD, `start_game_time('${KID}', 3)`)
    expect(await rpc(PARENT, `end_game_time('${KID}')`)).toEqual({ ok: true, refunded: 16 })   // the parent may stop it too
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
