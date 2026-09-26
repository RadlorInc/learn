# Data Retention and Deletion Policy

> **STATUS: BETA — published 25 September 2026 on the founder's decisions for the private beta; attorney review pending (each decision is recorded in ATTORNEY-PACKET.md).**
> Internal policy. The amended COPPA Rule requires a written retention policy for children's personal information, and requires the retention practice to be published in the online privacy notice.
> **Every period below is marked as either enforced by a job that has been watched working, or not enforced.** A period written here that no job enforces would be a published claim that is false, which is worse than having no policy.

**Owner:** Rakif Bobre
**Adopted:** 25 September 2026
**Review cycle:** annually, and on any material change to the product, the vendor set, or the data collected.
**Facts in this document were measured on 22 September 2026.**

---

## 1. Principle

We keep children's personal information only for as long as it is reasonably necessary to provide the service for which it was collected. We do not keep it indefinitely and we do not retain it for any secondary purpose.

## 2. Retention schedule

| Data | Where it lives | Retained for | Enforced? |
|---|---|---|---|
| Product events — session starts and similar | `learner_events` | **90 days**, rolling | **Yes.** Nightly job `purge-old-learner-events`, 03:17. Watched deleting real rows |
| Old diagnostic answers | diagnostic item tables | **90 days** | Yes. Job `prune-diagnostic-items`, 03:22. Has not yet had a row old enough to delete |
| Crash records | `error_events` | **90 days** | Yes. Job `prune-error-events`, 03:27. Not yet exercised on a real row |
| Adult email addresses captured before sign-up | `diagnostic_leads` | **24 months** | Yes. Job `prune-diagnostic-leads`, 03:32. First deletion falls due in 2028 |
| Child profile — first name, avatar, age band, grade | `learners`, `learner_access` | Until the account or the profile is deleted | **No scheduled job.** Deletion is by parent request only |
| Lesson progress, points, statistics, feedback | `lesson_progress`, `point_events`, `learner_stats`, `lesson_feedback`, `game_settings` | Until the account or the profile is deleted | **No scheduled job** |
| Parent account | `auth.users`, `profiles`, `parent_pins` | Until the account is deleted | **No scheduled job** |
| Account whose email address was never confirmed, with no child | `auth.users` (from migration `20260923180000`, a profile is created only once the address is confirmed) | **3 days** from sign-up | **Yes, once migrations `20260923180000` and `20260923180100` are applied to production.** Nightly job `prune-unconfirmed-users`, 03:37, plus a one-time sweep when applied. Tested on a local copy of the schema; not yet exercised on production |
| Sign-in events | `auth_events` | Currently kept indefinitely | **No scheduled job** |
| Cancellations of the second consent email — the email provider's id for that message, the id of the consent it belonged to, when it was due, and whether cancelling it worked. No name, no address, nothing about the child | `consent_b3_cancellations` | Currently kept indefinitely — **including after the consent record and the account are deleted**, because it is filled at the moment they are deleted so the email can still be cancelled | **No scheduled job** |
| Live sessions, including IP address and browser | `auth.sessions` | Until the session expires | Provider-managed |
| Provider request logs — IP address, browser, IP-derived city/region/country, account id | Our database provider's own platform logs | **Unknown.** The project is 20 days old and nothing has aged out, so "kept indefinitely" cannot yet be distinguished from "kept at least 20 days" | **Outside our jobs entirely** |
| Hosting request and console logs | Hosting provider | Available to us for 1 hour on our plan (Hobby), from the provider's dashboard, 24 September 2026 | Provider-managed |
| Backups | Encrypted build artifact, 30-day expiry by design | 30 days | **Working — restore proven 23 Sep 2026.** See Section 6 |
| Support correspondence with parents | Email | 12 months | Not automated |

**Consent records — `parental_consents`, built 23 September 2026.** Holds the adult, the child, the method, the timestamps, the version of each document shown, and the state. ~~It is linked to the adult account and cascades on account deletion.~~ **Since 20260926100900 (Rafi's N11, 26 September 2026, for attorney review): closing the account KEEPS the record** — a granted consent is marked withdrawn, then the row's `parent_id` is set to null (it names no account; it still holds the email address it was sent to, which is what makes it evidence). Answered records (granted → withdrawn, withdrawn, declined) are kept with no scheduled deletion; unanswered requests (pending, expired) are deleted with the account.

That is a genuine tension, not an oversight: it is what "we delete everything we hold about you" requires, and it is the opposite of what record-keeping for children's consent usually wants. Resolving it needs an anonymised consent log that survives deletion, plus a sentence in the Privacy Policy describing it — neither exists. **Decided by the founder for the beta on 24 September 2026, for attorney review:** the cascade stands until an anonymised consent log is built, and the Privacy Policy and Terms say so. **Superseded 26 September 2026 (N11): the record is kept without its account link (above); the Privacy Policy and Terms say so. How long to keep it is an attorney question (ATTORNEY-PACKET A2).**

## 3. Deletion on request

A parent may ask us to delete their child's information at any time, and may withdraw consent at any time. Either request triggers deletion under the Parent Rights procedure, ahead of the schedule above. Target: complete within 10 days of verifying the requester.

**Known defect — deletion is not yet complete.** Crash records carry a child's internal identifier with no database link back to the child, so they do not disappear when the child is deleted. Three such records already point at children who no longer exist, each holding the page they were on and their browser type. Until that link is added, "we delete your child's data" is not fully true, and a parent asking for deletion would have it honoured everywhere except here. This must be fixed before the Parent Rights page is published.

> **Resolved, 23 September 2026 (measured on production).** Crash records now carry a database link to the child that **deletes them with the child** (`error_events.learner_id` → `learners`, on delete cascade — read from the production catalog). The three orphaned records were deleted when that link was added (crash records 9 → 6), and after the test children were cleared **no crash record points at a child who no longer exists** (0 orphaned). Deleting a child from the app was proven on real rows the same day: every one of that child's rows, and the child's own login, was gone afterwards, and another child on the same account was untouched. That child happened to have no crash records, so the crash-record cascade is proven by the catalog and by the clearing of the test children, not by that one deletion.

## 4. When we keep something longer

We keep information past its scheduled deletion only where we must: to comply with a legal obligation including tax and accounting record-keeping; to establish, exercise or defend a legal claim; to resolve a dispute or enforce our agreements; or to maintain security, where a limited log is necessary. Where we do, we keep the narrowest record necessary and delete it as soon as the reason ends. Every such hold is recorded with its reason and expected end date.

## 5. Backups and the provider's own logs

Two things sit outside our deletion jobs, and both must be described honestly to parents rather than glossed:

**Backups.** Deleting a record from the live database does not remove it from a backup. Backups are designed to expire after 30 days, so a deleted record can survive in a backup for up to that long. We never restore a deleted child's record from a backup. A backup holds everything in the database, including parents' sign-in session tokens, so it is encrypted and the passphrase is held only in the password manager and the code host's secret store.

**The database provider's platform logs.** These record the IP address, browser type and an IP-derived approximate location for every request, including requests made by children's devices. They are the provider's own logs, not our tables, and none of our deletion jobs reach them. On our plan the provider makes these logs available to us for 7 days (from its dashboard, 24 September 2026).

## 6. How this is enforced

| Control | Mechanism | Evidence it works |
|---|---|---|
| Deletion of expired product events | `purge-old-learner-events`, nightly 03:17 | **Proven** — a run reported deleting real rows. 19 runs since 4 September, no failures |
| Deletion of expired diagnostic answers, crash rows, lead emails | Three further nightly jobs | Active, no failures, but none has yet had a row old enough to delete — so each is *scheduled* rather than *proven* |
| Deletion on parent request | Parent Rights procedure | The parent-request log in Radlor Ops |
| Backups | Nightly encrypted artifact | **Restore proven, 23 September 2026.** The job had failed 13 nights running (10–22 Sep, missing secrets). Secrets fixed; run #39 (manual, dump 06:48:17–06:48:50 UTC) produced an 87,248-byte encrypted artifact. It was decrypted, restored into a throwaway local database, and all **32 public tables** matched production exactly, table by table (968 rows in total) — checked against production, and separately against the row counts recorded in the dump itself. The decrypted copy was destroyed afterwards. **Still to watch:** the first *scheduled* nightly run succeeding on its own. Restoring needs auth and storage service versions matching production and the `supabase_admin` role; the restore note in `backup.yml` says so, including how to check production's versions first |
| Annual review of this policy | Owner named above | Recorded in Radlor Ops, alongside the parent-request log |

**Verification requirement.** Before any deletion job is trusted it must be watched deleting a seeded test record, and watched *not* deleting a record still in date. A job reporting "0 rows deleted" means nothing until it has first been seen deleting something.

## 7. The purge cliff — resolved, and a separate question opened

Earlier notes predicted that 520 rows, about 31% of the event history, would be destroyed on 27 September 2026. **That was wrong.** Measured: the table holds 233 rows, the oldest dates from 23 July, the first row ages out on 21 October, and the largest single night ahead removes one row. There is no cliff.

But the same measurement raised something else. The roughly 1,677 rows recorded on 5 September are gone, and the nightly jobs account for only three of them. About 1,440 rows of children's behavioural history left the database by a route that could not be reconstructed — most likely a deliberate deletion around 17 September, though there is no audit trail to prove it. **There is no record of who deleted what, or when.** **What happened, as stated by Radlor (24 September 2026):** Radlor deleted these rows deliberately on or about 17 September 2026 while clearing test accounts' old chapter and XP history; every account then was a team test account. **Audit trail on deletions:** not built. Decided on 24 September 2026 to add one before the first real family; tracked in `READINESS.md`.

No aggregate or rollup table exists, so nothing preserves the numbers once a purge runs.

---

### Notes for the attorney reviewing this draft

1. Please set the retention periods still open, in particular for sign-in events and for the child profile and progress data, which currently have no scheduled deletion at all.
2. Please advise how the database provider's own platform logs — IP, browser, approximate location, on every child request — must be described to parents.
3. Please advise on Section 3's known defect: crash records that survive a child's deletion. We intend to fix it before publishing; please say whether anything more is required. *(Fixed and measured on production, 23 September 2026 — see Section 3.)*
4. Please confirm what must appear in the public Privacy Policy under the amended Rule, and in what words.
5. Please advise whether de-identified aggregates derived from children's events may be retained indefinitely, and to what standard.
