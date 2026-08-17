'use client'
/**
 * StoreCheckout — the Percentages chapter as a PLAYABLE GAME (real-world use: the
 * till at a store). The kid rings up each order: a discount / sale price / saving /
 * added tax / tip is SOLVED ON a 100-square price grid — the child shades the given
 * percent and the grid computes the dollars (the money EMERGES; no amount is worked
 * out in the head and dialled). Two instruments: PaintGrid (shade a %) and PriceGrid
 * (shade the % of a price → the sale price / saving / tip / total).
 * No slides-as-lessons, no MCQ. Shared adaptive engine + universal layout underneath.
 *
 * (Migrated onto the shared GameShell from the old self-contained ShopRush, so it
 * now gets the universal chalkboard-question layout + motif backdrop like every
 * other chapter. Same percentage maths.)
 *
 * Teaching is "I do → we do → you do": a two-example WALKTHROUGH (first SHADE 25%
 * on the grid to see it is a quarter, then apply 25% off $80 on the price slider),
 * then a GUIDED order (50% off $10) coached but not scored, then the scored loop.
 */
import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useTransform, animate, useReducedMotion, type MotionValue } from 'motion/react'
import { Game, type BaseTask, type GameConfig } from './parts/GameShell'
import { Palette, PaintGrid, Nudge, CommitBtn, numChoices, reduce, tidy, money } from './parts/gameKit'
import { pick } from '@/core/rand'
import { SceneBg } from '@/shared/ui/SceneBg'

const P: Palette = {
  nightTop: '#10212e', nightBot: '#183245',
  cream: '#eaf6ff', creamSoft: 'rgba(234,246,255,0.82)',
  inkOnPaper: '#173040', mutedOnPaper: '#6f8a9a',
  gold: '#ffcf5c', goldDeep: '#e0a534',
  coral: '#ff8a6b', coralDeep: '#e25b3f', mint: '#4fd6a0',
  glass: 'rgba(16,33,46,0.6)', glassBorder: 'rgba(234,246,255,0.22)',
}

// `start` = the value the instrument begins on. For a PRICE order the price grid starts
// with 0% shaded, so a "sale price" / "with tax" order starts at the full price and a
// "how much saved / tip" order starts at 0.
interface Task extends BaseTask {
  mech: 'paint' | 'price'
  answer: number
  start: number
  pct?: number; basePrice?: number              // price: the percent and the base price
  mode?: 'part' | 'sale' | 'plus'               // shaded amount is the answer / taken off / added on
}

const ITEMS = ['Hoodie', 'Sneakers', 'Backpack', 'Game', 'Jacket', 'Cap', 'Bottle']

// ── SHADE a percent on the 100-grid (answer = the percent count) ──────────────
function paintTask(): Task {
  const pct = pick([10, 20, 25, 40, 50, 60, 75])
  return {
    mech: 'paint', title: 'Shade the percent', badge: `${pct}%`, tone: 'a', answer: pct, start: 0, showEquals: false,
    instruction: `Look at the grid. It has 100 squares. Percent means out of 100, so shade ${pct} squares.`,
    prompt: `Shade ${pct}% on the grid.`,
    say: `Shade ${pct} percent on the grid — that many of the hundred squares.`,
    work: [`${pct} percent means ${pct} out of 100.`, `Shade ${pct} squares — that is ${reduce(pct, 100)}, or ${tidy(pct / 100)} as a decimal.`],
  }
}
// Every money order is now SOLVED ON the price grid: the child shades the given percent
// of the price, and the grid computes the dollars — the percent (per-hundred) is shaded,
// the money EMERGES, never a dollar amount worked out in the head and dialled.
// ── discount → sale price (shade the % off; the rest is the sale price) ────────
function slideSale(): Task {
  const pct = pick([10, 20, 25, 50]); const price = pick([40, 60, 80, 120, 200]); const disc = tidy((pct / 100) * price); const ans = tidy(price - disc); const item = pick(ITEMS)
  return {
    mech: 'price', mode: 'sale', pct, basePrice: price, title: item, badge: `${money(price)} · ${pct}% off`, tone: 'a', answer: ans, start: price,
    answerLabel: 'sale price =',
    context: `The ${item.toLowerCase()} costs ${money(price)}. It is ${pct}% off. "Off" means that much is taken away, so you pay less.`,
    padInstruction: `Work out the new price after ${pct}% comes off. Tap that number.`,
    instruction: `Look at the price grid. The whole grid is ${money(price)}. Shade ${pct}% to take it off. What is left is the sale price.`,
    prompt: `${item} is ${pct}% off ${money(price)}. Shade the ${pct}% discount on the price grid — the rest is the sale price.`,
    say: `This ${item.toLowerCase()} is ${pct} percent off ${money(price)}. Shade the ${pct} percent discount on the grid. What's left is the sale price.`,
    work: [`${pct} percent of ${price} is ${disc}.`, `Take it off: ${price} minus ${disc} is ${ans}.`],
  }
}
// ── discount → how much is saved (shade the %; the shaded dollars are the saving) ─
function slideSaving(): Task {
  const pct = pick([10, 20, 25, 50]); const price = pick([40, 60, 80, 120]); const save = tidy((pct / 100) * price); const item = pick(ITEMS)
  return {
    mech: 'price', mode: 'part', pct, basePrice: price, title: 'How much saved?', badge: `${money(price)} · ${pct}% off`, tone: 'a', answer: save, start: 0,
    answerLabel: 'saved =',
    context: `The ${item.toLowerCase()} costs ${money(price)}. It is ${pct}% off. The money you save is the ${pct}% that comes off.`,
    padInstruction: `Work out ${pct}% of ${money(price)} — that is the money saved. Tap that number.`,
    instruction: `Look at the price grid. The whole grid is ${money(price)}. Shade ${pct}%. The shaded dollars are what you save.`,
    prompt: `${item} is ${pct}% off ${money(price)}. Shade the ${pct}% on the price grid — the shaded dollars are what they SAVE.`,
    say: `This ${item.toLowerCase()} is ${pct} percent off ${money(price)}. Shade the ${pct} percent on the grid. The shaded dollars are the saving.`,
    work: [`${pct} percent of ${price} is ${save}.`, `The shaded part of the grid is ${money(save)} — that is the saving.`],
  }
}
// ── add sales tax → new price (shade the tax %; add it onto the price) ──────────
function slideTax(): Task {
  const pct = pick([10, 20, 25, 50]); const price = pick([40, 60, 80, 120]); const tax = tidy((pct / 100) * price); const ans = tidy(price + tax)
  const item = pick(['Console', 'Bike', 'Headphones', 'Sneakers'])
  return {
    mech: 'price', mode: 'plus', pct, basePrice: price, title: item, badge: `${money(price)} · +${pct}% tax`, tone: 'b', answer: ans, start: price,
    answerLabel: 'total =',
    context: `The ${item.toLowerCase()} costs ${money(price)}. Tax of ${pct}% is added on top. "Added" means the total goes up.`,
    padInstruction: `Work out the price with the ${pct}% tax added on. Tap that number.`,
    instruction: `Look at the price grid. The whole grid is ${money(price)}. Shade the ${pct}% tax. It gets added on to the price.`,
    prompt: `${item} is ${money(price)} plus ${pct}% tax. Shade the ${pct}% tax on the price grid — it adds onto the total.`,
    say: `This ${item.toLowerCase()} is ${money(price)} plus ${pct} percent tax. Shade the ${pct} percent tax on the grid. It adds onto the total.`,
    work: [`${pct} percent of ${price} is ${tax}.`, `Add it on: ${price} plus ${tax} is ${ans}.`],
  }
}
// ── tip on a bill (shade the tip %; the shaded dollars are the tip) ─────────────
function slideTip(): Task {
  const pct = pick([10, 15, 20, 25]); const price = pick([20, 40, 60, 80]); const tip = tidy((pct / 100) * price)
  return {
    mech: 'price', mode: 'part', pct, basePrice: price, title: 'Tip', badge: `${money(price)} bill · ${pct}% tip`, tone: 'b', answer: tip, start: 0,
    answerLabel: 'tip =',
    context: `The meal costs ${money(price)}. You leave a ${pct}% tip. The tip is ${pct}% of the bill — extra money for good service.`,
    padInstruction: `Work out ${pct}% of ${money(price)} — that is the tip. Tap that number.`,
    instruction: `Look at the bill grid. The whole grid is ${money(price)}. Shade the ${pct}% tip. The shaded dollars are the tip.`,
    prompt: `The bill is ${money(price)} and the tip is ${pct}%. Shade the ${pct}% on the bill grid — the shaded dollars are the tip.`,
    say: `The bill is ${price} dollars and you tip ${pct} percent. Shade the ${pct} percent on the grid. The shaded dollars are the tip.`,
    work: [`${pct} percent of ${price} is ${tip}.`, `The shaded part of the grid is ${money(tip)} — that is the tip.`],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  const pool: (() => Task)[] =
    d === 1 ? [paintTask, paintTask, slideSale]
    : d === 2 ? [slideSale, slideSaving, paintTask]
    : [slideTax, slideTip, slideSaving]
  return pick(pool)()
}

// ── walkthrough example 1: SHADE 25% (see it is a quarter) ────────────────────
const DEMO_PAINT: Task = { mech: 'paint', title: 'Shade the percent', badge: '25%', tone: 'a', answer: 25, start: 0, prompt: '', say: '', work: [] }
const SCRIPT_PAINT = {
  task: DEMO_PAINT, initial: 0, hand: 'tap' as const,
  steps: [
    { say: 'Welcome to the checkout. First, what does a percent actually mean? This grid has one hundred little squares.', value: 0, hand: 'tap' as const },
    { say: 'Percent means "out of a hundred". So twenty-five percent is twenty-five of the hundred squares.', value: 0, board: '25% = 25 of 100' },
    { say: 'Watch twenty-five squares shade in. See how it fills one corner — a quarter of the whole grid.', value: 25, hand: 'tap' as const, board: '25/100 = ¼' },
    { say: 'So twenty-five percent is the same as one quarter. Hold on to that.', value: 25, board: '25% = ¼' },
  ],
}
// ── walkthrough example 2: 25% OFF $80 (the price tag drops as the discount lands) ─
const DEMO_SLIDE: Task = { mech: 'price', mode: 'sale', pct: 25, basePrice: 80, title: 'Hoodie', badge: '$80 · 25% off', tone: 'a', answer: 60, start: 80, prompt: '', say: '', work: [] }
const SCRIPT_SLIDE = {
  task: DEMO_SLIDE, initial: 80, hand: 'drag' as const,
  steps: [
    { say: 'Now a real order: a hoodie, eighty dollars, twenty-five percent off. This slider is the price.', value: 80, hand: 'drag' as const, board: '$80,  25% off' },
    { say: 'We just saw twenty-five percent is a quarter. A quarter of eighty dollars is twenty dollars.', value: 80, board: '25% of $80 = $20' },
    { say: 'So take twenty dollars off. Slide the price down — seventy…', value: 70, hand: 'drag' as const, board: '$80 − $20' },
    { say: '…and down to sixty dollars. Eighty take away twenty is sixty.', value: 60, hand: 'drag' as const, board: '= $60' },
    { say: "Sixty dollars is the sale price. Press ring it up when it's right. Now let's try one together.", value: 60, hand: 'tap' as const },
  ],
}

const GUIDED_TASK: Task = {
  mech: 'price', mode: 'sale', pct: 50, basePrice: 10, title: 'Cap', badge: '$10 · 50% off', tone: 'a', answer: 5, start: 10,
  answerLabel: 'sale price =',
  context: 'The cap costs $10. It is 50% off. 50% off means half the price comes off, so you pay less.',
  padInstruction: 'Work out the new price after 50% comes off. Tap that number.',
  instruction: 'Look at the price grid. The whole grid is $10. Shade 50% to take it off. What is left is the sale price.',
  prompt: 'Half off $10 — shade the 50% discount on the grid, then ring up what’s left.',
  say: 'This cap is fifty percent off ten dollars. Fifty percent is half. Shade half the grid, then ring up what is left.',
  work: ['Fifty percent is one half.', 'Half of 10 is 5 — the rest is 5.'],
}

// ── Animated walkthrough scene — the storyboard, in motion ────────────────────
// A code-drawn checkout counter. TWO acts, matched to the two-example tutorial:
//   • PAINT act (task.mech==='paint'): a 10×10 hundred-grid whose squares SHADE in
//     progressively — value squares light gold, keyed to the step's `value`. A pill
//     reads "N% = N of 100" and, at the end, "= ¼".
//   • SLIDE act (task.mech==='slide'): a PRICE TAG on a till readout. The number
//     GLIDES down from the full price to the sale price as the step value drops; a
//     "− $X" saving chip pops in; the tag glows mint and stamps SALE at the end.
// Driven by props (value / task / stepIndex). The animated quantities — the number
// of shaded grid squares, and the sliding PRICE / saving / tag-drop — ride on Framer
// Motion springs (useMotionValue + animate, re-targeted whenever `value` changes) so
// they glide continuously at 60fps instead of snapping per narration step. Reduced
// motion snaps to the final value. The counter dressing is an illustrated backdrop
// (Nano Banana 2), the same style as WeatherStation's BankAccountScene; a scrim keeps
// the code-drawn grid/tag legible.
const SPRING = { type: 'spring' as const, stiffness: 120, damping: 26, mass: 0.9 }
const ART = '/assets/teen/objects'

function StoreCheckoutScene({ palette: P, task, value, stepIndex, frameCount, ended }: {
  palette: Palette; task: Task; value: number; stepIndex: number; frameCount: number; ended: boolean
}) {
  const isPaint = task.mech === 'paint'
  // Per-ACT completion: an act is "solved" once its own value lands on the answer
  // (each example resets task+value, so this reads correctly for whichever act is
  // on screen). The global end still forces the final glow on the last beats.
  const globalEnd = ended || stepIndex >= frameCount - 2
  const resultPhase = globalEnd || Math.abs(value - task.answer) < 1e-6

  return (
    <div style={{ position: 'relative', width: 'clamp(248px, 44vw, 372px)', height: 'clamp(300px, 46vh, 440px)', borderRadius: 16, background: `linear-gradient(${P.nightTop}, ${P.nightBot})`, border: `1.5px solid ${P.glassBorder}`, overflow: 'hidden', boxShadow: '0 12px 34px rgba(0,0,0,0.42)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(14px,3vw,22px)', gap: 'clamp(12px,2.4vh,20px)' }}>
      {/* illustrated store-checkout backdrop + a soft scrim so the grid/tag read clearly */}
      <SceneBg src={`${ART}/shop_checkout_bg.png`} priority />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(rgba(6,20,16,.42), rgba(6,20,16,.66))' }} />

      <style>{'@keyframes scPop{0%{opacity:0;transform:translateY(6px) scale(.8)}100%{opacity:1;transform:translateY(0) scale(1)}}@keyframes scStamp{0%{opacity:0;transform:rotate(-14deg) scale(1.5)}60%{opacity:1;transform:rotate(-14deg) scale(.92)}100%{opacity:1;transform:rotate(-14deg) scale(1)}}@keyframes scGlow{0%,100%{opacity:.5}50%{opacity:1}}'}</style>

      {isPaint
        ? <PaintAct P={P} value={value} resultPhase={resultPhase} />
        : <PriceAct P={P} task={task} value={value} resultPhase={resultPhase} />}
    </div>
  )
}

// one shaded/unshaded grid square — lights up as the spring-driven count sweeps past it
function GridSquare({ i, count, fill, rim, resultPhase }: {
  i: number; count: MotionValue<number>; fill: string; rim: string; resultPhase: boolean
}) {
  const bg = useTransform(count, (x) => (i < x - 1e-6 ? fill : 'rgba(255,244,221,0.10)'))
  const bc = useTransform(count, (x) => (i < x - 1e-6 ? rim : 'rgba(255,244,221,0.18)'))
  const shadow = useTransform(count, (x) => (i < x - 1e-6 && resultPhase ? `0 0 5px ${fill}88` : 'none'))
  return (
    <motion.div style={{ aspectRatio: '1', borderRadius: 2, background: bg, borderStyle: 'solid', borderWidth: 1, borderColor: bc, boxShadow: shadow }} />
  )
}

// ── the hundred-grid act ──────────────────────────────────────────────────────
function PaintAct({ P, value, resultPhase }: { P: Palette; value: number; resultPhase: boolean }) {
  const fill = resultPhase ? P.mint : P.gold
  const rim = resultPhase ? '#3fa77c' : P.goldDeep

  // the shaded-square count glides continuously on a spring; squares light in reading
  // order as it sweeps, and the readout ticks with it. Re-targets whenever value changes.
  const reduceMotion = useReducedMotion()
  const count = useMotionValue(value)
  useEffect(() => {
    const controls = animate(count, value, reduceMotion ? { duration: 0 } : SPRING)
    return () => controls.stop()
  }, [value, reduceMotion, count])
  const pctText = useTransform(count, (x) => `${Math.round(x)}`)

  return (
    <>
      <div style={{ fontSize: 'clamp(11px,1.4vw,14px)', fontWeight: 700, color: P.creamSoft, letterSpacing: 0.4 }}>
        PERCENT = OUT OF 100
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 'clamp(1.5px,0.4vw,3px)', width: 'clamp(180px,32vw,268px)', padding: 'clamp(6px,1.2vw,9px)', borderRadius: 12, background: P.glass, border: `1px solid ${P.glassBorder}` }}>
        {Array.from({ length: 100 }, (_, i) => (
          <GridSquare key={i} i={i} count={count} fill={fill} rim={rim} resultPhase={resultPhase} />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 34 }}>
        <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(20px,2.6vw,32px)', fontWeight: 800, color: fill, textShadow: `0 0 16px ${rim}55`, transition: 'color 400ms' }}>
          <motion.span>{pctText}</motion.span>% <span style={{ color: P.mutedOnPaper, fontWeight: 700 }}>= <motion.span>{pctText}</motion.span> of 100</span>
        </div>
        {resultPhase && value === 25 && (
          <div style={{ padding: '3px 11px', borderRadius: 999, background: P.mint, color: P.inkOnPaper, fontWeight: 800, fontSize: 'clamp(13px,1.6vw,17px)', animation: 'scPop 320ms ease' }}>= ¼</div>
        )}
      </div>
    </>
  )
}

// ── the price-tag act ─────────────────────────────────────────────────────────
function PriceAct({ P, task, value, resultPhase }: { P: Palette; task: Task; value: number; resultPhase: boolean }) {
  const full = task.start                // full price ($80)
  const sale = task.answer               // sale price ($60)
  const tagColor = resultPhase ? P.mint : P.gold
  const showSaving = value < full - 0.5

  // the price rides a spring (overdamped so it never overshoots a dollar it shouldn't):
  // the tag number, its vertical drop, and the saving chip all glide continuously from
  // the current value to the step's target, re-targeting whenever value changes.
  const reduceMotion = useReducedMotion()
  const price = useMotionValue(value)
  useEffect(() => {
    const controls = animate(price, value, reduceMotion ? { duration: 0 } : SPRING)
    return () => controls.stop()
  }, [value, reduceMotion, price])
  // the tag's vertical drop: 0 at full price, grows as the price falls (visual "slide down")
  const tagTransform = useTransform(price, (x) => `translateY(${full > sale ? ((full - x) / (full - sale)) * 26 : 0}%)`)
  const priceText = useTransform(price, (x) => money(Math.round(x)))
  const savingText = useTransform(price, (x) => `− ${money(Math.round(full - x))} off`)

  return (
    <>
      {/* the item on sale — sits above the price tag; glows mint once the discount lands */}
      <img src={`${ART}/shop_hoodie.png`} alt="" style={{ position: 'absolute', top: '6%', left: '50%', transform: 'translateX(-50%)', width: 'clamp(46px,10vw,74px)', height: 'auto', zIndex: 1, transition: 'filter 400ms', filter: resultPhase ? `drop-shadow(0 0 9px ${P.mint})` : 'drop-shadow(0 3px 6px rgba(0,0,0,0.45))' }} />

      <div style={{ fontSize: 'clamp(11px,1.4vw,14px)', fontWeight: 700, color: P.creamSoft, letterSpacing: 0.4, textAlign: 'center' }}>
        {task.title.toUpperCase()} · {task.badge.split('·').slice(-1)[0].trim().toUpperCase()}
      </div>

      {/* original price, struck through once the discount lands */}
      <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(15px,2vw,20px)', fontWeight: 700, color: P.mutedOnPaper, textDecoration: showSaving ? 'line-through' : 'none', transition: 'text-decoration 300ms', minHeight: 24 }}>
        {money(full)}
      </div>

      {/* the price tag — glides down as the number falls */}
      <motion.div style={{ position: 'relative', transform: tagTransform }}>
        <div style={{
          position: 'relative', padding: 'clamp(12px,2.4vw,20px) clamp(20px,4vw,34px)', borderRadius: 14,
          background: P.glass, border: `2.5px solid ${tagColor}`,
          boxShadow: resultPhase ? `0 0 22px ${P.mint}77` : `0 6px 18px rgba(0,0,0,0.4)`,
          transition: 'border-color 400ms, box-shadow 400ms',
        }}>
          {/* tag hole + string dot */}
          <div style={{ position: 'absolute', top: -7, left: '50%', transform: 'translateX(-50%)', width: 10, height: 10, borderRadius: '50%', background: P.nightBot, border: `2px solid ${tagColor}`, transition: 'border-color 400ms' }} />
          <motion.div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(38px,7vw,60px)', fontWeight: 800, color: tagColor, lineHeight: 1, textShadow: resultPhase ? `0 0 20px ${P.mint}66` : 'none', transition: 'color 400ms', letterSpacing: -1 }}>
            {priceText}
          </motion.div>
          {resultPhase && (
            <div style={{ position: 'absolute', top: 'clamp(-16px,-2.2vw,-12px)', right: 'clamp(-16px,-2.4vw,-12px)', transform: 'rotate(-14deg)', padding: '4px 12px', borderRadius: 8, background: P.mint, color: P.inkOnPaper, fontWeight: 900, fontSize: 'clamp(12px,1.6vw,16px)', letterSpacing: 1, animation: 'scStamp 460ms ease', boxShadow: '0 3px 10px rgba(0,0,0,0.4)' }}>SALE</div>
          )}
        </div>
      </motion.div>

      {/* saving chip — how much has come off */}
      <div style={{ minHeight: 30, display: 'flex', alignItems: 'center' }}>
        {showSaving && (
          <motion.div style={{ padding: '4px 14px', borderRadius: 999, background: resultPhase ? P.mint : P.coral, color: P.inkOnPaper, fontWeight: 800, fontSize: 'clamp(13px,1.7vw,17px)', animation: 'scPop 300ms ease', fontFamily: 'var(--font-numeric)' }}>
            {savingText}
          </motion.div>
        )}
      </div>
    </>
  )
}

// ── PRICE GRID — the money order SOLVED ON the illustration. The 100-square grid IS
//    the price; the child shades the given percent, and the grid computes the dollars:
//    the shaded part is the discount/saving/tip/tax, and the answer (sale price / total
//    / amount) EMERGES. No dollar figure worked out in the head and dialled. ──
function PriceGrid({ P, task, setValue, disabled, reveal, onCommit }: {
  P: Palette; task: Task; setValue: (v: number) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: number) => void
}) {
  const pct = task.pct!, price = task.basePrice!, mode = task.mode!
  const [shaded, setShaded] = useState(0)
  const painting = useRef(false)
  // ⚠️ RESET DURING RENDER, NOT IN AN EFFECT. An effect runs AFTER paint, so a new round
  // painted the PREVIOUS round's grid for a frame before snapping to empty — the child sees a
  // flash of the last answer over the new question. This is React's documented "adjusting
  // state when a prop changes": the render is thrown away and re-run before anything is shown.
  const [seenTask, setSeenTask] = useState(task)
  if (seenTask !== task) { setSeenTask(task); setShaded(0) }
  // Same again for the reveal: in an effect it painted the child's own (wrong) answer for a
  // frame before snapping to the correct one — on the single beat where the correct one is the
  // whole point. Keyed on the TRANSITION so it fires once, exactly as the effect did.
  const [seenReveal, setSeenReveal] = useState(reveal)
  if (seenReveal !== reveal) { setSeenReveal(reveal); if (reveal) setShaded(pct) }
  const amt = Math.round((shaded / 100) * price)                       // $ of the shaded percent
  const result = mode === 'part' ? amt : mode === 'sale' ? price - amt : price + amt
  const hit = shaded === pct
  const fill = reveal || hit ? P.mint : P.gold
  const rim = reveal || hit ? '#3fa77c' : P.goldDeep
  const set = (n: number) => { if (disabled) return; const s = Math.max(0, Math.min(100, n)); setShaded(s); const a = Math.round((s / 100) * price); setValue(mode === 'part' ? a : mode === 'sale' ? price - a : price + a) }
  const resultLine = mode === 'part'
    ? <>the shaded part = <span style={{ color: fill }}>{money(amt)}</span></>
    : mode === 'sale'
      ? <>{money(price)} − {money(amt)} = <span style={{ color: fill }}>{money(result)}</span></>
      : <>{money(price)} + {money(amt)} = <span style={{ color: fill }}>{money(result)}</span></>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(9px,1.3vw,14px)', width: '100%' }}>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(10px,1.1vw,13px)', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: P.creamSoft }}>🛒 {task.badge} · grid = {money(price)}</div>
      <div onPointerUp={() => { painting.current = false }} onPointerLeave={() => { painting.current = false }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 2, width: 'min(66vw, 320px)', padding: 7, borderRadius: 12, background: P.glass, border: `1px solid ${P.glassBorder}`, touchAction: 'none', userSelect: 'none' }}>
        {Array.from({ length: 100 }, (_, i) => {
          const on = i < shaded
          return <div key={i}
            onPointerDown={() => { if (disabled) return; painting.current = true; set(i + 1) }}
            onPointerEnter={() => { if (painting.current) set(i + 1) }}
            style={{ aspectRatio: '1', borderRadius: 2, background: on ? fill : 'rgba(255,244,221,0.10)', border: `1px solid ${on ? rim : 'rgba(255,244,221,0.18)'}`, cursor: disabled ? 'default' : 'pointer', transition: 'background 90ms' }} />
        })}
      </div>
      <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: 'clamp(14px,1.7vw,20px)', color: P.creamSoft }}>
        shaded <span style={{ color: fill }}>{shaded}%</span> = {money(amt)}
      </div>
      <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: 'clamp(18px,2.4vw,28px)', color: P.cream }}>{resultLine}</div>
      <div style={{ minHeight: '1.2em', fontFamily: 'var(--font-body)', fontSize: 'clamp(10px,1.1vw,13px)', color: hit ? P.mint : P.mutedOnPaper }}>{hit ? 'the grid does the money ✓' : `shade the ${pct}% — the grid finds the dollars`}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Nudge P={P} label="−" disabled={disabled} onClick={() => set(shaded - 1)} />
        <div style={{ minWidth: 96, textAlign: 'center' }}><div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(18px,2vw,26px)', fontWeight: 800, color: fill }}>{shaded}%</div></div>
        <Nudge P={P} label="+" disabled={disabled} onClick={() => set(shaded + 1)} />
      </div>
      <CommitBtn P={P} label="RING IT UP ✓" disabled={disabled} onClick={() => onCommit(result)} />
    </div>
  )
}

// ── ANSWER PAD — the money orders are answered by TAPPING a dollar amount. The
//    distractors are the real checkout misconceptions, not arithmetic noise:
//      • sale  — the SAVING instead of the sale price (the single most common miss),
//                the price left un-discounted, the discount ADDED, applied twice, and
//                the percent subtracted as if it were dollars.
//      • part  — (saving / tip) the OTHER side of the same split: the sale price /
//                bill-minus-tip, the un-adjusted price, the total, and the bare percent.
//      • plus  — (tax) the base price un-taxed, and the tax SUBTRACTED instead of added.
//    Every answer here is a whole number of dollars, so numChoices stays whole-dollar
//    (no $40.01 neighbours); `min: 1` drops nonsense negatives and `max` keeps a choice
//    from being a giveaway by scale. The SHADE-a-percent task keeps the grid — its
//    answer is printed in the badge, so a tap pad would make it a reading exercise.
function answerPad(t: Task): number[] {
  if (t.mech !== 'price') return []
  const pct = t.pct!, price = t.basePrice!
  const amt = tidy((pct / 100) * price)     // the shaded dollars
  const near = t.mode === 'sale'
    ? [amt, price, tidy(price + amt), tidy(price - 2 * amt), tidy(price - pct), tidy(price + pct)]
    : t.mode === 'plus'
      ? [price, tidy(price - amt), amt, tidy(price + 2 * amt), tidy(price + pct)]
      : [tidy(price - amt), price, tidy(price + amt), pct]
  return numChoices(t.answer, near, { min: 1, max: price * 2, count: 4 })
}

const CONFIG: GameConfig<number, Task> = {
  chapterId: 'percentages',
  title: 'STORE CHECKOUT',
  ticketLabel: 'receipt',
  motif: '🛒',
  palette: P,
  makeTask,
  answerPad,
  initialValue: (t) => t.start,
  grade: (t, v) => t.mech === 'paint' ? v === t.answer : Math.abs(v - t.answer) < 1e-6,
  revealText: (t) => t.mech === 'paint' ? `${t.answer}%` : money(t.answer),
  glide: (t, from, setValue, later) => later(() => setValue(t.answer), 600),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) => (
    task.mech === 'paint'
      ? <PaintGrid P={palette} value={value} setValue={setValue} disabled={disabled} reveal={reveal} onCommit={onCommit} commitLabel="SHADE IT ✓" />
      : <PriceGrid P={palette} task={task} setValue={setValue} disabled={disabled} reveal={reveal} onCommit={onCommit} />
  ),
  tutorial: [SCRIPT_PAINT, SCRIPT_SLIDE],
  TutorialScene: StoreCheckoutScene,
  guided: { task: GUIDED_TASK, coach: 'Your turn — I will help.', hand: 'drag' },
  start: {
    blurb: <><strong style={{ color: P.cream }}>You&apos;re on the till at the store.</strong> Ring up each order — work out the discount, the sale price, the saving, the tax or the tip — and set the right amount.</>,
    ticket: { title: 'Hoodie', badge: '25% off', tone: 'a' },
    startLabel: 'Open the till →',
  },
  overview: {
    say: "Here is what we are figuring out: a store is taking twenty-five percent off an eighty dollar hoodie, and we want the sale price. First we will see that twenty-five percent is just one quarter of the grid, then we take a quarter off eighty dollars — that is finding a percent of a price and subtracting it.",
    problem: <>What is the sale price? We&apos;ll take <strong>25% off an $80 hoodie</strong>.</>,
    points: [
      <><strong>25%</strong> means 25 of 100 squares — the same as <strong>one quarter</strong>.</>,
      <>A quarter of $80 is <strong>$20</strong> — that is the discount coming off.</>,
      <>Take it off: <strong>$80 − $20 = $60</strong>, the sale price we ring up.</>,
    ],
  },
  sig: (t) => `${t.mech}:${t.badge}:${t.answer}`,
}

export default function StoreCheckout(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
