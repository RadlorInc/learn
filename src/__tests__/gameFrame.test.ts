/**
 * The wire between /play and the game (GameFrame ↔ public/blockcraft): the game's save reaches the account, the child
 * starts from their save, and when game time runs out the game is told to save and stop BEFORE it is taken away —
 * founder, 2026-09-19: the next game starts where this one ended. The game is played by the test here (messages from
 * the frame), the repository is stubbed; the game's own half was driven in a real browser (see the migration header).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createElement, act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

const uploads: unknown[][] = []
let stored: unknown = { savedAt: 5, world: 'mine' }
vi.mock('@/data/repositories/gameSave', () => ({
  loadGameSave: async () => stored,
  uploadGameSave: async (...a: unknown[]) => { uploads.push(a) ; return true },
  localSaveKey: (id: string) => `blockcraft.save.${id}`,
}))
import GameFrame from '@/app/play/GameFrame'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
let root: Root, host: HTMLDivElement, closed: number, toGame: unknown[]
const frame = () => host.querySelector('iframe')!
/** A message from the game, as the page receives it. */
const fromGame = (data: object) => act(async () => {
  dispatchEvent(new MessageEvent('message', { data, origin: location.origin, source: frame().contentWindow }))
  await Promise.resolve()
})
const render = (running: boolean) => act(async () => {
  root.render(createElement(GameFrame, { learnerId: 'kid-1', running, onClosed: () => { closed++ } }))
})

beforeEach(async () => {
  uploads.length = 0; closed = 0; toGame = []; stored = { savedAt: 5, world: 'mine' }
  host = document.createElement('div'); document.body.appendChild(host)
  root = createRoot(host)
  await render(true)
  vi.spyOn(frame().contentWindow!, 'postMessage').mockImplementation((m: unknown) => { toGame.push(m) })
})

afterEach(() => act(() => root.unmount()))

describe('the game on /play', () => {
  it('starts the game from the child\'s own save, with their device key', async () => {
    await fromGame({ type: 'bc:ready' })
    expect(toGame).toEqual([{ type: 'bc:start', save: { savedAt: 5, world: 'mine' }, key: 'blockcraft.save.kid-1' }])
  })

  it('a save the game posts goes to the account', async () => {
    await fromGame({ type: 'bc:save', data: { savedAt: 9 } })
    expect(uploads).toEqual([['kid-1', { savedAt: 9 }]])
  })

  it('when time runs out: tells the game to stop, uploads its LAST save, and only then closes', async () => {
    await fromGame({ type: 'bc:save', data: { savedAt: 9 } })
    await fromGame({ type: 'bc:save', data: { savedAt: 10 } })     // within the minute: not uploaded yet
    expect(uploads).toHaveLength(1)
    await render(false)
    expect(toGame).toContainEqual({ type: 'bc:stop' })
    expect(closed).toBe(0)                                           // not taken away before the game has saved
    await fromGame({ type: 'bc:save', data: { savedAt: 11 } })
    await fromGame({ type: 'bc:stopped' })
    expect(uploads.at(-1)).toEqual(['kid-1', { savedAt: 11 }])
    expect(closed).toBe(1)
  })

  it('a game that never answers is still closed — with the last save it did send', async () => {
    vi.useFakeTimers()
    try {
      await fromGame({ type: 'bc:save', data: { savedAt: 9 } })
      await fromGame({ type: 'bc:save', data: { savedAt: 10 } })
      await render(false)
      await act(async () => { vi.advanceTimersByTime(3_000) })
      expect(closed).toBe(1)
      expect(uploads.at(-1)).toEqual(['kid-1', { savedAt: 10 }])
    } finally { vi.useRealTimers() }
  })

  it('an account it cannot read is NOT answered with a new world (its first save would replace the real one)', async () => {
    stored = 'unreachable'
    await fromGame({ type: 'bc:ready' })
    expect(toGame).toEqual([])
    expect(host.textContent).toMatch(/couldn.t load your game/)
  })

  it('ignores messages from anything but its own frame', async () => {
    await act(async () => { dispatchEvent(new MessageEvent('message', { data: { type: 'bc:save', data: { evil: 1 } }, origin: location.origin, source: window })) })
    await act(async () => { dispatchEvent(new MessageEvent('message', { data: { type: 'bc:save', data: { evil: 2 } }, origin: 'https://evil.example', source: frame().contentWindow })) })
    expect(uploads).toEqual([])
  })
})
