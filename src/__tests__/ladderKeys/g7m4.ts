// Blind answer key for g7m4's practice ladders — written from the printed questions
// (`npx tsx scripts/ladder-questions.mts g7m4 N`), never from the generator.
type Q = { text: string; picture: any; choices?: string[] }

const PI = 3.14
const fail = (q: Q): never => { throw new Error(`g7m4 key: no rule for "${q.text}"`) }
/** Numbers are money/lengths in hundredths; round away float noise. */
const out = (x: number) => String(Math.round(x * 100) / 100)
const num = (s: string) => Number(s.replace(/,/g, ''))
const eq = (a: number, b: number) => Math.abs(a - b) < 0.005
const NUM = '(\\d[\\d,]*(?:\\.\\d+)?)'

function pick(q: Q, fits: (c: string) => boolean): string {
  const ok = (q.choices ?? []).filter(fits)
  if (ok.length !== 1) throw new Error(`g7m4 key: ${ok.length} choices fit "${q.text}" ${JSON.stringify(q.choices)}`)
  return ok[0]
}
/** "<Name> says … = claim …" questions: the right choice is "<Name> is right" when the claim is the true value,
 *  else the "No, it is X" choice whose X is the true value. */
function judge(q: Q, claim: number, truth: number): string {
  return pick(q, c => {
    if (/ is right$/.test(c)) return eq(claim, truth)
    const m = c.match(new RegExp(`^No, it is ${NUM}`))
    return !!m && !eq(claim, truth) && eq(num(m[1]), truth)
  })
}
/** Number after the last "=" in the text. */
function claimAfterEq(q: Q): number {
  const m = q.text.match(new RegExp(`=\\s*${NUM}(?![\\s\\S]*=)`))
  return m ? num(m[1]) : fail(q)
}
const lab = (s: string | null | undefined, q: Q): number => {
  const m = (s ?? '').match(new RegExp(`^${NUM}`))
  return m ? num(m[1]) : fail(q)
}

/** Circle picture → radius, from its label and whether the label marks the radius or the diameter. */
function radius(q: Q): number {
  const c = q.picture?.circles?.[0]
  if (!c) return fail(q)
  const v = lab(c.label, q)
  return c.show === 'd' ? v / 2 : c.show === 'r' ? v : fail(q)
}

/** A wedge drawn as a front right triangle + depth edges: legs, hypotenuse (if labelled) and length. */
function wedge(q: Q) {
  const p = q.picture
  const tri = p?.shapes?.find((s: any) => !s.dashed && s.pts?.length === 3)
  if (!tri) return fail(q)
  const base = lab(tri.sides?.[0], q)
  const hyp = tri.sides?.[1] ? lab(tri.sides[1], q) : NaN
  const vert = p.segs.find((s: any) => s.a[0] === s.b[0] && s.label)
  const [bx] = tri.pts[1]
  const depth = p.segs.find((s: any) => s.a[0] === bx && s.a[1] === 0 && s.b[0] !== s.a[0])
  if (!vert || !depth) return fail(q)
  return { base, height: lab(vert.label, q), hyp, len: depth.label === '?' ? NaN : lab(depth.label, q) }
}

/** Two lines crossing: positions are top/bottom (one opposite pair) and left/right (the other). */
const PAIR: Record<string, string> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }
const posOf = (at: number[]) => at[0] > 0 ? 'right' : at[0] < 0 ? 'left' : at[1] > 0 ? 'top' : 'bottom'

function triangleKind(sides: number[]): 'yes' | 'flat' | 'short' {
  const [a, b, c] = [...sides].sort((x, y) => x - y)
  return a + b > c ? 'yes' : a + b === c ? 'flat' : 'short'
}

export const SOLVE: Record<string, (q: Q) => string> = {
  'g7m4-t1': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    if ((m = t.match(new RegExp(`1 cm = ${NUM} (k?m)\\. An? \\w+ is ${NUM} cm long on the map\\. How many (?:kilo)?meters long is the real`))))
      return out(num(m[1]) * num(m[3]))
    if ((m = t.match(new RegExp(`1 cm = ${NUM} (k?m)\\. A real \\w+ is ${NUM} k?m long\\. How many centimeters long is it on the`))))
      return out(num(m[3]) / num(m[1]))
    if ((m = t.match(new RegExp(`1 cm = ${NUM} (k?m)\\. An? \\w+ is ${NUM} cm long on the map\\. \\w+ says the real \\w+ is .*Which is true\\?$`))))
      return judge(q, claimAfterEq(q), num(m[1]) * num(m[3]))
    if ((m = t.match(new RegExp(`an? \\w+ is ${NUM} cm long\\. The real \\w+ is ${NUM} (k?m) long\\. How many (?:kilo)?meters does 1 cm`))))
      return out(num(m[2]) / num(m[1]))
    if ((m = t.match(new RegExp(`1 cm = ${NUM} (k?m)\\. On the plan it is ${NUM} cm by ${NUM} cm\\. How many (?:kilo)?meters of fence go all the way around`))))
      return out(2 * (num(m[3]) + num(m[4])) * num(m[1]))
    if ((m = t.match(new RegExp(`1 cm = ${NUM} (k?m)\\. On the plan it is ${NUM} cm by ${NUM} cm\\. How many square (?:kilo)?meters`))))
      return out(num(m[3]) * num(m[4]) * num(m[1]) ** 2)
    return fail(q)
  },

  'g7m4-t2': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    if (/^(How far is it around this circle|What is the circumference of this circle), in \w+\? Use 3\.14\.$/.test(t))
      return out(2 * PI * radius(q))
    if ((m = t.match(new RegExp(`has a radius of ${NUM} \\w+\\. \\w+ says it is .* around\\. Which is true\\?$`))))
      return judge(q, claimAfterEq(q), 2 * PI * num(m[1]))
    if ((m = t.match(new RegExp(`is ${NUM} (?:cm|m|in|ft) around\\. How far is it straight across, in \\w+\\? Use 3\\.14\\.$`))))
      return out(num(m[1]) / PI)
    if ((m = t.match(new RegExp(`has a radius of ${NUM} \\w+\\. .*runs ${NUM} laps? around it\\.`))))
      return out(2 * PI * num(m[1]) * num(m[2]))
    if ((m = t.match(new RegExp(`has a radius of ${NUM} \\w+\\. It turns all the way around ${NUM} times\\.`))))
      return out(2 * PI * num(m[1]) * num(m[2]))
    return fail(q)
  },

  'g7m4-t3': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    if (/^(What is|Find) the area of this circle,? in square \w+\? ?Use π ≈ 3\.14\.$/.test(t) ||
        /^Find the area of this circle in square \w+\. Use π ≈ 3\.14\.$/.test(t)) {
      const r = radius(q)
      return out(PI * r * r)
    }
    if ((m = t.match(new RegExp(`is ${NUM} \\w+ across\\. \\w+ says its area is .*Which is true\\?$`)))) {
      const r = num(m[1]) / 2
      return judge(q, claimAfterEq(q), PI * r * r)
    }
    if ((m = t.match(new RegExp(`^A circle covers ${NUM} square \\w+\\. What is its radius`))))
      return out(Math.sqrt(num(m[1]) / PI))
    if ((m = t.match(new RegExp(`is ${NUM} ft across\\. .* costs \\$${NUM} for each square foot\\. How many dollars does it cost to cover`)))) {
      const r = num(m[1]) / 2
      return out(PI * r * r * num(m[2]))
    }
    return fail(q)
  },

  'g7m4-t4': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    if ((m = t.match(/^Two angles make a (square corner|straight line)\. One is (\d+)°\. How many degrees is the other\?$/)))
      return out((m[1] === 'square corner' ? 90 : 180) - num(m[2]))
    if (/^Look at the picture first: is it a square corner or a straight line\? How many degrees is the missing angle\?$/.test(t)) {
      const p = q.picture
      if (p?.kind !== 'angle' || (p.deg !== 90 && p.deg !== 180)) return fail(q)
      const known = (p.partLabels as string[]).filter(s => s !== '?').map(s => lab(s, q))
      return out(p.deg - known.reduce((a, b) => a + b, 0))
    }
    if ((m = t.match(/^Two angles are (complementary|supplementary)\. One is (\d+)°\. How many degrees is the other\?$/)))
      return out((m[1] === 'complementary' ? 90 : 180) - num(m[2]))
    if ((m = t.match(/^Two angles make a (square corner|straight line)\. One is (\d+)°\. \w+ says the other is .*Which is true\?$/)))
      return judge(q, claimAfterEq(q), (m[1] === 'square corner' ? 90 : 180) - num(m[2]))
    if (/^Angles \w and \w are (complementary|supplementary)\./.test(t)) {
      const rel = [...t.matchAll(/Angles (\w) and (\w) are (complementary|supplementary)\./g)]
        .map(r => ({ x: r[1], y: r[2], sum: r[3] === 'complementary' ? 90 : 180 }))
      const known: Record<string, number> = {}
      for (const k of t.matchAll(/Angle (\w) is (\d+)°\./g)) known[k[1]] = num(k[2])
      const target = t.match(/How many degrees is angle (\w)\?$/)
      if (!target || !rel.length) return fail(q)
      for (let i = 0; i < rel.length; i++)
        for (const r of rel) {
          if (known[r.x] !== undefined && known[r.y] === undefined) known[r.y] = r.sum - known[r.x]
          if (known[r.y] !== undefined && known[r.x] === undefined) known[r.x] = r.sum - known[r.y]
        }
      return known[target[1]] !== undefined ? out(known[target[1]]) : fail(q)
    }
    return fail(q)
  },

  'g7m4-t5': q => {
    const t = q.text
    const labels: { at: number[]; text: string }[] = q.picture?.labels ?? []
    const ask = labels.find(l => l.text === '?')
    let m: RegExpMatchArray | null
    if ((m = t.match(/^Two straight lines cross\. Angle A is (\d+)°\. How many degrees is the angle marked \?$/))) {
      const a = labels.find(l => l.text === 'A')
      if (!a || !ask) return fail(q)
      return out(PAIR[posOf(a.at)] === posOf(ask.at) ? num(m[1]) : 180 - num(m[1]))
    }
    if (/^Two straight lines cross\. How many degrees is the angle marked \?$/.test(t)) {
      const k = labels.find(l => /°$/.test(l.text))
      if (!k || !ask) return fail(q)
      const v = lab(k.text, q)
      return out(PAIR[posOf(k.at)] === posOf(ask.at) ? v : 180 - v)
    }
    if ((m = t.match(/^Two straight lines cross\. \w+ says the angle marked \? is (?:the same as the (\d+)° angle across from it|.*= (\d+)°)\. Which is true\?$/))) {
      const k = labels.find(l => /°$/.test(l.text))
      if (!k || !ask) return fail(q)
      const v = lab(k.text, q)
      if (m[1] && num(m[1]) !== v) return fail(q) // the text's angle must be the one drawn
      return judge(q, m[1] ? v : num(m[2]), PAIR[posOf(k.at)] === posOf(ask.at) ? v : 180 - v)
    }
    if ((m = t.match(/The (\w+) angle and the (\w+) angle add up to (\d+)°\. How many degrees is the (\w+) angle\?$/))) {
      const [x, y, s, z] = [m[1], m[2], num(m[3]), m[4]]
      if (PAIR[x] !== y) return fail(q) // two neighbours always make 180, so this only works for an opposite pair
      return out(z === x || z === y ? s / 2 : 180 - s / 2)
    }
    if ((m = t.match(/The (\w+) angle is (\d+)° bigger than the (\w+) angle\. How many degrees is the (\w+) angle\?$/))) {
      const [x, d, y, z] = [m[1], num(m[2]), m[3], m[4]]
      if (!PAIR[x] || !PAIR[y] || PAIR[x] === y || x === y) return fail(q)
      const big = (180 + d) / 2
      return out(z === x || z === PAIR[x] ? big : 180 - big)
    }
    return fail(q)
  },

  'g7m4-t6': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    const U = '(?:cm|m|in|ft)'
    const kindChoice = (k: string) => (c: string) =>
      k === 'yes' ? c === 'Yes, they make a triangle'
        : k === 'flat' ? c === 'No, the two shorter sides only meet lying flat'
          : c === 'No, the two shorter sides do not reach'
    if ((m = t.match(new RegExp(`^Can (?:sticks|sides) ${NUM} ${U}, ${NUM} ${U} and ${NUM} ${U} long make a triangle\\?`))))
      return pick(q, kindChoice(triangleKind([num(m[1]), num(m[2]), num(m[3])])))
    if ((m = t.match(new RegExp(`^\\w+ checks sides ${NUM} ${U}, ${NUM} ${U} and ${NUM} ${U}: ".*so they make a triangle\\." Which is true\\?$`)))) {
      const ok = triangleKind([num(m[1]), num(m[2]), num(m[3])]) === 'yes'
      return pick(q, c => / is right$/.test(c) ? ok : c === 'No, they cannot make a triangle' ? !ok : false)
    }
    if ((m = t.match(new RegExp(`^Two sticks are ${NUM} ${U} and ${NUM} ${U} long\\. A third stick is the (longest|shortest) of the three, and a whole number of \\w+\\. They make a triangle\\. What is the (longest|shortest) the third stick can be`)))) {
      const a = Math.min(num(m[1]), num(m[2])), b = Math.max(num(m[1]), num(m[2]))
      const range: number[] = []
      for (let x = 1; x <= a + b; x++)
        if (triangleKind([a, b, x]) === 'yes' && (m[3] === 'longest' ? x >= b : x <= a)) range.push(x)
      if (!range.length) return fail(q)
      return out(m[4] === 'longest' ? Math.max(...range) : Math.min(...range))
    }
    if (/has four fence pieces: .* Which three work\?$/.test(t))
      return pick(q, c => {
        const s = [...c.matchAll(/(\d+) ft/g)].map(x => num(x[1]))
        return s.length === 3 && triangleKind(s) === 'yes'
      })
    return fail(q)
  },

  'g7m4-t7': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    if (/is unfolded flat\./.test(t)) {
      // a net: every face is drawn; take the drawing's scale from its labelled edges (all must agree)
      const shapes: { pts: number[][]; sides?: (string | null)[] }[] = q.picture?.shapes ?? []
      let scale = NaN
      for (const s of shapes)
        (s.sides ?? []).forEach((l, i) => {
          if (!l) return
          const [a, b] = [s.pts[i], s.pts[(i + 1) % s.pts.length]]
          const k = lab(l, q) / Math.hypot(b[0] - a[0], b[1] - a[1])
          if (!Number.isNaN(scale) && Math.abs(k - scale) > 1e-9) throw new Error(`g7m4 key: net labels disagree with the drawing in "${t}"`)
          scale = k
        })
      if (Number.isNaN(scale)) return fail(q)
      const area = shapes.reduce((acc, s) => {
        let a2 = 0
        s.pts.forEach((p, i) => { const r = s.pts[(i + 1) % s.pts.length]; a2 += p[0] * r[1] - r[0] * p[1] })
        return acc + Math.abs(a2) / 2
      }, 0)
      return out(area * scale * scale)
    }
    if (/adds up the faces of this wedge: .*Which is true\?$/.test(t)) {
      const w = wedge(q)
      if (Number.isNaN(w.hyp) || Number.isNaN(w.len)) return fail(q)
      return judge(q, claimAfterEq(q), w.base * w.height + w.len * (w.base + w.height + w.hyp))
    }
    if ((m = t.match(new RegExp(`^A box is ${NUM} \\w+ long and ${NUM} \\w+ wide\\. The area of all its faces is ${NUM} square \\w+\\. How tall`)))) {
      const [l, w, sa] = [num(m[1]), num(m[2]), num(m[3])]
      return out((sa / 2 - l * w) / (l + w))
    }
    if ((m = t.match(new RegExp(`triangle at each end, ${NUM} ft across the bottom and ${NUM} ft tall\\. Its two slanted sides are ${NUM} ft from top to bottom, and it is ${NUM} ft long\\. The tent has (no|a) floor\\.`)))) {
      const [b, h, s, l] = [num(m[1]), num(m[2]), num(m[3]), num(m[4])]
      return out(b * h + 2 * s * l + (m[5] === 'a' ? b * l : 0))
    }
    return fail(q)
  },

  'g7m4-t8': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    if (/^What is the volume of this box in cubic \w+\?$/.test(t)) {
      const L = q.picture?.labels
      if (q.picture?.kind !== 'solid' || !L) return fail(q)
      return out(lab(L.l, q) * lab(L.w, q) * lab(L.h, q))
    }
    if (/^This wedge has a triangle base with a square corner\. What is its volume in cubic \w+\?$/.test(t)) {
      const w = wedge(q)
      return Number.isNaN(w.len) ? fail(q) : out(w.base * w.height * w.len / 2)
    }
    if (/says this wedge holds .*Which is true\?$/.test(t)) {
      const w = wedge(q)
      return Number.isNaN(w.len) ? fail(q) : judge(q, claimAfterEq(q), w.base * w.height * w.len / 2)
    }
    if ((m = t.match(new RegExp(`^A wedge holds ${NUM} cubic \\w+\\. Its triangle base is ${NUM} \\w+ along the bottom and ${NUM} \\w+ tall\\. How long is the wedge`))))
      return out(num(m[1]) / (num(m[2]) * num(m[3]) / 2))
    if ((m = t.match(new RegExp(`Its triangle end is ${NUM} ft along the ground and ${NUM} ft tall, and the ramp is ${NUM} ft wide\\. One bag of concrete fills ${NUM} cubic feet\\. How many bags`)))) {
      const v = num(m[1]) * num(m[2]) * num(m[3]) / 2
      return out(Math.ceil(v / num(m[4]) - 1e-9))
    }
    return fail(q)
  },
}
