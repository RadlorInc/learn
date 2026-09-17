// Independent answer key for g5m1 ladders, part A (t1, t3, t4, t5, t6).
// Written from the question text only — never from the generator.
type Q = { text: string; picture: any; choices?: string[] }

const SUP: Record<string, string> = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' }
const num = (s: string) => Number(s.replace(/,/g, ''))
const nums = (s: string) => (s.match(/\d[\d,]*/g) ?? []).map(num)
/** "10⁴" → 10000, "35" → 35 */
const val = (s: string) => {
  const m = s.trim().match(/^(\d[\d,]*)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)?$/)
  if (!m) throw new Error(`not a number: ${s}`)
  return m[2] ? num(m[1]) ** Number([...m[2]].map(c => SUP[c]).join('')) : num(m[1])
}
const out = (n: number) => {
  if (!Number.isInteger(n)) throw new Error(`non-whole answer ${n}`)
  return String(n)
}
const fail = (q: Q): never => { throw new Error(`unknown question: ${q.text}`) }

/** A "which is true" choice list: the one choice whose sides are equal. */
const pickTrue = (q: Q, lhs: (s: string) => number, rhs: (s: string) => number) => {
  const ok = (q.choices ?? []).filter(c => { const [l, r] = c.split(' = '); return Math.abs(lhs(l) - rhs(r)) < 1e-9 })
  if (ok.length !== 1) throw new Error(`${ok.length} true choices: ${q.text} ${JSON.stringify(q.choices)}`)
  return ok[0]
}

// ---- metric units: value of one unit in a base unit
const UNIT: Record<string, [string, number]> = {
  km: ['len', 100000], m: ['len', 100], cm: ['len', 1], mm: ['len', 0.1],
  kg: ['mass', 1000], g: ['mass', 1], L: ['vol', 1000], mL: ['vol', 1],
  kilometers: ['len', 100000], meters: ['len', 100], centimeters: ['len', 1], millimeters: ['len', 0.1],
  kilograms: ['mass', 1000], grams: ['mass', 1], liters: ['vol', 1000], milliliters: ['vol', 1],
}
const conv = (n: number, from: string, to: string) => {
  const a = UNIT[from], b = UNIT[to]
  if (!a || !b || a[0] !== b[0]) throw new Error(`bad units ${from} → ${to}`)
  return Math.round((n * a[1] / b[1]) * 1e6) / 1e6
}
const U = '(kilometers|meters|centimeters|millimeters|kilograms|grams|liters|milliliters)'
const quantity = (s: string) => { const m = s.trim().match(/^(\d[\d,]*) (\w+)$/); if (!m) throw new Error(`not a quantity: ${s}`); return [num(m[1]), m[2]] as const }

const roundTo = (n: number, p: number) => Math.round(n / p) * p
const roundBiggest = (n: number) => roundTo(n, 10 ** (String(n).length - 1))

export const SOLVE_A: Record<string, (q: Q) => string> = {
  'g5m1-t1': q => {
    const t = q.text
    let m = t.match(/^In ([\d,]+), the (\d) is in the (tens|hundreds|thousands) place\. What is the \d worth if it slides one place to the (left|right)\?$/)
    if (m) {
      const place = { tens: 10, hundreds: 100, thousands: 1000 }[m[3] as 'tens']
      return out(num(m[2]) * place * (m[4] === 'left' ? 10 : 0.1))
    }
    if ((m = t.match(/^What number is 10 times as much as ([\d,]+)\?$/))) return out(10 * num(m[1]))
    if ((m = t.match(/^What number is 1\/10 of ([\d,]+)\?$/))) return out(num(m[1]) / 10)
    if ((m = t.match(/^How many (tens|hundreds|thousands) make ([\d,]+)\?$/)))
      return out(num(m[2]) / { tens: 10, hundreds: 100, thousands: 1000 }[m[1] as 'tens'])
    if (t === 'Which one is true?') return pickTrue(q, l => {
      let k = l.match(/^1\/10 of ([\d,]+)$/); if (k) return num(k[1]) / 10
      k = l.match(/^([\d,]+) × ([\d,]+)$/); if (k) return num(k[1]) * num(k[2])
      throw new Error(`choice side: ${l}`)
    }, val)
    if ((m = t.match(/^A (\w+) holds ([\d,]+) \w+\. A box holds 10 \w+, and a crate holds 10 boxes\. How many \w+ are in a crate\?$/)))
      return out(num(m[2]) * 100)
    if ((m = t.match(/^A crate holds 10 boxes, and each box holds 10 \w+\. The crate has ([\d,]+) \w+\. How many \w+ are in one \w+\?$/)))
      return out(num(m[1]) / 100)
    return fail(q)
  },

  'g5m1-t3': q => {
    const t = q.text
    let m = t.match(/^Write (10[⁰¹²³⁴⁵⁶⁷⁸⁹]+) as a number\.$/)
    if (m) return out(val(m[1]))
    if ((m = t.match(/^Write ([\d,]+) the short way, as 10 with a small number up top\. What is the small number\?$/))) {
      const n = num(m[1]), e = Math.round(Math.log10(n))
      if (10 ** e !== n) throw new Error(`not a power of ten: ${t}`)
      return out(e)
    }
    if ((m = t.match(/^Multiply\. ([\d,]+) × (10[⁰¹²³⁴⁵⁶⁷⁸⁹]+) = \?$/))) return out(num(m[1]) * val(m[2]))
    if ((m = t.match(/^Divide\. ([\d,]+) ÷ (10[⁰¹²³⁴⁵⁶⁷⁸⁹]+) = \?$/))) return out(num(m[1]) / val(m[2]))
    if (t === 'Which one is true?') return pickTrue(q, val, val)
    if ((m = t.match(/^A \w+ packs ([\d,]+) boxes of seeds each day\. Each box holds (10[⁰¹²³⁴⁵⁶⁷⁸⁹]+) seeds\. How many seeds does the \w+ pack in ([\d,]+) days\?$/)))
      return out(num(m[1]) * val(m[2]) * num(m[3]))
    if ((m = t.match(/^A \w+ has ([\d,]+) flowers\. It shares them equally among ([\d,]+) parks\. Each park plants its flowers in beds of (10[⁰¹²³⁴⁵⁶⁷⁸⁹]+)\. How many beds does each park fill\?$/)))
      return out(num(m[1]) / num(m[2]) / val(m[3]))
    return fail(q)
  },

  'g5m1-t4': q => {
    const t = q.text
    let m = t.match(/^[\d,]+ × [\d,]+ is close to [\d,]+ × [\d,]+\. Use a fact you know, then write the zeros\. What is ([\d,]+) × ([\d,]+)\?$/)
    if (m) return out(num(m[1]) * num(m[2]))
    const est = (a: number, b: number) => roundBiggest(a) * roundBiggest(b)
    if ((m = t.match(/^Round each number to its biggest place, then multiply\. Which is the best estimate for ([\d,]+) × ([\d,]+)\?$/))) {
      const e = est(num(m[1]), num(m[2]))
      const hit = (q.choices ?? []).filter(c => c.match(/^about ([\d,]+)$/) && num(c.slice(6)) === e)
      if (hit.length !== 1) throw new Error(`estimate ${e} not a single choice: ${t}`)
      return hit[0]
    }
    if ((m = t.match(/^Round each number to its biggest place, then multiply\. About how much is ([\d,]+) × ([\d,]+)\?$/)))
      return out(est(num(m[1]), num(m[2])))
    if ((m = t.match(/^A \w+ has ([\d,]+) \w+ to [\w ]+\. Each \w+ holds ([\d,]+) \w+\. Round the number you divide by to the nearest ten and the other number to the nearest hundred, then divide\. About how many \w+ can the \w+ fill\?$/)))
      return out(roundTo(num(m[1]), 100) / roundTo(num(m[2]), 10))
    if ((m = t.match(/^A \w+ buys ([\d,]+) boxes with ([\d,]+) pencils in each, and ([\d,]+) boxes with ([\d,]+) erasers in each\. Round each number to its biggest place, then multiply\. About how many pencils and erasers is that in all\?$/)))
      return out(est(num(m[1]), num(m[2])) + est(num(m[3]), num(m[4])))
    return fail(q)
  },

  'g5m1-t5': q => {
    const t = q.text
    let m = t.match(new RegExp(`^How many ${U} is ([\\d,]+) ${U}\\?$`))
    if (m) return out(conv(num(m[2]), m[3], m[1]))
    if ((m = t.match(new RegExp(`^.* ([\\d,]+) ${U}(?: of \\w+)?(?: long| to school)?\\. How many ${U} (?:long is it|is that|does it weigh|does it hold)\\?$`))))
      return out(conv(num(m[1]), m[2], m[3]))
    if (t === 'Which one is true?') {
      const base = (side: string) => { const [n, u] = quantity(side); if (!UNIT[u]) throw new Error(`unit ${u}`); return [n * UNIT[u][1], UNIT[u][0]] as const }
      if (!(q.choices ?? []).every(c => { const [l, r] = c.split(' = '); return base(l)[1] === base(r)[1] })) return fail(q)
      return pickTrue(q, l => base(l)[0], r => base(r)[0])
    }
    if ((m = t.match(/^What number goes in the box\? \? (\w+) = ([\d,]+) (\w+)$/))) return out(conv(num(m[2]), m[3], m[1]))
    return fail(q)
  },

  'g5m1-t6': q => {
    const t = q.text
    let m = t.match(new RegExp(`^.*? ([\\d,]+) ${U}(?: of \\w+)?(?: long)?\\. You (pour in|ladle out|cut off) ([\\d,]+) ${U}(?: more)?\\. How many ${U} of \\w+ (?:are in the \\w+ now|are left)\\?$`))
    if (m) {
      const a = conv(num(m[1]), m[2], m[6]), b = conv(num(m[4]), m[5], m[6])
      return out(m[3] === 'pour in' ? a + b : a - b)
    }
    if ((m = t.match(new RegExp(`^\\w+ walks ([\\d,]+) ${U}, then ([\\d,]+) ${U} more\\. How many ${U} does he walk in all\\?$`))))
      return out(conv(num(m[1]), m[2], m[5]) + conv(num(m[3]), m[4], m[5]))
    // "how many parts fit" — number sentence choice or the count
    const fit = t.match(new RegExp(`^A \\w+ (?:holds|is) ([\\d,]+) ${U}(?: of \\w+| long)?\\. Each [\\w ]+ (?:holds|needs) ([\\d,]+) ${U}\\. (Which number sentence finds how many [\\w ]+ you can (?:fill|make)|How many [\\w ]+ can you (?:fill|make))\\?$`))
    if (fit) {
      const whole = conv(num(fit[1]), fit[2], fit[4]), part = num(fit[3])
      if (fit[5].startsWith('How many')) return out(whole / part)
      // the sentence must divide the whole, in the part's unit, by the part — and equal the real count
      const hit = (q.choices ?? []).filter(c => { const k = c.match(/^([\d,]+) ÷ ([\d,]+)$/); return !!k && num(k[1]) === whole && num(k[2]) === part })
      if (hit.length !== 1) throw new Error(`${hit.length} matching sentences: ${t} ${JSON.stringify(q.choices)}`)
      return hit[0]
    }
    if ((m = t.match(new RegExp(`^.*? (?:makes|uses|runs) ([\\d,]+) ${U} (?:of \\w+ )?each day\\. How many ${U} (?:of \\w+ )?does (?:it|she) (?:make|use|run) in ([\\d,]+) days\\?$`))))
      return out(conv(num(m[1]), m[2], m[3]) * num(m[4]))
    if ((m = t.match(new RegExp(`^A \\w+ (?:holds|is) ([\\d,]+) ${U}(?: of \\w+| long)?\\. You (?:fill|pour|cut) ([\\d,]+) \\w+ of ([\\d,]+) ${U} each\\. How many ${U} of \\w+ (?:are|is) left\\?$`))))
      return out(conv(num(m[1]), m[2], m[6]) - num(m[3]) * conv(num(m[4]), m[5], m[6]))
    return fail(q)
  },
}
