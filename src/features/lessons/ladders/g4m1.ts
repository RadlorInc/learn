/**
 * Grade 4 · Module 1 — Place value for addition and subtraction. Practice ladders, easiest style first
 * (see ../adaptive.ts and the reference ladders in ./g5m1.ts). Each level is a different KIND of question.
 */
import type { Picture } from '../script'
import { int, pick, shuffle, fmt, type Level, type Rng } from '../adaptive'

const eq = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })
const choose = (r: Rng, right: string, wrong: string[]) => {
  const choices = shuffle(r, [right, ...wrong])
  return { choices, correct: choices.indexOf(right) }
}
const until = <T>(gen: () => T, ok: (x: T) => boolean): T => { let x = gen(); while (!ok(x)) x = gen(); return x }
/** Every number a picture shows, the way the gate reads it (a table row is also read joined up). */
const shown = (pic: unknown) => {
  const texts: string[] = []
  const walk = (v: unknown) => {
    if (typeof v === 'string' || typeof v === 'number') texts.push(String(v))
    else if (Array.isArray(v)) { if (v.every(x => typeof x === 'string')) texts.push(v.join('')); v.forEach(walk) }
    else if (v && typeof v === 'object') Object.values(v).forEach(walk)
  }
  walk(pic)
  return new Set(texts.flatMap(t => t.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map(t => t.replace(/,/g, '')))
}
const hides = (pic: Picture, a: number) => a < 10 || !shown(pic).has(String(a))
const list = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`)
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)
const digit = (n: number, i: number) => Math.floor(n / 10 ** i) % 10

/** Place i, counted from the ones. */
const PL = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands', 'hundred thousands']
const SG = ['one', 'ten', 'hundred', 'thousand', 'ten thousand', 'hundred thousand']
const count = (n: number, i: number) => `${n} ${n === 1 ? SG[i] : PL[i]}`
const CHART = [...PL].reverse()
const chart = (nums: number[], hidden = false): Picture => {
  const n = Math.max(...nums.map(x => String(x).length))
  return { kind: 'table', head: CHART.slice(6 - n), rows: nums.map(x => String(x).padStart(n, '_').split('').map(d => (d === '_' ? '' : hidden ? '?' : d))) }
}

// ── number words ────────────────────────────────────────────────────────────────────────────────────────────
const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
const w100 = (n: number) => (n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : ''))
const w1000 = (n: number) => [Math.floor(n / 100) ? `${ONES[Math.floor(n / 100)]} hundred` : '', n % 100 ? w100(n % 100) : ''].filter(Boolean).join(' ')
const words = (a: number, b: number) => `${w1000(a)} thousand${b ? `, ${w1000(b)}` : ''}`

// ── t1 · Read big numbers ───────────────────────────────────────────────────────────────────────────────────
/** a thousand, b — where b needs a zero to hold a place (b < 100, or like 607). */
const zeroed = (r: Rng) => {
  const a = int(r, 10, 999)
  const b = r() < 0.6 ? int(r, 1, 99) : int(r, 1, 9) * 100 + int(r, 1, 9)
  return { a, b, n: a * 1000 + b }
}
const zeroSteps = (a: number, b: number, end: string) => [
  `Before the comma: ${w1000(a)} is ${a}.`,
  b < 100 ? `After the comma: ${w1000(b)} needs three digits, so write ${String(b).padStart(3, '0')}.`
    : `After the comma: ${w1000(b)} needs a zero in the tens, so write ${b}.`,
  end,
]

const T1: Level[] = [
  { style: 'words to digits, place chart', make: r => {
    const a = int(r, 100, 999), b = int(r, 100, 999), n = a * 1000 + b
    return { text: `Write this number with digits: ${words(a, b)}.`, picture: chart([n], true), answer: n,
      steps: [`Before the comma: ${w1000(a)} is ${a}.`, `After the comma: ${w1000(b)} is ${b}.`, `So the number is ${fmt(n)}.`] }
  } },
  { style: 'what a digit is worth', make: r => {
    const { n, i, d } = until(() => {
      const n = int(r, 100000, 999999), i = int(r, 1, 5), d = digit(n, i)
      return { n, i, d }
    }, x => x.d > 0 && String(x.n).split('').filter(c => +c === x.d).length === 1 && x.d * 10 ** x.i !== x.n)
    const v = d * 10 ** i
    return { text: `In ${fmt(n)}, what is the ${d} worth?`, picture: chart([n]), answer: v,
      steps: [`The ${d} is in the ${PL[i]} place.`, `One ${SG[i]} is ${fmt(10 ** i)}, so ${count(d, i)} is ${fmt(v)}.`, `So the ${d} is worth ${fmt(v)}.`] }
  } },
  { style: 'words to digits with zeros to hold places', make: r => {
    const { a, b, n } = zeroed(r)
    return { text: `Write this number with digits: ${words(a, b)}.`, picture: eq('? thousand, ?'), answer: n,
      steps: zeroSteps(a, b, `So the number is ${fmt(n)}.`) }
  } },
  { style: 'pick the number that matches the words (skipped zero)', make: r => {
    const { a, b, n } = zeroed(r)
    const wrong = [...new Set([Number(`${a}${b}`), a * 1000 + (b < 100 ? b * 10 : Math.floor(b / 100) * 10 + (b % 10)), a * 100 + (b < 100 ? b : Math.floor(b / 100) * 10 + (b % 10)), a * 10000 + b])]
      .filter(v => v !== n && v < 1000000).slice(0, 3).map(fmt)
    return { text: `Which number is ${words(a, b)}?`, picture: eq(`${w1000(a)} thousand,`, [w1000(b)]), answer: choose(r, fmt(n), wrong),
      steps: zeroSteps(a, b, `So the number is ${fmt(n)}.`) }
  } },
  { style: 'places named, some places empty', make: r => {
    const top = pick(r, [5, 4])
    const others = shuffle(r, Array.from({ length: top }, (_, i) => i)).slice(0, int(r, 2, 3))
    const places = [top, ...others].sort((x, y) => y - x)
    const ds = places.map(() => int(r, 1, 9))
    const n = places.reduce((s, p, k) => s + ds[k] * 10 ** p, 0)
    const said = shuffle(r, places.map((p, k) => count(ds[k], p)))
    return { text: `Write the number that has ${list(said)}.`, picture: eq(top === 5 ? '? ? ? , ? ? ?' : '? ? , ? ? ?'), answer: n,
      steps: ['Put each digit in its place, and a 0 in every place that has none.',
        `From the ${PL[top]} down to the ones, the digits are ${String(n).split('').join(', ')}.`, `So the number is ${fmt(n)}.`] }
  } },
]

// ── t2 · Each place is 10 times the next ────────────────────────────────────────────────────────────────────
const T2: Level[] = [
  { style: 'blocks, 10 times', make: r => {
    const d = int(r, 2, 9), k = pick(r, [1, 2]), base = d * 10 ** k
    return { text: `What number is 10 times ${fmt(base)}?`, picture: { kind: 'blocks', hundreds: k === 2 ? d : 0, tens: k === 1 ? d : 0, ones: 0 }, answer: base * 10,
      steps: [`10 ${PL[k]} make 1 ${SG[k + 1]}.`, `So 10 times ${d} ${PL[k]} is ${d} ${PL[k + 1]}.`, `So 10 times ${fmt(base)} is ${fmt(base * 10)}.`] }
  } },
  { style: 'how many of the next place down make it', make: r => {
    const d = int(r, 2, 9), k = int(r, 1, 3), target = d * 10 ** (k + 1)
    return { text: `How many ${PL[k]} make ${fmt(target)}?`, picture: chart([target]), answer: d * 10,
      steps: [`1 ${SG[k + 1]} is 10 ${PL[k]}.`, `So ${d} ${PL[k + 1]} is ${d} × 10 = ${d * 10} ${PL[k]}.`, `So ${d * 10} ${PL[k]} make ${fmt(target)}.`] }
  } },
  { style: 'pick 10 times (not a little more)', make: r => {
    const d = int(r, 2, 9), k = int(r, 1, 3), base = d * 10 ** k, right = fmt(base * 10)
    return { text: `Which number is 10 times ${fmt(base)}?`, picture: eq(`10 × ${fmt(base)}`),
      answer: choose(r, right, [base + 10, base + 100, base * 100].map(fmt)),
      steps: ['A place to the left is worth 10 times as much, not just a little more.', `10 times ${d} ${PL[k]} is ${d} ${PL[k + 1]}.`, `So 10 times ${fmt(base)} is ${right}.`] }
  } },
  { style: 'missing number, go backwards', make: r => {
    const d = int(r, 2, 9), k = int(r, 1, 3), base = d * 10 ** k, target = base * 10
    return { text: `What number goes in the box? 10 × ? = ${fmt(target)}`, picture: eq(`10 × ? = ${fmt(target)}`), answer: base,
      steps: ['10 times a number moves every digit one place to the left.', `So go backwards: ${fmt(target)} is ${d} ${PL[k + 1]}, and one place to the right is ${d} ${PL[k]}.`, `The missing number is ${fmt(base)}.`] }
  } },
  { style: 'two-step story, 10 times twice', make: r => {
    const [thing, c1, c1s, c2, c2s, c3] = pick(r, [['buttons', 'card', 'cards', 'bag', 'bags', 'box'], ['crayons', 'pack', 'packs', 'box', 'boxes', 'crate'], ['stamps', 'sheet', 'sheets', 'book', 'books', 'carton']] as const)
    const start = int(r, 2, 9) * 10 ** int(r, 0, 2)
    return { text: `A factory puts ${fmt(start)} ${thing} on each ${c1}. 10 ${c1s} go in a ${c2}, and 10 ${c2s} go in a ${c3}. How many ${thing} are in a ${c3}?`,
      picture: { kind: 'table', head: ['', thing], rows: [[`1 ${c1}`, fmt(start)], [`1 ${c2}`, '?'], [`1 ${c3}`, '?']] }, answer: start * 100,
      steps: [`A ${c2} holds 10 ${c1s}: 10 × ${fmt(start)} = ${fmt(start * 10)} ${thing}.`, `A ${c3} holds 10 ${c2s}: 10 × ${fmt(start * 10)} = ${fmt(start * 100)}.`, `So a ${c3} has ${fmt(start * 100)} ${thing}.`] }
  } },
]

// ── t3 · Compare big numbers ────────────────────────────────────────────────────────────────────────────────
const SIGNS = ['<', '>', '=']
const signOf = (a: number, b: number) => (a < b ? '<' : a > b ? '>' : '=')
const signAnswer = (a: number, b: number) => ({ choices: SIGNS, correct: SIGNS.indexOf(signOf(a, b)) })

const T3: Level[] = [
  { style: 'place chart, same length', make: r => {
    const L = pick(r, [5, 6]), p = int(r, 1, L - 1)
    const da = [int(r, 1, 9), ...Array.from({ length: L - 1 }, () => int(r, 0, 9))]
    const x = int(r, 0, 9), y = until(() => int(r, 0, 9), v => v !== x)
    const db = [...da.slice(0, p), y, ...Array.from({ length: L - p - 1 }, () => int(r, 0, 9))]
    da[p] = x
    const A = +da.join(''), B = +db.join(''), same = CHART.slice(6 - L, 6 - L + p)
    return { text: `Pick the sign that makes it true: ${fmt(A)} __ ${fmt(B)}`, picture: chart([A, B]), answer: signAnswer(A, B),
      steps: [`${cap(list(same))} are the same: ${da.slice(0, p).join(', ')}.`, `${cap(CHART[6 - L + p])}: ${x} is ${x > y ? 'more' : 'less'} than ${y}.`, `So ${fmt(A)} ${signOf(A, B)} ${fmt(B)}.`] }
  } },
  { style: 'bare, different number of digits (big first digit trap)', make: r => {
    const len = pick(r, [4, 5])
    const small = int(r, 7, 9) * 10 ** (len - 1) + int(r, 0, 10 ** (len - 1) - 1)
    const big = 10 ** len + int(r, 0, 9) * 10 ** (len - 2) + int(r, 0, 10 ** (len - 2) - 1)
    const [A, B] = r() < 0.5 ? [small, big] : [big, small]
    return { text: `Pick the sign that makes it true: ${fmt(A)} __ ${fmt(B)}`, picture: eq(`${fmt(A)} __ ${fmt(B)}`), answer: signAnswer(A, B),
      steps: [`Line up the places. ${fmt(big)} has a ${PL[len]} digit, and ${fmt(small)} has none.`, `So ${fmt(small)} is less, even though it starts with a ${String(small)[0]}.`, `So ${fmt(A)} ${signOf(A, B)} ${fmt(B)}.`] }
  } },
  { style: 'pick least to greatest', make: r => {
    const pp = int(r, 10, 99)
    const nums = until(() => [0, 1, 2].map(() => pp * 1000 + int(r, 0, 999)), xs => new Set(xs).size === 3)
    const [s0, s1, s2] = [...nums].sort((a, b) => a - b).map(fmt)
    const right = `${s0} < ${s1} < ${s2}`
    const wrong = shuffle(r, [[s0, s2, s1], [s1, s0, s2], [s1, s2, s0], [s2, s0, s1], [s2, s1, s0]]).slice(0, 3).map(x => x.join(' < '))
    return { text: 'Which list goes from least to greatest?', picture: eq(nums.map(fmt).join('    ')), answer: choose(r, right, wrong),
      steps: [`Line them up. They all have ${count(Math.floor(pp / 10), 4)} and ${count(pp % 10, 3)}.`, `Compare the next places: ${s0} is the least and ${s2} is the greatest.`, `So ${right}.`] }
  } },
  { style: 'which number fits between', make: r => {
    const lo = int(r, 10300, 89000), hi = lo + int(r, 200, 900), right = int(r, lo + 1, hi - 1)
    return { text: `Which number goes in the box? ${fmt(lo)} < ? < ${fmt(hi)}`, picture: eq(`${fmt(lo)} < ? < ${fmt(hi)}`),
      answer: choose(r, fmt(right), [lo - int(r, 1, 300), hi + int(r, 1, 300), hi].map(fmt)),
      steps: [`${fmt(right)} > ${fmt(lo)}: at the first place that is different, its digit is bigger.`, `${fmt(right)} < ${fmt(hi)}: at the first place that is different, its digit is smaller.`, `So ${fmt(right)} goes in the box.`] }
  } },
  { style: 'story, most or fewest of three', make: r => {
    const [what, names] = pick(r, [['people', ['Oak Town', 'River Town', 'Hill Town']], ['visitors', ['Sun Zoo', 'Lake Zoo', 'Park Zoo']]] as const)
    const pp = int(r, 10, 99)
    const nums = until(() => [0, 1, 2].map(() => pp * 10000 + int(r, 0, 9999)), xs => new Set(xs).size === 3)
    const most = r() < 0.5, k = nums.indexOf(most ? Math.max(...nums) : Math.min(...nums))
    const others = [0, 1, 2].filter(i => i !== k)
    return { text: `${names[0]} has ${fmt(nums[0])} ${what}. ${names[1]} has ${fmt(nums[1])}. ${names[2]} has ${fmt(nums[2])}. Which one has the ${most ? 'most' : 'fewest'} ${what}?`,
      picture: eq(most ? 'the most?' : 'the fewest?'), answer: { choices: [...names], correct: k },
      steps: [`Line up the places. All three start with ${fmt(pp)}, so compare the thousands, then the hundreds.`,
        `${fmt(nums[k])} is ${most ? 'more' : 'less'} than ${fmt(nums[others[0]])} and ${fmt(nums[others[1]])}.`, `So ${names[k]} has the ${most ? 'most' : 'fewest'} ${what}.`] }
  } },
]

// ── t4 · Round big numbers ──────────────────────────────────────────────────────────────────────────────────
const UNIT: Record<number, string> = { 100: 'hundred', 1000: 'thousand', 10000: 'ten thousand' }
const DOWN: Record<number, string> = { 100: 'tens', 1000: 'hundreds', 10000: 'thousands' }
const roundTo = (x: number, u: number) => Math.floor((x + u / 2) / u) * u
const halfSteps = (x: number, u: number, end: string) => {
  const lo = Math.floor(x / u) * u, mid = lo + u / 2
  return [`${fmt(x)} is between ${fmt(lo)} and ${fmt(lo + u)}.`,
    x === mid ? `${fmt(x)} is exactly halfway, and halfway rounds up.` : `Halfway is ${fmt(mid)}, and ${fmt(x)} ${x > mid ? 'is past halfway' : 'has not reached it'}.`, end]
}
const digitSteps = (x: number, u: number, end: string) => {
  const lo = Math.floor(x / u) * u, d = digit(x, Math.log10(u) - 1)
  return [`${fmt(x)} is between ${fmt(lo)} and ${fmt(lo + u)}.`, `The ${DOWN[u]} digit is ${d}, which is ${d >= 5 ? '5 or more, so it rounds up' : 'less than 5, so it rounds down'}.`, end]
}

const T4: Level[] = [
  { style: 'number line, nearest thousand', make: r => {
    const x = int(r, 11, 98) * 1000 + int(r, 1, 99) * 10, lo = Math.floor(x / 1000) * 1000, R = roundTo(x, 1000)
    return { text: `Round ${fmt(x)} to the nearest thousand.`, answer: R,
      picture: { kind: 'numline', min: lo - 100, max: lo + 1100, ticks: 12, labels: 'none', points: [{ at: x, label: fmt(x) }] },
      steps: halfSteps(x, 1000, `So ${fmt(x)} rounds to ${fmt(R)}.`) }
  } },
  { style: 'bare, any place', make: r => {
    const u = pick(r, [100, 1000, 10000])
    const x = until(() => u === 10000 ? int(r, 100000, 989999) : u === 1000 ? int(r, 10000, 98999) : int(r, 1000, 9899), v => v % u !== 0 && v % 10 === 0)
    const R = roundTo(x, u)
    return { text: `Round ${fmt(x)} to the nearest ${UNIT[u]}.`, picture: eq(fmt(x), [`nearest ${UNIT[u]}`]), answer: R,
      steps: digitSteps(x, u, `So ${fmt(x)} rounds to ${fmt(R)}.`) }
  } },
  { style: 'pick the number that rounds to it (halfway and cross-out traps)', make: r => {
    const R = int(r, 11, 98) * 1000
    const right = R + int(r, -49, 49) * 10
    const x = right === R ? R + 230 : right
    const wrong = [R - 500 - int(r, 1, 49) * 10, R + 500, R + int(r, 51, 99) * 10].map(fmt)
    return { text: `Which number rounds to ${fmt(R)} when you round to the nearest thousand?`, picture: eq(`? rounds to ${fmt(R)}`, ['nearest thousand']),
      answer: choose(r, fmt(x), wrong), steps: halfSteps(x, 1000, `So ${fmt(x)} rounds to ${fmt(R)}.`) }
  } },
  { style: 'work backwards: smallest or greatest', make: r => {
    const u = pick(r, [100, 1000]), R = int(r, 11, 98) * u, smallest = r() < 0.5
    const unit = `the nearest ${UNIT[u]}`
    if (smallest) return { text: `A whole number rounds to ${fmt(R)} when you round it to ${unit}. What is the smallest it could be?`,
      picture: eq(`? rounds to ${fmt(R)}`, [unit]), answer: R - u / 2,
      steps: [`The halfway number below ${fmt(R)} is ${fmt(R - u / 2)}. Halfway rounds up, so it rounds to ${fmt(R)}.`, `One less, ${fmt(R - u / 2 - 1)}, rounds down to ${fmt(R - u)}.`, `So the smallest is ${fmt(R - u / 2)}.`] }
    return { text: `A whole number rounds to ${fmt(R)} when you round it to ${unit}. What is the greatest it could be?`,
      picture: eq(`? rounds to ${fmt(R)}`, [unit]), answer: R + u / 2 - 1,
      steps: [`The halfway number above ${fmt(R)} is ${fmt(R + u / 2)}. Halfway rounds up, so it rounds to ${fmt(R + u)}.`, `One less does not reach halfway, so it rounds down to ${fmt(R)}.`, `So the greatest is ${fmt(R + u / 2 - 1)}.`] }
  } },
  { style: 'story, rounding up past a 9', make: r => {
    const u = pick(r, [100, 1000])
    const x = u === 100 ? int(r, 1, 98) * 1000 + 900 + int(r, 5, 9) * 10 + int(r, 0, 9) : int(r, 1, 98) * 10000 + 9000 + int(r, 5, 9) * 100 + int(r, 0, 9) * 10
    const R = roundTo(x, u), lo = R - u, [what, place] = pick(r, [['fans', 'a game'], ['people', 'a fair'], ['runners', 'a race']] as const)
    return { text: `${cap(place)} had ${fmt(x)} ${what}. The news rounds it to the nearest ${UNIT[u]}. What number does the news say?`,
      picture: eq(`${fmt(x)} ${what}`, [`nearest ${UNIT[u]}`]), answer: R,
      steps: [`${fmt(x)} is between ${fmt(lo)} and ${fmt(R)}.`, `The ${DOWN[u]} digit is ${digit(x, Math.log10(u) - 1)}, which is 5 or more, so it rounds up. One more ${UNIT[u]} after ${fmt(lo)} is ${fmt(R)}.`, `So the news says ${fmt(R)} ${what}.`] }
  } },
]

// ── t5 · Add big numbers ────────────────────────────────────────────────────────────────────────────────────
const NAMES = PL.map(cap)
/** One line per place, from the ones: what is added, and what is written and carried. */
const addLines = (a: number, b: number) => {
  const n = Math.max(String(a).length, String(b).length), out: string[] = []
  let c = 0
  for (let i = 0; i < n; i++) {
    const s = digit(a, i) + digit(b, i) + c
    out.push(`${NAMES[i]}: ${digit(a, i)} + ${digit(b, i)}${c ? ' + 1' : ''} = ${s}.${s >= 10 && i < n - 1 ? ` Write ${s % 10}, carry 1.` : ''}`)
    c = s >= 10 ? 1 : 0
  }
  return out
}
const inThree = (lines: string[], end: string) => {
  const k = Math.ceil(lines.length / 3)
  const out = [lines.slice(0, k), lines.slice(k, 2 * k), lines.slice(2 * k)].filter(x => x.length).map(x => x.join(' '))
  out[out.length - 1] += ` ${end}`
  return out
}
/** Places (from the ones) that receive a carried 1. */
const carriedInto = (a: number, b: number) => {
  const out: number[] = []
  let c = 0
  for (let i = 0; i < String(Math.max(a, b)).length; i++) { c = digit(a, i) + digit(b, i) + c >= 10 ? 1 : 0; if (c) out.push(i + 1) }
  return out
}
const pair = (r: Rng, lo: number, hi: number, carries: number) => until(() => ({ a: int(r, lo, hi), b: int(r, lo, hi) }), x => carriedInto(x.a, x.b).length >= carries)

const T5: Level[] = [
  { style: 'columns with places', make: r => {
    const { a, b } = until(() => pair(r, 1000, 7999, 2), x => x.a + x.b < 10000)
    return { text: `Add: ${fmt(a)} + ${fmt(b)}`, picture: { kind: 'columns', rows: [String(a), String(b)], op: '+', places: ['Th', 'H', 'T', 'O'], answer: null },
      answer: a + b, steps: inThree(addLines(a, b), `So the total is ${fmt(a + b)}.`) }
  } },
  { style: 'bare, five or six digits', make: r => {
    const big = r() < 0.5 ? [10000, 69999] : [100000, 499999]
    const { a, b } = pair(r, big[0], big[1], 3)
    return { text: `Add: ${fmt(a)} + ${fmt(b)}`, picture: eq(`${fmt(a)} + ${fmt(b)} = ?`), answer: a + b,
      steps: inThree(addLines(a, b), `So the total is ${fmt(a + b)}.`) }
  } },
  { style: 'pick the right sum (a forgotten carry)', make: r => {
    const { a, b } = until(() => pair(r, 1000, 7999, 2), x => x.a + x.b < 10000)
    const s = a + b, noCarry = String(a).split('').reduce((t, _, i) => t + ((digit(a, i) + digit(b, i)) % 10) * 10 ** i, 0)
    const say = (v: number) => `${fmt(a)} + ${fmt(b)} = ${fmt(v)}`
    const wrong = [...new Set([noCarry, s - 10 ** pick(r, carriedInto(a, b)), s + 10])].filter(v => v !== s).map(say)
    return { text: 'Which sum is right?', picture: { kind: 'columns', rows: [String(a), String(b)], op: '+', answer: null },
      answer: choose(r, say(s), wrong), steps: inThree(addLines(a, b), `So ${say(s)}.`) }
  } },
  { style: 'missing digit in the top number', make: r => {
    const { a, b } = until(() => pair(r, 1000, 7999, 1), x => x.a + x.b < 10000)
    const p = pick(r, [1, 2]), s = a + b, q = digit(a, p)
    const lines = addLines(a, b), c = carriedInto(a, b).includes(p) ? 1 : 0
    const top = String(a).split(''), at = top.length - 1 - p
    top[at] = '?'
    return { text: 'What digit is missing from the top number?', picture: { kind: 'columns', rows: [top.join(''), String(b)], op: '+', answer: String(s) },
      answer: q,
      steps: [lines.slice(0, p).join(' '), `${NAMES[p]}: ? + ${digit(b, p)}${c ? ' + 1' : ''} must end in ${digit(s, p)}.`, `${q} + ${digit(b, p)}${c ? ' + 1' : ''} = ${q + digit(b, p) + c}, so the missing digit is ${q}.`] }
  } },
  { style: 'two-step story, three amounts', make: r => {
    const [what, where, m] = pick(r, [['apples', 'A farm picked', ['in June', 'in July', 'in August']], ['visitors', 'A museum had', ['on Friday', 'on Saturday', 'on Sunday']], ['tickets', 'A theater sold', ['in May', 'in June', 'in July']]] as const)
    const [a, b, c] = [int(r, 12000, 39999), int(r, 12000, 39999), int(r, 1200, 9999)]
    return { text: `${where} ${fmt(a)} ${what} ${m[0]}, ${fmt(b)} ${m[1]} and ${fmt(c)} ${m[2]}. How many ${what} is that in all?`,
      picture: eq(`${fmt(a)} + ${fmt(b)} + ${fmt(c)} = ?`), answer: a + b + c,
      steps: [`Step 1: ${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}.`, `Step 2: ${fmt(a + b)} + ${fmt(c)} = ${fmt(a + b + c)}.`, `So that is ${fmt(a + b + c)} ${what} in all.`] }
  } },
]

// ── t6 · Subtract across zeros ──────────────────────────────────────────────────────────────────────────────
/** top = a lead digit, then zeros, then o in the ones; bottom's ones digit is more than o, so the zeros must be broken. */
const across = (r: Rng, len: 4 | 5) => until(() => {
  const k = len - 1, lead = int(r, 2, 9), o = int(r, 0, 8), top = lead * 10 ** k + o
  const bottom = int(r, 1000, top - 1)
  return { top, bottom, k, lead, o }
}, x => digit(x.bottom, 0) > x.o && digit(x.bottom, x.k) <= x.lead - 1)
const breakParts = ({ top, k, lead, o }: { top: number; k: number; lead: number; o: number }, sub: number) => {
  const have = [10 + o, ...Array(k - 1).fill(9), lead - 1]
  return {
    brk: `Break 1 of the ${count(lead, k)}.`,
    now: `Now there ${lead - 1 === 1 ? 'is' : 'are'} ${list([count(lead - 1, k), ...Array.from({ length: k - 1 }, (_, j) => count(9, k - 1 - j)), count(10 + o, 0)])}.`,
    diffs: `${have.map((h, i) => `${h} − ${digit(sub, i)} = ${h - digit(sub, i)}`).join(', ')}.`,
    top,
  }
}

const T6: Level[] = [
  { style: 'columns with places', make: r => {
    const x = across(r, 4), s = breakParts(x, x.bottom)
    return { text: `Subtract: ${fmt(x.top)} − ${fmt(x.bottom)}`, answer: x.top - x.bottom,
      picture: { kind: 'columns', rows: [String(x.top), String(x.bottom)], op: '−', places: ['Th', 'H', 'T', 'O'], answer: null },
      steps: [`You cannot take ${digit(x.bottom, 0)} from ${x.o}, and the tens and hundreds are 0. ${s.brk}`, s.now, `${s.diffs} So the answer is ${fmt(x.top - x.bottom)}.`] }
  } },
  { style: 'bare, five digits', make: r => {
    const x = across(r, 5), s = breakParts(x, x.bottom)
    return { text: `Subtract: ${fmt(x.top)} − ${fmt(x.bottom)}`, picture: eq(`${fmt(x.top)} − ${fmt(x.bottom)} = ?`), answer: x.top - x.bottom,
      steps: [`The first digit that is not zero is the ${x.lead} ${PL[4]}. ${s.brk}`, s.now, `${s.diffs} So the answer is ${fmt(x.top - x.bottom)}.`] }
  } },
  { style: 'pick the right difference (flipped digits, zeros not 9)', make: r => {
    const x = across(r, 4), s = breakParts(x, x.bottom), d = x.top - x.bottom
    const flip = [0, 1, 2, 3].reduce((t, i) => t + Math.abs(digit(x.top, i) - digit(x.bottom, i)) * 10 ** i, 0)
    const say = (v: number) => `${fmt(x.top)} − ${fmt(x.bottom)} = ${fmt(v)}`
    const wrong = [...new Set([flip, d + 1000, d + 110])].filter(v => v !== d).map(say)
    return { text: 'Which answer is right?', picture: eq(`${fmt(x.top)} − ${fmt(x.bottom)}`), answer: choose(r, say(d), wrong),
      steps: [`${s.brk} ${s.now}`, s.diffs, `So ${say(d)}.`] }
  } },
  { style: 'missing part, go backwards', make: r => {
    const x = across(r, 4), d = x.top - x.bottom, s = breakParts(x, d)
    return { text: `What number goes in the box? ${fmt(x.top)} − ? = ${fmt(d)}`, picture: eq(`${fmt(x.top)} − ? = ${fmt(d)}`), answer: x.bottom,
      steps: [`Go backwards: find ${fmt(x.top)} − ${fmt(d)}.`, `${s.brk} ${s.now}`, `${s.diffs} So the missing number is ${fmt(x.bottom)}.`] }
  } },
  { style: 'two-step story (add, then subtract across zeros)', make: r => {
    const [made, what, word] = pick(r, [['A bakery made', 'cookies', 'sold'], ['A school printed', 'flyers', 'handed out'], ['A farm grew', 'pumpkins', 'sold']] as const)
    const gen = () => { const top = int(r, 5, 9) * 1000, a = int(r, 1000, 2999), b = int(r, 1000, 1999); return { top, a, b, s: a + b } }
    const tape = (v: ReturnType<typeof gen>): Picture => ({ kind: 'tape', rows: [{ cells: [{ w: Math.round(v.a / 100), text: fmt(v.a) }, { w: Math.round(v.b / 100), text: fmt(v.b) }, { w: Math.round((v.top - v.s) / 100), text: '?', shade: true }], brace: fmt(v.top) }] })
    const v = until(gen, y => y.top - y.s >= 500 && y.s % 10 !== 0 && hides(tape(y), y.top - y.s)), d = v.top - v.s
    return { text: `${made} ${fmt(v.top)} ${what}. It ${word} ${fmt(v.a)} on Saturday and ${fmt(v.b)} on Sunday. How many ${what} are left?`, picture: tape(v), answer: d,
      steps: [`Step 1: ${fmt(v.a)} + ${fmt(v.b)} = ${fmt(v.s)}.`, `Step 2: ${fmt(v.top)} − ${fmt(v.s)}. Break 1 thousand, so the zeros become 9s: ${fmt(d)}.`, `So ${fmt(d)} ${what} are left.`] }
  } },
]

// ── t7 · Is my answer about right? ──────────────────────────────────────────────────────────────────────────
const messy = (r: Rng, lo: number, hi: number, u: number) => until(() => int(r, lo, hi), v => v % u !== 0)

const T7: Level[] = [
  { style: 'table, round to thousands then add', make: r => {
    const a = messy(r, 1100, 8400, 1000), b = messy(r, 1100, 8400, 1000), ra = roundTo(a, 1000), rb = roundTo(b, 1000)
    return { text: `Round each number to the nearest thousand, then add. About how much is ${fmt(a)} + ${fmt(b)}?`,
      picture: { kind: 'table', head: ['number', 'nearest thousand'], rows: [[fmt(a), '?'], [fmt(b), '?']] }, answer: ra + rb,
      steps: [`${fmt(a)} rounds to ${fmt(ra)}. ${fmt(b)} rounds to ${fmt(rb)}.`, `${fmt(ra)} + ${fmt(rb)} = ${fmt(ra + rb)}.`, `So ${fmt(a)} + ${fmt(b)} is about ${fmt(ra + rb)}.`] }
  } },
  { style: 'bare, hundreds or ten thousands, add or subtract', make: r => {
    const u = pick(r, [100, 10000]), [lo, hi] = u === 100 ? [1100, 8900] : [11000, 89000], minus = r() < 0.5
    const { a, b } = until(() => ({ a: messy(r, lo, hi, u), b: messy(r, lo, hi, u) }), x => !minus || roundTo(x.a, u) > roundTo(x.b, u))
    const ra = roundTo(a, u), rb = roundTo(b, u), e = minus ? ra - rb : ra + rb, op = minus ? '−' : '+'
    return { text: `Round each number to the nearest ${UNIT[u]}, then ${minus ? 'subtract' : 'add'}. About how much is ${fmt(a)} ${op} ${fmt(b)}?`,
      picture: eq(`${fmt(a)} ${op} ${fmt(b)}`, [`nearest ${UNIT[u]}`]), answer: e,
      steps: [`${fmt(a)} rounds to ${fmt(ra)}. ${fmt(b)} rounds to ${fmt(rb)}.`, `${fmt(ra)} ${op} ${fmt(rb)} = ${fmt(e)}.`, `So ${fmt(a)} ${op} ${fmt(b)} is about ${fmt(e)}.`] }
  } },
  { style: 'is his answer about right? (yes or no)', make: r => {
    const name = pick(r, ['Leo', 'Sam', 'Ben']), minus = r() < 0.5, op = minus ? '−' : '+'
    const x = until(() => {
      const a = messy(r, 5100, 8900, 1000), b = messy(r, 1100, 4400, 1000), ra = roundTo(a, 1000), rb = roundTo(b, 1000)
      return { a, b, ra, rb, t: minus ? a - b : a + b, e: minus ? ra - rb : ra + rb }
    }, v => Math.abs(v.t - v.e) <= 400)
    const ok = r() < 0.5, said = ok ? x.t : x.t + pick(r, x.t > 4000 ? [-3000, -2000, 2000, 3000] : [2000, 3000])
    return { text: `${name} says ${fmt(x.a)} ${op} ${fmt(x.b)} = ${fmt(said)}. Round each number to the nearest thousand to check. Is his answer about right?`,
      picture: eq(`${fmt(x.a)} ${op} ${fmt(x.b)} = ${fmt(said)}`), answer: { choices: ['yes', 'no'], correct: ok ? 0 : 1 },
      steps: [`${fmt(x.a)} rounds to ${fmt(x.ra)}. ${fmt(x.b)} rounds to ${fmt(x.rb)}.`, `${fmt(x.ra)} ${op} ${fmt(x.rb)} = ${fmt(x.e)}.`,
        ok ? `${fmt(said)} is close to ${fmt(x.e)}, so yes.` : `${fmt(said)} is far from ${fmt(x.e)}, so no.`] }
  } },
  { style: 'which number could go in the box (work backwards)', make: r => {
    const b = messy(r, 1100, 3400, 1000), rb = roundTo(b, 1000), rx = int(r, 2, 6) * 1000, E = rb + rx
    const right = until(() => int(r, rx - 500, rx + 499), v => v % 1000 !== 0)
    const wrong = [int(r, rx + 500, rx + 990), int(r, rx - 1490, rx - 501), int(r, rx + 1100, rx + 1490)]
    return { text: `Round each number to the nearest thousand. ? + ${fmt(b)} is about ${fmt(E)}. Which number could go in the box?`,
      picture: eq(`? + ${fmt(b)}`, [`about ${fmt(E)}`]), answer: choose(r, fmt(right), wrong.map(fmt)),
      steps: [`${fmt(b)} rounds to ${fmt(rb)}, so the box must round to ${fmt(E)} − ${fmt(rb)} = ${fmt(rx)}.`, `${fmt(right)} is between ${fmt(rx - 500)} and ${fmt(rx + 499)}, so it rounds to ${fmt(rx)}.`, `So ${fmt(right)} could go in the box.`] }
  } },
  { style: 'two-step story, estimate what is still needed', make: r => {
    const [what, who] = pick(r, [['cans', ['Class A', 'Class B']], ['books', ['Team Red', 'Team Blue']]] as const)
    const a = messy(r, 1100, 4400, 1000), b = messy(r, 1100, 4400, 1000), ra = roundTo(a, 1000), rb = roundTo(b, 1000), G = ra + rb + int(r, 1, 4) * 1000
    const e = G - ra - rb
    return { text: `A school wants to collect ${fmt(G)} ${what}. ${who[0]} brought ${fmt(a)} and ${who[1]} brought ${fmt(b)}. Round each to the nearest thousand. About how many more ${what} do they need?`,
      picture: { kind: 'table', head: ['', what, 'nearest thousand'], rows: [[who[0], fmt(a), '?'], [who[1], fmt(b), '?']], rowHead: true }, answer: e,
      steps: [`${fmt(a)} rounds to ${fmt(ra)}. ${fmt(b)} rounds to ${fmt(rb)}.`, `Step 1: ${fmt(ra)} + ${fmt(rb)} = ${fmt(ra + rb)}. Step 2: ${fmt(G)} − ${fmt(ra + rb)} = ${fmt(e)}.`, `So they need about ${fmt(e)} more ${what}.`] }
  } },
]

// ── t8 · Two-step add and subtract stories ──────────────────────────────────────────────────────────────────
const T8: Level[] = [
  { style: 'tape: add, then take away', make: r => {
    const [place, what, got, gave] = pick(r, [['school', 'pencils', 'bought', 'handed out'], ['shop', 'stickers', 'got', 'sold'], ['bakery', 'rolls', 'baked', 'sold'], ['library', 'books', 'got', 'gave away']] as const)
    const gen = () => ({ h: int(r, 120, 380) * 10, g: int(r, 8, 20) * 100, x: int(r, 40, 99) * 10 })
    const tape = (v: ReturnType<typeof gen>): Picture => ({ kind: 'tape', rows: [
      { cells: [{ w: v.h / 10, text: fmt(v.h) }, { w: v.g / 10, text: fmt(v.g), shade: true }] },
      { cells: [{ w: (v.h + v.g - v.x) / 10, text: '?' }, { w: v.x / 10, text: fmt(v.x), shade: true }] }] })
    const v = until(gen, y => hides(tape(y), y.h + y.g - y.x)), ans = v.h + v.g - v.x
    return { text: `A ${place} had ${fmt(v.h)} ${what}. It ${got} ${fmt(v.g)} more. Then it ${gave} ${fmt(v.x)}. How many ${what} are left?`, picture: tape(v), answer: ans,
      steps: [`Step 1: ${fmt(v.h)} + ${fmt(v.g)} = ${fmt(v.h + v.g)} ${what}.`, `Step 2: ${fmt(v.h + v.g)} − ${fmt(v.x)} = ${fmt(ans)}.`, `So ${fmt(ans)} ${what} are left.`] }
  } },
  { style: 'tape: how many more to reach a goal', make: r => {
    const kind = pick(r, ['pages', 'cans', 'money'] as const)
    const gen = () => { const a = int(r, 100, 299) * 10, b = int(r, 50, 199) * 10; return { a, b, G: (Math.floor((a + b) / 1000) + int(r, 1, 2)) * 1000 } }
    const $ = (n: number) => (kind === 'money' ? `$${fmt(n)}` : fmt(n))
    const tape = (v: ReturnType<typeof gen>): Picture => ({ kind: 'tape', rows: [{ cells: [{ w: v.a / 10, text: $(v.a) }, { w: v.b / 10, text: $(v.b) }, { w: (v.G - v.a - v.b) / 10, text: '?', shade: true }], brace: $(v.G) }] })
    const v = until(gen, y => hides(tape(y), y.G - y.a - y.b)), need = v.G - v.a - v.b
    const text = kind === 'pages' ? `A class read ${$(v.a)} pages in March and ${$(v.b)} pages in April. Their goal is ${$(v.G)} pages. How many more pages do they need to read?`
      : kind === 'cans' ? `A club collected ${$(v.a)} cans on Monday and ${$(v.b)} cans on Tuesday. Its goal is ${$(v.G)} cans. How many more cans does it need?`
      : `Ana wants to save ${$(v.G)}. She saved ${$(v.a)} last year and ${$(v.b)} this year. How much more does she need to save?`
    return { text, picture: tape(v), answer: need,
      steps: [`Step 1: ${$(v.a)} + ${$(v.b)} = ${$(v.a + v.b)}.`, `Step 2: ${$(v.G)} − ${$(v.a + v.b)} = ${$(need)}.`, kind === 'money' ? `So Ana needs ${$(need)} more.` : `So they need ${fmt(need)} more ${kind}.`] }
  } },
  { style: 'pick the right answer (stopped after step 1)', make: r => {
    const [intro, unit, off, on, ask, has] = pick(r, [['A truck carried', 'pounds', 'It dropped off', 'Then it picked up', 'How many pounds is it carrying now?', 'So it is carrying'], ['A tank held', 'gallons', 'It used', 'Then it got', 'How many gallons are in it now?', 'So it holds']] as const)
    const s = int(r, 300, 600) * 10, d = int(r, 100, 200) * 10, p = int(r, 40, 99) * 10, ans = s - d + p
    const say = (v: number) => `${fmt(v)} ${unit}`
    return { text: `${intro} ${fmt(s)} ${unit}. ${off} ${fmt(d)} ${unit}. ${on} ${fmt(p)} ${unit}. ${ask}`,
      picture: { kind: 'tape', rows: [{ cells: [{ w: Math.round(s / 15) }, { w: d / 10, text: fmt(d), shade: true }], brace: fmt(s) }, { cells: [{ w: Math.round(s / 15) }, { w: p / 10, text: fmt(p), shade: true }], brace: '?' }] },
      answer: choose(r, say(ans), [s - d, s - d - p, s + d + p].map(say)),
      steps: [`Step 1: ${fmt(s)} − ${fmt(d)} = ${fmt(s - d)} ${unit}. Don't stop here.`, `Step 2: ${fmt(s - d)} + ${fmt(p)} = ${fmt(ans)}.`, `${has} ${say(ans)} now.`] }
  } },
  { style: 'work backwards to the start', make: r => {
    const [place, what, got, gave] = pick(r, [['library', 'books', 'got', 'gave away'], ['shop', 'hats', 'got', 'sold']] as const)
    const v = until(() => ({ start: int(r, 150, 400) * 10, g: int(r, 8, 20) * 100, x: int(r, 40, 99) * 10 }), y => y.g !== y.x && y.start !== y.g && y.start !== y.x)
    const n = v.start + v.g - v.x
    return { text: `A ${place} had some ${what}. It ${got} ${fmt(v.g)} more. Then it ${gave} ${fmt(v.x)}. Now it has ${fmt(n)}. How many ${what} did it have at the start?`,
      picture: eq(`? + ${fmt(v.g)} − ${fmt(v.x)} = ${fmt(n)}`), answer: v.start,
      steps: [`Work backwards. Before it ${gave} ${fmt(v.x)}, it had ${fmt(n)} + ${fmt(v.x)} = ${fmt(n + v.x)}.`, `Before it ${got} ${fmt(v.g)}, it had ${fmt(n + v.x)} − ${fmt(v.g)} = ${fmt(v.start)}.`, `So it had ${fmt(v.start)} ${what} at the start.`] }
  } },
  { style: 'two-step compare story, five digits', make: r => {
    const [what, one, two] = pick(r, [['cans', 'Pine School', 'Oak School'], ['points', 'Team Red', 'Team Blue']] as const)
    const gen = () => { const a = int(r, 1000, 3000) * 10, b = int(r, 200, 900) * 10; return { a, b, c: a + b + int(r, 100, 900) * 10 } }
    const tape = (v: ReturnType<typeof gen>): Picture => ({ kind: 'tape', rows: [
      { label: one, cells: [{ w: v.a / 10, text: fmt(v.a) }, { w: v.b / 10, text: fmt(v.b), shade: true }, { w: (v.c - v.a - v.b) / 10, text: '?' }] },
      { label: two, cells: [{ w: v.c / 10, text: fmt(v.c) }] }] })
    const v = until(gen, y => hides(tape(y), y.c - y.a - y.b)), d = v.c - v.a - v.b
    return { text: `${one} had ${fmt(v.a)} ${what}. Then it got ${fmt(v.b)} more. ${two} has ${fmt(v.c)} ${what}. How many more ${what} does ${two} have than ${one} now?`,
      picture: tape(v), answer: d,
      steps: [`Step 1: ${fmt(v.a)} + ${fmt(v.b)} = ${fmt(v.a + v.b)} ${what}.`, `Step 2: ${fmt(v.c)} − ${fmt(v.a + v.b)} = ${fmt(d)}.`, `So ${two} has ${fmt(d)} more ${what}.`] }
  } },
]

export const G4M1_LADDERS: Record<string, Level[]> = {
  'g4m1-t1': T1, 'g4m1-t2': T2, 'g4m1-t3': T3, 'g4m1-t4': T4, 'g4m1-t5': T5, 'g4m1-t6': T6, 'g4m1-t7': T7, 'g4m1-t8': T8,
}
