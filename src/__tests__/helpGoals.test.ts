/**
 * Every Help walkthrough must point at something the dashboard renders. TourRunner gives up silently after ~3s when a
 * step's `data-tour` target is missing, so a walkthrough aimed at a renamed or deleted element does nothing and nobody
 * is told. This checks each target is emitted somewhere under src/ — as a literal `data-tour="x"` or a template prefix
 * (`tab-${k}` covers `tab-lessons`). It does NOT prove the element is on screen in that state (e.g. `lessons-what` on a
 * class exists only on the paid plan); that needs a signed-in drive.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { helpGoals } from '@/features/dashboard/helpGoals'

function files(dir: string): string[] {
  return readdirSync(dir).flatMap(f => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? (f === '__tests__' ? [] : files(p)) : /\.tsx$/.test(f) ? [p] : []
  })
}
const src = files(join(__dirname, '..')).map(f => readFileSync(f, 'utf8')).join('\n')
const literal = new Set([...src.matchAll(/data-tour="([^"]+)"/g)].map(m => m[1]))
const prefixes = [...src.matchAll(/data-tour=\{`([a-z-]+)\$\{/g)].map(m => m[1])
const tern = [...src.matchAll(/data-tour=\{[^}]*?'([a-z-]+)'/g)].map(m => m[1])
const rendered = (key: string) => literal.has(key) || tern.includes(key) || prefixes.some(p => key.startsWith(p))
  || (key.startsWith('nav-') && literal.has('menu'))   // nav items get data-tour from the nav list's `tour` field

const cases = [
  { who: 'parent with a child', g: helpGoals({ tea: false, paid: false, c: 'c1' }) },
  { who: 'parent, no child yet', g: helpGoals({ tea: false, paid: false }) },
  { who: 'paid teacher with a class', g: helpGoals({ tea: true, paid: true, k: 'k1' }) },
  { who: 'free teacher with a class', g: helpGoals({ tea: true, paid: false, k: 'k1' }) },
  { who: 'teacher, no class yet', g: helpGoals({ tea: true, paid: false }) },
]

describe('Help walkthroughs', () => {
  it('the probe can see a target that exists (positive control)', () => {
    expect(rendered('bell')).toBe(true)
    expect(rendered('tab-lessons')).toBe(true)
    expect(rendered('no-such-target')).toBe(false)
  })
  for (const { who, g } of cases) it(`${who}: every step points at a rendered element`, () => {
    const missing = g.flatMap(s => s.items.flatMap(i => i.tour.steps.flatMap(st => st.target.split(',')))).filter(t => !rendered(t))
    expect(missing).toEqual([])
  })
  it('covers the things adults do (written out, not derived)', () => {
    const titles = (tea: boolean) => helpGoals({ tea, paid: true, c: 'c', k: 'k' }).flatMap(s => s.items.map(i => i.t))
    expect(titles(false)).toEqual([
      'Set up a new child', 'Let my child start learning here', 'See how my child is doing', 'Change what my child learns',
      'Give homework with a due date', 'Give my child a login, or a new password', 'Set game time', 'Share with my partner',
      'Download or delete my child’s data', 'Choose which reminders I get', 'See my plan and billing', 'Close my account'])
    expect(titles(true)).toEqual([
      'Set up a new class', 'Add more students', 'Help a student who can’t sign in', 'Look at one student',
      'Choose what my class learns', 'Give my class a test', 'Find who is stuck', 'Rename or delete a class',
      'Choose which reminders I get', 'See my plan', 'Close my account'])
  })
})
