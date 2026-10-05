# Start here — every doc in this repo, on one page

The repo has a small set of docs on purpose. If something is not here, it is either in the code, in a pull
request description, or in git history (every older doc was deleted on 28 September 2026; `git log` finds it).

## First

| doc | what it is | read it when |
|---|---|---|
| [README](../README.md) | what Radlic is, how to run it and its tests | you are new here |
| [handoff](../handoff.md) | where the work stands today and what is still open | at the start of every session |
| [CLAUDE.md](../CLAUDE.md) | the rules for anyone changing the repo, person or agent | before you change anything |
| [decisions](decisions.md) | one line per big decision: date, what, why, pull request | you wonder "why is it like this?" |
| [architecture](architecture.md) | how the system works today: the app, the database, the audio, consent, children's data | before you change how something works |

## Running production — `docs/runbooks/`

Step-by-step, and each step says whether the founder or the agent does it.

| runbook | use it to |
|---|---|
| [deploy](runbooks/deploy.md) | get a change from a pull request to the live site, and see the scheduled jobs |
| [rollback](runbooks/rollback.md) | undo a bad release (code in minutes; data only forwards) |
| [migrations](runbooks/migrations.md) | change the database: before-SQL → backup → approve → proof-SQL |
| [backup-restore](runbooks/backup-restore.md) | check last night's backup and rehearse a restore |
| [audio-upload](runbooks/audio-upload.md) | put new or re-recorded lesson voice clips into the audio bucket |
| [support](runbooks/support.md) | answer a parent who writes in, and log it |
| [data-requests](runbooks/data-requests.md) | handle a request to see or delete someone's data |
| [outages](runbooks/outages.md) | Supabase, Vercel, Resend or Stripe is down: what parents see, what to check, what to tell them |
| [incident](runbooks/incident.md) | a security incident or breach: first hour, evidence, notification questions for the attorney (draft) |
| [testers](runbooks/testers.md) | give a paid tester a link to one module and check their screen-by-screen review before paying |

## The product — `docs/product/`

| doc | what it is |
|---|---|
| [curriculum](product/curriculum.md) | every chapter (KG–2) and every module and topic (Grades 3–8). A test reads the topic lines |
| [building lessons](product/building-lessons.md) | how a Grade 3–8 module or a KG–2 chapter is written, approved, built and checked |
| [voice](product/voice.md) | the recorded lesson voice: how lines are written and rendered |
| [points](product/points.md) | how a child earns points and game time |
| [content backlog](product/content-backlog.md) | lessons and clips still to write, fix or check |

## Legal — `docs/legal/`

Drafted for a US attorney to review; none of it is legal advice. The six pages marked *live* are shown at
`radlic.com/legal/…` as beta versions, rendered straight from these files, so editing one edits the site.
Start with the [legal README](legal/README.md).

| doc | what it is |
|---|---|
| [01 Refunds and cancellation](legal/01-refund-and-cancellation-policy.md) | the refund policy — not live until billing is on |
| [02 Notice to parents](legal/02-coppa-direct-notice-to-parents.md) | the notice a parent agrees to before a child's data is kept |
| [03 Consent and checkout copy](legal/03-consent-and-checkout-screen-copy.md) | the exact words of the consent screens, the consent emails and checkout |
| [04 Data retention](legal/04-data-retention-policy.md) | how long each kind of data is kept — *live* |
| [05 Information security](legal/05-information-security-program.md) | the written security programme |
| [06 Parent rights](legal/06-parent-rights-procedure.md) | what a parent can ask for, and how we do it — *live* |
| [07 Subprocessors](legal/07-subprocessors.md) | the outside services that touch data — *live* |
| [08 Cookies and tracking](legal/08-cookie-and-tracking-notice.md) | what the app stores on a device — *live* |
| [09 Email compliance](legal/09-email-compliance.md) | the rules every email we send follows |
| [10 Review of partner drafts](legal/10-review-of-partner-drafts.md) | a gap review of earlier outside drafts |
| [11 Privacy policy](legal/11-privacy-policy.md) | the privacy policy — *live* |
| [12 Terms of service](legal/12-terms-of-service.md) | the terms — *live* |
| [13 Placeholder worksheet](legal/13-placeholder-worksheet.md) | every blank still to fill, grouped for the attorney |
| [14 Supabase check and AI content](legal/14-supabase-findings-and-ai-content.md) | two dated findings (22 September 2026) |
| [15 Content provenance](legal/15-eureka-provenance-and-interns.md) | where the lesson content came from, and who worked on it |
| [16 Audit findings](legal/16-audit-findings-and-actions.md) | a legal audit and what was done about each finding |
| `legal/es/` | Spanish drafts of 01, 04, 06, 07, 08, 11 and 12 — not yet reviewed, not shown |
| [Attorney packet](legal/ATTORNEY-PACKET.md) | the brief for the attorney: the product, the data, the questions |
| [Readiness](legal/READINESS.md) | what is left before the first real family, and before the first payment |
| [Next round](legal/NEXT-ROUND.md) | legal items the founder deferred to the next round |
| [Placeholders](legal/PLACEHOLDERS.md) | every placeholder and who resolves it — a test keeps it complete |
| [Surface](legal/SURFACE.md) | what "the legal pages are complete" means — a test reads it |
| `legal/sql/` | SQL the founder runs in the Supabase SQL editor, before and after a change (the agent never queries production) |

## Keeping this true

New docs go only into the folders above, and get a line on this page. `src/__tests__/docLinks.test.ts` fails if a
link here — or a doc path anywhere in the repo — points at a file that is not there.
