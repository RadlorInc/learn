// Independent answer key for g3m6 practice ladders — written from the generated QUESTIONS only
// (scripts/ladder-questions.mts), never from the generator. Each solver reads the text/picture,
// works the maths, and throws on anything it does not recognise or on a text/picture disagreement.
type Q = { text: string; picture: any; choices?: string[] }

const fail = (q: Q, why = 'unrecognised'): never => {
  throw new Error(`g3m6 solver (${why}): ${q.text}`)
}
const close = (a: number, b: number) => Math.abs(a - b) < 1e-9
const oneChoice = (q: Q, fits: (c: string) => boolean) => {
  const hits = (q.choices ?? []).filter(fits)
  if (hits.length !== 1) fail(q, `${hits.length} choices fit`)
  return hits[0]
}
/** "5", "2 1/4", "3/4" → number */
const mixed = (s: string): number => {
  const m = s.trim().match(/^(?:(\d+)\s+)?(?:(\d+)\/(\d+))?$|^(\d+)$/)
  if (!m) throw new Error(`not a number: ${s}`)
  if (m[4]) return +m[4]
  return (m[1] ? +m[1] : 0) + (m[2] ? +m[2] / +m[3] : 0)
}
/** number → "5", "2 1/2", "3/4" (fourths reduced) */
const show = (x: number): string => {
  const whole = Math.floor(x + 1e-9)
  const q = Math.round((x - whole) * 4)
  if (!close(whole + q / 4, x)) throw new Error(`not in fourths: ${x}`)
  const f = q === 0 ? '' : q === 2 ? '1/2' : `${q}/4`
  return f ? (whole ? `${whole} ${f}` : f) : String(whole)
}
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const firstNum = (s: string) => {
  const m = s.match(/\d+(?:\s+\d+\/\d+)?|\d+\/\d+/)
  return m ? mixed(m[0]) : NaN
}

// ---- charts (picture + bar): which labels does the text name, in the order it names them ----
const named = (q: Q): { label: string; v: number }[] => {
  const p = q.picture
  if (p?.kind !== 'chart' || !Array.isArray(p.labels)) fail(q, 'expected chart')
  const hits = (p.labels as string[])
    .map((label, i) => ({ label, v: p.values[i] as number, at: q.text.search(new RegExp(`\\b${esc(label)}\\b`, 'i')) }))
    .filter(h => h.at >= 0)
    .sort((a, b) => a.at - b.at)
  return hits
}
const chartSolve = (q: Q): string => {
  const t = q.text
  const n = named(q)
  const scale = q.picture.scale as number
  // someone's wrong reading — the truth is the value on the chart
  if (/ says .* because /.test(t)) {
    if (n.length !== 1) fail(q, 'says: named count')
    const truth = n[0].v
    const claim = firstNum(t)
    const shown = +(t.match(/has (\d+) stars|is (\d+) lines tall/)?.slice(1).find(Boolean) ?? NaN)
    if (!close(shown, truth / scale) || shown !== claim) fail(q, 'claimed marks disagree with picture')
    return oneChoice(q, c => (/ is right\.$/.test(c) ? close(claim, truth) : close(firstNum(c), truth)))
  }
  // an empty row / missing bar to fill from "N more/fewer … than B"
  const empty = t.match(/row is empty|bar is missing/)
  if (empty) {
    const m = t.match(/(\d+) (more|fewer)\b/)
    if (!m || n.length !== 2) fail(q, 'missing: parse')
    const [target, other] = n
    if (target.v !== 0) fail(q, 'missing: target value not 0 in picture')
    const val = other.v + (m![2] === 'more' ? +m![1] : -+m![1])
    if (val < 0) fail(q, 'missing: negative')
    return /How many stars/.test(t) ? show(val / scale) : show(val)
  }
  if (/together than/.test(t)) {
    if (n.length !== 3) fail(q, 'together: named count')
    const d = n[0].v + n[1].v - n[2].v
    if (d < 0) fail(q, 'together: negative')
    return String(d)
  }
  if (/How many more .* than/.test(t)) {
    if (n.length !== 2) fail(q, 'more: named count')
    const d = n[0].v - n[1].v
    if (d < 0) fail(q, 'more: negative')
    return String(d)
  }
  if (/^Each star stands for (\d+)/.test(t) || /^The numbers on the side count by (\d+)s/.test(t)) {
    const by = +(t.match(/(\d+)/)![1])
    if (by !== scale) fail(q, 'text scale != picture scale')
    if (n.length !== 1) fail(q, 'read: named count')
    return String(n[0].v)
  }
  return fail(q)
}

// ---- rulers ----
const rulerSolve = (q: Q): string => {
  const t = q.text
  const p = q.picture
  if (p?.kind === 'eq') {
    const m = t.match(/cuts every inch into (\d+) equal parts\. The \w+ goes past (\d+) whole inch(?:es)?, then (\d+) small parts? more/)
    if (!m) fail(q, 'eq ruler parse')
    const [, parts, whole, extra] = m!.map(Number)
    if (extra >= parts) fail(q, 'extra parts >= parts per inch')
    return show(whole + extra / parts)
  }
  if (p?.kind !== 'measure' || p.tool !== 'ruler') fail(q, 'expected ruler')
  if (!/starts at 0|every other number|from 0/.test(t)) fail(q)
  const len = p.value as number
  if (len > p.max || !close(Math.round(len / p.step) * p.step, len)) fail(q, 'value off the marks')
  if (/to the half inch/.test(t) && p.step !== 0.5) fail(q, 'half inch vs step')
  if (/to the quarter inch/.test(t) && p.step !== 0.25) fail(q, 'quarter inch vs step')
  if (/ says it is (\d+) inches/.test(t)) {
    const marks = Math.round(len / p.step)
    if (+t.match(/says it is (\d+)/)![1] !== marks) fail(q, 'claimed mark count wrong')
    return oneChoice(q, c => close(mixed(c.replace(/ inch(es)?$/, '')), len))
  }
  return show(len)
}

// ---- line plots ----
const plotSolve = (q: Q): string => {
  const t = q.text
  const p = q.picture
  const unitWord = (c: string) => firstNum(c)
  if (p?.kind === 'table') {
    const m = t.match(/How many \w+ are longer than ([\d /]+?) inch/)
    if (!m) fail(q)
    const x = mixed(m![1])
    const all = (p.rows as string[][]).flat().map(mixed)
    return String(all.filter(v => v > x + 1e-9).length)
  }
  if (p?.kind !== 'chart' || p.type !== 'dot') fail(q, 'expected dot plot')
  const xs = (p.labels as string[]).map(mixed)
  const vs = p.values as number[]
  const count = (f: (x: number) => boolean) => String(xs.reduce((s, x, i) => s + (f(x) ? vs[i] : 0), 0))
  const at = (x: number) => {
    const i = xs.findIndex(v => close(v, x))
    if (i < 0) fail(q, 'length not on the plot')
    return vs[i]
  }
  let m
  if ((m = t.match(/Max sees ([\d /]+?) under the line/))) {
    const truth = at(mixed(m[1]))
    return oneChoice(q, c => unitWord(c) === truth)
  }
  if ((m = t.match(/longer than ([\d /]+?) inch(?:es)? but shorter than ([\d /]+?) inch/))) {
    const a = mixed(m[1]), b = mixed(m[2])
    return count(x => x > a + 1e-9 && x < b - 1e-9)
  }
  if ((m = t.match(/shorter than ([\d /]+?) inch/))) { const a = mixed(m[1]); return count(x => x < a - 1e-9) }
  if ((m = t.match(/longer than ([\d /]+?) inch/))) { const a = mixed(m[1]); return count(x => x > a + 1e-9) }
  if ((m = t.match(/are ([\d /]+?) inch(?:es)? long\?$/))) return String(at(mixed(m[1])))
  return fail(q)
}

// ---- quadrilaterals ----
const shapeOf = (q: Q) => {
  const s = q.picture?.shapes?.[0]
  if (q.picture?.kind !== 'poly' || !s || s.pts.length !== 4) fail(q, 'expected one 4-sided poly')
  const P = s.pts as [number, number][]
  const len = P.map((a, i) => Math.hypot(P[(i + 1) % 4][0] - a[0], P[(i + 1) % 4][1] - a[1]))
  const geoSq = P.every((b, i) => {
    const a = P[(i + 3) % 4], c = P[(i + 1) % 4]
    return Math.abs((a[0] - b[0]) * (c[0] - b[0]) + (a[1] - b[1]) * (c[1] - b[1])) < 1e-6
  })
  const geoEq = len.every(l => close(l, len[0]))
  const markSq = (s.right ?? []).length === 4
  const labels: (string | null)[] | undefined = s.sides
  const labelled = labels && labels.every(l => l)
  const markEq = (s.ticks ?? []).length === 4 || (!!labelled && labels!.every(l => l === labels![0]))
  return { geoSq, geoEq, markSq, markEq, labelled, len, labels }
}
const shapeSolve = (q: Q): string => {
  const t = q.text
  const s = shapeOf(q)
  let m
  // text states the facts, the picture has no marks
  if ((m = t.match(/^An? (\w+) has (?:4 square corners|4 sides that are all (\d+) feet long, but none of its corners is a square corner)\. (?:Its sides are (\d+), (\d+), (\d+) and (\d+) feet long|All 4 of its sides are (\d+) feet long)?/))) {
    const sq = /has 4 square corners/.test(t)
    const sides = m[3] ? [m[3], m[4], m[5], m[6]].map(Number) : [+(m[2] ?? m[7])]
    if (sides.some(isNaN)) fail(q, 'side parse')
    const eq = sides.every(v => v === sides[0])
    if (sq !== s.geoSq || eq !== s.geoEq) fail(q, 'text disagrees with picture')
    if (sides.length === 4 && !s.len.every((l, i) => close(l, sides[i]))) fail(q, 'side lengths disagree with picture')
    const name = sq && eq ? 'square and rectangle' : sq ? 'rectangle only' : 'neither'
    return oneChoice(q, c => c === name)
  }
  // drawn to scale: every written side length matches the drawing
  if (s.labelled && !s.len.every((l, i) => Math.abs(l - parseFloat(s.labels![i]!)) < 0.05)) fail(q, 'side labels disagree with drawing')
  // no marks at all: the child reads the drawn corners and sides
  if (/^Look at the corners and sides\. What shape is this tile\?$/.test(t)) {
    if ((q.picture.shapes[0].right ?? []).length || (q.picture.shapes[0].ticks ?? []).length) fail(q, 'says unmarked but has marks')
    const name = s.geoSq && s.geoEq ? 'a square' : s.geoSq ? 'a rectangle but not a square' : 'neither'
    return oneChoice(q, c => c === name)
  }
  // otherwise the child reads the marks / labels
  if (s.markSq !== s.geoSq || s.markEq !== s.geoEq) fail(q, `marks disagree with drawing (sq ${s.markSq}/${s.geoSq}, eq ${s.markEq}/${s.geoEq})`)
  const sq = s.markSq, eq = s.markEq
  if (/What shape is (this tile|it)\?/.test(t)) {
    const name = sq && eq ? 'a square' : sq ? 'a rectangle but not a square' : 'neither'
    return oneChoice(q, c => c === name)
  }
  if (/What is true about this shape\?/.test(t)) {
    return oneChoice(q, c =>
      c === '4 equal sides and 4 square corners' ? eq && sq
      : c === '4 square corners, but the sides are not all equal' ? sq && !eq
      : c === '4 equal sides, but the corners are not square' ? eq && !sq
      : fail(q, `unknown choice ${c}`))
  }
  if ((m = t.match(/^(\w+) says this shape is (not a rectangle, because it is a square|a square, because .*)\. Who is right\?$/))) {
    const who = m[1]
    const notRect = m[2].startsWith('not')
    const claimTrue = notRect ? !sq && eq && sq : sq && eq
    return oneChoice(q, c =>
      c === `${who} is right.` ? claimTrue
      : c === `${who} is wrong. A square is a rectangle too.` ? notRect && sq && eq
      : c === `${who} is wrong. The corners are not square corners.` ? !claimTrue && !sq
      : c === `${who} is wrong. The sides are not all equal.` ? !claimTrue && !eq
      : fail(q, `unknown choice ${c}`))
  }
  return fail(q)
}

// ---- perimeter ----
const ft = (s: string | null | undefined) => (s ? parseFloat(s) : NaN)
const perimSolve = (q: Q): string => {
  const t = q.text
  const sh = q.picture?.shapes?.[0]
  if (q.picture?.kind !== 'poly' || !sh) fail(q, 'expected poly')
  const unit = /inch/.test(t) ? 'in' : 'ft'
  const sides: (string | null)[] = sh.sides ?? []
  for (const s of sides) if (s && s !== '?' && !s.endsWith(` ${unit}`)) fail(q, 'unit disagrees with label')
  let m
  if ((m = t.match(/^It is (\d+) (?:inches|feet) all the way around this (?:garden|flower bed|sticker|badge)\. How long is the side marked "\?"\??$/))) {
    if (sides.filter(s => s === '?').length !== 1 || sides.some(s => s === null)) fail(q, 'marked side')
    const known = sides.filter(s => s !== '?').reduce((a, s) => a + ft(s), 0)
    const x = +m[1] - known
    if (x <= 0) fail(q, 'non-positive side')
    const P = sh.pts as [number, number][]
    const drawn = P.map((a, i) => Math.hypot(P[(i + 1) % P.length][0] - a[0], P[(i + 1) % P.length][1] - a[1]))
    // Known sides to scale; the "?" side must NOT be drawn at its answer, or the picture gives it away by size.
    if (!sides.every((s, i) => s === '?' || Math.abs(drawn[i] - ft(s)) < 0.05)) fail(q, 'known sides not drawn to scale')
    if (sides.some((s, i) => s === '?' && Math.abs(drawn[i] - x) < 1)) fail(q, '"?" side drawn at its answer')
    return String(x)
  }
  const rect = (sh.right ?? []).length === 4 && sh.pts.length === 4
  if ((m = t.match(/^(\w+) has (\d+) feet of fence\. The garden is (\d+) feet long and (\d+) feet wide\./))) {
    if (ft(sides[0]) !== +m[3] || ft(sides[1]) !== +m[4]) fail(q, 'text dims disagree with labels')
    const left = +m[2] - 2 * (+m[3] + +m[4])
    if (left < 0) fail(q, 'not enough fence')
    return String(left)
  }
  if (/is a square\. How many/.test(t)) {
    if (!rect || (sh.ticks ?? []).length !== 4) fail(q, 'square marks')
    return String(4 * ft(sides[0]))
  }
  if (/^Only two sides .* It has 4 square corners\./.test(t)) {
    if (!rect) fail(q, 'right marks')
    return String(2 * (ft(sides[0]) + ft(sides[1])))
  }
  if (/^How many (inches|feet) is it all the way around/.test(t)) {
    if (sides.some(s => !s)) fail(q, 'unlabelled side')
    return String(sides.reduce((a, s) => a + ft(s), 0))
  }
  return fail(q)
}

// ---- area vs perimeter ----
const dims = (s: string) => {
  const m = s.match(/(\d+) feet by (\d+) f(?:ee|oo)t/)
  if (!m) throw new Error(`no dims: ${s}`)
  if ((+m[2] === 1) !== / foot/.test(s.slice(s.indexOf('by')))) throw new Error(`foot/feet: ${s}`)
  return [+m[1], +m[2]]
}
const areaSolve = (q: Q): string => {
  const t = q.text
  const p = q.picture
  let m
  if ((m = t.match(/^This garden is (\d+) feet long and (\d+) f(?:ee|oo)t wide\. How many (squares does it hold inside|feet of fence go all the way around it)\?$/))) {
    const L = +m[1], W = +m[2]
    if (p?.kind !== 'grid' || p.cols !== L || p.rows !== W) fail(q, 'grid disagrees with text')
    return String(m[3].startsWith('squares') ? L * W : 2 * (L + W))
  }
  if ((m = t.match(/^Both gardens have (\d+) feet of fence\. Garden A is (.+?)\. Garden B is (.+?)\. (.*)$/))) {
    const A = dims(m[2]), B = dims(m[3])
    for (const [a, b] of [A, B]) if (2 * (a + b) !== +m[1]) fail(q, 'fence does not match a garden')
    const shade = p?.shade ?? []
    if (shade.length !== 2 || shade[0].w * shade[0].h !== A[0] * A[1] || shade[1].w * shade[1].h !== B[0] * B[1]) fail(q, 'grid disagrees with text')
    const aA = A[0] * A[1], aB = B[0] * B[1]
    if (/Which garden holds more squares\?/.test(m[4]))
      return oneChoice(q, c => (c === 'Garden A' ? aA > aB : c === 'Garden B' ? aB > aA : c === 'They hold the same' ? aA === aB : fail(q)))
    const mm = m[4].match(/How many more squares does Garden (A|B) hold than Garden (A|B)\?/)
    if (!mm) fail(q)
    const d = mm![1] === 'A' ? aA - aB : aB - aA
    if (d < 0) fail(q, 'negative')
    return String(d)
  }
  if ((m = t.match(/^This garden has (\d+) feet of fence\. Another garden has the same \1 feet of fence and is (\d+) feet long\. How many squares does the other garden hold\?$/))) {
    if (p?.kind !== 'grid' || 2 * (p.rows + p.cols) !== +m[1]) fail(q, 'grid fence disagrees with text')
    const W = +m[1] / 2 - +m[2]
    if (W <= 0 || !Number.isInteger(W)) fail(q, 'bad width')
    return String(+m[2] * W)
  }
  if ((m = t.match(/^\w+ has (\d+) feet of fence for a rabbit pen\. .*Which pen gives the rabbit the most squares of room\?$/))) {
    if (p?.kind !== 'table' || p.head?.join('|') !== 'Pen|Side|Other side') fail(q, 'expected pen table')
    const pens = (p.rows as string[][]).map(r => [parseInt(r[1]), parseInt(r[2])])
    for (const [a, b] of pens) if (2 * (a + b) !== +m[1]) fail(q, 'a pen does not use the fence')
    const best = Math.max(...pens.map(([a, b]) => a * b))
    if (pens.filter(([a, b]) => a * b === best).length !== 1) fail(q, 'tie for most room')
    return oneChoice(q, c => { const [a, b] = dims(c); return a * b === best && pens.some(([x, y]) => x === a && y === b) })
  }
  return fail(q)
}

export const SOLVE: Record<string, (q: Q) => string> = {
  'g3m6-t1': chartSolve,
  'g3m6-t2': chartSolve,
  'g3m6-t3': rulerSolve,
  'g3m6-t4': plotSolve,
  'g3m6-t5': shapeSolve,
  'g3m6-t6': perimSolve,
  'g3m6-t7': areaSolve,
}
