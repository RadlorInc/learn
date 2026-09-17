// Independent answer key for g3m5 practice ladders — written from the generated QUESTIONS only
// (scripts/ladder-questions.mts), never from the generator. Each solver reads the text/picture,
// works the maths, and throws on anything it does not recognise or on a text/picture disagreement.
type Q = { text: string; picture: any; choices?: string[] }

const fail = (q: Q, why = 'unrecognised'): never => {
  throw new Error(`g3m5 solver (${why}): ${q.text}`)
}
const frac = (s: string) => {
  const m = s.trim().match(/^(\d+)\/(\d+)$/)
  if (!m) throw new Error(`not a fraction: ${s}`)
  return +m[1] / +m[2]
}
const eq = (a: number, b: number) => Math.abs(a - b) < 1e-9
const oneChoice = (q: Q, fits: (c: string) => boolean) => {
  const hits = (q.choices ?? []).filter(fits)
  if (hits.length !== 1) fail(q, `${hits.length} choices fit`)
  return hits[0]
}
const yesNo = (q: Q, yes: boolean) => oneChoice(q, c => c === (yes ? 'yes' : 'no'))
const tapeRow = (q: Q, i = 0): number[] => {
  const row = q.picture?.rows?.[i]
  if (q.picture?.kind !== 'tape' || !row) fail(q, 'expected tape row')
  return row.cells.map((c: any) => c.w)
}
const allEqual = (ws: number[]) => ws.every(w => w === ws[0])
const bar = (q: Q, i = 0): { parts: number; shaded: number } => {
  const b = q.picture?.bars?.[i]
  if (q.picture?.kind !== 'bars' || !b) fail(q, 'expected bars')
  return b
}
const sign = (a: number, b: number) => (eq(a, b) ? '=' : a < b ? '<' : '>')
const holds = (s: string) => {
  const m = s.match(/^(\d+\/\d+)\s*([<>=])\s*(\d+\/\d+)$/)
  if (!m) throw new Error(`not a comparison: ${s}`)
  return sign(frac(m[1]), frac(m[3])) === m[2]
}
const bigger = (q: Q) => {
  const fs = q.text.match(/\d+\/\d+/g) ?? []
  if (fs.length !== 2) fail(q)
  const [a, b] = fs.map(frac)
  if (eq(a, b)) fail(q, 'equal, no bigger one')
  return oneChoice(q, c => eq(frac(c), Math.max(a, b)))
}
const signQ = (q: Q) => {
  const m = q.text.match(/(\d+\/\d+) \? (\d+\/\d+)/) ?? fail(q)
  return oneChoice(q, c => c === sign(frac(m[1]), frac(m[2])))
}

export const SOLVE: Record<string, (q: Q) => string> = {
  'g3m5-t1': q => {
    const t = q.text
    if (/is cut into equal pieces\. How many equal pieces/.test(t)) {
      const ws = tapeRow(q)
      if (!allEqual(ws)) fail(q, 'says equal but picture is not')
      return String(ws.length)
    }
    let m = t.match(/is cut into (\d+) pieces\. Are the pieces fair\?/)
    if (m) {
      const ws = tapeRow(q)
      if (ws.length !== +m[1]) fail(q, 'piece count disagrees with picture')
      return yesNo(q, allEqual(ws))
    }
    m = t.match(/^Both bars are cut into (\d+) pieces\. Which bar is cut into fair pieces\?/)
    if (m) {
      const top = tapeRow(q, 0), bot = tapeRow(q, 1)
      if (top.length !== +m[1] || bot.length !== +m[1]) fail(q, 'count disagrees')
      return oneChoice(q, c => (c === 'the top bar' ? allEqual(top) : c === 'the bottom bar' ? allEqual(bot) : false))
    }
    if (/One piece of this bar is bigger than the others\. Which piece is it\? Count from the left/.test(t)) {
      const ws = tapeRow(q), max = Math.max(...ws)
      const idx = ws.map((w, i) => (w === max ? i : -1)).filter(i => i >= 0)
      if (idx.length !== 1 || ws.filter(w => w !== max).some(w => w !== ws.find(x => x !== max))) fail(q, 'not one bigger piece')
      return String(idx[0] + 1)
    }
    m = t.match(/^(\d+) friends share .* Does every friend get 1 equal piece\?/)
    if (m) {
      const ws = tapeRow(q)
      return yesNo(q, ws.length === +m[1] && allEqual(ws))
    }
    return fail(q)
  },

  'g3m5-t2': q => {
    const t = q.text
    let m = t.match(/cut into (\d+) equal pieces\. (\d+) pieces? (?:is|are) shaded\. How much/)
    if (m) {
      const b = bar(q)
      if (b.parts !== +m[1] || b.shaded !== +m[2]) fail(q, 'picture disagrees')
      return `${m[2]}/${m[1]}`
    }
    m = t.match(/Each piece is 1\/(\d+) of the .*How many pieces are there\?/)
    if (m) return m[1]
    if (/^Which fraction shows the shaded part of the bar\?/.test(t)) {
      const b = bar(q)
      return oneChoice(q, c => { const [n, d] = c.split('/').map(Number); return n === b.shaded && d === b.parts })
    }
    m = t.match(/cuts an? .+ into (\d+) equal pieces\. \w+ gives (\d+) pieces? to \w+\. How much/)
    if (m) return `${m[2]}/${m[1]}`
    m = t.match(/into equal pieces and eats (\d+) pieces?\. (\d+) pieces? (?:is|are) left\. How much/)
    if (m) return `${m[1]}/${+m[1] + +m[2]}`
    return fail(q)
  },

  'g3m5-t3': q => {
    const t = q.text
    if (/How much of the bar is shaded\?$/.test(t) && /^Count all the pieces/.test(t)) {
      const b = bar(q); return `${b.shaded}/${b.parts}`
    }
    if (/^How much of the bar is white\?$/.test(t)) {
      const b = bar(q); return `${b.parts - b.shaded}/${b.parts}`
    }
    if (/^Which fraction shows the shaded part of the bar\?/.test(t)) {
      const b = bar(q)
      return oneChoice(q, c => { const [n, d] = c.split('/').map(Number); return n === b.shaded && d === b.parts })
    }
    let m = t.match(/cut into (\d+) equal slices\. The family eats (\d+)\/(\d+) of it\. How many slices are left\?/)
    if (m) {
      const eaten = (+m[2] / +m[3]) * +m[1]
      if (!Number.isInteger(eaten)) fail(q, 'eaten is not whole slices')
      return String(+m[1] - eaten)
    }
    m = t.match(/cut into (\d+) equal slices\. Mom eats (\d+) slices?\. Dad eats (\d+) slices?\. How much .* in all\?/)
    if (m) return `${+m[2] + +m[3]}/${m[1]}`
    return fail(q)
  },

  'g3m5-t4': q => {
    const t = q.text, p = q.picture
    const dot = () => (p?.points?.length === 1 ? p.points[0].at : fail(q, 'expected one dot'))
    let m = t.match(/cut into (\d+) equal jumps\. Which fraction is at the dot\?/)
    if (m) {
      const k = dot() * +m[1]
      if (+m[1] !== p.ticks || !eq(k, Math.round(k))) fail(q, 'dot not on a mark')
      return `${Math.round(k)}/${m[1]}`
    }
    if (/The name at the dot is missing/.test(t)) {
      const holes = p.labels.map((l: any, i: number) => (l == null ? i : -1)).filter((i: number) => i >= 0)
      if (holes.length !== 1 || !eq(holes[0] / p.ticks, dot())) fail(q, 'blank label is not at the dot')
      return `${holes[0]}/${p.ticks}`
    }
    if (/^Which fraction is at the dot\?/.test(t)) {
      const at = dot()
      return oneChoice(q, c => eq(frac(c), at))
    }
    m = t.match(/cut into (\d+) equal parts\. .* walks (\d+) parts?\. What fraction of the way has/)
    if (m) return `${m[2]}/${m[1]}`
    m = t.match(/cut into (\d+) equal parts\. \w+ walks (\d+) parts?, stops for a drink, then walks (\d+) more parts?\. What fraction of the way is still left\?/)
    if (m) {
      const left = +m[1] - +m[2] - +m[3]
      if (left < 0) fail(q, 'walked past the end')
      return `${left}/${m[1]}`
    }
    return fail(q)
  },

  'g3m5-t5': q => {
    const t = q.text
    let m = t.match(/^The top bar shows (\d+)\/(\d+)\. The bottom bar is cut into (\d+) equal pieces\. How many pieces do you shade/)
    if (m) {
      const k = (+m[1] / +m[2]) * +m[3]
      if (!Number.isInteger(k)) fail(q, 'not whole pieces')
      return String(k)
    }
    m = t.match(/^Do (\d+\/\d+) and (\d+\/\d+) cover the same amount\?/)
    if (m) return yesNo(q, eq(frac(m[1]), frac(m[2])))
    m = t.match(/(\d+)\/(\d+) = \?\/(\d+)/)
    if (m) {
      const k = (+m[1] / +m[2]) * +m[3]
      if (!Number.isInteger(k)) fail(q, 'no whole top number')
      return String(k)
    }
    if (/^Which one is true\?/.test(t)) {
      return oneChoice(q, c => { const [a, b] = c.split('=').map(frac); return eq(a, b) })
    }
    m = t.match(/eats (\d+)\/(\d+) of a .*cut into (\d+) equal pieces\. \w+ has eaten (\d+) pieces?\. How many more pieces/)
    if (m) {
      const target = (+m[1] / +m[2]) * +m[3]
      if (!Number.isInteger(target) || target - +m[4] < 0) fail(q, 'no whole-piece answer')
      return String(target - +m[4])
    }
    return fail(q)
  },

  'g3m5-t6': q => {
    const t = q.text
    let m = t.match(/cut into (\d+) equal pieces\. All the pieces are shaded\./)
    if (m) return `${m[1]}/${m[1]}`
    if (/^This bar is cut into equal pieces\. How many of these pieces make 1 whole\?/.test(t)) return String(bar(q).parts)
    m = t.match(/^(\d+)\/\? = (\d+)\. What number goes on the bottom\?/)
    if (m) {
      const k = +m[1] / +m[2]
      if (!Number.isInteger(k)) fail(q)
      return String(k)
    }
    m = t.match(/^\?\/(\d+) = (\d+)\. What number goes on the top\?/)
    if (m) return String(+m[1] * +m[2])
    if (/^Which one is true\?/.test(t)) return oneChoice(q, holds)
    m = t.match(/cut into (\d+) equal slices\. Mom eats (\d+) slices? and Dad eats (\d+) slices?\. How many more slices/)
    if (m) {
      const left = +m[1] - +m[2] - +m[3]
      if (left < 0) fail(q)
      return String(left)
    }
    return fail(q)
  },

  'g3m5-t7': q => {
    const t = q.text
    if (/^The top bar shows \d+\/\d+\. The bottom bar shows \d+\/\d+\. Which is bigger\?/.test(t)) return bigger(q)
    if (/^Which is bigger: \d+\/\d+ or \d+\/\d+\?/.test(t)) return bigger(q)
    if (/^Which sign goes in the middle\?/.test(t)) return signQ(q)
    let m = t.match(/^Which is the (smallest|biggest|largest): (\d+\/\d+), (\d+\/\d+) or (\d+\/\d+)\?/)
    if (m) {
      const vs = [m[2], m[3], m[4]].map(frac)
      const want = m[1] === 'smallest' ? Math.min(...vs) : Math.max(...vs)
      if (vs.filter(v => eq(v, want)).length !== 1) fail(q, 'tie')
      return oneChoice(q, c => eq(frac(c), want))
    }
    m = t.match(/^(\w+) and (\w+) each have a same-size pizza cut into (\d+) equal slices\. \w+ has (\d+)\/(\d+) of her pizza left\. \w+ has (\d+)\/(\d+) of his pizza left\. Who ate more\?/)
    if (m) {
      const a = frac(`${m[4]}/${m[5]}`), b = frac(`${m[6]}/${m[7]}`)
      if (eq(a, b)) fail(q, 'ate the same')
      return oneChoice(q, c => c === (a < b ? m![1] : m![2]))
    }
    return fail(q)
  },

  'g3m5-t8': q => {
    const t = q.text
    if (/^The top bar shows \d+\/\d+\. The bottom bar shows \d+\/\d+\. Which is bigger\?/.test(t)) return bigger(q)
    if (/^Which is bigger: \d+\/\d+ or \d+\/\d+\?/.test(t)) return bigger(q)
    if (/^Which sign goes in the middle\?/.test(t)) return signQ(q)
    let m = t.match(/^\w+ says (\d+\/\d+) is bigger than (\d+\/\d+)\. Is \w+ right\?/)
    if (m) return yesNo(q, frac(m[1]) > frac(m[2]) && !eq(frac(m[1]), frac(m[2])))
    m = t.match(/^(\d+) kids share one pizza equally at the red table\. (\d+) kids share a same-size pizza equally at the blue table\. At which table does each kid get more pizza\?/)
    if (m) {
      if (+m[1] === +m[2]) fail(q, 'same share')
      return oneChoice(q, c => c === (+m![1] < +m![2] ? 'the red table' : 'the blue table'))
    }
    return fail(q)
  },
}
