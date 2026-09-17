// Blind answer key for g5m6's practice ladders — written from the printed questions
// (`npx tsx scripts/ladder-questions.mts g5m6 N`), never from the generator.
type Q = { text: string; picture: any; choices?: string[] }
type P = { x: number; y: number; label?: string }

const fail = (q: Q): never => { throw new Error(`g5m6 key: no rule for "${q.text}"`) }
const n = (s: string) => Number(s)

/** Exactly one choice must fit, or the question is defective. */
function pick(q: Q, fits: (c: string) => boolean): string {
  const ok = (q.choices ?? []).filter(fits)
  if (ok.length !== 1) throw new Error(`g5m6 key: ${ok.length} choices fit "${q.text}" ${JSON.stringify(q.choices)}`)
  return ok[0]
}

const pts = (q: Q): P[] => q.picture?.points ?? []
/** The point whose label is `name` (case-insensitive); throws if absent or repeated. */
function pt(q: Q, name: string): P {
  const hit = pts(q).filter(p => (p.label ?? '').toLowerCase() === name.toLowerCase())
  if (hit.length !== 1) throw new Error(`g5m6 key: ${hit.length} points named ${name} in "${q.text}"`)
  return hit[0]
}
/** The only point at (x, y). */
function at(q: Q, x: number, y: number): P {
  const hit = pts(q).filter(p => p.x === x && p.y === y)
  if (hit.length !== 1) throw new Error(`g5m6 key: ${hit.length} points at (${x}, ${y}) in "${q.text}"`)
  return hit[0]
}
/** "(a, b)" anywhere in s. */
const pair = (s: string): [number, number] | null => {
  const m = s.match(/\((-?\d+), (-?\d+)\)/)
  return m ? [n(m[1]), n(m[2])] : null
}
const isPair = (c: string, x: number, y: number) => /^\(\d+, \d+\)$/.test(c) && pair(c)![0] === x && pair(c)![1] === y
/** Distance between two points on one grid line; throws if they are not on one. */
function lineDist(q: Q, a: P, b: P): number {
  if (a.x !== b.x && a.y !== b.y) throw new Error(`g5m6 key: points not on one grid line in "${q.text}"`)
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}
const blocks = (a: P, b: P) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)

/** "Pattern A: start at s, add d." pairs from the text. */
function patterns(t: string): Record<string, { s: number; d: number }> {
  const out: Record<string, { s: number; d: number }> = {}
  for (const m of t.matchAll(/Pattern ([A-Z])(?: counts \w+)?: start at (\d+), add (\d+)\./g)) out[m[1]] = { s: n(m[2]), d: n(m[3]) }
  return out
}
const term = (p: { s: number; d: number }, k: number) => p.s + k * p.d
/** Step k where pattern p reaches v (a whole step ≥ 0), else throw. */
function stepOf(q: Q, p: { s: number; d: number }, v: number): number {
  const k = (v - p.s) / p.d
  if (!Number.isInteger(k) || k < 0) throw new Error(`g5m6 key: ${v} is not in the pattern in "${q.text}"`)
  return k
}
const ORD = (s: string) => n(s.replace(/\D/g, ''))

export const SOLVE: Record<string, (q: Q) => string> = {
  'g5m6-t1': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    if ((m = t.match(/^How far (up|across) is point ([A-Z])\?$/))) {
      const p = pt(q, m[2]); return String(m[1] === 'up' ? p.y : p.x)
    }
    if ((m = t.match(/^Which pair tells where point ([A-Z]) is\?$/))) {
      const p = pt(q, m[1]); return pick(q, c => isPair(c, p.x, p.y))
    }
    if ((m = t.match(/^(\w+) says point ([A-Z]) is at \((\d+), (\d+)\)\. What is true\?$/))) {
      const who = m[1], p = pt(q, m[2]), right = n(m[3]) === p.x && n(m[4]) === p.y
      return pick(q, c => {
        if (c === `${who} is right.`) return right
        const cm = c.match(new RegExp(`^Point ${m![2]} is at \\((\\d+), (\\d+)\\)\\.$`))
        return !!cm && n(cm[1]) === p.x && n(cm[2]) === p.y
      })
    }
    if ((m = t.match(/^A map of the garden is a grid\. An? \w+ is at the (\w+)\. Which pair tells where it is\?$/))) {
      const p = pt(q, m[1]); return pick(q, c => isPair(c, p.x, p.y))
    }
    if ((m = t.match(/^Start at point ([A-Z])\. Go (\d+) more across and (\d+) more up\. Which pair tells where you land\?$/))) {
      const p = pt(q, m[1]); return pick(q, c => isPair(c, p.x + n(m![2]), p.y + n(m![3])))
    }
    return fail(q)
  },

  'g5m6-t2': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    if ((m = t.match(/^Which point is at \((\d+), (\d+)\)\?( Watch the 0\.)?$/))) {
      const p = at(q, n(m[1]), n(m[2])); return pick(q, c => c === `Point ${p.label}`)
    }
    if ((m = t.match(/^(\w+) plotted \((\d+), (\d+)\) and put the dot at point ([A-Z])\. What is true\?$/))) {
      const who = m[1], p = at(q, n(m[2]), n(m[3])), right = p.label === m[4]
      return pick(q, c => {
        if (c === `${who} is right.`) return right
        const cm = c.match(/The dot goes at point ([A-Z])\.$/)
        return !!cm && cm[1] === p.label
      })
    }
    if ((m = t.match(/^\w+ (?:buries|hides|parks) (?:a|an|his|her) \w+ on a grid map at \((\d+), (\d+)\)\. Where is the \w+\?$/))) {
      const p = at(q, n(m[1]), n(m[2])); return pick(q, c => c.toLowerCase() === `by the ${p.label!.toLowerCase()}`)
    }
    if ((m = t.match(/^The cat is as far across as point ([A-Z]) and as far up as point ([A-Z])\. Which point is the cat\?$/))) {
      const p = at(q, pt(q, m[1]).x, pt(q, m[2]).y); return pick(q, c => c === `Point ${p.label}`)
    }
    return fail(q)
  },

  'g5m6-t3': q => {
    const t = q.text, P = patterns(t)
    let m: RegExpMatchArray | null
    if ((m = t.match(/What is the (\d+(?:st|nd|rd|th)) number in pattern ([A-Z])\?$/))) return String(term(P[m[2]], ORD(m[1]) - 1))
    if ((m = t.match(/^A pattern starts at (\d+) and adds (\d+) each time\. What is the (\d+(?:st|nd|rd|th)) number\?$/)))
      return String(n(m[1]) + (ORD(m[3]) - 1) * n(m[2]))
    if ((m = t.match(/Each number in pattern ([A-Z]) is how many times the number above it in pattern ([A-Z])\?$/))) {
      const b = P[m[1]], a = P[m[2]], r = b.d / a.d
      for (let k = 0; k < 8; k++) if (term(b, k) !== r * term(a, k)) throw new Error(`g5m6 key: no single ratio in "${t}"`)
      return String(r)
    }
    if ((m = t.match(/(\w+) says pattern ([A-Z]) is always (\d+) more than pattern ([A-Z])\. What is true\?$/))) {
      const who = m[1], b = P[m[2]], a = P[m[4]], more = n(m[3])
      const always = (f: (k: number) => boolean) => [0, 1, 2, 3, 4, 5, 6, 7].every(f)
      return pick(q, c => {
        if (c === `${who} is right.`) return always(k => term(b, k) - term(a, k) === more)
        const cm = c.match(/^([A-Z]) is always (\d+) times as much as ([A-Z])\.$/)
        if (!cm) return false
        return always(k => term(P[cm[1]], k) === n(cm[2]) * term(P[cm[3]], k))
      })
    }
    if ((m = t.match(/^(\w+) and (\w+) both start with (\d+) (\w+)\. Each (week|day) \1 \w+ (\d+) \4 and \2 \w+ (\d+) \4\. After \5 (\d+), how many more \4 does (\w+) have than (\w+)\?$/))) {
      const start = n(m[3]), wk = n(m[8])
      const has: Record<string, number> = { [m[1]]: start + wk * n(m[6]), [m[2]]: start + wk * n(m[7]) }
      if (!(m[9] in has) || !(m[10] in has)) return fail(q)
      return String(has[m[9]] - has[m[10]])
    }
    return fail(q)
  },

  'g5m6-t4': q => {
    const t = q.text, P = patterns(t)
    let m: RegExpMatchArray | null
    if ((m = t.match(/Pattern ([A-Z]) goes across\. When the dot is (\d+) across, how far up is it\?$/))) {
      const xs = P[m[1]], ys = P[m[1] === 'A' ? 'B' : 'A']
      return String(term(ys, stepOf(q, xs, n(m[2]))))
    }
    if ((m = t.match(/Pattern ([A-Z]) goes across\. Which pair is a dot on this graph\?$/))) {
      const xs = P[m[1]], ys = P[m[1] === 'A' ? 'B' : 'A']
      return pick(q, c => {
        const p = pair(c); if (!p || !/^\(\d+, \d+\)$/.test(c)) return false
        const k = (p[0] - xs.s) / xs.d
        return Number.isInteger(k) && k >= 0 && term(ys, k) === p[1]
      })
    }
    if ((m = t.match(/^These dots come from two patterns that both start at 0\. Each dot is (\d+) more across than the one before\. The next dot is (\d+) across\. How far up is it\?$/))) {
      const ps = pts(q)
      const r = ps.find(p => p.x !== 0)
      if (!r) return fail(q)
      const slope = r.y / r.x
      const step = n(m[1]), next = n(m[2]), y = slope * next
      if (!ps.every((p, i) => p.x === i * step && p.y === slope * p.x)) throw new Error(`g5m6 key: dots not on one pattern in "${t}"`)
      if (next !== ps.length * step || !Number.isInteger(y)) throw new Error(`g5m6 key: "next dot" is not the next one in "${t}"`)
      return String(y)
    }
    if ((m = t.match(/(\w+) takes the (\d+(?:st|nd|rd|th)) column and plots the dot at \((\d+), (\d+)\)\. What is true\?$/))) {
      const who = m[1], head: string[] = q.picture.head, col = head.indexOf(m[2])
      if (col < 1) return fail(q)
      const row = (l: string) => q.picture.rows.find((r: string[]) => r[0] === l)[col]
      // The rule these lessons use: pattern A goes across, pattern B goes up.
      const x = n(row('A')), y = n(row('B'))
      if (term(P.A, col - 1) !== x || term(P.B, col - 1) !== y) throw new Error(`g5m6 key: table disagrees with rules in "${t}"`)
      const right = n(m[3]) === x && n(m[4]) === y
      return pick(q, c => {
        if (c === `${who} is right.`) return right
        const cm = c.match(/The dot is at \((\d+), (\d+)\)\.$/)
        return !!cm && n(cm[1]) === x && n(cm[2]) === y
      })
    }
    if ((m = t.match(/Pattern ([A-Z]) counts (\w+): start at \d+, add \d+\. Pattern ([A-Z]) counts (\w+): start at \d+, add \d+\. A dot on the graph is (\d+) up\. How far across is it\?$/))) {
      const across = String(q.picture?.text ?? '').match(/^(\w+) go across, (\w+) go up$/)
      if (!across) return fail(q)
      const xl = across[1] === m[2] ? m[1] : across[1] === m[4] ? m[3] : fail(q)
      const yl = xl === m[1] ? m[3] : m[1]
      if (across[2] !== (yl === m[1] ? m[2] : m[4])) return fail(q)
      return String(term(P[xl], stepOf(q, P[yl], n(m[5]))))
    }
    return fail(q)
  },

  'g5m6-t5': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    if ((m = t.match(/^How many units apart are point ([A-Z]) and point ([A-Z])\?$/))) return String(lineDist(q, pt(q, m[1]), pt(q, m[2])))
    if ((m = t.match(/^Point [A-Z] is at \((\d+), (\d+)\)\. Point [A-Z] is at \((\d+), (\d+)\)\. How many units apart are they\?$/)))
      return String(lineDist(q, { x: n(m[1]), y: n(m[2]) }, { x: n(m[3]), y: n(m[4]) }))
    if ((m = t.match(/^Point ([A-Z]) is at \((\d+), (\d+)\) and point ([A-Z]) is at \((\d+), (\d+)\)\. (\w+) does \d+ − \d+ and says they are (\d+) units? apart\. What is true\?$/))) {
      const a = pt(q, m[1]), b = pt(q, m[4])
      if (a.x !== n(m[2]) || a.y !== n(m[3]) || b.x !== n(m[5]) || b.y !== n(m[6])) throw new Error(`g5m6 key: picture disagrees with text in "${t}"`)
      const d = lineDist(q, a, b), who = m[7]
      return pick(q, c => {
        if (c === `${who} is right.`) return n(m![8]) === d
        const cm = c.match(/^They are (\d+) units? apart\.$/)
        return !!cm && n(cm[1]) === d
      })
    }
    if ((m = t.match(/^Point [A-Z] is (\d+) units? (to the right of|to the left of|above|below) point ([A-Z])\. What is the (first|second) number of point [A-Z]\?$/))) {
      const p = pt(q, m[3]), k = n(m[1])
      const x = p.x + (m[2] === 'to the right of' ? k : m[2] === 'to the left of' ? -k : 0)
      const y = p.y + (m[2] === 'above' ? k : m[2] === 'below' ? -k : 0)
      return String(m[4] === 'first' ? x : y)
    }
    if ((m = t.match(/^A fence runs in a straight line from post ([A-Z]) to post ([A-Z])\. Each unit on the grid is (\d+) meters\. How many meters long is the fence\?$/)))
      return String(lineDist(q, pt(q, m[1]), pt(q, m[2])) * n(m[3]))
    return fail(q)
  },

  'g5m6-t6': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    if ((m = t.match(/^How many blocks is it from the (\w+) to the (\w+)\?$/))) {
      const a = pt(q, m[1]), b = pt(q, m[2]); lineDist(q, a, b); return String(blocks(a, b))
    }
    if ((m = t.match(/^Which place is at \((\d+), (\d+)\)\?$/))) {
      const p = at(q, n(m[1]), n(m[2])); return pick(q, c => c.toLowerCase() === `the ${p.label!.toLowerCase()}`)
    }
    if ((m = t.match(/^(\w+) walks from the (\w+) to the (\w+)\. \1 counts every corner from \d+ to \d+ and says it is (\d+) blocks?\. What is true\?$/))) {
      const d = lineDist(q, pt(q, m[2]), pt(q, m[3])), who = m[1]
      return pick(q, c => {
        if (c === `${who} is right.`) return n(m![4]) === d
        const cm = c.match(/^It is (\d+) blocks?\.$/)
        return !!cm && n(cm[1]) === d
      })
    }
    if ((m = t.match(/^The (\w+) is (\d+) blocks? (to the right of|to the left of|up from|down from) the (\w+), on the same street\. Which pair tells where the \1 is\?$/))) {
      const p = pt(q, m[4]), k = n(m[2])
      const x = p.x + (m[3] === 'to the right of' ? k : m[3] === 'to the left of' ? -k : 0)
      const y = p.y + (m[3] === 'up from' ? k : m[3] === 'down from' ? -k : 0)
      return pick(q, c => isPair(c, x, y))
    }
    if ((m = t.match(/^You walk from home to the (\w+), then on to the (\w+)\. How many blocks do you walk\?$/))) {
      const h = pt(q, 'Home'), a = pt(q, m[1]), b = pt(q, m[2])
      return String(lineDist(q, h, a) + lineDist(q, a, b))
    }
    return fail(q)
  },
}
