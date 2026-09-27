/**
 * Money is the one chapter whose ANSWER lines are fetched ahead only under a byte budget (founder, 2026-09-27): every
 * total a child can lay makes its own miss line — a median ~380 KB a round, 1 of 300 measured rounds under 100 KB — and
 * the answer reaches Supabase anyway through progress sync (first try or after a miss; the clip adds which wrong total). Past the budget the line is fetched when said. The player half is in questionLock.test.ts;
 * this drives the REAL wire: SkillBeat, the Money round, the speaker, the player and the chapter's real clip index.
 *
 * A round at the first tier (price under 10, coins of 1 and 5) has ~35 reachable totals — over 100 KB. Lay one coin,
 * Pay: Josh must say "That makes one…" — fetched from the bucket AT the tap (not refused into the device voice, which
 * is what a missing wire looks like), and it must be the only answer clip that tap asks for.
 */
import { it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createElement, act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { clipKey, clipCheck } from '@/core/voiceClips'

vi.mock('@/core/audioBase', () => ({ AUDIO_BASE: 'https://bucket.test/lesson-audio' }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: () => {}, push: () => {} }) }))
vi.mock('@/data/supabase/useLearnerSession', () => ({ getActiveLearner: () => null }))
vi.mock('@/infra/storage/lessonSync', () => ({ syncLesson: () => {}, flushLessonSync: async () => {}, pullLessonProgress: async () => false }))
vi.mock('@/shared/ui/MiloPointer', () => ({ default: () => null }))

import { SkillBeat } from '@/features/chapters/story/StoryWorld'
import { BEAT as MONEY_BEAT, ANSWER_BUDGET } from '@/features/chapters/story/CoinShop'
import { setSceneVoice } from '@/infra/voiceClipPlayer'
import { JOSH } from '@/infra/storage/voicePref'
import { VOICE_INDEX } from '@/features/chapters/voice-index'
import { polyfillResizeObserver, seedRandom } from './_voiceCorpusKit'
import { WALK_TIMEOUT } from './_questionWalk'

vi.setConfig({ testTimeout: WALK_TIMEOUT })   // real renders; several times slower with the full suite in parallel
;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true
polyfillResizeObserver()

let host: HTMLDivElement, root: Root, requests: string[], memory: string[], device: string[]
const wait = (ms: number) => act(async () => { await new Promise(r => setTimeout(r, ms)) })
const click = (el: Element) => act(async () => { (el as HTMLElement).click() })

beforeEach(() => {
  requests = []; memory = []; device = []
  vi.stubGlobal('fetch', async (u: string) => { requests.push(String(u)); return { ok: true, blob: async () => new Blob([String(u)]) } })
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (this: HTMLMediaElement) {
    if (this.src.startsWith('data:')) memory.push(this.src); else requests.push(this.src)
    setTimeout(() => this.onended?.(new Event('ended')), 20)
    return Promise.resolve()
  })
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: {
      speak: (u: { text: string; onstart?: () => void; onend?: () => void }) => { device.push(u.text); setTimeout(() => { u.onstart?.(); u.onend?.() }, 20) },
      cancel: () => {}, getVoices: () => [{ name: 'Samantha', lang: 'en-US', localService: true }],
      speaking: false, pending: false, paused: false, addEventListener: () => {}, removeEventListener: () => {},
    },
  })
  vi.stubGlobal('SpeechSynthesisUtterance', class { text: string; onend: unknown; onerror: unknown; onstart: unknown; onboundary: unknown; constructor(t: string) { this.text = t } })
  host = document.createElement('div'); document.body.append(host); root = createRoot(host)
})
afterEach(() => { act(() => root.unmount()); host.remove(); setSceneVoice(null); vi.restoreAllMocks(); vi.unstubAllGlobals() })

it("the founder's budget is 100 KB (written here by hand, not imported)", () => {
  expect(ANSWER_BUDGET).toBe(100_000)
  expect(MONEY_BEAT.answerBudget).toBe(100_000)
})

it('over the budget, a miss is fetched AT the tap and said by Josh — not refused into the device voice', async () => {
  const index = await VOICE_INDEX.money()
  const url = (t: string) => { const e = index[clipKey(t)]; return e && e[1] === clipCheck(t) ? `https://bucket.test/lesson-audio/${e[0]}.mp3` : null }
  seedRandom(20260927)
  setSceneVoice(JOSH, VOICE_INDEX.money)
  let shown: Parameters<typeof MONEY_BEAT.answerLines & object>[0] | null = null
  await act(async () => { root.render(createElement(SkillBeat, { beat: MONEY_BEAT, onComplete: () => {}, onRound: (d: typeof shown) => { shown = d } })) })
  await wait(2000)                                      // the round loads and the keeper says the opener

  // Positive controls: this round really is over the budget, and its answer lines really have clips to fetch.
  expect(shown, 'SkillBeat reported the round it drew').not.toBeNull()
  const round = shown!
  const answers = [...new Set(MONEY_BEAT.answerLines!(round))]
  const bytes = answers.map(t => index[clipKey(t)]).filter(e => e).reduce((a, e) => a + (e![2] ?? 0), 0)
  expect(bytes, 'this round is over the budget').toBeGreaterThan(ANSWER_BUDGET)
  const answerUrls = new Set(answers.map(url).filter((u): u is string => !!u))
  expect(answerUrls.size).toBeGreaterThan(5)
  expect(requests.filter(r => answerUrls.has(r)), 'nothing of the answers was fetched ahead').toEqual([])

  const before = requests.length
  // One coin that does not pay: a 1, unless the price IS 1 — then a 5.
  const coin = round.price === 1 ? 5 : 1
  const lay = host.querySelector(`button[aria-label="a ${coin} coin"]`)
  expect(lay, `a ${coin} coin to lay`).not.toBeNull()
  await click(lay!)
  const pay = [...host.querySelectorAll('button')].find(b => /Pay/.test(b.textContent ?? ''))
  await click(pay!)
  await wait(1200)
  const word = coin === 1 ? 'one' : 'five'
  const miss = answers.find(t => t.startsWith(`That makes ${word}.`))!
  expect(miss, `the miss for a till of ${word}`).toBeTruthy()
  expect(requests.slice(before).filter(r => answerUrls.has(r)), 'the tap fetched exactly its own line').toEqual([url(miss)])
  expect(device.filter(t => url(t)), 'no line with a clip fell to the device voice').toEqual([])
})

