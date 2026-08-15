'use client'
/**
 * The 9–11 band's shared instrument parts.
 *
 * ⚠️ EXTRACTED ON THE SECOND USE, NOT THE FIFTH. Every chapter in this band answers with a
 * manipulative that carries its OWN key row — the shell's `answerPad` hides the instrument, and in
 * this band the child has to watch the thing fill as they enter. That pattern was written once for
 * The Coin Tray and was about to be copied into five more chapters, which is precisely how this
 * repo ended up with `boardBand` in four files and ~80 lines of camera wiring in seven.
 */
import React from 'react'
import type { Palette } from './gameKit'

/**
 * ⚠️ THE PIP AND KEY SIZES THE BAND IS AUTHORED AT, AND THEY ARE BIG ON PURPOSE. GameShell's
 * `FitSlot` runs at `max={1}` on a landscape frame — it only ever SHRINKS an instrument, never grows
 * one — where the old bespoke chapters scaled their boards UP to 2.2x. So a manipulative drawn at
 * the old sizes renders at those sizes for ever and floats in a third of the frame, which the
 * founder caught on a screenshot of The Coin Tray. Author at the size it should be READ at and let
 * the shell take it down: the countable thing is the last thing that should pay for the layout.
 */
export const PIP = 15
/** one key, and the gap between two — the row's own width comes from these and nothing else */
export const PAD = 58, PAD_GAP = 8

/**
 * The ten-key row an instrument carries.
 *
 * ⚠️ ITS WIDTH IS DERIVED FROM ITS KEYS, NEVER TYPED. A hand-typed cap was 14px short of the
 * enlarged keys and wrapped the last key onto a second row on a 1280 frame — measured, not
 * eyeballed. Ten keys plus nine gaps is the only width this row can need.
 * ⚠️ AND NOTHING HERE CHANGES COLOUR BEFORE THE COMMIT. A key that lights when it is the right one
 * is chapter 4's green Ready button: the child wins by watching the colour.
 */
export function KeyRow({ P, choices, onPick, disabled }: {
  P: Palette; choices: number[]; onPick: (n: number) => void; disabled?: boolean
}) {
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: PAD_GAP,
      maxWidth: `min(96vw, ${choices.length * PAD + (choices.length - 1) * PAD_GAP}px)`,
    }}>
      {choices.map(n => (
        <button key={n} onClick={() => onPick(n)} disabled={disabled} aria-label={`${n}`}
          style={{
            width: PAD, height: PAD, borderRadius: 14, cursor: disabled ? 'default' : 'pointer',
            fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 23, color: P.cream,
            background: P.glass, border: `1px solid ${P.gold}66`, opacity: disabled ? 0.45 : 1,
          }}>{n}</button>
      ))}
    </div>
  )
}

/** The one-line action under an instrument — what to do with your hands, right now. */
export function Cue({ P, text }: { P: Palette; text: string }) {
  return <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: P.creamSoft }}>{text}</span>
}

/** The band's palette — the pre-teen lab's violet, as a GameShell Palette. Shared, so ten chapters
 *  cannot drift into ten slightly different violets. */
export const KID_P: Palette = {
  nightTop: '#111A3C', nightBot: '#0A1026',
  cream: '#EAF1FF', creamSoft: '#A9B8D6',
  inkOnPaper: '#06121F', mutedOnPaper: '#6F80A6',
  gold: '#A06BFF', goldDeep: '#7F47EF',
  // the kit's CTA colour, pulled into the band's own family — a pink button on a violet lab reads
  // as borrowed from another chapter
  coral: '#E05CD8', coralDeep: '#B93AB0', mint: '#2EE6A6',
  glass: 'rgba(21,31,64,0.72)', glassBorder: 'rgba(120,150,220,0.30)',
}

/**
 * The latest value an instrument has, readable from inside a handler.
 *
 * ⚠️ TWO TAPS IN ONE REACT BATCH BOTH READ THE SAME RENDERED `value`, so on a two-place answer both
 * resolve to "the first place" and the second tap OVERWRITES the first instead of filling the
 * second. Children do tap that fast, and `setValue` being functional does not save it: the STATE
 * advances correctly and the closure the next tap runs is still the old one. This repo has met the
 * shape seven times.
 *
 * ⚠️ AND THE REF IS NEVER TOUCHED DURING RENDER, which is the naive fix and is what
 * `react-hooks/refs` forbids — a ref written while rendering can leave the component not updating.
 * It is keyed on the TASK instead: a new round makes the stored value stale, so `read()` falls back
 * to the freshly-rendered one without anything having to reset it.
 */
export function useLatest<T>(task: unknown, value: T) {
  const ref = React.useRef<{ t: unknown; v: T }>({ t: task, v: value })
  return {
    read: () => (ref.current.t === task ? ref.current.v : value),
    write: (v: T) => { ref.current = { t: task, v } },
  }
}
