// Blind answer key for g8m5's practice ladders — written from the printed questions
// (`npx tsx scripts/ladder-questions.mts g8m5 N`), never from the generator. π ≈ 3.14.
type Q = { text: string; picture: any; choices?: string[] }

const PI = 3.14
const fail = (q: Q, why = 'no rule'): never => { throw new Error(`g8m5 key: ${why} for "${q.text}"`) }
const n = (s: string) => Number(s.replace(/,/g, ''))
const r2 = (x: number) => Math.round(x * 100) / 100
const out = (x: number) => String(r2(x))
const same = (a: number, b: number) => Math.abs(r2(a) - r2(b)) < 0.001
const NUM = '([\\d,]+(?:\\.\\d+)?)'

const cyl = (r: number, h: number) => PI * r * r * h
const cone = (r: number, h: number) => cyl(r, h) / 3
const ball = (r: number) => (4 / 3) * PI * r * r * r

/** A number label on the picture ("4 cm") must agree with the text. "?" and missing labels are skipped. */
function label(q: Q, key: string, want: number) {
  const l = q.picture?.labels?.[key]
  if (l === undefined || l === '?') return
  if (n(String(l).split(' ')[0]) !== want) fail(q, `picture ${key}=${l} disagrees with text ${want}`)
}

/** Exactly one choice must fit, or the question is defective. */
function pick(q: Q, fits: (c: string) => boolean): string {
  const ok = (q.choices ?? []).filter(fits)
  if (ok.length !== 1) fail(q, `${ok.length} choices fit ${JSON.stringify(q.choices)}`)
  return ok[0]
}

/** "X says its volume is … = V cubic …. Which is true?" against the real volume. */
function judge(q: Q, truth: number): string {
  const m = q.text.match(new RegExp(`(\\w+) says its volume is [^=]+= ${NUM} cubic`))
  if (!m) return fail(q)
  const right = same(n(m[2]), truth)
  return pick(q, c => {
    if (c === `${m[1]} is right`) return right
    const k = c.match(new RegExp(`^No, it is ${NUM} cubic`))
    if (!k) fail(q, `unreadable choice "${c}"`)
    return !right && same(n(k![1]), truth)
  })
}

const lab = (q: Q, k: string) => { const v = n(String(q.picture?.labels?.[k] ?? "").split(" ")[0]); return Number.isFinite(v) && v > 0 ? v : fail(q, `no ${k} label`) }
const match = (q: Q, re: string) => q.text.match(new RegExp(re))

export const SOLVE: Record<string, (q: Q) => string> = {
  'g8m5-t1': q => {
    let m: RegExpMatchArray | null
    if (/^What is the volume of this cylinder/.test(q.text)) {
      const r = lab(q, "r"), h = lab(q, "h")
      return out(cyl(r, h))
    }
    if ((m = match(q, `is ${NUM} \\w+ across and ${NUM} \\w+ tall\\. What is its volume`))) {
      label(q, 'h', n(m[2]))
      return out(cyl(n(m[1]) / 2, n(m[2])))
    }
    if ((m = match(q, `is ${NUM} \\w+ across and ${NUM} \\w+ tall\\. \\w+ says`))) {
      label(q, 'h', n(m[2]))
      return judge(q, cyl(n(m[1]) / 2, n(m[2])))
    }
    if ((m = match(q, `^A cylinder holds ${NUM} cubic \\w+\\. Its radius is ${NUM} \\w+\\. How tall`))) {
      label(q, 'r', n(m[2]))
      return out(n(m[1]) / (PI * n(m[2]) ** 2))
    }
    if ((m = match(q, `Each mold is ${NUM} \\w+ across and ${NUM} \\w+ tall\\. How many cubic \\w+ of wax fill ${NUM} molds`))) {
      label(q, 'h', n(m[2]))
      return out(cyl(n(m[1]) / 2, n(m[2])) * n(m[3]))
    }
    return fail(q)
  },

  'g8m5-t2': q => {
    let m: RegExpMatchArray | null
    if (/^What is the volume of this cone/.test(q.text))
      return out(cone(lab(q, "r"), lab(q, "h")))
    if ((m = match(q, `^A cone is ${NUM} \\w+ across its bottom and ${NUM} \\w+ tall\\. What is its volume`))) {
      label(q, 'h', n(m[2]))
      return out(cone(n(m[1]) / 2, n(m[2])))
    }
    if ((m = match(q, `^A cone has a radius of ${NUM} \\w+ and a height of ${NUM} \\w+\\. \\w+ says`))) {
      label(q, 'r', n(m[1])); label(q, 'h', n(m[2]))
      return judge(q, cone(n(m[1]), n(m[2])))
    }
    if ((m = match(q, `^A cone holds ${NUM} cubic \\w+\\. Its radius is ${NUM} \\w+\\. How tall`))) {
      label(q, 'r', n(m[2]))
      return out((3 * n(m[1])) / (PI * n(m[2]) ** 2))
    }
    if ((m = match(q, `paper cup has a radius of ${NUM} \\w+ and a height of ${NUM} \\w+\\. How many full cups .* same radius and a height of ${NUM} \\w+\\?`))) {
      label(q, 'r', n(m[1])); label(q, 'h', n(m[2]))
      const cups = cyl(n(m[1]), n(m[3])) / cone(n(m[1]), n(m[2]))
      if (Math.abs(cups - Math.round(cups)) > 1e-9) fail(q, `${cups} cups is not a whole number`)
      return String(Math.round(cups))
    }
    return fail(q)
  },

  'g8m5-t3': q => {
    let m: RegExpMatchArray | null
    if (/^What is the volume of this ball/.test(q.text)) return out(ball(lab(q, "r")))
    if ((m = match(q, `is ${NUM} \\w+ across\\. What is its volume`))) return out(ball(n(m[1]) / 2))
    if ((m = match(q, `^A ball has a radius of ${NUM} \\w+\\. Leave the answer as a number times π\\.`))) {
      label(q, 'r', n(m[1]))
      return out((4 / 3) * n(m[1]) ** 3)
    }
    if ((m = match(q, `^A ball has a radius of ${NUM} \\w+\\. \\w+ says`))) {
      label(q, 'r', n(m[1]))
      return judge(q, ball(n(m[1])))
    }
    if ((m = match(q, `^A can fits snugly around a ball with a radius of ${NUM} \\w+\\. .*How many cubic \\w+ of water stay`))) {
      const r = n(m[1]); label(q, 'r', r)
      return out(cyl(r, 2 * r) - ball(r)) // snug: can radius r, height 2r
    }
    return fail(q)
  },

  'g8m5-t4': q => {
    let m: RegExpMatchArray | null
    if ((m = match(q, `^An? ([\\w -]+?) has a radius of ${NUM} \\w+(?: and a height of ${NUM} \\w+)?\\. Which one finds its volume\\?`))) {
      const thing = m[1], r = m[2], h = m[3]
      const SPHERE = ['basketball', 'globe', 'gumball', 'soccer ball']
      const CONE = ['funnel', 'party hat', 'snow cone cup', 'traffic cone']
      const CYL = ['drinking glass', 'paint can', 'round cake pan', 'soup can']
      const want = SPHERE.includes(thing) && !h ? `4/3 × 3.14 × ${r} × ${r} × ${r}`
        : CONE.includes(thing) && h ? `1/3 × 3.14 × ${r} × ${r} × ${h}`
        : CYL.includes(thing) && h ? `3.14 × ${r} × ${r} × ${h}`
        : fail(q, `unknown shape "${thing}"`)
      return pick(q, c => c === want)
    }
    if ((m = match(q, `^A farm silo is a cylinder with a radius of ${NUM} \\w+ and a height of ${NUM} \\w+, with half a ball of radius ${NUM} \\w+ on top\\.`))) {
      label(q, 'r', n(m[1])); label(q, 'h', n(m[2]))
      return out(cyl(n(m[1]), n(m[2])) + ball(n(m[3])) / 2)
    }
    if ((m = match(q, `^An ice-cream cone has a radius of ${NUM} \\w+ and a height of ${NUM} \\w+\\. Half a ball of ice cream with a radius of ${NUM} \\w+ sits on top\\.`))) {
      label(q, 'r', n(m[1])); label(q, 'h', n(m[2]))
      return out(cone(n(m[1]), n(m[2])) + ball(n(m[3])) / 2)
    }
    if ((m = match(q, `^A funnel is a cone with a radius of ${NUM} \\w+ and a height of ${NUM} \\w+\\. A can has a radius of ${NUM} \\w+ and a height of ${NUM} \\w+\\. Which holds more\\?`))) {
      const a = cone(n(m[1]), n(m[2])), b = cyl(n(m[3]), n(m[4]))
      return pick(q, c => c === (same(a, b) ? 'they hold the same' : a > b ? 'the funnel' : 'the can'))
    }
    if ((m = match(q, `^A can has a radius of ${NUM} \\w+ and a height of ${NUM} \\w+\\. A ball has a radius of ${NUM} \\w+\\. Which holds more\\?`))) {
      const a = cyl(n(m[1]), n(m[2])), b = ball(n(m[3]))
      return pick(q, c => c === (same(a, b) ? 'they hold the same' : a > b ? 'the can' : 'the ball'))
    }
    if ((m = match(q, `^A ball with a radius of ${NUM} \\w+ fits exactly inside a box that is ${NUM} \\w+ long, ${NUM} \\w+ wide and ${NUM} \\w+ tall\\.`))) {
      const r = n(m[1]), l = n(m[2]), w = n(m[3]), h = n(m[4])
      if (l !== 2 * r || w !== 2 * r || h !== 2 * r) fail(q, 'ball does not fit the box exactly')
      label(q, 'l', l); label(q, 'w', w); label(q, 'h', h)
      return out(l * w * h - ball(r))
    }
    if ((m = match(q, `^A block of clay is a cylinder with a radius of ${NUM} \\w+ and a height of ${NUM} \\w+\\. A cone with the same bottom and height is dug out`))) {
      label(q, 'r', n(m[1])); label(q, 'h', n(m[2]))
      return out(cyl(n(m[1]), n(m[2])) - cone(n(m[1]), n(m[2])))
    }
    if ((m = match(q, `^A farm silo is a cylinder with half a ball on top\\. Both have a radius of ${NUM} \\w+\\. The silo holds ${NUM} cubic \\w+ in all\\. How tall is the cylinder part`))) {
      const r = n(m[1]); label(q, 'r', r)
      const h = (n(m[2]) - ball(r) / 2) / (PI * r * r)
      if (h <= 0) fail(q, `cylinder height ${h}`)
      return out(h)
    }
    return fail(q)
  },
}
