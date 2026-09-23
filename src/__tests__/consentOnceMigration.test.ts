// @vitest-environment node
/**
 * THE CONSENT-ONCE MIGRATION ON THE STATE IT WILL MEET (20260924100000).
 *
 * Production, measured by the founder before this loop: a handful of test accounts and ONE child, created under its
 * own per-child granted consent (the D4–D6 flow). This builds that shape on the schema as it stands BEFORE the file,
 * applies the file the way `supabase db push` does (one transaction), and checks:
 *   ① the existing child keeps working — its attestation is taken from its own consent, nothing invented;
 *   ② a per-child consent can never create another child;
 *   ③ the file's closing assertions roll EVERYTHING back when the promise would not hold.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema } from './_schema'

const FILE = '20260924100000_consent_once.sql'
const SQL = readFileSync(resolve(__dirname, '../../supabase/migrations', FILE), 'utf8')
const P = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const Q = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

/** A per-child consent exactly as the pre-consent-once flow wrote it (no `scope` column exists yet). */
async function legacyConsent(db: PGlite, parent: string, version = 'notice-v4'): Promise<string> {
  const { rows } = await db.query<{ id: string }>(`
    insert into public.parental_consents
      (parent_id, method, state, notice_version, privacy_version, terms_version, email_address, confirmed_at,
       token_hash, expires_at, request_email_provider_id, request_email_sent_at, second_email_provider_id, second_notice_scheduled_for)
    values ('${parent}', 'email_plus', 'granted', '${version}', 'privacy@dark#x', 'terms@dark#x', 'p@x.test', now() - interval '2 days',
            md5(random()::text), now() + interval '5 days', 're_b1', now() - interval '2 days', 're_b3_' || md5(random()::text), now() - interval '1 day')
    returning id`)
  return rows[0].id
}

async function preMigration() {
  const { db } = await loadSchema({ before: FILE })
  await db.exec(`insert into auth.users (id, email, email_confirmed_at) values ('${P}', 'p@x.test', now()), ('${Q}', 'q@x.test', now());
    insert into public.profiles (id, role) values ('${P}', 'parent'), ('${Q}', 'parent') on conflict (id) do update set role = excluded.role;`)
  const consent = await legacyConsent(db, P)
  const kid = (await db.query<{ id: string }>(`insert into public.learners (display_name, avatar_index, age_group, created_by, consent_id)
    values ('Legacy Kid', 0, '9-11', '${P}', '${consent}') returning id`)).rows[0].id
  const unused = await legacyConsent(db, Q)   // granted, never used for a child
  return { db, consent, kid, unused }
}

/** How `supabase db push` applies a file: all of it, or none of it. */
async function apply(db: PGlite): Promise<string | null> {
  try { await db.exec(`begin;\n${SQL}\ncommit;`); return null }
  catch (e) { await db.exec('rollback').catch(() => {}); return (e as Error).message }
}

describe('consent-once migration, on production\'s shape', () => {
  it('① the existing child keeps working, attested from its own consent', async () => {
    const { db, consent, kid } = await preMigration()
    expect(await apply(db)).toBeNull()
    const [row] = (await db.query<Record<string, unknown>>(`
      select l.attested_by, l.attestation_method, l.attested_notice_version,
             l.attested_at = c.confirmed_at as at_is_confirmed, c.scope, c.learner_id = l.id as still_bound,
             public.consent_ok(l.id) as ok
        from public.learners l join public.parental_consents c on c.id = l.consent_id where l.id = '${kid}'`)).rows
    expect(row).toEqual({ attested_by: P, attestation_method: 'per_child_consent', attested_notice_version: 'notice-v4',
                          at_is_confirmed: true, scope: 'child', still_bound: true, ok: true })
    // …and its data can still be written (a gated child table).
    await db.exec(`insert into public.learner_events (learner_id, event, props) values ('${kid}', 'lesson_start', '{}')`)
    expect(consent).toBeTruthy()
  }, 120_000)

  it('② a per-child consent can never create another child — not even with an attestation', async () => {
    const { db, unused } = await preMigration()
    expect(await apply(db)).toBeNull()
    const r = await db.query(`insert into public.learners (display_name, age_group, created_by, consent_id, attested_notice_version)
      values ('New', '9-11', '${Q}', '${unused}', 'notice-v4')`).then(() => 'CREATED', e => (e as Error).message)
    expect(r).toMatch(/no granted parental consent for this account/)
  }, 120_000)

  it('③ a child that would fail the gate afterwards rolls the WHOLE file back', async () => {
    const { db, consent } = await preMigration()
    // A version the migration does not register → that child's consent would not be "current" → rule 2 fails.
    await db.exec(`alter table public.parental_consents disable trigger trg_consent_guard_update;
      update public.parental_consents set notice_version = 'notice-v99' where id = '${consent}';
      alter table public.parental_consents enable trigger trg_consent_guard_update;`)
    const err = await apply(db)
    expect(err).toMatch(/consent-once: 1 child\(ren\) would fail the gate — rolled back/)
    // Nothing of the file survived: no scope column, no versions table, the old unique index is still there.
    const [s] = (await db.query<{ scope: number; versions: number; idx: number }>(`
      select (select count(*) from information_schema.columns where table_name = 'parental_consents' and column_name = 'scope')::int as scope,
             (select count(*) from pg_class where relname = 'consent_notice_versions')::int as versions,
             (select count(*) from pg_class where relname = 'learners_consent_id_unique')::int as idx`)).rows
    expect(s).toEqual({ scope: 0, versions: 0, idx: 1 })
  }, 120_000)
})
