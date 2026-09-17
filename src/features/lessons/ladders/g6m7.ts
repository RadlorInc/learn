/**
 * Grade 6 · Module 7 — Data analysis and probability. Practice ladders, easiest style first (see ../adaptive.ts and the
 * reference ladders in ./g5m1.ts, ./g6m3.ts).
 * ⚠️ Every level runs through `lv`, which re-rolls a problem whose picture prints its own answer (the gate's reader: a
 * label, or a list of labels joined up) or whose choices repeat. So a median or mode that is itself a data value is
 * never put in a table when it could be 10 or more — those levels draw dots on a line, or keep the values single-digit.
 */
import type { Picture, Problem } from '../script'
import { int, pick, shuffle, fmt, type Level, type Rng } from '../adaptive'

const clean = (x: number) => Math.round(x * 1e6) / 1e6
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const asc = (xs: number[]) => [...xs].sort((a, b) => a - b)
const csv = (xs: (number | string)[]) => xs.map(x => (typeof x === 'number' ? fmt(x) : x)).join(', ')
/** 3, 7 and 4 */
const and = (xs: (number | string)[]) => { const s = xs.map(x => (typeof x === 'number' ? fmt(x) : x)); return `${s.slice(0, -1).join(', ')} and ${s.at(-1)}` }
const plus = (xs: number[]) => xs.map(fmt).join(' + ')
const pl = (k: number, one: string, many = `${one}s`) => `${fmt(k)} ${k === 1 ? one : many}`
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
const reduce = (a: number, b: number): [number, number] => { const g = gcd(a, b) || 1; return [a / g, b / g] }
const NAMES = ['Leo', 'Mia', 'Sam', 'Ava', 'Kai', 'Nina', 'Ben', 'Zoe', 'Jay', 'Lily']
const names = (r: Rng, k: number) => shuffle(r, NAMES).slice(0, k)
/** k different whole numbers from lo to hi. */
const distinctInts = (r: Rng, k: number, lo: number, hi: number) => shuffle(r, Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)).slice(0, k)
const choose = (r: Rng, right: string, wrong: string[]) => { const choices = shuffle(r, [right, ...wrong]); return { choices, correct: choices.indexOf(right) } }

const eq = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })
const row = (values: (string | number)[], head?: string[]): Picture =>
  head ? { kind: 'table', head, rows: [['', ...values.map(String)]], rowHead: true } : { kind: 'table', rows: [values.map(String)] }
const dotsOn = (max: number, ticks: number, pts: number[]): Picture => ({ kind: 'numline', min: 0, max, ticks, points: pts.map(at => ({ at })) })

// ── The reveal guard (mirrors the gate's reader) ─────────────────────────────────────────────────────────────────
const labelsOf = (pic: unknown): string[] => {
  const t: string[] = []
  const w = (v: unknown) => {
    if (typeof v === 'string') t.push(v)
    else if (Array.isArray(v)) { if (v.length && v.every(x => typeof x === 'string')) t.push(v.join('')); v.forEach(w) }
    else if (v && typeof v === 'object') Object.values(v).forEach(w)
  }
  w(pic)
  return t
}
const bad = (p: Problem, dataShown: boolean) => {
  const a = p.answer!, labels = labelsOf(p.picture)
  if (typeof a === 'number') return !dataShown && Math.abs(a) >= 10 && labels.some(s => (s.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).some(x => x.replace(/,/g, '') === String(Math.abs(a))))
  if (typeof a === 'object' && 'choices' in a) return new Set(a.choices).size !== a.choices.length || wholeWord(labels, a.choices[a.correct])
  return false
}
/** Whole words only, as the gate reads it: "likely" is not shown by "unlikely" (but it is by "equally likely"). */
const wholeWord = (labels: string[], choice: string) => {
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])${choice.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\p{L}\\p{N}])`, 'u')
  return labels.some(t => re.test(t))
}
/** `dataShown`: the picture IS the data the answer is read from (a median or mode of the values drawn), so the answer
 *  appearing among those values is not a reveal. Only on chart/table/numline pictures. */
const lv = (style: string, make: (r: Rng) => Problem, dataShown = false): Level => ({
  style, ...(dataShown ? { dataShown: true as const } : {}),
  make: r => { let p = make(r); for (let i = 0; i < 50 && bad(p, dataShown); i++) p = make(r); return p },
})

// ── t1 · Mean: share it out fairly ───────────────────────────────────────────────────────────────────────────
/** n values from lo to hi (not all the same) whose total shares out to a whole number. */
const meanSet = (r: Rng, n: number, lo: number, hi: number) => {
  for (;;) {
    const xs = Array.from({ length: n }, () => int(r, lo, hi)), t = sum(xs)
    if (t % n === 0 && new Set(xs).size > 1) return { xs, t, m: t / n }
  }
}
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

const T1: Level[] = [
  lv('towers on a bar graph, share them fairly', r => {
    const n = int(r, 3, 5), { xs, t, m } = meanSet(r, n, 2, 9)
    return { text: `${n} friends built towers of cubes. If they share the cubes fairly, how many cubes are in each tower?`,
      picture: { kind: 'chart', type: 'bar', labels: LETTERS.slice(0, n), values: xs, max: Math.max(...xs), yLabel: 'Cubes' }, answer: m,
      steps: [`Put all the cubes together: ${plus(xs)} = ${t}.`, `There are ${n} towers, so share ${t} into ${n} equal towers.`, `${t} ÷ ${n} = ${m}. So each tower has ${pl(m, 'cube')}.`] }
  }),
  lv('bare list, find the mean', r => {
    const n = int(r, 4, 6), { xs, t, m } = meanSet(r, n, 10, 40)
    return { text: `What is the mean of ${and(xs)}?`, picture: row(xs), answer: m,
      steps: [`Add them all: ${plus(xs)} = ${t}.`, `There are ${n} numbers, so divide by ${n}.`, `${t} ÷ ${n} = ${m}. So the mean is ${m}.`] }
  }),
  lv('pick the way that finds the mean (not ÷ 2, not ÷ the biggest, not the total)', r => {
    // Every decoy divides by the wrong thing (2, the biggest value, one too few or one too many) — never a bare true sum.
    let n = 0, xs: number[] = [], t = 0, m = 0, wrong: string[] = []
    do {
      n = int(r, 4, 5); ({ xs, t, m } = meanSet(r, n, 3, 12))
      const mx = Math.max(...xs)
      wrong = [...new Set([2, mx, n - 1, n + 1])].filter(d => d !== n && Number.isInteger(t / d)).map(d => `${t} ÷ ${d} = ${t / d}`)
    } while (wrong.length < 2)
    const right = `${t} ÷ ${n} = ${m}`
    return { text: `Which one finds the mean of ${and(xs)}?`, picture: row(xs), answer: choose(r, right, wrong),
      steps: ['The mean is the total shared by how many numbers there are.', `The total is ${t}, and there are ${n} numbers.`, `So the right one is ${right}.`] }
  }),
  lv('missing value for a given mean, work backwards', r => {
    for (;;) {
      const n = int(r, 4, 5), m = int(r, 8, 20)
      const known = Array.from({ length: n - 1 }, () => m + int(r, -6, 6)), s = sum(known), x = m * n - s
      if (x < 1 || x > 30 || Math.abs(x - m) > 12) continue
      return { text: `The mean of ${n} quiz scores is ${m}. ${n - 1} of the scores are ${and(known)}. What is the missing score?`,
        picture: row([...known, '?'], ['Quiz', ...Array.from({ length: n }, (_, i) => String(i + 1))]), answer: x,
        steps: [`The mean is ${m} and there are ${n} scores, so they must add to ${m} × ${n} = ${m * n}.`, `The ${n - 1} scores you know add to ${plus(known)} = ${s}.`, `${m * n} − ${s} = ${x}. So the missing score is ${x}.`] }
    }
  }),
  lv('two players, compare their means', r => {
    for (;;) {
      const [A, B] = names(r, 2), nA = int(r, 3, 5), nB = int(r, 3, 5)
      const a = meanSet(r, nA, 4, 20), b = meanSet(r, nB, 4, 20)
      if (a.m === b.m) continue
      const [hi, lo] = a.m > b.m ? [a.m, b.m] : [b.m, a.m], d = hi - lo, w = Math.max(nA, nB)
      const pad = (xs: number[]) => [...xs.map(String), ...Array(w - xs.length).fill('')]
      return { text: `${A} scored ${and(a.xs)} points in ${nA} games. ${B} scored ${and(b.xs)} points in ${nB} games. How many points higher is the bigger mean score?`,
        picture: { kind: 'table', rows: [[A, ...pad(a.xs)], [B, ...pad(b.xs)]], rowHead: true }, answer: d,
        steps: [`${A}: ${plus(a.xs)} = ${a.t}, and ${a.t} ÷ ${nA} = ${a.m}.`, `${B}: ${plus(b.xs)} = ${b.t}, and ${b.t} ÷ ${nB} = ${b.m}.`, `${hi} − ${lo} = ${d}. So the bigger mean is ${pl(d, 'point')} higher.`] }
    }
  }),
]

// ── t2 · Median: the middle ─────────────────────────────────────────────────────────────────────────────────
const T2: Level[] = [
  lv('dots on a number line, read the middle one', r => {
    const n = pick(r, [5, 7]), xs = distinctInts(r, n, 1, 19), s = asc(xs), med = s[(n - 1) / 2]
    return { text: `The dots show how tall ${n} seedlings are, in inches. What is the middle height?`, picture: dotsOn(20, 20, xs), answer: med,
      steps: [`Read the dots from left to right: ${csv(s)}.`, 'Cross off one from each end until only one is left.', `The one left is ${med}. So the middle height is ${med} inches.`] }
  }),
  lv('jumbled list with an odd count, sort first', r => {
    for (;;) {
      const n = pick(r, [5, 7]), xs = distinctInts(r, n, 60, 100), s = asc(xs), mid = (n - 1) / 2, med = s[mid]
      if (xs[mid] === med) continue
      return { text: `${n} students scored ${and(xs)} on a test. What is the median score?`, picture: row(xs), answer: med,
        steps: [`Sort them: ${csv(s)}.`, `There are ${n} numbers, so the middle one is number ${mid + 1}.`, `It is ${med}. So the median is ${med}.`] }
    }
  }, true),
  lv('even count, halfway between the two middles', r => {
    const n = pick(r, [4, 6]), xs = distinctInts(r, n, 1, 30), s = asc(xs), a = s[n / 2 - 1], b = s[n / 2], med = clean((a + b) / 2)
    return { text: `What is the median of these ${n} numbers?`, picture: row(xs), answer: med,
      steps: [`Sort them: ${csv(s)}.`, `Two numbers share the middle: ${a} and ${b}.`, `(${a} + ${b}) ÷ 2 = ${fmt(med)}. So the median is ${fmt(med)}.`] }
  }),
  lv('three friends, who found the median', r => {
    for (;;) {
      const xs = distinctInts(r, 5, 1, 30), s = asc(xs), med = s[2], spot = xs[2], half = clean((s[0] + s[4]) / 2)
      if (new Set([med, spot, half]).size < 3) continue
      const [K1, K2, K3] = names(r, 3)
      const said = shuffle(r, [
        `${K1} sorted the numbers first and got ${med}.`,
        `${K2} took the number in the middle spot of the list and got ${spot}.`,
        `${K3} went halfway between the smallest and the biggest and got ${fmt(half)}.`,
      ])
      return { text: `Three friends found the median of ${and(xs)}. ${said.join(' ')} Who is right?`, picture: row(xs),
        answer: choose(r, K1, [K2, K3]),
        steps: [`Sort the numbers first: ${csv(s)}.`, `Cross off two from each end. The one left is ${med}.`, `So ${K1} is right.`] }
    }
  }),
  lv('median from a dot plot, count to the middle ✕', r => {
    const ctx = pick(r, [
      { x: 'Pets', intro: 'kids marked how many pets they have', start: 0 },
      { x: 'Books', intro: 'kids marked how many books they read this month', start: 1 },
      { x: 'Goals', intro: 'kids marked how many goals they scored this week', start: 0 },
    ])
    for (;;) {
      const values = Array.from({ length: 6 }, () => int(r, 0, 5)), total = sum(values)
      if (total % 2 === 0 || total < 9) continue
      const labels = values.map((_, i) => String(ctx.start + i)), k = (total + 1) / 2
      let run = 0, at = 0
      const said: string[] = []
      for (; at < values.length; at++) { run += values[at]; said.push(`${labels[at]} has ${values[at]} (${run} so far)`); if (run >= k) break }
      const med = +labels[at]
      return { text: `${total} ${ctx.intro}. Each ✕ is one kid. What is the median?`,
        picture: { kind: 'chart', type: 'dot', labels, values, xLabel: ctx.x }, answer: med,
        steps: [`There are ${total} ✕s, so the middle one is number ${k}.`, `Count the ✕s from the left: ${said.join(', ')}.`, `Number ${k} is in the stack above ${med}. So the median is ${med}.`] }
    }
  }),
]

// ── t3 · Mode: the most common ──────────────────────────────────────────────────────────────────────────────
/** Counts for k categories with one tallest stack; `second` is the index of a next-tallest stack. */
const stacks = (r: Rng, k: number, lo: number, hi: number) => {
  for (;;) {
    const v = Array.from({ length: k }, () => int(r, lo, hi)), top = Math.max(...v)
    if (v.filter(x => x === top).length !== 1) continue
    const i = v.indexOf(top), rest = v.filter((_, j) => j !== i), next = Math.max(...rest)
    return { v, i, top, second: v.findIndex((x, j) => j !== i && x === next) }
  }
}
const DOT_CTX = [
  { x: 'Brothers and sisters', intro: 'Kids said how many brothers and sisters they have.', start: 0 },
  { x: 'Books', intro: 'Kids marked how many books they read this month.', start: 1 },
  { x: 'Goals', intro: 'Kids marked how many goals they scored this week.', start: 0 },
  { x: 'Shoe size', intro: 'Kids marked their shoe size.', start: 4 },
]
/** A list of single digits with one number showing up most often. */
const modeList = (r: Rng, len: number, lo = 1) => {
  const m = int(r, lo, lo + 8), cnt = int(r, 3, 4), xs = Array(cnt).fill(m), others = shuffle(r, Array.from({ length: 9 }, (_, i) => lo + i).filter(x => x !== m))
  for (let j = 0; xs.length < len; j++) xs.push(others[j % others.length], ...(xs.length + 1 < len && r() < 0.4 ? [others[j % others.length]] : []))
  const list = shuffle(r, xs.slice(0, len))
  const counts = new Map<number, number>()
  list.forEach(x => counts.set(x, (counts.get(x) ?? 0) + 1))
  const best = Math.max(...counts.values())
  return { list, m, cnt: counts.get(m)!, ok: counts.get(m) === best && [...counts.values()].filter(c => c === best).length === 1, other: Math.max(...[...counts].filter(([x]) => x !== m).map(([, c]) => c)) }
}

const T3: Level[] = [
  lv('dot plot, tallest stack', r => {
    const ctx = pick(r, DOT_CTX), { v, i, top } = stacks(r, 5, 0, 6)
    const labels = v.map((_, j) => String(ctx.start + j)), mode = +labels[i]
    return { text: `${ctx.intro} Each ✕ is one kid. Which number is the most common?`,
      picture: { kind: 'chart', type: 'dot', labels, values: v, xLabel: ctx.x }, answer: mode,
      steps: ['Each ✕ is one kid. Find the tallest stack.', `The stack above ${mode} has ${top} ✕s, more than any other.`, `So the most common number is ${mode}.`] }
  }),
  lv('table of how many, find the mode', r => {
    const ctx = pick(r, [
      { head: 'Shoe size', start: 4, what: 'how many kids in a class wear each shoe size' },
      { head: 'Pets', start: 0, what: 'how many kids have each number of pets' },
      { head: 'Siblings', start: 0, what: 'how many kids have each number of brothers and sisters' },
    ])
    const { v, i, top } = stacks(r, 5, 1, 9), cats = v.map((_, j) => String(ctx.start + j)), mode = +cats[i]
    return { text: `The table shows ${ctx.what}. What is the mode?`,
      picture: { kind: 'table', head: [ctx.head, ...cats], rows: [['Kids', ...v.map(String)]], rowHead: true }, answer: mode,
      steps: [`Find the biggest number of kids in the table: ${top}.`, `Those ${top} kids are under ${mode}.`, `So the mode is ${mode}, not ${top}.`] }
  }),
  lv('jumbled list, count how often each shows up', r => {
    for (;;) {
      const { list, m, cnt, ok, other } = modeList(r, int(r, 9, 11), 6)
      if (!ok) continue
      return { text: 'Kids at a camp wrote down their ages. What is the mode?', picture: row(list), answer: m,
        steps: [`${m} shows up ${cnt} times.`, `Every other age shows up ${pl(other, 'time')} or fewer.`, `So the mode is ${m}.`] }
    }
  }, true),
  lv('pick the true sentence (the number under the stack, not its height)', r => {
    for (;;) {
      const ctx = pick(r, DOT_CTX), { v, i, top, second } = stacks(r, 5, 1, 7)
      const labels = v.map((_, j) => String(ctx.start + j)), mode = +labels[i], other = +labels[second]
      if (top === mode || top === other) continue
      const right = `The mode is ${mode}.`
      return { text: `${ctx.intro} Each ✕ is one kid. Which sentence is true?`,
        picture: { kind: 'chart', type: 'dot', labels, values: v, xLabel: ctx.x },
        answer: choose(r, right, [`The mode is ${top}.`, `The mode is ${other}.`]),
        steps: [`The tallest stack has ${top} ✕s, and it sits above ${mode}.`, 'The mode is the number under the tallest stack, not how tall the stack is.', `So the true sentence is: ${right}`] }
    }
  }),
  lv('two classes, how far apart are their modes', r => {
    for (;;) {
      const a = modeList(r, 7), b = modeList(r, 7)
      if (!a.ok || !b.ok || a.m === b.m) continue
      const d = Math.abs(a.m - b.m)
      return { text: 'Two classes listed how many pets each kid has. What is the difference between the two classes\' modes?',
        picture: { kind: 'table', rows: [['Class A', ...a.list.map(String)], ['Class B', ...b.list.map(String)]], rowHead: true }, answer: d,
        steps: [`Class A: ${a.m} shows up most, ${a.cnt} times. So its mode is ${a.m}.`, `Class B: ${b.m} shows up most, ${b.cnt} times. So its mode is ${b.m}.`, `${Math.max(a.m, b.m)} − ${Math.min(a.m, b.m)} = ${d}. So the difference is ${d}.`] }
    }
  }),
]

// ── t4 · Range: the spread ──────────────────────────────────────────────────────────────────────────────────
const T4: Level[] = [
  lv('dots on a number line, biggest minus smallest', r => {
    const [name] = names(r, 1), n = int(r, 5, 6), xs = distinctInts(r, n, 1, 20), mn = Math.min(...xs), mx = Math.max(...xs)
    return { text: `The dots show ${name}'s points in ${n} basketball games. What is the biggest score minus the smallest?`, picture: dotsOn(20, 20, xs), answer: mx - mn,
      steps: [`The dot farthest left is the smallest score, ${mn}.`, `The dot farthest right is the biggest score, ${mx}.`, `${mx} − ${mn} = ${mx - mn}. So the spread is ${pl(mx - mn, 'point')}.`] }
  }),
  lv('jumbled list, find the range', r => {
    const n = int(r, 5, 7), xs = distinctInts(r, n, 20, 99), mn = Math.min(...xs), mx = Math.max(...xs)
    return { text: 'What is the range of these numbers?', picture: row(xs), answer: mx - mn,
      steps: [`The smallest is ${mn}.`, `The biggest is ${mx}.`, `${mx} − ${mn} = ${mx - mn}. So the range is ${mx - mn}.`] }
  }),
  lv('fix the last-minus-first slip', r => {
    for (;;) {
      const [name] = names(r, 1), xs = distinctInts(r, 5, 5, 50), mn = Math.min(...xs), mx = Math.max(...xs)
      const f = xs[0], l = xs[4], slip = Math.abs(l - f), rg = mx - mn
      if (slip === rg) continue
      return { text: `${name} says the range of ${and(xs)} is ${slip}, because ${Math.max(f, l)} − ${Math.min(f, l)} = ${slip}. What is the range really?`,
        picture: row(xs), answer: rg,
        steps: [`${name} used the first and last numbers in the list, not the two ends.`, `The smallest is ${mn} and the biggest is ${mx}.`, `${mx} − ${mn} = ${rg}. So the range is ${rg}.`] }
    }
  }),
  lv('missing end for a given range, work backwards', r => {
    for (;;) {
      const known = distinctInts(r, 4, 10, 40), R = int(r, 15, 35), mn = Math.min(...known), mx = Math.max(...known), big = r() < 0.5
      const x = big ? mn + R : mx - R
      if (big ? x <= mx : x >= mn || x < 1) continue
      const at = int(r, 0, 4), shown: (number | string)[] = [...known]
      shown.splice(at, 0, '?')
      return { text: `The range of these 5 scores is ${R}. The missing score is the ${big ? 'biggest' : 'smallest'} one. What is it?`,
        picture: row(shown, ['Game', '1', '2', '3', '4', '5']), answer: x,
        steps: big
          ? [`The smallest score you can see is ${mn}.`, `The biggest must be ${R} more than the smallest.`, `${mn} + ${R} = ${x}. So the missing score is ${x}.`]
          : [`The biggest score you can see is ${mx}.`, `The smallest must be ${R} less than the biggest.`, `${mx} − ${R} = ${x}. So the missing score is ${x}.`] }
    }
  }),
  lv('two players, whose games are more spread out and by how much', r => {
    for (;;) {
      const [A, B] = names(r, 2), a = distinctInts(r, 5, 2, 30), b = distinctInts(r, 5, 2, 30)
      const ra = Math.max(...a) - Math.min(...a), rb = Math.max(...b) - Math.min(...b)
      if (ra === rb) continue
      const d = Math.abs(ra - rb)
      return { text: `${A} scored ${and(a)} points. ${B} scored ${and(b)} points. How much bigger is the larger range?`,
        picture: { kind: 'table', rows: [[A, ...a.map(String)], [B, ...b.map(String)]], rowHead: true }, answer: d,
        steps: [`${A}: ${Math.max(...a)} − ${Math.min(...a)} = ${ra}.`, `${B}: ${Math.max(...b)} − ${Math.min(...b)} = ${rb}.`, `${Math.max(ra, rb)} − ${Math.min(ra, rb)} = ${d}. So the larger range is ${d} bigger.`] }
    }
  }),
]

// ── t5 · Which middle fits best? ────────────────────────────────────────────────────────────────────────────
const CTX5 = [
  { intro: (s: string) => `Five kids get ${s} a week.`, money: true, unit: '' },
  { intro: (s: string) => `It takes five kids ${s} to get to school.`, money: false, unit: ' minutes' },
  { intro: (s: string) => `Five plants are ${s} tall.`, money: false, unit: ' inches' },
]
/** Four values huddled together and one far away; the mean comes out whole and at least 3 from the median. */
const party = (r: Rng) => {
  const ctx = pick(r, CTX5)
  for (;;) {
    const high = r() < 0.6, c = high ? int(r, 5, 25) : int(r, 18, 30)
    const group = Array.from({ length: 4 }, () => c + int(r, -2, 2)), out = high ? c + int(r, 20, 40) : int(r, 1, 4)
    const xs = shuffle(r, [...group, out]), t = sum(xs), s = asc(xs), med = s[2]
    if (t % 5 !== 0) continue
    const mean = t / 5
    if (Math.abs(mean - med) < 3) continue
    const top = Math.max(...xs), mx = Math.ceil(top / 10) * 10
    const say = (n: number) => (ctx.money ? `$${n}` : `${n}`)
    const listed = ctx.money ? and(xs.map(say)) : `${and(xs)}${ctx.unit}`
    return { ctx, xs, t, s, med, mean, out, high, say, text: ctx.intro(listed), line: dotsOn(mx, mx / (mx <= 50 ? 5 : 10), xs) }
  }
}

const T5: Level[] = [
  lv('mean and median given, pick the one that fits', r => {
    const { text, med, mean, out, high, say, line } = party(r)
    const right = `the median, ${say(med)}`
    return { text: `${text} The mean is ${say(mean)} and the median is ${say(med)}. Which one number describes them best?`, picture: line,
      answer: choose(r, right, [`the mean, ${say(mean)}`, `the ${high ? 'biggest' : 'smallest'}, ${say(out)}`]),
      steps: [`The ${say(out)} sits far from the others.`, `It pulls the mean to ${say(mean)}, but most of them are close to ${say(med)}.`, `So pick ${right}.`] }
  }),
  lv('which way does the far number pull the mean', r => {
    const { text, med, out, high, say, line } = party(r), dir = high ? 'up' : 'down'
    return { text: `${text} Which way does the ${say(out)} pull the mean?`, picture: line,
      answer: { choices: ['up', 'down', 'it does not move'], correct: high ? 0 : 1 },
      steps: [`Most of them are close to ${say(med)}.`, `The ${say(out)} is far ${high ? 'above' : 'below'} them, so it drags the total ${dir}.`, `So the ${say(out)} pulls the mean ${dir}.`] }
  }),
  lv('find the mean, far number and all', r => {
    const { text, xs, t, mean, say } = party(r)
    return { text: `${text} What is the mean?`, picture: row(xs.map(say)), answer: mean,
      steps: [`Add all five: ${plus(xs)} = ${t}.`, `There are 5 of them, so divide by 5.`, `${t} ÷ 5 = ${mean}. So the mean is ${mean}.`] }
  }),
  lv('pick the middle AND the reason', r => {
    const { text, out, high, say, line } = party(r), dir = high ? 'up' : 'down', wrongDir = high ? 'down' : 'up'
    const right = `The median, because the ${say(out)} pulls the mean ${dir}.`
    return { text: `${text} Which middle describes them best, and why?`, picture: line,
      answer: choose(r, right, ['The mean, because it uses every number.', `The median, because the ${say(out)} pulls the mean ${wrongDir}.`]),
      steps: [`The ${say(out)} sits far ${high ? 'above' : 'below'} the others.`, `It pulls the mean ${dir}, but the median barely moves.`, `So the answer is: ${right}`] }
  }),
  lv('how far apart the mean and median are (two-step)', r => {
    const { text, xs, t, s, med, mean, out, say } = party(r), gap = Math.abs(mean - med)
    return { text: `${text} How far apart are the mean and the median?`, picture: row(xs.map(say)), answer: gap,
      steps: [`Mean: ${plus(xs)} = ${t}, and ${t} ÷ 5 = ${mean}. Median: sort them, ${csv(s)}, and the middle one is ${med}.`, `Take the smaller from the bigger: ${Math.max(mean, med)} − ${Math.min(mean, med)}.`, `That is ${gap}. The ${say(out)} pulled the mean ${gap} away from the median.`] }
  }),
]

// ── t6 · Dot plots and histograms ───────────────────────────────────────────────────────────────────────────
const DOTS6 = [
  { x: 'Books', intro: 'Kids marked how many books they read this month.', verb: 'read', noun: 'books', start: 1 },
  { x: 'Pets', intro: 'Kids marked how many pets they have.', verb: 'have', noun: 'pets', start: 0 },
  { x: 'Hours', intro: 'Kids marked how many hours of TV they watched on Saturday.', verb: 'watched', noun: 'hours of TV', start: 0 },
]
const dotData = (r: Rng) => {
  const ctx = pick(r, DOTS6), values = Array.from({ length: 6 }, () => int(r, 1, 7))
  const labels = values.map((_, i) => String(ctx.start + i))
  return { ctx, values, labels, pic: { kind: 'chart', type: 'dot', labels, values, xLabel: ctx.x } as Picture }
}
const HIST6 = [
  { x: 'Minutes', y: 'Kids', what: 'how many minutes kids read last night', who: 'kids', did: 'read for', unit: 'minutes', base: 0 },
  { x: 'Seconds', y: 'Kids', what: 'how many seconds kids took to run a lap', who: 'kids', did: 'took', unit: 'seconds', base: 40 },
  { x: 'Score', y: 'Students', what: 'the scores on a test', who: 'students', did: 'scored', unit: 'points', base: 50 },
]
const histData = (r: Rng) => {
  const ctx = pick(r, HIST6), k = int(r, 4, 5), values = Array.from({ length: k }, () => int(r, 2, 12))
  const labels = values.map((_, i) => `${ctx.base + 10 * i}–${ctx.base + 10 * i + 9}`)
  return { ctx, values, labels }
}

const T6: Level[] = [
  lv('dot plot, count one stack', r => {
    const { ctx, values, labels, pic } = dotData(r), i = int(r, 2, 5), k = labels[i]
    return { text: `${ctx.intro} How many kids ${ctx.verb} exactly ${k} ${ctx.noun}?`, picture: pic, answer: values[i],
      steps: ['Each ✕ is one kid.', `Count the ✕s in the stack above ${k}.`, `There are ${values[i]}. So ${pl(values[i], 'kid')} ${ctx.verb} ${k} ${ctx.noun}.`] }
  }),
  lv('dot plot, "or more" / "fewer than": add stacks', r => {
    const { ctx, values, labels, pic } = dotData(r), more = r() < 0.5, i = int(r, 2, 4), k = labels[i]
    const idx = more ? Array.from({ length: 6 - i }, (_, j) => i + j) : Array.from({ length: i }, (_, j) => j)
    const got = idx.map(j => values[j]), ans = sum(got)
    return { text: `${ctx.intro} How many kids ${ctx.verb} ${more ? `${k} or more` : `fewer than ${k}`} ${ctx.noun}?`, picture: pic, answer: ans,
      steps: [`${more ? `${k} or more` : `Fewer than ${k}`} means the stacks above ${and(idx.map(j => labels[j]))}.`, `Count their ✕s: ${and(got)}.`, `${plus(got)} = ${ans}. So ${pl(ans, 'kid')}.`] }
  }),
  lv('histogram, add the bars you need', r => {
    const { ctx, values, labels } = histData(r), k = values.length, cut = int(r, 1, k - 1), edge = ctx.base + 10 * cut, less = r() < 0.5
    const idx = less ? Array.from({ length: cut }, (_, j) => j) : Array.from({ length: k - cut }, (_, j) => cut + j)
    const got = idx.map(j => values[j]), ans = sum(got)
    const cond = less ? `less than ${edge}` : `${edge} or more`
    return { text: `This histogram shows ${ctx.what}. How many ${ctx.who} ${ctx.did} ${cond} ${ctx.unit}?`,
      picture: { kind: 'chart', type: 'hist', labels, values, xLabel: ctx.x, yLabel: ctx.y }, answer: ans,
      steps: [`${less ? `Less than ${edge}` : `${edge} or more`} means the ${idx.length === 1 ? 'bar' : 'bars'} for ${and(idx.map(j => labels[j]))}.`, `${idx.length === 1 ? 'That bar is' : 'Those bars are'} ${and(got)} tall.`, `${idx.length === 1 ? `It reaches ${ans}` : `${plus(got)} = ${ans}`}. So ${ans} ${ctx.who}.`] }
  }),
  lv('dot plot, more than one number but fewer than another (the ends do not count)', r => {
    const { ctx, values, labels, pic } = dotData(r), a = int(r, 0, 2), b = int(r, a + 3, 5)
    const idx = Array.from({ length: b - a - 1 }, (_, j) => a + 1 + j), got = idx.map(j => values[j]), ans = sum(got)
    return { text: `${ctx.intro} How many kids ${ctx.verb} more than ${labels[a]} but fewer than ${labels[b]} ${ctx.noun}?`, picture: pic, answer: ans,
      steps: [`More than ${labels[a]} and fewer than ${labels[b]} means ${and(idx.map(j => labels[j]))}. Not ${labels[a]}, and not ${labels[b]}.`, `Count their ✕s: ${and(got)}.`, `${plus(got)} = ${ans}. So ${pl(ans, 'kid')}.`] }
  }),
  lv('histogram with a missing bar, work backwards from the total', r => {
    const { ctx, values, labels } = histData(r), i = int(r, 0, values.length - 1), total = sum(values), rest = values.filter((_, j) => j !== i)
    return { text: `This histogram shows ${ctx.what}. There are ${total} ${ctx.who} in all, but the bar for ${labels[i]} got erased. How tall should that bar be?`,
      picture: { kind: 'chart', type: 'hist', labels, values: values.map((v, j) => (j === i ? 0 : v)), xLabel: ctx.x, yLabel: ctx.y }, answer: values[i],
      steps: [`The other bars are ${and(rest)} tall.`, `Together they count ${plus(rest)} = ${sum(rest)} ${ctx.who}.`, `${total} − ${sum(rest)} = ${values[i]}. So the bar should reach ${values[i]}.`] }
  }),
]

// ── t7 · Probability as a fraction ──────────────────────────────────────────────────────────────────────────
const TONE: Record<string, 1 | 2 | 3 | 4> = { green: 1, yellow: 2, red: 3, blue: 4 }
const COLORS = ['red', 'blue', 'green', 'yellow']
const spin = (parts: string[]): Picture => ({ kind: 'spinner', parts, tones: parts.map(p => TONE[p] ?? 2) })
/** "a/n." or "a/n, which is the same as p/q." — ends on the answer. */
const same = (a: number, n: number) => { const [p, q] = reduce(a, n); return p === a ? `${a}/${n}.` : `${a}/${n}, which is the same as ${p}/${q}.` }
const frac = (a: number, n: number) => ({ frac: reduce(a, n) })
const bag = (r: Rng, k: number) => { const cs = COLORS.slice(0, k), counts = cs.map(() => int(r, 1, 9)); return { cs, counts, t: sum(counts) } }
const bagText = (cs: string[], counts: number[]) => and(cs.map((c, i) => `${counts[i]} ${c}`))

const T7: Level[] = [
  lv('spinner, count the color over all the parts', r => {
    const n = pick(r, [4, 5, 6, 8, 10]), c = pick(r, COLORS), a = int(r, 1, n - 1)
    const others = COLORS.filter(x => x !== c), parts = shuffle(r, [...Array(a).fill(c), ...Array.from({ length: n - a }, () => pick(r, others))])
    return { text: `This spinner has ${n} equal parts. What is the chance of landing on ${c}?`, picture: spin(parts), answer: frac(a, n),
      steps: [`Count the ${c} parts: there ${a === 1 ? 'is' : 'are'} ${a}.`, `Count all the parts: there are ${n}.`, `${c[0].toUpperCase()}${c.slice(1)} parts over all parts: ${same(a, n)}`] }
  }),
  lv('bag of marbles in a table, add up all the ways', r => {
    const { cs, counts, t } = bag(r, 3), i = int(r, 0, 2)
    return { text: `A bag has ${bagText(cs, counts)} marbles. You pick one without looking. What is the probability it is ${cs[i]}?`,
      picture: { kind: 'table', head: cs, rows: [counts.map(String)] }, answer: frac(counts[i], t),
      steps: [`There ${counts[i] === 1 ? 'is' : 'are'} ${pl(counts[i], `${cs[i]} marble`)}.`, `There are ${plus(counts)} = ${t} marbles in all.`, `So the probability is ${same(counts[i], t)}`] }
  }),
  lv('fix the part-over-the-rest slip, pick the real chance', r => {
    for (;;) {
      const k = int(r, 3, 4), { cs, counts, t } = bag(r, k), i = int(r, 0, k - 1), a = counts[i], [name] = names(r, 1)
      const cand: [number, number][] = [[a, t], [a, t - a], [t - a, t], [1, k]]
      if (new Set(cand.map(([p, q]) => Math.round((p / q) * 1e6))).size < 4) continue
      const [right, ...wrong] = cand.map(([p, q]) => `${p}/${q}`)
      return { text: `A bag has ${bagText(cs, counts)} marbles. ${name} says the chance of picking ${cs[i]} is ${a}/${t - a}. What is the real chance?`,
        picture: { kind: 'table', head: cs, rows: [counts.map(String)] }, answer: choose(r, right, wrong),
        steps: [`${name} put the ${cs[i]} marbles over the marbles that are not ${cs[i]}.`, `There are ${a} ${cs[i]} marbles and ${t} marbles in all.`, `So the real chance is ${right}.`] }
    }
  }),
  lv('number spinner, count the numbers that fit a rule', r => {
    const n = pick(r, [6, 8, 10, 12]), parts = Array.from({ length: n }, (_, i) => String(i + 1)), kind = pick(r, ['greater', 'less', 'even', 'odd', 'three'])
    const k = int(r, 3, n - 2)
    const rule = {
      greater: { say: `a number greater than ${k}`, ok: (x: number) => x > k, note: ` The ${k} itself does not count.` },
      less: { say: `a number less than ${k}`, ok: (x: number) => x < k, note: ` The ${k} itself does not count.` },
      even: { say: 'an even number', ok: (x: number) => x % 2 === 0, note: '' },
      odd: { say: 'an odd number', ok: (x: number) => x % 2 === 1, note: '' },
      three: { say: 'a number you get counting by 3s', ok: (x: number) => x % 3 === 0, note: '' },
    }[kind]!
    const ways = parts.map(Number).filter(rule.ok)
    return { text: `This spinner has ${n} equal parts numbered 1 to ${n}. What is the probability of landing on ${rule.say}?`,
      picture: { kind: 'spinner', parts }, answer: frac(ways.length, n),
      steps: [`The numbers that work are ${and(ways)}. That is ${pl(ways.length, 'part')}.${rule.note}`, `There are ${n} parts in all.`, `So the probability is ${same(ways.length, n)}`] }
  }),
  lv('chance given, work backwards to how many', r => {
    for (;;) {
      const q = int(r, 2, 6), p = int(r, 1, q - 1)
      if (gcd(p, q) !== 1) continue
      const T = q * int(r, 3, 8), ans = (T / q) * p, c = pick(r, COLORS)
      return { text: `A bag has ${T} marbles. The probability of picking a ${c} one is ${p}/${q}. How many ${c} marbles are in the bag?`,
        picture: eq(`? / ${T} = ${p}/${q}`), answer: ans,
        steps: [`The chance is ${c} marbles over all ${T} marbles.`, `${T} ÷ ${q} = ${T / q}, so each part of the ${q} is ${T / q} marbles. ${p} parts is ${T / q} × ${p}.`, `${T / q} × ${p} = ${ans}. So there are ${ans} ${c} marbles.`] }
    }
  }),
]

// ── t8 · Likely or unlikely ─────────────────────────────────────────────────────────────────────────────────
const WORDS = ['impossible', 'unlikely', 'equally likely', 'likely', 'certain']
const wordOf = (a: number, n: number) => (a === 0 ? 0 : a === n ? 4 : 2 * a < n ? 1 : 2 * a === n ? 2 : 3)
const line01 = (at?: number): Picture => ({ kind: 'numline', min: 0, max: 1, ticks: 4, labels: 'ends', points: at === undefined ? undefined : [{ at }] })
const EVENTS = ['it rains tomorrow', 'the bus is late', 'your team wins the game', 'the spinner lands on a star', 'you pick a winning ticket']
/** Two steps comparing a/n with 1/2. */
const compare = (a: number, n: number) => {
  if (a === 0) return [`That is 0 ways out of ${n}, a chance of 0.`, '0 is the left end of the line.']
  if (a === n) return [`That is ${n} ways out of ${n}, a chance of 1.`, '1 is the right end of the line.']
  const half = fmt(n / 2), w = wordOf(a, n)
  return [`Half of ${n} is ${half}, so compare ${a} with ${half}.`, w === 2 ? `${a}/${n} is the same as 1/2, right in the middle.` : `${a}/${n} is ${w === 1 ? 'less' : 'more'} than 1/2, so it sits ${w === 1 ? 'below' : 'past'} the middle.`]
}

const T8: Level[] = [
  lv('read the dot on the chance line', r => {
    const k = int(r, 0, 4), at = k / 4, word = WORDS[k]
    const where = ['0, the left end', '1/4, below the middle', '1/2, right in the middle', '3/4, past the middle', '1, the right end'][k]
    return { text: `The dot shows the chance that ${pick(r, EVENTS)}. Which word describes that chance?`, picture: line01(at),
      answer: { choices: WORDS, correct: k },
      steps: [`The dot sits at ${where}.`, '0 is impossible, 1 is certain, and 1/2 is equally likely.', `So it is ${word}.`] }
  }),
  lv('a chance as a fraction, pick the word', r => {
    const n = int(r, 3, 12), a = r() < 0.15 ? pick(r, [0, n]) : r() < 0.2 && n % 2 === 0 ? n / 2 : int(r, 1, n - 1), k = wordOf(a, n)
    const said = a === 0 ? '0' : a === n ? '1' : `${a}/${n}`
    return { text: `The chance that ${pick(r, EVENTS)} is ${said}. Which word fits?`, picture: line01(),
      answer: { choices: WORDS, correct: k },
      steps: a === 0 || a === n ? [`A chance of ${said} is the ${a === 0 ? 'left' : 'right'} end of the line.`, `So it is ${WORDS[k]}.`] : [...compare(a, n), `So it is ${WORDS[k]}.`] }
  }),
  lv('bag of marbles, find the chance then the word', r => {
    const { cs, counts: raw } = bag(r, 3), roll = r()
    // Without a nudge nearly every pick is unlikely: sometimes make one color match or beat the other two together.
    const big = int(r, 0, 2), others = sum(raw) - raw[big], counts = raw.map((x, j) => (j !== big ? x : roll >= 0.22 && roll < 0.5 ? others + int(r, 1, 4) : roll >= 0.5 && roll < 0.62 ? others : x))
    const t = sum(counts)
    const [c, a] = roll < 0.12 ? ['purple', 0] : roll < 0.17 ? [`${cs[0]}, ${cs[1]} or ${cs[2]}`, t] : roll < 0.22 ? (() => { const skip = int(r, 0, 2), named = cs.map((x, j) => (j === skip ? 'yellow' : x)); return [`${named[0]}, ${named[1]} or ${named[2]}`, t - counts[skip]] as [string, number] })() : (() => { const i = roll < 0.62 ? big : int(r, 0, 2); return [cs[i], counts[i]] as [string, number] })()
    const k = wordOf(a, t)
    return { text: `A bag has ${bagText(cs, counts)} marbles. You pick one without looking. How likely is a ${c} marble?`,
      picture: { kind: 'table', head: cs, rows: [counts.map(String)] }, answer: { choices: WORDS, correct: k },
      steps: [`${a} of the ${t} marbles ${a === 1 ? 'is' : 'are'} ${a === t ? 'one of those colors' : c}, so the chance is ${a === 0 ? '0' : a === t ? '1' : `${a}/${t}`}.`, ...compare(a, t).slice(1), `So a ${c} marble is ${WORDS[k]}.`] }
  }),
  lv('two bags, which gives the better chance', r => {
    for (;;) {
      const r1 = int(r, 1, 8), b1 = int(r, 1, 8), tie = r() < 0.25, m = int(r, 2, 3)
      const r2 = tie ? r1 * m : int(r, 1, 9), b2 = tie ? b1 * m : int(r, 1, 9)
      if (r2 > 12 || b2 > 12 || (r1 === r2 && b1 === b2)) continue
      const t1 = r1 + b1, t2 = r2 + b2, L = (t1 * t2) / gcd(t1, t2)
      if (L > 60) continue
      const x1 = (r1 * L) / t1, x2 = (r2 * L) / t2
      const choices = ['Bag A', 'Bag B', 'Both are the same'], correct = x1 > x2 ? 0 : x1 < x2 ? 1 : 2
      return { text: 'Two bags hold red and blue marbles. You pick one marble without looking. From which bag are you more likely to pick red?',
        picture: { kind: 'table', head: ['Bag', 'red', 'blue'], rows: [['A', String(r1), String(b1)], ['B', String(r2), String(b2)]], rowHead: true },
        answer: { choices, correct },
        steps: [`Bag A: red is ${r1}/${t1}. Bag B: red is ${r2}/${t2}.`, `Write both over ${L}: ${x1}/${L} and ${x2}/${L}.`, `So the answer is: ${choices[correct]}`] }
    }
  }),
  lv('make two colors equally likely, work backwards', r => {
    {
      const lo = int(r, 1, 9), hi = int(r, lo + 1, 15), add = r() < 0.5, d = hi - lo
      const [c1, c2] = shuffle(r, ['red', 'blue', 'green', 'yellow'])
      const text = add
        ? `A bag has ${lo} ${c1} and ${hi} ${c2} marbles. How many ${c1} marbles must you add so ${c1} and ${c2} are equally likely?`
        : `A bag has ${lo} ${c1} and ${hi} ${c2} marbles. How many ${c2} marbles must you take out so ${c1} and ${c2} are equally likely?`
      return { text, picture: { kind: 'table', head: [c1, c2], rows: [[String(lo), String(hi)]] }, answer: d,
        steps: ['Equally likely means the same number of each color, a chance of 1/2.', `Now there are ${lo} ${c1} and ${hi} ${c2}, a difference of ${hi} − ${lo}.`, `That is ${d}. So ${add ? 'add' : 'take out'} ${pl(d, `${add ? c1 : c2} marble`)}.`] }
    }
  }),
]

export const G6M7_LADDERS: Record<string, Level[]> = {
  'g6m7-t1': T1, 'g6m7-t2': T2, 'g6m7-t3': T3, 'g6m7-t4': T4,
  'g6m7-t5': T5, 'g6m7-t6': T6, 'g6m7-t7': T7, 'g6m7-t8': T8,
}
