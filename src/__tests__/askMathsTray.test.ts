import { describe, expect, it } from 'vitest'
import { fraction, mixed, pieces, power } from '@/features/askMaths/MathTray'

describe('Ask maths tray: what the buttons put in the question', () => {
  it('builds plain text askRadlor reads, bracketing anything bigger than one number or letter', () => {
    expect(fraction('3', '8')).toBe('3/8')
    expect(fraction('x + 1', '3')).toBe('(x + 1)/3')
    expect(mixed('2', '3', '4')).toBe('2 3/4')
    expect(power('x', '2')).toBe('x²')
    expect(power('10', '12')).toBe('10¹²')
    expect(power('2', 'n + 1')).toBe('2^(n + 1)')
  })
})

describe('Ask maths preview: fractions stacked, powers raised, words left alone', () => {
  it('cuts a word problem into text and fractions', () => {
    expect(pieces('Riya ate 3/8 and Sam ate 1/4. How much is left?')).toEqual([
      'Riya ate ', { top: '3', bottom: '8' }, ' and Sam ate ', { top: '1', bottom: '4' }, '. How much is left?',
    ])
  })
  it('unwraps brackets and reads powers', () => {
    expect(pieces('(x + 1)/3 = 2^(n + 1)')).toEqual([{ top: 'x + 1', bottom: '3' }, ' = 2', { sup: 'n + 1' }])
  })
  it('leaves words with a slash and plain sentences as text', () => {
    expect(pieces('and/or 2x + 3 = 11')).toEqual(['and/or 2x + 3 = 11'])
  })
})
