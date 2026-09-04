'use client'
/**
 * THE 12–18 BAND'S CHALKBOARD, SHARED BY THE 9–11 CHAPTERS THAT TEACH ON ONE.
 *
 * ⚠️ EXTRACTED FROM `OrderDesk` VERBATIM WHEN THE LONG LEVEL BECAME THE SECOND CONSUMER, which is the
 * same call `critters.tsx` and `yard.tsx` were made on: one consumer is not an abstraction, two is.
 * Copying it instead would mean two copies of the slab fix, the `--font-chalk` fix and the windowing —
 * so a correction would have to be applied twice or not at all. The Fundraiser's own 47-test gate is
 * what proves the move changed nothing, because it drives `stepBoardRect` unaltered.
 *
 * ⚠️ IT IS A FRAMED BOARD, NOT A SLATE RECTANGLE, and that is what answers the slab fault this repo
 * has shipped three times (BlockYard passes 1–3): a filled rect over a painting reads as UI
 * furniture, because paintings contain no filled rectangles. A wooden frame and a cast shadow make it
 * a thing hanging on a wall — which is what a school hall or a fundraiser hall has.
 *
 * ⚠️ AND `--font-chalk` LIVES ON `:root`. It was declared only inside `[data-band]`, so a 3–11
 * chapter reaching for it silently got the body font with nothing erroring — the documented trap that
 * kept this board out of the band. Gaegu was always loaded globally; only the token was scoped.
 *
 * The visual spec mirrors `teen/games/parts/gameKit`'s `Blackboard`. It is deliberately NOT that
 * component: that one takes a teen `Palette` for one colour and lives in the teen chunk, so importing
 * it here would drag the whole kit into a story chapter to borrow a border.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useViewport } from '@/shared/hooks/useViewport'
import { afterSpeech, speak } from '@/infra/useMiloSpeaker'
import { useLatestRef } from '@/shared/hooks/useLatestRef'

/** A short frame, the band-wide breakpoint. Lives here because both boards window on it. */
export const isShort = (vh: number) => vh < 470

const SLATE = 'linear-gradient(160deg, #21473c, #16302a)'
export const CHALK_GOLD = '#e7c26a'
export const chalkText = (size: string): React.CSSProperties => ({
  fontFamily: 'var(--font-chalk)', fontSize: size, fontWeight: 700, letterSpacing: '.02em',
  color: '#f6faf0', lineHeight: 1.3,
  textShadow: '0 0 1px rgba(255,255,255,.6), 0 1px 1px rgba(0,0,0,.28), 0 0 11px rgba(214,240,206,.4)',
})

/** The chalk write-on, left to right — the teen board's own idiom. Mount once per chapter. */
export const CHALK_CSS = `
@keyframes chalk_write { from { clip-path: inset(0 100% 0 0) } to { clip-path: inset(0 0 0 0) } }
@media (prefers-reduced-motion: reduce) { @keyframes chalk_write { from,to { clip-path: inset(0) } } }
`

export function Chalkboard({ label, children, style }: {
  label: string; children: React.ReactNode; style?: React.CSSProperties
}) {
  return (
    <div style={{
      boxSizing: 'border-box', background: SLATE, border: '4px solid #7a5230', borderRadius: 12,
      boxShadow: 'inset 0 0 26px rgba(0,0,0,.55), 0 8px 20px rgba(0,0,0,.4)',
      padding: 'clamp(10px,1.6vw,20px) clamp(14px,1.8vw,26px)',
      display: 'flex', flexDirection: 'column', gap: 'clamp(6px,1vw,12px)', ...style,
    }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(10px,.95vw,13px)', fontWeight: 900,
        letterSpacing: '.16em', textTransform: 'uppercase', color: CHALK_GOLD }}>{label}</div>
      {children}
    </div>
  )
}

/**
 * ⚠️ "I'VE GOT IT" IS THE TEEN BAND'S WORDING AND ITS SHAPE — QUIET, and off to one side. The
 * standing rule is that a big control on a first run is a skip button wearing a different label, so
 * this is deliberately the smallest thing on the screen: a child looking at the board does not see
 * it, and a child who has already understood can leave.
 *
 * ⚠️ AND `onSkip` IS OPTIONAL AT EVERY CALL SITE THAT RENDERS A TEACHING BEAT, so a demo can offer it
 * and a re-teach cannot. A child who has just missed three in a row is exactly the one who must not be
 * handed a way past the explanation, and making that a TYPE rather than a flag means nobody has to
 * remember it.
 */
export function GotIt({ onSkip, style }: { onSkip: () => void; style?: React.CSSProperties }) {
  return (
    <button onClick={onSkip} style={{
      padding: '6px 14px', borderRadius: 999, cursor: 'pointer',
      border: '2px solid rgba(246,250,240,.45)', background: 'rgba(22,48,42,.75)', color: '#dbe9d6',
      fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, ...style,
    }}>I&rsquo;ve got it →</button>
  )
}

// ─── THE PLAN ───────────────────────────────────────────────────────────────────────────
/**
 * The 12–14 band's read-along opener: the chapter states its problem and its rule on one short board
 * before anything is worked, and Milo reads it while each word lights up.
 *
 * ⚠️ SELF-PACED, AND DELIBERATELY NOT `speakWithHighlight`. That helper resolves a pre-rendered clip
 * first and paces the highlight off the clip's real duration — but the 3–11 band has **zero** recorded
 * clips, so every use here takes its browser-TTS or blocked-audio branch, and Chrome very often ships
 * no usable voice at all. A read-along driven by speech events on a silent device is a chapter that
 * hangs on its own opening screen; that exact hang shipped once in TickTock and cost a session to
 * find, precisely because the preview pane is mute and always took the working path.
 *
 * ⚠️ `problem` AND `points` ARE PROPS, so each chapter states its own — the board is shared, the words
 * are not. Keep the problem to one question and the points to three short rules; the board caps at
 * 92dvh and a fourth point is what pushes a short frame into overflow.
 */
export function ThePlan({ problem, points, onDone, onSkip }: {
  problem: string; points: readonly string[]; onDone: () => void; onSkip: () => void
}) {
  const { w: vw } = useViewport()
  const words = useMemo(() => [problem, ...points].join(' ').split(' ').filter(Boolean), [problem, points])
  const [lit, setLit] = useState(-1)
  const doneRef = useLatestRef(onDone)

  useEffect(() => {
    let alive = true
    let waiting: (() => void) | null = null
    const timers: number[] = []
    speak([problem, ...points].join(' '))
    let i = 0
    const run = () => {
      if (!alive) return
      setLit(i)
      // ⚠️ Per-word dwell from the word's own length, floored and capped — a two-letter word still
      // needs long enough to be seen, and the total has to land near a spoken line rather than race it.
      const w = words[i] ?? ''
      const t = window.setTimeout(() => {
        i++
        if (i < words.length) run()
        // ⚠️ The highlight walks at ~42ms a character and the plan is spoken as ONE utterance, so
        // the words run out well before Milo does — and whatever comes next (the walkthrough's own
        // narration) then cut the plan off mid-sentence. Wait for him, under a ceiling.
        else waiting = afterSpeech(() => { waiting = null; if (alive) window.setTimeout(() => alive && doneRef.current(), 1200) }, 12000)
      }, Math.max(190, Math.min(520, 70 + w.length * 42)))
      timers.push(t)
    }
    run()
    return () => { alive = false; waiting?.(); timers.forEach(window.clearTimeout) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  let n = -1
  /** Written in chalk, one word lighting as it is spoken — the teen board's read-along. */
  const render = (text: string, size: string) => (
    <span>{text.split(' ').filter(Boolean).map((w, k) => {
      n++
      const me = n
      return (
        <span key={k} style={{
          ...chalkText(size),
          // the lit word is BRIGHTER chalk rather than a coloured chip — a solid highlight block on
          // a slate board reads as a sticker on it
          color: me === lit ? '#fffdf2' : '#dbe9d6',
          textShadow: me === lit ? '0 0 2px #fff, 0 0 14px rgba(231,194,106,.85)' : chalkText(size).textShadow,
          opacity: me <= lit ? 1 : 0.28, transition: 'opacity .18s',
        }}>{w} </span>
      )
    })}</span>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'grid', placeItems: 'center',
      background: 'rgba(30,24,18,.55)', padding: 16 }}>
      <Chalkboard label="The plan" style={{ width: Math.min(vw * 0.86, 720), maxHeight: '92dvh', overflow: 'hidden' }}>
        <div>{render(problem, 'clamp(17px,2.3vw,28px)')}</div>
        {points.map((pt, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'clamp(7px,.9vw,11px)',
            alignItems: 'baseline' }}>
            <span aria-hidden style={{ color: CHALK_GOLD, fontWeight: 900 }}>▸</span>
            <span>{render(pt, 'clamp(14px,1.7vw,21px)')}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
          <GotIt onSkip={onSkip} />
        </div>
      </Chalkboard>
    </div>
  )
}

// ─── The written working ────────────────────────────────────────────────────────────────
/**
 * THE STEP BOARD — where the working gets written, one numbered line at a time, as it is spoken.
 * Same board as THE PLAN, same board as the re-teach; the teen band's "solving it, step by step".
 *
 * ⚠️ **WINDOWED, AND HARDER ON A SHORT FRAME.** A 10-step walkthrough accumulates more working than a
 * nine-year-old can hold, and an unbounded list grows the board over whatever it was placed to clear.
 * 2 lines on a short frame, 4 otherwise.
 */
export const stepWindow = (short: boolean) => (short ? 2 : 4)
/**
 * ⚠️ THE RECT ITSELF, EXPORTED, because a gate has to drive the SAME function the board lays itself
 * out with. A check that recomputes "bottom 10, this tall" is a second copy of the rule and would stay
 * green the moment someone pinned the board somewhere else — this repo's own recorded fault
 * (`laneMinW`, and the row-fit check that carried its own `vw * 0.34`).
 *
 * ⚠️ `anchorTop` EXISTS BECAUSE WHAT THE BOARD MUST CLEAR IS PER CHAPTER, and the band that is free
 * follows from that rather than from taste. The Fundraiser hangs it from the FLOOR: its answer boxes
 * are centred under the docket, so pinned top-left the board was drawn across them at 17 of 18
 * reachable size × column combinations, and a demo has no digit pad or control row so the bottom is
 * empty. The Long Level cannot: measured, the band below its painted path is 66/148/119px at
 * 640×320 / 1024×620 / 1920×800 against a board 68/152/152px tall — it does not fit at three of five
 * sizes, and forcing it would cover the path, which in a rounding chapter IS the number line. Its
 * chrome→name-board band is 84px at the worst size, so it hangs from the top instead.
 */
export function stepBoardRect(vw: number, vh: number, anchorTop?: number) {
  const short = isShort(vh)
  const h = (short ? 30 : 40) + stepWindow(short) * (short ? 19 : 28)
  const w = Math.round(Math.min(vw * 0.44, 420))
  const top = anchorTop ?? vh - 10 - h
  return { w, h, left: Math.round((vw - w) / 2), top, bottom: vh - top - h, short }
}

export function StepBoard({ lines, vw, vh, anchorTop }: {
  lines: string[]; vw: number; vh: number; anchorTop?: number
}) {
  const R = stepBoardRect(vw, vh, anchorTop)
  const short = R.short
  const first = Math.max(0, lines.length - stepWindow(short))
  const shown = lines.slice(first)
  const newest = shown.length - 1
  const line = short ? 19 : 28
  const chip: React.CSSProperties = {
    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: short ? 10 : 12,
    color: '#12241b', background: '#bcd8c9', width: line - 5, height: line - 5,
    borderRadius: 999, display: 'grid', placeItems: 'center', lineHeight: 1,
  }
  return (
    <Chalkboard label="Solving it, step by step"
      style={{
        position: 'fixed', left: R.left, top: R.top, zIndex: 46, width: R.w, height: R.h,
        padding: short ? '5px 10px' : '7px 14px', gap: 0, justifyContent: 'center',
      }}>
      {shown.map((l, i) => (
        <div key={`${first}-${i}`} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr',
          gap: 9, alignItems: 'center', height: line, opacity: i === newest ? 1 : 0.42 }}>
          <span style={chip}>{first + i + 1}</span>
          <span style={{ ...chalkText(short ? '14px' : '19px'), whiteSpace: 'nowrap', overflow: 'hidden',
            animation: i === newest ? `chalk_write ${Math.min(900, 40 + l.length * 26)}ms steps(${Math.max(4, l.length)}) both` : undefined,
          }}>{l}</span>
        </div>
      ))}
    </Chalkboard>
  )
}
