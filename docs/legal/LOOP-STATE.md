# Legal loop — state

The loop's memory. Read this first if resumed. Branch `legal-drafts-and-guard`, worktree
`/Users/mrk/milo_react/milo-legal-drafts`. No push, no PR, no deploy, nothing applied to production.

| # | item | state | evidence | owner if blocked |
|---|---|---|---|---|
| 0 | Refresh documents from the v4 export | done | 17 files copied, `00-README-index.md` → `README.md`. `grep -o '\[PLACEHOLDER'` per file = expected table exactly, **total 74** (control: the same grep on a planted line → 1). *Note, 23 Sep: the 74 includes README.md describing the marker (line 6), which is not a blank — **the real blanks are 73**, all in the 16 numbered documents. The same grep over docs/legal now returns 75, because this line also quotes the pattern.* Diff touched 01,02,03,04,05,09,11,12,13. `consentCopy.test.ts` goes **red 4/4 drift checks** against the new text — that is item 2's red, left red on purpose in this commit. | — |
| 1 | How many of the 26 children are real | done (count) · **blocked: Rafi — name the 7 unresolved account holders** | Read-only query on production (`learners` ⋈ `auth.users` ⋈ `profiles`, plus `lesson_progress`, `learner_events`, `learner_access` counts). 26 children on **14 accounts**. **No account uses a team domain** (all gmail + one live.nl), and `profiles.is_internal` is true on **1** account only — so neither marks staff; the database cannot tell an intern from a parent. **Test, high confidence: 11** — 5 named as tests ("Test Learner", "TestLearner", "age group 12-14", "Child 1", "Test Grade 5 and Above") + 6 on the founder's own three accounts (the paid-teacher address recorded in handoff.md). **Test, probable: 1** — the third child on an account whose other two are named tests. **Unresolved: 14 children on 7 accounts** — ordinary first names, no activity signal that separates them; one account made 5 children on one day, one per age band 3–5…15–16 (a tester's signature, or a big family); only 2 children in the whole table have any `lesson_progress` rows. **So: between 12 and 26 are test; between 0 and 14 are real, and only a human who knows the interns can close it.** ⚠️ This repo is PUBLIC — no child names, emails or ids are written here; the account prefixes went to the founder in chat. | Rafi |
| 2 | Consent code matches the corrected documents | done for everything except the **deletion claims → closed by item 6** | **Red:** after item 0, `consentCopy` 4/4 drift checks red (11 + 6 doc lines missing, 6 + 3 screen strings not in the docs). **Green:** after `94c98144`, suite 95 files / 3,425 passed; drift passes both directions. Notice → `notice-v2` (new hash pinned beside v1). Placeholders stripped by the parser, so one can never render. Refund paragraph **WITHHELD** by exact text, citing doc 03's own ⛔ row ("until then it must not be said"). `<name>` filled from the consent's child. **Breaks via `npm run break`, each red on its own assertion, tree byte-identical after:** A refund line restored → "a withheld line is on the screen"; B "under 13" back in B1 → "not in the document — reworded"; C a placeholder in a copy string → drift red. ⚠️ **Still ahead of the product, verbatim from doc 03:** B2 "we will delete everything", B3 "delete everything … and close the account", the withdrawal screen's first paragraph and its button "…and delete my child's data". Withdrawal deletes nothing until item 6. ⚠️ The dashboard control reads `Delete {name}’s profile` (curly ’); doc 03 writes a straight `'`. | — |
| 3 | The manifest (`SURFACE.md`) + `legalSurface.test.ts` | done | Manifest: 7 pages (⚠️ **`retention` added** — doc 02 links it), 12 link rows enumerated from `<input>`/OAuth/sign-up call sites. **Not in the brief:** invites (a third party's email), support form, child home, teacher roster, both consent emails. Test reads the manifest as expectation, paints each screen in jsdom (support panel clicked open first), reads hrefs; each paint has a positive control; `present`/`GAP` held both ways. First run 22/22 green — **so broken before believed** (`npm run break`, tree byte-identical each time): A add-a-child's privacy link removed → red "Add a child … has lost its link"; B homepage's → red "Homepage … has lost its link"; C a GAP closed silently (refunds link planted on checkout) → red "now links everything it must — mark it present". GAPs now: checkout (refunds), account, invites, support, child-home, roster; pages refunds/parent-rights/subprocessors/cookies/retention. ⚠️ Attorney question recorded in the manifest: does the child-home link cover lesson/practice/play/feedback ("at each area")? | — |
| 4 | All legal pages exist as routes, all dark | done | `app/legal/registry.ts` (one row per page: source, public boundaries `after`/`until`, `published`, sign-off, Spanish, `needs`) + `source.ts` (reads `docs/legal/`) + one page component. **Seven** pages (retention added, see item 3). Dark = title + red banner only, `noindex`, out of sitemap and `llms.txt`. `app/legal/content.ts` (the in-app drafts) **deleted** with the gates bound to its text — see READINESS for the one idea not yet re-anchored (Terms §6 "every child table is named"). Consent versions now hash the docs/legal public text + `@dark/@live`. **Green:** 96 files / 3,456. **`next build`**: all 7 `/legal/*` prerendered; `cookies.html` has `DRAFT — NOT IN FORCE` and `noindex` and 0 lines of its document; `sitemap.xml` = `/`, `/help` only; the consent route's `.nft.json` traces `docs/legal/*.md`. **Breaks** (tree byte-identical after): A placeholder guard disabled → red "expected [Function] to throw"; B dark page given its body → red "/legal/retention is dark and renders its document"; C dark page left indexable → red "is dark and indexable". The guard refusing a real document: `assertRenderable` throws on every page whose public text carries a placeholder (asserted, with a control that at least one does). ⚠️ The dark-banner sentence is **PROPOSED wording** (the old one said "left marked in the text below", false once the body stopped rendering). ⚠️ The public boundaries were set by engineering — the retention page's public part includes "Known defect — deletion is …"; the attorney must confirm each boundary. | — |
| 5 | The per-document switch and what it refuses | done | `publishRefusals(page, md, es)` in `registry.ts`; the page throws at build with the list when `published` is flipped. `BILLING_LIVE` and `WITHDRAWAL_DELETES` are repo literals a human changes in a reviewed commit. **Six attempts on pages wrong in exactly one way → six single refusals, each naming its own reason** (`legalSwitch.test.ts`), plus a ready page allowed (the control), a missing-Spanish case, every real page refused for placeholders/draft/sign-off/spanish (+ its `needs`), and a real page flipped on → the component rejects with `/legal/refunds is switched on but must not be published: … billing:`. **Breaks, each reason silenced in turn** (`npm run break`, tree byte-identical): placeholders / draft / sign-off / spanish / deletion / billing → each red on its own case ("refuses X, and names only that") and on the real pages carrying it. ⚠️ A first attempt at these breaks used a bad pattern (two edited nothing, one stopped the file loading) — those runs are discarded, not counted. | — |
| 6 | Deletion that actually deletes | done in code · **blocked: Rafi — apply `20260923140000` (after the two consent migrations), then flip `WITHDRAWAL_DELETES`** · **blocked: attorney — account closure on withdrawal** | Migration `20260923140000_withdrawal_deletes.sql`: orphans deleted then `error_events_learner_id_fkey … on delete cascade`; `parental_consents.learner_id` → `on delete set null` (the record is the evidence and now survives, `withdrawn`); `delete_child_data` (child's own login + consent ended + learner → every cascade) used by `consent_withdraw` and new owner-only `delete_learner`; dashboard calls `delete_learner`, falls back on PGRST202. **Proof** (`consentDeletion.test.ts`, real schema on PGlite, doc 06's 9 tables written out by hand + a catalog net over every `learner_id` table): withdrawal → every table **> 0 before, 0 after**, the child's login gone, consent row kept `withdrawn` with `learner_id` null, a sibling untouched; "Delete *name*'s profile" → same set, consent ended (else the add-a-child flow would reuse it); a stranger refused `not_owner`. **Orphans: 3 → 0** on a schema built up to the migration (planted as production has them), with the child-less crash row kept (control). Production measured read-only: **3 orphans** of 4 child-tagged / 9 rows — the migration will delete those 3 when Rafi applies it. **Breaks** (tree byte-identical): A no delete on withdraw → "expected {…} to deeply equal { learners: 0 …}"; B no FK → orphans/withdrawal/delete red; C consent still cascades → "the consent record — the evidence — was deleted"; D consent left granted → "…reuses unused consents"; E login survives → "the child's own login survived". ⚠️ **Reverses a recorded decision:** `delete_my_account`'s comment says crash rows were left without an FK deliberately; doc 06 and the brief say otherwise — noted in the migration. ⚠️ **Still ahead of the product, verbatim from doc 03:** B3 "…and close the account", and the withdrawal screen's "withdrawing permission closes the whole account, including your other children's profiles". Doc 06 B3 says withdrawal deletes **every** child and closes the account; the brief says the child. Closing the account deletes every consent record — the evidence — so which one is right is the attorney's call. | Rafi · attorney |
| 7 | The remaining parent rights: correct, and a complete export | done in code · **blocked: Rafi — apply `20260923150000`** (the export then carries its two new sections; until then the file says they are missing) | **Correct:** a "Correct *name*'s details" card on the child's Login & data tab (owner only; name + grade 3–8), through the existing `learners: update` policy — no new database surface. ⚠️ **Finding for the documents:** the product stores a child's grade only as a **band** (`bandOf`: grades 3–5 → `9-11`, 6–8 → `12-14`), so "Grade level" in the notice is really a band, and moving a child between two grades in one band changes nothing stored. **Export:** `buildExport` had **no `error_events` and no `learner_access`** — both explicitly excluded, the first because a parent's token cannot read it. New owner-only `export_child_records` returns the child's crash rows and the adults with access (ids + roles, **no emails**); the file notes it when the call fails. `exportCompleteness` now asserts all nine tables doc 06 lists under "See the data", written out by hand, with a control that the doc row still names each. **Proof:** `parentRights.test.ts` (PGlite, as `authenticated`): owner update stored; viewer + stranger change nothing; owner export has the crash row and both adults and no `@`; viewer + stranger refused `not_owner`. `childCorrect.test.ts` (jsdom): card renders for the owner, Save sends `('Bea', 7)`, "Saved." shown; not rendered for a viewer (control: the tab rendered). **Breaks** (tree byte-identical): A export drops crash records → "buildExport does not emit"; B ownership check removed → "expected 'ALLOWED' to match /not_owner/" (first attempt was red on a TypeError and was **rejected by the tool as the wrong reason** — the assertion was fixed and re-run); C card removed → "did not render for the owner"; D grade not sent → "expected … to be called with ['Bea', 7]". | Rafi |
| 8 | Every required link, in place and rendered | done | Added: checkout → Refund and Cancellation Policy; account → Your rights as a parent + Privacy Policy; invites, support form (opened), the child's home (`ModuleHome` **and** `ExerciseHome`, the free-class child's home), teacher roster → Privacy Policy. **Red:** with the links in, `legalSurface` went red on exactly the six GAP rows — "…now links everything it must — mark it present" — i.e. the rendered check saw each link land. **Green:** manifest has no GAP (new assertion: every row present), and every `/legal/*` href on every surface resolves to a registry page. 100 files / 3,485. **Breaks** (tree byte-identical): A child-home link removed → "The child's home … has lost its link"; B checkout's refunds link repointed → "Checkout … has lost its link: ['/legal/refunds']"; C a link to `/legal/nowhere` planted on the support form → "links to legal pages that do not exist". **Seen in the browser** (dev server, :3061): `/legal/parent-rights` desktop and `/legal/subprocessors` at 375×812 render title + banner only; `/modules` shows "Privacy" under the modules. **Also:** the PUBLISHED view had never rendered a real document — `legalSwitch.test.ts` now renders all seven with the refusals stubbed out and asserts HTML tables/headings, no leaked `**` or `|` rows; the table branch removed → red "a markdown table leaked through as pipes". New link labels are English-only on English-only screens (account, invites, support, roster, child home). | — |
| 9 | Wire the consent flow in | done · runbook below · **blocked: Rafi — secrets + the apply** · **blocked: attorney — teachers** | ⚠️ **Contradicts the brief: Phases 1 and 2 WERE already connected** — "Add a child" (both buttons) opens `AddChildFlow` (notice → request), and a granted unused consent opens the add sheet carrying `consent_id` into `createLearner`. The one real gap: B2's button went to `/parent`, where the parent had to press "Add a child" again; it now goes to `/parent?add=1`, which opens the flow (`consentHandoff.test.ts`; break → red "expected ['/parent'] to include '/parent?add=1'"). ⚠️ The dashboard half (`?add=1` → sheet open) is a one-line `useState` initialiser and was **not driven signed in** (see below). **End to end on a real local Supabase stack** (Postgres 17 + GoTrue + PostgREST, all 103 migrations incl. the 3 new ones applied clean; Resend replaced by a stand-in that records calls; CSP temporarily widened for `127.0.0.1` and **reverted**, `git status` clean): `POST /api/consent/request` (real route, parent's bearer) → B1 recorded with grant/decline links → **grant pressed in the browser** on `/consent/respond` → B2, link `/parent?add=1`, B3 scheduled → child created as the parent with that `consent_id` (what the add sheet sends) → rows seeded in all 9 doc-06 tables → **withdraw pressed in the browser** on `/consent/withdraw` (screen showed "Delete Maya's profile", no refund paragraph) → **all 9 tables 0**, consent row `withdrawn` / `learner_id` null / `withdrawn_at` set, and the pending B3 **cancelled** (`POST /emails/re_local_2/cancel`). Also over HTTP: `delete_learner`, `export_child_records` (owner ok, anon 401 `42501`), correction PATCH. ⚠️ **Not driven: signing in through the browser** — I will not type a password into a sign-in field, even a throwaway local one, so the dashboard steps were driven as the same HTTP calls the dashboard makes. | Rafi · attorney |

## Runbook — deploying consent, deletion and export (item 9)

⚠️ **CLIENT FIRST, MIGRATIONS SECOND. The reverse means no new child can be created at all** — once `20260923120000` is applied, `learners` refuses any insert without a granted consent, and only the new client asks for one.

0. **Before anything:** confirm on the **running** Production deployment (not just the dashboard) that `RESEND_API_KEY` (sending-only) and `SUPABASE_SERVICE_ROLE_KEY` are set, and that `RESEND_API_URL` is **unset**. Send one real B1 to a team inbox from a Preview first — no real email has ever been sent.
1. **Deploy the client** (this branch). Against today's schema it behaves as today: `AddChildFlow` finds no `parental_consents` table and falls through to the old sheet; `delete_learner`/`export_child_records` answer PGRST202 and the client uses the old delete path / notes the two missing export sections.
2. **Apply, in order:** `20260923120000_parental_consent.sql` → `20260923130000_parental_consent_flow.sql` → `20260923140000_withdrawal_deletes.sql` → `20260923150000_export_child_records.sql`. ⚠️ `20260923140000` **deletes the 3 orphaned crash rows** (measured). ⚠️ The 26 existing children are stamped `consent_exempt_at` by the first — a legal decision recorded as open, not made.
3. **Immediately after:** ⚠️ **every teacher roster add (`Classes.tsx`) is refused** from this moment — no consent route fits a school. Either keep teachers off it or hold step 2 until the attorney decides school consent.
4. **Verify on production, read-only:** one test consent through the real email; `select confdeltype from pg_constraint where conname in ('error_events_learner_id_fkey','parental_consents_learner_id_fkey')` → `c`, `n`; orphans → 0.
5. **Contract:** delete `AddChildFlow`'s no-table fallback, the `LEGACY_DELETE` path in `learners.ts`/`parent/page.tsx`, and flip `WITHDRAWAL_DELETES = true` in `app/legal/registry.ts`.
6. **Still not for real parents** until doc 03's ⛔ lines are true: B3's "close the account" and the withdrawal screen's "closes the whole account" (item 6 blocker).
| 10 | Extend the guard | done | **(a) consent text drifted from docs/legal:** `consentCopy.test.ts` already compared copy.ts to docs 02/03 both ways (item 2's breaks); **extended** to the RENDERED B1/B3 (text and HTML parts) and the rendered withdrawal screen — every line must be a document unit, so words added in a renderer are caught too. Breaks: a1 a sentence added in `renderB3` → red "B1 and B3, both parts"; a2 a sentence added on the withdrawal screen → red "expected ['Your data is always safe with us.'] to deeply equal []". **(b) a `learner_id` table the gate does not cover:** `parentalConsent.test.ts` derives every `learner_id` table from the built catalog against a hand-written exemption list. Break b: a later migration adding `zz_child_notes (learner_id …)` with no trigger → red "a table holds a child's data and is not gated". ⚠️ Structural note: the gate is attached by a catalog loop that ran ONCE, in `20260923120000`, so every future child table needs its trigger by hand — this test is what notices. **(c) published with a placeholder:** new assertion in `legalDocs.test.ts`; break c (privacy switch flipped) → red "/legal/privacy is published and its document still carries 8 placeholder(s)" (alongside "no page is published today" and the dark-page checks). Plus item 5's switch and item 4's `assertRenderable` refuse the same thing at build time. | — |
| 11 | The readiness table | done | [READINESS.md](READINESS.md): 7 pages + 9 flows, each with who blocks it and on what. **Every page ❌** — each is refused by the switch for ≥ 4 independent reasons (measured by `legalSwitch.test.ts`, "every real page is refused today"). Placeholder counts per page are the whole-file counts of item 0. | — |

## Blockers by owner (end of loop, 2026-09-23)

- **Rafi** — `RESEND_API_KEY` (none exists) and the runbook above · apply the four migrations in order, client first · then flip `WITHDRAWAL_DELETES` · name the 7 unresolved accounts (item 1) · prices, dates, regions, provider log retention, DMCA agent, the real content-review process, the export send method, the signed-in storage keys.
- **Attorney** — sign-off on each page **and its public boundary** · withdrawal: close the whole account (doc 03/06) or only the child (brief) · arbitration/class-action waiver · AI-content copyright · consent-record retention · school consent (teacher rosters are refused once applied) · retroactive consent for the real children among the 26 · the grade-as-band wording.
- **Spanish reviewer** — no Spanish version of any legal page; the consent copy is machine-translated.
- **Billing (not this loop)** — in-app cancel path; `BILLING_LIVE`.
- **Founder** — two PROPOSED strings: the dark-page banner sentence (item 4) and the existing `PROPOSED` block in `copy.ts`.

---

# Deploy loop (D0–D7) — taking the branch to production

Started 2026-09-23. Rafi approves every step that touches production. Rules: no secret values anywhere; no service-role key; production reads only as SQL Rafi runs in the SQL editor; production writes only via `deploy.yml` after `production-db` approval, or the app's own UI clicked by Rafi; no force push / rebase / direct push to `main`; never set `consent_exempt_at` by hand or loosen a gate. **BLOCKED is a result, not a failure.**

| step | state | proof / what it waits on |
|---|---|---|
| D0 preflight | **done** — was BLOCKED on §2/§3/§5; founder decided each (below) | read-only; measured 2026-09-23 |
| D1 merge `origin/main` + the founder's four fixes | **done** | merge `8c0e5a3d` (**no conflicts**: main brought package.json/lock, 874 Josh clips, the Kaggle notebooks, `lessonVoiceClips.test.ts`); `94edc0b2` deploy.yml; `a8a55234` consent copy; `2f02a1d2` roster pause; `5eee2bf3` records. **CI steps on Node 20.20.2, clean tree at `5eee2bf3`:** `npm ci` 0 · `tsc` 0 · vitest **102 files, 3,499 passed, 11 skipped** · `next build` 0 · `npm audit --audit-level=high` **0 vulnerabilities**. Legal/consent guard files alone: **15/15, 135 tests**. Real placeholders **73** (`[PLACEHOLDER —` in the 16 numbered docs; control: the grep on a planted line → 1). Breaks this step, each red on its own assertion, tree byte-identical: B3's old sentence in doc 03 → consentCopy red ×3; roster always-paused → rosterPaused red ×2; never-paused → red ×1. |
| D2 deploy the app | **done** — Rafi's signed-in checks passed on the live app (2026-09-23) | PR #181 merged by Rafi 2026-09-23 12:23 UTC as `fe721153`. Deploy run **#412**: `ci` ✅, `promote` ✅ (`release` = `fe721153`, measured with `git ls-remote`), `migrations-changed` ✅ true, `migrate-prod` reached the `production-db` approval — **the first proof the new `deploy.yml` condition works** — and was **REJECTED by Rafi** ("Ledger mismatch — blocked"): **0 steps ran**, nothing applied. **Live, measured:** `/legal/privacy`, `/legal/parent-rights`, `/legal/retention` → 200, banner `NOT IN FORCE`, `noindex`, 366–406 visible characters (privacy had 2,622 this morning) — as D0 §5 predicted. Live JS (24 chunks, 4.4 MB): `This applies only to this child` ×2, `Your account stays open` ×6, `Adding students is paused for now` ×1, `notice-v3` ×2, `closes the whole account` **×0**; controls `Upload a list` ×2, `Withdraw permission` ×4 (a first attempt found 0 chunks and 0 controls — blind, discarded). **Owed by Rafi:** a test account signs in; a test child answers and earns points; "Add a child" opens the old sheet. |
| D3 before-migration checks | not started | — |
| D4 apply the four migrations | **done 2026-09-23** — see "D4 COMPLETE" below (was blocked on the ledger; resolved by PR #183 + the one-shot repair) | |
| D5 real deletion on real rows | **done 2026-09-23** — see "D5 PASSED" below | |
| D6 clear test children, remove exemption | **done 2026-09-23** — see "D6 — applied" below | |
| D7 record it | **done 2026-09-23** — see "D7" below; reaches `main` with PR #182 | |

## D0 — findings (read-only, 2026-09-23)

**§1 The four migrations, in order** (all on this branch, none on `main`, none applied anywhere):
1. `20260923120000_parental_consent.sql` — table `parental_consents` (RLS on, one owner-read policy, no client write); `learners.consent_id` (FK) + `learners.consent_exempt_at`; **stamps `consent_exempt_at = now()` on every existing child** (the 26); view `consent_exempt_learners` (service_role only); `consent_ok()`; trigger `trg_enforce_learner_consent` on `learners` (INSERT needs a granted, unused consent of the creator; `consent_exempt_at` refused on INSERT; UPDATE needs `consent_ok`); `consent_bind_learner` after insert; a catalog loop putting `trg_enforce_child_consent` (BEFORE INSERT OR UPDATE, SQLSTATE `P0C01`) on **every public table with `learner_id`** except `learner_access`, `learner_invites`, `subscription_seats`, `parental_consents` — **`error_events` included**.
2. `20260923130000_parental_consent_flow.sql` — `consent_guard_update` trigger (state machine, immutable versions); service-role-only RPCs `consent_request`, `consent_record_request_sent`, `consent_lookup`, `consent_grant`, `consent_decline`, `consent_withdraw`, `consent_expire_stale` (+ nightly `pg_cron` sweep).
3. `20260923140000_withdrawal_deletes.sql` — **deletes the orphaned `error_events` rows** (3, measured earlier), then `error_events.learner_id` FK `on delete cascade`; `parental_consents.learner_id` → `on delete set null`; `delete_child_data` (no one may execute it directly); `delete_learner` (owner-only, `authenticated`); `consent_withdraw` now deletes the child.
4. `20260923150000_export_child_records.sql` — `export_child_records` (owner-only, `authenticated`).

**§2 How `deploy.yml` applies migrations — ⛔ IT DOES NOT, AS THINGS STAND.** On push to `main`: `ci` → `promote` (pushes `release`, which Vercel deploys) and `migrate-staging` → `migrate-prod`. `migrate-prod` has `environment: production-db` ✅ (exists; required reviewer Rafiquekuwari; admin bypass **off** — measured via the API) and runs `scripts/assert-prod-ref.sh` then `supabase link` + `supabase db push`. **But `migrate-prod` has `needs: migrate-staging`, and `migrate-staging` is skipped whenever `vars.STAGING_PROJECT_REF` is empty — which it is.** A job whose dependency was skipped is skipped too. **Measured, not inferred:** on the last three `main` deploys (`87c3408d`, `2759516b`, `bf38beed`, all today) `migrate-staging=skipped` AND `migrate-prod=skipped`. So after D2's merge, no run will wait for `production-db` approval; D4 has no path. Making it run is a change to how production migrations are gated (it removes "staging first") — **Rafi's decision**, not something to improvise.
- ⚠️ `supabase db push` applies **every** repo migration production has not recorded, not just these four. The handoff says `20260908120000`/`20260908120100` once "awaited hand-apply". The query at the end of this section answers it.
- ⚠️ Separately seen: `2759516b`'s CI failed on a **Google Fonts download during `next build`** (network, not code); the next commit was green. `promote` was skipped, so nothing reached production — the gate worked — but the build depends on `fonts.googleapis.com` being up.

**§3 `WITHDRAWAL_DELETES` — ⛔ NOT AN ENVIRONMENT VARIABLE.** It is `export const WITHDRAWAL_DELETES = false` in `src/app/legal/registry.ts:97`, read only by `publishRefusals()`: it decides whether `/legal/parent-rights` may PUBLISH (it names deletion). It changes **no behaviour** — whether deleting a child deletes everything is decided by migration `20260923140000` being applied (the dashboard calls `delete_learner`, and falls back to the old path on `PGRST202`). Setting a Vercel variable of that name would do nothing. Off vs on: off → the parent-rights page carries one more refusal reason; on → one fewer. It stays dark either way (placeholders, DRAFT, no sign-off, no Spanish). **D5 as written cannot be carried out**; its real switch is D4's third migration, plus a reviewed commit flipping the literal.

**§4 Consent emails.** Provider: **Resend**, called over HTTP from `src/features/consent/server.ts`; from `Milo <noreply@radlor.com>`, reply-to `support@radlor.com`. Needed in **Vercel Production** by `requireConfig()` (checked BEFORE anything is written): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, **`SUPABASE_SERVICE_ROLE_KEY`**, **`RESEND_API_KEY`**. Must be **unset**: `RESEND_API_URL` (a local stand-in override). Optional: `CONSENT_SECOND_NOTICE_DELAY_MINUTES` (default 1440; in production anything outside [1440, 2880) is refused at grant time because B3 says "Yesterday"). Links in the email are built from `SITE_URL` (`NEXT_PUBLIC_SITE_URL`, else a built-in default). **Missing → `/api/consent/request` answers `503 {error:'not_configured', missing:<NAME>}`**, writes nothing, and the add-a-child sheet shows its visible red `role="alert"` error. **Asked of Rafi, not guessed:** are `RESEND_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` set in Vercel Production, and `RESEND_API_URL` unset? (LOOP-STATE item 9 recorded "no Resend key exists".)

**§5 What a new visitor sees after D2 — ⛔ BLOCKED by the brief's own rule.** Before the migrations the client behaves as today (`AddChildFlow` finds no table → old add sheet; no consent flow). **All seven `/legal/*` pages are DARK on this branch — title + red banner, no body** — and every surface in `SURFACE.md` links to them: homepage (privacy, terms), `/auth` sign-up (privacy, terms), `/parent/plan` checkout (privacy, terms, refunds), add-a-child (privacy), account (privacy, parent-rights), invites, support form, the child's home `/modules`, teacher roster (privacy each); and after D4 the direct notice (privacy, subprocessors, retention) and the B1/B3 emails (privacy / parent-rights). **"STOP if any live screen links to a dark page" is therefore true of every screen, and stays true for this whole loop** (73 placeholders keep every page dark). ⚠️ It is also a **regression from today**: production's `/legal/privacy` currently renders its draft text under a DRAFT banner (measured: 2,622 characters of body); after D2 it renders a title and a banner only.
After D4 the consent flow **is** shown to a new parent, and doc 03's ⛔ list is not clear: B3 still says withdrawal will "delete everything … and close the account" and the withdrawal screen says it "closes the whole account, including your other children's profiles" — the product deletes the ONE child (item 6, attorney's call); and "Full details in our Privacy Policy" / the subprocessor, retention and parent-rights links lead to pages with no body.

**§6 Rollback notes (written before anything runs)**
- **D1** (local merge, not pushed): `git reset --hard` to the pre-merge commit. Nothing irreversible.
- **D2** (app on production): revert PR on `main`; for speed, Vercel Instant Rollback to the previous production deployment. ⚠️ Moving `release` backwards deploys nothing (handoff, launch week). Irreversible: nothing — no data changes, but anything a visitor saw in between.
- **D3**: nothing to undo.
- **D4**: inverse migration — drop the triggers/functions/view, `learners.consent_id`/`consent_exempt_at`, `parental_consents`; restore the two FKs. ⚠️ **Cannot be undone without the D3 backup:** the 3 orphaned `error_events` rows `20260923140000` deletes; any consent rows and children created after D4 are lost if the table is dropped. ⚠️ Undoing D4 with the new client still live is safe (it falls back), undoing D2 with D4 still applied is NOT (the old client cannot create a child).
- **D5**: deleting a child is **irreversible**; only a whole-database restore from the D3 backup brings it back, and that also rolls back everything else since.
- **D6**: **irreversible** for the same reason, for every child; adults stay. The exemption removal is reversible by migration, but the children are not.

**Also found, not in the brief:** once D4 applies, **every teacher roster add (`Classes.tsx`) is refused** (`P0C01`) — no consent route fits a school (item 9 / attorney). The five dependency PRs the brief lists (#86, #130, #131, #96, #129) are on `origin/main` as described (`b2e96256 … bf38beed`, measured).

**Query for Rafi — which repo migrations production has not recorded** (read-only; `ledger_rows` and `repo_found_in_ledger` are the positive control — they must be large before an empty `repo_missing_from_production` means anything):
```sql
with repo(v) as (values ('20260615083757'),('20260615123941'),('20260615142012'),('20260615142049'),('20260615142138'),('20260615142414'),('20260615142513'),('20260615142939'),('20260616074944'),('20260616094022'),('20260616094232'),('20260616100231'),('20260616112002'),('20260616113036'),('20260616114634'),('20260616120411'),('20260616131455'),('20260616133249'),('20260616135344'),('20260616141828'),('20260617004359'),('20260617004432'),('20260617005044'),('20260617012517'),('20260617013927'),('20260617015724'),('20260617061215'),('20260617062300'),('20260617063532'),('20260617101451'),('20260617103206'),('20260617111507'),('20260617133302'),('20260617133316'),('20260617140142'),('20260617144759'),('20260617145125'),('20260617150142'),('20260617150311'),('20260628083735'),('20260628083921'),('20260628181320'),('20260629023238'),('20260702032342'),('20260702090611'),('20260702121810'),('20260702131627'),('20260702140622'),('20260702145218'),('20260702163943'),('20260702164343'),('20260703014247'),('20260703014331'),('20260705161254'),('20260705161328'),('20260705163002'),('20260705164509'),('20260718103024'),('20260721053831'),('20260817142406'),('20260817174352'),('20260817174723'),('20260817175739'),('20260820111858'),('20260823195529'),('20260823213619'),('20260823213657'),('20260823215352'),('20260823221818'),('20260823222038'),('20260823222545'),('20260823225313'),('20260824133906'),('20260824134125'),('20260825030558'),('20260903100000'),('20260903100100'),('20260905120000'),('20260905130000'),('20260905140000'),('20260905150000'),('20260905160000'),('20260908120000'),('20260908120100'),('20260914015455'),('20260917072319'),('20260917083255'),('20260917083744'),('20260917090504'),('20260917112109'),('20260917112252'),('20260917114845'),('20260918100000'),('20260918120000'),('20260918140000'),('20260920151900'),('20260921053233'),('20260921182306'),('20260923120000'),('20260923130000'),('20260923140000'),('20260923150000'))
select (select count(*) from supabase_migrations.schema_migrations) as ledger_rows,
       (select count(*) from repo where v in (select version from supabase_migrations.schema_migrations)) as repo_found_in_ledger,
       (select count(*) from repo) as repo_total,
       (select string_agg(v, ', ' order by v) from repo where v not in (select version from supabase_migrations.schema_migrations)) as repo_missing_from_production;
```

## D0 → decisions (founder, 2026-09-23)

1. **`deploy.yml`:** `migrate-prod` runs when CI is green and staging is skipped, still behind `production-db`; staging-first returns automatically once `STAGING_PROJECT_REF` is set. Done in `94edc0b2` (plus a `migrations-changed` job so a push with no migration does not wait for approval). ⚠️ **Unproven until its first run on `main`** — GitHub's expression engine cannot be run locally. ⚠️⚠️ **A STAGING DATABASE IS OWED BEFORE THE FIRST REAL FAMILY.** Until then production migrations are tested only in CI's throwaway Postgres.
2. **§5:** dark legal links accepted while every account is a test account; losing the draft Privacy text accepted. **No real family is invited until the legal pages can publish** — recorded as the launch blocker in `READINESS.md`. The false promise fixed first (`a8a55234`, below).
3. **D5:** prove deletion on real rows after D4. `WITHDRAWAL_DELETES` stays `false`; it flips only when the parent-rights page can publish.
4. **§4 confirmed by Rafi:** `RESEND_API_KEY` set in Vercel Production (sensitive), `RESEND_API_URL` does not exist, `SUPABASE_SERVICE_ROLE_KEY` set in Production (being removed from Preview). D4 still waits on the migration-ledger query result.
5. **Teacher roster:** refusal after D4 accepted until school consent is resolved; the roster shows a plain pause message instead of an error (`2f02a1d2`).

### The false promise — before → after (`a8a55234`, docs 02/03 and `copy.ts` together, `NOTICE_VERSION` → `notice-v3`, hash `9631b50821a5`)

| where | before | after |
|---|---|---|
| notice (doc 02), rights list | **Withdraw your consent** and stop any further collection — if you do, your child will no longer be able to use the app. | **Withdraw your consent** — we stop any further collection and delete your child's information. Your account stays open. |
| B2 (doc 03) | …that email will let you cancel immediately and we will delete everything. | …that email will let you cancel immediately and we will delete everything we hold about your child. |
| B3 (doc 03) | We will immediately stop collecting, delete everything we hold about the child, and close the account. | We will immediately stop collecting and delete everything we hold about the child. Your account stays open. |
| withdrawal screen (doc 03) | **If you have more than one child on this account, withdrawing permission closes the whole account, including your other children's profiles.** If you only want to remove one child, use *Delete \<name\>'s profile* instead. | **This applies only to this child.** Your account stays open, and any other children on it are not affected. |
| after withdrawing (PROPOSED, not from a doc) | We have stopped collecting information about your child. | We have stopped collecting information about your child and deleted what we held about them. Your account stays open. |

"Everything we hold about the child" was checked against the schema: the consent record that survives withdrawal holds the parent's email, versions and timestamps — no field about the child. **Proof:** `consentCopy` 13/13 green; break (B3's old sentence put back into doc 03 only) → red on its own 3 assertions ("nothing in the document is missing from the screen", "…absent from the document", "B3 text part"), tree byte-identical.

**Doc 03's ⛔ list, re-checked against the changed copy:**
| ⛔ row | now |
|---|---|
| Withdrawal deletes the child's data and closes the account | **Copy fixed** — no longer says "close the account"; says the account stays open. The deletion it promises is true **once `20260923140000` is applied (D4)**; the consent flow cannot appear before D4 (no table → old add sheet), so the notice is never shown while it is false. |
| Withdrawal refunds the unused subscription | Still withheld by exact text (`WITHHELD` in `consentCopy.test.ts`). Unchanged. |
| Use *Remove this child* | The screen no longer names a control at all. ⚠️ Doc 06 §32 still says *Remove this child* — the open attorney question, left. |
| Consent can be given by payment card | Unchanged (one consent path, email-plus, in the notice since v2). |
| Links to subprocessor, retention, parent-rights pages | The pages exist but are **DARK** — accepted by the founder for a test-only system (launch blocker in READINESS). |
| "Full details in our Privacy Policy" | Privacy is **DARK** — same acceptance. |
| "a child under 13" | Unchanged since v2 ("your child"). |
| The list of what we collect | Unchanged since v2. |

⚠️ **Two placeholders are now stale but were left, to keep the count at 73 as instructed:** doc 02's rights line still carries "[PLACEHOLDER — the earlier wording promised deletion here … Restore the promise once deletion is built…]" (it has now been restored), and doc 03's withdrawal paragraph still carries the placeholder about the control's name (the paragraph no longer names a control). Neither renders. Rafi's call whether to resolve them.
⚠️ **Doc 06 contradicts the new copy** (withdrawal "closes the whole account" and refunds) — the open attorney question, deliberately untouched.

## ⛔ D2 HUMAN GATE — what Rafi does, and what I check after

**Rafi:** when PR #181's checks are all green, merge it. Then, in Actions → the Deploy run for that merge: **`migrate-prod` should be WAITING for `production-db` approval — do NOT approve it.** (It carries the four migrations; D3 and the migration-ledger query come first.) While it waits, later pushes to `main` queue behind it.
**I then check:** the Deploy run's jobs (`ci` green, `promote` green, `migrations-changed` = true, `migrate-prod` waiting — this is also the first proof that the new `deploy.yml` condition works); Vercel production reaches Ready on the merge commit; the live site against D0 §5 screen by screen (landing, `/auth`, `/legal/*` dark with banner + `noindex`, footer links); a string from this PR present in the live bundle (the artefact contains the change). **Signed-in checks are Rafi's** (I do not type passwords): an existing test account signs in; a test child answers a question and earns points; "Add a child" still opens the old sheet (no consent table yet).

## D4 BLOCKED — the migration ledger (2026-09-23)

> ⚠️⚠️ **SUPERSEDED — THE FIRST RESULT CAME FROM A DIFFERENT SUPABASE PROJECT** (Rafi, 2026-09-23). Everything in this sub-section down to the options table was reasoned from that wrong result; the 77→26 account below is false for production. Kept only as a record of why every query now prints `db_public_tables` / `db_has_learners`. The corrected findings are in the next section.

~~**Rafi's result, production, read-only:** `ledger_rows = 26`, `repo_found_in_ledger = 0`, `repo_total = 102` — **all 102 repo versions missing.**~~ (wrong project) Had run #412 been approved, `supabase db push` would have faced a ledger that knows none of the repo's migrations. (From the CLI's documented behaviour, **not measured here**: it stops when the remote holds versions absent locally; were it to proceed, it would treat every repo file as pending and try to replay 98 migrations over a live schema.) Rejecting it was correct.

**What the repo and GitHub say (measured):**
- **On 2026-09-03 the ledger matched the repo exactly.** The region-move run that built production (`migrate-region.yml` run 33785921492, `NEW_REF` = `wrnjqjhrbnqxornmfisf` = production, `WIPE` = true) restored the Sydney ledger with **`COPY 77`** — and the repo held exactly **77** migrations dated up to that day. (The 2026-08-25 ledger repair had relabelled the repo's versions to production's.)
- **21 migrations were added after that** (`20260905120000` … `20260921182306`), and the handoff records them as applied by hand (`apply_migration` / `execute_sql` / "hand-apply"). Tools of that kind record their own version (the time of applying), so they would ADD rows that do not match — but they would not REMOVE the 77.
- **So 77 matching rows became 26 non-matching ones at some point after 2026-09-03**, by a route the repo does not record. Candidates, none confirmed: the ledger rewritten or truncated by a tool or dashboard action; a `migration repair`; or — to be ruled out first — **the query having run against a different Supabase project** (two exist: this app's and `radlor-site`'s, which has 4 repo migrations). Both queries below now print the database they ran on.

**Read-only SQL for Rafi** (both files in `docs/legal/sql/`; each was run against a local copy first):
1. `d4-1-ledger-rows.sql` — every ledger row: version, name, **the repo file with the same NAME** (answers "same migrations, different version numbers?"), the table's other columns, statement count / md5 / first 300 characters; plus `db_public_tables` and `db_has_learners` (production: 32 and true).
2. `d4-2-schema-compare.sql` — production's schema NAMES (tables, views, columns+types, functions+arguments, triggers incl. app triggers on `auth` tables, policies, enums) against the **364** names that `baseline_schema.sql` + the **98** pre-today migrations produce. Returns a `COUNTS` row and only the differences. **Controls:** on the database it was built from → 364 matched / 0 / 0; with today's four migrations applied on top → **66 extra** (1 table, 30 columns, 15 functions, 18 triggers, 1 view, 1 policy) and 0 missing — so an empty difference on production would mean equal, not blind. ⚠️ **Names, not bodies:** equal names do not prove equal function bodies, policy predicates or grants; that needs a second pass (definition hashes) before anything is marked applied.

## D4 — options for applying ONLY the four new migrations (proposed, nothing done)

| option | what | risks |
|---|---|---|
| **A. Repair the ledger, then the normal path** | Once query 2 shows 0 missing / 0 extra AND a body-level pass (hashes of `pg_get_functiondef`, policy `qual`/`with_check`, grants) agrees: record the 98 as applied and the 26 unknown rows as reverted (`supabase migration repair`), via a one-off `workflow_dispatch` job behind `production-db` — never a hand write. Then re-run Deploy: `db push` sees exactly 4 pending. | Repair writes the ledger on production (a new write path — needs Rafi's approval as such). Marking a migration "applied" that is not truly equivalent hides drift for ever. Deleting the 26 rows loses whatever history they hold (query 1 first; they can be copied into the repo as a record). After it, every future deploy works as designed. |
| **B. One-off apply of just the four** | A `workflow_dispatch` job behind `production-db`: `assert-prod-ref.sh`, then `psql --single-transaction -v ON_ERROR_STOP=1` over the four files in order, then insert their four ledger rows. | Smallest blast radius today, and the four are self-contained (verified in CI on the repo schema). But the ledger stays broken: the NEXT migration through `deploy.yml` hits the same wall, so this defers the problem rather than solving it. Also skips `db push`'s own ordering/idempotency checks. |
| **C. Make the repo match the ledger** | Rename repo files to the 26 production versions. | Only works if query 1 shows the 26 ARE repo migrations; 102 files vs 26 rows makes that unlikely. Rewrites history every reviewer relied on. Not recommended. |
| **D. Apply by hand in the SQL editor** | — | **Excluded by the loop's rule 3** (production writes only via `deploy.yml` after approval, or the app's UI). Listed only so it is not re-invented. |

**Recommendation:** first the two queries (identity + what the 26 are + name-level equality). If equal, **A** with a body-level pass added — it repairs the pipeline once and every later migration works as designed. **B** only if the body-level pass finds drift that needs its own investigation and the consent gate cannot wait. Either way the job that writes to production is a reviewed file, behind `production-db`, with `assert-prod-ref.sh`.

## D4 — the CORRECTED ledger picture (production, 2026-09-23)

**Rafi's result from production:** `ledger_rows = 95`, **92** repo versions found. Missing from the ledger: the **4 new** migrations plus **6 older ones** — `20260905160000` (delete_my_account), `20260908120000` (profile_on_confirmed), `20260908120100` (prune_unconfirmed_users), `20260918100000` (grades_as_classes), `20260918120000` (teacher_plans_and_class_exercises), `20260918140000` (exercise_results). And **3 ledger rows that are not repo versions.** (The region move restored 77 rows on 2026-09-03 and the repo had 77 then — consistent with 92 found; the 6 were presumably applied by hand under other versions or with no ledger row at all. The 3 unknown rows will say which.)

⚠️⚠️ **WHY `db push` MUST NOT SIMPLY RUN AS THINGS STAND — MEASURED ON A LOCAL COPY, NOT INFERRED:** it would treat the 6 as pending and replay them, and replaying is not harmless:
- `20260905160000` `create or replace`s `delete_my_account` with its **5 September** body — but `20260917090504` (which production DOES record) redefined it to also remove children's logins. Replaying the older file on the local copy changed the function's definition hash (`86a805…` → `5872e1…`): **account deletion would silently stop removing children's logins.**
- `20260908120100` runs a one-off `delete from auth.users` (unconfirmed, older than 3 days, no child) — a data write on replay.
- `20260918120000` upserts a `teacher_plans` row (data write, idempotent).
- (From the CLI's documented behaviour, not measured here: `db push` also stops when the remote holds versions that are not in the repo — the 3 unknown rows — unless repaired.)

**Read-only SQL for Rafi** (in `docs/legal/sql/`, each run on a local copy first; each prints the database it ran on):
- `d4-3-unknown-ledger-rows.sql` — only the ledger rows whose version is not a repo migration: version, name, the repo file with the same NAME, other columns, statement count / md5 / first 300 characters. **Control:** on the local copy it returns exactly its one non-repo row (the staged baseline).
- `d4-4-six-migrations-in-production.sql` — for everything the 6 create or change, is it in production AND identical to the repo's final version: **70 fingerprints** — function definition md5, SECURITY DEFINER + `search_path`, EXECUTE for anon/authenticated/service_role; the `auth.users` trigger definition; `pg_cron` + the cron job's schedule/command/active; columns (type, nullable, default) of `teacher_plans`, `exercise_results`, and `grades.grade/lesson_ids/exercises/age_group`; constraints and indexes (definition md5); RLS; policies (command, roles, USING / WITH CHECK md5); table privileges and the column-level INSERT grants. Expected values = the repo's FINAL state (so `delete_my_account` is compared to the 17 September body). Two INFO counts, not compared: how many `auth.users` a replay of `20260908120100` would delete now, and `teacher_plans` rows. **Controls:** clean local copy → 70 same / 0 / 0 / 0; three planted drifts (older `delete_my_account`, a dropped policy, a revoked column grant) → each reported (DIFFERENT / MISSING / DIFFERENT); the first draft's own bug (a `|` inside an item name split a row) was caught by that run and fixed.

## D4 — the smallest safe path (PROPOSED, nothing done)

**Only if** `d4-4` returns **70 same, 0 different, 0 missing, 0 extra** on production (i.e. the 6 are already fully in place, identical to the repo) **and** `d4-3`'s 3 rows are understood (expected: the same migrations recorded under other versions):

1. **A reviewed, one-off `ledger-repair.yml`** (`workflow_dispatch` only, `environment: production-db`, `scripts/assert-prod-ref.sh` first). The versions are **written in the file**, not typed as inputs, so the PR review is the review of exactly what changes. It:
   a. prints `supabase migration list` (before);
   b. `supabase migration repair --status applied` for the **6** versions — this records them in the ledger **without executing their SQL** (nothing is replayed);
   c. `supabase migration repair --status reverted` for the **3** unknown versions — removes those three ledger rows only (their content is copied into this file first, from `d4-3`, so no history is lost);
   d. `supabase db push --dry-run` and **fails unless the pending list is exactly the 4 new versions**.
2. **Then** re-run the failed `migrate-prod` job of Deploy run #412 (Actions → Re-run failed jobs) → it waits for `production-db` again → Rafi approves → `db push` applies exactly the 4 → D4's proofs.

**Why this is the smallest:** it writes only ledger rows (no schema, no data), touches 9 rows of a bookkeeping table, and leaves every future `deploy.yml` run working as designed. **Risks:** it is a production write outside the loop's rule 3 (neither `deploy.yml` migrations nor the app UI), so it needs Rafi's explicit approval **as a new write path**; marking a migration applied is only as good as the fingerprint check (hence 70 fingerprints, not names); step 1d runs after 1b/1c, so a failed assertion leaves the ledger repaired but nothing applied — reversible (`repair --status reverted` for the 6; re-insert the 3 rows from the copy).

**If `d4-4` shows any difference:** do NOT mark that migration applied. Each difference is investigated on its own; the fallback is a one-off apply of only the 4 new files behind `production-db` (option B above), which leaves the ledger to be repaired later.

## D4 — results of d4-3 / d4-4, and the plan measured end to end (2026-09-23)

**Rafi's results (production: 32 tables, `has_learners = true`, ledger 95).**
- **d4-3, the 3 unknown ledger rows:** `20260629023502 grades_pin_touch_search_path` (created_by kuwari84@…; `create or replace touch_grades_updated_at … set search_path = public`), `20260702113253 sync_recheck` (same NAME as repo `20260702121810_sync_recheck` — a first application of the 4-argument version), `20260905110530 admin_learning_invariant_safe` (created_by admin@…; `create or replace admin_learning`). All applied by hand through the dashboard/MCP, under their own versions.
- **d4-4: 62 same, 8 different, 0 missing, 0 extra.** Every check of `20260905160000` (delete_my_account — **production has the 17 September body, `86a805…`**), `20260918100000`, `20260918120000`, `20260918140000` is **same**. Different: `handle_new_user` definition and the `on_auth_user_created` trigger (`20260908120000`), and all six checks of `prune_unconfirmed_users` + its cron job (`20260908120100`) — **never applied**. INFO: a replay of `20260908120100` would delete **1** unconfirmed account now; `teacher_plans` has 1 row.

**`handle_new_user` — what production runs (measured locally, no production access):** production's **trigger** hash `786e53…` equals the baseline-era trigger exactly: **`AFTER INSERT ON auth.users` only** — the 8 September change (also fire on `UPDATE OF email_confirmed_at`) was never applied, as its own header says ("NOT APPLIED TO PROD BY THIS COMMIT"). Production's **function** hash `34812ad…` equals **neither** the baseline-era body (`e3d885…`: profile inserted at signup, no `ON CONFLICT`) **nor** the repo's (`2d03a8…`: profile only once `email_confirmed_at` is set, `ON CONFLICT DO NOTHING`). **A third, unrecorded version is live** — `d4-5` part A prints it. ⚠️ Why it matters: the trigger fires only at INSERT, when an email/password signup is still unconfirmed. If the live body carries the "only when confirmed" guard, **email/password parents never get a profile** (Google sign-ups do — they are confirmed at insert); `learners.created_by` references `profiles`, and the consent request requires a confirmed email. Not decided; not marked; not run.

**`prune_unconfirmed_users` — what it deletes, and when:** `auth.users` rows with `email_confirmed_at is null`, created **more than 3 days ago**, and **with no child** (`learners.created_by`). Once at apply (the one-off sweep — **1** account today), then daily at **03:37 UTC** by `pg_cron`. Measured locally, deleting such a user cascades to `profiles`, `grades`, `auth_events`, `subscriptions`, `admin_users`, `parent_pins`, `teacher_plans`, `parental_consents` and sets `billing_events.account_id` null — though an unconfirmed account cannot sign in, so in practice only its `profiles` row (created at signup by the live trigger) and any signup `auth_events` go with it. **Children's own logins are NOT affected**: `/api/child-login` creates them with `email_confirm: true`. The consent request refuses an unconfirmed parent, so no consent row can belong to one.
Risks: irreversible (backup restore only); a real parent who has not confirmed for 3 days must sign up again; it runs as a `SECURITY DEFINER` delete on `auth.users` every night, so its predicate is the whole safety case (gated by its own test before apply).
**Recommendation: separately, after D4 is proven — not with the four.** D4's proof is "row counts unchanged" against the D3 snapshot; a prune in the same approval would change `auth.users`/`profiles` counts and blur exactly that check. It also needs a **new version** (a file dated 2026-09-08 is older than the ledger's newest row, and `db push` refuses it — measured below), its **doc 04 retention row in the same PR** (Rafi's condition), and its own `production-db` approval.

### The plan, measured on a local copy whose ledger was made production-shaped (95 rows: the 6 removed, the 3 unknown added)
| step | `supabase db push --dry-run` said (CLI 2.116, local) |
|---|---|
| 0. as run #412 would have seen it | **refused**: "Remote migration versions not found in local migrations directory" (the 3 unknown rows) — so #412 would have applied nothing even if approved |
| 1. + the 3 unknown rows as repo files under their ORIGINAL versions | **refused**: "Found local migration files to be inserted before the last migration on remote database" — lists the 6 older files; it will not replay them without `--include-all` (which `deploy.yml` does not pass) |
| 2. `migration repair --status applied` for the 4 proven-same (`20260905160000`, `20260918100000`, `20260918120000`, `20260918140000`) | recorded **without running any SQL** — `delete_my_account`'s definition hash identical before and after. Still refused for the two `20260908…` files |
| 3. the two `20260908…` files moved out of `supabase/migrations/` (held, undecided) | **"Would push these migrations:" exactly the 4** — `20260923120000`, `130000`, `140000`, `150000`. A real push then applied exactly those 4 |
| 3b. (variant) prune re-versioned after the four | the 4 **+ prune** — i.e. it would ride along with the next approval; hence: separate PR, after D4 |

### Proposed (nothing done)
1. **Files added to the repo (one PR, CI must pass):** the 3 unknown rows as `supabase/migrations/20260629023502_grades_pin_touch_search_path.sql`, `20260702113253_sync_recheck.sql`, `20260905110530_admin_learning_invariant_safe.sql` — **byte-for-byte from `d4-5` part C** (ledger statements), so the ledger stays true history and nothing is deleted from it. ⚠️ Adding files shifts CI's fresh build (they run in version order, which may not be the order production ran them) — CI plus `d4-5` part B decide whether the repo's final state still equals production's.
2. **Files moved out of `supabase/migrations/`:** `20260908120000_profile_on_confirmed.sql` and `20260908120100_prune_unconfirmed_users.sql` → a held folder, until decided (this also makes CI's schema MORE like production's, which has neither).
3. **Ledger rows marked applied (not run)** by a reviewed one-off `ledger-repair.yml` behind `production-db`, versions written in the file: `20260905160000`, `20260918100000`, `20260918120000`, `20260918140000`; it ends with `db push --dry-run` and **fails unless the pending list is exactly the 4**. No ledger row is deleted.
4. **Then** re-run run #412's failed `migrate-prod` → approval → **pending = exactly the 4.** Prune and `handle_new_user` follow in their own PRs.

**Waiting on Rafi:** run `d4-5-definitions-and-unknown-rows.sql` (A: production's `handle_new_user` + trigger text; B: every overload of the three functions vs the repo's final state — a stale 4-argument `sync_recheck` would show as EXTRA, control-tested; C: the full statements of the 3 rows) and paste the result.

## D4 — d4-5 results, and the final plan (2026-09-23)

**Rafi's d4-5 result (production: 32 tables, `has_learners = true`, ledger 95).**

1. **`handle_new_user`: no live bug — confirmed.** Production's body, transcribed and re-hashed to its own `34812ad…` (so the copy is exact), is **the baseline-era statement with different line breaks**: identical once whitespace is normalised. It inserts the profile when the `auth.users` row is created, no confirmation check, no `ON CONFLICT`; the trigger is `AFTER INSERT` only. **Every signup — email/password or Google — gets a profile at once.** The repo's 8 September version (profile only after confirmation, trigger also on `UPDATE OF email_confirmed_at`) stays HELD: it and the prune are one design ("an account is real once it is confirmed; the unconfirmed are removed") and go together in their own PR, after D4.
2. **`sync_recheck` (5 arguments): DIFFERENT** (production `ff7d3f…`, repo final `5871da…`). It writes children's data, so this is checked before anything else: **`d4-6-sync-recheck-definition.sql`** prints every overload in full with markers `reads_learner_access` / `checks_auth_uid` / `raises_42501` (control: a body without the check reads `f|f`). The markers are a hint; the decision is a full-text diff against the repo's final text (kept locally, regenerated from baseline + 98). **If production's check is weaker, restoring it is a security fix and ships FIRST**, as its own migration.
3. **`admin_learning`: DIFFERENT, but comments only.** Production's hash `e30321…` was reproduced exactly on a local copy by applying the hand-applied `20260905110530` body on top of the repo's — i.e. it ran AFTER `20260905150000` although its version number is earlier. With comments and whitespace removed, repo and production bodies are **identical** (control: the same comparison sees a planted one-token change). No behavioural difference; nothing to fix for D4.
4. **A hand-applied migration deleted a ledger row.** `20260905110530` ends with `delete from supabase_migrations.schema_migrations where name = 'admin_funnel_nested_steps';` — there is no repo file of that name, so the row it removed was itself a hand-applied migration's. **Direct evidence that the ledger was edited by hand, and the likely cause of the drift** (rows removed, alongside migrations run through the SQL editor / MCP that never wrote a row — `20260908120000`'s own header says it was left for the founder to run by hand). The ledger is therefore not a complete history of what ran; the fingerprint queries, not the ledger, are what establish production's state.
   **How that file joins the repo without CI running a ledger delete:** the file carries the function DDL and grants **exactly**, and the final `delete from supabase_migrations…` line **commented out** with a header saying so, quoting it, and recording that the ledger's copy (md5 `4802f3b6…`) is the verbatim original. `db push` matches files by VERSION, never by content, so the edit changes nothing on production; CI's fresh build then never touches its own ledger. The other two files are byte-exact (all three transcriptions re-hashed to the ledger's md5s).
5. **The 4 new migrations do not redefine or call `sync_recheck`, `admin_learning` or `handle_new_user`** (grep of all four for those names + `on_auth_user_created`, `admin_scope`, `diagnostic_rechecks`: 0; control — the same grep finds `parental_consents` 50× and `delete_my_account` 2×). ⚠️ The one indirect link: the consent gate's catalog loop covers every `learner_id` table, including `diagnostic_rechecks`, which `sync_recheck` writes — so after D4 `sync_recheck` is refused for a child without consent. Today all 26 children are exempt, so nothing changes. **The D4 plan does not depend on resolving 2 or 3** — except that item 2, if weaker, goes first.

### THE D4 PLAN (proposed; nothing done)

| # | step | who | proof |
|---|---|---|---|
| 0 | **Only if d4-6 shows a weaker `sync_recheck`:** a new migration restoring the repo's definition (a `pg_get_functiondef` copy, the security change named in the commit), its own PR and approval, applied **before** step 1 | Claude writes, Rafi merges + approves | d4-6 re-run → `5871da…` |
| 1 | **"D4 prep" PR**, one PR, CI must pass: **(a)** add `20260629023502_grades_pin_touch_search_path.sql`, `20260702113253_sync_recheck.sql` (byte-exact) and `20260905110530_admin_learning_invariant_safe.sql` (exact, ledger delete commented out); **(b)** move `20260908120000_profile_on_confirmed.sql` and `20260908120100_prune_unconfirmed_users.sql` to `supabase/held/` with a note (not applied to production; the later profile-on-confirm + prune PR); **(c)** add `ledger-repair.yml` — `workflow_dispatch` only, `environment: production-db`, `assert-prod-ref.sh`, `migration list` before, `migration repair --status applied 20260905160000 20260918100000 20260918120000 20260918140000` (versions written in the file), `db push --dry-run`, and **fail unless the pending list is exactly the 4 new versions**, `migration list` after | Claude writes; Rafi merges | CI green (fresh build with the 3 added files, without the 2 held); the dry-run sequence already measured on a production-shaped copy |
| 1b | Merging it changes files in `supabase/migrations/`, so that Deploy run's `migrate-prod` **will wait for approval — Rafi REJECTS it** (with the ledger unrepaired, `db push` would refuse anyway — measured — but it must not be tried) | Rafi | run shows rejected, 0 steps |
| 2 | Run `ledger-repair.yml` → approve `production-db` | Rafi | its log: 4 rows marked, dry-run lists exactly the 4; d4-4 re-run: still 62 same (nothing replayed) |
| 3 | **D3** as originally planned: Backup workflow run by hand (green + artifact) and the before-counts SQL | Rafi | run id, artifact size, counts |
| 4 | Re-run the failed `migrate-prod` job (of step 1b's run) → approve | Rafi | log: exactly the 4 applied |
| 5 | D4's proofs: ledger has the 4; `parental_consents` exists; gate triggers on every child table; 26 exempt; counts = step 3's; then Rafi's two in-app checks | Claude SQL, Rafi runs | as D4 in the brief |

**Pending after step 2: exactly the 4** (`20260923120000`, `130000`, `140000`, `150000`). **Marked applied (not run): 4.** **Added: 3 files. Held: 2 files. Ledger rows deleted: 0.** Prune + profile-on-confirm: a later PR with a NEW version and doc 04's retention row, its own approval, after D4 is proven.

## D4 — execution (Rafi approved the plan 2026-09-23, adding: ledger-repair must be ONE-SHOT, and a follow-up removes it)

| step | state | proof |
|---|---|---|
| 0 `sync_recheck` security fix | **SKIPPED — not needed** | d4-6: production's 5-argument `sync_recheck` keeps the `learner_access` / `auth.uid()` check and raises `42501` (markers true; control body reads false). Full text re-hashed to production's own `ff7d3f…` (exact copy); `diff` against the repo's final text: **a two-line comment and a trailing newline — the code is identical.** |
| 1 D4 prep PR | **done — [PR #183](https://github.com/RadlorInc/learn/pull/183), waiting for CI, then Rafi** | 3 ledger migrations added (2 byte-exact by md5; `20260905110530` with its ledger DELETE commented out — diff against the ledger text shows only comment lines and that one line); 2 held in `supabase/held/` (+README; `profileOnConfirmed.test.ts` applies them explicitly, with a control that the migrations alone still make a profile at signup — 4/4); `scripts/ledger-repair.sh` + `ledger-repair.yml` (one-shot). **Rehearsed** on a production-shaped local ledger: run 1 → exactly the 4 pending, `delete_my_account` hash unchanged; rerun → exit 3; wrong state → exit 3 with 0 rows written; unreachable → 2; no flag → 2 (exit 1 not reachable locally). CI steps Node 20: tsc 0, vitest 102 / 3,499, build 0, audit 0; fresh baseline + 103 migrations → RLS **74**; held files not applied; `admin_learning` / `sync_recheck` end at the repo's final hashes (comment-only differences from production). |
| 1b | **⛔ Rafi** | merge #183; in that Deploy run **REJECT `migrate-prod`** |
| 2 | **⛔ Rafi** | Actions → "Ledger repair (one-shot, D4)" → Run workflow (branch `main`) → approve `production-db`. I then read its log (must end `OK: … pending = exactly …`) and give d4-4 to re-run (must still be 62 same). |
| 3 | ⛔ Rafi | D3: Backup by hand + before-counts SQL (I give it after step 2) |
| 4 | ⛔ Rafi | re-run step 1b's failed `migrate-prod` → approve |
| 5 | Claude + Rafi | D4 proofs; then the follow-up PR deleting `ledger-repair.yml` + `scripts/ledger-repair.sh` |

⚠️⚠️ **INCIDENT, recorded because it is the class this file exists for — an accidental `supabase db push` (2026-09-23, while writing step 1).** Generating the recovered migration's header through an UNQUOTED shell heredoc, the backticks around the words `supabase db push` in the comment were executed as a command substitution: **`supabase db push` ran, in the main checkout.** It failed immediately — "Cannot find project ref. Have you run supabase link?" — because that checkout is linked to nothing (`supabase/.temp` holds only `cli-latest`, no `project-ref`) and no `--db-url` was given; **nothing was pushed anywhere**, and its error text landed in the file (caught by the diff, fixed). The same heredoc had also turned an escaped `\n` into a real newline, putting a stray uncommented line into the SQL (caught the same way). ⚠️ **What stood between that and production was an unlinked working directory, not a design.** Rules taken from it: generated text goes through a QUOTED heredoc (`<<'EOF'`) or a file write, never an unquoted one; and a checkout that is `supabase link`ed to production must not be where anyone types — the CLI will act on it.

## D4 — steps 1b and 2 done (2026-09-23)

| step | state | proof |
|---|---|---|
| 1b | **done** | PR #183 merged (`6adf4e8f`). Deploy **#413**: `migrations-changed` ✅, `ci` ✅, `promote` ✅, `migrate-prod` **rejected by Rafi, 0 steps**. |
| 2 | **done** | `ledger-repair.yml` run #1 (`35868772500`, on `6adf4e8f`), approved by Rafi. Log: production ref confirmed (`assert-prod-ref.sh`); **before** — pending = exactly the 4 to mark + the 4 new, nothing on production that the repo lacks; **repair** — `[20260905160000 20260918100000 20260918120000 20260918140000] => applied`; **after** — `would push: 20260923120000 20260923130000 20260923140000 20260923150000`; `OK: 4 recorded as applied without running`. Identical to the local rehearsal. |
| 2′ | **⛔ Rafi** | re-run `docs/legal/sql/d4-4-six-migrations-in-production.sql`. Expected: `ledger_rows=99`, **62 same / 8 different / 0 missing / 0 extra** — the same 8 as before (the held `handle_new_user` + trigger, and the six `prune_unconfirmed_users` checks). Any change = the repair replayed something, and D4 stops. |
| 3 | waiting | D3: Backup by hand + before-counts SQL (given after 2′) |

⛔ **HARD RULE, added to `CLAUDE.md` (top) the same day, after the accidental `db push`:** never run `supabase link` or any `supabase db` / `supabase migration` command against a remote from a local checkout; production's schema and ledger change only through GitHub workflows behind `production-db`; generated text only through quoted heredocs. **Measured 2026-09-23:** no checkout under `/Users/mrk` is linked (`find … -path '*/supabase/.temp/project-ref'` → none; control — a planted one is found), and no Supabase CLI login exists (`~/.supabase/access-token` absent, `SUPABASE_ACCESS_TOKEN` unset, no Keychain entry; control — a planted Keychain entry is found). The local CLI currently cannot reach production at all.

## D3 (2026-09-23)

| item | state | proof |
|---|---|---|
| 2′ d4-4 re-run | **done** (Rafi) | `ledger_rows=99`, **62 same / 8 different / 0 / 0** — the same 8 as before; `delete_my_account` md5 unchanged (`86a805…`); prune "would delete" still 1. The repair replayed nothing. |
| Backup by hand | **done** | Backup run **#41** (`35869937550`, manual, success): artifact `milo-db-backup-35869937550`, **88,652 bytes**, expires 2026-10-23 (measured via the API). ✅ Also: **#40, the SCHEDULED nightly at 07:51 UTC today, succeeded unattended** — the first one; the drafts' "still to watch" is now met. |
| Before counts | **done** (Rafi, production, 2026-09-23) | `public_tables=32`, `ledger_rows=99`, consent table absent · **children 26** · exempt: column does not exist yet · `error_events` **9** all / **4** child-tagged / **3 orphaned** · `auth.users` **20** · `profiles` **20** · 17 `learner_id` tables: diagnostic_plans 6, diagnostic_rechecks 0, diagnostic_sessions 9, error_events 9, exercise_results 0, game_settings 1, learner_access 29, learner_events 236, learner_invites 0, learner_progress 0, learner_state 0, learner_stats 26, lesson_feedback 1, lesson_progress **36**, point_events **298**, sessions 0, subscription_seats 0. (Since the morning restore, lesson_progress 35→36 and point_events 281→298: live use by test children, not drift — the same two may grow again before the D4 read, and that alone is not a failure.)
| (the query) | — | `docs/legal/sql/d3-before-counts.sql`. It counts: children; exempt (column absent before D4); `error_events` all / child-tagged / **orphaned**; `auth.users`; `profiles`; and every table with a `learner_id` column, taken from the catalog. Tested on a seeded local copy before and after the four migrations: after, every count is equal except `error_events` (drops by exactly the orphan count), exempt = children, the table list gains `parental_consents`, and on production the ledger will read 103 (99 + 4 recorded by `db push`). |
| then | ⛔ Rafi | re-run the failed `migrate-prod` job on Deploy **#413** → approve `production-db`. I then read its log (must apply exactly the 4) and give the D4 proof SQL. |

## D4 — the migrations are applied (2026-09-23)

| item | state | proof |
|---|---|---|
| migrate-prod | **done** — Deploy **#413 attempt 2**, approved by Rafi, green in 38 s | job log (`107215676691`): `✓ production ref confirmed: wrnjqjhrbnqxornmfisf`; `Applying migration` **exactly four times** — `20260923120000_parental_consent`, `20260923130000_parental_consent_flow`, `20260923140000_withdrawal_deletes`, `20260923150000_export_child_records` — then `Finished supabase db push.` Nothing else applied. |
| D4 proof SQL | **⛔ Rafi** | `docs/legal/sql/d4-proof.sql` — PASS/FAIL/INFO per check, expectations written out (incl. the D3 before-counts): DB 33 tables; ledger **103**; the four recorded; `parental_consents` exists, RLS on, 0 rows, anon no SELECT / authenticated SELECT only; gate on **14** child tables and none missing (catalog-derived, 4 named exemptions); both `learners` triggers; children / exempt / neither = **26 / 26 / 0**; `error_events` **6 / 0 orphaned** (9 − 3); FK delete rules `c` / `n`; accounts 20 / 20; every table's count vs D3 (`error_events` −3 exactly; growth in live-use tables = INFO, not FAIL); EXECUTE on 9 functions; cron `expire-parental-consents` 41 3 * * *; `delete_my_account` and `handle_new_user` unchanged. **Tested** on a local build of `main`: every structural check PASS (counts FAIL by design on an empty copy); planted defects — a gate trigger dropped from `point_events`, `delete_child_data` granted to authenticated — each turn FAIL and name what is wrong. (First run caught my own bug: `confdeltype` is `"char"` and needed a cast.) |
| in-app checks | ⛔ Rafi | after the SQL: (1) a test child still saves progress; (2) "Add a child" on a test account starts the consent flow, and nothing about that child is saved before consent — a refused write must show visibly. |

## ✅ D4 COMPLETE (2026-09-23)

**Proof SQL on production (`d4-proof.sql`), run by Rafi after Deploy #413 attempt 2 — every row PASS:** 33 public tables · ledger **103** · the four recorded · `parental_consents` exists, RLS on, 0 rows, anon SELECT false / authenticated SELECT true / authenticated INSERT false · gate on **14** child tables, **none missing** · both `learners` triggers · children / exempt / neither = **26 / 26 / 0** · `error_events` **6 / 0 orphaned** (9 − 3) · FK delete rules `error_events=c`, `parental_consents=n` · accounts **20 / 20** · every child table equal to D3 (none grew between D3 and the read) · EXECUTE on all 9 functions as designed (`delete_child_data` false/false/false; `delete_learner` and `export_child_records` authenticated only; the `consent_*` functions service_role only) · cron `expire-parental-consents` `41 3 * * *` active · `delete_my_account` (`86a805…`) and `handle_new_user` (`34812ad…`) unchanged. ⚠️ The query's "rows in error_events" line showed expected `9` beside a PASS (the status logic allowed −3; the label did not say so) — label fixed to `6 (9 − 3 orphans)`.

**In-app checks (Rafi):**
- **A — existing children keep working:** an exempt test child answered a question and earned points.
- **B — the consent flow, end to end, on production:** in an incognito window, "Add a child" showed the notice ("Before your child starts…"); the B1 email **arrived from `noreply@radlor.com`** (the first real email the flow has sent); "I give permission" was pressed; the child (`rafi3`) was created. An earlier attempt in a normal tab ran a **stale bundle from the service worker**: the gate refused it correctly and nothing was saved — the refusal is the gate working, the stale bundle is follow-up 1.

**Follow-ups (one PR, not urgent — Rafi, 2026-09-23):**
1. **Service worker takeover:** a new deploy must take over quickly (skipWaiting / clientsClaim, or a version check that reloads), proven by a test in which an old client picks up a new bundle — otherwise a returning parent gets the old add-child sheet, which the gate refuses.
2. **Notice accuracy:** the notice and B1 say "Grade level"; measure what a new child actually stores (grade vs age band — item 7 found the product stores a BAND), and make the notice say exactly that, in the app and doc 02 together (a new `NOTICE_VERSION`).
3. **Email-plus:** confirm B3 is scheduled for rafi3's consent (`second_email_provider_id`, `second_notice_scheduled_for`) and state when it should arrive.
4. ~~`d4-proof.sql` label~~ — done in this commit.

## D5 — real deletion, on real rows (started 2026-09-23)

`WITHDRAWAL_DELETES` stays `false` (founder: flips only when the parent-rights page can publish). D5 proves deletion on production rows through the app's own control.
- **Step 1 — `docs/legal/sql/d5-1-candidates.sql`** (Rafi types his account email in the editor; nothing personal enters the repo): his children with `learner_id`, exempt, `consent_id`, the child's own login id (`learner_access.access_role = 'self'`), and non-zero row counts per table. He picks a **TARGET** and a **CONTROL** on the same account.
- **Step 2 — `docs/legal/sql/d5-2-rows.sql`**, run BEFORE and AFTER the delete, **keyed by IDs, never by name** — after the delete there is no name to look up, and a lookup that finds nothing reads zero whether or not anything was deleted. Counts, per table, for target and control; the target's own login in `auth.users` (its id must be captured before — the link row goes with the child); consent records pointing at each.
- **Rehearsed** on a local build of `main` (owner, two consented children, a child login): before → target 1/1/2/1 across learners/error_events/learner_access/learner_stats + login 1 + consent 1; **`delete_learner` called AS THE OWNER** (`authenticated`, the dashboard's call); after → **target 0 everywhere including the login**, **control unchanged (1 in each)**, the target's consent record kept as `withdrawn` with `learner_id` null.
- **⛔ Rafi:** run step 1 → pick target + control → run step 2 (BEFORE) → delete the target in the app (child's card → Login & data → Delete *name*'s profile) → run step 2 again (AFTER).
- **Pass =** target 0 in every row (incl. `error_events` and the login), control identical before/after.

## ✅ D5 PASSED (2026-09-23)

Rafi deleted **rafi7** in the app (incognito; child's card → Login & data → Delete *name*'s profile). **Before** (d5-1, as Rafi reported it): rafi7 had `learner_access`=2, `learner_events`=1, `learner_stats`=1, `lesson_feedback`=1, `lesson_progress`=2, `point_events`=37 and its own login `24dad6e8…`; the control **rafi3** had `learner_access`=1, `learner_stats`=1 and 1 consent. **After** (d5-2, Rafi): **target 0 in every row, login included; control unchanged.** (The d5-2 outputs themselves were summarised, not pasted.)
⚠️ **What D5 did NOT exercise on production rows, stated so it is not over-claimed:** rafi7 had **no `error_events` row and no consent record** (it was one of the exempt 26), so neither the crash-row cascade nor the withdrawal of a consent on deletion was seen on real rows. Both are covered elsewhere — the cascade by D4's catalog check (`error_events_learner_id_fkey=c`) and the local rehearsals, the consent withdrawal by the local rehearsal and `consentDeletion.test.ts` — and D6 exercises both on production (it deletes rafi3, which has a consent).

## D6 — clear every child, remove the exemption (prepared 2026-09-23; nothing run)

[PR #184](https://github.com/RadlorInc/learn/pull/184), migration `20260923170000_consent_zero_exemptions.sql` — full SQL, rollback and gates in the PR. In short: every child deleted **through `delete_child_data()`** (a plain delete would leave rafi3's consent `granted` + unlinked, and the add-a-child flow would reuse it — measured: with a plain delete the consent stays `granted` and the child's login survives); orphans; the exemption (view, `consent_ok` branch, `enforce_learner_consent` refusal, column); `consent_id NOT NULL`; post-conditions that roll everything back. Functions are `pg_get_functiondef` with named lines removed — no privilege change. **Irreversible for data** (pre-D6 backup only).
Proof so far: local rehearsal in production's order; `consentZeroExemptions.test.ts` + reworked `parentalConsent.test.ts`; two guards refined without loosening (baselineSchema skips migration-created columns and still checks the historical three; billingSchema retires a guard only by name + migration + reason and fails on a stale entry); six breaks each red on its own assertion; CI steps Node 20 green (103 files / 3,505), RLS 74.

**⛔ Gates, in order (Rafi):** (1) tell the interns their test children are going and they can recreate them via the consent flow; (2) PR #184 green → merge; (3) Backup by hand (green + artifact); (4) approve the waiting `migrate-prod`. **Then I give the D6 proof SQL:** 0 children, 0 exempt (column gone), 0 orphaned `error_events`, rafi3's consent `withdrawn`, `consent_id NOT NULL`; plus Rafi's in-app checks — a write for a child with no consent is refused, and the consent flow still starts for a new child.

## D6 — before approval: the scheduled second email (investigated 2026-09-23; nothing changed)

Rafi merged PR #184 (`a6b08182`); **Deploy #414**'s `migrate-prod` is waiting for `production-db`, not approved. Since the ledger repair (`6adf4e8f`) the only change in `supabase/migrations/` is `20260923170000` (104 files); with #413 having applied the four and the D4 proof reading 103 rows, approving applies only `20260923170000` — confirmable directly with `d6-pre-approval.sql` (ledger part control-tested locally; its B3 part could not be exercised on an empty local copy).

**⚠️ FINDING — only ONE path cancels a scheduled B3.** B3 is sent with Resend's `scheduled_at` at grant time and its id is stored in `parental_consents.second_email_provider_id` (with `second_notice_scheduled_for`). The only caller of `cancelEmail()` is `src/app/api/consent/respond/route.ts` — the **email-link withdrawal** (`case 'withdraw'`, line ~51) and a grant that lost a race (line ~75). **Nothing else cancels it:**
- **Dashboard "Delete *name*'s profile"** → `deleteLearnerPermanently` → `rpc('delete_learner')` (client → database). No server code, no Resend call. B3 still arrives.
- **Account → Close your account** → `rpc('delete_my_account')`. No Resend call — and the consent rows are then deleted by `parental_consents.parent_id … on delete cascade`, so **the id is lost too**; B3 arrives with no record left to cancel it from.
- **D6** is SQL; it cannot call Resend. It keeps the consent row (`withdrawn`), so **rafi3's B3 id survives** and can still be cancelled.
So a parent who deletes a child or closes the account within a day of granting gets "Yesterday you gave permission…" about a child who no longer exists. (Its withdraw link then finds an already-withdrawn consent — harmless, but the email is wrong.)
**Decision recorded:** Rafi's call before approving (see chat). Fix belongs in a follow-up PR: cancel B3 wherever a consent stops being `granted` — the delete and account-close paths must go through a server route that can call Resend (or record the id for a sweep), and account closure must cancel BEFORE the cascade deletes the id.

## D6 — applied (2026-09-23)

| item | state | proof |
|---|---|---|
| pre-approval (`d6-pre-approval.sql`, Rafi) | done | ledger 103; pending = `20260923170000` only; nothing on production outside the repo. rafi3's B3: Resend id `01a0cea4-27a3-715a-9f63-31c4a5f5530b`, due **2026-09-24 14:20 UTC** — **Cancelled by Rafi in Resend** before it was due (his statement, 2026-09-23; not visible from here). |
| backup | done | **run #42** (`35887914277`, manual, success), artifact `milo-db-backup-35887914277`, 92,364 bytes. (Reported as "#184" — that is the PR number.) ⚠️ **It was a pre-D6 copy by 23 s only:** its dump step ran 16:19:39 → **16:20:04**; D6 was applied at **16:20:27** — `migrate-prod` was approved while the backup was still running. Fine this time; the rule for next time is *approve only after the backup run has finished*. |
| migrate-prod | done | Deploy **#414** (`a6b08182`), job `107258894814`: `✓ production ref confirmed`, `Applying migration 20260923170000_consent_zero_exemptions.sql` — **the only one** — `Finished supabase db push.` |
| D6 proof SQL | **done — every row PASS** (Rafi, production) | ledger **104** / D6 recorded · **0 children** · exemption column + view gone · `consent_id` NOT NULL · gate on **14** tables · `consent_ok()` true/false/true/true · `enforce_learner_consent()` true/false/true/true · **no row tagged to a child** in any `learner_id` table · `error_events` **0 orphaned / 5 untagged** (D4 left 6 = 1 child-tagged + 5 untagged → D6 removed exactly the one) · **0 granted-and-unused consents** · rafi3's consent **withdrawn / unlinked / B3 id kept** · **0 child logins** · cron active · `delete_my_account` + `handle_new_user` unchanged. INFO: accounts **17 / 17** (D3: 20 / 20) — consistent with 3 child logins removed (rafi7's in D5, 2 in D6), but the number of child logins before D5 was never measured, so the 3 is an inference; **0 remaining is the measurement**. |
| (the query) | — | `docs/legal/sql/d6-proof.sql`: ledger **104** + D6 recorded; **0 children**; exemption column and view gone; `consent_id` NOT NULL; `consent_ok()` reads `parental_consents`, has no `exempt`, still DEFINER with `search_path` pinned; `enforce_learner_consent()` still refuses, no `consent_exempt_at`, DEFINER + pinned; gate still on **14** tables; **0 rows tagged to a child** in every `learner_id` table; `error_events` 0 orphaned (untagged stay); rafi3's consent **withdrawn / unlinked / B3 id kept**; 0 granted-and-unused consents (INFO, not FAIL: one you grant after D6 looks the same); **0 child logins** (`@learner.adaptivelearn.invalid`); cron active; `delete_my_account` / `handle_new_user` unchanged. **Rehearsed** in production's order (pre-gate child + login + crash rows, consented child carrying rafi3's real B3 id, then D6): all PASS except the two local-only rows (ledger count, `handle_new_user` hash). **Planted defects**, each on its own statement: exemption column back → FAIL; a child login left → FAIL; a granted unused consent → INFO. (A first attempt planted all three in one transaction; the consent state machine refused "withdrawn → granted" and rolled all three back — itself evidence a withdrawn consent cannot be revived — so that run proved nothing and was redone.) |
| in-app checks | **done** — and, after that, Rafi ran a full creation after D6: Add a child → notice → email → I give permission → **child created** (his report, 2026-09-23). ✅ **D6 COMPLETE.** Earlier: | Rafi (clarified): "Add a child" showed the consent notice; he ticked *I am the parent or legal guardian* and pressed **Not now** → nothing created. ✅ **the consent flow still starts after D6**; ✅ declining creates nothing. ⚪ **Not exercised in the app after D6:** (a) a write the gate REFUSES — covered at database level instead (D6 proof: `consent_id` NOT NULL + gate on 14 tables; tests: a consent-less child refused even with the trigger disabled, 23502; D4 saw the app meet the gate once, via a stale bundle); (b) **a child CREATED through consent after D6** — the one thing D6 could have broken for a real parent, since it made `consent_id` required. Recommended: one full run on a test account (Add a child → Continue → email → I give permission → child appears); cancel its B3 in Resend afterwards. |

## D7 — recorded (2026-09-23)

- `READINESS.md`: flows table rewritten with the measured state (consent notice + email-plus **live**; deletion of one child **live and proven on real rows**; withdrawal and export **deployed, not yet exercised on production**; roster **paused**; the gate live with **zero exemptions**). Pages unchanged: all dark, 73 placeholders.
- Documents 04, 05, 06, 16: dated notes added under the passages the loop made untrue — each states only what was measured and where: the orphan defect **fixed** (cascade read from the catalog; 3 orphans deleted; 0 after D6), deletion **proven on real rows** (D5, with its limit: that child had no crash records), the gate **live with zero exemptions** (D4/D6 proofs), the retroactive-consent question **moot** (children cleared), Resend **in use** (B1 received; B3 ids stored). The founder's text is kept; no placeholder was touched (count **73**). ⚠️ One placeholder is now answerable but left, as instructed: doc 05's "decide before the migration is applied: clear the test data and drop the exemption, or keep it" — D6 decided it.
- Legal/consent guards after the edits: 16 files / 141 tests pass.

# FINAL REPORT — deploy loop D0–D7 (2026-09-23)

| step | result | proof |
|---|---|---|
| D0 preflight | ✅ done (was BLOCKED on three points; founder decided each) | `migrate-prod` skipped on every main deploy (measured); `WITHDRAWAL_DELETES` a repo literal; every live screen links a dark page |
| D1 branch + fixes | ✅ | merge of `main` (no conflicts); `deploy.yml` (staging-first suspended while no staging); consent copy tells the truth (`notice-v3`); roster paused; CI Node 20 green; 73 placeholders |
| D2 app deployed | ✅ | PR #181 → `fe721153`; legal pages dark as predicted; new strings in the live bundle with controls; Rafi's signed-in checks |
| D3 before | ✅ | Backup #41 (88,652 B); before-counts on production |
| D4 four migrations | ✅ (after a ledger repair) | ledger 95 → repair (PR #183 + one-shot workflow, rehearsed) → exactly the four applied (#413); proof all PASS; in-app A + B (first real consent email) |
| D5 real deletion | ✅ | rafi7: every row + login gone, control untouched (Rafi); limit recorded |
| D6 zero exemptions | ✅ | PR #184; backup #42 (pre-D6 by 23 s); only `20260923170000` applied (#414); proof all PASS; flow starts, "Not now" creates nothing, full creation after D6 works |
| D7 record | ✅ | this section; PR #182 |

**Found that the brief did not expect:**
1. `migrate-prod` had **never run** — its only dependency was always skipped. Production migrations had no path.
2. **Production's migration ledger had drifted**: 3 hand-applied rows not in the repo, 6 repo migrations never recorded (two never applied at all), and **a hand-applied migration that deleted a ledger row**. `db push` would have refused; replaying would have regressed `delete_my_account`.
3. The first ledger query **ran against a different Supabase project** — every query since prints the database it ran on.
4. **An accidental `supabase db push`** from an unquoted heredoc; harmless only because the checkout was unlinked → a hard rule in `CLAUDE.md`, and no checkout or CLI login on this machine can reach production (measured).
5. The consent gate **refused the RLS suite's own fixtures** — fixed by giving them real consents, not by loosening the gate.
6. The consent copy promised **account closure** on withdrawal; the product deletes one child — copy fixed; doc 06 still says otherwise (attorney).
7. **Teacher rosters** are refused by the gate — now a visible pause.
8. **A scheduled B3 survives** a dashboard delete or account closure (only the email link cancels it) — follow-up.
9. The nightly backup's **first unattended success** (#40), meeting the drafts' "still to watch".
10. The backup before D6 was pre-D6 **by 23 seconds** — approve only after the backup finishes.
11. Two repo guards met cases they were not written for; both refined **without loosening** (named retirements; migration-created columns), each break-tested.

**Open, recorded for later PRs:** service-worker takeover (returning parents got a stale bundle); "Grade level" vs the stored band (doc 02 + a new notice version); B3 cancellation on delete/close; delete `ledger-repair.yml` + `scripts/ledger-repair.sh`; staging database before the first real family; the held profile-on-confirm + prune pair (with doc 04's retention row); every legal page still dark (73 placeholders, attorney, Spanish).

---

## Round 1 (24 September 2026) — every remaining legal gap as a tested PR

Nothing on production, nothing merged. Every PR's CI is green (`verify` + `rls-tests` + Vercel). Every proof is a test
that went red before the change or on a planted break (`scripts/break-check.sh`, exit 0 = red on the check's own
assertion; the tree was byte-identical afterwards). **The founder's work list is [`ROUND-2.md`](ROUND-2.md).**

| # | item | status | PR | proof |
|---|---|---|---|---|
| R1 | Service worker takes over after a deploy | **done** — waiting on Round 2 (merge) | #185 | Cause: `skipWaiting`/`clientsClaim` were already there. **Pages and RSC GETs were stale-while-revalidate**, so old HTML ran old, cache-forever chunks. Fix: network-first, cached copy then `/offline.html` offline; `sw.js` v230. `swTakeover.test.ts` runs the real `sw.js`. **Red on v229** (2 of 7: "an OLD client asking for /parent gets the NEW html"). Breaks: cache-first restored; offline fallback removed. Real headless Chromium: old worker ran bundle A after a "deploy", new ran B and B offline |
| R2 | The notice says exactly what is stored | **done** — Round 2 (merge + 2.1) | #186 | Measured: `createLearner` writes `display_name, avatar_index, age_group, lesson_ids, consent_id, created_by`. **No grade**: `age_group` = band `9-11`/`12-14` from the first chosen module. Docs 02/03/11/README + `copy.ts` + the add-a-child line say "lessons you choose and a grade band". **`notice-v4`**, pinned `7ee78cacb4dc`. `noticeStoredFields.test.ts` ties the notice to the stored fields. **Red on main's copy**; breaks: `grade` field added, third band, sheet line reverted |
| R3 | Cancel B3 on every path | **done** — Round 2 (Phase B3, migration `20260923200000`) | #192 | A trigger queues the B3 id **in the same transaction** that ends a consent (withdraw / delete child / close account); `drainB3Cancellations` cancels it and records `cancelled` / `refused:` / `error:` (idempotent); called after each path + a daily Vercel cron. Expiry is not a path (tested with a control). **Red before**: 13 failed. Breaks: the dashboard-delete call, the account-close call, the trigger update-only, the trigger delete-only, the withdraw drain — all caught. ⚠️ New `SECURITY DEFINER` trigger function (pinned, revoked). Stacked on R6 (merge conflict resolved there) |
| R4 | In-app subscription cancellation | **done** — Round 2 (merge; Stripe test-mode run is Round 3) | #188 | Account → Plan & billing → See plans → Cancel subscription → confirm; the server reads only the caller's own subscription; Stripe `cancel_at_period_end`; confirmation email with the doc 09 §5 footer; state from the `subscriptions` row. `billingCancel.test.ts` 8/8 on a faithful Stripe/Resend/DB stand-in. **Red before** (route missing). 6 breaks (ownership, email, flag, idempotency, row write, confirm screen). Doc 01 §4 placeholder replaced; docs 01/12 describe it. **No Stripe test key exists → never run against real Stripe** |
| R5 | Parent corrects a child's profile | **done** — correction **already existed** (item 7); added avatar + band-only picker | #191 | `childCorrect` (the card sends name, band, avatar; a viewer gets no card) + `parentRights` (owner edits the avatar; another parent cannot; **a child whose consent is no longer granted is refused even for the owner**, with its positive twin). **Red on main's card**. Breaks: avatar not sent, consent gate UPDATE disabled, a grade option. Docs 06 §2 + 11 §5 placeholders replaced |
| R6 | Email suppression + unsubscribe | **done** — Round 2 (Phase B2, migration `20260923190000`) | #197 | Inventory: **every email today is transactional** (Supabase Auth ×3, B1, B3, Stripe receipts if enabled); **no commercial email exists**. `sendEmail(kind, …)`: a commercial send checks the list (refuses if unreadable), adds the §4 footer and address, and the RFC 8058 headers. Transactional never reads it. `POST` unsubscribe + one-button page. **Red before**: 16 failed. 7 breaks incl. the revoke (PGlite needed Supabase's default grants to make that one bind). Doc 09 §7 placeholder replaced, §8 inventory. Stacked on R4 (the cancel email declared transactional) |
| R7 | Withdrawal + export end to end | **done** — Round 2 (production run 2.5) | #189 | `withdrawExportE2e.test.ts` (12): the real route + real schema, a second family as control, child tables **derived from the catalog**. **Finding:** `consentDeletion.test.ts` passed with `exercise_results` unlinked (it seeded only doc 06's nine tables); R7 catches it. 7 breaks incl. the export leaking the other family's marker |
| R8 | Doc 06 matches the build | **done** — Round 2 (merge; attorney A1) | #195 | Docs 06 §4 + Terms §4: withdrawal deletes that child only, the account stays open. The refund promise → a marked ATTORNEY+RAFI placeholder (+2). Doc 06 B3 procedure + Delete row (crash records cascade; R7 found the stale "by hand"). `withdrawalScope.test.ts`, red on main's 06 and 12. `legalSwitch` caught a nested-bold leak in my own draft |
| R9 | Held prune + profile-on-confirm | **done** — Round 2 (Phase B1, `20260923180000/180100`) | #194 | Rebased on production's `handle_new_user` (the held file was not stale; 4 named line changes). Prune = new `SECURITY DEFINER`, pinned, revoked. `supabase/held/` removed; doc 04 row. `profileOnConfirmed` ④ unconfirmed >3 d pruned; <3 d, confirmed, with-child kept. 6 breaks. Rehearsed on a local production-shaped stack: sweep deleted 1, cron `37 3 * * *`, proof PASS, RLS 74. Before/proof SQL in `docs/legal/sql/r9-*` |
| R10 | Remove the one-shot ledger repair | **done** | #196 | Deleted `ledger-repair.yml` + `scripts/ledger-repair.sh`. **Evidence lives:** run `35868772500` (2026-09-23 13:40 UTC, head `6adf4e8f`, success); this file's D4 sections (ledger 95 → 98 → 103 → 104); `git show 2984e152` (PR #183). `CLAUDE.md`'s example updated |
| R11 | Placeholder audit | **done** — Round 2 (approve §6) | #199 | `PLACEHOLDERS.md`: **66** after every Round-1 PR (rafi 27 · attorney 15 · date 12 · provider 9 · marker 3 · built/repo 0). `placeholderAudit.test.ts` re-measures it every run. Breaks: **a planted extra placeholder** → `expected 66 to be 67`; a dropped row; a row left as `repo`. 5 resolved with evidence. Doc 08 was missing six storage keys the code writes (added, marked "read from the code") |
| R12 | Attorney packet | **done** | this PR | `ATTORNEY-PACKET.md`: ~20 minutes to read; 7 groups; each question is Today / Draft / Decide. Includes withdrawal scope, consent-record retention + the closure cascade, school consent, email-plus delay, arbitration, DMCA, AI content, liability floor, which document controls, the Spanish standard |
| R13 | Spanish, prepared not published | **done** — Round 2 (review job) | #190 | `docs/legal/es/` ×7 (public parts), `REVIEWED-BY:` empty; `spanishReviewer()` counts a draft only when `REVIEWED-BY: Name, YYYY-MM-DD` is in its header. **Red before**: 9 failed. 5 breaks (incl. a dropped placeholder: `expected 8 to be 9`). Per-page placeholder counts EN = ES after following every Round-1 English change. **Finding:** the Spanish consent flow is **live and unreviewed** today (decision 3.2) |
| R14 | Staging, prepared | **done** — Round 2 (create it, §4.6) | #193 | `seed-staging.mjs` (fake `@example.test` data; refuses production's ref **before connecting**, reads that ref from `assert-prod-ref.sh`); `docs/staging.md`; `stagingPrep.test.ts` evaluates `deploy.yml`'s job graph (unset → staging skipped, prod runs; set → staging first; staging fails → prod skipped). Seeded a local stack twice. 6 breaks; a 7th **passed** on the broken state = one inert clause in `migrate-prod`'s `if` (decision 3.11) |
| R15 | Launch checklist | **done** | this PR | `READINESS.md` rewritten: done/proven · built, waiting on Round 2 · waiting on Rafi / attorney / providers / reviewer · publish; 👪 = before the first family, 💳 = before the first payment |
| — | CI independent of ghcr.io | **done** | #198 | From 17:51 UTC on 23 Sep, **every** `rls-tests` run failed on `toomanyrequests` pulling `supabase/postgres` (sequential reruns too). The pull step now uses `public.ecr.aws`: its own run passed; the fix is on every Round-1 branch |
| — | D7 records never merged | **done** | #187 | `39f5e57c` was pushed after #182 merged; now its own PR, merged first |

### Round 1 — after merge (24 September 2026)

- Phase A and B1–B2 merged by Rafi; `migrate-prod` applied `20260923180000`, `20260923180100` (#194) and `20260923190000` (#197), read from each job's log.
- **#192 turned `main` red** (Deploy #428, `5ab91bd`): `withdrawExportE2e` (from #189) failed. **Mechanism, logged:** its fake Supabase routed only `/[a-z_]+/` names, so R3's `consent_b3_due` threw `stand-in: … not implemented`, the route's best-effort drain swallowed it, and no cancel happened. Each PR was green alone (#189 predates the drain; #192 lacked #189's test). **A cross-PR combination only `main` ever ran**, which is the thing stacked, separately-green PRs cannot see. Fixed in **#201** (test-only), which also carries a comment-only note in `20260923200000` so its merge push offers that migration to `migrate-prod`.
- Phase C (#190, #199, #200) simulated on `main` + #201: merges clean, touches no migration, full suite run on that tree (see #201).

---

## Consent-once (started 24 September 2026)

Founder's decision: **one verifiable (email-plus) consent per parent account**, given once; each later child gets a
short in-app **parental attestation** instead of a new email. Rules: no production, no merges, the gate must not
weaken, evidence kept, B3 cancellation on every path, legal text = build. The founder's work list is
[`CONSENT-ONCE-ROUND2.md`](CONSENT-ONCE-ROUND2.md).

### C0 — design (written before any code)

**Record: reuse `parental_consents`, add a scope.** The email-plus machinery (B1/B3, tokens, `consent_lookup`/`grant`/
`decline`/`withdraw`, the state guard, R3's B3 queue) already produces exactly the evidence an account consent needs,
so a second table would duplicate it.
- New column `parental_consents.scope text not null default 'child' check (scope in ('child','account'))`. Every
  existing row stays `'child'` (what the parent actually agreed to). The new flow writes `'account'`. `scope` joins the
  fields the guard freezes once recorded.
- New column `parental_consents.parent_ack_at timestamptz`: when the parent ticked "I'm a parent or legal guardian,
  I've read what we collect, and I agree" (on the signup page, possibly before the account existed, or in the app).
  The notice they ticked is the row's own `notice_version`.
- An account consent's `learner_id` stays null for ever. `consent_bind_learner` only binds `'child'` rows, and the
  one-consent-one-child unique index on `learners.consent_id` is replaced by the same rule in the gate, for child scope only.

**Attestation: on the child row itself, NOT NULL.** `learners` gains `attested_by uuid not null`, `attested_at
timestamptz not null`, `attested_notice_version text not null`, and `attestation_method text not null check in
('checkbox','per_child_consent')`. Being on the row makes the attestation structurally impossible to be missing, it
is exported with the child (the export already carries the learner row), and it is deleted with the child (C1 asks
for this). The account consent is the evidence that survives.

**The gate rule (database, trigger — same pattern as D4/D6):**
- `learners` **INSERT** is refused (`P0C01`) unless all of these hold:
  1. `consent_id` names a `granted`, **`account`**-scope consent of `created_by`;
  2. that consent is **current**: no notice version marked `reconsent_required` is newer than its `notice_version`;
  3. the client supplied `attested_notice_version` and it equals that consent's `notice_version` (this proves the
     checkbox showed the notice the parent agreed to);
  4. `auth.uid()` is null (the service role) or equals `created_by`.
  The trigger itself sets `attested_by = created_by`, `attested_at = now()`, `attestation_method = 'checkbox'`, whatever
  the client sent. A new child can **never** be created under a `'child'`-scope consent again.
- `learners` **UPDATE** and every child-data table (the 14 gated since D4): `consent_ok(child)` requires the child's
  `consent_id` to be `granted` **and current**, and the attestation columns to be non-null. The attestation columns are
  immutable after insert.
- ⚠️ **One deliberate reading of rule 2, for the legacy child.** A `'child'`-scope consent that is `granted` and bound
  to **this** child still satisfies `consent_ok` for that child only. It is email-plus for that one child, which is
  stronger than an account consent plus a tick. It cannot create any other child. Without this, the one existing
  child would freeze until the parent re-consents. The alternative (the founder's choice): clear that one test child
  in the migration, as D6 did. Recorded in CONSENT-ONCE-ROUND2 §3.
- `learners.consent_id` stays **NOT NULL**. The DB-level assertion at the end of the migration checks every child row
  against the rule and rolls everything back if any fails.

**Re-consent on a material notice change.** New table `consent_notice_versions(version text pk, seq int unique not
null, reconsent_required boolean not null default false, note text)`, seeded with `notice-v1…notice-v5`, **none**
requiring re-consent (the founder: all accounts are test). `consent_request` refuses a version not in the table
(`P0C04`), so a new notice version cannot ship without its row. A test pins `NOTICE_VERSION` ∈ the seed. Marking a
version `reconsent_required` makes every older account consent non-current: new children and new child data are
refused, and `/parent` shows a re-ask screen (the same notice + tick + B1). A new grant supersedes: the old consent is
closed as `withdrawn` (see below) **only after** the new one is granted, so children are never stranded.

**Every path that sets or ends consent:**

| path | before | after |
|---|---|---|
| Signup (email or Google) | nothing | notice summary + unticked checkbox on `/auth`; both signup buttons disabled until ticked; the tick is kept on the device (and in the email-signup user metadata, so it survives opening the confirmation link on another device) with its notice version and time |
| First visit as a confirmed parent | — | if a tick exists and no account consent: `POST /api/consent/request` (scope account, `parent_ack_at`) → B1. No tick (Google in *login* mode, another device, teacher who later adds a child): the notice + tick in the app, then B1. **Signup is never blocked; only adding a child is** |
| Waiting | — | "Waiting for your permission — check <email>" + **Resend**. A new request expires the parent's older pending account requests (`pending → expired`) |
| Grant (B1 link) | per child: B3 scheduled, then granted | same route. If the parent already holds a granted account consent → `already_granted`, and the just-scheduled B3 is cancelled (as today for a lost race) |
| Add a child | notice + email per child | account consent granted and current → the add sheet with one unticked checkbox: "I'm this child's parent or legal guardian. The permission I gave on {date} applies to this child too." plus a link to the notice. Not granted → the account flow above |
| Delete one child | `delete_child_data` | unchanged. It ends only a **child**-scope consent bound to that child (and so queues its B3). The account consent and its B3 continue: the permission still stands for the other children |
| Withdraw the account (new) | — | Account settings **and** B3's link: `consent_withdraw_account` / `consent_withdraw` on an account-scope token → every child `created_by` the parent through `delete_child_data`, every granted consent of the parent → `withdrawn` (R3's trigger queues each future B3; the route drains). Idempotent (a second call finds nothing granted and returns `withdrawn`). The account stays open with no children; adding one needs a fresh account consent |
| Close the account | `delete_my_account` | unchanged; R3's delete trigger still queues B3 before the cascade |
| Expire | pending only | unchanged |

**Teacher roster: stays paused.** A teacher is not a child's parent, so neither the account consent nor the
attestation can cover roster children. The design does not change that. Teachers are not blocked at signup: `/auth`
offers "Signing up as a teacher?", which enables the buttons without the parent tick (decision 3.x in the Round-2 file).

**Deploy order.** The client and migration ship in one PR. Merging deploys the client at once, while the migration
waits for approval. **In the gap (minutes), adding a child is refused.** The new client asks for an account consent
the old schema cannot record (`PGRST202` → "not ready"). All accounts are test accounts, so the gap is acceptable and
is stated in the PR. After the migration, an old bundle cannot create a child (no attestation → `P0C01`); the R1
network-first worker makes old bundles rare.

**Proposal, not built — the signup email as the consent email.** Not safe to merge them:
1. **Google parents get no confirmation email**, so they would need B1 anyway: two flows instead of one.
2. The auth mailer's templates live in the Supabase dashboard (not versioned in the repo), and it cannot schedule B3.
3. A confirmation click proves control of an inbox, not agreement. Email-plus needs the notice's content in the
   message and an affirmative "I give permission".
4. The confirmation email is also resent for password resets and email changes, which blurs the evidence.
It would save one email for email/password parents only. Recommendation: keep B1.

### C1–C6 — results (24 September 2026; branch `consent-once`, one PR)

| step | state | proof |
|---|---|---|
| C0 design | done | above, written before code |
| C1 database | done | `20260924100000_consent_once.sql`: `parental_consents.scope` + `parent_ack_at`; `learners.attested_by/at/notice_version/attestation_method` NOT NULL; `consent_notice_versions` (v1–v5, none re-consent) + `consent_is_current` (INVOKER); the gate (INSERT: account scope, current, attestation = the consent's version, stamped by the trigger; UPDATE: judged on the **new** row; attestation immutable); `consent_request` (account only, known version, expires the parent's other pending requests), `consent_lookup` (+scope), `consent_grant` (`already_consented`; re-consent moves the children, then closes the old one), `consent_withdraw` (account token → whole account), `consent_withdraw_account` (internal), `withdraw_my_consent` (authenticated). Data migration: the existing child is attested **from its own consent** (`per_child_consent`), nothing invented. Closing assertions roll the file back. **Tests:** `consentOnceMigration` (legacy child carried over and still writable; a per-child consent creates nothing; a rule-2 failure rolls back everything — breaks: backfill removed → red, assertion removed → red), `consentReconsent` (**red on the first migration**: re-consent was refused because the UPDATE gate re-read the stored row — found by the test agent's probe, fixed), `consentOnceGate` (as `authenticated`: no attestation / withdrawn / expired account consent → refused; account withdrawal deletes every child, keeps the consent `withdrawn`, queues B3, leaves another family). 16 existing suites translated to the new model without deleting a test (per-file notes in the PR). **Real Postgres:** the RLS suite on a local stack with every migration: `RLS_ASSERTIONS=82`; a production-shaped rehearsal: `co-before.sql` → apply in one transaction → `co-proof.sql` every row PASS, children 1 = before; control (a version marked re-consent inside a rolled-back transaction) → the gate row FAIL |
| C2 signup | done | `/auth` signup mode: summary + full notice + unticked box; **both** buttons disabled until ticked (measured on the real page: submit and Google `disabled: true` → tick → `false` → untick → `true`); tick stored with version + time (device + email-signup metadata); "Continue as a teacher" enables without the tick; dashboard card sends B1 automatically when a current tick exists, else notice first; WAITING + resend; REASK. Request route: `p_scope`, `p_ack_at` (validated), PGRST202 → `not_ready`. Breaks: Google not disabled; route without p_scope — each red |
| C3 add a child | done | sheet only on a granted, current account consent; unticked attestation with the consent's date + link to the notice; Add disabled until ticked; `createLearner` sends `attested_notice_version`; both legacy branches deleted. Break: sheet without the tick → red |
| C4 withdrawal | done | per child unchanged; whole account from Account settings (`withdraw_my_consent` then R3's drain) and from B3's link (`consent_withdraw` on an account token); both idempotent, both cancel B3. `/consent/withdraw` shows the every-child wording for an account token (seen on the real page from a real token). Breaks: skip the drain call; ignore scope — each red |
| C5 legal text | done | notice-v5 (pin `6f9af556a754`), B1 (+"covers every child"), B2, B3, the new screens in doc 03 — held to `copy.ts` both ways; docs 06, 11, 12 (EN + ES drafts, still unreviewed/unpublished); placeholder count **66, unchanged**; attorney packet A1 updated, **A8–A10** new (the two founder questions, Option B, the signup email as consent email). `withdrawalScope` break (old doc 06) → red |
| C6 verification | done | full vitest **119 files / 3,686 passed**, `tsc` 0, `next build` OK; **local end-to-end** (real Next routes, local Supabase stack, Resend stand-in; `scripts/consent-once-e2e.mjs`): sign up with the tick → one B1 → grant → B3 scheduled → a child without the tick refused (P0C01) → two children with ticks only (still 2 emails in total) → delete one → the other remains, consent still granted, no B3 cancelled → withdraw the account → 0 children, consent `withdrawn` + unlinked, B3 cancelled, a new child refused, a second withdrawal harmless → a second parent's B3 **link** withdraws every child and cancels its B3: **ALL PASSED**. Screenshots: `docs/legal/screenshots/consent-once/` |

## Rename (24 September 2026) — the product becomes Radlic at radlic.com; the mascot goes

Founder's decisions (final): product **Radlic**, domain **radlic.com** (the old one a permanent redirect), company
unchanged (**Radlor Inc.**, its addresses), **no mascot** (a child's avatar stays). Rules: no production, no merges,
PR with green CI; rename what people see, keep what machines depend on; history is not rewritten. Built on `main`
after #202–#204 (no open PR touched visible text, checked on GitHub first). Branch `rename-radlic`, one PR: **#205** (open, green CI, not merged).
Everything that needs the founder, in order: **`docs/RENAME-MANUAL.md`**.

| step | state | proof |
|---|---|---|
| N0 inventory | done | `scripts/rename-inventory.mjs` → `docs/rename/inventory.tsv`, 5,368 rows, categorised (visible 206 · mascot 3,921 — mostly the hidden legacy chapters · identifier 499 · historical 629 · url-domain 59 · third-party 54) |
| N1 app UI + mascot | done | Radlic in every naming position; no fox as brand/splash, no `milo-happy.png`, no character lines; PWA icons = plain wordmark. `renameGate.test.ts` **mascot** grep 0 |
| N2 domain | done | `SITE_URL` → radlic.com (env still wins, and is the switch); `next.config` 308 old host → new, `/api/*` excluded. `oldDomainRedirect.test.ts` (3 planted breaks, exit 0 each); `e2e/old-domain-redirect.spec.ts` in real Chromium keeps path, query, `#t=` (a planted `#x` in Location turned 5/5 red). Probed: 308 with path+query, `/api/health` 200 on the old host |
| N3 emails | done | sender `Radlic <noreply@radlor.com>`; B1, B3, signup summary, cancellation + both footers (doc 03, doc 09) EN+ES; `consentCopy`, `billingCancel`, `emailSuppression` green |
| N4 legal + notice | done | **notice-v6** (pin `b24962a84278`; the hashing reproduces v5's `6f9af556a754` on the old tree); "all **your** children" in the notice and doc 06 (EN+ES); every public legal doc EN+ES; placeholder audit green (count unchanged); ATTORNEY-PACKET rename line + A11. ⚠️ migration `20260924120000_notice_v6_radlic.sql` — apply BEFORE `release` |
| N5 internal docs | done | README (was describing 70 chapters and a webcam), CLAUDE.md "The product is Radlic", one dated handoff line, living docs; code comments in N1 |
| N6 identifiers in view | done | the export download `milo-<child>-<date>.json` → `radlic-…` (nothing reads it back); planted break exit 0. All other identifiers kept |
| N7 verification | done | Node 20: `tsc` 0, vitest 122 files / 3,701 passed (11 skipped, as before), `next build` OK, `npm audit` 0. Gate planted controls, each exit 0 on its own assertion: name in the wordmark, old domain in the notice, fox as brand, Milo in a Spanish draft, old name in the manifest, notice changed without a version bump. Built artefact: host-scoped 308 in `routes-manifest.json`; 0 × Milo/AdaptiveLearn/old domain in the prerendered `/`, `/auth`, `/help`. sw v231. Before/after: `docs/rename/before.jpg`, `after.jpg` |

**Exceptions to the zero-hit greps** (each named in `renameGate.test.ts`, each must still match): the child's avatar
list (🦊 as an avatar); `llms.txt`'s "Earlier names" paragraph; two dated comments (layout, site); the redirect code
(`OLD_HOST`, one next.config comment); the attorney packet's rename record; the README/CLAUDE.md history lines; one
historical row of CLAUDE.md's defect table. **Out of the greps' scope by rule 3:** LOOP-STATE, ROUND-2,
CONSENT-ONCE-ROUND2, `docs/legal/sql/`, doc 14 (dated findings), the handoff archive; and the hidden legacy chapters
(`src/features/chapters/`), which are pinned hidden by the same test instead.

**Unexpected:** (1) the database refuses unknown notice versions, so the rename needs a data migration and a deploy
order; (2) machines POST to the old domain (Stripe webhook, one-click unsubscribe, cron) — so `/api/*` is not
redirected; (3) radlic.com is a parked domain today, found when the first test build leaked two GETs to it (see
RENAME-MANUAL §F.5); (4) the README was stale (it still described 70 chapters, six age bands and webcam answers).

## Beta launch (24 September 2026) — the legal pages a private beta needs, published on the founder's decisions

Goal (founder): a private-beta soft launch on Friday 25 September 2026 (US time) with families the founder knows —
real US children — with the Privacy Policy and Terms public and accurate first. No attorney yet: the founder decided
each open point for the beta; each is in `ATTORNEY-PACKET.md` → *Decided by the founder for the beta*. Branch
`beta-launch`, one PR. The founder's steps up to Friday: **`docs/LAUNCH-CHECKLIST.md`**.

**Which pages (measured, not assumed).** Live screens and emails link to Privacy, Terms, Parent rights, Retention and
Subprocessors; the Privacy Policy itself links Cookies, so Cookies must be public too. Refunds is linked only from the
(now hidden) plans page and the cancellation email, and billing is off.

| page | state | why |
|---|---|---|
| Privacy, Parent rights, Subprocessors, Cookies, Retention | **published**, English only, beta banner | 0 placeholders; guard passes |
| Terms | **dark** | two founder decisions open: §11 liability floor (#62), §14 phone or plain contact (#67) — **go/no-go G1** |
| Refunds | dark | billing is off (`BILLING_LIVE = false`) |

**Placeholders 53 → 24** (29 resolved; `PLACEHOLDERS.md` → *Resolved for the private beta*). Dates: 25 September 2026.
Provider values read by the founder from the dashboards (hosting logs 1 hour on Hobby, database logs 7 days on Pro, no
Stripe key in production, GitHub = github.com). The two storage rows seen in a live child session.

**The guard.** A `beta` record in `registry.ts` stands in for the attorney's sign-off and the Spanish review, and lifts
nothing else: a placeholder anywhere in the file, a DRAFT status, deletion and billing still refuse, and the page throws
at build. Proven: a placeholder planted in the **published** Privacy Policy turns `legalDocs`, `legalSwitch` and
`placeholderAudit` red (break-check exit 0 each) **and fails `next build`** with "/legal/privacy is switched on but must
not be published: placeholders: … still carries 1".

**The beta is free.** Terms §5 says so; subscription, refund and "amount paid" text removed from Terms and Privacy; the
parent's plan card, its Help step and the checkout on `/parent/plan` are hidden while `BILLING_LIVE` is false (the
checkout component still ships and is still held to its legal links).

**Found by publishing (and fixed):** the legal renderer showed raw markdown to parents — nested emphasis as bare
asterisks ("**Or email us"), inline code as backticks (cookie and table names). Inline code now renders as code, inside
bold too; two nested-emphasis lines were reformatted; a test fails on any bare `*` or backtick in a published page.

**Decided, not built:** invite-only — **no** (signup stays open). Errors — **nothing to build**: crashes already reach
`error_events` (when the service-role key is set — inferred, see the checklist) and Vercel's logs; the founder reads a
read-only SQL query (checklist §4).

Proofs: Node 20 — `tsc` 0, vitest 125 files / 3,722 passed (11 skipped as before), `next build` OK, `npm audit` 0.
Planted breaks, each exit 0 on its own assertion: placeholder in a published page (three tests + the build); beta
letting a placeholder through; beta banner removed; `WITHDRAWAL_DELETES` false; the plan card shown in beta; inline
code shown raw; sign-off never required.

## Short sessions (started 24 September 2026) — 5-question checkpoints, resume, and a soft prerequisite nudge

Branch `short-sessions`, worktree `/Users/mrk/milo_react/w-ss`, off `main` = `46d297e2`. Rules: no production, no
merges (founder decides after the launch weekend), PRs only; anything for the founder → `SHORT-SESSIONS-ROUND2.md`.

| step | status | proof |
|---|---|---|
| S0 measure (read-only) | done | findings below, every one read from code on `46d297e2` (file:line) |
| S1 interview | done | four rounds, 24 Sep 2026 — decisions below |
| S2 Part A (PR 1) | done — **merged by the founder's account 11:44 UTC, before the launch weekend** (see below) | [#209](https://github.com/RadlorInc/learn/pull/209): CI green; 20 planted breaks, each red on its own assertion; 3 decorative checks found and fixed |
| S3 Part B (PR 2) | done, open | [#210](https://github.com/RadlorInc/learn/pull/210): CI green (verify + rls-tests); 12 planted breaks red; carries #209's two follow-ups |
| S4 legal check | done — **decision needed** | saved run covered by docs 02/11 (no bump); doc 08 line 20 wording proposed; the parent line is a new use of an event → options a/b/c (`SHORT-SESSIONS-ROUND2.md` §4) |
| S5 verification | done | CI (Node 20) green on both; full suite 130 files / 3,754; legal/consent/Spanish/RLS suites in it; e2e on a fake backend 5/5 twice, 3 served-tree breaks red; screenshots 01–06 |

### S0 — findings (read from the code, 24 Sep 2026; nothing run against production)

**Vocabulary.** There are no visible "chapters". Every legacy chapter is hidden (`LEGACY_CHAPTERS_HIDDEN`). A child
sees **grade → module → topic** (a *topic* = one `Lesson`: 9 teaching screens, then adaptive practice). Below,
"chapter" in the brief is read as **topic**. Module practice is a separate, second practice screen.

1. **Question count and what ends practice.** Topic practice: `MAX_PROBLEMS = 12` (`adaptive.ts:59`), not 10. It ends
   when the topic is **mastered** (two first-try right answers in a row at the top ladder level) **or** 12 problems are
   asked (`advance`, `adaptive.ts:118`). The screen shows "Problem N" with no "of" (`LessonPlayer.tsx:180`). Module
   practice: fixed `MODULE_PROBLEMS = 10` and it **does** show "Problem N of 10" (`ModulePractice.tsx:97`). Class
   exercises: a fixed list of 1–50, not adaptive, "Question N of M".
2. **Adaptive state.** Per topic, `Standing = { level, streak, mastered }` (`adaptive.ts:53`) — saved after **every
   answer** to the device (`lessonStanding.ts`, kv key `milo-newflow-standing-<child>-<topic>`) and queued to
   `lesson_progress` (level, streak, mastered, done). The **run** — problems asked so far, the last 6 question texts
   (`recent`, the only no-repeat memory), the problem on screen, which earlier topic was picked for review — lives in
   React memory only (`Run`, `adaptive.ts:92`). Closing the app loses the run; the level survives. `startLevel` resets
   the streak to 0 on every start (`adaptive.ts:71`).
   ⚠️ **And more is lost than the brief assumes:** a topic is only marked done at the end of practice
   (`lesson/page.tsx:47`, `onFinish`). A child who leaves mid-practice finds the topic not done, and reopening it starts
   at **teaching Screen 1** (`START`), not in practice.
3. **Complete / mastered.** Topic *done* = practice reached its end (mastered or 12 asked). Topic *mastered* = the ladder
   rule above. Module "done" = every topic done. Child home: "N of M topics done" (`ModuleHome.tsx:110`), the topic map
   "N of M done" + green ticks (`LessonList.tsx:59`), button "Start / Keep / Learn again". Parent dashboard:
   "Topics mastered", topics done, problems this week, first-try %, and "finding X hard" (≥6 problems, not mastered,
   first-try <50%) (`progressReport.ts`), plus "{done} of {total} done" for assigned topics (`Performance.tsx:118`).
4. **Prerequisites.** **None exist as data.** `docs/skill-graph.md` and the skill graph were deleted (2026-09-13/20).
   The only structure is **order**: topics in teaching order inside a module, modules in order inside a grade
   (`modules.ts`). No topic → topic or module → module dependency is written anywhere.
5. **Assigned.** `learners.lesson_ids text[]` (NULL = every topic, no choice made; a list = the child sees **only**
   those topics) and `learners.lesson_due jsonb` (a date per assigned topic). A teacher's class writes the same
   `lesson_ids` onto each student (`20260918100000`). ⚠️ So when a list is set, a prerequisite outside it is not even
   visible to the child. Class exercises are separate (`classes.exercises`).
6. **Offline queue.** `lessonSync.ts`: every answer appends `{learnerId, lessonId, outcome, event}` to kv
   `milo-lesson-sync-queue` (max 2,000), flushed in order, stopping at the first `retry`. The standing sent is re-read
   from the device at send time. Pulled back into the device on the child's home (`pullLessonProgress`).
7. **Consent / export / delete** for a new field: `lesson_progress` is already gated (catalog-loop trigger,
   `20260923120000` §4), exported with `select('*')` (`exportData.ts:87`), and cascades from `learners` on delete and
   withdrawal (`20260923140000`). **A new column on `lesson_progress` inherits all three; a new table needs its own
   trigger** (the loop ran once, at migration time).
8. **Legal, first read.** Doc 02 line 33 and doc 11 line 56 already name "answers … scores, points, progress". Doc 08
   line 20 names the device store's "what they last played, work waiting to sync". A resume position is plausibly
   covered; S4 settles it.
9. **Spanish.** The child screens (lessons, practice, modules home) have **no translation mechanism**: Spanish covers
   the adult dashboard and `/auth` only.
10. **Words.** Lesson *content* legitimately says "wrong" (Screen 7 crosses out the wrong move; "spot the mistake"
    ladder levels). A forbidden-words test has to cover UI strings, not the maths content.

### S1 — the founder's decisions (24 Sep 2026, question tool)

1. **Where:** the checkpoint is in a **topic's practice** (the questions after the 9 screens), at every 5th answer.
   Not in module practice or class exercises; module practice loses its "of 10" instead.
2. **No end count:** the child practises as long as they like; a checkpoint every 5. `MAX_PROBLEMS` goes.
3. **Mastery** (any time): celebrate "You've got this topic! ⭐" with the same two choices; going on keeps giving
   top-level questions and points. The topic is done + mastered at that moment.
4. **Progress = ladder position** (mastered = full). "Done" (tick, +10 points, parent counts) = mastered **or** 12
   answers in total across sessions. 50% = at or past the middle of the ladder.
5. **Wording** (EN): popup "5 questions done! ⭐ Nice work." [Keep going] [Take a break]; break "Great work, 5
   questions done! ⭐ Your spot is saved." + points earned [Back to topics]. **No points bonus.**
6. **Coming back:** a card, never an automatic skip — "Welcome back! ⭐ Your spot is saved." [Keep practising]
   [Watch the lesson first]; after the lesson, practice resumes from the saved state.
7. **Storage:** a new column on `lesson_progress` (gate, export, delete inherited) + a device copy through the offline
   queue.
8. **Prerequisite = the previous topic in the same module.** The first topic of a module gets no card.
9. **Nudge:** a filled bar (no number), the brief's wording. **Assigned** = the child has a topic list and this topic is
   in it → no card; and no card when the previous topic is not in the child's list (they cannot see it).
10. **Parent line:** yes — "<name> started “X” before getting far with “Y”." only after "Go anyway"; via
    `learner_events` (already gated, exported, deleted).
11. **Spanish:** new child strings in one module with an unreviewed ES draft each; the screens stay English until the
    child screens get a language system. The forbidden-words test runs over both.

### S2–S5 — results (24 Sep 2026)

- **#209 was merged at 11:44 UTC by `Rafiquekuwari`**, against its own title. The agent merged nothing. `promote` ran, so
  `release` = `3bdf7f80` and production's client has Part A; `migrate-prod` waits for approval. The client's tolerance of
  the unapplied migration was then **measured**, not assumed: Supabase's PostgREST image, run locally, answers `42703`/400
  for the unknown column and `PGRST202`/404 for the missing function, which are the codes the client handles; the same select
  without the column gives 200. Options for the founder: `SHORT-SESSIONS-ROUND2.md` §0.
- **Checks that were decorative until a planted break said so:** the pull's run validation (inert; `loadRun` already
  validates — deleted); a closing-assertion test reported as the wrong kind of red (rewritten as a value); the proof's
  row count on an empty fixture (seeded); exact halfway never reached on an odd ladder (pinned); **the forbidden-words
  regex never matched "lock"** (`locked?` = "locke" + optional "d"); **the e2e "passed" on a planted break because
  `break-check.sh` breaks a temporary worktree while the dev server serves the real one** (re-planted in the served tree:
  red). Each is now red on its defect.
- **Found by driving it:** the welcome card said "Welcome back! ⭐" twice (fixed, in #210); `toBeVisible` passes for an
  element scrolled off the topic map (the spec now asserts in-viewport); "+10 points" looked faint in a screenshot. It was
  the pop-in frame: the spec now asserts full opacity, and that passes.
- **Neighbouring defect, written down:** doc 08 line 33 ("signed out … the on-device store was empty") is false as measured
  today (`milo-newflow-standing-device-*`), and it predates this loop (ROUND2 §5).

### Change of plan — Part B before the launch (24 Sep 2026, founder)

Decisions: keep #209 (live); parent line = option (a), from progress; #210 is updated in place and stays a **Draft**.

| step | status | proof |
|---|---|---|
| Rebase #210 onto `main` (#209 merged) | done | clean; the two #209 follow-ups (`lock` regex, welcome crumb) were already in #210 and survive it |
| Parent line from progress, no events | done | `startedAhead()`; `getRecentNudges` and the nudge's `track` call deleted; e2e asserts **no event** is written; 5 planted breaks red (threshold, never-started, never shown, list ignored ×2) |
| Doc 08 lines 20 + 33 true (published) | done | signed-out store **measured** (Playwright, fake backend): exactly `milo-newflow-standing-device-<topic>`, `milo-newflow-done-device-<topic>`, `milo-kv-migrated`; nothing in session storage, no cookies, no calls. Gated by `doc08SignedOut.test.ts` (3 breaks red) + the e2e re-measure (a served-tree break red). Rendered page checked: codes shown as code, no raw backticks |
| CLAUDE.md Draft rule | done | top of CLAUDE.md |
| Migration for #210 | **none** | `git diff origin/main -- supabase/` empty |

**Found on the way:** with option (a) the line could name a previous topic outside the child's chosen list, which is
not on their map. Seen in the parent screenshot; now excluded (as the card already was), tested and broken.
⚠️ **And one of mine, recorded because the rule exists for exactly this:** a `playwright test … | grep && git commit`
committed screenshots from a run with **1 failure**. The `grep` succeeded, so the `&&` did too, which is CLAUDE.md's
*never chain a test run to a commit*. It was caught before the push (local only), undone with `reset --soft`, the cause
was found (the new list filter correctly hid the old line), and the commit was redone after a read 6/6 run.

### Live finding → "assigned" means a due date (24 Sep 2026)

After #210 went live, the founder reported: a child in g3m1 took a break on "Rows of chairs" (t2) and opened "Turn the
tray" (t3) with no card. **Cause, not a bug against the spec:** the child's parent had ticked all 8 g3m1 topics in the
Lessons tab (no due dates), and the S1 rule counted any listed topic as assigned. t2 was at level 0 (well under 0.5),
there is only one entry path (`/lesson?id=`), and no day mark exists when no card was ever shown. **Founder's decision:
a topic is assigned only when it has a due date.** Built on branch `nudge-due-date` (Draft PR); the test
reproduces the live path and went red on the rule production runs. Teachers have no due dates today (a class writes
only `lesson_ids`), so for now only a parent's due date suppresses the card.
⚠️ The investigation read production with three SELECTs through the Supabase MCP tool, which the founder had allowed
("read-only") for that request. **The founder has since forbidden it outright** (CLAUDE.md, top): production is read
only through SQL he runs. The same questions are now `docs/legal/sql/nudge-why-no-card.sql`.

## Review 1 quick wins (started 24 September 2026) — the small, code-mostly items from "Adaptive Learn review 1"

Worktree `/Users/mrk/milo_react/w-rv1`, off `main` = `cf020313` (after #212). Rules: no production, no merges, every
PR a Draft; the founder's steps go to `REVIEW1-ROUND2.md`. Content-heavy review items (real-world intros, topic images,
terminology, unit tests, formula sheets) are later loops.

| item | status | PR | proof |
|---|---|---|---|
| Q0 measure (read-only) | done | — | findings below, read from code on `cf020313` |
| Q0 interview | done | — | two rounds, 24 Sep 2026 — decisions below |
| Q1 session tracker | done | [#213](https://github.com/RadlorInc/learn/pull/213) (with Q2) | `practiceFeedback.test.ts`; breaks B1–B3 red; e2e desktop + 375 px reduced motion, served-tree break red; CI green |
| Q2 gentle feedback | done | [#213](https://github.com/RadlorInc/learn/pull/213) | breaks B4–B9 red (B4/B7 first came back exit 3/4 — my break and my test, both fixed); `childWords` now reads arrays |
| Q3 module summary + Practice again | done | [#214](https://github.com/RadlorInc/learn/pull/214) | `moduleSummary.test.ts`; C1–C8 red (C5 first exit 4, fixed); e2e: last topic → summary, Practice again at 375 px; 2 served-tree breaks red; CI green |
| Q4 parent: mastered list | done | [#215](https://github.com/RadlorInc/learn/pull/215) | `masteredList.test.ts`; D1–D6 red; e2e on `/ui-preview`, keyboard, desktop + 375 px, served-tree break red; CI green |
| Q5 font size | done | [#219](https://github.com/RadlorInc/learn/pull/219) | `textSize.test.ts` + `doc08SignedOut`; E1–E9 red; e2e 375 px × 3 sizes over 7 screens + keyboard; **the first width check was blind (clipping) — found by a screenshot, rebuilt, watched red**; sweep: 0 new findings vs `main`; doc 08 row to approve |
| Q6 drawing: colours + arrow | done | [#216](https://github.com/RadlorInc/learn/pull/216) | `scratchPadTools.test.ts` (recording canvas); F1, F3–F8 red; **F2 passed on the broken state — correctly: the arrow is straight by two mechanisms; both broken → red**; e2e real mouse + canvas pixels; CI green |
| Q7 vertical number line | done | [#217](https://github.com/RadlorInc/learn/pull/217) | `verticalNumberLine.test.ts`; G1–G7 red; e2e g7m2 desktop + 375 px, keyboard; served-tree break red; CI green (a font-loader build error on one run was transient: re-run passed) |
| Q8 home motion | done | [#218](https://github.com/RadlorInc/learn/pull/218) | e2e only (CSS behaviour); 3 served-tree breaks red — **the first "slow" check passed a 3 s loop (two samples can share a phase); now measures speed**; CI green |
| merge check | done | — | all seven trial-merged onto `main` in order, no conflict; full suite on the result **138 files, 3,793 passed, 11 skipped** (tsc clean) |

### Q0 — findings (code on `cf020313`; nothing run against production)

1. **Session tracker (Q1).** The 5-answer checkpoint exists (`CHECKPOINT = 5`, `adaptive.ts:62`; popup in
   `LessonPlayer.tsx:272`). The screen shows only "Problem N" (per session, no "of"). **No dots.** Module practice is a
   fixed 10 with no checkpoint and shows "Problem N" too; class exercises "Question N of M".
2. **Answer feedback (Q2).** Right: pale green box `#b7f0c6` + a green ✓ disc + "Right!" (voice says "Right!"), next
   problem by itself after `RIGHT_MS` = 1.4 s. **First miss:** the input clears and the topic's big idea appears in a
   yellow `#ffd166` box — **no icon and no words telling the child to try again** (the voice reads the big idea).
   **Second miss:** "Here's how this one works:" + numbered worked steps in `#fff1c9`, a "Watch the lesson again" link,
   then "Next problem". No red anywhere; **no sound effects exist** (voice only). Same in `ModulePractice.tsx`.
3. **Follow-up question after a wrong answer (the review's ask) — ALREADY EXISTS, with one nuance.** After the worked
   steps the outcome is `worked` → the standing drops one level (`step`, `adaptive.ts:71`) → the next problem is an
   **easier KIND** from the ladder. Once per 5 a weak earlier topic comes back (`REVIEW_AT`). The nuance: after ONE miss
   the child retries the SAME problem with the big idea shown; the easier follow-up comes only after the second miss.
4. **Scratch pad (Q6).** `ScratchPad.tsx` (71 lines): Pencil (ink `#2a1c14`, 4 px), Eraser, Clear pad, grid paper.
   **One colour, no arrows, no shapes, and NO undo today** (the brief says "undo must still work" — there is none to
   keep; Q6 would add it). Clears on each new problem.
5. **Number lines (Q7).** Three, all horizontal: `numline` in `Diagrams.tsx:192` (display, any min/max incl.
   negatives, 83 uses in content); `line` in `Pictures.tsx:153` (Screen 8 tap-to-jump scratch line, from 0, 19 uses);
   a vertical scale exists only inside `measure` as a thermometer/jug. **No number-line TOOL the child opens.**
   Negative numbers live in **g7m2** (8 topics); Grade 6 has no negative-numbers module.
6. **Parent Progress (Q4).** `Performance.tsx:62`: a "Topics mastered" **count** tile only; no list. Dates exist:
   `point_events` has one `reason = 'mastered'` row per topic (unique index), with `created_at` — **no migration
   needed**. ⚠️ The Progress tab reads points for the last 30 days only; the list needs its own all-time read of the
   mastered rows. A topic mastered before the 17 Sep points wipe can have `lesson_progress.mastered` and no event:
   show it without a date.
7. **Module complete (Q3).** The last topic's finish screen already says "Module complete!" with a badge image
   (`LessonPlayer.tsx:416`). **No summary**: no topics list, no module points total, no "got really good at", no
   Practice again per topic. The topic map's stops already reopen a topic; ModuleHome says "Learn again".
8. **Font size (Q5).** Nothing exists. Child screens use inline px (84 `fontSize` in `features/lessons`), the
   dashboard 151 — a root rem change would scale almost nothing.
9. **Home motion (Q8).** `PAGE_BG` (`Pictures.tsx:16`) is three static soft circles on sand; no animation. Global
   reduced-motion fallback in `globals.css:801`; `Pictures.tsx:280` stops lesson animations under reduced motion.
10. **Gates that new strings must pass.** `childWords.test.ts` reads every sentence of 11 child files + `sessionCopy.ts`
    (EN + ES). Child screens have **no language switch**; Spanish exists as drafts in `sessionCopy.ts`. Parent strings
    go through `features/dashboard/i18n.tsx` (`dashboardSpanish.test.ts`). Doc 08 is gated by `doc08SignedOut.test.ts`.

### Q0 — the founder's decisions (24 Sep 2026, question tool, all eight on the recommended option)

1. **Tracker:** five dots that fill (●●●○○) in a topic's practice, reset at each checkpoint. No count, no %.
2. **Not yet right:** soft yellow + a ↻ icon + "Try again!" text (never colour alone), the big idea as today; red never.
3. **Right:** green + ✓ + a short cheer rotating on screen ("Right!", "Nice!", "You got it!", "Great thinking!"); the
   voice keeps saying "Right!" (the only line with a recorded clip). No sound effect.
4. **Font size:** Normal / Large / Extra large = 100 / 115 / 130 %, the whole screen (text and buttons together).
5. **Where:** an "Aa" control on the child's modules home + the same setting in the parent's Account; one device key.
6. **Module summary:** "Module complete! ⭐" · topics done · points · "You got really good at:" (mastered) ·
   "Let's keep practicing:" (done, not mastered) · a Practice again button per topic.
7. **Vertical number line:** all 8 topics of g7m2, −10 to 10, beside the scratch pad.
8. **Home motion:** the three background circles drift slowly (CSS only), off under reduced motion, home screen only.

### What was unexpected (24 Sep 2026)

- **Three of my own checks were blind until a break or a screenshot said so:** the Q5 width check (the lesson shell
  clips its overflow, so "no sideways scroll" passed with "Aa" invisible), the Q8 "slow" check (two samples far apart
  passed a 3 s loop), and two test helpers that failed with a TypeError instead of an assertion (B7, C5). Each was
  rebuilt and watched red on the defect it is for.
- **CSS `zoom` multiplies `vw` too:** the topic map's `42vw` labels outgrew the map at 130 %. Fixed by sizing from the
  map's measured width. Anything else sized in `vw` needs the same look before a bigger zoom is offered.
- **Already existed, in part:** the easier follow-up question (after the second miss), the "Module complete!" line with
  a badge, a count-only "Topics mastered" tile, a checkpoint every 5. **Did not exist:** Undo on the pad (the brief
  assumed it), any number-line tool, any text size.
- The seven PRs first conflicted in three places (`sessionCopy.ts`, `childWords.test.ts`, `PracticeLayout.tsx`). They
  were fixed at the source, not left for a merge: Q1's components moved to `AnswerFeedback.tsx`, and each item's lines
  sit at their own anchor.

## Deep review (started 26 September 2026) — find and fix in one loop

Brief: the founder's "deep review" prompt (26 Sep 2026). Phase 1 = read-only reports R0–R8 in `docs/review/`;
Phase 2 = one Draft PR per safe fix (rule 10), everything else in `docs/review/NEEDS-RAFI.md`. Base: `main` =
`06cee602` (worktree `../w-review`, branch `deep-review`; radlor-site read-only at `../w-review-site`, `b672ba5`).
No production access of any kind; production facts are asked for as SQL in `docs/review/sql/`. No deploy freeze is
recorded anywhere in the repo (searched `LOOP-STATE`, `READINESS`, `CLAUDE.md`, 26 Sep).

**Baseline on `06cee602` (measured 26 Sep, local, Node 26):** vitest 141 files / 3,810 passed / 11 skipped; `tsc`
clean; `npm run build` OK, 48 routes.

### Phase 1 — reports

| report | file | state |
|---|---|---|
| R0 architecture map | `docs/review/ARCHITECTURE.md` | done (26 Sep) |
| R1 founder stress test | `docs/review/FOUNDER-STRESS-TEST.md` | done (26 Sep) |
| R2 architecture review | `docs/review/ARCHITECTURE-REVIEW.md` | done (26 Sep) |
| R3 latent bugs | `docs/review/LATENT-BUGS.md` | done (26 Sep) |
| R4 performance | `docs/review/PERFORMANCE.md` | done (26 Sep) |
| R5 security | `docs/review/SECURITY-AUDIT.md` | done (26 Sep) |
| R6 devops | `docs/review/DEVOPS.md` | done (26 Sep) |
| R7 SEO | `docs/review/SEO.md` | done (26 Sep) |
| R8 summary | `docs/review/SUMMARY.md` + `NEEDS-RAFI.md` | done (26 Sep): 127 findings — 1 Critical (legal, FND-01), 27 High, 40 Medium, 59 Low |

### Phase 2 — fixes (one row per Draft PR)

| finding | PR | test red before → green after · planted break | migration | notes |
|---|---|---|---|---|
| BUG-03 | #235 | consentGrantRetry.test.ts red 2/7 on main -> 7/7; 4 breaks exit 0 | no-migration | double-fault gaps noted |
| OPS-02 | #236 | migrationsPending.test.ts red 5/7 on main -> 7/7; 2 breaks exit 0 | no-migration | needs a real Actions run for API shape |
| MAP-04 | #237 | speechLocalVoiceOnly.test.ts red 5/6 on main -> 6/6; break exit 0 | no-migration | AUDIBLE on network-voice-only devices: Rafi OK before merge |
| BUG-07 | #238 | roleReadError.test.ts red 7/13 -> 13/13; 2 breaks exit 0 | no-migration | callback page can sit on "Signing you in" if both reads fail |
| BUG-01+BUG-04 | #239 | lessonSyncOwner.test.ts red 4/7 on main -> 7/7 (+1 pre-fix item case); 4 breaks exit 0 | no-migration | pre-fix queued items claimed by first signed-in flush |
| SEC-02 | #240 | learnerAccessRevoke.test.ts red 3/6 -> 6/6; rls_regression 87 assertions; 3 breaks red | MIGRATION 20260926100000 (+1 DEFINER fn is_learner_creator, authenticated only) | pglite only; CI rls-tests is first real Postgres |
| BUG-09 | #241 | pruneKeepsGrantedConsent.test.ts red 2/5 -> 5/5; break exit 0 | MIGRATION 20260926100100 (prune fn body +1 line; DEFINER/search_path/grants unchanged) | declined-only accounts still pruned (N5 question) |
| SEC-06 | #242 | crashUrlNoTokens.test.ts red 3/3 -> green; 3 breaks red | no-migration (cleanup UPDATE proposed for Rafi only if count>0) | jsdom only |
| TRIAL-1 | - | 148 files / 3861 passed, tsc clean, 0 conflicts | - | 26 Sep |
| BUG-05 | #244 | voiceManifestRetry.test.ts red 2/4 -> 4/4; 2 breaks exit 0 | no-migration | 10 s backoff is a judgement |
| BUG-02 | #243 | staleDeviceProgress.test.ts + lessonSync 6 new; 3 breaks exit 0 | MIGRATION 20260926100200 (drop+recreate record_lesson_progress w/ p_answered_at; DEFINER kept; new column answered_at) | new timestamp column on child progress: Rafi to note for notice/export |
| ARC-07+OPS-18 | #245 | workflowTimeouts.test.ts red 7/8 -> 8/8; break exit 0 | no-migration | vitest cannot bound a sync loop (ARC-07 half not fixable by config); migrate-prod 10 min vs OPS-08 dump step: check at trial merge |
| OPS-04+OPS-07+FND-11 | #246 | opsDigest 5/8 red, b3Cancel red -> green; 4 breaks exit 0 | MIGRATION 20260926100300 (new DEFINER ops_digest service_role only; B3 queue fns where-clause changes) | Rafi: set CRON_SECRET + OPS_DIGEST_TO; OPS-21 left (health) by reasoning |
| OPS-03+OPS-08 | #247 | deploySafety.test.ts red 3/7 -> 7/7; 4 breaks red | no-migration (workflow: pre-migrate dump, composite action) | adds a dump artifact per migration (N3); needs real Actions run |
| OPS-10+SEC-14+ARC-15+OPS-12 | #248 | runbookNoProdWrites.test.ts red on main -> green; break exit 0 | no-migration (docs + comments) | partial ARC-15 (teen docs, some comments left) |
| MAP-02 | #249 | billingStripe 2 new red -> green; break exit 0 | no-migration | before-SQL for Rafi (expect 0 rows, test mode) |
| TRIAL-2 | - | 154 files / 3904 passed, tsc clean; 1 trivial conflict 245 vs 236 (deploy.yml) -> 245 stacked on 236 | - | 26 Sep |
| ARC-16+MAP-14+PERF-11 | #250 | speechKeepAlive.test.ts red -> green; break exit 0; build OK | no-migration | legacy-only exports left (N15) |
| SEC-04 | #251 | signupEmailCooldown.test.ts red 4/8 -> 8/8; 3 breaks exit 0 | no-migration | visible edge: re-signup within 2 min to change role/name keeps first email; admin list reads 1 page of 1000 users |
| PERF-01 | #252 | lessonCatalogueSplit.test.ts red 3 routes -> 8/8; break exit 0; LCP lesson 11.6->7.3 s, modules 9.0->5.0 s; first-load 1046->256 KB | no-migration | OFFLINE: unvisited module won't open offline — Rafi OK (N26) |
| SEO-02 | website#3 | check:og exit 1 on break (only /radlic) -> exit 0; build + check:site-claims green | no-migration | radlor-site has no CI; og:url/site_name gaps noted |
| MAP-07+BUG-06 | #253 | analyticsFlush.test.ts red 2/4 -> 4/4; 2 breaks exit 0 | no-migration | stubbed PostgREST only |
| OPS-19+PERF-12 | #254 | swTakeover precache test red on main -> green; 3 breaks exit 0 | no-migration; sw v237 | BUG-11/PERF-07 NOT applied: clips re-rendered under same URL (f5a7694f3) -> needs content-hashed clip URLs (later) |
| PERF-03 | #255 | parentDashboardReads.test.ts red -> green; break exit 0; requests parent 10 kids 49->39 | no-migration | teacher 72 unchanged (needs one-RPC, later) |
| SEC-07 (expand) | #256 | rosterRollbackDelete.test.ts red 2/4 -> 4/4; break exit 0 | no-migration | contract (drop policy + legacy fallback) = Rafi 3.9 |
| SEO-04+SEO-05 | #257 | seoSocialMeta.test.ts red 5/8 -> 8/8; 4 breaks exit 0 | no-migration | test uses Next internal resolve-metadata (fails loudly on upgrade) |
| BUG-08 | #259 | kvFallbackMerge.test.ts red 3/6 -> 6/6; 4 breaks exit 0 | no-migration | undated: IDB value wins on conflict; KV_PREFIXES second list (gated) |
| TRIAL-3 | - | 161 files / 3939 passed after fixing #250 fixture (MAP-04 interaction); #255 stacked on #239 | - | 26 Sep |
| FND-15 | #260 | deletionAuditTrail 12/12 red -> green; 2 breaks; BUG-09 overwrite caught + fixed, closing assertion watched raising | MIGRATION 20260926100600 (new deletion_log deny-all; redefines 8 DEFINER fns; delete_child_data(uuid,text)) | log retention: Rafi; break-check reports beforeAll throw as PASSED (checker defect) |
| SEC-17 | #258 | errorBodiesNoDetail.test.ts red 5/6 -> 6/6; 2 breaks exit 0 | no-migration | - |
| SEC-16 | #261 | entitlementAccessGuard 2/9 red -> 9/9; rls_regression C8a; 2 breaks exit 0 | MIGRATION 20260926100700 (is_chapter_entitled guard; DEFINER kept) | SEC-08 follow-up note on top of #243 (not fixed) |
| OPS-13+SEC-10+OPS-17 | #263 | actionsPinned.test.ts red 3/5 -> 5/5; 2 breaks exit 0 | no-migration | Rafi: allowed_actions setting + Dependabot for actions |
| TRIAL-4 | - | tsc clean; 166 files / 3977 passed; build OK; only new route /help/opengraph-image (#257) | - | fixed: #250 fixture (MAP-04), #259 floor (ARC-16), #258 stub (SEC-04) + stacked on #246; #260 stacked on #241 (BUG-09 guard overwrite) |
| SEC-11 (app half) | #262 | cspHeader 4 new red -> green; break exit 0 (3 red) | no-migration | live check: sign-in after deploy |
| PERF-05 | #264 | authLogoWeight red -> green; 2 breaks exit 0; /auth LCP 5984->5520 ms | no-migration | returning devices keep old PNG until next sw bump |
| TRIAL-5 | - | vitest EXIT 0 (checked by exit code this time); 166 files / 3977 | - | previous trials read only the Tests line: blind to unhandled errors |
| BUG-10 | #266 | errorNotConnection.test.ts red 7/9 -> 9/9; break exit 0 (5 red) | no-migration | P0C01/42501 wording = N9 |
| NEW-01 break-check | #265 | break:live 8/8 (3 new cases red before) | no-migration | beforeEach expect() gap noted |
| TRIAL-6 | - | tsc clean; vitest EXIT 0, 168 files / 3992; build OK | - | 26 Sep |

**CI (read once, 26 Sep, not polled):** every fix PR green on `verify` + `rls-tests` except: #239 (fixed — five screen-test mocks lacked `sessionUserId`; then a Google-Fonts build fetch failure, re-run), #243 (`rls-tests` image-pull rate limit, re-run → green), and the stacked PRs (#245, #255, #258, #260, #263, #266) whose CI runs only once they are retargeted to `main`. Merge order, live checks and SQL: `docs/review/ROUND2.md`.
