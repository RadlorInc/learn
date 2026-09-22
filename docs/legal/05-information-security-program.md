# Written Information Security Program

> **STATUS: DRAFT — NOT LEGAL ADVICE — MUST BE REVIEWED BY A LICENSED US ATTORNEY.**
> **Internal document.** The amended COPPA Rule requires operators to establish, implement and maintain a written children's personal information security program with safeguards appropriate to the sensitivity of the information and to the operator's size and complexity.
> **This draft describes controls as blanks, not as facts.** Every line must be marked as *implemented* or *not implemented* by Radlor before adoption. A security program that describes a control we do not have is a false statement, and a false security claim is itself an FTC Act problem.

**Program owner:** [PLACEHOLDER — a named individual. The Rule expects a designated person.]
**Adopted:** [PLACEHOLDER — date]
**Review:** at least annually, and after any material change to the product, the vendor set, or after any security incident.

---

## 1. Scope

This program covers all personal information we hold about children under 13, and the parent account information connected to it. It covers the production application, the database, backups, logs, the code repository, third-party services that process this data, and the devices of anyone who can reach production.

## 2. Designated responsibility

[PLACEHOLDER — name] is responsible for this program: for the annual risk assessment, for the vendor review, for incident response, and for making sure the controls below are real.

## 3. Risk assessment

At least annually, we identify reasonably foreseeable internal and external risks to children's information, assess the sufficiency of the safeguards in place, and record what we changed as a result.

| Risk | Current safeguard | Implemented? | Owner |
|---|---|---|---|
| Unauthorised read of children's records from the database | Row-level security; the service role key is never exposed to the browser | [PLACEHOLDER — yes/no, with the date it was last verified] | [PLACEHOLDER] |
| Secrets leaking into the code repository | Environment files excluded from version control; secret scanning | [PLACEHOLDER] | [PLACEHOLDER] |
| A dependency with a known vulnerability reaching production | Automated dependency alerts and security updates; blocking build check | [PLACEHOLDER] | [PLACEHOLDER] |
| Account takeover of a parent account | [PLACEHOLDER — describe the actual authentication controls] | [PLACEHOLDER] | [PLACEHOLDER] |
| Account takeover of an administrative account | [PLACEHOLDER — multi-factor authentication on the hosting, database, repository and payment accounts] | [PLACEHOLDER] | [PLACEHOLDER] |
| A vendor mishandling children's data | Vendor review before onboarding; written terms | [PLACEHOLDER] | [PLACEHOLDER] |
| Data loss | Automated backups, tested restore | [PLACEHOLDER] | [PLACEHOLDER] |
| Children's data reaching an internal tool that should not hold it | Separation of the review tooling from production children's data | [PLACEHOLDER] | [PLACEHOLDER] |

## 4. Minimum technical safeguards

These are the controls we commit to maintaining. Each must be verified, not assumed.

1. **Access is least-privilege.** Only people who need production access have it, access is reviewed [PLACEHOLDER — how often], and it is removed the day someone stops needing it.
2. **Administrative accounts use multi-factor authentication** on every service that can reach children's data.
3. **Secrets are never committed** to the repository and never pasted into chat, email or tickets. A secret that is exposed is rotated immediately, not later.
4. **The database enforces row-level security** so that one family cannot read another family's records. This must be tested by attempting a cross-family read and watching it fail.
5. **Data is encrypted in transit** (HTTPS everywhere) and **at rest** [PLACEHOLDER — confirm the provider's at-rest encryption and state it].
6. **Dependency vulnerabilities** are monitored automatically and critical vulnerabilities are patched within [PLACEHOLDER — number] days.
7. **Backups exist, and a restore has actually been performed** at least [PLACEHOLDER — how often]. A backup that has never been restored is not a backup.
8. **Logs do not contain children's answers or names** beyond what is necessary, and are rotated on the schedule in the Data Retention Policy.
9. **Internal tools that are not part of the product do not sit next to children's data.**

## 5. Vendor management

Before any vendor receives, or could receive, children's personal information:

- we record what data they would get and why;
- we confirm in writing that they will use it only for us and will keep it secure;
- we check whether the relationship is a "disclosure" requiring separate parental consent;
- we add them to the Subprocessors list;
- we re-review the list at least annually.

The current list is maintained in `07-subprocessors.md`.

## 6. Incident response

If we suspect that children's information has been accessed or disclosed without authorisation:

1. **Contain** — cut off the access route immediately; rotate affected credentials.
2. **Assess** — what data, how many children, over what period. Record the facts as they are established, and record what remains unknown.
3. **Escalate** — the program owner is informed immediately; counsel is engaged.
4. **Notify** — counsel determines the notification obligations, which vary by state and can be strict on timing. Parents are told plainly and quickly where notification is required.
5. **Remediate and record** — fix the cause, write it down, and update this program.

Contact for reporting a suspected incident: support@radlor.com.

## 7. People

Anyone with access to production reads this program before they get access and at least annually thereafter. [PLACEHOLDER — record how this is evidenced.] Contractors and freelancers do not receive children's data. [PLACEHOLDER — confirm this is true of every current contractor.]

**Testers and interns.** Anyone reviewing or testing the product — including unpaid interns on academic placements — works against **test accounts and seeded data only, and never against real children's records or real user accounts**. This is a condition of their access, it is written into their placement agreement, and it is verified rather than assumed: before a testing session begins, confirm that the environment the tester is pointed at contains no real child data. [PLACEHOLDER — name the test environment and record how this is checked.]

## 8. Review log

| Date | What was reviewed | What changed | By |
|---|---|---|---|
| [PLACEHOLDER] | | | |

---

### Notes for the attorney reviewing this draft

1. Please confirm this satisfies the written security program requirement under the amended COPPA Rule, and tell us what level of formality is expected of a company of this size.
2. Please advise on state data-breach notification obligations that would apply, and the timelines, so Section 6 can name them.
3. Please advise whether any written agreement is required with vendors that touch children's data, and whether a standard form should be used.
4. Please review Section 7 against the current contractor arrangements.
