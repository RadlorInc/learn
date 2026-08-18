/**
 * The camera door must never become a room with no exit.
 *
 * Both halves of one defect, found by driving the code path a child on a slow phone takes:
 *   · the model download (~7.8 MB from Google + ~11 MB of wasm from jsDelivr) had NO timeout, and a
 *     stalled fetch does not REJECT — it hangs, so `useFingerCounter`'s try/catch never fires and
 *     `status` sticks on 'loading' for ever;
 *   · `CamGate` hid every button while 'loading', so that state rendered "One moment." with nothing
 *     to press. A hang plus no escape is a dead end, which is the worst outcome this repo names.
 *
 * ⚠️ THESE ARE DRIVEN, NOT GREPPED. A source check ("is there a setTimeout") would pass on a timer
 * wired to nothing, and this repo has shipped exactly that kind of inert gate before.
 * (`createElement` rather than JSX only because vitest's include is `src/**\/*.test.ts`.)
 */
import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'

// A CDN that accepts the connection and then says nothing — the 3G/blocked-host case. Neither
// promise ever settles, so an untimed `await` here is unrecoverable.
vi.mock('@mediapipe/tasks-vision', () => ({
  FilesetResolver: { forVisionTasks: () => new Promise(() => {}) },
  HandLandmarker: { createFromOptions: () => new Promise(() => {}) },
}))

import { createHandLandmarker, LOAD_TIMEOUT_MS } from '@/infra/ar/handLandmarker'
import { CamGate, type HandSkin } from '@/infra/ar/HandInput'

const SKIN: HandSkin = {
  accent: '#f60', accentSoft: '#fc9', ink: '#111', muted: '#666',
  panel: '#fff', line: '#ccc', onAccent: '#fff', font: 'sans-serif', mono: 'monospace',
}

const gate = (status: string) => renderToStaticMarkup(createElement(CamGate, {
  status, error: '', skin: SKIN, denied: 'Milo needs the camera.',
  onTaps: () => {}, onRetry: () => {}, onExit: () => {},
}))

describe('the AR camera door always has a way out', () => {
  it('rejects instead of hanging when the model download stalls', async () => {
    vi.useFakeTimers()
    try {
      const p = createHandLandmarker(1)
      const settled = expect(p).rejects.toThrow(/timed out/)
      await vi.advanceTimersByTimeAsync(LOAD_TIMEOUT_MS + 1)
      await settled
    } finally { vi.useRealTimers() }
  })

  it('offers the tap door WHILE loading — the state a slow phone sits in longest', () => {
    expect(gate('loading')).toContain('Tap instead')
  })

  it('still offers taps once the load has failed', () => {
    expect(gate('error')).toContain('Tap instead')
  })

  it('does not offer a retry mid-load — a second download on a struggling connection', () => {
    expect(gate('loading')).not.toContain('Try the camera again')
    expect(gate('error')).toContain('Try the camera again')
  })
})
