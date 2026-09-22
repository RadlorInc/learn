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
