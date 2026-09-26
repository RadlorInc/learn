// @vitest-environment node
/**
 * N5 (Rafi, 2026-09-26; BUG-09's flow half) — `consent_grant` refuses an address that was never confirmed.
 *
 * The one-email sign-up can put a parent on the consent page before their address is confirmed (an expired
 * confirmation link still forwards the consent token). The property: on an UNCONFIRMED account the grant answers
 * 'unconfirmed' and the request is left exactly as it was — still pending, no B3 recorded, no confirmed_at — so the
 * parent can confirm and tick again; and once the address IS confirmed, the same token grants.
 *
 * Real Postgres (pglite), baseline + every migration in order (`_schema.ts`), called as service_role the way
 * /api/consent/respond calls it. Expected values written out by hand.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema } from './_schema'

const PARENT = '00000000-0000-4000-8000-000000000a01'
let db: PGlite

const asService = async <T,>(sql: string): Promise<T[]> => {
  await db.exec('set role service_role')
  try { return (await db.query<T>(sql)).rows } finally { await db.exec('reset role') }
}
const grant = async () => (await asService<{ s: string }>(
  `select public.consent_grant('tokN5', 're_b3', now() + interval '1 day') as s`))[0].s
const row = async () => (await db.query<{ state: string; b3: string | null; confirmed: boolean }>(
  `select state, second_email_provider_id as b3, confirmed_at is not null as confirmed
     from public.parental_consents where parent_id = '${PARENT}'`)).rows

beforeAll(async () => {
  ({ db } = await loadSchema())
  await db.exec(`insert into auth.users (id, email, raw_user_meta_data, email_confirmed_at)
                 values ('${PARENT}', 'n5@x.test', '{"role":"parent"}', null)`)
  const [c] = await asService<{ consent_id: string }>(
    `select * from public.consent_request_at_signup('${PARENT}', 'notice-v6', 'privacy@x', 'terms@x', 'en', 'tokN5', '7 days')`)
  await asService(`select public.consent_record_request_sent('${c.consent_id}', 're_b0')`)
}, 180_000)

describe('N5 — a consent is granted only on a confirmed address', () => {
  it('unconfirmed: answers "unconfirmed" and leaves the request pending, with no B3 and no confirmed_at', async () => {
    expect(await grant()).toBe('unconfirmed')
    expect(await row()).toEqual([{ state: 'pending', b3: null, confirmed: false }])
  })

  it('POSITIVE CONTROL: the same token grants once the address is confirmed', async () => {
    await db.exec(`update auth.users set email_confirmed_at = now() where id = '${PARENT}'`)
    expect(await grant()).toBe('granted')
    expect(await row()).toEqual([{ state: 'granted', b3: 're_b3', confirmed: true }])
  })

  it('consent_grant keeps SECURITY DEFINER, its search_path, and service_role-only EXECUTE', async () => {
    const { rows } = await db.query(`
      select p.prosecdef as definer, array_to_string(p.proconfig, ',') as config,
             has_function_privilege('anon', p.oid, 'EXECUTE') as anon,
             has_function_privilege('authenticated', p.oid, 'EXECUTE') as authed,
             has_function_privilege('service_role', p.oid, 'EXECUTE') as service
        from pg_proc p where p.oid = 'public.consent_grant(text, text, timestamptz)'::regprocedure`)
    expect(rows).toEqual([{ definer: true, config: 'search_path=public, pg_temp', anon: false, authed: false, service: true }])
  })
})
