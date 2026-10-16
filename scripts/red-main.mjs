#!/usr/bin/env node
// Opens, comments on and closes the "red main" issues. Called by .github/workflows/red-main.yml.
//
//   node scripts/red-main.mjs     env: GH_TOKEN REPO EVENT MODE RUN_ID RUN_URL RUN_SHA RUN_TITLE RUN_CONCLUSION
//
// One open issue per KIND (fixed titles below). A red Deploy run opens its kind or comments on the open one.
// Every finished Deploy run then closes each OTHER open kind its own jobs prove fixed — never a kind it does not:
//   ci       every `ci / …` job succeeded (or was skipped), at least one succeeded
//   promote  the promote job succeeded
//   db       the migrate-prod job succeeded (`supabase db push` applies every pending migration)
//   staging  the migrate-staging job succeeded
//   drift    main is at most 2 commits ahead of release (also checked by the daily schedule)
//
// ⚠️ NEVER `gh issue list --search "<title>"` (measured 2026-10-06): GitHub search reads the NOT in
// "database NOT migrated" as an operator, so the search found nothing, and every red run opened a new issue
// (#383 and #384 came from two attempts of ONE run). Open issues are listed and matched on the exact title.
//
// ⚠️ "database NOT migrated" ONLY WHEN A MIGRATION WAS PENDING (by 2026-10-06 four were false).
// A failed migrate-staging on a push with no pending migration means migrate-prod was rightly skipped and
// production had nothing to apply. The run's own answer is read from deploy.yml's `migrations-changed` job: its
// step "no production migration pending" succeeds only when that job said changed=false. Not found (an older
// run, an API without steps) → pending, the loud direction.
import { execFileSync } from 'node:child_process'

const { REPO, EVENT, MODE = '', RUN_ID, RUN_URL, RUN_SHA, RUN_TITLE, RUN_CONCLUSION } = process.env
const gh = (...a) => execFileSync('gh', a, { encoding: 'utf8', maxBuffer: 64 << 20 })
const api = (p) => JSON.parse(gh('api', p))

const TITLES = {
  ci: '🔴 main is red',
  promote: '🔴 promote failed — production is NOT updating',
  db: '🔴 app is live, database NOT migrated',
  staging: '🟠 staging migrate failed (no production migration pending)',
  drift: '🔴 production is not being promoted',
}
const NO_PENDING_STEP = 'no production migration pending'

/** Which kind a failed run is. `jobs` = the jobs API's `.jobs` for the run's latest attempt. */
function failedKind(jobs) {
  const failed = jobs.filter((j) => j.conclusion === 'failure').map((j) => j.name)
  if (failed.some((n) => /promote/i.test(n))) return 'promote'
  if (failed.some((n) => /migrate-/i.test(n))) {
    const mc = jobs.find((j) => j.name === 'migrations-changed')
    const noPending = (mc?.steps ?? []).some((s) => s.name === NO_PENDING_STEP && s.conclusion === 'success')
    return !failed.includes('migrate-prod') && noPending ? 'staging' : 'db'
  }
  return 'ci'
}

/** Kinds this run's jobs prove fixed. */
function provenFixed(jobs) {
  const ok = (name) => jobs.some((j) => j.name === name && j.conclusion === 'success')
  const ci = jobs.filter((j) => j.name.startsWith('ci / '))
  const out = []
  if (ci.some((j) => j.conclusion === 'success') && ci.every((j) => ['success', 'skipped'].includes(j.conclusion))) out.push('ci')
  if (ok('promote')) out.push('promote')
  if (ok('migrate-prod')) out.push('db')
  if (ok('migrate-staging')) out.push('staging')
  return out
}

function message(kind, failed) {
  const head = `\`${RUN_SHA}\` — ${RUN_TITLE}`
  return {
    promote: `${head}\n\n**CI passed but the promote step failed**, so \`release\` did not move and production is still serving the previous commit. Working code is silently not live — the mirror of a broken commit going live.\n\nFailed job(s): ${failed}\n${RUN_URL}`,
    // OPS-03: promote does not wait for the database, so the new app is already live on the old schema.
    db: `${head}\n\n**The app from this commit is already live** (promote runs on a green CI, before the migration). **The production database was NOT migrated**, so live code is running against the old schema.\n\nThat is only safe if the app tolerates both shapes — expand/contract, see CLAUDE.md. Check the log of the failed job, then re-run it (it needs the production-db approval again) or revert the app. Closed by the first Deploy run whose migrate-prod succeeds.\n\nFailed job(s): ${failed}\n${RUN_URL}`,
    staging: `${head}\n\nmigrate-staging failed, but \`migrations-changed\` found **no migration pending for production**, so migrate-prod was rightly skipped and the production database has nothing to apply. The app from this commit is live.\n\nFix staging (its token, ref or RLS suite) before the next migration: with a staging project configured, migrate-prod runs only after migrate-staging succeeds. Closed by the first Deploy run whose migrate-staging succeeds.\n\nFailed job(s): ${failed}\n${RUN_URL}`,
    ci: `${head}\n\nCI failed on main: ${RUN_URL}\nFailed job(s): ${failed}\n\n\`release\` was not advanced, so this commit is **not** in production. That is the gate working.`,
  }[kind]
}

/** main's lead over release: an integer, 'NO_RELEASE', or 'UNKNOWN' (could not look). */
function ahead() {
  try { gh('api', `repos/${REPO}/branches/release`) } catch { return 'NO_RELEASE' }
  try {
    const n = api(`repos/${REPO}/compare/release...main?per_page=1`).ahead_by
    return Number.isInteger(n) ? n : 'UNKNOWN'
  } catch { return 'UNKNOWN' }
}

function driftMessage(a) {
  if (a === 'NO_RELEASE') return '`release` does not exist, so the promote job has never successfully run. If Vercel\'s Production Branch is already set to `release`, **production is not receiving any new code at all.**'
  if (a === 'UNKNOWN') return 'Could not compare `release` with `main` (the API answered without a count). That is not a pass: check the most recent Deploy run.'
  if (a > 2) return `Production serves \`release\`. It is **${a} commits behind main**, which means the promote job has stopped passing changes through — a gate that quietly refuses everything looks exactly like a quiet week.\n\nCheck the most recent Deploy run: https://github.com/${REPO}/actions/workflows/deploy.yml`
  return null
}

function main() {
  const open = JSON.parse(gh('issue', 'list', '-R', REPO, '--state', 'open', '--limit', '200', '--json', 'number,title'))
  const openOf = (kind) => open.find((i) => i.title === TITLES[kind])?.number
  const report = (kind, body) => {
    const n = openOf(kind)
    if (n) { gh('issue', 'comment', '-R', REPO, String(n), '--body', body); console.log(`${kind}: commented on #${n}`) }
    else { gh('issue', 'create', '-R', REPO, '--title', TITLES[kind], '--body', body); console.log(`${kind}: opened`) }
  }
  const close = (kind, why) => {
    const n = openOf(kind)
    if (n) { gh('issue', 'close', '-R', REPO, String(n), '--comment', why); console.log(`${kind}: closed #${n}`) }
  }

  if (EVENT === 'workflow_run') {
    // Unreadable jobs: a red run is still reported (as "main is red", failed job(s) "unknown") and nothing is closed.
    let jobs = []
    try { jobs = api(`repos/${REPO}/actions/runs/${RUN_ID}/jobs?per_page=100`).jobs } catch { console.log('could not read the run\'s jobs') }
    let opened = null
    if (RUN_CONCLUSION === 'failure') {
      opened = failedKind(jobs)
      report(opened, message(opened, jobs.filter((j) => j.conclusion === 'failure').map((j) => j.name).join(', ') || 'unknown'))
    }
    const proof = { ci: 'CI', promote: 'promote', db: 'migrate-prod', staging: 'migrate-staging' }
    for (const kind of provenFixed(jobs)) if (kind !== opened) close(kind, `Fixed: ${proof[kind]} succeeded in ${RUN_URL}`)
    const a = openOf('drift') ? ahead() : null
    if (Number.isInteger(a) && a <= 2) close('drift', `Fixed: main is ${a} commit(s) ahead of release after ${RUN_URL}`)
    return
  }
  if (EVENT === 'schedule' || MODE === 'drift') {
    const a = ahead()
    console.log(`ahead_by=${a}`)
    const body = driftMessage(a)
    if (body) report('drift', body)
    else close('drift', `Fixed: main is ${a} commit(s) ahead of release (daily drift check).`)
    return
  }
  if (MODE === 'ci-red' || MODE === 'promote-red') {
    report(MODE === 'ci-red' ? 'ci' : 'promote', `**Simulated** (workflow_dispatch, mode=${MODE}) — verifying the notification path. Close it.`)
  }
}

main()
