/**
 * Games are not attached yet, so nothing in the app may spend points on game time (founder, 2026-09-26: a child bought
 * minutes on /play, got "Time's up!" over an empty placeholder, and lost the points). The database still has
 * `start_game_time`; this holds the app to never calling it. Delete this test in the same PR that attaches a game.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC = resolve(__dirname, '..')
const files = (dir: string): string[] => readdirSync(dir).flatMap(n => {
  const p = join(dir, n)
  return statSync(p).isDirectory() ? (n === '__tests__' ? [] : files(p)) : /\.tsx?$/.test(n) ? [p] : []
})
const calling = (rpc: string) => files(SRC).filter(f => new RegExp(`\\.rpc\\(\\s*['"\`]${rpc}['"\`]`).test(readFileSync(f, 'utf8')))

describe('game time is coming soon', () => {
  it('no app code calls start_game_time, so no points can be spent', () => {
    expect(calling('start_game_time')).toEqual([])
  })
  it('control: the same search finds the wallet read that /play still makes', () => {
    expect(calling('game_wallet').map(f => f.slice(SRC.length + 1))).toEqual(['data/repositories/points.ts'])
  })
  it('/play says coming soon and offers nothing to buy', () => {
    const page = readFileSync(join(SRC, 'app/play/page.tsx'), 'utf8')
    expect(page).toContain('Games are coming soon!')
    expect(page).not.toMatch(/<button/)
  })
})
