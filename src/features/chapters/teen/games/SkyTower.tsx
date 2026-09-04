'use client'
/**
 * MoneyLab — the Signed & Rational Ops chapter as a PLAYABLE GAME, on ONE coherent
 * MONEY / DEBT model so every operation is something the child DOES and SEES, never
 * a rule they recall.
 *
 *   Everything lives on your NET WORTH: green above the $0 line = you have money,
 *   red below it = you're in debt.
 *
 *   +/−  money comes IN (+) or goes OUT (−); your worth slides up or down the meter,
 *        PAST ZERO into the red if you spend more than you have. (2 − 5: have $2,
 *        pay $5 → you owe $3, worth −$3.)
 *   ×    lay out cards — a coin (+) is money, a red IOU (−) is debt. The SECOND
 *        number is what each card IS (−3 → a $3 IOU); the FIRST number is the ACTION
 *        (+ add them / − take them away). Your worth is the answer. −5 × −2 = "take
 *        away five $2 IOUs" → worth climbs to +$10 (take away debt = richer!).
 *   ÷    reach a target worth: add / take away $b cards until worth = a; the count
 *        (with its add + / take − sign) is the quotient.
 *
 * The same illustration teaches (walkthrough) and solves (practice), so the answer
 * is never worked out off-platform. No slides, no MCQ. Shared adaptive engine
 * underneath (branches by task.op).
 *
 * NB: file/export still named SkyTower for import stability — the chapter is now
 * "MONEY LAB". (Rename the file later; the wrapper imports the default export.)
 */
import { useRef, type ReactElement } from 'react'
import { Game, type BaseTask, type GameConfig } from './parts/GameShell'
import { Palette, CommitBtn, Nudge, signed, glideNumber, numChoices } from './parts/gameKit'
import { disp } from '@/core/fmt'
import { pick } from '@/core/rand'

const P: Palette = {
  nightTop: '#241f3a', nightBot: '#15122a',
  cream: '#f3efff', creamSoft: 'rgba(243,239,255,0.82)',
  inkOnPaper: '#241c3a', mutedOnPaper: '#7d759c',
  gold: '#ffcf5c', goldDeep: '#e0a534',
  coral: '#ff8a6b', coralDeep: '#e25b3f', mint: '#4fd6a0',
  glass: 'rgba(24,18,44,0.62)', glassBorder: 'rgba(243,239,255,0.22)',
}

// The child's live answer state. `worth` is the net-worth meter (add/subtract). For
// the money card board: `groups` = how many cards, `dir` = the ACTION (+1 add / −1
// take away / 0 = not chosen). One shape across the game so GameShell holds it.
interface SV { worth: number; groups: number; dir: 0 | 1 | -1 }
type Op = 'add' | 'mul' | 'div'
// `miss` = this task's OWN classic near-misses (the number a child lands on making
// the typical signed-arithmetic mistake) — fed to numChoices as the tap distractors.
interface Task extends BaseTask { op: Op; answer: number; start: number; a?: number; b?: number; miss?: number[] }

const toneFor = (n: number): 'a' | 'b' => (n < 0 ? 'b' : 'a')
const W = (worth: number): SV => ({ worth, groups: 0, dir: 0 })                 // a worth-meter value
const M = (groups: number, dir: 0 | 1 | -1): SV => ({ worth: 0, groups, dir })  // a money-card value
const money = (n: number) => (n < 0 ? `−$${Math.abs(n)}` : `$${n}`)
// Visible-math formatter: a proper minus glyph, e.g. −5. Every badge uses it so the
// board, the context line and the answer pad all show the SAME minus character.
// (Spoken lines — say/work — use signed() instead; TTS drops a bare "−".)
const worthWord = (n: number) => (n < 0 ? `$${-n} in debt` : `$${n}`)          // "$3 in debt" / "$4"

// Question-clarity spec: each task fills three board zones — a short `context`
// (the story, carrying EVERY number and rule needed to answer), the math (`badge`,
// shown big), and one `padInstruction` chip naming exactly which number to tap.
// The instrument is not rendered in practice, so the board must stand alone.
// `prompt` is kept as a plain fallback.
function addSub(): Task {
  const [a, b] = pick([[-3, 5], [4, -6], [-2, -3], [-7, 7], [5, -8], [2, -9], [-4, 3], [6, -4]])
  const ans = a + b
  const inOut = b > 0 ? `get $${b}` : `pay $${-b}`
  const spoken = b > 0 ? `receive ${b}` : `pay ${-b}`
  return {
    op: 'add', title: 'Your balance', badge: `${disp(a)} ${b < 0 ? '−' : '+'} ${Math.abs(b)}`, tone: toneFor(ans),
    context: `You have ${worthWord(a)}, then you ${inOut}. Money coming in moves your worth up. Money going out moves it down.`,
    padInstruction: 'Work out your worth now, then tap that number.',
    prompt: `You have ${worthWord(a)}, then ${inOut}. Where's your worth?`,
    say: `You ${a < 0 ? `owe ${-a} dollars` : `have ${a} dollars`}. You ${spoken} dollars. What is your worth now? Tap your answer.`,
    answer: ans, start: a,
    // classic misses: moved the wrong way (added when they should pay), and the sign flip.
    miss: [a - b, -ans],
    work: [`Start ${worthWord(a)}.`, `${b > 0 ? `Get ${b} dollars` : `Pay ${-b} dollars`}, so your worth is ${worthWord(ans)}.`, `So ${signed(a)} ${b < 0 ? 'minus' : 'plus'} ${Math.abs(b)} is ${signed(ans)}.`],
  }
}
function mul(): Task {
  const [a, b] = pick([[-4, 3], [-5, -2], [6, -2], [-3, 4], [2, -7], [-6, -3]])
  const ans = a * b
  const aMag = Math.abs(a), bMag = Math.abs(b)
  const card = b < 0 ? `$${bMag} debt` : `$${bMag} coin`
  const act = a < 0 ? 'take away' : 'add'
  return {
    op: 'mul', a, b, title: 'Do the action', badge: `${disp(a)} × ${disp(b)}`, tone: toneFor(ans),
    // The ACTION (add / take away) is the whole reason the sign comes out as it does,
    // so it leads the context line — the child can no longer see it anywhere else.
    context: `You start at $0. ${act === 'take away' ? 'Take away' : 'Add'} ${aMag} cards, each a ${card}. A coin adds money; a debt is money you owe.`,
    padInstruction: 'Work out your worth after that, then tap that number.',
    prompt: `${a} × ${b} = ?`,
    say: `${signed(a)} times ${signed(b)}. ${act === 'take away' ? 'Take away' : 'Add'} ${aMag} cards, each a ${card}. What is your worth then? Tap your answer.`,
    answer: ans, start: 0,
    // classic misses: sign flip (thinking taking debt away makes you poorer), and adding
    // the two numbers instead of laying out the cards.
    miss: [-ans, a + b],
    work: [`${aMag} cards, each a ${card}, ${act === 'take away' ? 'taken away' : 'added'}.`, `That leaves your worth ${worthWord(ans)}.`, `So ${signed(a)} times ${signed(b)} is ${signed(ans)}.`],
  }
}
function div(): Task {
  const [a, b] = pick([[-8, 2], [-12, -3], [-15, 3], [10, -2], [-18, -6]])
  const ans = a / b
  const bMag = Math.abs(b)
  const card = b < 0 ? `$${bMag} debt` : `$${bMag} coin`
  return {
    op: 'div', a, b, title: 'Reach the target', badge: `${disp(a)} ÷ ${disp(b)}`, tone: toneFor(ans),
    // The SIGN CONVENTION has to be on the board: the count alone is ambiguous
    // (both +n and −n sit on the pad), and knowing "how many cards" is not the
    // same as knowing the answer. Cards added count up, cards taken away count down.
    context: `You start at $0. Use ${card} cards to reach a worth of ${money(a)}. Adding cards counts up (+); taking cards away counts down (−).`,
    padInstruction: 'Tap the card count, with its + or − sign.',
    prompt: `${a} ÷ ${b} = ?`,
    say: `${signed(a)} divided by ${signed(b)}. Start at zero and reach a worth of ${worthWord(a)} with ${card} cards. Cards you add count up, cards you take away count down. Tap your answer.`,
    answer: ans, start: 0,
    // classic misses: sign flip (added when they took away, or vice versa), and
    // miscounting the cards by one.
    miss: [-ans, ans + 1, ans - 1],
    work: [`Reach a worth of ${worthWord(a)} with ${card} cards.`, `That takes ${Math.abs(ans)} cards, ${ans < 0 ? 'taken away — and taking away counts down' : 'added — and adding counts up'}.`, `So ${signed(a)} divided by ${signed(b)} is ${signed(ans)}.`],
  }
}
function chain(): Task {
  const [a, b, c] = pick([[-7, 10, -5], [3, -8, 2], [-4, -4, 6]])
  const ans = a + b + c
  const expr = `${disp(a)} ${b < 0 ? '−' : '+'} ${Math.abs(b)} ${c < 0 ? '−' : '+'} ${Math.abs(c)}`
  return {
    op: 'add', title: 'A busy day', badge: expr, tone: toneFor(ans),
    context: `Start ${worthWord(a)}. ${b > 0 ? `Get $${b}` : `Pay $${-b}`}, then ${c > 0 ? `get $${c}` : `pay $${-c}`}. Getting money moves your worth up; paying moves it down.`,
    padInstruction: 'Work out your worth at the end, then tap that number.',
    prompt: `Money moves: ${expr}. Where's your worth?`,
    say: `Start ${a < 0 ? `owing ${-a}` : `with ${a}`} dollars. ${b > 0 ? `Get ${b}` : `Pay ${-b}`}, then ${c > 0 ? `get ${c}` : `pay ${-c}`}. What is your worth at the end? Tap your answer.`,
    answer: ans, start: a,
    // classic misses: ignored the minus signs entirely, and got only the last move backwards.
    miss: [Math.abs(a) + Math.abs(b) + Math.abs(c), a + b - c, -ans],
    work: [`Work the moves in order, starting ${worthWord(a)}.`, `${b > 0 ? `Get ${b} dollars` : `Pay ${-b} dollars`}, then ${c > 0 ? `get ${c} dollars` : `pay ${-c} dollars`}.`, `You end ${worthWord(ans)}, so the answer is ${signed(ans)}.`],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  const pool: (() => Task)[] =
    d === 1 ? [addSub, addSub, addSub]
    : d === 2 ? [mul, div, addSub]
    : [div, chain, mul]
  return pick(pool)()
}

// ══════════════════════════════════════════════════════════════════════════════
// THE WORTH METER — the illustration for signed ADD / SUBTRACT.
// Your net worth on a vertical meter: green ABOVE the $0 line (you have money), red
// BELOW it (you're in debt). Money in (+) slides your worth up; money out (−) slides
// it down — past zero into the red if you spend more than you have. Solving = move
// your worth from the start by the amount coming in / going out, and read where it
// lands. The sign is never a rule — you SEE it cross zero into the red.
// ══════════════════════════════════════════════════════════════════════════════

const WRANGE = 12                                   // worth meter runs −12…+12
const clampW = (v: number) => Math.max(-WRANGE, Math.min(WRANGE, v))

/** The shared illustration: a vertical worth meter with a $0 line, a green fill up
 *  / red fill down, the big worth readout, an optional START marker (where the day
 *  began), and a plain-word caption ("in the red — you owe $3"). Interactive when
 *  `onDragTo` is passed (drag the meter to set your worth). */
function WorthBoard({ P, worth, start, height, reveal, onDragTo, disabled }: {
  P: Palette; worth: number; start?: number; height: string; reveal?: boolean
  onDragTo?: (w: number) => void; disabled?: boolean
}): ReactElement {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const w = clampW(worth)
  const fr = w / WRANGE                              // −1 … 1
  const tint = w < 0 ? P.coral : w > 0 ? P.mint : P.gold
  const live = !!onDragTo && !disabled
  const fromY = (clientY: number) => {
    const el = trackRef.current; if (!el || !onDragTo) return
    const r = el.getBoundingClientRect()
    const f = 1 - Math.min(1, Math.max(0, (clientY - r.top) / r.height))     // 0 bottom … 1 top
    onDragTo(Math.round(-WRANGE + f * 2 * WRANGE))
  }
  const startFr = start !== undefined ? clampW(start) / WRANGE : null

  return (
    <div style={{ width: 'clamp(240px, 44vw, 380px)', height, boxSizing: 'border-box', borderRadius: 16, background: `linear-gradient(160deg, ${P.nightTop}, ${P.nightBot})`, border: `1.5px solid ${P.glassBorder}`, boxShadow: '0 12px 34px rgba(0,0,0,0.42)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: 'clamp(12px,2vh,20px) clamp(12px,1.8vw,20px)', gap: 'clamp(6px,1.2vh,12px)' }}>
      {/* the worth readout */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(10px,1.1vw,13px)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: P.creamSoft }}>your worth</div>
        <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: 'clamp(34px,6.2vw,54px)', lineHeight: 1, color: reveal ? P.mint : tint, textShadow: '0 0 18px rgba(0,0,0,0.5)' }}>{money(w)}</div>
      </div>

      {/* the meter */}
      <div
        ref={trackRef}
        onPointerDown={live ? (e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); fromY(e.clientY) } : undefined}
        onPointerMove={live ? (e) => { if (dragging.current) fromY(e.clientY) } : undefined}
        onPointerUp={live ? () => { dragging.current = false } : undefined}
        style={{ position: 'relative', flex: 1, minHeight: 0, width: 'clamp(56px,8vw,84px)', borderRadius: 10, background: P.glass, border: `1px solid ${P.glassBorder}`, overflow: 'hidden', touchAction: 'none', cursor: live ? 'ns-resize' : 'default' }}
      >
        {/* below-zero (debt) shade */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', bottom: 0, background: 'rgba(0,0,0,0.28)' }} />
        {/* the fill from $0 to the current worth */}
        {w !== 0 && (
          <div style={{ position: 'absolute', left: 6, right: 6, background: w < 0 ? P.coral : P.mint, borderRadius: 6, transition: 'height 160ms, top 160ms, bottom 160ms',
            ...(w >= 0 ? { bottom: '50%', height: `${fr * 50}%` } : { top: '50%', height: `${-fr * 50}%` }) }} />
        )}
        {/* the $0 line */}
        <div style={{ position: 'absolute', left: -4, right: -4, top: '50%', height: 3, background: P.gold, boxShadow: `0 0 8px ${P.gold}`, transform: 'translateY(-50%)' }} />
        <div style={{ position: 'absolute', right: 4, top: 'calc(50% + 5px)', fontFamily: 'var(--font-numeric)', fontSize: 10, fontWeight: 800, color: P.gold }}>$0</div>
        {/* where the day began */}
        {startFr !== null && (
          <div style={{ position: 'absolute', left: -5, right: -5, top: `${50 - startFr * 50}%`, height: 2, background: P.creamSoft, opacity: 0.5, transform: 'translateY(-50%)' }}>
            <span style={{ position: 'absolute', left: '104%', top: '50%', transform: 'translateY(-50%)', fontSize: 9, color: P.creamSoft, whiteSpace: 'nowrap' }}>start</span>
          </div>
        )}
      </div>

      {/* the plain-word state of your worth */}
      <div style={{ minHeight: '1.4em', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 'clamp(11px,1.3vw,15px)', color: w < 0 ? P.coral : w > 0 ? P.mint : P.gold, textAlign: 'center' }}>
        {w < 0 ? `In the red — you owe $${-w}` : w > 0 ? `In the black — you have $${w}` : 'Right on zero — broke'}
      </div>
    </div>
  )
}

/** Interactive worth meter (practice + guided): drag the meter (or ± tap) to move
 *  your worth to where the money coming in / going out lands it, then GO. */
function WorthLoader({ P, task, value, setValue, disabled, reveal, onCommit }: {
  P: Palette; task: Task; value: SV; setValue: (v: SV) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: SV) => void
}): ReactElement {
  const setW = (w: number) => setValue({ worth: clampW(w), groups: 0, dir: 0 })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px,1.4vw,16px)', width: '100%' }}>
      <WorthBoard P={P} worth={value.worth} start={task.start} height="clamp(250px, 38vh, 350px)" reveal={reveal} onDragTo={setW} disabled={disabled} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Nudge P={P} label="−" disabled={disabled} onClick={() => setW(value.worth - 1)} />
        <div style={{ minWidth: 120, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(22px,2.4vw,32px)', fontWeight: 800, color: reveal ? P.mint : value.worth < 0 ? P.coral : P.gold }}>{money(clampW(value.worth))}</div>
          <div style={{ fontSize: 'clamp(11px,1.15vw,14px)', color: P.creamSoft }}>drag or tap ± </div>
        </div>
        <Nudge P={P} label="+" disabled={disabled} onClick={() => setW(value.worth + 1)} />
      </div>
      <CommitBtn P={P} label="GO ✓" disabled={disabled} onClick={() => onCommit(value)} />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// THE MONEY CARD BOARD — the illustration for signed × and ÷.
// money = a gold coin (+), debt = a red IOU (−). The SECOND number sets what each
// card is; the FIRST number (× ) / the child's choice (÷) sets the ACTION —
// ADD the cards (bring them in) or TAKE them away. Your NET WORTH is what's left,
// shown on a meter that turns green (rich) or red (in debt). The sign is never a
// rule — you SEE it: take away debt and the meter climbs into the green.
// ══════════════════════════════════════════════════════════════════════════════

const MRANGE = 20                                   // worth meter runs −20…+20
const clampM = (v: number) => Math.max(-MRANGE, Math.min(MRANGE, v))

/** The shared illustration: a worth meter, the cards being acted on, the big
 *  result, and a plain sentence naming what the action does to your worth. */
function MoneyBoard({ P, mode, a, b, groups, dir, height, reveal }: {
  P: Palette; mode: 'mul' | 'div'; a: number; b: number; groups: number; dir: 0 | 1 | -1
  height: string; reveal?: boolean
}): ReactElement {
  const bMag = Math.abs(b), aMag = Math.abs(a)
  const isDebt = b < 0
  const worth = dir === 0 ? 0 : dir * groups * b            // net worth = action · cards · value
  const chosen = dir !== 0 && groups > 0
  const result = mode === 'mul' ? worth : dir * groups       // ÷ answer = signed count
  const tint = !chosen ? P.gold : worth < 0 ? P.coral : P.mint
  const slots = mode === 'mul' ? aMag : aMag / bMag          // cards to place
  const hit = mode === 'div' && chosen && worth === a        // ÷ reached the target
  const why = dir === 0 ? '' : isDebt
    ? (dir === 1 ? 'Add debt → worth goes DOWN' : 'Take away debt → worth goes UP')
    : (dir === 1 ? 'Add money → worth goes UP' : 'Take away money → worth goes DOWN')

  // ── worth meter (vertical): 0 in the middle, green fill up / red fill down ──
  const fr = clampM(worth) / MRANGE                          // −1 … 1
  const tf = clampM(a) / MRANGE
  const meter = (
    <div style={{ position: 'relative', width: 'clamp(30px,4vw,42px)', height: '100%', borderRadius: 8, background: P.glass, border: `1px solid ${P.glassBorder}`, flexShrink: 0 }}>
      {/* zero line */}
      <div style={{ position: 'absolute', left: -4, right: -4, top: '50%', height: 2, background: P.glassBorder }} />
      <div style={{ position: 'absolute', right: 'calc(100% + 3px)', top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-numeric)', fontSize: 'clamp(8px,1vw,11px)', color: P.mutedOnPaper }}>$0</div>
      {/* the fill from 0 to current worth */}
      {worth !== 0 && (
        <div style={{ position: 'absolute', left: 4, right: 4, background: worth < 0 ? P.coral : P.mint, borderRadius: 5, transition: 'height 260ms, top 260ms, bottom 260ms',
          ...(worth >= 0 ? { bottom: '50%', height: `${fr * 50}%` } : { top: '50%', height: `${-fr * 50}%` }) }} />
      )}
      {/* the target marker (÷) */}
      {mode === 'div' && (
        <div style={{ position: 'absolute', left: -5, right: -5, bottom: `${50 + tf * 50}%`, height: 3, background: P.gold, boxShadow: `0 0 6px ${P.gold}`, transform: 'translateY(50%)' }} />
      )}
    </div>
  )

  // ── the cards ──
  const cardEl = (real: boolean, k: number) => (
    <div key={k} style={{
      width: 'clamp(34px,5vw,50px)', height: 'clamp(40px,6vw,58px)', flexShrink: 0, borderRadius: isDebt ? 6 : '50%',
      display: 'grid', placeItems: 'center', textAlign: 'center', lineHeight: 1.05, whiteSpace: 'pre-line',
      fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(11px,1.4vw,15px)',
      background: real ? (isDebt ? 'linear-gradient(#ff9d82,#e25b3f)' : 'linear-gradient(#ffe08a,#e0a534)') : 'transparent',
      color: real ? (isDebt ? '#fff' : '#3a2a08') : P.mutedOnPaper,
      border: real ? `2px solid ${isDebt ? '#c0442e' : '#b9821f'}` : `2px dashed ${P.glassBorder}`,
      opacity: real && dir === -1 ? 0.55 : 1,                 // taken-away cards fade
      textDecoration: real && dir === -1 ? 'line-through' : 'none',
      transition: 'opacity 200ms',
    }}>{real ? (isDebt ? `IOU\n$${bMag}` : `$${bMag}`) : ''}</div>
  )
  const cards = mode === 'mul'
    ? Array.from({ length: slots }, (_, k) => cardEl(k < groups, k))
    : Array.from({ length: groups }, (_, k) => cardEl(true, k))

  return (
    <div style={{ width: 'clamp(268px, 46vw, 400px)', height, boxSizing: 'border-box', borderRadius: 16, background: `linear-gradient(160deg, ${P.nightTop}, ${P.nightBot})`, border: `1.5px solid ${P.glassBorder}`, boxShadow: '0 12px 34px rgba(0,0,0,0.42)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: 'clamp(12px,2vh,20px) clamp(12px,1.8vw,20px)', gap: 'clamp(6px,1.2vh,12px)' }}>
      {/* the result */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(10px,1.1vw,13px)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: P.creamSoft }}>
          {mode === 'mul' ? 'your worth' : `answer${hit ? ' — target hit ✓' : ''}`}
        </div>
        <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: 'clamp(34px,6.2vw,54px)', lineHeight: 1, color: chosen ? tint : P.gold, textShadow: '0 0 18px rgba(0,0,0,0.5)' }}>
          {chosen ? (mode === 'mul' ? money(result) : result) : '?'}
        </div>
        {mode === 'div' && <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(10px,1.15vw,13px)', color: P.creamSoft }}>target {money(a)} · now {money(worth)}</div>}
      </div>

      {/* meter + cards */}
      <div style={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', alignItems: 'stretch', justifyContent: 'center', gap: 'clamp(10px,1.6vw,18px)' }}>
        {meter}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'clamp(4px,0.9vh,9px)' }}>
          <div style={{ fontSize: 'clamp(10px,1.1vw,13px)', color: P.creamSoft }}>each card: {isDebt ? `$${bMag} debt` : `$${bMag} coin`}</div>
          <div style={{ display: 'flex', gap: 'clamp(4px,0.7vw,8px)', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '100%' }}>{cards}</div>
        </div>
      </div>

      {/* the plain-word explanation of the sign */}
      <div style={{ minHeight: '1.4em', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 'clamp(11px,1.3vw,15px)', color: dir === 0 ? P.mutedOnPaper : worth < 0 ? P.coral : P.mint, textAlign: 'center' }}>
        {why || 'Add the cards, or take them away'}
      </div>
    </div>
  )
}

/** Interactive money card board (practice + guided): set how many cards, choose ADD
 *  or TAKE AWAY, GO. Value = SV ({groups, dir}); the committed answer is your net
 *  worth (×) or the signed card-count (÷) — see CONFIG.grade. */
function MoneyLoader({ P, task, value, setValue, disabled, reveal, onCommit }: {
  P: Palette; task: Task; value: SV; setValue: (v: SV) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: SV) => void
}): ReactElement {
  const mode = task.op as 'mul' | 'div'
  const a = task.a!, b = task.b!
  const aMag = Math.abs(a), bMag = Math.abs(b)
  const maxGroups = mode === 'mul' ? aMag : aMag / bMag
  const set = (g: number, d: 0 | 1 | -1) => setValue({ worth: 0, groups: g, dir: d })
  const rightDir = (mode === 'mul' ? a : task.answer) < 0 ? -1 : 1     // correct action to reveal
  const ready = value.groups > 0 && value.dir !== 0

  const actBtn = (d: 1 | -1, label: string) => {
    const on = value.dir === d
    const hitB = reveal && rightDir === d
    const lit = on || hitB
    return (
      <button type="button" disabled={disabled} onClick={() => set(value.groups, d)}
        style={{ flex: 1, padding: 'clamp(10px,1.2vw,14px)', borderRadius: 12, cursor: disabled ? 'default' : 'pointer',
          fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 'clamp(13px,1.45vw,17px)',
          background: lit ? P.gold : P.glass, color: lit ? '#241c3a' : P.cream,
          border: `2px solid ${lit ? P.gold : P.glassBorder}`, transition: 'background 140ms, border-color 140ms' }}>{label}</button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px,1.4vw,16px)', width: '100%' }}>
      <MoneyBoard P={P} mode={mode} a={a} b={b} groups={value.groups} dir={value.dir} height="clamp(250px, 38vh, 350px)" reveal={reveal} />

      {/* step 1 — how many cards */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Nudge P={P} label="−" disabled={disabled} onClick={() => set(Math.max(0, value.groups - 1), value.dir)} />
        <div style={{ minWidth: 140, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(24px,2.6vw,34px)', fontWeight: 800, color: reveal ? P.mint : P.gold }}>{value.groups}</div>
          <div style={{ fontSize: 'clamp(11px,1.15vw,14px)', color: P.creamSoft }}>{mode === 'mul' ? `cards · use ${aMag}` : 'how many cards'}</div>
        </div>
        <Nudge P={P} label="+" disabled={disabled} onClick={() => set(Math.min(maxGroups, value.groups + 1), value.dir)} />
      </div>

      {/* step 2 — the action */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, width: '100%', maxWidth: 'clamp(280px,42vw,440px)' }}>
        <div style={{ fontSize: 'clamp(11px,1.1vw,14px)', color: P.creamSoft, fontWeight: 700, letterSpacing: '0.04em' }}>Add them or take them away?</div>
        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          {actBtn(1, '＋ Add')}
          {actBtn(-1, '－ Take away')}
        </div>
      </div>

      <CommitBtn P={P} label="GO ✓" disabled={disabled || !ready} onClick={() => onCommit(value)} />
    </div>
  )
}

// ── the worked examples for the walkthrough ──────────────────────────────────
const DEMO_ADD: Task = { op: 'add', title: 'Your balance', badge: '2 − 5', tone: 'b', answer: -3, start: 2, prompt: '', say: '', work: [] }
const DEMO_MUL: Task = { op: 'mul', a: -5, b: -2, title: 'Do the action', badge: '−5 × −2', tone: 'a', answer: 10, start: 0, prompt: '', say: '', work: [] }
const DEMO_DIV: Task = { op: 'div', a: -18, b: -6, title: 'Reach the target', badge: '−18 ÷ −6', tone: 'a', answer: 3, start: 0, prompt: '', say: '', work: [] }
// ── the guided (we-do) order: a simple add/subtract so the child tries the meter,
//    easing into tier-1 (which is all add/subtract). ──
const GUIDED_TASK: Task = {
  op: 'add', title: 'Your balance', badge: '−3 + 5', tone: 'a', answer: 2, start: -3,
  context: `You're $3 in debt, then you get $5. Getting money moves your worth up, back toward zero.`,
  padInstruction: 'Work out your worth now, then tap that number.',
  prompt: `You owe $3, then get $5. Where's your worth?`,
  say: 'You owe three dollars. Then you get five. That climbs you past zero. What is your worth now? Tap your answer.',
  work: [`Start $3 in debt.`, `Get 5 dollars, so you climb past zero to 2 dollars.`, `So negative 3 plus 5 is 2.`],
}

// ══════════════════════════════════════════════════════════════════════════════
// WALKTHROUGH SCENES — the same illustration the child later drives, so teach = play.
// ══════════════════════════════════════════════════════════════════════════════

// ── the add/subtract scene — the worth meter sliding, driven by the step's worth ──
function WorthScene({ palette: P, task, value }: { palette: Palette; task: Task; value: SV }): ReactElement {
  return <WorthBoard P={P} worth={value.worth} start={task.start} height="clamp(300px, 46vh, 440px)" />
}

// ── the ×/÷ scene — the money card board acting the example out ──
function MoneyScene({ palette: P, task, value }: { palette: Palette; task: Task; value: SV }): ReactElement {
  return (
    <MoneyBoard P={P} mode={task.op as 'mul' | 'div'} a={task.a!} b={task.b!}
      groups={value.groups} dir={value.dir} height="clamp(300px, 46vh, 440px)" reveal={value.dir !== 0} />
  )
}

export const CONFIG: GameConfig<SV, Task> = {
  chapterId: 'signedRationalOps',
  title: 'MONEY LAB',
  ticketLabel: 'money log',
  palette: P,
  makeTask,
  initialValue: (t) => (t.op === 'add' ? W(t.start) : M(0, 0)),
  // Every task in this chapter resolves to ONE number (a net worth, or a signed card
  // count), so every question can be answered by tapping a choice.
  answerPad: (t) => numChoices(t.answer, t.miss ?? []),
  grade: (t, v) =>
    // AnswerPad hands back the tapped raw number, not an SV.
    typeof (v as unknown) === 'number' ? (v as unknown as number) === t.answer
    : t.op === 'add' ? v.worth === t.answer
    : t.op === 'mul' ? v.dir !== 0 && v.dir * v.groups * t.b! === t.answer
    : v.dir !== 0 && v.dir * v.groups === t.answer,
  revealText: (t) => disp(t.answer),
  motif: '💰',
  glide: (t, from, setValue, later) => {
    if (t.op === 'add') { glideNumber(from.worth, t.answer, (n) => setValue(W(n)), later); return }
    // ×: do a's worth of the action; ÷: the signed count is the answer.
    const q = t.op === 'mul' ? t.a! : t.answer
    const dir = (q < 0 ? -1 : 1) as 1 | -1
    const target = Math.abs(q)
    setValue(M(0, dir))
    for (let i = 1; i <= target; i++) later(() => setValue(M(i, dir)), 300 + i * 220)
  },
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) =>
    task.op === 'add' ? (
      <WorthLoader P={palette} task={task} value={value} setValue={setValue} disabled={disabled} reveal={reveal} onCommit={onCommit} />
    ) : (
      <MoneyLoader P={palette} task={task} value={value} setValue={setValue} disabled={disabled} reveal={reveal} onCommit={onCommit} />
    ),
  tutorial: [
    // Example 1 — ADD / SUBTRACT on the worth meter: money out drops you into debt.
    {
      task: DEMO_ADD, initial: W(2), hand: 'dragV',
      steps: [
        { say: 'This is your money meter — your net worth. Above the zero line you have money, in the green. Drop below zero and you are in the red — in debt. Let us work out two minus five.', value: W(2), hand: 'dragV', board: 'Start: $2' },
        { say: 'You start with two dollars, so your worth is up in the green.', value: W(2), hand: 'dragV' },
        { say: 'Minus five means you pay out five dollars. Paying takes your worth DOWN. Watch it drop, one dollar at a time.', value: W(2), hand: 'dragV', board: 'Pay $5 → worth goes down' },
        { say: 'Pay one — down to one dollar.', value: W(1), hand: 'dragV' },
        { say: 'Pay another — down to zero. You are broke, right on the line.', value: W(0), hand: 'dragV', board: 'past zero → into debt' },
        { say: 'Pay a third — now you drop below zero. You OWE a dollar: minus one.', value: W(-1), hand: 'dragV' },
        { say: 'Pay a fourth — you owe two.', value: W(-2), hand: 'dragV' },
        { say: 'Pay the fifth — you owe three dollars. Your worth is minus three.', value: W(-3), hand: 'dragV', board: '2 − 5 = −3' },
      ],
    },
    // Example 2 — MULTIPLY on the money card board: the action + type reveal the sign.
    {
      task: DEMO_MUL, initial: M(0, 0), hand: 'tap',
      steps: [
        { say: 'Times works differently — instead of sliding the meter, we lay out cards. A coin is money, a red IOU is debt. Let us do negative five times negative two.', value: M(0, 0), hand: 'tap', board: '−5 × −2' },
        { say: 'The second number, negative two, tells us what each card is: a two-dollar DEBT. A red IOU.', value: M(0, 0), hand: 'tap', board: 'each card = $2 debt' },
        { say: 'How many? Five cards. So here are five two-dollar IOUs.', value: M(5, 0), hand: 'tap', board: '5 cards' },
        { say: 'Now the FIRST number, negative five, is the action. Negative means TAKE THEM AWAY. Watch what happens to your worth when the debts leave.', value: M(5, -1), hand: 'tap', board: 'take away the debts' },
        { say: 'The five IOUs are gone — that is ten dollars of debt you no longer owe. Your worth climbs all the way up to positive ten.', value: M(5, -1), board: 'worth = +$10' },
        { say: 'So negative five times negative two is positive ten. Take away debt, and you get richer — that is why two negatives make a positive.', value: M(5, -1), board: '−5 × −2 = 10' },
      ],
    },
    // Example 3 — DIVIDE on the money card board: reach the target, count the action.
    {
      task: DEMO_DIV, initial: M(0, 0), hand: 'tap',
      steps: [
        { say: 'Divide asks a different question: how do we REACH a worth. We want a worth of negative eighteen — that means we owe eighteen dollars.', value: M(0, 0), hand: 'tap', board: 'reach −$18' },
        { say: 'Each card is a six-dollar IOU. To OWE money, we ADD debt. Add one IOU — now we owe six.', value: M(1, 1), hand: 'tap', board: 'add a $6 IOU' },
        { say: 'Add another — we owe twelve.', value: M(2, 1), hand: 'tap' },
        { say: 'Add a third — now we owe eighteen. That hits the target exactly. It took three cards, and we ADDED them.', value: M(3, 1), hand: 'tap', board: 'added 3 → −$18' },
        { say: 'We added three, so the answer is positive three. Negative eighteen divided by negative six is positive three.', value: M(3, 1), board: '−18 ÷ −6 = 3' },
      ],
    },
  ],
  guided: {
    task: GUIDED_TASK,
    coach: 'Your turn — I will help.',
    hand: 'dragV',
  },
  TutorialScene: ({ palette, task, value }) =>
    task.op === 'add'
      ? <WorthScene palette={palette} task={task} value={value} />
      : <MoneyScene palette={palette} task={task} value={value} />,
  start: { blurb: <><strong style={{ color: P.cream }}>You&apos;re tracking your money.</strong> Slide your worth up and down as cash comes in and goes out for adding and subtracting — and work with coins and debt for multiplying and dividing.</>, ticket: { title: 'First balance', badge: '−3 + 5', tone: 'a' }, startLabel: 'Open the ledger →' },
  overview: {
    say: "Here's the plan. It's all money. Your net worth sits on a meter: green when you have money, red when you're in debt. To add and subtract, money comes in or goes out and your worth slides up or down, past zero into the red if you spend too much. To multiply and divide, you handle cards: a coin is money, a red IOU is debt. The second number says what each card is, the first number says whether we add them or take them away. Take away debt and your worth goes up — that is how two negatives make a positive.",
    problem: <>It&apos;s all <strong>money</strong>: slide your <strong>worth</strong> up & down to add & subtract, and handle <strong>coins & debt</strong> to multiply & divide.</>,
    points: [
      <>Money <strong>in (+)</strong> or <strong>out (−)</strong> slides your worth — past zero into <strong>debt</strong>.</>,
      <>A <strong>coin</strong> is money (+), a red <strong>IOU</strong> is debt (−).</>,
      <><strong>Take away debt → worth goes up</strong> — that&apos;s why two negatives make a positive.</>,
    ],
  },
  sig: (t) => t.badge,
}

export default function SkyTower(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
