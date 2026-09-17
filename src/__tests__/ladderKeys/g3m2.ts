// Blind answer key for g3m2's practice ladders. Written from the QUESTIONS only
// (`npx tsx scripts/ladder-questions.mts g3m2 N`), never from the generator.
type Q = { text: string; picture: any; choices?: string[] }

const fail = (q: Q): never => { throw new Error(`g3m2 key: no rule for: ${q.text}`) }
const num = (s: string) => Number(s.replace(/,/g, ''))
const time = (h: number, m: number) => `${h}:${String(m).padStart(2, '0')}`
const toMin = (s: string) => { const [h, m] = s.split(':').map(Number); return h * 60 + m }
const fromMin = (t: number) => { const h = Math.floor(t / 60) % 12; return time(h === 0 ? 12 : h, t % 60) }
const gap = (a: string, b: string) => { let d = toMin(b) - toMin(a); if (d < 0) d += 720; return d }
const roundTo = (n: number, to: number) => Math.floor((n + to / 2) / to) * to

/** Exactly one choice satisfies `ok`, or throw. */
function pick(q: Q, ok: (c: string) => boolean): string {
  const hits = (q.choices ?? []).filter(ok)
  if (hits.length !== 1) throw new Error(`g3m2 key: ${hits.length} choices fit: ${q.text} ${JSON.stringify(q.choices)}`)
  return hits[0]
}

function clock(q: Q): string {
  const p = q.picture
  if (p?.kind !== 'clock') fail(q)
  if (/^What time (is it|does this clock show)\?/.test(q.text)) return time(p.h, p.m)
  if (/(reads|says) this clock (as|shows) [\d:]+\. What time does it really show\?/.test(q.text))
    return pick(q, c => c === time(p.h, p.m))
  let r = q.text.match(/starts at (\d+):(\d+)\. The clock has no hands yet\. Which number will the long hand point to\?/)
  if (r) { const m = Number(r[2]); if (m % 5) fail(q); return String(m === 0 ? 12 : m / 5) }
  r = q.text.match(/long hand has moved (\d+) more numbers?\./)
  if (r) return fromMin(p.h * 60 + p.m + 5 * Number(r[1]))
  r = q.text.match(/leaves for school (\d+) minutes? later/)
  if (r) return fromMin(p.h * 60 + p.m + Number(r[1]))
  r = q.text.match(/short hand is between the (\d+) and the (\d+)\. The long hand is (\d+) little marks? past the (\d+)\./)
  if (r) {
    const a = Number(r[1]), b = Number(r[2])
    if (b !== (a % 12) + 1) fail(q)
    const past = Number(r[4]) % 12
    return time(a, past * 5 + Number(r[3]))
  }
  return fail(q)
}

function elapsed(q: Q): string {
  let r = q.text.match(/from (\d+:\d+) to (\d+:\d+)/)
  if (r) return String(gap(r[1], r[2]))
  r = q.text.match(/starts at (\d+:\d+) and ends at (\d+:\d+)\..*How long is it really\?/)
  if (r) { const d = gap(r[1], r[2]); return pick(q, c => c === `${d} minutes`) }
  r = q.text.match(/starts at (\d+:\d+)\. It lasts (\d+) minutes\. What time does it end\?/)
  if (r) return fromMin(toMin(r[1]) + Number(r[2]))
  r = q.text.match(/starts at (\d+:\d+)\. It ends at (\d+:\d+)\. How many minutes long is it\?/)
  if (r) return String(gap(r[1], r[2]))
  return fail(q)
}

function measure(q: Q): string {
  const p = q.picture
  if (p?.kind !== 'measure') fail(q)
  const v: number = p.value
  if (/^How heavy is .+\?$/.test(q.text) || /^How many (grams|kilograms|liters|milliliters) (does|of) .+ (weigh|are in the .+)\?/.test(q.text)) return String(v)
  let r = q.text.match(/says the .+ weighs ([\d,]+) grams\. Is that right\?/)
  if (r) {
    const claim = num(r[1])
    const below = Math.floor(v / p.labelEvery) * p.labelEvery
    const oneEach = below + (v - below) / p.step
    // right · read the mark below the needle · counted each mark as 1 gram
    const want = claim === v ? 'Yes. That is right.'
      : claim === v - p.step ? 'No. The needle is past that number, not on it.'
      : claim === oneEach ? `No. Each mark is worth ${p.step} grams, not 1 gram.`
      : fail(q)
    return pick(q, c => c === want)
  }
  if (/1 kilogram is 1,000 grams\. How many more grams does .+ need to weigh 1 kilogram\?/.test(q.text)) return String(1000 - v)
  r = q.text.match(/Then .+ that weighs ([\d,]+) grams goes on too\. How many grams are on the scale now\?/)
  if (r) return String(v + num(r[1]))
  r = q.text.match(/Each cup holds (\d+) milliliters\. How many cups can you fill from this jug\?/)
  if (r) return String(Math.floor(v / Number(r[1])))
  r = q.text.match(/pours (\d+) milliliters into each of (\d+) glasses\. How many milliliters are left in the jug\?/)
  if (r) return String(v - Number(r[1]) * Number(r[2]))
  return fail(q)
}

const SMALL = /bottle|bowl|cup|glass|mug|spoon|can of|carton/
const BIG = /pool|bucket|sink|fish tank|bathtub|tub|pot/
function capacity(q: Q): string {
  const r = q.text.match(/About how much does (.+) hold\?/)
  if (!r) return measure(q)
  const small = SMALL.test(r[1]), big = BIG.test(r[1])
  if (small === big) fail(q)
  return pick(q, c => c.endsWith(small ? ' milliliters' : ' liters'))
}

function rounding(to: number) {
  return (q: Q): string => {
    let r = q.text.match(/^Round ([\d,]+) to the nearest (ten|hundred)/)
    if (r) return String(roundTo(num(r[1]), to))
    r = q.text.match(/Which number rounds to ([\d,]+) when you round to the nearest/)
    if (r) { const t = num(r[1]); return pick(q, c => roundTo(num(c), to) === t) }
    r = q.text.match(/says ([\d,]+) rounds to ([\d,]+)\. Is \w+ right\?/) ?? q.text.match(/digit of ([\d,]+) and says it rounds to ([\d,]+)\. Is \w+ right\?/)
    if (r) {
      const n = num(r[1]), right = roundTo(n, to) === num(r[2])
      return pick(q, c => right ? c === `Yes. ${r![1]} rounds to ${r![2]}.` : c === `No. ${r![1]} rounds to ${roundTo(n, to)}.`)
    }
    if (/Round each number to the nearest (ten|hundred), then add\./.test(q.text)) {
      const m = q.picture?.text?.match(/^([\d,]+) \+ ([\d,]+)$/)
      const t = q.text.match(/([\d,]+) \w+ (?:on|in) \w+ and ([\d,]+) \w+ (?:on|in) \w+/)
      if (!m || !t || num(m[1]) !== num(t[1]) || num(m[2]) !== num(t[2])) fail(q)
      return String(roundTo(num(t![1]), to) + roundTo(num(t![2]), to))
    }
    return fail(q)
  }
}

function addSub(q: Q): string {
  const p = q.picture
  if (p?.kind === 'blocks' && /Trade 10 ones for 1 ten\. What number do these blocks show\?/.test(q.text))
    return String(100 * p.hundreds + 10 * p.tens + p.ones)
  let r = q.text.match(/The blocks show ([\d,]+)\. Take away ([\d,]+)\./)
  if (r) {
    if (p?.kind !== 'blocks' || 100 * p.hundreds + 10 * p.tens + p.ones !== num(r[1])) fail(q)
    return String(num(r[1]) - num(r[2]))
  }
  r = q.text.match(/gave away ([\d,]+) and has ([\d,]+) left\. How many .+ at the start\?/)
  if (r) return String(num(r[1]) + num(r[2]))
  if (p?.kind === 'columns') {
    const op = p.op === '+' ? (a: number, b: number) => a + b : p.op === '−' ? (a: number, b: number) => a - b : fail(q)
    const rows: string[] = p.rows
    if (/One digit is missing\./.test(q.text)) {
      const cells = [...rows, p.answer]
      const ok = [...Array(10).keys()].filter(d => {
        const [a, b, s] = cells.map(x => num(String(x).replace('?', String(d))))
        return op(a, b) === s
      })
      if (ok.length !== 1 || cells.join('').split('?').length !== 2) fail(q)
      return String(ok[0])
    }
    if (rows.length !== 2 || p.answer !== null) fail(q)
    const ans = op(num(rows[0]), num(rows[1]))
    // the text numbers must be the column numbers
    const said = (q.text.match(/\d[\d,]*/g) ?? []).map(num)
    if (!rows.every(x => said.includes(num(x)))) fail(q)
    if (/Which answer is right\?/.test(q.text)) return pick(q, c => num(c) === ans)
    return String(ans)
  }
  return fail(q)
}

export const SOLVE: Record<string, (q: Q) => string> = {
  'g3m2-t1': clock,
  'g3m2-t2': clock,
  'g3m2-t3': elapsed,
  'g3m2-t4': measure,
  'g3m2-t5': capacity,
  'g3m2-t6': rounding(10),
  'g3m2-t7': rounding(100),
  'g3m2-t8': addSub,
  'g3m2-t9': addSub,
}
