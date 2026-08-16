'use client'
/**
 * THE EMPTY PLOT (9–11 · `areaPerimeter`) on GameShell — the LAST of the band's neon chapters to
 * come across, and the only one that had to give something up to do it.
 *
 * ⚠️ THE 3D IS GONE, ON THE FOUNDER'S CALL (2026-08-15: *"totally remove that 3d concept"*). This
 * chapter was 1,380 lines of react-three-fiber plus a 628-line procedural site generator — a
 * first-person yard you walked with a thumbstick — and it was raised three times in the handoff as
 * the one chapter that *"cannot become a data file over a 2D shell"*. It can; what could not survive
 * was the first-person camera, and the verb never needed it.
 *
 * **PEG IT OUT, unchanged.** The foreman gives a number and the road frontage — *"24 tiles, and 4
 * metres along the road"* — the yard behind it is empty, and the child works out how far back the far
 * edge belongs and puts a peg there. The answer is still a PLACE, which is the whole reason three
 * earlier mechanics were rejected: a tile is the unit of area, so any mechanic where the child
 * handles tiles hands them a countable pile and something other than their head does the arithmetic.
 *
 * ⚠️ AND THE PLAN VIEW FIXES THE FAULT THE 3D KEPT REPRODUCING. First person put the child at the far
 * edge FACING AWAY from the road, so everything the delivery then laid was behind them: driven on
 * screen, a wrong peg read *"Too far back — part of it would be bare"* over an empty green field, on
 * every round, right and wrong. The consequence — the one thing that makes a miss a consequence
 * rather than a verdict — was off-camera. From above there is nothing to swing round to.
 *
 * ⚠️ EVERYTHING THAT CAN BE WRONG IS STILL IN `story/plotMaths.ts` — the tier ladder (the DIVISOR is
 * the difficulty term, not the magnitude), the grader, the miss lines, the demo beats and the rule
 * that the equation is written only on the reveal. This file re-shapes; it re-implements nothing.
 */
import React from 'react'
import { Game, type BaseTask, type GameConfig, type InstrumentProps } from './parts/GameShell'
import { KID_P as P, Cue, useLatest } from './parts/kidKit'
import { useHand, type HandRead } from '@/infra/ar/HandInput'
import { useViewport } from '@/shared/hooks/useViewport'
import {
  makeRound, gradePeg, missFor, slotsFor, slotBox, equationFor, explainBeats, badgeFor, contextFor,
  instructionFor, spanMetres, snapMetres, workFrames, ROAD_GAP, visibleDepth, metreOf, roadBand, roadStrip, planXY, markers, MAX_DEPTH, DEMO, GUIDED,
  type PlotRound, type WorkFrame,
} from '@/features/chapters/story/plotMaths'
import { getSpeechRate } from '@/infra/storage/speechRate'

/**
 * The box the plan is drawn into, and the metre DERIVED from it.
 *
 * ⚠️ A FIXED METRE MADE THE PLOT TINY, AND THE CULPRIT WAS THE RESERVE. The yard has to hold the whole
 * walkable depth from empty or it jumps under the child as they pace — but at a fixed 22px a metre
 * that meant a 5 × 2 plot occupied **14% of a box drawn for 12 metres**, and `FitSlot` then shrank the
 * lot to fit the slot. Founder, on a screenshot of the last walkthrough beat: *"the size is too small
 * bro."*
 *
 * So the BOX is fixed and the metre is worked out from it — `min(W / frontage, H / visible)` — which
 * means a narrow plot gets a big metre and a wide one a smaller metre, and the instrument is always
 * the same size in the layout. **Nothing jumps, and nothing is drawn at a sixth of the room.**
 * ⚠️ `visible` MUST NOT depend on the answer while the round is live, or the box height IS the answer:
 * during play it is the walk bound, every round, and only once the peg is in does it close up on what
 * was actually built.
 */
export const PLAN_BOX = { w: 340, h: 340 }
/**
 * ⚠️ AND THE LANDSCAPE BOX IS A DIFFERENT SHAPE, NOT THE SAME ONE TURNED. On a laptop the slot is
 * wide and short, so the walkable depth — the LONG axis — has to run across it. Founder: *"laptop
 * screen pe yeh ek proper horizontal rectangle mein dikhe."*
 */
export const PLAN_BOX_LAND = { w: 560, h: 300 }

/** Which way round the plan is drawn. The long axis follows the frame's long axis.
 *  Derived from the shared `useViewport` — it defaulted to `true` and corrected in an effect, so a
 *  portrait phone drew the plan the wrong way round for one frame. */
function useLandscape() {
  const { w, h } = useViewport()
  return w / Math.max(1, h) >= 1.25
}
/**
 * The road along the top of the plan. It holds TWO things — the word and the frontage numeral — and
 * ⚠️ it is 50px because they were drawn on top of each other at 30: measured at 1280×720, `5 m` ran
 * x 525–635 and `ROAD` sat at 561–600, i.e. entirely inside it. Both were individually centred and
 * individually correct, which is why only crossing their boxes finds it.
 */
const ROAD = 50

/**
 * How far back the child has paced, and whether the peg is in / the delivery has been laid.
 *
 * ⚠️ `step` IS SET BY THE WALKTHROUGH BEATS AND BY NOTHING ELSE — not `initialValue`, not the hand's
 * `enter`, not the glide. It is what lets the teaching show a countable bar without that bar ever
 * being reachable from a scored round, and the gate asserts exactly that.
 */
export interface PlotV { back: number; pegged: boolean; laid: boolean; step?: 'work' | 'walk' }
export const START: PlotV = { back: 0, pegged: false, laid: false }

/**
 * The frame this beat is on, advanced on its own clock and HELD at the last one.
 *
 * ⚠️ THE CADENCE COMES FROM THE NARRATION'S OWN SPEED, which is the only honest way to "run it with
 * the words": a beat's real duration is not knowable in advance (it ends when an utterance ends, and
 * on a device with no voice it ends on `speakSteps`' fallback timer), but the child's speech-rate
 * pick is the same multiplier both sides. `fallbackStepMs` is `2600 / m`; a frame is `620 / m`, so
 * "🐢 Slower" slows the picture exactly as much as it slows the sentence.
 * ⚠️ AND IT IS `setInterval`, NOT rAF — rAF is frozen outright in a backgrounded tab, which is every
 * headless drive this chapter has.
 */
function useBeatFrames(kind: string | undefined, key: string, n: number) {
  const [at, setAt] = React.useState({ key, i: 0 })
  /**
   * ⚠️ THE RESET IS DERIVED DURING RENDER, NOT DONE IN THE EFFECT — React's own escape hatch for
   * state that follows a prop. An effect runs AFTER paint, so a new beat's first frame would be
   * painted carrying the previous beat's frame index: the walk beat would open showing the walker
   * already at 3. It is the rule this repo already has for a journey's phase, and the linter names
   * it too (`setState synchronously within an effect`).
   */
  const i = at.key === key ? at.i : 0
  if (at.key !== key) setAt({ key, i: 0 })
  React.useEffect(() => {
    if (!kind || n <= 1) return
    const ms = Math.round(620 / (getSpeechRate() || 1))
    let k = 0
    const t = window.setInterval(() => {
      k += 1
      setAt({ key, i: k })
      if (k >= n - 1) window.clearInterval(t)
    }, ms)
    return () => window.clearInterval(t)
  }, [kind, key, n])
  return i
}

/**
 * THE FILM — a generated clip of the load flying into the plot, stepped frame by frame.
 *
 * Founder's call after seeing the code-drawn bar: *"yeh animation kuch khaas naii hai .. higgsfield se
 * generate karo .. accha proper."* So the two WALKTHROUGH examples get a real animated film, cut into
 * a strip and advanced by the same beat clock as everything else.
 *
 * ⚠️ A VIDEO MODEL CANNOT COUNT, AND IN A MATHS CHAPTER THAT IS FATAL — ask for twelve tiles in rows
 * of four and it will return eleven. `kling3_0` takes a start_image AND an end_image, so both ends of
 * the film are COMPOSED (`scripts/plot-keyframes.py`, exactly 12 tiles along the kerb → exactly 3
 * rows of 4 in the plot) and the model only supplies the motion between them. The caption riding on
 * top comes from `workFrames`, i.e. from the arithmetic, so what the child READS is never the model's
 * opinion.
 *
 * ⚠️ AND IT ONLY EXISTS FOR THE TWO FIXED DEMOS. A film says one set of numbers for ever, and the
 * re-teach re-narrates the child's OWN round — so anything else falls back to `WorkBar`, which is
 * drawn from the data and works for every round. That is the whole reason the bar was not deleted.
 */
const FILM: Record<string, { src: string; cells: number }> = {
  'area|4|3': { src: '/assets/explain/plot_area.png', cells: 12 },
  'perimeter|5|2': { src: '/assets/explain/plot_perimeter.png', cells: 12 },
}
export const filmFor = (r: PlotRound) => FILM[`${r.qType}|${r.frontage}|${r.depth}`] ?? null
const FILM_W = 440, FILM_H = 248

function Film({ film, i }: { film: { src: string; cells: number }; i: number }) {
  const k = Math.max(0, Math.min(film.cells - 1, i))
  return (
    <div style={{
      width: FILM_W, height: FILM_H, borderRadius: 16, overflow: 'hidden',
      border: `1px solid ${P.gold}55`, boxShadow: `0 0 30px ${P.gold}26`,
      backgroundImage: `url(${film.src})`,
      backgroundSize: `${film.cells * 100}% 100%`,
      // one cell of a horizontal strip: 0% is the first, 100% the last
      backgroundPosition: `${(k / (film.cells - 1)) * 100}% 0`,
      imageRendering: 'auto',
    }} />
  )
}

/**
 * THE LOAD, CUT UP — the arithmetic beat, performed, for every round the film cannot cover.
 *
 * The bar is the number the foreman gave; the frames take it apart the way the sentence does. It is
 * drawn in the empty middle of the yard, which costs no layout: reserving a band for it would have
 * shifted the plot on every played round for something only the teaching ever shows.
 */
function WorkBar({ r, frame, w }: { r: PlotRound; frame: WorkFrame; w: number }) {
  const seg = Math.max(3, w / r.target)
  const TONE = { used: P.gold, left: P.cream, each: P.mint } as const
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '42%', transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, pointerEvents: 'none',
    }}>
      <div style={{ position: 'relative', width: seg * r.target, height: 20 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 4, background: 'rgba(120,150,220,0.16)', border: `1px solid ${P.glassBorder}` }} />
        {frame.groups.map(g => (
          <div key={`${g.from}-${g.to}-${g.tone}`} style={{
            position: 'absolute', left: g.from * seg + 1, top: 1, width: (g.to - g.from) * seg - 2, height: 18,
            borderRadius: 3, background: `${TONE[g.tone]}55`, border: `1px solid ${TONE[g.tone]}`,
            boxShadow: `0 0 10px ${TONE[g.tone]}66`, transition: 'all .18s ease-out',
          }} />
        ))}
      </div>
      <span style={{ fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 15, color: P.cream, whiteSpace: 'nowrap' }}>
        {frame.note}
      </span>
    </div>
  )
}

/**
 * The hand's reading, in metres — see `plotMaths`'s span block for why a span may carry a SCORED
 * answer here when it could not in The Height Bar (whole metres are ~12× coarser than inches).
 *
 * ⚠️ THE HYSTERESIS NEEDS THE PREVIOUS READING, AND THE SHELL'S `value` IS HANDED ONLY THE HAND — so
 * the held step lives here, at module scope, and this one function is what BOTH the dwell ring and
 * the instrument's ghost edge call. Two copies would drift by a step at exactly the boundary the
 * hysteresis exists for. It is idempotent (a second call inside the hold band returns the same
 * step), and it self-clears the moment the hands leave the frame.
 */
let held: number | null = null
export function readMetres(r: HandRead): number | null {
  held = snapMetres(spanMetres(r.span), held)
  return held
}

// ─── the task ───────────────────────────────────────────────────────────────────────────
export interface PlotTask extends BaseTask { r: PlotRound }

function toTask(r: PlotRound): PlotTask {
  return {
    r,
    title: r.tag,
    /** ⚠️ WHAT IS ON THE LORRY — the question. The depth is never written anywhere before the peg. */
    badge: badgeFor(r),
    tone: r.qType === 'area' ? 'a' : 'b',
    prompt: r.prompt,
    context: contextFor(r),
    say: r.say,
    /** the 3-wrong re-teach: the same beats the walkthrough plays, narrated */
    work: explainBeats(r).map(b => b.say),
    /** ⚠️ THE PEG IS THE ANSWER, so the board must not draw "= ?" under the load. */
    showEquals: false,
  }
}

// ─── the yard, from above ───────────────────────────────────────────────────────────────
/**
 * ⚠️ THE INSIDE OF THE PLOT IS BARE AND STAYS BARE UNTIL THE COMMIT. An earlier cut ruled the floor
 * with a faint metre grid — one line — which chalked exactly as many countable squares onto the
 * ground as the answer, and on a fence round handed over both side lengths at a glance. The road
 * frontage is ONE unbroken line with no ticks on it for the same reason: it says how WIDE, never how
 * deep, and a child may not count their way to either.
 */
function Yard({ r, v, reveal, ghost, work, land }: { r: PlotRound; v: PlotV; reveal: boolean; ghost: number | null; work: WorkFrame | null; land: boolean }) {
  /**
   * ⚠️ THE VISIBLE DEPTH CLOSES UP ON THE COMMIT — the craft rule's *go back and look at what was
   * built*, done with the scale instead of a camera. While the round is live it is the walk bound on
   * every round alike (so the box can never be read as the answer); once the peg is in there is
   * nothing left to walk, so the plan zooms to the plot the child actually made.
   */
  const pegAt = v.pegged ? v.back : null
  const shownDepth = visibleDepth(pegAt, r.depth)
  /** ⚠️ IN LANDSCAPE THE BOX'S DIMENSIONS SWAP, because the depth is now the horizontal axis. */
  const box = land ? PLAN_BOX_LAND : PLAN_BOX
  const U = land ? metreOf(r.frontage, shownDepth, box.h, box.w) : metreOf(r.frontage, shownDepth, box.w, box.h)
  /** ACROSS is the frontage, DEEP is the walk — in unit-space, whichever way the plan is turned */
  const ACROSS = r.frontage * U, DEEP = shownDepth * U
  const W = land ? DEEP : ACROSS, H = land ? ACROSS : DEEP
  /**
   * ⚠️ EVERY MARKER IS DERIVED FROM THE METRE, NOT TYPED. The metre stopped being a constant when the
   * box started deriving it — and the walker, the peg and the corner posts did not come with it, so on
   * a 56px metre the child's own character rendered at 16px, a third of a metre tall, and vanished.
   * Founder: *"kitna chota dekh raha hai .. yeh character."* A floor keeps them legible on the widest
   * plot, where the metre is smallest.
   */
  const { walker, peg: pegPx, post, num: numPx } = markers(U)
  /** ⚠️ the strip is derived from everything that has to fit in it — see `roadBand` / `roadStrip` */
  const band = roadBand(numPx, walker, ROAD)
  const strip = roadStrip(numPx, walker, ROAD)
  const road = land ? strip.width : band.height
  /**
   * ⚠️ A RIGHT ANSWER LAYS THE UNITS TOO, AND THE SHELL WILL NOT DO IT FOR YOU. `reveal` is true on
   * a WRONG answer (and the re-teach) and never on a right one — the shell goes straight to
   * "You solved it ✓" — so as first written this chapter showed the delivery only to children who
   * got it wrong, and the payoff it exists for (*"and it comes out to the metre"*) was never once on
   * screen for a child who got it right. Caught by driving the camera path, not by reading it.
   * ⚠️ It is gated on `v.pegged`, so nothing is laid while the child is still deciding.
   */
  const shown = reveal || v.laid || (v.pegged && gradePeg(r, v.back))
  /**
   * ⚠️ WHAT THE DELIVERY LAYS INTO THE PLOT THE CHILD PEGGED — never the one they should have. Peg
   * too near the road and the units run out with some left on the lorry; peg too far back and the
   * floor is bare past where they stop. That is what makes a miss a consequence.
   */
  const laid = pegAt === null ? [] : slotsFor({ ...r, depth: pegAt }).slice(0, r.target)
  const over = r.target - laid.length
  /**
   * ⚠️ ONE MAPPER, NOT TWO RENDERERS. Everything below is placed in unit-space — `across` runs along
   * the road, `deep` runs into the yard — and these three turn that into pixels for whichever way the
   * plan is facing. Two copies of the drawing code would drift the first time a marker moved.
   */
  const edge = (deep: number, tone: string, dash?: boolean) => (
    <div style={{
      position: 'absolute',
      ...(land
        ? { left: deep * U - 2, top: 0, width: 4, height: ACROSS, borderLeft: dash ? `3px dashed ${tone}` : 'none' }
        : { left: 0, top: deep * U - 2, width: ACROSS, height: 4, borderTop: dash ? `3px dashed ${tone}` : 'none' }),
      borderRadius: 2, background: dash ? 'none' : tone, boxShadow: dash ? 'none' : `0 0 12px ${tone}`,
    }} />
  )
  /** a marker centred on a point of the plan */
  const spot = (across: number, deep: number, size: number): React.CSSProperties => {
    const { left, top } = planXY(land, across, deep, U)
    return { position: 'absolute', left: left - size / 2, top: top - size / 2 }
  }
  /** one of the two sides, drawn as far back as the child has walked */
  const sideEdge = (i: 0 | 1): React.CSSProperties => ({
    position: 'absolute',
    ...(land
      ? { left: 0, top: i ? ACROSS - 2 : 0, width: v.back * U, height: 2 }
      : { left: i ? ACROSS - 2 : 0, top: 0, width: 2, height: v.back * U }),
    background: `${P.gold}55`,
  })
  return (
    /* ⚠️ THE TAPE SITS UNDER THE PLAN, NOT BESIDE IT. Beside it, the tape's ~110px pushed the yard
       that far LEFT of the column's centre — and measured at 1280×720 that ran the plot's top-left
       corner 65 × 62 px under the shell's pinned chalkboard, which is the question drawn over the
       answer. Stacked, the plan is centred on the column and the collision is not expressible. */
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', width: W + (land ? road : 0), height: H + (land ? 0 : road) }}>
        {/* THE ROAD — the one edge that is given, and the side the frontage runs along */}
        <div style={{
          position: 'absolute',
          ...(land
            ? { left: 0, top: -14, width: road, height: H + 28, borderRight: `1px solid ${P.glassBorder}` }
            : { left: -18, top: 0, width: W + 36, height: road, borderBottom: `1px solid ${P.glassBorder}` }),
          background: 'rgba(120,150,220,0.13)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 4,
        }}>
          <span style={{ fontFamily: 'var(--font-numeric)', fontSize: 12, letterSpacing: 2, color: P.creamSoft }}>ROAD</span>
        </div>

        <div style={{ position: 'absolute', left: land ? road : 0, top: land ? 0 : road, width: W, height: H }}>
          {/* the frontage, GIVEN and already pegged — unbroken, unticked, with its own numeral */}
          {edge(0, P.gold)}
          {[0, ACROSS].map(a => (
            <span key={a} style={{ ...spot(a, 0, post), width: post, height: post, borderRadius: '50%', background: P.gold, boxShadow: `0 0 ${post}px ${P.gold}` }} />
          ))}
          {/* ⚠️ RIGHT-ALIGNED IN ITS OWN BOX ON A LANDSCAPE PLAN, so the numeral cannot reach the
              walker straddling the line however wide the text gets — see `roadStrip`. */}
          <span style={{
            position: 'absolute',
            ...(land
              ? { left: -(strip.numBox + strip.overhang + ROAD_GAP), top: ACROSS / 2 - numPx, width: strip.numBox, textAlign: 'right' as const }
              : { left: 0, top: band.numTop, width: ACROSS, textAlign: 'center' as const }),
            fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: numPx, color: P.gold,
          }}>{r.frontage} m</span>

          {/* the two sides, as far as the child has walked — their own pacing, drawn */}
          {v.back > 0 && ([0, 1] as const).map(i => <div key={i} style={sideEdge(i)} />)}

          {/* ⚠️ THE GHOST FOLLOWS THE LIVE SPAN AND SAYS ONLY WHAT WAS READ. It is what makes the
              gesture a LENGTH rather than a number typed with the arms — the far edge sits between
              the child's hands and moves with them. It never says whether it is right, and nothing
              is dealt until the dwell commits. */}
          {ghost !== null && !v.pegged && !shown && edge(ghost * U, P.creamSoft, true)}

          {/* what the delivery laid */}
          {shown && laid.map(s => {
            const b = slotBox({ ...r, depth: pegAt ?? r.depth }, s)
            /** across/deep in unit-space, turned into px by the same mapper as everything else */
            const { left: L, top: T } = planXY(land, b.x, b.y, U)
            const wPx = (land ? b.h : b.w) * U, hPx = (land ? b.w : b.h) * U
            return b.w && b.h ? (
              <div key={s} data-unit={s} style={{
                position: 'absolute', left: L + 1, top: T + 1, width: U - 2, height: U - 2,
                borderRadius: 3, background: `${P.mint}55`, border: `1px solid ${P.mint}`,
              }} />
            ) : (
              <div key={s} data-unit={s} style={{
                position: 'absolute', left: L - (wPx ? 0 : 2.5), top: T - (hPx ? 0 : 2.5),
                width: wPx || 5, height: hPx || 5, borderRadius: 2, background: P.mint,
                boxShadow: `0 0 8px ${P.mint}99`,
              }} />
            )
          })}

          {/* the far edge, once the peg is in */}
          {pegAt !== null && edge(pegAt * U, P.cream)}
          {pegAt !== null && (
            <span style={{ ...spot(r.frontage / 2, pegAt, pegPx), fontSize: pegPx, lineHeight: 1 }}>📍</span>
          )}

          {/* the arithmetic beat, performed — see WorkBar. Never reachable from a played round. */}
          {work && !shown && <WorkBar r={r} frame={work} w={Math.max(W, 150)} />}

          {/* where the child is standing, while they are still walking */}
          {!v.pegged && !shown && (
            <span style={{
              ...spot(r.frontage / 2, v.back, walker),
              ...(land ? {} : { top: v.back * U - walker * 0.62 }),
              fontSize: walker, lineHeight: 1, transition: 'left .18s ease-out, top .18s ease-out',
            }}>🚶</span>
          )}
        </div>
      </div>

      {/* the tape: how far they have PACED. Their own measuring — never a target, never a product. */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', flexWrap: 'wrap', gap: 14, minHeight: 26 }}>
        <span style={{ fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 22, color: P.cream }}>
          {v.back} <span style={{ fontSize: 12, opacity: 0.65 }}>{v.back === 1 ? 'metre back' : 'metres back'}</span>
        </span>
        {shown && (
          <span style={{ fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 17, color: P.mint }}>
            {equationFor(r)}
          </span>
        )}
        {/* what did not fit on the plot they pegged — the consequence, counted */}
        {shown && over > 0 && (
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: P.creamSoft }}>
            {over} {r.unitWord} still on the lorry
          </span>
        )}
      </div>
    </div>
  )
}

// ─── the instrument ─────────────────────────────────────────────────────────────────────
function Plot({ task, value, setValue, disabled, reveal, onCommit }: InstrumentProps<PlotV, PlotTask>) {
  const { input, read } = useHand()
  const r = task.r
  const v = value ?? START
  const onCam = input === 'hand'
  const latest = useLatest(task, v)
  /** the plan's long axis follows the frame's — a phone gets the portrait plan, a laptop the wide one */
  const land = useLandscape()
  /**
   * ⚠️ THE TWO BEATS THAT NARRATE A MOVE NOW MAKE IT. `work` cuts the load up frame by frame — the
   * division, performed, instead of a sentence over a static yard — and `walk` paces the metres out
   * one at a time so *"counting my metres. 1, 2, 3"* is counted rather than slid. Both run only in
   * the walkthrough: `step` is set by the beats and by nothing in play.
   * ⚠️ The hook is called unconditionally; only `kind` decides whether it ticks.
   */
  const frames = v.step === 'work' ? workFrames(r) : []
  /** the film, when this exact example has one — the two walkthrough demos and nothing else */
  const film = v.step === 'work' ? filmFor(r) : null
  const nFrames = v.step === 'work' ? (film?.cells ?? frames.length) : v.step === 'walk' ? v.back + 1 : 1
  const fi = useBeatFrames(v.step, `${r.qType}|${r.target}|${v.step}|${v.back}`, nFrames)
  const shown: PlotV = v.step === 'walk' ? { ...v, back: Math.min(fi, v.back) } : v
  /** ⚠️ THE CAPTION IS THE ARITHMETIC, NOT THE FILM'S OPINION — it tracks the film's progress but is
   *  indexed into `workFrames`, so what the child reads is derived from the numbers either way. */
  const note = frames.length
    ? frames[Math.round((fi / Math.max(1, nFrames - 1)) * (frames.length - 1))]?.note
    : undefined
  const walk = (d: number) => {
    if (disabled || reveal) return
    const next = { ...latest.read(), back: Math.max(0, Math.min(MAX_DEPTH, latest.read().back + d)) }
    latest.write(next); setValue(next)
  }
  const peg = () => {
    const cur = latest.read()
    if (disabled || reveal || cur.back < 1) return
    const next = { ...cur, pegged: true }
    latest.write(next); setValue(next); onCommit(next)
  }
  const btn = (label: string, on: () => void, primary?: boolean, off?: boolean) => (
    <button onClick={on} disabled={disabled || reveal || off} style={{
      minWidth: 58, height: 58, padding: '0 18px', borderRadius: 14,
      cursor: disabled || off ? 'default' : 'pointer',
      background: primary ? P.gold : P.glass, border: `1px solid ${primary ? P.gold : P.glassBorder}`,
      color: primary ? P.inkOnPaper : P.cream, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18,
      boxShadow: primary ? `0 0 20px ${P.gold}88` : 'none', opacity: disabled || off ? 0.45 : 1,
    }}>{label}</button>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      {film ? (
        /* the cutaway: the film takes the yard's place for the one beat that explains the sum */
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <Film film={film} i={fi} />
          <span style={{ fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 17, color: P.cream }}>{note}</span>
        </div>
      ) : (
        <div style={{ padding: '16px 22px', borderRadius: 22, background: P.glass, border: `1px solid ${P.gold}55`, boxShadow: `0 0 30px ${P.gold}26` }}>
          <Yard r={r} v={shown} land={land} reveal={!!reveal} ghost={onCam ? readMetres(read) : null}
            work={v.step === 'work' ? frames[Math.min(fi, frames.length - 1)] : null} />
        </div>
      )}

      {/* ⚠️ THE HAND OWNS THE CONTINUOUS VALUE, SO THE WALK BUTTONS GO WITH THE CAMERA ON — a step
          pressed beside a live reading is overwritten before the finger leaves the button. The
          gesture's own commit is the dwell, which the shell owns. */}
      {!reveal && !onCam && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {btn('◀ nearer', () => walk(-1), false, v.back <= 0)}
          {/* ⚠️ IDENTICAL AT EVERY DEPTH THE CHILD MAY PEG. A commit that lights up on the right
              answer is chapter 4's green Ready button — the child wins by watching the colour.
              ⚠️ The ONE exception is standing on the road, where there is nothing to peg yet: a
              control that is dim and says nothing is a dead button, so it says what to do instead. */}
          {btn(v.back < 1 ? 'Walk back into the yard' : 'Peg it ✓', peg, true, v.back < 1)}
          {btn('back ▶', () => walk(1), false, v.back >= MAX_DEPTH)}
        </div>
      )}

      {/* the chapter's own words on a miss, beside the plot they actually pegged */}
      {reveal && !gradePeg(r, v.back) && (
        <span style={{ maxWidth: 420, textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: P.creamSoft }}>
          {missFor(r, v.back)}
        </span>
      )}
      {!reveal && <Cue P={P} text={instructionFor(onCam ? 'hand' : 'tap')} />}
    </div>
  )
}

// ─── the config ─────────────────────────────────────────────────────────────────────────
const walkthrough = (d: PlotRound) => ({
  task: toTask(d),
  initial: START,
  hand: 'tap' as const,
  steps: explainBeats(d).map((b, i, all) => ({
    say: b.say,
    value: { back: b.depth, pegged: b.pegged !== null, laid: b.laid, step: b.step },
    /** the equation is written ONCE, on the beat that lays the units — never before the peg */
    board: i === all.length - 1 ? equationFor(d) : undefined,
  })),
})

const config: GameConfig<PlotV, PlotTask> = {
  chapterId: 'areaPerimeter',
  band: '9-11',
  title: 'THE EMPTY PLOT',
  ticketLabel: 'docket',
  palette: P,
  motif: '🏗️',

  makeTask: (d, asked) => toTask(makeRound(d, (asked ?? []) as string[])),
  initialValue: () => START,
  grade: (t, v) => gradePeg(t.r, v.back),
  revealText: t => `${t.r.depth} m back`,

  /** dedupe on the SHAPE of the plot, since that is the whole question */
  sig: t => `${t.r.qType}|${t.r.frontage}x${t.r.depth}`,

  /** ⚠️ Two readings of one gesture — an area round is one division, a perimeter round is
   *  halve-then-subtract. A strong child gets ~6 rounds, so a coin-flip generator misses one of
   *  them about a third of the time. See GameConfig.coverage for the arithmetic. */
  coverage: { of: t => t.r.qType, all: ['area', 'perimeter'] },

  /**
   * ⚠️ THE BAND'S SPECIALITY, AND THE FIRST TIME A SPAN CARRIES A SCORED ANSWER HERE. Hands apart
   * IS the far edge — the plot is drawn between them — so the body carries the IDEA rather than the
   * notation. Holding up N fingers would STATE the depth, which turns the answer back into a number
   * and gives up exactly what three rejected mechanics were rejected to protect.
   * The arithmetic that lets it be scored (±0.37 m of noise against a 1 m step) is in `plotMaths`.
   */
  hand: {
    reads: 'span',
    /** a span needs TWO hands by definition; one hand in frame is not a length */
    ready: r => r.hands >= 2 && spanMetres(r.span) !== null,
    value: r => readMetres(r),
    /** the peg goes in where the hands say — one gesture, one peg */
    enter: (_t, _v, n) => ({ back: n, pegged: true, laid: false }),
    commits: () => true,
    hint: r => (r.hands < 2 ? 'Show Milo both hands' : 'Hold them apart, and still'),
    denied: 'Milo can watch your hands, or you can walk it with the buttons — both work.',
  },

  /**
   * The peg walks to where it belonged, and the delivery lays itself.
   * ⚠️ IT WAITS FIRST. The plot the CHILD pegged — bare past their peg, or units left on the lorry —
   * is the teaching, and taking it away instantly leaves a verdict with no consequence attached.
   * The shell allows 2.3 s before the next round, so the hold is 900 ms and the walk is brisk.
   */
  glide: (t, from, setValue, later) => {
    const dir = Math.sign(t.r.depth - from.back)
    const steps = Math.abs(t.r.depth - from.back)
    for (let i = 1; i <= steps; i++) {
      later(() => setValue({ back: from.back + dir * i, pegged: false, laid: false }), 900 + i * 110)
    }
    later(() => setValue({ back: t.r.depth, pegged: true, laid: true }), 900 + steps * 110 + 160)
  },

  Instrument: Plot,

  start: {
    blurb: 'The foreman tells you what is on the lorry and how far the plot runs along the road. The rest of the yard is empty — there is nothing out there to count. Work out how far back it goes, and peg it.',
    ticket: { title: 'Peg it out', badge: '24 tiles', tone: 'a' },
    startLabel: 'Walk in',
  },

  /** ONE OF EACH READING, so both sums are taught before anything is scored. */
  tutorial: DEMO.map(walkthrough),

  guided: { task: toTask(GUIDED), coach: 'Your turn — I will talk you through it.', hand: 'tap' },
}

export default function EmptyPlotGame(p: { childName: string; onFinish: (c: number, w: number, m?: boolean) => void; onExit: () => void }) {
  return <Game config={config} {...p} />
}

/** exported so the gate drives the same objects the chapter renders from */
export { config as EMPTY_PLOT_CONFIG, toTask, walkthrough }
export const MISS = missFor
