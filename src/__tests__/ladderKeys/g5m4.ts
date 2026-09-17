// Blind answer key for g5m4's practice ladders. Written from the QUESTIONS only
// (`npx tsx scripts/ladder-questions.mts g5m4 N`), never from the generator.
// Exact decimal arithmetic in BigInt at 10^-12. Pictures that restate the text's numbers are checked; a disagreement throws.
type Q = { text: string; picture: any; choices?: string[] }

const fail = (q: Q, why = 'no rule for'): never => { throw new Error(`g5m4 key: ${why}: ${q.text}`) }

// ── exact decimals ──────────────────────────────────────────────────────────
const P = 12
const S = BigInt(10) ** BigInt(P)
type D = bigint
function dec(s: string): D {
  const t = s.replace(/[$,\s]/g, '')
  const r = t.match(/^(-?)(\d+)(?:\.(\d+))?$/)
  if (!r || (r[3] ?? '').length > P) throw new Error(`g5m4 key: cannot read number "${s}"`)
  const v = BigInt(r[2]) * S + BigInt((r[3] ?? '').padEnd(P, '0') || '0')
  return r[1] ? -v : v
}
const mul = (a: D, b: D) => (a * b) / S
function dv(q: Q, a: D, b: D): D {
  if ((a * S) % b !== BigInt(0)) fail(q, 'division does not come out exact')
  return (a * S) / b
}
function str(v: D): string {
  const neg = v < BigInt(0), a = neg ? -v : v
  const frac = (a % S).toString().padStart(P, '0').replace(/0+$/, '')
  return (neg ? '-' : '') + (a / S).toString() + (frac ? '.' + frac : '')
}
const NUM = /\$?\d{1,3}(?:,\d{3})+(?:\.\d+)?|\$?\d+(?:\.\d+)?/g
const nums = (s: string) => (s.match(NUM) ?? []).map(dec)
const same = (q: Q, a: D, b: D, what: string) => { if (a !== b) fail(q, `picture disagrees (${what}: ${str(a)} vs ${str(b)})`) }

/** Round a non-negative value to 10^-places, half up. */
function round(v: D, places: number): D {
  const unit = BigInt(10) ** BigInt(P - places)
  return ((v + unit / BigInt(2)) / unit) * unit
}
const placeOf = (w: string) => (w.startsWith('whole') ? 0 : w.startsWith('tenth') ? 1 : w.startsWith('hundredth') ? 2 : -1)

/** Exactly one choice satisfies `ok`. */
function pick(q: Q, ok: (c: string) => boolean): string {
  const hits = (q.choices ?? fail(q, 'no choices')).filter(ok)
  if (hits.length !== 1) fail(q, `${hits.length} choices fit (${hits.join(' | ')})`)
  return hits[0]
}
const onlyNum = (s: string) => { const n = nums(s); if (n.length !== 1) throw new Error(`g5m4 key: choice "${s}" is not one number`); return n[0] }

/** "a op b = c" with exactly one "?" (or none): returns the missing value / checks truth. */
const OPS: Record<string, [(a: D, b: D, q: Q) => D, (c: D, b: D, q: Q) => D, (c: D, a: D, q: Q) => D]> = {
  // [forward, find a given c and b, find b given c and a]
  '+': [(a, b) => a + b, (c, b) => c - b, (c, a) => c - a],
  '−': [(a, b) => a - b, (c, b) => c + b, (c, a) => a - c],
  '×': [mul, (c, b, q) => dv(q, c, b), (c, a, q) => dv(q, c, a)],
  '÷': [(a, b, q) => dv(q, a, b), mul, (c, a, q) => dv(q, a, c)],
}
const EQN = /(\?|[\d.,$]+) ([+−×÷]) (\?|[\d.,$]+) = (\?|[\d.,$]+)/
function solveEqn(q: Q, s: string): D {
  const r = s.match(EQN) ?? fail(q, 'no equation')
  const [, a, op, b, c] = r
  const f = OPS[op]
  if (c === '?') return f[0](dec(a), dec(b), q)
  if (a === '?') return f[1](dec(c), dec(b), q)
  if (b === '?') return f[2](dec(c), dec(a), q)
  return fail(q, 'equation has no box')
}
const eqText = (q: Q, expect: string) => { if (q.picture?.kind === 'eq' && q.picture.text !== expect) fail(q, `picture eq "${q.picture.text}" vs "${expect}"`) }

/** The digits of a place-value chart row, as a number (head names the places). */
const PLACE: Record<string, number> = { Hundreds: 2, Tens: 1, Ones: 0, Tenths: -1, Hundredths: -2, Thousandths: -3 }
function chartValue(head: string[], cells: string[]): D {
  let v = BigInt(0)
  head.forEach((h, i) => {
    if (!(h in PLACE) || cells[i] === '' || cells[i] === '?') return
    v += BigInt(cells[i]) * (PLACE[h] >= 0 ? S * BigInt(10) ** BigInt(PLACE[h]) : S / BigInt(10) ** BigInt(-PLACE[h]))
  })
  return v
}

// ── metric units ────────────────────────────────────────────────────────────
const UNIT: Record<string, [string, D]> = {
  kilometer: ['len', BigInt(1000000)], meter: ['len', BigInt(1000)], centimeter: ['len', BigInt(10)],
  km: ['len', BigInt(1000000)], m: ['len', BigInt(1000)], cm: ['len', BigInt(10)],
  kilogram: ['mass', BigInt(1000)], gram: ['mass', BigInt(1)], kg: ['mass', BigInt(1000)], g: ['mass', BigInt(1)],
  liter: ['vol', BigInt(1000)], milliliter: ['vol', BigInt(1)], L: ['vol', BigInt(1000)], mL: ['vol', BigInt(1)],
}
function unit(q: Q, w: string): [string, D] {
  const u = UNIT[w.replace(/s$/, '')] ?? UNIT[w]
  return u ?? fail(q, `unknown unit "${w}"`)
}
function convert(q: Q, v: D, from: string, to: string): D {
  const [k1, f1] = unit(q, from), [k2, f2] = unit(q, to)
  if (k1 !== k2) fail(q, `cannot convert ${from} to ${to}`)
  return dv(q, v * f1, f2 * S) // v·f1/f2
}

// ── topics ──────────────────────────────────────────────────────────────────
export const SOLVE: Record<string, (q: Q) => string> = {
  'g5m4-t1': q => {
    const t = q.text
    let r = t.match(/^Write ([\d,]+) and ([\d,]+) thousandths? with a point\.$/)
    if (r) { eqText(q, `${r[1]} and ${r[2]} thousandths`); return str(dec(r[1]) + dec(r[2]) / BigInt(1000)) }
    r = t.match(/^Write ([\d,]+) thousandths? with a point\.$/)
    if (r) return str(dec(r[1]) / BigInt(1000))
    r = t.match(/^In ([\d.]+), what is the value of the (\d)\?$/)
    if (r) {
      const [w, f = ''] = r[1].split('.')
      const pos = [...w].map((d, i) => [d, w.length - 1 - i] as const).concat([...f].map((d, i) => [d, -1 - i] as const)).filter(([d]) => d === r![2])
      if (pos.length !== 1) fail(q, `digit ${r[2]} appears ${pos.length} times`)
      const p = q.picture
      if (p?.kind === 'table') same(q, chartValue(p.head, p.rows[0]), dec(r[1]), 'chart')
      const e = pos[0][1]
      return str(BigInt(r[2]) * (e >= 0 ? S * BigInt(10) ** BigInt(e) : S / BigInt(10) ** BigInt(-e)))
    }
    r = t.match(/^Which one is ([\d,]+) thousandths?\?$/)
    if (r) { const v = dec(r[1]) / BigInt(1000); return pick(q, c => onlyNum(c) === v) }
    r = t.match(/weighs ([\d,]+) thousandths of a gram\. .* weighs ([\d,]+) thousandths of a gram\. How much do they weigh together\? Write it with a point\.$/)
    if (r) { eqText(q, `${r[1]} thousandths + ${r[2]} thousandths`); return str((dec(r[1]) + dec(r[2])) / BigInt(1000)) }
    return fail(q)
  },

  'g5m4-t2': q => {
    const t = q.text
    const sign = (a: D, b: D) => (a < b ? '<' : a > b ? '>' : '=')
    let r = t.match(/Which sign goes between them\? ([\d.]+) \? ([\d.]+)$/)
    if (r) {
      const [a, b] = [dec(r[1]), dec(r[2])]
      const p = q.picture
      if (p?.kind === 'table') {
        same(q, chartValue(p.head, p.rows[0]), a, 'chart row 1'); same(q, chartValue(p.head, p.rows[1]), b, 'chart row 2')
        if (p.rows[0][0] !== r[1] || p.rows[1][0] !== r[2]) fail(q, 'chart row labels differ from the text')
      } else eqText(q, `${r[1]} ? ${r[2]}`)
      return pick(q, c => c === sign(a, b))
    }
    r = t.match(/^(\w+)'s (\w+) is ([\d.]+) meters long\. (\w+)'s \2 is ([\d.]+) meters long\. Whose \2 is longer\?$/)
    if (r) {
      eqText(q, `${r[3]} ? ${r[5]}`)
      const [a, b] = [dec(r[3]), dec(r[5])]
      const want = a > b ? r[1] : b > a ? r[4] : 'Same length'
      return pick(q, c => c === want)
    }
    if (t === 'Which number is the greatest?' || t === 'Which number is the least?') {
      const vals = q.choices!.map(onlyNum)
      const best = vals.reduce((m, v) => (t.includes('greatest') ? (v > m ? v : m) : (v < m ? v : m)))
      return pick(q, c => onlyNum(c) === best)
    }
    if (t === 'Which list goes from least to greatest?') {
      return pick(q, c => { const v = c.split(', ').map(dec); return v.every((x, i) => i === 0 || v[i - 1] < x) })
    }
    return fail(q)
  },

  'g5m4-t3': q => {
    const t = q.text
    let r = t.match(/^Round ([\d.]+) to the nearest (tenth|hundredth|whole number)\.$/)
    if (r) {
      const v = dec(r[1]), p = q.picture
      if (p?.kind === 'numline') { if (!p.points?.some((x: any) => dec(String(x.at)) === v)) fail(q, 'numline dot is not at the number'); if (dec(String(p.min)) > v || dec(String(p.max)) < v) fail(q, 'number off the line') }
      else eqText(q, `${r[1]} → ?`)
      return str(round(v, placeOf(r[2])))
    }
    r = t.match(/ ([\d.]+) (meters|kilograms|liters)(?: long)?\. Round it to the nearest (tenth|hundredth) of a (meter|kilogram|liter)\.$/)
    if (r) { eqText(q, `${r[1]} ${r[2]}`); return str(round(dec(r[1]), placeOf(r[3]))) }
    r = t.match(/^Which number rounds to ([\d.]+) to the nearest (tenth|hundredth|whole number)\?$/)
    if (r) { const target = dec(r[1]), pl = placeOf(r[2]); eqText(q, `? → ${r[1]}`); return pick(q, c => round(onlyNum(c), pl) === target) }
    r = t.match(/^What is the (largest|smallest) number with two places after the point that rounds to ([\d.]+) to the nearest tenth\?$/)
    if (r) {
      const target = dec(r[2]), step = S / BigInt(100)
      // search two-place numbers within a tenth either side
      let best: D | null = null
      for (let v = target - S / BigInt(10); v <= target + S / BigInt(10); v += step) if (v >= BigInt(0) && round(v, 1) === target) {
        if (best === null || (r[1] === 'largest' ? v > best : v < best)) best = v
      }
      return best === null ? fail(q, 'nothing rounds there') : str(best)
    }
    return fail(q)
  },

  'g5m4-t4': q => {
    const t = q.text
    let r = t.match(/^(?:Add\.|Which answer is right\?) ([\d.]+) \+ ([\d.]+) = \?$/)
    if (r) {
      const v = dec(r[1]) + dec(r[2])
      const p = q.picture
      if (p?.kind === 'columns') { same(q, dec(p.rows[0]), dec(r[1]), 'top row'); same(q, dec(p.rows[1]), dec(r[2]), 'second row') }
      if (q.choices) { eqText(q, `${r[1]} + ${r[2]}`); return pick(q, c => onlyNum(c) === v) }
      return str(v)
    }
    r = t.match(/^Find ([\d.]+) \+ ([\d.]+)\.$/)
    if (r) { eqText(q, `${r[1]} + ${r[2]} = ?`); return str(dec(r[1]) + dec(r[2])) }
    if (/in all\?$|in the pot now\?$|weigh together\?$/.test(t)) {
      const n = nums(t)
      if (n.length < 2 || n.length > 3) fail(q, `expected 2–3 numbers, got ${n.length}`)
      const pn = nums([q.picture?.text ?? '', ...(q.picture?.lines ?? [])].join(' ').replace(/\?/g, ''))
      if (!n.every(x => pn.includes(x))) fail(q, 'picture numbers differ from the text')
      return str(n.reduce((a, b) => a + b))
    }
    return fail(q)
  },

  'g5m4-t5': q => {
    const t = q.text
    let r = t.match(/^(?:Take away\.|Which answer is right\?) ([\d.]+) − ([\d.]+) = \?$/)
    if (r) {
      const v = dec(r[1]) - dec(r[2])
      const p = q.picture
      if (p?.kind === 'columns') { same(q, dec(p.rows[0]), dec(r[1]), 'top row'); same(q, dec(p.rows[1]), dec(r[2]), 'second row') }
      if (q.choices) { eqText(q, `${r[1]} − ${r[2]}`); return pick(q, c => onlyNum(c) === v) }
      return str(v)
    }
    r = t.match(/^Find ([\d.]+) − ([\d.]+)\.$/)
    if (r) { eqText(q, `${r[1]} − ${r[2]} = ?`); return str(dec(r[1]) - dec(r[2])) }
    r = t.match(/^What number goes in the box\? (.+)$/)
    if (r) { eqText(q, r[1]); return str(solveEqn(q, r[1])) }
    if (/left\?$/.test(t)) {
      const n = nums(t)
      if (n.length !== 3) fail(q, `expected 3 numbers, got ${n.length}`)
      eqText(q, `${str(n[0])} − ${str(n[1])} = ?`)
      const v = n[0] - n[1] - n[2]
      return v < BigInt(0) ? fail(q, 'negative left') : str(v)
    }
    return fail(q)
  },

  'g5m4-t6': q => {
    const t = q.text
    let r = t.match(/^Multiply\. (\d+) × ([\d.]+) = \?$/)
    if (r) {
      const p = q.picture
      if (p?.kind === 'area') { same(q, p.cols.map((c: string) => dec(c)).reduce((a: D, b: D) => a + b), dec(r[2]), 'area columns'); same(q, dec(p.rows[0]), dec(r[1]), 'area row') }
      return str(dec(r[1]) * dec(r[2]) / S)
    }
    r = t.match(/^Find ([\d.]+) × ([\d.]+)\.$/)
    if (r) { eqText(q, `${r[1]} × ${r[2]} = ?`); return str(mul(dec(r[1]), dec(r[2]))) }
    r = t.match(/^([\d,.]+) × ([\d,.]+) = ([\d,.]+)\. So what is ([\d.]+) × ([\d.]+)\?$/)
    if (r) {
      if (mul(dec(r[1]), dec(r[2])) !== dec(r[3])) fail(q, 'the given fact is false')
      const v = mul(dec(r[4]), dec(r[5]))
      return pick(q, c => onlyNum(c) === v)
    }
    r = t.match(/^What number goes in the box\? (.+)$/)
    if (r) { eqText(q, r[1]); return str(solveEqn(q, r[1])) }
    r = t.match(/costs (\$[\d.]+) and an? \w+ costs (\$[\d.]+)\. \w+ buys (\d+) \w+ and (\d+) \w+\. How much does \w+ pay\?$/)
    if (r) {
      eqText(q, `${r[3]} × ${r[1]}`)
      if (q.picture?.lines?.[0] !== `${r[4]} × ${r[2]}`) fail(q, 'picture second line differs')
      return str(mul(dec(r[3]), dec(r[1])) + mul(dec(r[4]), dec(r[2])))
    }
    return fail(q)
  },

  'g5m4-t7': q => {
    const t = q.text
    let r = t.match(/^(?:Multiply\. |Divide\. )?([\d.,]+) ([×÷]) ([\d,]+) = \?$/)
    if (r) {
      if (r[2] === '×' && t.startsWith('Divide') || r[2] === '÷' && t.startsWith('Multiply')) fail(q, 'verb and sign disagree')
      const p = q.picture
      if (p?.kind === 'table') same(q, chartValue(p.head, p.rows[0]), dec(r[1]), 'chart')
      else eqText(q, `${r[1]} ${r[2]} ${r[3]} = ?`)
      return str(r[2] === '×' ? mul(dec(r[1]), dec(r[3])) : dv(q, dec(r[1]), dec(r[3])))
    }
    if (t === 'Which one is true?') {
      return pick(q, c => {
        const m = c.match(/^([\d.,]+) ([×÷]) ([\d,]+) = ([\d.,]+)$/) ?? fail(q, `choice "${c}" unreadable`)
        const v = m[2] === '×' ? mul(dec(m[1]), dec(m[3])) : dv(q, dec(m[1]), dec(m[3]))
        return v === dec(m[4])
      })
    }
    r = t.match(/^What number goes in the box\? (.+)$/)
    if (r) { eqText(q, r[1]); return str(solveEqn(q, r[1])) }
    r = t.match(/^A box of ([\d,]+) (\w+) costs (\$[\d.,]+)\. Each \w+ costs the same\. How much do ([\d,]+) \2 cost\?$/)
    if (r) return str(dv(q, mul(dec(r[3]), dec(r[4])), dec(r[1])))
    r = t.match(/^Each (\w+) weighs ([\d.]+) (grams|ounces)\. An? (\w+) holds ([\d,]+) \1s, and an? (\w+) holds ([\d,]+) \4s\. How many \3 of \1s are in an? \6\?$/)
    if (r) return str(mul(mul(dec(r[2]), dec(r[5])), dec(r[7])))
    return fail(q)
  },

  'g5m4-t8': q => {
    const t = q.text
    let r = t.match(/^([\d.]+) is (\d+) tenths\. Share them into (\d+) equal parts\. What is ([\d.]+) ÷ (\d+)\?$/)
    if (r) {
      if (dec(r[2]) / BigInt(10) !== dec(r[1]) || r[4] !== r[1] || r[5] !== r[3]) fail(q, 'text restates different numbers')
      const p = q.picture
      if (p?.kind === 'tape') { if (p.rows[0].cells.length !== +r[3]) fail(q, 'tape part count'); if (p.rows[0].brace !== r[1]) fail(q, 'tape brace') }
      return str(dv(q, dec(r[1]), dec(r[3])))
    }
    r = t.match(/^Find ([\d.]+) ÷ (\d+)\.$/)
    if (r) { eqText(q, `${r[1]} ÷ ${r[2]} = ?`); return str(dv(q, dec(r[1]), dec(r[2]))) }
    r = t.match(/^([\d,.]+) ÷ (\d+) = ([\d,.]+)\. So what is ([\d.]+) ÷ (\d+)\?$/)
    if (r) {
      if (dv(q, dec(r[1]), dec(r[2])) !== dec(r[3])) fail(q, 'the given fact is false')
      const v = dv(q, dec(r[4]), dec(r[5]))
      return pick(q, c => onlyNum(c) === v)
    }
    r = t.match(/^What number goes in the box\? (.+)$/)
    if (r) {
      const v = solveEqn(q, r[1])
      const p = q.picture, e = r[1].match(/^\? ÷ (\d+) = ([\d.]+)$/)
      if (p?.kind === 'tape' && e) {
        const cells = p.rows[0].cells
        if (cells.length !== +e[1] || cells.some((c: any) => c.text !== e[2])) fail(q, 'tape parts differ from the text')
      }
      return str(v)
    }
    r = t.match(/is ([\d.]+) meters long\. \w+ cuts off ([\d.]+) meters\. Then the rest is cut into (\d+) equal pieces\. How long is each piece\?$/)
    if (r) { eqText(q, `${r[1]} − ${r[2]} = ?`); return str(dv(q, dec(r[1]) - dec(r[2]), dec(r[3]))) }
    return fail(q)
  },

  'g5m4-t9': q => {
    const t = q.text
    const tableCheck = (v: string) => {
      const p = q.picture
      if (p?.kind === 'table' && dec(p.rows[1][0]) !== dec(v)) fail(q, 'table row differs from the text')
    }
    let r = t.match(/^How many (\w+) is ([\d.,]+) (\w+)\?$/)
    if (r) {
      tableCheck(r[2])
      const p = q.picture
      if (p?.kind === 'table') { // the reference row must be a true fact
        const [a, b] = p.rows[0].map((x: string) => dec(x))
        if (convert(q, a, p.head[0].toLowerCase(), p.head[1].toLowerCase()) !== b) fail(q, 'reference row is wrong')
        if (p.head[0].toLowerCase() !== r[3] || p.head[1].toLowerCase() !== r[1]) fail(q, 'table headings differ from the text')
      }
      return str(convert(q, dec(r[2]), r[3], r[1]))
    }
    r = t.match(/^Change the units\. ([\d.,]+) (\w+) = \? (\w+)$/)
    if (r) { eqText(q, `${r[1]} ${r[2]} = ? ${r[3]}`); return str(convert(q, dec(r[1]), r[2], r[3])) }
    r = t.match(/ ([\d.,]+) (\w+)(?: long| of \w+)?\. Which is the same (?:weight|length|amount)\?$/)
    if (r) {
      const v = dec(r[1]), from = r[2]
      return pick(q, c => { const m = c.match(/^([\d.,]+) (\w+)$/) ?? fail(q, `choice "${c}"`); return convert(q, v, from, m[2]) === dec(m[1]) })
    }
    r = t.match(/ ([\d.,]+) (\w+)(?: long| of \w+)?\. \w+ (?:pours out|cuts off|uses|has walked) ([\d.,]+) (\w+)\. How many (\w+) are left(?: to walk)?\?$/)
    if (r) {
      const v = convert(q, dec(r[1]), r[2], r[5]) - convert(q, dec(r[3]), r[4], r[5])
      return v < BigInt(0) ? fail(q, 'negative left') : str(v)
    }
    return fail(q)
  },
}
