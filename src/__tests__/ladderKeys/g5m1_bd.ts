// Independent answer key for g5m1 topics 7–11 and 17–20, written from the QUESTIONS only
// (scripts/ladder-questions.mts output), never from the generator. Every solver parses the
// text, works the maths out itself, and throws on a phrasing it does not recognise.

type Q = { text: string; picture: any; choices?: string[] }

const nums = (s: string): number[] =>
  (s.match(/\d{1,3}(?:,\d{3})+|\d+/g) ?? []).map(x => Number(x.replace(/,/g, '')))
const fail = (q: Q): never => { throw new Error(`no pattern for: ${q.text}`) }
const has = (q: Q, re: RegExp) => re.test(q.text)
const num = (n: number) => String(n)

/** Pick the one choice satisfying `ok`; anything but exactly one is an error, never a guess. */
function pick(q: Q, ok: (c: string) => boolean): string {
  const hits = (q.choices ?? []).filter(ok)
  if (hits.length !== 1) throw new Error(`${hits.length} choices fit: ${q.text} ${JSON.stringify(q.choices)}`)
  return hits[0]
}

// ── a tiny expression parser: numbers, + − × ÷, parentheses ────────────────────────────────
type Node = number | { op: string; a: Node; b: Node }
function parse(src: string): Node {
  const toks = src.replace(/\s+/g, '').match(/\d{1,3}(?:,\d{3})+|\d+|[+−×÷()]/g) ?? []
  let i = 0
  const atom = (): Node => {
    const t = toks[i++]
    if (t === '(') { const n = sum(); if (toks[i++] !== ')') throw new Error(`bad parens: ${src}`); return n }
    if (t === undefined || !/^\d/.test(t)) throw new Error(`bad expression: ${src}`)
    return Number(t.replace(/,/g, ''))
  }
  const prod = (): Node => { let n = atom(); while (toks[i] === '×' || toks[i] === '÷') { const op = toks[i++]; n = { op, a: n, b: atom() } } return n }
  const sum = (): Node => { let n = prod(); while (toks[i] === '+' || toks[i] === '−') { const op = toks[i++]; n = { op, a: n, b: prod() } } return n }
  const n = sum()
  if (i !== toks.length) throw new Error(`trailing tokens: ${src}`)
  return n
}
const val = (n: Node): number => typeof n === 'number' ? n
  : n.op === '+' ? val(n.a) + val(n.b) : n.op === '−' ? val(n.a) - val(n.b)
  : n.op === '×' ? val(n.a) * val(n.b) : val(n.a) / val(n.b)
/** Structure, with + and × commutative/associative (so 3 × (6 + 4) ≡ (4 + 6) × 3). */
const shape = (n: Node): string => {
  if (typeof n === 'number') return String(n)
  if (n.op === '+' || n.op === '×') {
    const flat: string[] = []
    const walk = (m: Node): void => void (typeof m !== 'number' && m.op === n.op ? (walk(m.a), walk(m.b)) : flat.push(shape(m)))
    walk(n)
    return `${n.op}[${flat.sort().join(',')}]`
  }
  return `${n.op}(${shape(n.a)},${shape(n.b)})`
}
const sameShape = (a: string, b: string) => shape(parse(a)) === shape(parse(b))

const roundBiggest = (n: number) => { const p = 10 ** (String(n).length - 1); return Math.round(n / p) * p }

/** "What number goes in the box? a × b = x + ? + y" — the box is the product minus the rest. */
function boxQ(q: Q): string {
  const m = q.text.match(/box\? (.+?) = (.+)$/)
  if (!m) fail(q)
  const [a, b] = nums(m![1])
  const known = nums(m![2]).reduce((s, x) => s + x, 0)
  return num(a * b - known)
}

/** The first "a × b" in the text. */
const firstProduct = (q: Q) => {
  const m = q.text.match(/(\d[\d,]*) × (\d[\d,]*)/)
  if (!m) fail(q)
  return nums(m![1])[0] * nums(m![2])[0]
}

export const SOLVE_BD: Record<string, (q: Q) => string> = {
  'g5m1-t7': q => {
    if (has(q, /^Find \d[\d,]* × \d[\d,]*\.$/) || has(q, /^\d[\d,]* × \d[\d,]* = \?$/)) return num(firstProduct(q))
    if (has(q, /^Which one shows .+ the right way\?$/)) {
      const [a, b] = nums(q.text)
      // "the right way" = the place-value parts of b, each multiplied by a
      const parts = String(b).split('').map((d, i, s) => Number(d) * 10 ** (s.length - 1 - i)).filter(x => x > 0).map(x => a * x)
      return pick(q, c => { const t = nums(c); return t.length === parts.length && t.every((x, i) => x === parts[i]) })
    }
    if (has(q, /^What number goes in the box\?/)) return boxQ(q)
    const m = q.text.match(/^A farmer plants (\d+) rows of \w+ with ([\d,]+) plants in each row, and (\d+) rows of \w+ with ([\d,]+) plants in each row\. How many plants is that in all\?$/)
    if (m) { const [a, b, c, d] = nums(m.slice(1).join(' ')); return num(a * b + c * d) }
    return fail(q)
  },

  'g5m1-t8': q => {
    if (has(q, /^Find \d[\d,]* × \d[\d,]*\.$/) || has(q, /^\d[\d,]* × \d[\d,]* = \?$/)) return num(firstProduct(q))
    if (has(q, /^Which one is the same as \d[\d,]* × \d[\d,]*\?$/)) {
      const target = firstProduct(q)
      return pick(q, c => val(parse(c)) === target)
    }
    if (has(q, /^What number goes in the box\?/)) return boxQ(q)
    const m = q.text.match(/^A shop gets ([\d,]+) (\w+) of (\w+)\. Each \w+ holds ([\d,]+) \3\. The shop sells ([\d,]+) \3\. How many \3 are left\?$/)
    if (m) { const [n, each, sold] = [m[1], m[4], m[5]].map(s => nums(s)[0]); return num(n * each - sold) }
    return fail(q)
  },

  'g5m1-t9': q => rowsTopic(q, 'tens', 10, 'two'),
  'g5m1-t10': q => rowsTopic(q, 'hundreds', 100, 'three'),

  'g5m1-t11': q => {
    let m = q.text.match(/^Estimate ([\d,]+) × ([\d,]+)\. Round each number to its biggest place, then multiply\.$/)
    if (m) return num(roundBiggest(nums(m[1])[0]) * roundBiggest(nums(m[2])[0]))
    if (has(q, /^Estimate [\d,]+ × [\d,]+ first\. Then multiply the standard way to find the exact answer\.$/)) return num(firstProduct(q))
    m = q.text.match(/^Estimate ([\d,]+) × ([\d,]+) with round numbers\. Which answer is close to your estimate\?$/)
    if (m) {
      const est = roundBiggest(nums(m[1])[0]) * roundBiggest(nums(m[2])[0])
      const dist = (c: string) => Math.abs(Math.log(nums(c)[0] / est))
      const best = Math.min(...q.choices!.map(dist))
      // the nearest must be clearly nearest (the others are a place value off)
      return pick(q, c => dist(c) === best && dist(c) < Math.log(3))
    }
    if (has(q, /^\w+ says [\d,]+ × [\d,]+ = [\d,]+\. Estimate to check, then find the right answer\.$/)) return num(firstProduct(q))
    m = q.text.match(/^A warehouse sends out ([\d,]+) packages every day\. Estimate first, then find exactly how many packages it sends out in ([\d,]+) days\.$/)
    if (m) return num(nums(m[1])[0] * nums(m[2])[0])
    return fail(q)
  },

  'g5m1-t17': q => {
    let m = q.text.match(/^An? [\w ]+ packs (\d+) \w+\. Each one has (\d+) \w+ and (\d+) \w+, so the total is (\d+) × \((\d+) \+ (\d+)\)\. How many [\w ]+ is that\?$/)
    if (m) {
      const [a, b, c, a2, b2, c2] = m.slice(1).map(Number)
      if (a !== a2 || b !== b2 || c !== c2) throw new Error(`story and sentence disagree: ${q.text}`)
      return num(a * (b + c))
    }
    m = q.text.match(/^Find (\d+ × \(\d+ \+ \d+\))\.$/)
    if (m) return num(val(parse(m[1])))
    m = q.text.match(/^Which number sentence means "add (\d+) and (\d+), then multiply by (\d+)"\?$/)
    // ⚠️ When the multiplier equals the second addend ("add 3 and 4, then multiply by 4"), the
    // distractor (4 + 3) × 4 is the SAME sentence as 4 × (3 + 4) — two right choices. pick() throws.
    if (m) { const want = `(${m[1]} + ${m[2]}) × ${m[3]}`; return pick(q, c => sameShape(c, want)) }
    m = q.text.match(/^An? [\w ]+ packs (\d+) \w+\. Each one has (\d+) \w+ and (\d+) \w+\. Which number sentence shows all the [\w ]+\?$/)
    // same trap when the count equals the second item count (3 bags of 8 apples and 3 pears)
    if (m) { const want = `${m[1]} × (${m[2]} + ${m[3]})`; return pick(q, c => sameShape(c, want)) }
    m = q.text.match(/^Compare (.+) and (.+) without working them out\. Which sign goes between them\?$/)
    if (m) {
      const l = val(parse(m[1])), r = val(parse(m[2]))
      return pick(q, c => c === (l < r ? '<' : l > r ? '>' : '='))
    }
    m = q.text.match(/^(\w+) packs (\d+) (\w+), each with (\d+) \w+ and (\d+) \w+\. (\w+) packs (\d+) \3 of (\d+) \w+, then puts (\d+) \w+ in one more \w+\. Without working them out, who packs more\?$/)
    if (m) {
      const [p1, a, , b, c, p2, a2, b2, c2] = m.slice(1)
      const one = +a * (+b + +c), two = +a2 * +b2 + +c2
      return pick(q, x => x === (one > two ? p1 : two > one ? p2 : 'They pack the same'))
    }
    return fail(q)
  },

  'g5m1-t18': q => {
    let m = q.text.match(/^The board shows (\d+) × \((\d+) \+ (\d+)\)\. A class makes this story: (\d+) \w+, each with (\d+) red \w+ and (\d+) green \w+\. How many \w+ are in the story\?$/)
    if (m) { const [a, b, c] = m.slice(4).map(Number); return num(a * (b + c)) }
    m = q.text.match(/^The board shows \d+ × \(\d+ − \d+\)\. A class makes this story: (\d+) \w+ each get (\d+) \w+, and each one gives (\d+) away\. How many \w+ are left in all\?$/)
    if (m) { const [a, b, c] = m.slice(1).map(Number); return num(a * (b - c)) }
    m = q.text.match(/^The board shows (\d+ × \(\d+ \+ \d+\))\. Which story matches it\?$/)
    if (m) {
      const want = shape(parse(m[1]))
      return pick(q, ch => {
        const e = ch.match(/^(\d+) \w+, each with (\d+) red and (\d+) green \w+$/)
        if (e) return shape(parse(`${e[1]} × (${e[2]} + ${e[3]})`)) === want
        const p = ch.match(/^(\d+) \w+ of (\d+) red \w+, plus (\d+) green ones$/)
        if (p) return shape(parse(`${p[1]} × ${p[2]} + ${p[3]}`)) === want
        throw new Error(`unknown story choice: ${ch}`)
      })
    }
    m = q.text.match(/^\w+ has (\d+) (\w+)\. (?:He|She) gives (\d+) away\. Then (?:he|she) shares the rest equally among (\d+) friends\. Which number sentence tells this story\?$/)
    if (m) { const want = `(${m[1]} − ${m[3]}) ÷ ${m[4]}`; return pick(q, c => sameShape(c, want)) }
    m = q.text.match(/^In class, (\d+) children sit in (\d+) equal rows\. Then (\d+) more children join each row\. Which number sentence shows how many children are in each row now\?$/)
    if (m) { const want = `${m[1]} ÷ ${m[2]} + ${m[3]}`; return pick(q, c => sameShape(c, want)) }
    m = q.text.match(/^The board shows \(\d+ \+ \d+\) ÷ \d+\. A class makes this story: an? \w+ has (\d+) \w+ \w+ and (\d+) \w+ \w+\. It packs them all into \w+ of (\d+)\. How many \w+ does it fill\?$/)
    if (m) { const [a, b, c] = m.slice(1).map(Number); return num(Math.floor((a + b) / c)) }
    return fail(q)
  },

  'g5m1-t19': q => {
    let m = q.text.match(/^A school buys (\d+) boxes of markers with (\d+) in each box\. That is \d+ × \d+ = ([\d,]+) markers\. They are shared equally among (\d+) classes\. How many markers does each class get\?$/)
    if (m) {
      const [boxes, each, total, classes] = m.slice(1).map(s => nums(s)[0])
      if (boxes * each !== total) throw new Error(`stated product is wrong: ${q.text}`)
      return num(total / classes)
    }
    m = q.text.match(/^A school buys (\d+) boxes of markers\. Each box has (\d+) markers\. The markers are shared equally among (\d+) classes\.(.*)$/)
    if (m) {
      const share = (+m[1] * +m[2]) / +m[3]
      if (m[4] === ' How many markers does each class get?') return num(share)
      const w = m[4].match(/^ (\w+) says each class gets ([\d,]+) markers\. (\w+) says each class gets ([\d,]+)\. Who is right\?$/)
      if (w) return pick(q, c => c === (nums(w[2])[0] === share ? w[1] : nums(w[4])[0] === share ? w[3] : '<neither>'))
      return fail(q)
    }
    m = q.text.match(/^(\d+) (\w+) of \w+ cost \$([\d,]+)\. Every one costs the same\. How many dollars do (\d+) \2 cost\?$/)
    if (m) { const [n, cost, k] = [m[1], m[3], m[4]].map(s => nums(s)[0]); return num((cost / n) * k) }
    m = q.text.match(/^An art store has (\d+) boxes of markers\. Each box holds (\d+) markers\. The store packs all the markers into bags of (\d+)\. How many bags does it fill\?$/)
    if (m) return num(Math.floor((+m[1] * +m[2]) / +m[3]))
    return fail(q)
  },

  'g5m1-t20': q => {
    let m = q.text.match(/^A movie theater has (\d+) rows of seats\. Each row has (\d+) seats\. For one show, (\d+) tickets are sold\. How many seats are still empty\?$/)
    if (m) return num(+m[1] * +m[2] - +m[3])
    m = q.text.match(/^The theater sells (\d+) tickets for the first show and (\d+) tickets for the second show\. Each ticket costs \$(\d+)\. Which plan finds how many dollars all the tickets cost\?$/)
    if (m) {
      const want = `(${m[1]} + ${m[2]}) × ${m[3]}`
      return pick(q, c => {
        let p = c.match(/^Add (\d+) and (\d+), then multiply by (\d+)$/)
        if (p) return sameShape(`(${p[1]} + ${p[2]}) × ${p[3]}`, want)
        if ((p = c.match(/^Add (\d+) and (\d+), then add (\d+)$/))) return sameShape(`${p[1]} + ${p[2]} + ${p[3]}`, want)
        if ((p = c.match(/^Multiply (\d+) by (\d+), then add (\d+)$/))) return sameShape(`${p[1]} × ${p[2]} + ${p[3]}`, want)
        throw new Error(`unknown plan choice: ${c}`)
      })
    }
    m = q.text.match(/^A theater has (\d+) seats in (\d+) equal rows\. In one row, (\d+) seats are taken\. How many seats in that row are empty\?$/)
    if (m) return num(+m[1] / +m[2] - +m[3])
    m = q.text.match(/^A theater has (\d+) rows of seats with (\d+) seats in each row\. A school brings (\d+) classes of (\d+) students, and each student takes one seat\. How many seats are still empty\?$/)
    if (m) return num(+m[1] * +m[2] - +m[3] * +m[4])
    m = q.text.match(/^A class of (\d+) students and (\d+) adults go to the movies\. Each ticket costs \$(\d+)\. They pay with \$(\d+)\. How many dollars of change do they get\?$/)
    if (m) return num(+m[4] - (+m[1] + +m[2]) * +m[3])
    return fail(q)
  },
}

/** t9 (two-digit multiplier) and t10 (three-digit): the standard algorithm's rows. */
function rowsTopic(q: Q, place: string, placeValue: number, count: string): string {
  let m = q.text.match(new RegExp(`^You multiply ([\\d,]+) × ([\\d,]+) the standard way\\. What number is the ${place} row\\?$`))
  if (m) {
    // top × bottom: the row for a place is top × (that digit of the bottom number) × place value
    const top = nums(m[1])[0], bottom = nums(m[2])[0]
    return num(top * (Math.floor(bottom / placeValue) % 10) * placeValue)
  }
  if (has(q, /^Multiply the standard way\. [\d,]+ × [\d,]+ = \?$/)) return num(firstProduct(q))
  if (has(q, /^(Two of these answers to [\d,]+ × [\d,]+ have a slip in the tens row\. Which answer is right\?|Only one of these answers to [\d,]+ × [\d,]+ is right\. Which one\?)$/)) {
    const p = firstProduct(q)
    return pick(q, c => nums(c)[0] === p)
  }
  m = q.text.match(new RegExp(`^The ${count} rows of ([\\d,]+) × \\? are (.+)\\. What is the missing number\\?$`))
  if (m) {
    // the rows add up to the whole product
    const top = nums(m[1])[0], total = nums(m[2]).reduce((s, x) => s + x, 0)
    if (total % top) throw new Error(`rows do not divide: ${q.text}`)
    return num(total / top)
  }
  m = q.text.match(/^A school hall has (\d+) rows of chairs with (\d+) chairs in each row\. ([\d,]+) chairs are taken\. How many chairs are empty\?$/)
  if (m) return num(+m[1] * +m[2] - nums(m[3])[0])
  m = q.text.match(/^A juice factory fills (\d+) crates with (\d+) bottles each on Monday, and (\d+) crates with (\d+) bottles each on Tuesday\. How many bottles is that in all\?$/)
  if (m) return num(+m[1] * +m[2] + +m[3] * +m[4])
  return fail(q)
}
