/**
 * Grade 3 · Module 6 — shapes, measuring and graphs. Practice ladders, easiest style first (see ../adaptive.ts and the
 * reference ladders in ./g5m1.ts). Every question stays inside its lesson: stars worth 2, bars read across to the side,
 * rulers to the half and quarter inch, line plots, square/rectangle/neither, the distance around, same fence ≠ same room.
 */
import type { Answer, Picture } from '../script'
import { int, pick, shuffle, type Level, type Rng } from '../adaptive'

const eq = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })
const choose = (r: Rng, right: string, wrong: string[]) => {
  const choices = shuffle(r, [right, ...wrong])
  return { choices, correct: choices.indexOf(right) }
}
const until = <T>(gen: () => T, ok: (x: T) => boolean): T => { let x = gen(); while (!ok(x)) x = gen(); return x }
const pl = (n: number, one: string, many: string) => (n === 1 ? one : many)
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)

/** Every number a picture shows (a table row also read joined up) — the same reading the gate does. */
const shown = (pic: Picture) => {
  const texts: string[] = []
  const walk = (v: unknown) => {
    if (typeof v === 'string' || typeof v === 'number') texts.push(String(v))
    else if (Array.isArray(v)) { if (v.every(x => typeof x === 'string')) texts.push(v.join('')); v.forEach(walk) }
    else if (v && typeof v === 'object') Object.values(v).forEach(walk)
  }
  walk(pic)
  return new Set(texts.flatMap(t => t.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map(t => t.replace(/,/g, '')))
}
/** True when the picture does not give away a number answer. */
const hides = (pic: Picture, a: number) => a < 10 || !shown(pic).has(String(a))

// ── t1 · Picture graph, each picture = 2 ────────────────────────────────────────────────────────────────────
const T1_THEMES = [
  { unit: 'books', one: 'book', base: 'read', past: 'read', names: ['Mia', 'Leo', 'Ava', 'Ben'] },
  { unit: 'apples', one: 'apple', base: 'pick', past: 'picked', names: ['Sam', 'Kim', 'Raj', 'Nia'] },
  { unit: 'shells', one: 'shell', base: 'find', past: 'found', names: ['Jon', 'Ana', 'Eli', 'Zoe'] },
  { unit: 'stickers', one: 'sticker', base: 'get', past: 'got', names: ['Max', 'Lily', 'Omar', 'Ivy'] },
] as const
type Theme1 = (typeof T1_THEMES)[number]

const starGraph = (th: Theme1, labels: string[], values: number[]): Picture => ({ kind: 'chart', type: 'picture', labels, values, scale: 2, unit: th.unit })
const starsWords = (v: number) => {
  const full = Math.floor(v / 2), half = v % 2
  if (!full) return 'a half star'
  return `${full} ${pl(full, 'star', 'stars')}${half ? ' and a half star' : ''}`
}
const byTwos = (v: number) => Array.from({ length: Math.floor(v / 2) }, (_, i) => 2 * (i + 1)).join(', ')
const rowSays = (name: string, v: number) => `${name} has ${starsWords(v)}, which is ${v}.`
const setup1 = (r: Rng) => { const th = pick(r, T1_THEMES); return { th, names: shuffle(r, th.names).slice(0, 3) } }

const T1: Level[] = [
  { style: 'count one row by 2s', make: r => {
    const { th, names } = setup1(r), i = int(r, 0, 2), values = names.map(() => int(r, 2, 16))
    values[i] = int(r, 2, 9)
    const v = values[i], name = names[i], half = v % 2
    return { text: `Each star stands for 2 ${th.unit}. Count ${name}'s stars by 2s. How many ${th.unit} did ${name} ${th.base}?`,
      picture: starGraph(th, names, values), answer: v,
      steps: [`${name} has ${starsWords(v)}.`, half ? `Count the whole stars by 2s: ${byTwos(v)}. A half star is 1 more.` : `Count by 2s: ${byTwos(v)}.`,
        `So ${name} ${th.past} ${v} ${th.unit}.`] }
  } },
  { style: 'how many more, two rows', make: r => {
    const gen = () => { const { th, names } = setup1(r); return { th, names, values: names.map(() => int(r, 2, 16)) } }
    const x = until(gen, y => y.values[0] !== y.values[1] && hides(starGraph(y.th, y.names, y.values), Math.abs(y.values[0] - y.values[1])))
    const [i, j] = x.values[0] > x.values[1] ? [0, 1] : [1, 0]
    const a = x.values[i], b = x.values[j], d = a - b, A = x.names[i], B = x.names[j], th = x.th
    return { text: `How many more ${th.unit} did ${A} ${th.base} than ${B}?`, picture: starGraph(th, x.names, x.values), answer: d,
      steps: [`Each star is 2. ${rowSays(A, a)}`, rowSays(B, b), `${a} − ${b} = ${d}. So ${A} ${th.past} ${d} more ${pl(d, th.one, th.unit)}.`] }
  } },
  { style: 'spot the mistake: each star counted as 1', make: r => {
    const { th, names } = setup1(r), i = int(r, 0, 2), values = names.map(() => int(r, 2, 16))
    const f = int(r, 2, 8), v = 2 * f
    values[i] = v
    const name = names[i], right = `${name} ${th.past} ${v} ${th.unit}.`
    return { text: `Pat says ${name} ${th.past} ${f} ${th.unit}, because ${name} has ${f} stars. What is true?`,
      picture: starGraph(th, names, values), answer: choose(r, right, ['Pat is right.', `${name} ${th.past} ${v + 2} ${th.unit}.`]),
      steps: [`Each star stands for 2 ${th.unit}, not 1.`, `Count ${name}'s ${f} stars by 2s: ${byTwos(v)}.`, `So ${right}`] }
  } },
  { style: 'missing row: how many stars to draw', make: r => {
    const { th, names } = setup1(r), b = int(r, 2, 12), k = int(r, 1, 3) * 2 - (b % 2), t = b + k
    const other = int(r, 2, 16), values = [0, b, other]
    const s = t / 2
    return { text: `${names[0]} ${th.past} ${k} more ${pl(k, th.one, th.unit)} than ${names[1]}. ${names[0]}'s row is empty. How many stars go in ${names[0]}'s row?`,
      picture: starGraph(th, names, values), answer: s,
      steps: [rowSays(names[1], b), `${names[0]} ${th.past} ${k} more: ${b} + ${k} = ${t}.`, `Count by 2s to ${t}: ${byTwos(t)}. That is ${s} stars.`] }
  } },
  { style: 'two-step story: two rows together, then how many more', make: r => {
    const gen = () => { const { th, names } = setup1(r); return { th, names, values: names.map(() => int(r, 2, 16)) } }
    const x = until(gen, y => y.values[0] + y.values[1] > y.values[2] && hides(starGraph(y.th, y.names, y.values), y.values[0] + y.values[1] - y.values[2]))
    const [a, b, c] = x.values, [A, B, C] = x.names, th = x.th, d = a + b - c
    return { text: `How many more ${th.unit} did ${A} and ${B} ${th.base} together than ${C}?`, picture: starGraph(th, x.names, x.values), answer: d,
      steps: [`Count each row by 2s: ${A} ${th.past} ${a}, ${B} ${th.past} ${b} and ${C} ${th.past} ${c}.`, `Together, ${A} and ${B}: ${a} + ${b} = ${a + b}.`,
        `${a + b} − ${c} = ${d}. So they ${th.past} ${d} more ${pl(d, th.one, th.unit)}.`] }
  } },
]

// ── t2 · Bar graph ──────────────────────────────────────────────────────────────────────────────────────────
const T2_THEMES = [
  { labels: ['Apples', 'Grapes', 'Pears', 'Plums'], yLabel: 'Kids', noun: 'kids', verb: 'chose', than: 'than', name: (l: string) => l.toLowerCase() },
  { labels: ['Friday', 'Saturday', 'Sunday', 'Monday'], yLabel: 'Tickets', noun: 'tickets', verb: 'were sold on', than: 'than on', name: (l: string) => l },
  { labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'], yLabel: 'Birds', noun: 'birds', verb: 'came on', than: 'than on', name: (l: string) => l },
]
type Theme2 = (typeof T2_THEMES)[number]
const bars = (th: Theme2, labels: string[], values: number[], scale: number): Picture => ({ kind: 'chart', type: 'bar', labels, values, scale, yLabel: th.yLabel })
const setup2 = (r: Rng, scale: number) => {
  const th = pick(r, T2_THEMES), labels = shuffle(r, th.labels).slice(0, 3)
  return { th, labels, values: labels.map(() => scale * int(r, 1, 9)), scale }
}

const T2: Level[] = [
  { style: 'read one bar across to the side', make: r => {
    const x = setup2(r, 2), i = int(r, 0, 2)
    x.values[i] = 2 * int(r, 1, 4)
    const v = x.values[i], L = x.labels[i], n = x.th.name(L)
    return { text: `The numbers on the side count by 2s. How many ${x.th.noun} ${x.th.verb} ${n}?`, picture: bars(x.th, x.labels, x.values, 2), answer: v,
      steps: [`Put your finger on the top of the ${L} bar.`, `Slide it straight across to the numbers on the side. It lands on ${v}.`, `So ${v} ${x.th.noun} ${x.th.verb} ${n}.`] }
  } },
  { style: 'how many more, lines count by 5 or 10', make: r => {
    const x = until(() => setup2(r, pick(r, [5, 10])), y => y.values[0] !== y.values[1] && hides(bars(y.th, y.labels, y.values, y.scale), Math.abs(y.values[0] - y.values[1])))
    const [i, j] = x.values[0] > x.values[1] ? [0, 1] : [1, 0]
    const a = x.values[i], b = x.values[j], d = a - b, A = x.th.name(x.labels[i]), B = x.th.name(x.labels[j])
    return { text: `How many more ${x.th.noun} ${x.th.verb} ${A} ${x.th.than} ${B}?`, picture: bars(x.th, x.labels, x.values, x.scale), answer: d,
      steps: [`The numbers on the side count by ${x.scale}s.`, `${x.labels[i]} goes across to ${a}. ${x.labels[j]} goes across to ${b}.`, `${a} − ${b} = ${d}. So ${d} more ${x.th.noun} ${x.th.verb} ${A}.`] }
  } },
  { style: 'spot the mistake: lines counted by 1s', make: r => {
    const x = setup2(r, pick(r, [5, 10])), i = int(r, 0, 2), k = int(r, 3, 9)
    x.values[i] = k * x.scale
    const v = x.values[i], n = x.th.name(x.labels[i]), right = `${v} ${x.th.noun} ${x.th.verb} ${n}.`
    return { text: `Zoe says ${k} ${x.th.noun} ${x.th.verb} ${n}, because that bar is ${k} lines tall. What is true?`,
      picture: bars(x.th, x.labels, x.values, x.scale), answer: choose(r, right, ['Zoe is right.', `${v + x.scale} ${x.th.noun} ${x.th.verb} ${n}.`]),
      steps: [`The numbers on the side count by ${x.scale}s, so each line is ${x.scale}, not 1.`, `The top of the ${x.labels[i]} bar goes across to ${v}.`, `So ${right}`] }
  } },
  { style: 'missing bar: work backwards from how many fewer', make: r => {
    const gen = () => {
      const x = setup2(r, pick(r, [2, 5, 10])), k = x.scale * int(r, 1, 4)
      x.values[0] = x.scale * int(r, 5, 10)
      return { x, k, b: x.values[0] - k, pic: bars(x.th, x.labels, [x.values[0], 0, x.values[2]], x.scale) }
    }
    const { x, k, b, pic } = until(gen, y => hides(y.pic, y.b))
    const a = x.values[0], A = x.th.name(x.labels[0]), B = x.th.name(x.labels[1])
    return { text: `The ${x.labels[1]} bar is missing. ${k} fewer ${x.th.noun} ${x.th.verb} ${B} ${x.th.than} ${A}. How many ${x.th.noun} ${x.th.verb} ${B}?`,
      picture: pic, answer: b,
      steps: [`${x.labels[0]} goes across to ${a}.`, `The ${x.labels[1]} bar is ${k} fewer: ${a} − ${k} = ${b}.`, `So ${b} ${x.th.noun} ${x.th.verb} ${B}.`] }
  } },
  { style: 'two-step story: two bars together, then how many more', make: r => {
    const x = until(() => setup2(r, pick(r, [2, 5, 10])), y => y.values[0] + y.values[1] > y.values[2] && hides(bars(y.th, y.labels, y.values, y.scale), y.values[0] + y.values[1] - y.values[2]))
    const [a, b, c] = x.values, [A, B, C] = x.labels.map(x.th.name), d = a + b - c
    return { text: `How many more ${x.th.noun} ${x.th.verb} ${A} and ${B} together ${x.th.than} ${C}?`, picture: bars(x.th, x.labels, x.values, x.scale), answer: d,
      steps: [`Read each bar across to the side: ${x.labels[0]} ${a}, ${x.labels[1]} ${b}, ${x.labels[2]} ${c}.`, `Together: ${a} + ${b} = ${a + b}.`, `${a + b} − ${c} = ${d}. So ${d} more ${x.th.noun}.`] }
  } },
]

// ── t3 · Measure to the half inch ───────────────────────────────────────────────────────────────────────────
const OBJECTS = ['crayon', 'ribbon', 'key', 'eraser', 'straw', 'leaf', 'pencil', 'spoon']
/** A length w + q/d, d = 2 or 4, never whole. */
const lengthOf = (r: Rng, d: 2 | 4, maxWhole = 5) => {
  const w = int(r, 1, maxWhole), q = d === 2 ? 1 : pick(r, [1, 2, 3, 3, 1])
  const answer: Answer = d === 4 && q !== 2 ? { frac: [q, 4], whole: w } : { frac: [1, 2], whole: w }
  return { w, q, d, v: w + q / d, answer, say: `${w} ${d === 4 && q !== 2 ? `${q}/4` : '1/2'}` }
}
const ruler = (v: number, d: number, labelEvery = 1): Picture => {
  const max = labelEvery === 2 ? 6 : Math.min(6, Math.floor(v) + 1 + (v < 4 ? 1 : 0))
  return { kind: 'measure', tool: 'ruler', max, step: 1 / d, labelEvery, value: v, unit: 'inches' }
}
const partsPast = (q: number, d: number) => d === 2 ? 'the middle mark, which is 1/2 inch more'
  : `${q} small ${pl(q, 'part', 'parts')} more. Each small part is 1/4 inch${q === 2 ? ', and 2 quarters make a half' : ''}`
const wholeInches = (w: number) => `${w} whole ${pl(w, 'inch', 'inches')}`

const T3: Level[] = [
  { style: 'ruler to the half inch', make: r => {
    const obj = pick(r, OBJECTS), L = lengthOf(r, 2)
    return { text: `The ${obj} starts at 0. How long is the ${obj}, to the half inch?`, picture: ruler(L.v, 2), answer: L.answer,
      steps: [`The ${obj} goes past ${L.w} but not to ${L.w + 1}. That is ${wholeInches(L.w)}.`, 'It stops at the middle mark in the next inch. That is 1/2 inch more.', `So the ${obj} is ${L.say} inches long.`] }
  } },
  { style: 'ruler to the quarter inch', make: r => {
    const obj = pick(r, OBJECTS), L = lengthOf(r, 4)
    return { text: `The ${obj} starts at 0. How long is the ${obj}, to the quarter inch?`, picture: ruler(L.v, 4), answer: L.answer,
      steps: [`The ${obj} goes past ${L.w} but not to ${L.w + 1}. That is ${wholeInches(L.w)}.`, `Then it goes ${partsPast(L.q, 4)}.`, `So the ${obj} is ${L.say} inches long.`] }
  } },
  { style: 'spot the mistake: every mark counted as an inch', make: r => {
    const obj = pick(r, OBJECTS), d = pick(r, [2, 4] as const), L = lengthOf(r, d), marks = Math.round(L.v * d)
    const right = `${L.say} inches`
    return { text: `Jay counts the marks from 0 to the end of the ${obj}. He says it is ${marks} inches long. How long is it really?`,
      picture: ruler(L.v, d), answer: choose(r, right, [`${marks} inches`, `${L.w} ${pl(L.w, 'inch', 'inches')}`]),
      steps: ['The small marks are only parts of an inch, not whole inches.', `The ${obj} goes past ${wholeInches(L.w)}, then ${d === 2 ? 'to the middle mark, which is 1/2 inch more' : partsPast(L.q, 4)}.`, `So it is really ${right} long.`] }
  } },
  { style: 'ruler with every other number', make: r => {
    const obj = pick(r, OBJECTS), d = pick(r, [2, 4] as const), L = lengthOf(r, d)
    return { text: `This ruler only shows every other number. How long is the ${obj}?`, picture: ruler(L.v, d, 2), answer: L.answer,
      steps: [`The numbers go 0, 2, 4, 6, so the long marks between them are 1, 3 and 5.`, `The ${obj} goes past ${wholeInches(L.w)}, then ${d === 2 ? 'to the middle mark, which is 1/2 inch more' : partsPast(L.q, 4)}.`, `So the ${obj} is ${L.say} inches long.`] }
  } },
  { style: 'story in words, no ruler', make: r => {
    const obj = pick(r, OBJECTS), d = pick(r, [2, 4] as const), L = lengthOf(r, d), who = pick(r, ['Nia', 'Tom', 'Rosa', 'Dev'])
    return { text: `${who}'s ruler cuts every inch into ${d} equal parts. The ${obj} goes past ${wholeInches(L.w)}, then ${L.q} small ${pl(L.q, 'part', 'parts')} more. How long is the ${obj}?`,
      picture: eq(`${L.w} ${pl(L.w, 'inch', 'inches')} + ${L.q} small ${pl(L.q, 'part', 'parts')}`, [`1 inch = ${d} small parts`]), answer: L.answer,
      steps: [`Each small part is 1/${d} inch.`, `${L.q} small ${pl(L.q, 'part is', 'parts are')} ${L.q}/${d} inch${d === 4 && L.q === 2 ? ', which is 1/2 inch' : ''}.`, `So the ${obj} is ${L.say} inches long.`] }
  } },
]

// ── t4 · Line plot of our measurements ──────────────────────────────────────────────────────────────────────
const ITEMS = [['pencil', 'pencils'], ['ribbon', 'ribbons'], ['leaf', 'leaves'], ['shell', 'shells'], ['crayon', 'crayons'], ['beetle', 'beetles']] as const
const lenLabel = (x: number) => {
  const w = Math.floor(x), q = Math.round((x - w) * 4)
  return q === 0 ? String(w) : `${w} ${q === 2 ? '1/2' : `${q}/4`}`
}
const inchesAt = (x: number) => (x === 1 ? 'inch' : 'inches')
const setup4 = (r: Rng) => {
  const [one, many] = pick(r, ITEMS), step = pick(r, [0.5, 0.25]), base = int(r, 1, 6)
  const xs = Array.from({ length: 5 }, (_, i) => base + i * step)
  const values = xs.map(() => int(r, 0, 5))
  return { one, many, xs, labels: xs.map(lenLabel), values }
}
const plot = (s: ReturnType<typeof setup4>): Picture => ({ kind: 'chart', type: 'dot', labels: s.labels, values: s.values, xLabel: 'Length in inches' })
const isAre = (n: number) => (n === 1 ? 'is' : 'are')
const list = (xs: string[]) => (xs.length === 1 ? xs[0] : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`)

const T4: Level[] = [
  { style: 'count the ✕s above one length', make: r => {
    const s = setup4(r), i = int(r, 0, 4)
    s.values[i] = int(r, 1, 6)
    const c = s.values[i], lab = s.labels[i]
    return { text: `We measured some ${s.many}. How many ${s.many} are ${lab} ${inchesAt(s.xs[i])} long?`, picture: plot(s), answer: c,
      steps: [`Find ${lab} on the line.`, `Each ✕ is one ${s.one}. There ${isAre(c)} ${c} ✕ above ${lab}.`.replace('✕ above', c === 1 ? '✕ above' : '✕s above'), `So ${c} ${pl(c, s.one, s.many)} ${isAre(c)} ${lab} ${inchesAt(s.xs[i])} long.`] }
  } },
  { style: 'all the ✕s on one side: longer or shorter than', make: r => {
    const gen = () => {
      const s = setup4(r), k = int(r, 1, 3), longer = r() < 0.5
      const use = [0, 1, 2, 3, 4].filter(i => (longer ? i > k : i < k) && s.values[i] > 0)
      return { s, k, longer, use, total: use.reduce((t, i) => t + s.values[i], 0) }
    }
    const { s, k, longer, use, total } = until(gen, y => y.total > 0 && hides(plot(y.s), y.total))
    const lab = s.labels[k], word = longer ? 'longer' : 'shorter'
    return { text: `We measured some ${s.many}. How many ${s.many} are ${word} than ${lab} ${inchesAt(s.xs[k])}?`, picture: plot(s), answer: total,
      steps: [`${cap(word)} than ${lab} means the ✕s to the ${longer ? 'right' : 'left'} of ${lab}.`,
        `${list(use.map(i => `${s.values[i]} above ${s.labels[i]}`))}${use.length > 1 ? `: ${use.map(i => s.values[i]).join(' + ')} = ${total}` : ''}.`,
        `So ${total} ${pl(total, s.one, s.many)} ${isAre(total)} ${word} than ${lab} ${inchesAt(s.xs[k])}.`] }
  } },
  { style: 'spot the mistake: the number under the line is not a count', make: r => {
    const gen = () => {
      const s = setup4(r), i = pick(r, [0, 1, 2, 3, 4].filter(j => !Number.isInteger(s.xs[j])))
      s.values[i] = int(r, 1, 6)
      return { s, i, w: Math.floor(s.xs[i]), c: s.values[i], total: s.values.reduce((a, b) => a + b, 0) }
    }
    const { s, i, w, c, total } = until(gen, y => new Set([y.c, y.w, y.total]).size === 3)
    const lab = s.labels[i], say = (n: number) => `${n} ${pl(n, s.one, s.many)}`
    return { text: `Max sees ${lab} under the line and says ${say(w)} are ${lab} inches long. How many ${s.many} are really ${lab} inches long?`.replace(` 1 ${s.one} are`, ` 1 ${s.one} is`),
      picture: plot(s), answer: choose(r, say(c), [say(w), say(total)]),
      steps: [`The numbers under the line are lengths, not ${s.many}.`, `Count the ✕s above ${lab}: there ${isAre(c)} ${c}.`, `So the answer is ${say(c)}.`] }
  } },
  { style: 'between two lengths', make: r => {
    const gen = () => {
      const s = setup4(r), a = int(r, 0, 2), b = int(r, a + 2, 4)
      const mid = [0, 1, 2, 3, 4].filter(i => i > a && i < b), use = mid.filter(i => s.values[i] > 0)
      return { s, a, b, mid, use, total: use.reduce((t, i) => t + s.values[i], 0) }
    }
    const { s, a, b, mid, use, total } = until(gen, y => y.total > 0 && hides(plot(y.s), y.total))
    const ex = (n: number) => `${n} ${pl(n, '✕', '✕s')}`
    return { text: `We measured some ${s.many}. How many ${s.many} are longer than ${s.labels[a]} ${inchesAt(s.xs[a])} but shorter than ${s.labels[b]} inches?`, picture: plot(s), answer: total,
      steps: [`The lengths between ${s.labels[a]} and ${s.labels[b]} are ${list(mid.map(i => s.labels[i]))}.`,
        `${list(use.map(i => `${ex(s.values[i])} above ${s.labels[i]}`))}${use.length > 1 ? `: ${use.map(i => s.values[i]).join(' + ')} = ${total}` : ''}.`,
        `So ${total} ${pl(total, s.one, s.many)}.`] }
  } },
  { style: 'from a jumbled list, no line plot', make: r => {
    const gen = () => {
      const s = setup4(r), k = int(r, 1, 3)
      const all = shuffle(r, s.xs.flatMap((x, i) => Array(s.values[i]).fill(x) as number[]))
      const longer = all.filter(x => x > s.xs[k])
      return { s, k, all, longer }
    }
    const { s, k, all, longer } = until(gen, y => y.all.length >= 6 && y.all.length <= 9 && y.longer.length > 0)
    const n = longer.length, lab = s.labels[k]
    return { text: `Here are the lengths of the ${s.many} we measured, in inches. How many ${s.many} are longer than ${lab} ${inchesAt(s.xs[k])}?`,
      picture: { kind: 'table', rows: [all.map(lenLabel)] }, answer: n,
      steps: [`On a line plot, each length would be one ✕. Look for the lengths to the right of ${lab}.`, `The longer ones are ${list(longer.map(lenLabel))}.`, `That is ${n} ${pl(n, s.one, s.many)}, so the answer is ${n}.`] }
  } },
]

// ── t5 · Four-sided shapes ──────────────────────────────────────────────────────────────────────────────────
type Kind = 'square' | 'rect' | 'rhombus' | 'other'
type Pt = [number, number]
const ALL4 = [0, 1, 2, 3]
const SHAPE = ['a square', 'a rectangle but not a square', 'neither']
const r1 = (n: number) => Math.round(n * 10) / 10
/** Corner angles of a closed shape, in degrees, and whether it bends the same way at every corner. */
const corners = (pts: Pt[]) => {
  const n = pts.length, turn: number[] = [], deg: number[] = []
  for (let k = 0; k < n; k++) {
    const [p, q, o] = [pts[(k + n - 1) % n], pts[k], pts[(k + 1) % n]]
    const u = [p[0] - q[0], p[1] - q[1]], v = [o[0] - q[0], o[1] - q[1]]
    turn.push(u[0] * v[1] - u[1] * v[0])
    deg.push((Math.acos((u[0] * v[0] + u[1] * v[1]) / Math.hypot(u[0], u[1]) / Math.hypot(v[0], v[1])) * 180) / Math.PI)
  }
  return { deg, convex: turn.every(t => t > 0) || turn.every(t => t < 0) }
}
const r2 = (n: number) => Math.round(n * 100) / 100
/** A triangle drawn to scale: side i runs from point i to point i + 1. Null when it would be too flat to read. */
const triangle = (a: number, b: number, c: number): Pt[] | null => {
  const x = (a * a + c * c - b * b) / (2 * a), y2 = c * c - x * x
  if (y2 <= 0) return null
  const pts: Pt[] = [[0, 0], [a, 0], [r2(x), r2(Math.sqrt(y2))]]
  return corners(pts).deg.every(d => d >= 25) ? pts : null
}
/** A four-sided shape drawn to scale, first corner at `deg`. Null when the sides cannot close up into a readable shape. */
const quad = (a: number, b: number, c: number, d: number, deg: number): Pt[] | null => {
  const t = (deg * Math.PI) / 180, B: Pt = [a, 0], D: Pt = [d * Math.cos(t), d * Math.sin(t)]
  const dx = D[0] - B[0], dy = D[1] - B[1], L = Math.hypot(dx, dy)
  if (L >= b + c || L <= Math.abs(b - c)) return null
  const along = (b * b - c * c + L * L) / (2 * L), h = Math.sqrt(b * b - along * along)
  const mx = B[0] + (along * dx) / L, my = B[1] + (along * dy) / L
  for (const sgn of [1, -1]) {
    const pts: Pt[] = [[0, 0], B, [r2(mx - (sgn * h * dy) / L), r2(my + (sgn * h * dx) / L)], [r2(D[0]), r2(D[1])]]
    const k = corners(pts)
    if (k.convex && k.deg.every(x => x >= 45 && x <= 135)) return pts
  }
  return null
}
/** A four-sided tile that is neither a square nor a rectangle nor has 4 equal sides: no corner near square. */
const otherTile = (r: Rng) => until(() => {
  const sides = [int(r, 3, 8), int(r, 3, 8), int(r, 3, 8), int(r, 3, 8)]
  const pts = new Set(sides).size > 1 ? quad(sides[0], sides[1], sides[2], sides[3], pick(r, [60, 70, 110, 120])) : null
  return { pts: pts as Pt[], sides }
}, x => !!x.pts && corners(x.pts).deg.every(d => Math.abs(d - 90) >= 12))
const shapeOf = (r: Rng, kind: Kind) => {
  if (kind === 'square') { const s = int(r, 2, 6); return { pts: [[0, 0], [s, 0], [s, s], [0, s]] as Pt[], sides: [s, s, s, s] } }
  if (kind === 'rect') { const [w, h] = until(() => [int(r, 2, 8), int(r, 2, 8)], ([a, b]) => Math.abs(a - b) >= 2); return { pts: [[0, 0], [w, 0], [w, h], [0, h]] as Pt[], sides: [w, h, w, h] } }
  if (kind === 'rhombus') { const s = int(r, 3, 6); return { pts: [[0, 0], [s, 0], [r1(s * 1.6), r1(s * 0.8)], [r1(s * 0.6), r1(s * 0.8)]] as Pt[], sides: [s, s, s, s] } }
  return otherTile(r)
}
const nameSteps = (kind: Kind, sides?: number[]): string[] => {
  const len = sides ? ` They are ${list(sides.map(String))}` : ''
  if (kind === 'square') return ['All 4 corners are square corners.', `All 4 sides are the same length.${sides ? ` Each one is ${sides[0]} inches.` : ''}`, 'So it is a square.']
  if (kind === 'rect') return ['All 4 corners are square corners.', `The sides are not all the same length${sides ? `: ${list(sides.map(String))} inches` : ''}, so it is not a square.`, 'So it is a rectangle but not a square.']
  if (kind === 'rhombus') return [`All 4 sides are the same length${sides ? `, ${sides[0]} inches each` : ''}.`, 'But none of the corners is a square corner, so it is not a rectangle or a square.', 'So the answer is neither.']
  return ['None of the corners is a square corner.', `The sides are not all the same length either.${len ? `${len} inches.` : ''}`, 'So the answer is neither.']
}
const answerFor = (kind: Kind) => (kind === 'square' ? SHAPE[0] : kind === 'rect' ? SHAPE[1] : SHAPE[2])

const T5: Level[] = [
  { style: 'name it from the corner and side marks', make: r => {
    const kind = pick(r, ['square', 'rect', 'rhombus', 'other'] as const), s = shapeOf(r, kind)
    const shape = { pts: s.pts, tone: 1 as const, ...(kind === 'square' || kind === 'rect' ? { right: ALL4 } : {}), ...(kind === 'square' || kind === 'rhombus' ? { ticks: ALL4 } : {}) }
    return { text: kind === 'other' ? 'Look at the corners and sides. What shape is this tile?' : 'Look at the marks on the corners and sides. What shape is this tile?', picture: { kind: 'poly', shapes: [shape] },
      answer: choose(r, answerFor(kind), SHAPE.filter(c => c !== answerFor(kind))), steps: nameSteps(kind) }
  } },
  { style: 'name it from the side lengths', make: r => {
    const kind = pick(r, ['square', 'rect', 'rhombus', 'other'] as const), s = shapeOf(r, kind)
    const shape = { pts: s.pts, tone: 2 as const, sides: s.sides.map(n => `${n} in`), ...(kind === 'square' || kind === 'rect' ? { right: ALL4 } : {}) }
    return { text: 'The length of each side is written on this tile. What shape is it?', picture: { kind: 'poly', shapes: [shape] },
      answer: choose(r, answerFor(kind), SHAPE.filter(c => c !== answerFor(kind))), steps: nameSteps(kind, s.sides) }
  } },
  { style: 'pick what is true about the sides and corners', make: r => {
    const kind = pick(r, ['square', 'rect', 'rhombus'] as const), s = shapeOf(r, kind)
    const TRUE = ['4 equal sides and 4 square corners', '4 equal sides, but the corners are not square', '4 square corners, but the sides are not all equal']
    const right = TRUE[kind === 'square' ? 0 : kind === 'rhombus' ? 1 : 2]
    const shape = { pts: s.pts, tone: 3 as const, ...(kind !== 'rhombus' ? { right: ALL4 } : {}), ...(kind !== 'rect' ? { ticks: ALL4 } : { sides: s.sides.map(n => `${n} in`) }) }
    const steps = kind === 'square' ? ['The marks show all 4 sides are the same length.', 'Every corner has a small square, so all 4 are square corners.', `So: ${right}.`]
      : kind === 'rhombus' ? ['The marks show all 4 sides are the same length.', 'There are no square corners. The shape leans over.', `So: ${right}.`]
      : ['Every corner has a small square, so all 4 are square corners.', `The sides are ${s.sides[0]} and ${s.sides[1]} inches, so they are not all equal.`, `So: ${right}.`]
    return { text: 'What is true about this shape?', picture: { kind: 'poly', shapes: [shape] }, answer: choose(r, right, TRUE.filter(c => c !== right)), steps }
  } },
  { style: 'which names fit, from words', make: r => {
    const kind = pick(r, ['square', 'rect', 'rhombus'] as const), s = shapeOf(r, kind), thing = pick(r, ['window', 'rug', 'sign', 'tile'])
    const NAMES = ['square only', 'rectangle only', 'square and rectangle', 'neither']
    const [a, b] = s.sides
    const text = kind === 'square' ? `A ${thing} has 4 square corners. All 4 of its sides are ${a} feet long. Which names fit the ${thing}?`
      : kind === 'rect' ? `A ${thing} has 4 square corners. Its sides are ${a}, ${b}, ${a} and ${b} feet long. Which names fit the ${thing}?`
      : `A ${thing} has 4 sides that are all ${a} feet long, but none of its corners is a square corner. Which names fit the ${thing}?`
    const right = kind === 'square' ? NAMES[2] : kind === 'rect' ? NAMES[1] : NAMES[3]
    const steps = kind === 'square' ? ['4 square corners make it a rectangle.', '4 equal sides as well make it a square.', `Both names fit, so the answer is ${right}.`]
      : kind === 'rect' ? ['4 square corners make it a rectangle.', 'The sides are not all equal, so it is not a square.', `So the answer is ${right}.`]
      : ['It has no square corners, so it is not a rectangle.', 'A square needs square corners too, so it is not a square.', `So the answer is ${right}.`]
    return { text, picture: { kind: 'poly', shapes: [{ pts: s.pts, tone: 4 }] }, answer: choose(r, right, NAMES.filter(c => c !== right)), steps }
  } },
  { style: 'spot the mistake in a reason', make: r => {
    const who = pick(r, ['Max', 'Lena', 'Omar', 'Ruby'])
    const RIGHT = `${who} is right.`, SQREC = `${who} is wrong. A square is a rectangle too.`
    const CORN = `${who} is wrong. The corners are not square corners.`, SIDES = `${who} is wrong. The sides are not all equal.`
    const c = pick(r, ['notRect', 'rhombus', 'rect', 'square'] as const)
    const kind: Kind = c === 'rhombus' ? 'rhombus' : c === 'rect' ? 'rect' : 'square', s = shapeOf(r, kind)
    const shape = { pts: s.pts, tone: 1 as const, ...(kind !== 'rhombus' ? { right: ALL4 } : {}), ...(kind !== 'rect' ? { ticks: ALL4 } : { sides: s.sides.map(n => `${n} in`) }) }
    const pickOne = {
      notRect: { claim: 'this shape is not a rectangle, because it is a square', right: SQREC, wrong: [RIGHT, CORN, SIDES],
        steps: ['All 4 corners are square corners, and all 4 sides are equal. It is a square.', 'A shape with 4 square corners is a rectangle, so a square is a rectangle too.', `So: ${SQREC}`] },
      rhombus: { claim: 'this shape is a square, because all 4 sides are equal', right: CORN, wrong: [RIGHT, SIDES],
        steps: ['The marks show all 4 sides are equal. That part is true.', 'But a square also needs 4 square corners, and this shape leans over.', `So: ${CORN}`] },
      rect: { claim: 'this shape is a square, because it has 4 square corners', right: SIDES, wrong: [RIGHT, CORN],
        steps: ['All 4 corners are square corners. That part is true.', `But a square also needs 4 equal sides, and these are ${s.sides[0]} and ${s.sides[1]} inches.`, `So: ${SIDES}`] },
      square: { claim: 'this shape is a square, because it has 4 equal sides and 4 square corners', right: RIGHT, wrong: [CORN, SIDES],
        steps: ['The marks show all 4 sides are equal.', 'Every corner has a small square, so all 4 are square corners.', `So: ${RIGHT}`] },
    }[c]
    return { text: `${who} says ${pickOne.claim}. Who is right?`, picture: { kind: 'poly', shapes: [shape] }, answer: choose(r, pickOne.right, pickOne.wrong), steps: pickOne.steps }
  } },
]

// ── t6 · Walk around the fence ──────────────────────────────────────────────────────────────────────────────
const THINGS6 = [['garden', 'feet', 'ft'], ['rug', 'feet', 'ft'], ['card', 'inches', 'in'], ['photo', 'inches', 'in']] as const
const rectPts = (w: number, h: number): Pt[] => [[0, 0], [w, 0], [w, h], [0, h]]

const T6: Level[] = [
  { style: 'rectangle, every side labelled', make: r => {
    const [thing, units, u] = pick(r, THINGS6), w = int(r, 3, 9), h = int(r, 2, 8), P = 2 * (w + h)
    return { text: `How many ${units} is it all the way around this ${thing}?`,
      picture: { kind: 'poly', shapes: [{ pts: rectPts(w, h), sides: [`${w} ${u}`, `${h} ${u}`, `${w} ${u}`, `${h} ${u}`], right: ALL4, tone: 1 }] }, answer: P,
      steps: ['Walk around and add every side.', `${w} + ${h} + ${w} + ${h}.`, `So it is ${P} ${units} around.`] }
  } },
  { style: 'square, one side labelled', make: r => {
    const [thing, units, u] = pick(r, THINGS6), s = int(r, 3, 9), P = 4 * s
    return { text: `This ${thing} is a square. How many ${units} is it all the way around?`,
      picture: { kind: 'poly', shapes: [{ pts: rectPts(s, s), sides: [`${s} ${u}`, null, null, null], right: ALL4, ticks: ALL4, tone: 2 }] }, answer: P,
      steps: ['A square has 4 equal sides.', `${s} + ${s} + ${s} + ${s}.`, `So it is ${P} ${units} around.`] }
  } },
  { style: 'rectangle, only two sides labelled', make: r => {
    const [thing, units, u] = pick(r, THINGS6), w = int(r, 3, 9), h = until(() => int(r, 2, 8), x => x !== w), P = 2 * (w + h)
    return { text: `Only two sides of this ${thing} are marked. It has 4 square corners. How many ${units} is it all the way around?`,
      picture: { kind: 'poly', shapes: [{ pts: rectPts(w, h), sides: [`${w} ${u}`, `${h} ${u}`, null, null], right: ALL4, tone: 3 }] }, answer: P,
      steps: ['In a rectangle, the sides across from each other are the same length.', `So the sides are ${w}, ${h}, ${w} and ${h}: ${w} + ${h} + ${w} + ${h}.`, `So it is ${P} ${units} around.`] }
  } },
  { style: 'missing side from the distance around', make: r => {
    // Shapes that can have any sides. The known sides are drawn to scale; the side marked "?" is the last one, and it is
    // drawn at a length picked on its own, at least 1.5 away from the answer, so its size cannot give the answer away.
    const [thing, units, u] = pick(r, [['garden', 'feet', 'ft'], ['flower bed', 'feet', 'ft'], ['sticker', 'inches', 'in'], ['badge', 'inches', 'in']] as const)
    const tri = r() < 0.35
    const { known, x, pts } = until(() => {
      const known = Array.from({ length: tri ? 2 : 3 }, () => int(r, 3, 9)), x = int(r, 2, 9), drawn = int(r, 4, 18) / 2
      const all = [...known, x]
      const pts = Math.abs(drawn - x) < 1.5 || Math.max(...all) * 2 >= all.reduce((t, v) => t + v, 0) ? null
        : tri ? triangle(known[0], known[1], drawn) : quad(known[0], known[1], known[2], drawn, int(r, 70, 110))
      return { known, x, pts }
    }, y => !!y.pts)
    const k = known.reduce((a, b) => a + b, 0), T = k + x
    return { text: `It is ${T} ${units} all the way around this ${thing}. How long is the side marked "?"`,
      picture: { kind: 'poly', shapes: [{ pts: pts!, sides: [...known.map(n => `${n} ${u}`), '?'], tone: 1 }] }, answer: x,
      steps: [`Add the sides you know: ${known.join(' + ')} = ${k}.`, `All the sides together make ${T}. ${T} − ${k} = ${x}.`, `So the side marked "?" is ${x} ${units}.`] }
  } },
  { style: 'two-step story: fence left over', make: r => {
    const who = pick(r, ['Sam', 'Ana', 'Leo', 'Maya']), w = int(r, 4, 9), h = int(r, 2, w - 1), P = 2 * (w + h), left = int(r, 2, 15), F = P + left
    return { text: `${who} has ${F} feet of fence. The garden is ${w} feet long and ${h} feet wide. ${who} puts fence all the way around it. How many feet of fence are left?`,
      picture: { kind: 'poly', shapes: [{ pts: rectPts(w, h), sides: [`${w} ft`, `${h} ft`, null, null], right: ALL4, tone: 2 }] }, answer: left,
      steps: [`All the way around: ${w} + ${h} + ${w} + ${h} = ${P} feet.`, `${F} − ${P} = ${left}.`, `So ${left} feet of fence are left.`] }
  } },
]

// ── t7 · Same fence, different garden ───────────────────────────────────────────────────────────────────────
const ft = (n: number) => `${n} ${pl(n, 'foot', 'feet')}`
const dims = (l: number, w: number) => `${ft(l)} by ${ft(w)}`
const rowsOf = (l: number, w: number) => `${w} ${pl(w, 'row', 'rows')} of ${l}`
/** Every garden with whole-foot sides and this fence, long side first. */
const gardens = (P: number) => { const half = P / 2, out: [number, number][] = []; for (let l = Math.ceil(half / 2); l < half; l++) out.push([l, half - l]); return out }
/** Two gardens side by side on one grid, a blank column between them. */
const twoGardens = ([l1, w1]: [number, number], [l2, w2]: [number, number]): Picture => {
  const rows = Math.max(w1, w2), hide = [{ r: 0, c: l1, h: rows, w: 1 }]
  if (w1 < rows) hide.push({ r: w1, c: 0, h: rows - w1, w: l1 })
  if (w2 < rows) hide.push({ r: w2, c: l1 + 1, h: rows - w2, w: l2 })
  return { kind: 'grid', rows, cols: l1 + 1 + l2, shade: [{ r: 0, c: 0, h: w1, w: l1, tone: 1 }, { r: 0, c: l1 + 1, h: w2, w: l2, tone: 2 }], hide }
}
const pairOf = (r: Rng) => { const P = pick(r, [10, 12, 14, 16]), [A, B] = shuffle(r, gardens(P)); return { P, A, B } }

const T7: Level[] = [
  { style: 'one garden: fence around or squares inside', make: r => {
    const gen = () => { const l = int(r, 2, 8), w = int(r, 1, Math.min(5, l)), fence = r() < 0.5; return { l, w, fence, ans: fence ? 2 * (l + w) : l * w } }
    const pic = (x: ReturnType<typeof gen>): Picture => ({ kind: 'grid', rows: x.w, cols: x.l, top: `${x.l} ft`, left: `${x.w} ft` })
    const x = until(gen, y => hides(pic(y), y.ans)), { l, w } = x
    if (x.fence) return { text: `This garden is ${ft(l)} long and ${ft(w)} wide. How many feet of fence go all the way around it?`, picture: pic(x), answer: x.ans,
      steps: ['The fence goes around the edge, so add all 4 sides. Do not count the squares inside.', `${l} + ${w} + ${l} + ${w}.`, `So ${x.ans} feet of fence go around it.`] }
    return { text: `This garden is ${ft(l)} long and ${ft(w)} wide. How many squares does it hold inside?`, picture: pic(x), answer: x.ans,
      steps: ['The squares inside are not the fence. Count the rows of squares.', `There ${w === 1 ? 'is' : 'are'} ${rowsOf(l, w)}: ${w} × ${l} = ${x.ans}.`, `So it holds ${x.ans} squares.`] }
  } },
  { style: 'same fence: which garden holds more', make: r => {
    const { P, A, B } = pairOf(r), a = A[0] * A[1], b = B[0] * B[1], right = a > b ? 'Garden A' : 'Garden B'
    return { text: `Both gardens have ${P} feet of fence. Garden A is ${dims(A[0], A[1])}. Garden B is ${dims(B[0], B[1])}. Which garden holds more squares?`,
      picture: twoGardens(A, B), answer: choose(r, right, ['Garden A', 'Garden B', 'They hold the same'].filter(c => c !== right)),
      steps: [`Garden A has ${rowsOf(A[0], A[1])}, so it holds ${a} squares.`, `Garden B has ${rowsOf(B[0], B[1])}, so it holds ${b} squares.`, `${Math.max(a, b)} is more than ${Math.min(a, b)}, so the answer is ${right}.`] }
  } },
  { style: 'same fence: how many more squares', make: r => {
    const x = until(() => pairOf(r), y => hides(twoGardens(y.A, y.B), Math.abs(y.A[0] * y.A[1] - y.B[0] * y.B[1])))
    const { P } = x, [big, small, bn, sn] = x.A[0] * x.A[1] > x.B[0] * x.B[1] ? [x.A, x.B, 'A', 'B'] : [x.B, x.A, 'B', 'A']
    const a = big[0] * big[1], b = small[0] * small[1], d = a - b
    const [G1, G2] = bn === 'A' ? [big, small] : [small, big]
    return { text: `Both gardens have ${P} feet of fence. Garden A is ${dims(G1[0], G1[1])}. Garden B is ${dims(G2[0], G2[1])}. How many more squares does Garden ${bn} hold than Garden ${sn}?`,
      picture: twoGardens(x.A, x.B), answer: d,
      steps: [`Garden ${bn} has ${rowsOf(big[0], big[1])}, so it holds ${a} squares.`, `Garden ${sn} has ${rowsOf(small[0], small[1])}, so it holds ${b} squares.`, `${a} − ${b} = ${d}. So Garden ${bn} holds ${d} more ${pl(d, 'square', 'squares')}.`] }
  } },
  { style: 'same fence, one side given: squares in the other garden', make: r => {
    const gen = () => { const { P, A, B } = pairOf(r); const l2 = B[0]; return { P, A, B, l2, w2: P / 2 - l2, ans: B[0] * B[1] } }
    const pic = (x: ReturnType<typeof gen>): Picture => ({ kind: 'grid', rows: x.A[1], cols: x.A[0], top: `${x.A[0]} ft`, left: `${x.A[1]} ft` })
    const x = until(gen, y => hides(pic(y), y.ans)), { P, l2, w2, ans } = x
    return { text: `This garden has ${P} feet of fence. Another garden has the same ${P} feet of fence and is ${ft(l2)} long. How many squares does the other garden hold?`,
      picture: pic(x), answer: ans,
      steps: [`The other garden has two sides of ${ft(l2)}: ${l2} + ${l2} = ${2 * l2}. That leaves ${P} − ${2 * l2} = ${P - 2 * l2} feet for the other two sides.`,
        `So each of those sides is ${ft(w2)}. The garden is ${dims(l2, w2)}.`, `${l2} × ${w2} = ${ans}. So it holds ${ans} squares.`] }
  } },
  { style: 'story: pick the pen with the most room from a table', make: r => {
    const P = pick(r, [12, 14, 16, 18, 20]), pens = shuffle(r, gardens(P)).slice(0, 3), who = pick(r, ['Kai', 'Rosa', 'Ben', 'Mei'])
    const areas = pens.map(([l, w]) => l * w), best = areas.indexOf(Math.max(...areas)), right = dims(pens[best][0], pens[best][1])
    return { text: `${who} has ${P} feet of fence for a rabbit pen. The table shows three pens ${who} could build. Which pen gives the rabbit the most squares of room?`,
      picture: { kind: 'table', head: ['Pen', 'Side', 'Other side'], rows: pens.map(([l, w], i) => ['ABC'[i], `${l} ft`, `${w} ft`]) },
      answer: choose(r, right, pens.filter((_, i) => i !== best).map(([l, w]) => dims(l, w))),
      steps: [`All three pens use ${P} feet of fence.`, `They hold ${pens.map(([l, w]) => `${l} × ${w} = ${l * w}`).join(', ')} squares.`, `${areas[best]} is the most, so the answer is ${right}.`] }
  } },
]

export const G3M6_LADDERS: Record<string, Level[]> = {
  'g3m6-t1': T1, 'g3m6-t2': T2, 'g3m6-t3': T3, 'g3m6-t4': T4, 'g3m6-t5': T5, 'g3m6-t6': T6, 'g3m6-t7': T7,
}
