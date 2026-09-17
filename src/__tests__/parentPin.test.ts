// @vitest-environment node
/**
 * The parent PIN (migration 20260917160000), driven in the repo's real schema (baseline + every migration) as the
 * roles a browser actually has. The properties are all in what a CALLER can and cannot do, so each is asserted by
 * doing it: read the table, guess the PIN, reset it, reach another account's PIN.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema } from './_schema'

const A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
let db: PGlite

beforeAll(async () => {
  ({ db } = await loadSchema())
  await db.exec(`insert into auth.users (id, email, email_confirmed_at) values ('${A}', 'a@x.test', now()), ('${B}', 'b@x.test', now())`)
}, 120_000)

/** Runs one statement as `role` with auth.uid() = uid, and returns its first row's first column (or the error). */
async function as(uid: string | null, sql: string, role = 'authenticated'): Promise<{ v?: unknown; err?: string }> {
  await db.exec(`select set_config('test.uid', '${uid ?? ''}', false)`)
  await db.exec(`set role ${role}`)
  try {
    const r = await db.query<Record<string, unknown>>(sql)
    return { v: r.rows[0] ? Object.values(r.rows[0])[0] : undefined }
  } catch (e) { return { err: (e as Error).message } } finally { await db.exec('reset role') }
}
const rpc = async (uid: string, call: string) => (await as(uid, `select public.${call}`)).v as Record<string, unknown>

describe('parent PIN', () => {
  it('the table is unreachable to a browser: no read, no write, for anon or a signed-in user', async () => {
    expect((await as(A, `select count(*) from public.parent_pins`)).err ?? 'ALLOWED').toMatch(/permission denied/)
    expect((await as(A, `insert into public.parent_pins (account_id, salt, pin_hash) values ('${A}', 's', 'h')`)).err ?? 'ALLOWED').toMatch(/permission denied/)
    expect((await as(null, `select public.parent_pin_status()`, 'anon')).err ?? 'ALLOWED').toMatch(/permission denied/)
    expect((await as(null, `select public.verify_parent_pin('1234')`, 'anon')).err ?? 'ALLOWED').toMatch(/permission denied/)
    // Positive control: the same role CAN call the function, so the refusals above are about the table, not the harness.
    expect(await rpc(A, `parent_pin_status()`)).toEqual({ state: 'none' })
  })

  it('sets a PIN, stores no plain PIN, and checks it', async () => {
    expect(await rpc(A, `set_parent_pin('4827')`)).toEqual({ ok: true })
    const stored = (await db.query<{ pin_hash: string }>(`select pin_hash from public.parent_pins where account_id = '${A}'`)).rows[0]
    expect(stored.pin_hash).toMatch(/^[0-9a-f]{64}$/)
    expect(stored.pin_hash).not.toContain('4827')
    expect(await rpc(A, `verify_parent_pin('4827')`)).toEqual({ ok: true, reset_cancelled: false })
    expect(await rpc(A, `set_parent_pin('12a4')`)).toEqual({ ok: false, error: 'bad_pin' })
  })

  it('one account never touches another account\'s PIN', async () => {
    expect(await rpc(B, `parent_pin_status()`)).toEqual({ state: 'none' })
    expect(await rpc(B, `verify_parent_pin('4827')`)).toEqual({ ok: false, error: 'no_pin' })
  })

  it('changing the PIN needs the current one', async () => {
    expect((await rpc(A, `set_parent_pin('1111', '0000')`)).ok).toBe(false)
    expect(await rpc(A, `set_parent_pin('1111', '4827')`)).toEqual({ ok: true })
    expect((await rpc(A, `verify_parent_pin('4827')`)).ok).toBe(false)
    expect((await rpc(A, `verify_parent_pin('1111')`)).ok).toBe(true)   // also clears the one wrong try above
  })

  it('five wrong tries lock it — even the right PIN is refused while locked — and the next lock is twice as long', async () => {
    const tries = []
    for (const p of ['0001', '0002', '0003', '0004']) tries.push((await rpc(A, `verify_parent_pin('${p}')`)).tries_left)
    expect(tries).toEqual([4, 3, 2, 1])
    const fifth = await rpc(A, `verify_parent_pin('0005')`)
    expect([fifth.ok, fifth.error, fifth.tries_left]).toEqual([false, 'locked', 0])
    expect((await rpc(A, `verify_parent_pin('1111')`)).error).toBe('locked')
    const mins = async () => Number((await db.query<{ m: number }>(`select round(extract(epoch from locked_until - now()) / 60) as m from public.parent_pins where account_id = '${A}'`)).rows[0].m)
    expect(await mins()).toBe(15)

    await db.exec(`update public.parent_pins set locked_until = now() - interval '1 second' where account_id = '${A}'`)   // time passes
    for (const p of ['0001', '0002', '0003', '0004', '0005']) await rpc(A, `verify_parent_pin('${p}')`)
    expect(await mins()).toBe(30)

    await db.exec(`update public.parent_pins set locked_until = now() - interval '1 second' where account_id = '${A}'`)
    expect((await rpc(A, `verify_parent_pin('1111')`)).ok).toBe(true)
  })

  it('"forgot PIN" removes nothing at once; the right PIN cancels it; after 24 hours the PIN is gone', async () => {
    expect((await rpc(A, `request_parent_pin_reset()`)).ok).toBe(true)
    expect((await rpc(A, `parent_pin_status()`)).state).toBe('set')              // a child who just signed in gains nothing
    expect(await rpc(A, `verify_parent_pin('1111')`)).toEqual({ ok: true, reset_cancelled: true })

    await rpc(A, `request_parent_pin_reset()`)
    await db.exec(`update public.parent_pins set reset_requested_at = now() - interval '25 hours' where account_id = '${A}'`)
    expect(await rpc(A, `parent_pin_status()`)).toEqual({ state: 'none' })
    expect(await rpc(A, `set_parent_pin('2468')`)).toEqual({ ok: true })
  })

  it('goes when the account goes', async () => {
    await db.exec(`delete from auth.users where id = '${A}'`)
    expect(Number((await db.query<{ n: number }>(`select count(*)::int as n from public.parent_pins where account_id = '${A}'`)).rows[0].n)).toBe(0)
  })
})
