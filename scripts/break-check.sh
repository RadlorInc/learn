#!/usr/bin/env bash
#
# Run one check against a DELIBERATELY BROKEN tree, prove the red is attributable to that check's
# own assertion, and put the tree back — unconditionally, on success, on failure, on Ctrl-C.
#
#   scripts/break-check.sh <test file expected to go red> "<shell command that applies the break>" [vitest args…]
#
# e.g.
#   scripts/break-check.sh src/__tests__/voiceNoOverlap.test.ts \
#     "perl -0pi -e 's/if \(_speaking \|\| _inFlight \|\| _queue\.length\)/if (_speaking)/' src/infra/useMiloSpeaker.ts"
#
# ⚠️ PORTED FROM video_reviewer/scripts/break-check.sh ON 2026-09-04, AFTER LOSING WORK TWICE IN ONE
# SESSION TO A STRAY `git checkout` IN MY OWN MUTATION CLEANUP — the second time in the same session
# I had been warned about it, with the discipline already written in CLAUDE.md and the tool already
# built one repo over. A rule that is not in the file you are standing in does not protect you.
#
# Two things it exists to stop, both of which look like a successful broken-state run:
#
#   1. THE RESTORE BEING A HABIT. "Remember to put it back" is not a mechanism. The trap below runs
#      whether or not anyone remembers, and prints `git status --short` afterwards so you can SEE
#      the tree came back rather than assuming it.
#
#   2. ⚠️ RED FOR THE WRONG REASON. A break that stops the file compiling, or throws before the
#      assertion runs, turns the run red — and a script that accepts any red then certifies a check
#      that would also go red if you deleted a semicolon. That is green-for-the-wrong-reason wearing
#      the other hat, and it fails in the confident direction. `break-verdict.mjs` requires the named
#      file to have failed on an ASSERTION.
#
# ⚠️ VITEST ONLY, DELIBERATELY. Milo has two runners and this covers one: the verdict reader knows
# vitest's JSON report and has been driven against real breaks of every kind it claims to classify.
# A playwright path would be a second reader nobody has watched fail, which is the thing this file
# exists to prevent. For an `e2e/*.spec.ts` target it still PARKS AND RESTORES YOUR WORK — the half
# that has actually cost us anything — runs the spec, and tells you the verdict was not attempted.
#
# Exit codes are about THE CHECK, not about vitest — 0 means "your check binds":
#   0  the named file went red on its own assertion
#   1  the named file passed on the broken state          → the check is decorative
#   2  usage
#   3  the break edited nothing (its pattern has drifted) → nothing was tested
#   4  the named file went red, but not on an assertion   → red for the wrong reason
#   5  the run never reached the named file               → nothing was tested
#   6  e2e target: tree restored, verdict not attempted   → read the output yourself

set -uo pipefail
cd "$(dirname "$0")/.."

[ $# -ge 2 ] || { echo "usage: $0 <test file expected to go red> \"<break command>\" [vitest args…]" >&2; exit 2; }
TARGET="$1"; shift
BREAK="$1"; shift
[ -f "$TARGET" ] || { echo "no such test file: $TARGET" >&2; exit 2; }

# ⚠️ THE VERDICT SCRIPT IS COPIED OUT OF THE TREE BEFORE ANYTHING IS STASHED. Found the hard way in
# the origin repo: `git stash --include-untracked` parked the verdict script (still untracked at the
# time) and the run died on MODULE_NOT_FOUND — the tool removed itself as part of doing its job.
# Copying it out makes that impossible regardless of what is or is not committed.
WORK="$(mktemp -d -t break-check)"
REPORT="$WORK/report.json"
cp scripts/break-verdict.mjs "$WORK/verdict.mjs"
STASHED=0

dirty() { ! git diff --quiet HEAD || [ -n "$(git ls-files --others --exclude-standard)" ]; }

restore() {
  local rc=$?
  # 1. Stash the BREAK away and drop it — this also removes any file the break created.
  if dirty; then
    git stash push --include-untracked --quiet -m "break-check: the break (dropped)" && git stash drop --quiet
  fi
  # 2. Put your own work back.
  if [ "$STASHED" = 1 ]; then git stash pop --quiet; fi
  rm -rf "$WORK"
  echo
  echo "--- tree after restore (must match what you started with) ---"
  git status --short
  git stash list | grep -q 'break-check' && echo "⚠️  a break-check stash survived — inspect 'git stash list'"
  exit $rc
}
trap restore EXIT INT TERM

# Park any uncommitted work so the break cannot be confused with it, and so the restore is a
# mechanical `git stash pop` rather than a judgement call about which hunks were yours.
if dirty; then
  git stash push --include-untracked --quiet -m "break-check: your work"
  STASHED=1
  echo "· parked your uncommitted work in a stash"
fi

echo "· applying break: $BREAK"
eval "$BREAK"

# ⚠️ A break that edited nothing (a `perl -pi` whose pattern stopped matching after a refactor)
# makes the whole run meaningless AND reports green. Fail loudly instead.
if ! dirty; then
  echo "✗ the break changed nothing — the pattern no longer matches. Nothing was tested." >&2
  exit 3
fi
echo "· broke:"; git --no-pager diff --stat HEAD

case "$TARGET" in
  e2e/*)
    echo "· running: npx playwright test $TARGET $*"
    npx playwright test "$TARGET" "$@"
    echo
    echo "⚠️  verdict NOT attempted — this tool's reader is vitest-only, on purpose (see the header)."
    echo "    Your tree is restored below. Read the run yourself: did THIS spec fail on its own expect()?"
    exit 6
    ;;
esac

echo "· running: npx vitest run $TARGET $*"
npx vitest run "$TARGET" "$@" --reporter=default --reporter=json --outputFile="$REPORT"
echo
node "$WORK/verdict.mjs" "$REPORT" "$TARGET"
