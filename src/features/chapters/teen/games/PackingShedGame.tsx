'use client'
/**
 * THE PACKING SHED (9–11 · `timesTables`) — the chapter, as a data file on GameShell.
 *
 * ⚠️⚠️ THE CRATES ARE CLOSED WHILE THE QUESTION IS OPEN. Fact fluency means knowing 7 × 8 without
 * counting, so an array a child can count is the scene answering the question. The pallet shows how
 * MANY crates and what is stamped on one; it never shows what is inside until the label has been
 * sent. Then they tip out, and the picture becomes the CHECK rather than the answer — the same
 * order The Empty Plot settled on (commit to a number BEFORE the countable thing exists).
 *
 * ⚠️ THE ANSWER IS TYPED, NOT PICKED. `GameConfig.answerPad` offers a handful of chips, and a
 * multiplication fact is exactly the question a child can win by ELIMINATING — which is the fault
 * the diagnostic was just rebuilt to remove. The label carries its own ten digits, the way The Coin
 * Tray's tray does, so there is nothing to eliminate and the instrument stays on screen while it
 * fills.
 *
 * ⚠️ AND SEND IS LIVE THE MOMENT THERE IS SOMETHING TO SEND — never gated on a digit count.
 * chapter-craft §0b: FitOut shipped `disabled={digits.length < windows}` with a two-window pad and
 * a one-digit answer, so a child who worked out 8 and pressed Done got nothing at all. This
 * chapter's answers run from 6 to 116, so a fixed width would be that bug by construction.
 *
 * ⚠️ NO CAMERA HERE, DELIBERATELY (founder's call). A hand reads 0–10 and these answers reach the
 * hundreds, so the two inputs could not express the same set of questions — chapter-craft-ar's
 * one-instrument-two-inputs hole. The Minibus Run next door is the band's AR chapter; its answers
 * are all counts. The band is mixed on purpose.
 */
import React from 'react'
import { Game, type BaseTask, type GameConfig, type InstrumentProps } from './parts/GameShell'
import { KID_P as P, KeyRow, Cue, useLatest } from './parts/kidKit'
import {
  makeRound, graded, missFor, verdictFor, explainBeats, headline, enterDigit, backspace,
  labelValue, padChoices, instructionFor, EMPTY_LABEL, DEMO, GUIDED,
  type PkRound, type Tier, type Label,
} from '@/features/chapters/story/packing'

const CRATE = '#F2A65A', FRUIT = '#7BE0A6'

export interface PkTask extends BaseTask { r: PkRound }

function toTask(r: PkRound): PkTask {
  return {
    r,
    title: r.tag,
    /** ⚠️ `headline` and never the answer — the order total is a GIVEN on a `missing` round and the
     *  ANSWER on the other two, which is one expression meaning two things. The rule lives in
     *  packing.ts with a gate that sweeps it on TOKENS. */
    badge: headline(r, false),
    tone: r.qType === 'missing' ? 'b' : 'a',
    prompt: r.prompt,
    context: r.prompt,
    say: r.spoken,
    /** the 3-wrong re-teach, narrated — the same beats the walkthrough plays */
    work: explainBeats(r).map(b => b.say),
    /** ⚠️ The label is the answer, so the board must not draw "= ?" under the order. */
    showEquals: false,
  }
}

// ─── the instrument ─────────────────────────────────────────────────────────────────────
/** One crate. Closed it is a stamped box; open it shows what was inside all along. */
function Crate({ per, open, u }: { per: number; open: boolean; u: number }) {
  const pips = Math.min(per, 12)
  return (
    <div style={{
      width: u * 3.1, minHeight: u * 2.5, borderRadius: u * 0.35, padding: u * 0.22,
      background: open ? `${FRUIT}1c` : `${CRATE}22`,
      border: `2px solid ${open ? FRUIT : CRATE}aa`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'background .35s ease, border-color .35s ease',
    }}>
      {open ? (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(4, ${u * 0.5}px)`, gap: u * 0.14 }}>
          {Array.from({ length: pips }).map((_, i) => (
            <span key={i} style={{ width: u * 0.5, height: u * 0.5, borderRadius: '50%', background: FRUIT }} />
          ))}
        </div>
      ) : (
        // The stamp is a GIVEN — how many fit in one crate — and never a total.
        <span style={{ fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: u * 1.05, color: CRATE }}>{per}</span>
      )}
    </div>
  )
}

function Shed({ task, value, setValue, disabled, reveal, onCommit }: InstrumentProps<Label, PkTask>) {
  const r = task.r
  const v = value ?? EMPTY_LABEL
  const u = 17
  /**
   * ⚠️ OPEN ON A RIGHT ANSWER TOO. GameShell hands the instrument `reveal` only on a MISS, so keyed
   * on that alone the one beat this chapter is built for — the crates tipping out and coming to
   * exactly the number you called — would play only for the children who got it wrong. And it may
   * not be keyed on `disabled` either: the shell renders the whole walkthrough disabled, which
   * would open the crates under Milo's own "they are still shut" line. `reveal || (settled && right)`
   * is the pair chapter-craft names.
   */
  const opened = reveal || (disabled && graded(r, v)) || (v.open ?? 0) > 0
  const openCount = v.open ?? (opened ? r.crates : 0)

  const latest = useLatest(task, v)
  const type = (n: number) => {
    if (disabled || reveal) return
    const next = enterDigit(latest.read(), n)
    latest.write(next); setValue(next)
  }
  const back = () => {
    if (disabled || reveal) return
    const next = backspace(latest.read())
    latest.write(next); setValue(next)
  }
  const send = () => {
    const cur = latest.read()
    if (disabled || reveal || labelValue(cur) === null) return
    onCommit(cur)
  }

  // ⚠️ On a `missing` round the crate COUNT is the answer, so the pallet must not draw that many
  // crates — it would print the answer as a picture. One sample crate and an open pallet instead.
  const shown = r.qType === 'missing' ? 1 : r.crates
  const ready = labelValue(v) !== null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        padding: '18px 26px', borderRadius: 22, background: P.glass,
        border: `1px solid ${P.gold}55`, boxShadow: `0 0 30px ${P.gold}26`,
      }}>
        <span style={{ fontFamily: 'var(--font-numeric)', fontSize: 14, letterSpacing: 1.6, textTransform: 'uppercase', color: P.creamSoft }}>
          {r.qType === 'missing' ? `${r.total} ${r.goods} to send` : `the pallet · ${r.goods}`}
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: u * 0.4, maxWidth: u * 22 }}>
          {Array.from({ length: shown }).map((_, i) => (
            <Crate key={i} per={r.per} open={i < openCount} u={u} />
          ))}
          {r.qType === 'missing' && (
            <div style={{
              width: u * 3.1, minHeight: u * 2.5, borderRadius: u * 0.35,
              border: `2px dashed ${P.glassBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: u * 1.05, color: P.creamSoft,
            }}>?</div>
          )}
        </div>

        {/* the shipping label — what the child is filling in */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
          <span style={{ fontFamily: 'var(--font-numeric)', fontSize: 14, letterSpacing: 1.4, textTransform: 'uppercase', color: P.creamSoft }}>
            {r.qType === 'missing' ? 'crates' : 'total'}
          </span>
          <div style={{
            minWidth: u * 5, height: u * 2.4, padding: `0 ${u * 0.6}px`, borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.26)', border: `2px solid ${ready ? P.gold : P.glassBorder}`,
            fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: u * 1.5, color: P.cream, letterSpacing: 2,
          }}>{v.digits || ' '}</div>
        </div>
      </div>

      {!reveal && !disabled && (
        <>
          <KeyRow P={P} choices={padChoices()} onPick={type} disabled={disabled} />
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={back} disabled={!v.digits} aria-label="Rub out the last digit" style={{
              minHeight: 46, padding: '0 18px', borderRadius: 14, cursor: v.digits ? 'pointer' : 'default',
              background: P.glass, border: `1px solid ${P.glassBorder}`, color: P.cream,
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, opacity: v.digits ? 1 : 0.4,
            }}>⌫</button>
            {/* Identical at every state — nothing may say the answer is right before the commit. */}
            <button onClick={send} disabled={!ready} style={{
              minHeight: 46, padding: '0 24px', borderRadius: 14, cursor: ready ? 'pointer' : 'default',
              background: ready ? P.coral : P.glass, border: `1px solid ${ready ? P.coralDeep : P.glassBorder}`,
              color: ready ? '#fff' : P.creamSoft, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17,
              opacity: ready ? 1 : 0.5,
            }}>Send it ▶</button>
          </div>
        </>
      )}
      <Cue P={P} text={disabled || reveal ? '' : instructionFor('tap', ready)} />
    </div>
  )
}

// ─── the config ─────────────────────────────────────────────────────────────────────────
const config: GameConfig<Label, PkTask> = {
  chapterId: 'timesTables',
  band: '9-11',
  title: 'THE PACKING SHED',
  ticketLabel: 'order docket',
  palette: P,
  motif: '📦',

  makeTask: (d, asked) => toTask(makeRound(d as Tier, (asked ?? []) as string[])),
  initialValue: () => EMPTY_LABEL,
  grade: (t, v) => graded(t.r, v),
  revealText: t => String(t.r.answer),

  /** ⚠️ Dedupe on the MATH, so a re-dressed docket is not "a new question". */
  sig: t => `${t.r.qType}|${t.r.crates}|${t.r.per}`,

  /** ⚠️ L1 is `total` only, so a child who climbs fast could otherwise finish having never met a
   *  missing factor or a two-digit crate — the round-budget arithmetic in GameConfig.coverage. */
  coverage: { of: t => t.r.qType, all: ['total', 'missing', 'multi'] },

  /** The crates tip out to the real answer on a miss — the reveal, in the child's own instrument. */
  glide: (t, _from, setValue, later) => {
    later(() => setValue({ digits: String(t.r.answer) }), 480)
  },

  Instrument: Shed,

  start: {
    blurb: 'Every crate on the pallet holds the same number, and the lids are already on. Read the docket, work out the whole order, and write it on the label before they go.',
    ticket: { title: 'Label the pallet', badge: '7 crates of 8', tone: 'a' },
    startLabel: 'Open the shed',
  },

  tutorial: {
    task: toTask(DEMO[0]),
    initial: EMPTY_LABEL,
    hand: 'tap',
    steps: explainBeats(DEMO[0]).map(b => ({ say: b.say, value: { digits: b.label, open: b.open } })),
  },

  guided: { task: toTask(GUIDED), coach: 'Your turn — I will talk you through it.', hand: 'tap' },
}

export default function PackingShedGame(p: { childName: string; onFinish: (c: number, w: number, m?: boolean) => void; onExit: () => void }) {
  return <Game config={config} {...p} />
}

/** exported so the gate drives the same objects the chapter renders from */
export { config as PACKING_SHED_CONFIG, toTask }
export const MISS = missFor
export const VERDICT = verdictFor
