'use client'
/**
 * Chapter (6–8) — FRACTIONS (skill `fractions`) as STORY MODE. The verb is **FIT IT**, per
 * docs/story-6-8-rethink.md §6.
 *
 * ⚠️ WHAT THIS REPLACED, AND WHY IT LOOKED FINE: the whole arrived already cut into equal parts with
 * one shaded, and the answer was one of three chips. *Equal* is the entire idea and it was the thing
 * being supplied; and because the numerator was pinned at 1 the answer was literally the number of
 * parts, so **deleting the shading left every question still answerable**. On the craft doc's "is it
 * alive" check it scored **1 of 4**: nothing arrived on its own legs, a tap sent nobody anywhere,
 * Milo floated in a corner with no job, and only the backdrop rotated.
 *
 * So: Milo holds out a piece and the child LAYS COPIES OF IT into the whole. Equality is not given,
 * it is discovered — copies of one piece are equal by construction, and a piece that does not fit a
 * whole number of times is not a fraction of the whole at all.
 *
 *   · **FIT rounds**  — the piece is given, the child finds the number.  "How many of these fit?"
 *   · **TAKE rounds** — the number is given, the child finds the piece.  "Which makes thirds?"
 *
 * ⚠️ THE PAYLOAD IS THAT A SMALLER PIECE FITS MORE TIMES — the reason 1/4 < 1/2 even though 4 > 2 —
 * and it is taught by an explicit LESSON before anything is scored, because it is counter-intuitive
 * and no amount of practice discovers it. The mechanic then embodies it: on a take round the wrong
 * piece is a real, reachable answer and `missFor` names the size relation at the moment it costs.
 *
 * ⚠️ NO NUMBER BEFORE COMMIT. The board never prints how many pieces are down and never names the
 * fraction while the child is laying — a readout that confirms the answer before the commit is the
 * teen band's month-dial fault. The notation appears in the reveal, as the summary of work done.
 *
 * The wholes are code-drawn SVG so any denominator divides exactly — the same "the math must be
 * exact" call the clock makes. All arithmetic, the order table and every layout band live in
 * [slice.ts](./slice.ts), which is what the gate drives. There is NO world picker: the shop opening
 * through to the party is the ARC across the ten rounds. Wrapped by game/FractionsChapter.tsx.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { speak, stopSpeech, unlockSpeech } from '@/infra/useMiloSpeaker'
import { getActiveLearner } from '@/data/supabase/useLearnerSession'
import { lessonSeen, markLessonSeen } from '@/infra/storage/lessonSeen'
import { SkillBeat, type Beat, useChapterShell } from './StoryWorld'
import { Arrive, SheetCell, inFlowJourney, hasSheet, aspectOf, CRITTER_CSS } from './critters'
/** ⚠️ A CONTACT SHADOW IS NOT DECORATION — it is the one cue that says a thing is standing IN the
 *  picture rather than lying ON it, and this chapter shipped without one under anybody. The founder
 *  read the result exactly as it was: "characters aur background blend nahi ho rahe". It rides
 *  INSIDE the travelling element, so it can never outrun the feet. */
import { Shadow } from './yard'
import { useNeedsRotate, RotateGate } from './RotateGate'
import { useViewport } from '@/shared/hooks/useViewport'
import {
  ORDERS, DENS, MILO, CHROME_PAD, menuBtn,
  makeFrRound, orderOf, piecesFor, perShare, isSolved, friendAt, friendsShown,
  askTextFor, revealFor, missFor, denWord, numWord, layoutFor, wholeSize,
  type Den, type FrRound, type Order, type Shape,
} from './slice'
import { useLatestRef } from '@/shared/hooks/useLatestRef'
import { SceneBg } from '@/shared/ui/SceneBg'

/**
 * How long a narrated line stays on screen. Derived from the sentence's own length so the pacing
 * roughly tracks a real voice without DEPENDING on one — the whole reason the lesson and the
 * re-teach are self-paced (see the long note in `Lesson`). One function, so the two cannot drift.
 */
const dwellFor = (s: string) => Math.max(2400, Math.round(s.length * 72))
/** A number word can open a narrated line, and `numWord` is lower case for mid-sentence use. */
const sentenceCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// ─── scene ────────────────────────────────────────────────────────────────────────────
function Scene({ slot }: { slot: number }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#f3ead8' }}>
      {ORDERS.map((o, i) => (
        <SceneBg key={o.scene} src={`/assets/backgrounds/${o.scene}`}
          priority={i === Math.min(slot, ORDERS.length - 1)}
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          style={{ opacity: i === Math.min(slot, ORDERS.length - 1) ? 1 : 0, transition: 'opacity .7s ease' }} />
      ))}
      {/* A soft wash, so a white bubble and a code-drawn whole read against any of the ten scenes. */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,248,232,.30), rgba(255,244,224,.10) 55%, rgba(90,64,40,.16))', pointerEvents: 'none' }} />
    </div>
  )
}

// ─── the whole ────────────────────────────────────────────────────────────────────────
const R2 = Math.PI / 180

/** One wedge of a round whole, `den` to a turn. */
function wedgePath(i: number, den: number, r = 46, cx = 50, cy = 50): string {
  const a0 = (i / den) * 360 - 90, a1 = ((i + 1) / den) * 360 - 90
  const x0 = cx + r * Math.cos(a0 * R2), y0 = cy + r * Math.sin(a0 * R2)
  const x1 = cx + r * Math.cos(a1 * R2), y1 = cy + r * Math.sin(a1 * R2)
  return `M ${cx} ${cy} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`
}
const wedgeMid = (i: number, den: number, rr: number) => {
  const a = ((i + 0.5) / den) * 360 - 90
  return { x: 50 + rr * Math.cos(a * R2), y: 50 + rr * Math.sin(a * R2) }
}

/**
 * The whole, with `laid` copies of a 1/`pieceDen` piece placed in it.
 *
 * ⚠️ IT STARTS EMPTY — an outline, uncut. That is the difference between this chapter and the one it
 * replaces: the partition is CONSTRUCTED by repeating one piece, so the parts are equal because they
 * are copies, not because the picture was drawn that way.
 *
 * ⚠️ AND AN OVERFLOWING PIECE IS DRAWN OUTSIDE, TILTED. "It does not fit" has to be visible, because
 * that is the proof the whole mechanic rests on — a piece that fits a whole number of times is a
 * fraction of the whole and one that does not is nothing.
 */
function Whole({ shape, colors, art, pieceDen, laid, w, h, lit, topping }: {
  shape: Shape; colors: Order['colors']; art: string; pieceDen: Den; laid: number
  w: number; h: number
  /** After the commit, ONE piece lights up — the one Milo takes. Never before. */
  lit?: boolean
  topping?: string
}) {
  const uid = React.useId()
  const inside = Math.min(laid, pieceDen)
  const over = Math.max(0, laid - pieceDen)
  const glow = lit ? 'drop-shadow(0 0 16px var(--sun-yellow))' : 'drop-shadow(0 6px 10px rgba(0,0,0,.3))'

  if (shape === 'bar') {
    const W = 100, H = 34, seg = W / pieceDen
    const gapX = inside > 1 ? 1.1 : 0
    return (
      <svg viewBox="-8 -10 116 56" style={{ width: w, height: h, filter: glow, display: 'block', overflow: 'visible' }}>
        <defs>
          {Array.from({ length: Math.max(inside, 1) }).map((_, i) => (
            <clipPath key={i} id={`${uid}-s${i}`}>
              <rect x={i * seg} y={0} width={seg} height={H} rx={2} />
            </clipPath>
          ))}
        </defs>
        {/* the empty board — a real surface waiting, never a dashed wireframe */}
        {!inside && (
          <g>
            <rect x={-3} y={-3} width={W + 6} height={H + 6} rx={6} fill="rgba(255,255,255,.58)" stroke="rgba(61,37,22,.30)" strokeWidth={2} />
            <rect x={2} y={2} width={W - 4} height={H - 4} rx={4} fill="rgba(255,255,255,.30)" stroke="rgba(61,37,22,.14)" strokeWidth={1.2} />
          </g>
        )}
        {Array.from({ length: inside }).map((_, i) => {
          const on = lit && i === 0
          const dx = (i - (pieceDen - 1) / 2) * gapX
          return (
            <g key={i} transform={`translate(${dx.toFixed(2)} 0)`} style={{ animation: 'sl_land .32s cubic-bezier(.34,1.56,.64,1) both' }}>
              <g clipPath={`url(#${uid}-s${i})`}>
                <image href={art} x={0} y={0} width={W} height={H} preserveAspectRatio="xMidYMid slice" />
                {on && <rect x={i * seg} y={0} width={seg} height={H} fill="var(--sun-yellow)" opacity={0.28} />}
              </g>
              <rect x={i * seg + 0.6} y={0.6} width={seg - 1.2} height={H - 1.2} rx={2} fill="none" stroke={colors.edge} strokeWidth={1.4} opacity={0.55} />
            </g>
          )
        })}
        {Array.from({ length: over }).map((_, i) => (
          <g key={`o${i}`} transform={`translate(${W + 4 + i * 8} ${-4}) rotate(14)`} opacity={0.92}>
            <g clipPath={`url(#${uid}-s0)`}><image href={art} x={0} y={0} width={W} height={H} preserveAspectRatio="xMidYMid slice" /></g>
            <rect x={0.6} y={0.6} width={seg - 1.2} height={H - 1.2} rx={2} fill="none" stroke="var(--milo-orange-deep)" strokeWidth={2.6} strokeDasharray="5 4" />
          </g>
        ))}
      </svg>
    )
  }

  /**
   * ⚠️ A REAL PIECE OF REAL FOOD, CUT EXACTLY — not a pie chart.
   *
   * The version this replaces drew flat SVG wedges in a flat colour, which is a DIAGRAM laid over a
   * painted scene: the same fault as BlockYard's brown slab and the shapes chapter's hairline ghost
   * house, and the founder rejected it on sight for the same reason. The old chapter's excuse for
   * geometry was that the math has to be exact — and it does — but exact and painted are not a
   * choice: the sprite is clipped BY the wedge, so the division is still arithmetic while what a
   * child sees is the actual pizza.
   *
   * Each piece is also nudged outwards along its own middle, so the parts read as separate PIECES
   * rather than as one undisturbed picture with lines drawn on it.
   */
  const gap = inside > 1 ? 1.6 : 0
  return (
    <svg viewBox="-12 -10 124 120" style={{ width: w, height: h, filter: glow, display: 'block', overflow: 'visible' }}>
      <defs>
        {Array.from({ length: Math.max(inside, 1) }).map((_, i) => (
          <clipPath key={i} id={`${uid}-w${i}`}><path d={wedgePath(i, pieceDen)} /></clipPath>
        ))}
      </defs>
      {/* the empty plate — a real surface waiting, never a dashed wireframe */}
      {!inside && (
        <g>
          <ellipse cx={50} cy={53} rx={49} ry={48} fill="rgba(255,255,255,.62)" stroke="rgba(61,37,22,.30)" strokeWidth={2} />
          <ellipse cx={50} cy={51} rx={41} ry={40} fill="rgba(255,255,255,.34)" stroke="rgba(61,37,22,.16)" strokeWidth={1.4} />
        </g>
      )}
      {Array.from({ length: inside }).map((_, i) => {
        const m = wedgeMid(i, pieceDen, gap)
        const on = lit && i === 0
        return (
          <g key={i} transform={`translate(${(m.x - 50).toFixed(2)} ${(m.y - 50).toFixed(2)})`}
            style={{ animation: 'sl_land .32s cubic-bezier(.34,1.56,.64,1) both' }}>
            <g clipPath={`url(#${uid}-w${i})`}>
              <image href={art} x={2} y={2} width={96} height={96} preserveAspectRatio="xMidYMid slice" />
              {on && <path d={wedgePath(i, pieceDen)} fill="var(--sun-yellow)" opacity={0.28} />}
            </g>
            <path d={wedgePath(i, pieceDen)} fill="none" stroke={colors.edge} strokeWidth={1.6} strokeLinejoin="round" opacity={0.55} />
          </g>
        )
      })}
      {/* a piece that does not fit is set down BESIDE the plate, tilted — "it does not fit" has to be
          visible, because that is the proof the whole mechanic rests on */}
      {Array.from({ length: over }).map((_, i) => (
        <g key={`o${i}`} transform={`translate(${88 + i * 10} ${16}) rotate(18) scale(0.46)`} opacity={0.92}>
          <g clipPath={`url(#${uid}-w0)`}><image href={art} x={2} y={2} width={96} height={96} preserveAspectRatio="xMidYMid slice" /></g>
          <path d={wedgePath(0, pieceDen)} fill="none" stroke="var(--milo-orange-deep)" strokeWidth={4} strokeDasharray="7 5" />
        </g>
      ))}
    </svg>
  )
}

/**
 * A pile, split into `laid` equal handfuls of `n / pieceDen` things.
 *
 * The same board as a shape — an outline that starts empty and fills with copies of ONE share — so
 * the child brings one gesture to both representations rather than learning two chapters.
 */
function Pile({ item, n, pieceDen, laid, w, h, lit }: {
  item: string; n: number; pieceDen: Den; laid: number; w: number; h: number; lit?: boolean
}) {
  const per = Math.max(1, Math.round(n / pieceDen))
  const inside = Math.min(laid, pieceDen)
  const over = Math.max(0, laid - pieceDen)
  const cols = per <= 2 ? per : per <= 4 ? 2 : 3
  const cell = Math.max(16, Math.floor(Math.min(w / (pieceDen * (cols + 0.9)), h / (Math.ceil(per / cols) + 0.9))))
  const share = (key: React.Key, on: boolean, spare = false) => (
    <div key={key} style={{
      display: 'grid', gridTemplateColumns: `repeat(${cols}, ${cell}px)`, gap: Math.max(2, cell * 0.09),
      padding: Math.max(4, cell * 0.18), borderRadius: 12,
      border: `3px ${spare ? 'dashed' : 'solid'} ${spare ? 'var(--milo-orange-deep)' : on ? 'var(--sun-yellow-deep)' : 'rgba(61,37,22,.35)'}`,
      background: on ? 'rgba(255,214,102,.8)' : 'rgba(255,255,255,.82)',
      transform: spare ? 'rotate(6deg)' : 'none',
      animation: 'sl_land .32s cubic-bezier(.34,1.56,.64,1) both',
    }}>
      {Array.from({ length: per }).map((_, i) => (
        <img key={i} src={`/assets/objects/${item}.png`} alt="" draggable={false} decoding="async" loading="lazy"
          style={{ width: cell, height: cell, objectFit: 'contain', display: 'block' }} />
      ))}
    </div>
  )
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: Math.max(5, cell * 0.28),
      maxWidth: w, minHeight: h, padding: Math.max(7, cell * 0.26), borderRadius: 18,
      // ⚠️ A TRAY, NOT A DASHED BOX. It was a hairline dashed outline with the word "empty" written
      // in it — the wireframe fault the shapes chapter already shipped, a blueprint laid over a
      // painted shop. A real surface with light on its rim reads as a thing on the counter.
      // ⚠️ NEARLY OPAQUE, NOT A WASH. At .5 the candy-shop shelves showed straight through it and the
      // pears were unreadable against a wall of jars — BlockYard's own recorded lesson, which this
      // ignored: a WORKING SURFACE, one the child manipulates things on, wants .9+. The scene is
      // already established by the backdrop; the tray's job is to hold what is being counted.
      border: '3px solid rgba(255,255,255,.9)',
      background: 'linear-gradient(180deg, rgba(255,252,246,.95), rgba(246,236,220,.93))',
      boxShadow: 'inset 0 2px 0 rgba(255,255,255,.85), 0 5px 12px rgba(40,26,14,.3)',
    }}>
      {inside === 0
        ? <span style={{ display: 'block', width: Math.max(60, cell * 2), height: Math.max(30, cell) }} />
        : Array.from({ length: inside }).map((_, g) => share(g, !!lit && g === 0))}
      {Array.from({ length: over }).map((_, i) => share(`o${i}`, false, true))}
    </div>
  )
}

// ─── the tray: a piece is a BUTTON, and tapping it lays one ───────────────────────────
/**
 * ⚠️ TAPPING A PIECE LAYS ONE. There is no select-then-place — that is two steps for a six-year-old
 * and the extra step teaches nothing. Tapping a DIFFERENT piece clears the board and starts again
 * with that one, so changing your mind is free and cannot leave a half-built mixture behind, which
 * the grader would then have to have an opinion about.
 *
 * The pieces are drawn at their true relative size, because that IS the payload: a third is visibly
 * smaller than a half, and choosing between them is the question on a take round.
 */
function PieceBtn({ shape, colors, den, side, onLay, disabled, active }: {
  shape: Shape; colors: Order['colors']; den: Den; side: number
  onLay: () => void; disabled?: boolean; active?: boolean
}) {
  const s = side
  return (
    <button onClick={onLay} disabled={disabled} aria-label={`one ${denWord(den)}`} style={{
      width: s, height: s, padding: 0, borderRadius: 12, cursor: disabled ? 'default' : 'pointer',
      background: active ? 'var(--sun-yellow-soft, #fff3cf)' : 'var(--paper)',
      border: `3px solid ${active ? 'var(--sun-yellow-deep)' : 'var(--outline)'}`,
      boxShadow: '0 4px 0 #c8ac79', opacity: disabled ? 0.45 : 1,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/*
        ⚠️ THE PIECES ARE DRAWN AT THEIR TRUE RELATIVE SIZE — a third is visibly smaller than a half —
        because on a take round choosing between them IS the question, and the size relation is the
        payload. So the box is the SAME for all three and only the piece inside it shrinks.

        The wedge is rotated to sit symmetric about vertical first. Drawn from its raw start angle it
        hangs in the top-right corner of a square box, which wastes most of the button and rendered
        as an unreadable sliver at 52px — caught on screen, not by the gate.
      */}
      <svg viewBox="2 2 96 52" style={{ width: s * 0.8, height: s * 0.8, display: 'block' }}>
        {shape === 'round'
          ? <g transform={`rotate(${-180 / den} 50 50)`}>
              <path d={wedgePath(0, den)} fill={colors.base} stroke={colors.edge} strokeWidth={3} strokeLinejoin="round" />
            </g>
          : <rect x={50 - 48 / den} y={14} width={96 / den} height={26} rx={4} fill={colors.base} stroke={colors.edge} strokeWidth={3} />}
      </svg>
    </button>
  )
}

/** A handful of `n / den` things, for a pile round. Same button, different contents. */
function HandBtn({ item, n, den, side, onLay, disabled, active }: {
  item: string; n: number; den: Den; side: number
  onLay: () => void; disabled?: boolean; active?: boolean
}) {
  const per = Math.max(1, Math.round(n / den))
  const cols = per <= 2 ? per : per <= 4 ? 2 : 3
  const cell = Math.floor((side * 0.72) / cols)
  return (
    <button onClick={onLay} disabled={disabled} aria-label={`${per} ${item}`} style={{
      width: side, height: side, padding: 0, borderRadius: 12, cursor: disabled ? 'default' : 'pointer',
      background: active ? 'var(--sun-yellow-soft, #fff3cf)' : 'var(--paper)',
      border: `3px solid ${active ? 'var(--sun-yellow-deep)' : 'var(--outline)'}`,
      boxShadow: '0 4px 0 #c8ac79', opacity: disabled ? 0.45 : 1,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${cell}px)`, gap: 1 }}>
        {Array.from({ length: per }).map((_, i) => (
          <img key={i} src={`/assets/objects/${item}.png`} alt="" draggable={false} decoding="async"
            style={{ width: cell, height: cell, objectFit: 'contain', display: 'block' }} />
        ))}
      </div>
    </button>
  )
}

// ─── shared chrome ────────────────────────────────────────────────────────────────────
type L = ReturnType<typeof layoutFor>

function Bar({ L: l, children }: { L: L; children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', left: l.barLeft, width: l.barW, bottom: l.barBottom, height: l.barH, zIndex: 40,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: l.short ? 7 : 12, flexWrap: 'nowrap',
    }}>{children}</div>
  )
}

/**
 * The question lives in a bubble at Milo's mouth — he is the one with an order to fill, so he is the
 * one who should be asking. Laid out as a BAND rather than floated at his head: anchored freely it
 * runs across the board on a narrow frame, putting the two things a child must read at once on top
 * of each other.
 */
function Bubble({ L: l, text }: { L: L; text: string }) {
  return (
    <div style={{
      position: 'fixed', left: l.bubbleLeft, width: l.bubbleW, top: l.bubbleTop, minHeight: l.bubbleH, zIndex: 42,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(255,255,255,.94)', border: '3px solid var(--outline)', borderRadius: 18,
      padding: l.short ? '5px 12px' : '8px 18px', boxShadow: '0 4px 0 rgba(61,37,22,.16)',
      fontFamily: 'var(--font-display)', fontWeight: 700, lineHeight: 1.15, textAlign: 'center',
      fontSize: l.short ? 13 : 17, color: 'var(--ink)',
    }}>
      {text}
      {/* the tail — what keeps the words visibly HIS rather than a banner pinned to the frame */}
      <span aria-hidden style={{
        position: 'absolute', bottom: -11, left: `${l.tailPct}%`, width: 0, height: 0,
        borderLeft: '10px solid transparent', borderRight: '10px solid transparent',
        borderTop: '11px solid var(--outline)',
      }} />
    </div>
  )
}

/**
 * How far off the frame's bottom edge Milo stands.
 *
 * ⚠️ NOT A MARGIN — it is the room his CONTACT SHADOW needs. `Shadow` sits 35% of its own height
 * below the feet it belongs to, so at `bottom: 0` the one cue that puts him on the floor rather than
 * on top of the picture is drawn under the viewport and clipped away: present in the DOM, invisible
 * on screen, which is the worst kind of fixed.
 */
const miloFloor = (miloH: number) => Math.round(miloH * 0.04)

/** Milo, and on a correct answer he WALKS OFF to deliver the order — the journey is the reward. */
function Milo({ L: l, leaving, resetKey, vw }: { L: L; leaving: boolean; resetKey: string | number; vw: number }) {
  const distPx = Math.round(vw - l.miloLeft + l.miloW * 0.4)
  const j = useMemo(() => inFlowJourney(MILO, l.miloH, distPx), [l.miloH, distPx])
  return (
    <div style={{ position: 'fixed', left: l.miloLeft, bottom: miloFloor(l.miloH), width: l.miloW, height: l.miloH, zIndex: 26, pointerEvents: 'none' }}>
      {/* ⚠️ `leave` must be conditional, not constant — with a constant `leave` and `ms={0}` Arrive
          starts at its DONE phase, and done-while-leaving means "already gone", so Milo is
          translated a whole screen right and simply never appears. Invisible, not misplaced. */}
      <Arrive dist={distPx} ms={leaving ? j.ms : 0} leave={leaving} resetKey={`${resetKey}|${leaving}`}>
        {moving => (
          <span style={{ display: 'block', position: 'relative', width: l.miloW, height: l.miloH }}>
            <Shadow w={Math.round(l.miloW * 0.72)} h={Math.round(l.miloH * 0.1)} />
            <span style={{ position: 'relative', zIndex: 1, display: 'block' }}>
              <SheetCell src={MILO} h={l.miloH} moving={moving} cycleScale={j.cycleScale}
                /* `milo_side.png` faces RIGHT, and right is the way he leaves — so never flipped. */
                facesLeft={false} breathe={!leaving} />
            </span>
          </span>
        )}
      </Arrive>
    </div>
  )
}

/** The pause before a friend sets off, so their arrival reads as caused by the piece just laid. */
const ARRIVE_BEAT = 320

/**
 * The friends waiting for a share — the reason a fraction exists at all in this chapter.
 *
 * ⚠️ THEY ARRIVE ON THEIR OWN LEGS AND LEAVE CARRYING A PIECE, which is what makes a round a story
 * rather than a board. On a TAKE round all of them are already waiting, so the count of friends IS
 * the denominator the child has to match. On a FIT round one MORE friend walks in for every piece
 * laid — so the child watches the answer assemble itself out of people, and "how many fit" and "how
 * many friends" turn out to be the same question.
 *
 * Their table is market.ts's, imported: the facing was paid for once already when a duck and a
 * squirrel shipped walking backwards.
 */
function Friends({ L: l, count, den, order, share, leaving, resetKey }: {
  L: L; count: number; den: Den; order: Order
  /** They are holding their piece. Split from `leaving` because the LESSON wants them standing
   *  there holding it while Milo talks about it — in a round the two happen together. */
  share: boolean
  leaving: boolean
  resetKey: string | number
}) {
  const n = Math.min(count, den)
  if (n <= 0) return null
  const slotW = l.friendsW / Math.max(den, 1)
  return (
    <div aria-hidden style={{
      position: 'fixed', left: l.friendsLeft, width: l.friendsW, bottom: l.friendsBottom,
      height: l.friendH * 1.5, zIndex: 27, pointerEvents: 'none',
    }}>
      {Array.from({ length: n }).map((_, i) => {
        const f = friendAt(i)
        const h = Math.round(l.friendH * f.scale)
        // in from off-frame right, and out the same way once they have their piece
        const dist = Math.round(l.friendsW - i * slotW + 80)
        const j = inFlowJourney(f.src, h, dist)
        return (
          <div key={i} style={{ position: 'absolute', left: i * slotW, bottom: 0, width: slotW, height: l.friendH * 1.5 }}>
            <div style={{ position: 'absolute', left: 0, bottom: 0, width: slotW, height: h }}>
              {/* In from off-frame RIGHT, so they walk leftward toward the counter and face it while
                  they wait; out to the right once they have their share. `facesLeft` is a FLIP, not a
                  fact about the art, so it is the sprite's own facing inverted while walking in. */}
              {/* ⚠️ A BEAT BEFORE THEY SET OFF, so a new friend arriving reads as a CONSEQUENCE of
                  the piece the child just laid rather than as part of the same movement. Without it
                  the walk-in starts in the same tick as the piece landing, the two motions merge,
                  and it reads as characters that were simply missing — which is what the founder
                  saw. Leaving is not delayed: by then the round is over and the wait is dead time. */}
              <Arrive dist={dist} ms={j.ms} delayMs={leaving ? 0 : ARRIVE_BEAT}
                leave={leaving} resetKey={`${resetKey}|${i}|${leaving}`}>
                {moving => (
                  <span style={{ display: 'block', position: 'relative', width: Math.round(h * aspectOf(f.src)), height: h }}>
                    <Shadow w={Math.round(h * aspectOf(f.src) * 0.7)} h={Math.round(h * 0.11)} />
                    {/* ⚠️ THE SHARE RIDES INSIDE THE TRAVELLING ELEMENT. Drawn as a sibling it stayed
                        on the counter while its owner walked off with nothing — the sibling-shadow
                        fault this repo has already shipped once: two things that must move as one
                        have to BE one element.

                        ⚠️ AND IT IS **HELD**, NOT HOVERED. It first sat at `bottom: h * 0.92` —
                        centred, above the head — which reads as a piece floating over somebody
                        rather than one they are carrying away, and carrying it away is the whole
                        point of the round. It now sits low and at the FRONT, overlapping the body
                        it belongs to and drawn in front of it.

                        Placed as a share of the sprite's own box rather than from a per-creature
                        anchor: the cast runs from a chick to a lamb, a measured mouth point per
                        sprite is what CoinShop needed for its keepers, and at half the creature's
                        height the piece is big enough that overlapping the front reads as carried
                        whatever the proportions. Front follows TRAVEL, not the art — they walk in
                        leftward and leave rightward, so `!leaving` is the facing.

                        ⚠️ LOW, AT THE FRONT FEET — NOT AT THE FRONT MIDDLE. On a quadruped the front
                        of the body IS the head, so a piece placed there at chest height lands
                        squarely on the muzzle and reads as stuck to the face rather than carried.
                        Down at the paws it reads as being carried off by every one of them, from a
                        chick to a lamb. */}
                    <span style={{
                      position: 'absolute', left: leaving ? '88%' : '12%', bottom: h * 0.03,
                      transform: 'translateX(-50%)', zIndex: 2,
                      opacity: share ? 1 : 0, transition: 'opacity .3s ease .2s', pointerEvents: 'none',
                    }}>
                      <Whole shape={order.shape} colors={order.colors} art={`/assets/objects/${order.art}.png`}
                        pieceDen={den} laid={1} w={Math.round(h * 0.46)} h={Math.round(h * 0.46)} />
                    </span>
                    <span style={{ position: 'relative', zIndex: 1, display: 'block' }}>
                      <SheetCell src={f.src} h={h} moving={moving} cycleScale={j.cycleScale}
                        facesLeft={leaving ? f.facesLeft : !f.facesLeft} breathe={!moving} />
                    </span>
                  </span>
                )}
              </Arrive>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Commit({ text, onClick, disabled, short }: { text: string; onClick: () => void; disabled?: boolean; short: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: short ? '10px 14px' : '13px 20px', borderRadius: 14, border: 'none',
      cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1,
      background: 'linear-gradient(135deg,var(--garden-green),var(--garden-green-deep))', color: '#fff',
      fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: short ? 13 : 16,
      boxShadow: '0 5px 0 rgba(40,110,60,.35)', whiteSpace: 'nowrap',
    }}>{text}</button>
  )
}

/**
 * ⚠️ THE TAKE-BACK IS CONSTANT AT EVERY COUNT, and that is deliberate rather than tidy. An undo that
 * appears only once the board is wrong is a verdict handed over before the commit. It is also a
 * STACK — only the piece just laid comes off — so reaching for it is predictable.
 */
function Undo({ onClick, disabled, short }: { onClick: () => void; disabled?: boolean; short: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label="take one back" style={{
      width: short ? 40 : 46, height: short ? 40 : 46, flex: '0 0 auto', padding: 0, borderRadius: 12,
      cursor: disabled ? 'default' : 'pointer', background: 'var(--paper)', border: '3px solid var(--outline)',
      boxShadow: '0 4px 0 #c8ac79', opacity: disabled ? 0.4 : 1,
      fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: short ? 15 : 18, color: 'var(--ink)',
    }}>↩</button>
  )
}

// ─── the board: the whole, plus whatever has been laid in it ──────────────────────────
function Board({ L: l, order, on, n, pieceDen, laid, lit, vw }: {
  L: L; order: Order; on: 'shape' | 'group'; n: number; pieceDen: Den; laid: number; lit?: boolean; vw: number
}) {
  const size = wholeSize(order.shape, l.wholePx, l.boardRoom)
  // ⚠️ A PILE GETS THE SAME ROOM A WHOLE DOES — measured off Milo and the friends, not off the
  // viewport. Given `vw * 0.74` it reached into the friends' band and stood in front of them, which
  // is the "two independent percentages of the width" fault this repo keeps paying for.
  const w = on === 'group' ? Math.min(l.boardRoom, 640) : size.w
  const h = on === 'group' ? Math.min(l.boardBand, 220) : size.h
  return (
    <div style={{
      position: 'fixed', left: 0, width: l.boardCentre * 2, top: l.boardTop, height: l.boardBand, zIndex: 30,
      display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
    }}>
      <Pool>
        {on === 'group'
          ? <Pile item={order.item} n={n} pieceDen={pieceDen} laid={laid} w={w} h={h} lit={lit} />
          : <Whole shape={order.shape} colors={order.colors} art={`/assets/objects/${order.art}.png`} pieceDen={pieceDen} laid={laid} w={size.w} h={size.h} lit={lit} topping={order.topping} />}
      </Pool>
    </div>
  )
}

/**
 * Shared by the play board AND the lesson, so the picture a child is taught on is the picture they
 * then play on — a lesson that looks different from the round is teaching a second thing by accident.
 */
function Pool({ children }: { children: React.ReactNode }) {
  return (
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        {/*
          ⚠️ THE COUNTER POOL, AND IT IS NOT DECORATION — IT IS THE CAMOUFLAGE FIX, MEASURED.
          Every scene in this chapter is a food shop, so every backdrop is warm brown or orange; and
          every treat is a food, so every treat is warm brown or orange too. Measured over the band the
          whole occupies, FIVE of the ten orders sat inside their own scene's hue with no saturation
          gap either — loaf Δhue 10° Δsat 0.01, orange Δhue 3°, cheese Δhue 10°, wafer Δsat 0.07, cake
          Δsat 0.08. That is CoinShop's coin problem exactly: the palette rule says separation in hue
          OR saturation and there was neither.
          Neither side can move — a bakery scene is warm and a loaf is tan, and recolouring either is a
          lie. So the separation is in BRIGHTNESS instead, laid under the whole: every treat here is
          value ≥ 0.66 and this pool is 0.15, which clears all ten at once.
          ⚠️ AND IT FADES TO NOTHING AT ITS OWN EDGES, per BlockYard — a solid shape over a painted
          scene reads as UI furniture however well its colour is matched, and this repo has drawn that
          slab four times. Trodden ground has no border and neither does this.
        */}
        {/*
          ⚠️ SIZED BY `inset`, NOT BY NUMBERS. Given the board's width and height it was drawn at the
          MAXIMUM the board may take rather than at what is actually in it, so on a pile round — where
          the tray is wide and starts empty — it rendered as a large dark stain with nothing on it.
          A shrink-to-fit wrapper plus a negative inset makes the pool track its own content for free,
          and keeps working for anything drawn here later.
        */}
        <div aria-hidden style={{
          position: 'absolute', inset: '-17%', borderRadius: '50%', pointerEvents: 'none',
          background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(34,22,12,.52), rgba(34,22,12,.34) 52%, rgba(34,22,12,0) 78%)',
        }} />
        {children}
      </div>
  )
}

// ─── play ─────────────────────────────────────────────────────────────────────────────
type Mode = 'guided' | 'practice'

const FrPlay: React.FC<{ data: FrRound; mode: Mode; onComplete: (correct: boolean) => void }> = ({ data, mode, onComplete }) => {
  /** ⚠️ ONLY THE GUIDED ROUNDS SPEAK FOR THEMSELVES. In practice `SkillBeat` already speaks
   *  `beat.say` on every round load, and both firing means two utterances where the second cancels
   *  the first — whichever order they happen to run in. */
  const speakOnMount = mode === 'guided'
  const { w: vw, h: vh } = useViewport()
  const l = layoutFor(vw, vh)
  const order = orderOf(data.slot)
  const pieces = useMemo(() => piecesFor(data), [data])

  const [pieceDen, setPieceDen] = useState<Den>(pieces[0])
  /**
   * ⚠️ A MIRROR REF, BECAUSE `lay` READS THE PIECE IT ALSO SETS — and this repo has now shipped that
   * exact shape three times (TickTock's lesson dial moved ONE stop for six taps; placeValue's undo
   * removed one cube for three batched taps, found by a real user on a janky device; CoinShop's `lay`
   * reads inside the updater for the same reason).
   *
   * `pieceDen` is genuinely render state — the tray highlights it and the board draws with it — so it
   * cannot simply become a ref. But the handler's `den !== pieceDen` test comes from the render's
   * CLOSURE, so a burst of taps that starts by SWITCHING piece has every later tap still see the old
   * piece, take the switch branch again, and reset `laid` to 1. Caught by playing it: four quick taps
   * on a fresh round left one piece down and the child stuck on "not full yet" however fast they tap.
   */
  const denRef = useRef<Den>(pieces[0])
  const [laid, setLaid] = useState(0)
  const [done, setDone] = useState(false)
  const [miss, setMiss] = useState<string | null>(null)
  const erred = useRef(false)
  const settled = useRef(false)

  /**
   * ⚠️ RESET DURING RENDER WHEN THE ROUND CHANGES, NOT IN AN EFFECT — and not left to chance at all.
   * React reconciles this element across rounds (same component, same position), so state can survive
   * into the next round: a new round would open with the previous round's pieces already laid and its
   * commit already spent. That reuse is the fault SeesawPark shipped, where a walk-in played on round
   * one and was dead for rounds two to ten — invisible the one time anybody checks. An effect would
   * run after paint and show one frame of the old board.
   */
  const roundKey = `${data.slot}|${data.ask}|${data.on}|${data.den}|${data.n}`
  const seenRound = useRef(roundKey)
  if (seenRound.current !== roundKey) {
    seenRound.current = roundKey
    denRef.current = pieces[0]
    settled.current = false; erred.current = false
    setPieceDen(pieces[0]); setLaid(0); setDone(false); setMiss(null)
  }

  const askText = askTextFor(data)
  useEffect(() => {
    if (speakOnMount) speak(askText)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** ⚠️ CAPPED AT den+2. A child who keeps tapping must see "these do not fit", not a sprawl that
   *  outgrows the board — the overflow is the proof, so it has to stay legible. */
  const lay = (den: Den) => {
    if (settled.current) return
    setMiss(null)
    // Switching piece clears the board: a mixture of two sizes is not something the grader — or the
    // child — should have to have an opinion about, and starting again is free.
    if (den !== denRef.current) { denRef.current = den; setPieceDen(den); setLaid(1); return }
    setLaid(v => Math.min(v + 1, den + 2))
  }
  const undo = () => { if (!settled.current) { setMiss(null); setLaid(v => Math.max(0, v - 1)) } }

  function commit() {
    if (settled.current || laid === 0) return
    if (isSolved(data, { den: pieceDen, laid })) {
      settled.current = true
      setDone(true); setMiss(null)
      speak(revealFor(data))
      // He leaves on his own legs, and the round ends when he is actually gone.
      const j = inFlowJourney(MILO, l.miloH, Math.round(vw - l.miloLeft + l.miloW * 0.4))
      window.setTimeout(() => onComplete(mode === 'practice' ? !erred.current : true), j.ms + 700)
    } else {
      erred.current = true
      const t = missFor(data, { den: pieceDen, laid })
      // Everything spoken is also WRITTEN — a response that exists only as speech is silence on the
      // many devices with no usable voice, which reads as a tap that did nothing at all.
      setMiss(t); speak(t)
    }
  }

  const side = l.short ? 44 : 52
  return (
    <>
      <Bubble L={l} text={miss ?? (done ? revealFor(data) : askText)} />
      <Board L={l} order={order} on={data.on} n={data.n} pieceDen={pieceDen} laid={laid} lit={done} vw={vw} />
      {/*
        ⚠️ WHO IS WAITING IS THE QUESTION. On a TAKE round every friend is already there, so the row
        of them IS the denominator the child has to match with a piece. On a FIT round one more walks
        in for each piece laid, so "how many of these fit" and "how many friends get one" assemble
        into the same answer in front of the child instead of being asserted afterwards.
      */}
      <Friends L={l} order={order} den={data.den} share={done} leaving={done}
        count={friendsShown(data.ask, data.den, laid)}
        resetKey={`${data.slot}-${data.ask}-${data.den}`} />
      <Bar L={l}>
        {pieces.map(den => (
          data.on === 'group'
            ? <HandBtn key={den} item={order.item} n={data.n} den={den} side={side}
                onLay={() => lay(den)} disabled={done} active={den === pieceDen && laid > 0} />
            : <PieceBtn key={den} shape={order.shape} colors={order.colors} den={den} side={side}
                onLay={() => lay(den)} disabled={done} active={den === pieceDen && laid > 0} />
        ))}
        <Undo onClick={undo} disabled={done || laid === 0} short={l.short} />
        <Commit short={l.short} text={data.on === 'group' ? 'Share ✓' : 'Fit ✓'} onClick={commit} disabled={done || laid === 0} />
      </Bar>
      <Milo L={l} vw={vw} leaving={done} resetKey={`${data.slot}-${data.ask}-${data.on}`} />
    </>
  )
}

// ─── the re-teach, after three wrong ──────────────────────────────────────────────────
const Reteach: React.FC<{ data: FrRound; onDone: () => void }> = ({ data, onDone }) => {
  const { w: vw, h: vh } = useViewport()
  const l = layoutFor(vw, vh)
  const order = orderOf(data.slot)
  const [laid, setLaid] = useState(0)
  const [share, setShare] = useState(false)
  const [line, setLine] = useState('')
  const doneRef = useLatestRef(onDone)

  useEffect(() => {
    const thing = data.on === 'group' ? `${numWord(data.n)} ${order.items}` : `the ${order.treat}`
    const lines = [
      `Look — ${numWord(data.den)} friends are waiting, and they must ALL get the same.`,
      `So I share ${thing} out, one piece at a time…`,
      `…until everybody has one. ${sentenceCase(numWord(data.den))} equal ${data.on === 'group' ? 'piles' : 'pieces'}.`,
      data.on === 'group'
        ? `Each friend gets ${numWord(perShare(data))}. One ${denWord(data.den)} of ${numWord(data.n)} is ${numWord(perShare(data))}.`
        : `Each friend gets one piece out of ${numWord(data.den)} — one ${denWord(data.den)}.`,
    ]
    const steps = [() => setLaid(0), () => setLaid(1), () => setLaid(data.den), () => setShare(true)]
    // Self-paced for the same reason the lesson is — see the long note in `Lesson`. A re-teach whose
    // visuals hang off speech events freezes on any device that stops delivering them, and a frozen
    // re-teach is a dead end reached by a child who has already got three wrong.
    const timers: number[] = []
    let t = 0
    lines.forEach((ln, i) => {
      timers.push(window.setTimeout(() => { steps[i]?.(); setLine(ln); speak(ln) }, t))
      t += dwellFor(ln)
    })
    timers.push(window.setTimeout(() => doneRef.current(), t + 1200))
    return () => { timers.forEach(window.clearTimeout); stopSpeech() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Bubble L={l} text={line || 'Let me show you again…'} />
      <Board L={l} order={order} on={data.on} n={data.n} pieceDen={data.den} laid={laid} lit={laid >= data.den} vw={vw} />
      {/* The re-teach shows the SAME story a round does — a child who has got three wrong is the last
          person who should be handed a second framing to bridge. */}
      <Friends L={l} order={order} den={data.den} count={data.den} share={share} leaving={false}
        resetKey={`re${data.slot}`} />
      <Milo L={l} vw={vw} leaving={false} resetKey={`re${data.slot}`} />
    </>
  )
}

// ─── the lesson: four beats, unscored, before anything is graded ───────────────────────
/**
 * ⚠️ THIS IS THE PART THE OLD CHAPTER DID NOT HAVE, and it is why this one exists in this shape.
 * One idea per beat, in a fixed order, nothing scored — the pattern the colouring chapter settled —
 * and the third beat is the payload: a SMALLER piece fits MORE times, which is the whole reason
 * 1/4 < 1/2 and the fact everything downstream needs.
 *
 * Beat one is the misconception, and the mechanic itself refutes it: two pieces that are not the
 * same do not fit twice, so they were never halves. **The fit test IS the equal test.**
 *
 * The skip appears only from the SECOND run (`lessonSeen`). Offered on the first it is just a big
 * button a six-year-old presses to leave the teaching, and then meets a test nothing prepared them
 * for.
 */
const BEATS = 4
const DEMO = ORDERS[0]   // the pizza — round, and the one thing every child has seen cut

/** The lesson's own board: a whole that can also be drawn WRONGLY cut, which no scored round ever is. */
function LessonWhole({ w, h, mode, den, laid }: { w: number; h: number; mode: 'uneven' | 'even'; den: Den; laid: number }) {
  const c = DEMO.colors
  if (mode === 'uneven') {
    // Two pieces, and they are not the same — the thing a child will happily call "a half".
    return (
      <svg viewBox="-10 -8 120 116" style={{ width: w, height: h, filter: 'drop-shadow(0 6px 10px rgba(0,0,0,.3))', display: 'block' }}>
        <circle cx={50} cy={50} r={47} fill="none" stroke={c.edge} strokeWidth={2.6} />
        <path d={wedgePath(0, 3)} fill={c.shaded} stroke={c.edge} strokeWidth={2} />
        <path d={`M 50 50 L ${50 + 47 * Math.cos(30 * R2)} ${50 + 47 * Math.sin(30 * R2)} A 47 47 0 1 1 50 3 Z`}
          fill={c.base} stroke={c.edge} strokeWidth={2} />
      </svg>
    )
  }
  return <Whole shape="round" colors={c} art={`/assets/objects/${DEMO.art}.png`} pieceDen={den} laid={laid} w={w} h={h} topping={DEMO.topping} />
}

const Lesson: React.FC<{ canSkip: boolean; onDone: () => void }> = ({ canSkip, onDone }) => {
  const { w: vw, h: vh } = useViewport()
  const l = layoutFor(vw, vh)
  const [beat, setBeat] = useState(0)
  const [line, setLine] = useState('')
  const [view, setView] = useState<{ mode: 'uneven' | 'even'; laid: number; den: Den; friends: number; share: boolean }>({ mode: 'even', laid: 0, den: 2, friends: 2, share: false })
  /**
   * The child's one hands-on go, on the last beat.
   *
   * ⚠️ A REF, NOT STATE, AND THAT IS THE FIX FOR A REAL FAULT THIS REPO HAS SHIPPED TWICE. It is read
   * back inside the tap handler that also sets it, so as `useState` that read comes from the render's
   * CLOSURE and every tap inside one React batch sees the same stale count — TickTock's lesson dial
   * moved ONE stop for six taps (measured on prod), and placeValue's undo removed one cube for three
   * batched taps on a real user's janky device. Distinct human taps are usually separate ticks; that
   * is not a guarantee, which is why the rule is *never read state you also set inside a handler*.
   */
  const tryN = useRef(0)
  const [tryOk, setTryOk] = useState(false)
  /** ⚠️ The piece appears when the child is ASKED for it, not when the last beat starts — gated on
   *  the beat index it shows up while Milo is still sentences earlier, because `line` lags a new beat
   *  until its first narration step fires and the render does not. */
  const [askTry, setAskTry] = useState(false)

  useEffect(() => {
    const script: Array<{ lines: string[]; steps: Array<() => void> }> = [
      { // ① two friends, one pizza, and a cut that is not fair
        lines: [
          'Bunny and Duck both want some pizza. Just two friends, and one pizza.',
          'Milo cut it into two pieces — but look. Bunny got a BIG piece and Duck got a little one.',
          'That is not fair, and it is not a half. A half means both pieces are the SAME.',
        ],
        steps: [
          () => setView({ mode: 'even', laid: 0, den: 2, friends: 2, share: false }),
          () => setView({ mode: 'uneven', laid: 0, den: 2, friends: 2, share: false }),
          () => setView({ mode: 'uneven', laid: 0, den: 2, friends: 2, share: false }),
        ],
      },
      { // ② equal pieces, one each
        lines: [
          'So Milo cuts again. One piece for Bunny…',
          'and one for Duck, exactly the same size. Two friends, two equal pieces.',
          'They each get ONE HALF. Nobody got more than anybody else.',
        ],
        steps: [
          () => setView({ mode: 'even', laid: 1, den: 2, friends: 2, share: false }),
          () => setView({ mode: 'even', laid: 2, den: 2, friends: 2, share: false }),
          () => setView({ mode: 'even', laid: 2, den: 2, friends: 2, share: true }),
        ],
      },
      { // ③ THE PAYLOAD — more friends sharing the same thing means a smaller piece each
        lines: [
          'Now watch. TWO more friends come along — that is four friends now.',
          'Same pizza. But Milo has to cut it into four pieces so everyone gets one.',
          'Four friends, four equal pieces. Each one gets a QUARTER.',
          'More friends means a SMALLER piece each. That is why a quarter is smaller than a half.',
        ],
        steps: [
          () => setView({ mode: 'even', laid: 2, den: 2, friends: 4, share: false }),
          () => setView({ mode: 'even', laid: 4, den: 4, friends: 4, share: false }),
          () => setView({ mode: 'even', laid: 4, den: 4, friends: 4, share: true }),
          () => setView({ mode: 'even', laid: 4, den: 4, friends: 4, share: true }),
        ],
      },
      { // ④ name them, then one go
        lines: [
          'Two friends share into halves. Three into thirds. Four into quarters.',
          'Your turn. THREE friends are waiting — fill the pizza so everybody gets one.',
        ],
        steps: [
          () => setView({ mode: 'even', laid: 2, den: 2, friends: 2, share: true }),
          // Emptied HERE rather than at the start of the beat, so the child sees it clear at the
          // moment they are asked — and the piece appears with the instruction.
          () => { setView({ mode: 'even', laid: 0, den: 3, friends: 3, share: false }); tryN.current = 0; setAskTry(true) },
        ],
      },
    ]
    const b = script[beat]
    if (!b) return
    const last = beat >= BEATS - 1

    /**
     * ⚠️ THE LESSON IS SELF-PACED ON A TIMER, WITH `speak()` ALONGSIDE — NOT DRIVEN BY `speakSteps`.
     *
     * `speakSteps` reveals each visual from the utterance's `onstart`, so THE TEACHING ONLY HAPPENS
     * IF SPEECH KEEPS DELIVERING EVENTS. When a device starts the first line and then silently drops
     * the rest — which Chrome and Safari both do — the sequence marches to its end on per-line
     * watchdogs while `onStep` never fires again: the line, the board AND the flag that offers the
     * child the piece all freeze at the last line that happened to speak, permanently. TickTock
     * shipped exactly that and the founder sat stuck on a lesson beat with no control on screen.
     *
     * ⚠️ And a fixed total cap behind it is WORSE, not a safety net: timed against the silent
     * fallback it fires mid-sentence on a device with a real voice and cancels a live utterance. The
     * preview pane is mute, so that failure is invisible in every run driven here.
     *
     * The honest cost is that a slow voice can have its tail cut by the next line, which is far
     * cheaper than a lesson that freezes — and `speak()` cancels cleanly rather than overlapping.
     */
    const timers: number[] = []
    let t = 0
    b.lines.forEach((ln, i) => {
      timers.push(window.setTimeout(() => { b.steps[i]?.(); setLine(ln); speak(ln) }, t))
      t += dwellFor(ln)
    })
    // The last beat waits for the child; the others roll on.
    if (!last) timers.push(window.setTimeout(() => setBeat(x => x + 1), t + 600))
    return () => { timers.forEach(window.clearTimeout); stopSpeech() }
     
  }, [beat])

  const layTry = () => {
    if (tryOk) return
    // Capped at three, which is also the answer — the lesson is a rehearsal of the gesture, not a
    // test, so there is deliberately no way to overshoot into a state needing an undo that this
    // screen does not offer.
    const n = Math.min(tryN.current + 1, 3)
    tryN.current = n
    setView({ mode: 'even', laid: n, den: 3, friends: 3, share: n === 3 })
    if (n === 3) {
      setTryOk(true)
      speak('That is it — three equal pieces. Thirds! Now you can find a fraction.')
      window.setTimeout(onDone, 2400)
    }
  }

  const size = wholeSize('round', l.wholePx, l.boardRoom)
  return (
    <>
      <Bubble L={l} text={line || 'Let us cut something up together.'} />
      <div style={{ position: 'fixed', left: 0, right: 0, top: l.boardTop, height: l.boardBand, zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <Pool>
          <LessonWhole w={size.w} h={size.h} mode={view.mode} den={view.den} laid={view.laid} />
        </Pool>
      </div>
      {/* ⚠️ THE FRIENDS ARE IN THE LESSON TOO. A lesson that teaches "how many of these fit" and a
          round that asks "how many friends get one" are two different chapters, and the child would
          have to bridge them alone. Here the payload IS the friends: two more arrive, the same pizza
          has to stretch further, and everyone's piece gets smaller in front of them. */}
      <Friends L={l} order={DEMO} den={Math.max(view.den, view.friends) as Den}
        count={view.friends} share={view.share} leaving={false} resetKey={`lesson${beat}`} />
      <Bar L={l}>
        {/* ⚠️ THERE IS DELIBERATELY NO "NEXT". The beats roll on by themselves, and a Next button on
            every beat is a skip button on the very first run — the exact thing `lessonSeen` exists to
            prevent. The only way forward is the one hands-on go on the last beat. */}
        {askTry && (
          <PieceBtn shape="round" colors={DEMO.colors} den={3} side={l.short ? 44 : 52}
            onLay={layTry} disabled={tryOk} active={tryN.current > 0} />
        )}
        {canSkip && (
          <button onClick={onDone} style={{
            padding: l.short ? '7px 12px' : '9px 16px', borderRadius: 12, cursor: 'pointer',
            background: 'transparent', border: '2px solid rgba(61,37,22,.28)',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: l.short ? 11 : 13, color: 'var(--ink-muted)',
          }}>Skip the lesson</button>
        )}
      </Bar>
      {/* dots, so a grown-up can see how much teaching is left */}
      <div style={{ position: 'fixed', left: 0, right: 0, top: l.top - 22, display: 'flex', justifyContent: 'center', gap: 6, zIndex: 44 }}>
        {Array.from({ length: BEATS }).map((_, i) => (
          <span key={i} style={{ width: 8, height: 8, borderRadius: 99, background: i <= beat ? 'var(--milo-orange)' : 'rgba(61,37,22,.22)' }} />
        ))}
      </div>
    </>
  )
}

// ─── beat ─────────────────────────────────────────────────────────────────────────────
export function makeFrBeat(): Beat<FrRound> {
  return {
    skillId: 'fractions', rounds: 10, walkEvery: 3,
    make: (d, round = 0, asked) => makeFrRound((d || 1) as 1 | 2 | 3, round, asked),
    // ⚠️ THE CLOSED SET. Mastery must not end the run before all three denominators have been asked
    // — a strong child gets about three rounds at L1 (halves and quarters only), ONE at L2 and TWO at
    // L3, so thirds are the reading a uniform draw loses.
    coverage: { of: r => String(r.den), all: DENS.map(String) },
    // ⚠️ THIS CHAPTER SAYS ITS OWN MISS LINES. `missFor` names WHICH mistake it was — and on a wrong
    // piece it states the size relation, which is the payload. The round retries in place over the
    // board, so SkillBeat's centred pill would land on the very thing being read, and because a round
    // is only reported once SOLVED that pill would also arrive on top of the reveal and contradict it.
    ownsFeedback: true,
    // Dedupe on the MATH and the DIRECTION — the same fraction found and then made is two questions.
    // The treat's SHAPE is in here on purpose: a half of a round pizza and a half of a chocolate bar
    // are two representations the curriculum asks for by name, not two dressings of one question.
    sig: r => `${r.ask}:${r.on}:${r.den}:${r.n}:${orderOf(r.slot).shape}`,
    // Empty on purpose: SkillBeat then renders no pill of its own, and Milo's bubble is the single
    // question region. Two pills saying the same thing land on top of each other at 640×320.
    prompt: () => '',
    // The VOICE comes from the same renderer the bubble writes, so what Milo says and what the bubble
    // shows cannot drift.
    say: r => askTextFor(r),
    Play: ({ data, onSubmit }) => <FrPlay data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <Reteach data={data} onDone={onDone} />,
  }
}

// ─── orchestrator ─────────────────────────────────────────────────────────────────────
const SL_CSS = `
@keyframes sl_land { from{transform:scale(.6);opacity:0} to{transform:scale(1);opacity:1} }
@keyframes sl_fade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
`

type Phase = 'intro' | 'lesson' | 'bridge' | 'guided' | 'practice'

/** The two rehearsals: one of each direction, because BOTH are graded and a graded gesture that was
 *  never walked through is a child marked wrong for a mechanic nobody showed them. */
const GUIDED: FrRound[] = [
  { slot: 1, den: 2, on: 'shape', n: 0, ask: 'fit', d: 1 },
  { slot: 2, den: 4, on: 'shape', n: 0, ask: 'take', d: 1 },
]

export default function SliceShop({ onFinish, onExit }: {
  world?: string    // accepted and ignored — this chapter is one day at the shop, not three worlds
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
  const needsRotate = useNeedsRotate()
  const [phase, setPhase] = useState<Phase>('intro')
  const [gIdx, setGIdx] = useState(0)
  const [slot, setSlot] = useState(0)
  const { w: vw, h: vh } = useViewport()
  const l = layoutFor(vw, vh)
  const learnerId = useMemo(() => getActiveLearner()?.id, [])
  const [canSkip] = useState(() => lessonSeen(getActiveLearner()?.id, 'fractions'))
  const { exit, tally } = useChapterShell(onFinish, onExit)
  const interlude = useCallback(() => new Promise<void>(res => window.setTimeout(res, 850)), [])
  const beat = useMemo(() => makeFrBeat(), [])

  const shownSlot = phase === 'practice' ? slot : phase === 'guided' ? GUIDED[gIdx].slot : 0

  const Banner = (text: string) => (
    <div style={{ position: 'absolute', top: CHROME_PAD, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px', pointerEvents: 'none' }}>
      <div style={{
        background: 'var(--paper)', border: '3px solid var(--milo-orange)', borderRadius: 999,
        padding: l.short ? '4px 14px' : '8px 20px', fontFamily: 'var(--font-display)', fontWeight: 800,
        fontSize: l.short ? 12 : 17, color: 'var(--milo-orange)', boxShadow: '0 4px 0 rgba(242,107,44,.25)', textAlign: 'center',
      }}>{text}</div>
    </div>
  )

  const Card = (body: React.ReactNode, cta: string, go: () => void) => (
    <div style={{ position: 'absolute', inset: 0, zIndex: 46, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '0 6vw', animation: 'sl_fade .4s ease both' }}>
      <div style={{
        maxWidth: 560, background: '#fff', border: '3px solid var(--outline)', borderRadius: 18,
        padding: l.short ? '10px 16px' : '16px 22px', fontFamily: 'var(--font-display)', fontWeight: 700,
        fontSize: l.short ? 14 : 19, color: 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(61,37,22,.1)',
      }}>{body}</div>
      <button onClick={go} style={{
        padding: l.short ? '11px 28px' : '14px 38px', borderRadius: 50, border: 'none', cursor: 'pointer',
        background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff',
        fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: l.short ? 17 : 22, boxShadow: '0 6px 16px rgba(242,107,44,.4)',
      }}>{cta}</button>
    </div>
  )

  // ⚠️ THIS EARLY RETURN SITS BELOW EVERY HOOK. Put one above a `useMemo` and turning the phone
  // changes the hook count, and React tears the chapter into the error boundary — which is exactly
  // what happened the first time this gate was wired into chapter 2.
  if (needsRotate) return <RotateGate line="Milo needs a wide counter to cut things on! 🍕" />

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      <style>{SL_CSS}{CRITTER_CSS}</style>
      <Scene slot={shownSlot} />
      <div style={{ position: 'absolute', top: CHROME_PAD, left: 14, zIndex: 50 }}>
        {/* Sized from the same metrics `chromeTop` budgets for, so the band below cannot be wrong. */}
        <button onClick={exit} style={{
          padding: `${menuBtn(l.short).padY}px ${menuBtn(l.short).padX}px`, borderRadius: 50,
          background: 'var(--paper)', border: '3px solid var(--milo-orange)', color: 'var(--milo-orange)',
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: menuBtn(l.short).font, cursor: 'pointer',
        }}>← Menu</button>
      </div>

      {/* ⚠️ THE INTRO NAMES REAL ORDERS. It said "a loaf", which this chapter has not sold since the
          order table was rebuilt — the same fault CoinShop shipped when its intro pointed a child at
          a price board and a cloth that had both been deleted. The gate reads the table. */}
      {phase === 'intro' && Card(
        <>Milo&apos;s shop is open, and friends keep coming in — and everything has to be shared out
          FAIRLY. A pizza, a chocolate bar, a party cake. First, let us learn how to share equally.</>,
        'Show me ▶', () => { unlockSpeech(); setPhase('lesson') })}

      {phase === 'lesson' && (<>{Banner('Equal parts')}
        <Lesson canSkip={canSkip} onDone={() => { markLessonSeen(learnerId, 'fractions'); setPhase('bridge') }} /></>)}

      {/* The teaching and the pointing stop at once. A child not told that has simply had the game
          taken away — so it is said out loud, once, on its own screen. */}
      {phase === 'bridge' && Card(
        <>Now the orders start coming in. Sometimes Milo hands you a piece and you find how many fit —
          and sometimes he asks for a half or a third and you find the right piece. I will not point any
          more. You can do this!</>,
        'Open the shop ▶', () => setPhase('guided'))}

      {phase === 'guided' && (<>{Banner(gIdx === 0 ? 'Lay the pieces in' : 'Now pick the right piece')}
        <FrPlay key={`g${gIdx}`} data={GUIDED[gIdx]} mode="guided"
          onComplete={() => { if (gIdx + 1 < GUIDED.length) setGIdx(gIdx + 1); else setPhase('practice') }} /></>)}

      {phase === 'practice' && (
        <div style={{ position: 'absolute', top: l.top - 8, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
          <SkillBeat beat={beat} onInterlude={interlude}
            onRound={(data) => { if (typeof data?.slot === 'number') setSlot(data.slot) }}
            onComplete={tally} />
        </div>
      )}

      {/* Milo stands here for every phase that does not own him itself (FrPlay and Reteach do, because
          they need him to walk off). He must be on screen whenever the bubble is: the bubble has a
          TAIL, and a tail pointing at an empty corner says the words belong to somebody who is not
          there. The gate asserts he has a registered drawn cycle, since he is the only thing here
          that moves. */}
      {(phase === 'intro' || phase === 'lesson' || phase === 'bridge') && hasSheet(MILO) && (
        <Milo L={l} vw={vw} leaving={false} resetKey={phase} />
      )}
    </div>
  )
}
