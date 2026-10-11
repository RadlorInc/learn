/**
 * /play opens the game the child picked (BeatHop joined BlockCraft, 11 Oct): the same paid time, either game. Driven on
 * the real page with its data stubbed: pick, press Play, and read which game was opened. Expected values by hand.
 */
import { it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createElement, act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const { openGame } = vi.hoisted(() => ({ openGame: vi.fn(async () => {}) }))
let wallet: Record<string, unknown>
vi.mock('next/link', () => ({ default: ({ href, children }: { href: string; children: unknown }) => createElement('a', { href }, children as never) }))
vi.mock('@/data/supabase/useLearnerSession', () => ({ getActiveLearner: () => ({ id: 'kid-1' }) }))
vi.mock('@/data/repositories/points', () => ({
  getWallet: async () => wallet,
  startGameTime: async () => ({ ok: true, playing_until: '2030-01-01T00:05:00Z', balance: 60 }),
  endGameTime: async () => 0,
}))
vi.mock('@/data/repositories/gameSave', () => ({ loadGameSave: async () => null, openGame }))
import PlayPage from '@/app/play/page'

const base = { balance: 100, points_per_minute: 8, minutes_per_day: 20, minutes_used_today: 0, enabled: true, playing_until: null }
let host: HTMLDivElement, root: Root
beforeEach(() => { openGame.mockClear(); host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host) })
afterEach(async () => { await act(async () => root.unmount()); host.remove() })

const button = (text: string) => {
  const b = [...host.querySelectorAll('button')].find(x => x.textContent?.startsWith(text))
  expect(b, `no button starting "${text}" in: ${host.textContent}`).toBeTruthy()
  return b!
}
async function show() {
  await act(async () => { root.render(createElement(PlayPage)) })
  await vi.waitFor(() => expect(host.textContent).toContain('BeatHop'))
}

it('buying time with BeatHop picked opens BeatHop, at the end time the database returned', async () => {
  wallet = base
  await show()
  await act(async () => { button('🏃 BeatHop').click() })
  await act(async () => { button('Play 5 minutes').click() })
  expect(openGame).toHaveBeenCalledWith('kid-1', Date.parse('2030-01-01T00:05:00Z'), 'beathop')
})

it('buying time with Peak Rider picked opens Peak Rider', async () => {
  wallet = base
  await show()
  await act(async () => { button('🏔️ Peak Rider').click() })
  expect(button('🏔️ Peak Rider').getAttribute('aria-label')).toBe('Peak Rider: Rough roads, deep gaps: keep your car on its wheels')
  await act(async () => { button('Play 5 minutes').click() })
  expect(openGame).toHaveBeenCalledWith('kid-1', Date.parse('2030-01-01T00:05:00Z'), 'peak')
})

it('back from Peak Rider (/play?game=peak) the pick is still Peak Rider; an unknown game falls back to BlockCraft', async () => {
  wallet = { ...base, playing_until: '2099-01-01T00:00:00Z' }
  history.replaceState(null, '', '/play?game=peak')
  try {
    await show()
    expect(button('🏔️ Peak Rider').getAttribute('aria-checked')).toBe('true')
  } finally { history.replaceState(null, '', '/') }
  await act(async () => root.unmount()); root = createRoot(host)
  history.replaceState(null, '', '/play?game=chess')
  try {
    await show()
    expect(button('🧱 BlockCraft').getAttribute('aria-checked')).toBe('true')
  } finally { history.replaceState(null, '', '/') }
})

it('buying time with Rescue Rush picked opens Rescue Rush', async () => {
  wallet = base
  await show()
  await act(async () => { button('🚨 Rescue Rush').click() })
  expect(button('🚨 Rescue Rush').getAttribute('aria-label')).toBe('Rescue Rush: Race the clock to the hospital')
  await act(async () => { button('Play 5 minutes').click() })
  expect(openGame).toHaveBeenCalledWith('kid-1', Date.parse('2030-01-01T00:05:00Z'), 'rush')
})

it('nothing picked: BlockCraft, as before', async () => {
  wallet = base
  await show()
  await act(async () => { button('Play 5 minutes').click() })
  expect(openGame).toHaveBeenCalledWith('kid-1', Date.parse('2030-01-01T00:05:00Z'), 'blockcraft')
})

it('back from BeatHop (/play?game=beathop) the pick is still BeatHop, and each choice is named for a screen reader', async () => {
  wallet = { ...base, playing_until: '2099-01-01T00:00:00Z' }
  history.replaceState(null, '', '/play?game=beathop')
  try {
    await show()
    expect(button('🏃 BeatHop').getAttribute('aria-checked')).toBe('true')
    expect(button('🏃 BeatHop').getAttribute('aria-label')).toBe('BeatHop: Jump, glide and flip to the flag')
    expect(button('🧱 BlockCraft').getAttribute('aria-label')).toBe('BlockCraft: Build your own world')
    await act(async () => { button('Play 🏃 BeatHop').click() })
    expect(openGame).toHaveBeenCalledWith('kid-1', Date.parse('2099-01-01T00:00:00Z'), 'beathop')
  } finally { history.replaceState(null, '', '/') }
})

it('while the time lasts the child can switch: BeatHop picked, "Play" opens BeatHop with the same end time', async () => {
  wallet = { ...base, playing_until: '2099-01-01T00:00:00Z' }
  await show()
  await act(async () => { button('🏃 BeatHop').click() })
  expect(button('🏃 BeatHop').getAttribute('aria-checked')).toBe('true')
  await act(async () => { button('Play 🏃 BeatHop').click() })
  expect(openGame).toHaveBeenCalledWith('kid-1', Date.parse('2099-01-01T00:00:00Z'), 'beathop')
})
