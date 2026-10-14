/**
 * The sound output is held awake while a voiced scene is on, and let go when it ends.
 *
 * A tester's laptop (HP, Windows 10, Chrome, 8 Oct 2026) lost the first words of a line after some seconds of silence on
 * a screen, and short lines entirely. An inaudible tone running while a lesson is on keeps the output from closing.
 * What this checks: the tone is started and the context resumed when a Josh scene starts; suspended when it ends; no
 * context at all for a scene with no recorded voice, or on an iPad.
 */
import { it, expect, vi, beforeEach, onTestFinished } from 'vitest'

class FakeCtx {
  static made: FakeCtx[] = []
  state = 'suspended'
  started = false
  gain = 1
  freq = 0
  destination = {}
  constructor() { FakeCtx.made.push(this) }
  resume = vi.fn(async () => { this.state = 'running' })
  suspend = vi.fn(async () => { this.state = 'suspended' })
  createOscillator() {
    const o = { frequency: { value: 0 }, connect: (g: { gain: { value: number } }) => g, start: () => { this.started = true; this.freq = o.frequency.value } }
    return o
  }
  createGain() {
    const ctx = this
    const g = { gain: { set value(v: number) { ctx.gain = v }, get value() { return ctx.gain } }, connect: () => undefined }
    return g
  }
}

const JOSH_ID = 'nzFihrBIvB34imQBuxub'
const index = async () => ({})

beforeEach(() => {
  vi.resetModules()
  FakeCtx.made = []
  vi.stubGlobal('AudioContext', FakeCtx)
})

const settle = () => new Promise(r => setTimeout(r, 0))

it('a Josh scene starts an inaudible tone and resumes the context; leaving the scene suspends it', async () => {
  const { setSceneVoice } = await import('@/infra/voiceClipPlayer')
  setSceneVoice(JOSH_ID, index)
  await settle()
  expect(FakeCtx.made).toHaveLength(1)
  const ctx = FakeCtx.made[0]
  expect(ctx.state).toBe('running')
  expect(ctx.started).toBe(true)
  expect(ctx.freq).toBe(20)
  expect(ctx.gain).toBe(0.0001)

  setSceneVoice(null)
  await settle()
  expect(ctx.state).toBe('suspended')

  // The next lesson reuses the same context instead of making another.
  setSceneVoice(JOSH_ID, index)
  await settle()
  expect(FakeCtx.made).toHaveLength(1)
  expect(ctx.state).toBe('running')
})

it('a scene with no recorded voice makes no context', async () => {
  const { setSceneVoice } = await import('@/infra/voiceClipPlayer')
  setSceneVoice('someOtherVoice', index)
  await settle()
  expect(FakeCtx.made).toHaveLength(0)
})

it('an iPad (Mac user agent with touch) makes no context', async () => {
  Object.defineProperty(navigator, 'maxTouchPoints', { value: 5, configurable: true })
  Object.defineProperty(navigator, 'userAgent', { value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15', configurable: true })
  onTestFinished(() => { delete (navigator as unknown as Record<string, unknown>).maxTouchPoints; delete (navigator as unknown as Record<string, unknown>).userAgent })
  const { setSceneVoice } = await import('@/infra/voiceClipPlayer')
  setSceneVoice(JOSH_ID, index)
  await settle()
  expect(FakeCtx.made).toHaveLength(0)
})
