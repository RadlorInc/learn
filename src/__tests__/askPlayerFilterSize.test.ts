/**
 * The board's hand-drawn filters must not cover a fixed giant square. With `filterUnits="userSpaceOnUse"` and a
 * 6000-unit region, an iPhone made a filter image thousands of pixels wide for every washed shape inside a scaled
 * drawing (an apple, `fruit k=apple`) and closed the tab: "A problem repeatedly occurred" (31 Oct 2026, iPhone 13,
 * staging; found by replaying the lesson piece by piece on the phone). askRadlor fixed its player on 22 Oct (4dbf119);
 * Radlic's copy (public/ask-player, scripts/sync-ask-player.mjs) was older. This fails on a copy from before that fix.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const recipes = readFileSync(resolve(process.cwd(), 'public/ask-player/recipes.js'), 'utf8')
const filters = [...recipes.matchAll(/<filter\b[^>]*>/g)].map(m => m[0])

describe('ask-player: filter regions follow each shape', () => {
  it('the board defines its hand-drawn filters (positive control)', () => {
    expect(filters.some(f => /id="wc"/.test(f))).toBe(true)
    expect(filters.some(f => /id="rough"/.test(f))).toBe(true)
  })
  it.each(['wc', 'rough'])('#%s covers its own shape plus a margin, not a fixed user-space square', id => {
    const f = filters.find(x => x.includes(`id="${id}"`))!
    expect(f).not.toMatch(/filterUnits="userSpaceOnUse"/)
    expect(f).toMatch(/width="1[0-9]{2}%"/)
  })
})
