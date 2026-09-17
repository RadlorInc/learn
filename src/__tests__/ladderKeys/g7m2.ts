// Independent answer key for the g7m2 practice ladders. Written from the QUESTIONS only
// (scripts/ladder-questions.mts output), never from the generator. Exact rational arithmetic.
type Q = { text: string; picture: any; choices?: string[] }

type F = { n: number; d: number }
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b))
const fr = (n: number, d = 1): F => {
  if (d === 0) throw new Error('division by zero')
  const g = gcd(n, d) || 1
  const s = d < 0 ? -1 : 1
  return { n: (s * n) / g, d: (s * d) / g }
}
const add = (a: F, b: F) => fr(a.n * b.d + b.n * a.d, a.d * b.d)
const sub = (a: F, b: F) => fr(a.n * b.d - b.n * a.d, a.d * b.d)
const mul = (a: F, b: F) => fr(a.n * b.n, a.d * b.d)
const div = (a: F, b: F) => fr(a.n * b.d, a.d * b.n)
const eq = (a: F, b: F) => a.n === b.n && a.d === b.d
const abs = (a: F) => fr(Math.abs(a.n), a.d)
const neg = (a: F) => fr(-a.n, a.d)

const clean = (s: string) => s.replace(/−/g, '-').replace(/\s+/g, ' ').trim()

function num(s: string): F {
  const t = clean(s)
  const m = t.match(/^(-?)(\d+)(?:\.(\d+))?$/)
  if (!m) throw new Error(`not a number: ${s}`)
  const dec = m[3] ?? ''
  const d = 10 ** dec.length
  return fr((m[1] ? -1 : 1) * Number(m[2] + dec), d)
}

/** Evaluates + − × ÷ / ( ) |x| with the usual precedence and unary minus. */
function evalExpr(src: string): F {
  const toks = clean(src).match(/\d+(?:\.\d+)?|[-+×÷/()|]/g)
  if (!toks || toks.join('') !== clean(src).replace(/ /g, '')) throw new Error(`cannot read expression: ${src}`)
  let i = 0
  const peek = () => toks[i]
  const expr = (): F => {
    let v = term()
    while (peek() === '+' || peek() === '-') v = toks[i++] === '+' ? add(v, term()) : sub(v, term())
    return v
  }
  const term = (): F => {
    let v = unary()
    while (peek() === '×' || peek() === '÷' || peek() === '/') v = toks[i++] === '×' ? mul(v, unary()) : div(v, unary())
    return v
  }
  const unary = (): F => (peek() === '-' ? (i++, neg(unary())) : primary())
  const primary = (): F => {
    const t = toks[i++]
    if (t === '(' || t === '|') {
      const v = expr()
      if (toks[i++] !== (t === '(' ? ')' : '|')) throw new Error(`unbalanced: ${src}`)
      return t === '|' ? abs(v) : v
    }
    if (t === undefined || !/^\d/.test(t)) throw new Error(`unexpected ${t} in ${src}`)
    return num(t)
  }
  const v = expr()
  if (i !== toks.length) throw new Error(`trailing tokens in ${src}`)
  return v
}

function out(f: F, asFraction = false): string {
  if (f.d === 1) return String(f.n)
  if (asFraction) return `${f.n}/${f.d}`
  let d = f.d
  while (d % 2 === 0) d /= 2
  while (d % 5 === 0) d /= 5
  if (d !== 1) return `${f.n}/${f.d}`
  return String(f.n / f.d)
}

function pickOne(q: Q, ok: (c: string) => boolean): string {
  const hits = (q.choices ?? []).filter(ok)
  if (hits.length !== 1) throw new Error(`${hits.length} choices fit: ${q.text} ${JSON.stringify(q.choices)}`)
  return hits[0]
}

const N = '(−?\\d+(?:\\.\\d+)?)'
const R = (s: string, flags = '') => new RegExp(s.replace(/N/g, N), flags)

function solve(q: Q): string {
  const t = q.text
  let m: RegExpMatchArray | null

  // ---- choice questions ----
  if (q.choices) {
    if (/^Which one is true\?$/.test(t))
      return pickOne(q, c => {
        let k = c.match(R('^The opposite of N is N\\.$'))
        if (k) return eq(num(k[2]), neg(num(k[1])))
        k = c.match(R('^N and N are different distances from 0\\.$'))
        if (k) return !eq(abs(num(k[1])), abs(num(k[2])))
        throw new Error(`unknown statement: ${c}`)
      })
    if ((m = t.match(R('^Which is farther from 0: N or N\\?$')))) {
      const a = abs(num(m[1])), b = abs(num(m[2]))
      const want = eq(a, b) ? 'They are the same distance' : clean(a.n / a.d > b.n / b.d ? m[1] : m[2])
      return pickOne(q, c => clean(c) === want)
    }
    if ((m = t.match(R('^Which two numbers are both N steps from 0\\?$')))) {
      const s = num(m[1])
      return pickOne(q, c => {
        const k = c.match(R('^N and N$'))
        if (!k) throw new Error(`unknown choice: ${c}`)
        const a = num(k[1]), b = num(k[2])
        return eq(abs(a), s) && eq(abs(b), s) && !eq(a, b)
      })
    }
    if (/Only one of (them|these( divisions)?) is right/.test(t))
      return pickOne(q, c => {
        const [l, r] = c.split('=')
        if (r === undefined) throw new Error(`unknown choice: ${c}`)
        return eq(evalExpr(l), evalExpr(r))
      })
    if ((m = t.match(/^Which one means the same as (.+)\?$/))) {
      const v = evalExpr(m[1])
      return pickOne(q, c => eq(evalExpr(c), v))
    }
    if (/Which math finds/.test(t)) {
      let v: F
      if ((m = t.match(R('^It is N °C\\. It gets N degrees (colder|warmer)\\.'))))
        v = m[3] === 'colder' ? sub(num(m[1]), num(m[2])) : add(num(m[1]), num(m[2]))
      else if ((m = t.match(R('^A hiker is at N meters\\. She (walks down|climbs up) N meters\\.'))))
        v = m[2] === 'walks down' ? sub(num(m[1]), num(m[3])) : add(num(m[1]), num(m[3]))
      else if ((m = t.match(R('^A game score is N points\\. Then the player (wins|loses) N points\\.'))))
        v = m[2] === 'loses' ? sub(num(m[1]), num(m[3])) : add(num(m[1]), num(m[3]))
      else throw new Error(`unknown story: ${t}`)
      return pickOne(q, c => eq(evalExpr(c), v))
    }
    throw new Error(`unknown choice question: ${t}`)
  }

  // ---- opposites ----
  if ((m = t.match(R('^What is ((?:the opposite of )+)N\\?$')))) {
    const k = m[1].split('opposite of').length - 1
    return out(k % 2 ? neg(num(m[2])) : num(m[2]))
  }
  if ((m = t.match(R('^The opposite of a number is N\\. What is the number\\?$')))) return out(neg(num(m[1])))
  if ((m = t.match(R('^An? \\w+ is N feet (above|below) the water.*How many feet apart are they\\?$'))))
    return out(add(abs(num(m[1])), abs(num(m[1]))))
  if ((m = t.match(R('^An? \\w+ is N feet (above|below) the water\\. An? \\w+ is the same distance (above|below) the water\\. What number shows where'))))
    return out(m[3] === 'below' ? neg(num(m[1])) : num(m[1]))

  // ---- plain arithmetic ----
  if ((m = t.match(/^(?:What is |Work it out\. |Add\. |Take away\. |Multiply\. |Divide\. )(.+?)(?: = \?|\?)$/)))
    return out(evalExpr(m[1]), /Add\. .*\//.test(t))

  // ---- missing number ----
  if ((m = t.match(R('^What number goes in the box\\? N ([+−]) \\? = N$')))) {
    const a = num(m[1]), c = num(m[3])
    return out(m[2] === '+' ? sub(c, a) : sub(a, c))
  }
  if ((m = t.match(R('^What number goes in the box\\? \\? ÷ \\(?N\\)? = N$')))) return out(mul(num(m[1]), num(m[2])))
  if ((m = t.match(R('^What number goes in the box\\? N ÷ \\? = N$')))) return out(div(num(m[1]), num(m[2])))

  // ---- absolute value stories ----
  if ((m = t.match(R('dives to N meters and \\w+ dives to N meters\\. How many meters farther from the surface'))))
    return out(abs(sub(abs(num(m[1])), abs(num(m[2])))))
  if ((m = t.match(R('A diver is at N meters, and a bird flies at N meters\\. How many meters apart'))))
    return out(abs(sub(num(m[1]), num(m[2]))))

  // ---- integer stories ----
  if ((m = t.match(R('^In a game you start with N points\\. (.*) What is your score now\\?$')))) {
    let s = num(m[1])
    const steps = [...m[2].matchAll(R('(lose|win) N points', 'g'))]
    if (steps.length !== 3) throw new Error(`expected three rounds: ${t}`)
    for (const k of steps) s = k[1] === 'win' ? add(s, num(k[2])) : sub(s, num(k[2]))
    return out(s)
  }
  if ((m = t.match(R('^A hilltop is N meters above sea level\\. The bottom of a lake is N meters below sea level\\. How many meters higher'))))
    return out(add(num(m[1]), num(m[2])))
  if ((m = t.match(R('^At noon it was N °C\\. By midnight it was N °C\\. How many degrees did the temperature drop\\?$'))))
    return out(sub(num(m[1]), num(m[2])))
  if (/^Look at the pattern\./.test(t)) {
    const row: string[] = q.picture?.rows?.[0]
    const at = row?.indexOf('?') ?? -1
    if (!row || at < 0) throw new Error(`no ? cell: ${t}`)
    const known = row.map((c, i) => (i === at ? null : num(c)))
    const [i0, i1] = known.map((v, i) => (v ? i : -1)).filter(i => i >= 0)
    const step = div(sub(known[i1] as F, known[i0] as F), fr(i1 - i0))
    const at0 = (i: number) => add(known[i0] as F, mul(step, fr(i - i0)))
    known.forEach((v, i) => { if (v && !eq(v, at0(i))) throw new Error(`pattern not even: ${JSON.stringify(row)}`) })
    // Cross-check against the column heading, which states the product.
    const head = evalExpr(q.picture.head[at])
    if (!eq(head, at0(at))) throw new Error(`pattern disagrees with heading: ${JSON.stringify(q.picture)}`)
    return out(at0(at))
  }
  if ((m = t.match(R('^It is N °C at N p\\.m\\. The temperature drops N degrees every hour for N hours\\.'))))
    return out(sub(num(m[1]), mul(num(m[3]), num(m[4]))))
  if ((m = t.match(R('goes down N meters every minute, so her change each minute is N meters\\. What is her total change after N minutes'))))
    return out(mul(num(m[2]), num(m[3])))
  if ((m = t.match(R('dives from N to N meters in N minutes, going down the same amount each minute\\. Where is it after N minutes'))))
    return out(add(num(m[1]), mul(div(sub(num(m[2]), num(m[1])), num(m[3])), num(m[4]))))
  if ((m = t.match(R(' N \\w+ in N (weeks|minutes), the same amount each \\w+\\. Its change is N \\w+\\. What is its change each'))))
    return out(div(num(m[4]), num(m[2])))
  if ((m = t.match(R('^A diver (?:is at|starts at) N meters\\. She goes down N meters (?:each|every) minute for N minutes\\. Where is she then'))))
    return out(sub(num(m[1]), mul(num(m[2]), num(m[3]))))
  if ((m = t.match(R('drops N meters each week, so each week the change is N meters\\. What is the total change after N weeks'))))
    return out(mul(num(m[2]), num(m[3])))
  if ((m = t.match(R('^It is N °C\\. It gets N degrees (colder|warmer)\\. What is the temperature now'))))
    return out(m[3] === 'colder' ? sub(num(m[1]), num(m[2])) : add(num(m[1]), num(m[2])))
  if ((m = t.match(R('^\\w+ has \\$N in the bank, spends \\$N, and later puts in \\$N\\. What is the balance now'))))
    return out(add(sub(num(m[1]), num(m[2])), num(m[3])))
  if ((m = t.match(R('^After it got N degrees (colder|warmer), it was N °C\\. What was the temperature before'))))
    return out(m[2] === 'colder' ? add(num(m[3]), num(m[1])) : sub(num(m[3]), num(m[1])))
  if ((m = t.match(R('^A freezer is at N °C\\. The power goes out, and it warms up N degrees every hour for N hours\\.'))))
    return out(add(num(m[1]), mul(num(m[2]), num(m[3]))))

  throw new Error(`unknown question: ${t}`)
}

export const SOLVE: Record<string, (q: Q) => string> = Object.fromEntries(
  ['g7m2-t1', 'g7m2-t2', 'g7m2-t3', 'g7m2-t4', 'g7m2-t5', 'g7m2-t6', 'g7m2-t7', 'g7m2-t8'].map(id => [id, solve]),
)
