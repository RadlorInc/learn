# What the Audit Found, and What Has to Happen

**22 September 2026.** Everything here was measured, not assumed. This is the list of things that need doing, in the order they matter.

---

## The good news, because it is real and it decides a lot

**Only one outside company holds anything about a child: our own database provider.** Hosting sees a little incidentally through its logs. That is it.

- **No third-party tracking of any kind.** No analytics company, no advertising, no session recording, no beacons, no pixels. Established three ways: nothing is installed, the security policy the site serves makes it structurally impossible for the browser to reach such a host, and a real child session driven on production made 56 requests to exactly one origin — our own.
- **No child input ever reaches an AI or voice provider.** Every clip is a static file; the fallback is the browser's own speech.
- **No cookies at all.**
- **The internal review tool is genuinely separate** from children's data, with its own database and logins.
- **Secrets are not in the repository** — 50,098 historical objects scanned, then re-checked independently by a different method.

This matters beyond tidiness: **email-plus parental consent is only permitted where a child's information is not disclosed to third parties.** The audit says it is not. That consent path is available.

---

## The five things that need action

### 1. There is no record of consent. Anywhere.

Twenty adult accounts. Twenty-six children, **at least eighteen of them under 13** — the first count said twelve and was wrong, because it skipped the 9–11 band entirely. **Not one row anywhere in the system records that an adult agreed to anything, to which version, or when.** Three separate searches looked for it, with controls proving the searches worked.

This is the most serious finding in the audit, and it is not a documentation gap — it is the thing COPPA is actually about. Every document we have written describes how consent is obtained and recorded. Right now, those documents describe something the system does not do.

**What has to happen:** the consent flow in document 03 gets built, and the hard rule in it holds — no field about a child is written before a consent record exists.

> **Resolved, 23 September 2026 — and this is the best news in this document.** Rafi confirmed that **every account on the service is a test account**: the product has no customers yet, and all 26 child records belong to the team or to interns. The database could only identify 12 of them as tests on its own, so this rests on his word rather than a measurement — but he is the person who would know, and it fits a product that has not launched.
>
> **So there is no real child's data in the system, and no family waiting to be asked for consent after the fact.** The retroactive-consent problem — the largest open item in this whole programme, and the one that needed an attorney and a deadline — does not exist.
>
> It also leaves a cleaner option than the one that was built. The consent gate carries an exemption so the existing 26 would not freeze. If none of them is real, that exemption protects nobody, and an exemption that exists for nobody is still a route around the gate. **Clear the test data and apply the gate with zero exemptions**, and from that moment every single child in the system has a consent record behind them — with no special cases to remember, document, or explain later.

> **Done, 23 September 2026 (measured on production).** The consent gate went live on 14 tables with the existing children exempt; then the test children were cleared and the exemption removed. There is now **no exemption and no child without a consent record** — the database will not store one. A test parent added a child end to end afterwards (notice → email → permission → child created).

### 2. There is no backup.

The nightly encrypted backup succeeded fourteen times, then **failed every night since 10 September — thirteen consecutive failures** — because three of four required secrets are missing. Confirmed independently: zero backup artifacts exist.

**There is no restorable copy of the database holding 26 children's records.** A restore through this path has never been performed end to end even when it was working.

**What has to happen:** fix the secrets, watch a backup succeed, then **actually restore it somewhere and confirm the data is there.** A backup nobody has restored is not a backup — this is exactly the "watched it working" rule, and it is why the failure went unnoticed for thirteen nights.

> **Resolved, 23 September 2026.** Secrets fixed (the database password had to be reset — the remembered one was wrong). Run #39 succeeded. The artifact (87,248 bytes) was decrypted with the passphrase read straight from the Keychain, never printed; restored into a throwaway local database; and **all 32 public tables matched production exactly**, 968 rows, checked against production *and* against the dump's own counts. Everything decrypted was deleted afterwards.
>
> Two things this exposed: the restore instructions in `backup.yml` did not work as written (it took four attempts — the local auth and storage services must match production's versions, and the restore must run as `supabase_admin`), and the first *scheduled* nightly run has not yet been watched succeeding. Both are small. Neither changes the answer: **there is now a restorable copy of the database.**

### 3. Local development points at the live database.

`.env.local` points at production, and there is no other target — no staging database exists. Anyone running the app locally is reading and writing the live records of 26 children.

Automated tests are clean; they use a throwaway database. It is people doing ordinary work who touch production.

**This is urgent because interns are testing content.** The rule that testers never touch real children's data cannot be honoured while the only database anyone can point at is the live one.

**What has to happen:** a seeded staging database, before the next testing session.

### 4. We record product events tied to a child, and the documents must say so.

First-party event logging is live: 233 rows, the newest from yesterday, each carrying a child's internal identifier. It is not third-party and it is not advertising — but it is not nothing, and **"we collect no analytics" would have been false.** The drafts now disclose it accurately, including that it is deleted after 90 days.

Separately, the database provider's own platform logs record **IP address, browser, and an IP-derived city, region and country for every single request** a child's device makes. That is more than our own tables hold, and none of our deletion jobs reach it. It is now disclosed.

**What has to happen:** nothing to fix — but establish the provider's retention period for those logs, because the Privacy Policy has to state it.

### 5. Deleting a child does not delete everything.

Crash records carry a child's identifier with no database link back to the child, so they do not disappear when the child is deleted. **Three such orphans already exist**, each holding the page a now-deleted child was on and their browser type.

> **Resolved, 23 September 2026 (measured on production).** Crash records now carry a database link to the child that **deletes them with the child** (`error_events.learner_id` → `learners`, on delete cascade — read from the production catalog). The three orphaned records were deleted when that link was added (crash records 9 → 6), and after the test children were cleared **no crash record points at a child who no longer exists** (0 orphaned). Deleting a child from the app was proven on real rows the same day: every one of that child's rows, and the child's own login, was gone afterwards, and another child on the same account was untouched. That child happened to have no crash records, so the crash-record cascade is proven by the catalog and by the clearing of the test children, not by that one deletion.

**What has to happen:** add the link so it cascades. Until then, the Parent Rights procedure deletes them by hand — and the Parent Rights page must not be published claiming complete deletion while a route exists that does not delete.

---

## Smaller, and cheap

| | |
|---|---|
| Repository secret scanning and push protection are **off**, on a public repository, where they are free | Two toggles |
| Leaked-password protection is **off** | One toggle |
| Six dependency updates open and untriaged, including a framework patch | An afternoon |
| Two-factor authentication is not required at the code-hosting organisation | One setting |
| No branch protection on the main or release branches; every deployment environment has zero required reviewers | One setting each |
| `MONITORING_INGEST_URL` — if set, every crash record including a child's identifier is posted to that address. **Nobody knows whether it is set.** | Thirty seconds in the hosting dashboard, and it has to be done before the vendor list is published |
| The checkout screen still advertises the deleted placement check to signed-in parents | Already fixed on the unpushed branch |
| Three dead copies of that claim sit behind a feature flag — flipping it resurrects them | Your call |

---

## Two things that turned out better than the documents said

**The purge cliff does not exist.** The prediction of 520 rows lost on 27 September was wrong: the table holds 233 rows, the first ages out on 21 October, and the worst night ahead removes one row.

**But** the ~1,677 rows recorded on 5 September are gone, and the nightly jobs account for three of them. About **1,440 rows of children's behavioural history left the database by a route nobody can reconstruct** — probably a deliberate deletion around 17 September, but there is no audit trail to prove it. Worth knowing: today, if anyone asked what happened to children's data, the honest answer would be that we cannot say.

---

## Spanish

393 strings are translated — the parent dashboard, sign-in, the child login sheet. **Not translated:** the account page, the plan page, invitations, the entire child-facing lesson interface, the landing page, help, and **both legal pages**.

No Spanish speaker has reviewed any of it. The change that shipped it says so outright and has zero reviews, and the only check tests completeness, not correctness.

This matters for consent specifically: **a parent's consent is only meaningful if they can read what they are agreeing to.** The Spanish consent line is at least honest — it says the policy is in English — but every parent-facing legal document will need a Spanish version, reviewed by a person. That is a real cost, not a formality, and it is not yet scheduled.

---

## What the first build pass added, 23 September

Four corrections and one design finding came back before a line of code was written. They are recorded here because three of them were errors in this document.

1. **The under-13 count was wrong.** This document said twelve; the real figure is **at least eighteen** of twenty-six. The first count read the 3–5 and 6–8 bands and skipped 9–11 entirely — six children. COPPA covers most of the service's children, not a minority. Corrected here and in the Security Program.

2. **The email provider does not exist.** This document and the vendor list both named Resend as the transactional email provider. **It is not installed, has no key, and appears nowhere in the code.** Every email a parent receives today comes from the authentication service's own mailer. The name came from a conversation and was written down as a fact without being checked against the code — exactly the failure the rest of this document is built to avoid. Corrected in documents 07 and 09, and it is now a decision to make rather than a fact to state.

> **Superseded, 23 September 2026.** The consent emails are now sent through Resend, from `noreply@radlor.com`: the first request email arrived that day, and each delayed confirmation email is scheduled with Resend and its identifier stored with the consent record.

3. **The consent gate cannot be a row-level security policy.** The tables are owned by the database role itself and do not force row security, and the functions that write most of a child's data run as definer — so a policy-based gate would be bypassed by precisely the code paths that write the data, while looking correct in the migration. It has to be enforced by triggers, which fire regardless. The schema already has a working example of this pattern. This is a good catch: the wrong choice here would have produced a gate that passed review and enforced nothing.

4. **A blocked write would fail silently.** The event-writing code treats any database error as temporary and keeps the row queued for a later retry. If the gate blocked a child's writes, nothing would error and nothing would surface — a parent would watch their child use the app normally while no progress was saved. Whatever is decided about the existing children, the failure has to be made visible before the gate goes live.

5. **The existing children would freeze, not break.** Reads are unaffected, so all twenty-six keep signing in and keep seeing past progress; every write about them fails. There are 35 progress rows and 281 point records in production, so this is live activity. Combined with point 4, the result would be invisible data loss rather than an error anyone notices.

**The decision that follows from 5, and it is not an engineering one:** those eighteen-plus children have no consent record and cannot acquire one retroactively — you cannot backdate a notice a parent was never shown. The practical path is to send the direct notice to the existing parents, ask them to consent now, and set a date after which a profile without consent stops collecting. How long that window is, and what happens at the end of it, is a question for the attorney.

> **Moot as of 23 September 2026.** Every one of those children was a team or intern test profile (founder's statement), and all of them have been cleared. No child without a consent record remains, so there is nobody to ask retroactively.

---

## Where the documents now stand

**73 placeholders left**, down from 280.

| Who | How many | What |
|---|---|---|
| Attorney | ~8 | Arbitration, DMCA agent, liability floor, AI-content wording, consent-record retention, the email-plus delay, which document controls |
| Provider confirmations | ~6 | Encryption at rest in writing, hosting region, log retention periods, payment fields |
| Rafi | 2 | Monthly and annual price |
| Rakif | 1 | Full name for the record |
| At publication | ~14 | Every effective and last-updated date |
| Blocked on something being built | ~5 | The in-app cancel path, the profile-edit path, the test environment, the consent record |

The rest are gone.
