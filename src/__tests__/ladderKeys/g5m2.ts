// Blind answer key for g5m2's practice ladders. Written from the QUESTIONS only
// (`npx tsx scripts/ladder-questions.mts g5m2 N`), never from the generator.
// Every picture that restates the text's numbers is checked against them; a disagreement throws.
type Q = { text: string; picture: any; choices?: string[] }

const fail = (q: Q, why = 'no rule for'): never => { throw new Error(`g5m2 key: ${why}: ${q.text}`) }
const m = (q: Q, re: RegExp) => q.text.match(re)

// ── exact fractions ─────────────────────────────────────────────────────────
type F = [number, number]
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a))
const lcm = (a: number, b: number) => (a * b) / gcd(a, b)
const F = (n: number, d = 1): F => { const g = gcd(n, d) || 1; return d < 0 ? [-n / g, -d / g] : [n / g, d / g] }
const add = (a: F, b: F) => F(a[0] * b[1] + b[0] * a[1], a[1] * b[1])
const sub = (a: F, b: F) => add(a, [-b[0], b[1]])
const mulN = (a: F, k: number) => F(a[0] * k, a[1])
const cmp = (a: F, b: F) => Math.sign(a[0] * b[1] - b[0] * a[1])
const eq = (a: F, b: F) => cmp(a, b) === 0
const NUM = /\d+ \d+\/\d+|\d+\/\d+|\d+/g
/** "3", "3/4" or "2 1/3". */
function parse(s: string): F {
  const t = s.trim()
  let r = t.match(/^(\d+) (\d+)\/(\d+)$/)
  if (r) return F(+r[1] * +r[3] + +r[2], +r[3])
  r = t.match(/^(\d+)\/(\d+)$/)
  if (r) return F(+r[1], +r[2])
  if (/^\d+$/.test(t)) return F(+t)
  throw new Error(`g5m2 key: cannot read number "${s}"`)
}
/** Mixed number when above 1. */
const show = (f: F) => {
  if (f[0] < 0) throw new Error(`g5m2 key: negative answer ${f}`)
  if (f[1] === 1) return String(f[0])
  const w = Math.floor(f[0] / f[1])
  return w ? `${w} ${f[0] - w * f[1]}/${f[1]}` : `${f[0]}/${f[1]}`
}
const nums = (s: string) => (s.match(NUM) ?? ([] as string[]))
const fracs = (s: string) => nums(s).map(parse)
/** "a + b − c" left to right. */
function evalExpr(s: string): F {
  const tok = s.trim().split(/ ([+−]) /)
  let v = parse(tok[0])
  for (let i = 1; i < tok.length; i += 2) v = tok[i] === '+' ? add(v, parse(tok[i + 1])) : sub(v, parse(tok[i + 1]))
  return v
}
const one = (q: Q, fits: (c: string) => boolean) => {
  const ok = (q.choices ?? fail(q, 'no choices')).filter(fits)
  return ok.length === 1 ? ok[0] : fail(q, `${ok.length} choices fit`)
}

// ── picture checks ──────────────────────────────────────────────────────────
/** Every number written in the picture must be one of the text's numbers (a sub-multiset). */
function picNumbersInText(q: Q, picStrings: string[]) {
  const pool = nums(q.text.replace(/\?\/\d+/g, '?'))
  for (const s of picStrings.flatMap(nums)) {
    const i = pool.indexOf(s)
    if (i < 0) fail(q, `picture shows ${s}, text does not`)
    pool.splice(i, 1)
  }
}
function checkPicture(q: Q) {
  const p = q.picture
  if (!p) return
  if (p.kind === 'eq') {
    const shown = [p.text, ...(p.lines ?? [])].join(' ')
    picNumbersInText(q, [shown.replace(/\?\/\d+/g, '?')])
    // the text's missing-top blank must be the picture's blank
    const tb = q.text.match(/\?\/(\d+)/), pb = shown.match(/\?\/(\d+)/)
    if (String(tb?.[1]) !== String(pb?.[1])) fail(q, 'picture blank differs from text blank')
  } else if (p.kind === 'bars') {
    for (const b of p.bars) {
      if (b.shaded > b.parts) fail(q, 'bar shades more than it has')
      if (b.label && b.parts > 1 && !eq(parse(b.label), F(b.shaded, b.parts))) fail(q, `bar ${b.label} drawn as ${b.shaded}/${b.parts}`)
    }
  } else if (p.kind === 'tape') {
    const cells = p.rows.flatMap((r: any) => r.cells).filter((c: any) => c.text !== '?')
    picNumbersInText(q, cells.map((c: any) => c.text))
    // widths drawn to scale: every labelled cell has the same width per unit
    const unit = cells.map((c: any) => { const f = parse(c.text); return F(c.w * f[1], f[0]) })
    if (unit.some((u: F) => !eq(u, unit[0]))) fail(q, 'tape not to scale')
  }
}

// ── shared kinds ────────────────────────────────────────────────────────────
/** "Add. a + b = ?" / "Take away. a − b = ?" */
const arithmetic = (q: Q) => {
  const r = m(q, /^(?:Add|Take away)\. (.+) = \?$/) ?? fail(q)
  if (q.text.startsWith('Add') !== r[1].includes('+')) fail(q, 'verb and sign disagree')
  if (q.picture?.kind === 'bars') {
    const total = q.picture.bars.reduce((s: F, b: any) => add(s, F(b.shaded, b.parts)), F(0))
    // add: bars sum to the answer; take away: bars show both numbers
    if (r[1].includes('+') && !eq(total, evalExpr(r[1]))) fail(q, 'bars do not add to the sum')
    if (r[1].includes('−')) {
      const [a, b] = r[1].split(' − ').map(parse)
      if (!eq(total, add(a, b))) fail(q, 'bars do not show both numbers')
    }
  }
  return show(evalExpr(r[1]))
}
/** "Leo says a op b = wrong. … What is the right answer?" */
const rightAnswer = (q: Q) => {
  const r = m(q, /says (.+) = (\S+(?: \d+\/\d+)?)\. That is not right\. What is the right answer\?$/) ?? fail(q)
  const truth = evalExpr(r[1])
  if (eq(parse(r[2]), truth)) fail(q, 'the "wrong" answer is right')
  return one(q, c => eq(parse(c), truth))
}
/** "a + ?/d = c" or "a − ?/d = c" */
const missingTop = (q: Q) => {
  const r = m(q, /^(\S+(?: \d+\/\d+)?) ([+−]) \?\/(\d+) = (\S+)\. What is the missing top number\?$/) ?? fail(q)
  const a = parse(r[1]), c = parse(r[4])
  const x = r[2] === '+' ? sub(c, a) : sub(a, c)
  const top = mulN(x, +r[3])
  if (top[1] !== 1 || top[0] <= 0) fail(q, `no whole top number (${top})`)
  return String(top[0])
}
const sumAll = (q: Q) => show(fracs(q.text).reduce(add, F(0)))

// ── t7-style one-step / two-step stories ────────────────────────────────────
function story(q: Q): F {
  const t = q.text.replace(/ Which number sentence answers it\?$/, '')
  const f = fracs(t)
  if (/in all\?|has (?:he|she) painted\?|in the two weeks\?|tall is it now\?/.test(t)) {
    if (/cuts off|eats|uses|pours out/.test(t)) fail(q, 'sum question with a take-away verb')
    return f.reduce(add, F(0))
  }
  if (/buys \S+(?: \d+\/\d+)? \w+ more, then uses/.test(t) && /left\?$/.test(t)) {
    if (f.length !== 3) fail(q); return sub(add(f[0], f[1]), f[2])
  }
  if (/(?:eats|pours out) .* and .*(?:eats|pours out) .*left\?$/.test(t) || /cuts off .*(?:left|now)\?$/.test(t) || /has hiked .*still have to go\?$/.test(t)) {
    const r = f.slice(1).reduce(sub, f[0])
    if (r[0] <= 0) fail(q, 'nothing left'); return r
  }
  let r = t.match(/(?:needs|wants to walk) (\S+).*(?:has|walked) (\S+)(?: \w+)*(?: so far)?\. How much (?:more|farther)/)
  if (r) { const d = sub(parse(r[1]), parse(r[2])); if (d[0] <= 0) fail(q, 'already has enough'); return d }
  // "N reads for a hour. M reads for b hour. How much longer does N read?"
  r = t.match(/^(\w+) \w+ (?:for )?(\S+) .*?\. (\w+) \w+ (?:for )?(\S+) .*?\. How much (?:longer|farther|more \w+) does (\w+) /)
  if (r) {
    const [, n1, a, n2, b, who] = r
    if (who !== n1 && who !== n2) fail(q, 'asks about someone not in the story')
    const d = who === n1 ? sub(parse(a), parse(b)) : sub(parse(b), parse(a))
    if (d[0] <= 0) fail(q, `${who} has the smaller amount`)
    return d
  }
  return fail(q)
}

// ── t8 line plots ───────────────────────────────────────────────────────────
function linePlot(q: Q) {
  const p = q.picture
  if (p?.kind !== 'chart' || p.type !== 'dot') fail(q, 'no line plot')
  const pts: [F, number][] = p.labels.map((l: string, i: number) => [parse(l), p.values[i]])
  const n = pts.reduce((s, [, v]) => s + v, 0)
  const said = m(q, /shows (?:how \w+ |the weights of )(?:juice )?(\d+) /) ?? fail(q, 'no count')
  if (+said[1] !== n) fail(q, `text says ${said[1]}, plot has ${n} marks`)
  const used = pts.filter(([, v]) => v > 0).map(([f]) => f).sort(cmp)
  const range = () => sub(used[used.length - 1], used[0])
  let r = m(q, /How many plants grew (\S+) inch\?$/)
  if (r) { const hit = pts.filter(([f]) => eq(f, parse(r![1]))); if (hit.length !== 1) fail(q, 'value not on the plot'); return String(hit[0][1]) }
  if (/farthest crawl than the one that went the shortest\?$|longest worm than the shortest worm\?$/.test(q.text)) return show(range())
  r = m(q, /who drank (\S+) cup drink in all\?$/)
  if (r) { const hit = pts.filter(([f]) => eq(f, parse(r![1]))); if (hit.length !== 1 || !hit[0][1]) fail(q, 'value not on the plot'); return show(mulN(hit[0][0], hit[0][1])) }
  r = m(q, /How much do all (\d+) apples weigh together\?$/)
  if (r) { if (+r[1] !== n) fail(q, 'count mismatch'); return show(pts.reduce((s, [f, v]) => add(s, mulN(f, v)), F(0))) }
  return fail(q)
}

const withPic = (f: (q: Q) => string) => (q: Q) => { checkPicture(q); return f(q) }

export const SOLVE: Record<string, (q: Q) => string> = {
  'g5m2-t1': withPic(q => {
    if (/^Add\./.test(q.text)) return arithmetic(q)
    if (/says/.test(q.text)) return rightAnswer(q)
    if (/missing top/.test(q.text)) return missingTop(q)
    if (/in all\?$|has (?:he|she) painted\?$/.test(q.text)) return sumAll(q)
    return fail(q)
  }),
  'g5m2-t2': withPic(q => {
    let r = m(q, /^Count by (\d+)s\. Then count by (\d+)s\. What is the first number that is in both lists\?$/)
    if (r) return String(lcm(+r[1], +r[2]))
    r = m(q, /^Write (\d+)\/(\d+) with (\d+) on the bottom\.$/)
    if (r) { const k = +r[3] / +r[2]; if (!Number.isInteger(k)) fail(q, 'bottom is not a multiple'); return `${+r[1] * k}/${r[3]}` }
    r = m(q, /^What is the smallest piece size that (\d+)\/(\d+) and (\d+)\/(\d+) can both be cut into\? Type the new bottom number\.$/)
    if (r) return String(lcm(+r[2], +r[4]))
    r = m(q, /^Which shows (\d+\/\d+) and (\d+\/\d+) cut into same-size pieces\?$/)
    if (r) {
      const a = parse(r[1]), b = parse(r[2])
      return one(q, c => {
        const [x, y] = c.split(' and ')
        return x.split('/')[1] === y.split('/')[1] && eq(parse(x), a) && eq(parse(y), b)
      })
    }
    r = m(q, /has (\d+)\/(\d+) of a pan .* and (\d+)\/(\d+) of another pan the same size\. \w+ cuts both into the biggest pieces that match\. How many pieces does (?:he|she) have in all\?$/)
    if (r) { const d = lcm(+r[2], +r[4]); return String(+r[1] * d / +r[2] + +r[3] * d / +r[4]) }
    return fail(q)
  }),
  'g5m2-t3': withPic(q => {
    if (/^Take away\./.test(q.text)) return arithmetic(q)
    if (/says/.test(q.text)) return rightAnswer(q)
    if (/missing top/.test(q.text)) return missingTop(q)
    return show(story(q))
  }),
  'g5m2-t4': withPic(q => {
    if (/^Add\./.test(q.text)) return arithmetic(q)
    if (/says/.test(q.text)) return rightAnswer(q)
    return show(story(q))
  }),
  'g5m2-t5': withPic(q => {
    const r = m(q, /^(\d+ \d+\/\d+) is the same as (\d+) \?\/(\d+)\. What is the missing top number\?$/)
    if (r) {
      const top = mulN(sub(parse(r[1]), F(+r[2])), +r[3])
      if (top[1] !== 1 || top[0] < 0) fail(q, 'no whole top'); return String(top[0])
    }
    if (/^Take away\./.test(q.text)) return arithmetic(q)
    if (/says/.test(q.text)) return rightAnswer(q)
    return show(story(q))
  }),
  'g5m2-t6': q => {
    if (q.picture?.kind !== 'bars' || !/^Which sum/.test(q.text)) checkPicture(q)
    let r = m(q, /^Is (.+) more or less than (\S+)\?$/)
    if (r) {
      const c = cmp(evalExpr(r[1]), parse(r[2]))
      if (!c) fail(q, 'exactly equal — neither choice')
      return one(q, ch => ch === `${c > 0 ? 'more' : 'less'} than ${r![2]}`)
    }
    r = m(q, /^Which sum is (more|less) than (\S+)\?$/)
    if (r) return one(q, ch => cmp(evalExpr(ch), parse(r![2])) === (r![1] === 'more' ? 1 : -1))
    r = m(q, /needs (\S+) \w+ .*has (\S+) \w+ in one \w+ and (\S+) \w+ in another\. Does (?:he|she) have enough\?$/)
    if (r) { const has = add(parse(r[2]), parse(r[3])); return one(q, ch => ch === (cmp(has, parse(r![1])) >= 0 ? 'yes' : 'no')) }
    return fail(q)
  },
  'g5m2-t7': withPic(q => {
    const v = story(q)
    if (/Which number sentence answers it\?$/.test(q.text)) return one(q, c => eq(evalExpr(c), v))
    return show(v)
  }),
  'g5m2-t8': linePlot,
}
