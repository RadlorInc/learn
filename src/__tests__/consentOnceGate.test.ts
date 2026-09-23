// @vitest-environment node
/**
 * CONSENT-ONCE IN THE DATABASE (20260924100000), DRIVEN AS THE REAL CALLER — `authenticated`, with the
 * parent's id — on the repo's real schema (`_schema.ts`). What the app now relies on:
 *   · a new child needs a granted, CURRENT, ACCOUNT consent of its creator AND the attestation's notice
 *     version; the database stamps who/when/how;
 *   · `withdraw_my_consent` deletes every child the parent created, keeps the consent row as withdrawn,
 *     queues its future B3, leaves every other family alone, and is harmless the second time.
 * ⚠️ Every refusal is paired with the same insert succeeding once the one thing is fixed, so "nobody can
 * create a child" cannot read as the same green as "only a consented, attesting parent can".
 */
import { describe, it, expect, beforeAll } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema, grantedConsent, FIXTURE_NOTICE } from './_schema'

const A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const C = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
let db: PGlite

async function as(uid: string, sql: string): Promise<{ rows?: Record<string, unknown>[]; err?: string }> {
  await db.exec(`select set_config('test.uid', '${uid}', false)`)
  await db.exec('set role authenticated')
  try { return { rows: (await db.query<Record<string, unknown>>(sql)).rows } } catch (e) { return { err: (e as Error).message } } finally { await db.exec('reset role') }
}
const addChild = (uid: string, consent: string, attested: string | null, name = 'Kid') =>
  as(uid, `insert into public.learners (display_name, avatar_index, age_group, created_by, consent_id, attested_notice_version)
           values ('${name}', 0, '9-11', '${uid}', '${consent}', ${attested === null ? 'null' : `'${attested}'`})`)
const count = async (sql: string) => Number((await db.query<{ n: number }>(sql)).rows[0].n)
/** A consent of `parent` that went pending → `state` (the only way the state guard lets it get there). */
async function endedConsent(parent: string, state: 'expired' | 'declined'): Promise<string> {
  const { rows } = await db.query<{ id: string }>(`insert into public.parental_consents
      (parent_id, method, state, notice_version, privacy_version, terms_version, email_address, token_hash, expires_at, scope)
    values ('${parent}', 'email_plus', 'pending', '${FIXTURE_NOTICE}', 'p', 't', 'x@x.test', md5(random()::text), now() + interval '1 day', 'account')
    returning id`)
  await db.exec(`update public.parental_consents set state = '${state}'${state === 'declined' ? ', declined_at = now()' : ''} where id = '${rows[0].id}'`)
  return rows[0].id
}

beforeAll(async () => {
  ({ db } = await loadSchema())
  await db.exec(`insert into auth.users (id, email, email_confirmed_at) values ('${A}', 'a@x.test', now()), ('${B}', 'b@x.test', now()), ('${C}', 'c@x.test', now());
    insert into public.profiles (id, role) values ('${A}', 'parent'), ('${B}', 'parent'), ('${C}', 'parent')
      on conflict (id) do update set role = excluded.role;`)
}, 120_000)

describe('creating a child', () => {
  it('is refused WITHOUT the attestation, and allowed with it — stamped by the database', async () => {
    const acct = await grantedConsent(db, A)
    const refused = await addChild(A, acct, null, 'NoTick')
    expect(refused.err ?? 'ALLOWED').toMatch(/no parental attestation/)
    const wrong = await addChild(A, acct, 'notice-v5-not-the-one-agreed', 'WrongNotice')
    expect(wrong.err ?? 'ALLOWED').toMatch(/no parental attestation/)

    const ok = await addChild(A, acct, FIXTURE_NOTICE, 'Ana')
    expect(ok.err).toBeUndefined()
    const [row] = (await db.query<Record<string, unknown>>(`select attested_by, attested_notice_version, attestation_method, attested_at is not null as has_time
      from public.learners where display_name = 'Ana'`)).rows
    expect(row).toEqual({ attested_by: A, attested_notice_version: FIXTURE_NOTICE, attestation_method: 'checkbox', has_time: true })
  })

  it('is refused under a WITHDRAWN account consent (the twin: the same parent\'s granted one works)', async () => {
    const c = await grantedConsent(db, B)
    await db.exec(`update public.parental_consents set state = 'withdrawn', withdrawn_at = now() where id = '${c}'`)
    expect((await addChild(B, c, FIXTURE_NOTICE)).err ?? 'ALLOWED').toMatch(/no granted parental consent/)
    expect((await addChild(B, await grantedConsent(db, B), FIXTURE_NOTICE, 'Bo')).err).toBeUndefined()
  })

  it('is refused under an EXPIRED (or declined) account consent', async () => {
    for (const state of ['expired', 'declined'] as const) {
      expect((await addChild(C, await endedConsent(C, state), FIXTURE_NOTICE)).err ?? 'ALLOWED', state).toMatch(/no granted parental consent/)
    }
  })

  it('is refused under a per-child (legacy) consent and under another parent\'s account consent', async () => {
    expect((await addChild(C, await grantedConsent(db, C, 'child'), FIXTURE_NOTICE)).err ?? 'ALLOWED').toMatch(/no granted parental consent/)
    expect((await addChild(C, await grantedConsent(db, A), FIXTURE_NOTICE)).err ?? 'ALLOWED').toMatch(/no granted parental consent|row-level security/)
  })
})

describe('withdraw_my_consent', () => {
  it('deletes every child of the parent, keeps the consent withdrawn, queues its B3, spares other families; a second call is harmless', async () => {
    const W = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', O = 'ffffffff-ffff-4fff-8fff-ffffffffffff'
    await db.exec(`insert into auth.users (id, email, email_confirmed_at) values ('${W}', 'w@x.test', now()), ('${O}', 'o@x.test', now());
      insert into public.profiles (id, role) values ('${W}', 'parent'), ('${O}', 'parent') on conflict (id) do update set role = excluded.role;`)
    const wc = await grantedConsent(db, W), oc = await grantedConsent(db, O)
    for (const n of ['W1', 'W2']) expect((await addChild(W, wc, FIXTURE_NOTICE, n)).err).toBeUndefined()
    expect((await addChild(O, oc, FIXTURE_NOTICE, 'Other')).err).toBeUndefined()
    const b3 = (await db.query<{ p: string }>(`select second_email_provider_id p from public.parental_consents where id = '${wc}'`)).rows[0].p

    // Positive control: the rows the call must delete are really there.
    expect(await count(`select count(*) n from public.learners where created_by = '${W}'`)).toBe(2)

    const first = await as(W, 'select public.withdraw_my_consent() r')
    expect(first.err).toBeUndefined()
    expect(first.rows![0].r).toBe('withdrawn')
    expect(await count(`select count(*) n from public.learners where created_by = '${W}'`), 'a child survived the withdrawal').toBe(0)
    const [cons] = (await db.query<{ state: string; w: boolean }>(`select state, withdrawn_at is not null w from public.parental_consents where id = '${wc}'`)).rows
    expect(cons, 'the consent record must stay, as withdrawn — it is the evidence').toEqual({ state: 'withdrawn', w: true })
    expect(await count(`select count(*) n from public.consent_b3_cancellations where provider_id = '${b3}'`), 'its future B3 was not queued for cancelling').toBe(1)
    expect(await count(`select count(*) n from public.learners where created_by = '${O}'`), 'another family\'s child was touched').toBe(1)
    expect((await db.query<{ state: string }>(`select state from public.parental_consents where id = '${oc}'`)).rows[0].state).toBe('granted')

    const again = await as(W, 'select public.withdraw_my_consent() r')
    expect(again.err).toBeUndefined()
    expect(again.rows![0].r).toBe('withdrawn')
    expect(await count(`select count(*) n from public.parental_consents where parent_id = '${W}'`)).toBe(1)
    expect(await count(`select count(*) n from public.learners where created_by = '${O}'`)).toBe(1)
  })

  it('refuses a caller who is not signed in', async () => {
    await db.exec(`select set_config('test.uid', '', false)`)
    await db.exec('set role authenticated')
    try { await expect(db.query('select public.withdraw_my_consent()')).rejects.toThrow(/not_signed_in/) } finally { await db.exec('reset role') }
  })
})
