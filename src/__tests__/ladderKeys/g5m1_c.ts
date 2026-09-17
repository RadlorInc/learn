// Blind answer key for g5m1 practice ladders — topics 2, 12–16.
// Written from `scripts/ladder-questions.mts` output only (question text, picture, choices).
// It never imports the generators: every answer is worked out from the words of the question.
type Q = { text: string; picture: any; choices?: string[] }

const num = (s: string) => Number(s.replace(/,/g, ''))
const N = String.raw`(\d[\d,]*)`
const nope = (q: Q): never => { throw new Error(`g5m1_c: no pattern for "${q.text}"`) }

function exactDiv(a: number, b: number, q: Q): number {
  if (a % b !== 0) throw new Error(`g5m1_c: ${a} ÷ ${b} is not whole in "${q.text}"`)
  return a / b
}

// "a op b" with op one of × ÷ + −
function apply(a: number, op: string, b: number): number {
  switch (op) {
    case '×': return a * b
    case '÷': return a / b
    case '+': return a + b
    case '−': case '-': return a - b
  }
  throw new Error(`g5m1_c: unknown op ${op}`)
}

// "What number goes in the box? a op b = c", with "?" in any one of the three places.
function box(q: Q): string | null {
  const m = q.text.match(new RegExp(String.raw`What number goes in the box\?\s*(\?|\d[\d,]*)\s*([×÷+−-])\s*(\?|\d[\d,]*)\s*=\s*(\?|\d[\d,]*)\s*$`))
  if (!m) return null
  const [, a, op, b, c] = m
  const inv: Record<string, string> = { '×': '÷', '÷': '×', '+': '−', '−': '+', '-': '+' }
  let x: number
  if (a === '?') x = apply(num(c), inv[op], num(b))
  else if (b === '?') x = op === '×' || op === '+' ? apply(num(c), inv[op], num(a)) : apply(num(a), op, num(c))
  else if (c === '?') x = apply(num(a), op, num(b))
  else return null
  if (!Number.isInteger(x) || x < 0) throw new Error(`g5m1_c: box answer ${x} not whole in "${q.text}"`)
  // check it back
  const vals = [a, b, c].map(v => (v === '?' ? x : num(v)))
  if (apply(vals[0], op, vals[1]) !== vals[2]) throw new Error(`g5m1_c: box check failed in "${q.text}"`)
  return String(x)
}

// "a op b = ?" anywhere in the text (optionally prefixed "Multiply." / "Find")
function plain(q: Q): string | null {
  const m = q.text.match(new RegExp(String.raw`^(?:Multiply\.\s*|Find\s+)?${N}\s*([×÷])\s*${N}\s*(?:=\s*\?|\.)`))
  if (!m) return null
  const a = num(m[1]), b = num(m[3])
  return String(m[2] === '×' ? a * b : exactDiv(a, b, q))
}

// "Which one is true/right?" — evaluate every "a op b = c" choice, exactly one must hold.
function whichTrue(q: Q): string | null {
  if (!/^Which one is (true|right)\?$/.test(q.text.trim())) return null
  const ok = (q.choices ?? []).filter(c => {
    const m = c.match(new RegExp(String.raw`^${N}\s*([×÷+−-])\s*${N}\s*=\s*${N}$`))
    if (!m) throw new Error(`g5m1_c: unreadable choice "${c}" in "${q.text}"`)
    return apply(num(m[1]), m[2], num(m[3])) === num(m[4])
  })
  if (ok.length !== 1) throw new Error(`g5m1_c: ${ok.length} true choices in "${q.text}"`)
  return ok[0]
}

// A guess g for a ÷ b: 'small' if b fits one more time, 'big' if g×b is past a, else 'right'.
function judge(a: number, b: number, g: number): 'small' | 'big' | 'right' {
  if (g * b > a) return 'big'
  if ((g + 1) * b <= a) return 'small'
  return 'right'
}

const pick = (q: Q, want: string) => {
  const c = (q.choices ?? []).find(c => c === want)
  if (!c) throw new Error(`g5m1_c: expected choice "${want}" missing in "${q.text}"`)
  return c
}

const first = (q: Q, ...fs: ((q: Q) => string | null)[]) => {
  for (const f of fs) { const r = f(q); if (r !== null) return r }
  return nope(q)
}

// Word problems: match the whole story, then compute.
function story(q: Q, re: RegExp, f: (n: number[]) => number): string | null {
  const m = q.text.match(re)
  if (!m) return null
  return String(f(m.slice(1).filter(s => s !== undefined && /^\d/.test(s)).map(num)))
}
const floorDiv = (a: number, b: number) => Math.floor(a / b)

export const SOLVE_C: Record<string, (q: Q) => string> = {
  'g5m1-t2': q => first(q, plain, box, whichTrue,
    q => story(q, new RegExp(String.raw`^A shop has ${N} (\w+) of (\w+) with ${N} \w+ in each \w+\. It shares all the \w+ equally into ${N} bags\. How many \w+ go in each bag\?$`),
      ([a, b, c]) => exactDiv(a * b, c, q)),
  ),

  'g5m1-t12': q => first(q, plain, box,
    q => story(q, new RegExp(String.raw`^${N} [\w ]+? (?:go into|ride|are packed in) [\w ]+? (?:of|seat) ${N}\. How many \w+ are filled\?$`),
      ([a, b]) => floorDiv(a, b)),
    q => story(q, new RegExp(String.raw`^A school has ${N} classes with ${N} students in each\. Every bus seats ${N} students\. How many buses does the school fill\?$`),
      ([a, b, c]) => floorDiv(a * b, c)),
  ),

  'g5m1-t13': q => first(q, plain, box,
    q => {
      const m = q.text.match(new RegExp(String.raw`^Maya guesses that ${N} ÷ ${N} is ${N}\. Is her guess too small, too big, or right\?$`))
      if (!m) return null
      const j = judge(num(m[1]), num(m[2]), num(m[3]))
      return pick(q, j === 'right' ? 'Her guess is right.' : `Her guess is too ${j}.`)
    },
    q => story(q, new RegExp(String.raw`^${N} girls and ${N} boys come to the sports field\. The coach puts ${N} kids on each team\. How many teams can she make\?$`),
      ([a, b, c]) => floorDiv(a + b, c)),
  ),

  'g5m1-t14': q => first(q, plain, box,
    q => {
      const m = q.text.match(new RegExp(String.raw`^Sam guesses that ${N} ÷ ${N} is ${N}\. What should he do next\?$`))
      if (!m) return null
      const g = num(m[3]), j = judge(num(m[1]), num(m[2]), g)
      // too small → try one more; too big → try one less
      return pick(q, j === 'right' ? `Keep ${m[3]}.` : j === 'small' ? 'Try one more.' : 'Try one less.')
    },
    q => story(q, new RegExp(String.raw`^A flower shop has ${N} roses\. It sells ${N} of them\. It puts the rest in bunches of ${N}\. How many bunches can it make\?$`),
      ([a, b, c]) => floorDiv(a - b, c)),
  ),

  'g5m1-t15': q => first(q, plain, box, whichTrue,
    q => story(q, new RegExp(String.raw`^A farm store has ${N} brown eggs and ${N} white eggs\. Each carton holds ${N} eggs\. How many cartons can the store fill\?$`),
      ([a, b, c]) => floorDiv(a + b, c)),
  ),

  'g5m1-t16': q => first(q, plain, box,
    q => {
      const m = q.text.match(new RegExp(String.raw`^How many digits does the answer to ${N} ÷ ${N} have\?$`))
      if (!m) return null
      const d = String(Math.floor(num(m[1]) / num(m[2]))).length
      return pick(q, `${d} digits`)
    },
    q => story(q, new RegExp(String.raw`^A teacher has ${N} stickers and buys ${N} more\. She shares all of them equally among ${N} kids\. How many stickers does each kid get\?$`),
      ([a, b, c]) => exactDiv(a + b, c, q)),
  ),
}
