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
  it('puts the account\'s newer save on this device, then opens the game with that key and the child id, no end time', async () => {
    localStorage.setItem(localSaveKey('kid-1'), JSON.stringify({ savedAt: 1, world: 'old' }))
    reply = { data: { data: { savedAt: 5, world: 'mine' } }, error: null }
    await openGame('kid-1')
    expect(JSON.parse(localStorage.getItem(localSaveKey('kid-1'))!)).toEqual({ savedAt: 5, world: 'mine' })
    expect(assign).toHaveBeenCalledWith('/blockcraft/index.html?key=blockcraft.save.kid-1&learner=kid-1')
  })

  it('a child with no save anywhere gets a new world', async () => {
    reply = { data: null, error: null }
    await openGame('kid-1')
    expect(localStorage.getItem(localSaveKey('kid-1'))).toBeNull()
    expect(assign).toHaveBeenCalledWith(gameUrl('kid-1'))
  })

  it('an account it cannot read is NOT answered with a new world (its first save would replace the real one)', async () => {
    reply = 'throw'
    expect(await openGame('kid-1')).toBe('unreachable')
    expect(assign).not.toHaveBeenCalled()
  })
})

describe('BeatHop, the second game on /play', () => {
  it('opens with this child\'s own device key and id, without reading the account', async () => {
    reply = 'throw' // the account is unreachable: BeatHop's save is on the device, so it still opens
    expect(await openGame('kid-1', 'beathop')).toBeUndefined()
    expect(assign).toHaveBeenCalledWith('/beathop/index.html?key=beathop.save.kid-1&learner=kid-1')
  })
  it('BlockCraft is still the one opened when no game is named', async () => {
    reply = { data: null, error: null }
    await openGame('kid-1')
    expect(assign).toHaveBeenCalledWith('/blockcraft/index.html?key=blockcraft.save.kid-1&learner=kid-1')
  })

  const beat = readFileSync(resolve(__dirname, '../../beathop/src/main.js'), 'utf8')
  it('the game reads the key and child id, saves under that key, and goes back to /play (or stops the time)', () => {
    expect(beat).toMatch(/Q\.has\('key'\) && Q\.has\('learner'\)/)
    expect(beat).toContain("const SAVE_KEY = PLAY ? PLAY.key : 'beathop.save'")
    expect(beat).toMatch(/localStorage\.setItem\(SAVE_KEY, /)
    expect(beat).toContain("const BACK = '/play?game=beathop', STOP = '/play?stop=1&game=beathop'")
    expect(beat).toMatch(/\$\('bLeave'\)\.onclick = \(\) => \{ persist\(\); location\.replace\(STOP\); \}/)
    expect(beat).toMatch(/import\('\/play-time\.js'\)\.then\(\(\{ playTime \}\) => playTime\(\{\s*learner: PLAY\?\.learner, back: BACK,/)
    expect(beat).toMatch(/done: \(\) => \{ persist\(\);/)
  })
  it('the build copies it into public/beathop, where gameUrl points', () => {
    const pkg = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf8'))
    expect(pkg.scripts['build:game']).toContain('cp -R beathop/index.html beathop/src public/beathop/')
    expect(pkg.scripts.prebuild).toBe('npm run build:game')
  })
})

describe('Peak Rider, the third game on /play', () => {
  it('opens with this child\'s own device key and id, without reading the account', async () => {
    reply = 'throw'
    expect(await openGame('kid-1', 'peak')).toBeUndefined()
    expect(assign).toHaveBeenCalledWith('/peak/index.html?key=peak.save.kid-1&learner=kid-1')
  })
  const peak = readFileSync(resolve(__dirname, '../../peak/src/main.js'), 'utf8')
  it('the game reads the key and child id, saves under that key, and goes back to /play (or stops the time)', () => {
    expect(peak).toMatch(/Q\.has\('key'\) && Q\.has\('learner'\)/)
    expect(peak).toContain("const SAVE_KEY = PLAY ? PLAY.key : 'peak.save'")
    expect(peak).toMatch(/localStorage\.setItem\(SAVE_KEY, /)
    expect(peak).toContain("const BACK = '/play?game=peak', STOP = '/play?stop=1&game=peak'")
    expect(peak).toMatch(/\$\('bLeave'\)\.onclick = \(\) => \{ persist\(\); location\.replace\(STOP\); \}/)
    expect(peak).toMatch(/import\('\/play-time\.js'\)\.then\(\(\{ playTime \}\) => playTime\(\{\s*learner: PLAY\?\.learner, back: BACK,/)
    expect(peak).toMatch(/done: \(\) => \{ persist\(\);/)
  })
  it('the build copies it (and the three.js it imports) into public/peak, where gameUrl points', () => {
    const pkg = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf8'))
    expect(pkg.scripts['build:game']).toContain('cp -R peak/index.html peak/src peak/vendor public/peak/')
  })
})

describe('Rescue Rush, the fourth game on /play', () => {
  it('opens with this child\'s own device key and id, without reading the account', async () => {
    reply = 'throw'
    expect(await openGame('kid-1', 'rush')).toBeUndefined()
    expect(assign).toHaveBeenCalledWith('/rush/index.html?key=rush.save.kid-1&learner=kid-1')
  })
  const rush = readFileSync(resolve(__dirname, '../../rush/src/main.js'), 'utf8')
  it('the game reads the key and child id, saves under that key, and goes back to /play (or stops the time)', () => {
    expect(rush).toMatch(/Q\.has\('key'\) && Q\.has\('learner'\)/)
    expect(rush).toContain("const SAVE_KEY = PLAY ? PLAY.key : 'rush.save'")
    expect(rush).toMatch(/localStorage\.setItem\(SAVE_KEY, /)
    expect(rush).toContain("const BACK = '/play?game=rush', STOP = '/play?stop=1&game=rush'")
    expect(rush).toMatch(/\$\('bLeave'\)\.onclick = \(\) => \{ persist\(\); location\.replace\(STOP\); \}/)
    expect(rush).toMatch(/import\('\/play-time\.js'\)\.then\(\(\{ playTime \}\) => playTime\(\{\s*learner: PLAY\?\.learner, back: BACK,/)
    expect(rush).toMatch(/done: \(\) => \{ persist\(\);/)
  })
  it('the build copies it into public/rush, next to the public/peak whose three.js it imports', () => {
    const pkg = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf8'))
    expect(pkg.scripts['build:game']).toContain('cp -R rush/index.html rush/src public/rush/')
    expect(pkg.scripts['build:game']).toContain('cp -R peak/index.html peak/src peak/vendor public/peak/')
    expect(readFileSync(resolve(__dirname, '../../rush/src/view.js'), 'utf8')).toContain("from '../../peak/vendor/three.module.min.js'")
  })
})

describe('the game keeps its half of the wire', () => {
  const game = readFileSync(resolve(__dirname, '../../blockcraft/src/main.js'), 'utf8')
  it('reads the key and child id from the URL, saves under that key, and goes back to /play', () => {
    expect(game).toMatch(/Q\.has\('key'\) && Q\.has\('learner'\)/)
    expect(game).toMatch(/import\(\/\* @vite-ignore \*\/ '\/play-time\.js'\)\.then\(\(\{ playTime \}\) => playTime\(\{\s*learner: PLAY\?\.learner, back: BACK,/)
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
    expect(game).toMatch(/done: \(\) => \{ if \(G\.world\) save\(\);/)
  })
})
