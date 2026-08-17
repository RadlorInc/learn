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

```bash
# Vercel dashboard → Deployments → the previous good one → Promote to Production
```

Then: bump `public/sw.js` VERSION **again** on the way back, or returning users keep caching the
broken shell. Full procedure and the data/migration half: [rollback.md](rollback.md).

---

## Who does what

Single-operator launch. There is no rota, so the honest version is: **do not announce at a time you
cannot watch for the next three hours.** Pick a morning.
