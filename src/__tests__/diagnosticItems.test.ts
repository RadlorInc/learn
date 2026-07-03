import { describe, it, expect } from 'vitest'
import { makeItem } from '@/core/diagnosticItems'

describe('diagnosticItems', () => {
  it('is deterministic for the same child + attempt (seeded)', () => {
    const a = makeItem('m.exponentsRoots', { seed: 'kid', nonce: 0 })
    const b = makeItem('m.exponentsRoots', { seed: 'kid', nonce: 0 })
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('the answer is always one of the offered choices', () => {
    for (const skill of ['i.multFacts', 'i.division', 'm.signedOps', 'e.counting10', 'p.compare100']) {
      for (let n = 0; n < 25; n++) {
        const item = makeItem(skill, { seed: 'k', nonce: n })
        expect(item).toBeTruthy()
        expect(item!.choices).toContain(item!.answer)
      }
    }
  })
})
