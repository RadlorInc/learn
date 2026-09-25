/**
 * KG, GRADE 1 AND GRADE 2 ARE MODULES LIKE ANY OTHER (founder, 2026-09-25: "these three also should be listed the same
 * way the other modules are", then "add that 3 also" to the parent and teacher dashboards).
 *
 * Each story chapter is a module with one "topic" — the chapter, under the `c:` id its progress and points already use —
 * so the child's home, the Lessons tab, due dates and progress carry it with no code of their own. What must NOT happen
 * is the other direction: a story module reaching something that plays a 9-screen lesson (the lesson player, mixed
 * practice, class exercises), because its stand-in lesson has no screens.
 *
 * The expected lists are written out here on purpose: moving a chapter is a decision, so it takes an edit here too.
 */
import { describe, it, expect } from 'vitest'
import { ALL_MODULES, MODULES, GRADES, LESSON_GRADES, chosenModules, findLesson, mixedPractice, gradeName } from '@/features/lessons/modules'
import { gradeText, makeT } from '@/features/dashboard/i18n'

const story = (g: number) => ALL_MODULES.filter(m => m.grade === g).map(m => [m.id, m.title, m.lessons.map(l => l.id)])

describe('KG–2 story chapters are modules', () => {
  it('every grade an adult or a child can pick, KG first', () => {
    expect(GRADES).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
    expect(LESSON_GRADES).toEqual([3, 4, 5, 6, 7, 8])
    expect([gradeName(0), gradeName(2), gradeName(5)]).toEqual(['KG', 'Grade 2', 'Grade 5'])
    expect([gradeText(0), gradeText(3), gradeText(0, makeT('es'))]).toEqual(['KG', 'Grade 3', 'Kínder'])
  })

  it('each chapter is one module whose one topic is its c: id', () => {
    expect(story(0)).toEqual([
      ['k0m1', 'Counting', ['c:counting']], ['k0m2', 'Number Order', ['c:numberOrdering']], ['k0m3', 'Nest Tree', ['c:numberRecognition']],
      ['k0m4', 'Home Time', ['c:matchingQuantities']], ['k0m5', 'Bigger or Smaller', ['c:numberComparison']], ['k0m6', 'Shape House', ['c:shapes']],
      ['k0m7', 'Rainbow Town', ['c:colors']], ['k0m8', 'Bead Shop', ['c:patterns']], ['k0m9', 'Measuring', ['c:measurement']],
    ])
    expect(story(1)).toEqual([
      ['k1m1', 'Play Time', ['c:addition']], ['k1m2', 'Time to Go', ['c:subtraction']], ['k1m3', 'Numbers to 100', ['c:numbersTo100']],
      ['k1m4', 'Tens & Ones', ['c:placeValue']], ['k1m5', 'Story Problems', ['c:storyProblems']], ['k1m6', 'Time', ['c:time']],
      ['k1m7', 'Compare Numbers', ['c:compareNumbers']],
    ])
    expect(story(2)).toEqual([
      ['k2m1', 'Skip Counting', ['c:skipCounting']], ['k2m2', 'Multiplication', ['c:multiplication']], ['k2m3', 'Fractions', ['c:fractions']],
      ['k2m4', 'Money', ['c:money']], ['k2m5', 'Add to 100', ['c:additionTo100']], ['k2m6', 'Subtract to 100', ['c:subtractionTo100']],
      ['k2m7', 'Shapes 2D & 3D', ['c:shapes2d3d']],
    ])
  })

  it('a dashboard can resolve a chapter id to its title and grade, as it does a topic', () => {
    const f = findLesson('c:money')
    expect([f?.module.id, f?.module.grade, f?.module.story, f?.lesson.title]).toEqual(['k2m4', 2, 'money', 'Money'])
    expect(findLesson('g3m1-t1')?.module.id).toBe('g3m1')   // control: a real topic still resolves
  })

  it('a parent choosing a chapter gives the child that chapter and nothing else from its grade', () => {
    expect(chosenModules(['c:time']).map(m => m.id)).toEqual(['k1m6'])
  })

  it('never reaches anything that plays a 9-screen lesson', () => {
    expect(MODULES.some(m => m.story || m.grade < 3)).toBe(false)
    expect(MODULES.length).toBeGreaterThan(30)   // control: the lesson list is not simply empty
    for (const m of ALL_MODULES.filter(x => x.story)) expect(mixedPractice(m), m.id).toEqual([])
  })
})
