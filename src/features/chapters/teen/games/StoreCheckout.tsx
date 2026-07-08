'use client'
/**
 * StoreCheckout — the Percentages chapter as a PLAYABLE GAME (real-world use: the
 * till at a store). The kid rings up each order: work out a discount / sale price /
 * saving / added tax / tip, or SHADE a percentage on a 100-square grid to see what
 * it means. Two instruments: PaintGrid (shade a %) and SlideValue (dial an amount).
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
import { useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate, useReducedMotion, type MotionValue } from 'motion/react'
import { Game, type BaseTask, type GameConfig } from './parts/GameShell'
import { Palette, PaintGrid, SlideValue, pick, reduce, tidy, money, glideNumber } from './parts/gameKit'

const P: Palette = {
  nightTop: '#10212e', nightBot: '#183245',
  cream: '#eaf6ff', creamSoft: 'rgba(234,246,255,0.82)',
  inkOnPaper: '#173040', mutedOnPaper: '#6f8a9a',
  gold: '#ffcf5c', goldDeep: '#e0a534',
  coral: '#ff8a6b', coralDeep: '#e25b3f', mint: '#4fd6a0',
  glass: 'rgba(16,33,46,0.6)', glassBorder: 'rgba(234,246,255,0.22)',
}

// `start` = the value the instrument begins on (so a "slide DOWN to the sale price"
// order starts at the full price, and a "how much is the saving" order starts at 0).
interface Task extends BaseTask {
  mech: 'paint' | 'slide'
  answer: number
  min?: number; max?: number; step?: number
  start: number
}

const ITEMS = ['Hoodie', 'Sneakers', 'Backpack', 'Game', 'Jacket', 'Cap', 'Bottle']

// ── SHADE a percent on the 100-grid (answer = the percent count) ──────────────
function paintTask(): Task {
  const pct = pick([10, 20, 25, 40, 50, 60, 75])
  return {
    mech: 'paint', title: 'Shade the percent', badge: `${pct}%`, tone: 'a', answer: pct, start: 0,
    prompt: `Shade ${pct}% on the grid.`,
    say: `Shade ${pct} percent on the grid — that many of the hundred squares.`,
    work: [`${pct} percent means ${pct} out of 100.`, `Shade ${pct} squares — that is ${reduce(pct, 100)}, or ${tidy(pct / 100)} as a decimal.`],
  }
}
// ── discount → sale price ─────────────────────────────────────────────────────
function slideSale(): Task {
  const pct = pick([10, 20, 25, 50]); const price = pick([40, 60, 80, 120, 200]); const ans = tidy(price * (1 - pct / 100)); const item = pick(ITEMS)
  return {
    mech: 'slide', title: item, badge: `${money(price)} · ${pct}% off`, tone: 'a', answer: ans, min: 0, max: price, step: 1, start: price,
    prompt: `${item} is ${pct}% off ${money(price)}. Slide the price down to the sale price.`,
    say: `This ${item.toLowerCase()} is ${pct} percent off ${money(price)}. Slide the price down to the sale price.`,
    work: [`${pct} percent of ${price} is ${tidy((pct / 100) * price)}.`, `Take it off: ${price} minus ${tidy((pct / 100) * price)} is ${ans}. Slide to there.`],
  }
}
// ── discount → how much is saved ──────────────────────────────────────────────
function slideSaving(): Task {
  const pct = pick([10, 20, 25, 50]); const price = pick([40, 60, 80, 120]); const save = tidy((pct / 100) * price); const item = pick(ITEMS)
  return {
    mech: 'slide', title: 'How much saved?', badge: `${money(price)} · ${pct}% off`, tone: 'a', answer: save, min: 0, max: price, step: 1, start: 0,
    prompt: `${item} is ${pct}% off ${money(price)}. Slide to how much the customer SAVES.`,
    say: `This ${item.toLowerCase()} is ${pct} percent off ${money(price)}. Slide to how much they save.`,
    work: [`${pct} percent of ${price} is ${save}.`, `That is the saving — slide up to ${money(save)}.`],
  }
}
// ── add sales tax → new price ─────────────────────────────────────────────────
function slideTax(): Task {
  const pct = pick([10, 20, 25, 50]); const price = pick([40, 60, 80, 120]); const ans = tidy(price * (1 + pct / 100))
  const item = pick(['Console', 'Bike', 'Headphones', 'Sneakers'])
  return {
    mech: 'slide', title: item, badge: `${money(price)} · +${pct}% tax`, tone: 'b', answer: ans, min: 0, max: tidy(price * 1.6), step: 1, start: price,
    prompt: `${item} is ${money(price)} plus ${pct}% tax. Slide up to the price with tax.`,
    say: `This ${item.toLowerCase()} is ${money(price)} plus ${pct} percent tax. Slide up to the total with tax.`,
    work: [`${pct} percent of ${price} is ${tidy((pct / 100) * price)}.`, `Add it on: ${price} plus ${tidy((pct / 100) * price)} is ${ans}. Slide to there.`],
  }
}
// ── tip on a bill ─────────────────────────────────────────────────────────────
function slideTip(): Task {
  const pct = pick([10, 15, 20, 25]); const price = pick([20, 40, 60, 80]); const tip = tidy((pct / 100) * price)
  return {
    mech: 'slide', title: 'Tip', badge: `${money(price)} bill · ${pct}% tip`, tone: 'b', answer: tip, min: 0, max: price, step: 1, start: 0,
    prompt: `The bill is ${money(price)} and the tip is ${pct}%. Slide to the tip.`,
    say: `The bill is ${price} dollars and you tip ${pct} percent. Slide to the tip.`,
    work: [`${pct} percent of ${price} is ${tip}.`, `That is the tip — slide to ${money(tip)}.`],
  }
}
// ── work back to the original price before a markup ───────────────────────────
function slideReverse(): Task {
  const pct = pick([20, 25, 50]); const orig = pick([40, 60, 80, 120]); const after = tidy(orig * (1 + pct / 100))
  return {
    mech: 'slide', title: 'Original price?', badge: `now ${money(after)} · +${pct}% added`, tone: 'b', answer: orig, min: 0, max: after, step: 1, start: after,
    prompt: `The tag says ${money(after)} after a ${pct}% rise. Slide down to the ORIGINAL price.`,
    say: `This tag says ${after} dollars after a ${pct} percent rise. Slide down to the original price.`,
    work: [`A ${pct} percent rise multiplies the original by ${tidy(1 + pct / 100)}.`, `So ${after} divided by ${tidy(1 + pct / 100)} is ${orig}. Slide to there.`],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  const pool: (() => Task)[] =
    d === 1 ? [paintTask, paintTask, slideSale]
    : d === 2 ? [slideSale, slideSaving, paintTask]
    : [slideTax, slideTip, slideReverse]
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
// ── walkthrough example 2: 25% OFF $80 on the price slider ────────────────────
const DEMO_SLIDE: Task = { mech: 'slide', title: 'Hoodie', badge: '$80 · 25% off', tone: 'a', answer: 60, min: 0, max: 80, step: 1, start: 80, prompt: '', say: '', work: [] }
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
  mech: 'slide', title: 'Cap', badge: '$10 · 50% off', tone: 'a', answer: 5, min: 0, max: 10, step: 1, start: 10,
  prompt: 'Half off $10 — slide the price down to the sale price, then ring it up.',
  say: 'This cap is fifty percent off ten dollars. Fifty percent is half. Slide the price down to half, then ring it up.',
  work: ['Fifty percent is one half.', 'Half of 10 is 5. Slide to there.'],
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
      <img src={`${ART}/shop_checkout_bg.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
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

const CONFIG: GameConfig<number, Task> = {
  chapterId: 'percentages',
  title: 'STORE CHECKOUT',
  ticketLabel: 'receipt',
  motif: '🛒',
  palette: P,
  makeTask,
  initialValue: (t) => t.start,
  grade: (t, v) => t.mech === 'paint' ? v === t.answer : Math.abs(v - t.answer) < 1e-6,
  revealText: (t) => t.mech === 'paint' ? `${t.answer}%` : money(t.answer),
  glide: (t, from, setValue, later) => t.mech === 'paint' ? later(() => setValue(t.answer), 600) : glideNumber(from, t.answer, setValue, later),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) => (
    task.mech === 'paint'
      ? <PaintGrid P={palette} value={value} setValue={setValue} disabled={disabled} reveal={reveal} onCommit={onCommit} commitLabel="SHADE IT ✓" />
      : <SlideValue P={palette} value={value} setValue={setValue} min={task.min!} max={task.max!} step={task.step!} disabled={disabled} reveal={reveal} onCommit={onCommit} commitLabel="RING IT UP ✓" />
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
