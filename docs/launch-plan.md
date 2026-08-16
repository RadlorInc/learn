# Milo — MVP launch plan

> **Re-grounded 2026-08-16 against the running system.** Everything in §1 was checked, not assumed —
> the command or query that produced each fact is named so you can re-run it. The previous draft
> (2026-07-18) is still right about *shape*, and was stale about *state*: it said "sw.js at v27"
> (now v95) and assigned work to named specialist agents that were removed on 2026-07-20.
>
> **Two owners only: `[C]` = Claude can do it, `[F]` = only you can.** An item is `[F]` when it needs
> money, a login I don't have, a legal signature, a real human on a real device, or your taste.

**The goal this plan is written against:** not "it builds" — *nothing breaks on day one and the
first parents trust it.*

---

## 1. Verified state — what is actually true today

Checked 2026-08-16 against prod and the live database.

### ✅ Genuinely solid (do not re-do this work)

| area | evidence |
|---|---|
| **RLS + RPC authorization** | Supabase security advisors report **no ERROR-level lints** — no missing RLS. All four `SECURITY DEFINER` RPCs (`sync_session`, `sync_diagnostic`, `sync_recheck`, `can_self_grant_access`) verify the caller owns the learner via `learner_access` and raise `42501` otherwise. `sync_session` also bounds every input and derives xp/coins **server-side**, ignoring client values. |
| **Security headers** | Live on prod: HSTS `max-age=63072000; includeSubDomains; preload`, `x-frame-options: DENY`, `nosniff`, `referrer-policy`, enforced CSP for `object-src`/`base-uri`/`frame-ancestors`/`form-action`. |
| **Service-worker update path** | `sw.js` is served `max-age=0, must-revalidate`; the worker does `skipWaiting()` + `clients.claim()` and deletes every cache not matching `VERSION`. So a version bump really does reach returning users. |
| **Error boundary** | `MiloErrorBoundary` wraps the whole app in `layout.tsx`, and there is an error-report sink at `/api/report-error` + `instrumentation.ts` (`onRequestError`). |
| **Chapter completeness** | All **70** declared chapters resolve to a real component (checked `chapters.ts` against `registry.tsx` + `storyChapters.tsx` — 0 missing). |
| **Gates** | `tsc` 0 · **1,039** vitest · `next build` 0 · every markdown link resolves. |
| **Data deletion** | A parent can delete a learner profile from `/parent` (`handleDelete`). |
| **Prod is up** | `/`, `/story`, `/teen-preview`, `/auth`, `/diagnostic`, `/parent`, `/profile`, `/shop`, `/insights` all 200; 404 page returns a real 404. |

### ✅ Items the old plan listed as open that are now DONE
- `milo-happy.png` / `milo-thinking.png` — **present**; those 404s are fixed.
- E2E correctness personas — **un-`fixme`'d** and active in `e2e/adaptive.spec.ts`.
- `Permissions-Policy` — `camera=(self)`, which is now *correct*: the 9–11 band answers with the webcam.

### ⚠️ Open, ranked by what actually hurts on day one

| # | finding | evidence | why it hurts |
|---|---|---|---|
| **1** | **No privacy policy, no terms, no COPPA notice.** No `/privacy`, `/terms`, or `/legal` route exists at all. | `find src/app` | Marketing a children's product in the US without these is the one failure that is not just embarrassing but *legal*. Long lead time — an attorney takes weeks. |
| ~~2~~ ✅ | ~~**4 high-severity advisories in production dependencies**~~ **FIXED** — `next`, `nanoid`, `postcss`, `sharp`. | `npm audit --omit=dev` | Shipping known-vulnerable code on a kids' product. `next` needs a `--force`-class bump, so it needs a full re-verify. |
| **3** | **No external error monitoring.** `MONITORING_INGEST_URL` is unset, so errors only reach Vercel logs — nobody is paged. | `src/instrumentation.ts` | On day one you find out something is broken *from a parent's email*, hours late. |
| **4** | **No uptime monitor.** `/api/health` exists and nothing watches it. | `find src/app/api` | The site can be down all night and you won't know. |
| **5** | **No product analytics at all.** Zero analytics deps installed. | `package.json` | You cannot answer "did anyone finish a chapter?" — so you cannot tell a successful launch from a silent one. |
| **6** | **No email sending.** No SMTP/Resend integration anywhere. | grep across `src/` | Password reset + invites ride Supabase's built-in mailer (already warned for bounces); the week-6 re-check nudge cannot work at all. |
| **7** | **Leaked-password protection disabled.** | Supabase security advisor | Parents reuse breached passwords on a child's account. One dashboard toggle. |
| ~~8~~ ✅ | ~~**4 dead 3D dependencies still shipping**~~ **REMOVED** — `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three`. Nothing in `src/` imports them. | `grep "from 'three'" src/` → 0 | Dead weight in the bundle and extra audit surface, on the band children actually use. |
| **9** | **`diagnostic_leads` accepts anonymous INSERT** with no app-level rate limit. | `20260704140000_diagnostic_leads.sql` | Your public funnel's lead table can be spammed on day one. Needs the Vercel WAF. |
| ~~10~~ ✅ | ~~**No `error.tsx` / `global-error.tsx`.**~~ **FIXED** The client boundary does not cover a server render error or a crash in the root layout. | `find src/app` | The rare bad case shows Next's raw error screen to a child instead of a Milo screen. |
| **11** | **No staging environment.** Every change is verified against prod. | `docs/devops.md` | Launch week is exactly when you need somewhere to test that is not the thing parents are using. |
| **12** | **No PITR / restore drill.** | Supabase plan | If data is lost or corrupted there is no rehearsed way back. |
| ~~14~~ ✅ | ~~**Fonts load from Google at RUNTIME**~~ **FIXED** — self-hosted via `next/font` (`396bfe0`). — three CSS `@import`s to `fonts.googleapis.com` in `globals.css`, not `next/font`. Found by the C7 gate: an intermittent `fonts.gstatic.com` 404 (1 run in 12). | `grep gstatic src/app/globals.css` | Three consequences, and the first is a trap: **enforcing the CSP would break every font in the app** (`font-src 'self' data:` does not allow gstatic), so plan item C11 as written would ship the whole product in fallback system fonts. Also: CSS `@import` is the slowest way to load a font and it is on the critical path for a child on a slow phone; and every child's browser makes a request to Google, which is a third-party data flow the COPPA data-map (1.1) has to account for. **Fix is `next/font/google`**, which self-hosts at build time and removes all three at once. |
| **13** | Supabase **performance** advisors: `auth_rls_initplan` on 5 diagnostic tables, 3 unindexed FKs. | performance advisors | **Not launch-blocking at MVP scale** — real at thousands of users. Listed so it is a known deferral, not a surprise. |

---

## 2. Blockers — do not open the doors until every one is green

Ordered by lead time, longest first. **Start #1 today**; it is the only item that can take weeks.

| # | item | owner | why it is a blocker |
|---|---|---|---|
| B1 | Engage an attorney; get **Privacy Policy + ToS + COPPA parental-notice** signed off | **[F]** | Legal exposure marketing to under-13s. Weeks of lead time. |
| B2 | Publish those documents as real pages + link them from signup and the diagnostic lead capture | **[C]** builds, **[F]** supplies the final text | A policy that exists in a Google Doc protects nobody. |
| B3 | Decide **free vs paid at launch** | **[F]** | Everything in GTM depends on it. *Recommendation: free.* There is no efficacy number yet to justify charging, and it deletes the whole Stripe long-pole. |
| ~~B4~~ ✅ | ~~Fix the 4 high-severity production advisories + drop the 4 dead 3D deps~~ **DONE** (`05446b5`) — `npm audit` 4 high → **0**, prod deps 10 → 7. | **[C]** | — |
| B5 | Wire error monitoring (Sentry or any HTTP sink) and an uptime monitor on `/api/health` | **[F]** creates the account, **[C]** wires it | Without these, launch day is blind. |
| B6 | Custom SMTP (Resend/Postmark/SES) | **[F]** account + DNS, **[C]** integrates | Password reset and invites must actually arrive. |
| B7 | Turn on leaked-password protection + Auth rate limits | **[F]** dashboard | Two toggles; one is in the advisor report right now. |
| B8 | Vercel WAF rate-limit rules (esp. the anon lead-insert path) | **[F]** dashboard | Your only defence against day-one abuse. |
| B9 | **A real human signs up on a real device with a real email**, adds a learner, runs the diagnostic, plays a chapter, and confirms progress persists after closing the app | **[F]** | I cannot receive an email or hold a phone. Nothing else substitutes for this. |
| B10 | Decide the public brand: **`mi2utor.com` vs `milo-story-mode.vercel.app` vs "Milo"** | **[F]** | Blocks every piece of copy, and the support email domain. |
| B11 | Confirm `support@mi2utor.com` actually receives mail and someone reads it | **[F]** | It is hard-coded as the in-app support address. |

---

## 3. What I can do — a work queue, in order

Nothing here needs an account, a card, or a signature. Give me the go and I work down the list.

### Tier 1 — before launch, in this order

| # | task | size | notes |
|---|---|---|---|
| ✅ C1 | **Dependency security pass** — DONE 2026-08-16 (`05446b5`). `npm audit`: **4 high → 0**, production and dev. `next` 16.2.6 → 16.3.1 (the advisory is a Turbopack middleware bypass, which is this build), `sharp` → 0.35.3, plus the 4 dead 3D deps removed — production dependencies **10 → 7**. | M | — |
| ✅ C2 | **Crash + 404 screens** — DONE 2026-08-16 (`611b061`). `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx`, all in Milo's voice with two ways out, verified in a **production** build. Closes finding #10. | S | — |
| C3 | **Wire monitoring** once you give me a DSN/ingest URL | S | The seam already exists — it is one env var plus verification. |
| C4 | **Wire analytics** and instrument the funnel: signup → diagnostic complete → first chapter finished → week-6 re-check | M | Pick the tool (I suggest one that is COPPA-safe and cookieless); I will make sure it records **no child PII**. |
| C5 | **Legal pages** — build `/privacy`, `/terms`, and a parent-facing "your data" page, wired into signup + lead capture | M | I build the pages and the consent UI; the *words* must come from B1. |
| C6 | **Data export + deletion, parent-facing** — deletion exists; I will add "download my child's data" and make the deletion path explicit and findable | M | COPPA gives parents both rights. |
| ✅ C7 | **Full-app smoke** — DONE 2026-08-16 (`e1190aa`). `npm run test:chapters` drives **all 70 chapters × 3 frames = 211 checks: 211 passed.** Per chapter: no failure screen, a visible control, no horizontal overflow, no offscreen control, zero console errors. The chapter list is DERIVED from source, so it cannot rot. | L | Re-run before every deploy. ~2 min. |
| C8 | **Launch-day runbook** — what to watch, what "broken" looks like, the exact rollback command, and a one-page triage script for the first parent email | S | So launch day has a procedure, not adrenaline. |
| C9 | **Support content** — FAQ, "how it works" for parents, a privacy FAQ, and what to do when progress looks lost | M | Cuts your day-one support load. |

### Tier 2 — can land during or just after soft launch

| # | task |
|---|---|
| ✅ C10 | **Self-host the fonts** — DONE (`396bfe0`). All five families via `next/font/google`, 0 runtime requests to Google. |
| C10b | Supabase performance advisors: wrap `auth.<fn>()` in `(select …)` on the 5 diagnostic policies, add the 3 missing FK indexes |
| ✅ C11 | **CSP ENFORCED** — DONE (`a968dbb`). One policy, not two. ⚠️ Enforcing it as written would have silently killed every AR chapter (MediaPipe fetches WASM from jsDelivr, its model from storage.googleapis.com, and runs a `blob:` worker); those are now explicit, named allowances. Verified with a negative control and 211/211 chapters against the enforced build. Two `unsafe-inline`s remain, documented — removing them needs nonces and a styling rewrite, not a config change. |
| C12 | Week-6 nudge automation (blocked on B6) |
| C13 | Finish the two remaining 9–11 chapters (OrderDesk, LevelRun) — *only if* you want the band uniform at launch |
| C14 | An automated pre-deploy checklist so the gate + `sw.js` bump can never be skipped |

---

## 4. What only you can do — and why

| # | task | why it cannot be me |
|---|---|---|
| F1 | **Attorney** for privacy/ToS/COPPA sign-off | I am not legal counsel; a signature carries liability. **Start this first — it is the long pole.** |
| F2 | Accounts + spend: Sentry/monitoring, SMTP, uptime, Supabase paid tier (for PITR) | Card details and account creation. |
| F3 | Every Supabase/Vercel **dashboard toggle**: leaked-password protection, Auth rate limits, PITR, WAF | I have read access to advisors, not to your dashboard settings. |
| F4 | **The human tap-through** (B9) — real email, real phone, real child if possible | I cannot receive email or hold a device. |
| F5 | **Watch a real child use it for 20 minutes, silently** | The single highest-value hour before launch, and no automation substitutes for it. Every big correction in this repo came from you spotting something on a screen. |
| F6 | Brand/domain decision, all final copy, pricing | Your taste and your business. |
| F7 | The **efficacy claim wording** | Until a real week-6 cohort exists, it must be a *promise* ("we find the gap and re-check in 6 weeks"), never a *proven outcome* ("90% close the gap"). That is an FTC risk, and it is your call with the attorney. |
| F8 | Recruit the **soft-launch cohort** (5–20 friendly families) | Real consent from real parents. |
| F9 | The **go / no-go** call | Yours. |

---

## 5. The order I would actually run it

```
Week 0   F1 attorney engaged (longest lead — start immediately)
         C1 dependency security pass · C2 error pages
         F2/F3 accounts + dashboard toggles → C3 monitoring wired
Week 1   C4 analytics · C7 full device smoke · C6 data rights
         B6 SMTP → real password-reset test
Week 2   C5 legal pages (needs F1's text) · C9 support content · C8 runbook
         F4 human tap-through · F5 watch a real child
Week 3   SOFT LAUNCH to F8's cohort — invite-only, watched daily
         fix what they hit; efficacy cohort clock starts
Week 4+  open the doors only when: 0 P0/P1 defects from real use,
         error rate flat, attorney signed off, and you say go
```

**Do not skip the soft launch.** It is the difference between finding your day-one bug in front of
20 friendly families and finding it in front of everyone.

---

## 6. Launch-day runbook (skeleton — C8 fills it in)

- **Before the announcement:** full gate green (`npm test` · `npm run test:chapters` — 211 checks) · `sw.js` VERSION bumped · smoke the 9 routes · confirm monitoring is receiving events (send a test error) · confirm the rollback works *by doing it once on a preview*.
- **Watch:** error sink, uptime monitor, Supabase logs for `42501` spikes (RLS denials = someone probing), lead-table insert rate (spam).
- **Rollback:** Vercel → promote the previous deployment. Rehearse it before you need it (`docs/runbooks/rollback.md`).
- **The stale-shell gotcha:** a returning user's service worker can serve the old shell until a reload. If a parent reports something weird right after a deploy, "fully close and reopen the app" is the first question, not the last.

---

## 7. Decisions I need from you

1. **Free or paid at launch?** *(recommend: free)*
2. **US-only?** *(recommend: yes — EU adds GDPR-K and roughly doubles the compliance surface for no launch benefit)*
3. **All six age bands, or launch narrower?** *(recommend: launch all — every one of the 70 chapters resolves and the gates are green; but a narrower launch means a tighter efficacy story and less to watch)*
4. **Schools/classrooms at launch?** *(recommend: no — direct-to-parent only; schools pull in FERPA)*
5. **Brand: `mi2utor.com` or `Milo`?**
6. **Which of my Tier-1 list do you want first?** My order: C1 → C2 → C7, because those three are the ones that stop it breaking.
