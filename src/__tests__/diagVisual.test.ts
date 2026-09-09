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
            // ⚠️ The chart must ANSWER the question it is drawn for. This used to assert "the
            // tallest bar is the answer", which was right while the question was "which has the
            // most" — a question a child answers by LOOKING, which is why it became "how many more
            // X than Y" (reading plus a comparison, with a number for an answer). The invariant
            // that survives the change is that the picture supports the arithmetic: both named
            // bars are unambiguous, and their difference IS the answer.
            expect(v.vals).toHaveLength(v.labels.length)
            const hi = Math.max(...v.vals), lo = Math.min(...v.vals)
            expect(v.vals.filter(x => x === hi), `${skill}: no tie for tallest`).toHaveLength(1)
            expect(v.vals.filter(x => x === lo), `${skill}: no tie for shortest`).toHaveLength(1)
            const hiL = v.labels[v.vals.indexOf(hi)], loL = v.labels[v.vals.indexOf(lo)]
            expect(item.prompt, `${skill}: prompt must name both bars it compares`).toContain(hiL)
            expect(item.prompt).toContain(loL)
            expect(String(hi - lo), `${skill}: the drawn difference must be the answer`).toBe(item.answer)
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
