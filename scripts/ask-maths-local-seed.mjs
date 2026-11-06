#!/usr/bin/env node
// Ask maths on a LOCAL stack only (docs/product/ask-maths.md): a test family to try it end to end — a parent with
// consent on the current notice, a Grade 6–8 child, and the add-on marked active (no Stripe), Ask maths still OFF so
// the parent turns it on through the disclosure. Run after `supabase start` + `supabase db reset`:
//   node scripts/ask-maths-local-seed.mjs
// Sign in at /auth with the address and password below (test values for this local stack, nothing else).
// It refuses any database that is not on this machine.
import { execFileSync } from 'node:child_process'

const EMAIL = 'askmaths-parent@example.test', PASSWORD = 'ask-maths-local-1', CHILD = 'Sam'
const env = Object.fromEntries(execFileSync('supabase', ['status', '-o', 'env'], { encoding: 'utf8' }).split('\n')
  .map(l => l.match(/^([A-Z_]+)="?(.*?)"?$/)).filter(Boolean).map(m => [m[1], m[2]]))
const api = env.API_URL, key = env.SERVICE_ROLE_KEY
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(api ?? '')) { console.error(`refusing: ${api} is not a local stack`); process.exit(2) }

const sql = q => execFileSync('docker', ['exec', '-i', 'supabase_db_milo-story-mode', 'psql', '-U', 'postgres', '-tAqv', 'ON_ERROR_STOP=1', '-c', q], { encoding: 'utf8' }).trim()
const notice = sql(`select version from public.consent_notice_versions order by seq desc limit 1`)

let id = sql(`select id from auth.users where email = '${EMAIL}'`)
if (!id) {
  const r = await fetch(`${api}/auth/v1/admin/users`, { method: 'POST', headers: { apikey: key, Authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, email_confirm: true }) })
  if (!r.ok) { console.error('could not create the user:', r.status, await r.text()); process.exit(1) }
  id = (await r.json()).id
}
const consent = sql(`insert into public.parental_consents (parent_id, method, state, notice_version, privacy_version, terms_version,
    email_address, confirmed_at, token_hash, expires_at, request_email_provider_id, request_email_sent_at, second_email_provider_id,
    second_notice_scheduled_for, scope)
  values ('${id}', 'email_plus', 'granted', '${notice}', 'privacy-v1', 'terms-v1', '${EMAIL}', now(), md5(random()::text),
    now() + interval '7 days', 're_local_b1', now(), 're_local_b3_' || md5(random()::text), now() + interval '1 day', 'account') returning id`)
  .split('\n')[0]
if (!sql(`select id from public.learners where created_by = '${id}' and display_name = '${CHILD}'`))
  sql(`insert into public.learners (display_name, avatar_index, age_group, created_by, consent_id, attested_notice_version)
       values ('${CHILD}', 1, '12-14', '${id}', '${consent}', '${notice}')`)
sql(`insert into public.addon_subscriptions (account_id, product, status, current_period_end)
     values ('${id}', 'ask_maths', 'active', now() + interval '30 days')
     on conflict (account_id, product) do update set status = 'active', current_period_end = excluded.current_period_end`)
console.log(`local test family ready: ${EMAIL} (notice ${notice}), child ${CHILD} in Grades 6–8, add-on active, Ask maths off`)
