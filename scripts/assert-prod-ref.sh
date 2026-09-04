#!/usr/bin/env bash
#
# Refuse to migrate anything unless the ref we are about to link to is the one THIS REPO says is
# production. Takes the ref from the environment (a GitHub variable, i.e. dashboard state that no
# code review ever sees) and compares it to a literal asserted in the file below.
#
# ⚠️ WHY THIS EXISTS (2026-09-05). `PROD_PROJECT_REF` sat at `qaymxunzlarwusogwyak` — the SYDNEY
# project — for two days after production moved to `wrnjqjhrbnqxornmfisf` in the region migration.
# `migrate-prod` was inert only because THREE unrelated things were absent, and one of them,
# `STAGING_PROJECT_REF`, is on the roadmap to be created deliberately. The landmine was scheduled.
#
# ⚠️ AND A WRONG REF IS WORSE THAN A MISSING ONE: a missing one fails, and a wrong one SUCCEEDS
# against the wrong database. `supabase db push` at the stale ref would have replayed migrations
# against the decommissioned copy of the children's data and reported green.
#
# The assertion is a LITERAL, on purpose. A dashboard variable can be changed by anyone with repo
# access and leaves no diff; changing which database is production should require a commit somebody
# reviews. If they legitimately disagree, the fix is to edit this file in the same PR.

set -euo pipefail

# The one place in the repo that names production. Keep in step with docs/devops.md.
EXPECTED_PROD_REF="wrnjqjhrbnqxornmfisf"

ACTUAL="${PROD_PROJECT_REF:-}"

if [ -z "$ACTUAL" ]; then
  echo "::error::PROD_PROJECT_REF is empty. Refusing to link — a blank ref links to whatever the"
  echo "::error::CLI last used, which is not a decision anybody made."
  exit 1
fi

if [ "$ACTUAL" != "$EXPECTED_PROD_REF" ]; then
  echo "::error::REFUSING TO MIGRATE — the configured project is not this repo's production."
  echo "::error::  repo variable PROD_PROJECT_REF : $ACTUAL"
  echo "::error::  asserted in scripts/assert-prod-ref.sh: $EXPECTED_PROD_REF"
  echo "::error::"
  echo "::error::A wrong ref does not fail, it SUCCEEDS against the wrong database. If production"
  echo "::error::really has moved, change the literal in this script in a reviewed commit — do not"
  echo "::error::change only the dashboard variable, which leaves no diff."
  exit 1
fi

echo "✓ production ref confirmed: $ACTUAL (matches the literal asserted in this repo)"
