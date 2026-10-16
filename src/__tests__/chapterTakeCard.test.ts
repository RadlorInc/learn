/**
 * KG–2: the card after a take of 5 questions (founder, 2026-10-12: stopping must feel like a win, not like leaving
 * something unfinished). What it shows and what it says aloud — the line that has a recorded clip.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react'

const speak = vi.fn()
vi.mock('@/infra/useMiloSpeaker', () => ({ useMiloSpeaker: () => ({ speak }) }))
import ChapterDone from '@/shared/ui/ChapterDone'

let root: Root, host: HTMLDivElement
afterEach(() => { act(() => root.unmount()); host.remove(); speak.mockReset() })
async function card(take?: number) {
  host = document.createElement('div'); document.body.append(host); root = createRoot(host)
  await act(async () => { root.render(createElement(ChapterDone, { open: true, take, onExit: () => {}, onPlayAgain: () => {} })) })
  return host.textContent ?? ''
}

describe('the card after a take', () => {
  it('celebrates what was solved, says the same aloud, and never "saved" or "break"', async () => {
    const text = await card(5)
    expect(text).toContain('You did it! ⭐')
    expect(text).toContain("5 questions solved. You're getting stronger!")
    expect(text).not.toMatch(/saved|break|unfinished/i)
    expect(speak).toHaveBeenCalledWith("You did it! 5 questions solved. You're getting stronger!")
  })
  it('control: a finished chapter keeps its own end card', async () => {
    const text = await card()
    expect(text).toContain('🎉 All done!')
    expect(text).toContain('▶ Play again')
    expect(speak).toHaveBeenCalledWith('All done! Nice work.')
  })
})
