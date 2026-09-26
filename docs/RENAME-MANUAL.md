# Rename to Radlic — the founder's manual

**Started 24 September 2026.** The product is renamed **Radlic** and moves to **radlic.com**. The company stays
**Radlor Inc.** (address, `support@radlor.com`, `noreply@radlor.com` unchanged). The Milo mascot is removed; a
child's own avatar (fox, rabbit, bear, cat) stays, because the consent notice lists it as collected data.

Everything below that needs you is in order. The build record is `docs/legal/LOOP-STATE.md` → **Rename**.

---

## A. Before merging the rename PR (so the new domain works on day one)

1. [ ] Confirm you own `radlic.com` (registrar), and where its DNS is managed.
   ⚠️ Measured 24 Sep 2026 by accident (see §F.5): `radlic.com` currently answers as a **parked domain** that
   redirects to `/lander`. If that is not yours, stop here.
2. [ ] Vercel → project → **Domains**: add `radlic.com`, and `www.radlic.com` → redirect to the apex. Set the DNS
   records Vercel shows; wait for the certificate.
3. [ ] Supabase → **Authentication → URL Configuration**: Site URL `https://radlic.com`; add redirect URLs
   `https://radlic.com/**` and **keep** `https://adaptivelearn.radlor.com/**` during the switch.
4. [ ] Google Cloud → **OAuth consent screen**: app name **Radlic**, authorized domain `radlic.com`,
   homepage/privacy/terms URLs on `radlic.com`. **Credentials**: add the Supabase callback; keep the old one during
   the switch.
5. [ ] Vercel → Production env: **`NEXT_PUBLIC_SITE_URL`** — a name check; you set the value. **This one variable is
   the switch** for canonical URLs, every link in an email, and the old-domain redirect:
   - while it says `https://adaptivelearn.radlor.com`, the old domain serves the app exactly as today and nothing
     redirects (safe to merge before the new domain is ready);
   - set it to `https://radlic.com` **and redeploy** (a `NEXT_PUBLIC_` value is baked in at build time), and the old
     domain 308s to the new one with the path, the query and the `#fragment` kept; `/api/*` keeps answering on both.
   - ⚠️ If the variable is **unset**, the app falls back to Vercel's production domain — so making `radlic.com` the
     project's primary production domain flips the switch on its own. Set the variable explicitly rather than rely on
     that.

## B. Merge the rename PR — in THIS order — and check the screens

1. [ ] Merge the PR. `deploy.yml` offers the migration **`20260924120000_notice_v6_radlic.sql`** behind
   `production-db`. Take a backup first, as before.
2. [ ] **Approve `production-db` BEFORE promoting to `release`.** ⚠️ The database refuses a consent request for a notice
   version it does not know, so an app sending `notice-v6` against a database without this row takes **no** new
   consent at all. The other order is harmless (the row sits unused; v5 stays current). The log must name only
   `20260924120000_notice_v6_radlic.sql`.
3. [ ] Proof, in the SQL editor: `select version, seq, reconsent_required from public.consent_notice_versions order by seq;`
   → a `notice-v6 | 6 | false` row.
4. [ ] Promote to `release`. Then check, signed in as a test parent:
   - landing `/`, sign-in and create-account (`/auth`), the set-password page — the wordmark "Radlic", no fox image;
   - the parent dashboard with a child and **empty** ("Welcome to Radlic!", no fox), the role picker, Account, Help;
   - add a child → the notice says Radlic / radlic.com and "Withdraw permission for all **your** children";
   - the child's home (`/modules`) — unchanged, no mascot;
   - `/help`, a `/legal/*` page (still dark), a 404, the offline page, the install banner (it shows the new icon);
   - the emails: **B1** (subject "Please confirm: permission for your children to use Radlic", sender **Radlic**),
     **B3**, the cancellation email; every link goes to `radlic.com`;
   - the browser tab title, and "Add to Home Screen" (name and icon: a plain "Radlic" wordmark).

## C. After merging

6. [ ] Visit an old consent link on `adaptivelearn.radlor.com` and confirm it lands on `radlic.com` with the
   `#t=` token intact. (Proven locally in a real Chromium — `e2e/old-domain-redirect.spec.ts` — but not on the real
   domains.)
7. [ ] Supabase **Auth email templates**: "Milo"/"AdaptiveLearn" → "Radlic", links → the new domain.
8. [ ] **Resend**: the sender display name. ⚠️ For the **app's** mail it is set in code (`EMAIL_FROM =
   'Radlic <noreply@radlor.com>'`) and changes with the deploy — nothing to do in Resend for it. `RESEND_API_KEY` in
   Vercel must stay a **Full access** key (B3 cancellation needs it; server only, never `NEXT_PUBLIC_`). For
   **Supabase Auth SMTP** (its own sending-only key) the display name lives in Supabase → Auth → SMTP: change the
   name only. Never paste a key anywhere.
9. [ ] **Stripe**: the product names and the card statement descriptor (e.g. `RADLIC`). The lookup keys
   (`milo_family_monthly_v1`, `milo_family_annual_v1`) are identifiers and stay. ⚠️ **Also the webhook endpoint URL**
   → `https://radlic.com/api/stripe/webhook` (the old one keeps working: `/api/*` is never redirected).
10. [ ] After 30 days with no traffic on the old domain: remove the old redirect URLs from Supabase and Google.

## D. Outside the product

- [ ] **A new logo and favicon** (the mascot is gone). Today the PWA icons are a plain "Radlic" wordmark in the app's
  display font (Fredoka), made in code — not a logo. The favicon is still Vercel's default triangle.
- [ ] Social handles; any marketing pages outside this repo.
- [ ] **radlor.com** (`../radlor-site`): its product page and JSON-LD reference the app's entity id. The app now
  declares `APP_ID = https://radlic.com/#app` (was `https://adaptivelearn.radlor.com/#app`); update `site.ts` there to
  the same string, or the two sites describe two products.
- [ ] Kaggle notebooks (`scripts/kaggle/*.ipynb`) and their zip names say `milo-voice-…` — identifiers on your Kaggle
  account; rename only if you publish them.

## E. Trademark

- [ ] A USPTO clearance search for "Radlic" (education software / online classes) through the attorney, before
  public launch. (Also in ATTORNEY-PACKET.md, A11.)

## F. Questions and warnings (the build continued past each)

1. ✅ **DECIDED 2026-09-25 (founder): rewritten without a mascot and shown as the KG / Grade 1 / Grade 2 tabs** — his pictures removed, his lines reworded so no character is named; `renameGate.test.ts` now scans `src/features/chapters/` like the rest of the app. The original note: **BLOCKED — the 23 hidden legacy story chapters are built around Milo.** His sprites
   (`public/assets/characters/milo_*.png`), his spoken lines (the voice corpora) and their stories. They are hidden
   (`LEGACY_CHAPTERS_HIDDEN`, unreachable on every route) so no one sees him today, and I did not rewrite them.
   **Decide:** delete them, or rewrite them without a mascot before they are ever shown. Until then
   `renameGate.test.ts` fails if the flag is turned off.
2. **Moving domains signs everyone out and strands what is stored on the old origin.** `localStorage`, IndexedDB,
   the service worker and the sign-in session are per-origin: after the switch every device starts signed out on
   radlic.com with an empty local store. That includes a child's **unsent** answers, if any were queued offline at
   the moment of the switch. **The old-origin app cannot flush them first**: the redirect is server-side, so on the
   old domain the app never loads again once it is on. (Answers queued before the switch are sent whenever the app
   was opened online before it — the existing sync does that — so the gap is only work still queued at switch time.)
   Every account is a test account today, so this is acceptable **now** — and it is a reason to switch **before the
   first real family**, not after.
3. **The old-origin service worker stays installed** on devices that used the old domain. It is network-first for
   pages and never caches a redirect, so navigations reach the 308; it simply stops updating there. Harmless; not
   removable from the server side.
4. **Re-consent.** `notice-v6` is registered with `reconsent_required = false`: parents who agreed to the Milo
   notice are not asked again. Whether a name/domain change is a material change is ATTORNEY-PACKET.md **A11**; if
   yes, one UPDATE of that row asks everyone again.
5. **An accidental request to the real radlic.com**, while building the redirect test (24 Sep 2026): Playwright's
   request routing does not catch the request a browser makes by following a redirect, so two test runs made plain
   GETs to `https://radlic.com/consent/withdraw` (no cookies, no data, a dummy token) and got a parked-domain
   redirect to `/lander`. The test was rewritten so that is impossible (Chromium's resolver maps every other
   hostname to NOTFOUND). It is also how we know the domain is parked today (§A.1).
6. **`e2e/old-domain-redirect.spec.ts` runs locally only** — no CI job runs Playwright (a known gap, not new). CI runs
   the redirect's server half (`oldDomainRedirect.test.ts`).

## N0. Inventory (24 September 2026, before any change)

Every hit, one row each, is in [`docs/rename/inventory.tsv`](rename/inventory.tsv) (5,368 rows; regenerate with
`node scripts/rename-inventory.mjs`). Searched case-insensitively: `milo`, `adaptivelearn`, `adaptive learn`,
`adaptive-learn`, `radlor.com`, `mascot`, `🦊`, plus every `milo*` image file. The category is a rule in the
script, not a hand verdict — read the rule before trusting a row.

**What the big numbers are.** *mascot* is mostly the **23 hidden legacy story chapters** (bands 3–8, hidden
behind `LEGACY_CHAPTERS_HIDDEN` since 2026-09-13), whose story IS Milo: his sprites, his lines, and their voice
corpora (`scripts/.voice-corpus-*.json`, 2,500 lines). *identifier* is CSS tokens (`--milo-orange`), module names
(`useMiloSpeaker`), storage keys (`milo_active_learner`), the child-login domain
`learner.adaptivelearn.invalid` (stored in `auth.users`), and the company addresses. *historical* is the session
history, the legal loop's log, applied migrations and SQL proofs.

| category | hits |
|---|---|
| historical | 629 |
| identifier | 499 |
| mascot | 3921 |
| third-party | 54 |
| url-domain | 59 |
| visible | 206 |
| **total** | **5368** |

| category | file | hits |
|---|---|---|
| historical | `docs/handoff-archive.md` | 580 |
| historical | `docs/legal/CONSENT-ONCE-ROUND2.md` | 2 |
| historical | `docs/legal/LOOP-STATE.md` | 8 |
| historical | `docs/legal/ROUND-2.md` | 5 |
| historical | `docs/legal/sql/d6-proof.sql` | 3 |
| historical | `docs/recovered-menu-rpc-work.patch` | 3 |
| historical | `handoff.md` | 24 |
| historical | `supabase/migrations/20260823213619_prune_diagnostic_items.sql` | 1 |
| historical | `supabase/migrations/20260905110530_admin_learning_invariant_safe.sql` | 1 |
| historical | `supabase/migrations/20260923130000_parental_consent_flow.sql` | 2 |
| identifier | `.github/workflows/backup.yml` | 9 |
| identifier | `CLAUDE.md` | 1 |
| identifier | `docs/app-terms-of-service.md` | 6 |
| identifier | `docs/backup-restore-runbook.md` | 2 |
| identifier | `docs/devops.md` | 1 |
| identifier | `docs/framing-12-18.md` | 2 |
| identifier | `docs/launch-plan.md` | 5 |
| identifier | `docs/legal/01-refund-and-cancellation-policy.md` | 4 |
| identifier | `docs/legal/02-coppa-direct-notice-to-parents.md` | 2 |
| identifier | `docs/legal/03-consent-and-checkout-screen-copy.md` | 1 |
| identifier | `docs/legal/05-information-security-program.md` | 1 |
| identifier | `docs/legal/06-parent-rights-procedure.md` | 5 |
| identifier | `docs/legal/08-cookie-and-tracking-notice.md` | 9 |
| identifier | `docs/legal/09-email-compliance.md` | 1 |
| identifier | `docs/legal/10-review-of-partner-drafts.md` | 1 |
| identifier | `docs/legal/11-privacy-policy.md` | 3 |
| identifier | `docs/legal/12-terms-of-service.md` | 4 |
| identifier | `docs/legal/13-placeholder-worksheet.md` | 1 |
| identifier | `docs/legal/16-audit-findings-and-actions.md` | 1 |
| identifier | `docs/legal/ATTORNEY-PACKET.md` | 1 |
| identifier | `docs/legal/READINESS.md` | 1 |
| identifier | `docs/legal/README.md` | 1 |
| identifier | `docs/legal/es/01-refund-and-cancellation-policy.md` | 4 |
| identifier | `docs/legal/es/06-parent-rights-procedure.md` | 4 |
| identifier | `docs/legal/es/08-cookie-and-tracking-notice.md` | 10 |
| identifier | `docs/legal/es/11-privacy-policy.md` | 3 |
| identifier | `docs/legal/es/12-terms-of-service.md` | 3 |
| identifier | `docs/runbooks/data-requests.md` | 1 |
| identifier | `docs/runbooks/launch-day.md` | 2 |
| identifier | `docs/staging.md` | 1 |
| identifier | `docs/supabase-region-migration.md` | 1 |
| identifier | `docs/support.md` | 2 |
| identifier | `docs/teen-17-18-gameshell-plan.md` | 1 |
| identifier | `docs/teen-kit-build-contract.md` | 19 |
| identifier | `docs/teen-kit-interfaces.md` | 4 |
| identifier | `e2e/README.md` | 1 |
| identifier | `e2e/all-chapters.spec.ts` | 1 |
| identifier | `e2e/chapter-resume.spec.ts` | 1 |
| identifier | `e2e/demo-route.spec.ts` | 1 |
| identifier | `e2e/directions.spec.ts` | 1 |
| identifier | `e2e/needs-sound.spec.ts` | 1 |
| identifier | `e2e/session.ts` | 5 |
| identifier | `package.json` | 1 |
| identifier | `playwright.config.ts` | 2 |
| identifier | `public/sw-register.js` | 1 |
| identifier | `public/sw.js` | 4 |
| identifier | `scripts/break-check.sh` | 1 |
| identifier | `scripts/break-live.sh` | 1 |
| identifier | `scripts/indexnow.sh` | 3 |
| identifier | `scripts/verify-backup.sh` | 2 |
| identifier | `src/__tests__/_voiceCorpus68.test.ts` | 1 |
| identifier | `src/__tests__/accountDeletion.test.ts` | 2 |
| identifier | `src/__tests__/authEventLogger.test.ts` | 2 |
| identifier | `src/__tests__/bigOrSmallGeometry.test.ts` | 1 |
| identifier | `src/__tests__/billingCancel.test.ts` | 1 |
| identifier | `src/__tests__/blockYardRegroup.test.ts` | 3 |
| identifier | `src/__tests__/chapterCastDistinct.test.ts` | 1 |
| identifier | `src/__tests__/chapterDirections.test.ts` | 4 |
| identifier | `src/__tests__/chapterResume.test.ts` | 4 |
| identifier | `src/__tests__/childLogin.test.ts` | 8 |
| identifier | `src/__tests__/coinShopPay.test.ts` | 8 |
| identifier | `src/__tests__/consentDeletion.test.ts` | 1 |
| identifier | `src/__tests__/consentFlow.test.ts` | 1 |
| identifier | `src/__tests__/consentSurfaces.test.ts` | 1 |
| identifier | `src/__tests__/consentZeroExemptions.test.ts` | 1 |
| identifier | `src/__tests__/homeTimeGeometry.test.ts` | 20 |
| identifier | `src/__tests__/hopAlongGeometry.test.ts` | 20 |
| identifier | `src/__tests__/lessonAutoAdvance.test.ts` | 1 |
| identifier | `src/__tests__/lessonPoints.test.ts` | 1 |
| identifier | `src/__tests__/placeValueBundle.test.ts` | 5 |
| identifier | `src/__tests__/playTimeGeometry.test.ts` | 1 |
| identifier | `src/__tests__/publicSeo.test.ts` | 4 |
| identifier | `src/__tests__/sliceShopFit.test.ts` | 10 |
| identifier | `src/__tests__/speechRate.test.ts` | 1 |
| identifier | `src/__tests__/swTakeover.test.ts` | 6 |
| identifier | `src/__tests__/tickTockClock.test.ts` | 4 |
| identifier | `src/__tests__/voiceNoOverlap.test.ts` | 1 |
| identifier | `src/__tests__/withdrawExportE2e.test.ts` | 1 |
| identifier | `src/app/ResumeSignedIn.tsx` | 1 |
| identifier | `src/app/admin/layout.tsx` | 1 |
| identifier | `src/app/api/health/route.ts` | 1 |
| identifier | `src/app/auth/new-password/page.tsx` | 1 |
| identifier | `src/app/auth/page.tsx` | 4 |
| identifier | `src/app/auth/set-password/page.tsx` | 2 |
| identifier | `src/app/demo/page.tsx` | 2 |
| identifier | `src/app/email/unsubscribe/page.tsx` | 2 |
| identifier | `src/app/error.tsx` | 1 |
| identifier | `src/app/game/page.tsx` | 1 |
| identifier | `src/app/globals.css` | 78 |
| identifier | `src/app/help/page.tsx` | 1 |
| identifier | `src/app/layout.tsx` | 3 |
| identifier | `src/app/llms.txt/route.ts` | 1 |
| identifier | `src/app/menu/page.tsx` | 18 |
| identifier | `src/app/page.tsx` | 1 |
| identifier | `src/app/parent/account/page.tsx` | 2 |
| identifier | `src/app/parent/invites/page.tsx` | 5 |
| identifier | `src/app/parent/page.tsx` | 4 |
| identifier | `src/app/parent/plan/page.tsx` | 1 |
| identifier | `src/app/site.ts` | 8 |
| identifier | `src/core/childLogin.ts` | 1 |
| identifier | `src/data/supabase/client.ts` | 1 |
| identifier | `src/data/supabase/useAuthGuard.ts` | 1 |
| identifier | `src/data/supabase/useLearnerSession.ts` | 1 |
| identifier | `src/features/billing/SubscriptionCard.tsx` | 2 |
| identifier | `src/features/billing/cancelNotice.ts` | 2 |
| identifier | `src/features/classes/Classes.tsx` | 3 |
| identifier | `src/features/classes/ExerciseEditor.tsx` | 2 |
| identifier | `src/features/consent/ConsentLink.tsx` | 1 |
| identifier | `src/features/consent/Notice.tsx` | 1 |
| identifier | `src/features/consent/config.ts` | 3 |
| identifier | `src/features/consent/copy.ts` | 3 |
| identifier | `src/features/dashboard/ChildPage.tsx` | 5 |
| identifier | `src/features/dashboard/Helpers.tsx` | 7 |
| identifier | `src/features/dashboard/LessonsTab.tsx` | 3 |
| identifier | `src/features/lessons/LessonPlayer.tsx` | 1 |
| identifier | `src/features/lessons/Performance.tsx` | 3 |
| identifier | `src/infra/AuthEventLogger.tsx` | 1 |
| identifier | `src/infra/analytics.ts` | 1 |
| identifier | `src/infra/errorSink.ts` | 3 |
| identifier | `src/infra/reportCrash.ts` | 1 |
| identifier | `src/infra/storage/activePlan.ts` | 1 |
| identifier | `src/infra/storage/chapterResume.ts` | 1 |
| identifier | `src/infra/storage/demoRun.ts` | 1 |
| identifier | `src/infra/storage/handInput.ts` | 1 |
| identifier | `src/infra/storage/kv.ts` | 6 |
| identifier | `src/infra/storage/lastError.ts` | 1 |
| identifier | `src/infra/storage/lastPlayed.ts` | 1 |
| identifier | `src/infra/storage/leadEmail.ts` | 1 |
| identifier | `src/infra/storage/lessonProgress.ts` | 1 |
| identifier | `src/infra/storage/lessonSeen.ts` | 1 |
| identifier | `src/infra/storage/lessonStanding.ts` | 1 |
| identifier | `src/infra/storage/lessonSync.ts` | 1 |
| identifier | `src/infra/storage/speechRate.ts` | 1 |
| identifier | `src/infra/storage/voicePref.ts` | 2 |
| identifier | `src/infra/useMiloSpeaker.ts` | 5 |
| identifier | `src/infra/useOfflineSync.tsx` | 3 |
| identifier | `src/infra/voiceClipPlayer.ts` | 1 |
| identifier | `src/shared/hooks/useChapterPhase.ts` | 1 |
| identifier | `src/shared/ui/BackButton.tsx` | 6 |
| identifier | `src/shared/ui/ChapterDone.tsx` | 3 |
| identifier | `src/shared/ui/ChildLoginSheet.tsx` | 1 |
| identifier | `src/shared/ui/CrashScreen.tsx` | 1 |
| identifier | `src/shared/ui/DataRights.tsx` | 1 |
| identifier | `src/shared/ui/ErrorBoundary.tsx` | 1 |
| identifier | `src/shared/ui/PWAInstallBanner.tsx` | 3 |
| identifier | `src/shared/ui/ParentPinGate.tsx` | 1 |
| identifier | `src/shared/ui/StorageGate.tsx` | 1 |
| identifier | `supabase/tests/rls_regression.sql` | 10 |
| mascot | `docs/framing-12-18.md` | 5 |
| mascot | `docs/labs-vision.md` | 7 |
| mascot | `docs/launch-plan.md` | 2 |
| mascot | `docs/storyboards/angle-shop.md` | 19 |
| mascot | `docs/storyboards/follower-growth.md` | 1 |
| mascot | `docs/teen-15-16-gameshell-plan.md` | 2 |
| mascot | `docs/teen-explainer-video-plan.md` | 9 |
| mascot | `docs/teen-game-pattern.md` | 10 |
| mascot | `docs/teen-kit-build-contract.md` | 9 |
| mascot | `docs/teen-kit-interfaces.md` | 3 |
| mascot | `docs/ux-design.md` | 29 |
| mascot | `docs/ux-invariants.md` | 4 |
| mascot | `e2e/all-chapters.spec.ts` | 3 |
| mascot | `e2e/directions.spec.ts` | 1 |
| mascot | `e2e/personas.ts` | 1 |
| mascot | `e2e/ready-bar.spec.ts` | 1 |
| mascot | `e2e/screens.spec.ts` | 1 |
| mascot | `public/assets/characters/milo-happy.png` | 1 |
| mascot | `public/assets/characters/milo-thinking.png` | 1 |
| mascot | `public/assets/characters/milo_a.png` | 1 |
| mascot | `public/assets/characters/milo_boat.png` | 1 |
| mascot | `public/assets/characters/milo_c.png` | 1 |
| mascot | `public/assets/characters/milo_chef.png` | 1 |
| mascot | `public/assets/characters/milo_explorer.png` | 1 |
| mascot | `public/assets/characters/milo_fishing.png` | 1 |
| mascot | `public/assets/characters/milo_grocer.png` | 1 |
| mascot | `public/assets/characters/milo_hop.png` | 1 |
| mascot | `public/assets/characters/milo_hop_side.png` | 1 |
| mascot | `public/assets/characters/milo_idle.png` | 1 |
| mascot | `public/assets/characters/milo_painter.png` | 1 |
| mascot | `public/assets/characters/milo_postman.png` | 1 |
| mascot | `public/assets/characters/milo_side.png` | 1 |
| mascot | `public/assets/characters/milo_top.png` | 1 |
| mascot | `public/assets/characters/milo_underwater.png` | 1 |
| mascot | `public/assets/characters/milo_walk.png` | 1 |
| mascot | `public/offline.html` | 1 |
| mascot | `scripts/.voice-corpus-6-8.json` | 1378 |
| mascot | `scripts/.voice-corpus-68-walkthrough.json` | 7 |
| mascot | `scripts/.voice-corpus-9-11.json` | 1114 |
| mascot | `scripts/.voice-corpus-static-stevie.json` | 5 |
| mascot | `scripts/.voice-corpus-static-teddy.json` | 8 |
| mascot | `src/__tests__/_voiceCorpus35.test.ts` | 16 |
| mascot | `src/__tests__/bigOrSmallGeometry.test.ts` | 3 |
| mascot | `src/__tests__/blockYardRegroup.test.ts` | 7 |
| mascot | `src/__tests__/chapterCastDistinct.test.ts` | 4 |
| mascot | `src/__tests__/chapterCompletion.test.ts` | 2 |
| mascot | `src/__tests__/chapterDirections.test.ts` | 3 |
| mascot | `src/__tests__/coinShopPay.test.ts` | 14 |
| mascot | `src/__tests__/homeTimeGeometry.test.ts` | 6 |
| mascot | `src/__tests__/hopAlongGeometry.test.ts` | 5 |
| mascot | `src/__tests__/placeValueBundle.test.ts` | 7 |
| mascot | `src/__tests__/playTimeGeometry.test.ts` | 4 |
| mascot | `src/__tests__/publicRoutes.test.ts` | 1 |
| mascot | `src/__tests__/sliceShopFit.test.ts` | 16 |
| mascot | `src/__tests__/storybookQuestions.test.ts` | 1 |
| mascot | `src/__tests__/tickTockClock.test.ts` | 14 |
| mascot | `src/__tests__/voiceNoOverlap.test.ts` | 4 |
| mascot | `src/app/auth/callback/page.tsx` | 1 |
| mascot | `src/app/auth/page.tsx` | 1 |
| mascot | `src/app/auth/set-password/page.tsx` | 1 |
| mascot | `src/app/game/page.tsx` | 4 |
| mascot | `src/app/menu/page.tsx` | 2 |
| mascot | `src/app/page.tsx` | 1 |
| mascot | `src/app/parent/invites/page.tsx` | 1 |
| mascot | `src/app/parent/page.tsx` | 5 |
| mascot | `src/features/chapters/ChapterPortal.tsx` | 1 |
| mascot | `src/features/chapters/DirectionsCard.tsx` | 1 |
| mascot | `src/features/chapters/game/CountingStoryChapter.tsx` | 1 |
| mascot | `src/features/chapters/lessons/Numbers100Lesson.tsx` | 1 |
| mascot | `src/features/chapters/lessons/Shapes2D3DLesson.tsx` | 1 |
| mascot | `src/features/chapters/lessons/_kit.tsx` | 27 |
| mascot | `src/features/chapters/story/BeadShop.tsx` | 27 |
| mascot | `src/features/chapters/story/BigOrSmall.tsx` | 45 |
| mascot | `src/features/chapters/story/BlockYard.tsx` | 57 |
| mascot | `src/features/chapters/story/BuildingBlocks.tsx` | 42 |
| mascot | `src/features/chapters/story/CoinShop.tsx` | 63 |
| mascot | `src/features/chapters/story/FollowTheLeader.tsx` | 12 |
| mascot | `src/features/chapters/story/ForestWalk.tsx` | 31 |
| mascot | `src/features/chapters/story/HomeTime.tsx` | 66 |
| mascot | `src/features/chapters/story/HopAlong.tsx` | 85 |
| mascot | `src/features/chapters/story/MarketDay.tsx` | 30 |
| mascot | `src/features/chapters/story/MeasureIt.tsx` | 33 |
| mascot | `src/features/chapters/story/MiloSprite.tsx` | 9 |
| mascot | `src/features/chapters/story/NestTree.tsx` | 35 |
| mascot | `src/features/chapters/story/NumberTown.tsx` | 38 |
| mascot | `src/features/chapters/story/PlayTime.tsx` | 52 |
| mascot | `src/features/chapters/story/RainbowTown.tsx` | 29 |
| mascot | `src/features/chapters/story/ReadyBar.tsx` | 1 |
| mascot | `src/features/chapters/story/SeesawPark.tsx` | 30 |
| mascot | `src/features/chapters/story/ShapeStudio.tsx` | 32 |
| mascot | `src/features/chapters/story/ShapeTown.tsx` | 29 |
| mascot | `src/features/chapters/story/SliceShop.tsx` | 57 |
| mascot | `src/features/chapters/story/StoryTime.tsx` | 48 |
| mascot | `src/features/chapters/story/StoryWorld.tsx` | 27 |
| mascot | `src/features/chapters/story/TickTock.tsx` | 52 |
| mascot | `src/features/chapters/story/WorldSelect.tsx` | 5 |
| mascot | `src/features/chapters/story/biomes.ts` | 11 |
| mascot | `src/features/chapters/story/canvas/sheets.ts` | 12 |
| mascot | `src/features/chapters/story/chalkboard.tsx` | 3 |
| mascot | `src/features/chapters/story/chapters.tsx` | 3 |
| mascot | `src/features/chapters/story/clock.ts` | 33 |
| mascot | `src/features/chapters/story/critters.tsx` | 4 |
| mascot | `src/features/chapters/story/market.ts` | 22 |
| mascot | `src/features/chapters/story/preteen/kit.tsx` | 10 |
| mascot | `src/features/chapters/story/slice.ts` | 43 |
| mascot | `src/features/chapters/story/world1.tsx` | 22 |
| mascot | `src/features/chapters/story/yard.tsx` | 8 |
| mascot | `src/features/dashboard/DashNav.tsx` | 3 |
| mascot | `src/infra/miloPointer.ts` | 3 |
| mascot | `src/infra/useMiloSpeaker.ts` | 1 |
| mascot | `src/shared/hooks/useAdaptive.ts` | 1 |
| mascot | `src/shared/ui/ChapterDone.tsx` | 1 |
| mascot | `src/shared/ui/CrashScreen.tsx` | 1 |
| mascot | `src/shared/ui/ErrorBoundary.tsx` | 1 |
| mascot | `src/shared/ui/MiloPointer.tsx` | 7 |
| mascot | `src/shared/ui/NewLessonsSoon.tsx` | 1 |
| mascot | `src/shared/ui/PWAInstallBanner.tsx` | 1 |
| mascot | `src/shared/ui/StorageGate.tsx` | 2 |
| third-party | `scripts/chatterbox-kaggle.ipynb` | 3 |
| third-party | `scripts/kaggle-josh-notebook.py` | 5 |
| third-party | `scripts/kaggle/josh-g3.ipynb` | 4 |
| third-party | `scripts/kaggle/josh-g3m1.ipynb` | 4 |
| third-party | `scripts/kaggle/josh-g4.ipynb` | 4 |
| third-party | `scripts/kaggle/josh-g5-no-g5m1.ipynb` | 4 |
| third-party | `scripts/kaggle/josh-g5m1.ipynb` | 4 |
| third-party | `scripts/kaggle/josh-g6-no-g6m1-no-g6m2-no-g6m3-no-g6m4.ipynb` | 4 |
| third-party | `scripts/kaggle/josh-g6-no-g6m5-no-g6m6-no-g6m7.ipynb` | 4 |
| third-party | `scripts/kaggle/josh-g6.ipynb` | 4 |
| third-party | `scripts/kaggle/josh-g7.ipynb` | 4 |
| third-party | `scripts/kaggle/josh-g8.ipynb` | 4 |
| third-party | `scripts/stripe-products.mts` | 5 |
| third-party | `supabase/config.toml` | 1 |
| url-domain | `README.md` | 1 |
| url-domain | `docs/app-terms-of-service.md` | 1 |
| url-domain | `docs/devops.md` | 1 |
| url-domain | `docs/legal/02-coppa-direct-notice-to-parents.md` | 3 |
| url-domain | `docs/legal/03-consent-and-checkout-screen-copy.md` | 6 |
| url-domain | `docs/legal/08-cookie-and-tracking-notice.md` | 1 |
| url-domain | `docs/legal/11-privacy-policy.md` | 4 |
| url-domain | `docs/legal/12-terms-of-service.md` | 4 |
| url-domain | `docs/legal/13-placeholder-worksheet.md` | 1 |
| url-domain | `docs/legal/es/08-cookie-and-tracking-notice.md` | 1 |
| url-domain | `docs/legal/es/11-privacy-policy.md` | 4 |
| url-domain | `docs/legal/es/12-terms-of-service.md` | 4 |
| url-domain | `docs/runbooks/launch-day.md` | 6 |
| url-domain | `e2e/all-chapters.spec.ts` | 1 |
| url-domain | `e2e/storybook-pills.spec.ts` | 1 |
| url-domain | `scripts/indexnow.sh` | 1 |
| url-domain | `src/__tests__/legalSurface.test.ts` | 1 |
| url-domain | `src/__tests__/publicSeo.test.ts` | 1 |
| url-domain | `src/__tests__/storybookQuestions.test.ts` | 1 |
| url-domain | `src/__tests__/swTakeover.test.ts` | 1 |
| url-domain | `src/app/legal/[slug]/page.tsx` | 1 |
| url-domain | `src/app/site.ts` | 4 |
| url-domain | `src/features/billing/cancelNotice.ts` | 1 |
| url-domain | `src/features/consent/copy.ts` | 9 |
| visible | `CLAUDE.md` | 1 |
| visible | `README.md` | 1 |
| visible | `docs/app-terms-of-service.md` | 4 |
| visible | `docs/architecture.md` | 1 |
| visible | `docs/billing-stage-1.md` | 1 |
| visible | `docs/billing-stage-2.md` | 1 |
| visible | `docs/devops.md` | 1 |
| visible | `docs/launch-plan.md` | 4 |
| visible | `docs/legal/01-refund-and-cancellation-policy.md` | 2 |
| visible | `docs/legal/02-coppa-direct-notice-to-parents.md` | 4 |
| visible | `docs/legal/03-consent-and-checkout-screen-copy.md` | 5 |
| visible | `docs/legal/06-parent-rights-procedure.md` | 1 |
| visible | `docs/legal/08-cookie-and-tracking-notice.md` | 3 |
| visible | `docs/legal/09-email-compliance.md` | 2 |
| visible | `docs/legal/11-privacy-policy.md` | 3 |
| visible | `docs/legal/12-terms-of-service.md` | 3 |
| visible | `docs/legal/13-placeholder-worksheet.md` | 1 |
| visible | `docs/legal/14-supabase-findings-and-ai-content.md` | 1 |
| visible | `docs/legal/ATTORNEY-PACKET.md` | 2 |
| visible | `docs/legal/README.md` | 1 |
| visible | `docs/legal/es/01-refund-and-cancellation-policy.md` | 1 |
| visible | `docs/legal/es/06-parent-rights-procedure.md` | 1 |
| visible | `docs/legal/es/08-cookie-and-tracking-notice.md` | 3 |
| visible | `docs/legal/es/11-privacy-policy.md` | 3 |
| visible | `docs/legal/es/12-terms-of-service.md` | 2 |
| visible | `docs/runbooks/launch-day.md` | 1 |
| visible | `docs/supabase-region-migration.md` | 1 |
| visible | `docs/support.md` | 2 |
| visible | `docs/teen-17-18-gameshell-plan.md` | 1 |
| visible | `e2e/chapter-resume.spec.ts` | 1 |
| visible | `e2e/demo-route.spec.ts` | 1 |
| visible | `next.config.ts` | 1 |
| visible | `public/manifest.json` | 2 |
| visible | `public/offline.html` | 2 |
| visible | `public/sw-register.js` | 4 |
| visible | `scripts/break-check.sh` | 1 |
| visible | `scripts/voice-generate.mts` | 1 |
| visible | `src/__tests__/billingCancel.test.ts` | 2 |
| visible | `src/__tests__/emailSuppression.test.ts` | 1 |
| visible | `src/__tests__/hopAlongGeometry.test.ts` | 1 |
| visible | `src/__tests__/legalLinksOnCollection.test.ts` | 1 |
| visible | `src/__tests__/legalSurface.test.ts` | 1 |
| visible | `src/__tests__/publicRoutes.test.ts` | 1 |
| visible | `src/__tests__/publicSeo.test.ts` | 1 |
| visible | `src/__tests__/rosterPaused.test.ts` | 1 |
| visible | `src/__tests__/speechRate.test.ts` | 1 |
| visible | `src/__tests__/voiceBoundaryVerb.test.ts` | 2 |
| visible | `src/app/admin/layout.tsx` | 1 |
| visible | `src/app/auth/callback/page.tsx` | 1 |
| visible | `src/app/auth/page.tsx` | 2 |
| visible | `src/app/auth/set-password/page.tsx` | 2 |
| visible | `src/app/consent/layout.tsx` | 1 |
| visible | `src/app/email/unsubscribe/layout.tsx` | 1 |
| visible | `src/app/email/unsubscribe/page.tsx` | 1 |
| visible | `src/app/error.tsx` | 1 |
| visible | `src/app/global-error.tsx` | 2 |
| visible | `src/app/globals.css` | 2 |
| visible | `src/app/help/page.tsx` | 4 |
| visible | `src/app/layout.tsx` | 12 |
| visible | `src/app/legal/[slug]/page.tsx` | 3 |
| visible | `src/app/llms.txt/route.ts` | 5 |
| visible | `src/app/menu/page.tsx` | 4 |
| visible | `src/app/not-found.tsx` | 2 |
| visible | `src/app/opengraph-image.tsx` | 1 |
| visible | `src/app/page.tsx` | 3 |
| visible | `src/app/parent/account/page.tsx` | 1 |
| visible | `src/app/parent/page.tsx` | 2 |
| visible | `src/app/parent/plan/page.tsx` | 1 |
| visible | `src/app/site.ts` | 3 |
| visible | `src/core/chapters.ts` | 3 |
| visible | `src/core/praise.ts` | 1 |
| visible | `src/data/repositories/progress.ts` | 1 |
| visible | `src/features/billing/cancelNotice.ts` | 3 |
| visible | `src/features/billing/chapterGate.ts` | 1 |
| visible | `src/features/classes/Classes.tsx` | 1 |
| visible | `src/features/consent/config.ts` | 1 |
| visible | `src/features/consent/copy.ts` | 11 |
| visible | `src/features/consent/server.ts` | 1 |
| visible | `src/features/dashboard/DashNav.tsx` | 3 |
| visible | `src/features/dashboard/i18n.tsx` | 2 |
| visible | `src/infra/diagnostics.ts` | 4 |
| visible | `src/infra/storage/activePlan.ts` | 2 |
| visible | `src/infra/storage/kv.ts` | 1 |
| visible | `src/infra/storage/speechRate.ts` | 1 |
| visible | `src/infra/storage/voicePref.ts` | 1 |
| visible | `src/infra/useMiloSpeaker.ts` | 16 |
| visible | `src/infra/useOfflineSync.tsx` | 1 |
| visible | `src/infra/voiceClipPlayer.ts` | 2 |
| visible | `src/shared/hooks/useAdaptive.ts` | 1 |
| visible | `src/shared/ui/ChapterDone.tsx` | 2 |
| visible | `src/shared/ui/DataRights.tsx` | 2 |
| visible | `src/shared/ui/ErrorBoundary.tsx` | 2 |
| visible | `src/shared/ui/PWAInstallBanner.tsx` | 5 |
| visible | `src/shared/ui/StorageGate.tsx` | 1 |

