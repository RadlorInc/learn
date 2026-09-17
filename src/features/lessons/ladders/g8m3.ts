/**
 * Grade 8 · Module 3 — Functions. Practice ladders, easiest style first (see ../adaptive.ts and the reference ladders in
 * ./g5m1.ts and ./g7m1.ts). Rules are only ever PICKED, never typed, as in the lessons. Every negative number is written
 * with "−". Every choice question has exactly one true choice; a "Kai says…" question is sometimes right.
 */
import type { Picture, Problem } from '../script'
import { int, pick, shuffle, fmt, type Level, type Rng } from '../adaptive'

const eq = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })
/** A signed number as the lessons write it: −3, not -3. */
const sn = (n: number) => (n < 0 ? `−${fmt(-n)}` : fmt(n))
/** A number inside working: negatives in brackets. */
const br = (n: number) => (n < 0 ? `(${sn(n)})` : fmt(n))
const choose = (r: Rng, right: string, wrong: string[]) => { const choices = shuffle(r, [right, ...wrong]); return { choices, correct: choices.indexOf(right) } }
/** An input row on top, one output row below — the lessons' table. */
const io = (xs: (number | string)[], ys: (number | string)[], x = 'Input (x)', y = 'Output (y)'): Picture =>
  ({ kind: 'table', head: [x, ...xs.map(v => (typeof v === 'number' ? sn(v) : v))], rowHead: true, rows: [[y, ...ys.map(v => (typeof v === 'number' ? sn(v) : v))]] })
/** y = mx + b, written the way the lessons write it. */
const rule = (m: number, b: number, y = 'y') => `${y} = ${m === 1 ? '' : m === -1 ? '−' : sn(m)}x${b > 0 ? ` + ${fmt(b)}` : b < 0 ? ` − ${fmt(-b)}` : ''}`
/** "goes up 3" / "goes down 2". */
const chg = (d: number) => (d >= 0 ? `goes up ${fmt(d)}` : `goes down ${fmt(-d)}`)
const count = (n: number, one: string, many: string) => `${fmt(n)} ${Math.abs(n) === 1 ? one : many}`
const clean = (x: number) => Math.round(x * 1e6) / 1e6
/** k distinct whole numbers from lo to hi, in random order. */
const distinct = (r: Rng, k: number, lo: number, hi: number) => {
  const s = new Set<number>()
  while (s.size < k) s.add(int(r, lo, hi))
  return shuffle(r, [...s])
}
const NAMES = ['Kai', 'Rosa', 'Eli', 'Nina', 'Omar', 'Lena']

/** Every number a picture's own labels print (a list of strings is also read joined up, the way a table row reads). */
const shown = (pic: Picture) => {
  const texts: string[] = []
  const walk = (v: unknown) => {
    if (typeof v === 'string') texts.push(v)
    else if (Array.isArray(v)) { if (v.length && v.every(x => typeof x === 'string')) texts.push(v.join('')); v.forEach(walk) }
    else if (v && typeof v === 'object') Object.values(v).forEach(walk)
  }
  walk(pic)
  return { texts, nums: new Set(texts.flatMap(t => t.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map(t => t.replace(/,/g, ''))) }
}
/** A level whose numbers are re-picked whenever the picture would print the answer. */
const lv = (style: string, build: (r: Rng) => Problem): Level => ({
  style, make: r => {
    let p = build(r)
    for (let i = 0; i < 200; i++) {
      const a = p.answer, s = shown(p.picture)
      const bad = typeof a === 'number' ? Math.abs(a) >= 10 && s.nums.has(String(Math.abs(a)))
        : a && typeof a === 'object' && 'choices' in a ? s.texts.some(t => t.includes(a.choices[a.correct])) : false
      if (!bad) return p
      p = build(r)
    }
    return p
  },
})

// ── t1 · One input, one output ──────────────────────────────────────────────────────────────────────────────
/** Four columns that ARE a function, with one output repeated (the trap). */
const fnTable = (r: Rng) => {
  const ins = distinct(r, 4, 0, 9), outs = ins.map(() => int(r, 1, 12))
  const [i, j] = distinct(r, 2, 0, 3)
  outs[j] = outs[i]
  return { ins, outs, o: outs[i] }
}
/** Four columns that are NOT a function: input `a` twice, with two different outputs. `allDiff` keeps every output different. */
const notFnTable = (r: Rng, allDiff = false) => {
  const three = distinct(r, 3, 0, 9), a = pick(r, three)
  const outs = allDiff ? distinct(r, 4, 1, 12) : [...three.map(() => int(r, 1, 12)), 0]
  const first = outs[three.indexOf(a)]
  if (!allDiff) { let o = int(r, 1, 12); while (o === first) o = int(r, 1, 12); outs[3] = o }
  const cols = shuffle(r, [...three, a].map((x, k) => [x, outs[k]] as const))
  const two = cols.filter(c => c[0] === a).map(c => c[1])
  return { ins: cols.map(c => c[0]), outs: cols.map(c => c[1]), a, two, other: three.find(x => x !== a)! }
}

const T1: Level[] = [
  lv('table: is it a function (repeated input vs repeated output)', r => {
    const text = 'Is this table a function? Pick the one that is true.'
    if (r() < 0.5) {
      const { ins, outs, o } = fnTable(r), right = 'Yes: each input has one output'
      return { text, picture: io(ins, outs), answer: choose(r, right, [`No: output ${o} repeats`, `No: input ${ins[0]} has two outputs`]),
        steps: [`The inputs ${ins.join(', ')} are all different, so no input repeats.`, `Output ${o} repeats, but that is fine. So the true one is: ${right}.`] }
    }
    const { ins, outs, a, two, other } = notFnTable(r), right = `No: input ${a} has two outputs`
    return { text, picture: io(ins, outs), answer: choose(r, right, ['Yes: each input has one output', `No: input ${other} has two outputs`]),
      steps: [`Input ${a} shows up twice, once with output ${two[0]} and once with output ${two[1]}.`, `One input has two outputs, so the true one is: ${right}.`] }
  }),
  lv('pairs in words: pick the set that is a function', r => {
    const set = (pairs: (readonly [number, number])[]) => pairs.map(([x, y]) => `(${x}, ${y})`).join(', ')
    for (;;) {
      const f = fnTable(r), n1 = notFnTable(r), n2 = notFnTable(r)
      const R = set(f.ins.map((x, k) => [x, f.outs[k]] as const))
      const W1 = set(n1.ins.map((x, k) => [x, n1.outs[k]] as const)), W2 = set(n2.ins.map((x, k) => [x, n2.outs[k]] as const))
      if (new Set([R, W1, W2]).size < 3) continue
      return { text: 'Each set lists pairs (input, output). Which set is a function?', picture: eq('(input, output)', ['one output for each input?']),
        answer: choose(r, R, [W1, W2]),
        steps: [`In ${W1}, input ${n1.a} has outputs ${n1.two[0]} and ${n1.two[1]}. In ${W2}, input ${n2.a} has outputs ${n2.two[0]} and ${n2.two[1]}.`,
          `In the last set no input repeats, even though an output does. So the function is ${R}.`] }
    }
  }),
  lv('spot the mistake: is the reason right', r => {
    const name = pick(r, NAMES), kind = int(r, 0, 2)
    const RIGHT = `${name} is right`, IS = `${name} is wrong: it is a function`, NOT = `${name} is wrong: it is not a function`
    if (kind === 0) {
      const { ins, outs, o } = fnTable(r)
      return { text: `${name} says this table is not a function because output ${o} repeats. Is ${name} right?`, picture: io(ins, outs),
        answer: choose(r, IS, [RIGHT, NOT]),
        steps: [`A repeated output is allowed. Only a repeated input with two outputs breaks the rule.`, `No input repeats here, so the answer is: ${IS}.`] }
    }
    if (kind === 1) {
      const { ins, outs, a, two } = notFnTable(r)
      return { text: `${name} says this table is not a function because input ${a} has two outputs. Is ${name} right?`, picture: io(ins, outs),
        answer: choose(r, RIGHT, [IS, NOT]),
        steps: [`Input ${a} shows up twice, with outputs ${two[0]} and ${two[1]}.`, `That breaks the rule, so the answer is: ${RIGHT}.`] }
    }
    const { ins, outs, a, two } = notFnTable(r, true)
    return { text: `${name} says this table is a function because no output repeats. Is ${name} right?`, picture: io(ins, outs),
      answer: choose(r, NOT, [RIGHT, IS]),
      steps: [`Repeated outputs are not the test. Look for a repeated input: ${a} shows up twice, with outputs ${two[0]} and ${two[1]}.`, `So the answer is: ${NOT}.`] }
  }),
  { style: 'work backwards: the output that keeps it a function', dataShown: true, make: r => {
    const ins = distinct(r, 4, -5, 9), outs = distinct(r, 4, -9, 20), k = int(r, 0, 3), a = ins[k], o = outs[k]
    return { text: 'One input shows up twice in this table. What number must go in the ? so the table is still a function? Type the number.',
      picture: io([...ins, a], [...outs, '?']), answer: o,
      steps: [`Input ${sn(a)} is already in the table, with output ${sn(o)}.`, `A function gives each input one output, so the ? must be ${sn(o)}.`] }
  } },
  lv('story: which way round is it a function', r => {
    const c = pick(r, [
      { i: 'student ID', o: 'room', ih: 'Student ID', oh: 'Room', iv: () => int(r, 101, 140), ov: () => pick(r, [11, 12, 14, 15, 21, 22, 23]) },
      { i: 'locker number', o: 'grade', ih: 'Locker', oh: 'Grade', iv: () => int(r, 200, 260), ov: () => int(r, 6, 8) },
      { i: 'jersey number', o: 'age', ih: 'Jersey', oh: 'Age', iv: () => int(r, 2, 40), ov: () => int(r, 11, 14) },
    ])
    const ins = new Set<number>(); while (ins.size < 4) ins.add(c.iv())
    const xs = [...ins], ys = xs.map(() => c.ov()), [p, q] = distinct(r, 2, 0, 3)
    ys[q] = ys[p]
    const o = ys[p], pic = io(xs, ys, c.ih, c.oh)
    if (r() < 0.5) {
      const right = `Yes: each ${c.i} has one ${c.o}`
      return { text: `The table lists each ${c.i} with its ${c.o}. Is the ${c.o} a function of the ${c.i}? Pick the one that is true.`, picture: pic,
        answer: choose(r, right, [`No: ${c.o} ${o} repeats`, `No: ${c.i} ${xs[0]} has two ${c.o}s`]),
        steps: [`Here the ${c.i} is the input. Each ${c.i} shows up once.`, `Some share ${c.o} ${o}, and that is allowed. So: ${right}.`] }
    }
    const right = `No: ${c.o} ${o} has more than one ${c.i}`
    return { text: `The table lists each ${c.i} with its ${c.o}. Is the ${c.i} a function of the ${c.o}? Pick the one that is true.`, picture: pic,
      answer: choose(r, right, [`Yes: each ${c.o} has one ${c.i}`, `No: ${c.i} ${xs[0]} shows up twice`]),
      steps: [`Now the ${c.o} is the input. ${c.o[0].toUpperCase()}${c.o.slice(1)} ${o} goes with ${c.i} ${xs[p]} and with ${c.i} ${xs[q]}.`, `One input with two outputs, so: ${right}.`] }
  }),
]

// ── t2 · Evaluate a function ────────────────────────────────────────────────────────────────────────────────
const T2: Level[] = [
  lv('rule in words: output for one input', r => {
    for (;;) {
      const a = int(r, 2, 9), b = int(r, 1, 12), x = int(r, 2, 12), plus = r() < 0.5, y = plus ? a * x + b : a * x - b
      if (y <= 0) continue
      const op = plus ? '+' : '−'
      return { text: `The rule is output = ${a} × input ${op} ${b}. What is the output when the input is ${x}? Type the number.`, picture: io([x], ['?']), answer: y,
        steps: [`Put ${x} in place of the input: ${a} × ${x} ${op} ${b}.`, `Multiply first: ${a} × ${x} = ${a * x}.`, `Then ${a * x} ${op} ${b}, so the output is ${fmt(y)}.`] }
    }
  }),
  lv('function notation f(x), negative inputs', r => {
    const a = int(r, 2, 9), b = int(r, 1, 12) * (r() < 0.5 ? 1 : -1), x = int(r, -9, -1), y = a * x + b
    return { text: `${rule(a, b, 'f(x)')}. What is f(${sn(x)})? Type the number. It may be negative.`, picture: io([x], ['?'], 'x', 'f(x)'), answer: y,
      steps: [`Put ${sn(x)} in place of x: ${a} × ${br(x)} ${b < 0 ? '−' : '+'} ${Math.abs(b)}.`, `Multiply first: ${a} × ${br(x)} = ${sn(a * x)}.`,
        `Then ${sn(a * x)} ${b < 0 ? '−' : '+'} ${Math.abs(b)}, so f(${sn(x)}) = ${sn(y)}.`] }
  }),
  lv('spot the mistake: which working multiplies first', r => {
    for (;;) {
      const a = int(r, 2, 9), b = int(r, 1, 9), x = int(r, 2, 9), plus = r() < 0.5, s = plus ? 1 : -1, op = plus ? '+' : '−'
      const good = a * x + s * b, early = a * (x + s * b), added = a + x + s * b
      if (new Set([good, early, added]).size < 3) continue
      const w = (v: number) => `${a} × ${x} ${op} ${b} = ${sn(v)}`
      const right = w(good)
      return { text: `Three students worked out f(${x}) for ${rule(a, s * b, 'f(x)')}. Which working is right?`, picture: eq(rule(a, s * b, 'f(x)'), [`f(${x}) = ?`]),
        answer: choose(r, right, [w(early), w(added)]),
        steps: [`Multiply first: ${a} × ${x} = ${a * x}. Then ${a * x} ${op} ${b} = ${sn(good)}.`, `Doing ${op} first gives ${sn(early)}, and adding ${a} + ${x} instead of multiplying gives ${sn(added)}. The right one is ${right}.`] }
    }
  }),
  lv('work backwards: which input gives this output', r => {
    const a = int(r, 2, 9), b = int(r, 1, 12) * (r() < 0.5 ? 1 : -1), x = int(r, -6, 12), y = a * x + b
    const bw = b < 0 ? `add ${-b}: ${sn(y)} + ${-b}` : `subtract ${b}: ${sn(y)} − ${b}`
    return { text: `${rule(a, b, 'f(x)')}. For what input x is f(x) = ${sn(y)}? Type the number. It may be negative.`, picture: io(['?'], [y], 'x', 'f(x)'), answer: x,
      steps: [`Undo the rule backwards. First ${bw} = ${sn(y - b)}.`, `Then undo × ${a}: ${sn(y - b)} ÷ ${a} = ${sn(x)}.`, `Check: ${a} × ${br(x)} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${sn(y)}. So x = ${sn(x)}.`] }
  }),
  lv('story: two inputs, how much more', r => {
    const [what, unit, h] = pick(r, [['A taxi charges $B plus $A for each mile, so a ride of x miles costs C(x) = RULE dollars.', 'mile', 'Miles (x)'],
      ['A plumber charges $B to come out plus $A for each hour, so x hours cost C(x) = RULE dollars.', 'hour', 'Hours (x)'],
      ['A bike rental costs $B plus $A for each hour, so x hours cost C(x) = RULE dollars.', 'hour', 'Hours (x)']] as const)
    const a = int(r, 2, 15), b = int(r, 3, 30), [q, p] = distinct(r, 2, 1, 12).sort((m, n) => m - n)
    const cp = a * p + b, cq = a * q + b, ans = cp - cq
    const story = what.replace('$B', `$${b}`).replace('$A', `$${a}`).replace('RULE', `${a}x + ${b}`)
    const ask = unit === 'mile' ? `How many more dollars does a ${p}-mile ride cost than a ${q}-mile ride?` : `How many more dollars do ${count(p, 'hour', 'hours')} cost than ${count(q, 'hour', 'hours')}?`
    return { text: `${story} ${ask}`, picture: io([q, p], ['?', '?'], h, 'Cost ($)'), answer: ans,
      steps: [`C(${p}) = ${a} × ${p} + ${b} = ${cp}.`, `C(${q}) = ${a} × ${q} + ${b} = ${cq}.`, `${cp} − ${cq} = ${fmt(ans)}, so it costs $${fmt(ans)} more.`] }
  }),
]

// ── t3 · Linear or not? ─────────────────────────────────────────────────────────────────────────────────────
/** Three y changes that are all the same sign and strictly growing or shrinking, so they are never all equal. */
const bend = (r: Rng) => {
  const d = pick(r, [[1, 2, 3], [1, 2, 4], [1, 3, 5], [2, 3, 4], [1, 2, 5]])
  const inc = r() < 0.5 ? d : [...d].reverse()
  return r() < 0.5 ? inc : inc.map(v => -v)
}
const T3: Level[] = [
  lv('table with x steps of 1: pick the true statement', r => {
    const x0 = int(r, 0, 5), xs = [0, 1, 2, 3].map(k => x0 + k)
    const text = 'Is this table linear? Pick the one that is true.', NOT = 'Not linear: y changes by different amounts'
    if (r() < 0.5) {
      const m = pick(r, [-5, -4, -3, -2, 2, 3, 4, 5, 6]), b = int(r, -4, 20), ys = xs.map(x => m * x + b), right = `Linear: y ${chg(m)} every step`
      return { text, picture: io(xs, ys, 'x', 'y'), answer: choose(r, right, [NOT, `Linear: y ${chg(m + Math.sign(m))} every step`]),
        steps: [`x goes up 1 each time.`, `y goes ${ys.map(sn).join(', ')}, so it ${chg(m)} every step. The true one is: ${right}.`] }
    }
    const d = bend(r), ys = [int(r, 0, 15)]
    d.forEach(v => ys.push(ys.at(-1)! + v))
    return { text, picture: io(xs, ys, 'x', 'y'), answer: choose(r, NOT, [`Linear: y ${chg(d[0])} every step`, `Linear: y ${chg(d[2])} every step`]),
      steps: [`x goes up 1 each time.`, `y changes by ${d.map(sn).join(', then ')}. Those are different, so the true one is: ${NOT}.`] }
  }),
  lv('points on a graph: straight line or not', r => {
    const x0 = int(r, 0, 6), xs = [0, 1, 2, 3].map(k => x0 + k)
    const text = 'Do these points make a straight line? Pick the one that is true.', BENT = 'No: the change in y is different each step'
    const pic = (ys: number[]): Picture => ({ kind: 'coord', min: 0, max: 10, points: xs.map((x, k) => ({ x, y: ys[k] })) })
    if (r() < 0.5) {
      const m = pick(r, [-3, -2, -1, 1, 2, 3]), lo = m > 0 ? 0 : -3 * m, hi = m > 0 ? 10 - 3 * m : 10, b = int(r, lo, hi)
      const ys = [0, 1, 2, 3].map(k => b + m * k), right = `Yes: y ${chg(m)} each step`
      return { text, picture: pic(ys), answer: choose(r, right, [BENT, `Yes: y ${chg(m + Math.sign(m))} each step`]),
        steps: [`Read the points left to right: y is ${ys.join(', ')}.`, `Each step x goes up 1 and y ${chg(m)}. So: ${right}.`] }
    }
    for (;;) {
      const d = bend(r), tot = d.reduce((s, v) => s + v, 0), y0 = tot > 0 ? int(r, 0, 10 - tot) : int(r, -tot, 10), ys = [y0]
      d.forEach(v => ys.push(ys.at(-1)! + v))
      if (d[0] === d[2]) continue
      return { text, picture: pic(ys), answer: choose(r, BENT, [`Yes: y ${chg(d[0])} each step`, `Yes: y ${chg(d[2])} each step`]),
        steps: [`Read the points left to right: y is ${ys.join(', ')}.`, `y changes by ${d.map(sn).join(', then ')}, so the points bend. The true one is: ${BENT}.`] }
    }
  }),
  lv('spot the mistake: uneven x steps', r => {
    const name = pick(r, NAMES), xs = pick(r, [[0, 1, 3, 4], [0, 2, 3, 5], [1, 2, 4, 5], [0, 1, 2, 4], [0, 2, 4, 5], [0, 3, 4, 6]])
    const dx = xs.slice(1).map((x, k) => x - xs[k]), y0 = int(r, 0, 9), kind = int(r, 0, 2)
    const RIGHT = `${name} is right`, LIN = `${name} is wrong: it is linear`, NOT = `${name} is wrong: it is not linear`
    const build = (steps: number[]) => { const ys = [y0]; steps.forEach(s => ys.push(ys.at(-1)! + s)); return ys }
    if (kind === 0) {
      const m = int(r, 2, 5), st = dx.map(d => m * d), ys = build(st)
      return { text: `${name} says this table is not linear because the changes in y (${st.join(', then ')}) are not all the same. Is ${name} right?`, picture: io(xs, ys, 'x', 'y'),
        answer: choose(r, LIN, [RIGHT, NOT]),
        steps: [`Check the x steps first: x goes up ${dx.join(', then ')}.`, `For each 1 in x, y goes up ${st.map((s, k) => `${s} ÷ ${dx[k]} = ${m}`).join(', ')}. The same every time, so: ${LIN}.`] }
    }
    if (kind === 1) {
      for (;;) {
        const rates = dx.map(() => int(r, 1, 4))
        if (new Set(rates).size < 2) continue
        const st = dx.map((d, k) => rates[k] * d), ys = build(st)
        return { text: `${name} says this table is not linear because y changes by a different amount for each 1 in x. Is ${name} right?`, picture: io(xs, ys, 'x', 'y'),
          answer: choose(r, RIGHT, [LIN, NOT]),
          steps: [`x goes up ${dx.join(', then ')} and y goes up ${st.join(', then ')}.`, `For each 1 in x that is ${st.map((s, k) => `${s} ÷ ${dx[k]} = ${rates[k]}`).join(', ')}. Not all the same, so: ${RIGHT}.`] }
      }
    }
    const s = int(r, 2, 5), ys = build(dx.map(() => s))
    return { text: `${name} says this table is linear because y goes up ${s} every step. Is ${name} right?`, picture: io(xs, ys, 'x', 'y'),
      answer: choose(r, NOT, [RIGHT, LIN]),
      steps: [`The x steps are not equal: x goes up ${dx.join(', then ')}.`, `Going up ${s} over a step of ${Math.min(...dx)} and also over a step of ${Math.max(...dx)} is not the same change for each 1 in x. So: ${NOT}.`] }
  }),
  lv('work backwards: the missing y that keeps it linear', r => {
    const xs = pick(r, [[0, 1, 2, 3], [1, 2, 3, 4], [0, 2, 4, 6], [0, 1, 3, 4], [0, 2, 3, 5]])
    const m = pick(r, [-4, -3, -2, 2, 3, 4, 5]), b = int(r, -3, 12), ys = xs.map(x => m * x + b), k = int(r, 0, 3)
    const [i, j] = [0, 1, 2, 3].filter(n => n !== k), ans = ys[k]
    return { text: 'This table is linear. What number goes where the ? is? Type the number. It may be negative.',
      picture: io(xs, ys.map((y, n) => (n === k ? '?' : y)), 'x', 'y'), answer: ans,
      steps: [`Use two full columns: (${sn(ys[j])} − ${br(ys[i])}) ÷ (${xs[j]} − ${xs[i]}) = ${sn(m)}. So y changes by ${sn(m)} for each 1 in x.`,
        `From x = ${xs[i]} to x = ${xs[k]}: ${sn(ys[i])} + ${br(m)} × (${xs[k]} − ${xs[i]}) = ${sn(ans)}.`, `So the missing number is ${sn(ans)}.`] }
  }),
  lv('story with uneven times: linear or not', r => {
    const c = pick(r, [
      { s: 'A plant is measured in weeks', x: 'week', xh: 'Week', yh: 'Inches', one: 'inch', many: 'inches', thing: 'height', up: true },
      { s: 'A tank is filling. Its water is checked at minutes', x: 'minute', xh: 'Minute', yh: 'Gallons', one: 'gallon', many: 'gallons', thing: 'amount of water', up: true },
      { s: 'A candle burns. Its height is checked at hours', x: 'hour', xh: 'Hour', yh: 'Inches', one: 'inch', many: 'inches', thing: 'height', up: false },
    ])
    const xs = pick(r, [[0, 1, 3, 4], [0, 2, 3, 5], [0, 1, 2, 4], [0, 2, 4, 5]]), dx = xs.slice(1).map((x, k) => x - xs[k])
    const verb = c.up ? 'grows' : 'drops', sign = c.up ? 1 : -1
    const each = (n: number) => `Linear: it ${verb} ${count(n, c.one, c.many)} each ${c.x}`
    const text = `${c.s} ${xs.join(', ').replace(/, (\d+)$/, ' and $1')}. Is its ${c.thing} linear? Pick the one that is true.`
    const NOT = 'Not linear: the change for each 1 is different'
    const table = (rates: number[]) => { const ys = [c.up ? int(r, 1, 8) : int(r, 18, 24)]; dx.forEach((d, k) => ys.push(ys.at(-1)! + sign * rates[k] * d)); return ys }
    if (r() < 0.5) {
      const m = int(r, 1, 3), ys = table(dx.map(() => m)), right = each(m)
      return { text, picture: io(xs, ys, c.xh, c.yh), answer: choose(r, right, [NOT, each(m + 1)]),
        steps: [`The ${c.x}s go up ${dx.join(', then ')}, and the ${c.thing} changes by ${ys.slice(1).map((y, k) => Math.abs(y - ys[k])).join(', then ')}.`,
          `Divide each change by its step: ${m} every time. So: ${right}.`] }
    }
    const rates = shuffle(r, [1, 2, 3])
    const ys = table(rates)
    return { text, picture: io(xs, ys, c.xh, c.yh), answer: choose(r, NOT, [each(rates[0]), each(rates[2])]),
      steps: [`The ${c.x}s go up ${dx.join(', then ')}, and the ${c.thing} changes by ${ys.slice(1).map((y, k) => Math.abs(y - ys[k])).join(', then ')}.`,
        `For each 1 that is ${rates.join(', then ')}. Those differ, so: ${NOT}.`] }
  }),
]

// ── t4 · Compare two functions ──────────────────────────────────────────────────────────────────────────────
const SAME = 'they grow at the same rate'
const T4: Level[] = [
  lv('table: how much y goes up for each 1 in x', r => {
    const x0 = int(r, 0, 5), xs = [0, 1, 2, 3].map(k => x0 + k), m = int(r, 2, 15), b = int(r, 0, 25), ys = xs.map(x => m * x + b)
    return { text: 'This table is a linear function. How much does y go up for each 1 in x? Type the number.', picture: io(xs, ys, 'x', 'y'), answer: m,
      steps: [`x goes up 1 each time. Subtract one y from the next: ${ys[1]} − ${ys[0]} = ${m}.`, `It is the same every step, so y goes up ${m} for each 1 in x.`] }
  }),
  lv('table vs rule: which grows faster', r => {
    const mA = int(r, 2, 9), same = r() < 0.2
    let mB = mA
    if (!same) while (mB === mA) mB = int(r, 2, 9)
    const slow = mA < mB ? 'A' : 'B', trap = !same && r() < 0.7
    const bA = trap && slow === 'A' ? int(r, 15, 30) : int(r, 0, 12), bB = trap && slow === 'B' ? int(r, 15, 30) : int(r, 0, 12)
    const ys = [0, 1, 2, 3].map(x => mA * x + bA)
    const right = same ? SAME : mA > mB ? 'function A' : 'function B', wrong = ['function A', 'function B', SAME].filter(c => c !== right)
    return { text: `Function A is the table. Function B is ${rule(mB, bB)}. Which grows faster?`, picture: io([0, 1, 2, 3], ys, 'x', 'A: y'),
      answer: choose(r, right, wrong),
      steps: [`Function A goes ${ys.join(', ')}: up ${mA} for each 1 in x. Function B goes up ${mB}, the number in front of x.`,
        same ? `Both go up ${mA}, so ${SAME}.` : `${Math.max(mA, mB)} is more than ${Math.min(mA, mB)}, so ${right} grows faster.`] }
  }),
  lv('pick the true statement: where it starts vs how fast', r => {
    const mA = int(r, 2, 9); let mB = mA
    while (mB === mA) mB = int(r, 2, 9)
    const bA = int(r, 0, 25); let bB = bA
    while (bB === bA) bB = int(r, 0, 25)
    const H = bA > bB ? 'A' : 'B', F = mA > mB ? 'A' : 'B', o = (s: string) => (s === 'A' ? 'B' : 'A')
    const T1 = (p: string) => `Function ${p} starts higher and grows faster`, T2 = (p: string) => `Function ${p} starts higher, but function ${o(p)} grows faster`
    const right = H === F ? T1(H) : T2(H), wrong = H === F ? [T2(H), T1(o(H))] : [T1(H), T1(F)]
    const ys = [0, 1, 2, 3].map(x => mB * x + bB)
    return { text: `Function A is ${rule(mA, bA)}. Function B is the table. Which one is true?`, picture: io([0, 1, 2, 3], ys, 'x', 'B: y'),
      answer: choose(r, right, wrong),
      steps: [`At x = 0, function A is ${bA} and function B is ${bB}, so function ${H} starts higher.`,
        `Function A goes up ${mA} for each 1 in x and function B goes up ${mB}, so function ${F} grows faster. The true one is: ${right}.`] }
  }),
  lv('uneven x steps: how much faster', r => {
    const mA = int(r, 2, 9); let mB = mA
    while (mB === mA) mB = int(r, 2, 9)
    const s = pick(r, [2, 3, 5]), xs = [0, 1, 2, 3].map(k => k * s), bA = int(r, 0, 20), bB = int(r, 0, 20), ys = xs.map(x => mB * x + bB), ans = Math.abs(mA - mB)
    return { text: `Function A is ${rule(mA, bA)}. Function B is the table. For each 1 in x, how much more does the faster one go up? Type the number.`,
      picture: io(xs, ys, 'x', 'B: y'), answer: ans,
      steps: [`In the table x goes up ${s} each time and y goes up ${mB * s}, so function B goes up ${mB * s} ÷ ${s} = ${mB} for each 1 in x.`,
        `Function A goes up ${mA}. ${Math.max(mA, mB)} − ${Math.min(mA, mB)} = ${ans}, so the faster one goes up ${ans} more.`] }
  }),
  lv('story: a graph against a rule in words', r => {
    const mA = int(r, 1, 3), k = int(r, 2, 3), bA = int(r, 0, 10 - mA * k), same = r() < 0.25
    let mB = mA
    if (!same) while (mB === mA) mB = int(r, 1, 3)
    const bB = int(r, 0, 6), end = bA + mA * k
    const pts = Array.from({ length: k + 1 }, (_, x) => ({ x, y: bA + mA * x }))
    const ft = (n: number) => count(n, 'foot', 'feet'), SAMEP = 'They rise at the same rate'
    const right = same ? SAMEP : mA > mB ? 'Pool A' : 'Pool B', wrong = ['Pool A', 'Pool B', SAMEP].filter(c => c !== right)
    return { text: `Two pools are filling. The graph shows the feet of water in Pool A after x hours. Pool B starts with ${ft(bB)} of water and rises ${ft(mB)} each hour. Which pool's water rises faster?`,
      picture: { kind: 'coord', min: 0, max: 10, points: pts, lines: [{ a: [0, bA], b: [k, end] }] }, answer: choose(r, right, wrong),
      steps: [`On the graph Pool A goes from ${ft(bA)} at hour 0 to ${ft(end)} at hour ${k}: ${mA * k} ÷ ${k} = ${mA} each hour.`,
        same ? `Pool B also rises ${ft(mB)} each hour. So: ${SAMEP}.` : `Pool B rises ${ft(mB)} each hour. ${Math.max(mA, mB)} is more than ${Math.min(mA, mB)}, so ${right} rises faster.`] }
  }),
]

// ── t5 · Build a model from a story ─────────────────────────────────────────────────────────────────────────
const PAY = [
  { s: (m: number, b: number) => `A gym costs $${b} to join, plus $${m} each month.`, xs: 'months', xh: 'Months (x)', y: 'cost', yh: 'Cost (y)', dollars: true },
  { s: (m: number, b: number) => `A skating rink costs $${b} to join, plus $${m} for each visit.`, xs: 'visits', xh: 'Visits (x)', y: 'cost', yh: 'Cost (y)', dollars: true },
  { s: (m: number, b: number) => `A bowling alley charges $${b} for shoes, plus $${m} for each game.`, xs: 'games', xh: 'Games (x)', y: 'cost', yh: 'Cost (y)', dollars: true },
  { s: (m: number, b: number) => `A plumber charges $${b} to come out, plus $${m} for each hour.`, xs: 'hours', xh: 'Hours (x)', y: 'cost', yh: 'Cost (y)', dollars: true },
  { s: (m: number, b: number) => `Zoe has $${b} saved and adds $${m} each week.`, xs: 'weeks', xh: 'Weeks (x)', y: 'amount saved', yh: 'Saved (y)', dollars: false },
]
/** m and b that are different and both at least 2, so a swapped rule is always a different rule. */
const mb = (r: Rng, mHi = 15, bHi = 40) => { for (;;) { const m = int(r, 2, mHi), b = int(r, 2, bHi); if (m !== b) return { m, b } } }
const T5: Level[] = [
  lv('story: pick the rule', r => {
    const c = pick(r, PAY), { m, b } = mb(r), right = rule(m, b)
    return { text: `${c.s(m, b)} Which rule gives the ${c.y} y after x ${c.xs}?`, picture: io([0, 1, 2], [b, b + m, '?'], c.xh, c.yh),
      answer: choose(r, right, [rule(b, m), rule(m + b, 0), rule(m, -b)]),
      steps: [`${m} repeats each time, so it goes in front of x: ${m}x.`, `${b} is there once, at the start, so it is added on. The rule is ${right}.`] }
  }),
  lv('story: find m or b', r => {
    const c = pick(r, PAY), { m, b } = mb(r), askM = r() < 0.5
    return { text: `${c.s(m, b)} Write it as y = mx + b, where y is the ${c.y} and x is the number of ${c.xs}. What is ${askM ? 'm' : 'b'}? Type the number.`,
      picture: eq('y = mx + b'), answer: askM ? m : b,
      steps: [askM ? 'm is the amount that repeats, in front of x.' : 'b is the amount that is there once, added on.',
        `${m} repeats each time and ${b} is there once. So ${askM ? `m is ${m}` : `b is ${b}`}.`] }
  }),
  lv('spot the swap: is the rule right', r => {
    const c = pick(r, PAY), { m, b } = mb(r), name = pick(r, NAMES), kind = int(r, 0, 2)
    const good = rule(m, b), swap = rule(b, m), lump = rule(m + b, 0), wrote = [good, swap, lump][kind]
    const RIGHT = `${name} is right`, fix = (s: string) => `${name} is wrong: it should be ${s}`
    const right = kind === 0 ? RIGHT : fix(good), wrong = kind === 0 ? [fix(swap), fix(lump)] : kind === 1 ? [RIGHT, fix(lump)] : [RIGHT, fix(swap)]
    return { text: `${c.s(m, b)} ${name} wrote ${wrote} for the ${c.y} y after x ${c.xs}. Is ${name} right?`, picture: eq(`${name}: ${wrote}`),
      answer: choose(r, right, wrong),
      steps: [`The ${m} repeats, so it goes in front of x. The ${b} happens once, so it is added on: ${good}.`, `So the answer is: ${right}.`] }
  }),
  lv('use the model: the amount after some time', r => {
    if (r() < 0.6) {
      const c = pick(r, PAY), { m, b } = mb(r), n = int(r, 3, 12), y = m * n + b
      return { text: `${c.s(m, b)} What is the ${c.y} after ${n} ${c.xs}? Type the number.`, picture: io([0, n], [b, '?'], c.xh, c.yh), answer: y,
        steps: [`The rule is ${rule(m, b)}.`, `Put in ${n}: ${m} × ${n} = ${m * n}.`, `Then ${m * n} + ${b}, so the ${c.y} is ${fmt(y)}.`] }
    }
    for (;;) {
      const [s, xs, xh, yh, unit] = pick(r, [
        ['A water tank holds B gallons. It drains M gallons every hour.', 'hours', 'Hours (x)', 'Gallons (y)', 'gallons'],
        ['A phone battery is at B percent. It drops M percent every hour.', 'hours', 'Hours (x)', 'Percent (y)', 'percent'],
      ] as const)
      const m = int(r, 2, 15), b = unit === 'percent' ? 100 : int(r, 10, 30) * 10, n = int(r, 2, 9), y = b - m * n
      if (y <= 0) continue
      return { text: `${s.replace('B', String(b)).replace('M', String(m))} How many ${unit} are left after ${n} ${xs}? Type the number.`, picture: io([0, n], [b, '?'], xh, yh), answer: y,
        steps: [`It starts at ${b} and loses ${m} each hour: ${rule(-m, b)}.`, `After ${n} hours, ${m} × ${n} = ${m * n} are gone.`, `${b} − ${m * n}, so ${fmt(y)} ${unit} are left.`] }
    }
  }),
  lv('work backwards: how many times for a total', r => {
    const c = pick(r, PAY), { m, b } = mb(r), n = int(r, 3, 24), y = m * n + b
    return { text: `${c.s(m, b)} After how many ${c.xs} is the ${c.y} ${fmt(y)}? Type the number.`, picture: io([0, 1, '?'], [b, b + m, y], c.xh, c.yh), answer: n,
      steps: [`The rule is ${rule(m, b)}, and y is ${fmt(y)}.`, `Take off the ${b} that happens once: ${fmt(y)} − ${b} = ${fmt(y - b)}.`, `Then ${fmt(y - b)} ÷ ${m} = ${n}. So it is after ${n} ${c.xs}.`] }
  }),
]

// ── t6 · Read a graph's story ───────────────────────────────────────────────────────────────────────────────
type Piece = 'up' | 'down' | 'flat'
const CH = ['increasing', 'decreasing', 'not changing']
const WORD: Record<Piece, string> = { up: 'increasing', down: 'decreasing', flat: 'not changing' }
const graph = (pts: [number, number][]): Picture => ({ kind: 'coord', min: 0, max: 10, lines: pts.slice(1).map((b, i) => ({ a: pts[i], b })) })
/** A path of pieces, each 1–`runHi` hours long, that stays inside the 0–10 grid. */
const walk = (r: Rng, types: Piece[], runHi = 3): [number, number][] => {
  for (;;) {
    let x = 0, y = int(r, 0, 10), ok = true
    const pts: [number, number][] = [[x, y]]
    for (const t of types) {
      x += int(r, 1, runHi); y += t === 'flat' ? 0 : int(r, 1, 5) * (t === 'up' ? 1 : -1)
      if (x > 10 || y < 0 || y > 10) { ok = false; break }
      pts.push([x, y])
    }
    if (ok) return pts
  }
}
/** n pieces in a row, no two neighbours the same kind. */
const kinds = (r: Rng, n: number): Piece[] => {
  const out: Piece[] = [pick(r, ['up', 'down', 'flat'] as const)]
  while (out.length < n) out.push(pick(r, (['up', 'down', 'flat'] as const).filter(k => k !== out.at(-1))))
  return out
}
const miles = (n: number) => count(n, 'mile', 'miles')
const T6: Level[] = [
  lv('one piece: increasing, decreasing or not changing', r => {
    const name = pick(r, NAMES), ts = kinds(r, int(r, 3, 4)), pts = walk(r, ts, 3), i = int(r, 0, ts.length - 1)
    const [[a, ya], [b, yb]] = [pts[i], pts[i + 1]], right = WORD[ts[i]]
    return { text: `The graph shows how many miles ${name} is from home. Along the bottom is hours. What is the distance doing between hour ${a} and hour ${b}?`,
      picture: graph(pts), answer: choose(r, right, CH.filter(c => c !== right)),
      steps: [`Find hour ${a} and hour ${b} along the bottom.`, ts[i] === 'flat' ? `Between them the graph is flat at ${miles(ya)}. So the distance is ${right}.`
        : `Between them the graph goes ${ts[i]}, from ${miles(ya)} to ${miles(yb)}. So the distance is ${right}.`] }
  }),
  lv('find the flat piece among three', r => {
    const ts = shuffle(r, ['flat', pick(r, ['up', 'down'] as const), pick(r, ['up', 'down'] as const)] as Piece[])
    const pts = walk(r, ts, 3), label = (i: number) => `hour ${pts[i][0]} to ${pts[i + 1][0]}`, f = ts.indexOf('flat'), right = label(f)
    return { text: 'The graph shows miles from home. During which hours did the distance not change?', picture: graph(pts),
      answer: choose(r, right, [0, 1, 2].filter(i => i !== f).map(label)),
      steps: [`Read the pieces left to right: ${ts.map((t, i) => `${label(i)} ${t === 'flat' ? 'is flat' : `goes ${t}`}`).join(', ')}.`, `Flat means not changing, so the answer is ${right}.`] }
  }),
  lv('what a piece means: distance, not a hill', r => {
    const name = pick(r, NAMES), ts = kinds(r, 3), pts = walk(r, ts, 3), i = int(r, 0, 2), [a, b] = [pts[i][0], pts[i + 1][0]]
    const AWAY = `${name} is riding away from home`, BACK = `${name} is getting closer to home`, STOP = `${name} has stopped: the distance is not changing`
    const t = ts[i]
    const right = t === 'up' ? AWAY : t === 'down' ? BACK : STOP
    const wrong = t === 'up' ? [`${name} is riding up a hill`, BACK] : t === 'down' ? [`${name} is riding down a hill`, AWAY] : [AWAY, BACK]
    return { text: `The graph shows how far ${name} is from home on a bike ride. What does the piece from hour ${a} to hour ${b} tell you?`, picture: graph(pts),
      answer: choose(r, right, wrong),
      steps: [`The graph shows distance from home, not the shape of the road.`, `From hour ${a} to hour ${b} it ${t === 'flat' ? 'is flat' : `goes ${t}`}, so: ${right}.`] }
  }),
  lv('steepest piece: where it changes fastest', r => {
    const up = r() < 0.5, RUNS = [1, 2, 4]
    for (;;) {
      const runs = [pick(r, RUNS), pick(r, RUNS), pick(r, RUNS)], rises = runs.map(n => int(r, 1, 2 * n + 1))
      const rates = rises.map((d, k) => clean(d / runs[k])), tot = rises.reduce((s, v) => s + v, 0), len = runs.reduce((s, v) => s + v, 0)
      if (new Set(rates).size < 3 || tot > 10 || len > 10) continue
      let x = 0, y = up ? int(r, 0, 10 - tot) : int(r, tot, 10)
      const pts: [number, number][] = [[x, y]]
      runs.forEach((n, k) => { x += n; y += up ? rises[k] : -rises[k]; pts.push([x, y]) })
      const label = (i: number) => `hour ${pts[i][0]} to ${pts[i + 1][0]}`, f = rates.indexOf(Math.max(...rates)), right = label(f)
      return { text: `The graph shows miles from home. During which part is the distance ${up ? 'growing' : 'shrinking'} fastest?`, picture: graph(pts),
        answer: choose(r, right, [0, 1, 2].filter(i => i !== f).map(label)),
        steps: [`Find the miles for each hour: ${runs.map((n, k) => `${label(k)} ${up ? 'climbs' : 'drops'} ${miles(rises[k])} in ${count(n, 'hour', 'hours')}, ${fmt(rates[k])} each hour`).join('; ')}.`,
          `The steepest piece is ${right}.`] }
    }
  }),
  lv('story: read the rate of one piece from the graph', r => {
    const name = pick(r, NAMES)
    const c = pick(r, [
      { s: `The graph shows how many miles ${name} is from home on a bike ride. Along the bottom is hours.`, up: 'riding away from home', down: 'riding back home',
        q: (w: string) => `While ${name} is ${w}, how many miles does ${name} ride each hour?`, unit: 'miles', each: 'hour' },
      { s: 'The graph shows the gallons of water in a sink. Along the bottom is minutes.', up: 'filling', down: 'draining',
        q: (w: string) => `While the sink is ${w}, how many gallons does the water go ${w === 'draining' ? 'down' : 'up'} each minute?`, unit: 'gallons', each: 'minute' },
    ])
    for (;;) {
      const u = int(r, 2, 4), ru = int(r, 1, 3), f = int(r, 1, 2), d = int(r, 2, 4), rd = int(r, 1, 3), peak = u * ru
      if (peak > 10 || d * rd > peak || u + f + d > 10) continue
      const pts: [number, number][] = [[0, 0], [u, peak], [u + f, peak], [u + f + d, peak - d * rd]]
      const down = r() < 0.5, [x0, x1] = down ? [u + f, u + f + d] : [0, u], rate = down ? rd : ru, change = down ? d * rd : peak
      return { text: `${c.s} ${c.q(down ? c.down : c.up)} Type the number.`, picture: graph(pts), answer: rate,
        steps: [`${down ? 'Going down' : 'Going up'} is the piece from ${c.each} ${x0} to ${c.each} ${x1}, where the graph ${down ? 'drops' : 'climbs'} ${change} ${c.unit}.`,
          `That is ${change} ${c.unit} in ${x1 - x0} ${c.each}s, so ${change} ÷ ${x1 - x0} = ${rate} each ${c.each}.`] }
    }
  }),
]

export const G8M3_LADDERS: Record<string, Level[]> = {
  'g8m3-t1': T1,
  'g8m3-t2': T2,
  'g8m3-t3': T3,
  'g8m3-t4': T4,
  'g8m3-t5': T5,
  'g8m3-t6': T6,
}
