/**
 * Grade 7 · Module 5 — Statistics and probability. Practice ladders, easiest style first (see ../adaptive.ts and the
 * reference ladders in ./g5m1.ts, ./g6m4.ts). Question pictures show the DATA; a mean, prediction, count or chance the
 * child is asked for is never printed. Probabilities are fractions (any equal value is accepted) unless the text asks
 * for a decimal.
 */
import type { Picture, Problem } from '../script'
import { int, pick, shuffle, fmt, type Level, type Rng } from '../adaptive'

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
const choose = (r: Rng, right: string, wrong: string[]) => { const choices = shuffle(r, [right, ...wrong]); return { choices, correct: choices.indexOf(right) } }
const table = (head: string[], rows: string[][], rowHead = false): Picture => ({ kind: 'table', head, rows, ...(rowHead ? { rowHead } : {}) })
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)
/** a/b in lowest terms, written; "4/10 = 2/5" when it reduces. */
const frac = (a: number, b: number) => { const g = gcd(a, b); return g > 1 ? `${a}/${b} = ${a / g}/${b / g}` : `${a}/${b}` }
const r4 = (x: number) => Math.round(x * 10000) / 10000
const NAMES = ['Kai', 'Ava', 'Ben', 'Zoe', 'Leo', 'Mia'] as const

/** Every number a picture's labels print (a list of strings is also read joined up, the way a table row reads). */
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

// ── t1 · A fair sample ──────────────────────────────────────────────────────────────────────────────────────
interface Survey { whole: string; lo: number; hi: number; want: string; plan: (k: number) => string; out: string; inn: string }
const SURVEYS: Survey[] = [
  { whole: 'students', lo: 300, hi: 900, want: 'Favorite sport at school', plan: k => `The ${k} kids on the basketball team`, out: 'Kids who are not on the team', inn: 'Kids on the basketball team' },
  { whole: 'students', lo: 300, hi: 900, want: 'How students get to school', plan: k => `${k} kids picked from the riders of bus 7`, out: 'Kids who do not ride bus 7', inn: 'Kids who ride bus 7' },
  { whole: 'students', lo: 300, hi: 900, want: 'Favorite lunch at school', plan: k => `The ${k} kids in the pizza club`, out: 'Kids who are not in the pizza club', inn: 'Kids in the pizza club' },
  { whole: 'voters', lo: 1000, hi: 5000, want: 'What voters think of a new park', plan: k => `${k} people picked from the park on Saturday`, out: 'Voters who are not at the park on Saturday', inn: 'Voters at the park on Saturday' },
  { whole: 'students', lo: 300, hi: 900, want: 'How many hours students sleep', plan: k => `${k} kids picked from the library at lunch`, out: 'Kids who are not at the library at lunch', inn: 'Kids at the library at lunch' },
  { whole: 'people in town', lo: 2000, hi: 8000, want: 'Favorite food in town', plan: k => `${k} people picked from the line at the taco truck`, out: 'People who are not at the taco truck', inn: 'People in line at the taco truck' },
  { whole: 'gym members', lo: 400, hi: 1200, want: 'Favorite kind of exercise at the gym', plan: k => `The ${k} members of the swimming class`, out: 'Members who are not in the swimming class', inn: 'Members in the swimming class' },
]
const byChance = (r: Rng, k: number, N: number, whole: string) => pick(r, [
  `A computer picks ${k} of all ${fmt(N)} ${whole} by chance`,
  `${k} numbers drawn from a hat with a number for each of the ${fmt(N)} ${whole}`,
  `All ${fmt(N)} names on cards, shuffled, and ${k} picked without looking`,
])
const survey = (r: Rng) => { const s = pick(r, SURVEYS); return { s, N: int(r, s.lo / 50, s.hi / 50) * 50, k: int(r, 12, 40) } }
const FAIR_YES = 'fair: everyone has the same chance'
const FAIR_NO = 'not fair: some people have no chance'
const FAIR_SMALL = 'not fair: the sample is too small'

const T1: Level[] = [
  lv('who-is-asked table: fair or not fair', r => {
    const { s, N, k } = survey(r)
    const fair = r() < 0.45
    const asked = fair ? byChance(r, k, N, s.whole) : s.plan(k)
    return { text: `You want to know something about all ${fmt(N)} ${s.whole}. You can only ask ${k} of them. The table shows who you ask. Is that a fair sample?`,
      picture: table(['You want to know', 'Who is asked'], [[s.want, asked]]),
      answer: choose(r, fair ? FAIR_YES : FAIR_NO, [fair ? FAIR_NO : FAIR_YES, FAIR_SMALL]),
      steps: fair
        ? [`The ${k} are picked by chance from all ${fmt(N)} ${s.whole}.`, `Nobody is left out, so the sample is ${FAIR_YES}.`]
        : [`${s.out} can never be picked.`, `The sample is only one kind of person, so it is ${FAIR_NO}.`] }
  }),
  lv('pick the one fair plan out of three', r => {
    const { s, N, k } = survey(r)
    const right = byChance(r, k, N, s.whole)
    const wrong = [...new Set([s.plan(k), `The ${k} ${s.whole} who live closest to you`, `${k} of your own friends`])].slice(0, 2)
    return { text: `You want to ask ${k} of the ${fmt(N)} ${s.whole}. Which plan gives a fair sample?`,
      picture: table(['You want to know', 'Whole group'], [[s.want, `All ${fmt(N)} ${s.whole}`]]),
      answer: choose(r, right, wrong),
      steps: ['A fair sample gives everyone in the group the same chance to be picked.', 'Your friends, your neighbors, or one group all leave people out.', `So the fair plan is: ${right}.`] }
  }),
  lv('name who is left out of a biased sample', r => {
    const { s, N, k } = survey(r)
    return { text: `To learn about all ${fmt(N)} ${s.whole}, you ask the ${k} shown in the table. Who has no chance to be picked?`,
      picture: table(['You want to know', 'Who is asked'], [[s.want, s.plan(k)]]),
      answer: choose(r, s.out, [s.inn, 'Nobody is left out']),
      steps: [`Only the people in "${s.plan(k)}" can be asked.`, `Everyone else can never be picked. That is: ${s.out}.`] }
  }),
  lv('spot the mistake: a big sample is not always fair', r => {
    const { s } = survey(r)
    const N = int(r, s.lo / 50, s.hi / 50) * 50, k = int(r, 8, Math.min(30, Math.floor(N / 20))) * 10, who = pick(r, NAMES)
    const fair = r() < 0.4
    const plan = fair ? byChance(r, k, N, s.whole) : s.plan(k)
    const yes = `It is fair, but not because it is big: everyone had the same chance`, no = `It is not fair, even though it is big: some people have no chance`
    const right = fair ? yes : no
    return { text: `${who} wants to learn about all ${fmt(N)} ${s.whole}. ${who} says: "My sample is fair because I asked ${k} people." Which is true about ${who}'s sample?`,
      picture: table(['You want to know', 'Who is asked'], [[s.want, plan]]),
      answer: choose(r, right, [fair ? no : yes, 'It is fair, because it is big']),
      steps: fair
        ? ['Being big is not what makes a sample fair.', `Here every one of the ${fmt(N)} ${s.whole} has the same chance to be picked. ${right}.`]
        : ['Being big is not what makes a sample fair.', `${s.out} can never be picked. ${right}.`] }
  }),
  lv('fix the plan: which change makes it fair', r => {
    const { s, N, k } = survey(r)
    const right = `Pick ${k} of all ${fmt(N)} ${s.whole} by chance`
    return { text: `This plan to learn about all ${fmt(N)} ${s.whole} is not fair. Which change makes it a fair sample?`,
      picture: table(['You want to know', 'Who is asked'], [[s.want, s.plan(k)]]),
      answer: choose(r, right, [`Ask ${2 * k} people the same way instead of ${k}`, `Ask only the ${s.whole} who live nearby`]),
      steps: [`Asking more people the same way still leaves out this group: ${s.out}.`, 'Asking only people who live nearby leaves out everyone who lives far away.', `So the fix is: ${right}.`] }
  }),
]

// ── t2 · Predict from a sample ──────────────────────────────────────────────────────────────────────────────
interface Group { group: string; trait: string; not: string; short: string; trait2: string }
const GROUPS: Group[] = [
  { group: 'students', trait: 'walk to school', not: 'do not walk to school', short: 'walk', trait2: 'ride a bike to school' },
  { group: 'students', trait: 'play an instrument', not: 'do not play an instrument', short: 'play', trait2: 'sing in a choir' },
  { group: 'fans', trait: 'bought a hat', not: 'did not buy a hat', short: 'hat', trait2: 'bought a scarf' },
  { group: 'people', trait: 'have a pet cat', not: 'do not have a pet cat', short: 'cat', trait2: 'have a pet dog' },
  { group: 'apples', trait: 'have a bruise', not: 'have no bruise', short: 'bruised', trait2: 'have a worm hole' },
  { group: 'light bulbs', trait: 'do not work', not: 'work', short: 'broken', trait2: 'are scratched' },
]
/** A sample of `all` with `k` having the trait, and a whole group `W` that is a whole multiple of it. */
const sampleNums = (r: Rng) => {
  const all = pick(r, [20, 25, 30, 40, 50, 60, 80, 100])
  const divs = Array.from({ length: all }, (_, i) => i + 1).filter(d => d > 1 && d <= 20 && all % d === 0)
  const b = pick(r, divs)
  let a = int(r, 1, b - 1)
  while (gcd(a, b) !== 1) a = int(r, 1, b - 1)
  const k = (a * all) / b, W = all * pick(r, [10, 15, 20, 25, 30, 40, 50])
  return { all, k, W, a, b, ans: (a * W) / b }
}
const scaleUp = (k: number, all: number, W: number, a: number, b: number, what: string) => [
  `${k} out of ${all} is ${frac(k, all)}.`,
  `${fmt(W)} ÷ ${b} = ${fmt(W / b)}, so each 1/${b} of the ${fmt(W)} is ${fmt(W / b)}.`,
  `${a} × ${fmt(W / b)} = ${fmt((a * W) / b)}. So predict ${fmt((a * W) / b)} ${what}.`,
]

const T2: Level[] = [
  lv('sample tape to a prediction', r => {
    const g = pick(r, GROUPS)
    let n = sampleNums(r)
    while (n.k < 2) n = sampleNums(r)
    const { all, k, W, a, b, ans } = n
    return { text: `You check ${all} ${g.group}, picked by chance. ${k} of them ${g.trait}. Predict how many of all ${fmt(W)} ${g.group} ${g.trait}.`,
      picture: { kind: 'tape', rows: [
        { label: 'Sample', cells: [{ w: k, text: `${k} ${g.short}`, shade: true }, { w: all - k, text: `${all - k} other` }], brace: `${all} checked` },
        { label: 'Everyone', cells: [{ w: all, text: '?' }], brace: `${fmt(W)} ${g.group}` },
      ] },
      answer: ans, steps: scaleUp(k, all, W, a, b, `${g.group} ${g.trait}`) }
  }),
  lv('predict the ones who do NOT have it', r => {
    const g = pick(r, GROUPS)
    let n = sampleNums(r)
    while (n.k < 2) n = sampleNums(r)
    const { all, k, W } = n, m = all - k, gg = gcd(m, all), a = m / gg, b = all / gg
    return { text: `In a sample of ${all} ${g.group} picked by chance, ${k} ${g.trait}. There are ${fmt(W)} ${g.group} in all. Predict how many ${g.not}.`,
      picture: table(['', `${g.trait[0].toUpperCase()}${g.trait.slice(1)}`, 'In all'], [['Sample', String(k), String(all)], ['Whole group', '?', fmt(W)]], true),
      answer: W - n.ans,
      steps: [`${all} − ${k} = ${m} of the sample ${g.not}, which is ${frac(m, all)}.`, `${fmt(W)} ÷ ${b} = ${fmt(W / b)}, so each 1/${b} of the group is ${fmt(W / b)}.`, `${a} × ${fmt(W / b)} = ${fmt(W - n.ans)}. So predict ${fmt(W - n.ans)} ${g.not}.`] }
  }),
  lv('spot the mistake in a prediction', r => {
    for (;;) {
      const g = pick(r, GROUPS), { all, k, W, ans } = sampleNums(r), who = pick(r, NAMES)
      if (new Set([ans, k, W - ans]).size < 3) continue
      const kind = pick(r, ['right', 'stopped', 'not'] as const)
      const claim = kind === 'right' ? ans : kind === 'stopped' ? k : W - ans
      const yes = `${who} is right`, stopped = `${who} stopped at the count in the sample`, not = `${who} predicted the ${g.group} who ${g.not}`
      const right = kind === 'right' ? yes : kind === 'stopped' ? stopped : not
      return { text: `${who} checks ${all} of ${fmt(W)} ${g.group}, picked by chance, and ${k} ${g.trait}. ${who} predicts that ${fmt(claim)} of all ${fmt(W)} ${g.group} ${g.trait}. Which is true?`,
        picture: table(['Checked', `${g.trait[0].toUpperCase()}${g.trait.slice(1)}`, 'Whole group'], [[String(all), String(k), fmt(W)]]),
        answer: choose(r, right, [yes, stopped, not].filter(c => c !== right)),
        steps: [`${k} out of ${all} is ${frac(k, all)}, and that fraction of ${fmt(W)} is ${fmt(ans)}.`, `The prediction was ${fmt(claim)}. So: ${right}.`] }
    }
  }),
  lv('work backwards: the count in the sample from a prediction', r => {
    const g = pick(r, GROUPS)
    let n = sampleNums(r)
    while (n.k < 2) n = sampleNums(r)
    const { all, k, W, a, b, ans } = n
    return { text: `You check ${all} ${g.group}, picked by chance, and count how many ${g.trait}. From that, you predict ${fmt(ans)} of all ${fmt(W)} ${g.group} ${g.trait}. How many in your sample ${g.trait}?`,
      picture: table(['', `${g.trait[0].toUpperCase()}${g.trait.slice(1)}`, 'In all'], [['Sample', '?', String(all)], ['Whole group', fmt(ans), fmt(W)]], true),
      answer: k,
      steps: [`${fmt(ans)} out of ${fmt(W)} is ${frac(ans, W)}.`, `The sample is the same fraction: ${all} ÷ ${b} = ${all / b}, and ${a} × ${all / b} = ${k}.`, `So ${k} in the sample ${g.trait}.`] }
  }),
  lv('two-step story: predict how many more', r => {
    for (;;) {
      const g = pick(r, GROUPS), all = pick(r, [20, 25, 40, 50, 100]), W = all * pick(r, [10, 20, 40, 50])
      const k1 = int(r, 4, Math.floor(all / 2)), k2 = int(r, 2, k1 - 1)
      if ((k1 * W) % all || (k2 * W) % all) continue
      const p1 = (k1 * W) / all, p2 = (k2 * W) / all, d = p1 - p2
      return { text: `In a sample of ${all} ${g.group} picked by chance, ${k1} ${g.trait} and ${k2} ${g.trait2}. There are ${fmt(W)} ${g.group} in all. Predict how many more ${g.trait} than ${g.trait2}.`,
        picture: table(['', `${g.trait[0].toUpperCase()}${g.trait.slice(1)}`, `${g.trait2[0].toUpperCase()}${g.trait2.slice(1)}`, 'In all'], [['Sample', String(k1), String(k2), String(all)], ['Whole group', '?', '?', fmt(W)]], true),
        answer: d,
        steps: [`${fmt(W)} ÷ ${all} = ${fmt(W / all)}, so each one in the sample stands for ${fmt(W / all)}.`, `Predict ${k1} × ${fmt(W / all)} = ${fmt(p1)} and ${k2} × ${fmt(W / all)} = ${fmt(p2)}.`, `${fmt(p1)} − ${fmt(p2)} = ${fmt(d)}. So predict ${fmt(d)} more.`] }
    }
  }),
]

// ── t3 · Compare two groups ─────────────────────────────────────────────────────────────────────────────────
interface Pair { col: string; a: string; b: string; unit: string; one: string; what: string; intro: string; lo: number; hi: number }
const PAIRS: Pair[] = [
  { col: 'Plant', a: 'Class A', b: 'Class B', unit: 'inches', one: 'inch', what: 'mean heights', intro: 'Two classes each grew plants. Their heights are in inches.', lo: 4, hi: 20 },
  { col: 'Runner', a: 'Team X', b: 'Team Y', unit: 'seconds', one: 'second', what: 'mean lap times', intro: 'Two teams of runners ran a lap. Their times are in seconds.', lo: 50, hi: 80 },
  { col: 'Kid', a: 'Group 1', b: 'Group 2', unit: 'push-ups', one: 'push-up', what: 'mean numbers of push-ups', intro: 'Two groups of kids did push-ups.', lo: 8, hi: 30 },
  { col: 'Game', a: 'Lions', b: 'Tigers', unit: 'points', one: 'point', what: 'mean scores', intro: 'Two basketball teams played some games.', lo: 30, hi: 70 },
]
/** n whole numbers from m − s to m + s whose mean is exactly m, not all the same. */
const dataSet = (r: Rng, n: number, m: number, s: number): number[] => {
  for (;;) {
    const v = Array.from({ length: n - 1 }, () => int(r, m - s, m + s))
    const last = n * m - v.reduce((x, y) => x + y, 0)
    if (last >= m - s && last <= m + s && new Set([...v, last]).size > 1) return [...v, last]
  }
}
const sum = (v: number[]) => v.reduce((x, y) => x + y, 0)
const meanStep = (name: string, v: number[]) => `${name}: ${v.join(' + ')} = ${sum(v)}, and ${sum(v)} ÷ ${v.length} = ${sum(v) / v.length}.`
const units = (n: number, p: Pair) => `${n} ${plural(n, p.one, p.unit)}`
const two = (p: Pair, va: (number | string)[], vb: (number | string)[]): Picture =>
  table([p.col, ...va.map((_, i) => String(i + 1))], [[p.a, ...va.map(String)], [p.b, ...vb.map(String)]], true)

const T3: Level[] = [
  lv('table of two groups: gap between the means', r => {
    const p = pick(r, PAIRS), n = int(r, 4, 5)
    const mA = int(r, p.lo + 3, p.hi - 3)
    let mB = int(r, p.lo + 3, p.hi - 3)
    while (mB === mA || Math.abs(mA - mB) > 9) mB = int(r, p.lo + 3, p.hi - 3)
    const A = dataSet(r, n, mA, 3), B = dataSet(r, n, mB, 3), gap = Math.abs(mA - mB)
    return { text: `${p.intro} What is the difference between the ${p.what}?`, picture: two(p, A, B), answer: gap,
      steps: [meanStep(p.a, A), meanStep(p.b, B), `${Math.max(mA, mB)} − ${Math.min(mA, mB)} = ${gap}. So the difference is ${units(gap, p)}.`] }
  }),
  lv('dot plot of one class against a given mean', r => {
    const lo = int(r, 2, 6), n = int(r, 6, 10), mA = int(r, lo + 2, lo + 4)
    const A = dataSet(r, n, mA, 2).sort((x, y) => x - y)
    let mB = int(r, lo, lo + 8)
    while (mB === mA) mB = int(r, lo, lo + 8)
    const labels = Array.from({ length: 7 }, (_, i) => String(lo + i)), gap = Math.abs(mA - mB)
    return { text: `The dot plot shows the heights of Class A's ${n} plants. Each dot is one plant. Class B's plants have a mean height of ${mB} inches. What is the difference between the two means, in inches?`,
      picture: { kind: 'chart', type: 'dot', labels, values: labels.map(l => A.filter(x => x === +l).length), xLabel: 'Class A plants (inches)' },
      answer: gap,
      steps: [`Add up Class A: ${A.join(' + ')} = ${sum(A)}.`, `${sum(A)} ÷ ${n} = ${mA}, so Class A's mean is ${mA}.`, `${Math.max(mA, mB)} − ${Math.min(mA, mB)} = ${gap}. So the difference is ${gap} ${plural(gap, 'inch', 'inches')}.`] }
  }),
  lv('same means: which group is more spread out', r => {
    for (;;) {
      const p = pick(r, PAIRS), n = 5, m = int(r, p.lo + 8, p.hi - 8)
      const tight = dataSet(r, n, m, 2), wide = dataSet(r, n, m, 8)
      const range = (v: number[]) => Math.max(...v) - Math.min(...v)
      if (range(wide) <= range(tight) + 4) continue
      const aWide = r() < 0.5, A = aWide ? wide : tight, B = aWide ? tight : wide
      const moreA = `${p.a} is more spread out`, moreB = `${p.b} is more spread out`, right = aWide ? moreA : moreB
      return { text: `${p.intro} Both have a mean of ${units(m, p)}. Which is true?`, picture: two(p, A, B),
        answer: choose(r, right, [aWide ? moreB : moreA, 'Both are spread out the same']),
        steps: [`Both means are ${m}, so the middles are the same.`, `${p.a} goes from ${Math.min(...A)} to ${Math.max(...A)}, a range of ${range(A)}. ${p.b} goes from ${Math.min(...B)} to ${Math.max(...B)}, a range of ${range(B)}.`, `So ${right}.`] }
    }
  }),
  lv('work backwards: the missing value for a given gap', r => {
    for (;;) {
      const p = pick(r, PAIRS), n = int(r, 4, 5), mA = int(r, p.lo + 4, p.hi - 4), gap = int(r, 2, 6)
      const up = r() < 0.5, mB = up ? mA + gap : mA - gap
      if (mB - 3 < 1) continue
      const A = dataSet(r, n, mA, 3), B = dataSet(r, n, mB, 3), hole = int(r, 0, n - 1), x = B[hole]
      const known = sum(B) - x
      return { text: `${p.intro} ${p.b}'s mean is ${gap} ${up ? 'more' : 'less'} than ${p.a}'s mean. What is the missing number?`,
        picture: two(p, A, B.map((v, i) => (i === hole ? '?' : v))), answer: x,
        steps: [`${meanStep(p.a, A)} So ${p.b}'s mean is ${mA} ${up ? '+' : '−'} ${gap} = ${mB}.`, `${n} numbers with a mean of ${mB} add up to ${n} × ${mB} = ${n * mB}.`, `The others add up to ${known}, so the missing number is ${n * mB} − ${known} = ${x}.`] }
    }
  }),
  lv('is the gap big or small next to the spread', r => {
    for (;;) {
      const p = pick(r, PAIRS), n = 5, big = r() < 0.5
      const mA = int(r, p.lo + 8, p.hi - 8), gap = big ? int(r, 6, 9) : int(r, 1, 3), mB = r() < 0.5 ? mA + gap : mA - gap
      const s = big ? 2 : 5
      const A = dataSet(r, n, mA, s), B = dataSet(r, n, mB, s)
      const range = (v: number[]) => Math.max(...v) - Math.min(...v), rA = range(A), rB = range(B)
      if (big ? gap < Math.max(rA, rB) + 3 : gap > Math.min(rA, rB) - 3) continue
      const small = 'a small difference: the gap is less than the spread', large = 'a big difference: the gap is more than the spread'
      const right = big ? large : small
      return { text: `${p.intro} Find the gap between the means. Is it a big or a small difference next to the spread?`, picture: two(p, A, B),
        answer: choose(r, right, [big ? small : large, 'no difference: the means are the same']),
        steps: [`${p.a}'s mean is ${mA} and ${p.b}'s mean is ${mB}, so the gap is ${gap}.`, `${p.a} has a range of ${rA} and ${p.b} has a range of ${rB}.`, `So it is ${right}.`] }
    }
  }),
]

// ── t4 · Probability of an event ────────────────────────────────────────────────────────────────────────────
const COLORS = ['green', 'yellow', 'red', 'blue'] as const
const TONE: Record<string, 1 | 2 | 3 | 4> = { green: 1, yellow: 2, red: 3, blue: 4 }
/** A spinner of n parts with k of `color` and the rest other colors (at least one), shuffled. */
const spinner = (r: Rng, n: number, k: number, color: string) => {
  const others = COLORS.filter(c => c !== color)
  const parts = shuffle(r, [...Array(k).fill(color), ...Array.from({ length: n - k }, () => pick(r, others))])
  return { parts, picture: { kind: 'spinner', parts, tones: parts.map(p => TONE[p]) } as Picture, colors: new Set(parts).size }
}

const T4: Level[] = [
  lv('spinner: the probability of a color', r => {
    const n = pick(r, [4, 5, 6, 8, 10, 12]), k = int(r, 1, n - 1), color = pick(r, COLORS)
    return { text: `This spinner has ${n} equal parts. What is the probability of landing on ${color}? Write a fraction or a decimal.`,
      picture: spinner(r, n, k, color).picture, answer: { frac: [k, n] },
      steps: [`Count the ${color} parts: there ${plural(k, 'is', 'are')} ${k}.`, `Count all the parts: there are ${n}.`, `So the probability is ${frac(k, n)}.`] }
  }),
  lv('bag table: the probability of one color', r => {
    const counts = [int(r, 1, 12), int(r, 1, 12), int(r, 1, 12)], names = shuffle(r, ['red', 'blue', 'green', 'yellow']).slice(0, 3)
    const i = int(r, 0, 2), T = sum(counts), k = counts[i]
    return { text: `The table shows the marbles in a bag. You pick one without looking. What is the probability it is ${names[i]}?`,
      picture: table(names, [counts.map(String)]), answer: { frac: [k, T] },
      steps: [`There ${plural(k, 'is', 'are')} ${k} ${names[i]} ${plural(k, 'marble', 'marbles')}.`, `There are ${counts.join(' + ')} = ${T} marbles in all.`, `So the probability is ${frac(k, T)}.`] }
  }),
  lv('spot the mistake: parts, not colors, over ALL the parts', r => {
    for (;;) {
      const n = pick(r, [5, 6, 8, 10]), k = int(r, 1, n - 2), color = pick(r, COLORS), sp = spinner(r, n, k, color), c = sp.colors
      if (c < 2 || k * c === n || k === n - k || (n - k) === k * c) continue
      const who = pick(r, NAMES), kind = pick(r, ['right', 'others', 'colors'] as const)
      const claim = kind === 'right' ? `${k}/${n}` : kind === 'others' ? `${k}/${n - k}` : `1/${c}`
      const yes = `${who} is right`, others = `${who} put ${color} over only the parts that are not ${color}`, colors = `${who} counted colors, not parts`
      const right = kind === 'right' ? yes : kind === 'others' ? others : colors
      return { text: `This spinner has ${n} equal parts. ${who} says the probability of landing on ${color} is ${claim}. Which is true?`,
        picture: sp.picture, answer: choose(r, right, [yes, others, colors].filter(x => x !== right)),
        steps: [`${k} of the ${n} parts are ${color}, and ${color} goes over ALL the parts.`, `So the probability is ${k}/${n}, and ${who} said ${claim}. So ${right}.`] }
    }
  }),
  lv('the chance it does NOT happen, as a decimal', r => {
    const T = pick(r, [4, 5, 8, 10, 20, 25]), k = int(r, 1, T - 1)
    const [things, many, one, head, event] = pick(r, [
      ['tiles', 'have a star', 'has a star', 'Tiles with a star', 'a tile with a star'],
      ['cards', 'are red', 'is red', 'Red cards', 'a red card'],
      ['marbles', 'have stripes', 'has stripes', 'Striped marbles', 'a striped marble'],
    ] as const)
    const dec = r4((T - k) / T)
    return { text: `A box has ${T} ${things}, and ${k} of them ${k === 1 ? one : many}. You pick one without looking. What is the probability of NOT getting ${event}? Write it as a decimal.`,
      picture: table([head, `All ${things}`], [[String(k), String(T)]]),
      answer: dec,
      steps: [`${T} − ${k} = ${T - k}, so ${T - k} of the ${T} ${things} are the other kind.`, `The probability of NOT getting ${event} is ${frac(T - k, T)}.`, `As a decimal, ${T - k}/${T} = ${fmt(dec)}.`] }
  }),
  lv('work backwards: how many of the other color', r => {
    const b = pick(r, [3, 4, 5, 6, 8, 10])
    let a = int(r, 1, b - 1)
    while (gcd(a, b) !== 1) a = int(r, 1, b - 1)
    const m = int(r, 2, 6), red = a * m, T = b * m, blue = T - red
    return { text: `A bag has ${red} red marbles and some blue marbles, and nothing else. The probability of picking red is ${a}/${b}. How many blue marbles are in the bag?`,
      picture: table(['red', 'blue', 'All marbles'], [[String(red), '?', '?']]), answer: blue,
      steps: [`A probability of ${a}/${b} means ${a} out of every ${b} marbles ${plural(a, 'is', 'are')} red.`, `${red} = ${m} × ${a}, so there are ${m} × ${b} = ${T} marbles in all.`, `${T} − ${red} = ${blue}. So there are ${blue} blue marbles.`] }
  }),
]

// ── t5 · Expected and actual results ────────────────────────────────────────────────────────────────────────
const UNIT_EVENTS = [
  { d: 2, act: 'flip a coin', tries: 'Flips', event: 'heads', short: 'Heads', many: 'heads' },
  { d: 6, act: 'roll a number cube', tries: 'Rolls', event: 'a 4', short: '4s', many: '4s' },
  { d: 4, act: 'spin a spinner with 4 equal parts, 1 of them red,', tries: 'Spins', event: 'red', short: 'Red', many: 'red spins' },
  { d: 5, act: 'spin a spinner with 5 equal parts, 1 of them blue,', tries: 'Spins', event: 'blue', short: 'Blue', many: 'blue spins' },
  { d: 10, act: 'pick a card from 10 cards numbered 1 to 10, and put it back,', tries: 'Picks', event: 'the 7', short: '7s', many: '7s' },
] as const

const T5: Level[] = [
  lv('chance and tries in a table: the expected count', r => {
    const e = pick(r, UNIT_EVENTS), m = int(r, 3, 30), n = e.d * m
    return { text: `You ${e.act} ${n} times. How many times do you expect to get ${e.event}?`,
      picture: table([e.tries, 'Chance each time'], [[String(n), `1/${e.d}`]]), answer: m,
      steps: [`The chance of ${e.event} is 1/${e.d} each time.`, `Expected count = 1/${e.d} × ${n} = ${n} ÷ ${e.d}.`, `So expect ${e.event} ${m} times.`] }
  }),
  lv('spinner picture: find the chance, then the expected count', r => {
    const n = pick(r, [4, 5, 6, 8, 10]), k = int(r, 2, n - 1), color = pick(r, COLORS), m = int(r, 3, 20), T = n * m
    return { text: `You spin this spinner ${T} times. How many times do you expect it to land on ${color}?`,
      picture: spinner(r, n, k, color).picture, answer: k * m,
      steps: [`${k} of the ${n} parts are ${color}, so the chance is ${k}/${n}.`, `Expected count = ${k}/${n} × ${T}. First ${T} ÷ ${n} = ${m}.`, `${k} × ${m} = ${k * m}. So expect ${color} ${k * m} times.`] }
  }),
  lv('bar chart of real results: how far from expected', r => {
    for (;;) {
      const e = pick(r, UNIT_EVENTS), m = int(r, 5, 40), n = e.d * m, got = m + int(r, -Math.ceil(m / 3), Math.ceil(m / 3))
      if (got === m || got < 1) continue
      const far = Math.abs(got - m), max = Math.max(got, n - got), scale = Math.max(1, Math.ceil(max / 10 / 5) * 5)
      return { text: `You ${e.act} ${n} times. The chart shows what really happened. How far is the real number of ${e.many} from the expected number?`,
        picture: { kind: 'chart', type: 'bar', labels: [e.short, 'Other'], values: [got, n - got], scale, yLabel: e.tries },
        answer: far,
        steps: [`Expected: 1/${e.d} × ${n} = ${m}.`, `The chart shows ${got} ${e.many}.`, `${Math.max(got, m)} − ${Math.min(got, m)} = ${far}. So the real count is ${far} away from expected.`] }
    }
  }),
  lv('two runs of flips: which came closer to the chance', r => {
    for (;;) {
      const n1 = pick(r, [20, 40, 50]), n2 = pick(r, [200, 400, 500]), h1 = n1 / 2 + int(r, -6, 6), h2 = n2 / 2 + int(r, -12, 12)
      // The bigger run is always the closer one, by at least 0.03 — the lesson's "more tries, closer".
      if (Math.abs(h1 / n1 - 0.5) < Math.abs(h2 / n2 - 0.5) + 0.03) continue
      const off1 = Math.abs(2 * h1 - n1) * n2, off2 = Math.abs(2 * h2 - n2) * n1
      const c1 = `the ${n1} flips`, c2 = `the ${n2} flips`, right = off1 < off2 ? c1 : c2
      const f1 = r4(h1 / n1), f2 = r4(h2 / n2)
      return { text: `One class flipped a coin ${n1} times. Another flipped ${n2} times. The table shows the heads. Which run's fraction of heads came closer to the chance of 1/2?`,
        picture: table(['Flips', 'Heads'], [[String(n1), String(h1)], [String(n2), String(h2)]]),
        answer: choose(r, right, [right === c1 ? c2 : c1, 'both came out exactly the same']),
        steps: [`${h1}/${n1} = ${fmt(f1)} and ${h2}/${n2} = ${fmt(f2)}.`, `${fmt(f1)} is ${fmt(r4(Math.abs(f1 - 0.5)))} from 0.5, and ${fmt(f2)} is ${fmt(r4(Math.abs(f2 - 0.5)))} from 0.5.`, `So ${right} came closer to 1/2.`] }
    }
  }),
  lv('work backwards: how many tries for an expected count', r => {
    const b = pick(r, [3, 4, 5, 6, 8, 10])
    let a = int(r, 1, b - 1)
    while (gcd(a, b) !== 1 || a > 3) a = int(r, 1, b - 1)
    const m = int(r, 5, 40), E = a * m, P = b * m
    const [game, who] = pick(r, [['a ring toss game', 'people play'], ['a school raffle game', 'kids play'], ['a basketball shot game', 'people try it']] as const)
    return { text: `The chance of winning ${game} is ${a}/${b}. The organizers expect ${E} winners today. How many ${who.split(' ')[0]} do they expect to play?`,
      picture: table(['Chance of winning', 'Expected winners', 'Players'], [[`${a}/${b}`, String(E), '?']]), answer: P,
      steps: [`Expected winners = ${a}/${b} × players, so ${a}/${b} of the players is ${E}.`, `Then 1/${b} of the players is ${E} ÷ ${a} = ${m}.`, `${b} × ${m} = ${P}. So they expect ${P} to play.`] }
  }),
]

// ── t6 · Two things happening ───────────────────────────────────────────────────────────────────────────────
const blank = (cols: string[], rows: string[]): Picture => table(['', ...cols], rows.map(x => [x, ...cols.map(() => '')]), true)
const MENUS = [
  { row: 'sandwich', rows: ['Turkey', 'Cheese', 'Ham', 'Tuna'], col: 'fruit', cols: ['Apple', 'Banana', 'Grapes', 'Orange', 'Pear'], things: 'lunches' },
  { row: 'shirt', rows: ['Red', 'Blue', 'White', 'Green'], col: 'cap', cols: ['Black', 'Gray', 'Tan'], things: 'outfits' },
  { row: 'drink', rows: ['Milk', 'Juice', 'Water'], col: 'snack', cols: ['Crackers', 'Carrots', 'Pretzels', 'Yogurt', 'Popcorn'], things: 'snack packs' },
  { row: 'ice cream', rows: ['Vanilla', 'Chocolate', 'Mint', 'Mango'], col: 'topping', cols: ['Sprinkles', 'Nuts', 'Fudge', 'Cherries'], things: 'cones' },
] as const
const list = (xs: readonly string[]) => (xs.length === 2 ? `${xs[0]} or ${xs[1]}` : `${xs.slice(0, -1).join(', ')} or ${xs.at(-1)}`)
const nums = (n: number) => Array.from({ length: n }, (_, i) => String(i + 1))
const CONDS: { say: string; ok: (x: number, n: number) => boolean }[] = [
  { say: 'an even number', ok: x => x % 2 === 0 },
  { say: 'an odd number', ok: x => x % 2 === 1 },
  ...[2, 3, 4, 5].map(k => ({ say: `a number greater than ${k}`, ok: (x: number) => x > k })),
  ...[2, 3, 4].map(k => ({ say: `a number less than ${k}`, ok: (x: number) => x < k })),
]

const T6: Level[] = [
  lv('count every pair in the table', r => {
    const mn = pick(r, MENUS), rows = mn.rows.slice(0, int(r, 2, mn.rows.length)), cols = mn.cols.slice(0, int(r, 2, mn.cols.length))
    return { text: `You pick one ${mn.row} (${list(rows)}) and one ${mn.col} (${list(cols)}). How many different ${mn.things} can you make?`,
      picture: blank(cols, rows), answer: rows.length * cols.length,
      steps: [`Each row is a ${mn.row} and each column is a ${mn.col}.`, `There are ${rows.length} rows and ${cols.length} columns.`, `${rows.length} × ${cols.length} = ${rows.length * cols.length}. So there are ${rows.length * cols.length} different ${mn.things}.`] }
  }),
  lv('coin and a numbered thing: count the pairs you want', r => {
    for (;;) {
      const cube = r() < 0.5, n = cube ? 6 : pick(r, [4, 5, 8]), cond = pick(r, CONDS), side = pick(r, ['Heads', 'Tails'])
      const hits = nums(n).map(Number).filter(x => cond.ok(x, n))
      if (!hits.length || hits.length === n) continue
      const thing = cube ? 'roll a number cube' : `spin a spinner with ${n} equal parts numbered 1 to ${n}`
      return { text: `You flip a coin and ${thing}. What is the probability of ${side.toLowerCase()} and ${cond.say}?`,
        picture: blank(nums(n), ['Heads', 'Tails']), answer: { frac: [hits.length, 2 * n] },
        steps: [`The table has 2 × ${n} = ${2 * n} pairs.`, `${side} and ${cond.say}: ${hits.map(x => `${side[0]}${x}`).join(', ')}. That is ${hits.length} ${plural(hits.length, 'pair', 'pairs')}.`, `So the probability is ${frac(hits.length, 2 * n)}.`] }
    }
  }),
  lv('spot the mistake: adding the two chances', r => {
    // A wrong claim must never land on the right chance 1/(2n): adding gives (n + 2)/(2n) and rows + columns gives
    // 1/(n + 2), never equal 1/(2n) for n ≥ 3, and 1/(n + 2) equals it only when n = 2 — so n starts at 3, and this re-checks it.
    let n = pick(r, [3, 4, 5, 6])
    while (n + 2 === 2 * n) n = pick(r, [3, 4, 5, 6])
    const cube = n === 6, side = pick(r, ['heads', 'tails']), x = int(r, 1, n), who = pick(r, NAMES)
    const thing = cube ? 'roll a number cube' : `spin a spinner with ${n} equal parts numbered 1 to ${n}`
    const kind = pick(r, ['right', 'added', 'rows'] as const)
    const claim = kind === 'right' ? `there are 2 × ${n} = ${2 * n} pairs, so it is 1/${2 * n}`
      : kind === 'added' ? `1/2 + 1/${n} = ${n + 2}/${2 * n}` : `there are 2 + ${n} = ${n + 2} pairs, so it is 1/${n + 2}`
    const yes = `${who} is right`, added = `${who} added the two chances`, rows = `${who} added the rows and columns instead of multiplying`
    const right = kind === 'right' ? yes : kind === 'added' ? added : rows
    return { text: `You flip a coin and ${thing}. ${who} finds the probability of ${side} and a ${x} like this: "${claim}." Which is true?`,
      picture: blank(nums(n), ['Heads', 'Tails']), answer: choose(r, right, [yes, added, rows].filter(c => c !== right)),
      steps: [`The table has 2 × ${n} = ${2 * n} pairs, and ${side} with a ${x} is 1 of them.`, `So the probability is 1/${2 * n}. So ${right}.`] }
  }),
  lv('two numbered spinners: the chance of a sum', r => {
    for (;;) {
      const a = int(r, 3, 6), b = int(r, 3, 6), S = int(r, 3, a + b - 1)
      const hits: [number, number][] = []
      for (let i = 1; i <= a; i++) for (let j = 1; j <= b; j++) if (i + j === S) hits.push([i, j])
      if (hits.length < 2) continue
      const what = a === 6 && b === 6 ? 'roll two number cubes' : a === b ? `spin two spinners with equal parts, both numbered 1 to ${a}` : `spin two spinners with equal parts, one numbered 1 to ${a} and one numbered 1 to ${b}`
      return { text: `You ${what}. What is the probability that the two numbers add up to ${S}?`,
        picture: blank(nums(b), nums(a)), answer: { frac: [hits.length, a * b] },
        steps: [`The table has ${a} × ${b} = ${a * b} pairs.`, `Pairs that add up to ${S}: ${hits.map(([i, j]) => `${i} and ${j}`).join(', ')}. That is ${hits.length} pairs.`, `So the probability is ${frac(hits.length, a * b)}.`] }
    }
  }),
  lv('work backwards: how many choices from the chance of one pair', r => {
    const mn = pick(r, MENUS), s = int(r, 2, mn.rows.length), c = int(r, 2, 6), all = s * c, who = pick(r, NAMES)
    return { text: `${who} picks one ${mn.row} and one ${mn.col} without looking. There ${plural(s, 'is', 'are')} ${s} ${mn.row} choices. The chance of getting one exact ${mn.row}-and-${mn.col} pair is 1/${all}. How many ${mn.col} choices are there?`,
      picture: table([`${mn.row[0].toUpperCase()}${mn.row.slice(1)} choices`, `${mn.col[0].toUpperCase()}${mn.col.slice(1)} choices`, 'Chance of one pair'], [[String(s), '?', `1/${all}`]]),
      answer: c,
      steps: [`A chance of 1/${all} means there are ${all} equally likely pairs.`, `Pairs = ${mn.row} choices × ${mn.col} choices, so ${s} × ? = ${all}.`, `${all} ÷ ${s} = ${c}. So there are ${c} ${mn.col} choices.`] }
  }),
]

export const G7M5_LADDERS: Record<string, Level[]> = {
  'g7m5-t1': T1, 'g7m5-t2': T2, 'g7m5-t3': T3, 'g7m5-t4': T4, 'g7m5-t5': T5, 'g7m5-t6': T6,
}
