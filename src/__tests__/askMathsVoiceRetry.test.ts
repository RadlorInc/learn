/**
 * After a failed voice load, a new visit to /ask tries again (founder, 26 Oct) — without closing the app. A line asked
 * for in between does not start a new download, and the failed worker's late error cannot spoil the new try.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'

type Fake = { onerror: ((e: { message: string }) => void) | null; onmessage: ((e: { data: unknown }) => void) | null; posted: unknown[]; terminated: boolean }
const workers: Fake[] = []
class FakeWorker implements Fake {
  onerror: Fake['onerror'] = null; onmessage: Fake['onmessage'] = null; posted: unknown[] = []; terminated = false
  constructor() { workers.push(this) }
  postMessage(m: unknown) { this.posted.push(m) }
  terminate() { this.terminated = true }
}

let voice: typeof import('@/features/askMaths/voice')
beforeAll(async () => {
  vi.stubGlobal('Worker', FakeWorker)
  voice = await import('@/features/askMaths/voice')
})

describe('voice: a failed load is tried again on the next visit', () => {
  it('fails, makes no new worker for a line, then retries and comes up', async () => {
    const p1 = voice.startVoice()
    expect(workers).toHaveLength(1)
    workers[0].onerror!({ message: 'flow_lm_main_int8.onnx: HTTP 503' })
    expect(await p1).toBe(false)

    expect(await voice.speakLine('Three quarters')).toBeNull()
    expect(workers).toHaveLength(1)                       // a line does not retry the download

    const p2 = voice.retryVoice()
    expect(workers).toHaveLength(2)
    expect(workers[0].terminated).toBe(true)
    workers[0].onerror!({ message: 'late error from the old worker' })   // must not fail the new try
    workers[1].onmessage!({ data: { warm: 'ok' } })
    expect(await p2).toBe(true)

    expect(voice.retryVoice()).toBe(p2)                   // ready: no new worker
    expect(workers).toHaveLength(2)
  })
})
