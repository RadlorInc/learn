// Independent answer key for the g3m3 practice ladders. Written from the QUESTIONS only
// (scripts/ladder-questions.mts output), never from the generator.
type Q = { text: string; picture: any; choices?: string[] }

const nums = (s: string) => (s.match(/\d[\d,]*/g) ?? []).map(n => Number(n.replace(/,/g, '')))
const fail = (q: Q, why = 'no rule'): never => { throw new Error(`g3m3: ${why} for "${q.text}"`) }

/** "a × b + c − d" with × binding tighter; commas in numbers allowed. */
const evalExpr = (e: string): number => {
  const s = e.replace(/,/g, '').replace(/−/g, '-').replace(/\s+/g, '')
  if (!/^[\d×+\-]+$/.test(s)) throw new Error(`g3m3: cannot evaluate "${e}"`)
  let total = 0
  for (const m of s.match(/[+-]?[^+-]+/g)!) {
    const sign = m[0] === '-' ? -1 : 1
    total += sign * m.replace(/^[+-]/, '').split('×').reduce((p, f) => p * Number(f), 1)
  }
  return total
}
/** Solves an equation with one "?" by trying whole numbers; the fit must be unique. */
const missing = (q: Q, eq: string): string => {
  const [l, r] = eq.split('=')
  const fits: number[] = []
  for (let v = 0; v <= 2000; v++) if (evalExpr(l.replace('?', String(v))) === evalExpr(r.replace('?', String(v)))) fits.push(v)
  if (fits.length !== 1) fail(q, `${fits.length} values fit the box`)
  return String(fits[0])
}
const one = (q: Q, fits: (c: string) => boolean): string => {
  const hits = (q.choices ?? []).filter(fits)
  if (hits.length !== 1) fail(q, `${hits.length} choices fit ${JSON.stringify(q.choices)}`)
  return hits[0]
}
/** The bare-arithmetic shapes every topic shares; undefined when the text is a story. */
const common = (q: Q): string | undefined => {
  const t = q.text
  let m = t.match(/What number goes in the box\? (.+)$/)
  if (m) return missing(q, m[1])
  m = t.match(/^([\d×+−, ]+)= \?$/)
  if (m) return String(evalExpr(m[1]))
  m = t.match(/^(\d+ × \d+) = \? Find (\d+ × \d+) and (\d+ × \d+), then add\.$/)
  if (m) {
    if (evalExpr(m[2]) + evalExpr(m[3]) !== evalExpr(m[1])) fail(q, 'the two parts do not make the product')
    return String(evalExpr(m[1]))
  }
  m = t.match(/find (\d+ × \d+)\.$/)
  if (m) return String(evalExpr(m[1]))
  m = t.match(/says (\d+ × \d+) = [\d+−, ]+\. Which one is (?:true|right)\?/)
  if (m) return one(q, c => { const [l, r] = c.split('='); return evalExpr(l) === evalExpr(r) })
  m = t.match(/Which one is the same as (\d+ × \d+)\?$/)
  if (m) { const v = evalExpr(m[1]); return one(q, c => evalExpr(c) === v) }
  return undefined
}
const solver = (story: (q: Q, n: number[]) => number | string | undefined) => (q: Q): string => {
  const c = common(q)
  if (c !== undefined) return c
  const v = story(q, nums(q.text))
  return v === undefined ? fail(q) : String(v)
}
/** "N things, M on/in each/it." — a groups picture must agree with the words. */
const groupsWords = (q: Q, n: number[]) => {
  if (!/^\d+ \w+, \d+ \w+ (?:on|in) (?:each|it)\. How many \w+\?$/.test(q.text)) return undefined
  const p = q.picture
  if (p?.kind === 'groups' && (p.groups !== n[0] || p.each !== n[1])) fail(q, 'picture disagrees with words')
  return n[0] * n[1]
}

export const SOLVE: Record<string, (q: Q) => string> = {
  'g3m3-t1': solver((q, n) => {
    const t = q.text
    if (/empty baskets and \d+ baskets with \d+ \w+ in each/.test(t)) return n[0] * 0 + n[1] * n[2]
    if (/Every box is empty|no \w+ in any|No \w+ has a \w+ in it/.test(t)) return n[0] * 0
    return groupsWords(q, n)
  }),
  'g3m3-t2': solver((q, n) => {
    if (/each get (\d+) \w+\. Then (\d+) more \w+ come, and each gets (\d+)/.test(q.text)) return n[0] * n[1] + n[2] * n[3]
    return groupsWords(q, n)
  }),
  'g3m3-t3': solver((q, n) => {
    const t = q.text
    if (/Each (?:pack has|tray holds) \d+|friends each have \d+ \w+\. How many/.test(t)) return n[0] * n[1]
    return undefined
  }),
  'g3m3-t4': solver((q, n) => {
    const t = q.text
    if (/every day for \d+ days\. \w+ reads \d+ pages every day for \d+ days\. How many more/.test(t)) return n[0] * n[1] - n[2] * n[3]
    if (/for a week/.test(t) && n.length === 1) return 7 * n[0]
    return undefined
  }),
  'g3m3-t5': solver((q, n) => {
    const t = q.text
    if (/has double the number of packs/.test(t)) return 2 * n[0] * n[2]
    if (/^An? \w+ (?:has|holds) \d+ \w+\. How many \w+ (?:do|are in) \d+ \w+/.test(t)) return n[0] * n[1]
    return undefined
  }),
  'g3m3-t6': solver((q, n) => {
    if (/holds \d+ \w+\. \w+ has \d+ \w+\. \w+ gives \d+ \w+ to a friend\. How many \w+ does \w+ have now\?/.test(q.text))
      return n[0] * (n[1] - n[2])
    return undefined
  }),
  'g3m3-t7': solver((q, n) => {
    const t = q.text
    const m = t.match(/^(\d+ × \d+) = \? (?:The two parts are already found\. Add them\.|Solve each part, then add\.)$/)
    if (m) {
      const p = q.picture
      const v = evalExpr(m[1])
      // the area picture must split the same product: row heights sum to one factor, column to the other
      const h = (p.heights as number[]).reduce((a, b) => a + b, 0)
      const w = Number(p.cols[0])
      if (p.kind !== 'area' || h * w !== v) fail(q, 'area picture disagrees')
      if (p.cells) {
        const sum = (p.cells as string[][]).flat().reduce((a, c) => a + Number(c), 0)
        if (sum !== v) fail(q, 'area cells do not add to the product')
      }
      return String(v)
    }
    if (/has \d+ rows(?: of \w+)?\. Each row has \d+ \w+\. How many/.test(t)) return n[0] * n[1]
    return undefined
  }),
  'g3m3-t8': solver((q, n) => {
    const t = q.text
    if (/cups\. Each cup holds \d+ straws\. Each straw in the picture is a bundle of \d+\./.test(t)) {
      const p = q.picture
      if (p?.kind !== 'groups' || p.groups !== n[0] || p.each * n[2] !== n[1]) fail(q, 'picture disagrees with words')
      return n[0] * n[1]
    }
    if (/buys \d+ boxes with \d+ pencils in each, and \d+ boxes with \d+ pencils in each/.test(t)) return n[0] * n[1] + n[2] * n[3]
    return undefined
  }),
  'g3m3-t9': (q: Q): string => {
    const t = q.text
    const n = nums(t)
    let m = t.match(/^(.+?)(?:Which one finds how many .+\?)$/)
    if (m && q.choices) {
      let v: number
      if (/Then \d+ more \w+ come in\./.test(t)) v = n[0] * n[1] + n[2]
      else if (/He gives \d+ \w+ to friends\./.test(t)) v = n[0] * n[1] - n[2]
      else return fail(q)
      return one(q, c => evalExpr(c) === v)
    }
    const c = common(q)
    if (c !== undefined) return c
    m = t.match(/buys \d+ \w+ of \w+\. Each \w+ has \d+ \w+\. \w+ (?:gives away|sells|uses|eats) \d+\. How many \w+ are left\?/)
    if (m) return String(n[0] * n[1] - n[2])
    if (/cost \$\d+ each\. A family buys \d+ \w+ and pays with \$\d+\. How many dollars of change/.test(t)) return String(n[2] - n[0] * n[1])
    if (/buys \d+ \w+ of \w+ with \d+ in each \w+\. .+ some of them\. Now \d+ \w+ are left\. How many did/.test(t)) return String(n[0] * n[1] - n[2])
    return fail(q)
  },
}
