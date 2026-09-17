/**
 * The library's add/remove writes `learners.lesson_ids`, which decides every topic a child sees. Expected lists are
 * written out by hand, not derived from MODULES, so a change to the ordering or the null rule goes red here.
 */
import { it, expect } from 'vitest'
import { MODULES, hasModule, withModule, searchModule } from '@/features/lessons/modules'

const m = (id: string) => MODULES.find(x => x.id === id)!
const G3M4 = ['g3m4-t1', 'g3m4-t2', 'g3m4-t3', 'g3m4-t4']

it('from every topic, the first add is a list of just that module (founder, 2026-09-17)', () => {
  expect(withModule(null, m('g3m4'), true)).toEqual(G3M4)
  expect(hasModule(null, m('g5m6'))).toBe(true)
  expect(hasModule(G3M4, m('g5m6'))).toBe(false)
  expect(hasModule(G3M4, m('g3m4'))).toBe(true)
})

it('adds keep teaching order, not the order they were tapped', () => {
  const later = withModule(null, m('g5m6'), true)
  expect(withModule(later, m('g3m4'), true)).toEqual([...G3M4, 'g5m6-t1', 'g5m6-t2', 'g5m6-t3', 'g5m6-t4', 'g5m6-t5', 'g5m6-t6'])
})

it('removing keeps the rest, and removing the last module is every topic again — never an empty list', () => {
  const both = withModule(G3M4, m('g5m6'), true)
  expect(withModule(both, m('g5m6'), false)).toEqual(G3M4)
  expect(withModule(G3M4, m('g3m4'), false)).toBeNull()
  // A single topic picked in "Choose topics" counts as not having the whole module, and an add fills it in.
  expect(hasModule(['g3m4-t2'], m('g3m4'))).toBe(false)
  expect(withModule(['g3m4-t2'], m('g3m4'), true)).toEqual(G3M4)
})

it('search matches a module title or a topic title, ignoring case', () => {
  expect(searchModule(m('g3m4'), 'L-SHAPED')).toEqual({ hit: true, topics: ['An L-shaped room'] })
  expect(searchModule(m('g3m4'), 'area').hit).toBe(true)          // title "Multiplication and area"
  expect(searchModule(m('g3m4'), 'scatter')).toEqual({ hit: false, topics: [] })
  expect(searchModule(m('g3m4'), '  ').hit).toBe(true)
})
