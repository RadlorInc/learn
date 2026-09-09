import { describe, it, expect } from 'vitest'
import { makeItem, makeReadinessItem, gradeItem, type DiagItem } from '@/core/diagnosticItems'
import { SKILL_NODES, PROBE_ENTRY } from '@/core/skillGraph'

/** Every skill the probe can reach, drawn many times, under a seeded context. */
function sweep(fn: (skill: string, item: DiagItem, nonce: number) => void, draws = 60) {
  for (const n of SKILL_NODES) {
    for (let i = 0; i < draws; i++) {
      const item = makeItem(n.id, { seed: `kid${i % 7}`, nonce: i })
      if (item) fn(n.id, item, i)
    }
  }
}

describe('diagnosticItems', () => {
  it('is deterministic for the same child + attempt (seeded)', () => {
    const a = makeItem('m.exponentsRoots', { seed: 'kid', nonce: 0 })
    const b = makeItem('m.exponentsRoots', { seed: 'kid', nonce: 0 })
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  /** ⚠️ THE REGRESSION THIS FILE EXISTS FOR. Fourteen generators used `pick` from `@/core/rand`,
   *  which is Math.random — so the "stable, reproducible per-child probe" was not, and a mid-probe
   *  resume (which rebuilds the current question from the seed) served a DIFFERENT question than
   *  the child was looking at. A determinism check on ONE skill could not see it; this sweeps all. */
  it('every skill is reproducible from its seed', () => {
    const drift: string[] = []
    for (const n of SKILL_NODES) {
      for (let i = 0; i < 12; i++) {
        const a = makeItem(n.id, { seed: 'kid', nonce: i })
        const b = makeItem(n.id, { seed: 'kid', nonce: i })
        if (JSON.stringify(a) !== JSON.stringify(b)) drift.push(n.id)
      }
    }
    expect([...new Set(drift)]).toEqual([])
  })

  it('every skill in the graph can be probed (except the one non-math node)', () => {
    const noItem = SKILL_NODES.filter(n => !makeItem(n.id)).map(n => n.id)
    expect(noItem).toEqual(['e.colors'])
  })

  it('every entry skill of every band has an item — an entry with none silently auto-passes', () => {
    const blind = Object.values(PROBE_ENTRY).flat().filter(id => !makeItem(id) && !makeReadinessItem(id))
    expect(blind).toEqual([])
  })

  it('every item grades its own answer as correct', () => {
    const bad: string[] = []
    sweep((skill, item) => { if (!gradeItem(item, item.answer)) bad.push(`${skill} → ${item.answer}`) })
    expect([...new Set(bad)]).toEqual([])
  })

  it('a typed number grades numerically, so leading zeros and trailing decimals still pass', () => {
    const it7 = makeItem('e.addWithin10', { seed: 'z', nonce: 1 })!
    expect(it7.input).toBe('num')
    expect(gradeItem(it7, `0${it7.answer}`)).toBe(true)
    expect(gradeItem(it7, `${Number(it7.answer) + 1}`)).toBe(false)
  })

  /** ⚠️ chapter-craft §0b: a two-option answer surface is a coin flip. The v1 probe shipped FOUR of
   *  them and two were band ENTRIES, where a lucky pass closes the branch and the child is told
   *  they have no gap at all. Anything a child can guess at must offer at least three. */
  it('no pick item is a coin flip', () => {
    const thin: string[] = []
    sweep((skill, item) => { if (item.input === 'pick' && item.choices.length < 3) thin.push(`${skill} (${item.choices.length})`) })
    expect([...new Set(thin)]).toEqual([])
  })

  /** The pad's extra keys are a property of the QUESTION TYPE. If a draw needs a key the type does
   *  not declare, the answer is unreachable — a dead button, which chapter-craft calls the worst
   *  outcome there is. (The converse — declaring a key on every draw — is what stops the key
   *  itself leaking the answer's sign.) */
  it('a typed answer is always reachable on the keys its type declares', () => {
    const bad: string[] = []
    sweep((skill, item) => {
      if (item.input !== 'num') return
      if (!/^-?\d+(\.\d+)?$/.test(item.answer)) bad.push(`${skill}: not numeric "${item.answer}"`)
      if (item.answer.startsWith('-') && !item.keys?.neg) bad.push(`${skill}: negative but no neg key`)
      if (item.answer.includes('.') && !item.keys?.dot) bad.push(`${skill}: decimal but no dot key`)
    })
    expect([...new Set(bad)]).toEqual([])
  })

  it('a fraction answer is always two whole numbers', () => {
    const bad: string[] = []
    sweep((skill, item) => { if (item.input === 'frac' && !/^\d+\/\d+$/.test(item.answer)) bad.push(`${skill} → ${item.answer}`) })
    expect([...new Set(bad)]).toEqual([])
  })

  it('no prompt is malformed', () => {
    const bad: string[] = []
    sweep((skill, item) => { if (/undefined|NaN|\bnull\b/.test(item.prompt)) bad.push(`${skill}: ${item.prompt}`) })
    expect([...new Set(bad)]).toEqual([])
  })

  /** A pick still has to be answerable from what is on screen. */
  it('a pick always offers its own answer', () => {
    const bad: string[] = []
    sweep((skill, item) => { if (item.input === 'pick' && !item.choices.includes(item.answer)) bad.push(skill) })
    expect([...new Set(bad)]).toEqual([])
  })
})
