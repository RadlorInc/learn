#!/usr/bin/env node
// Load test for Radlic on STAGING only. Fake families, the app's real calls, a stepped ramp, then cleanup.
//
//   node scripts/load-staging.mjs setup 1000   # create N fake parents, each with one child (under a granted consent)
//   node scripts/load-staging.mjs run          # ramp 50 → 100 → 250 → 500 → 1000 children (or STEPS=50,100), 3 min each
//   node scripts/load-staging.mjs cleanup      # delete every fake account and its rows
//
// Needs, in the SAME terminal: STAGING_PROJECT_REF, STAGING_ANON_KEY (staging's public key), and — read with
// `read -rs`, never typed into a file — STAGING_SERVICE_ROLE_KEY and SEED_PASSWORD (12+ chars).
// Prints counts and milliseconds only — never a key, a token or an email. Results and how to read them:
// docs/runbooks/capacity.md.

import { readFileSync } from 'node:fs'
import { randomUUID, randomBytes, createHash } from 'node:crypto'

const STAGING_REF = process.env.STAGING_PROJECT_REF ?? ''
const URL_BASE = `https://${STAGING_REF}.supabase.co`
const PROD_ASSERT = new URL('./assert-prod-ref.sh', import.meta.url)
const EMAIL = (i) => `load-${String(i).padStart(4, '0')}@load.radlic.test`
const LESSONS = ['g3m1-t1', 'g4m1-t1', 'g5m1-t1', 'g6m1-t1']

function refuse(m) { console.error(`REFUSED (nothing was contacted): ${m}`); process.exit(2) }

// ── guard: staging or nothing ─────────────────────────────────────────────────────────────────────
let PROD_REF
try { PROD_REF = readFileSync(PROD_ASSERT, 'utf8').match(/^EXPECTED_PROD_REF="([a-z0-9]+)"$/m)?.[1] } catch {}
if (!PROD_REF) refuse(`could not read production's ref from ${PROD_ASSERT.pathname}, so cannot tell production apart`)
if (!/^[a-z0-9]{20}$/.test(STAGING_REF)) refuse('STAGING_PROJECT_REF is not set to a project ref (20 lowercase letters/digits)')
if (STAGING_REF === PROD_REF || URL_BASE.includes(PROD_REF)) refuse('the target is PRODUCTION')
const SERVICE = process.env.STAGING_SERVICE_ROLE_KEY ?? ''
const PASSWORD = process.env.SEED_PASSWORD ?? ''
const ANON = (process.env.STAGING_ANON_KEY ?? '').trim()
if (!ANON) refuse('STAGING_ANON_KEY is not set (the staging project\'s public anon / publishable key)')
if (!SERVICE) refuse('STAGING_SERVICE_ROLE_KEY is not set in this terminal (read -rs STAGING_SERVICE_ROLE_KEY && export STAGING_SERVICE_ROLE_KEY)')
if (SERVICE.includes(PROD_REF) || ANON.includes(PROD_REF)) refuse('a key carries the PRODUCTION ref')
if (PASSWORD.length < 12) refuse('SEED_PASSWORD is not set or shorter than 12 characters')
// A legacy JWT key names its project: it must be staging's. (An sb_secret_ key does not; it only works on its own project.)
for (const [name, k] of [['service', SERVICE], ['anon', ANON]]) {
  if (k.split('.').length === 3) {
    let ref; try { ref = JSON.parse(Buffer.from(k.split('.')[1], 'base64url').toString()).ref } catch {}
    if (ref && ref !== STAGING_REF) refuse(`the ${name} key belongs to project ${ref === PROD_REF ? 'PRODUCTION' : 'another project'}, not staging`)
  }
}

// ── tiny HTTP helpers ─────────────────────────────────────────────────────────────────────────────
const admin = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json' }
async function call(path, { method = 'GET', headers = admin, body } = {}) {
  const r = await fetch(URL_BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  const text = await r.text()
  let json; try { json = text ? JSON.parse(text) : null } catch { json = text }
  return { status: r.status, json }
}
async function pool(items, n, fn) {
  let i = 0
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; await fn(items[k], k) } }))
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function findLoadUsers() {
  const out = []
  for (let page = 1; page < 100; page++) {
    const r = await call(`/auth/v1/admin/users?page=${page}&per_page=1000`)
    if (r.status !== 200) throw new Error(`listing users failed: HTTP ${r.status}`)
    const users = r.json.users ?? []
    out.push(...users.filter((u) => /^load-\d{4}@load\.radlic\.test$/.test(u.email)))
    if (users.length < 1000) break
  }
  return out
}

// ── setup ─────────────────────────────────────────────────────────────────────────────────────────
async function setup(n) {
  const notice = (await call('/rest/v1/consent_notice_versions?select=version&order=version.desc&limit=1')).json?.[0]?.version
  if (!notice) throw new Error('could not read a consent notice version on staging')
  let made = 0, reused = 0, failed = 0; const errs = {}
  const t0 = Date.now()
  await pool(Array.from({ length: n }, (_, i) => i + 1), 8, async (i) => {
    try {
      const email = EMAIL(i)
      let r = await call('/auth/v1/admin/users', { method: 'POST', body: { email, password: PASSWORD, email_confirm: true, user_metadata: { full_name: `Load ${i}`, role: 'parent' } } })
      let id = r.json?.id
      if (!id) {
        if (r.status !== 422 && r.status !== 400) throw new Error(`createUser ${r.status}`)
        const q = await call(`/rest/v1/profiles?select=id&display_name=eq.Load%20${i}`); id = q.json?.[0]?.id
        if (!id) { const all = await findLoadUsers(); id = all.find((u) => u.email === email)?.id }
        if (!id) throw new Error('user exists but not found')
        reused++
      } else made++
      await call(`/rest/v1/profiles?id=eq.${id}`, { method: 'PATCH', body: { role: 'parent', display_name: `Load ${i}` } })
      const have = await call(`/rest/v1/learners?select=id&created_by=eq.${id}`)
      if (have.json?.length) return
      const now = new Date()
      const c = await call('/rest/v1/parental_consents?select=id', {
        method: 'POST', headers: { ...admin, Prefer: 'return=representation' }, body: {
          parent_id: id, method: 'email_plus', state: 'granted', scope: 'account', parent_ack_at: now.toISOString(),
          notice_version: notice, privacy_version: 'load', terms_version: 'load', lang: 'en', email_address: email,
          token_hash: createHash('sha256').update(randomBytes(32)).digest('hex'),
          expires_at: new Date(now.getTime() + 7 * 864e5).toISOString(),
          request_email_sent_at: now.toISOString(), request_email_provider_id: 'load-fake-b1', confirmed_at: now.toISOString(),
          second_email_provider_id: 'load-fake-b3', second_notice_scheduled_for: new Date(now.getTime() + 864e5).toISOString(),
        } })
      const consentId = c.json?.[0]?.id
      if (!consentId) throw new Error(`consent ${c.status} ${c.json?.code ?? ''}`)
      const l = await call('/rest/v1/learners?select=id', { method: 'POST', headers: { ...admin, Prefer: 'return=representation' }, body: {
        display_name: `Kid ${i}`, avatar_index: 0, age_group: '9-11', created_by: id, consent_id: consentId, attested_notice_version: notice } })
      if (!l.json?.[0]?.id) throw new Error(`learner ${l.status} ${l.json?.code ?? ''}`)
    } catch (e) { failed++; errs[e.message] = (errs[e.message] ?? 0) + 1 }
    if ((made + reused + failed) % 100 === 0) process.stdout.write(`  … ${made + reused + failed}/${n}\n`)
  })
  console.log(`setup: ${made} created, ${reused} already there, ${failed} failed in ${((Date.now() - t0) / 1000).toFixed(0)} s`)
  if (failed) console.log('  failures:', errs)
}

// ── run ───────────────────────────────────────────────────────────────────────────────────────────
const stats = new Map() // op → { ms: [], err: 0, codes: {} }
function rec(op, ms, ok, code) {
  const s = stats.get(op) ?? { ms: [], err: 0, codes: {} }; stats.set(op, s)
  s.ms.push(ms); if (!ok) { s.err++; s.codes[code] = (s.codes[code] ?? 0) + 1 }
}
const pct = (a, p) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p / 100 * s.length))] }
async function timed(op, path, opts) {
  const t = performance.now()
  try {
    const r = await call(path, opts)
    const ok = r.status < 400 && !(op === 'answer' && r.json?.code)
    rec(op, performance.now() - t, ok, ok ? '' : (r.json?.code ?? `HTTP ${r.status}`)); return r
  } catch (e) { rec(op, performance.now() - t, false, e.cause?.code ?? e.name); return null }
}

// Supabase Auth meters sign-ins as a RATE (the dashboard's "2000 per 5 min" ≈ 6–7 a second, burst ~30), so sign-ins
// go out at ~4 a second and a rate-limited one waits and retries instead of failing.
async function signIn(email) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const r = await call('/auth/v1/token?grant_type=password', { method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' }, body: { email, password: PASSWORD } })
    if (r.json?.access_token) return { token: r.json.access_token, uid: r.json.user.id }
    const code = r.json?.error_code ?? `HTTP ${r.status}`
    if (code !== 'over_request_rate_limit') return { error: code }
    await sleep(2000 * (attempt + 1))
  }
  return { error: 'over_request_rate_limit' }
}

async function kid(k, until) {
  const h = { apikey: ANON, Authorization: `Bearer ${k.token}`, 'Content-Type': 'application/json' }
  await sleep(Math.random() * 8000) // children open the app at different moments, not all in the same millisecond
  // app open (/modules): learners, progress, wallet
  await timed('open:learners', `/rest/v1/learner_access?select=learner_id,access_role&parent_id=eq.${k.uid}`, { headers: h })
  await timed('open:progress', `/rest/v1/lesson_progress?select=lesson_id,done,level,mastered&learner_id=eq.${k.learner}`, { headers: h })
  await timed('wallet', '/rest/v1/rpc/game_wallet', { method: 'POST', headers: h, body: { p_learner: k.learner } })
  let n = 0
  while (Date.now() < until) {
    const lesson = LESSONS[n % LESSONS.length]
    await timed('answer', '/rest/v1/rpc/sync_batch', { method: 'POST', headers: h, body: { p_items: [{ k: 'lesson', a: {
      p_learner: k.learner, p_lesson: lesson, p_done: false, p_level: 1 + (n % 4), p_streak: n % 3, p_mastered: false,
      p_outcome: 'first', p_event: randomUUID(), p_answered_at: new Date().toISOString() } }] } })
    if (++n % 5 === 0) await timed('wallet', '/rest/v1/rpc/game_wallet', { method: 'POST', headers: h, body: { p_learner: k.learner } })
    await sleep(6000 + Math.random() * 4000) // one answer every ~8 s
  }
}

async function run() {
  const steps = (process.env.STEPS ?? '50,100,250,500,1000').split(',').map(Number)
  const stepSec = Number(process.env.STEP_SECONDS ?? 180)
  const users = (await findLoadUsers()).sort((a, b) => a.email.localeCompare(b.email))
  const need = Math.max(...steps)
  if (users.length < need) { console.log(`only ${users.length} fake accounts exist; run "setup ${need}" first`); return }
  console.log(`signing in ${need} fake parents…`)
  const kids = []; const signErr = {}
  await pool(users.slice(0, need), 2, async (u, i) => {
    await sleep(500) // 2 workers × 1 per 500 ms ≈ 4 sign-ins a second
    if (i && i % 100 === 0) process.stdout.write(`  … ${i}/${need}\n`)
    const s = await signIn(u.email)
    if (s.error) { signErr[s.error] = (signErr[s.error] ?? 0) + 1; return }
    const l = await call(`/rest/v1/learners?select=id&created_by=eq.${s.uid}&limit=1`)
    if (l.json?.[0]?.id) kids.push({ ...s, learner: l.json[0].id })
  })
  console.log(`signed in: ${kids.length}${Object.keys(signErr).length ? `, failed: ${JSON.stringify(signErr)}` : ''}`)
  if (kids.length < need) console.log('⚠️ fewer children than the top step — raise staging Auth → Rate Limits (sign-ins) and run again')

  console.log(`\nstep | kids | req/s | answer p50/p95/p99 ms | wallet p95 | open p95 | errors`)
  for (const n of steps) {
    if (n > kids.length) break
    stats.clear()
    const t0 = Date.now(), until = t0 + stepSec * 1000
    await Promise.all(kids.slice(0, n).map((k) => kid(k, until)))
    const secs = (Date.now() - t0) / 1000
    const all = [...stats.values()], total = all.reduce((a, s) => a + s.ms.length, 0), errs = all.reduce((a, s) => a + s.err, 0)
    const g = (op) => stats.get(op)?.ms ?? []
    const open = [...g('open:learners'), ...g('open:progress')]
    const a = g('answer')
    const codes = Object.assign({}, ...all.map((s) => s.codes))
    console.log(`${steps.indexOf(n) + 1}    | ${String(n).padEnd(4)} | ${(total / secs).toFixed(1).padEnd(5)} | ${pct(a, 50).toFixed(0)}/${pct(a, 95).toFixed(0)}/${pct(a, 99).toFixed(0)}`.padEnd(46) +
      ` | ${pct(g('wallet'), 95).toFixed(0).padEnd(10)} | ${pct(open, 95).toFixed(0).padEnd(8)} | ${errs}/${total} (${(100 * errs / Math.max(1, total)).toFixed(1)}%)${errs ? ' ' + JSON.stringify(codes) : ''}`)
    if (errs / Math.max(1, total) > 0.05 || pct(a, 95) > 3000) { console.log('stopping: errors over 5% or answer p95 over 3 s — this step is past the limit'); break }
  }
  console.log('\nNote: times include the network from your Mac to staging (us-east-1), about 250 ms from India.')
}

// ── cleanup ───────────────────────────────────────────────────────────────────────────────────────
async function cleanup() {
  const users = await findLoadUsers()
  console.log(`found ${users.length} fake accounts`)
  let gone = 0, failed = 0; const errs = {}
  await pool(users, 8, async (u) => {
    const learners = (await call(`/rest/v1/learners?select=id&created_by=eq.${u.id}`)).json ?? []
    for (const l of learners) {
      for (const t of ['point_events', 'lesson_progress', 'learner_events']) await call(`/rest/v1/${t}?learner_id=eq.${l.id}`, { method: 'DELETE' })
    }
    const r = await call(`/auth/v1/admin/users/${u.id}`, { method: 'DELETE' })
    if (r.status < 300) gone++; else { failed++; const m = r.json?.msg ?? r.json?.message ?? `HTTP ${r.status}`; errs[m] = (errs[m] ?? 0) + 1 }
  })
  console.log(`cleanup: ${gone} accounts deleted, ${failed} failed`)
  if (failed) console.log('  failures:', errs)
  const left = await findLoadUsers()
  console.log(`fake accounts left: ${left.length}`)
}

const [cmd, arg] = process.argv.slice(2)
try {
  if (cmd === 'setup') await setup(Math.min(2000, Math.max(1, Number(arg) || 50)))
  else if (cmd === 'run') await run()
  else if (cmd === 'cleanup') await cleanup()
  else console.log('usage: node load-staging.mjs setup <N> | run | cleanup')
} catch (e) { console.error('stopped:', e.message); process.exit(1) }
