/**
 * The diagnostic's durable resume.
 *
 * ⚠️ THE RULE THIS FILE EXISTS FOR IS THE TTL, AND A TTL TEST IS THE EASIEST THING IN THE WORLD TO
 * WRITE INERT: assert that an old record does not come back, and it passes just as happily when the
 * read is broken and NOTHING ever comes back. Every expiry case here is paired with a control that
 * must come back — same record, fresher timestamp.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveResume, readResume, clearResume, resumable, resumeKey, RESUME_TTL_MS, type DiagResume,
} from '@/infra/storage/diagResume'
import { kv } from '@/infra/storage/kv'
import { startProbe } from '@/core/diagnosticEngine'
import type { Band } from '@/core/skillGraph'

const DAY = 24 * 60 * 60 * 1000
const T0 = 1_756_000_000_000        // fixed: an unseeded clock makes a boundary test a coin flip
const run = (band: Band = '9-11') => startProbe(band)

beforeEach(() => { for (const id of [null, 'kid-a', 'kid-b']) clearResume(id) })

describe('durable resume', () => {
  it('survives the tab — a saved run reads back', () => {
    saveResume('kid-a', '9-11', run(), 0, T0)
    const r = readResume('kid-a', T0 + 60_000)
    expect(r, 'nothing came back — the rest of this file would pass vacuously').not.toBeNull()
    expect(r!.band).toBe('9-11')
    expect(Array.isArray(r!.s.asked)).toBe(true)
  })

  it('expires after the TTL — with a control that does NOT expire', () => {
    saveResume('kid-a', '9-11', run(), 0, T0)
    expect(readResume('kid-a', T0 + RESUME_TTL_MS - DAY), 'the control must survive').not.toBeNull()
    expect(readResume('kid-a', T0 + RESUME_TTL_MS + DAY), 'an 8-day-old run was still offered').toBeNull()
  })

  it('a record with NO savedAt is expired, not fresh', () => {
    // Written before the TTL existed. Reading an absent timestamp as "now" would make the oldest
    // runs the most durable — the inversion is why this is asserted rather than assumed.
    kv.set(resumeKey('kid-a'), JSON.stringify({ band: '9-11', attempt: 0, learner: 'kid-a', s: run() }))
    expect(readResume('kid-a', T0)).toBeNull()
    saveResume('kid-a', '9-11', run(), 0, T0)   // control: the same shape WITH a timestamp survives
    expect(readResume('kid-a', T0)).not.toBeNull()
  })

  it('a sibling cannot overwrite a sibling — the key carries the learner', () => {
    saveResume('kid-a', '9-11', run('9-11'), 0, T0)
    saveResume('kid-b', '6-8', run('6-8'), 0, T0)
    expect(readResume('kid-a', T0)!.band, "kid-b's run overwrote kid-a's").toBe('9-11')
    expect(readResume('kid-b', T0)!.band).toBe('6-8')
    clearResume('kid-b')
    expect(readResume('kid-a', T0), "clearing one child's run cleared the other's").not.toBeNull()
  })

  it('a garbled record is dropped rather than crashing the page', () => {
    for (const junk of ['not json', '{}', '{"band":"nope","s":{"asked":[]},"savedAt":' + T0 + '}',
                        '{"band":"9-11","savedAt":' + T0 + '}']) {
      kv.set(resumeKey('kid-a'), junk)
      expect(readResume('kid-a', T0), `accepted junk: ${junk}`).toBeNull()
    }
  })

  it('an explicit ?band= that disagrees outranks the resume', () => {
    const r = { band: '9-11', s: run(), attempt: 0, learner: null, savedAt: T0 } as DiagResume
    expect(resumable(r, null), 'no ?band= → resume').toBe(true)
    expect(resumable(r, '9-11'), 'agreeing ?band= → resume').toBe(true)
    expect(resumable(r, '12-14'), 'a band-specific link served another band’s half-finished run').toBe(false)
    expect(resumable(null, null)).toBe(false)
  })
})
