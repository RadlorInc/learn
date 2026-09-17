// Blind answer key for g3m1's practice ladders — written from the printed questions
// (`npx tsx scripts/ladder-questions.mts g3m1 N`), never from the generator.
type Q = { text: string; picture: any; choices?: string[] }

const fail = (q: Q): never => { throw new Error(`g3m1 key: no rule for "${q.text}"`) }
const div = (a: number, b: number, q: Q) => {
  if (!b || a % b) throw new Error(`g3m1 key: ${a} ÷ ${b} is not whole in "${q.text}"`)
  return a / b
}
const n = (s: string) => Number(s)

/** Exactly one choice must fit, or the question is defective. */
function pick(q: Q, fits: (c: string) => boolean): string {
  const ok = (q.choices ?? []).filter(fits)
  if (ok.length !== 1) throw new Error(`g3m1 key: ${ok.length} choices fit "${q.text}" ${JSON.stringify(q.choices)}`)
  return ok[0]
}

/** Value of "a × b", "a + b", "a − b", "a ÷ b"; NaN for anything else. */
function val(e: string): number {
  const m = e.trim().match(/^(\d+) ([×+−÷]) (\d+)$/)
  if (!m) return NaN
  const a = n(m[1]), b = n(m[3])
  return m[2] === '×' ? a * b : m[2] === '+' ? a + b : m[2] === '−' ? a - b : b && a % b === 0 ? a / b : NaN
}
/** "L = R" is true (both sides evaluate and agree). */
const trueEq = (c: string) => {
  const [l, r, ...rest] = c.split('=')
  if (rest.length || r === undefined) return false
  const lv = /^\s*\d+\s*$/.test(l) ? n(l) : val(l)
  const rv = /^\s*\d+\s*$/.test(r) ? n(r) : val(r)
  return !Number.isNaN(lv) && lv === rv
}

export const SOLVE: Record<string, (q: Q) => string> = {
  'g3m1-t1': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    if ((m = t.match(/^Sam has (\d+) \w+ with (\d+) \w+ (?:in|on) each\. Then he gets (\d+) more \w+ just the same\./)))
      return String((n(m[1]) + n(m[3])) * n(m[2]))
    if ((m = t.match(/^Ben sees (\d+) \w+ with (\d+) \w+ (?:in|on) each\./))) return String(n(m[1]) * n(m[2]))
    if ((m = t.match(/^(\d+) \w+\. (\d+) \w+ (?:in|on) each \w+\. How many/))) return String(n(m[1]) * n(m[2]))
    if ((m = t.match(/^(\d+) groups, (\d+) in each group\. How many in all\?$/))) return String(n(m[1]) * n(m[2]))
    if (/^Which one tells how many \w+ there are\?$/.test(t) && q.picture?.kind === 'groups') {
      const { groups, each } = q.picture
      const total = groups * each
      // any multiplication naming the picture's total fits, so a turned-around fact would be a second answer
      return pick(q, c => /×/.test(c) && val(c) === total)
    }
    return fail(q)
  },

  'g3m1-t2': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    if ((m = t.match(/should have (\d+) full rows of (\d+) \w+\. But one is missing\./))) return String(n(m[1]) * n(m[2]) - 1)
    if ((m = t.match(/has (\d+) rows\. Each row has (\d+) \w+\. How many/))) return String(n(m[1]) * n(m[2]))
    if (/Count the rows, count one row, then multiply\.$/.test(t) && q.picture?.kind === 'array' && !q.picture.missing)
      return String(q.picture.rows * q.picture.cols)
    if ((m = t.match(/(\d+) rows of \w+, with (\d+) in each row\./)) || (m = t.match(/sits in (\d+) rows\. There are (\d+) \w+ in each row\./)))
      return String(n(m[1]) * n(m[2]))
    if ((m = t.match(/^Which one is (\d+) × (\d+)\?$/))) {
      const rows = n(m[1]), each = n(m[2])
      return pick(q, c => {
        const r = c.match(/^(\d+) rows of (\d+)$/)
        return !!r && n(r[1]) === rows && n(r[2]) === each
      })
    }
    return fail(q)
  },

  'g3m1-t3': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    if ((m = t.match(/^(\d+) × (\d+) = (\d+)\. What is (\d+) × (\d+)\?$/))) return String(n(m[4]) * n(m[5]))
    if ((m = t.match(/^Which one is the same as (\d+) × (\d+)\?$/))) {
      const v = n(m[1]) * n(m[2])
      return pick(q, c => val(c) === v)
    }
    if (/turn-around trick .* Which one is true\?$/.test(t)) return pick(q, trueEq)
    if ((m = t.match(/^(\d+) × __ = (\d+) × (\d+)\. What number goes in the blank\?$/))) return String(div(n(m[2]) * n(m[3]), n(m[1]), q))
    if ((m = t.match(/puts (\d+) \w+ on each of (\d+) pages\. \w+ puts (\d+) \w+ on each of (\d+) pages\./)))
      return String(n(m[1]) * n(m[2]) + n(m[3]) * n(m[4]))
    return fail(q)
  },

  'g3m1-t4': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    const per = (thing: string, bundle?: string) =>
      /pairs of socks/.test(thing) ? 2 : /hands/.test(thing) ? 5 : bundle ? n(bundle) : NaN
    if ((m = t.match(/^(?:Kai has )?(\d+) (pairs of socks|hands|bundles of (\d+) straws)[.]/))) {
      const each = per(m[2], m[3])
      if (Number.isNaN(each)) return fail(q)
      return String(n(m[1]) * each)
    }
    if ((m = t.match(/^What is (\d+) × (\d+)\?$/))) return String(n(m[1]) * n(m[2]))
    if ((m = t.match(/^Count by (\d+)s\. What number is missing\?$/))) {
      const step = n(m[1])
      const items = String(q.picture?.text ?? '').split(',').map(s => s.trim())
      const i = items.indexOf('?')
      if (i < 0 || items.length < 2) return fail(q)
      const k = items.findIndex((s, j) => j !== i && s !== '?')
      const ans = n(items[k]) + (i - k) * step
      items.forEach((s, j) => { if (j !== i && n(s) !== ans + (j - i) * step) fail(q) })
      return String(ans)
    }
    if ((m = t.match(/nickel is worth (\d+) cents\. A dime is worth (\d+) cents\. \w+ has (\d+) nickels? and (\d+) dimes?\./)))
      return String(n(m[3]) * n(m[1]) + n(m[4]) * n(m[2]))
    return fail(q)
  },

  'g3m1-t5': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    if ((m = t.match(/^(\d+) [\w ]+\. Each [\w ]+ has (\d+) \w+\. How many/))) return String(n(m[1]) * n(m[2]))
    if ((m = t.match(/^What is (\d+) × (\d+)\?$/))) return String(n(m[1]) * n(m[2]))
    if ((m = t.match(/^Which one counts by (\d+)s\?$/))) {
      const step = n(m[1])
      return pick(q, c => {
        const xs = c.split(',').map(s => n(s.trim()))
        return xs.length > 1 && xs.every((x, i) => i === 0 || x - xs[i - 1] === step)
      })
    }
    if ((m = t.match(/^How many jumps of (\d+) land on (\d+)\?$/))) return String(div(n(m[2]), n(m[1]), q))
    if ((m = t.match(/has (\d+) tricycles and (\d+) cars\. A tricycle has (\d+) wheels and a car has (\d+)\./)))
      return String(n(m[1]) * n(m[3]) + n(m[2]) * n(m[4]))
    return fail(q)
  },

  'g3m1-t6': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    if ((m = t.match(/^(\d+) \w+ are shared fairly by (\d+) friends\. Which one shows how many each friend gets\?$/))) {
      const total = n(m[1]), friends = n(m[2]), each = div(total, friends, q)
      return pick(q, c => c === `${total} ÷ ${friends} = ${each}`)
    }
    if ((m = t.match(/^(\d+) \w+ are shared fairly by (\d+) friends\. How many does each friend get\?$/))) return String(div(n(m[1]), n(m[2]), q))
    if ((m = t.match(/^(\d+) ÷ (\d+) = \?$/))) return String(div(n(m[1]), n(m[2]), q))
    if ((m = t.match(/shared fairly by (\d+) friends\. Each friend got (\d+)\. How many/))) return String(n(m[1]) * n(m[2]))
    if ((m = t.match(/has (\d+) beads\. She gets (\d+) more\. She puts the same number of beads on (\d+) bracelets\./)))
      return String(div(n(m[1]) + n(m[2]), n(m[3]), q))
    return fail(q)
  },

  'g3m1-t7': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    if ((m = t.match(/^\w+ has (\d+) \w+\. He puts (\d+) in each \w+\. Then he gives (\d+) \w+ away\./)))
      return String(div(n(m[1]), n(m[2]), q) - n(m[3]))
    if ((m = t.match(/^(\d+) (\w+)\. (\d+) \w+ go in each \w+\. How many \w+\?$/))) return String(div(n(m[1]), n(m[3]), q))
    if ((m = t.match(/^How many groups of (\d+) can you make from (\d+)\?$/))) return String(div(n(m[2]), n(m[1]), q))
    if ((m = t.match(/^(\d+) \w+ are put into (\w+) of (\d+)\. How many \w+ are filled\?$/))) {
      const want = `${div(n(m[1]), n(m[3]), q)} ${m[2]}`
      return pick(q, c => c === want)
    }
    if ((m = t.match(/in \w+ of (\d+)\. She fills (\d+) \w+\. How many/))) return String(n(m[1]) * n(m[2]))
    return fail(q)
  },

  'g3m1-t8': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    if ((m = t.match(/^(\d+) × \? = (\d+)$/))) return String(div(n(m[2]), n(m[1]), q))
    if ((m = t.match(/^Use a times fact\. (\d+) ÷ (\d+) = \?$/))) return String(div(n(m[1]), n(m[2]), q))
    if ((m = t.match(/^(\d+) × (\d+) = (\d+)\. Which division fact is its partner\?$/))) {
      const a = n(m[1]), b = n(m[2]), p = n(m[3])
      if (a * b !== p) return fail(q)
      // a partner uses the same three numbers, the product first, and is true
      return pick(q, c => {
        const r = c.match(/^(\d+) ÷ (\d+) = (\d+)$/)
        return !!r && n(r[1]) === p && [n(r[2]), n(r[3])].sort().join() === [a, b].sort().join() && trueEq(c)
      })
    }
    if ((m = t.match(/^(\d+) \w+ are set out in (\d+) equal rows\. How many/))) return String(div(n(m[1]), n(m[2]), q))
    if ((m = t.match(/has (\d+) \w+\. He puts (\d+) \w+ in each bag\. How many bags/))) return String(div(n(m[1]), n(m[2]), q))
    if ((m = t.match(/bakes (\d+) trays with (\d+) cookies on each tray\. She puts the cookies in bags of (\d+)\./)))
      return String(div(n(m[1]) * n(m[2]), n(m[3]), q))
    return fail(q)
  },
}
