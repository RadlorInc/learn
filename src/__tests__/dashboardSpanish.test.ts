/**
 * The parent dashboard in Spanish (founder, 2026-09-22). A missing entry in `ES` falls back to English silently, and to
 * a reader who does not speak Spanish a half-translated screen looks finished — so this reads every `t('…')` in the
 * files the parent dashboard renders and fails on any string with no Spanish.
 * ⚠️ Positive control: it must FIND the strings, or an empty scan would pass. The count floor is set well under today's
 * ~340; if a refactor moves the calls somewhere this list does not read, the floor goes red rather than the test
 * quietly checking nothing.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { ES, makeT } from '@/features/dashboard/i18n'
import { childReminders } from '@/features/dashboard/reminders'
import { helpGoals } from '@/features/dashboard/helpGoals'
import { CHILD_TABS } from '@/features/dashboard/ChildPage'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ConsentLine } from '@/shared/ui/ConsentLine'

const FILES = [
  'src/app/parent/page.tsx', 'src/features/dashboard/ChildPage.tsx', 'src/features/dashboard/LessonsTab.tsx',
  'src/features/dashboard/Helpers.tsx', 'src/features/dashboard/DashNav.tsx', 'src/features/dashboard/reminders.ts',
  'src/features/dashboard/helpGoals.ts', 'src/features/lessons/Performance.tsx', 'src/shared/ui/ChildLoginSheet.tsx',
  'src/shared/ui/DataRights.tsx', 'src/app/auth/page.tsx', 'src/app/auth/set-password/page.tsx', 'src/app/auth/callback/page.tsx',
]

/** Every string literal passed to t(…), including each arm of a `t(x ? 'a' : 'b')`. */
function wrapped(): string[] {
  const out = new Set<string>()
  for (const f of FILES) {
    const src = readFileSync(f, 'utf8')
    for (const call of src.matchAll(/\bt\(([^()]*?)(?:,\s*\{|\))/g))
      for (const lit of call[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)) out.add(lit[1])
  }
  const says = readFileSync('src/shared/ui/ChildLoginSheet.tsx', 'utf8').match(/const SAYS[^]*?\n\}/)![0]
  for (const m of says.matchAll(/^\s+\w+:\s+'([^']+)',$/gm)) out.add(m[1])
  return [...out]
}

describe('parent dashboard — Spanish', () => {
  it('every wrapped string has a Spanish entry', () => {
    const keys = wrapped()
    expect(keys.length).toBeGreaterThan(250)
    expect(keys.filter(k => !(k in ES))).toEqual([])
  })

  it('the tab labels and the placeholders survive translation', () => {
    for (const [, label] of CHILD_TABS) expect(ES[label]).toBeTruthy()
    for (const [en, es] of Object.entries(ES)) {
      const holes = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort()
      expect([en, holes(es)]).toEqual([en, holes(en)])
    }
  })

  it('fills values and falls back to English', () => {
    const es = makeT('es'), en = makeT('en')
    expect(es('What {name} sees', { name: 'Ana' })).toBe('Lo que ve Ana')
    expect(en('What {name} sees', { name: 'Ana' })).toBe('What Ana sees')
    expect(es('not a key')).toBe('not a key')
  })

  it('reminders and walkthroughs come out in Spanish for a parent, and in English for a teacher', () => {
    const kid = { id: 'a', name: 'Ana', owner: true, login: undefined, gameEnabled: false, lessonIds: null, due: {}, isDone: () => false, lastProblemAt: undefined, createdAt: '2026-09-01T00:00:00Z' }
    const r = childReminders(kid, '2026-09-21', new Date('2026-09-21T12:00:00Z'), id => id, 'es')
    expect(r.map(x => x.title)).toEqual(['Ana todavía no tiene inicio de sesión', 'El tiempo de juego está desactivado para Ana'])
    expect(helpGoals({ tea: false, paid: false, c: 'a', lang: 'es' })[0].h).toBe('Primeros pasos')
    // The teacher's "Your account" walkthroughs are the SAME objects a parent gets (wrapped in t) — so only the
    // teacher gate keeps them English. The teacher-only groups are never wrapped and would prove nothing.
    const account = helpGoals({ tea: true, paid: false, k: 'k', lang: 'es' }).at(-1)!
    expect(account.items.map(i => i.t)).toEqual(['Choose which reminders I get', 'See my plan', 'Close my account'])
  })

  it('the Spanish consent line links both documents and says they are in English', () => {
    const html = renderToStaticMarkup(createElement(ConsentLine, { lang: 'es' }))
    expect([...html.matchAll(/href="([^"]+)"/g)].map(m => m[1])).toEqual(['/legal/terms', '/legal/privacy'])
    expect(html).toContain('(en inglés)')
  })
})
