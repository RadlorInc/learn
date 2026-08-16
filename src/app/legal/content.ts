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
 *   · retention, and who can read what (the RLS model)
 *   · no behavioural advertising, no third-party trackers
 */
export const DRAFT = true

export interface LegalDoc { slug: string; title: string; updated: string; body: string }

export const PRIVACY: LegalDoc = {
  slug: 'privacy',
  title: 'Privacy Policy',
  updated: 'not yet published',
  body: `PLACEHOLDER — awaiting legal review.

Milo is used by children, so we keep the amount we store small and we do not sell or share it.

What we store: the parent's email address, the child's display name and age band, their answers to the placement check, and which chapters they have played. If you used the free check before making an account, we also store the email address you gave us there.

The camera: some chapters let a child answer by holding up their hand. That runs entirely on the device. No image or video ever leaves the browser, and nothing from the camera is stored.

Your choices: you can download a copy of everything we hold about your child, or delete it permanently, from the parent dashboard at any time.

This wording has not been reviewed by a lawyer yet and is not the final policy.`,
}

export const TERMS: LegalDoc = {
  slug: 'terms',
  title: 'Terms of Service',
  updated: 'not yet published',
  body: `PLACEHOLDER — awaiting legal review.

Milo is a maths practice app for children aged 3 to 18, used with a parent or teacher's account.

An adult creates the account and adds each child. You are responsible for the account and for supervising your child's use of it.

We do our best to keep the app available and correct, but it is provided as-is. Progress is stored on the device and synced when signed in; we cannot guarantee against data loss.

This wording has not been reviewed by a lawyer yet and is not the final terms.`,
}

export const DOCS: LegalDoc[] = [PRIVACY, TERMS]

/**
 * The one-line consent shown where an adult signs up and where the cold funnel captures an email.
 * ⚠️ It links rather than asserts: a checkbox claiming someone "agreed" to a policy they were never
 * shown is worth nothing, and an attorney will say so.
 */
export const CONSENT_LINE = 'By continuing you agree to our Terms and Privacy Policy.'
