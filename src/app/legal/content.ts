/**
 * THE LEGAL COPY LIVES HERE, IN ONE FILE, ON PURPOSE.
 *
 * ⚠️ EVERY `body` BELOW IS A PLACEHOLDER AND IS MARKED AS ONE ON SCREEN. The pages, the routing,
 * the links from signup and the lead-capture consent line are all built and wired — so when the
 * attorney's text arrives it is a PASTE into this file, not a build. That is the whole point: the
 * legal review (blocker B1) is the longest-lead item in the launch plan, and nothing else should
 * have to wait behind it.
 *
 * ⚠️ AND THE PLACEHOLDER MUST NEVER SHIP SILENTLY. `DRAFT` is true until a human sets it false, and
 * while it is true every page renders a loud banner saying the text is not final. A launch gate
 * asserts that `DRAFT === false` before these can be considered done — a fake privacy policy that
 * LOOKS real is worse than no page at all, because a parent would believe it.
 *
 * What the attorney needs to cover (from launch-plan.md §1.2), so the brief writes itself:
 *   · what is collected: parent email, child display name + age band, diagnostic answers,
 *     chapter progress/sessions, and (for the cold funnel) a lead email
 *   · that hand-tracking runs ON DEVICE and no camera frame ever leaves the browser
 *   · verifiable parental consent — the parent creates the learner, which is the consent vector
 *   · the parent's right to see and delete (both now live at /parent — see DataRights)
 *   · retention, and who can read what (the RLS model) — note the deliberate split: the placement
 *     check's RAW ANSWERS are analytics and prune at 90 days, while the PLAN derived from them is
 *     progress and is kept until the parent deletes the profile
 *   · no behavioural advertising, no third-party trackers
 */
export const DRAFT = true

export interface LegalDoc { slug: string; title: string; updated: string; body: string }

export const PRIVACY: LegalDoc = {
  slug: 'privacy',
  title: 'Privacy Policy',
  updated: 'not yet published',
  body: `PLACEHOLDER — awaiting legal review.

AdaptiveLearn is used by children, so we keep the amount we store small and we do not sell or share it.

What we store: the parent's email address, the child's display name and age band, their answers to the placement check, and which chapters they have played. If you used the free check before making an account, we also store the email address you gave us there. We do not store a child's date of birth, only their age band.

The camera: some chapters let a child answer by holding up their hand. That runs entirely on the device. No image or video ever leaves the browser, and nothing from the camera is stored. To make that work, your browser downloads a hand-tracking model the first time you use one of those chapters. That download comes from Google (storage.googleapis.com) and jsDelivr (cdn.jsdelivr.net), who will see your device's IP address as they would for any file you download. They receive nothing about your child and nothing from the camera.

Who else sees the data: Supabase hosts our database and Vercel serves the site, both as processors acting on our instructions. We do not sell or share your child's data, and there is no advertising or behavioural tracking anywhere in the app.

How long we keep it: your child's profile and progress are kept until you delete them, and that includes the learning plan the placement check produces. Their individual answers to the placement check are deleted automatically after 90 days, as are gameplay analytics and crash reports — we keep what the check concluded, not every answer they gave. An email given to the free check before an account exists is kept for up to 24 months.

Your choices: you can download a copy of everything we hold about your child — their profile, progress, sessions, placement checks and learning plans, and the activity log — or delete it permanently, from the parent dashboard at any time. Deleting a child's profile removes their progress, sessions, placement results and analytics. If you gave us an email for the free check and never made an account, write to us and we will delete it.

This wording has not been reviewed by a lawyer yet and is not the final policy.`,
}

export const TERMS: LegalDoc = {
  slug: 'terms',
  title: 'Terms of Service',
  /**
   * ⚠️ THE DOCUMENT'S OWN "Last updated" LINE, LIFTED OUT OF THE BODY — the page header renders it,
   * so leaving it in the body too printed it twice on one screen. `legalDocs.test.ts` asserts this
   * field equals the source document's own date line, so the two cannot drift.
   *
   * ⚠️ THIS WAS `[DATE]` UNTIL 2026-09-06 AND IT IS NOT A TIDY-UP. The founder set the date; that
   * is a decision they were entitled to make and `[DATE]` only ever marked "nobody has decided".
   * THE DOCUMENT IS STILL A DRAFT — `DRAFT` is true, the banner is up, and four markers are still
   * open (§3's and §15's [NN] windows, §15's [URL], §8's unwritten refund sentence, and nine
   * [LAWYER REVIEW] notes). A date is not a review. See `OPEN` in the gate, which is where a
   * resolved marker has to be recorded by hand so one can never go quiet on its own.
   */
  updated: '6 September 2026',
  /**
   * ⚠️ VERBATIM from `docs/app-terms-of-service.md`, minus exactly two things, both structural and
   * both rendered elsewhere on the same page: its markdown H1 (the page draws its own <h1> from
   * `title`) and the "Last updated" line above. Nothing else is edited — not the [LAWYER REVIEW]
   * markers, not the [NN] response windows, not the [URL], not the unwritten refund sentence in §8.
   * Every one of those marks a decision that is not a developer's to make.
   *
   * It is markdown, and the page renders it as markdown — see `renderDoc` in [slug]/page.tsx.
   */
  body: `---

## 1. Who this agreement is between

These Terms of Service ("Terms") are an agreement between you and **Radlor Inc.**,
a Delaware corporation ("Radlor", "we", "us", "our"), covering your use of the
Milo learning application at adaptivelearn.radlor.com and any related apps or
features (the "Service").

By creating an account or using the Service, you agree to these Terms and to our
Privacy Policy, which is part of this agreement. **If you do not agree, do not
create an account and do not use the Service.**

## 2. Who may use the Service

**Only adults create accounts.** You must be at least 18 years old and legally
able to enter a contract to create an account.

**Children use the Service only through a profile created by their parent or
legal guardian.** Children do not have their own accounts, do not sign in, and
are not asked for an email address or password. Every child profile sits inside
an adult account, and the adult who created it is responsible for it.

If you create a profile for a child, you confirm that:

- you are that child's parent or legal guardian, or you have that person's
  permission;
- you consent to us collecting and using the child's information as described in
  Section 6 and in our Privacy Policy; and
- you will supervise the child's use of the Service as you think appropriate for
  their age.

**You may not create an account on behalf of a child, and you may not let a
child create one.** If we learn an account was created by someone under 18, we
may close it.

## 3. Children's information and your consent **[LAWYER REVIEW]**

The Service is designed for children, so this section governs where it conflicts
with anything else in these Terms.

**What a child never gives us.** A child is never asked for an email address, a
phone number, a home address, a date of birth, a photograph, a voice recording,
or free-text they can type. There is no chat, no messaging, no profile
description, and no way for a child to publish anything or contact another user.

**What you tell us about a child.** When you create a child profile you provide:

- a **display name** — this can be a nickname or a first name, and we recommend a
  nickname. It is shown only to you and to anyone you invite to that profile.
- an **age band** — one of 3–5, 6–8, 9–11, 12–14, 15–16, 17–18. **We do not
  collect a date of birth**, only the band.
- an **avatar** chosen from a small fixed set of pictures.
- optionally, a **grade or class name** you type yourself.

**What the Service records as the child uses it.** See Section 6.

**Your rights as a parent.** At any time you may:

- **review** everything we hold about your child's profile;
- **export** it;
- **delete** the profile, which deletes the learning records tied to it; and
- **withdraw your consent**, which means we stop collecting new information for
  that child. Withdrawing consent means the profile can no longer be used.

To do any of these, use the controls in your account or write to
**support@radlor.com**. We will act on a verified request within **[NN] days**.
**[LAWYER REVIEW — the response window, and what counts as verifying that the
requester is the parent.]**

**We do not use children's information to train artificial-intelligence models,**
our own or anyone else's, and we do not sell or rent children's information to
anyone. We do not show advertising in the Service and we do not allow third-party
advertising networks to collect information through it.

**[LAWYER REVIEW — this section is written to the shape of the US Children's
Online Privacy Protection Act (COPPA). Whether the parental-consent method used
at signup is "verifiable" under COPPA, and whether any state student-privacy law
applies, are legal determinations. They have not been made.]**

## 4. What the Service is — and what it is not

Milo is an adaptive learning application. It presents mathematics chapters, asks
questions, adjusts difficulty from the answers, and can run a short placement
check to suggest where a learner should start.

**The Service is an educational support tool only.** It is not a school, not a
tutor, not a diagnosis, and not a substitute for teaching, professional tutoring,
special-education services, or any medical or psychological assessment.

**"Placement check", "gap" and "working level" are product features, not
findings about a child.** They describe how a child answered a set of questions
on one occasion. They are not an assessment of ability, intelligence, or any
learning difficulty, and must not be relied on as one. If you have concerns about
a child's learning, speak to a teacher or a qualified professional.

Learning outcomes vary. **We do not promise any particular result** — no grade
improvement, no mastery, no progress in any period of time.

## 5. Your account

You are responsible for your login details and for what happens under your
account. Tell us promptly at support@radlor.com if you think someone else has
access to it.

You may invite another parent or guardian to a child's profile. Anyone you invite
can see that child's learning records. **Invite only people you intend to have
that access**, and remove them when they should no longer have it.

Give us accurate information and keep it current.

## 6. What the Service records, and for how long

We are specific here rather than general, because you should be able to check
this against what you see in the app.

**For the adult account holder:** your email address, how you sign in (email and
password, or Google), a display name and avatar you choose, and a record of when
your account was created and when you sign in.

**For each child profile:** display name, age band, avatar, and any grade name
you typed.

**As a child uses the Service, per child profile:**

- each completed practice run: which chapter, how many answers were right and
  wrong, stars and points earned, and when it started and finished;
- cumulative progress per chapter: best stars, total points, number of sessions,
  the difficulty tier reached, when it was last played;
- totals per child: points, coins, level, when last played;
- placement checks: which questions were asked, whether each was answered
  correctly, and the resulting suggested starting point and practice plan;
- in-app items bought with earned coins;
- **usage events** — that the app was opened, that a chapter was opened, that a
  practice run finished, and similar. These carry no free text and no
  identifying information beyond the profile they belong to.

**Retention.** Usage events are **deleted automatically after 90 days.** Learning
records — sessions, progress, placement results — are kept while the profile
exists, and are deleted when you delete the profile or your account.
**[LAWYER REVIEW — confirm this matches the Privacy Policy exactly. The two must
not disagree.]**

**Error reports.** When something goes wrong, the app may send us a technical
report containing the error message, the page it happened on, and your browser
type, so we can fix it. These are used only to diagnose faults.

**Payments.** If you subscribe, payment is handled by **Stripe**. We do not
receive or store your card number. We store your subscription status, how many
seats you have paid for, and the current billing period.

**Where your data is held.** On servers in the **United States**, operated by our
hosting and database providers. **[LAWYER REVIEW — if the Service is offered to
users outside the US, international transfer terms are needed here.]**

Our Privacy Policy has the full account, including who processes data on our
behalf. Where these Terms and the Privacy Policy differ about personal
information, **the Privacy Policy governs**.

## 7. Acceptable use

You agree not to:

- use the Service unlawfully, or let anyone else do so through your account;
- copy, scrape, reverse-engineer, or attempt to extract the Service's content,
  questions, or underlying models;
- share your login details, or sell or transfer your account;
- interfere with the Service, probe it for vulnerabilities, or work around any
  limit or access control;
- use the Service to make misleading claims about children's learning or about
  what the Service can do.

If you find a security problem, please tell us at support@radlor.com rather than
exploiting it. We will not pursue anyone who reports a genuine issue in good
faith and does not access other people's data.

We may suspend or close an account that breaks these rules.

## 8. Subscriptions, payment and cancellation

Some chapters require a paid subscription. Price, billing period and the number
of child seats included are shown before you pay.

**Automatic renewal.** A subscription renews automatically at the end of each
billing period at the then-current price, until you cancel. **You may cancel at
any time from your account settings.** Cancelling stops the next renewal; your
subscription stays active until the end of the period you have already paid for.

**Price changes** apply from your next renewal, and we will tell you in advance.

**Refunds.** [Describe the refund position in one plain sentence, or link the
Refund Policy here. **Do not publish with a placeholder.**] Nothing here limits
any refund right you have by law.

Taxes are yours where applicable.

**[LAWYER REVIEW — US automatic-renewal rules, including California's, require
specific pre-purchase disclosures, an acknowledgment, and a cancellation path at
least as easy as signing up. Confirm the checkout flow meets them.]**

## 9. Content and ownership

The Service, including its software, question banks, chapter content, artwork,
audio and the Milo and Radlor names and logos, belongs to Radlor or its
licensors. You get a personal, non-transferable, revocable licence to use it for
your family's own non-commercial learning. Nothing more is granted.

**What you and your child create.** Answers, progress and anything you type
(such as a display name or grade) remain yours. You give us permission to store
and process that material **for the purpose of operating the Service for you** —
recording progress, adapting difficulty, showing your dashboard, and supporting
your account.

**We do not use children's information to train AI models.** We may use
information that has been aggregated so that it cannot identify any person — for
example "how many learners finished this chapter" — to understand how the Service
is used and to improve it.

## 10. Adaptive and automated features

The Service adapts what it shows based on how a learner answers. It is automated
and it can be wrong: it may pick the wrong difficulty, suggest the wrong starting
point, or mis-judge what a learner knows.

You acknowledge that:

- what the Service shows is a suggestion, not a professional judgement;
- important decisions about a child's education should not be based on it alone;
- we are not responsible for decisions taken on the basis of its output.

## 11. Ending your use

**You** may stop using the Service and delete your account at any time from your
account settings. Deleting your account deletes your child profiles and their
learning records.

**We** may suspend or close your account if you break these Terms, if we are
required to by law, or if we stop offering the Service. Except where you have
broken these Terms or the law, **if we close a paid account we will refund the
unused part of the period you have paid for.**

We will give reasonable notice before withdrawing the Service, and a way to
export your data, unless we cannot for legal or safety reasons.

Sections 9, 12, 13, 14 and 16 survive termination.

## 12. Disclaimer

THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE". TO THE FULLEST EXTENT
PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE AND NON-INFRINGEMENT. WE
DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED OR ERROR-FREE, OR THAT IT
WILL MEET ANY LEARNING GOAL.

Some jurisdictions do not allow these exclusions, in which case they apply to you
only as far as the law allows.

## 13. Limitation of liability

TO THE FULLEST EXTENT PERMITTED BY LAW, RADLOR AND ITS OFFICERS, DIRECTORS,
EMPLOYEES AND AGENTS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
CONSEQUENTIAL OR PUNITIVE DAMAGES, OR FOR LOST PROFITS, DATA OR GOODWILL, ARISING
FROM OR RELATED TO THE SERVICE.

OUR TOTAL LIABILITY FOR ANY CLAIM WILL NOT EXCEED THE GREATER OF (A) WHAT YOU
PAID US IN THE TWELVE MONTHS BEFORE THE CLAIM, OR (B) USD 100.

**Nothing in these Terms limits liability that cannot be limited by law**,
including for fraud, or for death or personal injury caused by negligence.

## 14. Indemnity

You agree to cover our reasonable losses, including legal fees, arising from your
misuse of the Service, your breach of these Terms, or your breach of anyone
else's rights. This does not apply to anything caused by us.

## 15. Changes to these Terms

We may update these Terms. If a change materially affects your rights, we will
tell you by email or in the app **at least [NN] days before it takes effect**,
and you may close your account before then if you do not accept it. Minor
changes take effect when posted, with the "Last updated" date changed.

We keep previous versions available at [URL]. **[LAWYER REVIEW — for a paid
service, silent acceptance by continued use is not always enough. Confirm the
notice period and mechanism.]**

## 16. Governing law and disputes **[LAWYER REVIEW]**

These Terms are governed by the laws of the State of Delaware, without regard to
its conflict-of-laws rules.

If something goes wrong, please contact us first at support@radlor.com — most
things are resolved that way. If we cannot resolve it, disputes will be brought
in the state or federal courts of Delaware.

**Nothing here removes any right you have under the consumer-protection law of
the place where you live, including the right to bring a claim in your local
courts where the law gives you that right.**

**[LAWYER REVIEW — whether to include an arbitration agreement and class-action
waiver, and whether a Delaware forum clause is enforceable against consumers in
other states, are decisions for counsel. Neither has been made here.]**

## 17. General

If any part of these Terms is unenforceable, the rest continues to apply. Our not
enforcing a right is not a waiver of it. You may not transfer your rights under
these Terms; we may transfer ours as part of a sale or reorganisation of the
business, on notice to you.

These Terms and the Privacy Policy are the entire agreement between us about the
Service.

## 18. Contact

**Radlor Inc.**
254 Chapman Rd, Ste 208 #28608
Newark, DE 19702
United States

**support@radlor.com**`,
}

export const DOCS: LegalDoc[] = [PRIVACY, TERMS]

/**
 * The one-line consent shown where an adult signs up and where the cold funnel captures an email.
 * ⚠️ It links rather than asserts: a checkbox claiming someone "agreed" to a policy they were never
 * shown is worth nothing, and an attorney will say so.
 */
export const CONSENT_LINE = 'By continuing you agree to our Terms and Privacy Policy.'

/**
 * ⚠️ THE MARKS OF A DECISION NOBODY HAS MADE. Each one is a hole a human has to fill: a date, a
 * response window, a versions URL, a refund position, and the ten places an attorney has to look.
 * They are rendered ON SCREEN rather than tidied away, because a placeholder you can see is a
 * draft and a placeholder you have quietly resolved is a false statement to a parent.
 *
 * `'[LAWYER REVIEW'` has no closing bracket on purpose — those markers carry their reason inside
 * the brackets (`[LAWYER REVIEW — …]`), so the prefix is the only stable part.
 */
export const PLACEHOLDERS = ['[LAWYER REVIEW', '[DATE]', '[NN]', '[URL]', '[Describe the refund'] as const

export function unresolvedPlaceholders(doc: LegalDoc): string[] {
  const hay = `${doc.title}\n${doc.updated}\n${doc.body}`
  return PLACEHOLDERS.filter(p => hay.includes(p))
}

/**
 * ⚠️ A DRAFT MAY NEVER RENDER AS LIVE, AND THIS IS THE THING THAT ENFORCES IT — not a note, not a
 * checklist. It runs at module scope, so it fires in `next build` (both legal pages are statically
 * generated, so this file is imported during the build), in `next dev`, and in every test that
 * touches these documents. Flipping `DRAFT` to false with a hole still in the text stops the build
 * rather than shipping a document that looks finished and is not.
 *
 * Watched fail: `DRAFT = false` with the placeholders present → the build and the suite both die
 * here naming the document and the marker. Watched pass: with `DRAFT = true` it is inert, which is
 * today's state and the state every existing test runs in.
 */
export function draftGuardError(draft: boolean, docs: LegalDoc[]): string | null {
  if (draft) return null
  const holes = docs.flatMap(d => unresolvedPlaceholders(d).map(p => `${d.slug}: ${p}`))
  if (!holes.length) return null
  return (
    'A legal document is marked FINAL (DRAFT = false) but still contains unresolved placeholders, ' +
    `so the draft banner is gone while the holes are not:\n  ${holes.join('\n  ')}\n` +
    'Resolve them with the attorney, or set DRAFT = true. Do not delete the markers.'
  )
}

const GUARD = draftGuardError(DRAFT, DOCS)
if (GUARD) throw new Error(GUARD)
