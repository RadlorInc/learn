// Blind answer key for g6m2's practice ladders — written from the printed questions
// (`npx tsx scripts/ladder-questions.mts g6m2 N`), never from the generator.
// Exact rational arithmetic (integer numerator/denominator), so no float error.
type Q = { text: string; picture: any; choices?: string[] }

const fail = (q: Q): never => { throw new Error(`g6m2 key: no rule for "${q.text}"`) }

type F = { p: number; q: number }
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a))
const lcm = (a: number, b: number) => (a / gcd(a, b)) * b
const mk = (p: number, q: number): F => {
  if (!q) throw new Error('g6m2 key: divide by zero')
  const g = gcd(p, q) * Math.sign(q)
  return { p: p / g, q: q / g }
}
/** "3" / "2/5" / "1 3/4" → exact fraction. */
const num = (s: string): F => {
  const m = s.trim().match(/^(?:(\d+) )?(\d+)(?:\/(\d+))?$/)
  if (!m) throw new Error(`g6m2 key: not a number "${s}"`)
  if (!m[3]) return m[1] ? fail({ text: s, picture: null }) : mk(Number(m[2]), 1)
  const w = Number(m[1] ?? 0), n = Number(m[2]), d = Number(m[3])
  return mk(w * d + n, d)
}
const sub = (a: F, b: F) => mk(a.p * b.q - b.p * a.q, a.q * b.q)
const mul = (a: F, b: F) => mk(a.p * b.p, a.q * b.q)
const dvd = (a: F, b: F) => mk(a.p * b.q, a.q * b.p)
const eq = (a: F, b: F) => a.p === b.p && a.q === b.q
const frac = (a: F) => (a.q === 1 ? String(a.p) : `${a.p}/${a.q}`)
const whole = (a: F, q: Q): string => {
  if (a.q !== 1) throw new Error(`g6m2 key: answer ${a.p}/${a.q} not whole in "${q.text}"`)
  return String(a.p)
}

/** A number token: mixed, fraction or whole. `#` in a pattern becomes one capture. */
const N = String.raw`\d+ \d+\/\d+|\d+\/\d+|\d+`
const re = (src: string) => new RegExp(src.replace(/#/g, `(${N})`))
const W = String.raw`[a-z ]+?`

/** "a × b" / "a ÷ b" (each a number token) → value, or null. */
function expr(s: string): F | null {
  const m = s.trim().match(re(String.raw`^# ([×÷]) #$`))
  if (!m) return null
  return m[2] === '×' ? mul(num(m[1]), num(m[3])) : dvd(num(m[1]), num(m[3]))
}

/** Exactly one choice must fit, or the question is defective. */
function pick(q: Q, fits: (c: string) => boolean): string {
  const ok = (q.choices ?? []).filter(fits)
  if (ok.length !== 1) throw new Error(`g6m2 key: ${ok.length} choices fit "${q.text}" ${JSON.stringify(q.choices)}`)
  return ok[0]
}

/** "Find a ÷ b." (also "Find a × b.", and t2's "Find a ÷ b. Keep a, …" / t3's "… The area model …" / t4's "Every whole …"). */
function find(q: Q): F | null {
  const m = q.text.match(re(String.raw`^Find # ([×÷]) #\.`))
  return m ? (m[2] === '×' ? mul(num(m[1]), num(m[3])) : dvd(num(m[1]), num(m[3]))) : null
}

/** "Which one is the same as a ÷ b?" — the choice whose value equals it. */
function sameAs(q: Q): string | null {
  const m = q.text.match(re(String.raw`^Which one is the same as # ÷ #\?$`))
  if (!m) return null
  const v = dvd(num(m[1]), num(m[2]))
  return pick(q, c => { const e = expr(c); return !!e && eq(e, v) })
}

/** "Name says a o b = c. That is not right. What is the right answer?" */
function wrongClaim(q: Q): F | null {
  const m = q.text.match(re(String.raw`^[A-Z][a-z]+ says # ([×÷]) # = #\. That is not right\. What is the right answer\?$`))
  if (!m) return null
  const v = m[2] === '×' ? mul(num(m[1]), num(m[3])) : dvd(num(m[1]), num(m[3]))
  if (eq(v, num(m[4]))) throw new Error(`g6m2 key: the "wrong" claim is right in "${q.text}"`)
  return v
}

/** Item count named in "How many <item> …": which of the two nouns it is. */
function whichOf(asked: string, a: string, b: string, q: Q): 0 | 1 {
  const norm = (s: string) => s.toLowerCase().replace(/s$/, '')
  const x = norm(asked)
  const ia = norm(a) === x, ib = norm(b) === x
  if (ia === ib) throw new Error(`g6m2 key: cannot tell which item "${asked}" is in "${q.text}"`)
  return ia ? 0 : 1
}

export const SOLVE: Record<string, (q: Q) => string> = {
  // Dividing a fraction by a unit fraction.
  'g6m2-t1': q => {
    const f = find(q)
    if (f) return whole(f, q)
    let m = q.text.match(re(String.raw`^Each ${W} in the bar is cut into # equal pieces\. How many # pieces fit in #\? Find # ÷ #\.$`))
    if (m) {
      const v = dvd(num(m[4]), num(m[5]))
      if (!eq(num(m[2]), num(m[5])) || !eq(num(m[3]), num(m[4]))) throw new Error(`g6m2 key: two questions disagree in "${q.text}"`)
      return whole(v, q)
    }
    if (q.text === 'Which one is true?') {
      return pick(q, c => {
        const [l, r] = c.split(' = ')
        const e = expr(l ?? '')
        return !!e && r !== undefined && eq(e, num(r))
      })
    }
    m = q.text.match(re(String.raw`^What number goes in the box\? # ÷ 1\/\? = #$`))
    if (m) {
      // a ÷ 1/x = c  →  a·x = c  →  x = c / a
      return whole(dvd(num(m[2]), num(m[1])), q)
    }
    m = q.text.match(re(String.raw`^You have # ${W}\. Each ${W} (?:is|holds|uses) # ${W}\. You ${W} # ${W}\. How many ${W} (?:are left for you|can you pour|can you make)\?$`))
    if (m) return whole(sub(dvd(num(m[1]), num(m[2])), num(m[3])), q)
    return fail(q)
  },

  // Dividing by a fraction: keep, change, flip.
  'g6m2-t2': q => {
    const f = find(q)
    if (f) return q.text.startsWith('Find') && /Keep/.test(q.text) ? whole(f, q) : frac(f)
    const s = sameAs(q)
    if (s) return s
    let m = q.text.match(re(String.raw`^What number goes in the box\? \? ÷ # = #$`))
    if (m) return frac(mul(num(m[1]), num(m[2])))
    m = q.text.match(re(String.raw`^A ${W} (?:holds|has) # ${W}\. Each ${W} (?:is|holds|uses) # ${W}\. How many ${W}\?$`))
    if (m) return whole(dvd(num(m[1]), num(m[2])), q)
    return fail(q)
  },

  // Multiplying mixed numbers.
  'g6m2-t3': q => {
    const f = find(q)
    if (f) return frac(f)
    const w = wrongClaim(q)
    if (w) return frac(w)
    let m = q.text.match(re(String.raw`^A recipe uses # cups of flour\. You make # batches\.(?: You have # cups? of flour\. How many more cups do you need\?| How many cups of flour do you need\?)$`))
    if (m) return frac(m[3] ? sub(mul(num(m[1]), num(m[2])), num(m[3])) : mul(num(m[1]), num(m[2])))
    m = q.text.match(re(String.raw`^A ${W} is # yards long and # yards (?:wide|tall)\.(?: You have paint for # square yards?\. How many more square yards do you need paint for\?| How many square yards does it cover\?)$`))
    if (m) return frac(m[3] ? sub(mul(num(m[1]), num(m[2])), num(m[3])) : mul(num(m[1]), num(m[2])))
    m = q.text.match(re(String.raw`^You walk # miles each hour\. How many miles do you walk in # hours\?$`))
    if (m) return frac(mul(num(m[1]), num(m[2])))
    return fail(q)
  },

  // Dividing mixed numbers.
  'g6m2-t4': q => {
    const f = find(q)
    if (f) return whole(f, q)
    const w = wrongClaim(q)
    if (w) return frac(w)
    const s = sameAs(q)
    if (s) return s
    let m = q.text.match(re(String.raw`^A trail is # miles long\. It is split into equal sections of # miles\. How many sections are there\?$`))
    ?? q.text.match(re(String.raw`^A rope is # feet long\. You cut it into pieces that are each # feet long\. How many pieces do you get\?$`))
    ?? q.text.match(re(String.raw`^You have # cups of flour\. Each batch of muffins uses # cups\. How many batches can you make\?$`))
    if (m) return whole(dvd(num(m[1]), num(m[2])), q)
    return fail(q)
  },

  // Fraction division stories.
  'g6m2-t5': q => {
    let m = q.text.match(re(String.raw`^You have # ${W}\. Each ${W} (?:is|uses) # ${W}\.(?: The tape shows the # ${W} cut into ${W}\.)? How many ${W} can you ${W}\?$`))
    if (m) return whole(dvd(num(m[1]), num(m[2])), q)
    m = q.text.match(re(String.raw`^You have # ${W}\. Each ${W} (?:is|uses) # ${W}\. How many ${W} is that\? Part of one counts too\.$`))
    if (m) return frac(dvd(num(m[1]), num(m[2])))
    m = q.text.match(re(String.raw`^You have # ${W}\. Each ${W} (?:is|uses) # ${W}\. Which one tells how many ${W}\?$`))
    if (m) {
      const total = num(m[1]), each = num(m[2]), v = dvd(total, each)
      // The expression must be total ÷ each — not merely any expression with the same value.
      return pick(q, c => {
        const e = c.match(re(String.raw`^# ÷ #$`))
        return !!e && eq(num(e[1]), total) && eq(num(e[2]), each) && eq(expr(c) as F, v)
      })
    }
    m = q.text.match(re(String.raw`^You have # ${W}\. Each ${W} (?:holds|is) # ${W}(?: long)?\. Each ${W} (?:is|uses) # ${W}\. How many ${W} can you ${W}\?$`))
    if (m) return whole(dvd(mul(num(m[1]), num(m[2])), num(m[3])), q)
    return fail(q)
  },

  // Greatest common factor.
  'g6m2-t6': q => {
    let m = q.text.match(re(String.raw`^The table lists every factor of # and of #\. What is the biggest number on both lists\?$`))
    ?? q.text.match(re(String.raw`^What is the biggest number that is a factor of both # and #\?$`))
    if (m) return String(gcd(Number(m[1]), Number(m[2])))
    m = q.text.match(re(String.raw`^[A-Z][a-z]+ says the biggest factor # and # share is #, because # goes into both\. What is the biggest factor they share\?$`))
    if (m) {
      const g = gcd(Number(m[1]), Number(m[2]))
      if (g === Number(m[3])) throw new Error(`g6m2 key: the claim is right in "${q.text}"`)
      return String(g)
    }
    m = q.text.match(re(String.raw`^Which pair of numbers has # as the biggest factor they share\?$`))
    if (m) {
      const k = Number(m[1])
      return pick(q, c => {
        const p = c.match(/^(\d+) and (\d+)$/)
        return !!p && gcd(Number(p[1]), Number(p[2])) === k
      })
    }
    m = q.text.match(/^You have (\d+) ([a-z]+) and (\d+) ([a-z]+)\. You make identical [a-z ]+ that use them all, with nothing left over\. You make as many [a-z ]+ as you can\. How many ([a-z]+) go in each [a-z]+\?$/)
    if (m) {
      const a = Number(m[1]), b = Number(m[3]), g = gcd(a, b)
      return String(whichOf(m[5], m[2], m[4], q) === 0 ? a / g : b / g)
    }
    return fail(q)
  },

  // Least common multiple.
  'g6m2-t7': q => {
    let m = q.text.match(/^The jumps count by (\d+)s\. What is the smallest number that is a multiple of both (\d+) and (\d+)\?$/)
    if (m) return String(lcm(Number(m[2]), Number(m[3])))
    m = q.text.match(/^What is the smallest number that is a multiple of both (\d+) and (\d+)\?$/)
    if (m) return String(lcm(Number(m[1]), Number(m[2])))
    m = q.text.match(/^[A-Z][a-z]+ says the smallest multiple of both (\d+) and (\d+) is (\d+), because (\d+) × (\d+) = (\d+)\. What is the smallest one\?$/)
    if (m) {
      const l = lcm(Number(m[1]), Number(m[2]))
      if (l === Number(m[3])) throw new Error(`g6m2 key: the claim is right in "${q.text}"`)
      return String(l)
    }
    m = q.text.match(/^Which number is a multiple of both (\d+) and (\d+)\?$/)
    if (m) {
      const a = Number(m[1]), b = Number(m[2])
      return pick(q, c => /^\d+$/.test(c) && Number(c) > 0 && Number(c) % a === 0 && Number(c) % b === 0)
    }
    m = q.text.match(/^([A-Za-z ]+) come in packs of (\d+)\. ([A-Za-z ]+) come in packs of (\d+)\. You want the same number of [a-z ]+ and [a-z ]+, and as few as you can\. How many packs of ([a-z ]+) do you buy\?$/)
    if (m) {
      const a = Number(m[2]), b = Number(m[4]), l = lcm(a, b)
      return String(whichOf(m[5], m[1], m[3], q) === 0 ? l / a : l / b)
    }
    return fail(q)
  },
}
