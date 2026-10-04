/**
 * The chalk lands on her real words: wordMs uses the clip's word time (at the playback rate) when the lesson's
 * word-times file has one, and the length estimate otherwise. Expected values are written out by hand.
 */
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { setWordTimes, wordMs } from '@/features/lessons/chalk'
import { clipKey } from '@/core/voiceClips'

const SAY = '4 groups of 3 make 12.'   // g3m1-t1; 22 characters, so the estimate's line is 1500 + 22 × 55 = 2710 ms

afterEach(() => setWordTimes({}, 1))

describe('wordMs', () => {
  it('uses the real word time, slowed by the rate the clip plays at', () => {
    setWordTimes({ [clipKey(SAY)]: { '12': 1460 } }, 0.9)
    expect(wordMs(SAY, '12')).toBe(1622)   // 1460 / 0.9
    expect(wordMs(SAY, '12.')).toBe(1622)  // the mark's word is matched the same way as the line's
  })

  it('keeps the estimate for a word or a line with no real time', () => {
    setWordTimes({ [clipKey(SAY)]: { '12': 1460 } }, 0.9)
    expect(wordMs(SAY, '3')).toBe(1355)    // 3 of 6 words × 2710
    expect(wordMs('A line with no clip here.', 'clip')).toBe(1917)   // 4 of 6 words × (1500 + 25 × 55)
    setWordTimes({}, 1)
    expect(wordMs(SAY, '12')).toBe(2258)   // 5 of 6 words × 2710
  })

  it('the shipped g3m1 file holds her real times for that line (whisper heard "three" at 0.78 s, "twelve" at 1.46 s)', () => {
    const g3m1 = JSON.parse(readFileSync('src/features/lessons/word-times/g3m1.json', 'utf8'))
    expect(g3m1[clipKey(SAY)]).toEqual({ groups: 320, '3': 780, '12': 1460 })
  })
})
