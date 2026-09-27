/**
 * A question's clips are all asked for when it LOADS, and nothing is asked for after the child answers (founder,
 * 2026-09-27, docs/legal/AUDIO-ROUND2.md §1.5 — KG–2 lines like "That makes seventeen. I asked for twenty-one." are
 * built from what was tapped, and a clip request lands in the storage provider's logs).
 *
 * This is the player half, and it is structural: while a question is open, a line plays only from the memory the
 * question filled, and a line it was not given is device speech that asks for NOTHING. So the requests cannot depend
 * on the answer even for a line a chapter forgot to declare. Each case has its twin. Expected URLs written by hand.
 */
import { it, expect, vi, beforeEach, afterEach } from 'vitest'
import { clipKey, clipCheck } from '@/core/voiceClips'

vi.mock('@/core/audioBase', () => ({ AUDIO_BASE: 'https://bucket.test/lesson-audio' }))

import { speakLine, setSceneVoice, openQuestion } from '@/infra/voiceClipPlayer'

const JOSH = 'nzFihrBIvB34imQBuxub'
const PROMPT = 'Find nest number four.'
const RIGHT = 'Great job!'
const WRONG_2 = "That's 2. Find nest number 4!"
const WRONG_7 = "That's 7. Find nest number 4!"
const OBJ: Record<string, string> = { [PROMPT]: '1111111111111111', [RIGHT]: '2222222222222222', [WRONG_2]: '3333333333333333', [WRONG_7]: '4444444444444444' }
const index = async () => Object.fromEntries(Object.entries(OBJ).map(([t, o]) => [clipKey(t), [o, clipCheck(t)] as [string, string]]))
const url = (o: string) => `https://bucket.test/lesson-audio/${o}.mp3`

let fetched: string[]
let srcs: string[]
const settle = () => new Promise(r => setTimeout(r, 30))

beforeEach(() => {
  fetched = []; srcs = []
  vi.stubGlobal('fetch', async (u: string) => { fetched.push(String(u)); return { ok: true, blob: async () => new Blob([String(u)]) } })
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (this: HTMLMediaElement) { srcs.push(this.src); return Promise.resolve() })
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); setSceneVoice(null) })

/** Load a question offering 2, 4 (right) and 7, then answer `tap`; return every request the bucket saw. */
/** Everything the bucket sees: fetches, and an <audio> pointed at it (a `data:` source is memory, not a request). */
const requests = () => [...fetched, ...srcs.filter(s => !s.startsWith('data:'))]
async function answer(tap: 2 | 4 | 7) {
  fetched = []; srcs = []
  setSceneVoice(JOSH, index)
  openQuestion([PROMPT, RIGHT, WRONG_2, WRONG_7])
  speakLine(PROMPT, { fallback: () => {} })
  await settle()
  const after = requests().length
  speakLine(tap === 4 ? RIGHT : tap === 2 ? WRONG_2 : WRONG_7, { fallback: () => {} })
  await settle()
  return { all: requests().sort(), afterTap: requests().slice(after) }
}

it('the requests are identical whichever option is tapped — and none is made by the tap', async () => {
  const runs = [await answer(2), await answer(4), await answer(7)]
  const expected = ['1111111111111111', '2222222222222222', '3333333333333333', '4444444444444444'].map(url)
  for (const r of runs) {
    expect(r.all).toEqual(expected)
    expect(r.afterTap).toEqual([])
  }
})

it('a held clip plays from memory (a data: URL), not from the bucket', async () => {
  await answer(7)
  expect(srcs).toHaveLength(2)
  for (const s of srcs) expect(s.startsWith('data:audio/mpeg;base64,')).toBe(true)
})

it('a line the question was NOT given is device speech and asks for nothing — even though it has a clip', async () => {
  setSceneVoice(JOSH, index)
  openQuestion([PROMPT])
  await settle()
  const fallback = vi.fn()
  speakLine(WRONG_7, { fallback })
  await settle()
  expect(fallback).toHaveBeenCalledTimes(1)
  expect(fetched).toEqual([url('1111111111111111')])
  expect(srcs).toEqual([])
})

it('twin: with no question open, the same line plays from the bucket as before', async () => {
  setSceneVoice(JOSH, index)
  const fallback = vi.fn()
  speakLine(WRONG_7, { fallback })
  await settle()
  expect(fallback).not.toHaveBeenCalled()
  expect(srcs).toEqual([url('4444444444444444')])
})

it('released, the lock lifts — and what the question held still plays from memory (the praise queued behind the last answer)', async () => {
  setSceneVoice(JOSH, index)
  const release = openQuestion([RIGHT])
  await settle()
  release()
  speakLine(RIGHT, { fallback: () => {} })
  speakLine(WRONG_2, { fallback: () => {} })
  await settle()
  expect(fetched).toEqual([url('2222222222222222')])   // held with the question, fetched once, when it loaded
  expect(srcs.filter(s => s.startsWith('data:'))).toHaveLength(1)
  expect(srcs.filter(s => !s.startsWith('data:'))).toEqual([url('3333333333333333')])
})

it('a new scene drops what an old question held', async () => {
  setSceneVoice(JOSH, index)
  openQuestion([RIGHT])
  await settle()
  setSceneVoice(JOSH, index)   // the next chapter
  speakLine(RIGHT, { fallback: () => {} })
  await settle()
  expect(srcs).toEqual([url('2222222222222222')])
})

it("a clip that could not be fetched is device speech, not a second request after the tap", async () => {
  setSceneVoice(JOSH, index)
  vi.stubGlobal('fetch', async (u: string) => { fetched.push(String(u)); return { ok: false } })
  openQuestion([WRONG_2])
  await settle()
  const fallback = vi.fn()
  speakLine(WRONG_2, { fallback })
  await settle()
  expect(fallback).toHaveBeenCalledTimes(1)
  expect(fetched).toEqual([url('3333333333333333')])
})
