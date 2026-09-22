# Service Providers and Subprocessors

> **STATUS: DRAFT — NOT LEGAL ADVICE — MUST BE REVIEWED BY A LICENSED US ATTORNEY BEFORE PUBLICATION.**
> This list is published alongside the Privacy Policy and must match it exactly. It is also the working document for the vendor review in the Information Security Program.
> **Every row must be filled in from what the system actually does, not from what we intend.** If we are unsure whether a vendor receives children's data, the answer is "unknown" and it must be resolved before publication — not guessed.

**Last reviewed:** [PLACEHOLDER — date]
**Reviewed by:** [PLACEHOLDER — name]

---

## How to read this

A **service provider** processes data on our instructions and for no purpose of its own. Under COPPA, handing children's personal information to a third party for the third party's *own* purposes is a **disclosure**, and disclosure needs separate parental consent. The right-hand column is therefore the column that matters.

## The list

| Vendor | What it does for us | Does it receive information about a child? | If yes, what exactly | Where | Basis |
|---|---|---|---|---|---|
| [PLACEHOLDER — hosting provider] | Hosting and content delivery for the web app | [PLACEHOLDER — yes/no] | [PLACEHOLDER — e.g. IP address and request logs] | [PLACEHOLDER — US] | Service provider, integral to delivering the service |
| [PLACEHOLDER — database/backend provider] | Database, authentication, file storage | [PLACEHOLDER — yes/no] | [PLACEHOLDER — child first name, grade, learning events] | [PLACEHOLDER] | Service provider |
| [PLACEHOLDER — payment provider] | Subscription billing | [PLACEHOLDER — should be no; payments concern the parent] | [PLACEHOLDER] | [PLACEHOLDER] | Service provider, parent data only |
| [PLACEHOLDER — email provider] | Transactional email to parents | [PLACEHOLDER — no, unless a child's name appears in a progress email] | [PLACEHOLDER] | [PLACEHOLDER] | Service provider |
| [PLACEHOLDER — voice/audio provider, if any child-facing audio is generated or processed] | [PLACEHOLDER] | [PLACEHOLDER] | [PLACEHOLDER] | [PLACEHOLDER] | [PLACEHOLDER — this one needs the closest look. Pre-generated audio served to a child is not the same as a child's input being sent to a vendor.] |
| [PLACEHOLDER — analytics provider, if any] | [PLACEHOLDER] | [PLACEHOLDER] | [PLACEHOLDER] | [PLACEHOLDER] | [PLACEHOLDER — analytics on a child-directed service is the classic COPPA trap. If any analytics runs in a child's session, it must be reviewed before launch.] |
| [PLACEHOLDER — error monitoring, if any] | [PLACEHOLDER] | [PLACEHOLDER — error reports often carry identifiers and sometimes user content] | [PLACEHOLDER] | [PLACEHOLDER] | [PLACEHOLDER] |
| [PLACEHOLDER — add every other vendor] | | | | | |

## Vendors that must never receive children's data

[PLACEHOLDER — list the internal tools and any vendor deliberately kept away from production children's data, so the boundary is written down and can be checked.]

## Review checklist — run before each release that adds or changes a vendor

- [ ] Is the vendor in the table above?
- [ ] Do we know, from the code rather than from memory, exactly what is sent to it?
- [ ] Does anything about a child reach it? If yes, is that a service-provider relationship or a disclosure?
- [ ] If it is a disclosure, is separate parental consent in place?
- [ ] Is the Privacy Policy consistent with this table?
- [ ] Is there a written agreement with the vendor covering children's data?

---

### Notes for the attorney reviewing this draft

1. Please tell us which vendor relationships, once the table is filled in, count as "disclosure" requiring separate consent, and which are integral-to-the-service.
2. Please advise whether this list must be published, or whether a narrative description in the Privacy Policy is sufficient.
3. Please advise what contractual terms we need with each vendor that touches children's data.
4. Please advise on any analytics or error-monitoring tool running inside a child's session, if the engineering review finds one.
