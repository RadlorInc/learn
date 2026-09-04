#!/usr/bin/env bash
#
# CHECK THE CHECKER. Runs one REAL break per exit code `break-check.sh` claims to distinguish, and
# asserts the code it comes back with — plus, after every one, that the working tree came back
# byte-identical including untracked files.
#
#   scripts/break-live.sh
#
# ⚠️ THIS EXISTS BECAUSE A TOOL BUILT TO DETECT DECORATIVE CHECKS IS ITSELF A CHECK, and the origin
# repo's first version of it reported its own worst outcome — the suite PASSING on a broken tree —
# as success to anything reading the status. The question to ask of any instrument is the one this
# repo asks of everything else: WHAT RESULT IS THIS INCAPABLE OF DISTINGUISHING?
#
# ⚠️ AND THESE ARE LIVE BREAKS, NOT CRAFTED FIXTURES, ON PURPose. A hand-written JSON fixture encodes
# vitest's report shape as it was the day it was written and will keep passing against that shape
# after a vitest upgrade changes it — certifying a reader that has quietly started misclassifying.
# The origin repo lost a day to exactly that: its "red for the wrong reason" case had no live break,
# and that is precisely where a real bug lived. Re-run this after any vitest upgrade.
#
# It takes a few minutes: five vitest runs plus five stash cycles.

set -uo pipefail
cd "$(dirname "$0")/.."

SPEC=src/__tests__/voiceNoOverlap.test.ts
ENGINE=src/infra/useMiloSpeaker.ts
PASS=0; FAIL=0

fingerprint() {
  { git status --short
    git diff HEAD
    for f in $(git ls-files --others --exclude-standard); do echo "== $f"; cat "$f"; done
  } | shasum | cut -d' ' -f1
}
BEFORE="$(fingerprint)"
echo "· tree fingerprint before: $BEFORE"
echo "· $(git status --short | wc -l | tr -d ' ') dirty path(s) to protect"
echo

run() {
  local want="$1" what="$2" brk="$3"
  printf '── want exit %s — %s\n' "$want" "$what"
  scripts/break-check.sh "$SPEC" "$brk" > /tmp/break-live.out 2>&1
  local got=$?
  local now; now="$(fingerprint)"
  local ok=1
  [ "$got" = "$want" ] || { echo "   ✗ exit $got, wanted $want"; sed -n '/^✗\|^✓/p' /tmp/break-live.out | head -3 | sed 's/^/     /'; ok=0; }
  [ "$now" = "$BEFORE" ] || { echo "   ✗ THE TREE DID NOT COME BACK ($now)"; ok=0; }
  [ -z "$(git stash list | grep break-check)" ] || { echo "   ✗ a break-check stash survived"; ok=0; }
  if [ "$ok" = 1 ]; then echo "   ✓ exit $got, tree restored, no stash left"; PASS=$((PASS+1)); else FAIL=$((FAIL+1)); fi
}

# 0 — the check binds: the defect the spec was written for, restored.
run 0 "the check binds (the _speaking gate restored)" \
  "perl -0pi -e 's/if \(_speaking \|\| _inFlight \|\| _queue\.length\)/if (_speaking)/' $ENGINE"

# 1 — the check does NOT bind: a real edit the spec cannot see. ⚠️ This is the case that matters
#     most, because it is the one a decorative check produces, and it must not read as success.
run 1 "the check does not bind (a change it cannot see)" \
  "perl -0pi -e 's/rate = 0\.88, pitch = 1\.05/rate = 0.9, pitch = 1.05/' $ENGINE"

# 3 — the break edited nothing: a pattern that drifted. Green here would mean nothing was tested.
run 3 "the break edited nothing (its pattern has drifted)" \
  "perl -0pi -e 's/PATTERN_THAT_MOVED_LONG_AGO/x/' $ENGINE"

# 4 — red for the WRONG REASON: the file under test stops parsing, so the spec never runs. Any
#     tool that accepts this as proof would certify a check that also goes red on a stray semicolon.
run 4 "red for the wrong reason (the file under test stops parsing)" \
  "printf 'this is not typescript(((\n' >> $ENGINE"

# 5 — the run never reached the named file at all, so no report is written. ⚠️ THE BREAK HERE IS
#     THE CONFIG, NOT THE SETUP FILE, AND THAT WAS MEASURED RATHER THAN CHOSEN. A broken
#     vitest.setup.ts was the obvious candidate and it comes back as 4: vitest reports it as the
#     named file failing with `Transform failed with 1 error:` and zero assertion results — byte for
#     byte what a broken SOURCE file produces, so the reader cannot tell them apart and should not
#     pretend to. A broken config writes no report at all, which is the only shape that is really 5.
run 5 "the run never reached the spec (no report is written at all)" \
  "printf 'this is not typescript(((\n' >> vitest.config.ts"

echo
echo "── $PASS passed, $FAIL failed"
[ "$FAIL" = 0 ] || exit 1
