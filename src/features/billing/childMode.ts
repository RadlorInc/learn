/**
 * What a child's home screen is allowed to be.
 *
 * Two scenarios, and the whole rule is which one applies:
 *   · `full`      — the app as it has always been, plus any set work the teacher has unlocked.
 *   · `exercises` — nothing but the teacher's unlocked exercises. A child whose family has not
 *                   subscribed, reached through a classroom.
 *
 * ⚠️ THIS DELIBERATELY REUSES THE PAYWALL'S OWN SIGNAL RATHER THAN INVENTING A SECOND NOTION OF
 * "SUBSCRIBED". A separate `isSubscribed` lookup would be a second thing to keep true, and the two
 * would eventually disagree — at which point a paying family's child gets the stripped screen.
 * Entitlement is already computed per chapter, already tested, and already the thing that decides
 * whether a chapter opens; this asks the same question one level up.
 *
 * ⚠️ AND IT IS OFF WHILE THE PAYWALL IS OFF. `PAYWALL_ENABLED` is false today, so every child gets
 * `full` — which is correct, because nothing is gated yet. Turning the paywall on is what makes
 * this branch start doing anything, and that is one flag rather than a second migration.
 */
import { PAYWALL_ENABLED } from '@/features/billing/useChapterGate'

export type ChildMode = 'full' | 'exercises'

/**
 * @param entitledCount how many chapters this child may open. `null` means "could not find out".
 *
 * ⚠️ UNKNOWN MEANS `full`, exactly like `gateVerdict` fails open. A child locked down to a bare
 * exercise list because their wifi dropped is a far worse failure than a non-paying child seeing
 * one chapter they cannot open — and the chapter gate refuses that chapter anyway, so the
 * permissive answer here cannot hand out content.
 */
export function childMode(entitledCount: number | null | undefined): ChildMode {
  if (!PAYWALL_ENABLED) return 'full'
  if (entitledCount === null || entitledCount === undefined) return 'full'
  return entitledCount > 0 ? 'full' : 'exercises'
}
