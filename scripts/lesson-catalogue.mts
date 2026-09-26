/**
 * Writes the light lesson catalogue the child's screens load eagerly (src/features/lessons/catalogue.ts, PERF-01):
 *   npx tsx scripts/lesson-catalogue.mts > src/features/lessons/catalogue.json
 * Re-run after adding, renaming or reordering a module or topic, or changing a topic's first picture;
 * src/__tests__/lessonCatalogueSplit.test.ts fails until you do.
 */
import { MODULES } from '../src/features/lessons/modules'

const firstObj = (screens: { pictures: object[] }[]) => (screens[0]?.pictures.find(p => 'obj' in p) as { obj: string } | undefined)?.obj
const out = MODULES.map(m => ({
  id: m.id, grade: m.grade, n: m.n, title: m.title,
  lessons: m.lessons.map(l => ({ id: l.id, title: l.title, ...(firstObj(l.screens) ? { obj: firstObj(l.screens) } : {}) })),
}))
process.stdout.write(JSON.stringify(out, null, 1) + '\n')
