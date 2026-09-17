// Independent answer key for the g4m4 ladders — written from the QUESTIONS only
// (`npx tsx scripts/ladder-questions.mts g4m4 N`), never from the generator.
type Q = { text: string; picture: any; choices?: string[] }

type R = [number, number] // exact rational n/d, d > 0
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a))
const norm = ([n, d]: R): R => { const g = gcd(n, d) || 1; return d < 0 ? [-n / g, -d / g] : [n / g, d / g] }
const add = (a: R, b: R): R => norm([a[0] * b[1] + b[0] * a[1], a[1] * b[1]])
const sub = (a: R, b: R): R => add(a, [-b[0], b[1]])
const mul = (a: R, b: R): R => norm([a[0] * b[0], a[1] * b[1]])
const cmp = (a: R, b: R) => Math.sign(a[0] * b[1] - b[0] * a[1])
const eq = (a: R, b: R) => cmp(a, b) === 0

const fail = (q: Q, why = 'no rule matches'): never => { throw new Error(`g4m4 key: ${why}: ${q.text}`) }

// A number token: "2 1/3", "3/4", "1". Mixed first so "2 1/3" is not read as "2" then "1/3".
const NUM = String.raw`\d+ \d+\/\d+|\d+\/\d+|\d+`
const num = (s: string): R => {
  const m = s.trim().match(/^(?:(\d+) )?(\d+)\/(\d+)$/)
  if (m) return norm([(m[1] ? +m[1] * +m[3] : 0) + +m[2], +m[3]])
  if (/^\d+$/.test(s.trim())) return [+s.trim(), 1]
  throw new Error(`g4m4 key: not a number: "${s}"`)
}

// Evaluate "a + b − c" / "k × a" (× binds tighter).
const evalExpr = (s: string): R =>
  s.split(/\s*([+−])\s*/).reduce<{ v: R; op: string }>((acc, part) => {
    if (part === '+' || part === '−') return { ...acc, op: part }
    const t = part.split(/\s*×\s*/).map(num).reduce(mul)
    return { v: acc.op === '+' ? add(acc.v, t) : sub(acc.v, t), op: '+' }
  }, { v: [0, 1], op: '+' }).v

const rel = (l: R, sign: string, r: R) => {
  const c = cmp(l, r)
  if (sign === '=') return c === 0
  if (sign === '<') return c < 0
  if (sign === '>') return c > 0
  throw new Error(`g4m4 key: unknown sign ${sign}`)
}
const splitRel = (s: string) => {
  const m = s.match(/^(.*?)\s*([=<>])\s*(.*)$/)
  if (!m) throw new Error(`g4m4 key: no relation in "${s}"`)
  return [m[1], m[2], m[3]] as const
}
const holds = (s: string) => { const [l, sg, r] = splitRel(s); return rel(evalExpr(l), sg, evalExpr(r)) }

const fmt = ([n, d]: R, den: number, mixed: boolean) => {
  if ((den * n) % d) throw new Error(`g4m4 key: ${n}/${d} is not in ${den}ths`)
  const top = (den * n) / d
  if (!mixed || top < den) return `${top}/${den}`
  const w = Math.floor(top / den), r = top % den
  return r ? `${w} ${r}/${den}` : `${w}`
}
const maxDen = (s: string) => Math.max(...[...s.matchAll(/\/(\d+)/g)].map(m => +m[1]))

// Solve an equation holding one "?": "?/8", "4/?" → a number; a bare "?" → a fraction.
const solve = (q: Q, eqn: string, mixed = false): string => {
  const [l, sg, r] = splitRel(eqn)
  if (/\?\/\d|\d\/\?/.test(eqn)) {
    const fits = (n: number) => rel(evalExpr(l.replace('?', String(n))), sg, evalExpr(r.replace('?', String(n))))
    const ok = Array.from({ length: 1001 }, (_, n) => n).filter(n => !(n === 0 && /\d\/\?/.test(eqn)) && fits(n))
    if (sg === '=') return ok.length === 1 ? String(ok[0]) : fail(q, `${ok.length} numbers fit`)
    if (!ok.length) fail(q, 'no number fits')
    if (/biggest/.test(q.text)) return ok.includes(1000) ? fail(q, 'no biggest') : String(Math.max(...ok))
    if (/smallest/.test(q.text)) return String(Math.min(...ok))
    return fail(q, 'inequality without biggest/smallest')
  }
  if (sg !== '=' || !eqn.includes('?')) return fail(q, 'unsupported equation')
  // Linear in ?, coefficient ±1: f(x) = L − R, x = −f(0) / (f(1) − f(0)).
  const f = (x: string) => sub(evalExpr(l.replace('?', x)), evalExpr(r.replace('?', x)))
  const f0 = f('0'), slope = sub(f('1'), f0)
  const x = mul([-f0[0], f0[1]], [slope[1], slope[0]])
  if (x[0] < 0) fail(q, 'negative missing value')
  return fmt(x, maxDen(eqn), mixed)
}

const pick = (q: Q, fits: (c: string) => boolean): string => {
  const ok = (q.choices ?? fail(q, 'no choices')).filter(fits)
  return ok.length === 1 ? ok[0] : fail(q, `${ok.length} choices fit`)
}
const eqText = (q: Q) => (q.picture?.kind === 'eq' ? q.picture.text : fail(q, 'expected an eq picture')) as string

// Shared choice-question rules used across topics.
const choiceRules = (q: Q): string | undefined => {
  const t = q.text
  let m: RegExpMatchArray | null
  if (t === 'Which one is true?') return pick(q, holds)
  if ((m = t.match(new RegExp(`Which sign goes in the middle\\? (${NUM}) \\? (${NUM})$`))))
    { const a = num(m[1]), b = num(m[2]); return pick(q, c => rel(a, c, b)) }
  if ((m = t.match(new RegExp(`Is (${NUM}) more than (${NUM}), less than \\2, or exactly \\2\\?`)))) {
    const c = cmp(num(m[1]), num(m[2])); const want = c > 0 ? 'more than' : c < 0 ? 'less than' : 'exactly'
    return pick(q, x => x.startsWith(want) && num(x.slice(want.length)) && eq(num(x.slice(want.length)), num(m![2])))
  }
  if ((m = t.match(new RegExp(`^Which fraction is (more|less) than (${NUM})\\?$`))))
    { const b = num(m[2]), s = m[1] === 'more' ? 1 : -1; return pick(q, c => cmp(num(c), b) === s) }
  if ((m = t.match(new RegExp(`^(\\w+) says (${NUM}) is (more|less) than (${NUM})\\. Is \\1 right\\?$`)))) {
    const right = cmp(num(m[2]), num(m[4])) === (m[3] === 'more' ? 1 : -1)
    return pick(q, c => c === (right ? 'yes' : 'no'))
  }
  if ((m = t.match(new RegExp(`^Which is the (biggest|smallest): (.+)\\?$`)))) {
    const vals = m[2].split(/, | or /).map(num)
    const best = vals.reduce((a, b) => (cmp(b, a) === (m![1] === 'biggest' ? 1 : -1) ? b : a))
    if (vals.filter(v => eq(v, best)).length !== 1) fail(q, 'tie')
    return pick(q, c => eq(num(c), best))
  }
  return undefined
}

const t1 = (q: Q) => {
  const t = q.text
  let m: RegExpMatchArray | null
  const c = choiceRules(q); if (c) return c
  if ((m = t.match(new RegExp(`(${NUM}) = (\\?\\/\\d+)\\. What is the missing top number\\?`)))) return solve(q, `${m[1]} = ${m[2]}`)
  if (t.startsWith('What number goes in the box?')) return solve(q, eqText(q))
  if ((m = t.match(new RegExp(`eats (${NUM}) of a pizza\\..* cut into (\\d+) equal slices\\. How many slices`)))) {
    const s = mul(num(m[1]), [+m[2], 1]); return s[1] === 1 ? String(s[0]) : fail(q, 'not a whole number of slices')
  }
  if ((m = t.match(new RegExp(`eats (${NUM}) of a pan.* cut into (\\d+) equal pieces and has eaten (\\d+) pieces?\\. How many more pieces`)))) {
    const s = sub(mul(num(m[1]), [+m[2], 1]), [+m[3], 1]); return s[1] === 1 && s[0] >= 0 ? String(s[0]) : fail(q, `bad remainder ${s}`)
  }
  return fail(q)
}

const t2 = (q: Q) => {
  const c = choiceRules(q); if (c) return c
  const m = q.text.match(/^(\w+) and (\w+) each have a same-size pizza\. \1's pizza is cut into (\d+) slices, and \1 eats (\d+)\. \2's pizza is cut into (\d+) slices, and \2 eats (\d+)\. Who has more pizza left\?$/)
  if (m) {
    const a: R = norm([+m[3] - +m[4], +m[3]]), b: R = norm([+m[5] - +m[6], +m[5]])
    const s = cmp(a, b); if (!s) fail(q, 'they have the same left')
    return pick(q, x => x === (s > 0 ? m[1] : m[2]))
  }
  return fail(q)
}

const t3 = (q: Q) => {
  const t = q.text
  const c = choiceRules(q); if (c) return c
  let m: RegExpMatchArray | null
  if (t.startsWith('The top bar')) {
    m = t.match(new RegExp(`\\? (${NUM}) \\? (${NUM})$`)) ?? fail(q)
    const a = num(m[1]), b = num(m[2]); return pick(q, x => rel(a, x, b))
  }
  if ((m = t.match(new RegExp(`^(\\w+) has (${NUM}) of an? (.+)\\. (\\w+) has (${NUM}) of the same size \\3\\. Who has more, or do they have the same amount\\?$`)))) {
    const s = cmp(num(m[2]), num(m[5]))
    return pick(q, x => x === (s > 0 ? m![1] : s < 0 ? m![4] : 'the same amount'))
  }
  if (/top number that makes this true\?/.test(t)) return solve(q, eqText(q))
  return fail(q)
}

const t4 = (q: Q) => {
  const t = q.text
  const c = choiceRules(q); if (c) return c
  let m: RegExpMatchArray | null
  if ((m = t.match(/^Break .*? (\S+ = .*\?) What fraction is missing\?$/))) return solve(q, m[1])
  if (t.startsWith('What fraction is missing?')) return solve(q, eqText(q))
  if ((m = t.match(new RegExp(`has (${NUM}) of a pound.*puts (${NUM}) of a pound .* rest in a bowl\\. How much goes in the bowl\\?`))))
    return fmt(sub(num(m[1]), num(m[2])), maxDen(t), false)
  if ((m = t.match(new RegExp(`and (${NUM}) of the pan is left\\. You put (${NUM}) of the pan on one plate and (${NUM}) on a second plate\\. The rest goes on a third plate`))))
    return fmt(sub(sub(num(m[1]), num(m[2])), num(m[3])), maxDen(t), false)
  return fail(q)
}

const t5 = (q: Q) => {
  const t = q.text
  let m: RegExpMatchArray | null
  if ((m = t.match(/^What is (.+)\?$/))) return fmt(evalExpr(m[1]), maxDen(m[1]), false)
  if ((m = t.match(/^Add\. (.+) = \?$/))) return fmt(evalExpr(m[1]), maxDen(m[1]), false)
  if ((m = t.match(/says (.+?) = \S+\. That is not right\. What is the right answer\?$/))) return fmt(evalExpr(m[1]), maxDen(m[1]), false)
  if (t.startsWith('What fraction is missing?')) return solve(q, eqText(q))
  if ((m = t.match(new RegExp(`paints (${NUM}) of a fence in the morning, (${NUM}) after lunch, and (${NUM}) in the evening\\. How much of the fence`))))
    return fmt(evalExpr(`${m[1]} + ${m[2]} + ${m[3]}`), maxDen(t), false)
  return fail(q)
}

const t6 = (q: Q) => {
  const t = q.text
  let m: RegExpMatchArray | null
  if ((m = t.match(/^What is (.+)\?$/))) return fmt(evalExpr(m[1]), maxDen(m[1]), false)
  if ((m = t.match(/^Subtract\. (.+) = \?$/))) return fmt(evalExpr(m[1]), maxDen(m[1]), false)
  if (t.startsWith('What fraction is missing?')) return solve(q, eqText(q))
  if ((m = t.match(new RegExp(`holds (${NUM}) of a gallon.*pours out (${NUM}) of a gallon\\. Then \\w+ pours out (${NUM}) of a gallon\\. How much juice is left`)))) {
    const v = evalExpr(`${m[1]} − ${m[2]} − ${m[3]}`); if (v[0] < 0) fail(q, 'poured more than the jug holds')
    return fmt(v, maxDen(t), false)
  }
  return fail(q)
}

const t7 = (q: Q) => {
  const t = q.text
  const c = choiceRules(q); if (c) return c
  let m: RegExpMatchArray | null
  if ((m = t.match(new RegExp(`^Write (${NUM}) as \\w+\\. (\\1 = \\?\\/\\d+)\\. What is the missing top number\\?$`)))) return solve(q, m[2])
  if (t.startsWith('What number goes in the box?')) return solve(q, eqText(q))
  if ((m = t.match(/^Write (\d+\/\d+) as wholes and a fraction\.$/))) return fmt(num(m[1]), +m[1].split('/')[1], true)
  if ((m = t.match(/has (\d+) whole pies? and (\d+)\/(\d+) of another pie\. Each pie is cut into (\d+) slices\. She sells (\d+) slices?\. How many slices are left\?/))) {
    if (+m[3] !== +m[4]) fail(q, 'pie fraction and slices disagree')
    const left = +m[1] * +m[4] + +m[2] - +m[5]; return left >= 0 ? String(left) : fail(q, 'sold more than there is')
  }
  return fail(q)
}

const t8 = (q: Q) => {
  const t = q.text
  let m: RegExpMatchArray | null
  if ((m = t.match(/^What is (.+?)\?/))) return fmt(evalExpr(m[1]), maxDen(m[1]), true)
  if ((m = t.match(/says (.+?) = [\d ]+\/\d+\. That is not right\. What is the right answer\?$/))) return fmt(evalExpr(m[1]), maxDen(m[1]), true)
  if (t.startsWith('What goes in the box?')) return solve(q, eqText(q), true)
  if ((m = t.match(new RegExp(`walks (${NUM}) miles to the park\\. Then \\w+ walks (${NUM}) miles home.*How far does \\w+ walk in all\\?`))))
    return fmt(add(num(m[1]), num(m[2])), maxDen(t), true)
  return fail(q)
}

const t9 = (q: Q) => {
  const t = q.text
  const c = choiceRules(q); if (c) return c
  let m: RegExpMatchArray | null
  if ((m = t.match(/^What is (.+)\?$/))) return fmt(evalExpr(m[1]), maxDen(m[1]), false)
  if ((m = t.match(/^Multiply\. (.+) = \?$/))) return fmt(evalExpr(m[1]), maxDen(m[1]), false)
  if ((m = t.match(new RegExp(`uses (${NUM}) of a cup of milk\\. You make the recipe (\\d+) times\\. How much milk`))))
    return fmt(mul(num(m[1]), [+m[2], 1]), maxDen(t), false)
  if ((m = t.match(new RegExp(`have (${NUM}) of a cup of milk\\. You make a recipe (\\d+) times, and it uses (${NUM}) of a cup each time\\. How much milk is left\\?`)))) {
    const v = sub(num(m[1]), mul([+m[2], 1], num(m[3]))); if (v[0] < 0) fail(q, 'not enough milk')
    return fmt(v, maxDen(t), false)
  }
  return fail(q)
}

export const SOLVE: Record<string, (q: Q) => string> = {
  'g4m4-t1': t1, 'g4m4-t2': t2, 'g4m4-t3': t3, 'g4m4-t4': t4, 'g4m4-t5': t5,
  'g4m4-t6': t6, 'g4m4-t7': t7, 'g4m4-t8': t8, 'g4m4-t9': t9,
}
