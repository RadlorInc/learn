'use client'
/**
 * WeatherStation — the Integers chapter as a PLAYABLE GAME.
 * World: a bank account. The kid logs the account BALANCE by PULLING a signed
 * meter (VThermo) up and down — deposits raise it, withdrawals lower it.
 * Negatives are felt as "overdraft / below zero", comparison as "which balance
 * is lower", absolute value as "how far from zero". No slides, no MCQ. Shared
 * adaptive engine underneath.
 *
 * Teaching is "I do → we do → you do": a step-by-step WALKTHROUGH (config.tutorial)
 * records a balance that drops past zero into overdraft, then a GUIDED order
 * (config.guided) lets the kid set a below-zero balance with Milo coaching (not
 * scored), then the scored loop.
 */
import { useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'motion/react'
import { Game, type BaseTask, type GameConfig } from './parts/GameShell'
import { Palette, VThermo, pick, signed, glideNumber } from './parts/gameKit'

const P: Palette = {
  nightTop: '#0d2a1e', nightBot: '#123d2c',
  cream: '#eafff2', creamSoft: 'rgba(234,255,242,0.82)',
  inkOnPaper: '#173026', mutedOnPaper: '#6f9080',
  gold: '#ffd873', goldDeep: '#e0a83a',
  coral: '#ff8a6b', coralDeep: '#e25b3f', mint: '#4fd6a0',
  glass: 'rgba(9,40,28,0.6)', glassBorder: 'rgba(234,255,242,0.22)',
}

// `start` = where the number-line marker BEGINS. A "move" question starts on the
// first number so the child can see the jump; the others start at 0.
// `choices` = the tap-answer options (correct + distractors) for the AnswerPad.
interface Task extends BaseTask { answer: number; start: number; choices?: number[] }
const MIN = -20, MAX = 20
// Visible-math formatter: a proper minus glyph, e.g. −5 (NOT signed()'s spoken
// "negative 5", which is only for the say/work lines Milo reads aloud).
const disp = (n: number) => (n < 0 ? `−${Math.abs(n)}` : `${n}`)
const shuffle = <T,>(a: T[]): T[] => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[r[i], r[j]] = [r[j], r[i]] } return r }
// Build 4 tap-choices: the answer + up to 3 plausible distractors (in range, distinct).
function numChoices(ans: number, ...extra: number[]): number[] {
  const out: number[] = [ans]
  for (const n of [...extra, -ans, ans + 1, ans - 1, ans + 2, ans - 2]) {
    if (n >= MIN && n <= MAX && !out.includes(n)) out.push(n)
    if (out.length >= 4) break
  }
  return shuffle(out)
}

// Compare two balances: which is lower / higher.
function colder(): Task {
  let a = pick([-8, -6, -5, -3, -2, 4, 6]); let b = pick([-9, -7, -4, -1, 3, 5])
  if (a === b) b = a - 1
  const low = Math.random() < 0.5
  const ans = low ? Math.min(a, b) : Math.max(a, b)
  const neg = ans < 0
  return {
    title: low ? 'Lower balance' : 'Higher balance', badge: `${disp(a)}  or  ${disp(b)}`, tone: neg ? 'b' : 'a', showEquals: false,
    prompt: `Which balance is ${low ? 'lower' : 'higher'} — ${a} or ${b}?`,
    say: `Which balance is ${low ? 'lower' : 'higher'}, ${signed(a)} or ${signed(b)} dollars?`,
    context: `Two accounts. Which balance is ${low ? 'lower' : 'higher'}?`,
    padInstruction: `Tap the ${low ? 'lower' : 'higher'} balance.`,
    answer: ans, start: 0, choices: shuffle([a, b]),
    work: [`${low ? 'A lower balance sits further down the meter. Below zero is lower than above zero.' : 'A higher balance sits further up the meter.'}`, `${signed(ans)} is ${low ? 'below' : 'above'} ${signed(low ? Math.max(a, b) : Math.min(a, b))}, so it is ${low ? 'lower' : 'higher'}.`],
  }
}
// A transaction: start at balance s, then deposit/withdraw d.
function afterChange(): Task {
  const s = pick([-4, -2, 1, 3, 4, 6]); const d = pick([-9, -7, -5, 5, 7])
  const ans = s + d, out = d < 0
  const dir = out ? `withdraw ${Math.abs(d)}` : `deposit ${d}`
  return {
    title: 'Transaction', badge: `${disp(s)} ${out ? '−' : '+'} ${Math.abs(d)}`, tone: out ? 'b' : 'a',
    prompt: `Balance is ${s}. You ${dir}. What's the new balance?`,
    say: `The balance was ${signed(s)} dollars, then you ${dir}. What is the new balance?`,
    context: `Balance ${disp(s)}, then you ${dir}:`,
    padInstruction: 'Work out the new balance, then tap it.',
    answer: ans, start: s, choices: numChoices(ans, s - d),
    work: [`Start at ${signed(s)}, then ${out ? 'go DOWN' : 'go UP'} ${Math.abs(d)} (${dir}).`, `${signed(s)} ${out ? 'minus' : 'plus'} ${Math.abs(d)} is ${signed(ans)}.`],
  }
}
// Opposite (additive inverse): flip to the other side of 0.
function opposite(): Task {
  const t = pick([-8, -6, -5, 4, 5, 7, 8]); const ans = -t
  return {
    title: 'Opposite', badge: `opposite of ${disp(t)}`, tone: 'a',
    prompt: `What is the opposite of ${t}?`,
    say: `What is the opposite of ${signed(t)} dollars?`,
    context: `The opposite is the same distance from 0, on the other side:`,
    padInstruction: 'Tap the opposite.',
    answer: ans, start: 0, choices: numChoices(ans, t),
    work: [`The opposite of a number is the same distance from 0, on the other side.`, `The opposite of ${signed(t)} is ${signed(ans)}.`],
  }
}
// Distance from 0 (absolute value), without the |x| notation.
function distance(): Task {
  const t = pick([-9, -8, -7, -6, 6, 7, 8]); const ans = Math.abs(t)
  return {
    title: 'Distance from 0', badge: `${disp(t)}`, tone: 'a', showEquals: false,
    prompt: `How far is ${t} from 0?`,
    say: `How far is ${signed(t)} from zero?`,
    context: `How far is this balance from 0? Distance is always a positive number of steps.`,
    padInstruction: 'Tap how many steps.',
    answer: ans, start: 0, choices: numChoices(ans, t),
    work: [`Distance from 0 ignores the sign — just count the steps.`, `${signed(t)} is ${ans} steps from 0, so the answer is ${ans}.`],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  const pool: (() => Task)[] =
    d === 1 ? [colder, afterChange, opposite]
    : d === 2 ? [afterChange, opposite, distance]
    : [distance, opposite, afterChange, colder]
  return pick(pool)()
}

// ── the worked example for the walkthrough (4 withdraw 7 → −3) and the guided order ──
const DEMO_TASK: Task = { title: 'Transaction', badge: '4 − 7', tone: 'b', answer: -3, start: 4, prompt: '', say: '', work: [] }
const GUIDED_TASK: Task = {
  title: 'Transaction', badge: '−1 − 4', tone: 'b',
  prompt: 'Balance is −1. Withdraw 4. What\'s the new balance?',
  say: 'The balance was minus one, then you withdraw four. What is the new balance?',
  context: 'Balance −1, then you withdraw 4:',
  padInstruction: 'Work out the new balance, then tap it.',
  answer: -5, start: -1, choices: shuffle([-5, 3, -3, 5]),
  work: ['Start at −1, then go DOWN 4 (withdraw 4).', '−1 − 4 is −5.'],
}

// ── Animated walkthrough scene — the storyboard, in motion (ILLUSTRATED) ──────
// A balance meter dressed in generated illustrations (Nano Banana 2): a bank-vault
// backdrop, a GOLD COIN STACK that fills up while in credit, a RED "IOU" STACK that
// fills down into overdraft, a coin-token marker, and a hand that withdraws. The
// precise skeleton — dollar marks, gold zero line, $ readout, overdraft bracket —
// stays code-drawn so the math + motion are exact. The illustrated fills are the
// full credit/debt zones revealed by an animated clip-path up/down to the balance.
// Driven by the walkthrough's per-step `value`.
const TOP_BAL = 5, BOT_BAL = -5
const BAL_MARKS = [5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5]
const balPct = (n: number) => ((TOP_BAL - n) / (TOP_BAL - BOT_BAL)) * 100
const ART = '/assets/teen/objects'

function BankAccountScene({ palette: P, value, stepIndex, frameCount, ended }: {
  palette: Palette; value: number; stepIndex: number; frameCount: number; ended: boolean
}) {
  const v = Math.max(BOT_BAL, Math.min(TOP_BAL, value))
  const zeroPct = balPct(0)
  const resultPhase = ended || stepIndex >= frameCount - 2   // last 2 beats: the answer
  const intro = stepIndex <= 1
  const overdrawn = v < 0
  const atZero = v === 0 && stepIndex > 1
  const withdrawing = stepIndex >= 3 && !resultPhase && v < 4
  const taken = 4 - v                                        // dollars withdrawn so far (0..7)
  const readColor = v < 0 ? P.coral : v === 0 ? P.gold : P.mint

  // ── Framer Motion: the balance rides on a spring (continuous 60fps, not a
  //    per-step CSS jump). The coin token, $ readout, credit/debt fills, hand and
  //    overdraft bracket all glide off ONE motion value. Overdamped so it never
  //    overshoots into a wrong balance. Reduced-motion → snaps to the final value. ──
  const reduce = useReducedMotion()
  const bv = useMotionValue(v)
  useEffect(() => {
    const controls = animate(bv, v, reduce ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 24, mass: 0.9 })
    return () => controls.stop()
  }, [v, reduce, bv])
  const markerTop = useTransform(bv, (n) => `${balPct(n)}%`)
  const creditClip = useTransform(bv, (n) => `inset(${((TOP_BAL - Math.max(0, n)) / TOP_BAL) * 100}% 0 0 0)`)
  const debtClip = useTransform(bv, (n) => `inset(0 0 ${((TOP_BAL - Math.max(0, -n)) / TOP_BAL) * 100}% 0)`)
  const brHeight = useTransform(bv, (n) => `${balPct(n) - zeroPct}%`)
  const brMidTop = useTransform(bv, (n) => `${(zeroPct + balPct(n)) / 2}%`)
  const readText = useTransform(bv, (n) => {
    const r = Math.round(Math.max(BOT_BAL, Math.min(TOP_BAL, n)))
    return r < 0 ? `-$${-r}` : `$${r}`
  })

  return (
    <div style={{ position: 'relative', width: 'clamp(232px, 42vw, 344px)', height: 'clamp(300px, 46vh, 440px)', borderRadius: 16, overflow: 'hidden', border: `1.5px solid ${P.glassBorder}`, boxShadow: '0 12px 34px rgba(0,0,0,0.42)', background: '#0d2a1e' }}>
      <style>{'@keyframes baZeroFlash{0%,100%{opacity:.55}50%{opacity:1}}@keyframes baBob{0%,100%{transform:translateY(-1px)}50%{transform:translateY(4px)}}@keyframes baPop{0%{opacity:0;transform:translateX(-50%) scale(.7)}100%{opacity:1;transform:translateX(-50%) scale(1)}}'}</style>

      {/* illustrated bank-vault backdrop + a soft scrim so the meter reads clearly */}
      <img src={`${ART}/bank_scene_bg.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(rgba(9,30,22,0.28), rgba(9,30,22,0.58))' }} />

      {/* the balance column — coordinate space for everything below */}
      <div style={{ position: 'absolute', top: '7%', bottom: '7%', left: '31%', width: '38%', borderRadius: 9, background: 'rgba(6,26,18,0.42)', border: `1px solid ${P.glassBorder}` }}>
        {/* overdraft zone tint (below zero) */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: `${zeroPct}%`, bottom: 0, background: overdrawn ? 'rgba(0,0,0,0.40)' : 'rgba(0,0,0,0.20)', transition: 'background 500ms' }} />
        {overdrawn && <div style={{ position: 'absolute', left: 0, right: 0, top: `${zeroPct}%`, bottom: 0, background: P.coral, opacity: 0.10 }} />}

        {/* CREDIT fill — a gold coin stack, revealed from the zero line UP to the balance */}
        <motion.div style={{ position: 'absolute', left: '9%', right: '9%', top: `${balPct(TOP_BAL)}%`, height: `${zeroPct - balPct(TOP_BAL)}%`, overflow: 'hidden', clipPath: creditClip }}>
          <img src={`${ART}/bank_coin_column.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'bottom', filter: resultPhase ? `drop-shadow(0 0 8px ${P.mint})` : undefined }} />
        </motion.div>

        {/* DEBT fill — a red IOU stack, revealed from the zero line DOWN to the balance */}
        <motion.div style={{ position: 'absolute', left: '9%', right: '9%', top: `${zeroPct}%`, height: `${balPct(BOT_BAL) - zeroPct}%`, overflow: 'hidden', clipPath: debtClip }}>
          <img src={`${ART}/bank_debt_column.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', filter: resultPhase ? `drop-shadow(0 0 8px ${P.coral})` : undefined }} />
        </motion.div>

        {/* dollar marks + left-edge labels */}
        {BAL_MARKS.map((n) => (
          <div key={n}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: `${balPct(n)}%`, height: n === 0 ? 3 : 1, background: n === 0 ? P.gold : P.glassBorder, opacity: n === 0 ? 1 : 0.24, animation: n === 0 && atZero ? 'baZeroFlash 700ms ease 2' : undefined, boxShadow: n === 0 ? `0 0 6px ${P.gold}` : undefined, zIndex: 2 }} />
            <div style={{ position: 'absolute', left: '-15%', top: `${balPct(n)}%`, transform: 'translateY(-50%)', fontFamily: 'var(--font-numeric)', fontSize: 'clamp(9px,1.1vw,12px)', fontWeight: 800, color: n === 0 ? P.gold : n < 0 ? P.coral : P.creamSoft, textShadow: '0 1px 4px rgba(0,0,0,0.7)', zIndex: 2 }}>{n}</div>
          </div>
        ))}

        {/* balance marker — a gold coin token that glides between dollar marks */}
        <motion.img src={`${ART}/bank_coin_token.png`} alt="" style={{ position: 'absolute', left: '50%', top: markerTop, x: '-50%', y: '-50%', width: 'clamp(30px,6.4vw,46px)', height: 'auto', zIndex: 4, filter: 'drop-shadow(0 3px 7px rgba(0,0,0,0.55))' }} />

        {/* big $ readout — follows the marker and ticks as it glides */}
        <motion.div style={{ position: 'absolute', left: '128%', top: markerTop, y: '-50%', fontFamily: 'var(--font-numeric)', fontSize: 'clamp(22px,4vw,36px)', fontWeight: 800, color: readColor, textShadow: '0 2px 8px rgba(0,0,0,0.6)', whiteSpace: 'nowrap', zIndex: 4 }}>{readText}</motion.div>

        {/* the hand withdrawing a coin — replaces the plain down-arrow */}
        {withdrawing && (
          <motion.div style={{ position: 'absolute', left: '90%', top: markerTop, y: '-50%', width: 'clamp(34px,7vw,52px)', zIndex: 4 }}>
            <img src={`${ART}/bank_withdraw_hand.png`} alt="" style={{ display: 'block', width: '100%', height: 'auto', animation: 'baBob 900ms ease-in-out infinite', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.5))' }} />
          </motion.div>
        )}

        {/* intro: up = deposit (green), down = withdraw (coral) */}
        {intro && (
          <>
            <div style={{ position: 'absolute', left: '108%', top: '16%', color: P.mint, fontWeight: 800, fontSize: 'clamp(11px,1.4vw,14px)', whiteSpace: 'nowrap', textShadow: '0 1px 6px rgba(0,0,0,0.7)', zIndex: 4 }}>↑ deposit +</div>
            <div style={{ position: 'absolute', left: '108%', top: '78%', color: P.coral, fontWeight: 800, fontSize: 'clamp(11px,1.4vw,14px)', whiteSpace: 'nowrap', textShadow: '0 1px 6px rgba(0,0,0,0.7)', zIndex: 4 }}>↓ withdraw −</div>
          </>
        )}

        {/* result: a bracket from the zero line down to the balance */}
        {resultPhase && overdrawn && (
          <>
            <motion.div style={{ position: 'absolute', left: '104%', top: `${zeroPct}%`, height: brHeight, width: 8, borderTop: `2px solid ${P.cream}`, borderBottom: `2px solid ${P.cream}`, borderRight: `2px solid ${P.cream}`, zIndex: 4 }} />
            <motion.div style={{ position: 'absolute', left: '118%', top: brMidTop, y: '-50%', color: P.cream, fontWeight: 700, fontSize: 'clamp(10px,1.3vw,13px)', whiteSpace: 'nowrap', textShadow: '0 1px 6px rgba(0,0,0,0.7)', zIndex: 4 }}>${-v} overdrawn</motion.div>
          </>
        )}
      </div>

      {/* counter pill — "$k of $7 out" through the withdrawal */}
      {withdrawing && taken >= 1 && taken <= 7 && (
        <div style={{ position: 'absolute', bottom: '2.5%', left: '50%', transform: 'translateX(-50%)', padding: '3px 12px', borderRadius: 999, background: P.glass, border: `1px solid ${P.glassBorder}`, color: P.coral, fontWeight: 800, fontSize: 'clamp(10px,1.2vw,13px)', animation: 'baPop 260ms ease' }}>${taken} of $7 out</div>
      )}
    </div>
  )
}

const CONFIG: GameConfig<number, Task> = {
  chapterId: 'integers',
  title: 'BANK ACCOUNT',
  motif: '🏦',
  ticketLabel: 'statement',
  palette: P,
  makeTask,
  initialValue: (t) => t.start,
  grade: (t, v) => Math.abs(v - t.answer) < 1e-6,
  revealText: (t) => disp(t.answer),
  glide: (t, from, setValue, later) => glideNumber(from, t.answer, setValue, later),
  // Answer by tapping a choice (not by dragging the meter). The balance meter stays
  // on screen only as the illustration.
  answerPad: (t) => t.choices ?? [],
  Instrument: ({ value, setValue, disabled, reveal, palette, onCommit }) => (
    <VThermo P={palette} value={value} setValue={setValue} min={MIN} max={MAX} disabled={disabled} reveal={reveal} onCommit={onCommit} commitLabel="RECORD ✓" unit="" />
  ),
  tutorial: {
    task: DEMO_TASK,
    initial: 0,
    hand: 'dragV',
    steps: [
      { say: 'This is your account meter. Zero is the middle line. Above zero is money you have, below zero is overdraft. Let us work one out together, nice and slow.', value: 0, hand: 'dragV' },
      { say: 'Our question: the balance starts at four dollars, then you withdraw seven. Let us build it up one step at a time.', value: 0, board: '4 − 7 = ?' },
      { say: 'First, the starting balance. Four dollars, up here above zero.', value: 4, hand: 'dragV', board: 'start: 4' },
      { say: 'Withdraw means money goes OUT, so we count DOWN. Take away seven, one dollar at a time.', value: 4, board: 'withdraw 7 → count down' },
      { say: 'Take one dollar: four goes down to three.', value: 3, hand: 'dragV', board: '4 → 3   (1 gone)' },
      { say: 'Take another: three goes down to two.', value: 2, hand: 'dragV', board: '3 → 2   (2 gone)' },
      { say: 'Again: two goes down to one.', value: 1, hand: 'dragV', board: '2 → 1   (3 gone)' },
      { say: 'And one more brings us all the way down to zero. That is four dollars gone — the account is empty.', value: 0, hand: 'dragV', board: '1 → 0   (4 gone)' },
      { say: 'But we had to take away SEVEN, and we have only taken four. Three more to go — so now we drop BELOW zero, into overdraft.', value: 0, board: '4 taken, 3 left → below 0' },
      { say: 'Take the fifth dollar: zero goes down to minus one. We are now in the red.', value: -1, hand: 'dragV', board: '0 → −1   (5 gone)' },
      { say: 'The sixth dollar: minus one goes down to minus two.', value: -2, hand: 'dragV', board: '−1 → −2   (6 gone)' },
      { say: 'The seventh and last dollar: minus two goes down to minus three.', value: -3, hand: 'dragV', board: '−2 → −3   (7 gone)' },
      { say: 'We took away all seven. It landed on minus three — three dollars in overdraft. So four minus seven is minus three.', value: -3, board: '4 − 7 = −3' },
      { say: "In practice you just tap your answer. Now let's try one together.", value: -3, hand: 'tap' },
    ],
  },
  guided: {
    task: GUIDED_TASK,
    coach: 'Your turn — I will help.',
    hand: 'dragV',
  },
  TutorialScene: BankAccountScene,
  start: { blurb: <><strong style={{ color: P.cream }}>You&apos;re keeping the books.</strong> A balance goes up with deposits and down with withdrawals — even below zero into overdraft. Work each one out, then tap your answer.</>, ticket: { title: 'Opening balance', badge: '−3', tone: 'b' }, startLabel: 'Open the ledger →' },
  overview: {
    say: "Here is what we are figuring out: a bank balance can go below zero when you spend more than you have. We will start at four dollars, take away seven, and land in overdraft — that is subtracting to get a negative number.",
    problem: <>How low can a balance go? We&apos;ll track <strong>$4, then withdraw $7</strong> — and end up <strong>below zero</strong>.</>,
    points: [
      <>Above zero is money you have; below zero is <strong>overdraft</strong> (money you owe).</>,
      <>We&apos;re working out <strong>4 − 7</strong> by counting down, one dollar at a time.</>,
      <>Watch where it lands past zero — that&apos;s a <strong>negative number</strong>.</>,
    ],
  },
  sig: (t) => `${t.title}:${t.answer}`,
  // Teaching is the walkthrough ("I do") + a guided round ("we do"), then scored
  // practice ("you do") where the child taps a number choice.
}

export default function WeatherStation(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
