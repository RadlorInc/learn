#!/usr/bin/env bash
# Pre-deploy gate. `npm run preflight` — run it before every push that touches shipped code.
#
# ⚠️ THE sw.js CHECK IS HERE BECAUSE THE RULE WAS BROKEN THE DAY THIS WAS WRITTEN (2026-08-16).
# Two commits shipped self-hosted fonts and an enforced CSP without bumping the service-worker
# VERSION. The failure does not self-heal and it is invisible: a returning user stays CONTROLLED by
# the old worker, which serves the old cached shell — including the old CSP header, because a
# cached response keeps its headers. sw.js is served must-revalidate, so the browser DOES re-fetch
# it, but the bytes were unchanged, so no update ever triggers. The verification afterwards then
# reads the PREVIOUS release and looks like the work did not ship.
#
# Deliberately a shell script and not a tool: it is five checks the CI and a human both run.
set -uo pipefail
cd "$(dirname "$0")/.."

fail=0
step () { printf '\n\033[1m▸ %s\033[0m\n' "$1"; }
ok   () { printf '  \033[32m✓\033[0m %s\n' "$1"; }
bad  () { printf '  \033[31m✗ %s\033[0m\n' "$1"; fail=1; }

step "types"
if npx tsc --noEmit; then ok "tsc clean"; else bad "tsc failed"; fi

step "unit + invariant gates"
if npx vitest run >/tmp/preflight-vitest.log 2>&1; then
  ok "$(grep -oE 'Tests +[0-9]+ passed' /tmp/preflight-vitest.log | tail -1)"
else bad "vitest failed — see /tmp/preflight-vitest.log"; fi

step "production build"
if npx next build >/tmp/preflight-build.log 2>&1; then ok "next build clean"
else bad "next build failed — see /tmp/preflight-build.log"; fi

step "dependency advisories (production)"
if npx npm audit --omit=dev --audit-level=high >/tmp/preflight-audit.log 2>&1; then ok "0 high/critical in prod deps"
else bad "npm audit found high/critical in PRODUCTION deps — see /tmp/preflight-audit.log"; fi

# ── the service-worker bump ────────────────────────────────────────────────────────────────
# Compare against origin/main: if anything a user downloads changed, VERSION must have changed too.
step "service-worker version"
git fetch -q origin main 2>/dev/null || true
if git rev-parse --verify -q origin/main >/dev/null; then
  changed=$(git diff --name-only origin/main...HEAD -- src public next.config.ts package.json | grep -v '^public/sw.js$' | wc -l | tr -d ' ')
  old=$(git show origin/main:public/sw.js 2>/dev/null | grep -m1 -oE "v[0-9]+")
  new=$(grep -m1 -oE "v[0-9]+" public/sw.js)
  if [ "$changed" -eq 0 ]; then
    ok "no shipped files changed (VERSION $new)"
  elif [ "$old" = "$new" ]; then
    bad "$changed shipped file(s) changed but public/sw.js is still $old — returning users keep the OLD cached shell. Bump it."
  else
    ok "$old → $new for $changed changed file(s)"
  fi
else
  printf '  \033[33m…\033[0m no origin/main to compare against; skipped\n'
fi

# ── the legal placeholder ──────────────────────────────────────────────────────────────────
# A draft privacy policy that LOOKS real is worse than no page: a parent would believe it.
step "legal copy"
if grep -q "export const DRAFT = true" src/app/legal/content.ts 2>/dev/null; then
  printf '  \033[33m…\033[0m legal copy is still DRAFT (fine before launch, NOT at launch — blocker B1)\n'
else ok "legal copy marked final"; fi

printf '\n'
if [ "$fail" -eq 0 ]; then
  printf '\033[32m▸ preflight passed.\033[0m Next: npm run test:chapters, then push.\n'
else
  printf '\033[31m▸ preflight FAILED — do not deploy.\033[0m\n'
fi
exit $fail
