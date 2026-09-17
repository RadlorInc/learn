// Blind answer key for g6m3's practice ladders — written from the printed questions
// (`npx tsx scripts/ladder-questions.mts g6m3 N`), never from the generator.
// Exact rational arithmetic (integer numerator/denominator), so no float error.
type Q = { text: string; picture: any; choices?: string[] }

const fail = (q: Q): never => { throw new Error(`g6m3 key: no rule for "${q.text}"`) }

type F = { p: number; q: number }
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a))
const mk = (p: number, q: number): F => {
  if (!q) throw new Error('g6m3 key: divide by zero')
  const g = gcd(p, q) * Math.sign(q)
  return { p: p / g, q: q / g }
}
/** "1,440" / "$4.44" / "0.25" → exact fraction. */
const num = (s: string): F => {
  const t = s.replace(/[$,]/g, '')
  if (!/^\d+(\.\d+)?$/.test(t)) throw new Error(`g6m3 key: not a number "${s}"`)
  const [w, d = ''] = t.split('.')
  const q = 10 ** d.length
  return mk(Number(w) * q + Number(d || 0), q)
}
const add = (a: F, b: F) => mk(a.p * b.q + b.p * a.q, a.q * b.q)
const sub = (a: F, b: F) => mk(a.p * b.q - b.p * a.q, a.q * b.q)
const mul = (a: F, b: F) => mk(a.p * b.p, a.q * b.q)
const dvd = (a: F, b: F) => mk(a.p * b.q, a.q * b.p)
const eq = (a: F, b: F) => a.p === b.p && a.q === b.q
const lt = (a: F, b: F) => a.p * b.q < b.p * a.q
const whole = (a: F, q: Q): F => {
  if (a.q !== 1) throw new Error(`g6m3 key: answer not whole in "${q.text}"`)
  return a
}
const floor = (a: F) => mk(Math.floor(a.p / a.q), 1)

/** Terminating decimal as a plain string ("12.35"); throws if it does not terminate. */
function str(a: F, q: Q): string {
  let d = a.q, k = 0
  while (d % 10 === 0) { d /= 10; k++ }
  while (d % 2 === 0) { d /= 2; k++ }
  while (d % 5 === 0) { d /= 5; k++ }
  if (d !== 1) throw new Error(`g6m3 key: ${a.p}/${a.q} does not terminate in "${q.text}"`)
  const scaled = (a.p * 10 ** k) / a.q
  const neg = scaled < 0
  const digits = String(Math.abs(Math.round(scaled))).padStart(k + 1, '0')
  const out = k ? `${digits.slice(0, -k)}.${digits.slice(-k)}`.replace(/\.?0+$/, '') : digits
  return (neg ? '-' : '') + out
}

const N = String.raw`\$?\d[\d,]*(?:\.\d+)?`
const re = (src: string) => new RegExp(src.replace(/#/g, `(${N})`))

/** Exactly one choice must fit, or the question is defective. */
function pick(q: Q, fits: (c: string) => boolean): string {
  const ok = (q.choices ?? []).filter(fits)
  if (ok.length !== 1) throw new Error(`g6m3 key: ${ok.length} choices fit "${q.text}" ${JSON.stringify(q.choices)}`)
  return ok[0]
}
const op = (a: F, o: string, b: F): F =>
  o === '+' ? add(a, b) : o === '−' ? sub(a, b) : o === '×' ? mul(a, b) : dvd(a, b)

/** Shared: "? o b = c" / "a o ? = c" missing-number boxes. */
function box(q: Q): string | null {
  let m = q.text.match(re(String.raw`^What number goes in the box\? \? ([+−×÷]) # = #$`))
  if (m) {
    const b = num(m[2]), c = num(m[3])
    return str(m[1] === '+' ? sub(c, b) : m[1] === '−' ? add(c, b) : m[1] === '×' ? dvd(c, b) : mul(c, b), q)
  }
  m = q.text.match(re(String.raw`^What number goes in the box\? # ([+×]) \? = #$`))
  if (m) return str(m[2] === '+' ? sub(num(m[3]), num(m[1])) : dvd(num(m[3]), num(m[1])), q)
  return null
}

/** Shared: a bare "a o b" computation phrased several ways. */
function bare(q: Q): string | null {
  const m =
    q.text.match(re(String.raw`^(?:Add|Take away|Divide)\. # ([+−×÷]) # = \?$`)) ??
    q.text.match(re(String.raw`^Find # ([+−×÷]) #\.$`))
  return m ? str(op(num(m[1]), m[2], num(m[3])), q) : null
}

export const SOLVE: Record<string, (q: Q) => string> = {
  'g6m3-t1': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    const b = bare(q) ?? box(q)
    if (b !== null) return b
    if ((m = t.match(re(String.raw`^Which answer is right\? # ([+−]) #$`)))) {
      const v = op(num(m[1]), m[2], num(m[3]))
      return pick(q, c => eq(num(c), v))
    }
    if ((m = t.match(re(String.raw`^A backpack can hold # kilograms\. You pack # kilograms of books and # kilograms of food\. How many more kilograms can it hold\?$`))) ||
        (m = t.match(re(String.raw`^A bike trail is # kilometers long\. You ride # kilometers before lunch and # kilometers after lunch\. How many kilometers are left to ride\?$`))))
      return str(sub(num(m[1]), add(num(m[2]), num(m[3]))), q)
    return fail(q)
  },

  'g6m3-t2': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    const b = bare(q)
    if (b !== null) return b
    if ((m = t.match(re(String.raw`^Without the points, # × # = #\. Now put the point in\. # × # = \?$`))))
      return str(mul(num(m[4]), num(m[5])), q)
    if ((m = t.match(re(String.raw`^Only one answer has the point in the right place\. Which is # × #\?$`)))) {
      const v = mul(num(m[1]), num(m[2]))
      return pick(q, c => eq(num(c), v))
    }
    if ((m = t.match(re(String.raw`^A garden bed is # meters long and # meters wide\. What is its area in square meters\?$`))))
      return str(mul(num(m[1]), num(m[2])), q)
    if ((m = t.match(re(String.raw`^One meter of chain weighs # kilograms\. How much do # meters of chain weigh, in kilograms\?$`))))
      return str(mul(num(m[1]), num(m[2])), q)
    if ((m = t.match(re(String.raw`^A (?:yard|room) is # meters by # meters\. A (?:patio in it|rug on its floor) is # meters by # meters\. How many square meters are not covered\?$`))))
      return str(sub(mul(num(m[1]), num(m[2])), mul(num(m[3]), num(m[4]))), q)
    return fail(q)
  },

  'g6m3-t3': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    const b = bare(q) ?? box(q)
    if (b !== null) return b
    if ((m = t.match(re(String.raw`^The digits are right in every answer, but only one has the point in the right place\. Which is # ÷ #\?$`)))) {
      const v = dvd(num(m[1]), num(m[2]))
      return pick(q, c => eq(num(c), v))
    }
    if ((m = t.match(re(String.raw`^A rope # meters long is cut into # equal pieces\. How long is each piece, in meters\?$`))))
      return str(dvd(num(m[1]), num(m[2])), q)
    if ((m = t.match(re(String.raw`^# friends share # kilograms of rice equally\. How many kilograms does each friend get\?$`))))
      return str(dvd(num(m[2]), num(m[1])), q)
    if ((m = t.match(re(String.raw`^A ribbon is # meters long\. You cut off # meters\. Then you cut the rest into # equal pieces\. How long is each piece, in meters\?$`))))
      return str(dvd(sub(num(m[1]), num(m[2])), num(m[3])), q)
    return fail(q)
  },

  'g6m3-t4': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    const b = bare(q) ?? box(q)
    if (b !== null) return b
    if ((m = t.match(re(String.raw`^Both numbers were made # times bigger\. Use that to find # ÷ #\.$`))))
      return str(dvd(num(m[2]), num(m[3])), q)
    if ((m = t.match(re(String.raw`^Which division has the same answer as # ÷ #\?$`)))) {
      const v = dvd(num(m[1]), num(m[2]))
      return pick(q, c => {
        const cm = c.match(re(String.raw`^# ÷ #$`))
        if (!cm) throw new Error(`g6m3 key: unreadable choice "${c}"`)
        return eq(dvd(num(cm[1]), num(cm[2])), v)
      })
    }
    // "How many bottles/pieces" — only full ones count.
    if ((m = t.match(re(String.raw`^A bottle holds # liters\. How many bottles can you fill from # liters of water\?$`))))
      return str(floor(dvd(num(m[2]), num(m[1]))), q)
    if ((m = t.match(re(String.raw`^A ribbon is # meters long\. You cut it into pieces that are # meters long\. How many pieces do you get\?$`))))
      return str(floor(dvd(num(m[1]), num(m[2]))), q)
    return fail(q)
  },

  'g6m3-t5': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    const b = box(q)
    if (b !== null) return b
    if ((m = t.match(re(String.raw`^(?:Use the table to guess each digit\. )?Find # ÷ #\.$`))))
      return str(dvd(num(m[1]), num(m[2])), q)
    if ((m = t.match(re(String.raw`^Four students found # ÷ # and got different answers\. Which answer is right\?$`)))) {
      const v = dvd(num(m[1]), num(m[2]))
      return pick(q, c => eq(num(c), v))
    }
    // "How many cases/boxes can it fill" — only full ones count.
    if ((m = t.match(re(String.raw`^A store gets # cans on Monday and # cans on Tuesday\. Each case holds # cans\. How many cases can it fill with all of them\?$`))) ||
        (m = t.match(re(String.raw`^A farm collects # eggs on Monday and # eggs on Tuesday\. Each box holds # eggs\. How many boxes can it fill with all of them\?$`))))
      return str(floor(dvd(add(num(m[1]), num(m[2])), num(m[3]))), q)
    return fail(q)
  },

  'g6m3-t6': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    if ((m = t.match(re(String.raw`^An? #-pack of [a-z ]+ costs #\. What is the price for one [a-z ]+\?$`))))
      return str(dvd(num(m[2]), num(m[1])), q)
    if (/^[A-Z][a-z ]+ come .+ Which is the better buy\?$/.test(t)) {
      const unit = (c: string): F => {
        const cm = c.match(re(String.raw`^# for #$`))
        if (!cm) throw new Error(`g6m3 key: unreadable choice "${c}"`)
        return dvd(num(cm[2]), num(cm[1]))
      }
      const prices = (q.choices ?? []).map(unit)
      const best = prices.reduce((a, b) => (lt(b, a) ? b : a))
      return pick(q, c => eq(unit(c), best))
    }
    if ((m = t.match(re(String.raw`^You buy # [a-z ]+ at # each and pay with a # bill\. How much change do you get, in dollars\?$`))))
      return str(sub(num(m[3]), mul(num(m[1]), num(m[2]))), q)
    if ((m = t.match(re(String.raw`^# friends buy pizza for # and drinks for #\. They split the bill equally\. How much does each friend pay, in dollars\?$`))))
      return str(dvd(add(num(m[2]), num(m[3])), num(m[1])), q)
    if ((m = t.match(re(String.raw`^Pencils cost # each\. You pay with a # bill and get # in change\. How many pencils did you buy\?$`))))
      return str(whole(dvd(sub(num(m[2]), num(m[3])), num(m[1])), q), q)
    return fail(q)
  },
}
