/**
 * Decides whether a broken-state run proved anything. Ported from video_reviewer 2026-09-04 and
 * re-taught vitest's report shape, which is not playwright's.
 *
 * ⚠️ RED IS NOT EVIDENCE ON ITS OWN. If a break stops a file compiling, or throws before the
 * assertion runs, the run goes red — and "I broke it and watched it go red" then certifies a check
 * that would also go red if you deleted a semicolon. That is the exact mirror of the
 * green-for-the-wrong-reason class this whole discipline exists to catch, and it fails in the
 * direction that produces confidence.
 *
 * So the red has to be attributable: the named file, failing on its own ASSERTION.
 *
 *   node scripts/break-verdict.mjs <vitest-json-report> <test file expected to go red> [vitest console output]
 *
 * ⚠️ AFTER ANY VITEST UPGRADE, RE-RUN THE LIVE BREAKS BEFORE TRUSTING THIS FILE AGAIN. Everything
 * here reads vitest's REPORT SHAPE and its ERROR MESSAGE FORMAT, both measured on vitest 4.1.9 on
 * 2026-09-04 (the hook/skip shapes on 4.1.11, 2026-09-26) — a crafted fixture would encode that shape and could never tell you it had changed.
 * The origin repo learned this the expensive way: its exit-4 case had no live break for a day, and
 * that is exactly where a real bug lived, with the crafted fixture passing while a genuine timeout
 * was being certified as proof. `scripts/break-live.sh` runs one real break per exit code and
 * asserts the code it comes back with.
 *
 * exit 0  the named file failed on an assertion            → the check binds
 * exit 1  the named file passed                            → the check does not bind
 * exit 4  the named file failed, but not on an assertion   → red for the wrong reason
 *         (incl. a hook/fixture that threw, so the tests were skipped — see `hookRed` below)
 * exit 5  the run never reached the named file, or ran it  → nothing was tested
 *         with every test skipped and nothing red
 */
import { readFileSync } from 'node:fs'
import { basename } from 'node:path'

const [reportPath, expected, consolePath] = process.argv.slice(2)
if (!reportPath || !expected) {
  console.error('usage: node scripts/break-verdict.mjs <report.json> <test file expected to go red>')
  process.exit(2)
}

let report
try {
  report = JSON.parse(readFileSync(reportPath, 'utf8'))
} catch {
  // No report at all: vitest died before it could write one (a config error, a broken setup file).
  console.error('✗ no JSON report — the run died before any test executed. Nothing was tested.')
  process.exit(5)
}

/** Reporter messages can carry colour codes; strip them before matching. */
const strip = (s) => String(s ?? '').replace(/\[[0-9;]*m/g, '')

/**
 * ⚠️ THE HEADLINE ONLY, AND THAT IS THE WHOLE MECHANISM. Vitest appends a diff and often a code
 * frame of the failing test, so a file full of `expect(` carries that token in the tail of its
 * message NO MATTER WHY IT DIED. Matching anywhere would be reading the source instead of the
 * failure — the precise bug the origin repo shipped, where a bare timeout was certified as proof
 * because six lines lower the frame quoted the test's own assertion.
 *
 * A vitest matcher failure always opens `AssertionError: …`. A thrown TypeError, an unhandled
 * rejection and a module-resolution error do not.
 */
const headline = (msg) => strip(msg).split('\n').find((l) => l.trim()) ?? ''
const isAssertion = (msg) => /^\s*AssertionError\b/.test(headline(msg))

const files = report.testResults ?? []
const wanted = files.filter((f) => basename(f.name) === basename(expected))

if (!wanted.length) {
  console.error(`✗ ${expected} never ran — nothing was tested.`)
  console.error(`  the run reported ${files.length} file(s): ${files.map((f) => basename(f.name)).join(', ') || '(none)'}`)
  process.exit(5)
}

const failed = wanted.flatMap((f) => f.assertionResults ?? []).filter((a) => a.status === 'failed')

/**
 * ⚠️ A FILE THAT FAILED WITH NO ASSERTION RESULTS AT ALL DID NOT RUN — it failed to transform,
 * import or collect. Vitest reports that as a failed FILE carrying a `message` and an EMPTY
 * `assertionResults`, which is indistinguishable from a real red if you only look at the status.
 * Measured on vitest 4.1.9: appending unparseable text to a file the test imports produces exactly
 * this, with `Transform failed with 1 error:` as the message.
 *
 * ⚠️ AND A BROKEN SETUP FILE LANDS HERE TOO, NOT ON 5, WHICH IS A LIMIT WORTH KNOWING RATHER THAN
 * PAPERING OVER. Measured: breaking `vitest.setup.ts` produces the identical shape — the named file
 * failed, zero assertion results, `Transform failed with 1 error:` — so nothing in the report can
 * tell "the file under test will not parse" from "something it needs will not parse". Both mean
 * nothing was tested, which is what 4 says. Exit 5 is reserved for the case that really is
 * distinguishable: no report written at all.
 */
const broke = wanted.filter((f) => f.status === 'failed' && (f.assertionResults ?? []).length === 0)
if (broke.length) {
  console.error(`✗ ${expected} went red WITHOUT RUNNING — the break stopped the file loading:`)
  console.error(`    ${headline(broke[0].message).slice(0, 180)}`)
  console.error('  Red here says nothing about the check. Narrow the break.')
  process.exit(4)
}

/**
 * ⚠️⚠️ A FILE CAN GO RED WITH NO TEST FAILING, AND THAT IS NOT A PASS. Found 2026-09-26 while fixing
 * FND-15: a planted break made a migration's own closing assertion raise inside `beforeAll`. Vitest
 * then SKIPS every test under that hook and fails the file — and this branch used to fall through
 * to "PASSED on the broken state", certifying a check that never looked as one that looked and saw
 * nothing. "I cannot see" rendered as "there is nothing to see".
 *
 * Measured on vitest 4.1.11 (a throwaway file per shape, JSON reporter):
 *   top-level beforeAll throws   → file `failed`, `message: "<error text>"`, every test `skipped`
 *   describe-level beforeAll     → file `failed`, `message: ""` (!), that describe's tests `skipped`
 *   beforeAll whose expect fails → same shapes; the hook's AssertionError is NOT a test's assertion
 *   afterAll throws              → file `failed`, `message: "<error text>"`, tests `passed`
 *   beforeEach throws            → each test `failed` with the hook's error → the exit-4 path below
 * ⚠️ KNOWN HOLE, NOT FIXED (2026-09-26): a `beforeEach` whose own `expect()` fails lands on each test
 *   as `AssertionError: …` and is certified 0, though no test body ran. The only tell in the report
 *   is `runHook` in the stack — vitest internals — so it was recorded rather than keyed on.
 *   describe.skip / skipIf(true) → file `passed`, every test `skipped`
 *
 * Why 4 and not 5: the file WAS reached and it DID go red — the red just came from a fixture, not
 * from a test's own assertion, which is 4's documented meaning ("red for the wrong reason") and the
 * same family as a file that fails to load. 5 stays for "nothing red, nothing tested".
 *
 * ⚠️ The JSON drops a describe-level hook's error entirely, so its name is read from vitest's
 * console output (the ` FAIL  <file> > <suite>` blocks under "Failed Suites"), which
 * break-check.sh tees to a file. `npm run break:live` asserts the name is printed, for both shapes.
 */
const all = wanted.flatMap((f) => f.assertionResults ?? [])
const didNotRun = all.filter((a) => ['skipped', 'pending', 'todo'].includes(a.status))

function setupErrors() {
  const out = []
  let text = ''
  try { text = consolePath ? strip(readFileSync(consolePath, 'utf8')) : '' } catch { /* no console copy */ }
  const suites = text.split(/Failed Suites \d+/)[1]?.split(/Failed Tests \d+|\n\s*Test Files /)[0] ?? ''
  const lines = suites.split('\n')
  lines.forEach((l, i) => {
    const m = l.match(/^\s*FAIL\s+(\S+)(.*)$/)
    if (!m || basename(m[1]) !== basename(expected)) return
    const err = lines.slice(i + 1).find((x) => x.trim())
    const where = /^\s*>/.test(m[2]) ? m[2].replace(/^\s*>\s*/, '') : '(file)'
    if (err) out.push(`${where}: ${err.trim()}`)
  })
  // No console copy (the verdict run by hand): the JSON still has a FILE-level hook's text.
  return out.length ? out : wanted.map((f) => headline(f.message)).filter(Boolean)
}

if (!failed.length && wanted.some((f) => f.status === 'failed')) {
  console.error(`✗ ${expected} went red, but NO TEST FAILED — a hook or fixture threw, so the red is not the check's:`)
  const errs = setupErrors()
  for (const e of errs) console.error(`    ${e.slice(0, 180)}`)
  if (!errs.length) console.error('    (vitest did not report the error text — read the " FAIL  … > <suite>" block in the run above)')
  console.error(`  ${didNotRun.length} of ${all.length} test(s) never ran; ${all.length - didNotRun.length} ran and passed.`)
  console.error(`  This is NOT "passed on the broken state": ${didNotRun.length ? 'the skipped tests never looked' : 'the red came from outside every test'}. Narrow the break so the fixture survives it.`)
  process.exit(4)
}

if (!failed.length && didNotRun.length === all.length) {
  console.error(`✗ ${expected} ran, but all ${all.length} of its test(s) were skipped — nothing looked. Nothing was tested.`)
  process.exit(5)
}

if (!failed.length) {
  console.error(`✗ ${expected} PASSED on the broken state. The check does not bind — you have the mechanism wrong.`)
  console.error('  ⚠️ The finding is NOT "the check needs tightening": you are measuring something else.')
  process.exit(1)
}

const onAssertion = failed.filter((a) => (a.failureMessages ?? []).some(isAssertion))

// Collateral is worth printing even when the verdict is good: a break that also took down unrelated
// files is usually broader than the defect it was meant to model.
const others = files.filter((f) => basename(f.name) !== basename(expected) && f.status === 'failed')
if (didNotRun.length) console.error(`  note: ${didNotRun.length} test(s) in ${expected} never ran (skipped, or behind a hook that threw)`)
if (others.length) console.error(`  note: ${others.length} other file(s) also went red — ${others.map((f) => basename(f.name)).join(', ')}`)

if (!onAssertion.length) {
  console.error(`✗ ${expected} went red, but NOT on an assertion — red for the wrong reason:`)
  for (const a of failed) console.error(`    ${a.fullName}: ${headline(a.failureMessages?.[0]).slice(0, 160)}`)
  console.error('  A break that stops the code running proves nothing about the check. Narrow it.')
  process.exit(4)
}

console.log(`✓ ${expected} went red on its own assertion${onAssertion.length > 1 ? `s (${onAssertion.length})` : ''}:`)
for (const a of onAssertion) {
  console.log(`    ${a.fullName}\n      ${headline(a.failureMessages?.[0]).slice(0, 160)}`)
}
process.exit(0)
