// Independent answer key for the g3m4 practice ladders. Written from the QUESTIONS only
// (scripts/ladder-questions.mts output), never from the generator.
type Q = { text: string; picture: any; choices?: string[] }

const nums = (s: string) => (s.match(/\d+/g) ?? []).map(Number)
const fail = (q: Q): never => { throw new Error(`g3m4: no rule for "${q.text}"`) }

type Rect = { r: number; c: number; h: number; w: number }
const cellsIn = (rects: Rect[] = []) => {
  const s = new Set<string>()
  for (const { r, c, h, w } of rects) for (let i = r; i < r + h; i++) for (let j = c; j < c + w; j++) s.add(`${i},${j}`)
  return s
}
/** Cells of a grid picture that are actually drawn (hidden cells removed). */
const shownCells = (p: any): number => {
  if (p?.kind !== 'grid') throw new Error('g3m4: expected a grid picture')
  const hidden = cellsIn(p.hide)
  let n = 0
  for (let i = 0; i < p.rows; i++) for (let j = 0; j < p.cols; j++) if (!hidden.has(`${i},${j}`)) n++
  return n
}
const one = (q: Q, fits: (c: string) => boolean): string => {
  const hits = (q.choices ?? []).filter(fits)
  if (hits.length !== 1) throw new Error(`g3m4: ${hits.length} choices fit "${q.text}" ${JSON.stringify(q.choices)}`)
  return hits[0]
}
/** Evaluates "a × b + c × d", "a × b + c", "just a × b" (no other operators appear). */
const evalExpr = (e: string): number =>
  e.replace(/^just\s+/, '').split('+').reduce((sum, term) => sum + term.split('×').reduce((p, f) => p * Number(f.trim()), 1), 0)

export const SOLVE: Record<string, (q: Q) => string> = {
  'g3m4-t1': q => {
    const t = q.text
    if (/How many more tiles will cover the whole floor/.test(t)) {
      const p = q.picture
      return String(p.rows * p.cols - cellsIn(p.shade).size)
    }
    if (/The closet floor takes (\d+) more tiles/.test(t)) {
      const extra = Number(t.match(/takes (\d+) more tiles/)![1])
      return String(shownCells(q.picture) + extra)
    }
    const got = t.match(/counts these tiles and gets (\d+)\. What happened\?/)
    if (got) {
      const real = shownCells(q.picture), g = Number(got[1])
      const want = g === real ? 'Every tile was counted once.' : g > real ? 'A tile was counted twice.' : 'A tile was skipped.'
      if (Math.abs(g - real) > 1) throw new Error(`g3m4: count off by ${g - real}, no choice explains it: "${t}"`)
      return one(q, c => c === want)
    }
    if (/How many square (feet|units)/.test(t)) return String(shownCells(q.picture))
    return fail(q)
  },

  'g3m4-t2': q => {
    const t = q.text
    let m
    if ((m = t.match(/is (\d+) (?:tiles|feet) long and (\d+) (?:tiles|feet) wide\. What is its area/))) return String(+m[1] * +m[2])
    if ((m = t.match(/added the sides of this garden and got (\d+)\. Which is the area\?/))) {
      const area = shownCells(q.picture)
      return one(q, c => nums(c)[0] === area)
    }
    if ((m = t.match(/has (\d+) rows of tiles and an area of (\d+) square units\. How many tiles are in each row/))) return String(+m[2] / +m[1])
    if ((m = t.match(/has (\d+) tiles in each row and an area of (\d+) square units\. How many rows/))) return String(+m[2] / +m[1])
    if ((m = t.match(/has (\d+) rows of tiles, with (\d+) tiles in each row\. (\d+) of the tiles are blue and the rest are white\. How many tiles are white/)))
      return String(+m[1] * +m[2] - +m[3])
    return fail(q)
  },

  'g3m4-t3': q => {
    const t = q.text
    let m
    if ((m = t.match(/is (\d+) tiles long and (\d+) tiles wide\. Cut it after \d+ tiles\. What is its area/))) return String(+m[1] * +m[2])
    if ((m = t.match(/^Find (\d+) × (\d+)\./))) return String(+m[1] * +m[2])
    if ((m = t.match(/true way to find (\d+) × (\d+)\?/))) {
      const target = +m[1] * +m[2]
      return one(q, c => evalExpr(c) === target)
    }
    if ((m = t.match(/box\? (\d+) × (\d+) = (\d+) × (\d+) \+ (\d+) × \?$/))) {
      const rest = +m[1] * +m[2] - +m[3] * +m[4]
      if (rest % +m[5]) fail(q)
      return String(rest / +m[5])
    }
    if ((m = t.match(/box\? (\d+) × (\d+) = (\d+) \+ \?$/))) return String(+m[1] * +m[2] - +m[3])
    if ((m = t.match(/tiles a patio (\d+) tiles long and (\d+) tiles wide\. The first (\d+) tiles of each row are gray and the rest are white\. How many more gray tiles than white/))) {
      const long = +m[1], rows = +m[2], gray = +m[3]
      return String(rows * gray - rows * (long - gray))
    }
    return fail(q)
  },

  'g3m4-t4': q => {
    const t = q.text
    let m
    if ((m = t.match(/room is (\d+) square feet\. Its tall part is (\d+) rows of (\d+) tiles\. How many square feet is the short part/))) return String(+m[1] - +m[2] * +m[3])
    if ((m = t.match(/says this room is \d+ square feet, because .*What is the real area\?/))) {
      const area = shownCells(q.picture)
      return one(q, c => nums(c)[0] === area)
    }
    if ((m = t.match(/The closet is a rectangle (\d+) feet by (\d+) feet\..*cover both\?/))) return String(shownCells(q.picture) + +m[1] * +m[2])
    if (/How many square feet is this L-shaped room\?|What is its area in square units\?/.test(t)) return String(shownCells(q.picture))
    return fail(q)
  },
}
