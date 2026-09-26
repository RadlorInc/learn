// @vitest-environment node
/**
 * N11 (Rafi, 2026-09-26; MAP-13) — deleting an account KEEPS its consent record, as doc 06 says.
 *
 * Before 20260926100900 the consent cascaded away with `auth.users`. The property, for every path that deletes an
 * auth user (it is one trigger, so the test deletes the row directly, as the prune and GoTrue do):
 *   granted  → kept, now `withdrawn` with a withdrawn_at, parent_id null, and its future B3 queued for cancelling;
 *   withdrawn, declined → kept unchanged except parent_id null;
 *   pending, expired → gone (an unanswered request is not evidence, and would keep an address with no account).
 * Plus: closing the account through `delete_my_account` (the real button) keeps it too.
 *
 * Real Postgres (pglite), baseline + every migration (`_schema.ts`). Consents are made the way the app makes them
 * (request, sent, grant as service_role). Expected values written out by hand.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema } from './_schema'

const id = (n: string) => `00000000-0000-4000-8000-000000000b${n}`
const G = id('01'), W = id('02'), D = id('03'), P = id('04'), E = id('05'), C = id('06')
let db: PGlite

async function svc<T>(sql: string): Promise<T[]> {
  await db.exec('set role service_role')
  try { return (await db.query<T>(sql)).rows } finally { await db.exec('reset role') }
}
async function request(uid: string, tok: string) {
  const [c] = await svc<{ consent_id: string }>(
    `select * from public.consent_request_at_signup('${uid}', 'notice-v6', 'privacy@x', 'terms@x', 'en', '${tok}', '7 days')`)
  await svc(`select public.consent_record_request_sent('${c.consent_id}', 're_b0_${tok}')`)
  return c.consent_id
}
const grant = async (tok: string) => (await svc<{ s: string }>(
  `select public.consent_grant('${tok}', 're_b3_${tok}', now() + interval '1 day') as s`))[0].s
const byId = async (cid: string) => (await db.query<{ parent_id: string | null; state: string; withdrawn: boolean }>(
  `select parent_id, state, withdrawn_at is not null as withdrawn from public.parental_consents where id = '${cid}'`)).rows

const ids: Record<string, string> = {}
beforeAll(async () => {
  ({ db } = await loadSchema())
  await db.exec(`insert into auth.users (id, email, raw_user_meta_data, email_confirmed_at) values
    ('${G}', 'g@x.test', '{"role":"parent"}', now()), ('${W}', 'w@x.test', '{"role":"parent"}', now()),
    ('${D}', 'd@x.test', '{"role":"parent"}', now()), ('${P}', 'p@x.test', '{"role":"parent"}', now()),
    ('${E}', 'e@x.test', '{"role":"parent"}', now()), ('${C}', 'c@x.test', '{"role":"parent"}', now())`)
  ids.G = await request(G, 'tG'); expect(await grant('tG')).toBe('granted')
  ids.W = await request(W, 'tW'); expect(await grant('tW')).toBe('granted')
  await db.exec(`update public.parental_consents set state = 'withdrawn', withdrawn_at = now() where id = '${ids.W}'`)
  ids.D = await request(D, 'tD')
  await db.exec(`update public.parental_consents set state = 'declined', declined_at = now() where id = '${ids.D}'`)
  ids.P = await request(P, 'tP')
  ids.E = await request(E, 'tE')
  await db.exec(`update public.parental_consents set state = 'expired' where id = '${ids.E}'`)
  ids.C = await request(C, 'tC'); expect(await grant('tC')).toBe('granted')
  // Fixture control: every record is there, owned, in the state the assertions talk about.
  expect(await Promise.all(['G', 'W', 'D', 'P', 'E'].map(async k => (await byId(ids[k]))[0]?.state)))
    .toEqual(['granted', 'withdrawn', 'declined', 'pending', 'expired'])
  await db.exec(`delete from auth.users where id in ('${G}', '${W}', '${D}', '${P}', '${E}')`)
}, 180_000)

describe('N11 — deleting an account keeps its consent record', () => {
  it('granted → kept as WITHDRAWN, no longer naming the account', async () => {
    expect(await byId(ids.G)).toEqual([{ parent_id: null, state: 'withdrawn', withdrawn: true }])
  })
  it('…and its future B3 is queued for cancelling (as the cascade used to do)', async () => {
    const { rows } = await db.query(`select provider_id from public.consent_b3_cancellations where consent_id = '${ids.G}'`)
    expect(rows).toEqual([{ provider_id: 're_b3_tG' }])
  })
  it('withdrawn and declined → kept, unchanged but for the account', async () => {
    expect([await byId(ids.W), await byId(ids.D)]).toEqual([
      [{ parent_id: null, state: 'withdrawn', withdrawn: true }],
      [{ parent_id: null, state: 'declined', withdrawn: false }],
    ])
  })
  it('POSITIVE CONTROL: pending and expired requests are deleted with the account', async () => {
    expect([await byId(ids.P), await byId(ids.E)]).toEqual([[], []])
  })
  it('closing the account with delete_my_account (the real button) keeps the record too', async () => {
    const amr = JSON.stringify({ email: 'c@x.test', amr: [{ method: 'password', timestamp: Math.floor(Date.now() / 1000) }] })
    await db.exec(`set test.uid = '${C}'; set test.jwt = '${amr}'`)
    await db.exec('set role authenticated')
    try { await db.query(`select public.delete_my_account('c@x.test')`) } finally { await db.exec('reset role'); await db.exec(`reset test.uid; reset test.jwt`) }
    expect({ account: (await db.query(`select 1 from auth.users where id = '${C}'`)).rows.length, consent: await byId(ids.C) })
      .toEqual({ account: 0, consent: [{ parent_id: null, state: 'withdrawn', withdrawn: true }] })
  })

  it('the guard still refuses moving a record to ANOTHER account (only NULL is allowed)', async () => {
    const other = id('07')
    await db.exec(`insert into auth.users (id, email, email_confirmed_at) values ('${other}', 'o@x.test', now())`)
    const err = await db.query(`update public.parental_consents set parent_id = '${other}' where id = '${ids.D}'`)
      .then(() => 'ALLOWED', (e: Error) => e.message)
    expect(err).toContain('fixed once recorded')
  })
})
