# Written Information Security Program

> **STATUS: DRAFT — NOT LEGAL ADVICE — MUST BE REVIEWED BY A LICENSED US ATTORNEY.**
> **Internal document.** The amended COPPA Rule requires a written children's-information security program with safeguards appropriate to the sensitivity of the information and to the operator's size, plus an annual evaluation.
> **Every control below is marked implemented, not implemented, or unverified, as measured on 22–23 September 2026.** A security program that describes a control we do not have is a false statement, and a false security claim is an FTC Act problem in its own right. Nothing here is aspirational.

**Program owner:** Rakif [PLACEHOLDER — full name, for the record] — a single named person, as the Rule expects.
**Adopted:** [PLACEHOLDER — date]
**Review:** at least annually, and after any material change to the product, the vendor set, or any security incident.

---

## 1. Scope

All personal information we hold about children, and the parent account information connected to it: the production application, the database, backups, logs, the code repository, the third-party services that process this data, and the devices of anyone who can reach production.

Today that means **26 children's records and 20 adult accounts**. At least **18 of those children are under 13** — eight in the 3–5 band, four in 6–8, six in 9–11 — and some share of the five in the 12–14 band will be twelve. COPPA therefore covers most of the children on the service, not a minority of them.

## 2. Designated responsibility

Rakif is responsible for this program: the annual risk assessment, the vendor review, incident response, and making sure the controls below are real rather than described.

## 3. Control status

| Control | State | Measured |
|---|---|---|
| Row-level security on every table holding children's data | **Implemented, partially verified.** All 32 tables have it enabled; five are deny-all by design. Driven live against production with the public key: children's tables return no rows or a permission error while a control table returns rows. The automated suite ran 74 assertions against the live commit and cannot silently skip. **But no policy has ever been deliberately broken and watched fail**, so the tests prove the policies exist, not that they would catch a regression | 22 Sep |
| Service-role key never reaches the browser | **Implemented.** All 29 deployed bundles, 4.4 MB, contain no service key, no tokens, no payment keys. Control: the public key is found where expected | 22 Sep |
| Secrets absent from version control | **Implemented.** 50,098 historical objects scanned, clean; independently re-checked by a second method across recent history, also clean. Controls fired in the thousands, so neither search was blind | 22 Sep |
| Repository secret scanning and push protection | **NOT implemented.** Both are switched off, on a public repository, where they are free. The history is clean by discipline, not by mechanism — nothing stops the next mistake | 22 Sep |
| Dependency alerts and security updates | **Partial.** Enabled, and the build gates on an audit, but **six dependency pull requests are open and untriaged, including a framework patch** | 22 Sep |
| Multi-factor authentication on every service | **Unverified, and one gap known.** Two-factor authentication is *not required* at the code-hosting organisation level. Hosting, database and payment accounts could not be inspected | 22 Sep |
| Encryption at rest | **Unverified.** The provider exposes no field confirming it. [PLACEHOLDER — obtain written confirmation from the provider and keep it as evidence] | — |
| Encryption in transit | **Implemented.** Strict transport security with a two-year policy and preload; insecure requests redirect; no insecure endpoint in application code | 22 Sep |
| Backups, and a restore actually performed | **Implemented, restore proven.** Broken 10–22 September (13 failed nights, missing secrets). Fixed 23 September: run #39 succeeded, the artifact was decrypted and restored into a throwaway local database, and all 32 public tables matched production row for row (968 rows). The decrypted copy, the local database and the temporary passphrase entry were deleted afterwards. **Not yet seen:** a *scheduled* nightly run succeeding unattended. The backup contains parents' session tokens, so its passphrase is treated as a top-tier secret. Restore needs matching auth/storage versions and the `supabase_admin` role | 23 Sep |
| Logs free of children's answers and names | **Implemented, with a nuance.** No crash record contains a child's name; events store counts, never answers. The nuance: a crash record pairs a child's internal identifier with the page they were on, which is pseudonymous data about one child | 22 Sep |
| Internal tooling kept away from production children's data | **Implemented.** Radlor Ops is a separate database project with its own logins. The admin view inside the product is read-only, aggregate-only, and enforced in the database; its allow-list is empty, so nobody can read production through it today | 22 Sep |
| Production access granted, reviewed and removed | **Partial.** One code collaborator, one hosting member. No branch protection on the main or release branches; all deployment environments have zero required reviewers; the environment the deploy refers to does not exist. **No written procedure for granting, reviewing or removing access** | 22 Sep |
| Leaked-password protection on accounts | **NOT implemented.** One toggle in the authentication settings | 22 Sep |

## 4. Development and test environments

**There is no test environment. `.env.local` points at production.** Anyone who runs the application locally in this repository is reading and writing the live database containing 26 children's records.

Automated tests do not touch production — they use a throwaway local database — but a person doing ordinary development does.

**This is the control to fix first**, and it is urgent for a specific reason: interns are testing content. The rule below cannot be honoured while the only database anyone can point at is the live one.

**Interns test on profiles they create themselves** (Rafi, 23 September 2026). That is better than testing on a real family's account, and it means no intern is reading another child's records. But those profiles are created **in the production database**, so interns are still writing to the live system, and some of the 26 child records may be test profiles rather than real children.

Two things follow. First, staging is still required — "their own profile" and "not production" are different claims, and only the second one protects anything. Second, **it is worth establishing how many of the 26 children are real**, because that is the number of families who need to be asked for consent retroactively, and it may be considerably smaller than 26. **Measured 23 September 2026:** of the 26 child records, 12 were identifiable as test profiles from the database alone — five named as tests, six on Radlor's own accounts, one sharing an account with two named tests. The remaining 14, across 7 accounts, could not be classified by any signal in the data.

**Rafi confirmed on 23 September 2026 that all of them are test profiles: the product has no customers yet, and every account belongs to the team or to an intern.** That is his statement rather than a measurement — the database cannot distinguish an intern from a parent — but he is the person who would know, and it is consistent with a product that has not launched.

**What follows from it is significant: there is no real child's data in the system, and therefore no family waiting to be asked for consent retroactively.** The retroactive-consent problem, which was the largest open item in this programme, does not exist.

**And it opens a cleaner option than grandfathering.** The consent gate was built with an exemption for the existing 26 so they would not freeze. If none of them is real, the exemption is unnecessary — the test data can be cleared and the gate applied with **zero exemptions**, so that every child in the system from that moment on has a consent record behind them. An exemption that exists for nobody is still a route around the gate; removing it entirely is stronger than documenting it. [PLACEHOLDER — decide before the migration is applied: clear the test data and drop the exemption, or keep it. If it is kept, record why, and record the date it will be removed.]

**Testers and interns.** Anyone reviewing or testing the product — including unpaid interns on academic placements — works against test accounts and seeded data only, never against real children's records. This is a condition of their access and it belongs in their placement agreement. Before a testing session begins, confirm that the environment the tester is pointed at contains no real child data. [PLACEHOLDER — name the test environment here once it exists, and record how the check is made.]

## 4a. Who may create a child profile — an unresolved question

The consent gate assumes a parent. The product also lets a **teacher** add students to a class roster, and those students arrive with no consent record, so every roster add will be refused the moment the gate is applied.

The consent flow cannot honestly serve teachers either: its button says "I'm the parent or legal guardian", and a teacher is neither. School consent under COPPA is a separate mechanism with its own conditions, and it is not built. [PLACEHOLDER — attorney: can a school consent on a parent's behalf here, and under what conditions? Until that is answered, the teacher path and the consent gate cannot both be live.]

## 5. Vendor management

Before any vendor receives, or could receive, children's personal information: record what it would get and why; confirm in writing that it acts only on our instructions; check whether the relationship is a disclosure requiring separate parental consent; **check whether its terms permit it to train models on data sent through it**, because we promise parents that never happens; add it to the Subprocessors list; re-review annually.

The current list is `07-subprocessors.md`, reviewed 22 September 2026, with the email and crash-forwarding questions settled on 23 September: Resend delivers all email as the SMTP relay behind the authentication service, and the crash-forwarding address is **not** configured in production, so no crash data leaves our infrastructure.

**Verified from the production environment on 23 September:** the service-role key is stored as a secret without a public prefix, so it is not exposed to browsers. That is the single most consequential setting in this system — a public prefix on that key would bypass every access rule at once — and it is correct.

## 6. Incident response

1. **Contain** — cut off the access route; rotate affected credentials.
2. **Assess** — what data, how many children, over what period. Record what is established and, separately, what remains unknown.
3. **Escalate** — the program owner immediately; counsel engaged.
4. **Notify** — counsel determines the obligations, which vary by state and can be strict on timing. Parents are told plainly and quickly where notification is required.
5. **Remediate and record** — fix the cause, write it down, update this program.

Report a suspected incident to support@radlor.com.

## 7. People

Anyone with production access reads this program before they get access and at least annually after; that reading is recorded in Radlor Ops alongside the annual review.

**Contractors and freelancers do not receive children's data.** Confirmed 23 September 2026: there are no contractors or freelancers with any access. The only outside people working on the product are the unpaid interns described below.

## 8. Annual evaluation

The Rule requires this program to be evaluated at least annually. The evaluation is a record of what was checked, what was found, and what changed as a result — not a statement that everything is fine.

| Date | What was reviewed | What was found | What changed | By |
|---|---|---|---|---|
| 22 Sep 2026 | First full control audit — vendors, storage, database, controls, access | Backups broken 13 nights; no consent record exists; `.env.local` points at production; secret scanning off; leaked-password protection off; crash rows survive a child's deletion | 23 Sep: backups fixed and a full restore proven against production counts. Monitoring address confirmed unset. Retroactive-consent problem dissolved (all accounts are test). [PLACEHOLDER — record the remaining fixes as they land] | Rakif |

---

### Notes for the attorney reviewing this draft

1. Please confirm this satisfies the written-program requirement, and what level of formality is expected of a company this size.
2. **The backup gap is closed.** There was no restorable backup from 10 to 22 September. It was fixed and a restore proven on 23 September. All 26 child records were test profiles, so no real child's data was at risk. Please confirm nothing further is owed.
3. Please advise on state breach-notification obligations and their timelines, so Section 6 can name them.
4. Please advise whether written agreements are required with the hosting and database providers, and whether a standard form should be used.
5. Please review Section 4 against the intern arrangement described in document 15.
