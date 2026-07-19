'use client'
/**
 * Leaderboard — the Signed Numbers & Real-Number Fluency chapter (15–16) as a
 * PLAYABLE GAME.
 * World: a game leaderboard. Your SCORE swings up for wins and down for losses,
 * so signed arithmetic IS the score meter. The answer is PRODUCED, not picked.
 *
 * ⚠️ WHY THERE ARE TWO INSTRUMENTS. A meter is a number line: it performs + and −
 * honestly, but there is no meter gesture for (−8) × (−6). This chapter used to
 * dial × and ÷ on the meter too, so its `work` fell back to reciting "same signs
 * give a positive" and the child dialled an answer they had already worked out in
 * their head — the elevator failure named in docs/lessons.md. × and ÷ now happen
 * on the RULING BENCH, where the sign is an action you take. Per-task gating: a
 * question keeps the meter when moving along a line IS the operation.
 *
 * NON-MCQ, three production interactions on GameShell:
 *   • SCORE  → the ElevatorShaft meter: + and −, and the order-of-ops tasks whose
 *              skill is the SEQUENCING (a + b×c, a − c², k×b²).
 *   • CARDS  → the RULING BENCH: × and ÷. Penalty/bonus cards worth `b`, applied
 *              or revoked. Revoke three −4 penalties → the score climbs 12.
 *   • SORT   → the rational-vs-irrational SORTER: drop a number into the
 *              "ends or repeats" bin or the "never ends" bin (2 SpecPicker cards
 *              styled as sorting bins — not a quiz).
 *
 * Exactly the 12–14 shape: overview read-along + a code-drawn leaderboard scene →
 * baby-step walkthrough → guided → scored play. Scene is code-drawn (no assets).
 *
 * The math mirrors SignedNumberFluencyTeenLesson.makeRound (same L1/L2/L3 ramp),
 * but written as STRUCTURED generators that expose the numeric answer for the meter.
 */
import { useEffect, type ReactElement } from 'react'
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'motion/react'
import { Game, type BaseTask, type GameConfig, type DemoStep } from './parts/GameShell'
import { Palette, ElevatorShaft, SpecPicker, CommitBtn, Nudge } from './parts/gameKit'

const P: Palette = {
  nightTop: '#16233d', nightBot: '#0a1120',
  cream: '#eef3fb', creamSoft: 'rgba(238,243,251,0.82)',
  inkOnPaper: '#16233d', mutedOnPaper: '#6b7a95',
  gold: '#ffcf5c', goldDeep: '#d69a1e',
  coral: '#ff8a70', coralDeep: '#e05a3f', mint: '#5cd6ac',
  glass: 'rgba(20,36,64,0.6)', glassBorder: 'rgba(238,243,251,0.2)',
}

const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const rnz = (lo: number, hi: number) => { let n = rint(lo, hi); while (n === 0) n = rint(lo, hi); return n }
/** Pretty integer with a real minus sign. */
const fmt = (n: number) => (n < 0 ? `−${Math.abs(n)}` : String(n))
/** Spoken integer: "negative four". */
const spoken = (n: number) => (n < 0 ? `negative ${Math.abs(n)}` : `${n}`)
/** "a + b" / "a − |b|" — a signed expression read cleanly. */
const sumExpr = (a: number, b: number) => `${fmt(a)} ${b < 0 ? '−' : '+'} ${Math.abs(b)}`

// The answer is a signed NUMBER (score meter), a signed CARD COUNT (the ruling
// bench — see CardBoard), or a classification (sort bin).
type V = { k: 'num'; n: number } | { k: 'cards'; count: number; dir: 0 | 1 | -1 } | { k: 'pick'; id: string }

interface Task extends BaseTask {
  kind: 'score' | 'cards' | 'sort'
  n?: number; lo?: number; hi?: number      // score
  cardVal?: number                          // cards — what ONE card is worth (signed)
  signedCount?: number                      // cards — the signed count the child must produce
  slots?: number                            // cards — how many card frames to lay out
  target?: number                           // cards (÷ only) — the total swing to reach
  correctId?: string                        // sort
  choices?: { id: string; label: string }[] // sort
}

// ── SCORE tasks: dial the signed result on the meter ───────────────────────────

/** L1 — add / subtract signed integers (the score after two rounds). */
function addTask(): Task {
  const a = rint(-6, 6), b = rint(-6, 6)
  const n = a + b
  return {
    kind: 'score', title: 'Combine the round', badge: `${sumExpr(a, b)}`, tone: 'a',
    prompt: `Set the score for ${sumExpr(a, b)}.`,
    say: `Your score changed by ${spoken(a)}, then by ${spoken(b)}. Set the new score.`,
    work: [`Start at ${fmt(a)} and move ${Math.abs(b)} to the ${b < 0 ? 'left' : 'right'}: you land on ${fmt(n)}.`],
    n, lo: -18, hi: 18,
  }
}

/** L2 — multiply / divide, PERFORMED on the ruling bench.
 *
 *  This is the chapter's hardest operation and the reason the meter alone was not
 *  enough: you cannot ride a meter to see why (−8) × (−6) is positive, so the old
 *  version just recited "same signs give a positive" and the child dialled a
 *  remembered answer. Here the sign is something you DO. A card is worth `b` — a
 *  PENALTY when b < 0, a BONUS when b > 0 — and the ruling either APPLIES the
 *  cards (+) or REVOKES them (−). Revoke eight −6 penalties and the score climbs
 *  by 48: two negatives making a positive, watched rather than recalled.
 *
 *  ×  — the signed count IS the first factor: |a| cards, applied if a > 0, revoked
 *       if a < 0. The board shows the swing it produces.
 *  ÷  — the swing is GIVEN (the target) and the signed count is the answer: how
 *       many `b` cards, applied or revoked, move the score by `a`? (This also
 *       retires "a total swing of −48, shared into −6", which asked the child to
 *       share something into a negative number of parts.)
 */
/** The ruling a task asks for, as pure data: `count` cards worth `cardVal`, with
 *  `dir` telling you to apply (+1) or revoke (−1). Exported so the fairness
 *  property can be asserted in a test — the child is graded on the signed count,
 *  so exactly ONE (count, dir) pair may reach the answer. See __tests__/ruling. */
export function ruling(a: number, b: number, isDiv: boolean): { cardVal: number; signedCount: number; swing: number } {
  const signedCount = isDiv ? a / b : a
  return { cardVal: b, signedCount, swing: signedCount * b }
}

function mulTask(): Task {
  if (Math.random() < 0.5) {
    const a = rnz(-8, 8), b = rnz(-6, 6)
    const n = a * b
    const kind = b < 0 ? 'penalty' : 'bonus'
    return {
      kind: 'cards', title: 'Rule on the cards', badge: `(${fmt(a)}) × (${fmt(b)})`, tone: 'a',
      prompt: `${a < 0 ? 'Revoke' : 'Apply'} ${Math.abs(a)} ${kind} ${Math.abs(a) === 1 ? 'card' : 'cards'} worth ${fmt(b)} each.`,
      say: `${spoken(a)} times ${spoken(b)}. Lay out ${Math.abs(a)} ${kind} cards worth ${spoken(b)} each, then ${a < 0 ? 'revoke' : 'apply'} them.`,
      work: [`${Math.abs(a)} cards worth ${fmt(b)} each, ${a < 0 ? 'REVOKED — taking away' : 'APPLIED — adding'} ${a < 0 ? 'a' : 'a'} ${b < 0 ? 'penalty' : 'bonus'} moves the score ${n < 0 ? 'DOWN' : 'UP'}. The swing is ${fmt(n)}.`],
      cardVal: b, signedCount: a, slots: Math.abs(a), n,
    }
  }
  const b = rnz(-6, 6), q = rnz(-6, 6), a = b * q  // clean division
  return {
    kind: 'cards', title: 'Reach the swing', badge: `(${fmt(a)}) ÷ (${fmt(b)})`, tone: 'a',
    prompt: `The score moved ${fmt(a)}. How many ${fmt(b)} cards did that — applied or revoked?`,
    say: `The score swung by ${spoken(a)}, and every card is worth ${spoken(b)}. Find how many cards, and whether they were applied or revoked.`,
    work: [`Each card is worth ${fmt(b)}, and the swing is ${fmt(a)}. ${Math.abs(q)} of them ${q < 0 ? 'REVOKED' : 'APPLIED'} gets there, so the answer is ${fmt(q)}.`],
    cardVal: b, signedCount: q, slots: Math.abs(q), target: a, n: q,
  }
}

/** L2 — two-step signed order of operations: a + b × c (multiply first). */
function twoStepTask(): Task {
  const a = rint(-6, 6), b = rnz(-5, 5), c = rnz(-4, 4)
  const n = a + b * c
  return {
    kind: 'score', title: 'Two-step swing', badge: `${fmt(a)} + (${fmt(b)}) × (${fmt(c)})`, tone: 'b',
    prompt: `Set the score for ${fmt(a)} + (${fmt(b)}) × (${fmt(c)}).`,
    say: `Base score ${spoken(a)}, plus a bonus of ${spoken(b)} times ${spoken(c)}. Set the total.`,
    work: [`Multiply first: ${fmt(b)} × ${fmt(c)} = ${fmt(b * c)}. Then ${fmt(a)} + ${fmt(b * c)} = ${fmt(n)}.`],
    n, lo: Math.min(-30, n - 6), hi: Math.max(30, n + 6),
  }
}

/** L3 — order of operations with negatives & exponents: a − c²  or  k × b². */
function powerTask(): Task {
  if (Math.random() < 0.5) {
    const c = rint(2, 5), a = rint(-8, 8)
    const n = a - c * c
    return {
      kind: 'score', title: 'Penalty squared', badge: `${fmt(a)} − ${c}²`, tone: 'b',
      prompt: `Set the score for ${fmt(a)} − ${c}².`,
      say: `Score ${spoken(a)}, then a penalty of ${c} squared. Set the result.`,
      work: [`Exponent first: ${c}² = ${c * c}. Then ${fmt(a)} − ${c * c} = ${fmt(n)}.`],
      n, lo: Math.min(-40, n - 6), hi: Math.max(20, n + 6),
    }
  }
  const b = rint(2, 5), k = rnz(-4, 4)
  const n = k * (b * b)
  return {
    kind: 'score', title: 'Bonus squared', badge: `(${fmt(k)}) × ${b}²`, tone: 'b',
    prompt: `Set the score for (${fmt(k)}) × ${b}².`,
    say: `A multiplier of ${spoken(k)}, times ${b} squared. Set the score.`,
    work: [`Exponent first: ${b}² = ${b * b}. Then ${fmt(k)} × ${b * b} = ${fmt(n)}.`],
    n, lo: Math.min(-40, n - 6), hi: Math.max(40, n + 6),
  }
}

// ── THE RULING BENCH — the × and ÷ instrument ─────────────────────────────────
// Mirrors the 12–14 debt-card board (SkyTower's MoneyBoard), re-costumed for a
// 15–16 leaderboard. Two ideas do all the work: the CARD says what it is worth
// (a penalty is negative, a bonus positive), and the RULING says what you do with
// it (apply = add, revoke = take away). The swing meter is the consequence, never
// the input — the child never dials the answer here.
const SWING_RANGE = 50
const swingClamp = (v: number) => Math.max(-SWING_RANGE, Math.min(SWING_RANGE, v))

function CardBoard({ P, task, count, dir, reveal }: {
  P: Palette; task: Task; count: number; dir: 0 | 1 | -1; reveal?: boolean
}): ReactElement {
  const b = task.cardVal ?? 0
  const isPenalty = b < 0
  const isDiv = task.target !== undefined
  const chosen = dir !== 0 && count > 0
  const swing = dir === 0 ? 0 : dir * count * b
  const hit = isDiv && chosen && swing === task.target
  const tint = !chosen ? P.gold : swing < 0 ? P.coral : P.mint

  // The plain-word sentence is the whole point: the sign is a consequence of an
  // action, stated in English, not a rule to recall.
  const why = dir === 0 ? '' : isPenalty
    ? (dir === 1 ? 'Apply a penalty → score goes DOWN' : 'Revoke a penalty → score goes UP')
    : (dir === 1 ? 'Apply a bonus → score goes UP' : 'Revoke a bonus → score goes DOWN')

  const fr = swingClamp(swing) / SWING_RANGE
  const tf = swingClamp(task.target ?? 0) / SWING_RANGE

  const meter = (
    <div style={{ position: 'relative', width: 'clamp(30px,4vw,42px)', height: '100%', borderRadius: 8, background: P.glass, border: `1px solid ${P.glassBorder}`, flexShrink: 0 }}>
      <div style={{ position: 'absolute', left: -4, right: -4, top: '50%', height: 2, background: P.glassBorder }} />
      <div style={{ position: 'absolute', right: 'calc(100% + 3px)', top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-numeric)', fontSize: 'clamp(8px,1vw,11px)', color: P.mutedOnPaper }}>0</div>
      {swing !== 0 && (
        <div style={{ position: 'absolute', left: 4, right: 4, background: swing < 0 ? P.coral : P.mint, borderRadius: 5, transition: 'height 260ms, top 260ms, bottom 260ms',
          ...(swing >= 0 ? { bottom: '50%', height: `${fr * 50}%` } : { top: '50%', height: `${-fr * 50}%` }) }} />
      )}
      {isDiv && (
        <div style={{ position: 'absolute', left: -5, right: -5, bottom: `${50 + tf * 50}%`, height: 3, background: P.gold, boxShadow: `0 0 6px ${P.gold}`, transform: 'translateY(50%)' }} />
      )}
    </div>
  )

  const cardEl = (real: boolean, k: number) => (
    <div key={k} style={{
      width: 'clamp(32px,4.6vw,46px)', height: 'clamp(42px,6vw,58px)', flexShrink: 0, borderRadius: 6,
      display: 'grid', placeItems: 'center', textAlign: 'center', lineHeight: 1.05, whiteSpace: 'pre-line',
      fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(10px,1.3vw,14px)',
      background: real ? (isPenalty ? 'linear-gradient(#ff9d82,#e25b3f)' : 'linear-gradient(#8fe9c6,#34a97f)') : 'transparent',
      color: real ? (isPenalty ? '#fff' : '#0d3025') : P.mutedOnPaper,
      border: real ? `2px solid ${isPenalty ? '#c0442e' : '#1f7f5c'}` : `2px dashed ${P.glassBorder}`,
      opacity: real && dir === -1 ? 0.5 : 1,                       // revoked cards fade out
      textDecoration: real && dir === -1 ? 'line-through' : 'none',
      transition: 'opacity 200ms',
    }}>{real ? `${isPenalty ? 'PEN' : 'BON'}\n${fmt(b)}` : ''}</div>
  )
  // × lays out every frame up front (the count is the thing being chosen); ÷ grows
  // the row as the child hunts for the count that reaches the target.
  const frames = isDiv ? count : Math.max(task.slots ?? 0, count)
  const cards = Array.from({ length: frames }, (_, k) => cardEl(isDiv || k < count, k))

  return (
    <div style={{ width: 'clamp(268px, 46vw, 400px)', height: 'clamp(250px, 38vh, 350px)', boxSizing: 'border-box', borderRadius: 16, background: `linear-gradient(160deg, ${P.nightTop}, ${P.nightBot})`, border: `1.5px solid ${P.glassBorder}`, boxShadow: '0 12px 34px rgba(0,0,0,0.42)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: 'clamp(12px,2vh,20px) clamp(12px,1.8vw,20px)', gap: 'clamp(6px,1.2vh,12px)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(10px,1.1vw,13px)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: P.creamSoft }}>
          {isDiv ? `how many cards${hit ? ' — swing matched ✓' : ''}` : 'score swing'}
        </div>
        <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: 'clamp(32px,5.8vw,50px)', lineHeight: 1, color: chosen ? (reveal ? P.mint : tint) : P.gold, textShadow: '0 0 18px rgba(0,0,0,0.5)' }}>
          {chosen ? fmt(isDiv ? dir * count : swing) : '?'}
        </div>
        {isDiv && <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(10px,1.15vw,13px)', color: P.creamSoft }}>target swing {fmt(task.target ?? 0)} · now {fmt(swing)}</div>}
      </div>

      <div style={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', alignItems: 'stretch', justifyContent: 'center', gap: 'clamp(10px,1.6vw,18px)' }}>
        {meter}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'clamp(4px,0.9vh,9px)' }}>
          <div style={{ fontSize: 'clamp(10px,1.1vw,13px)', color: P.creamSoft }}>each card: {isPenalty ? `${fmt(b)} penalty` : `+${b} bonus`}</div>
          <div style={{ display: 'flex', gap: 'clamp(4px,0.7vw,8px)', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '100%' }}>{cards}</div>
        </div>
      </div>

      <div style={{ minHeight: '1.4em', textAlign: 'center', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 'clamp(11px,1.25vw,15px)', color: chosen ? tint : 'transparent' }}>{why || '—'}</div>
    </div>
  )
}

function CardLoader({ P, task, value, setValue, disabled, reveal, onCommit }: {
  P: Palette; task: Task; value: V; setValue: (v: V) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: V) => void
}): ReactElement {
  const count = value.k === 'cards' ? value.count : 0
  const dir = value.k === 'cards' ? value.dir : 0
  const isDiv = task.target !== undefined
  const maxCount = isDiv ? 12 : (task.slots ?? 8)
  const set = (c: number, d: 0 | 1 | -1) => setValue({ k: 'cards', count: c, dir: d })
  const rightDir = (task.signedCount ?? 1) < 0 ? -1 : 1
  const ready = count > 0 && dir !== 0

  const actBtn = (d: 1 | -1, label: string) => {
    const lit = dir === d || (reveal && rightDir === d)
    return (
      <button type="button" disabled={disabled} onClick={() => set(count, d)}
        style={{ flex: 1, padding: 'clamp(10px,1.2vw,14px)', borderRadius: 12, cursor: disabled ? 'default' : 'pointer',
          fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 'clamp(13px,1.45vw,17px)',
          background: lit ? P.gold : P.glass, color: lit ? '#16233d' : P.cream,
          border: `2px solid ${lit ? P.gold : P.glassBorder}`, transition: 'background 140ms, border-color 140ms' }}>{label}</button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px,1.4vw,16px)', width: '100%' }}>
      <CardBoard P={P} task={task} count={count} dir={dir} reveal={reveal} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Nudge P={P} label="−" disabled={disabled} onClick={() => set(Math.max(0, count - 1), dir)} />
        <div style={{ minWidth: 140, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(24px,2.6vw,34px)', fontWeight: 800, color: reveal ? P.mint : P.gold }}>{count}</div>
          <div style={{ fontSize: 'clamp(11px,1.15vw,14px)', color: P.creamSoft }}>{isDiv ? 'how many cards' : `cards · use ${task.slots}`}</div>
        </div>
        <Nudge P={P} label="+" disabled={disabled} onClick={() => set(Math.min(maxCount, count + 1), dir)} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, width: '100%', maxWidth: 'clamp(280px,42vw,440px)' }}>
        <div style={{ fontSize: 'clamp(11px,1.1vw,14px)', color: P.creamSoft, fontWeight: 700, letterSpacing: '0.04em' }}>Apply them or revoke them?</div>
        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          {actBtn(1, '＋ Apply')}
          {actBtn(-1, '－ Revoke')}
        </div>
      </div>

      <CommitBtn P={P} label="RULE ON IT ✓" disabled={disabled || !ready} onClick={() => onCommit(value)} />
    </div>
  )
}

// ── SORT task (L3): drop the number into the right bin ─────────────────────────
const RATIONALS = ['7', '−4', '0.25', '3/8', '√16', '−2.5', '√49', '0.6']
const IRRATIONALS = ['√2', '√5', 'π', '√10', '√3', '√7', '√11']
const BIN_ENDS = 'ends'   // ends or repeats → rational
const BIN_NEVER = 'never' // never ends, never repeats → irrational

function sortTask(): Task {
  const rational = Math.random() < 0.5
  const num = rational
    ? RATIONALS[rint(0, RATIONALS.length - 1)]
    : IRRATIONALS[rint(0, IRRATIONALS.length - 1)]
  const spokenNum = num === 'π' ? 'pi' : num.startsWith('√') ? `root ${num.slice(1)}` : num
  return {
    kind: 'sort', title: 'Sort the number', badge: `${num}`, tone: 'a',
    prompt: `Sort ${num} into the right bin.`,
    say: `Sort ${spokenNum}. Does its decimal end or repeat, or does it never end?`,
    work: [rational
      ? `${num} can be written as a fraction — its decimal ends or repeats — so it goes in "ends or repeats".`
      : `${num} can never be written as a fraction — its decimal never ends and never repeats — so it goes in "never ends".`],
    correctId: rational ? BIN_ENDS : BIN_NEVER,
    choices: [
      { id: BIN_ENDS, label: 'Ends or repeats  ▸ rational' },
      { id: BIN_NEVER, label: 'Never ends  ▸ irrational' },
    ],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  if (d === 1) return addTask()
  if (d === 2) return Math.random() < 0.55 ? mulTask() : twoStepTask()
  // L3: mix classification with order-of-ops-and-exponents
  return Math.random() < 0.5 ? sortTask() : powerTask()
}

// ── fixed worked example (walkthrough): a two-round score swing ─────────────────
const DEMO_TASK: Task = {
  kind: 'score', title: 'Combine the round', badge: '3 − 5', tone: 'a',
  prompt: '', say: '', work: ['Start at 3, move 5 left: you land on −2.'],
  n: -2, lo: -18, hi: 18,
}
// Eleven BABY steps: the leaderboard is the hook (won 3, lost 5), then the
// signed arithmetic unfolds ONE move per step — name the two zones, combine the
// swings, jump up to +3, then drop five notches ONE AT A TIME across the zero
// line, recap, and post the score. Each step = one idea + one board line + one
// meter beat (value.n = the marker's exact score at that beat).
const DEMO_STEPS: DemoStep<V>[] = [
  { say: "Here's the leaderboard. This round you won three points, then you lost five. Let's find your new score.", value: { k: 'num', n: 0 }, board: 'won +3, lost −5' },
  { say: 'On the score meter, a win pushes you UP, above the zero line. A loss pushes you DOWN, below it.', value: { k: 'num', n: 0 }, board: 'up = win · down = loss' },
  { say: 'So this round is plus three, then minus five. Put together, that is three minus five.', value: { k: 'num', n: 0 }, board: '3 − 5' },
  { say: 'Start with the win. Plus three lifts the marker to three notches above the zero line.', value: { k: 'num', n: 3 }, board: 'start at +3' },
  { say: 'Now spend the loss of five, one notch at a time. Down one — to two.', value: { k: 'num', n: 2 }, board: 'down 1 → 2' },
  { say: 'Down two — to one.', value: { k: 'num', n: 1 }, board: 'down 2 → 1' },
  { say: 'Down three — and the marker lands right on the zero line. Level.', value: { k: 'num', n: 0 }, board: 'down 3 → 0' },
  { say: 'Still two more to drop. Down four — the marker slips below the line, into the red, to negative one.', value: { k: 'num', n: -1 }, board: 'down 4 → −1' },
  { say: 'Down five — the final notch. It settles on negative two.', value: { k: 'num', n: -2 }, board: 'down 5 → −2' },
  { say: 'Count it up: five notches down from three lands on negative two — below the line.', value: { k: 'num', n: -2 }, board: '3 − 5 = −2' },
  { say: 'That is your new score: negative two. Set the meter to negative two.', value: { k: 'num', n: -2 }, board: 'score = −2' },
]

// ── worked example 2: the ruling bench, on the case the meter could never explain ──
// (−3) × (−4). The old walkthrough stopped at 3 − 5, so × and ÷ were graded on a
// gesture the child had never seen. Seven baby steps: name the card, lay them out
// one at a time, read the ruling's SIGN as the action, revoke, watch the score
// climb, then say the arithmetic that just happened.
const DEMO_CARDS: Task = {
  kind: 'cards', title: 'Rule on the cards', badge: '(−3) × (−4)', tone: 'a',
  prompt: '', say: '', work: [],
  cardVal: -4, signedCount: -3, slots: 3, n: 12,
}
const DEMO_CARD_STEPS: DemoStep<V>[] = [
  { say: 'Now a harder one. Three penalty cards were handed out — and the referee is about to look at them again.', value: { k: 'cards', count: 0, dir: 0 }, board: '(−3) × (−4)' },
  { say: 'Each penalty card is worth negative four. That is the second number: what one card IS.', value: { k: 'cards', count: 1, dir: 0 }, board: 'each card = −4' },
  { say: 'There are three of them. Lay out the second.', value: { k: 'cards', count: 2, dir: 0 }, board: '3 cards' },
  { say: 'And the third. Three penalty cards, worth negative four each.', value: { k: 'cards', count: 3, dir: 0 }, board: '3 cards of −4' },
  { say: 'Now the first number, negative three. The minus sign is not part of the count — it is the ACTION. Minus means revoke them.', value: { k: 'cards', count: 3, dir: 0 }, board: 'minus = revoke' },
  { say: 'So revoke all three. Watch the score: taking away a penalty pushes it UP, not down.', value: { k: 'cards', count: 3, dir: -1 }, board: 'revoke all 3 → +12' },
  { say: 'That is why negative three times negative four is positive twelve. Take away a penalty enough times and your score climbs.', value: { k: 'cards', count: 3, dir: -1 }, board: '(−3) × (−4) = 12' },
]

// ── hand-authored SVG arcade scoreboard (storyboard: docs/storyboards/leaderboard.md)
// A stylised e-sports scoreboard — night backdrop + glow + rank rows on the left,
// and on the RIGHT the load-bearing math: a vertical signed score meter with a
// green WIN zone above, a red LOSS zone below, a gold ZERO line, integer ticks,
// and a marker that GLIDES continuously (useMotionValue → syScore mapping) between
// beats as the walkthrough sets the value. During the loss a `↓ −1` arrow rides
// the marker down notch by notch; on recap a bracket measures how far below the
// line the score sits. Everything sits on the exact syScore() coordinate mapping,
// so the math stays correct; only the *stage* around it is art.
const SC_MIN = -6, SC_MAX = 6, SC_SPAN = SC_MAX - SC_MIN
const M_TOP = 50, M_BOT = 268                     // meter track top/bottom (svg y)
const TRACK_X = 236, TRACK_W = 42                 // track left + width
const CX = TRACK_X + TRACK_W / 2                  // marker/track center x
const SC_NOTCHES = [6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6]
const START_N = 3, TARGET_N = -2, TOTAL_DROP = 5  // worked example: 3 → −2 is 5 down
const syScore = (n: number) => M_BOT - ((Math.max(SC_MIN, Math.min(SC_MAX, n)) - SC_MIN) / SC_SPAN) * (M_BOT - M_TOP)

function ScoreScene({ palette, value, stepIndex, frameCount, ended }: {
  palette: Palette; value: V; stepIndex: number; frameCount: number; ended: boolean
}) {
  const p = palette
  const reduce = useReducedMotion()
  const W = 340, H = 300
  const n = value.k === 'num' ? value.n : 0
  const v = Math.max(SC_MIN, Math.min(SC_MAX, n))

  // ── beats (tied to DEMO_STEPS): 0 hook · 1 legend · 2 combine · 3 start(+3) ·
  //    4–8 drop one notch each · 9 recap · 10 post. Intro card => frameCount===1. ──
  const isWalk = frameCount > 1
  const hookLegend = !isWalk || stepIndex <= 2                 // idle establish + naming beats
  const pushing = isWalk && stepIndex >= 4 && stepIndex <= 8   // the notch-by-notch drop
  const resultPhase = ended || (isWalk && stepIndex >= 9)      // recap + post
  const notchesDone = Math.max(0, Math.min(TOTAL_DROP, START_N - v))  // 0..5 through the ride
  const goingDown = TARGET_N < START_N

  const zeroY = syScore(0)
  const up = v >= 0
  const markerCol = v > 0 ? p.mint : v < 0 ? p.coral : p.gold
  const readCol = v < 0 ? p.coral : v === 0 ? p.gold : p.mint
  const below = v < 0

  // ── CONTINUOUS marker travel: a motion value animated at 60fps so the chip
  //    FLOWS between beats instead of snapping. markerY tracks syScore(score). ──
  const score = useMotionValue(0)
  useEffect(() => {
    const controls = animate(score, v, { duration: reduce ? 0 : 0.5, ease: [0.45, 0.05, 0.25, 1] })
    return () => controls.stop()
  }, [v, reduce, score])
  const markerY = useTransform(score, (s) => syScore(s))

  const spring = { type: 'spring' as const, stiffness: 320, damping: 20 }
  const rows: { rank: string; name: string; base: number; you?: boolean }[] = [
    { rank: '1', name: 'ACE', base: 12 },
    { rank: '2', name: 'NOVA', base: 5 },
    { rank: '▸', name: 'YOU', base: v, you: true },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1vh, 12px)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="clamp(230px, 34vw, 360px)" height="auto" style={{ borderRadius: 14, border: `1px solid ${p.glassBorder}`, boxShadow: '0 10px 30px rgba(0,0,0,0.4)', display: 'block' }}>
        <defs>
          <linearGradient id="lb_sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1b2c4c" />
            <stop offset="0.55" stopColor="#121d33" />
            <stop offset="1" stopColor="#0a1120" />
          </linearGradient>
          <radialGradient id="lb_glow" cx="0.62" cy="0.1" r="0.7">
            <stop offset="0" stopColor="#8fd8ff" stopOpacity="0.22" />
            <stop offset="0.5" stopColor="#8fd8ff" stopOpacity="0.05" />
            <stop offset="1" stopColor="#8fd8ff" stopOpacity="0" />
          </radialGradient>
          <clipPath id="lb_track"><rect x={TRACK_X} y={M_TOP} width={TRACK_W} height={M_BOT - M_TOP} rx={11} /></clipPath>
        </defs>

        {/* ── backdrop ── */}
        <rect x={0} y={0} width={W} height={H} fill="url(#lb_sky)" />
        {/* faint pixel/scanline dot field high up */}
        <g opacity={0.5}>
          {[16, 28, 40].map((cy, r) => (
            <g key={`px${r}`} opacity={0.12 + r * 0.02}>
              {Array.from({ length: 22 }).map((_, i) => (
                <rect key={i} x={6 + i * (W / 21)} y={cy} width={2.4} height={2.4} fill={i % 4 === 0 ? p.gold : p.cream} opacity={0.4} />
              ))}
            </g>
          ))}
        </g>
        <rect x={0} y={0} width={W} height={H} fill="url(#lb_glow)" />

        {/* ── leaderboard panel (left) — dramatizes the theme ── */}
        <g>
          <rect x={14} y={54} width={162} height={198} rx={12} fill={p.glass} stroke={p.glassBorder} strokeWidth={1} />
          <rect x={14} y={54} width={162} height={26} rx={12} fill="rgba(0,0,0,0.28)" />
          <text x={95} y={71} textAnchor="middle" fill={p.creamSoft} fontSize={12} fontFamily="var(--font-numeric)" fontWeight={800} letterSpacing="0.14em">LEADERBOARD</text>
          {rows.map((row, i) => {
            const ry = 104 + i * 46
            const scoreCol = row.you ? markerCol : p.creamSoft
            return (
              <motion.g key={row.name}
                initial={reduce ? false : { opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={reduce ? { duration: 0 } : { ...spring, delay: 0.12 + i * 0.1 }}>
                {row.you && <rect x={22} y={ry - 18} width={146} height={34} rx={8} fill={below ? 'rgba(255,138,112,0.12)' : 'rgba(92,214,172,0.12)'} stroke={markerCol} strokeWidth={1.2} style={{ transition: 'stroke 300ms, fill 300ms' }} />}
                <text x={34} y={ry + 4} textAnchor="middle" fill={row.you ? p.gold : p.mutedOnPaper} fontSize={row.you ? 15 : 13} fontFamily="var(--font-numeric)" fontWeight={800}>{row.rank}</text>
                <text x={52} y={ry + 4} fill={row.you ? p.cream : p.creamSoft} fontSize={13} fontFamily="var(--font-numeric)" fontWeight={row.you ? 800 : 600}>{row.name}</text>
                <text x={160} y={ry + 4} textAnchor="end" fill={scoreCol} fontSize={15} fontFamily="var(--font-numeric)" fontWeight={800} style={{ fontVariantNumeric: 'tabular-nums', transition: 'fill 300ms' }}>{row.you ? fmt(v) : row.base}</text>
              </motion.g>
            )
          })}
        </g>

        {/* ── score meter (right) — the load-bearing math ── */}
        {/* track outline + WIN/LOSS zones */}
        <rect x={TRACK_X} y={M_TOP} width={TRACK_W} height={M_BOT - M_TOP} rx={11} fill="rgba(0,0,0,0.28)" stroke={p.glassBorder} strokeWidth={1} />
        <g clipPath="url(#lb_track)">
          {/* green WIN zone (above zero) */}
          <motion.rect x={TRACK_X} y={M_TOP} width={TRACK_W} height={zeroY - M_TOP} fill={p.mint}
            initial={false} animate={{ opacity: hookLegend ? 0.14 : 0.08 }} transition={{ duration: reduce ? 0 : 0.5 }} />
          {/* red LOSS zone (below zero) — swells when the marker is below the line */}
          <motion.rect x={TRACK_X} y={zeroY} width={TRACK_W} height={M_BOT - zeroY} fill={p.coral}
            initial={false} animate={{ opacity: below ? 0.22 : hookLegend ? 0.14 : 0.08 }} transition={{ duration: reduce ? 0 : 0.5 }} />
        </g>

        {/* notch ticks — light up as the marker passes them during the drop */}
        {SC_NOTCHES.map((f) => {
          const yy = syScore(f)
          const isZero = f === 0
          const passed = pushing && (goingDown ? (f < START_N && f >= v) : (f > START_N && f <= v))
          if (isZero) return null
          return (
            <line key={f} x1={TRACK_X + 6} y1={yy} x2={TRACK_X + TRACK_W - 6} y2={yy}
              stroke={passed ? markerCol : p.glassBorder} strokeWidth={2} opacity={passed ? 0.95 : 0.32}
              style={{ transition: 'stroke 240ms, opacity 240ms' }} />
          )
        })}
        {/* integer tick labels down the right side */}
        {SC_NOTCHES.filter((f) => f % 2 === 0 && f !== 0).map((f) => (
          <text key={`l${f}`} x={TRACK_X + TRACK_W + 7} y={syScore(f) + 3.5} fill={p.mutedOnPaper} fontSize={9} fontFamily="var(--font-numeric)">{fmt(f)}</text>
        ))}

        {/* the GOLD zero line — draws in on establish */}
        <motion.line x1={TRACK_X - 6} y1={zeroY} x2={TRACK_X + TRACK_W + 6} y2={zeroY} stroke={p.gold} strokeWidth={3}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduce ? 0 : 0.7, ease: 'easeInOut' }} />
        <text x={TRACK_X + TRACK_W + 7} y={zeroY + 3.5} fill={p.gold} fontSize={11} fontFamily="var(--font-numeric)" fontWeight={800}>0</text>

        {/* WIN / LOSS legends capping the track */}
        <motion.text x={CX} y={M_TOP - 8} textAnchor="middle" fill={p.mint} fontSize={11} fontFamily="var(--font-numeric)" fontWeight={800}
          initial={false} animate={{ opacity: hookLegend ? 1 : 0.55 }} transition={{ duration: reduce ? 0 : 0.4 }}>▲ WIN +</motion.text>
        <motion.text x={CX} y={M_BOT + 16} textAnchor="middle" fill={p.coral} fontSize={11} fontFamily="var(--font-numeric)" fontWeight={800}
          initial={false} animate={{ opacity: hookLegend ? 1 : 0.55 }} transition={{ duration: reduce ? 0 : 0.4 }}>▼ LOSS −</motion.text>

        {/* result — a measuring bracket from the zero line down to the marker */}
        {resultPhase && below && (
          <motion.g initial={reduce ? false : { opacity: 0, scaleY: 0 }} animate={{ opacity: 1, scaleY: 1 }} transition={reduce ? { duration: 0 } : spring} style={{ transformBox: 'fill-box', transformOrigin: 'top' }}>
            <line x1={TRACK_X - 14} y1={zeroY} x2={TRACK_X - 14} y2={syScore(v)} stroke={p.cream} strokeWidth={1.6} />
            <line x1={TRACK_X - 18} y1={zeroY} x2={TRACK_X - 10} y2={zeroY} stroke={p.cream} strokeWidth={1.6} />
            <line x1={TRACK_X - 18} y1={syScore(v)} x2={TRACK_X - 10} y2={syScore(v)} stroke={p.cream} strokeWidth={1.6} />
            <text x={TRACK_X - 22} y={(zeroY + syScore(v)) / 2 + 4} textAnchor="end" fill={p.cream} fontSize={11} fontFamily="var(--font-numeric)" fontWeight={700}>{-v} below</text>
          </motion.g>
        )}

        {/* moving ↓ −1 operation arrow — rides the marker down during the drop */}
        {pushing && (
          <motion.g style={{ y: markerY }}>
            <motion.g animate={reduce ? undefined : { y: [-3, 3, -3] }} transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}>
              <text x={TRACK_X - 30} y={4} textAnchor="middle" fill={p.coral} fontSize={22} fontFamily="var(--font-numeric)" fontWeight={900}>↓</text>
              <text x={TRACK_X - 30} y={16} textAnchor="middle" fill={p.coral} fontSize={10} fontFamily="var(--font-numeric)" fontWeight={800}>−1</text>
            </motion.g>
          </motion.g>
        )}

        {/* the GLIDING marker chip — the score, riding the exact coordinate mapping */}
        <motion.g style={{ y: markerY }}>
          <motion.rect x={CX - 25} y={-12} width={50} height={24} rx={7}
            initial={false} animate={{ fill: markerCol }} transition={{ duration: reduce ? 0 : 0.3 }}
            stroke={p.cream} strokeWidth={1.2} style={{ filter: `drop-shadow(0 0 8px ${markerCol})` }} />
          <text x={CX} y={5} textAnchor="middle" fill={p.nightBot} fontSize={17} fontFamily="var(--font-numeric)" fontWeight={800} style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(v)}</text>
        </motion.g>
      </svg>

      {/* running caption — tally through the drop, verdict at the end */}
      <div style={{ height: 'clamp(20px,3vh,24px)', display: 'flex', alignItems: 'center' }}>
        {pushing && notchesDone >= 1 ? (
          <motion.div key={notchesDone} initial={reduce ? false : { opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={reduce ? { duration: 0 } : spring}
            style={{ padding: '3px 14px', borderRadius: 999, background: p.glass, border: `1px solid ${p.glassBorder}`, color: p.coral, fontWeight: 800, fontSize: 'clamp(11px,1.2vw,13px)', fontFamily: 'var(--font-numeric)' }}>
            {notchesDone} of {TOTAL_DROP} down
          </motion.div>
        ) : (
          <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(11px, 1vw, 14px)', letterSpacing: '0.1em', textTransform: 'uppercase', color: resultPhase ? readCol : p.mutedOnPaper, fontWeight: 700 }}>
            {resultPhase ? (up ? 'winning' : 'below the line') : hookLegend ? 'wins push up · losses push down' : 'set the score…'}
          </div>
        )}
      </div>
    </div>
  )
}

const CONFIG: GameConfig<V, Task> = {
  chapterId: 'signedNumberFluency',
  title: 'LEADERBOARD',
  ticketLabel: 'match log',
  palette: P,
  motif: '🎮',
  makeTask,
  initialValue: (t) => (t.kind === 'score' ? { k: 'num', n: 0 } : t.kind === 'cards' ? { k: 'cards', count: 0, dir: 0 } : { k: 'pick', id: '' }),
  // Cards grade on the SIGNED COUNT the child built (dir · count), not on a number
  // they typed — `b` is fixed, so dir·count·b = answer has exactly one solution.
  grade: (t, v) => t.kind === 'score' ? v.k === 'num' && v.n === t.n
    : t.kind === 'cards' ? v.k === 'cards' && v.dir !== 0 && v.dir * v.count === t.signedCount
      : v.k === 'pick' && v.id === t.correctId,
  revealText: (t) => (t.kind === 'sort' ? (t.choices?.find((c) => c.id === t.correctId)?.label ?? '') : fmt(t.n ?? 0)),
  glide: (t, _from, setValue, later) => later(() => setValue(
    t.kind === 'score' ? { k: 'num', n: t.n ?? 0 }
      : t.kind === 'cards' ? { k: 'cards', count: Math.abs(t.signedCount ?? 0), dir: (t.signedCount ?? 1) < 0 ? -1 : 1 }
        : { k: 'pick', id: t.correctId ?? '' }), 320),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) => {
    if (task.kind === 'score') {
      const n = value.k === 'num' ? value.n : 0
      return <ElevatorShaft P={palette} value={n} setValue={(x) => setValue({ k: 'num', n: x })} min={task.lo ?? -18} max={task.hi ?? 18}
        disabled={disabled} reveal={reveal} onCommit={(x) => onCommit({ k: 'num', n: x })} commitLabel="POST SCORE ✓" />
    }
    if (task.kind === 'cards') {
      return <CardLoader P={palette} task={task} value={value} setValue={setValue}
        disabled={disabled} reveal={reveal} onCommit={onCommit} />
    }
    const id = value.k === 'pick' ? value.id : ''
    return <SpecPicker P={palette} choices={task.choices ?? []} value={id} setValue={(x) => setValue({ k: 'pick', id: x })}
      correct={task.correctId} disabled={disabled} reveal={reveal} onCommit={(x) => onCommit({ k: 'pick', id: x })}
      commitLabel="DROP IT IN ✓" prompt={`sort  ${task.badge}`} />
  },
  // Branches by example, like the 12–14 signed chapter: the meter example poses on
  // the arcade scoreboard, the ruling example on the bench itself — so the child
  // watches the gesture they will be graded on, not a different picture.
  TutorialScene: ({ palette, task, value, stepIndex, frameCount, ended }) =>
    task.kind === 'cards'
      ? <CardBoard P={palette} task={task} count={value.k === 'cards' ? value.count : 0} dir={value.k === 'cards' ? value.dir : 0} />
      : <ScoreScene palette={palette} value={value} stepIndex={stepIndex} frameCount={frameCount} ended={ended} />,
  start: {
    blurb: <><strong>You&apos;re on the leaderboard.</strong> Wins push your score <strong>up</strong>, losses drop it <strong>below the line</strong>. Combine the swings and post the score — and when the referee <strong>revokes a penalty</strong>, watch which way your score moves.</>,
    ticket: { title: 'Round result', badge: '3 − 5', tone: 'a' },
    startLabel: 'Check the board →',
  },
  overview: {
    say: 'Here is the plan. Your leaderboard score can go above zero when you win and below zero when you lose. To find the new score we combine the swings — adding, subtracting, or multiplying signed numbers — and set the meter. Let us work one out together, nice and slow.',
    problem: <>What&apos;s your score after <strong>+3</strong>, then <strong>−5</strong>?</>,
    points: [
      <>Above the line is <strong>positive</strong>; below it is <strong>negative</strong>.</>,
      <>A loss is a <strong>jump down</strong>; a win is a <strong>jump up</strong>.</>,
      <>Cross the <strong>zero line</strong> and the score goes below.</>,
      <><strong>Revoke</strong> a penalty and the score goes <strong>up</strong>.</>,
    ],
  },
  tutorial: [
    { task: DEMO_TASK, initial: { k: 'num', n: 0 }, hand: 'dragV', steps: DEMO_STEPS },
    { task: DEMO_CARDS, initial: { k: 'cards', count: 0, dir: 0 }, hand: 'tap', steps: DEMO_CARD_STEPS },
  ],
  // ONE guided round, matching the 12–14 shape. The ruling bench is still a
  // separately-graded gesture, so it is rehearsed in the WALKTHROUGH (example 2)
  // rather than here — exactly how the 12–14 signed chapter teaches its own
  // card mechanic. A graded gesture taught nowhere is the trap where a child gets
  // the maths right and loses the mark on a move nobody showed them.
  guided: {
    task: {
      kind: 'score', title: 'Combine the round', badge: '−4 + 6', tone: 'a', prompt: '',
      say: 'You lost four, then won six. Set the new score.',
      work: ['Start at −4, move 6 up: you land on 2.'],
      n: 2, lo: -18, hi: 18,
    },
    coach: 'Your turn — I will help. Set this score.', hand: 'dragV',
  },
  sig: (t) => `${t.kind}:${t.badge}`,
}

export default function Leaderboard(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
