// Blind answer key for g7m3's practice ladders — written from the printed questions
// (`npx tsx scripts/ladder-questions.mts g7m3 N`), never from the generator.
type Q = { text: string; picture: any; choices?: string[] }

const fail = (q: Q, why = 'no rule'): never => { throw new Error(`g7m3 key: ${why} for "${q.text}"`) }
const n = (s: string) => Number(s.replace(/−/g, '-'))
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9
const whole = (v: number, q: Q) => (near(v, Math.round(v)) ? Math.round(v) : fail(q, `${v} is not whole`))
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a))

/** Exactly one choice must fit, or the question is defective. */
function pick(q: Q, fits: (c: string) => boolean): string {
  const ok = (q.choices ?? []).filter(fits)
  if (ok.length !== 1) throw new Error(`g7m3 key: ${ok.length} choices fit "${q.text}" ${JSON.stringify(q.choices)}`)
  return ok[0]
}

// ── a linear-expression evaluator: every value is [x coefficient, constant] ──
type Lin = [number, number]
function lin(src: string): Lin {
  const s = src.replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/').replace(/\s+/g, '')
  let i = 0
  const peek = () => s[i]
  const atom = (): Lin => {
    const c = peek()
    if (c === '-') { i++; const v = atom(); return [-v[0], -v[1]] }
    if (c === '+') { i++; return atom() }
    if (c === '(') { i++; const v = sum(); if (s[i++] !== ')') throw new Error(`bad brackets in ${src}`); return v }
    const num = s.slice(i).match(/^\d+(\.\d+)?/)
    if (num) { i += num[0].length; return [0, Number(num[0])] }
    if (c && /[a-z]/.test(c)) { i++; return [1, 0] }
    throw new Error(`cannot read "${src}" at ${i}`)
  }
  const mul = (a: Lin, b: Lin): Lin => {
    if (a[0] && b[0]) throw new Error(`not linear: ${src}`)
    return [a[0] * b[1] + b[0] * a[1], a[1] * b[1]]
  }
  const term = (): Lin => {
    let v = atom()
    for (;;) {
      const c = peek()
      if (c === '*') { i++; v = mul(v, atom()) }
      else if (c === '/') { i++; const d = atom(); if (d[0] || !d[1]) throw new Error(`bad divisor in ${src}`); v = [v[0] / d[1], v[1] / d[1]] }
      else if (c === '(' || (c && /[a-z\d]/.test(c))) v = mul(v, atom()) // implied multiplication
      else return v
    }
  }
  const sum = (): Lin => {
    let v = term()
    for (;;) {
      const c = peek()
      if (c === '+') { i++; const t = term(); v = [v[0] + t[0], v[1] + t[1]] }
      else if (c === '-') { i++; const t = term(); v = [v[0] - t[0], v[1] - t[1]] }
      else return v
    }
  }
  const v = sum()
  if (i !== s.length) throw new Error(`trailing text in "${src}"`)
  return v
}
const tryLin = (s: string): Lin | null => { try { return lin(s) } catch { return null } }
const same = (a: string, b: string) => { const p = tryLin(a), r = tryLin(b); return !!p && !!r && near(p[0], r[0]) && near(p[1], r[1]) }

type Rel = '<' | '>' | '≤' | '≥' | '='
const REL = /\s*(<|>|≤|≥|=)\s*/
const flip = (r: Rel): Rel => (({ '<': '>', '>': '<', '≤': '≥', '≥': '≤', '=': '=' }) as const)[r]
const holds = (a: number, r: Rel, b: number) =>
  r === '<' ? a < b - 1e-9 : r === '>' ? a > b + 1e-9 : r === '≤' ? a <= b + 1e-9 : r === '≥' ? a >= b - 1e-9 : near(a, b)

/** "L rel R" → x rel v (a single relation). Null if unreadable or x cancels. */
function solve(src: string): { r: Rel; v: number } | null {
  const parts = src.split(REL)
  if (parts.length !== 3) return null
  const L = tryLin(parts[0]), R = tryLin(parts[2])
  if (!L || !R) return null
  const a = L[0] - R[0], b = R[1] - L[1]
  if (near(a, 0)) return null
  const r = parts[1] as Rel
  return { r: a < 0 ? flip(r) : r, v: b / a }
}
const sameSol = (a: { r: Rel; v: number } | null, b: { r: Rel; v: number } | null) => !!a && !!b && a.r === b.r && near(a.v, b.v)

/** The only integer in −300..300 that makes `ok` true when put in for "?". */
function unknown(q: Q, ok: (k: number) => boolean): string {
  const hits: number[] = []
  for (let k = -300; k <= 300; k++) if (ok(k)) hits.push(k)
  if (hits.length !== 1) fail(q, `${hits.length} values fit the ? (${hits.slice(0, 5)})`)
  return String(hits[0])
}
const put = (s: string, k: number) => s.replace(/\?/g, k < 0 ? `(${k})` : String(k))

/** Least (or greatest) integer x with x rel v. */
function edge(r: Rel, v: number, q: Q): number {
  const f = Math.floor(v + 1e-9), c = Math.ceil(v - 1e-9)
  if (r === '>') return f + 1
  if (r === '≥') return c
  if (r === '<') return c - 1
  if (r === '≤') return f
  return fail(q, 'no inequality')
}

/** Expression after the prompt word, up to "?" / "." at the end. */
const exprIn = (t: string, re: RegExp, q: Q) => (t.match(re) ?? fail(q, 'no expression'))[1]

// ── picture cross-checks: the picture must say what the text says ──
function tapeCount(p: any, label: string): number {
  return (p?.rows ?? []).flatMap((r: any) => r.cells).filter((c: any) => c.text === label).length
}
function picAgrees(q: Q, ok: boolean) { if (!ok) fail(q, `picture ${JSON.stringify(q.picture)} disagrees with the text`) }

export const SOLVE: Record<string, (q: Q) => string> = {
  'g7m3-t1': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    if ((m = t.match(/^Which is the same as (.+)\?$/))) {
      const e = m[1]
      if (q.picture?.kind === 'tape') {
        const L = lin(e), cells = q.picture.rows.flatMap((r: any) => r.cells)
        const xs = cells.filter((c: any) => c.text === 'x').length
        const k = cells.filter((c: any) => c.text !== 'x').reduce((s: number, c: any) => s + n(c.text), 0)
        picAgrees(q, xs === L[0] && k === L[1])
      }
      return pick(q, c => same(c, e))
    }
    if ((m = t.match(/^Make (.+) shorter\. The x part is (−?\d*)x\. What is the plain number part\?$/))) {
      const L = lin(m[1])
      const given = m[2] === '' ? 1 : m[2] === '−' ? -1 : n(m[2])
      if (!near(L[0], given)) fail(q, `x part is really ${L[0]}x`)
      return String(L[1])
    }
    if ((m = t.match(/^\w+ says (.+) is the same as (.+)\. Which is right\?$/))) {
      const e = m[1]
      if (same(e, m[2])) fail(q, 'the claim is actually right')
      return pick(q, c => same(c, e))
    }
    if ((m = t.match(/^T-shirts cost x dollars each\. \w+ buys (\d+) and uses a (\d+)-dollar coupon\. \w+ buys (\d+) and pays a (\d+)-dollar fee\. Together they pay (.+) dollars\. How many dollars is that when a T-shirt costs (\d+) dollars\?$/))) {
      const story = `${m[1]}x - ${m[2]} + ${m[3]}x + ${m[4]}`
      if (!same(story, m[5])) fail(q, `story gives ${story}, text says ${m[5]}`)
      const L = lin(story)
      return String(L[0] * n(m[6]) + L[1])
    }
    return fail(q)
  },

  'g7m3-t2': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    if ((m = t.match(/^Which is the same as (.+)\?$/))) {
      const e = m[1]
      if (q.picture?.kind === 'area') {
        const [k] = q.picture.rows, [a, b] = q.picture.cols
        picAgrees(q, same(`${k}*(${a}+(${b}))`, e))
      }
      return pick(q, c => same(c, e))
    }
    if ((m = t.match(/^\w+ writes (.+) = (.+)\. What went wrong\?$/))) {
      const lhs = m[1], written = lin(m[2]), right = lin(lhs)
      const inner = lhs.match(/^(−?\d+)\(x ([+−]) (\d+)\)$/) ?? fail(q, 'unreadable bracket')
      const k = n(inner[1]), c = (inner[2] === '−' ? -1 : 1) * n(inner[3])
      return pick(q, ch => {
        if (ch === 'Nothing. It is right.') return near(written[0], right[0]) && near(written[1], right[1])
        let s: RegExpMatchArray | null
        if ((s = ch.match(/^The x part should be (−?\d*)x\.$/))) {
          const v = s[1] === '' ? 1 : s[1] === '−' ? -1 : n(s[1])
          return near(v, right[0]) && !near(written[0], right[0])
        }
        if ((s = ch.match(/^(−?\d+) × \(?(−?\d+)\)? is (positive|negative), so it is ([+−])(\d+)\.$/))) {
          const p = n(s[1]) * n(s[2]), claim = (s[4] === '−' ? -1 : 1) * n(s[5])
          return n(s[1]) === k && n(s[2]) === c && (p > 0) === (s[3] === 'positive') &&
            near(p, claim) && near(claim, right[1]) && !near(written[1], right[1])
        }
        if ((s = ch.match(/^The (−?\d+) has to multiply the (\d+) too\.$/))) {
          // true only when the constant was left as it was, unmultiplied
          return n(s[1]) === k && n(s[2]) === Math.abs(c) && near(Math.abs(written[1]), Math.abs(c)) && !near(written[1], right[1])
        }
        return fail(q, `unknown choice "${ch}"`)
      })
    }
    if ((m = t.match(/^(.+) = (.+)\. What number goes in the \?$/))) {
      const [lhs, rhs] = [m[1], m[2]]
      if (q.picture?.kind === 'area') picAgrees(q, same(`${q.picture.cells[0][0]} + (${q.picture.cells[0][1]})`, rhs))
      return unknown(q, k => k !== 0 && same(put(lhs, k), rhs))
    }
    if ((m = t.match(/^A gym costs x dollars a month, and a deal takes (\d+) dollars off every month\. \w+ pays for (\d+) months and a (\d+)-dollar sign-up fee\. Which shows what \w+ pays, with no brackets\?$/))) {
      const e = `${m[2]}(x - ${m[1]}) + ${m[3]}`
      return pick(q, c => same(c, e) && !c.includes('('))
    }
    return fail(q)
  },

  'g7m3-t3': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    if ((m = t.match(/^What is the biggest number you can put outside the brackets in (\d+)x \+ (\d+)\?$/)))
      return String(gcd(n(m[1]), n(m[2])))
    if ((m = t.match(/^Which is the same as (.+)\?$/))) { const e = m[1]; return pick(q, c => same(c, e)) }
    if ((m = t.match(/^(.+) = (.+)\. What number goes in the \?$/))) {
      const [lhs, rhs] = [m[1], m[2]]
      return unknown(q, k => same(lhs, put(rhs, k)))
    }
    if ((m = t.match(/^\w+ writes (\d+)x \+ (\d+) = (.+)\. That is true, but (\d+) is not the biggest number\. Which is the same, with the biggest number outside\?$/))) {
      const e = `${m[1]}x + ${m[2]}`, g = gcd(n(m[1]), n(m[2]))
      if (!same(e, m[3])) fail(q, 'the "true" line is not true')
      if (n(m[4]) === g) fail(q, 'it IS the biggest number')
      return pick(q, c => same(c, e) && c.startsWith(`${g}(`))
    }
    if ((m = t.match(/^A class has (\d+) packs with x pencils in each, and (\d+) erasers\. They make as many equal gift bags as they can, with nothing left over\. Every bag gets the same packs and the same erasers\. How many (packs|erasers) go in each bag\?$/))) {
      const p = n(m[1]), e = n(m[2]), g = gcd(p, e)
      return String(m[3] === 'packs' ? p / g : e / g)
    }
    return fail(q)
  },

  'g7m3-t4': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    if ((m = t.match(/^Solve (.+ = .+)\. What is x\?$/))) {
      const s = solve(m[1]) ?? fail(q, 'unsolvable')
      if (q.picture?.kind === 'balance') picAgrees(q, sameSol(solve(`${q.picture.left} = ${q.picture.right}`), s))
      return String(whole(s.v, q))
    }
    if ((m = t.match(/^You solve (.+ = .+)\. Which is the right next line\?$/))) {
      const s = solve(m[1]); return pick(q, c => sameSol(solve(c), s))
    }
    if ((m = t.match(/^x = (−?\d+) makes (.+) true\. What number goes in the \?$/))) {
      const x = n(m[1]), eq = m[2]
      return unknown(q, k => { const [l, r] = put(eq, k).split(' = '); const L = lin(l), R = lin(r); return near(L[0] * x + L[1], R[0] * x + R[1]) })
    }
    if ((m = t.match(/^A tank holds (\d+) liters of water\. It drains (\d+) liters each minute\. Now it holds (\d+) liters\. How many minutes has it been draining\?$/)))
      return String(whole((n(m[1]) - n(m[3])) / n(m[2]), q))
    return fail(q)
  },

  'g7m3-t5': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    if ((m = t.match(/^Solve (.+ = .+)\. What is x\?$/))) {
      const s = solve(m[1]) ?? fail(q, 'unsolvable')
      if (q.picture?.kind === 'tape') {
        const g = m[1].match(/^(\d+)\(x \+ (\d+)\) = (\d+)$/) ?? fail(q, 'tape for an unexpected form')
        picAgrees(q, tapeCount(q.picture, 'x') === n(g[1]) && tapeCount(q.picture, g[2]) === n(g[1]) && q.picture.rows[0].brace === g[3])
      }
      return String(whole(s.v, q))
    }
    if ((m = t.match(/^Which is a right first step to solve (.+ = .+)\?$/))) {
      const s = solve(m[1]); return pick(q, c => sameSol(solve(c), s))
    }
    if ((m = t.match(/^(\d+) friends each buy a ticket and a (\d+)-dollar snack\. Together they pay (\d+) dollars\. How many dollars is one ticket\?$/))) {
      picAgrees(q, tapeCount(q.picture, 'ticket') === n(m[1]) && tapeCount(q.picture, m[2]) === n(m[1]))
      return String(whole(n(m[3]) / n(m[1]) - n(m[2]), q))
    }
    return fail(q)
  },

  'g7m3-t6': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    if ((m = t.match(/^Solve (.+)\. Which is the answer\?$/))) {
      const s = solve(m[1]); return pick(q, c => sameSol(solve(c), s))
    }
    if ((m = t.match(/^What is the (least|greatest) whole number that makes (.+) true\?$/))) {
      const s = solve(m[2]) ?? fail(q, 'unsolvable')
      const wantUp = m[1] === 'least'
      if (wantUp !== (s.r === '>' || s.r === '≥')) fail(q, `no ${m[1]} value for x ${s.r} ${s.v}`)
      const v = edge(s.r, s.v, q)
      if (v < 0) fail(q, `${v} is not a whole number`)
      return String(v)
    }
    if ((m = t.match(/^Solve (.+)\. How do you draw every answer on a number line\?$/))) {
      const s = solve(m[1]) ?? fail(q, 'unsolvable')
      const dot = s.r === '<' || s.r === '>' ? 'an open dot' : 'a filled-in dot'
      const dir = s.r === '>' || s.r === '≥' ? 'right' : 'left'
      const want = `${dot} at ${String(s.v).replace('-', '−')}, arrow to the ${dir}`
      return pick(q, c => c === want)
    }
    if ((m = t.match(/^Which number makes (.+) true\?$/))) {
      const [l, r, rt] = m[1].split(REL)
      return pick(q, c => { const L = lin(l), R = lin(rt), x = n(c); return holds(L[0] * x + L[1], r as Rel, R[0] * x + R[1]) })
    }
    if ((m = t.match(/^A gym charges a (\d+)-dollar fee plus (\d+) dollars for each class\. \w+ can spend at most (\d+) dollars\. What is the greatest number of classes \w+ can take\?$/))) {
      const v = Math.floor((n(m[3]) - n(m[1])) / n(m[2]))
      const p = solve(q.picture.text); picAgrees(q, !!p && edge(p.r, p.v, q) === v)
      return String(v)
    }
    if ((m = t.match(/^\w+ has (\d+) dollars and saves (\d+) dollars each week\. \w+ wants MORE than (\d+) dollars\. What is the fewest number of weeks that works\?$/))) {
      const v = Math.max(0, Math.floor((n(m[3]) - n(m[1])) / n(m[2])) + 1)
      const p = solve(q.picture.text); picAgrees(q, !!p && edge(p.r, p.v, q) === v)
      return String(v)
    }
    return fail(q)
  },

  'g7m3-t7': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    if ((m = t.match(/^(−?\d+) (<|>) (−?\d+) is true\. Multiply both sides by (−?\d+)\. Which is true now\?$/))) {
      const a = n(m[1]) * n(m[4]), b = n(m[3]) * n(m[4])
      if (!holds(n(m[1]), m[2] as Rel, n(m[3]))) fail(q, 'the starting line is false')
      return pick(q, c => { const s = c.match(/^(−?\d+) (<|>|=) (−?\d+)$/); return !!s && n(s[1]) === a && n(s[3]) === b && holds(a, s[2] as Rel, b) })
    }
    if ((m = t.match(/^Solve (.+)\. Which is the answer\?$/))) {
      const s = solve(m[1]); return pick(q, c => sameSol(solve(c), s))
    }
    if ((m = t.match(/^You solve (.+)\. Which step makes you flip the sign\?$/))) {
      return pick(q, c => {
        const s = c.match(/^(multiply|divide) both sides by (−?\d+)$/)
        if (s) return n(s[2]) < 0
        if (/^(add −?\d+ to|take −?\d+ off) both sides$/.test(c)) return false
        return fail(q, `unknown choice "${c}"`)
      })
    }
    if ((m = t.match(/^At noon it is (−?\d+) degrees?\. The temperature drops (\d+) degrees? each hour\. After how many whole hours is it first colder than (−?\d+) degrees?\?$/))) {
      const v = Math.floor((n(m[1]) - n(m[3])) / n(m[2])) + 1
      const p = solve(q.picture.text); picAgrees(q, !!p && edge(p.r, p.v, q) === v)
      return String(v)
    }
    return fail(q)
  },

  'g7m3-t8': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    const fixedPlusEach = /^A (?:taxi charges|gym costs|phone plan costs|water park costs) (\d+) dollars (?:to start|to join|a month|to get in), plus (\d+) dollars for each [\w ]+?\. (?:A ride costs|\w+ paid|The bill is) (\d+) dollars\. How many [\w ]+\?/
    if ((m = t.match(fixedPlusEach))) {
      const start = n(m[1]), each = n(m[2]), total = n(m[3])
      const ans = whole((total - start) / each, q)
      if (/Which equation fits the story\?$/.test(t)) {
        const letter = (q.picture?.text ?? '').match(/^([a-z]) = /)?.[1] ?? fail(q, 'no letter')
        return pick(q, c => {
          const s = solve(c)
          return !!s && s.r === '=' && near(s.v, ans) && new RegExp(`\\b\\d*${letter}\\b`).test(c)
        })
      }
      if (!/\?$/.test(t) || /Which/.test(t)) fail(q)
      if (q.picture?.kind === 'tape') picAgrees(q, q.picture.rows[0].brace === `${total} dollars`)
      return String(ans)
    }
    if ((m = t.match(/^A book has (\d+) pages\. \w+ reads (\d+) pages each day\. Now (\d+) pages are left\. How many days has \w+ been reading\?$/)) ||
        (m = t.match(/^\w+ has (\d+) dollars and spends (\d+) dollars each week\. Now \w+ has (\d+) dollars left\. How many weeks has it been\?$/)))
      return String(whole((n(m[1]) - n(m[3])) / n(m[2]), q))
    if ((m = t.match(/^(\w+) has (\d+) more than (\d+) times as many stickers as (\w+)\. Together they have (\d+) stickers\. How many stickers does (\w+) have\?$/))) {
      const k = n(m[2]), times = n(m[3]), total = n(m[5])
      const small = whole((total - k) / (times + 1), q), big = times * small + k
      const rows = q.picture.rows
      picAgrees(q, rows.length === 2 && rows[0].label === m[4] && rows[1].label === m[1] &&
        rows[1].cells.filter((c: any) => c.text === 'x').length === times && rows[1].cells.some((c: any) => c.text === String(k)))
      if (m[6] === m[1]) return String(big)
      if (m[6] === m[4]) return String(small)
      return fail(q, `who is ${m[6]}?`)
    }
    if ((m = t.match(/^(\d+) bags each hold the same number of apples and (\d+) pears?\. There are (\d+) pieces of fruit in all\. How many apples are there in all\?$/))) {
      const bags = n(m[1]), pears = n(m[2]), total = n(m[3])
      whole((total - bags * pears) / bags, q) // each bag must hold a whole number of apples
      picAgrees(q, tapeCount(q.picture, 'apples') === bags && tapeCount(q.picture, m[2]) === bags)
      return String(total - bags * pears)
    }
    return fail(q)
  },
}
