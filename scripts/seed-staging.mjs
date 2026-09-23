#!/usr/bin/env node
//
// Seed a STAGING database with FAKE data so the app is usable there. Never production.
//
//   STAGING_PROJECT_REF=<staging ref>  STAGING_SUPABASE_URL=https://<staging ref>.supabase.co \
//   STAGING_SERVICE_ROLE_KEY=<staging service-role key>  SEED_PASSWORD=<any 12+ chars> \
//   node scripts/seed-staging.mjs
//
// For a local stack (`supabase start`), STAGING_PROJECT_REF=local and a 127.0.0.1 URL.
// Full instructions: docs/staging.md.
//
// ⚠️ THE ENV NAMES ARE DELIBERATELY NOT THE APP'S. `.env.local` on this machine points at PRODUCTION
// and defines NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY; this script reads neither, so a
// shell that has sourced it cannot aim the seed at production by accident.
//
// ⚠️ REFUSES BEFORE IT CONNECTS. Every check below runs before supabase-js is even imported, and
// `stagingSeed.test.ts` proves it with a fetch trap (plus a positive control that the trap fires).
// Production's ref is READ from scripts/assert-prod-ref.sh — the one place the repo names it — so
// there is no second copy of it here to drift.
//
// Exit codes: 0 seeded · 1 the seed failed part-way (target was allowed) · 2 REFUSED, nothing contacted.

import { readFileSync } from 'node:fs'
import { randomBytes, createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

function refuse(msg) {
  console.error(`REFUSED (nothing was contacted): ${msg}`)
  process.exit(2)
}

// ── 1. The guard ────────────────────────────────────────────────────────────────────────────────
const assertFile = fileURLToPath(new URL('./assert-prod-ref.sh', import.meta.url))
let PROD_REF
try {
  PROD_REF = readFileSync(assertFile, 'utf8').match(/^EXPECTED_PROD_REF="([a-z0-9]+)"$/m)?.[1]
} catch { /* handled below */ }
// "I cannot see production's ref" must never read as "this is not production".
if (!PROD_REF) refuse(`could not read EXPECTED_PROD_REF from ${assertFile}, so cannot tell production apart.`)

const ref = process.env.STAGING_PROJECT_REF ?? ''
const url = process.env.STAGING_SUPABASE_URL ?? ''
const key = process.env.STAGING_SERVICE_ROLE_KEY ?? ''
const password = process.env.SEED_PASSWORD ?? ''

if (!ref) refuse('STAGING_PROJECT_REF is not set. Name the staging project explicitly (or "local" for a local stack).')
if (ref === PROD_REF) refuse(`STAGING_PROJECT_REF is PRODUCTION (${PROD_REF}, asserted in scripts/assert-prod-ref.sh).`)
if (!url) refuse('STAGING_SUPABASE_URL is not set.')
if (url.includes(PROD_REF)) refuse('STAGING_SUPABASE_URL names the PRODUCTION project.')
if (key.includes(PROD_REF)) refuse('STAGING_SERVICE_ROLE_KEY carries the PRODUCTION ref.')

let host
try { host = new URL(url).hostname } catch { refuse(`STAGING_SUPABASE_URL is not a URL: ${url}`) }
const loopback = ['127.0.0.1', 'localhost', '[::1]'].includes(host)
if (ref === 'local') {
  if (!loopback) refuse('STAGING_PROJECT_REF=local is only allowed with a 127.0.0.1 / localhost URL.')
} else if (host !== `${ref}.supabase.co`) {
  refuse(`STAGING_SUPABASE_URL host is "${host}", expected "${ref}.supabase.co" for STAGING_PROJECT_REF=${ref}.`)
}
if (!key) refuse('STAGING_SERVICE_ROLE_KEY is not set (the STAGING project\'s service-role / secret key).')
if (password.length < 12) refuse('SEED_PASSWORD must be set, 12+ characters. It is the password of every fake account.')

// ── 2. The seed — FAKE people only ──────────────────────────────────────────────────────────────
const { createClient } = await import('@supabase/supabase-js')
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

const must = (what) => ({ data, error }) => {
  if (error) { console.error(`seed failed at ${what}: ${error.code ?? ''} ${error.message}`); process.exit(1) }
  return data
}

/** Create the account, or reuse it on a re-run. Email is pre-confirmed so it can sign in at once. */
async function account(email, name, role) {
  let { data, error } = await db.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { full_name: name },
  })
  if (error) {
    if (error.code !== 'email_exists') must(`createUser ${email}`)({ error })
    const list = must('listUsers')(await db.auth.admin.listUsers({ perPage: 1000 }))
    data = { user: list.users.find((u) => u.email === email) }
  }
  const id = data.user.id
  // handle_new_user created the profile; the role is what the role picker would have written.
  must(`profile ${email}`)(await db.from('profiles').update({ role, display_name: name }).eq('id', id))
  return id
}

/** A GRANTED email-plus consent, as if both emails had gone out. Provider ids are visibly fake. */
async function grantedConsent(parentId, email) {
  const now = new Date()
  const row = must('parental_consents')(await db.from('parental_consents').insert({
    parent_id: parentId, method: 'email_plus', state: 'granted',
    notice_version: 'seed', privacy_version: 'seed', terms_version: 'seed', lang: 'en',
    email_address: email,
    token_hash: createHash('sha256').update(randomBytes(32)).digest('hex'),
    expires_at: new Date(now.getTime() + 7 * 864e5).toISOString(),
    request_email_sent_at: now.toISOString(), request_email_provider_id: 'seed-fake-b1',
    confirmed_at: now.toISOString(),
    second_email_provider_id: 'seed-fake-b3',
    second_notice_scheduled_for: new Date(now.getTime() + 864e5).toISOString(),
  }).select('id').single())
  return row.id
}

/** A child, created under their own fresh consent — the only way the database allows. */
async function child(parentId, parentEmail, name, ageGroup, extra = {}) {
  const existing = must('learners lookup')(await db.from('learners').select('id')
    .eq('created_by', parentId).eq('display_name', name))
  if (existing.length) return existing[0].id
  const consentId = await grantedConsent(parentId, parentEmail)
  const row = must(`learner ${name}`)(await db.from('learners').insert({
    display_name: name, avatar_index: 0, age_group: ageGroup, created_by: parentId, consent_id: consentId, ...extra,
  }).select('id').single())
  return row.id
}

async function progress(learnerId, lessons) {
  must('lesson_progress')(await db.from('lesson_progress').upsert(
    lessons.map(([lesson_id, done, level]) => ({ learner_id: learnerId, lesson_id, done, level, mastered: done })),
  ))
}

const P1 = 'parent.one@example.test', P2 = 'parent.two@example.test', T1 = 'teacher.one@example.test'
const p1 = await account(P1, 'Fake Parent One', 'parent')
const p2 = await account(P2, 'Fake Parent Two', 'parent')
const t1 = await account(T1, 'Fake Teacher One', 'teacher')

const kidA = await child(p1, P1, 'Fakekid Alpha', '6-8')
const kidB = await child(p1, P1, 'Fakekid Bravo', '9-11')
const kidC = await child(p2, P2, 'Fakekid Charlie', '6-8')
await progress(kidA, [['g3m1-t1', true, 2], ['g3m1-t2', true, 1], ['g3m1-t3', false, 1]])
await progress(kidB, [['g5m1-t1', true, 3], ['g5m1-t2', false, 0]])
await progress(kidC, [['g3m1-t1', false, 0]])

let [klass] = must('grades lookup')(await db.from('grades').select('id').eq('created_by', t1).eq('name', 'Fake Class 4B'))
if (!klass) {
  klass = must('grades')(await db.from('grades').insert({
    created_by: t1, name: 'Fake Class 4B', age_group: '9-11', grade: 4, lesson_ids: null,
  }).select('id').single())
}
const s1 = await child(t1, T1, 'Fakestudent Delta', '9-11', { grade_id: klass.id })
const s2 = await child(t1, T1, 'Fakestudent Echo', '9-11', { grade_id: klass.id })
await progress(s1, [['g4m1-t1', true, 1]])
await progress(s2, [['g4m1-t1', false, 0]])

console.log(`✓ seeded ${ref}: 2 parents, 1 teacher (class "Fake Class 4B"), 5 children, each under its own granted consent.`)
console.log(`  sign in at /auth with ${P1}, ${P2} or ${T1} and the SEED_PASSWORD you set.`)
