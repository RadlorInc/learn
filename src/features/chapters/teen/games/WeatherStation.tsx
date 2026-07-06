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

// `start` = the balance the meter BEGINS on. For a transaction ("balance is s,
// you deposit/withdraw") it starts at the current balance s so the kid moves from
// there; for "set the balance to X" tasks it starts at 0 (a blank slate to set).
interface Task extends BaseTask { answer: number; start: number }
const MIN = -20, MAX = 20

function setPoint(): Task {
  const t = pick([-5, -4, -3, -2, 2, 3, 4, 5])
  return {
    title: 'Set balance', badge: `${t}`, tone: t < 0 ? 'b' : 'a',
    prompt: `Set the balance to ${t}.`,
    say: `Log a balance of ${signed(t)} dollars.`,
    answer: t, start: 0,
    work: [`${signed(t)} sits ${Math.abs(t)} ${t < 0 ? 'below' : 'above'} zero.`, `Count ${Math.abs(t)} marks ${t < 0 ? 'down into overdraft from' : 'up from'} zero and stop there.`],
  }
}
function colder(): Task {
  let a = pick([-8, -6, -5, -3, -2, 4, 6]); let b = pick([-9, -7, -4, -1, 3, 5])
  if (a === b) b = a - 1
  const ans = Math.min(a, b)
  return {
    title: 'Deeper debt', badge: `${a} vs ${b}`, tone: 'b',
    prompt: `Which balance is lower — ${a} or ${b}? Set to it.`,
    say: `Which balance is lower, ${signed(a)} or ${signed(b)} dollars? Set the meter to the lower one.`,
    answer: ans, start: 0,
    work: [`On the meter, a lower balance means further down into overdraft.`, `${signed(ans)} is below ${signed(Math.max(a, b))}, so ${signed(ans)} is lower.`],
  }
}
function afterChange(): Task {
  const s = pick([-4, -2, 1, 3, 4, 6]); const d = pick([-9, -7, -5, 5, 7])
  const ans = s + d
  const dir = d < 0 ? `withdraw ${Math.abs(d)}` : `deposit ${d}`
  return {
    title: 'Transaction', badge: `${s} ${d < 0 ? '↓' : '↑'}`, tone: d < 0 ? 'b' : 'a',
    prompt: `Balance is ${s}. You ${dir}. Set the new balance.`,
    say: `The balance was ${signed(s)} dollars, then you ${dir}. Set the meter to the new balance.`,
    answer: ans, start: s,
    work: [`Start at ${signed(s)} and move ${Math.abs(d)} ${d < 0 ? 'down' : 'up'}.`, `${s} ${d < 0 ? '−' : '+'} ${Math.abs(d)} is ${signed(ans)}.`],
  }
}
function opposite(): Task {
  const t = pick([-8, -6, -5, 4, 5, 7, 8])
  const ans = -t
  return {
    title: 'Opposite', badge: `opp of ${t}`, tone: 'a',
    prompt: `Set the balance to the opposite of ${t}.`,
    say: `Set the meter to the opposite of ${signed(t)} dollars.`,
    answer: ans, start: 0,
    work: [`The opposite is the same distance from zero, other side.`, `The opposite of ${signed(t)} is ${signed(ans)}.`],
  }
}
function distance(): Task {
  const t = pick([-9, -8, -7, -6, 6, 7, 8])
  const ans = Math.abs(t)
  return {
    title: 'Distance', badge: `|${t}|`, tone: 'a',
    prompt: `How far is ${t} from zero? Set to that distance.`,
    say: `How many dollars is ${signed(t)} from zero? Set the meter up to that distance.`,
    answer: ans, start: 0,
    work: [`Distance from zero ignores the sign — that's absolute value.`, `${signed(t)} is ${ans} away from zero, so the answer is ${ans}.`],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  const pool: (() => Task)[] =
    d === 1 ? [setPoint, setPoint, colder]
    : d === 2 ? [afterChange, opposite, colder]
    : [distance, opposite, afterChange]
  return pick(pool)()
}

// ── the worked example for the walkthrough (4 withdraw 7 → −3) and the guided order (set −5) ──
const DEMO_TASK: Task = { title: 'Transaction', badge: '4 ↓', tone: 'b', answer: -3, start: 4, prompt: '', say: '', work: [] }
const GUIDED_TASK: Task = {
  title: 'Set balance', badge: '−5', tone: 'b', answer: -5, start: 0,
  prompt: 'Set the balance down to −5, then press Record.',
  say: 'Set the balance to minus five. Pull the meter down below zero into overdraft, then record it.',
  work: ['−5 sits 5 below zero.', 'Count 5 marks down into overdraft from zero and stop.'],
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
  revealText: (t) => `${t.answer}`,
  glide: (t, from, setValue, later) => glideNumber(from, t.answer, setValue, later),
  Instrument: ({ value, setValue, disabled, reveal, palette, onCommit }) => (
    <VThermo P={palette} value={value} setValue={setValue} min={MIN} max={MAX} disabled={disabled} reveal={reveal} onCommit={onCommit} commitLabel="RECORD ✓" unit="" />
  ),
  tutorial: {
    task: DEMO_TASK,
    initial: 0,
    hand: 'dragV',
    steps: [
      { say: 'This is your account meter. Zero is the middle line. Drag the balance up for money in, down for overdraft. Let us log one transaction together, nice and slow.', value: 0, hand: 'dragV', art: '/assets/teen/objects/bank_deposit.png' },
      { say: 'Our job: the balance starts at four dollars, then you withdraw seven. Let us build it up one step at a time.', value: 0, board: '4 − 7 = ?', art: '/assets/teen/objects/bank_coins.png' },
      { say: 'First, set the starting balance. Four dollars, up here above zero.', value: 4, hand: 'dragV', board: 'start: 4', art: '/assets/teen/objects/bank_coins.png' },
      { say: 'Withdraw means money goes OUT, so we count DOWN. We need to take away seven, one dollar at a time.', value: 4, board: 'withdraw 7 → count down', art: '/assets/teen/objects/bank_withdraw.png' },
      { say: 'Take one dollar: four goes down to three.', value: 3, hand: 'dragV', board: '4 → 3   (1 gone)' },
      { say: 'Take another: three goes down to two.', value: 2, hand: 'dragV', board: '3 → 2   (2 gone)' },
      { say: 'Again: two goes down to one.', value: 1, hand: 'dragV', board: '2 → 1   (3 gone)' },
      { say: 'And one more brings us all the way down to zero. That is four dollars gone — the account is empty.', value: 0, hand: 'dragV', board: '1 → 0   (4 gone)', art: '/assets/teen/objects/bank_vault.png' },
      { say: 'But we had to take away SEVEN, and we have only taken four so far. Three more still to go — so now we drop BELOW zero, into overdraft.', value: 0, board: '4 taken, 3 left → below 0' },
      { say: 'Take the fifth dollar: zero goes down to minus one. We are now in the red.', value: -1, hand: 'dragV', board: '0 → −1   (5 gone)', art: '/assets/teen/objects/bank_overdrawn.png' },
      { say: 'The sixth dollar: minus one goes down to minus two.', value: -2, hand: 'dragV', board: '−1 → −2   (6 gone)' },
      { say: 'The seventh and last dollar: minus two goes down to minus three.', value: -3, hand: 'dragV', board: '−2 → −3   (7 gone)' },
      { say: 'We took away all seven. It landed on minus three — three dollars in overdraft. So four minus seven is minus three.', value: -3, board: '4 − 7 = −3' },
      { say: "When your balance is set, press Record. Now let's try one together.", value: -3, hand: 'tap' },
    ],
  },
  guided: {
    task: GUIDED_TASK,
    coach: 'Your turn — I will help.',
    hand: 'dragV',
  },
  start: { blurb: <><strong style={{ color: P.cream }}>You&apos;re keeping the books.</strong> Move the balance up for deposits and down for withdrawals — even when it dips below zero into overdraft.</>, ticket: { title: 'Opening balance', badge: '−3', tone: 'b' }, startLabel: 'Open the ledger →' },
  sig: (t) => `${t.title}:${t.answer}`,
}

export default function WeatherStation(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
