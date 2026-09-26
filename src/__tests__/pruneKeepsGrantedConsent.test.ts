// @vitest-environment node
/**
 * BUG-09 (docs/review/LATENT-BUGS.md) — the nightly prune of unconfirmed accounts must never destroy a consent
 * record that is, or ever was, GRANTED.
 *
 * A consent can be granted on an account whose address is still unconfirmed (the one-email sign-up's B0 opened
 * after the confirmation link expired). `parental_consents.parent_id → auth.users` is ON DELETE CASCADE, so
 * `prune_unconfirmed_users()` deleting that account deleted the granted record with it.
 *
 * The property checked: after one run of the job, an unconfirmed account older than 3 days that holds a granted,
 * withdrawn or (N5, Rafi 2026-09-26) DECLINED consent still exists and its record is unchanged; an unconfirmed account
 * older than 3 days with NO consent, or only a pending / expired request, is still deleted; a young unconfirmed
 * account is kept.
 * Since N5 (20260926100800) a grant needs a CONFIRMED address, so the granted and withdrawn fixtures are granted while
 * confirmed and then made unconfirmed — the state a pre-N5 grant left behind, which is what the guard still protects.
 *
 * Real Postgres (pglite), baseline + every migration in order (`_schema.ts`). The granted consent is made the way
 * the app makes it — `consent_request_at_signup` then `consent_grant`, as service_role — not by inserting a row.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema } from './_schema'

const id = (n: string) => `00000000-0000-4000-8000-0000000009${n}`
const GRANTED = id('01'), WITHDRAWN = id('02'), NONE = id('03'), PENDING = id('04'),
  EXPIRED = id('05'), DECLINED = id('06'), YOUNG = id('07')

let db: PGlite
const exists = async (uid: string) =>
  (await db.query(`select 1 from auth.users where id = '${uid}'`)).rows.length === 1
const states = async (uid: string) =>
  (await db.query<{ state: string }>(`select state from public.parental_consents where parent_id = '${uid}'`)).rows.map(r => r.state)

/** As /api/auth/signup then /api/consent/respond do it, as service_role. Returns consent_grant's answer. */
async function requestAt(uid: string, tok: string): Promise<string> {
  await db.exec('set role service_role')
  try {
    const { rows: [c] } = await db.query<{ consent_id: string }>(
      `select * from public.consent_request_at_signup('${uid}', 'notice-v6', 'privacy@x', 'terms@x', 'en', '${tok}', '7 days')`)
    await db.query(`select public.consent_record_request_sent('${c.consent_id}', 're_b0_${tok}')`)
    return c.consent_id
  } finally { await db.exec('reset role') }
}
async function grant(tok: string): Promise<string> {
  await db.exec('set role service_role')
  try {
    return (await db.query<{ s: string }>(`select public.consent_grant('${tok}', 're_b3_${tok}', now() + interval '1 day') as s`)).rows[0].s
  } finally { await db.exec('reset role') }
}

beforeAll(async () => {
  ({ db } = await loadSchema())
  await db.exec(`insert into auth.users (id, email, raw_user_meta_data, email_confirmed_at) values
    ('${GRANTED}',   'granted@x.test',   '{"role":"parent"}', null),
    ('${WITHDRAWN}', 'withdrawn@x.test', '{"role":"parent"}', null),
    ('${NONE}',      'none@x.test',      '{"role":"parent"}', null),
    ('${PENDING}',   'pending@x.test',   '{"role":"parent"}', null),
    ('${EXPIRED}',   'expired@x.test',   '{"role":"parent"}', null),
    ('${DECLINED}',  'declined@x.test',  '{"role":"parent"}', null),
    ('${YOUNG}',     'young@x.test',     '{"role":"parent"}', null)`)

  await db.exec(`update auth.users set email_confirmed_at = now() where id in ('${GRANTED}', '${WITHDRAWN}')`)
  await requestAt(GRANTED, 'tok01')
  expect(await grant('tok01')).toBe('granted')

  await requestAt(WITHDRAWN, 'tok02')
  expect(await grant('tok02')).toBe('granted')
  await db.exec(`update auth.users set email_confirmed_at = null where id in ('${GRANTED}', '${WITHDRAWN}')`)
  await db.exec(`update public.parental_consents set state = 'withdrawn', withdrawn_at = now() where parent_id = '${WITHDRAWN}'`)

  await requestAt(PENDING, 'tok04')
  await requestAt(EXPIRED, 'tok05')
  await db.exec(`update public.parental_consents set state = 'expired' where parent_id = '${EXPIRED}'`)
  await requestAt(DECLINED, 'tok06')
  await db.exec(`update public.parental_consents set state = 'declined', declined_at = now() where parent_id = '${DECLINED}'`)

  // Everyone but YOUNG is past the 3-day cutoff; YOUNG was created an hour ago.
  await db.exec(`update auth.users set created_at = now() - interval '4 days' where id <> '${YOUNG}'`)
  await db.exec(`update auth.users set created_at = now() - interval '1 hour' where id = '${YOUNG}'`)

  // Fixture control: the world is the one the assertions talk about, before the job runs.
  expect({
    granted: await states(GRANTED), withdrawn: await states(WITHDRAWN), none: await states(NONE),
    pending: await states(PENDING), expired: await states(EXPIRED), declined: await states(DECLINED),
  }).toEqual({
    granted: ['granted'], withdrawn: ['withdrawn'], none: [],
    pending: ['pending'], expired: ['expired'], declined: ['declined'],
  })

  await db.query('select public.prune_unconfirmed_users()')
}, 180_000)

describe('BUG-09 — prune_unconfirmed_users() never destroys a granted consent record', () => {
  it('an unconfirmed account holding a GRANTED consent survives, with its record', async () => {
    expect({ account: await exists(GRANTED), consents: await states(GRANTED) })
      .toEqual({ account: true, consents: ['granted'] })
  })

  it('an unconfirmed account holding a WITHDRAWN (once granted) consent survives, with its record', async () => {
    expect({ account: await exists(WITHDRAWN), consents: await states(WITHDRAWN) })
      .toEqual({ account: true, consents: ['withdrawn'] })
  })

  it('N5: an unconfirmed account holding a DECLINED consent survives, with its record (evidence)', async () => {
    expect({ account: await exists(DECLINED), consents: await states(DECLINED) })
      .toEqual({ account: true, consents: ['declined'] })
  })

  it('POSITIVE CONTROL: no consent, or only a pending / expired request → still pruned', async () => {
    expect({ none: await exists(NONE), pending: await exists(PENDING), expired: await exists(EXPIRED) })
      .toEqual({ none: false, pending: false, expired: false })
  })

  it('POSITIVE CONTROL: a young unconfirmed account is not pruned', async () => {
    expect(await exists(YOUNG)).toBe(true)
  })

  it('the function keeps SECURITY DEFINER, search_path=public, and no API role can call it', async () => {
    const { rows } = await db.query<{ definer: boolean; config: string; api: boolean }>(`
      select p.prosecdef as definer, array_to_string(p.proconfig, ',') as config,
             has_function_privilege('anon', p.oid, 'EXECUTE') or has_function_privilege('authenticated', p.oid, 'EXECUTE') as api
        from pg_proc p where p.oid = 'public.prune_unconfirmed_users()'::regprocedure`)
    expect(rows).toEqual([{ definer: true, config: 'search_path=public', api: false }])
  })
})
