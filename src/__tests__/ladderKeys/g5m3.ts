// Blind answer key for g5m3's practice ladders. Written from the QUESTIONS only
// (`npx tsx scripts/ladder-questions.mts g5m3 N`), never from the generator.
// Every picture that restates the text's numbers is checked against them; a disagreement throws.
type Q = { text: string; picture: any; choices?: string[] }

const fail = (q: Q, why = 'no rule for'): never => { throw new Error(`g5m3 key: ${why}: ${q.text}`) }
const same = (q: Q, a: unknown, b: unknown, what: string) => { if (String(a) !== String(b)) fail(q, `picture disagrees (${what}: ${a} vs ${b})`) }
const m = (q: Q, re: RegExp) => q.text.match(re)

// ── exact fractions ─────────────────────────────────────────────────────────
type F = [number, number]
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a))
const F = (n: number, d = 1): F => { const g = gcd(n, d) || 1; return d < 0 ? [-n / g, -d / g] : [n / g, d / g] }
const mul = (a: F, b: F) => F(a[0] * b[0], a[1] * b[1])
const dv = (a: F, b: F) => F(a[0] * b[1], a[1] * b[0])
const add = (a: F, b: F) => F(a[0] * b[1] + b[0] * a[1], a[1] * b[1])
const sub = (a: F, b: F) => add(a, [-b[0], b[1]])
const cmp = (a: F, b: F) => Math.sign(a[0] * b[1] - b[0] * a[1])
const eq = (a: F, b: F) => cmp(a, b) === 0
/** "3", "3/4" or "2 1/3". */
function parse(s: string): F {
  const t = s.trim()
  let r = t.match(/^(\d+) (\d+)\/(\d+)$/)
  if (r) return F(+r[1] * +r[3] + +r[2], +r[3])
  r = t.match(/^(\d+)\/(\d+)$/)
  if (r) return F(+r[1], +r[2])
  if (/^\d+$/.test(t)) return F(+t)
  throw new Error(`g5m3 key: cannot read number "${s}"`)
}
const frac = (f: F) => (f[1] === 1 ? String(f[0]) : `${f[0]}/${f[1]}`)
const whole = (q: Q, f: F) => (f[1] === 1 ? String(f[0]) : fail(q, `answer ${frac(f)} is not a whole number`))

/** "a op b op c …" with + (lowest), × and ÷ (left to right). */
function evalExpr(s: string): F {
  return s.split(' + ').map(term => {
    const tok = term.trim().split(' ')
    let v = parse(tok[0])
    for (let i = 1; i < tok.length; i += 2) {
      if (tok[i] === '×') v = mul(v, parse(tok[i + 1]))
      else if (tok[i] === '÷') v = dv(v, parse(tok[i + 1]))
      else throw new Error(`g5m3 key: bad operator in "${s}"`)
    }
    return v
  }).reduce(add)
}

function pick(q: Q, ok: (c: string) => boolean): string {
  const hits = (q.choices ?? []).filter(ok)
  if (hits.length !== 1) throw new Error(`g5m3 key: ${hits.length} choices fit: ${q.text} ${JSON.stringify(q.choices)}`)
  return hits[0]
}

/** "Which one is true?" over an eq picture: each choice is "<picture expr> = value". */
function whichTrue(q: Q, value: (expr: string) => F): string {
  const expr: string = q.picture?.kind === 'eq' ? q.picture.text : fail(q, 'no eq picture')
  const want = value(expr)
  return pick(q, c => {
    const [l, r, extra] = c.split(' = ')
    if (l !== expr || r === undefined || extra !== undefined) fail(q, `choice "${c}" is not about ${expr}`)
    return eq(parse(r), want)
  })
}


// ── picture checks ─────────────────────────────────────────────────────────
const bars = (q: Q) => (q.picture?.kind === 'bars' ? q.picture.bars : fail(q, 'expected bars'))
const tapeCells = (q: Q) => (q.picture?.kind === 'tape' && q.picture.rows.length === 1 ? q.picture.rows[0] : fail(q, 'expected one tape row'))
function wholeBars(q: Q, n: number, split?: number) {
  const b = bars(q)
  same(q, b.length, n, 'bar count')
  for (const x of b) { same(q, x.parts, 1, 'bar parts'); same(q, x.shaded, 0, 'bar shaded'); if (split !== undefined) same(q, x.split, split, 'bar split') }
}
function oneBar(q: Q, parts: number, shaded: number) {
  const b = bars(q)
  same(q, b.length, 1, 'bar count'); same(q, b[0].parts, parts, 'bar parts'); same(q, b[0].shaded, shaded, 'bar shaded')
  return b[0]
}
function tape(q: Q, cells: number, brace: string, shadeFirst = false) {
  const r = tapeCells(q)
  same(q, r.cells.length, cells, 'tape cells'); same(q, r.brace, brace, 'tape brace')
  r.cells.forEach((c: any, i: number) => { same(q, c.w, 1, 'cell width'); same(q, !!c.shade, shadeFirst && i === 0, `cell ${i} shade`) })
}
/** n/d drawn as whole bars of d parts, filled in order: 11/6 → [6 of 6, 5 of 6]. */
function fracBars(q: Q, n: number, d: number) {
  const b = bars(q)
  same(q, b.length, Math.max(1, Math.ceil(n / d)), 'bar count')
  b.forEach((x: any, i: number) => { same(q, x.parts, d, 'bar parts'); same(q, x.shaded, Math.min(d, Math.max(0, n - i * d)), `bar ${i} shaded`) })
}
function eqPic(q: Q, text: string) { same(q, q.picture?.kind, 'eq', 'picture kind'); same(q, q.picture.text, text, 'eq text') }
function grid(q: Q, rows: number, cols: number, shade?: { h: number; w: number }) {
  const p = q.picture
  same(q, p?.kind, 'grid', 'picture kind'); same(q, p.rows, rows, 'grid rows'); same(q, p.cols, cols, 'grid cols')
  if (shade) {
    same(q, p.shade?.length, 1, 'shade blocks')
    const s = p.shade[0]
    same(q, `${s.r},${s.c},${s.h},${s.w}`, `0,0,${shade.h},${shade.w}`, 'shaded block')
  } else if (p.shade && p.shade.length) fail(q, 'grid has shading the question does not mention')
  return p
}

const FR = '(\\d+)\\/(\\d+)'

export const SOLVE: Record<string, (q: Q) => string> = {
  // fractions as division
  'g5m3-t1': q => {
    let r = m(q, /^(\d+) pizzas are shared equally by (\d+) friends\. How much pizza does each friend get\?$/)
    if (r) { wholeBars(q, +r[1]); return frac(F(+r[1], +r[2])) }
    r = m(q, /^Write (\d+) ÷ (\d+) as a fraction\.$/)
    if (r) { eqPic(q, `${r[1]} ÷ ${r[2]} = ?`); return frac(F(+r[1], +r[2])) }
    r = m(q, new RegExp(`^Which one is the same as ${FR}\\?$`))
    if (r) { eqPic(q, `${r[1]}/${r[2]} = ?`); const want = F(+r[1], +r[2]); return pick(q, c => eq(evalExpr(c), want)) }
    r = m(q, new RegExp(`^Some (pizzas|pies|cakes) are shared equally by (\\d+) friends\\. Each friend gets ${FR} of a (pizza|pie|cake)\\. How many \\1 were shared\\?$`))
    if (r) { oneBar(q, +r[4], +r[3]); return whole(q, mul(F(+r[2]), F(+r[3], +r[4]))) }
    r = m(q, /^(\d+) (?:yards of ribbon are cut into|pounds of clay are shared equally by|cups of juice are poured equally into) (\d+) (?:equal pieces\. How many yards long is each piece|kids\. How many pounds does each kid get|bottles\. How many cups go in each bottle)\?$/)
    if (r) { wholeBars(q, +r[1]); return frac(F(+r[1], +r[2])) }
    return fail(q)
  },

  // fraction of a whole number
  'g5m3-t2': q => {
    let r = m(q, new RegExp(`^What is ${FR} of (\\d+)\\? The tape is cut into (\\d+) equal parts\\.$`))
    if (r) { same(q, r[4], r[2], 'text parts vs denominator'); tape(q, +r[2], r[3]); return whole(q, mul(F(+r[1], +r[2]), F(+r[3]))) }
    r = m(q, new RegExp(`^Find ${FR} × (\\d+)\\.$`))
    if (r) { eqPic(q, `${r[1]}/${r[2]} × ${r[3]} = ?`); return whole(q, mul(F(+r[1], +r[2]), F(+r[3]))) }
    if (q.text === 'Which one is true?') return whichTrue(q, e => { const x = e.match(new RegExp(`^${FR} of (\\d+)$`)) ?? fail(q, `eq "${e}"`); return mul(F(+x[1], +x[2]), F(+x[3])) })
    r = m(q, new RegExp(`^${FR} of a number is (\\d+)\\. What is the number\\?$`))
    if (r) { eqPic(q, `${r[1]}/${r[2]} of ? = ${r[3]}`); return whole(q, dv(F(+r[3]), F(+r[1], +r[2]))) }
    r = m(q, new RegExp(`^(?:A class has|A farm has|You have) (\\d+) (students|chickens|stickers)\\. ${FR} of them (?:walk to school|are brown|go to your sister)\\. (?:The rest ride the bus|The rest are white|You keep the rest)\\. How many (?:students ride the bus|chickens are white|stickers do you keep)\\?$`))
    if (r) { tape(q, +r[4], r[1]); const all = F(+r[1]); return whole(q, sub(all, mul(all, F(+r[3], +r[4])))) }
    return fail(q)
  },

  // fraction × fraction
  'g5m3-t3': q => {
    let r = m(q, new RegExp(`^You have ${FR} of a pan\\. You eat ${FR} of that part\\. How much of the whole pan is that\\?$`))
    if (r) { same(q, r[1], 1, 'first numerator (picture shades one row)'); grid(q, +r[2], +r[4], { h: 1, w: +r[4] }); return frac(mul(F(+r[1], +r[2]), F(+r[3], +r[4]))) }
    r = m(q, new RegExp(`^Find ${FR} × ${FR}\\. The shaded row is ${FR} of the pan\\.$`))
    if (r) {
      same(q, `${r[5]}/${r[6]}`, `${r[3]}/${r[4]}`, 'named row vs second factor'); same(q, r[3], 1, 'row numerator')
      grid(q, +r[4], +r[2], { h: 1, w: +r[2] }); return frac(mul(F(+r[1], +r[2]), F(+r[3], +r[4])))
    }
    r = m(q, new RegExp(`^Find ${FR} × ${FR}\\.$`))
    if (r) { eqPic(q, `${r[1]}/${r[2]} × ${r[3]}/${r[4]} = ?`); return frac(mul(F(+r[1], +r[2]), F(+r[3], +r[4]))) }
    if (q.text === 'Which one is true?') return whichTrue(q, evalExpr)
    r = m(q, new RegExp(`^${FR} of (?:a garden has flowers|a pan of brownies is left|a field is planted with corn)\\. ${FR} of (?:the flower part has red flowers|what is left gets eaten|the corn part is watered today)\\. What part of the whole (?:garden has red flowers|pan gets eaten|field is watered today)\\?$`))
    if (r) { oneBar(q, +r[2], +r[1]); return frac(mul(F(+r[1], +r[2]), F(+r[3], +r[4]))) }
    return fail(q)
  },

  // area with fraction side lengths
  'g5m3-t4': q => {
    let r = m(q, new RegExp(`^A rug is ${FR} meter wide and ${FR} meter long\\. Count the pieces it covers out of all the pieces\\. What is its area, in square meters\\?$`))
    if (r) {
      // wide runs down the rows, long across the columns
      const p = grid(q, +r[2], +r[4], { h: +r[1], w: +r[3] }); same(q, `${p.top}|${p.left}`, '1 m long|1 m wide', 'unit labels (long across the columns, wide down the rows)')
      return frac(F(+r[1] * +r[3], +r[2] * +r[4]))
    }
    r = m(q, new RegExp(`^A (?:mat|napkin|shelf board|poster) is ${FR} meter wide and ${FR} meter long\\. What is its area, in square meters\\?$`))
    if (r) { const p = grid(q, +r[2], +r[4]); same(q, `${p.top}|${p.left}`, '1 m long|1 m wide', 'unit labels (long across the columns, wide down the rows)'); return frac(mul(F(+r[1], +r[2]), F(+r[3], +r[4]))) }
    const sides = () => {
      const p = grid(q, 1, 1)
      const a = String(p.top).match(/^(\d+\/\d+) m$/) ?? fail(q, `top label "${p.top}"`)
      const b = String(p.left).match(/^(\d+\/\d+) m$/) ?? fail(q, `left label "${p.left}"`)
      return [parse(a[1]), parse(b[1])]
    }
    if (q.text === 'What is the area of this rectangle, in square meters?') { const [a, b] = sides(); return frac(mul(a, b)) }
    if (q.text === 'Which one gives the area of this rectangle, in square meters?') { const [a, b] = sides(); const want = mul(a, b); return pick(q, c => eq(evalExpr(c), want)) }
    r = m(q, new RegExp(`^A rug covers ${FR} square meter\\. It is ${FR} meter wide\\. How long is it, in meters\\?$`))
    if (r) { eqPic(q, `${r[3]}/${r[4]} × ? = ${r[1]}/${r[2]}`); return frac(dv(F(+r[1], +r[2]), F(+r[3], +r[4]))) }
    return fail(q)
  },

  // size of a product
  'g5m3-t5': q => {
    let r = m(q, new RegExp(`^Is ${FR} more than 1, less than 1, or equal to 1\\? Each bar is 1 whole\\.$`))
    if (r) {
      const f = F(+r[1], +r[2]); fracBars(q, +r[1], +r[2])
      const w = cmp(f, F(1)); return pick(q, c => c === (w > 0 ? 'more than 1' : w < 0 ? 'less than 1' : 'equal to 1'))
    }
    r = m(q, new RegExp(`^Without working it out: is ${FR} × (\\d+) bigger than (\\d+), smaller than (\\d+), or equal to (\\d+)\\?$`))
    if (r) {
      same(q, [r[4], r[5], r[6]].join(), [r[3], r[3], r[3]].join(), 'base number'); fracBars(q, +r[1], +r[2])
      const w = cmp(F(+r[1], +r[2]), F(1)), want = `${w > 0 ? 'bigger than' : w < 0 ? 'smaller than' : 'equal to'} ${r[3]}`; return pick(q, c => c === want)
    }
    r = m(q, new RegExp(`^Work it out: what is ${FR} × (\\d+)\\?$`))
    if (r) { tape(q, +r[2], r[3]); return whole(q, mul(F(+r[1], +r[2]), F(+r[3]))) }
    r = m(q, /^A (?:puppy weighs|recipe uses) (\d+) (pounds|cups)(?: of flour)?\. (?:A kitten weighs|You make) ((?:\d+ )?\d+\/\d+)(?: times)? (?:as much as the puppy|of the recipe|the recipe)\. (?:Does the kitten weigh|Will you use) more than (\d+) \2, less than (\d+) \2, or exactly (\d+) \2\?$/)
    if (r) {
      same(q, [r[4], r[5], r[6]].join(), [r[1], r[1], r[1]].join(), 'base amount'); tape(q, 1, `${r[1]} ${r[2]}`)
      const k = parse(r[3]), w = cmp(k, F(1))
      // "times as much" with a proper fraction, or "of the recipe" with a mixed number, would read oddly
      if (/times/.test(q.text) !== (r[3].includes(' ') || w > 0)) fail(q, `"times" wording does not match multiplier ${r[3]}`)
      const want = `${w > 0 ? 'more than' : w < 0 ? 'less than' : 'exactly'} ${r[1]} ${r[2]}`; return pick(q, c => c === want)
    }
    r = m(q, /^\? × (\d+) is (equal to|smaller than|bigger than) (\d+)\. Which number goes in the box\?$/)
    if (r) {
      same(q, r[3], r[1], 'base number'); eqPic(q, `? × ${r[1]}`)
      const want = { 'equal to': 0, 'smaller than': -1, 'bigger than': 1 }[r[2]]!
      return pick(q, c => cmp(parse(c), F(1)) === want)
    }
    return fail(q)
  },

  // whole number ÷ unit fraction
  'g5m3-t6': q => {
    let r = m(q, /^You have (\d+) (?:cups of rice\. Each bowl gets|yards of ribbon\. Each bow uses) 1\/(\d+) (?:cup\. How many bowls can you fill\? Each cup|yard\. How many bows can you make\? Each yard) is cut into pieces that size\.$/)
    if (r) { wholeBars(q, +r[1], +r[2]); return whole(q, dv(F(+r[1]), F(1, +r[2]))) }
    r = m(q, new RegExp(`^Find (\\d+) ÷ ${FR}\\.$`))
    if (r) { eqPic(q, `${r[1]} ÷ ${r[2]}/${r[3]} = ?`); return whole(q, dv(F(+r[1]), F(+r[2], +r[3]))) }
    if (q.text === 'Which one is true?') return whichTrue(q, evalExpr)
    r = m(q, new RegExp(`^What number goes in the box\\? \\? ÷ ${FR} = (\\d+)$`))
    if (r) { eqPic(q, `? ÷ ${r[1]}/${r[2]} = ${r[3]}`); return whole(q, mul(F(+r[3]), F(+r[1], +r[2]))) }
    r = m(q, /^What number goes in the box\? (\d+) ÷ 1\/\? = (\d+)$/)
    if (r) { eqPic(q, `${r[1]} ÷ 1/? = ${r[2]}`); return whole(q, F(+r[2], +r[1])) }
    r = m(q, /^A shop cuts (\d+) (pizzas|sandwiches) into pieces\. Each (slice|piece) is 1\/(\d+) of one\. (?:A party|The team) eats (\d+) (slices|pieces)\. How many (slices|pieces) are left\?$/)
    if (r) {
      same(q, `${r[6]}|${r[7]}`, `${r[3]}s|${r[3]}s`, 'piece word'); wholeBars(q, +r[1])
      const left = +r[1] * +r[4] - +r[5]
      if (left < 0) fail(q, 'eats more pieces than there are')
      return String(left)
    }
    return fail(q)
  },

  // unit fraction ÷ whole number
  'g5m3-t7': q => {
    let r = m(q, /^1\/(\d+) of a pie is left\. (\d+) friends share it equally\. The shaded piece is cut into (\d+)\. How much of the whole pie does each friend get\?$/)
    if (r) { same(q, r[3], r[2], 'cut vs friends'); same(q, oneBar(q, +r[1], 1).split, r[2], 'bar split'); return frac(dv(F(1, +r[1]), F(+r[2]))) }
    r = m(q, new RegExp(`^Find ${FR} ÷ (\\d+)\\.$`))
    if (r) { eqPic(q, `${r[1]}/${r[2]} ÷ ${r[3]} = ?`); return frac(dv(F(+r[1], +r[2]), F(+r[3]))) }
    if (q.text === 'Which one is true?') return whichTrue(q, evalExpr)
    r = m(q, new RegExp(`^What number goes in the box\\? ${FR} ÷ \\? = ${FR}$`))
    if (r) { eqPic(q, `${r[1]}/${r[2]} ÷ ? = ${r[3]}/${r[4]}`); return whole(q, dv(F(+r[1], +r[2]), F(+r[3], +r[4]))) }
    r = m(q, new RegExp(`^What number goes in the box\\? (\\d+)\\/\\? ÷ (\\d+) = ${FR}$`))
    if (r) {
      eqPic(q, `${r[1]}/? ÷ ${r[2]} = ${r[3]}/${r[4]}`)
      const top = mul(F(+r[3], +r[4]), F(+r[2]))   // = r1 / ?
      const d = dv(F(+r[1]), top); return whole(q, d)
    }
    r = m(q, /^1\/(\d+) of a (pizza|cake|pan of cornbread) is left\. (\d+) (friends|cousins|kids) share it equally\. (\d+) of the \4 put their shares together\. How much of the whole \2 is that\?$/)
    if (r) {
      oneBar(q, +r[1], 1)
      if (+r[5] > +r[3]) fail(q, 'more sharers than people')
      return frac(mul(dv(F(1, +r[1]), F(+r[3])), F(+r[5])))
    }
    return fail(q)
  },

  // mixed word problems
  'g5m3-t8': q => {
    let r = m(q, new RegExp(`^A (?:rope|trail) is (\\d+) (feet|miles) long\\. You (?:use|walk) ${FR} of it (?:to tie up a tent|before lunch)\\. How many (?:feet of rope do you use|miles do you walk before lunch)\\?$`))
    if (r) { tape(q, +r[4], `${r[1]} ${r[2]}`); return whole(q, mul(F(+r[1]), F(+r[3], +r[4]))) }
    r = m(q, /^A board is (\d+) feet long\. You cut it into pieces that are each 1\/(\d+) foot long\. How many pieces do you get\?$/)
      ?? m(q, /^A path is (\d+) miles long\. Each lap is 1\/(\d+) mile\. How many 1\/\2-mile laps is the path\?$/)
    if (r) { tape(q, +r[1], r[1]); return whole(q, dv(F(+r[1]), F(1, +r[2]))) }
    r = m(q, new RegExp(`^A ribbon is (\\d+) yards long\\. Each bow uses ${FR} yard\\. Which one tells how many bows you can make\\?$`))
    if (r) { tape(q, +r[1], 'ribbon'); const want = dv(F(+r[1]), F(+r[2], +r[3])); return pick(q, c => eq(evalExpr(c), want)) }
    r = m(q, new RegExp(`^A jar holds (\\d+) marbles\\. ${FR} of them are blue\\. Which one tells how many marbles are blue\\?$`))
    if (r) { tape(q, +r[3], 'marbles'); const want = mul(F(+r[1]), F(+r[2], +r[3])); return pick(q, c => eq(evalExpr(c), want)) }
    r = m(q, /^(?:1\/(\d+) pound of cheese is shared equally by|A farmer has 1\/(\d+) acre of land\. She splits it into) (\d+) (?:kids\. How many pounds does each kid get|equal gardens\. What part of an acre is each garden)\?$/)
    if (r) { const d = +(r[1] ?? r[2]); tape(q, d, r[1] ? '1 pound' : '1 acre', true); return frac(dv(F(1, d), F(+r[3]))) }
    r = m(q, new RegExp(`^A bag has (\\d+) cups of flour\\. You use ${FR} of it\\. You scoop the rest into ${FR}-cup scoops\\. How many scoops do you get\\?$`))
    if (r) {
      tape(q, +r[3], `${r[1]} cups`)
      const all = F(+r[1]), rest = sub(all, mul(all, F(+r[2], +r[3])))
      return whole(q, dv(rest, F(+r[4], +r[5])))
    }
    return fail(q)
  },
}
