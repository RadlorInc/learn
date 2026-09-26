#!/usr/bin/env bash
#
# Is there a migration production may not have yet? Writes `changed=true|false` to $GITHUB_OUTPUT.
# Called by deploy.yml's `migrations-changed` job; `true` is what lets `migrate-prod` run (and wait for
# the production-db approval).
#
#   scripts/migrations-pending.sh <head sha>      env: GH_TOKEN, GITHUB_REPOSITORY, GITHUB_RUN_ID
#
# ⚠️ WHY NOT `git diff <event.before> <sha>` (OPS-02, docs/review/DEVOPS.md). That diffs only THIS push.
# A migration whose migrate-prod was rejected, failed, or cancelled while pending (12 Deploy runs were
# cancelled that way by 2026-09-25) is invisible to every later push that does not itself touch
# supabase/migrations — so it is never retried while the app half keeps deploying.
#
# So the diff starts from the last commit a `migrate-prod` job SUCCEEDED on: `supabase db push`
# applied every migration in the tree at that commit, so anything that differs since is pending.
#
# ⚠️ FAILS SAFE. Anything that cannot be determined — API unreadable, no success in the window, the
# success not an ancestor of this push, a git error — reports `true`. The cost of a wrong `true` is one
# approval for a `db push` that applies nothing (it only applies what the ledger lacks, and a success
# then becomes the new starting point). The cost of a wrong `false` is the defect above.
set -uo pipefail

head=${1:?usage: migrations-pending.sh <head sha>}
out=${GITHUB_OUTPUT:-/dev/stdout}
decide() { echo "changed=$1" >> "$out"; echo "$2"; exit 0; }

# Newest first. Only runs that finished: a cancelled run either never started migrate-prod (zero jobs)
# or was stopped by hand — skipping it can only make the starting point older, the safe direction.
# ponytail: one page (100 runs); past that it reports true and the next successful migrate-prod resets it.
# ⚠️ "I CANNOT SEE" IS NOT "THERE IS NOTHING TO SEE" (Deploy run 36235486482, 2026-09-26): that run scanned
# for 61 s, every `gh` call exited 0, and it reported no successful migrate-prod — while the three runs
# before it had one, and the same script found it from a laptop a minute later. The API answered without
# the data. Two answers here cannot be true, so they count as blind, not as a negative: a FINISHED Deploy
# run with NO jobs (every run has at least migrations-changed), and a list with NO finished run (main has
# plenty). Blind → look once more; still blind → say so. Either way the verdict stays the safe `true`.
base=""
for look in 1 2; do
  runs=$(gh api "repos/$GITHUB_REPOSITORY/actions/workflows/deploy.yml/runs?branch=main&per_page=100" \
    --jq '.workflow_runs[] | select(.conclusion == "success" or .conclusion == "failure") | "\(.id) \(.head_sha)"') \
    || decide true "could not list Deploy runs — treating migrations as pending"
  seen=0; blind=0
  while read -r id sha; do
    [ -n "$id" ] && [ "$id" != "${GITHUB_RUN_ID:-}" ] || continue
    seen=$((seen + 1))
    c=$(gh api "repos/$GITHUB_REPOSITORY/actions/runs/$id/jobs?per_page=100" \
      --jq '"\(.jobs | length) \([.jobs[] | select(.name == "migrate-prod") | .conclusion] | join(","))"') \
      || decide true "could not read jobs of Deploy run $id — treating migrations as pending"
    [ "${c%% *}" = 0 ] && { blind=$((blind + 1)); continue; }
    if [ "${c#* }" = success ]; then base=$sha; break; fi
  done <<< "$runs"
  [ -n "$base" ] && break
  [ "$seen" -gt 0 ] && [ "$blind" = 0 ] && break # a real negative: every run read, none succeeded
  [ "$look" = 1 ] && echo "blind answer ($seen finished Deploy runs, $blind with no jobs) — asking again" \
    && sleep "${MIGRATIONS_PENDING_RETRY_SECS:-10}"
done

[ -n "$base" ] || [ "$seen" -gt 0 ] \
  || decide true "could not see: the run list held no finished Deploy run, twice — treating migrations as pending"
[ -n "$base" ] || [ "$blind" = 0 ] \
  || decide true "could not see: $blind of $seen finished Deploy runs answered with no jobs, twice — treating migrations as pending"
[ -n "$base" ] || decide true "no successful migrate-prod in the last $seen finished Deploy runs — treating migrations as pending"
git merge-base --is-ancestor "$base" "$head" 2>/dev/null \
  || decide true "last successful migrate-prod ($base) is not an ancestor of $head — treating migrations as pending"

# --quiet exits 0 = same, 1 = different, anything else = error; only 0 reports false.
git diff --quiet "$base" "$head" -- supabase/migrations \
  && decide false "no migration file changed since $base (last successful migrate-prod)"
git diff --name-only "$base" "$head" -- supabase/migrations
decide true "migration files changed since $base (last successful migrate-prod)"
