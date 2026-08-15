'use client'
/**
 * THE LOADING BAY (9–11 · `dataGraphs`) on GameShell — the eighth of the band's ten chapters to come
 * across, and the first of the three that were still storybook.
 *
 * **SEND THE CART, unchanged.** A delivery lands, the goods stand in four stacks, and THE STACKS ARE
 * THE CHART — a pictograph whose bars are countable units of real cargo. The foreman needs an answer
 * to act on (which stack, how many of a kind, how many spare, how many altogether) and the correct
 * answer sends the cart. Delete the goods and there is no question left.
 *
 * ⚠️ EVERYTHING THAT CAN BE WRONG IS IN `story/cargo.ts` — the ladder, the grader, the miss lines,
 * the demo beats, the anti-oracle rules and every word the child reads. This file re-shapes; it
 * re-implements nothing. What went with the port is the painted world: three depot backdrops, their
 * per-scene ground lines, the foreman sprite, his speech bubble and ~70 lines of layout arithmetic
 * that had to be swept at ten viewport sizes. The shell owns the bands now.
 *
 * ⚠️ THE HAND MEANS TWO DIFFERENT THINGS HERE, DECLARED PER ROUND TYPE — founder's call, 2026-08-15.
 * On a `most` round 1–4 fingers picks a stack; on a count round the fingers ARE the number and that
 * many goods go onto the cart. That is The Angle Shop's precedent verbatim (one tilt, a degree on one
 * round type and a fold axis on another), and it is what `HandSpec.value` taking the TASK exists for.
 * ⚠️ A `total` round has no hand path at all — its answers run to 22 and two hands hold ten — and
 * `instructionFor` says so on screen, because a gesture that silently does nothing for one round in
 * four reads as a broken camera.
 */
import React from 'react'
import { Game, type BaseTask, type GameConfig, type InstrumentProps } from './parts/GameShell'
import { KID_P as P, Cue, useLatest } from './parts/kidKit'
import { useHand } from '@/infra/ar/HandInput'
import {
  makeRound, graded, missFor, nudgeFor, explainBeats, instructionFor, badgeFor,
  loadStack, pickStack, loaded, EMPTY, MAX_UNITS, Q_ALL, DEMO, GUIDED,
  type CartV, type Good, type LbRound, type Tier,
} from '@/features/chapters/story/cargo'

/**
 * ⚠️ ONE CARGO ITEM, AUTHORED BIG. `FitSlot` runs at `max={1}` on a landscape frame — it only ever
 * SHRINKS an instrument — so a pictograph drawn at a modest size renders at that size for ever and
 * floats in a third of the frame, which the founder caught on a screenshot of The Coin Tray. The
 * goods are the one thing here that has to be COUNTABLE, so they are the last thing that should pay
 * for the layout.
 */
const UNIT = 38
const COL_GAP = 26
/** the cart's own copies, which only have to be countable in a pile rather than compared in a column */
const CART_UNIT = 22

const Sprite = ({ g, size }: { g: Good; size: number }) => (
  <img src={g.src} alt="" draggable={false} decoding="async"
    onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.001' }}
    style={{
      width: size, height: size, objectFit: 'contain', display: 'block',
      /** ⚠️ scaled so the sprite's INK fills the slot, not its square-padded file box — see `Good.ink` */
      transform: `scale(${g.ink})`,
      filter: `drop-shadow(0 2px 6px ${P.goldDeep}55)`,
    }} />
)

// ─── the task ───────────────────────────────────────────────────────────────────────────
export interface LbTask extends BaseTask { r: LbRound }

function toTask(r: LbRound): LbTask {
  return {
    r,
    title: r.tag,
    /** ⚠️ THE OPERATION, NEVER A QUANTITY — see `badgeFor`. */
    badge: badgeFor(r),
    tone: r.qType === 'most' ? 'a' : 'b',
    prompt: r.prompt,
    context: r.prompt,
    say: r.prompt,
    /** the 3-wrong re-teach: the same beats the walkthrough plays, narrated */
    work: explainBeats(r).map(b => b.say),
    /** ⚠️ THE CART IS THE ANSWER, so the board must not draw "= ?" under a badge that has one. */
    showEquals: false,
  }
}

// ─── one stack: a bar made of countable things ─────────────────────────────────────────
/**
 * ⚠️ A LOADED ITEM LEAVES AN EMPTY SLOT RATHER THAN CLOSING THE COLUMN UP. The lane is reserved from
 * empty, so nothing beside it jumps as the cart fills and a child part-way through counting is never
 * shuffled underneath — and the bar's own footprint still says how tall the stack WAS.
 */
function Stack({ good, n, taken, chosen, dim, onUnit, onStack, label }: {
  good: Good; n: number; taken: number; chosen: boolean; dim: boolean; label: boolean
  onUnit?: () => void; onStack?: () => void
}) {
  return (
    <div onClick={onStack}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        cursor: onStack ? 'pointer' : 'default', opacity: dim ? 0.42 : 1, transition: 'opacity .25s ease',
      }}>
      <div style={{
        display: 'flex', flexDirection: 'column-reverse', alignItems: 'center',
        /** the full bar height from empty, so the four columns share one baseline and one ceiling */
        height: MAX_UNITS * UNIT, width: UNIT,
        borderRadius: 8, outline: chosen ? `3px solid ${P.mint}` : 'none', outlineOffset: 5,
      }}>
        {Array.from({ length: n }).map((_, k) => {
          /** loaded items leave from the TOP of the stack, which is where a hand would take them */
          const gone = k >= n - taken
          return (
            <div key={k} onClick={onUnit && !gone ? e => { e.stopPropagation(); onUnit() } : undefined}
              style={{ width: UNIT, height: UNIT, flexShrink: 0, cursor: onUnit && !gone ? 'pointer' : 'inherit' }}>
              {!gone && <Sprite g={good} size={UNIT} />}
            </div>
          )
        })}
      </div>
      {/* the base plate — what makes four columns read as one chart rather than four piles */}
      <div style={{
        width: UNIT + 10, height: 5, borderRadius: 3,
        background: chosen ? P.mint : P.gold, boxShadow: `0 0 10px ${chosen ? P.mint : P.gold}88`,
      }} />
      <span style={{
        fontFamily: 'var(--font-numeric)', fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase',
        color: P.creamSoft, maxWidth: UNIT + COL_GAP, textAlign: 'center', lineHeight: 1.15,
      }}>{good.plural}</span>
      {/**
        * ⚠️ THE NUMERAL EXISTS ONLY AFTER THE COMMIT. The chapter this replaces printed every bar's
        * value while the question was open, so "how many melons?" had its answer above the bar. Here
        * the axis is written at the end, as the summary of work already done.
        */}
      <span style={{
        fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 22,
        color: P.cream, opacity: label ? 1 : 0, transition: 'opacity .3s ease',
      }}>{n}</span>
    </div>
  )
}

// ─── the instrument ─────────────────────────────────────────────────────────────────────
/** Is there anything worth committing? Never whether it is RIGHT. */
export const ready = (r: LbRound, v: CartV) => (r.qType === 'most' ? v.pick !== null : loaded(v) > 0)

function Bay({ task, value, setValue, disabled, reveal, onCommit }: InstrumentProps<CartV, LbTask>) {
  const { input, read } = useHand()
  const r = task.r
  const v = value ?? EMPTY
  const onCam = input === 'hand'
  /** whole-stack rounds think in COLUMNS; the other two think in single items */
  const perStack = r.qType === 'most' || r.qType === 'total'
  /**
   * ⚠️ THE VALUE IS MIRRORED IN A REF. Two taps landing in ONE React batch both read the same
   * RENDERED `value`, so the second overwrites the first instead of adding to it — the batched-tap
   * fault this repo has met eight times, and loading a stack one item at a time is exactly the
   * gesture children perform fastest. `setValue` being functional would not save it: the state
   * advances correctly and the closure the next tap runs is still the old one.
   */
  const latest = useLatest(task, v)
  /**
   * ⚠️ THE CART'S COUNT AND THE CHART'S NUMERALS APPEAR TOGETHER, AND ONLY ONCE AN ANSWER IS IN —
   * founder's call. A counter climbing as four stacks go on does the adding for a child who cannot
   * add, and a numeral over a bar is the printed answer this chapter exists to remove.
   *
   * ⚠️ IT IS `disabled && ready`, NOT `disabled` ALONE, and the walkthrough is why. The shell renders
   * a tutorial instrument permanently disabled, so the plain version printed all four numerals over
   * beat 2 — *"you can see it without counting a thing"* — while the counts were written above every
   * bar. Keyed on the VALUE it opens exactly when Milo announces the answer, and in play it opens on
   * the commit, which is the same instant. ⚠️ And `reveal` on its own is not enough either: the shell
   * only reveals a WRONG answer, so the axis would be shown to nobody who got it right.
   */
  const told = reveal || (disabled && ready(r, v))

  const put = (i: number, n: number) => {
    if (disabled || reveal) return
    const next = loadStack(r, latest.read(), i, n)
    latest.write(next); setValue(next)
  }
  const tapUnit = (i: number) => put(i, latest.read().load[i] + 1)
  const tapStack = (i: number) => {
    if (disabled || reveal) return
    if (r.qType === 'most') {
      const next = pickStack(latest.read(), i)
      latest.write(next); setValue(next)
      return
    }
    /** tap a whole column on, tap it again to take it back off */
    put(i, latest.read().load[i] >= r.counts[i] ? 0 : r.counts[i])
  }
  const clear = () => {
    if (disabled || reveal) return
    latest.write(EMPTY); setValue(EMPTY)
  }
  const send = () => {
    const cur = latest.read()
    if (disabled || reveal || !ready(r, cur)) return
    onCommit(cur)
  }

  const btn = (label: string, on: () => void, primary?: boolean, off?: boolean) => (
    <button onClick={on} disabled={disabled || reveal || off} style={{
      minHeight: 54, padding: '0 22px', borderRadius: 14, cursor: disabled || off ? 'default' : 'pointer',
      background: primary ? P.gold : P.glass, border: `1px solid ${primary ? P.gold : P.glassBorder}`,
      color: primary ? P.inkOnPaper : P.cream, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17,
      boxShadow: primary ? `0 0 20px ${P.gold}88` : 'none', opacity: disabled || off ? 0.45 : 1,
    }}>{label}</button>
  )

  /** the goods riding on the cart, in the order they were loaded */
  const cargo: Good[] = []
  v.load.forEach((n, i) => { for (let k = 0; k < n; k++) cargo.push(r.goods[i]) })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <style>{'@keyframes lb_ride{from{opacity:0;transform:translateX(-26px) scale(.7)}to{opacity:1;transform:none}}'}</style>

      {/* THE CHART */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: COL_GAP, padding: '20px 26px 14px',
        borderRadius: 22, background: P.glass, border: `1px solid ${P.gold}55`, boxShadow: `0 0 30px ${P.gold}26`,
      }}>
        {r.goods.map((g, i) => (
          <Stack key={g.src} good={g} n={r.counts[i]} taken={v.load[i]}
            chosen={v.pick === i}
            /** ⚠️ a focus round dims what the question is NOT about — on `diff` that is BOTH stacks */
            dim={(r.qType === 'howMany' && i !== r.focus) || (r.qType === 'diff' && i !== r.focus && i !== r.other)}
            label={told}
            onUnit={perStack ? undefined : () => tapUnit(i)}
            onStack={perStack ? () => tapStack(i) : undefined} />
        ))}
      </div>

      {/* THE CART — where the answer collects, as the goods themselves */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, minHeight: CART_UNIT + 20,
        padding: '8px 16px', borderRadius: 16,
        background: 'rgba(120,150,220,0.10)', border: `1px dashed ${P.glassBorder}`,
      }}>
        <span style={{ fontFamily: 'var(--font-numeric)', fontSize: 13, letterSpacing: 1.6, textTransform: 'uppercase', color: P.creamSoft }}>
          cart
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 11 * (CART_UNIT + 4), minHeight: CART_UNIT }}>
          {r.qType === 'most'
            ? v.pick !== null && <Sprite g={r.goods[v.pick]} size={CART_UNIT} />
            : cargo.map((g, k) => (
              <div key={k} style={{ animation: 'lb_ride .28s ease-out both' }}>
                <Sprite g={g} size={CART_UNIT} />
              </div>
            ))}
        </div>
        {told && r.qType !== 'most' && (
          <span style={{ fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 26, color: P.cream }}>{loaded(v)}</span>
        )}
      </div>

      {/* ⚠️ THE COMMIT IS A REAL BUTTON ON BOTH PATHS. Replacing it with the dwell ring leaves a child
          whose gesture the camera cannot read with nothing to press at all — and it is the only way
          to answer a `total` round, where the hand does not ship. */}
      {!reveal && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* ⚠️ IDENTICAL AT EVERY CART. A commit that lights up when the load becomes right replaces
              the chapter with a hot/cold game — chapter 4's green Ready button, which the founder
              caught. Only enabled-ness varies, i.e. "have you done anything yet". */}
          {btn('Send the cart ✓', send, true, !ready(r, v))}
          {loaded(v) > 0 && btn('Put back', clear)}
        </div>
      )}

      {/* the chapter's own words on a miss, beside the cart the child actually loaded */}
      {reveal && !graded(r, v) && (
        <span style={{ maxWidth: 420, textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: P.creamSoft }}>
          {missFor(r)}
        </span>
      )}
      {/* ⚠️ A READING THE ROUND CANNOT USE NEEDS SAYING OUT LOUD — seven fingers names no stack, and
          silence at a held-up hand is the dead button this repo calls the worst outcome there is. */}
      {!reveal && <Cue P={P} text={(onCam && nudgeFor(r, read.count)) || instructionFor(r, onCam ? 'hand' : 'tap')} />}
    </div>
  )
}

// ─── the config ─────────────────────────────────────────────────────────────────────────
const walkthrough = (d: LbRound) => ({
  task: toTask(d),
  initial: EMPTY,
  hand: 'tap' as const,
  steps: explainBeats(d).map(b => ({ say: b.say, value: b.v })),
})

const config: GameConfig<CartV, LbTask> = {
  chapterId: 'dataGraphs',
  band: '9-11',
  title: 'THE LOADING BAY',
  ticketLabel: 'manifest',
  palette: P,
  motif: '📦',

  makeTask: (d, asked) => toTask(makeRound(d as Tier, (asked ?? []) as string[])),
  initialValue: () => EMPTY,
  grade: (t, v) => graded(t.r, v),
  revealText: t => (t.r.qType === 'most' ? `the ${t.r.goods[t.r.answer].plural}` : `${t.r.answer}`),

  /** ⚠️ Dedupe on the MATH. Include the cargo and the same question comes back the moment the
   *  sprites are re-drawn, which is exactly what the rotating goods would otherwise buy. */
  sig: t => `${t.r.qType}|${t.r.counts.join(',')}|${t.r.focus}|${t.r.other}`,

  /** ⚠️ Four readings and a ~6-round budget for a strong child, so a coin-flip generator would miss
   *  one of them most of the time — and `total` lives at L3 alone. See GameConfig.coverage. */
  coverage: { of: t => t.r.qType, all: Q_ALL },

  /**
   * ⚠️ THE BAND'S SPECIALITY, AND ONE READING MEANING TWO THINGS — see the header.
   * ⚠️ `ready` REQUIRES A COUNT, unlike The Coin Tray: no answer in this chapter is ever zero (every
   * stack holds at least one, and the four counts are distinct so a difference is at least one), so
   * a fist means nothing here and must not commit.
   */
  hand: {
    reads: 'count',
    ready: r => r.hands > 0 && r.count > 0,
    /** ⚠️ `total` reaches 22 and two hands hold ten — the gesture does not ship on that round. */
    when: t => t.r.qType !== 'total',
    enter: (t, v, n) => (t.r.qType === 'most' ? pickStack(v, n - 1) : loadStack(t.r, v, t.r.focus, n)),
    /** an out-of-range stack number leaves the value untouched, so nothing commits — see `nudgeFor` */
    commits: (t, v) => ready(t.r, v),
    hint: r => (r.hands === 0 ? 'Show Milo your hand' : 'Hold it still'),
    denied: 'Milo can count your fingers, or you can tap the goods — both work.',
  },

  /**
   * The cart fills itself with what should have been on it.
   * ⚠️ IT WAITS FIRST. The cart the CHILD loaded — too few, too many, or off the wrong stack — is the
   * teaching, and taking it away instantly leaves a verdict with no consequence attached.
   */
  glide: (t, _from, setValue, later) => {
    const r = t.r
    later(() => setValue(EMPTY), 800)
    if (r.qType === 'most') { later(() => setValue({ load: [0, 0, 0, 0], pick: r.answer }), 1000); return }
    const want = r.qType === 'total' ? r.counts.slice() : r.counts.map((_, i) => (i === r.focus ? r.answer : 0))
    /** column by column, so the reveal is the loading performed rather than a cart that blinks full */
    want.forEach((n, i) => {
      if (n > 0) later(() => setValue({ load: want.map((m, j) => (j <= i ? m : 0)), pick: null }), 1000 + i * 220)
    })
  },

  Instrument: Bay,

  start: {
    /**
     * THE DAILY ANCHOR, and only here — every per-round line names the cargo that is actually on
     * screen. ⚠️ AND THE TALLY IS KEPT INSIDE WHAT THE CHAPTER CAN DRAW: `MAX_UNITS` is 7 and the
     * tier a child opens on caps a stack at 5, so an anchor reading "Sam 8" would state a number no
     * stack can ever reach — the teaching contradicting every round that follows it.
     */
    blurb: 'Goals this season: Sam 5, Alex 2, Jordan 4, Riley 3. Who scored most is something you SEE — how many more Sam got than Alex, you work out. Milo’s loading bay is the same: read the stacks, load the cart, send it off.',
    ticket: { title: 'Biggest stack', badge: 'biggest?', tone: 'a' },
    startLabel: 'Start the shift',
  },

  /** ONE OF EACH GESTURE — pick a stack, load one at a time, and the subtraction you cannot see. */
  tutorial: DEMO.map(walkthrough),

  guided: { task: toTask(GUIDED), coach: 'Your turn — I will talk you through it.', hand: 'tap' },
}

export default function LoadingBayGame(p: { childName: string; onFinish: (c: number, w: number, m?: boolean) => void; onExit: () => void }) {
  return <Game config={config} {...p} />
}

/** exported so the gate drives the same objects the chapter renders from */
export { config as LOADING_BAY_CONFIG, toTask, walkthrough }
