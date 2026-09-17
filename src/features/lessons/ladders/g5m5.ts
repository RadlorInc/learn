/**
 * Grade 5 · Module 5 — Addition and multiplication with area and volume. Practice ladders, easiest style first
 * (see ../adaptive.ts and the reference ladders in ./g5m1.ts). Each level is a different KIND of question.
 * Edge lengths stay at 9 or less, so a label can never print a volume (every volume asked is 10 or more).
 */
import type { Picture } from '../script'
import { int, pick, shuffle, fmt, type Level, type Rng } from '../adaptive'

const eq = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })
const choose = (r: Rng, right: string, wrong: string[]) => {
  const choices = shuffle(r, [right, ...wrong])
  return { choices, correct: choices.indexOf(right) }
}
const until = <T>(gen: () => T, ok: (x: T) => boolean): T => { let x = gen(); while (!ok(x)) x = gen(); return x }
const NAMES = ['Leo', 'Mia', 'Sam', 'Ava', 'Kai', 'Nina', 'Ben', 'Zoe']
const cubes = (l: number, w: number, h: number, layers?: number): Picture => ({ kind: 'cubes', l, w, h, ...(layers ? { layers } : {}) })
const prism = (labels: { l?: string; w?: string; h?: string }): Picture => ({ kind: 'solid', shape: 'prism', labels })
const boxes = (a: string[], b: string[], names = ['Box A', 'Box B']): Picture =>
  ({ kind: 'table', head: ['', 'length', 'width', 'height'], rows: [[names[0], ...a], [names[1], ...b]], rowHead: true })

/** A unit: short form for labels, one and many for sentences. */
const UNITS = [
  { ab: 'ft', one: 'foot', many: 'feet' },
  { ab: 'cm', one: 'centimeter', many: 'centimeters' },
  { ab: 'in', one: 'inch', many: 'inches' },
] as const
type Unit = (typeof UNITS)[number]
const dims = (u: Unit, ...xs: number[]) => xs.map(x => `${x} ${u.ab}`)

// ── t1 · Volume is counting cubes ───────────────────────────────────────────────────────────────────────────
/** "2 rows of 4: 4 + 4 = 8" */
const layerSum = (l: number, w: number) => `${w} rows of ${l}: ${Array(w).fill(l).join(' + ')} = ${l * w}`
/** How the layers add up, in the lesson's words. */
const stackUp = (lw: number, h: number) =>
  h === 1 ? 'There is just one layer, so nothing hides underneath.'
    : h === 2 ? `The layer underneath is the same: ${lw} more, even the ones you cannot see.`
      : `There are ${h} layers, each the same: ${Array.from({ length: h }, (_, k) => lw * (k + 1)).join(', ')}.`

const T1: Level[] = [
  { style: 'count every cube, one or two layers', make: r => {
    const l = int(r, 3, 5), w = int(r, 2, 3), h = int(r, 1, 2), n = l * w * h
    return { text: 'Each small cube is the same size. How many cubes fill this box?', picture: cubes(l, w, h), answer: n,
      steps: [`The top layer has ${layerSum(l, w)} cubes.`, stackUp(l * w, h), `So ${n} cubes fill the box.`] }
  } },
  { style: 'a box still filling: picture the missing layers', make: r => {
    const l = int(r, 2, 4), w = int(r, 2, 3), h = int(r, 3, 4), k = int(r, 1, h - 1), n = l * w * h
    return { text: `Some cubes are in this box already. When it is full, the box will be ${h} cubes tall. How many cubes will fill it?`,
      picture: cubes(l, w, h, k), answer: n,
      steps: [`One layer has ${layerSum(l, w)} cubes.`, stackUp(l * w, h), `So ${n} cubes will fill the box.`] }
  } },
  { style: 'spot the mistake: counted only the top layer', make: r => {
    const l = int(r, 2, 4), w = int(r, 2, 3), h = int(r, 2, 3), lw = l * w, n = lw * h, name = pick(r, NAMES)
    const right = `${n} cubes`
    return { text: `${name} counts only the top layer of this box and says it holds ${lw} cubes. How many cubes really fill it?`,
      picture: cubes(l, w, h), answer: choose(r, right, [`${lw} cubes`, `${lw * (h + 1)} cubes`]),
      steps: [`The top layer has ${layerSum(l, w)} cubes, but layers hide underneath it.`, stackUp(lw, h), `So ${right} fill the box.`] }
  } },
  { style: 'work backwards: how many layers', make: r => {
    const l = int(r, 2, 4), w = int(r, 2, 3), h = int(r, 3, 6), lw = l * w, n = lw * h
    return { text: `Here is one layer of cubes. A stack of layers just like it has ${n} cubes. How many layers are in the stack?`,
      picture: cubes(l, w, 1), answer: h,
      steps: [`One layer has ${layerSum(l, w)} cubes.`, `Count by ${lw} until you reach ${n}: ${Array.from({ length: h }, (_, k) => lw * (k + 1)).join(', ')}.`, `That is ${h} counts, so there are ${h} layers.`] }
  } },
  { style: 'two-step story: fill, then take some out', make: r => {
    const l = int(r, 3, 5), w = int(r, 2, 3), h = int(r, 2, 3), lw = l * w, n = lw * h, used = int(r, 2, lw - 1), left = n - used, name = pick(r, NAMES)
    return { text: `${name} packs sugar cubes into this box with no gaps. Then ${name} uses ${used} of them for tea. How many sugar cubes are left in the box?`,
      picture: cubes(l, w, h), answer: left,
      steps: [`The top layer has ${layerSum(l, w)} cubes. ${stackUp(lw, h)}`, `So the full box held ${n}. Take away ${used}: ${n} − ${used} = ${left}.`, `So ${left} sugar cubes are left.`] }
  } },
]

// ── t2 · One layer times how many layers ────────────────────────────────────────────────────────────────────
const T2: Level[] = [
  { style: 'bottom layer drawn, multiply by the layers', make: r => {
    const l = int(r, 2, 5), w = int(r, 2, 4), h = int(r, 2, 4), lw = l * w, n = lw * h
    return { text: `A box is ${l} cubes long, ${w} cubes wide and ${h} layers high. How many cubes fill it?`, picture: cubes(l, w, h, 1), answer: n,
      steps: [`One layer is ${l} × ${w} = ${lw} cubes.`, `There are ${h} layers, so multiply ${lw} × ${h}.`, `So ${n} cubes fill the box.`] }
  } },
  { style: 'no cubes drawn: one layer and the layers, in numbers', make: r => {
    const lw = int(r, 11, 25), h = int(r, 3, 6), n = lw * h
    return { text: `One layer of a box holds ${lw} cubes. The box is ${h} layers high. How many cubes fill the box?`,
      picture: eq(`${lw} cubes in one layer`, [`${h} layers`]), answer: n,
      steps: ['Every layer is the same, so multiply one layer by the layers.', `${lw} × ${h} = ${n}.`, `So ${fmt(n)} cubes fill the box.`] }
  } },
  { style: 'spot the mistake: stopped after one layer, or added', make: r => {
    const { l, w, h } = until(() => ({ l: int(r, 2, 5), w: int(r, 2, 4), h: int(r, 2, 4) }),
      x => new Set([x.l * x.w, x.l * x.w * x.h, x.l + x.w + x.h]).size === 3)
    const lw = l * w, n = lw * h, name = pick(r, NAMES)
    const [stop, add, ok] = [`${name} stopped after one layer.`, `${name} added instead of multiplying.`, `${name} is right.`]
    const got = pick(r, [lw, n, l + w + h])
    const right = got === lw ? stop : got === n ? ok : add
    return { text: `A box is ${l} cubes long, ${w} cubes wide and ${h} layers high. ${name} says it holds ${got} cubes. What happened?`,
      picture: cubes(l, w, h), answer: choose(r, right, [stop, add, ok].filter(c => c !== right)),
      steps: [`One layer is ${l} × ${w} = ${lw} cubes.`, `There are ${h} layers: ${lw} × ${h} = ${n}, and ${name} said ${got}.`, `So: ${right}`] }
  } },
  { style: 'work backwards: a missing side of the layer', make: r => {
    const l = int(r, 2, 6), w = int(r, 2, 5), h = int(r, 2, 5), lw = l * w, n = lw * h
    return { text: `A box is ${h} layers high and holds ${n} cubes. Each layer is ${l} cubes long. How many cubes wide is the box?`,
      picture: eq(`(${l} × ?) × ${h} = ${n}`), answer: w,
      steps: [`All ${h} layers are the same, so one layer is ${n} ÷ ${h} = ${lw} cubes.`, `The layer is ${l} long, and ${l} × ${w} = ${lw}.`, `So the box is ${w} cubes wide.`] }
  } },
  { style: 'two-step story: crates of layers', make: r => {
    const l = int(r, 3, 6), w = int(r, 2, 4), h = int(r, 2, 4), c = int(r, 2, 5), lw = l * w, one = lw * h, all = one * c
    const [thing, crate, crates] = pick(r, [['juice boxes', 'crate', 'crates'], ['soup cans', 'case', 'cases'], ['bars of soap', 'carton', 'cartons']] as const)
    return { text: `A ${crate} is packed with ${thing} in layers. Each layer is ${l} ${thing} long and ${w} wide, and there are ${h} layers. A store orders ${c} ${crates}. How many ${thing} is that?`,
      picture: cubes(l, w, h, 1), answer: all,
      steps: [`One layer is ${l} × ${w} = ${lw}, and ${h} layers make ${lw} × ${h} = ${one} in one ${crate}.`, `${c} ${crates}: ${one} × ${c} = ${fmt(all)}.`, `So that is ${fmt(all)} ${thing}.`] }
  } },
]

// ── t3 · Length × width × height ────────────────────────────────────────────────────────────────────────────
const edges = (r: Rng) => ({ u: pick(r, UNITS), l: int(r, 2, 9), w: int(r, 2, 6), h: int(r, 2, 6) })

const T3: Level[] = [
  { style: 'labeled box: multiply the edges', make: r => {
    const { u, l, w, h } = edges(r), lw = l * w, v = lw * h
    return { text: `What is the volume of this box in cubic ${u.many}?`, picture: prism({ l: `${l} ${u.ab}`, w: `${w} ${u.ab}`, h: `${h} ${u.ab}` }), answer: v,
      steps: [`The bottom layer is ${l} × ${w} = ${lw} cubes.`, `The box is ${h} ${u.ab} tall, so there are ${h} layers: ${lw} × ${h}.`, `So the volume is ${v} cubic ${u.many}.`] }
  } },
  { style: 'edges in words, no box drawn', make: r => {
    const { u, l, w, h } = edges(r), lw = l * w, v = lw * h
    const thing = pick(r, ['fish tank', 'toy chest', 'shoe box', 'storage bin'])
    return { text: `A ${thing} is ${l} ${u.ab} long, ${w} ${u.ab} wide and ${h} ${u.ab} tall. What is its volume in cubic ${u.many}?`,
      picture: eq('length × width × height'), answer: v,
      steps: [`Length × width is one layer: ${l} × ${w} = ${lw}.`, `The height is the layers: ${lw} × ${h} = ${v}.`, `So the volume is ${v} cubic ${u.many}.`] }
  } },
  { style: 'spot the mistake: added the edges', make: r => {
    const { u, l, w, h } = until(() => edges(r), x => new Set([x.l * x.w * x.h, x.l + x.w + x.h, x.l * x.w]).size === 3)
    const lw = l * w, v = lw * h, name = pick(r, NAMES), right = `${v} cubic ${u.many}`
    return { text: `${name} adds the edges of this box and gets ${l + w + h}. Which is the volume of the box?`,
      picture: prism({ l: `${l} ${u.ab}`, w: `${w} ${u.ab}`, h: `${h} ${u.ab}` }),
      answer: choose(r, right, [`${l + w + h} cubic ${u.many}`, `${lw} cubic ${u.many}`]),
      steps: ['Adding the edges only walks along them. Multiplying fills the whole inside.', `The bottom layer is ${l} × ${w} = ${lw}, and there are ${h} layers: ${lw} × ${h} = ${v}.`, `So the volume is ${right}.`] }
  } },
  { style: 'work backwards: the missing height', make: r => {
    const { u, l, w, h } = edges(r), lw = l * w, v = lw * h
    return { text: `This box has a volume of ${v} cubic ${u.many}. How tall is it?`,
      picture: prism({ l: `${l} ${u.ab}`, w: `${w} ${u.ab}`, h: `? ${u.ab}` }), answer: h,
      steps: [`The bottom layer is ${l} × ${w} = ${lw} cubes.`, `How many layers of ${lw} make ${v}? ${v} ÷ ${lw} = ${h}.`, `So the box is ${h} ${u.many} tall.`] }
  } },
  { style: 'two-step story: some already poured in', make: r => {
    const l = int(r, 3, 8), w = int(r, 2, 5), h = int(r, 2, 3), v = l * w * h, poured = int(r, 3, v - 3), more = v - poured, name = pick(r, NAMES)
    return { text: `A sandbox is ${l} feet long, ${w} feet wide and ${h} feet deep. ${name} has already poured in ${poured} cubic feet of sand. How many more cubic feet of sand will fill it?`,
      picture: prism({ l: `${l} ft`, w: `${w} ft`, h: `${h} ft` }), answer: more,
      steps: [`The whole sandbox holds ${l} × ${w} × ${h} = ${v} cubic feet.`, `Take away what is in already: ${v} − ${poured} = ${more}.`, `So ${more} more cubic feet of sand will fill it.`] }
  } },
]

// ── t4 · Two boxes joined together ──────────────────────────────────────────────────────────────────────────
const pair = (r: Rng, hi = 9) => {
  const a = [int(r, 2, hi), int(r, 2, 5), int(r, 2, 4)], b = [int(r, 2, 6), int(r, 2, 5), int(r, 1, 4)]
  const va = a[0] * a[1] * a[2], vb = b[0] * b[1] * b[2]
  return { a, b, va, vb, total: va + vb }
}
const times = (x: number[]) => x.join(' × ')

const T4: Level[] = [
  { style: 'table of two boxes: each box, then add', make: r => {
    const u = pick(r, UNITS), { a, b, va, vb, total } = pair(r)
    return { text: `Two boxes are joined. What is the total volume in cubic ${u.many}?`, picture: boxes(dims(u, ...a), dims(u, ...b)), answer: total,
      steps: [`Box A: ${times(a)} = ${va} cubic ${u.many}.`, `Box B: ${times(b)} = ${vb} cubic ${u.many}.`, `${va} + ${vb} = ${total}. So the total volume is ${total} cubic ${u.many}.`] }
  } },
  { style: 'pick the right way to find it', make: r => {
    const u = pick(r, UNITS)
    const { a, b } = until(() => pair(r), x => ![x.a[0] * x.a[1] * (x.a[2] + x.b[2]), x.a.concat(x.b).reduce((s, n) => s + n, 0)].includes(x.total))
    const right = `${times(a)} + ${times(b)}`
    return { text: 'Two boxes are joined. Which way finds the total volume?', picture: boxes(dims(u, ...a), dims(u, ...b)),
      answer: choose(r, right, [`${a[0]} × ${a[1]} × ${a[2] + b[2]}`, `${[...a, ...b].join(' + ')}`, times(a)]),
      steps: ['Find each box on its own: length × width × height.', 'The space in the two boxes joins up, so add them. One height for both counts space that is not there.', `So the right way is ${right}.`] }
  } },
  { style: 'story in words: a step stool', make: r => {
    const w = int(r, 3, 8), h = int(r, 2, 5), lo = int(r, 5, 9), hi = int(r, 2, lo - 1)
    const bottom = lo * w * h, top = hi * w * h, total = bottom + top, name = pick(r, NAMES)
    return { text: `${name} builds a step stool from two wooden boxes. The bottom box is ${lo} inches long, ${w} inches wide and ${h} inches tall. The top box is ${hi} inches long, ${w} inches wide and ${h} inches tall. What is the volume of the stool in cubic inches?`,
      picture: eq('bottom box + top box = ?'), answer: total,
      steps: [`Bottom box: ${lo} × ${w} × ${h} = ${bottom}.`, `Top box: ${hi} × ${w} × ${h} = ${top}.`, `${bottom} + ${top} = ${total}. So the stool is ${total} cubic inches.`] }
  } },
  { style: 'work backwards: a missing height from the total', make: r => {
    const u = pick(r, UNITS), { a, b, va, vb, total } = until(() => pair(r), x => x.b[2] >= 2)
    return { text: `Two boxes are joined. Their total volume is ${total} cubic ${u.many}. How tall is Box B?`,
      picture: boxes(dims(u, ...a), [...dims(u, b[0], b[1]), `? ${u.ab}`]), answer: b[2],
      steps: [`Box A: ${times(a)} = ${va}. So Box B holds ${total} − ${va} = ${vb}.`, `Box B's bottom layer is ${b[0]} × ${b[1]} = ${b[0] * b[1]}.`, `${vb} ÷ ${b[0] * b[1]} = ${b[2]}. So Box B is ${b[2]} ${b[2] === 1 ? u.one : u.many} tall.`] }
  } },
  { style: 'two-step story: joined boxes, then bags of soil', make: r => {
    const { a, b, va, vb, total, bag } = until(() => {
      const p = pair(r, 5), bag = pick(r, [2, 3, 4, 5, 6, 8, 10])
      return { ...p, bag }
    }, x => x.total % x.bag === 0 && x.total / x.bag >= 2)
    const bags = total / bag, name = pick(r, NAMES)
    return { text: `A planter is made of the two joined boxes in the table. ${name} fills it with soil. One bag of soil fills ${bag} cubic feet. How many bags does ${name} need?`,
      picture: boxes(dims(UNITS[0], ...a), dims(UNITS[0], ...b), ['bottom box', 'top box']), answer: bags,
      steps: [`Bottom box: ${times(a)} = ${va}. Top box: ${times(b)} = ${vb}.`, `The planter holds ${va} + ${vb} = ${total} cubic feet.`, `${total} ÷ ${bag} = ${bags}. So ${name} needs ${bags} bags.`] }
  } },
]

// ── t5 · Tiles with fraction sides ──────────────────────────────────────────────────────────────────────────
/** n halves of a foot, written the lesson's way: 5 → "2 1/2". */
const halves = (n: number) => (n % 2 === 0 ? `${n / 2}` : n === 1 ? '1/2' : `${(n - 1) / 2} 1/2`)
const feet = (n: number) => (n === 1 ? '1/2 foot' : `${halves(n)} feet`)
/** t fourths as a mixed number: 15 → "3 3/4". Only odd t are asked, so it never lands on a whole number. */
const fourths = (t: number) => { const w = Math.floor(t / 4), n = t % 4; return w ? `${w} ${n}/4` : `${n}/4` }
const asFrac = (t: number) => { const w = Math.floor(t / 4); return { frac: [t % 4, 4] as [number, number], ...(w ? { whole: w } : {}) } }
const odd = (r: Rng, lo: number, hi: number) => 2 * int(r, Math.ceil((lo - 1) / 2), Math.floor((hi - 1) / 2)) + 1
/** A rug a halves long and b halves wide, both odd, at least 5 small tiles. */
const rug = (r: Rng, aHi: number, bHi: number) => until(() => ({ a: odd(r, 3, aHi), b: odd(r, 1, bHi) }), x => x.a * x.b >= 5)
const tileGrid = (a: number, b: number): Picture => ({ kind: 'grid', rows: b, cols: a, top: `${halves(a)} ft`, left: `${halves(b)} ft` })

const T5: Level[] = [
  { style: 'count the small tiles, then change to square feet', make: r => {
    const { a, b } = rug(r, 7, 3), t = a * b
    const thing = pick(r, ['mat', 'rug', 'tray'])
    return { text: `A ${thing} is ${feet(a)} long and ${feet(b)} wide. Each small tile is 1/2 foot on a side. How many square feet is the ${thing}?`,
      picture: tileGrid(a, b), answer: asFrac(t),
      steps: [`${halves(a)} feet is ${a} halves and ${halves(b)} is ${b} ${b === 1 ? 'half' : 'halves'}: ${b} ${b === 1 ? 'row' : 'rows'} of ${a}, or ${t} small tiles.`, `Each small tile is 1/4 of a square foot, so ${t} tiles are ${t}/4.`, `${t}/4 = ${fourths(t)}. So the ${thing} is ${fourths(t)} square feet.`] }
  } },
  { style: 'no tiles drawn: multiply the fractions', make: r => {
    const { a, b } = rug(r, 11, 7), t = a * b
    const thing = pick(r, ['board', 'garden bed', 'poster', 'floor'])
    return { text: `A ${thing} is ${feet(a)} long and ${feet(b)} wide. What is its area in square feet?`,
      picture: eq(`${halves(a)} ft × ${halves(b)} ft`), answer: asFrac(t),
      steps: [`${halves(a)} is ${a}/2 and ${halves(b)} is ${b}/2.`, `Multiply: ${a}/2 × ${b}/2 = ${t}/4. That is ${t} small tiles of 1/4 square foot.`, `${t}/4 = ${fourths(t)}. So the ${thing} is ${fourths(t)} square feet.`] }
  } },
  { style: 'spot the mistake: called each small tile a square foot', make: r => {
    const { a, b } = rug(r, 7, 5), t = a * b, name = pick(r, NAMES), right = `${fourths(t)} square feet`
    return { text: `${name} counts ${t} small tiles on this rug and says the rug is ${t} square feet. What is the real area?`,
      picture: tileGrid(a, b), answer: choose(r, right, [`${t} square feet`, `${halves(t)} square feet`]),
      steps: ['Each small tile is 1/2 foot on a side, so 4 of them make 1 square foot. One tile is only 1/4 of a square foot.', `${t} tiles are ${t}/4 = ${fourths(t)}.`, `So the real area is ${right}.`] }
  } },
  { style: 'work backwards: how many small tiles', make: r => {
    const { a, b } = rug(r, 11, 7), t = a * b, w = Math.floor(t / 4), n = t % 4
    return { text: `A rug is ${fourths(t)} square feet. It is covered with small tiles that are 1/2 foot on a side. How many small tiles cover it?`,
      picture: eq(`${fourths(t)} square feet`, ['4 small tiles = 1 square foot']), answer: t,
      steps: [`Every 4 small tiles make 1 square foot, so ${w} square ${w === 1 ? 'foot is' : 'feet are'} ${w} × 4 = ${w * 4} tiles.`, `The ${n}/4 left over is ${n} more ${n === 1 ? 'tile' : 'tiles'}.`, `${w * 4} + ${n} = ${t}. So ${t} small tiles cover the rug.`] }
  } },
  { style: 'two-step story: a fraction rug and a whole rug', make: r => {
    const { a, b } = rug(r, 7, 5), c = int(r, 2, 5), d = int(r, 2, 4), t = a * b, whole = c * d, all = t + 4 * whole, name = pick(r, NAMES)
    return { text: `${name} puts two rugs in a room. One rug is ${feet(a)} long and ${feet(b)} wide. The other rug is ${c} feet long and ${d} feet wide. How many square feet do the two rugs cover?`,
      picture: eq(`rug 1: ${halves(a)} ft by ${halves(b)} ft`, [`rug 2: ${c} ft by ${d} ft`]), answer: asFrac(all),
      steps: [`Rug 1: ${a}/2 × ${b}/2 = ${t}/4 = ${fourths(t)} square feet.`, `Rug 2: ${c} × ${d} = ${whole} square feet.`, `${fourths(t)} + ${whole} = ${fourths(all)}. So the rugs cover ${fourths(all)} square feet.`] }
  } },
]

// ── t6 · Sort four-sided shapes into families ───────────────────────────────────────────────────────────────
const ALL4 = [0, 1, 2, 3]
type Kind = 'square' | 'rectangle' | 'rhombus' | 'parallelogram'
const KINDS: Kind[] = ['square', 'rectangle', 'rhombus', 'parallelogram']
const PLURAL: Record<Kind, string> = { square: 'squares', rectangle: 'rectangles', rhombus: 'rhombuses', parallelogram: 'parallelograms' }
const corners = (k: Kind) => k === 'square' || k === 'rectangle'
const equal = (k: Kind) => k === 'square' || k === 'rhombus'
const kindOf = (c: boolean, e: boolean): Kind => (c ? (e ? 'square' : 'rectangle') : e ? 'rhombus' : 'parallelogram')
/** Does every shape of kind x also follow y's rule? */
const every = (x: Kind, y: Kind) => (!corners(y) || corners(x)) && (!equal(y) || equal(x))
const RULE: Record<Kind, string> = { parallelogram: 'two pairs of parallel sides', rectangle: '4 square corners', rhombus: '4 equal sides', square: '4 square corners and 4 equal sides' }
const lean = (a: number, b: number): [number, number][] => { const dx = b / 2, dy = Math.round(b * 86.6) / 100; return [[0, 0], [a, 0], [a + dx, dy], [dx, dy]] }
/** A shape of kind k, with its square corners and equal sides marked (or its sides labeled instead). */
const shapeOf = (r: Rng, k: Kind): Picture => {
  const a = int(r, 4, 6), b = equal(k) ? a : int(r, 2, a - 2)
  const pts: [number, number][] = corners(k) ? [[0, 0], [a, 0], [a, b], [0, b]] : lean(a, b)
  return { kind: 'poly', shapes: [{ pts, tone: (KINDS.indexOf(k) + 1) as 1 | 2 | 3 | 4, ...(corners(k) ? { right: ALL4 } : {}), ...(equal(k) ? { ticks: ALL4 } : {}) }] }
}
const NAMES_OF: Record<Kind, string> = {
  square: 'square, rectangle, rhombus and parallelogram', rectangle: 'rectangle and parallelogram', rhombus: 'rhombus and parallelogram', parallelogram: 'parallelogram only',
}
const TRUE_FACTS: [string, string][] = [
  ['Every square is a rectangle.', 'A square has 4 square corners, which is the rectangle rule.'],
  ['Every square is a rhombus.', 'A square has 4 equal sides, which is the rhombus rule.'],
  ['Every rectangle is a parallelogram.', 'A rectangle has two pairs of parallel sides, which is the parallelogram rule.'],
  ['Every rhombus is a parallelogram.', 'A rhombus has two pairs of parallel sides, which is the parallelogram rule.'],
  ['Some rectangles are squares.', 'A rectangle with 4 equal sides is a square, but most rectangles do not have them.'],
  ['Some rhombuses are squares.', 'A rhombus with 4 square corners is a square, but most rhombuses do not have them.'],
]
const FALSE_FACTS = ['Every rectangle is a square.', 'Every rhombus is a square.', 'Every parallelogram is a rectangle.', 'Every parallelogram is a rhombus.',
  'Every rectangle is a rhombus.', 'Every rhombus is a rectangle.', 'No square is a rectangle.', 'No rhombus is a parallelogram.']
const FAMILY: Picture = { kind: 'poly', shapes: [
  { pts: [[0, 4], [3, 4], [3, 7], [0, 7]], tone: 1, right: ALL4, ticks: ALL4 }, { pts: [[5, 4], [10, 4], [10, 7], [5, 7]], tone: 2, right: ALL4 },
  { pts: [[0, 0], [3, 0], [4.5, 2.6], [1.5, 2.6]], tone: 3, ticks: ALL4 }, { pts: [[6, 0], [10, 0], [11, 2.5], [7, 2.5]], tone: 4 }] }

const T6: Level[] = [
  { style: 'best name from the marks', make: r => {
    const k = pick(r, KINDS)
    const marks = `${corners(k) ? 'It has 4 square corners' : 'It has no square corners'}, and ${equal(k) ? 'its 4 sides are equal' : 'its sides are not all equal'}.`
    return { text: 'Look for marks that show square corners and equal sides. What is the best name for this shape?', picture: shapeOf(r, k),
      answer: choose(r, k, KINDS.filter(x => x !== k)),
      steps: ['Every shape here has two pairs of parallel sides, so it is at least a parallelogram.', marks, `So the best name is ${k}.`] }
  } },
  { style: 'is every one in the family?', make: r => {
    const x = pick(r, KINDS), y = pick(r, KINDS.filter(k => k !== x)), yes = every(x, y)
    const [all, some, none] = ['Yes, every one is.', 'No, only some are.', 'No, none of them are.']
    const right = yes ? all : some
    return { text: `Is every ${x} a ${y}?`, picture: shapeOf(r, x), answer: choose(r, right, [all, some, none].filter(c => c !== right)),
      steps: [`A ${y} needs ${RULE[y]}.`, yes ? `Every ${x} has ${RULE[y]}.` : `Some ${PLURAL[x]} have ${RULE[y]} and some do not.`, `So: ${right}`] }
  } },
  { style: 'all the names that fit, from a description', make: r => {
    const k = pick(r, KINDS)
    return { text: `A tile has two pairs of parallel sides. It has ${corners(k) ? '4 square corners' : 'no square corners'}, and ${equal(k) ? 'its 4 sides are equal' : 'its sides are not all equal'}. Which list gives all of its names?`,
      picture: shapeOf(r, k), answer: choose(r, NAMES_OF[k], KINDS.filter(x => x !== k).map(x => NAMES_OF[x])),
      steps: ['Two pairs of parallel sides make it a parallelogram.',
        `${corners(k) ? '4 square corners make it a rectangle.' : 'No square corners, so it is not a rectangle.'} ${equal(k) ? '4 equal sides make it a rhombus.' : 'Its sides are not all equal, so it is not a rhombus.'}`,
        `So its names are ${NAMES_OF[k]}.`] }
  } },
  { style: 'is the claim right? read the measures', make: r => {
    const c = r() < 0.5, e = r() < 0.5, a = int(r, 3, 7), b = e ? a : until(() => int(r, 2, 8), x => x !== a)
    const claim = pick(r, KINDS), fits = every(kindOf(c, e), claim), name = pick(r, NAMES)
    const pts: [number, number][] = c ? [[0, 0], [a, 0], [a, b], [0, b]] : lean(a, b)
    const [yes, no, turn] = ['Yes, that name fits it.', 'No, that name does not fit it.', 'It depends on which way you turn it.']
    const right = fits ? yes : no
    const facts = `This tile has ${c ? '4 square corners' : 'no square corners'}, and ${e ? `all 4 sides are ${a} inches` : `its sides are ${a} inches and ${b} inches`}.`
    return { text: `${name} cuts a tile with two pairs of parallel sides. The marks show any square corners. ${name} says it is a ${claim}. Is ${name} right?`,
      picture: { kind: 'poly', shapes: [{ pts, tone: 2, sides: [`${a} in`, `${b} in`, `${a} in`, `${b} in`], ...(c ? { right: ALL4 } : {}) }] },
      answer: choose(r, right, [yes, no, turn].filter(x => x !== right)),
      steps: [`A ${claim} needs ${RULE[claim]}.`, facts, `So: ${right}`] }
  } },
  { style: 'which sentence about the families is true', make: r => {
    const [right, why] = pick(r, TRUE_FACTS), wrong = shuffle(r, FALSE_FACTS).slice(0, 3)
    return { text: 'Which sentence is true?', picture: FAMILY, answer: choose(r, right, wrong),
      steps: ['Check each sentence against the family rules. A shape that follows a family’s rule belongs to that family.', why, `So the true one is: ${right}`] }
  } },
]

// ── t7 · Cubic units ────────────────────────────────────────────────────────────────────────────────────────
const SMALL = ['juice box', 'lunch box', 'jewelry box', 'pencil box', 'shoe box']
const BIG = ['moving truck', 'swimming pool', 'classroom', 'shipping container']

const T7: Level[] = [
  { style: 'count the cubes and name the cubic unit', make: r => {
    const u = pick(r, UNITS), l = int(r, 2, 5), w = int(r, 2, 3), h = int(r, 2, 3), lw = l * w, n = lw * h
    return { text: `Each cube is 1 cubic ${u.one}. What is the volume of this box in cubic ${u.many}?`, picture: cubes(l, w, h), answer: n,
      steps: [`One layer is ${l} × ${w} = ${lw} cubes.`, `There are ${h} layers: ${lw} × ${h}.`, `Each cube is 1 cubic ${u.one}, so the volume is ${n} cubic ${u.many}.`] }
  } },
  { style: 'pick the unit that fits the thing', make: r => {
    const big = r() < 0.5, thing = pick(r, big ? BIG : SMALL)
    const unit = big ? pick(r, ['feet', 'meters']) : pick(r, ['inches', 'centimeters'])
    const right = `cubic ${unit}`
    return { text: `Which unit fits best for the space inside a ${thing}?`, picture: cubes(1, 1, 1),
      answer: choose(r, right, [big ? 'cubic centimeters' : 'cubic meters', `square ${unit}`]),
      steps: ['Space inside is measured with cubes, not flat squares.', big ? `A ${thing} is huge, so tiny cubes would take far too long to count.` : `A ${thing} is small, so it takes small cubes.`, `So the best unit is ${right}.`] }
  } },
  { style: 'spot the mistake: square units or added', make: r => {
    const { rows, cols, h } = until(() => ({ rows: int(r, 2, 4), cols: int(r, 3, 6), h: int(r, 2, 4) }), x => x.rows + x.cols + x.h !== x.rows * x.cols * x.h)
    const lw = rows * cols, n = lw * h, name = pick(r, NAMES), right = `${n} cubic centimeters`
    return { text: `${name} fills a box with 1-centimeter cubes. Each layer has ${rows} rows of ${cols} cubes, and there are ${h} layers. What is the volume of the box?`,
      picture: cubes(cols, rows, h, 1), answer: choose(r, right, [`${n} square centimeters`, `${rows + cols + h} cubic centimeters`]),
      steps: [`${rows} rows of ${cols} is ${lw} cubes in a layer.`, `${h} layers: ${lw} × ${h} = ${n} cubes.`, `Cubes fill space, so the volume is ${right}.`] }
  } },
  { style: 'compare: fewer big cubes or more small cubes', make: r => {
    const [small, big] = pick(r, [['inch', 'foot', 'inches', 'feet'], ['centimeter', 'meter', 'centimeters', 'meters']].map(([s, b, sp, bp]) => [{ one: s, many: sp }, { one: b, many: bp }]))
    const nSmall = int(r, 20, 90), nBig = int(r, 2, 9), bigIsA = r() < 0.5
    const [A, B] = bigIsA ? [`${nBig} cubic ${big.many}`, `${nSmall} cubic ${small.many}`] : [`${nSmall} cubic ${small.many}`, `${nBig} cubic ${big.many}`]
    const right = bigIsA ? 'Box A' : 'Box B'
    return { text: `Box A holds ${A}. Box B holds ${B}. Which box has more space inside?`, picture: eq(A, [B]),
      answer: choose(r, right, [bigIsA ? 'Box B' : 'Box A', 'They hold the same.']),
      steps: [`A cubic ${big.one} is much bigger than a cubic ${small.one}. Even ${nSmall} cubic ${small.many} fit inside a single cubic ${big.one}.`, `So ${nBig} cubic ${big.many} is more space, even though ${nSmall} is the bigger number.`, `So the answer is ${right}.`] }
  } },
  { style: 'two-step story: two boxes of cubes', make: r => {
    const u = pick(r, UNITS.slice(1)), l = int(r, 2, 5), w = int(r, 2, 3), h = int(r, 2, 3), l2 = int(r, 2, 6), w2 = int(r, 2, 5), h2 = int(r, 2, 4)
    const one = l * w * h, two = l2 * w2 * h2, all = one + two, name = pick(r, NAMES)
    return { text: `Each cube is 1 cubic ${u.one}. ${name} has this box of cubes and a second box that is ${l2} ${u.ab} long, ${w2} ${u.ab} wide and ${h2} ${u.ab} tall. What is the volume of both boxes together in cubic ${u.many}?`,
      picture: cubes(l, w, h), answer: all,
      steps: [`This box: one layer is ${l} × ${w} = ${l * w}, and ${h} layers make ${one}.`, `The second box: ${l2} × ${w2} × ${h2} = ${two}.`, `${one} + ${two} = ${all}. So both boxes are ${all} cubic ${u.many}.`] }
  } },
]

export const G5M5_LADDERS: Record<string, Level[]> = {
  'g5m5-t1': T1, 'g5m5-t2': T2, 'g5m5-t3': T3, 'g5m5-t4': T4, 'g5m5-t5': T5, 'g5m5-t6': T6, 'g5m5-t7': T7,
}
