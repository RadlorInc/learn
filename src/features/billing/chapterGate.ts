/**
 * The chapter gate's PURE half: the verdict, and the words a locked chapter says.
 *
 * No React, no Supabase — so the state that only exists when the paywall is ON (a child refused)
 * can be driven directly, which is the whole point. Production runs with
 * `billing_config.enforced = false`, so a test that only exercised the real world would be a
 * paywall nobody has watched refuse anything.
 */
import { getChapter } from '@/core/chapters'
import { isArChapter } from '@/core/arChapters'

/** `checking` renders nothing; `allowed` mounts the chapter; `locked` shows the card. */
export type GateVerdict = 'checking' | 'allowed' | 'locked'

/**
 * ⚠️ THE ENTRY CHECK, AND THE REASON IT TAKES A SETTLED VALUE RATHER THAN A PROMISE. The rule is
 * *at chapter ENTRY, never mid-chapter* — a child who has started finishes — and the way to make
 * that structural instead of a promise is for there to BE no later evaluation: the caller resolves
 * once per chapter id and this function is a pure reading of that one answer.
 *
 * @param learnerId  null = nobody is signed in. Source A (the demo) lives here: a pre-signup
 *                   visitor has no learner and no rows, and `/demo` limits its own two chapters.
 * @param entitled   the database's answer, or **null for "we could not find out"**.
 *
 * ⚠️ NULL IS ALLOWED, NOT LOCKED. See docs/billing-stage-3.md §2: this is a UX gate over a database
 * that already refuses the write, so a dropped connection must not cost a paying child their
 * evening. Fails OPEN — the opposite of the camera guard, for the opposite stakes.
 */
export function gateVerdict(learnerId: string | null, entitled: boolean | null | undefined): GateVerdict {
  if (!learnerId) return 'allowed'
  if (entitled === undefined) return 'checking'
  if (entitled === null) return 'allowed'
  return entitled ? 'allowed' : 'locked'
}

export interface LockCopy {
  emoji: string
  /** The chapter's own name — a lock that cannot say what it is guarding is doing no work. */
  title: string
  /** What the chapter DOES. One line, from the catalog, never written twice. */
  what: string
  /** Only for a camera chapter: the band's speciality, named rather than hidden. */
  hands: boolean
}

/**
 * ⚠️⚠️ NAME WHAT IS BEHIND THE LOCK — DO NOT SAY "LOCKED". Carried straight over from the camera
 * consent card, which taught a parent that hand-tracking exists in the same breath as refusing
 * them. **A lock that explains itself is doing work; one that just refuses is doing none.**
 *
 * ⚠️ AND IT CARRIES NO PRICE, NO NUMBER AND NO WAY TO PAY. A child is reading this. Pricing lives
 * on the parent side and nowhere else; `chapterGate.test.ts` sweeps the card's module for currency,
 * for a checkout link and for a `/parent/plan` link, with a positive control.
 */
export function lockCopy(chapterId: string): LockCopy {
  const meta = getChapter(chapterId as Parameters<typeof getChapter>[0])
  return {
    emoji: meta?.emoji ?? '🔒',
    title: meta?.name ?? 'This chapter',
    // The catalog's own one-liner. Written once, for the picker, and true here for the same reason.
    what: meta?.hint ?? 'There is more for Milo to show you in here.',
    hands: isArChapter(chapterId),
  }
}
