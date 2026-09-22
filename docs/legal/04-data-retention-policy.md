# Data Retention and Deletion Policy

> **STATUS: DRAFT — NOT LEGAL ADVICE — MUST BE REVIEWED BY A LICENSED US ATTORNEY.**
> This is an **internal** written policy. The amended COPPA Rule requires operators to maintain a written data retention policy for children's personal information, and to publish the retention practice in the online privacy notice. A short public summary drawn from this document belongs in the Privacy Policy; this full document stays internal.
> **Nothing in this policy is true until it is implemented.** Do not adopt a retention period that no job actually enforces. Every period below needs a scheduled deletion job, and that job must be watched deleting a real test record before it is believed.

**Owner:** [PLACEHOLDER — named person responsible]
**Adopted:** [PLACEHOLDER — date]
**Review cycle:** [PLACEHOLDER — e.g. annually, and on any material change to the product]

---

## 1. Principle

We keep children's personal information only for as long as it is reasonably necessary to provide the service for which it was collected. We do not keep it indefinitely, and we do not retain it for any secondary purpose.

## 2. Retention schedule

| Data | Where it lives | Retained for | Then |
|---|---|---|---|
| Child profile — first name/nickname, grade level | [PLACEHOLDER — table name] | While the account is active, plus [PLACEHOLDER — number] days after the account closes or consent is withdrawn | Hard delete |
| Learning events — answers, scores, progress, chosen topics | [PLACEHOLDER — table names] | [PLACEHOLDER — number] months rolling | Hard delete, or reduce to a non-identifying aggregate that cannot be linked back to a child |
| Parent account — name, email, billing reference | [PLACEHOLDER — table name] | While the account is active, plus [PLACEHOLDER — number] days | Hard delete, except records that must be kept under Section 4 |
| Consent records — method, timestamp, document versions | [PLACEHOLDER — table name] | [PLACEHOLDER — period advised by the attorney] | Retain as evidence of compliance, then delete |
| Payment records held by us (never card numbers) | [PLACEHOLDER — table name] | [PLACEHOLDER — period; tax and accounting rules will set a floor] | Archive per accounting policy |
| Server and application logs containing IP addresses or session identifiers | [PLACEHOLDER — where] | [PLACEHOLDER — number] days | Automatic rotation and deletion |
| Backups | [PLACEHOLDER — provider and location] | [PLACEHOLDER — number] days rolling | Automatic expiry |
| Support correspondence with parents | [PLACEHOLDER — where] | [PLACEHOLDER — number] months | Delete |

> [PLACEHOLDER — Radlor must complete this table with the real table names and real periods. A period written here that is not enforced by a job is worse than no policy, because it is a published claim that is false.]

## 3. Deletion on request

A parent may ask us to delete their child's information at any time, and may withdraw consent at any time. Either request triggers deletion under the Parent Rights procedure, which runs ahead of the schedule above. Target: complete within [PLACEHOLDER — number] days of verifying the requester.

## 4. When we keep something longer

We keep information past its scheduled deletion only where we must:

- to comply with a legal obligation, including tax and accounting record-keeping;
- to establish, exercise or defend a legal claim;
- to resolve a dispute or enforce our agreements;
- to maintain the security of the service, where a limited security log is necessary.

Where we do this, we keep the narrowest record necessary and delete it as soon as the reason ends. Any such hold must be recorded, with the reason and the expected end date.

## 5. Backups

Deleting a record from the live database does not remove it from backups immediately. Backups expire on the rolling schedule above. Where a parent asks for deletion, we delete from live systems immediately and the backup copy disappears when that backup expires. We do not restore a deleted child's record from backup.

[PLACEHOLDER — confirm this description matches how backups actually behave on the current provider, and state the maximum window between a live deletion and the last backup copy expiring.]

## 6. How this is enforced

| Control | Mechanism | Evidence it works |
|---|---|---|
| Scheduled deletion of expired learning events | [PLACEHOLDER — job name and schedule] | [PLACEHOLDER — where the run log is] |
| Deletion on parent request | Parent Rights procedure | [PLACEHOLDER — ticket log] |
| Log rotation | [PLACEHOLDER] | [PLACEHOLDER] |
| Annual review of this policy | Owner named above | [PLACEHOLDER] |

**Verification requirement:** before any deletion job is trusted, it must be watched deleting a seeded test record, and watched *not* deleting a record that is still in date. A job that reports "0 rows deleted" is only meaningful if we have first seen it delete something.

## 7. Known gap — the purge cliff

[PLACEHOLDER — Radlor should record here the current state of the historical event data and the planned rollup, so that the retention schedule above and the actual behaviour of the system do not contradict each other. A retention policy that is published while a known conflicting purge is pending is a compliance risk.]

---

### Notes for the attorney reviewing this draft

1. Please set the retention periods marked as placeholders, in particular the consent-record period.
2. Please confirm what must be summarised in the public Privacy Policy under the amended Rule, and in what words.
3. Please advise on the backup description in Section 5 — whether the "delete live now, backup expires later" model is acceptable and how it should be described to parents.
4. Please advise whether de-identified aggregates derived from children's learning events may be retained indefinitely, and what standard of de-identification applies.
