/**
 * The two lesson screens radlor.com/radlic plays as its demo, exported as JSON for radlor-site (which cannot import
 * this repo). Re-run after rewording or redrawing either screen, and commit the output there:
 *
 *   npx tsx scripts/landing-demo-snapshot.mts > ../radlor-site/content/radlic-demo.json
 *
 * A missing topic or screen exits 2 rather than writing an empty board.
 */
import { G3M5 } from '../src/features/lessons/content/g3m5'
import { G8M4 } from '../src/features/lessons/content/g8m4'
import type { Lesson } from '../src/features/lessons/script'

function demo(lessons: Lesson[], id: string, screen: number, tag: string) {
  const sc = lessons.find(l => l.id === id)?.screens[screen]
  if (!sc?.chalk || !sc.beats) { console.error(`${id} screen ${screen + 1} has no chalkboard`); process.exit(2) }
  return { id, tag, title: sc.title, label: sc.text, marks: sc.chalk, says: sc.beats.map(b => b.say) }
}

console.log(JSON.stringify([
  demo(G3M5, 'g3m5-t1', 4, 'Grade 3 · Fractions'),
  demo(G8M4, 'g8m4-t1', 3, 'Grade 8 · Geometry'),
], null, 1))
