# Runbook: launch day

One page. Read it before the announcement, keep it open during. Rollback lives next door in
[rollback.md](rollback.md); this is the "what do I watch and what does broken look like" half.

---

## T-minus: before you announce

Run in this order. Do not announce until all five are green.

```bash
npm run preflight        # tsc · vitest · build · prod advisories · sw.js bump · legal-draft flag
npm run test:chapters    # all 70 chapters × 3 frames — ~2 min, AGAINST THE DEV SERVER
```

⚠️ **RUN `test:chapters` LOCALLY, NOT AGAINST PRODUCTION.** Pointed at the live origin with
`E2E_BASE_URL`, it makes 211 navigations plus every subresource from one IP — and at roughly the
fortieth, Vercel's WAF starts serving a JS challenge instead of the app (`403`,
`x-vercel-mitigated: challenge`). A real browser solves that transparently; Playwright cannot, so
the navigation dies as `net::ERR_ABORTED` and reads as a broken chapter. **Measured 2026-08-17: it
hit at tests 41–42, the same two chapters passed on the other two frames minutes later, and the
block persisted past 20s and covered every path including static assets.** Retrying does not help —
it fails slower — and re-running until green is how a gate stops meaning anything.

The local run is what gates the code. Production needs a *smoke*, not a sweep — step 3 below, which
stays far under the threshold.

⚠️ **There is no setting to change, and nothing to buy.** This is Vercel's AUTOMATIC system-level
mitigation, on by default for every plan; nobody enabled it and it clears itself after a while. The
firewall-level remedy is an IP bypass, and it is plan-gated — `vercel firewall system-bypass list`
answers *"IP Bypass is unavailable for this plan"* on this account. ⚠️ And
`VERCEL_AUTOMATION_BYPASS_SECRET` does **not** help here: that bypasses DEPLOYMENT PROTECTION (the
Vercel-Authentication login wall), which is a different system from the firewall. It is wired up in
`playwright.config.ts` for the case it DOES solve — this project has
`ssoProtection: all_except_custom_domains`, so PREVIEW deployments need it before any automation can
reach them.

Then, **after** the deploy has landed:

1. **Wait for the new `sw.js` VERSION to be live** before verifying anything:
   ```bash
   curl -s https://milo-story-mode.vercel.app/sw.js | grep -m1 VERSION
   ```
   ⚠️ Vercel takes ~1 minute to propagate. A check run too early reports a **transient 404** on
   chunk URLs that are still rolling out — it looks exactly like a real defect, and learning to
   ignore it is how you miss a real one.
2. **Clear the service worker before you judge anything.** In DevTools console on the live site:
   ```js
   (async () => { for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister()
                  for (const k of await caches.keys()) await caches.delete(k); location.reload() })()
   ```
   ⚠️ **Without this you are grading the previous release.** A controlled worker serves the old
   cached shell *including its old HTTP headers* — this bit us on 2026-08-16, where a shipped CSP
   and self-hosted fonts both appeared not to have deployed.
3. **Smoke production — a handful of requests, not a sweep.** Routes `/`, `/auth`, `/diagnostic`,
   `/menu`, `/parent`, `/legal/privacy` → all 200; then open ONE story chapter
   (`/story?ch=order`) and ONE game chapter and look at them. Also check the headers that only
   exist in production, because a 200 says nothing about them:
   ```bash
   curl -sI https://milo-story-mode.vercel.app/assets/backgrounds/garden.png | grep -i cache-control
   # want: public, max-age=2592000, stale-while-revalidate=31536000
   curl -sI https://milo-story-mode.vercel.app/sw.js | grep -i cache-control
   # want: max-age=0, must-revalidate — if this ever goes long-lived, the update path is dead
   curl -sI -H 'Accept: image/avif,*/*' \
     'https://milo-story-mode.vercel.app/_next/image?url=%2Fassets%2Fbackgrounds%2Fgarden.png&w=1280&q=75' \
     | grep -iE 'content-type|content-length'   # want image/avif, ~81 KB against a 583 KB source
   ```
   ⚠️ And read the browser console on a real page. Three separate things the enforced CSP broke
   (fonts, MediaPipe, the recorded voice) were invisible to every route check and visible in one
   console line.
4. **Send a test error and confirm it is RETAINED**, not just logged:
   ```bash
   curl -s -X POST https://milo-story-mode.vercel.app/api/report-error \
     -H 'Content-Type: application/json' -d '{"message":"launch-day smoke"}'
   ```
   Then in the Supabase SQL editor: `select at, source, message from public.error_events
   order by at desc limit 5;` — the row should be there.
   ⚠️ **If the table is empty but Vercel logs show `[milo.client-error]`, the service-role key is
   not set** — `errorSink.ts` writes to the table only when `SUPABASE_SERVICE_ROLE_KEY` is present
   and deliberately has NO anon fallback. Set it in Vercel → Settings → Environment Variables
   (value: Supabase → Settings → API → `service_role`), redeploy, retry.
5. **Rehearse the rollback once**, on a preview. A rollback you have never run is a plan, not a path.

---

## What to watch, and what it means

| signal | where | what a bad reading looks like |
|---|---|---|
| **Errors** | monitoring sink / Vercel logs (`[milo.error]`) | Any spike at all. One repeated stack from many users = P0. |
| **Uptime** | uptime monitor on `/api/health` | Non-200. |
| **RLS denials** | Supabase logs, error code `42501` | A spike means someone is probing the API, or a real bug is denying legitimate access. Both matter. |
| **Lead spam** | `diagnostic_leads` insert rate | The table takes anonymous inserts. A jump = bot; the answer is the Vercel WAF rule. |
| **Signups vs activations** | analytics (once C4 is wired) | Signups with no first chapter finished = the funnel is broken somewhere after the account. |

---

## The three failures most likely on day one

1. **"It worked yesterday / it looks old."** → Stale service-worker shell. Ask them to fully close
   and reopen the app (not just refresh). This is the FIRST question, not the last.
2. **"I never got the email."** → Transactional email. Until custom SMTP is wired (blocker B6) this
   rides Supabase's built-in mailer, which has already tripped a bounce warning. Check Supabase Auth
   logs before assuming the parent mistyped.
3. **"Her progress is gone."** → Usually not lost. Progress is local-first: private browsing, a
   different browser, or a different device with no sign-in all look identical to data loss. Ask
   which device and whether they were signed in. `docs/support.md` §7 reads the diagnostic block.

---

## If you have to roll back

⚠️⚠️ **REHEARSED IN DAYLIGHT 2026-09-09, AND ONE ASSUMED MECHANISM DOES NOT WORK. READ THE FIRST
ROW BEFORE YOU TOUCH ANYTHING.**

| route | works? | measured |
|---|---|---|
| **Move `release` backwards** (force-push it at an older commit) | ❌ **NO** | force-push succeeded, `release` moved, **production unchanged after 395s** |
| **Vercel → promote a previous deployment** | ✅ (Vercel's own feature) | **not exercised by me** — see the caveat below |
| **Revert the commit and push forward** | ✅ **YES** | **280s** from `git push` to production serving it |

### ⚠️ Why moving `release` backwards does nothing

Vercel builds a **commit**, not a branch pointer. It had already built the older commit, so pointing
`release` back at it produced **no new deployment at all** — the production alias simply stayed on
the most recent production build. Verified against the Vercel API: after the force-push there was no
new deployment, and the newest `target: "production"` entry was still the bad one.

**So the sentence "rolling back = pointing `release` at the previous good commit" is false.** It is
the natural reading of how `promote` works (it pushes `main` → `release`), and it is exactly the
thing that would have been discovered at 9pm on launch night.

### The two routes that do work

**A — FASTEST, and what to reach for first (Vercel Instant Rollback).**

```
Vercel dashboard → adaptivelearn → Deployments
  → the last known-good deployment with target "production"
  → ⋯ menu → "Promote to Production"      (instant, no rebuild)
```

⚠️ **CAVEAT, stated plainly: I could not exercise this.** It needs dashboard access or the `vercel`
CLI, neither of which this session had. What IS confirmed is that Vercel considers the previous
production deployments eligible — the API reports `isRollbackCandidate: true` on them. **Treat route
A as documented-but-unproven and route B as the one with a stopwatch on it.** If A is ever used for
real, record the wall-clock here.

**B — PROVEN, ~5 minutes, needs nothing but git.**

```bash
# 1. revert the bad commit (creates a NEW commit — that is the point)
git checkout main && git pull --ff-only origin main
git revert --no-edit <bad-sha>

# 2. ⚠️ MOVE THE SERVICE WORKER VERSION *FORWARD*, never back.
#    public/sw.js keys its caches off VERSION. Reusing a version a browser has already cached
#    leaves that browser on the old shell. Rollback by version number is not a thing.
#    e.g. if the bad build was v180, the revert ships v181 — NOT v179.
$EDITOR public/sw.js      # bump VERSION forward
git add public/sw.js && git commit --amend --no-edit

# 3. push. deploy.yml runs CI, then `promote` pushes main -> release, then Vercel builds.
git push origin main

# 4. watch the run FOR THAT SHA (gh pr checks / gh run list can hand you an older run)
sha=$(git rev-parse HEAD)
run=$(gh run list --commit "$sha" --workflow=Deploy --limit 1 --json databaseId --jq '.[0].databaseId')
gh run watch "$run" --exit-status
gh run view "$run" --json headSha,conclusion   # confirm headSha is the sha you pushed

# 5. confirm production actually serves it — by service worker version
curl -s -H 'Cache-Control: no-cache' https://adaptivelearn.radlor.com/sw.js | head -1
git ls-remote origin refs/heads/main refs/heads/release   # must be equal
```

⚠️ **Route B is gated by CI.** If CI is red, `promote` skips and the rollback does not ship. That is
the gate working, and on launch night it is also a trap: if you must ship past a red CI, route A is
the only option, because it needs no build at all.

### Can we close the doors?

**No. There is no maintenance mode, no holding page and no kill switch.** Checked 2026-09-09:

- there is **no `middleware.ts`** anywhere in the repo, so nothing intercepts every request;
- the only app-wide flag is `PAYWALL_ENABLED` in `useChapterGate`, which gates chapter access and
  is currently `false` — it is not a door;
- no env var, header or route serves a holding page.

**So "stopping" today means taking the site down** — removing the production domain in Vercel, or
pointing DNS away. Both are blunt, and both are slower to undo than route A.

⚠️ **Stated as a known gap, not built.** A holding page is a real piece of work (a middleware plus a
flag plus a way to let yourself back in) and launch week is the wrong week to add a new
request-intercepting layer. If Rafi wants one, it is a deliberate decision with its own gates.

## Who does what

Single-operator launch. There is no rota, so the honest version is: **do not announce at a time you
cannot watch for the next three hours.** Pick a morning.
