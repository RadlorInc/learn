/**
 * Grade 3 · Module 4 — Multiplication and area. Practice ladders, easiest style first (see ../adaptive.ts and the
 * reference ladders in ./g5m1.ts). Every tile picture is the lesson's `grid`; side lengths stay at 9 or less, so a
 * grid never draws a number that could be the area.
 */
import type { Picture } from '../script'
import { int, pick, shuffle, type Level, type Rng } from '../adaptive'

const eq = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })
const choose = (r: Rng, right: string, wrong: string[]) => {
  const choices = shuffle(r, [right, ...wrong])
  return { choices, correct: choices.indexOf(right) }
}
const countBy = (step: number, n: number) => Array.from({ length: n }, (_, k) => step * (k + 1)).join(', ')
const NAMES = ['Leo', 'Mia', 'Sam', 'Ava', 'Kai', 'Nina', 'Ben', 'Zoe']

// ── t1 · Cover the floor with tiles ─────────────────────────────────────────────────────────────────────────
const T1: Level[] = [
  { style: 'count the tiles', make: r => {
    const rows = int(r, 2, 4), cols = int(r, 3, 6), n = rows * cols
    return { text: 'Each tile is 1 square foot. How many square feet of floor do these tiles cover?', picture: { kind: 'grid', rows, cols }, answer: n,
      steps: ['Each tile is 1 square foot.', `Count every tile once, one row at a time: ${countBy(cols, rows)}.`, `So the tiles cover ${n} square feet.`] }
  } },
  { style: 'count a shape that is not a rectangle', make: r => {
    const rows = int(r, 3, 5), cols = int(r, 3, 6), h = int(r, 1, rows - 1), w = int(r, 1, cols - 1)
    const top = r() < 0.5, left = r() < 0.5
    const hide = { r: top ? 0 : rows - h, c: left ? 0 : cols - w, h, w }
    const lens = Array.from({ length: rows }, (_, i) => (i >= hide.r && i < hide.r + h ? cols - w : cols))
    const n = rows * cols - h * w
    return { text: 'Each square is 1 square unit. How many square units cover this shape?', picture: { kind: 'grid', rows, cols, hide: [hide] }, answer: n,
      steps: ['Count every square once. Some rows are shorter.', `The rows have ${lens.join(', ')} squares.`, `${lens.join(' + ')} = ${n}, so ${n} square units cover it.`] }
  } },
  { style: 'spot the mistake: skipped or counted twice', make: r => {
    const rows = int(r, 2, 4), cols = int(r, 3, 6), n = rows * cols, name = pick(r, NAMES)
    const got = n + pick(r, [-1, 0, 1])
    const [skip, twice, once] = ['A tile was skipped.', 'A tile was counted twice.', 'Every tile was counted once.']
    const right = got < n ? skip : got > n ? twice : once
    return { text: `${name} counts these tiles and gets ${got}. What happened?`, picture: { kind: 'grid', rows, cols }, answer: choose(r, right, [skip, twice, once].filter(c => c !== right)),
      steps: [`Count one row at a time: ${countBy(cols, rows)}.`, `There are ${n} tiles, and ${name} got ${got}.`, `So: ${right}`] }
  } },
  { style: 'how many more tiles to cover the floor', make: r => {
    const rows = int(r, 3, 5), cols = int(r, 3, 6), full = int(r, 1, rows - 1), part = int(r, 0, cols - 1)
    const shade = [{ r: 0, c: 0, h: full, w: cols }, ...(part ? [{ r: full, c: 0, h: 1, w: part }] : [])]
    const empty = Array.from({ length: rows - full }, (_, i) => (i === 0 ? cols - part : cols))
    const n = empty.reduce((a, b) => a + b, 0)
    return { text: 'Tiles are going down on this floor. The shaded tiles are down already. How many more tiles will cover the whole floor with no gaps?',
      picture: { kind: 'grid', rows, cols, shade }, answer: n,
      steps: ['Count only the empty squares, one row at a time.', `The empty rows have ${empty.join(', ')} squares.`, `${empty.join(' + ')} = ${n}, so ${n} more tiles are needed.`] }
  } },
  { style: 'two-step story: count, then add', make: r => {
    const rows = int(r, 2, 4), cols = int(r, 3, 6), hall = rows * cols, closet = int(r, 4, 9), all = hall + closet
    return { text: `These tiles cover the hall floor. Each tile is 1 square foot. The closet floor takes ${closet} more tiles. How many square feet of floor is that in all?`,
      picture: { kind: 'grid', rows, cols }, answer: all,
      steps: [`Count the hall tiles one row at a time: ${countBy(cols, rows)}. The hall is ${hall} square feet.`, `Add the closet: ${hall} + ${closet} = ${all}.`, `So it is ${all} square feet in all.`] }
  } },
]

// ── t2 · Count the rows instead ─────────────────────────────────────────────────────────────────────────────
const T2: Level[] = [
  { style: 'labeled tiles, rows times a row', make: r => {
    const rows = int(r, 2, 6), cols = int(r, 3, 8), a = rows * cols
    return { text: `A mat is ${cols} tiles long and ${rows} tiles wide. What is its area in square units?`,
      picture: { kind: 'grid', rows, cols, top: String(cols), left: String(rows) }, answer: a,
      steps: [`There are ${rows} rows, and each row has ${cols} tiles.`, `Count by rows: ${countBy(cols, rows)}.`, `So ${rows} × ${cols} = ${a}. The area is ${a} square units.`] }
  } },
  { style: 'side lengths only, no tiles', make: r => {
    const rows = int(r, 3, 9), cols = int(r, 3, 9), a = rows * cols
    return { text: `A rug is ${cols} feet long and ${rows} feet wide. What is its area in square feet?`,
      picture: eq(`${cols} ft long`, [`${rows} ft wide`]), answer: a,
      steps: [`Think of ${rows} rows with ${cols} square feet in each row.`, `${rows} × ${cols} = ${a}.`, `So the area is ${a} square feet.`] }
  } },
  { style: 'spot the mistake: added instead of multiplied', make: r => {
    let rows = 0, cols = 0
    do { rows = int(r, 2, 7); cols = int(r, 3, 8) } while (rows * cols === rows + cols || rows * cols === 2 * (rows + cols))
    const a = rows * cols, name = pick(r, NAMES)
    const right = `${a} square units: multiply ${rows} × ${cols}`
    return { text: `${name} added the sides of this garden and got ${rows + cols}. Which is the area?`,
      picture: { kind: 'grid', rows, cols, top: String(cols), left: String(rows) },
      answer: choose(r, right, [`${rows + cols} square units: add ${cols} + ${rows}`, `${2 * (rows + cols)} square units: go around the edge`]),
      steps: ['Adding walks around the edge. Multiplying fills the inside.', `There are ${rows} rows of ${cols}, and ${rows} × ${cols} = ${a}.`, `So it is ${right}.`] }
  } },
  { style: 'missing side: work backwards from the area', make: r => {
    const rows = int(r, 2, 9), cols = int(r, 2, 9), a = rows * cols
    if (r() < 0.5) return { text: `A patio has ${rows} rows of tiles and an area of ${a} square units. How many tiles are in each row?`,
      picture: eq(`${rows} × ? = ${a}`), answer: cols,
      steps: [`Think: ${rows} rows of how many make ${a}?`, `${rows} × ${cols} = ${a}.`, `So there are ${cols} tiles in each row.`] }
    return { text: `A patio has ${cols} tiles in each row and an area of ${a} square units. How many rows of tiles are there?`,
      picture: eq(`? × ${cols} = ${a}`), answer: rows,
      steps: [`Think: how many rows of ${cols} make ${a}?`, `${rows} × ${cols} = ${a}.`, `So there are ${rows} rows.`] }
  } },
  { style: 'two-step story: multiply, then take away', make: r => {
    let rows = 0, cols = 0, blue = 0, white = 0
    do { rows = int(r, 3, 8); cols = int(r, 3, 8); blue = int(r, 2, Math.floor((rows * cols) / 2)); white = rows * cols - blue } while (white === blue)
    const a = rows * cols
    return { text: `A bathroom floor has ${rows} rows of tiles, with ${cols} tiles in each row. ${blue} of the tiles are blue and the rest are white. How many tiles are white?`,
      picture: eq(`${rows} rows of ${cols}`, [`${blue} blue`]), answer: white,
      steps: [`First find all the tiles: ${rows} × ${cols} = ${a}.`, `Then take away the blue ones: ${a} − ${blue} = ${white}.`, `So ${white} tiles are white.`] }
  } },
]

// ── t3 · Break the rug into two pieces ──────────────────────────────────────────────────────────────────────
/** A rug r rows by c tiles, cut after 5 tiles: pieces r × 5 and r × (c − 5). */
const rug = (r: Rng) => { const rows = int(r, 2, 9), cols = int(r, 6, 9); return { rows, cols, rest: cols - 5, a: rows * cols } }
const cutGrid = (rows: number, cols: number, labels: boolean): Picture => ({
  kind: 'grid', rows, cols, split: { col: 5 }, ...(labels ? { top: String(cols), left: String(rows) } : {}),
  shade: [{ r: 0, c: 0, h: rows, w: 5, tone: labels ? 1 : 3 }, { r: 0, c: 5, h: rows, w: cols - 5, tone: 2 }],
})

const T3: Level[] = [
  { style: 'cut drawn on the tiles', make: r => {
    const { rows, cols, rest, a } = rug(r)
    return { text: `A rug is ${cols} tiles long and ${rows} tiles wide. Cut it after 5 tiles. What is its area?`, picture: cutGrid(rows, cols, true), answer: a,
      steps: [`Cut after 5 tiles. The pieces are ${rows} by 5 and ${rows} by ${rest}.`, `${rows} × 5 = ${rows * 5} and ${rows} × ${rest} = ${rows * rest}.`, `${rows * 5} + ${rows * rest} = ${a}, so the area is ${a} square units.`] }
  } },
  { style: 'break the fact, no tiles', make: r => {
    const { rows, cols, rest, a } = rug(r)
    return { text: `Find ${rows} × ${cols}. Break ${cols} into 5 and ${rest}.`, picture: eq(`${rows} × ${cols} = ${rows} × 5 + ${rows} × ${rest}`), answer: a,
      steps: [`${rows} × 5 = ${rows * 5}.`, `${rows} × ${rest} = ${rows * rest}.`, `${rows * 5} + ${rows * rest} = ${a}, so ${rows} × ${cols} = ${a}.`] }
  } },
  { style: 'pick the true way to break it', make: r => {
    const { rows, cols, rest } = rug(r)
    const right = `${rows} × 5 + ${rows} × ${rest}`
    return { text: `Which one is a true way to find ${rows} × ${cols}?`, picture: cutGrid(rows, cols, false),
      answer: choose(r, right, [`${rows} × 5 + ${rows} × ${cols}`, `${rows} × 5 + ${rest}`, `just ${rows} × 5`]),
      steps: [`Cut after 5 tiles. The pieces are ${rows} by 5 and ${rows} by ${rest}.`, 'Find both pieces, then add them. Stopping after one piece leaves part of the rug out.', `So the true one is ${right}.`] }
  } },
  { style: 'missing piece', make: r => {
    const { rows, cols, rest } = rug(r), x = rows * rest
    if (r() < 0.5) return { text: `What number goes in the box? ${rows} × ${cols} = ${rows * 5} + ?`, picture: eq(`${rows} × ${cols} = ${rows * 5} + ?`), answer: x,
      steps: [`Break ${cols} into 5 and ${rest}. The first piece is ${rows} × 5 = ${rows * 5}.`, `The other piece is ${rows} × ${rest}.`, `${rows} × ${rest} = ${x}, so the missing number is ${x}.`] }
    return { text: `What number goes in the box? ${rows} × ${cols} = ${rows} × 5 + ${rows} × ?`, picture: eq(`${rows} × ${cols} = ${rows} × 5 + ${rows} × ?`), answer: rest,
      steps: [`The first piece takes 5 of the ${cols}.`, `${cols} − 5 = ${rest} are left for the other piece.`, `So the missing number is ${rest}.`] }
  } },
  { style: 'two-step story: two pieces, then compare', make: r => {
    const { rows, cols, rest } = rug(r), gray = rows * 5, white = rows * rest, d = gray - white, name = pick(r, NAMES)
    return { text: `${name} tiles a patio ${cols} tiles long and ${rows} tiles wide. The first 5 tiles of each row are gray and the rest are white. How many more gray tiles than white tiles are there?`,
      picture: cutGrid(rows, cols, false), answer: d,
      steps: [`Gray: ${rows} × 5 = ${gray}. White: ${rows} × ${rest} = ${white}.`, `${gray} − ${white} = ${d}.`, `So there are ${d} more gray tiles.`] }
  } },
]

// ── t4 · An L-shaped room ───────────────────────────────────────────────────────────────────────────────────
/** A rows × cols rectangle with a top corner cut out; the cut line runs down beside the tall part. */
const room = (r: Rng) => {
  const rows = int(r, 4, 8), cols = int(r, 4, 9), k = int(r, 2, cols - 2), h = int(r, 1, rows - 2), left = r() < 0.5
  const tall = rows * k, short = (rows - h) * (cols - k)
  const hide = { r: 0, c: left ? 0 : k, h, w: cols - k }
  return { rows, cols, k, h, left, tall, short, area: tall + short, hide, splitCol: left ? cols - k : k }
}
type Room = ReturnType<typeof room>
const lGrid = (x: Room, cut: boolean, feet = false): Picture => ({
  kind: 'grid', rows: x.rows, cols: x.cols, hide: [x.hide],
  ...(cut ? { split: { col: x.splitCol } } : {}),
  ...(feet ? { top: `${x.cols} ft`, left: `${x.rows} ft` } : {}),
})
const parts = (x: Room) => `The tall part is ${x.rows} × ${x.k} = ${x.tall}. The short part is ${x.rows - x.h} × ${x.cols - x.k} = ${x.short}.`

const T4: Level[] = [
  { style: 'cut line drawn', make: r => {
    const x = room(r)
    return { text: 'Each tile is 1 square foot. How many square feet is this L-shaped room?', picture: lGrid(x, true), answer: x.area,
      steps: ['Cut the room along the dashed line into two rectangles.', parts(x), `${x.tall} + ${x.short} = ${x.area}, so the room is ${x.area} square feet.`] }
  } },
  { style: 'find your own cut', make: r => {
    const x = room(r)
    return { text: 'Each square is 1 square unit. Cut this shape into two rectangles. What is its area in square units?', picture: lGrid(x, false), answer: x.area,
      steps: ['Cut straight down beside the tall part. That makes two rectangles.', parts(x), `${x.tall} + ${x.short} = ${x.area}, so the area is ${x.area} square units.`] }
  } },
  { style: 'spot the trap: longest side times tallest side', make: r => {
    let x = room(r)
    const vals = (y: Room) => [y.area, y.rows * y.cols, y.rows + y.cols, y.tall]
    while (new Set(vals(x)).size < 4) x = room(r)
    const name = pick(r, NAMES), whole = x.rows * x.cols, right = `${x.area} square feet`
    return { text: `${name} says this room is ${whole} square feet, because ${x.rows} × ${x.cols} = ${whole}. What is the real area?`, picture: lGrid(x, false, true),
      answer: choose(r, right, [`${whole} square feet`, `${x.rows + x.cols} square feet`, `${x.tall} square feet`]),
      steps: [`${x.rows} × ${x.cols} counts the missing corner too, and there is no floor there.`, `Cut the room into two rectangles. ${parts(x)}`, `${x.tall} + ${x.short} = ${x.area}, so the room is ${right}.`] }
  } },
  { style: 'work backwards: the missing part', make: r => {
    const x = room(r)
    return { text: `An L-shaped room is ${x.area} square feet. Its tall part is ${x.rows} rows of ${x.k} tiles. How many square feet is the short part?`,
      picture: eq(`${x.rows} × ${x.k} + ? = ${x.area}`), answer: x.short,
      steps: [`The tall part is ${x.rows} × ${x.k} = ${x.tall}.`, `The two parts add up to ${x.area}, so take away the tall part: ${x.area} − ${x.tall} = ${x.short}.`, `So the short part is ${x.short} square feet.`] }
  } },
  { style: 'two-step story: an L-shaped room and a closet', make: r => {
    const x = room(r), p = int(r, 2, 4), q = int(r, 2, 5), closet = p * q, all = x.area + closet, name = pick(r, NAMES)
    return { text: `${name}'s bedroom is shaped like this L. The closet is a rectangle ${p} feet by ${q} feet. Each tile is 1 square foot. How many square feet of carpet cover both?`,
      picture: lGrid(x, true), answer: all,
      steps: [`Bedroom: ${parts(x)} ${x.tall} + ${x.short} = ${x.area}.`, `Closet: ${p} × ${q} = ${closet}.`, `${x.area} + ${closet} = ${all}, so the carpet covers ${all} square feet.`] }
  } },
]

export const G3M4_LADDERS: Record<string, Level[]> = { 'g3m4-t1': T1, 'g3m4-t2': T2, 'g3m4-t3': T3, 'g3m4-t4': T4 }
