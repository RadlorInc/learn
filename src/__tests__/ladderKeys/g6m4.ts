// Blind answer key for g6m4's practice ladders — written from the printed questions
// (`npx tsx scripts/ladder-questions.mts g6m4 N`), never from the generator.
// Every amount is kept as an exact fraction (n/d), so "% of" never meets float error.
type Q = { text: string; picture: any; choices?: string[] }
type R = [number, number]

const fail = (q: Q): never => { throw new Error(`g6m4 key: no rule for "${q.text}"`) }

const gcd = (a: number, b: number): number => (b === 0 ? (a < 0 ? -a : a) : gcd(b, a % b))
const norm = ([n, d]: R): R => { const g = gcd(n, d) || 1; const s = d < 0 ? -1 : 1; return [(s * n) / g, (s * d) / g] }
/** "1,250" / "5.6" / "12" → exact fraction. */
function num(s: string): R {
  const t = s.replace(/,/g, '')
  if (!/^\d+(\.\d+)?$/.test(t)) throw new Error(`g6m4 key: not a number "${s}"`)
  const [w, f = ''] = t.split('.')
  return norm([Number(w + f), 10 ** f.length])
}
const add = (a: R, b: R): R => norm([a[0] * b[1] + b[0] * a[1], a[1] * b[1]])
const sub = (a: R, b: R): R => add(a, [-b[0], b[1]])
const mul = (a: R, b: R): R => norm([a[0] * b[0], a[1] * b[1]])
const div = (a: R, b: R): R => { if (b[0] === 0) throw new Error('g6m4 key: divide by 0'); return norm([a[0] * b[1], a[1] * b[0]]) }
const pct = (p: R): R => div(p, [100, 1])
const eq = (a: R, b: R) => a[0] === b[0] && a[1] === b[1]
/** Exact decimal text; throws if the fraction does not terminate (no rounding is ever guessed). */
function show(r: R): string {
  let [n, d] = norm(r)
  const neg = n < 0; if (neg) n = -n
  let places = 0
  while (d !== 1) {
    if (d % 2 !== 0 && d % 5 !== 0) throw new Error(`g6m4 key: ${r[0]}/${r[1]} is not a terminating decimal`)
    n *= 10; places++
    const g = gcd(n, d); n /= g; d /= g
  }
  let s = n.toString()
  if (places) { s = s.padStart(places + 1, '0'); s = `${s.slice(0, -places)}.${s.slice(-places)}` }
  return (neg ? '-' : '') + s
}

/** Exactly one choice must fit, or the question is defective. */
function pick(q: Q, fits: (c: string) => boolean): string {
  const ok = (q.choices ?? []).filter(fits)
  if (ok.length !== 1) throw new Error(`g6m4 key: ${ok.length} choices fit "${q.text}" ${JSON.stringify(q.choices)}`)
  return ok[0]
}
const m = (q: Q, re: RegExp): RegExpMatchArray => q.text.match(re) ?? fail(q)
const N = '(\\d[\\d,]*(?:\\.\\d+)?)'
const rx = (s: string) => new RegExp(s.replace(/\bN\b/g, N))

/** Distinct shaded cells of a grid picture (overlaps counted once), as a share of all cells, in percent. */
function shadedPercent(q: Q): R {
  const p = q.picture
  if (p?.kind !== 'grid') fail(q)
  const seen = new Set<string>()
  for (const s of p.shade ?? []) {
    for (let r = s.r; r < s.r + s.h; r++) for (let c = s.c; c < s.c + s.w; c++) {
      if (r < 0 || c < 0 || r >= p.rows || c >= p.cols) throw new Error(`g6m4 key: shading off the grid in "${q.text}"`)
      seen.add(`${r},${c}`)
    }
  }
  return div(mul([(seen.size), 1], [100, 1]), [(p.rows * p.cols), 1])
}
/** Checks the stated grid size agrees with the picture. */
function gridOf100(q: Q) {
  const [, total] = m(q, rx('has N equal squares'))
  if (!eq(num(total), [(q.picture.rows * q.picture.cols), 1])) throw new Error(`g6m4 key: grid is not ${total} squares in "${q.text}"`)
}

/** A tape's shaded percent cells must add up to the percent the text states — else text and picture disagree. */
function tapeAgrees(q: Q, percent: R) {
  const row = (q.picture?.rows ?? []).find((r: any) => r.label === 'Percent')
  if (!row) throw new Error(`g6m4 key: no Percent row in "${q.text}"`)
  let sum: R = [0, 1]
  for (const c of row.cells) if (c.shade) sum = add(sum, mul(num(String(c.text).replace('%', '')), [c.w ?? 1, 1]))
  if (!eq(sum, percent)) throw new Error(`g6m4 key: picture shades ${show(sum)}% but the text says ${show(percent)}% in "${q.text}"`)
}

export const SOLVE: Record<string, (q: Q) => string> = {
  'g6m4-t1': q => {
    const t = q.text
    if (/What percent of the grid is NOT shaded/.test(t)) { gridOf100(q); return show(sub([100, 1], shadedPercent(q))) }
    if (/What percent of the grid is shaded/.test(t)) { gridOf100(q); return show(shadedPercent(q)) }
    if (/Which one is true\?/.test(t)) {
      gridOf100(q)
      const s = shadedPercent(q)
      return pick(q, c => { const x = c.match(rx('^N% is shaded$')); return !!x && eq(num(x[1]), s) })
    }
    let x = t.match(rx('has N \\w[\\w ]*?\\. N of them are .*What percent of the'))
    if (x) return show(mul(div(num(x[2]), num(x[1])), [100, 1]))
    x = t.match(rx('has N equal tiles\\. One class paints N tiles and another class paints N tiles\\. What percent of the wall is still not painted'))
    if (x) return show(mul(div(sub(num(x[1]), add(num(x[2]), num(x[3]))), num(x[1])), [100, 1]))
    x = t.match(rx('You have one dollar\\. You spend N cents on .* and N cents on .*What percent of your dollar is left'))
    if (x) return show(sub([100, 1], add(num(x[1]), num(x[2]))))
    return fail(q)
  },

  'g6m4-t2': q => {
    const t = q.text
    const frac = (s: string): R => { const [a, b] = s.split('/'); return div(num(a), num(b)) }
    let x = t.match(/^What percent is (\d+\/\d+)\?/)
    if (x) return show(mul(frac(x[1]), [100, 1]))
    x = t.match(rx('^Write N as a percent'))
    if (x) return show(mul(num(x[1]), [100, 1]))
    x = t.match(rx('^Write N% as a decimal'))
    if (x) return show(pct(num(x[1])))
    x = t.match(/^Which percent is the same amount as (\d+\/\d+)\?/)
    if (x) { const v = mul(frac(x[1]), [100, 1]); return pick(q, c => { const y = c.match(rx('^N%$')); return !!y && eq(num(y[1]), v) }) }
    x = t.match(rx('^N% is the same as a fraction with N on the bottom'))
    if (x) return show(mul(pct(num(x[1])), num(x[2])))
    x = t.match(rx('N seeds\\. N of them do not sprout\\. What percent of the seeds sprout'))
      ?? t.match(rx('has N questions\\. \\w+ gets N wrong\\. What percent of the questions does \\w+ get right'))
      ?? t.match(rx('takes N free throws\\. She misses N of them\\. What percent of her free throws does \\w+ make'))
    if (x) return show(mul(div(sub(num(x[1]), num(x[2])), num(x[1])), [100, 1]))
    return fail(q)
  },

  'g6m4-t3': q => {
    const t = q.text
    let x = t.match(rx('^What is N% of N\\?'))
    if (x && q.picture?.kind === 'tape') tapeAgrees(q, num(x[1]))
    if (x) return show(mul(pct(num(x[1])), num(x[2])))
    if (/^Which one is true\?$/.test(t)) {
      return pick(q, c => { const y = c.match(rx('^N% of N = N$')); return !!y && eq(mul(pct(num(y[1])), num(y[2])), num(y[3])) })
    }
    x = t.match(rx('^N is what percent of N\\?'))
    if (x) return show(mul(div(num(x[1]), num(x[2])), [100, 1]))
    x = t.match(rx('has N \\w+\\. N% of them [^.]+\\. The rest .*How many'))
    if (x) return show(mul(pct(sub([100, 1], num(x[2]))), num(x[1])))
    return fail(q)
  },

  'g6m4-t4': q => {
    const t = q.text
    let x = t.match(rx('^N is N% of what number\\?')) ?? t.match(rx('^Find the missing number: N is N% of \\?'))
    if (x && q.picture?.kind === 'tape') tapeAgrees(q, num(x[2]))
    if (x) return show(div(num(x[1]), pct(num(x[2]))))
    x = t.match(rx('^The shaded pieces are N% of a number, and together they are N\\.'))
    if (x) tapeAgrees(q, num(x[1]))
    if (x) return show(div(num(x[2]), pct(num(x[1]))))
    if (/^Which one is true\?$/.test(t)) {
      return pick(q, c => { const y = c.match(rx('^N is N% of N$')); return !!y && eq(mul(pct(num(y[2])), num(y[3])), num(y[1])) })
    }
    x = t.match(rx('read N pages of a book\\. That is N% of the book\\. How many pages are left'))
      ?? t.match(rx('has gone N miles\\. That is N% of the trip\\. How many miles are left'))
      ?? t.match(rx('You have saved \\$N\\. That is N% of the price of a bike\\. How many more dollars'))
    if (x) tapeAgrees(q, num(x[2]))
    if (x) { const whole = div(num(x[1]), pct(num(x[2]))); return show(sub(whole, num(x[1]))) }
    return fail(q)
  },

  'g6m4-t5': q => {
    const t = q.text
    let x = t.match(rx('costs \\$N\\. It is N% off\\. (.*)$'))
    if (x) {
      const price = num(x[1]), off = mul(pct(num(x[2])), price), pay = sub(price, off)
      if (/How many dollars do you save\?$/.test(x[3])) return show(off)
      if (/What is the sale price, in dollars\?$/.test(x[3])) return show(pay)
      if (/^Which one is true\?$/.test(x[3])) return pick(q, c => { const y = c.match(rx('^You pay \\$N$')); return !!y && eq(num(y[1]), pay) })
      return fail(q)
    }
    x = t.match(rx('was \\$N\\. On sale it costs \\$N\\. What percent off'))
    if (x) return show(mul(div(sub(num(x[1]), num(x[2])), num(x[1])), [100, 1]))
    x = t.match(rx('buys an? [\\w ]+ for \\$N and an? [\\w ]+ for \\$N\\. The store takes N% off everything\\. How many dollars does \\w+ pay\\?'))
    if (x) { const total = add(num(x[1]), num(x[2])); return show(mul(total, sub([1, 1], pct(num(x[3]))))) }
    return fail(q)
  },

  'g6m4-t6': q => {
    const t = q.text
    let x = t.match(rx('costs \\$N\\. The sales tax is N%\\. (.*)$'))
    if (x) {
      const price = num(x[1]), tax = mul(pct(num(x[2])), price), total = add(price, tax)
      if (/How many dollars is the tax\?$/.test(x[3])) return show(tax)
      if (/What is the total, in dollars\?$/.test(x[3])) return show(total)
      if (/^Which one is true\?$/.test(x[3])) return pick(q, c => { const y = c.match(rx('^Total: \\$N$')); return !!y && eq(num(y[1]), total) })
      return fail(q)
    }
    x = t.match(rx('costs \\$N\\. With sales tax, the total is \\$N\\. What percent is the sales tax'))
    if (x) return show(mul(div(sub(num(x[2]), num(x[1])), num(x[1])), [100, 1]))
    x = t.match(rx('buys (?:an? |a pair of )?[\\w ]+ for \\$N and an? [\\w ]+ for \\$N\\. The sales tax is N%\\. How many dollars does \\w+ pay in all\\?'))
    if (x) { const total = add(num(x[1]), num(x[2])); return show(mul(total, add([1, 1], pct(num(x[3]))))) }
    return fail(q)
  },

  'g6m4-t7': q => {
    const t = q.text
    let x = t.match(rx('^A bank pays you \\$N of interest every year\\. How many dollars does the bank pay you in N years in all\\?'))
    if (x) return show(mul(num(x[1]), num(x[2])))
    x = t.match(rx('^You put \\$N in a bank that pays N% a year\\. How many dollars does the bank pay you in N years\\?'))
    if (x) return show(mul(mul(num(x[1]), pct(num(x[2]))), num(x[3])))
    x = t.match(rx('^You put \\$N in a bank that pays N% a year for N years\\. Which one is true about the interest\\?'))
    if (x) {
      const years = num(x[3]), interest = mul(mul(num(x[1]), pct(num(x[2]))), years)
      return pick(q, c => { const y = c.match(rx('^In N years: \\$N$')); return !!y && eq(num(y[1]), years) && eq(num(y[2]), interest) })
    }
    x = t.match(rx('^You put \\$N in a bank that pays N% a year\\. How much money do you have IN ALL after N years'))
    if (x) return show(add(num(x[1]), mul(mul(num(x[1]), pct(num(x[2]))), num(x[3]))))
    x = t.match(rx('puts \\$N in a savings account that pays N% a year\\. How many years until the bank has paid \\w+ \\$N in interest\\?'))
    if (x) return show(div(num(x[3]), mul(num(x[1]), pct(num(x[2])))))
    return fail(q)
  },
}
