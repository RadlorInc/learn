/**
 * A teacher's class list (2026-09-18). Expected values are written out by hand.
 */
import { describe, it, expect } from 'vitest'
import { parseRoster, tempPassword, rosterCsv } from '@/core/classRoster'
import { CHILD_MIN_PASSWORD } from '@/core/childLogin'

describe('parseRoster', () => {
  it('one username per line; the name defaults to the username', () => {
    expect(parseRoster('aarav7\n\n  Maya.K \n')).toEqual({
      rows: [{ name: 'aarav7', username: 'aarav7' }, { name: 'maya.k', username: 'maya.k' }], errors: [],
    })
  })

  it('name, username without a header — and the same the other way round', () => {
    expect(parseRoster('Aarav Shah, aarav7\nzoya_2,Zoya Ali').rows).toEqual([
      { name: 'Aarav Shah', username: 'aarav7' }, { name: 'Zoya Ali', username: 'zoya_2' },
    ])
  })

  it('never makes a login out of a NAME: two columns stay name, username unless the order is unmistakable', () => {
    // "aarav" could be a username, but the documented order is name, username — so the bad username is reported.
    expect(parseRoster('aarav, a!b').rows).toEqual([])
    expect(parseRoster('aarav, a!b').errors).toHaveLength(1)
    expect(parseRoster('maya, maya9').rows).toEqual([{ name: 'maya', username: 'maya9' }])
  })

  it('a header decides the columns, in any order, with tabs or quotes (an Excel export)', () => {
    expect(parseRoster('Username\tFull name\r\naarav7\t"Aarav Shah"\r\nmaya9\tMaya').rows).toEqual([
      { name: 'Aarav Shah', username: 'aarav7' }, { name: 'Maya', username: 'maya9' },
    ])
    expect(parseRoster('student name;username\nAarav;aarav7').rows).toEqual([{ name: 'Aarav', username: 'aarav7' }])
  })

  it('reports a bad or repeated username by line, and keeps the good rows', () => {
    const { rows, errors } = parseRoster('aarav7\nab\nAarav7\nmaya 9')
    expect(rows).toEqual([{ name: 'aarav7', username: 'aarav7' }])
    expect(errors.map(e => [e.line, e.text])).toEqual([[2, 'ab'], [3, 'Aarav7'], [4, 'maya 9']])
    expect(errors[1].reason).toBe('aarav7 is in the list twice')
  })

  it('an empty list is empty, not an error', () => {
    expect(parseRoster('  \n\n')).toEqual({ rows: [], errors: [] })
  })
})

describe('tempPassword', () => {
  it('is a word and three digits, long enough for a child login', () => {
    expect(tempPassword(() => 0)).toBe('tiger000')
    expect(tempPassword(() => 0.999999)).toBe('rabbit999')
    for (let i = 0; i < 200; i++) {
      const p = tempPassword()
      expect(p).toMatch(/^[a-z]+\d{3}$/)
      expect(p.length).toBeGreaterThanOrEqual(CHILD_MIN_PASSWORD)
    }
  })
})

describe('rosterCsv', () => {
  it('quotes every cell so a comma or quote in a name survives', () => {
    expect(rosterCsv([{ name: 'Shah, "Aarav"', username: 'aarav7', password: 'otter482' }]))
      .toBe('name,username,temporary password\n"Shah, ""Aarav""","aarav7","otter482"')
  })
})
