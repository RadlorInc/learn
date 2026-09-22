import { describe, it, expect } from 'vitest'
import { speakable } from '../features/lessons/content/voice/styles'

// Josh read "1 cm" as "1 centimeters" (~10 lines queued, 2026-09-22). One of anything is singular; the rest stay plural.
describe('speakable units', () => {
  it.each([
    ['1 cm equals 50 m.', '1 centimeter equals 50 meters.'],
    ['1 sq ft is 1 ft by 1 ft.', '1 square foot is 1 foot by 1 foot.'],
    ['21 cm and 2.5 m', '21 centimeters and 2.5 meters'],
    ['11 ft', '11 feet'],
    ['0.1 L', '0.1 liters'],
  ])('%s', (t, said) => expect(speakable(t)).toBe(said))
})

// A number times a letter is two words ("3x" was left for the voice to guess); 2²⁰ is not "2 squared⁰".
describe('speakable algebra', () => {
  it.each([
    ['Take 2x away from 5x.', 'Take 2 x away from 5 x.'],
    ['15 plus 8c equals 63', '15 plus 8 c equals 63'],
    ['Count by 5s.', 'Count by 5s.'],
    ['the 2nd one', 'the 2nd one'],
    ['4²', '4 squared'],
  ])('%s', (t, said) => expect(speakable(t)).toBe(said))
  it('leaves a longer superscript for a say row', () => expect(speakable('2²⁰')).not.toContain('squared'))
})
