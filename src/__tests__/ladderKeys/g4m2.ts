// Independent answer key for g4m2's generated practice ladders — written from the QUESTIONS
// (`npx tsx scripts/ladder-questions.mts g4m2 60`), never from the generator.
type Q = { text: string; picture: any; choices?: string[] }

const n = (s: string) => Number(s.replace(/,/g, ''))
const nums = (s: string) => (s.match(/\d[\d,]*/g) ?? []).map(n)
const fail = (q: Q): never => { throw new Error(`g4m2: no rule for: ${q.text}`) }
const one = (q: Q, ok: (c: string) => boolean): string => {
  const hits = (q.choices ?? []).filter(ok)
  if (hits.length !== 1) throw new Error(`g4m2: ${hits.length} choices fit: ${q.text} ${JSON.stringify(q.choices)}`)
  return hits[0]
}
const isPrime = (x: number) => { if (x < 2) return false; for (let d = 2; d * d <= x; d++) if (x % d === 0) return false; return true }
const ord = (s: string) => Number(s.match(/(\d+)(?:st|nd|rd|th)/)![1])

// "a op b = c" with one "?" — solve for it.
function box(q: Q): string | null {
  const m = q.text.match(/([\d,]+|\?) ([×÷]) ([\d,]+|\?) = ([\d,]+|\?)/)
  if (!m) return null
  const [, a, op, b, c] = m
  if (op === '×') {
    if (c === '?') return String(n(a) * n(b))
    const r = a === '?' ? n(c) / n(b) : n(c) / n(a)
    if (!Number.isInteger(r)) fail(q)
    return String(r)
  }
  if (c === '?') { const r = n(a) / n(b); if (!Number.isInteger(r)) fail(q); return String(r) }
  if (a === '?') return String(n(b) * n(c))
  const r = n(a) / n(c); if (!Number.isInteger(r)) fail(q); return String(r)
}
// "Which one is true/right?" over "a op b = c" choices.
const eqTrue = (q: Q) => one(q, c => {
  const m = c.match(/^([\d,]+) ([×÷]) ([\d,]+) = ([\d,]+)$/)
  if (!m) fail(q)
  const [, a, op, b, r] = m!
  return (op === '×' ? n(a) * n(b) : n(a) / n(b)) === n(r)
})
const arith = (q: Q) => {
  let m = q.text.match(/(?:What is )?([\d,]+) ([×÷]) ([\d,]+)(?:\?| = \?)/)
  if (m && !q.text.includes('box')) {
    const r = m[2] === '×' ? n(m[1]) * n(m[3]) : n(m[1]) / n(m[3])
    if (!Number.isInteger(r)) fail(q)
    return String(r)
  }
  if (/Which one is (true|right)\?/.test(q.text)) return eqTrue(q)
  return box(q)
}

export const SOLVE: Record<string, (q: Q) => string> = {
  'g4m2-t1': q => {
    const t = q.text
    let m = t.match(/^What number is (\d+) times as many as (\d+)\?$/)
    if (m) return String(+m[1] * +m[2])
    m = t.match(/^\w+ has (\d+) (\w+)\. \w+ has (\d+) \2\. \w+ has how many times as many \2 as \w+\?$/)
    if (m) { const r = +m[1] / +m[3]; if (!Number.isInteger(r)) fail(q); return String(r) }
    m = t.match(/^\w+ has (\d+) (\w+)\. \w+ has (\d+) times as many (?:\2 )?as \w+\. How many \2 (does \w+ have|do they have together)\?$/)
    if (!m) return fail(q)
    const base = +m[1], k = +m[3]
    const ans = m[4].startsWith('do they') ? base + base * k : base * k
    if (q.choices) return one(q, c => c === `${ans} ${m![2]}`)
    return String(ans)
  },
  'g4m2-t2': q => {
    const t = q.text
    let m = t.match(/^(\d+) tiles make rectangles\..*With (\d+) rows, how many tiles go in each row\?$/)
    if (m) { const r = +m[1] / +m[2]; if (!Number.isInteger(r)) fail(q); return String(r) }
    m = t.match(/^How many different rectangles can you make with all (\d+) tiles\?/)
    if (m) { const N = +m[1]; let c = 0; for (let a = 1; a * a <= N; a++) if (N % a === 0) c++; return String(c) }
    m = t.match(/^Which pair of numbers makes a rectangle with all (\d+) tiles\?$/)
    if (m) return one(q, c => { const [a, b] = c.split(' × ').map(Number); return a * b === +m![1] })
    m = t.match(/^A baker bakes (\d+) trays with (\d+) muffins on each tray\. She puts all the muffins in (\d+) equal rows/)
    if (m) { const r = (+m[1] * +m[2]) / +m[3]; if (!Number.isInteger(r)) fail(q); return String(r) }
    return box(q) ?? fail(q)
  },
  'g4m2-t3': q => {
    const t = q.text
    let m = t.match(/^Is (\d+) prime or composite\?$/) ?? t.match(/composite\. Which is (\d+)\?$/)
    if (m) return one(q, c => c === (isPrime(+m![1]) ? 'prime' : 'composite'))
    m = t.match(/^(\d+) is composite\. Which rows make a second rectangle with all \1 chairs\?$/)
    if (m) return one(q, c => { const [r, k] = nums(c); return r * k === +m![1] && r !== 1 && k !== 1 })
    if (t === 'Which number is prime?') return one(q, c => isPrime(n(c)))
    m = t.match(/^(\w+) has (\d+) chairs\..*so \1 says \2 is prime\. Is he right\?$/)
    if (m) { const N = +m[2]; return one(q, c => c === (isPrime(N) ? `${m![1]} is right. ${N} is prime.` : `${m![1]} is wrong. ${N} is composite.`)) }
    return fail(q)
  },
  'g4m2-t4': q => {
    const t = q.text
    let m = t.match(/^A frog starts at (\d+) and jumps (\d+) spaces each time\. Where is its \d+(?:st|nd|rd|th) landing\?$/)
    if (m) return String(+m[1] + ord(t) * +m[2])
    m = t.match(/^Count by (\d+)s from (\d+): .*What is the \d+(?:st|nd|rd|th) number you land on\?$/)
    if (m) return String(+m[2] + ord(t) * +m[1])
    m = t.match(/^Count by (\d+)s from (\d+)\. Do you land on (\d+)\?$/)
    if (m) { const d = +m[3] - +m[2]; return one(q, c => c === (d > 0 && d % +m![1] === 0 ? 'yes' : 'no')) }
    m = t.match(/^A frog jumps (\d+) spaces each time, starting at (\d+)\. It lands on (\d+)\. Which landing is that\?$/)
    if (m) { const k = (+m[3] - +m[2]) / +m[1]; if (!Number.isInteger(k) || k < 1) fail(q); return String(k) }
    m = t.match(/^A frog jumps (\d+) spaces each time, starting at (\d+)\. It makes (\d+) jumps, rests, then makes (\d+) more jumps\. Where does it land\?$/)
    if (m) return String(+m[2] + (+m[3] + +m[4]) * +m[1])
    return fail(q)
  },
  'g4m2-t5': q => {
    const m = q.text.match(/^A store gets (\d+) boxes\. Each box has (\d+) \w+\. Each \w+ has (\d+) \w+\. How many \w+ is that\?$/)
    if (m) return String(+m[1] * +m[2] * +m[3])
    return arith(q) ?? fail(q)
  },
  'g4m2-t6': q => {
    const m = q.text.match(/^A game shop has (\d+) packs of (\d+) cards and (\d+) packs of (\d+) cards\. How many cards is that in all\?$/)
    if (m) return String(+m[1] * +m[2] + +m[3] * +m[4])
    return arith(q) ?? fail(q)
  },
  'g4m2-t7': q => {
    const m = q.text.match(/^A teacher has (\d+) packs of stickers with (\d+) stickers in each pack\. She shares all of them equally among (\d+) kids\./)
    if (m) { const r = (+m[1] * +m[2]) / +m[3]; if (!Number.isInteger(r)) fail(q); return String(r) }
    return arith(q) ?? fail(q)
  },
  'g4m2-t8': q => {
    const t = q.text
    let m = t.match(/^You have (\d+) stickers\. Each page holds (\d+)\. How many pages can you fill all the way\?$/)
    if (m) return String(Math.floor(+m[1] / +m[2]))
    m = t.match(/^(\d+) marbles go into groups of (\d+)\. After you make every full group you can, how many marbles are left over\?$/)
    if (m) return String(+m[1] % +m[2])
    m = t.match(/^\w+ puts (\d+) beads into bags of (\d+)\. Which is right\?$/)
    if (m) return one(q, c => { const [b, l] = nums(c); return b * +m![2] + l === +m![1] && l < +m![2] })
    m = t.match(/^\w+ fills (\d+) pages with (\d+) stickers on each page\. (\d+) stickers? (?:is|are) left over\./)
    if (m) return String(+m[1] * +m[2] + +m[3])
    m = t.match(/^A van has (\d+) seats\. (\d+) kids go on a trip\. How many vans/)
    if (m) return String(Math.ceil(+m[2] / +m[1]))
    return fail(q)
  },
}
