import { createContext } from 'react'

/**
 * A paid tester's review (/test, docs/runbooks/testers.md). With it, a chapter waits after the intro, after every
 * answer and after every re-teach until the tester has reviewed that moment (`key`: 'intro', 'q1'…, 'r1'…, 's1'… for a
 * walk's lines), nothing is saved to a child (no learner, no standing, no score) and the 5-question take does not stop
 * the run. Null for a child, which is every real sitting.
 */
export const ChapterReviewContext = createContext<((key: string, answer: string) => Promise<void>) | null>(null)
