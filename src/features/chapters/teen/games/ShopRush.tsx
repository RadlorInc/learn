'use client'
/**
 * ShopRush — "Sale Day": the Percentages chapter as a PLAYABLE GAME (no slides,
 * no multiple-choice, no coin economy). One continuous night-market stall scene;
 * the kid runs Milo's counter.
 *
 * UI CONCEPT: NIGHT MARKET — painted stall backdrop, cream paper order tickets,
 * warm indie-game palette (its own colours, not the Field Lab paper theme).
 *
 * Every order is a PHYSICAL interaction — the action IS the math:
 *   • PAINT — drag across a 100-grid to shade a percent (reads back live as %,
 *             fraction and decimal — conversions by doing).
 *   • SLIDE — drag the price dial to the sale/marked-up/original price, or to a
 *             saving / tip amount.
 *
 * Teaching is "I do → we do → you do" (this chapter predates the shared GameShell,
 * so it carries its own bespoke walkthrough rather than the config.tutorial engine —
 * but the shape matches the other 11 chapters):
 *   • I DO  — a narrated, step-by-step WALKTHROUGH: Milo prices one order, the dial
 *     slides in slow narrated steps (speakSteps-synced, slow rate + a pause between
 *     steps), an animated hand shows the gesture, and the kid can "↺ Watch again".
 *   • WE DO — one live, coached, NON-scored order (guided), then into real play.
 *   • YOU DO — the scored practice loop.
 *
 * Adaptive FOUNDATION (identical to every Milo chapter — uses the shared
 * useAdaptive engine, unchanged):
 *   • difficulty tiers L1 easy → L2 medium → L3 hard (invisible to the kid)
 *   • promote on a streak, DEMOTE when answers go wrong
 *   • RE-EXPLANATION after 3 wrong answers IN A ROW (Milo works it in-scene)
 *   • mastery early-exit (top tier + a clean streak → finish early, full stars)
 * Math-without-fear: no timer, no red X — a wrong answer is gently shown, then on.
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { useAdaptive } from '@/core/adaptive'
import { speak, speakAfterCurrent, speakSeq, speakSteps, unlockSpeech, stopSpeech } from '@/infra/useMiloSpeaker'
import { getActiveLearner } from '@/data/supabase/useLearnerSession'
import { getChapterLevel, setChapterLevel } from '@/infra/storage/chapterLevel'
import type { AgeBand } from '@/features/chapters/teen/types'
import MiloMark from '@/features/chapters/teen/MiloMark'
import { HandCue, Blackboard, type HandKind, type Palette } from './parts/gameKit'

const BAND: AgeBand = '12-14'
const TOTAL = 8
const RETEACH_AFTER = 3 // wrong answers in a row → Milo re-explains
const WARMUP_COUNT = 2  // opt-in warm-up orders prepended when resuming above easy

// ── night-market palette (self-contained; not the Field Lab theme) ──────────
const P: Palette = {
  nightTop: '#1a1236', nightBot: '#2c1b4e',
  cream: '#fff4dd', creamSoft: 'rgba(255,244,221,0.82)',
  inkOnPaper: '#3b2a1d', mutedOnPaper: '#9b8975',
  gold: '#f7bc4a', goldDeep: '#e09f22',
  coral: '#ff6b52', coralDeep: '#e14e37', mint: '#59c99a',
  glass: 'rgba(24,15,46,0.62)', glassBorder: 'rgba(255,244,221,0.22)',
}

const tidy = (n: number) => Math.round(n * 100) / 100
const money = (n: number) => `$${tidy(n).toFixed(tidy(n) % 1 === 0 ? 0 : 2)}`
const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
function reduce(n: number, d: number): string { const g = gcd(n, d) || 1; return `${n / g}/${d / g}` }

// ── task model ──────────────────────────────────────────────────────────────
type Mech = 'paint' | 'slide'
interface Task {
  mech: Mech
  title: string
  badge: string
  tone: 'sale' | 'tip'
  prompt: string
  say: string
  answer: number
  hint: string
  work: string[]          // narrated re-explanation (3-in-a-row reteach)
  targetPct?: number      // paint
  price?: number; max?: number; step?: number   // slide
}

function makeTask(d: 1 | 2 | 3): Task {
  const pool: (() => Task)[] =
    d === 1 ? [paintTask, paintTask, slideSale]
    : d === 2 ? [slideSale, slideSaving, paintTask]
    : [slideUp, slideTip, slideReverse]
  return pick(pool)()
}

const ITEMS = ['Hoodie', 'Sneakers', 'Backpack', 'Game', 'Jacket', 'Cap', 'Bottle']

function paintTask(): Task {
  const pct = pick([10, 20, 25, 40, 50, 60, 75])
  return {
    mech: 'paint', title: 'Price sticker', badge: `${pct}%`, tone: 'sale',
    prompt: `Paint ${pct}% on the grid.`,
    say: `Paint ${pct} percent on the grid so we can read it.`,
    answer: pct, targetPct: pct,
    hint: `Each square is 1%. Fill ${pct} of the 100 squares.`,
    work: [`${pct} percent means ${pct} out of 100.`, `Fill ${pct} squares — that is the fraction ${reduce(pct, 100)}, or ${tidy(pct / 100)} as a decimal.`],
  }
}

function slideSale(): Task {
  const pct = pick([10, 20, 25, 50])
  const price = pick([40, 60, 80, 120, 200])
  const ans = tidy(price * (1 - pct / 100))
  const item = pick(ITEMS)
  return {
    mech: 'slide', title: item, badge: `${pct}% OFF`, tone: 'sale',
    prompt: `Slide the price down to the sale price.`,
    say: `This ${item.toLowerCase()} is ${pct} percent off. Slide the price down to the sale price.`,
    answer: ans, price, max: price, step: 1,
    hint: `Take ${pct}% (that's ${money((pct / 100) * price)}) off ${money(price)}.`,
    work: [`${pct} percent of ${price} is ${tidy((pct / 100) * price)}.`, `Subtract it: ${price} minus ${tidy((pct / 100) * price)} is ${ans}. Slide to there.`],
  }
}

function slideSaving(): Task {
  const pct = pick([10, 20, 25, 50])
  const price = pick([40, 60, 80, 120])
  const save = tidy((pct / 100) * price)
  const item = pick(ITEMS)
  return {
    mech: 'slide', title: item, badge: `${pct}% OFF`, tone: 'sale',
    prompt: `Slide to how much the customer SAVES.`,
    say: `This ${item.toLowerCase()} is ${pct} percent off ${price} dollars. Slide to how much they save.`,
    answer: save, price, max: price, step: 1,
    hint: `The saving is ${pct}% of ${money(price)}.`,
    work: [`${pct} percent of ${price} is ${save}.`, `That is the saving — slide to ${money(save)}.`],
  }
}

function slideUp(): Task {
  const pct = pick([10, 20, 25, 50])
  const price = pick([40, 60, 80, 120])
  const ans = tidy(price * (1 + pct / 100))
  const item = pick(['Concert ticket', 'Sneakers', 'Console', 'Bike'])
  return {
    mech: 'slide', title: item, badge: `${pct}% UP`, tone: 'tip',
    prompt: `Prices went up — slide to the new price.`,
    say: `The price of this ${item.toLowerCase()} went up ${pct} percent. Slide up to the new price.`,
    answer: ans, price, max: tidy(price * 1.6), step: 1,
    hint: `Add ${pct}% (that's ${money((pct / 100) * price)}) onto ${money(price)}.`,
    work: [`${pct} percent of ${price} is ${tidy((pct / 100) * price)}.`, `Add it on: ${price} plus ${tidy((pct / 100) * price)} is ${ans}. Slide to there.`],
  }
}

function slideTip(): Task {
  const pct = pick([10, 15, 20, 25])
  const price = pick([20, 40, 60, 80])
  const tip = tidy((pct / 100) * price)
  return {
    mech: 'slide', title: 'Dinner bill', badge: `${pct}% TIP`, tone: 'tip',
    prompt: `Slide to the tip you leave.`,
    say: `The bill is ${price} dollars and you tip ${pct} percent. Slide to the tip.`,
    answer: tip, price, max: price, step: 1,
    hint: `The tip is ${pct}% of ${money(price)}.`,
    work: [`${pct} percent of ${price} is ${tip}.`, `That is the tip — slide to ${money(tip)}.`],
  }
}

function slideReverse(): Task {
  const pct = pick([20, 25, 50])
  const orig = pick([40, 60, 80, 120])
  const after = tidy(orig * (1 + pct / 100))
  return {
    mech: 'slide', title: 'Marked-up tag', badge: `was +${pct}%`, tone: 'tip',
    prompt: `It now says ${money(after)} after a ${pct}% rise. Slide to the ORIGINAL price.`,
    say: `This tag says ${after} dollars after a ${pct} percent rise. Slide to the original price.`,
    answer: orig, price: after, max: after, step: 1,
    hint: `The new price is ${tidy(1 + pct / 100)} times the original. Divide back.`,
    work: [`A ${pct} percent rise multiplies the original by ${tidy(1 + pct / 100)}.`, `So ${after} divided by ${tidy(1 + pct / 100)} is ${orig}. Slide to there.`],
  }
}

// ── "I do" walkthrough — price a $80 hoodie at 25% off, dial sliding 80 → 60 ──
const TUT = { title: 'Hoodie', price: 80, badge: '25% OFF', answer: 60 }
const TUTORIAL_STEPS: { say: string; dial: number; hand: HandKind; board?: string }[] = [
  { say: 'Sale day at the night market! This dial is the price — drag it to slide the price up or down.', dial: 80, hand: 'drag' },
  { say: 'First order: a hoodie, eighty dollars, twenty-five percent off.', dial: 80, hand: 'drag', board: '$80,  25% off' },
  { say: 'Twenty-five percent means twenty-five out of every hundred — a quarter. A quarter of eighty is twenty.', dial: 80, hand: 'drag', board: '25% of $80 = $20' },
  { say: 'So I take twenty dollars off. Watch the price slide down — seventy…', dial: 70, hand: 'drag', board: '$80 − $20' },
  { say: '…and on down to sixty dollars. Eighty take away twenty is sixty.', dial: 60, hand: 'drag', board: '= $60' },
  { say: "Sixty dollars — that's the sale price. Press sell when it's right. Now let's try one together.", dial: 60, hand: 'tap' },
]

// ── "we do" guided order — 50% off $10 → $5, live but NOT scored ──
const GUIDED: Task = {
  mech: 'slide', title: 'Cap', badge: '50% OFF', tone: 'sale',
  prompt: 'Half off $10 — slide the price down to the sale price, then press Sell.',
  say: 'This cap is fifty percent off ten dollars. Fifty percent is half. Slide the price down to half, then press sell.',
  answer: 5, price: 10, max: 10, step: 1,
  hint: 'Half of $10 is $5.',
  work: ['Fifty percent is one half.', 'Half of 10 is 5. Slide to there.'],
}

const revealText = (t: Task) => (t.mech === 'paint' ? `${t.answer}%` : money(t.answer))

type Sub = 'active' | 'reveal' | 'reteach' | 'sold'
type Stage = 'start' | 'tutorial' | 'guided' | 'shop'

export default function ShopRush({
  childName, onFinish, onExit,
}: {
  childName: string
  onFinish: (correct: number, wrong: number, mastered?: boolean) => void
  onExit: () => void
}) {
  // Resume at the difficulty this child last left off on (logged-out preview → easy).
  const [learnerId] = useState<string | null>(() => getActiveLearner()?.id ?? null)
  const [startDiff] = useState<1 | 2 | 3>(() => getChapterLevel(learnerId, 'percentages'))
  const ada = useAdaptive('percentages', startDiff)
  // Opt-in warm-up when resuming above easy (a few gentler orders first).
  const [warmup, setWarmup] = useState(false)
  const warmupDiff = (Math.max(1, startDiff - 1)) as 1 | 2 | 3
  const effTotal = warmup ? TOTAL + WARMUP_COUNT : TOTAL
  const canWarmUp = startDiff > 1
  const [stage, setStage] = useState<Stage>('start')
  const [idx, setIdx] = useState(0)
  const [task, setTask] = useState<Task | null>(null)
  const [sub, setSub] = useState<Sub>('active')
  const [wrongRun, setWrongRun] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)

  const [dial, setDial] = useState(0)
  const [paint, setPaint] = useState(0)

  const timers = useRef<number[]>([])
  const later = useCallback((fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)) }, [])
  useEffect(() => () => { timers.current.forEach(clearTimeout); stopSpeech() }, [])

  const loadTask = useCallback((nextIdx: number, c: number, w: number, mastered: boolean) => {
    if (mastered) { onFinish(c, w, true); return }
    if (nextIdx >= effTotal) { onFinish(c, w); return }
    // Warm-up: first WARMUP_COUNT orders run one tier below the resumed level.
    const d = warmup && nextIdx < WARMUP_COUNT ? warmupDiff : ada.difficulty
    const t = makeTask(d)
    setTask(t); setSub('active')
    if (t.mech === 'slide') setDial(Math.round((t.max ?? 100) * 0.5))
    if (t.mech === 'paint') setPaint(0)
    setIdx(nextIdx)
    speakAfterCurrent(t.say)
  }, [ada.difficulty, onFinish, effTotal, warmup, warmupDiff])

  const demoDone = useRef(false)
  const finishDemo = useCallback(() => {
    if (demoDone.current) return
    demoDone.current = true
    setStage('shop')
    speak(`Your turn, ${childName}. The stall is yours!`)
    loadTask(0, 0, 0, false)
  }, [childName, loadTask])

  // "we do" — one live, coached, NON-scored order before real play.
  const enterGuided = useCallback(() => {
    setStage('guided'); setTask(GUIDED); setSub('active'); setDial(GUIDED.price ?? 10)
    speakAfterCurrent(`Your turn — I will help. ${GUIDED.say}`)
  }, [])

  // glide the instrument to the correct value (used on a wrong answer)
  function glideTo(t: Task) {
    const steps = 16
    if (t.mech === 'slide') { const from = dial; for (let i = 1; i <= steps; i++) later(() => setDial(tidy(from + ((t.answer - from) * i) / steps)), 480 + i * 90) }
    else { const from = paint; for (let i = 1; i <= steps; i++) later(() => setPaint(Math.round(from + ((t.answer - from) * i) / steps)), 480 + i * 80) }
  }

  // ── one deliberate submit per order (SELL / PRICE IT) ──
  function submit(value: number) {
    if (!task || sub !== 'active') return
    const ok = Math.abs(value - task.answer) < 1e-6
    const res = ada.record(ok)
    // Remember the tier the child is on, so the next replay resumes here.
    setChapterLevel(learnerId, 'percentages', res.difficulty)

    if (ok) {
      const c = correct + 1
      setCorrect(c); setSub('sold'); setWrongRun(0)
      speak(`Sold! ${ada.praise}`)
      later(() => loadTask(idx + 1, c, wrong, res.mastered), 1700)
      return
    }

    // wrong: count it, gently show the right answer on the instrument
    const w = wrong + 1
    const run = wrongRun + 1
    setWrong(w); setWrongRun(run); setSub('reveal')
    speak(`It was ${revealText(task)}. ${ada.encouragement}`)
    glideTo(task)

    if (run >= RETEACH_AFTER) {
      // 3 wrong in a row → Milo re-explains this concept in-scene, then on
      later(() => { setSub('reteach'); speakSeq(task.work, {}) }, 1800)
      later(() => { setWrongRun(0); loadTask(idx + 1, correct, w, false) }, 6200)
    } else {
      later(() => loadTask(idx + 1, correct, w, false), 2200)
    }
  }

  // guided submit — encouraging either way, NOT scored, then into real play.
  function submitGuided(value: number) {
    if (!task || sub !== 'active') return
    const ok = Math.abs(value - task.answer) < 1e-6
    if (ok) {
      setSub('sold')
      speak(`You did it, ${childName}! Now let's play.`)
      later(finishDemo, 1700)
    } else {
      setSub('reveal')
      speak(`Almost — here's the sale price. Now let's play it for real.`)
      glideTo(task)
      later(finishDemo, 2800)
    }
  }

  const busy = sub !== 'active'
  const inOrder = stage === 'shop' || stage === 'guided'
  const commit = (v: number) => (stage === 'guided' ? submitGuided(v) : submit(v))

  return (
    <div className="milo-lesson shop-rush" style={{ position: 'relative', minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', background: `linear-gradient(${P.nightTop}, ${P.nightBot})`, color: P.cream, fontFamily: 'var(--font-body)', overflow: 'hidden' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/teen/shop_night.png" alt="" aria-hidden loading="lazy" decoding="async"
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', opacity: 0.9 }} />
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(rgba(24,15,46,0.30) 0%, rgba(24,15,46,0.55) 42%, rgba(24,15,46,0.88) 78%, ${P.nightTop} 100%)` }} />

      {/* header */}
      <header style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 640, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px 4px', boxSizing: 'border-box' }}>
        <button type="button" onClick={() => { stopSpeech(); onExit() }} style={chip}>‹ Menu</button>
        <span style={{ fontWeight: 900, fontSize: 'clamp(16px, 1.7vw, 26px)', letterSpacing: '0.06em', color: P.gold, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>MILO&apos;S SALE DAY</span>
        <span style={{ flex: 1 }} />
        {stage === 'shop' && <span style={{ fontFamily: 'var(--font-numeric)', fontSize: 12, color: P.creamSoft }}>order {Math.min(idx + 1, effTotal)} / {effTotal}</span>}
      </header>

      {stage === 'shop' && (
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 5, marginTop: 6 }}>
          {Array.from({ length: effTotal }, (_, i) => (
            <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: i < idx ? P.gold : i === idx ? P.cream : 'rgba(255,244,221,0.28)', transition: 'background 300ms' }} />
          ))}
        </div>
      )}

      <main style={{ position: 'relative', zIndex: 1, flex: 1, width: '100%', maxWidth: 'clamp(560px, 66vw, 820px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'clamp(10px, 1vw, 16px)', padding: '8px 18px 24px', boxSizing: 'border-box' }}>

        {stage === 'start' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, textAlign: 'center' }}>
            <div className="sr-ticket" style={ticket}>
              <TicketHead n={1} />
              <Row title="Hoodie" price="$80" badge="25% OFF" />
            </div>
            <p style={{ margin: 0, maxWidth: 'clamp(380px, 48vw, 600px)', fontSize: 'clamp(15px, 1.5vw, 22px)', lineHeight: 1.55, color: P.creamSoft, textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>
              <strong style={{ color: P.cream }}>It&apos;s sale night and you run the stall.</strong> Paint the percents, slide the prices — every order&apos;s a puzzle.
            </p>
            {canWarmUp ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' }}>
                <p style={{ margin: 0, maxWidth: 'clamp(360px, 46vw, 560px)', fontSize: 'clamp(14px, 1.4vw, 20px)', fontWeight: 700, color: P.cream, textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>
                  You left off at <span style={{ color: P.gold }}>{ada.difficultyLabel}</span>. Want a quick warm-up first?
                </p>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button type="button" onClick={() => { unlockSpeech(); setWarmup(true); setStage('tutorial') }} style={chip}>☀️ Warm up first</button>
                  <button type="button" onClick={() => { unlockSpeech(); setWarmup(false); setStage('tutorial') }} style={bigBtn}>Continue →</button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => { unlockSpeech(); setStage('tutorial') }} style={bigBtn}>Open the stall →</button>
            )}
          </div>
        )}

        {stage === 'tutorial' && <TutorialWalk onDone={enterGuided} />}

        {inOrder && task && (
          <>
            {stage === 'guided' && (
              <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', color: P.gold, textTransform: 'uppercase' }}>Try this one with me</div>
            )}
            <Says text={sub === 'reveal' ? (stage === 'guided' ? "Here's the sale price." : `It was ${revealText(task)}.`) : sub === 'reteach' ? task.work[0] : sub === 'sold' ? 'Sold! ✓' : task.prompt} />

            <div key={stage === 'guided' ? 'g' : idx} className="sr-ticket" style={ticket}>
              <TicketHead n={stage === 'guided' ? 1 : idx + 2} />
              <Row title={task.title} badge={task.badge} tone={task.tone} price={task.price != null ? money(task.price) : undefined} struck={sub === 'sold'} />
              {sub === 'sold' && <Stamp />}
            </div>

            {task.mech === 'paint' && (
              <PaintPad count={paint} target={task.targetPct!} locked={busy} onChange={setPaint} onDone={() => commit(paint)} reveal={sub === 'reveal' || sub === 'reteach'} />
            )}

            {task.mech === 'slide' && (
              <>
                <PriceDial value={dial} max={task.max ?? 100} step={task.step ?? 1} disabled={busy} onChange={setDial} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <Nudge label="−" onClick={() => setDial((v) => Math.max(0, tidy(v - (task.step ?? 1))))} disabled={busy} />
                  <div style={{ minWidth: 120, textAlign: 'center', fontFamily: 'var(--font-numeric)', fontSize: 'clamp(34px, 3.6vw, 50px)', fontWeight: 800, color: sub === 'reveal' || sub === 'reteach' ? P.mint : P.gold, textShadow: `0 0 18px ${P.goldDeep}66` }}>{money(dial)}</div>
                  <Nudge label="+" onClick={() => setDial((v) => Math.min(task.max ?? 100, tidy(v + (task.step ?? 1))))} disabled={busy} />
                </div>
                <button type="button" onClick={() => commit(dial)} disabled={busy} style={{ ...bigBtn, opacity: busy ? 0.5 : 1 }}>SELL ✓</button>
              </>
            )}

            {stage === 'guided' && sub === 'active' && <HandCue P={P} kind="drag" />}
          </>
        )}
      </main>

      {/* Milo at his stall */}
      <div style={{ position: 'fixed', left: 14, bottom: 12, zIndex: 2, background: P.cream, borderRadius: '50%', padding: 5, boxShadow: '0 4px 16px rgba(0,0,0,0.45)' }}>
        <MiloMark band={BAND} mood={sub === 'sold' || sub === 'reteach' || stage === 'tutorial' ? 'speaking' : 'thinking'} size={40} />
      </div>

      <style>{`
        .sr-ticket { animation: srSlide 480ms cubic-bezier(.2,1.1,.3,1); }
        @keyframes srSlide { from { transform: translateX(70vw) rotate(3deg); opacity: 0 } to { transform: rotate(-0.6deg); opacity: 1 } }
        .sr-stamp { animation: srStamp 420ms cubic-bezier(.2,1.4,.3,1) both; }
        @keyframes srStamp { from { transform: rotate(-14deg) scale(2.4); opacity: 0 } to { transform: rotate(-8deg) scale(1); opacity: 1 } }
        .shop-rush input[type=range] { accent-color: ${P.gold}; }
        @media (prefers-reduced-motion: reduce) { .sr-ticket,.sr-stamp { animation: none } }
      `}</style>
    </div>
  )
}

// ── "I do" walkthrough player — narrated, slow, step-by-step, hand cue + replay ──
function TutorialWalk({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0)
  const [dial, setDial] = useState(TUT.price)
  const [ended, setEnded] = useState(false)
  const cancelRef = useRef<() => void>(() => {})

  const run = useCallback(() => {
    cancelRef.current()
    setEnded(false); setI(0); setDial(TUT.price)
    unlockSpeech()
    // Deliberately SLOW: slower voice, a ~1.1s pause after each spoken step so the
    // kid can watch the dial move, and a slow silent-mode fallback (matches GameShell).
    cancelRef.current = speakSteps(TUTORIAL_STEPS.map((s) => s.say), {
      rate: 0.8,
      gapMs: 1100,
      fallbackStepMs: 3200,
      onStep: (idx) => { setI(idx); const s = TUTORIAL_STEPS[idx]; if (s) setDial(s.dial) },
      onDone: () => setEnded(true),
    })
  }, [])

  useEffect(() => { run(); return () => cancelRef.current() }, [run])

  const hand = TUTORIAL_STEPS[i]?.hand ?? 'drag'

  // Chalkboard: the math written so far (steps 0..i), the current step's line writing in.
  const board: string[] = []
  let writingIndex = -1
  for (let k = 0; k <= i && k < TUTORIAL_STEPS.length; k++) {
    const b = TUTORIAL_STEPS[k]?.board
    if (b) { board.push(b); if (k === i) writingIndex = board.length - 1 }
  }

  return (
    <>
      <Says text={TUTORIAL_STEPS[i]?.say ?? ''} />
      <Blackboard P={P} lines={board} writingIndex={writingIndex} />
      <div className="sr-ticket" style={ticket}>
        <TicketHead n={1} />
        <Row title={TUT.title} price={money(TUT.price)} badge={TUT.badge} struck={ended} />
        {ended && <Stamp />}
      </div>
      <PriceDial value={dial} max={TUT.price} step={1} disabled />
      <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(32px, 3.4vw, 48px)', fontWeight: 800, color: P.gold, textShadow: `0 0 18px ${P.goldDeep}66` }}>{money(dial)}</div>
      {!ended && <HandCue P={P} kind={hand} />}
      {ended && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button type="button" onClick={run} style={chip}>↺ Watch again</button>
          <button type="button" onClick={onDone} style={bigBtn}>Let&apos;s try →</button>
        </div>
      )}
    </>
  )
}

// ── PAINT ─────────────────────────────────────────────────────────────────────
function PaintPad({ count, target, locked, onChange, onDone, reveal }: {
  count: number; target: number; locked?: boolean; onChange: (n: number) => void; onDone: () => void; reveal?: boolean
}) {
  const painting = useRef(false)
  const set = (i: number) => { if (!locked) onChange(i + 1) }
  const fill = reveal ? P.mint : P.gold
  const rim = reveal ? '#3fa77c' : P.goldDeep
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div
        onPointerUp={() => { painting.current = false }}
        onPointerLeave={() => { painting.current = false }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 2, width: 'min(78vw, 420px)', padding: 8, borderRadius: 12, background: P.glass, border: `1px solid ${P.glassBorder}`, touchAction: 'none', userSelect: 'none' }}
      >
        {Array.from({ length: 100 }, (_, i) => {
          const on = i < count
          return (
            <div key={i}
              onPointerDown={() => { if (locked) return; painting.current = true; set(i) }}
              onPointerEnter={() => { if (painting.current) set(i) }}
              style={{ aspectRatio: '1', borderRadius: 2, background: on ? fill : 'rgba(255,244,221,0.10)', border: `1px solid ${on ? rim : 'rgba(255,244,221,0.18)'}`, cursor: locked ? 'default' : 'pointer', transition: 'background 90ms' }} />
          )
        })}
      </div>
      <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(22px, 2.2vw, 31px)', fontWeight: 800, color: fill, textShadow: `0 0 16px ${rim}55` }}>
        {count}% = {reduce(count, 100)} = {tidy(count / 100)}
      </div>
      <div style={{ fontSize: 12, color: P.creamSoft }}>drag across the squares · target on the tag: {target}%</div>
      <button type="button" onClick={onDone} disabled={locked} style={{ ...bigBtn, opacity: locked ? 0.5 : 1 }}>PRICE IT ✓</button>
    </div>
  )
}

// ── shared bits ───────────────────────────────────────────────────────────────
// clamp(mobilePx, vw, maxPx): phones keep the floor; a laptop scales up to fill the wide screen.
const ticket: React.CSSProperties = { position: 'relative', width: '100%', maxWidth: 'clamp(320px, 44vw, 540px)', background: P.cream, borderRadius: 12, padding: 'clamp(10px, 1.2vw, 18px) clamp(16px, 2vw, 28px) clamp(14px, 1.5vw, 22px)', boxSizing: 'border-box', color: P.inkOnPaper, boxShadow: '0 10px 28px rgba(0,0,0,0.45)', transform: 'rotate(-0.6deg)' }
const chip: React.CSSProperties = { background: P.glass, border: `1px solid ${P.glassBorder}`, borderRadius: 8, color: P.creamSoft, fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 'clamp(13px, 1.2vw, 17px)', padding: '6px 12px', cursor: 'pointer' }
const bigBtn: React.CSSProperties = { padding: 'clamp(13px, 1.4vw, 19px) clamp(36px, 3.6vw, 56px)', borderRadius: 14, background: `linear-gradient(${P.coral}, ${P.coralDeep})`, border: 'none', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 900, fontSize: 'clamp(16px, 1.6vw, 24px)', letterSpacing: '0.05em', cursor: 'pointer', boxShadow: `0 6px 20px ${P.coralDeep}66` }

function TicketHead({ n }: { n: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px dashed ${P.mutedOnPaper}`, paddingBottom: 6, fontFamily: 'var(--font-numeric)', fontSize: 'clamp(11px, 1vw, 15px)', letterSpacing: '0.1em', textTransform: 'uppercase', color: P.mutedOnPaper }}>
      <span>order #{String(n).padStart(2, '0')}</span><span>milo&apos;s stall</span>
    </div>
  )
}
function Row({ title, price, badge, tone = 'sale', struck }: { title: string; price?: string; badge: string; tone?: 'sale' | 'tip'; struck?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 'clamp(10px, 1.2vw, 16px)', padding: '8px 0 2px', flexWrap: 'wrap' }}>
      <span style={{ fontWeight: 700, fontSize: 'clamp(16px, 1.6vw, 23px)' }}>{title}</span>
      {price && <span style={{ fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(26px, 2.6vw, 38px)', textDecoration: struck ? 'line-through' : 'none', color: struck ? P.mutedOnPaper : P.inkOnPaper }}>{price}</span>}
      <span style={{ fontSize: 'clamp(12px, 1.15vw, 17px)', fontWeight: 800, color: '#fff', background: tone === 'tip' ? '#7a6bb5' : P.coral, borderRadius: 16, padding: '4px 12px', whiteSpace: 'nowrap' }}>{badge}</span>
    </div>
  )
}
function Stamp() {
  return <div className="sr-stamp" style={{ position: 'absolute', right: 10, top: 6, border: `3px solid ${P.mint}`, borderRadius: 8, color: P.mint, fontWeight: 900, fontSize: 'clamp(15px, 1.3vw, 20px)', letterSpacing: '0.12em', padding: '2px 8px', background: 'rgba(255,244,221,0.85)' }}>SOLD ✓</div>
}
function Says({ text }: { text: string }) {
  return <div style={{ width: '100%', maxWidth: 'clamp(460px, 56vw, 680px)', background: P.glass, border: `1px solid ${P.glassBorder}`, borderRadius: 12, padding: 'clamp(9px, 1.1vw, 16px) clamp(14px, 1.6vw, 24px)', fontWeight: 600, fontSize: 'clamp(15px, 1.5vw, 22px)', lineHeight: 1.45, color: P.cream, minHeight: 40, boxSizing: 'border-box', textAlign: 'center', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>{text}</div>
}
function PriceDial({ value, max, step, disabled, onChange }: { value: number; max: number; step: number; disabled?: boolean; onChange?: (n: number) => void }) {
  return <input type="range" min={0} max={max} step={step} value={value} disabled={disabled} onChange={(e) => onChange?.(Number(e.target.value))} style={{ width: '100%', maxWidth: 'clamp(380px, 50vw, 600px)', height: 'clamp(34px, 3.4vw, 46px)', accentColor: P.gold, cursor: disabled ? 'default' : 'pointer' }} aria-label="price dial" />
}
function Nudge({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled} style={{ width: 'clamp(44px, 4.4vw, 60px)', height: 'clamp(44px, 4.4vw, 60px)', borderRadius: '50%', border: `1px solid ${P.glassBorder}`, background: P.glass, color: P.cream, fontFamily: 'var(--font-numeric)', fontWeight: 700, fontSize: 'clamp(22px, 2.2vw, 30px)', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1 }}>{label}</button>
}
