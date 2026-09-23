#!/usr/bin/env bash
#
# ONE-SHOT REPAIR OF PRODUCTION'S MIGRATION LEDGER — deploy loop D4, 2026-09-23. Run only by
# .github/workflows/ledger-repair.yml (behind the production-db approval); delete both files once it has
# succeeded. Connection flags are passed through: the workflow passes `--linked`; a local rehearsal passes
# `--db-url postgresql://…` of a THROWAWAY database.
#
# WHAT IT DOES: records four migrations as applied WITHOUT RUNNING THEIR SQL. Each one's objects were
# fingerprinted on production (docs/legal/sql/d4-4-six-migrations-in-production.sql: every check "same"), and
# replaying them is not harmless — 20260905160000 would put back an older delete_my_account. After it,
# `db push` must see exactly the four new migrations and nothing else.
#
# WHAT IT REFUSES (exit 3, before writing anything): being run a second time (any of the four already
# recorded), or any ledger that is not exactly the state it was written for — pending must be exactly the
# four to mark plus the four new, with no version on production that the repo lacks.
#
# Exit codes: 0 done · 1 repaired, but the pending list afterwards is wrong (rollback printed) ·
#             2 could not look · 3 refused, nothing written.
set -uo pipefail
CONN=("$@")
[ ${#CONN[@]} -gt 0 ] || { echo "usage: $0 --linked | --db-url <url>"; exit 2; }

MARK="20260905160000 20260918100000 20260918120000 20260918140000"
PENDING="20260923120000 20260923130000 20260923140000 20260923150000"
sorted() { tr ' ' '\n' | sed '/^$/d' | sort | tr '\n' ' ' | sed 's/ $//'; }

list() { supabase migration list --output-format json "${CONN[@]}" 2>/dev/null; }

echo "== before"
before=$(list) || { echo "::error::could not read the migration list — nothing written"; exit 2; }
echo "$before" | jq -e '.migrations | length > 0' >/dev/null 2>&1 \
  || { echo "::error::the migration list came back empty or unreadable — cannot tell 'nothing to do' from 'cannot see'; nothing written"; echo "$before" | head -c 400; exit 2; }

local_only=$(echo "$before" | jq -r '.migrations[] | select(.remote == "") | .local' | sorted)
remote_only=$(echo "$before" | jq -r '.migrations[] | select(.local == "") | .remote' | sorted)
echo "pending (in the repo, not on production): ${local_only:-none}"
echo "on production, not in the repo:           ${remote_only:-none}"

for v in $MARK; do
  if ! echo " $local_only " | grep -q " $v "; then
    echo "::error::$v is already recorded on production — this repair is ONE-SHOT and has run before. Nothing written. Delete ledger-repair.yml and scripts/ledger-repair.sh."
    exit 3
  fi
done
want=$(echo "$MARK $PENDING" | sorted)
if [ "$local_only" != "$want" ] || [ -n "$remote_only" ]; then
  echo "::error::the ledger is not in the state this repair was written for. Nothing written."
  echo "  expected pending: $want"
  echo "  actual pending:   ${local_only:-none}"
  echo "  expected on production only: none — actual: ${remote_only:-none}"
  exit 3
fi

echo "== marking as applied (their SQL is NOT run): $MARK"
supabase migration repair --status applied $MARK "${CONN[@]}" \
  || { echo "::error::repair failed — re-read the list; nothing else attempted"; exit 1; }

echo "== after: what db push would now apply"
dry=$(supabase db push --dry-run --output-format json "${CONN[@]}" 2>/dev/null)
now=$(echo "$dry" | jq -r '.migrations[]? | capture("^(?<v>[0-9]+)_").v' 2>/dev/null | sorted)
echo "would push: ${now:-none}"
if [ "$now" != "$(echo "$PENDING" | sorted)" ]; then
  echo "::error::after the repair, db push would NOT apply exactly the four new migrations."
  echo "$dry" | head -c 800; echo
  echo "Rollback of this repair: supabase migration repair --status reverted $MARK ${CONN[*]}"
  exit 1
fi
echo "== after"
list | jq -r '.migrations[] | select(.remote == "" or .local == "") | "pending: \(.local)"'
echo "OK: 4 recorded as applied without running; pending = exactly $PENDING"
