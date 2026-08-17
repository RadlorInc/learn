'use client'
/**
 * StoryWorld — the 3–5 "story mode" engine.
 *
 * A world is an ordered list of scenes. Milo walks the path with a goal; between
 * scenes a short walk transition plays; friends collected accumulate in his party.
 * See docs/story-mode-3-5.md.
 *
 * The pedagogy is NOT in the story — it's in <SkillBeat>, which every skill scene
 * uses. SkillBeat owns the non-negotiables (adaptive difficulty + in-story
 * re-explanation + warm wrong-answers), so they're present in every scene by
 * construction, no matter how the story changes.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { speak, stopSpeech } from '@/infra/useMiloSpeaker'
import { useAdaptive } from '@/shared/hooks/useAdaptive'
import { type Difficulty } from '@/core/progression'
import { makeDistinct } from '@/core/questionVariety'
import { type ChapterType } from '@/core/chapters'
import { CSS as KIT_CSS } from '../lessons/_kit'
import { Backdrop, type BackdropKind } from './art'
import MiloSprite from './MiloSprite'
import { useLatestRef } from '@/shared/hooks/useLatestRef'

const STORY_CSS = `
@keyframes s_walk { 0%,100%{transform:translateY(0) rotate(-2deg)} 50%{transform:translateY(-10px) rotate(2deg)} }
@keyframes s_bobIn { 0%{transform:translateY(18px) scale(.8);opacity:0} 100%{transform:translateY(0) scale(1);opacity:1} }
@keyframes s_pathMove { from{background-position-x:0} to{background-position-x:-120px} }
@keyframes s_twinkle { 0%,100%{opacity:.55;transform:scale(.9)} 50%{opacity:1;transform:scale(1.12)} }
`

/** Wrong-in-a-row before Milo re-explains. It was an optional field with a default of 2, and
 *  all 34 chapters passed 3 — so it was never a knob, only a number written 34 times. */
export const RETEACH_AFTER = 3

// ─── A skill round: data + how to play it + how Milo re-teaches it ──
export interface Beat<T> {
  skillId: ChapterType
  rounds: number
  walkEvery?: number                     // play a short walk interlude every N rounds,
                                         // so a long practice feels like a journey
  walkBeforeRound?: (round: number) => boolean   // play a walk interlude right BEFORE
                                         // these rounds (e.g. when the scene/biome
                                         // changes), so a change always reads as
                                         // "Milo travelled there". Overrides walkEvery.
  make: (d: Difficulty, round?: number, asked?: readonly string[]) => T
                                         // `round` lets one practice vary by round (e.g. rotate the
                                         // biome) while staying ONE adaptive sequence. `asked` is the
                                         // list of `coverage.of` values already served this run — only
                                         // populated when the beat declares `coverage`, and it exists
                                         // so a generator can spend a scarce round on something the
                                         // child has NOT met yet instead of drawing at random.
  /**
   * A CLOSED SET this chapter must cover before the mastery early-exit is allowed to end the run.
   *
   * ⚠️ WHY THIS EXISTS. Mastery fires at the top tier on a streak of 6, and promotion takes 3 correct
   * per tier — so a child who answers well is asked roughly three questions at L1, ONE at L2 and TWO
   * at L3, and then the chapter ends. For a chapter whose hardest idea only unlocks at L3 that means
   * the idea is asked twice at best and, measured on TickTock, missed entirely about a third of the
   * time. Which is the craft doc's own rule: *if a chapter teaches a closed set, every member must
   * appear before mastery can fire.*
   *
   * OPT-IN: a beat that does not declare `coverage` behaves exactly as before, so no other chapter in
   * the band changes. And the cost is bounded — withholding the early exit only ever means playing the
   * full `rounds`, never a hang, because the run still ends at `rounds` regardless.
   */
  coverage?: {
    /** Which member of the set this round is an instance of. */
    of: (data: T) => string
    /** Every member that must have been asked before an early finish is honoured. */
    all: readonly string[]
  }
  /**
   * This beat gives its OWN wrong-answer feedback, so SkillBeat draws no generic pill and speaks no
   * generic encouragement on a miss.
   *
   * ⚠️ WHY THIS EXISTS. The shared cue is a solid pill pinned dead centre of the viewport, which is
   * fine in a chapter whose play surface is being replaced anyway — and wrong in one that retries
   * IN PLACE over the thing being read. TickTock lands it on the clock face while saying *"Let's look
   * together"*, i.e. it covers the one thing it is asking the child to look at. Worse, that chapter
   * handles its own retry loop and only ever reports a round once it has been solved, so the pill and
   * the spoken encouragement arrive on top of its own *"That's right — half past six!"* and
   * contradict it.
   *
   * OPT-IN, so the other chapters in the band are untouched — they write no feedback of their own and
   * the centred pill is the only thing that says anything. A beat that sets this owes the child a
   * WRITTEN miss line of its own (`hintFor` in TickTock's case); speech alone is silence on the many
   * devices with no usable voice. The re-teach after RETEACH_AFTER misses still fires either way.
   */
  ownsFeedback?: boolean
  sig?: (data: T) => string              // dedupe key for makeDistinct — return a
                                         // signature of the MATH only (not the scene,
                                         // sprite, or shuffled choice order), so the
                                         // same question isn't re-asked just because the
                                         // dressing changed. Defaults to a full-object
                                         // JSON sig, which over-counts cosmetic variety.
  prompt: (data: T) => string            // shown on screen
  say?: (data: T) => string              // spoken by Milo (defaults to prompt). Use
                                         // a different `say` when the answer must be
                                         // HEARD not read (e.g. number-recognition doors).
  Play: React.FC<{ data: T; onSubmit: (correct: boolean) => void }>
  Reteach: React.FC<{ data: T; onDone: () => void }>
}

export type Scene =
  | { kind: 'intro'; bg: string; backdrop: BackdropKind; bubble: string }
  | { kind: 'skill'; bg: string; backdrop: BackdropKind; bubble: string; friend?: { emoji: string; name: string }; beat: Beat<any> } // eslint-disable-line @typescript-eslint/no-explicit-any
  | { kind: 'payoff'; bg: string; backdrop: BackdropKind; bubble: string }

export interface World { id: string; title: string; scenes: Scene[] }

/**
 * The bookkeeping every story chapter needs and none of them differ on: where "back"
 * goes, the running tally, and the guard that stops a chapter finishing twice. It was
 * written out identically in all 34, which meant a fix to any of it (the double-finish
 * guard, the stopSpeech on the way out) had to be applied 34 times or not at all.
 *
 * `onLeave` is the one real variation — an AR chapter has a camera to shut down, and it
 * must be shut down on BOTH exits, which is exactly the pair a copy is liable to get
 * half-right.
 *
 * The tally stays INSIDE: every chapter accumulated it with the identical expression and
 * then handed its own running totals straight back, so `tally` IS a SkillBeat `onComplete`.
 * (Keeping the ref in here is also what lets a chapter stop reaching into a hook's ref
 * during render, which the newer react-hooks rules correctly refuse.)
 */
export function useChapterShell(
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void,
  onExit?: () => void,
  onLeave?: () => void,
) {
  const router = useRouter()
  const result = useRef({ correct: 0, wrong: 0 })
  const finished = useRef(false)
  const exit = useCallback(() => {
    stopSpeech(); onLeave?.()
    ;(onExit ?? (() => router.push('/menu')))()
  }, [router, onExit, onLeave])
  const finishChapter = useCallback((c: number, w: number, mastered?: boolean) => {
    if (finished.current) return
    finished.current = true
    stopSpeech(); onLeave?.()
    if (onFinish) onFinish(c, w, mastered); else exit()
  }, [onFinish, exit, onLeave])
  /** A SkillBeat `onComplete`: add this beat's score to the run's, then finish the chapter. */
  const tally = useCallback((c: number, w: number, mastered?: boolean) => {
    result.current.correct += c
    result.current.wrong += w
    finishChapter(result.current.correct, result.current.wrong, mastered)
  }, [finishChapter])
  return { exit, finishChapter, tally }
}

// ─── SkillBeat: the unbreakable pedagogy core ──────────────────
// Runs `rounds` adaptive rounds. Warm wrong-answers (no red X). On a 2-wrong
// streak, Milo re-explains in-story, then the child retries.
export function SkillBeat({ beat, onComplete, onInterlude, onRound }: { beat: Beat<any>; onComplete: (correct: number, wrong: number, mastered?: boolean) => void; onInterlude?: () => Promise<void>; onRound?: (data: any, round: number) => void }) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const ada = useAdaptive(beat.skillId)
  const adaRef = useLatestRef(ada)
  const [roundIdx, setRoundIdx] = useState(0)
  const [phase, setPhase] = useState<'play' | 'feedback' | 'reteach' | 'interlude'>('play')
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [wrongRun, setWrongRun] = useState(0)
  const tally = useRef({ correct: 0, wrong: 0 })   // reported to onComplete → drives XP
  const seen = useRef<Set<string>>(new Set())      // question signatures already asked this session
  // Which members of `beat.coverage.all` have been ASKED. Fed back into `make` so a generator can
  // spend a scarce round on something unmet, and used to withhold the early exit until the set is done.
  const asked = useRef<string[]>([])

  // ONE data object per round. Must be stable across re-renders (it holds the
  // random target), or the Play UI and the answer-check would disagree and the
  // round could never complete. Difficulty is read at round start; `roundIdx` lets
  // the beat rotate the scene (biome) while staying one continuous practice.
  // makeDistinct re-rolls to avoid repeating a question already asked this session.
  const data = useMemo(() => makeDistinct(() => beat.make(adaRef.current.difficulty, roundIdx, asked.current), seen.current, beat.sig), [roundIdx, beat])

  // Announce each new round, and let the host react to it (e.g. follow the biome).
  useEffect(() => {
    // Record what this round covers BEFORE it is played, because "asked" is the claim being made —
    // a member the child got wrong has still been met, and re-asking it is what the retry is for.
    if (beat.coverage) {
      const k = beat.coverage.of(data)
      if (k && !asked.current.includes(k)) asked.current = [...asked.current, k]
    }
    onRound?.(data, roundIdx)
    speak((beat.say ?? beat.prompt)(data))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIdx])

  const onSubmit = useCallback((correct: boolean) => {
    if (phase !== 'play') return
    const res = ada.record(correct)
    if (correct) tally.current.correct++; else tally.current.wrong++
    setFeedback(correct ? 'correct' : 'wrong')
    setPhase('feedback')
    const newRun = correct ? 0 : wrongRun + 1
    setWrongRun(newRun)
    // No spoken compliment on a correct answer — a tick is enough (kids don't need praise every
    // question). Only gently encourage on a wrong one — and not at all where the beat has already
    // said something specific, or the generic line lands on top of it and cancels it.
    if (!correct && !beat.ownsFeedback) speak(ada.encouragement)
    window.setTimeout(() => {
      setFeedback(null)
      if (!correct && newRun >= RETEACH_AFTER) { setPhase('reteach'); return }
      // Demonstrated mastery (top tier + a long correct streak) → finish early
      // with full stars, skipping the repetitive tail.
      // ⚠️ UNLESS the beat declares a closed set that has not been covered yet: finishing early on a
      // streak is a reward for being good at the questions ASKED, and it must not be a way to leave
      // without ever being asked the hardest thing the chapter teaches. Bounded — the run still ends
      // at `beat.rounds` either way, so the worst case is playing the full set.
      const covered = !beat.coverage || beat.coverage.all.every(k => asked.current.includes(k))
      if (res.mastered && covered) { onComplete(tally.current.correct, tally.current.wrong, true); return }
      const next = roundIdx + 1
      if (next >= beat.rounds) { onComplete(tally.current.correct, tally.current.wrong); return }
      // Storyline interlude: Milo walks a few steps before certain rounds (a scene/
      // biome change), or every `walkEvery` rounds. The adaptive streak/tally carry
      // across it untouched.
      const wantWalk = beat.walkBeforeRound ? beat.walkBeforeRound(next) : !!(beat.walkEvery && next % beat.walkEvery === 0)
      if (onInterlude && wantWalk) {
        setPhase('interlude')
        onInterlude().then(() => { setPhase('play'); setRoundIdx(next) })
        return
      }
      setPhase('play'); setRoundIdx(next)
    }, 1300)
  }, [phase, ada, wrongRun, roundIdx, beat, onComplete, onInterlude])

  const finishReteach = useCallback(() => {
    setWrongRun(0)
    const next = roundIdx + 1
    if (next >= beat.rounds) onComplete(tally.current.correct, tally.current.wrong)
    else { setPhase('play'); setRoundIdx(next) }
  }, [roundIdx, beat, onComplete])

  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* Progress bar for a longer practice — shows how much is left to finish. */}
      {beat.rounds >= 3 && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 9, zIndex: 25, background: 'rgba(255,255,255,.45)' }}>
            <div style={{ height: '100%', width: `${Math.round((roundIdx / beat.rounds) * 100)}%`, transition: 'width .45s ease',
              background: 'linear-gradient(90deg,var(--garden-green),var(--garden-green-deep))', borderRadius: '0 6px 6px 0' }} />
          </div>
          <div style={{ position: 'fixed', top: 14, right: 16, zIndex: 25, background: 'var(--paper)', border: '3px solid var(--garden-green)', borderRadius: 999,
            padding: '3px 14px', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 16, color: 'var(--garden-green-deep)' }}>
            {/* Just which question they are on — not "of 10". The bar above already shows how far
                along they are, and a visible total turns a game into a countdown. */}
            {Math.min(roundIdx + 1, beat.rounds)}
          </div>
        </>
      )}
      {/* The task is shown AND spoken. Tapping replays Milo's voice — a tap is a
          user gesture, so it reliably plays even if autoplay was blocked. */}
      {(phase === 'play' || phase === 'feedback') && beat.prompt(data).trim() && (
        <button onClick={() => speak((beat.say ?? beat.prompt)(data))} aria-label="Hear it again"
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19, color: 'var(--milo-orange)',
            background: 'var(--paper)', border: '3px solid var(--milo-orange)', borderRadius: 999, padding: '8px 20px', textAlign: 'center', boxShadow: '0 4px 0 rgba(242,107,44,.25)' }}>
          <span>{beat.prompt(data)}</span>
        </button>
      )}
      {phase === 'reteach'
        ? <beat.Reteach data={data} onDone={finishReteach} />
        : phase === 'interlude'
          ? null
          : <beat.Play key={roundIdx} data={data} onSubmit={onSubmit} />}
      {/* Correct = just a quiet green tick (no "Yes!" celebration, no spoken praise). Wrong keeps a
          gentle nudge. */}
      {feedback === 'correct' && (
        <div style={{ position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 60,
          width: 96, height: 96, borderRadius: '50%', background: 'var(--garden-green)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 58, fontWeight: 900, lineHeight: 1,
          border: '5px solid var(--outline)', boxShadow: '0 8px 0 rgba(61,37,22,.2)', animation: 'k_bounceIn .4s cubic-bezier(.34,1.56,.64,1) both' }}>✓</div>
      )}
      {feedback === 'wrong' && !beat.ownsFeedback && (
        <div style={{ position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 60,
          background: 'var(--milo-orange)', color: '#fff',
          fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 30, padding: '14px 36px', borderRadius: 24,
          border: '4px solid var(--outline)', boxShadow: '0 8px 0 rgba(61,37,22,.2)', animation: 'k_bounceIn .4s cubic-bezier(.34,1.56,.64,1) both' }}>
          Let&apos;s look together! 🙂
        </div>
      )}
    </div>
  )
}

// ─── Walk transition between scenes ────────────────────────────
function WalkTransition({ onDone }: { onDone: () => void }) {
  const ran = useRef(false)
  useEffect(() => {
    if (ran.current) return; ran.current = true
    const id = window.setTimeout(onDone, 2400)   // long enough to see the walk
    return () => window.clearTimeout(id)
  }, [onDone])
  return (
    <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      backgroundImage: 'repeating-linear-gradient(90deg, var(--garden-green-soft) 0 60px, var(--sky-blue-soft) 60px 120px)',
      backgroundSize: '120px 100%', animation: 's_pathMove .5s linear infinite', borderRadius: 22 }}>
      <div style={{ width: '85%', maxWidth: 320, height: '92%' }}><MiloSprite play /></div>
    </div>
  )
}

// ─── Party (friends collected so far) ──────────────────────────
function Party({ friends }: { friends: { emoji: string; name: string }[] }) {
  if (!friends.length) return null
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {friends.map((f, i) => (
        <span key={i} title={f.name} style={{ fontSize: 24, animation: 's_bobIn .4s ease both' }}>{f.emoji}</span>
      ))}
    </div>
  )
}

// ─── The world orchestrator ────────────────────────────────────
export default function StoryWorld({ world, onExit }: { world: World; onExit?: () => void }) {
  const router = useRouter()
  const [idx, setIdx] = useState(0)
  const [walking, setWalking] = useState(false)
  const [friends, setFriends] = useState<{ emoji: string; name: string }[]>([])
  const scene = world.scenes[idx]

  // Speak the scene bubble when a (non-walking) scene appears.
  useEffect(() => {
    if (walking) return
    speak(scene.bubble)
    return () => stopSpeech()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, walking])

  const advance = useCallback(() => {
    if (scene.kind === 'skill' && scene.friend) setFriends(f => [...f, scene.friend!])
    if (idx >= world.scenes.length - 1) { stopSpeech(); (onExit ?? (() => router.push('/menu')))(); return }
    setWalking(true)
  }, [scene, idx, world.scenes.length, onExit, router])

  const arrive = useCallback(() => { setWalking(false); setIdx(i => i + 1) }, [])

  return (
    <div className="milo-lesson" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: scene.bg, padding: '10px 14px 22px', gap: 10 }}>
      <style>{KIT_CSS}{STORY_CSS}</style>

      {/* Header: exit + progress dots + party */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', maxWidth: 540, paddingTop: 6 }}>
        <button onClick={() => { stopSpeech(); (onExit ?? (() => router.push('/menu')))() }}
          style={{ padding: '7px 14px', borderRadius: 50, flexShrink: 0, background: 'var(--paper)', border: '3px solid var(--milo-orange)',
            color: 'var(--milo-orange)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, cursor: 'pointer', boxShadow: '0 3px 0 rgba(242,107,44,.25)' }}>← Menu</button>
        <div style={{ display: 'flex', gap: 4, flex: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
          {world.scenes.map((_, i) => (
            <div key={i} style={{ width: i === idx ? 22 : 8, height: 8, borderRadius: 4, transition: 'all .3s ease',
              background: i < idx ? 'var(--garden-green)' : i === idx ? 'var(--milo-orange)' : 'rgba(61,37,22,.12)' }} />
          ))}
        </div>
        <Party friends={friends} />
      </div>

      {/* Milo + speech bubble */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, width: '100%', maxWidth: 540 }}>
        <img src="/assets/characters/milo_idle.png" alt="Milo" decoding="async" loading="lazy"
          style={{ width: 64, height: 64, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 4px 8px rgba(61,37,22,.2))', animation: 's_walk 3s ease-in-out infinite' }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        <div style={{ background: '#fff', border: '3px solid var(--outline)', borderRadius: '18px 18px 18px 4px', padding: '10px 14px', flex: 1,
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--ink)', lineHeight: 1.4, boxShadow: '0 4px 0 rgba(61,37,22,.07)' }}>{scene.bubble}</div>
      </div>

      {/* Stage */}
      {walking ? <WalkTransition onDone={arrive} /> : (
        <div style={{ flex: 1, width: '100%', maxWidth: 540, border: '3px solid var(--outline)',
          borderRadius: 22, boxShadow: '0 5px 0 rgba(61,37,22,.07)', display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'flex-end', padding: 16, minHeight: 320, position: 'relative', overflow: 'hidden' }}>
          <Backdrop kind={scene.backdrop} />
          <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', flex: 1, paddingBottom: 8 }}>
            {scene.kind === 'skill'
              ? <SkillBeat beat={scene.beat} onComplete={advance} />
              : <IntroOrPayoff onNext={advance} kind={scene.kind} />}
          </div>
        </div>
      )}
    </div>
  )
}

function IntroOrPayoff({ onNext, kind }: { onNext: () => void; kind: 'intro' | 'payoff' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, position: 'relative' }}>
      {kind === 'payoff'
        ? <div style={{ fontSize: 90, animation: 'k_miloJump .8s ease-in-out infinite' }}>🎉</div>
        : <div style={{ width: 220, height: 220 }}><MiloSprite play={false} /></div>}
      <button onClick={onNext} style={{ padding: '16px 40px', borderRadius: 50, border: 'none', cursor: 'pointer',
        background: 'linear-gradient(135deg,var(--milo-orange) 0%,var(--milo-orange-deep) 100%)', color: '#fff',
        fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, boxShadow: '0 6px 18px rgba(242,107,44,.4)' }}>
        {kind === 'payoff' ? 'Yay! 🌟' : "Let's go! ▶"}
      </button>
    </div>
  )
}
