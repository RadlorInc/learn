// Independent answer key for g6m7 ladder questions — written from the QUESTIONS
// (scripts/ladder-questions.mts output), never from the generator.
type Q = { text: string; picture: any; choices?: string[] }

const fail = (q: Q): never => { throw new Error(`g6m7 solver: no rule for "${q.text}"`) }
const num = (s: string): number => Number(String(s).replace(/[$,]/g, ''))
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const mean = (xs: number[]) => sum(xs) / xs.length
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b), m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
const range = (xs: number[]) => Math.max(...xs) - Math.min(...xs)
const mode = (xs: number[], q: Q): number => {
  const c = new Map<number, number>()
  for (const x of xs) c.set(x, (c.get(x) ?? 0) + 1)
  const top = Math.max(...c.values())
  const ms = [...c].filter(([, n]) => n === top).map(([v]) => v)
  if (ms.length !== 1 || top < 2) throw new Error(`g6m7 solver: no single mode in "${q.text}" (${ms})`)
  return ms[0]
}
const str = (n: number): string => {
  if (!Number.isFinite(n)) throw new Error(`g6m7 solver: bad number ${n}`)
  return String(Math.round(n * 1e6) / 1e6)
}
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a))
const frac = (a: number, b: number) => { const g = gcd(a, b) || 1; return `${a / g}/${b / g}` }
const fracVal = (s: string): number => { const [a, b] = s.split('/').map(Number); return b === undefined ? a : a / b }

/** Every non-empty cell of a table's rows, as numbers (row head dropped when rowHead). */
const rowNums = (p: any, r = 0): number[] =>
  (p.rows[r] as string[]).slice(p.rowHead ? 1 : 0).filter(c => c !== '' && c !== '?').map(num)
const numlinePts = (p: any): number[] => (p.points as { at: number }[]).map(x => x.at)
/** Dot plot expanded to one value per ✕. */
const dotData = (p: any): number[] =>
  (p.labels as string[]).flatMap((l, i) => Array<number>(p.values[i]).fill(num(l)))
const dotCount = (p: any, keep: (v: number) => boolean): number =>
  sum((p.labels as string[]).map((l, i) => (keep(num(l)) ? p.values[i] : 0)))

const one = (q: Q, fits: (c: string) => boolean): string => {
  const ok = (q.choices ?? []).filter(fits)
  if (ok.length !== 1) throw new Error(`g6m7 solver: ${ok.length} choices fit "${q.text}": ${JSON.stringify(ok)}`)
  return ok[0]
}

const chanceWord = (p: number): string =>
  p === 0 ? 'impossible' : p === 1 ? 'certain' : Math.abs(p - 0.5) < 1e-9 ? 'equally likely' : p < 0.5 ? 'unlikely' : 'likely'

/** The one value far from the rest: its distance to the others' median beats the others' range, twice over. */
const outlier = (xs: number[]): number | null => {
  const found = xs.filter((x, i) => {
    const rest = xs.filter((_, j) => j !== i)
    return Math.abs(x - median(rest)) > 2 * Math.max(range(rest), 1)
  })
  return found.length === 1 ? found[0] : null
}

export const SOLVE: Record<string, (q: Q) => string> = {
  'g6m7-t1': q => {
    const t = q.text, p = q.picture
    if (/share the cubes fairly/.test(t)) return str(mean(p.values))
    if (/^What is the mean of/.test(t)) return str(mean(rowNums(p)))
    if (/^Which one finds the mean of/.test(t)) {
      const xs = rowNums(p)
      return one(q, c => {
        const m = c.match(/^(\d+) ÷ (\d+) = (\d+)$/)
        return !!m && +m[1] === sum(xs) && +m[2] === xs.length && +m[3] === mean(xs)
      })
    }
    let m = t.match(/The mean of (\d+) quiz scores is (\d+)/)
    if (m) return str(+m[1] * +m[2] - sum(rowNums(p)))
    if (/How many points higher is the bigger mean/.test(t)) return str(Math.abs(mean(rowNums(p, 0)) - mean(rowNums(p, 1))))
    return fail(q)
  },

  'g6m7-t2': q => {
    const t = q.text, p = q.picture
    if (/middle height/.test(t)) return str(median(numlinePts(p)))
    if (/Who is right\?$/.test(t)) {
      const med = median(rowNums(p))
      return one(q, name => {
        const m = t.match(new RegExp(`${name} [^.]*? got (\\d+(?:\\.\\d+)?)\\.`))
        return !!m && +m[1] === med
      })
    }
    if (/Each ✕ is one kid\. What is the median\?/.test(t)) return str(median(dotData(p)))
    if (/median/.test(t) && p.kind === 'table') return str(median(rowNums(p)))
    return fail(q)
  },

  'g6m7-t3': q => {
    const t = q.text, p = q.picture
    if (/Which sentence is true\?/.test(t)) {
      const md = mode(dotData(p), q)
      return one(q, c => { const m = c.match(/^The mode is (\d+)\.$/); return !!m && +m[1] === md })
    }
    if (/Which number is the most common\?/.test(t)) return str(mode(dotData(p), q))
    if (/The table shows how many kids/.test(t)) {
      const vals = (p.head as string[]).slice(1).map(num), counts = rowNums(p)
      return str(mode(vals.flatMap((v, i) => Array<number>(counts[i]).fill(v)), q))
    }
    if (/difference between the two classes' modes/.test(t)) return str(Math.abs(mode(rowNums(p, 0), q) - mode(rowNums(p, 1), q)))
    if (/What is the mode\?/.test(t)) return str(mode(rowNums(p), q))
    return fail(q)
  },

  'g6m7-t4': q => {
    const t = q.text, p = q.picture
    if (/biggest score minus the smallest/.test(t)) return str(range(numlinePts(p)))
    if (/What is the range of these numbers\?|What is the range really\?/.test(t)) return str(range(rowNums(p)))
    const m = t.match(/The range of these \d+ scores is (\d+)\. The missing score is the (biggest|smallest) one/)
    if (m) {
      const xs = rowNums(p), r = +m[1]
      const v = m[2] === 'biggest' ? Math.min(...xs) + r : Math.max(...xs) - r
      if (m[2] === 'biggest' ? v < Math.max(...xs) : v > Math.min(...xs)) throw new Error(`g6m7 solver: missing score is not the ${m[2]}: "${t}"`)
      return str(v)
    }
    if (/How much bigger is the larger range\?/.test(t)) return str(Math.abs(range(rowNums(p, 0)) - range(rowNums(p, 1))))
    return fail(q)
  },

  'g6m7-t5': q => {
    const t = q.text
    const lm = t.match(/(?:get|are|kids) ((?:\$?\d+, )+\$?\d+ and \$?\d+)/)
    if (!lm) return fail(q)
    const xs = lm[1].split(/, | and /).map(num)
    if (xs.length !== 5) return fail(q)
    const mn = mean(xs), md = median(xs), out = outlier(xs)
    if (/What is the mean\?/.test(t)) return str(mn)
    if (/How far apart are the mean and the median\?/.test(t)) return str(Math.abs(mn - md))
    const pm = t.match(/Which way does the \$?(\d+) pull the mean\?/)
    if (pm) {
      const v = +pm[1], i = xs.indexOf(v)
      if (i < 0) return fail(q)
      const rest = mean(xs.filter((_, j) => j !== i))
      return one(q, c => c === (v > rest ? 'up' : v < rest ? 'down' : 'it does not move'))
    }
    if (out === null) throw new Error(`g6m7 solver: no single far-off value in "${t}"`)
    if (/Which one number describes them best\?/.test(t)) {
      const sm = t.match(/The mean is \$?(\d+(?:\.\d+)?) and the median is \$?(\d+(?:\.\d+)?)/)
      if (!sm || +sm[1] !== mn || +sm[2] !== md) throw new Error(`g6m7 solver: stated mean/median wrong in "${t}"`)
      return one(q, c => /^the median, \$?(\d+)$/.test(c) && num(c.split(', ')[1]) === md)
    }
    if (/Which middle describes them best, and why\?/.test(t)) {
      const dir = out > mean(xs.filter(x => x !== out)) ? 'up' : 'down'
      return one(q, c => {
        const m = c.match(/^The median, because the \$?(\d+) pulls the mean (up|down)\.$/)
        return !!m && +m[1] === out && m[2] === dir
      })
    }
    return fail(q)
  },

  'g6m7-t6': q => {
    const t = q.text, p = q.picture
    if (p.type === 'dot') {
      let m = t.match(/exactly (\d+)/)
      if (m) { const k = +m[1]; return str(dotCount(p, v => v === k)) }
      m = t.match(/more than (\d+) but fewer than (\d+)/)
      if (m) { const a = +m[1], b = +m[2]; return str(dotCount(p, v => v > a && v < b)) }
      m = t.match(/fewer than (\d+)/)
      if (m) { const k = +m[1]; return str(dotCount(p, v => v < k)) }
      m = t.match(/ (\d+) or more/)
      if (m) { const k = +m[1]; return str(dotCount(p, v => v >= k)) }
      return fail(q)
    }
    if (p.type === 'hist') {
      const bins = (p.labels as string[]).map(l => l.split('–').map(Number))
      const vals = p.values as number[]
      let m = t.match(/There are (\d+) (?:students|kids) in all, but the bar for (\d+)–(\d+) got erased/)
      if (m) {
        const i = bins.findIndex(b => b[0] === +m![2] && b[1] === +m![3])
        if (i < 0 || vals[i] !== 0) return fail(q)
        const v = +m[1] - sum(vals)
        if (v < 0) throw new Error(`g6m7 solver: negative bar in "${t}"`)
        return str(v)
      }
      m = t.match(/ (\d+) or more/)
      if (m) {
        const k = +m[1]
        if (!bins.some(b => b[0] === k)) throw new Error(`g6m7 solver: ${k} is not a bin edge in "${t}"`)
        return str(sum(vals.filter((_, i) => bins[i][0] >= k)))
      }
      m = t.match(/less than (\d+)/)
      if (m) {
        const k = +m[1]
        if (!bins.some(b => b[0] === k)) throw new Error(`g6m7 solver: ${k} is not a bin edge in "${t}"`)
        return str(sum(vals.filter((_, i) => bins[i][1] < k)))
      }
    }
    return fail(q)
  },

  'g6m7-t7': q => {
    const t = q.text, p = q.picture
    let m = t.match(/This spinner has (\d+) equal parts\. What is the chance of landing on (\w+)\?/)
    if (m) {
      const parts = p.parts as string[]
      if (parts.length !== +m[1]) return fail(q)
      const col = m[2]
      return frac(parts.filter(x => x === col).length, parts.length)
    }
    m = t.match(/numbered (\d+) to (\d+)\. What is the probability of landing on (.+)\?$/)
    if (m) {
      const ns = (p.parts as string[]).map(Number), what = m[3]
      let keep: (n: number) => boolean
      let w: RegExpMatchArray | null
      if (what === 'an even number') keep = n => n % 2 === 0
      else if (what === 'an odd number') keep = n => n % 2 === 1
      else if ((w = what.match(/^a number greater than (\d+)$/))) { const k = +w[1]; keep = n => n > k }
      else if ((w = what.match(/^a number less than (\d+)$/))) { const k = +w[1]; keep = n => n < k }
      else if ((w = what.match(/^a number you get counting by (\d+)s$/))) { const k = +w[1]; keep = n => n % k === 0 }
      else return fail(q)
      return frac(ns.filter(keep).length, ns.length)
    }
    m = t.match(/A bag has (\d+) marbles\. The probability of picking an? \w+ one is (\d+)\/(\d+)\./)
    if (m) {
      const v = (+m[1] * +m[2]) / +m[3]
      if (!Number.isInteger(v)) throw new Error(`g6m7 solver: not a whole count in "${t}"`)
      return str(v)
    }
    if (p.kind === 'table' && /A bag has/.test(t)) {
      const head = p.head as string[], counts = rowNums(p), total = sum(counts)
      m = t.match(/probability it is (\w+)\?/) ?? t.match(/chance of picking (\w+) is/)
      if (!m) return fail(q)
      const i = head.indexOf(m[1])
      if (i < 0) return fail(q)
      if (q.choices) { const want = counts[i] / total; return one(q, c => Math.abs(fracVal(c) - want) < 1e-9) }
      return frac(counts[i], total)
    }
    return fail(q)
  },

  'g6m7-t8': q => {
    const t = q.text, p = q.picture
    const word = (x: number) => one(q, c => c === chanceWord(x))
    if (/^The dot shows the chance/.test(t)) {
      const pts = numlinePts(p)
      if (pts.length !== 1) return fail(q)
      return word(pts[0])
    }
    let m = t.match(/ is (\d+)(?:\/(\d+))?\. Which word fits\?/)
    if (m) return word(+m[1] / (m[2] === undefined ? 1 : +m[2]))
    m = t.match(/How likely is an? (.+) marble\?/)
    if (m && p.kind === 'table') {
      const head = p.head as string[], counts = rowNums(p), total = sum(counts)
      const want = m[1].split(/, | or /)
      if (!want.every(c => /^[a-z]+$/.test(c))) return fail(q)
      const fav = sum(want.map(c => { const i = head.indexOf(c); return i < 0 ? 0 : counts[i] }))
      return word(fav / total)
    }
    if (/From which bag are you more likely to pick red\?/.test(t)) {
      const head = p.head as string[], ri = head.indexOf('red'), bi = head.indexOf('blue')
      const chance = (r: number) => { const row = (p.rows[r] as string[]).map(num); return row[ri] / (row[ri] + row[bi]) }
      const a = chance(0), b = chance(1)
      const ans = Math.abs(a - b) < 1e-9 ? 'Both are the same' : a > b ? 'Bag A' : 'Bag B'
      return one(q, c => c === ans)
    }
    m = t.match(/A bag has (\d+) (\w+) and (\d+) (\w+) marbles\. How many (\w+) marbles must you (add|take out) so/)
    if (m) {
      const count: Record<string, number> = { [m[2]]: +m[1], [m[4]]: +m[3] }
      const target = m[5], other = target === m[2] ? m[4] : m[2]
      if (!(target in count)) return fail(q)
      const d = m[6] === 'add' ? count[other] - count[target] : count[target] - count[other]
      if (d <= 0) throw new Error(`g6m7 solver: cannot ${m[6]} to equalise in "${t}"`)
      return str(d)
    }
    return fail(q)
  },
}
