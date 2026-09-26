// @vitest-environment node
/**
 * OPS-04 / OPS-07: THE DAILY CRON EMAILS THE FOUNDER A DIGEST OF COUNTS — AND NOTHING ELSE.
 *
 * Built on the repo's schema (PGlite), with `fetch` pointed at that database for Supabase RPCs, at a
 * recording stand-in for Resend, and at a canned GitHub API. Properties checked:
 *   1. `ops_digest()` returns the counts written out below for a planted state (a crash, a failed and a
 *      silent pg_cron job, a refused B3 cancel, a missed one, stuck consents);
 *   2. its return type is integers / a boolean / job names — asserted as a literal;
 *   3. the emailed body contains none of the planted personal data (child name, parent email, crash text),
 *      each first proven to BE in the database, and every line has the fixed "key: value" shape;
 *   4. only the cron (Bearer CRON_SECRET) triggers it; unset OPS_DIGEST_TO sends nothing;
 *   5. anon/authenticated cannot call it and service_role can.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema, grantedConsent, FIXTURE_NOTICE } from './_schema'

let db: PGlite
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows

const CHILD = 'Zebediah Quux'
const PARENT_EMAIL = 'secret.parent@example.test'
const CRASH = 'TypeError: cannot read Zebediah'
const sent: { to: string[]; subject: string; text: string; html: string }[] = []
const github = { backup: 'failure', deploy: 'success' }

async function fakeFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  const url = String(input instanceof Request ? input.url : input)
  const rpc = url.match(/^http:\/\/sb\.test\/rest\/v1\/rpc\/(\w+)$/)
  if (rpc) {
    const exists = (await q(`select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = $1`, [rpc[1]])).length > 0
    if (!exists) return new Response(JSON.stringify({ code: 'PGRST202', message: 'Could not find the function' }), { status: 404 })
    await db.exec('set role service_role')
    try {
      const args = JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>
      const names = Object.keys(args)
      const res = await db.query(`select * from public.${rpc[1]}(${names.map((n, i) => `${n} => $${i + 1}`).join(', ')})`, names.map(n => args[n]))
      return rpc[1] === 'consent_b3_record' ? new Response(null, { status: 204 }) : new Response(JSON.stringify(res.rows), { status: 200 })
    } finally { await db.exec('reset role') }
  }
  // Resend's cancel still refuses (the key is still wrong), so the queued rows stay 'refused'.
  if (/^http:\/\/resend\.test\/emails\/[^/]+\/cancel$/.test(url)) return new Response(JSON.stringify({ message: 'restricted' }), { status: 401 })
  if (url === 'http://resend.test/emails') { sent.push(JSON.parse(String(init?.body))); return new Response(JSON.stringify({ id: 'em_1' })) }
  const gh = url.match(/^https:\/\/api\.github\.com\/repos\/RadlorInc\/learn\/actions\/workflows\/(backup|deploy)\.yml\/runs/)
  if (gh) {
    const latest = github[gh[1] as 'backup' | 'deploy']
    const hour = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString()
    return new Response(JSON.stringify({ workflow_runs: [
      { conclusion: latest, created_at: hour(2) }, { conclusion: 'success', created_at: hour(50) }] }))
  }
  throw new Error(`unexpected fetch ${url}`)
}

const P = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
beforeAll(async () => {
  ({ db } = await loadSchema())
  // pg_cron's run log, as the extension defines the columns this reads (the test prelude has cron.job only).
  await db.exec(`create table if not exists cron.job_run_details (runid bigint, jobid bigint, status text, start_time timestamptz)`)
  await db.exec(`insert into cron.job (jobid, jobname) values (1, 'prune-error-events'), (2, 'expire-parental-consents'), (3, 'prune-unconfirmed-users');
    insert into cron.job_run_details values
      (10, 1, 'failed',    now() - interval '3 hours'),   -- failed today
      (11, 2, 'succeeded', now() - interval '3 hours'),   -- healthy
      (12, 3, 'succeeded', now() - interval '3 days');    -- silent: no run in 26 h`)
  await db.exec(`insert into auth.users (id, email, email_confirmed_at) values ('${P}', '${PARENT_EMAIL}', now());
    insert into public.profiles (id, role) values ('${P}', 'parent') on conflict (id) do update set role = excluded.role;`)
  const consent = await grantedConsent(db, P)
  await q(`insert into public.learners (display_name, avatar_index, age_group, created_by, consent_id, attested_notice_version)
    values ($1, 0, '6-8', '${P}', '${consent}', '${FIXTURE_NOTICE}')`, [CHILD])
  await q(`insert into public.error_events (source, message) values ('server', $1), ('client', 'x')`, [CRASH])
  await q(`insert into public.error_events (source, message, at) values ('server', 'old', now() - interval '2 days')`)
  await db.exec(`insert into public.consent_b3_cancellations (provider_id, consent_id, scheduled_for, queued_because, cancel_result) values
    ('re_ref', gen_random_uuid(), now() + interval '10 hours', 'withdrawn', 'refused: 401 restricted'),
    ('re_err', gen_random_uuid(), now() + interval '10 hours', 'withdrawn', 'error: 503'),
    ('re_ok',  gen_random_uuid(), now() + interval '10 hours', 'withdrawn', 'cancelled'),
    ('re_missed', gen_random_uuid(), now() - interval '1 day', 'deleted', 'refused: 401 restricted')`)
  await q(`insert into public.parental_consents (parent_id, method, state, notice_version, privacy_version, terms_version, email_address, token_hash, expires_at, created_at)
    values ('${P}', 'email_plus', 'pending', 'n', 'p', 't', $1, md5(random()::text), now() - interval '3 days', now() - interval '10 days')`, [PARENT_EMAIL])
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://sb.test')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service')
  vi.stubEnv('RESEND_API_KEY', 'resend')
  vi.stubEnv('RESEND_API_URL', 'http://resend.test')
  vi.stubEnv('CRON_SECRET', 'cron-test-secret')
  vi.stubEnv('OPS_DIGEST_TO', 'ops@example.test')
  vi.stubGlobal('fetch', fakeFetch)
}, 120_000)
afterAll(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })
beforeEach(() => { sent.length = 0 })

let ip = 0
const call = async (headers: Record<string, string> = {}) => {
  const { GET } = await import('@/app/api/consent/cancel-second-notice/route')
  return GET(new Request('http://x/api/consent/cancel-second-notice', { headers: { 'x-forwarded-for': `10.9.0.${++ip}`, ...headers } }))
}
const CRON = { authorization: 'Bearer cron-test-secret', 'user-agent': 'vercel-cron/1.0' }

describe('ops_digest() — counts only', () => {
  it('returns exactly these numbers for the planted state', async () => {
    await db.exec('set role service_role')
    try {
      const [row] = (await db.query('select * from public.ops_digest()')).rows
      expect(row).toEqual({
        error_events_24h: 2, cron_readable: true, cron_runs_failed_24h: 1,
        cron_jobs_failing: ['prune-error-events', 'prune-unconfirmed-users'],
        b3_cancel_failing: 2, b3_cancel_missed_7d: 1, consent_pending_overdue: 1, consent_request_unsent: 1,
      })
    } finally { await db.exec('reset role') }
  })

  it('its return type can carry only integers, one boolean and job names', async () => {
    const [{ t }] = await q<{ t: string }>(`select pg_get_function_result('public.ops_digest()'::regprocedure) t`)
    expect(t).toBe('TABLE(error_events_24h integer, cron_readable boolean, cron_runs_failed_24h integer, cron_jobs_failing text[], b3_cancel_failing integer, b3_cancel_missed_7d integer, consent_pending_overdue integer, consent_request_unsent integer)')
  })

  it('anon and authenticated are refused; service_role (the server) is allowed', async () => {
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`set role ${role}`)
      try { await expect(db.query('select * from public.ops_digest()'), role).rejects.toThrow(/permission denied/) } finally { await db.exec('reset role') }
    }
    await db.exec('set role service_role')
    try { expect((await db.query('select * from public.ops_digest()')).rows).toHaveLength(1) } finally { await db.exec('reset role') }
  })
})

describe('the daily cron emails the digest', () => {
  it('the cron call sends ONE email to OPS_DIGEST_TO with the numbers — and no personal data', async () => {
    // Positive control: the personal data IS in the database the digest reads.
    expect((await q(`select 1 from public.learners where display_name = $1`, [CHILD])).length).toBe(1)
    expect((await q(`select 1 from public.error_events where message = $1`, [CRASH])).length).toBe(1)
    expect((await q(`select 1 from public.parental_consents where email_address = $1`, [PARENT_EMAIL])).length).toBe(1)

    const res = await call(CRON)
    expect(res.status).toBe(200)
    expect(sent).toHaveLength(1)
    const m = sent[0]
    expect(m.to).toEqual(['ops@example.test'])
    expect(m.subject).toMatch(/^Radlic ops \d{4}-\d{2}-\d{2}: \d+ to look at$/)
    for (const line of [
      '!! error_events_24h: 2', '!! cron_runs_failed_24h: 1', '!! cron_jobs_failing: prune-error-events, prune-unconfirmed-users',
      '!! b3_cancel_failing: 2', '!! b3_cancel_missed_7d: 1', '!! consent_pending_overdue: 1', '!! consent_request_unsent: 1',
      '!! backup.yml: latest failure, last success 50 h ago', '   deploy.yml: latest success, last success 2 h ago',
      '   database: ok',
    ]) expect(m.text).toContain(line)
    for (const secret of [CHILD, 'Zebediah', PARENT_EMAIL, 'secret.parent', CRASH, 'restricted', 're_ref', P]) {
      expect(m.text + m.html + m.subject, `leaked: ${secret}`).not.toContain(secret)
    }
    // Every body line is "<marker><key>: <value>" with a value of digits, words, commas or job names.
    for (const line of m.text.split('\n').slice(2)) expect(line).toMatch(/^(!! | {3})[\w. ]+: [\w ,.()-]+$/)
  })

  it('a caller without the cron secret gets the drain but no email', async () => {
    expect((await call()).status).toBe(200)
    expect((await call({ authorization: 'Bearer wrong' })).status).toBe(200)
    expect(sent).toHaveLength(0)
  })

  it('CRON_SECRET unset: no email, even for a vercel-cron user agent', async () => {
    vi.stubEnv('CRON_SECRET', '')
    try { await call(CRON); expect(sent).toHaveLength(0) } finally { vi.stubEnv('CRON_SECRET', 'cron-test-secret') }
  })

  it('OPS_DIGEST_TO unset: the cron call sends nothing and still answers 200', async () => {
    vi.stubEnv('OPS_DIGEST_TO', '')
    try { expect((await call(CRON)).status).toBe(200); expect(sent).toHaveLength(0) } finally { vi.stubEnv('OPS_DIGEST_TO', 'ops@example.test') }
  })

  it('before the migration: the email says the digest function is missing instead of failing', async () => {
    await db.exec('alter function public.ops_digest() rename to ops_digest_hidden')
    try {
      await call(CRON)
      expect(sent).toHaveLength(1)
      expect(sent[0].text).toContain('!! database: digest function missing (migration 20260926100300 not applied)')
    } finally { await db.exec('alter function public.ops_digest_hidden() rename to ops_digest') }
  })
})
