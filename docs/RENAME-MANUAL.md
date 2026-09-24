# Rename to Radlic — the founder's manual

**Started 24 September 2026.** The product is renamed **Radlic** and moves to **radlic.com**. The company stays
**Radlor Inc.** (address, `support@radlor.com`, `noreply@radlor.com` unchanged). The Milo mascot is removed; a
child's own avatar (fox, rabbit, bear, cat) stays, because the consent notice lists it as collected data.

Everything below that needs you is in order. The build record is `docs/legal/LOOP-STATE.md` → **Rename**.

---

## A. Before merging the rename PR (so the new domain works on day one)

1. [ ] Confirm you own `radlic.com` (registrar), and where its DNS is managed.
2. [ ] Vercel → project → **Domains**: add `radlic.com`, and `www.radlic.com` → redirect to the apex. Set the DNS
   records Vercel shows; wait for the certificate.
3. [ ] Supabase → **Authentication → URL Configuration**: Site URL `https://radlic.com`; add redirect URLs
   `https://radlic.com/**` and **keep** `https://adaptivelearn.radlor.com/**` during the switch.
4. [ ] Google Cloud → **OAuth consent screen**: app name **Radlic**, authorized domain `radlic.com`,
   homepage/privacy/terms URLs on `radlic.com`. **Credentials**: add the Supabase callback; keep the old one during
   the switch.
5. [ ] Vercel → Production env: **`NEXT_PUBLIC_SITE_URL`** — a name check; you set the value. This one variable is
   also the switch for the old-domain redirect (see N2 below): while it says `https://adaptivelearn.radlor.com` the
   old domain serves the app as today; set it to `https://radlic.com` and redeploy, and the old domain 308s to the
   new one with the path, the query and the `#fragment` kept.

## B. Merge the rename PR, and check the screens

(list filled in at N7)

## C. After merging

6. [ ] Visit an old consent link on `adaptivelearn.radlor.com` and confirm it lands on `radlic.com` with the
   `#t=` token intact.
7. [ ] Supabase **Auth email templates**: "Milo"/"AdaptiveLearn" → "Radlic", links → the new domain.
8. [ ] **Resend**: the sender display name, in both places that send mail — the app (`RESEND_API_KEY` in Vercel, which
   must stay a **Full access** key because B3 cancellation needs it; server only, never `NEXT_PUBLIC_`) and Supabase
   Auth SMTP (its own sending-only key). Change the display name only. Never paste a key anywhere.
9. [ ] **Stripe**: the product names and the card statement descriptor (e.g. `RADLIC`).
10. [ ] After 30 days with no traffic on the old domain: remove the old redirect URLs from Supabase and Google.

## D. Outside the product

- [ ] **A new logo and favicon** (the mascot is gone). Today the PWA icons are a plain "Radlic" wordmark made in
  code and the favicon is still Vercel's default triangle.
- [ ] Social handles; any marketing pages outside this repo (radlor.com's product page and its `@id` reference).

## E. Trademark

- [ ] A USPTO clearance search for "Radlic" (education software / online classes) through the attorney, before
  public launch.

## F. Questions (BLOCKED items, the build continued past them)

(filled in as found)

---

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

