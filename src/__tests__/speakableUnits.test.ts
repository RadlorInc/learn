import { describe, it, expect } from 'vitest'
import { speakable } from '../features/lessons/content/voice/styles'

// Josh read "1 cm" as "1 centimeters" (~10 lines queued, 2026-09-22). One of anything is singular; the rest stay plural.
describe('speakable units', () => {
  it.each([
    ['1 cm equals 50 m.', 'one centimeter equals fifty meters.'],
    ['1 sq ft is 1 ft by 1 ft.', 'one square foot is one foot by one foot.'],
    ['21 cm and 2.5 m', 'twenty-one centimeters and two point five meters'],
    ['11 ft', 'eleven feet'],
    ['0.1 L', 'zero point one liters'],
  ])('%s', (t, said) => expect(speakable(t)).toBe(said))
})

// A number times a letter is two words ("3x" was left for the voice to guess); 2²⁰ is not "2 squared⁰".
describe('speakable algebra', () => {
  it.each([
    ['Take 2x away from 5x.', 'Take two x away from five x.'],
    ['15 plus 8c equals 63', 'fifteen plus eight c equals sixty-three'],
    ['Count by 5s.', 'Count by fives.'],
    ['the 2nd one', 'the second one'],
    ['4²', 'four squared'],
  ])('%s', (t, said) => expect(speakable(t)).toBe(said))
  it('leaves a longer superscript for a say row', () => expect(speakable('2²⁰')).not.toContain('squared'))
})

// The voice model dropped a word inside a number given as digits (9 Oct 2026: 184 → "one hundred four", 180 → "one
// hundred", 2,450 → "two thousand four hundred"), so every number reaches it as words. Written out by hand.
describe('speakable numbers', () => {
  it.each([
    ["What's left of 180.", "What's left of one hundred eighty."],
    ['180 − 55 = 125.', 'one hundred eighty minus fifty-five equals one hundred twenty-five.'],
    ['184 roses', 'one hundred eighty-four roses'],
    ['2,450 + 1,300 = 3,750', 'two thousand four hundred fifty plus one thousand three hundred equals three thousand seven hundred fifty'],
    ['305,420 people', 'three hundred five thousand four hundred twenty people'],
    ['150,000,000 kilometers', 'one hundred fifty million kilometers'],
    ['3.875 and 0.04', 'three point eight seven five and zero point zero four'],
    ['$3.75', 'three dollars and seventy-five cents'],
    ['Count by 6s and 10s, the 21st', 'Count by sixes and tens, the twenty-first'],
    ['12 oh 5', 'twelve oh five'],
    ['−3', 'negative three'],
  ])('%s', (t, said) => expect(speakable(t)).toBe(said))
  it('leaves no digit for the voice model on any of these', () => expect(speakable('9 times 23 equals 207; 1,176 ÷ 24 = 49')).not.toMatch(/\d/))
})
