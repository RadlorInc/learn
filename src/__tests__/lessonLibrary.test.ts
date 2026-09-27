/**
 * What a child sees (`learners.lesson_ids`) — the helpers behind a child's Lessons tab and its Change panel
 * (src/features/dashboard/LessonsTab.tsx, 2026-09-21; the Lesson library that used `withModule` is gone). Expected
 * values are written out by hand, not derived from MODULES.
 */
import { it, expect } from 'vitest'
import { MODULES, hasModule, searchModule } from '@/features/lessons/modules'
import { describe as seeLine } from '@/features/dashboard/LessonsTab'

const m = (id: string) => MODULES.find(x => x.id === id)!
const G3M4 = ['g3m4-t1', 'g3m4-t2', 'g3m4-t3', 'g3m4-t4']

it('a child with no choice (null or empty) has every module; a single topic is not the whole module', () => {
  expect(hasModule(null, m('g5m6'))).toBe(true)
  expect(hasModule([], m('g5m6'))).toBe(true)
  expect(hasModule(G3M4, m('g5m6'))).toBe(false)
  expect(hasModule(G3M4, m('g3m4'))).toBe(true)
  expect(hasModule(['g3m4-t2'], m('g3m4'))).toBe(false)
})

it('the summary line says whole modules, single topics and grades — and every topic for null', () => {
  expect(seeLine(null, 'Aarav')).toBe('Aarav sees every topic in every grade.')
  expect(seeLine([], 'Aarav')).toBe('Aarav sees every topic in every grade.')
  expect(seeLine(G3M4, 'Aarav')).toBe('Aarav sees 1 whole module, from Grade 3.')
  expect(seeLine([...G3M4, 'g5m6-t1', 'g5m6-t2'], 'Maya')).toBe('Maya sees 1 whole module and 2 single topics, from Grade 3 and Grade 5.')
  expect(seeLine(['g3m4-t2'], 'Maya')).toBe('Maya sees 1 single topic, from Grade 3.')
  // A KG–2 story chapter is a whole module of its own (founder, 2026-09-25).
  expect(seeLine(['c:counting', 'c:money', 'g3m4-t2'], 'Maya')).toBe('Maya sees 2 whole modules and 1 single topic, from KG and Grade 2 and Grade 3.')
})

it('search matches a module title or a topic title, ignoring case', () => {
  expect(searchModule(m('g3m4'), 'L-SHAPED')).toEqual({ hit: true, topics: ['An L-shaped room'] })
  expect(searchModule(m('g3m4'), 'area').hit).toBe(true)          // title "Multiplication and area"
  expect(searchModule(m('g3m4'), 'scatter')).toEqual({ hit: false, topics: [] })
  expect(searchModule(m('g3m4'), '  ').hit).toBe(true)
})
