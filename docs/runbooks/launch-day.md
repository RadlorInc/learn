# Runbook: launch day

One page. Read it before the announcement, keep it open during. Rollback lives next door in
[rollback.md](rollback.md); this is the "what do I watch and what does broken look like" half.

---

## T-minus: before you announce

Run in this order. Do not announce until all five are green.

```bash
npm run preflight        # tsc · vitest · build · prod advisories · sw.js bump · legal-draft flag
npm run test:chapters    # all 70 chapters × 3 frames — ~2 min
```

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
3. Smoke the routes: `/`, `/auth`, `/diagnostic`, `/menu`, `/parent`, `/legal/privacy` → all 200.
4. Send a test error and confirm it lands in the monitoring sink (once C3 is wired).
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
