// Independent answer key for g4m6's generated practice ladders — written from the QUESTIONS
// (`npx tsx scripts/ladder-questions.mts g4m6 150`), never from the generator.
type Q = { text: string; picture: any; choices?: string[] }

// All arithmetic in hundredths (integers) so 0.1 + 0.2 never drifts.
const h = (s: string) => Math.round(Number(s) * 100)
const dec = (hundredths: number) => String(hundredths / 100)
const fail = (q: Q): never => { throw new Error(`g4m6: no rule for: ${q.text}`) }

const one = <T,>(q: Q, fits: (c: string) => boolean): string => {
  const hits = (q.choices ?? []).filter(fits)
  if (hits.length !== 1) throw new Error(`g4m6: ${hits.length} choices fit: ${q.text} ${JSON.stringify(q.choices)}`)
  return hits[0]
}
const sign = (a: number, b: number) => (a < b ? '<' : a > b ? '>' : '=')
const fracH = (s: string) => { const [n, d] = s.split('/').map(Number); return (n * 100) / d }
const shaded = (pic: any) => (pic.shade ?? []).reduce((t: number, r: any) => t + r.h * r.w, 0)
const dot = (q: Q, i = 0) => {
  const p = q.picture
  if (p?.kind !== 'numline' || !p.points?.[i]) fail(q)
  return Math.round(p.points[i].at * 100)
}
const signQ = (q: Q) => {
  const m = q.text.match(/([\d.]+) \? ([\d.]+)\s*$/) ?? fail(q)
  return one(q, c => c === sign(h(m[1]), h(m[2])))
}

export const SOLVE: Record<string, (q: Q) => string> = {
  'g4m6-t1': q => {
    const t = q.text
    let m
    if ((m = t.match(/cut into 10 equal strips\. (\d+) strips? (?:is|are) shaded\. Write the shaded part as a decimal/))) return dec(+m[1] * 10)
    if ((m = t.match(/^Write ([\d.]+) as a fraction with 10 on the bottom/))) return `${h(m[1]) / 10}/10`
    if ((m = t.match(/^Which decimal is the same as (\d+)\/10\?/))) { const v = +m[1] * 10; return one(q, c => h(c) === v) }
    if (/shaded strips are eaten\. What part of the bar is left/.test(t)) return dec((10 - q.picture.bars[0].shaded) * 10)
    if ((m = t.match(/cut into 10 equal \w+\. \w+ uses (\d+) \w+ and \w+ uses (\d+) \w+\. What part .* together, as a decimal/))) return dec((+m[1] + +m[2]) * 10)
    return fail(q)
  },
  'g4m6-t2': q => {
    const t = q.text
    let m
    if (/^This grid has 100 equal squares\. What part is shaded, as a decimal/.test(t)) return dec(shaded(q.picture))
    if ((m = t.match(/^Write (\d+)\/100 as a decimal/))) return dec(+m[1])
    if ((m = t.match(/^Write ([\d.]+) as a fraction with 100 on the bottom/))) return `${h(m[1])}/100`
    if ((m = t.match(/^Which decimal is the same as (\d+)\/100\?/))) { const v = +m[1]; return one(q, c => h(c) === v) }
    if ((m = t.match(/has 100 \w+\. \w+ uses (\d+) \w+ and \w+ uses (\d+)\. What part of the \w+ is left, as a decimal/))) return dec(100 - +m[1] - +m[2])
    return fail(q)
  },
  'g4m6-t3': q => {
    const t = q.text
    let m
    if ((m = t.match(/^([\d.]+) of this 100-square grid is shaded\. How many small squares/))) return String(h(m[1]))
    if ((m = t.match(/^You shade ([\d.]+) of a 100-square grid\. How many small squares/))) return String(h(m[1]))
    if (/^Which sign goes between them\?/.test(t)) return signQ(q)
    if ((m = t.match(/^What number goes in the box\? ([\d.]+) = \?\/100$/))) return String(h(m[1]))
    if ((m = t.match(/^([\d.]+) of a 100-square grid is shaded\. How many full columns of 10/))) {
      const n = h(m[1]); if (n % 10) fail(q); return String(n / 10)
    }
    if ((m = t.match(/has 100 equal \w+\. ([\d.]+) of the [\w ]+?\. ([\d.]+) (?:are|has|have) [\w ]+?\. How many \w+ (?:are|have) \w+ or \w+\?/))) return String(h(m[1]) + h(m[2]))
    return fail(q)
  },
  'g4m6-t4': q => {
    const t = q.text
    let m
    if (/^What number is at the dot\?$/.test(t)) return dec(dot(q))
    if ((m = t.match(/^This line goes from (\d+) to (\d+)\. What number is at the dot\?$/))) {
      if (q.picture.min !== +m[1] || q.picture.max !== +m[2]) fail(q)
      return dec(dot(q))
    }
    if ((m = t.match(/^This line starts at ([\d.]+) and ends at ([\d.]+)\. What number is at the dot\?$/))) {
      if (h(String(q.picture.min)) !== h(m[1]) || h(String(q.picture.max)) !== h(m[2])) fail(q)
      return dec(dot(q))
    }
    if (/How much is the dot really at\?$/.test(t)) {
      const v = dot(q)
      const unit: Record<string, number> = { tenths: 10, tenth: 10, hundredths: 1, hundredth: 1 }
      return one(q, c => { const [n, u] = c.split(' '); return unit[u] !== undefined && +n * unit[u] === v })
    }
    if ((m = t.match(/goes from mile (\d+) to mile (\d+)\. (\w+) stops at the dot.*rides ([\d.]+) of a mile more\. How many miles along the trail/))) {
      if (q.picture.min !== +m[1] || q.picture.max !== +m[2]) fail(q)
      return dec(dot(q) + h(m[4]))
    }
    return fail(q)
  },
  'g4m6-t5': q => {
    const t = q.text
    let m
    if (/Which sign goes between them\?/.test(t)) return signQ(q)
    if ((m = t.match(/says ([\d.]+) ([<>=]) ([\d.]+),.* Is the sign right\?$/))) {
      const ok = sign(h(m[1]), h(m[3])) === m[2]
      return one(q, c => c === (ok ? 'yes' : 'no'))
    }
    if ((m = t.match(/^(\w+) jumps ([\d.]+) meters\. (\w+) jumps ([\d.]+) meters\. Who jumps farther\?$/))) {
      const a = h(m[2]), b = h(m[4])
      return one(q, c => c === (a > b ? m![1] : b > a ? m![3] : 'They tie'))
    }
    if (/^Three friends throw a ball\./.test(t)) {
      const all = [...t.matchAll(/(\w+) throws it ([\d.]+) meters/g)].map(x => ({ who: x[1], d: h(x[2]) }))
      if (all.length !== 3) fail(q)
      const best = Math.max(...all.map(x => x.d))
      const top = all.filter(x => x.d === best)
      if (top.length !== 1) throw new Error(`g4m6: tie for farthest: ${t}`)
      return one(q, c => c === top[0].who)
    }
    return fail(q)
  },
  'g4m6-t6': q => {
    const t = q.text
    let m
    const sum = (a: string, b: string) => +a * 10 + +b
    // either order: "a/10 + b/100" or "b/100 + a/10"
    const pair = (x: string) => {
      const f = [...x.matchAll(/(\d+)\/(10|100)\b/g)]
      if (f.length !== 2 || f[0][2] === f[1][2]) fail(q)
      return f.reduce((acc, g) => acc + (g[2] === '10' ? +g[1] * 10 : +g[1]), 0)
    }
    if ((m = t.match(/(\d+\/100? \+ \d+\/100?) = \?$/))) {
      const s = pair(m[1])
      return /as a decimal/.test(t) ? dec(s) : `${s}/100`
    }
    if ((m = t.match(/says (\d+)\/10 \+ (\d+)\/100 = [\d/]+\. What is the right answer\?$/))) {
      const s = sum(m[1], m[2])
      return one(q, c => /^\d+\/\d+$/.test(c) && fracH(c) === s)
    }
    if ((m = t.match(/fills (\d+)\/10 of a \w+ with [\w ]+? and (\d+)\/100 of it with [\w ]+?\. How much of the \w+ is still empty\? Write it as a decimal/))) return dec(100 - sum(m[1], m[2]))
    return fail(q)
  },
  'g4m6-t7': q => {
    const t = q.text
    let m
    if ((m = t.match(/(\d+) dollars?, (\d+) dimes? and (\d+) (?:penny|pennies)\. How much money is that\?$/))) return dec(+m[1] * 100 + +m[2] * 10 + +m[3])
    if ((m = t.match(/^Write (\d+) dollars? and (\d+) cents? with a point\.$/))) return dec(+m[1] * 100 + +m[2])
    if ((m = t.match(/has (\d+) dollars? and (\d+) (?:penny|pennies), and no dimes\. Which price tag/))) {
      const v = +m[1] * 100 + +m[2]
      return one(q, c => /^\$\d+\.\d+$/.test(c) && h(c.slice(1)) === v)
    }
    if ((m = t.match(/^How many cents is \$(\d+\.\d\d)\?$/))) return String(h(m[1]))
    return fail(q)
  },
}
