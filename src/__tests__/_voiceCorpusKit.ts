/**
 * Shared machinery for the opt-in voice-corpus builders (`_voiceCorpus35`, `_voiceCorpus68`,
 * `_voiceCorpusChapters`). Not a test file: it collects lines, it asserts nothing.
 *
 * A builder that renders must stub the speaker IN ITS OWN FILE (vi.mock is per test file):
 *
 *   vi.mock('@/infra/useMiloSpeaker', async (orig) =>
 *     ({ ...(await orig<object>()), ...(await import('./_voiceCorpusKit')).SPEAKER_STUB }))
 */
import { clipKey } from '@/core/voiceClips'
import type { Beat } from '@/features/chapters/story/StoryWorld'

export type Bucket = 'scored' | 'teach' | 'redirect' | 'reteach'
export const ORDER: Bucket[] = ['scored', 'teach', 'redirect', 'reteach']
export interface Line { text: string; kind: Bucket; chapters: string[] }

/** Every line the stubbed speaker was asked to say since the last reset. */
export const spoken: string[] = []
const say = (l: string) => { spoken.push(l) }
const sayAll = (l: string[]) => { spoken.push(...l); return () => {} }
export const SPEAKER_STUB = {
  speak: say, speakAfterCurrent: say, speakAt: say,
  speakSteps: sayAll, speakPaced: sayAll, speakSeq: sayAll,
}

export class Corpus {
  lines = new Map<string, Line>()
  /** Chapters whose re-teach mounted and said nothing, or threw — a hole, never a blank. */
  holes = new Set<string>()

  add(chapter: string, kind: Bucket, ...texts: (string | undefined)[]) {
    for (const raw of texts) {
      if (typeof raw !== 'string') continue
      const text = raw.replace(/\s+/g, ' ').trim()
      if (!text || !/[A-Za-z0-9]/.test(text)) continue
      const key = clipKey(text)
      const hit = this.lines.get(key)
      if (!hit) { this.lines.set(key, { text, kind, chapters: [chapter] }); continue }
      if (!hit.chapters.includes(chapter)) hit.chapters.push(chapter)
      if (ORDER.indexOf(kind) < ORDER.indexOf(hit.kind)) hit.kind = kind      // keep the higher priority
    }
  }

  /** What SkillBeat speaks on every scored round: `beat.say ?? beat.prompt`, over a sweep of draws. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fromBeat(chapter: string, beat: Beat<any>, draws = Number(process.env.VOICE_DRAWS ?? 1500)) {
    const cov = beat.coverage?.all ?? []
    for (let i = 0; i < draws; i++) {
      const d = ((i % 3) + 1) as 1 | 2 | 3
      let data: unknown
      try { data = beat.make(d, i % beat.rounds, cov.slice(0, i % (cov.length + 1))) } catch { continue }
      if (data == null) continue
      try { this.add(chapter, 'scored', (beat.say ?? beat.prompt)(data)) } catch { /* prompt may need render state */ }
    }
  }

  /**
   * Render the beat's Reteach with the speaker stubbed and keep what it SAYS — over a sweep of
   * `beat.make` draws, plus any fixed `extra` rounds (the chapter's opening demo, which runs the same
   * component on hand-picked data). No template is copied: the component speaks its own words.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async fromReteach(chapter: string, beat: Beat<any>, extra: { kind: Bucket; data: unknown }[] = [],
    draws = Number(process.env.VOICE_RETEACH_DRAWS ?? 120)) {
    if (!beat.Reteach) { this.holes.add(chapter + ' (declares no Reteach)'); return }
    const React = await import('react')
    const { createRoot } = await import('react-dom/client')
    const cov = beat.coverage?.all ?? []
    const jobs: { kind: Bucket; data: unknown }[] = [...extra]
    for (let i = 0; i < draws; i++) {
      const d = ((i % 3) + 1) as 1 | 2 | 3
      try { const data = beat.make(d, i % beat.rounds, cov.slice(0, i % (cov.length + 1))); if (data != null) jobs.push({ kind: 'reteach', data }) } catch { /* skip */ }
    }
    let got = 0, fail = ''
    for (const job of jobs) {
      spoken.length = 0
      const host = document.createElement('div')
      document.body.appendChild(host)
      const root = createRoot(host)
      try {
        await React.act(async () => { root.render(React.createElement(beat.Reteach!, { data: job.data, onDone: () => {} })) })
        this.add(chapter, job.kind, ...spoken)
        if (spoken.length) got++
      } catch (e) { fail = String(e).split('\n')[0].slice(0, 160) }
      try { await React.act(async () => { root.unmount() }) } catch { /* ignore */ }
      host.remove()
    }
    if (!got) this.holes.add(chapter + (fail ? ' — ' + fail : ' — mounted, said nothing'))
  }
}

export const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i)

/**
 * jsdom has no ResizeObserver, and `FitBox`/`FitSlot` size themselves from one — without it three
 * 6–8 chapters threw on mount and read as "this re-teach says nothing". Reports one plausible box.
 */
export function polyfillResizeObserver() {
  if (typeof globalThis.ResizeObserver !== 'undefined') return
  globalThis.ResizeObserver = class {
    constructor(private cb: ResizeObserverCallback) {}
    observe(t: Element) {
      const r = { width: 800, height: 450, top: 0, left: 0, bottom: 450, right: 800, x: 0, y: 0 }
      this.cb([{ target: t, contentRect: r as DOMRectReadOnly } as ResizeObserverEntry], this)
    }
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

/**
 * Seed `Math.random` so a rebuild draws the SAME rounds and the corpus does not churn — every new
 * key is a clip to render, so a re-run that reshuffled the sample would re-bill the whole tail.
 * (mulberry32; the chapters' generators all draw through Math.random.)
 */
export function seedRandom(seed: number) {
  let a = seed >>> 0
  Math.random = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
