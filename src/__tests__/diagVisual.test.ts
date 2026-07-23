import { describe, it, expect } from 'vitest'
import { ITEM_GENERATORS, makeItem } from '@/core/diagnosticItems'

/** A probe picture must be drawable AND agree with the answer — a chart whose tallest bar isn't the
 *  answer, or a fraction bar with more shaded parts than segments, is worse than no picture at all. */
describe('diagnostic item visuals', () => {
  const skills = Object.keys(ITEM_GENERATORS)

  it('is well-formed and consistent with the answer on every generator', () => {
    for (const skill of skills) {
      for (let i = 0; i < 40; i++) {
        const item = makeItem(skill, { seed: `s${i}`, nonce: i })!
        const v = item.visual
        if (!v) continue
        const nums: number[] = []
        switch (v.t) {
          case 'bars': {
            expect(v.vals).toHaveLength(v.labels.length)
            const top = v.labels[v.vals.indexOf(Math.max(...v.vals))]
            expect(top, `${skill}: tallest bar must be the answer`).toBe(item.answer)
            expect(v.vals.filter(x => x === Math.max(...v.vals)), `${skill}: no tie for tallest`).toHaveLength(1)
            nums.push(...v.vals); break
          }
          case 'point': nums.push(v.x, v.y); break
          case 'slope': nums.push(v.rise, v.run); expect(v.run).toBeGreaterThan(0); break
          case 'frac':
            for (const [n, d] of v.parts) { expect(d).toBeGreaterThan(0); expect(n).toBeGreaterThan(0); expect(n).toBeLessThanOrEqual(d); nums.push(n, d) }
            break
          case 'array': nums.push(v.rows, v.cols); expect(v.rows * v.cols).toBeGreaterThan(0); break
          case 'angle': nums.push(v.deg); expect(v.deg).toBeGreaterThan(0); expect(v.deg).toBeLessThan(180); break
          case 'rtri': nums.push(v.a, v.b); expect(v.labels).toHaveLength(3); break
          case 'numline':
            nums.push(v.lo, v.hi, v.mark)
            expect(v.hi).toBeGreaterThan(v.lo)
            expect(v.mark, `${skill}: mark sits strictly between the landmarks`).toBeGreaterThan(v.lo)
            expect(v.mark).toBeLessThan(v.hi)
            break
        }
        for (const n of nums) expect(Number.isFinite(n), `${skill}: ${v.t} has a non-finite number`).toBe(true)
      }
    }
  })

  it('gives an array visual the same product as the answer', () => {
    for (const skill of ['p.multConcept', 'i.multFacts', 'i.areaPerimeter']) {
      for (let i = 0; i < 40; i++) {
        const item = makeItem(skill, { seed: `a${i}`, nonce: i })!
        const v = item.visual!
        expect(v.t).toBe('array')
        if (v.t === 'array') expect(v.rows * v.cols, skill).toBe(Number(item.answer))
      }
    }
  })
})
