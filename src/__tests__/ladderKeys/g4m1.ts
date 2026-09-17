// Blind answer key for the g4m1 practice ladders. Written from the questions only
// (`npx tsx scripts/ladder-questions.mts g4m1 60`), never from the generator.
type Q = { text: string; picture: any; choices?: string[] }

const fail = (q: Q, why = 'no rule matches'): never => { throw new Error(`g4m1 key: ${why}: ${q.text}`) }
const num = (s: string) => Number(s.replace(/[,$]/g, ''))
const nums = (t: string) => (t.match(/\d[\d,]*/g) ?? []).map(num)
const fmt = (n: number) => String(n)

const SMALL: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
}
function under1000(words: string, q: Q): number {
  let total = 0
  for (const w of words.split(/[\s-]+/).filter(Boolean)) {
    if (w === 'hundred') { if (total < 1 || total > 9) fail(q, 'bad hundred'); total *= 100 }
    else if (w in SMALL) total += SMALL[w]
    else fail(q, `unknown word "${w}"`)
  }
  return total
}
function wordsToNumber(s: string, q: Q): number {
  const parts = s.trim().replace(/[.?]$/, '').split('thousand')
  if (parts.length > 2) fail(q, 'two thousands')
  if (parts.length === 1) return under1000(parts[0].replace(/,/g, ''), q)
  const low = parts[1].replace(/^,/, '').trim()
  return under1000(parts[0].replace(/,/g, ''), q) * 1000 + (low ? under1000(low, q) : 0)
}

const PLACE: Record<string, number> = {
  one: 1, ten: 10, hundred: 100, thousand: 1000, 'ten thousand': 10000, 'hundred thousand': 100000,
}
const unitOf = (t: string, q: Q) => {
  const m = t.match(/nearest (hundred thousand|ten thousand|thousand|hundred|ten)\b/)
  return m ? PLACE[m[1]] : fail(q, 'no rounding unit')
}
const round = (n: number, u: number) => Math.floor((n + u / 2) / u) * u

/** Exactly one choice must fit, or the question is defective. */
function one(q: Q, fits: (c: string) => boolean): string {
  const hits = (q.choices ?? fail(q, 'no choices')).filter(fits)
  if (hits.length !== 1) fail(q, `${hits.length} choices fit (${hits.join(' | ')})`)
  return hits[0]
}

function columnsCheck(q: Q, a: number, b: number) {
  const p = q.picture
  if (p?.kind === 'columns' && (num(p.rows[0]) !== a || num(p.rows[1]) !== b)) fail(q, 'picture disagrees with text')
}

// Story with a start amount then adds/takes, one sentence at a time.
const ADD = /\b(got|bought|baked|picked up)\b/
const TAKE = /\b(sold|handed out|gave away|dropped off|used)\b/
function story(q: Q): number {
  const sents = q.text.split(/(?<=\.)\s+/)
  let start: number | null = null, delta = 0, now: number | null = null
  for (const s of sents) {
    const n = nums(s)
    if (/^Now it has/.test(s)) { now = n[0]; continue }
    if (/\bhow many\b/i.test(s)) continue
    if (ADD.test(s) && n.length === 1) delta += n[0]
    else if (TAKE.test(s) && n.length === 1) delta -= n[0]
    else if (/\b(had|carried|held)\b/.test(s) && start === null && n.length === 1) start = n[0]
    else if (/\bhad some\b/.test(s) && n.length === 0) start = NaN
    else fail(q, `unread sentence "${s}"`)
  }
  if (start === null) fail(q, 'no start')
  if (Number.isNaN(start)) return now === null ? fail(q, 'no end amount') : now! - delta
  return start! + delta
}

export const SOLVE: Record<string, (q: Q) => string> = {
  'g4m1-t1': q => {
    const t = q.text
    let m = t.match(/^Write this number with digits: (.+)$/)
    if (m) return fmt(wordsToNumber(m[1], q))
    m = t.match(/^In ([\d,]+), what is the (\d) worth\?$/)
    if (m) {
      const digits = m[1].replace(/,/g, '')
      const at = [...digits].map((d, i) => (d === m![2] ? i : -1)).filter(i => i >= 0)
      if (at.length !== 1) fail(q, `digit appears ${at.length} times`)
      return fmt(Number(m[2]) * 10 ** (digits.length - 1 - at[0]))
    }
    m = t.match(/^Which number is (.+)\?$/)
    if (m) { const v = wordsToNumber(m[1], q); return one(q, c => num(c) === v) }
    m = t.match(/^Write the number that has (.+)\.$/)
    if (m) {
      let total = 0; const seen = new Set<string>()
      for (const [, d, place] of m[1].matchAll(/(\d+) (hundred thousand|ten thousand|thousand|hundred|ten|one)s?\b/g)) {
        if (seen.has(place)) fail(q, `place ${place} twice`)
        seen.add(place); total += Number(d) * PLACE[place]
      }
      if (!seen.size) fail(q)
      return fmt(total)
    }
    return fail(q)
  },

  'g4m1-t2': q => {
    const t = q.text
    let m = t.match(/^(?:What|Which) number is ([\d,]+) times ([\d,]+)\?$/)
    if (m) { const v = num(m[1]) * num(m[2]); return q.choices ? one(q, c => num(c) === v) : fmt(v) }
    m = t.match(/^How many (hundred thousand|ten thousand|thousand|hundred|ten|one)s make ([\d,]+)\?$/)
    if (m) {
      const v = num(m[2]) / PLACE[m[1]]
      if (!Number.isInteger(v)) fail(q, 'not a whole count')
      return fmt(v)
    }
    m = t.match(/^What number goes in the box\? ([\d,]+) × \? = ([\d,]+)$/)
    if (m) {
      const v = num(m[2]) / num(m[1])
      if (!Number.isInteger(v)) fail(q, 'not whole')
      return fmt(v)
    }
    m = t.match(/^A factory puts ([\d,]+) \w+ on each \w+\. ([\d,]+) \w+ go in an? \w+, and ([\d,]+) \w+ go in an? \w+\. How many/)
    if (m) return fmt(num(m[1]) * num(m[2]) * num(m[3]))
    return fail(q)
  },

  'g4m1-t3': q => {
    const t = q.text
    let m = t.match(/^Pick the sign that makes it true: ([\d,]+) __ ([\d,]+)$/)
    if (m) {
      const a = num(m[1]), b = num(m[2])
      const sign = a < b ? '<' : a > b ? '>' : '='
      return one(q, c => c === sign)
    }
    if (/^Which list goes from least to greatest\?$/.test(t)) {
      const shown = nums(q.picture?.text ?? '').sort((a, b) => a - b).join()
      return one(q, c => {
        const v = c.split(' < ').map(num)
        return v.every((x, i) => i === 0 || v[i - 1] < x) && [...v].sort((a, b) => a - b).join() === shown
      })
    }
    m = t.match(/^Which number goes in the box\? ([\d,]+) < \? < ([\d,]+)$/)
    if (m) { const lo = num(m[1]), hi = num(m[2]); return one(q, c => lo < num(c) && num(c) < hi) }
    m = t.match(/Which one has the (most|fewest) \w+\?$/)
    if (m) {
      const pairs = [...t.matchAll(/([A-Z]\w* [A-Z]\w*) has ([\d,]+)/g)].map(p => ({ name: p[1], n: num(p[2]) }))
      if (pairs.length < 2) fail(q, 'no places read')
      const best = m[1] === 'most' ? Math.max(...pairs.map(p => p.n)) : Math.min(...pairs.map(p => p.n))
      const winners = pairs.filter(p => p.n === best)
      if (winners.length !== 1) fail(q, 'tie')
      return one(q, c => c === winners[0].name)
    }
    return fail(q)
  },

  'g4m1-t4': q => {
    const t = q.text, u = unitOf(t, q)
    let m = t.match(/^Round ([\d,]+) to the nearest/)
    if (m) return fmt(round(num(m[1]), u))
    m = t.match(/^Which number rounds to ([\d,]+) when you round/)
    if (m) { const v = num(m[1]); return one(q, c => round(num(c), u) === v) }
    m = t.match(/rounds to ([\d,]+) when you round it to the nearest .*What is the (smallest|greatest) it could be\?$/)
    if (m) {
      const v = num(m[1])
      if (v % u) fail(q, 'target is not a multiple of the unit')
      return fmt(m[2] === 'smallest' ? Math.max(0, v - u / 2) : v + u / 2 - 1)
    }
    m = t.match(/ had ([\d,]+) \w+\. The news rounds it/)
    if (m) return fmt(round(num(m[1]), u))
    return fail(q)
  },

  'g4m1-t5': q => {
    const t = q.text
    let m = t.match(/^Add: ([\d,]+) \+ ([\d,]+)$/)
    if (m) { columnsCheck(q, num(m[1]), num(m[2])); return fmt(num(m[1]) + num(m[2])) }
    if (t === 'Which sum is right?') {
      return one(q, c => {
        const p = c.match(/^([\d,]+) \+ ([\d,]+) = ([\d,]+)$/) ?? fail(q, `odd choice ${c}`)
        columnsCheck(q, num(p[1]), num(p[2]))
        return num(p[1]) + num(p[2]) === num(p[3])
      })
    }
    if (t === 'What digit is missing from the top number?') {
      const p = q.picture
      if (p?.kind !== 'columns' || p.op !== '+' || !p.answer) fail(q, 'no sum picture')
      const hits = [...'0123456789'].filter(d => {
        const top = p.rows[0].replace('?', d)
        if (top.length > 1 && top[0] === '0') return false
        return num(top) + num(p.rows[1]) === num(p.answer)
      })
      if (hits.length !== 1) fail(q, `${hits.length} digits fit`)
      return hits[0]
    }
    m = t.match(/ ([\d,]+) \w+ (?:in|on) \w+, ([\d,]+) (?:in|on) \w+ and ([\d,]+) (?:in|on) \w+\. How many .* in all\?$/)
    if (m) return fmt(num(m[1]) + num(m[2]) + num(m[3]))
    return fail(q)
  },

  'g4m1-t6': q => {
    const t = q.text
    let m = t.match(/^Subtract: ([\d,]+) − ([\d,]+)$/)
    if (m) { columnsCheck(q, num(m[1]), num(m[2])); return fmt(num(m[1]) - num(m[2])) }
    if (t === 'Which answer is right?') {
      return one(q, c => {
        const p = c.match(/^([\d,]+) − ([\d,]+) = ([\d,]+)$/) ?? fail(q, `odd choice ${c}`)
        if (q.picture?.text && q.picture.text !== `${p[1]} − ${p[2]}`) fail(q, 'picture disagrees with choice')
        return num(p[1]) - num(p[2]) === num(p[3])
      })
    }
    m = t.match(/^What number goes in the box\? ([\d,]+) − \? = ([\d,]+)$/)
    if (m) return fmt(num(m[1]) - num(m[2]))
    m = t.match(/ (?:grew|made|printed) ([\d,]+) \w+\. It (?:sold|handed out) ([\d,]+) on \w+ and ([\d,]+) on \w+\. How many .* left\?$/)
    if (m) return fmt(num(m[1]) - num(m[2]) - num(m[3]))
    return fail(q)
  },

  'g4m1-t7': q => {
    const t = q.text, u = unitOf(t, q)
    let m = t.match(/About how much is ([\d,]+) ([+−]) ([\d,]+)\?$/)
    if (m) {
      const a = round(num(m[1]), u), b = round(num(m[3]), u)
      return fmt(m[2] === '+' ? a + b : a - b)
    }
    m = t.match(/says ([\d,]+) ([+−]) ([\d,]+) = ([\d,]+)\. .*Is his answer about right\?$/)
    if (m) {
      const a = round(num(m[1]), u), b = round(num(m[3]), u)
      const gap = Math.abs((m[2] === '+' ? a + b : a - b) - num(m[4]))
      // ponytail: "about right" = within half a rounding unit; the lesson's own example is 230 off → yes.
      if (gap >= u / 2 && gap < u) fail(q, `claim is ${gap} off the estimate — neither clearly close nor far`)
      return one(q, c => c === (gap < u / 2 ? 'yes' : 'no'))
    }
    m = t.match(/\? \+ ([\d,]+) is about ([\d,]+)\. Which number could go in the box\?$/)
    if (m) {
      const b = round(num(m[1]), u), target = num(m[2])
      return one(q, c => round(num(c), u) + b === target)
    }
    m = t.match(/wants to collect ([\d,]+) \w+\. .* brought ([\d,]+) and .* brought ([\d,]+)\. Round each .*About how many more/)
    if (m) return fmt(round(num(m[1]), u) - round(num(m[2]), u) - round(num(m[3]), u))
    return fail(q)
  },

  'g4m1-t8': q => {
    const t = q.text
    let m = t.match(/wants to save \$([\d,]+)\. \w+ saved \$([\d,]+) last year and \$([\d,]+) this year\. How much more/)
    if (m) return fmt(num(m[1]) - num(m[2]) - num(m[3]))
    m = t.match(/ ([\d,]+) \w+ (?:on|in) \w+ and ([\d,]+) \w+ (?:on|in) \w+\. (?:Its|Their) goal is ([\d,]+) \w+\. How many more/)
    if (m) return fmt(num(m[3]) - num(m[1]) - num(m[2]))
    m = t.match(/^(.+) had ([\d,]+) \w+\. Then it got ([\d,]+) more\. (.+) has ([\d,]+) \w+\. How many more \w+ does \4 have than \1 now\?$/)
    if (m) return fmt(num(m[5]) - num(m[2]) - num(m[3]))
    const v = story(q)
    if (q.choices) return one(q, c => { const p = c.match(/^([\d,]+) \w+$/); return !!p && num(p[1]) === v })
    return fmt(v)
  },
}
