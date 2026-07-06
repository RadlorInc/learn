/**
 * Class triage — group the learners in a grade by the ONE skill each is stuck on
 * (their diagnostic root gap), so a teacher can run small-group instruction
 * ("these 8 kids all share a fractions gap"). Pure + framework-free so it's unit
 * testable, mirroring features/insights/metrics.ts.
 *
 * This is grouping by SHARED NEED, never a ranking of students against each other
 * (see docs/ux-invariants.md #26). Three bucket kinds:
 *   • a real root gap  → grouped by skill, biggest instructional group first
 *   • on-track         → checked, no gap found (celebrate; ready to move on)
 *   • no check yet     → hasn't taken the diagnostic (always shown last)
 */
import { NODE_BY_ID } from '@/core/skillGraph'
import { getChapter, type ChapterType } from '@/core/chapters'

const ONTRACK = '__ontrack__'
const NOCHECK = '__nocheck__'

export interface TriageLearner {
  learnerId: string
  name: string
  band: string | null
  rootGap: string | null   // diagnostic root-gap skill id; null = no gap found
  checked: boolean         // has a completed diagnostic session
}

export interface TriageGroup {
  key: string              // skill id, or the ONTRACK / NOCHECK sentinels
  kind: 'gap' | 'ontrack' | 'nocheck'
  label: string            // human-readable heading, e.g. "Fractions"
  skillLabel: string       // the specific skill, e.g. "Add/subtract fractions"
  emoji: string
  chapter: ChapterType | null   // the remediation chapter to focus the group on
  learners: TriageLearner[]
}

function makeGroup(key: string): TriageGroup {
  if (key === NOCHECK) {
    return { key, kind: 'nocheck', label: 'No check yet', skillLabel: '', emoji: '📝', chapter: null, learners: [] }
  }
  if (key === ONTRACK) {
    return { key, kind: 'ontrack', label: 'On track', skillLabel: 'No gap found — ready to move on', emoji: '✅', chapter: null, learners: [] }
  }
  const node = NODE_BY_ID[key]
  const chapterId = node?.chapter as ChapterType | undefined
  const meta = chapterId ? getChapter(chapterId) : undefined
  return {
    key,
    kind: 'gap',
    label: meta?.parentLabel ?? node?.label ?? key,
    skillLabel: node?.label ?? '',
    emoji: meta?.emoji ?? '🎯',
    chapter: chapterId ?? null,
    learners: [],
  }
}

const rankOf = (kind: TriageGroup['kind']): number => (kind === 'gap' ? 0 : kind === 'ontrack' ? 1 : 2)

/** Group learners by shared root gap, biggest gap-group first; on-track then
 *  not-checked always last. */
export function groupByRootGap(learners: TriageLearner[]): TriageGroup[] {
  const map = new Map<string, TriageGroup>()
  for (const l of learners) {
    const key = l.rootGap ? l.rootGap : l.checked ? ONTRACK : NOCHECK
    let g = map.get(key)
    if (!g) { g = makeGroup(key); map.set(key, g) }
    g.learners.push(l)
  }
  return [...map.values()].sort((a, b) => {
    const ra = rankOf(a.kind), rb = rankOf(b.kind)
    if (ra !== rb) return ra - rb
    if (b.learners.length !== a.learners.length) return b.learners.length - a.learners.length  // biggest group on top
    return a.label.localeCompare(b.label)
  })
}
