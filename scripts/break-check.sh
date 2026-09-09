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
# ⚠️⚠️ IT CANNOT VERIFY A CHECK FOR CODE YOU HAVE NOT COMMITTED — WHICH IS EXACTLY WHEN YOU WRITE
# ONE. The tree is parked with `git stash --include-untracked`, so a new migration and its new test
# are stashed AWAY before the break runs; the break then edits nothing and you get exit 3. That is
# the tool refusing to certify rather than lying, which is right — but the message says "the
# pattern has drifted", which sends you hunting a regex that is fine. Third time `git stash` has
# cost this project something (2026-09-05). COMMIT FIRST, then run this. If you cannot commit,
# mutate with a file copy and a `trap ... EXIT INT TERM` and NO git operations at all — that has
# the property this script exists for (the restore is not a habit) without the stash.
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
#   3  the break edited nothing → nothing was tested. Either the pattern drifted, OR the file is
#      UNCOMMITTED and was stashed away by the parking step above — check that first
#   4  the named file went red, but not on an assertion   → red for the wrong reason
#   5  the run never reached the named file               → nothing was tested
#   6  e2e target: tree restored, verdict not attempted   → read the output yourself
#
# ⚠️ `npm run break -- <file> '<break>'` mangles quoting inside the break command; call
# `scripts/break-check.sh` directly whenever the break contains quotes.

set -uo pipefail
cd "$(dirname "$0")/.."

[ $# -ge 2 ] || { echo "usage: $0 <test file expected to go red> \"<break command>\" [vitest args…]" >&2; exit 2; }

# ⚠️⚠️ THE BREAK RUNS IN A THROWAWAY `git worktree`, NOT IN YOUR TREE. THAT IS THE WHOLE DESIGN.
#
# This tool used to park your work with `git stash push --include-untracked` and put it back
# afterwards. That is correct for tracked changes and CATASTROPHIC for untracked ones: a file that
# exists in NO COMMIT gets swept into the stash, and when the pop goes wrong — a second session
# running this concurrently, an interrupted run, a conflicting stash — the file is gone from the
# tree AND from history, surviving only as a dangling object nobody knows to look for.
#
# It ate work four times here. On 2026-09-05, with two sessions in the repo at once, one ran this
# script and the other lost an uncommitted migration, four pages, a 302-line test and a runbook.
# They came back from `git fsck --unreachable` — that time.
#
# A header note was tried first and was written into this file the same morning the work was
# destroyed. Then a blunt refusal. Both were mitigations for a design that should not have touched
# your tree at all. So now it does not: the break is applied to a detached checkout of HEAD in a
# temp directory, `node_modules` is symlinked in, vitest runs with that as its cwd, and the
# worktree is deleted afterwards. **Nothing can happen to your working tree because nothing in it
# is read, moved, stashed or restored.** No stash means no lost stash.
#
# What this deliberately still refuses: a TARGET that is not committed, because a worktree at HEAD
# cannot see it — testing it would silently verify some other version of the file, or none.
# ══════════════════════════════════════════════════════════════════════════════════════════════
TARGET="$1"; shift
BREAK="$1"; shift
[ -f "$TARGET" ] || { echo "no such test file: $TARGET" >&2; exit 2; }
if ! git ls-files --error-unmatch "$TARGET" >/dev/null 2>&1; then
  echo "✗ $TARGET is not committed." >&2
  echo "  The break runs in a worktree checked out at HEAD, which cannot see an untracked file, so" >&2
  echo "  there would be nothing to test. Commit the check first — that is also the only way the" >&2
  echo "  verdict has something real to attribute a failure to." >&2
  exit 2
fi

# ⚠️ THE VERDICT SCRIPT IS COPIED OUT OF THE TREE BEFORE ANYTHING IS STASHED. Found the hard way in
# the origin repo: `git stash --include-untracked` parked the verdict script (still untracked at the
# time) and the run died on MODULE_NOT_FOUND — the tool removed itself as part of doing its job.
# Copying it out makes that impossible regardless of what is or is not committed.
WORK="$(mktemp -d -t break-check)"
REPORT="$WORK/report.json"
TREE="$WORK/tree"
REPO="$(pwd)"
BEFORE="$(git status --porcelain)"

cleanup() {
  local rc=$?
  # ⚠️ BACK TO THE REPO FIRST. The run `cd`s into the worktree, and removing it leaves the shell in
  # a directory that no longer exists — every later git command then dies with "Unable to read
  # current working directory", the comparison below sees an empty string, and the tool shouts
  # "YOUR TREE CHANGED" on a run where nothing changed. Caught on the first real drive of this
  # version. A check that cries wolf gets ignored exactly like one that never fires.
  cd "$REPO" || return
  # Remove the worktree. `--force` because the break deliberately left it dirty; that dirt is the
  # break itself and is meant to die with it. Your tree was never involved.
  git worktree remove --force "$TREE" >/dev/null 2>&1 || rm -rf "$TREE"
  git worktree prune >/dev/null 2>&1
  rm -rf "$WORK"
  echo
  # ⚠️ ASSERTED, NOT ASSUMED. The old version printed `git status` and invited you to eyeball it.
  # This compares against the exact state we started in and says so out loud, because "the restore
  # worked" is precisely the claim that was false the four times this tool destroyed something.
  if [ "$(git status --porcelain)" = "$BEFORE" ]; then
    echo "--- your tree is byte-identical to when this started (nothing was stashed or restored) ---"
  else
    echo "⚠️⚠️  YOUR TREE CHANGED. It should be impossible — the break ran in a worktree. Diff:" >&2
    diff <(echo "$BEFORE") <(git status --porcelain) >&2 || true
  fi
  exit $rc
}
trap cleanup EXIT INT TERM

# A detached checkout of HEAD. The break happens HERE.
git worktree add --detach --quiet "$TREE" HEAD || { echo "could not create a worktree" >&2; exit 2; }
# vitest needs the installed deps; symlinking is instant and read-only in practice.
ln -s "$REPO/node_modules" "$TREE/node_modules"
cp scripts/break-verdict.mjs "$WORK/verdict.mjs"
cd "$TREE"

dirty() { ! git diff --quiet HEAD || [ -n "$(git ls-files --others --exclude-standard)" ]; }

# ⚠️ AND THE NOTE ABOVE IS NOW ENFORCED, NOT JUST WRITTEN. Two sessions hit this independently on
# 2026-09-05 and both only documented it; a rule you have to remember while reading a 90-line header
# is not a mechanism. Refusing outright is — and it turns "exit 3, the pattern drifted" (which sends
# you hunting a regex that is fine) into a sentence naming the real cause.
if ! git diff --quiet HEAD -- "$TARGET"; then
  echo "✗ $TARGET has uncommitted changes." >&2
  echo "  This tool PARKS your work and tests the COMMITTED file, so it would verify a version you" >&2
  echo "  are not looking at. Commit the check first, then break-check it." >&2
  exit 2
fi

echo "· worktree at HEAD: $TREE (your tree is not touched)"

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
