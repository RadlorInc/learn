// Usage (local stack only): supabase start in a scratch copy → `supabase status -o env > stack.env` →
// `node scripts/resend-standin.mjs &` → next dev -p 3099 with that stack's URL/keys and RESEND_API_URL=http://127.0.0.1:4719 →
// `node scripts/consent-once-e2e.mjs stack.env`. It refuses any API that is not 127.0.0.1.
// Consent-once C6: the real Next routes against a LOCAL Supabase stack (127.0.0.1 only), with a Resend stand-in that
// records calls. Never production. Keys come from the local stack's `supabase status -o env` and are never printed.
import { readFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'

const env = Object.fromEntries(readFileSync(process.argv[2], 'utf8').split('\n').filter(Boolean).map(l => {
  const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]
}))
const API = env.API_URL, ANON = env.ANON_KEY, SVC = env.SERVICE_ROLE_KEY
if (!/^http:\/\/127\.0\.0\.1:/.test(API)) throw new Error('refusing: not a local stack')
const APP = 'http://127.0.0.1:3099', RESEND = 'http://127.0.0.1:4719'
const log = (...a) => console.log(...a)
const ok = (c, m) => { if (!c) { console.log('  ✗ ' + m); process.exitCode = 1 } else console.log('  ✓ ' + m) }

async function j(url, init = {}) { const r = await fetch(url, init); let b = null; try { b = await r.json() } catch {} ; return { status: r.status, body: b } }
const svcH = { apikey: SVC, Authorization: `Bearer ${SVC}`, 'Content-Type': 'application/json' }
const userH = t => ({ apikey: ANON, Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' })
const calls = async () => (await j(`${RESEND}/__calls`)).body

async function parent(label) {
  const email = `${label}-${Date.now()}@example.test`, password = randomBytes(18).toString('base64url')
  const ack = { noticeVersion: 'notice-v6', at: new Date(Date.now() - 60_000).toISOString() }
  const u = await j(`${API}/auth/v1/admin/users`, { method: 'POST', headers: svcH,
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { consent_ack: ack } }) })
  const id = u.body.id
  await j(`${API}/rest/v1/profiles?id=eq.${id}`, { method: 'PATCH', headers: { ...svcH, Prefer: 'return=minimal' }, body: JSON.stringify({ role: 'parent' }) })
  const t = await j(`${API}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
  return { id, email, token: t.body.access_token, ack }
}
async function consentFlow(p) {
  const before = (await calls()).length
  const r = await j(`${APP}/api/consent/request`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p.token}` },
    body: JSON.stringify({ noticeVersion: 'notice-v6', lang: 'en', ackAt: p.ack.at }) })
  ok(r.status === 200 && r.body?.ok, `request → B1 sent (${r.status})`)
  const b1 = (await calls()).slice(before).find(c => c.path === '/emails')
  ok(/permission for your children/.test(b1?.body?.subject ?? ''), `B1 subject: "${b1?.body?.subject}"`)
  ok(/This one permission covers every child you add/.test(b1?.body?.text ?? ''), 'B1 carries "covers every child"')
  const tok = /respond#t=([A-Za-z0-9_-]{43})/.exec(b1.body.text)[1]
  const g = await j(`${APP}/api/consent/respond`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ t: tok, action: 'grant' }) })
  ok(g.body?.status === 'granted', `grant → ${g.body?.status}`)
  const b3 = (await calls()).slice(before).filter(c => c.path === '/emails')[1]
  ok(!!b3?.body?.scheduled_at && /permission you gave for your children/.test(b3.body.subject), `B3 scheduled for ${b3?.body?.scheduled_at}`)
  const [c] = (await j(`${API}/rest/v1/parental_consents?parent_id=eq.${p.id}&state=eq.granted&select=id,scope,notice_version,parent_ack_at,second_email_provider_id`, { headers: userH(p.token) })).body
  ok(c?.scope === 'account' && c.notice_version === 'notice-v6', `account consent granted (scope ${c?.scope}, ${c?.notice_version})`)
  ok(c?.parent_ack_at === new Date(p.ack.at).toISOString().replace('Z', '+00:00') || !!c?.parent_ack_at, `the signup tick is recorded (parent_ack_at ${c?.parent_ack_at})`)
  return { consent: c, token: tok }
}
async function addChild(p, consent, name, attest = true) {
  const body = { display_name: name, avatar_index: 1, age_group: '9-11', created_by: p.id, consent_id: consent.id, lesson_ids: ['g3m1-t1'] }
  if (attest) body.attested_notice_version = consent.notice_version
  return j(`${API}/rest/v1/learners?select=id,attested_by,attestation_method,attested_notice_version`, { method: 'POST', headers: { ...userH(p.token), Prefer: 'return=representation' }, body: JSON.stringify(body) })
}
const kids = async p => (await j(`${API}/rest/v1/learners?created_by=eq.${p.id}&select=id,display_name`, { headers: svcH })).body

log('\n── A. sign up (tick recorded) → one consent email → grant → two children with ticks only')
const A = await parent('parent-a')
const { consent: cA } = await consentFlow(A)
const noTick = await addChild(A, cA, 'No Tick', false)
ok(noTick.status >= 400 && /no parental attestation/.test(JSON.stringify(noTick.body)), `a child WITHOUT the attestation is refused (${noTick.status} ${noTick.body?.code})`)
const k1 = await addChild(A, cA, 'Ana'), k2 = await addChild(A, cA, 'Ben')
ok(k1.status === 201 && k2.status === 201, 'two children created with the attestation only — no further email')
ok(k1.body?.[0]?.attestation_method === 'checkbox' && k1.body[0].attested_by === A.id, `attestation stamped: ${k1.body?.[0]?.attestation_method} by the parent, ${k1.body?.[0]?.attested_notice_version}`)
ok((await calls()).filter(c => c.path === '/emails').length === 2, 'still exactly 2 emails sent (B1 + B3)')

log('\n── B. withdraw one child → the other remains')
const d = await j(`${API}/rest/v1/rpc/delete_learner`, { method: 'POST', headers: userH(A.token), body: JSON.stringify({ p_learner_id: k1.body[0].id }) })
await j(`${APP}/api/consent/cancel-second-notice`, { method: 'POST' })
const left = await kids(A)
ok(d.status < 300 && left.length === 1 && left[0].display_name === 'Ben', `one child deleted, "${left.map(k => k.display_name).join(',')}" remains`)
const [still] = (await j(`${API}/rest/v1/parental_consents?id=eq.${cA.id}&select=state`, { headers: svcH })).body
ok(still.state === 'granted', `the account consent is still granted (${still.state})`)
ok(!(await calls()).some(c => c.path.endsWith('/cancel')), 'no B3 cancelled by a single-child delete (the permission still stands)')

log('\n── C. withdraw the whole account (Account settings) → 0 children, B3 cancelled, consent kept as withdrawn')
const w = await j(`${API}/rest/v1/rpc/withdraw_my_consent`, { method: 'POST', headers: userH(A.token), body: '{}' })
const drain = await j(`${APP}/api/consent/cancel-second-notice`, { method: 'POST' })
ok(w.status < 300 && (await kids(A)).length === 0, `0 children after withdrawing (${w.status}, drain ${drain.status})`)
const [wc] = (await j(`${API}/rest/v1/parental_consents?id=eq.${cA.id}&select=state,withdrawn_at,learner_id`, { headers: svcH })).body
ok(wc.state === 'withdrawn' && wc.withdrawn_at && wc.learner_id === null, `consent kept: ${wc.state}, withdrawn_at set, learner_id ${wc.learner_id}`)
ok((await calls()).some(c => c.path === `/emails/${cA.second_email_provider_id}/cancel`), `B3 ${cA.second_email_provider_id} cancelled`)
const after = await addChild(A, cA, 'Late')
ok(after.status >= 400 && /no granted parental consent for this account/.test(JSON.stringify(after.body)), `adding a child after withdrawal is refused (${after.status})`)
const again = await j(`${API}/rest/v1/rpc/withdraw_my_consent`, { method: 'POST', headers: userH(A.token), body: '{}' })
ok(again.status < 300, 'withdrawing again is harmless (idempotent)')

log('\n── D. the B3 link of an ACCOUNT consent withdraws every child')
const B = await parent('parent-b')
const { consent: cB, token: tB } = await consentFlow(B)
await addChild(B, cB, 'Cy'); await addChild(B, cB, 'Di')
const wb = await j(`${APP}/api/consent/respond`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ t: tB, action: 'withdraw' }) })
ok(wb.body?.status === 'withdrawn' && (await kids(B)).length === 0, `B3 link → ${wb.body?.status}, 0 children`)
ok((await calls()).some(c => c.path === `/emails/${cB.second_email_provider_id}/cancel`), `B3 ${cB.second_email_provider_id} cancelled`)
log(process.exitCode ? '\nFAILED' : '\nALL PASSED')
