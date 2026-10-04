/**
 * The wire between /play and the game (public/blockcraft, opened full page): the child starts from their newest save,
 * the game plays only until the time the database returned, and it comes back to /play, which uploads its save —
 * founder, 2026-09-19: the next game starts where this one ended. The repository's database is stubbed; the game's
 * half is read from its source here and was driven in a real browser.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let reply: { data: unknown; error: { code?: string } | null } | 'throw'
vi.mock('@/data/repositories/_shared', () => ({
  db: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => { if (reply === 'throw') throw new Error('offline'); return reply } }) }),
      upsert: async () => ({ error: null }),
    }),
  }),
}))
import { openGame, gameUrl, localSaveKey } from '@/data/repositories/gameSave'

const assign = vi.fn()
beforeEach(() => {
  assign.mockReset(); localStorage.clear()
  vi.stubGlobal('location', { ...window.location, assign })
})

describe('opening the game from /play', () => {
  it('puts the account\'s newer save on this device, then opens the game with that key and the end time', async () => {
    localStorage.setItem(localSaveKey('kid-1'), JSON.stringify({ savedAt: 1, world: 'old' }))
    reply = { data: { data: { savedAt: 5, world: 'mine' } }, error: null }
    await openGame('kid-1', 1234)
    expect(JSON.parse(localStorage.getItem(localSaveKey('kid-1'))!)).toEqual({ savedAt: 5, world: 'mine' })
    expect(assign).toHaveBeenCalledWith('/blockcraft/index.html?key=blockcraft.save.kid-1&until=1234')
  })

  it('a child with no save anywhere gets a new world', async () => {
    reply = { data: null, error: null }
    await openGame('kid-1', 99)
    expect(localStorage.getItem(localSaveKey('kid-1'))).toBeNull()
    expect(assign).toHaveBeenCalledWith(gameUrl('kid-1', 99))
  })

  it('an account it cannot read is NOT answered with a new world (its first save would replace the real one)', async () => {
    reply = 'throw'
    expect(await openGame('kid-1', 99)).toBe('unreachable')
    expect(assign).not.toHaveBeenCalled()
  })
})

describe('the game keeps its half of the wire', () => {
  const game = readFileSync(resolve(__dirname, '../../blockcraft/src/main.js'), 'utf8')
  it('reads the key and end time from the URL, saves under that key, and goes back to /play', () => {
    expect(game).toMatch(/Q\.has\('key'\) && Q\.has\('until'\)/)
    expect(game).toMatch(/localStorage\.setItem\(saveKey\(\), JSON\.stringify\(data\)\)/)
    expect(game).toContain("const BACK = '/play'")
  })
  it('"Stop and keep my minutes" saves, then asks /play to stop the time (/play?stop=1 calls end_game_time)', () => {
    // ONE handler: a second assignment further down the file silently replaced the first (2026-10-01, the button
    // saved and showed the title screen instead of stopping the time).
    const handlers = game.match(/\$\('bQuit'\)\.onclick = [^\n]*/g) ?? []
    expect(handlers).toHaveLength(1)
    expect(handlers[0]).toMatch(/save\(\); if \(PLAY\) return location\.replace\(STOP\);/)
    expect(game).toContain("const STOP = '/play?stop=1'")
    const play = readFileSync(resolve(__dirname, '../app/play/page.tsx'), 'utf8')
    expect(play).toMatch(/has\('stop'\)[\s\S]{0,120}endGameTime\(learnerId\)/)
  })
  it('the title screen offers "Continue world" from the child\'s own save, not the standalone one', () => {
    expect(game).toContain('const saveKey = () => (PLAY ? PLAY.key : SAVE_KEY)')
    expect(game).toMatch(/const hasSave = \(\) => !!localStorage\.getItem\(saveKey\(\)\)/)
    expect(game).toMatch(/\$\('bContinue'\)\.onclick = [^\n]*getItem\(saveKey\(\)\)/)
  })
  it('when the time is up it saves before leaving', () => {
    expect(game).toMatch(/left === 0 && G\.world\) \{\s*clearInterval\(tick\); save\(\);/)
  })
})
