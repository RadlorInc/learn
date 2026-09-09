/**
 * NO LINE OF MILO'S IS EVER CUT OFF BY THE NEXT ONE.
 *
 * Founder, 2026-09-04, across every band: *"kuch chapters mein voice aane lagti hai aur next chiz
 * aa jaati hai toh woh cut ho jaati hai"*. Two mechanisms, both invisible to every other check in
 * this repo because each half is individually correct:
 *
 *  ① `speakAfterCurrent` was gated on `_speaking`, which only turns true at the clip's `onStart` —
 *    one async manifest lookup plus an `audio.play()` promise after the call. A round advance calls
 *    it in the SAME TICK as the line it means to follow, so it read "nothing is playing" about a
 *    line already on its way and cancelled it. It could only ever work on a device with no clips.
 *  ② A beat advancing on a fixed timer (`t += line.length * 72`) speaks the next line whether or
 *    not the previous one has finished. The lessons wrote that cost down and shipped it.
 *
 * ⚠️ EVERY ASSERTION HERE WAS WATCHED FAILING ON THE REAL DEFECT before it was trusted — the
 * `_speaking` gate restored for ①, `speakPaced` replaced by a bare fixed-timer loop for ②. The
 * clip below is deliberately SLOWER than the caller's timer, because that is the only world in
 * which either fault exists; a fast clip passes both broken versions.
 *
 * The mock stands in for `speakLine` and records, per line, whether it started, whether it reached
 * its end, and whether it was cancelled before it did — which is the only thing a child can hear
 * the difference between.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const LOOKUP_MS = 40      // the async clip lookup — the window ① lived in
const CLIP_MS = 300       // how long the line takes to say

type Line = { text: string; started: boolean; done: boolean; cut: boolean }
const LOG: Line[] = []

vi.mock('@/infra/voiceClipPlayer', () => ({
  setClipOnly: () => {},
  setClipRate: () => {},
  unlockVoiceClips: () => {},
  stopClip: () => {},
  speakLine: (text: string, opts: { onStart?: () => void; onDone?: () => void; fallback: () => void }) => {
    const line: Line = { text, started: false, done: false, cut: false }
    LOG.push(line)
    const a = setTimeout(() => { line.started = true; opts.onStart?.() }, LOOKUP_MS)
    const b = setTimeout(() => { line.done = true; opts.onDone?.() }, LOOKUP_MS + CLIP_MS)
    return () => { clearTimeout(a); clearTimeout(b); if (!line.done) line.cut = true }
  },
}))

import { speak, speakAfterCurrent, speakPaced, afterSpeech } from '@/infra/useMiloSpeaker'

const wait = (ms: number) => new Promise(r => setTimeout(r, ms))
const spoken = () => LOG.map(l => l.text)
const cutOff = () => LOG.filter(l => l.cut).map(l => l.text)

beforeEach(() => {
  LOG.length = 0
  // jsdom has no speechSynthesis, and `_doSpeak` returns early without one.
  ;(window as unknown as { speechSynthesis: unknown }).speechSynthesis = {
    speak: () => {}, cancel: () => {}, getVoices: () => [], addEventListener: () => {},
    speaking: false, pending: false, paused: false,
  }
})

describe('a line that follows another waits for it', () => {
  /**
   * ⚠️ THE SAME TICK IS THE WHOLE POINT. GameShell's `finishDemo` speaks "Your turn" and then calls
   * `loadTask`, which speaks the question — synchronously, one statement later. Split across a
   * timer this passed even when broken.
   */
  it('speakAfterCurrent called in the same tick does not cut the line it follows', async () => {
    speak('Your turn, Ava.')
    speakAfterCurrent('How many are left in the tray?')
    await wait(LOOKUP_MS + CLIP_MS + 600)
    expect(cutOff()).toEqual([])
    expect(spoken()).toEqual(['Your turn, Ava.', 'How many are left in the tray?'])
    expect(LOG.every(l => l.done)).toBe(true)
  })

  it('still queues when it is called after the line has really started', async () => {
    speak('It was fourteen.')
    await wait(LOOKUP_MS + 40)
    speakAfterCurrent('Nearly — have another go.')
    await wait(CLIP_MS + 600)
    expect(cutOff()).toEqual([])
    expect(spoken()).toEqual(['It was fourteen.', 'Nearly — have another go.'])
  })

  /**
   * POSITIVE CONTROL FOR THE OTHER DIRECTION. `speak()` must still SUPERSEDE — a child tapping
   * 1, 2, 3 hears the newest number, not a queue trailing behind their finger. A "fix" that
   * queued everything would pass every test above and break counting in nine chapters.
   */
  it('speak() still cuts in — superseding is what a tap needs', async () => {
    speak('one')
    speak('two')
    await wait(LOOKUP_MS + CLIP_MS + 300)
    expect(cutOff()).toEqual(['one'])
    expect(LOG[1].done).toBe(true)
  })

  /**
   * ⚠️ THREE LINES LAND BACK-TO-BACK ON AN ORDINARY ROUND and the queue has to hold all of them:
   * the chapter's own verdict, the shell's praise, then the next question. Written as one callback
   * per waiter, the end of the FIRST line woke all of them at once and the last to run cancelled
   * the other two — a queue that only works one deep, which is the same defect one line further on.
   */
  it('holds a whole run of queued lines, in order', async () => {
    speak('Five blocks! The log is five blocks long.')
    speakAfterCurrent('Great job!')
    speakAfterCurrent('How tall is the tree?')
    await wait((LOOKUP_MS + CLIP_MS + 220) * 3 + 400)
    expect(cutOff()).toEqual([])
    expect(spoken()).toEqual(['Five blocks! The log is five blocks long.', 'Great job!', 'How tall is the tree?'])
  })

  /**
   * ⚠️ A QUEUE IS A WAY OF RUNNING LATE, SO IT IS BOUNDED. A child who answers faster than Milo
   * talks would otherwise build a backlog and hear the commentary on the question before last.
   * Past two waiting, the OLDEST is dropped — the newest is the one that still describes the screen.
   */
  it('drops the stalest waiting line rather than running further and further behind', async () => {
    speak('The line being said.')
    speakAfterCurrent('stale one')
    speakAfterCurrent('stale two')
    speakAfterCurrent('the newest')
    await wait((LOOKUP_MS + CLIP_MS + 220) * 3 + 500)
    expect(spoken()).toEqual(['The line being said.', 'stale two', 'the newest'])
    expect(cutOff()).toEqual([])
  })

  /** A superseded line must not leave its queued follower behind to cancel the new one. */
  it('a queued line dies with the line it was queued behind', async () => {
    speak('First.')
    speakAfterCurrent('Second.')
    speakAfterCurrent('Third.')
    await wait(10)
    speak('Actually, this instead.')
    await wait(LOOKUP_MS + CLIP_MS + 600)
    expect(spoken()).toEqual(['First.', 'Actually, this instead.'])
    expect(LOG[1].done).toBe(true)
  })
})

describe('a self-paced walkthrough holds each beat open for the voice', () => {
  /**
   * The lessons dwell `max(2400, len * 72)` ms per line, which is under a real clip's length often
   * enough to matter — and the whole tail of the sentence is what goes. `speakPaced` waits for the
   * LATER of its own dwell and Milo actually stopping.
   */
  it('never cuts a line, even when the clip outlasts the dwell', async () => {
    const seen: number[] = []
    const lines = ['Look at the hour hand.', 'Now the minutes.', 'That is half past three.']
    await new Promise<void>(done => {
      speakPaced(lines, { onStep: i => seen.push(i), onDone: done, minMs: () => 60 })
    })
    expect(cutOff()).toEqual([])
    expect(seen).toEqual([0, 1, 2])
    expect(spoken()).toEqual(lines)
    expect(LOG.every(l => l.done)).toBe(true)
  })

  /** …and it still paces the VISUALS when there is no voice at all, rather than flashing past. */
  it('paces itself on the dwell when speech never starts', async () => {
    const seen: number[] = []
    const t0 = Date.now()
    await new Promise<void>(done => {
      speakPaced(['a', 'b'], { onStep: i => seen.push(i), onDone: done, minMs: () => 250 })
    })
    expect(seen).toEqual([0, 1])
    expect(Date.now() - t0).toBeGreaterThanOrEqual(400)
  })

  it('cancel stops it dead — no line speaks after the cleanup runs', async () => {
    const cancel = speakPaced(['one', 'two', 'three'], { minMs: () => 60 })
    await wait(30)
    cancel()
    await wait(900)
    expect(spoken()).toEqual(['one'])
  })
})

describe('afterSpeech', () => {
  it('fires when the line ends, not before', async () => {
    speak('A reasonably long sentence.')
    let at = 0
    afterSpeech(() => { at = Date.now() })
    const t0 = Date.now()
    await wait(LOOKUP_MS + CLIP_MS + 300)
    expect(at).toBeGreaterThan(0)
    expect(at - t0).toBeGreaterThanOrEqual(LOOKUP_MS + CLIP_MS - 30)
  })

  /**
   * ⚠️ THE CEILING IS NOT OPTIONAL. Chrome and Safari both start an utterance and then drop
   * `onend`; a wait that can only end on that event freezes the teaching on a device that HAS a
   * voice, which this repo has already shipped once.
   */
  it('fires on its ceiling when the end event never arrives', async () => {
    ;(window as unknown as { speechSynthesis: { speak: () => void } }).speechSynthesis.speak = () => {}
    speak('This one never reports finishing.')
    await wait(LOOKUP_MS + 20)
    let ran = false
    afterSpeech(() => { ran = true }, 150)
    await wait(400)
    expect(ran).toBe(true)
  })

  it('runs immediately when nothing is being said', async () => {
    let ran = false
    afterSpeech(() => { ran = true })
    await wait(30)
    expect(ran).toBe(true)
  })
})

/**
 * THE TWO SHELLS, PINNED AT THE SOURCE.
 *
 * Every one of these is a single word — `speak` vs `speakAfterCurrent` — that reverts to something
 * that reads as perfectly sensible and takes a line of Milo's away from every child in that band.
 * Nothing else in this repo can see it: both spellings type-check, both render identically, and the
 * difference is only audible on a device that has clips. Each was mutated back and watched failing.
 */
describe('the two engines queue their narration rather than cutting it', () => {
  const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
  const STORY = 'src/features/chapters/story/StoryWorld.tsx'
  const SHELL = 'src/features/chapters/teen/games/parts/GameShell.tsx'

  it('SkillBeat announces a round behind whatever is still being said', () => {
    // The round advances 1300ms after the verdict; most verdicts run longer than that.
    expect(read(STORY), 'the round question cuts the verdict off again')
      .toContain('speakAfterCurrent((beat.say ?? beat.prompt)(data))')
    expect(read(STORY), 'the shell speaks a round question over whatever is playing')
      .not.toContain('speak((beat.say ?? beat.prompt)(data))\n')
  })

  it('GameShell hands the guided round over without talking across it', () => {
    expect(read(SHELL), '"Your turn" cuts off the guided round\'s last words again')
      .toContain('speakAfterCurrent(`Your turn, ${childName}.`)')
  })

  /**
   * ⚠️ THE REVEAL AND THE RE-EXPLANATION MUST BE ONE SEQUENCE. As two `speakSteps` calls 1800ms
   * apart the second supersedes the first, so the child who has just missed three in a row has the
   * answer taken away mid-word by the explanation they earned.
   */
  it('GameShell says the reveal and the re-teach as ONE sequence', () => {
    const src = read(SHELL)
    expect(src, 'the re-teach is a second sequence again, so it cuts the reveal')
      .toContain('speakSteps([`It was ${config.revealText(task)}.`, ...task.work]')
    // Exactly two reveal-shaped calls: this one, and the no-re-teach branch's two-utterance form.
    expect(src.match(/speakSteps\(\[`It was \$\{config\.revealText\(task\)\}\.`/g)?.length).toBe(2)
  })
})
