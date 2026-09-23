# The legal surface — what "complete" means

This is the loop's definition of done. **`src/__tests__/legalSurface.test.ts` reads the two tables
below as its EXPECTATION** and renders the app for the ACTUAL, so a row here is a claim a test holds
the product to. Edit a table and the test follows; delete a row and the test stops asking.

`state` is honest in both directions: `present` means the test must find it, `GAP` means the test
must find it MISSING (so a gap that quietly closes, or a `present` that quietly opens, both go red).
Loop state lives in [LOOP-STATE.md](LOOP-STATE.md); publishability in [READINESS.md](READINESS.md).

## Pages

One route per document, all through `src/app/legal/[slug]/page.tsx`. `publish` is the per-document
switch (item 5); every page ships dark.

| slug | route | source document | publish | state |
|---|---|---|---|---|
| privacy | /legal/privacy | 11-privacy-policy.md | dark | present |
| terms | /legal/terms | 12-terms-of-service.md | dark | present |
| refunds | /legal/refunds | 01-refund-and-cancellation-policy.md | dark | present |
| parent-rights | /legal/parent-rights | 06-parent-rights-procedure.md | dark | present |
| subprocessors | /legal/subprocessors | 07-subprocessors.md | dark | present |
| cookies | /legal/cookies | 08-cookie-and-tracking-notice.md | dark | present |
| retention | /legal/retention | 04-data-retention-policy.md | dark | present |

⚠️ **`retention` is a seventh page the brief did not list.** Document 02 (the direct notice) links
`/legal/retention` by name, so without it the notice points a parent at a 404.

## Required links

Every point where the product collects information, or takes money, enumerated from the code
(`<input>`/`<textarea>`/OAuth/sign-up call sites, 2026-09-23), not from the brief. `must link to` is
a list of page slugs from the table above. Each row is checked by **painting the real component in
jsdom and reading its hrefs**, driven to the state the collection happens in (a panel that opens on a
click is clicked first).

| id | surface | where | collects | must link to | state |
|---|---|---|---|---|---|
| home | Homepage | `/` | — (COPPA: prominent link on the home page) | privacy, terms | present |
| signup | Sign-up / sign-in | `/auth` | adult email, password, Google identity | privacy, terms | present |
| checkout | Checkout | `/parent/plan` | payment (via Stripe) | privacy, terms, refunds | GAP |
| add-child | Add a child | `AddLearnerModal` in `/parent` | child's name, avatar, grade | privacy | present |
| notice | Direct notice (consent) | `AddChildFlow` in `/parent` | — (the notice itself) | privacy, subprocessors, retention | present |
| consent-email | B1 consent request email | `renderB1` | — | privacy | present |
| withdraw-email | B3 second email | `renderB3` | — | parent-rights | present |
| account | Account / close account | `/parent/account` | adult email (re-typed to confirm) | privacy, parent-rights | GAP |
| invites | Invite another adult | `/parent/invites` | **a third party's email** | privacy | GAP |
| support | Support form | `SupportPanel` (opened) | free text from an adult, may name a child | privacy | GAP |
| child-home | The child's home | `/modules` | the child area: answers, points, game saves, feedback | privacy | GAP |
| roster | Teacher adds students | `AddStudents` in the class page | students' names and usernames | privacy | GAP |

### Found in the product and not in the brief's list

`invites` (collects someone else's email), `support` (free text), `child-home` (the only screen a
child lands on — COPPA wants a link "at each area … where personal information is collected from
children"), `roster` (a teacher typing students' names), and the two consent emails.

### Collection points covered by another row — ⚠️ an attorney question, not a decision

The lesson player (`/lesson`), practice (`/practice`), the game (`/play`) and the "Didn't get it?"
feedback sheet all collect from a child, and all are reached only through `child-home`. This manifest
treats the child-home link as covering them. **Whether one link on the child's landing page satisfies
"at each area" is for the attorney** — if not, the fix is one link in `features/lessons/Frame.tsx`,
which every one of those screens renders.

`/admin/login` collects staff credentials only and is out of scope.

## Flows

Not rendered by this test — each has its own item and its own proof.

| flow | where | item | state |
|---|---|---|---|
| Direct notice | `AddChildFlow` → `Notice` | 2 | built, copy = doc 02 v2 |
| Email-plus consent | `/api/consent/request` → B1 → `/consent/respond` → B2 → B3 | 9 | built, not wired end to end |
| Withdrawal | B3 → `/consent/withdraw` → `consent_withdraw` | 6 | stops collection; **deletes nothing** |
| Deletion (one child) | child card → Login & data → Delete *name*'s profile | 6 | exists; table coverage unproven |
| Deletion (everything) | Account → Close your account | — | exists |
| Parent data export | child card → Login & data → Download a copy | 7 | exists; table coverage unproven |
| Profile editing (name, grade) | — | 7 | **does not exist** |
