/**
 * No example a child sees or hears names something haram (founder, 2026-10-06): no pig, pork or ham, no dog or
 * puppy, no hot dog or hamburger, no alcohol, no gambling. Replace it with a neutral thing (pencils, melons,
 * rabbits, juice boxes). The rule is in docs/product/building-lessons.md ("Words").
 *
 * It reads VALUES, not source files: every Grade 3–8 lesson as data (screens, beats, chalk writes, problems,
 * hints, Screen 9), 60 sampled problems from every ladder level, every line a KG–2 chapter speaks (the chapter
 * voice corpus), and the file names of every picture in public/assets.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { MODULES } from '@/features/lessons/modules'
import { LADDERS } from '@/features/lessons/ladders'
import { rng } from '@/features/lessons/adaptive'

// Written out by hand. Whole words only, so "hamster", "between" and "dogwood" are not caught by accident.
const BANNED = [
  'pig', 'pigs', 'piglet', 'piglets', 'pork', 'bacon', 'ham', 'hams', 'hamburger', 'hamburgers', 'hot dog', 'hot dogs',
  'hotdog', 'hotdogs', 'sausage', 'sausages', 'pepperoni', 'salami', 'lard', 'swine', 'boar',
  'dog', 'dogs', 'puppy', 'puppies',
  'wine', 'beer', 'beers', 'alcohol', 'liquor', 'whiskey', 'whisky', 'vodka', 'rum', 'champagne', 'cocktail', 'cocktails',
  'casino', 'lottery', 'gamble', 'gambling', 'betting', 'poker',
]
const pattern = new RegExp(`(^|[^a-z])(${BANNED.map(w => w.replace(' ', '[ _-]?')).join('|')})(?![a-z])`, 'i')
const hits = (where: string, text: string) => {
  const m = text.match(pattern)
  return m ? [`${where}: "${m[2]}" in …${text.slice(Math.max(0, (m.index ?? 0) - 30), (m.index ?? 0) + 40)}…`] : []
}

describe('no haram things in examples', () => {
  it('the word list catches what it is for, and nothing like it that is fine', () => {
    for (const bad of ['A puppy weighs 9 pounds.', 'Hot dogs come in packs of 6.', 'a Ham sandwich', '/assets/objects/dog_side.png', 'Pork chops'])
      expect(hits('control', bad), bad).toHaveLength(1)
    for (const fine of ['A hamster runs.', 'Count between 4 and 8.', 'A hotel has 6 floors.', 'Pencils and erasers', 'a rumble'])
      expect(hits('control', fine), fine).toEqual([])
  })

  it('Grade 3–8 lessons say none of them', () => {
    const lessons = MODULES.flatMap(m => m.lessons)
    const all = lessons.map(l => JSON.stringify(l))
    // Looked, not "found nothing": the lessons are really there, and the scan sees words a lesson really uses.
    expect(lessons.length).toBeGreaterThan(250)
    expect(all.join(' ')).toMatch(/pencils/i)
    expect(lessons.flatMap((l, i) => hits(l.id, all[i]))).toEqual([])
  })

  it('no ladder level makes one', () => {
    const found: string[] = []
    let n = 0
    for (const [id, levels] of Object.entries(LADDERS))
      levels.forEach((lv, i) => {
        for (let s = 0; s < 60; s++) { n++; found.push(...hits(`${id} L${i + 1}`, JSON.stringify(lv.make(rng(104729 * (i + 1) + s))))) }
      })
    expect(n).toBeGreaterThan(10000)
    expect([...new Set(found)]).toEqual([])
  }, 120_000)   // ~10,000 problems: 10 s alone, past the 30 s default on a loaded machine

  it('no KG–2 chapter line says one', () => {
    const corpus: { text: string; sources?: string[] }[] = JSON.parse(readFileSync('scripts/.voice-corpus-chapters-josh.json', 'utf8'))
    expect(corpus.length).toBeGreaterThan(1000)
    expect(corpus.map(r => r.text).join(' ')).toMatch(/rabbits/i)
    expect(corpus.flatMap(r => hits(r.sources?.[0] ?? 'chapter', r.text))).toEqual([])
  })

  it('no picture in public/assets is one', () => {
    const files: string[] = []
    const walk = (d: string) => readdirSync(d).forEach(f => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : files.push(join(d, f))))
    walk('public/assets')
    expect(files.some(f => f.includes('rabbit_side'))).toBe(true)
    expect(files.flatMap(f => hits('asset', f.replace(/_/g, ' ')))).toEqual([])
  })
})
