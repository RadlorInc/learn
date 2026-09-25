// Usage (local stack only), same set-up as consent-once-e2e.mjs: supabase start in a scratch copy WITH
// [auth.email] enable_confirmations = true (production confirms email) → `supabase status -o env > stack.env` →
// `node scripts/resend-standin.mjs &` → next dev -p 3099 with that stack's URL/keys and RESEND_API_URL=http://127.0.0.1:4719 →
// `node scripts/one-email-e2e.mjs stack.env`. It refuses any API that is not 127.0.0.1.
//
// ONE EMAIL (founder, 2026-09-25): the real Next routes against a LOCAL Supabase stack. Asserts, per path, how many
// emails a person receives — counted at the Resend stand-in (ours) AND at the stack's own mailbox (Supabase's), because
// "one email" is a claim about the inbox, not about our code.
import { readFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'

const env = Object.fromEntries(readFileSync(process.argv[2], 'utf8').split('\n').filter(Boolean).map(l => {
  const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]
}))
const API = env.API_URL, ANON = env.ANON_KEY, SVC = env.SERVICE_ROLE_KEY, MAIL = env.MAILPIT_URL ?? env.INBUCKET_URL
if (!/^http:\/\/127\.0\.0\.1:/.test(API) || !/^http:\/\/127\.0\.0\.1:/.test(MAIL)) throw new Error('refusing: not a local stack')
const APP = 'http://127.0.0.1:3099', RESEND = 'http://127.0.0.1:4719'
const ok = (c, m) => { if (!c) { console.log('  ✗ ' + m); process.exitCode = 1 } else console.log('  ✓ ' + m) }
async function j(url, init = {}) { const r = await fetch(url, init); let b = null; try { b = await r.json() } catch {} ; return { status: r.status, body: b } }
const svcH = { apikey: SVC, Authorization: `Bearer ${SVC}`, 'Content-Type': 'application/json' }
const json = { 'Content-Type': 'application/json' }
const ours = async to => ((await j(`${RESEND}/__calls`)).body ?? []).filter(c => c.path === '/emails' && c.body?.to?.[0] === to).map(c => c.body)
const supabases = async to => ((await j(`${MAIL}/api/v1/search?query=${encodeURIComponent('to:' + to)}`)).body?.messages ?? []).length
const signup = (email, role, password = randomBytes(12).toString('base64url')) =>
  j(`${APP}/api/auth/signup`, { method: 'POST', headers: json, body: JSON.stringify({ email, password, firstName: 'Pat', role, lang: 'en' }) })
const linkOf = m => /(https?:\/\/[^\s]+\/auth\/confirm\?th=[^\s#]+)(?:#t=([A-Za-z0-9_-]{43}))?/.exec(m.text) ?? []
const confirm = async th => j(`${API}/auth/v1/verify`, { method: 'POST', headers: { apikey: ANON, ...json }, body: JSON.stringify({ type: 'signup', token_hash: decodeURIComponent(th) }) })
const consents = async email => (await j(`${API}/rest/v1/parental_consents?email_address=eq.${encodeURIComponent(email)}&select=method,state,second_email_provider_id,parent_ack_at&order=created_at`, { headers: svcH })).body

console.log('\n── A. a parent signs up with email + password: ONE email, it confirms and asks; the grant sends nothing more')
{
  const email = `parent-${Date.now()}@example.test`
  const r = await signup(email, 'parent')
  ok(r.status === 200, `sign-up answered ${r.status}`)
  const [m] = await ours(email)
  ok((await ours(email)).length === 1, `one email from us (${(await ours(email)).length})`)
  ok(m?.subject === 'Confirm your email and give permission for your children', `its subject: "${m?.subject}"`)
  ok(/Ticking the box also confirms your email address\./.test(m?.text ?? ''), 'it says the box also confirms the address')
  ok(/For each child you add, we store:/.test(m?.text ?? ''), 'it carries B1\'s notice lines')
  const [, url, th, t] = (() => { const x = linkOf(m ?? { text: '' }); return [x[0], x[1], x[1] && new URL(x[1]).searchParams.get('th'), x[2]] })()
  ok(!!th && !!t, 'the link carries the confirmation token (query) and the consent token (fragment)')
  const v = await confirm(th)
  ok(!!v.body?.access_token, 'the link confirms the address and signs the parent in')
  const g = await j(`${APP}/api/consent/respond`, { method: 'POST', headers: json, body: JSON.stringify({ t, action: 'grant' }) })
  ok(g.body?.status === 'granted', `ticking the box grants (${g.body?.status})`)
  const [c] = await consents(email)
  ok(c?.method === 'email' && c.state === 'granted' && c.second_email_provider_id === null, `consent recorded: ${JSON.stringify(c)}`)
  ok(c?.parent_ack_at === null, 'no on-screen tick is claimed for the sign-up')
  ok((await ours(email)).length === 1, `still one email after the grant (${(await ours(email)).length}) — no second email`)
  ok(await supabases(email) === 0, `Supabase sent nothing (${await supabases(email)})`)
  void url
}

console.log('\n── B. a teacher signs up: ONE email that only confirms; no consent request exists')
{
  const email = `teacher-${Date.now()}@example.test`
  const r = await signup(email, 'teacher')
  ok(r.status === 200, `sign-up answered ${r.status}`)
  const all = await ours(email)
  ok(all.length === 1 && all[0].subject === 'Confirm your email for Radlic', `one email: "${all[0]?.subject}"`)
  const x = linkOf(all[0] ?? { text: '' })
  ok(!!x[1] && !x[2], 'a confirmation link, with no consent token')
  ok(!!(await confirm(new URL(x[1]).searchParams.get('th'))).body?.access_token, 'the link confirms the address')
  ok((await consents(email)).length === 0, 'no consent row')
  ok(await supabases(email) === 0, 'Supabase sent nothing')
}

console.log('\n── C. signing up again before confirming re-sends; only the newest link can grant')
{
  const email = `again-${Date.now()}@example.test`, pw = randomBytes(12).toString('base64url')
  await signup(email, 'parent', pw); await signup(email, 'parent', pw)
  const [m1, m2] = await ours(email)
  ok(!!m1 && !!m2, `two emails, one per request (${(await ours(email)).length})`)
  const t1 = linkOf(m1)[2], t2 = linkOf(m2)[2]
  const g1 = await j(`${APP}/api/consent/respond`, { method: 'POST', headers: json, body: JSON.stringify({ t: t1, action: 'grant' }) })
  ok(g1.body?.status === 'expired', `the first link no longer grants (${g1.body?.status})`)
  await confirm(new URL(linkOf(m2)[1]).searchParams.get('th'))
  const g2 = await j(`${APP}/api/consent/respond`, { method: 'POST', headers: json, body: JSON.stringify({ t: t2, action: 'grant' }) })
  ok(g2.body?.status === 'granted', `the newest link grants (${g2.body?.status})`)
}

console.log('\n── D. an address that already has a confirmed account: told so, and no email at all')
{
  const email = `exists-${Date.now()}@example.test`
  await j(`${API}/auth/v1/admin/users`, { method: 'POST', headers: svcH, body: JSON.stringify({ email, password: 'Secret-pass-123', email_confirm: true }) })
  const r = await signup(email, 'parent')
  ok(r.status === 409 && r.body?.error === 'exists', `answered ${r.status} ${r.body?.error}`)
  ok((await ours(email)).length === 0 && await supabases(email) === 0, 'no email from us or from Supabase')
}

console.log('\n── E. a Google-style parent (confirmed, no confirmation email): B1 from the dashboard, and no second email')
{
  const email = `google-${Date.now()}@example.test`, password = randomBytes(12).toString('base64url')
  const u = await j(`${API}/auth/v1/admin/users`, { method: 'POST', headers: svcH, body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { full_name: 'Sam Lee' } }) })
  await j(`${API}/rest/v1/profiles?id=eq.${u.body.id}`, { method: 'PATCH', headers: { ...svcH, Prefer: 'return=minimal' }, body: JSON.stringify({ role: 'parent' }) })
  const tok = (await j(`${API}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: ANON, ...json }, body: JSON.stringify({ email, password }) })).body.access_token
  const r = await j(`${APP}/api/consent/request`, { method: 'POST', headers: { ...json, Authorization: `Bearer ${tok}` }, body: JSON.stringify({ noticeVersion: 'notice-v7', lang: 'en' }) })
  ok(r.status === 200, `B1 requested (${r.status})`)
  const [b1] = await ours(email)
  const t = /respond#t=([A-Za-z0-9_-]{43})/.exec(b1?.text ?? '')?.[1]
  const g = await j(`${APP}/api/consent/respond`, { method: 'POST', headers: json, body: JSON.stringify({ t, action: 'grant' }) })
  ok(g.body?.status === 'granted', `granted (${g.body?.status})`)
  ok((await ours(email)).length === 1, `one email in all (${(await ours(email)).length}) — no second email`)
  ok((await consents(email))[0]?.method === 'email', 'recorded as method "email"')
}
console.log(process.exitCode ? '\nFAILED' : '\nALL PASSED')
