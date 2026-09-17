// Independent answer key for the g7m5 practice ladders. Written from the QUESTIONS only
// (scripts/ladder-questions.mts output) and the teaching lesson's definitions — never from the
// generator. Fair sample = everyone in the whole group has the same chance (a random draw from the
// whole group); size never makes a sample fair. Spread = range, as in the lesson's Topic 3.
type Q = { text: string; picture: any; choices?: string[] }

// ── exact fractions ──────────────────────────────────────────────────────────────────────────
type F = [number, number]
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b))
const fr = (n: number, d = 1): F => {
  if (d === 0) throw new Error('division by zero')
  if (!Number.isInteger(n) || !Number.isInteger(d)) throw new Error(`non-integer fraction ${n}/${d}`)
  const g = gcd(n, d) || 1, s = d < 0 ? -1 : 1
  return [(s * n) / g, (s * d) / g]
}
const add = (a: F, b: F) => fr(a[0] * b[1] + b[0] * a[1], a[1] * b[1])
const sub = (a: F, b: F) => fr(a[0] * b[1] - b[0] * a[1], a[1] * b[1])
const mul = (a: F, b: F) => fr(a[0] * b[0], a[1] * b[1])
const div = (a: F, b: F) => fr(a[0] * b[1], a[1] * b[0])
const eq = (a: F, b: F) => a[0] === b[0] && a[1] === b[1]
const cmp = (a: F, b: F) => a[0] * b[1] - b[0] * a[1]
const abs = (a: F): F => [Math.abs(a[0]), a[1]]
const fstr = (a: F) => (a[1] === 1 ? String(a[0]) : `${a[0]}/${a[1]}`)
/** A decimal string for a number answer; throws if it does not terminate. */
function dec(a: F): string {
  let d = a[1]
  while (d % 2 === 0) d /= 2
  while (d % 5 === 0) d /= 5
  if (d !== 1) throw new Error(`${fstr(a)} is not a terminating decimal`)
  return String(a[0] / a[1])
}
const num = (s: string) => Number(s.replace(/,/g, ''))
/** "3/8" or "0.25" or "12" → exact fraction */
function pf(s: string): F {
  s = s.replace(/,/g, '').replace(/\.$/, '')
  const m = s.match(/^(-?\d+)\/(\d+)$/)
  if (m) return fr(+m[1], +m[2])
  const dm = s.match(/^(-?\d+)(?:\.(\d+))?$/)
  if (dm) return dm[2] ? fr(+(dm[1] + dm[2]), 10 ** dm[2].length) : fr(+dm[1])
  throw new Error(`not a number: ${s}`)
}
const NUM = String.raw`\d[\d,]*(?:\.\d+)?(?:\/\d+)?`

function fail(q: Q, why = 'no question kind matched'): never {
  throw new Error(`${why}: ${q.text}`)
}
function only(q: Q, fits: (c: string) => boolean): string {
  const hit = (q.choices ?? fail(q, 'no choices')).filter(fits)
  if (hit.length !== 1) fail(q, `${hit.length} choices fit`)
  return hit[0]
}
function m(q: Q, re: RegExp): RegExpMatchArray {
  return q.text.match(re) ?? fail(q)
}

// ── Topic 1: fair samples ────────────────────────────────────────────────────────────────────
// The lesson: a sample is fair when EVERYONE in the whole group has the same chance to be picked.
// So each plan is read as "who CAN be picked": the whole group by chance, or only one kind of person.
type Pool = { kind: 'everyone' } | { kind: 'only'; who: string }

/** The one kind of person a phrase is about (a plan, or a "who has no chance" choice). */
function kindOf(s: string): string | null {
  const bus = s.match(/\bbus (\d+)\b/)
  if (bus) return `bus ${bus[1]}`
  const kinds: [RegExp, string][] = [
    [/basketball team|on the team\b/, 'team'], [/pizza club/, 'pizza club'], [/library at lunch/, 'library'],
    [/taco truck/, 'taco truck'], [/park on Saturday/, 'park'], [/swimming class/, 'swimming class'],
    [/live (?:closest to you|nearby)/, 'neighbors'],
  ]
  const hit = kinds.filter(([re]) => re.test(s))
  if (hit.length > 1) throw new Error(`two kinds of person in "${s}"`)
  return hit.length ? hit[0][1] : null
}

/** Who can be picked under this plan, for a whole group of `pop`. `same` = the plan being changed. */
function pool(plan: string, pop: number, same?: Pool): Pool {
  const r = plan.match(/^A computer picks [\d,]+ of all ([\d,]+) .* by chance$/) ??
    plan.match(/^Pick [\d,]+ of all ([\d,]+) .* by chance$/) ??
    plan.match(/^[\d,]+ numbers drawn from a hat with a number for each of the ([\d,]+) /) ??
    plan.match(/^All ([\d,]+) names on cards, shuffled, and [\d,]+ picked without looking$/)
  if (r) {
    if (num(r[1]) !== pop) throw new Error(`plan draws from ${r[1]}, whole group is ${pop}: ${plan}`)
    return { kind: 'everyone' }
  }
  if (/^Ask [\d,]+ people the same way instead of [\d,]+$/.test(plan)) {
    if (!same) throw new Error(`"the same way" with no plan to copy: ${plan}`)
    return same // more people, same pool
  }
  const who = kindOf(plan)
  if (who) return { kind: 'only', who }
  throw new Error(`cannot tell who this plan can pick: ${plan}`)
}
const fairPool = (p: Pool) => p.kind === 'everyone'

function t1(q: Q): string {
  const pop = num(m(q, /(?:all|of the) ([\d,]+) /)[1])
  const plan = (): Pool => pool(q.picture?.rows?.[0]?.[1] ?? fail(q, 'no plan in table'), pop)
  if (/Is that a fair sample\?$/.test(q.text)) {
    const fair = fairPool(plan())
    return only(q, c => (fair ? c.startsWith('fair:') : c === 'not fair: some people have no chance'))
  }
  if (/Which plan gives a fair sample\?$/.test(q.text)) return only(q, c => fairPool(pool(c, pop)))
  if (/Who has no chance to be picked\?$/.test(q.text)) {
    const p = plan()
    return only(q, c => {
      if (c === 'Nobody is left out') return fairPool(p)
      const who = kindOf(c) ?? fail(q, `choice names no kind of person: "${c}"`)
      const outside = /\b(?:not|do not)\b/.test(c) // "Kids who are not on the team" vs "Kids on the team"
      return p.kind === 'only' && who === p.who && outside
    })
  }
  if (/says: "My sample is fair because I asked/.test(q.text)) {
    const fair = fairPool(plan())
    return only(q, c => (fair ? c.startsWith('It is fair, but not because it is big') : c.startsWith('It is not fair, even though it is big')))
  }
  if (/is not fair\. Which change makes it a fair sample\?$/.test(q.text)) {
    const p = plan()
    if (fairPool(p)) fail(q, 'plan said to be unfair is fair')
    return only(q, c => fairPool(pool(c, pop, p)))
  }
  fail(q)
}

// ── Topic 2: predict from a sample ───────────────────────────────────────────────────────────
function t2(q: Q): string {
  const whole = (n: number, k: number, N: number) => mul(fr(k, n), fr(N))
  let r = q.text.match(new RegExp(`^You check (${NUM}) .*?, picked by chance\\. (${NUM}) of them .*\\. Predict how many of all (${NUM}) `))
  if (r) return dec(whole(num(r[1]), num(r[2]), num(r[3])))
  r = q.text.match(new RegExp(`^In a sample of (${NUM}) .* picked by chance, (${NUM}) .* and (${NUM}) .*\\. There are (${NUM}) .* in all\\. Predict how many more`))
  if (r) return dec(whole(num(r[1]), num(r[2]) - num(r[3]), num(r[4])))
  r = q.text.match(new RegExp(`^In a sample of (${NUM}) .* picked by chance, (${NUM}) ([^.]*)\\. There are (${NUM}) .* in all\\. Predict how many (.*)\\.$`))
  if (r) {
    // the asked group must be the other side of the counted one
    const [had, asked] = [r[3], r[5]]
    const opposite = asked === had.replace(/^do not /, '') || asked === had.replace(/^(\w+)/, 'do not $1') ||
      asked === had.replace(/^have a /, 'have no ') || asked === had.replace(/^bought /, 'did not buy ')
    if (!opposite) fail(q, `"${asked}" is not the other side of "${had}"`)
    return dec(sub(fr(num(r[4])), whole(num(r[1]), num(r[2]), num(r[4]))))
  }
  r = q.text.match(new RegExp(`^(\\w+) checks (${NUM}) of (${NUM}) .*, picked by chance, and (${NUM}) .*\\. \\1 predicts that (${NUM}) of all (${NUM}) .* Which is true\\?$`))
  if (r) {
    const [n, N, k, said] = [num(r[2]), num(r[3]), num(r[4]), fr(num(r[5]))]
    if (num(r[6]) !== N) fail(q, 'two whole-group sizes')
    const right = whole(n, k, N)
    return only(q, c =>
      / is right$/.test(c) ? eq(said, right)
        : / predicted the .* (?:do not|did not|no|work$)/.test(c) ? eq(said, sub(fr(N), right))
          : / stopped at the count in the sample$/.test(c) ? eq(said, fr(k))
            : fail(q, `unknown choice "${c}"`))
  }
  r = q.text.match(new RegExp(`^You check (${NUM}) .*, picked by chance, and count how many .*\\. From that, you predict (${NUM}) of all (${NUM}) .* How many in your sample`))
  if (r) return dec(mul(fr(num(r[2]), num(r[3])), fr(num(r[1]))))
  fail(q)
}

// ── Topic 3: compare two groups ──────────────────────────────────────────────────────────────
const rowNums = (row: string[]) => row.slice(1).map(v => (v === '?' ? NaN : num(v)))
const mean = (xs: number[]) => fr(xs.reduce((a, b) => a + b, 0), xs.length)
const range = (xs: number[]) => Math.max(...xs) - Math.min(...xs)
const mad = (xs: number[]) => { const mu = mean(xs); return xs.reduce((s, x) => add(s, abs(sub(fr(x), mu))), fr(0)) }

function t3(q: Q): string {
  const rows: string[][] = q.picture?.rows ?? []
  if (/What is the difference between the mean /.test(q.text) && q.picture?.kind === 'table') {
    if (rows.length !== 2) fail(q, 'expected two rows')
    return dec(abs(sub(mean(rowNums(rows[0])), mean(rowNums(rows[1])))))
  }
  if (/^The dot plot shows/.test(q.text)) {
    const p = q.picture
    const xs: number[] = []
    p.labels.forEach((l: string, i: number) => { for (let j = 0; j < p.values[i]; j++) xs.push(num(l)) })
    const count = num(m(q, /Class A's (\d+) plants/)[1])
    if (xs.length !== count) fail(q, `dot plot has ${xs.length} dots, text says ${count}`)
    const other = pf(m(q, new RegExp(`mean height of (${NUM}) inches`))[1])
    return dec(abs(sub(mean(xs), other)))
  }
  if (/Both have a mean of .* Which is true\?$/.test(q.text)) {
    const said = pf(m(q, new RegExp(`Both have a mean of (${NUM})`))[1])
    const [a, b] = rows.map(rowNums)
    if (!eq(mean(a), said) || !eq(mean(b), said)) fail(q, 'the means in the table do not match the text')
    const byRange = Math.sign(range(a) - range(b)), byMad = Math.sign(cmp(mad(a), mad(b)))
    if (byRange !== byMad) fail(q, 'range and MAD disagree about which is more spread out')
    const want = byRange === 0 ? 'Both are spread out the same' : `${rows[byRange > 0 ? 0 : 1][0]} is more spread out`
    return only(q, c => c === want)
  }
  let r = q.text.match(/ ([\w ]+?)'s mean is (\d+(?:\.\d+)?) (more|less) than ([\w ]+?)'s mean\. What is the missing number\?$/)
  if (r) {
    const [, who, d, dir, than] = r
    const target = rows.find(x => x[0] === who), base = rows.find(x => x[0] === than)
    if (!target || !base || target === base) fail(q, 'row names do not match the text')
    const goal = (dir === 'more' ? add : sub)(mean(rowNums(base)), pf(d))
    const known = rowNums(target).filter(v => !Number.isNaN(v))
    if (known.length !== target.length - 2) fail(q, 'expected exactly one missing value')
    return dec(sub(mul(goal, fr(target.length - 1)), fr(known.reduce((s, v) => s + v, 0))))
  }
  if (/Find the gap between the means\. Is it a big or a small difference next to the spread\?$/.test(q.text)) {
    const [a, b] = rows.map(rowNums)
    const gap = abs(sub(mean(a), mean(b)))
    if (gap[0] === 0) return only(q, c => c.startsWith('no difference'))
    const vs = [range(a), range(b)].map(s => cmp(gap, fr(s)))
    if (vs.every(v => v > 0)) return only(q, c => c.startsWith('a big difference'))
    if (vs.every(v => v < 0)) return only(q, c => c.startsWith('a small difference'))
    fail(q, `gap ${fstr(gap)} is not clearly above or below both ranges ${range(a)}, ${range(b)}`)
  }
  fail(q)
}

// ── Topic 4: probability of an event ─────────────────────────────────────────────────────────
function spinnerChance(q: Q, color: string): F {
  const parts: string[] = q.picture?.kind === 'spinner' ? q.picture.parts : fail(q, 'no spinner')
  const said = q.text.match(/has (\d+) equal parts/)
  if (said && num(said[1]) !== parts.length) fail(q, `text says ${said[1]} parts, spinner has ${parts.length}`)
  return fr(parts.filter(p => p === color).length, parts.length)
}

function t4(q: Q): string {
  let r = q.text.match(/probability of landing on (\w+)\? Write a fraction/)
  if (r) return fstr(spinnerChance(q, r[1]))
  r = q.text.match(/marbles in a bag\. You pick one without looking\. What is the probability it is (\w+)\?$/)
  if (r) {
    const head: string[] = q.picture.head, counts = rowNums(['', ...q.picture.rows[0]])
    const i = head.indexOf(r[1])
    if (i < 0) fail(q, 'color not in table')
    return fstr(fr(counts[i], counts.reduce((s, v) => s + v, 0)))
  }
  r = q.text.match(new RegExp(`^This spinner has \\d+ equal parts\\. (\\w+) says the probability of landing on (\\w+) is (${NUM})\\. Which is true\\?$`))
  if (r) {
    const said = pf(r[3]), parts: string[] = q.picture.parts
    const k = parts.filter(p => p === r![2]).length
    return only(q, c =>
      / is right$/.test(c) ? eq(said, spinnerChance(q, r![2]))
        : / counted colors, not parts$/.test(c) ? eq(said, fr(1, new Set(parts).size))
          : / over only the parts that are not /.test(c) ? k < parts.length && eq(said, fr(k, parts.length - k))
            : fail(q, `unknown choice "${c}"`))
  }
  r = q.text.match(/^A box has (\d+) \w+, and (\d+) of them .* probability of NOT getting .* Write it as a decimal\.$/)
  if (r) return dec(fr(num(r[1]) - num(r[2]), num(r[1])))
  r = q.text.match(new RegExp(`^A bag has (\\d+) red marbles and some blue marbles, and nothing else\\. The probability of picking red is (${NUM})\\. How many blue`))
  if (r) return dec(sub(div(fr(num(r[1])), pf(r[2])), fr(num(r[1]))))
  fail(q)
}

// ── Topic 5: expected vs actual ──────────────────────────────────────────────────────────────
/** The chance of one outcome and the number of trials, from the experiment sentence. */
function trial(q: Q): { p: F; n: number } {
  let r = q.text.match(/You flip a coin (\d[\d,]*) times/)
  if (r) return { p: fr(1, 2), n: num(r[1]) }
  r = q.text.match(/You roll a number cube (\d[\d,]*) times/)
  if (r) return { p: fr(1, 6), n: num(r[1]) }
  r = q.text.match(/You spin a spinner with (\d+) equal parts, (\d+) of them \w+, (\d[\d,]*) times/)
  if (r) return { p: fr(num(r[2]), num(r[1])), n: num(r[3]) }
  r = q.text.match(/You pick a card from (\d+) cards numbered (\d+) to (\d+),? and put it back, (\d[\d,]*) times/)
  if (r) {
    if (num(r[3]) - num(r[2]) + 1 !== num(r[1])) fail(q, 'card count does not match its numbers')
    return { p: fr(1, num(r[1])), n: num(r[4]) }
  }
  fail(q, 'unknown experiment')
}

function t5(q: Q): string {
  if (/How many times do you expect to get /.test(q.text)) {
    const { p, n } = trial(q)
    return dec(mul(p, fr(n)))
  }
  let r = q.text.match(/^You spin this spinner (\d[\d,]*) times\. How many times do you expect it to land on (\w+)\?$/)
  if (r) return dec(mul(spinnerChance(q, r[2]), fr(num(r[1]))))
  if (/The chart shows what really happened\. How far is the real number/.test(q.text)) {
    const { p, n } = trial(q)
    const vals: number[] = q.picture.values
    if (vals.reduce((s, v) => s + v, 0) !== n) fail(q, 'chart does not add up to the trials')
    return dec(abs(sub(fr(vals[0]), mul(p, fr(n)))))
  }
  r = q.text.match(new RegExp(`came closer to the chance of (${NUM})\\?$`))
  if (r) {
    const p = pf(r[1]), rows: string[][] = q.picture.rows
    const off = rows.map(([n, h]) => abs(sub(fr(num(h), num(n)), p)))
    const c = cmp(off[0], off[1])
    return only(q, ch => (c === 0 ? ch.startsWith('both') : ch === `the ${rows[c < 0 ? 0 : 1][0]} flips`))
  }
  r = q.text.match(new RegExp(`^The chance of winning .* is (${NUM})\\. The organizers expect (${NUM}) winners today\\. How many .* expect to play\\?$`))
  if (r) return dec(div(fr(num(r[2])), pf(r[1])))
  fail(q)
}

// ── Topic 6: compound events ─────────────────────────────────────────────────────────────────
function numbers(q: Q, text: string): number[] {
  if (/number cube/.test(text)) return [1, 2, 3, 4, 5, 6]
  const r = text.match(/numbered (\d+) to (\d+)/) ?? fail(q, 'no number range')
  const out: number[] = []
  for (let i = num(r[1]); i <= num(r[2]); i++) out.push(i)
  return out
}
function numEvent(q: Q, ev: string): (x: number) => boolean {
  let r: RegExpMatchArray | null
  if (ev === 'an even number') return x => x % 2 === 0
  if (ev === 'an odd number') return x => x % 2 === 1
  if ((r = ev.match(/^a number greater than (\d+)$/))) { const k = num(r[1]); return x => x > k }
  if ((r = ev.match(/^a number less than (\d+)$/))) { const k = num(r[1]); return x => x < k }
  if ((r = ev.match(/^an? (\d+)$/))) { const k = num(r[1]); return x => x === k }
  fail(q, `unknown event "${ev}"`)
}
/** coin + one number device: P(side and event) */
function coinAnd(q: Q, ev: string): F {
  const sp = q.text.match(/spinner with (\d+) equal parts/)
  const xs = numbers(q, q.text)
  if (sp && num(sp[1]) !== xs.length) fail(q, 'spinner part count does not match its numbers')
  const hdr: string[] = q.picture?.head ?? []
  if (hdr.length && hdr.length - 1 !== xs.length) fail(q, 'table columns do not match the outcomes')
  return fr(xs.filter(numEvent(q, ev)).length, 2 * xs.length)
}

function t6(q: Q): string {
  let r = q.text.match(/^You pick one \w+(?: \w+)? \(([^)]*)\) and one \w+ \(([^)]*)\)\. How many different/)
  if (r) {
    const count = (s: string) => s.split(/, | or /).length
    return String(count(r[1]) * count(r[2]))
  }
  r = q.text.match(/What is the probability of (?:heads|tails) and (.+)\?$/)
  if (r && /^You flip a coin and/.test(q.text)) return fstr(coinAnd(q, r[1]))
  r = q.text.match(new RegExp(`(\\w+) finds the probability of (?:heads|tails) and (.+?) like this: "(.*)" Which is true\\?$`))
  if (r) {
    const [, , ev, work] = r
    const said = pf((work.match(new RegExp(`(${NUM})\\.?$`)) ?? fail(q, 'no final value'))[1])
    const right = coinAnd(q, ev)
    const n = numbers(q, q.text).length
    const k = numbers(q, q.text).filter(numEvent(q, ev)).length
    return only(q, c =>
      / is right$/.test(c) ? eq(said, right)
        : / added the rows and columns instead of multiplying$/.test(c) ? !eq(said, right) && eq(said, fr(k, 2 + n))
          : / added the two chances$/.test(c) ? !eq(said, right) && eq(said, add(fr(1, 2), fr(k, n)))
            : fail(q, `unknown choice "${c}"`))
  }
  r = q.text.match(/What is the probability that the two numbers add up to (\d+)\?$/)
  if (r) {
    const target = num(r[1])
    let a: number[], b: number[]
    if (/two number cubes/.test(q.text)) a = b = [1, 2, 3, 4, 5, 6]
    else {
      const both = q.text.match(/both numbered (\d+) to (\d+)/)
      const two = q.text.match(/one numbered (\d+) to (\d+) and one numbered (\d+) to (\d+)/)
      const rg = (lo: string, hi: string) => Array.from({ length: num(hi) - num(lo) + 1 }, (_, i) => num(lo) + i)
      if (both) a = b = rg(both[1], both[2])
      else if (two) { a = rg(two[1], two[2]); b = rg(two[3], two[4]) }
      else fail(q, 'unknown spinners')
    }
    let hits = 0
    for (const x of a) for (const y of b) if (x + y === target) hits++
    return fstr(fr(hits, a.length * b.length))
  }
  r = q.text.match(new RegExp(`There are (\\d+) \\w+(?: \\w+)? choices\\. The chance of getting one exact .* pair is (${NUM})\\. How many .* choices are there\\?$`))
  if (r) {
    const other = div(fr(1), mul(pf(r[2]), fr(num(r[1]))))
    if (other[1] !== 1) fail(q, 'choice count is not a whole number')
    return String(other[0])
  }
  fail(q)
}

export const SOLVE: Record<string, (q: Q) => string> = {
  'g7m5-t1': t1,
  'g7m5-t2': t2,
  'g7m5-t3': t3,
  'g7m5-t4': t4,
  'g7m5-t5': t5,
  'g7m5-t6': t6,
}
