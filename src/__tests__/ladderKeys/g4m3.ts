// Blind answer key for g4m3's practice ladders. Written from the QUESTIONS only
// (`npx tsx scripts/ladder-questions.mts g4m3 N`), never from the generator.
// Where a picture restates the text's numbers, the key checks they agree and throws if not.
type Q = { text: string; picture: any; choices?: string[] }

const fail = (q: Q, why = 'no rule for'): never => { throw new Error(`g4m3 key: ${why}: ${q.text}`) }
const num = (s: string) => Number(s.replace(/[,$]/g, ''))
const N = '\\$?(\\d[\\d,]*)'
const m = (q: Q, re: string) => q.text.match(new RegExp(re))
const same = (q: Q, a: unknown, b: unknown, what: string) => { if (String(a) !== String(b)) fail(q, `picture disagrees (${what}: ${a} vs ${b})`) }

/** Exactly one choice satisfies `ok`, or throw. */
function pick(q: Q, ok: (c: string) => boolean): string {
  const hits = (q.choices ?? []).filter(ok)
  if (hits.length !== 1) throw new Error(`g4m3 key: ${hits.length} choices fit: ${q.text} ${JSON.stringify(q.choices)}`)
  return hits[0]
}

/** Exact whole-number quotient, or throw — these lessons never ask for a remainder unless they say so. */
function div(q: Q, a: number, b: number): string {
  if (a % b !== 0) fail(q, `${a} ÷ ${b} is not whole`)
  return String(a / b)
}

/** Place-value parts of a number, zeros dropped: 154 → [100, 50, 4]. */
const parts = (n: number) => String(n).split('').map((d, i, s) => Number(d) * 10 ** (s.length - 1 - i)).filter(x => x > 0)
const sortNums = (xs: number[]) => [...xs].sort((a, b) => a - b).join(',')

/** "t1 + t2 + … = total" is a full, true expansion whose terms are exactly `want`. */
function sumIs(expr: string, want: number[], product: number): boolean {
  const [lhs, rhs, extra] = expr.split('=')
  if (rhs === undefined || extra !== undefined) return false
  const terms = lhs.split('+').map(num)
  return sortNums(terms) === sortNums(want) && terms.reduce((a, b) => a + b, 0) === num(rhs) && num(rhs) === product
}

/** "a × b = X + ? + Y" — the ? must be a missing partial product. */
function boxMul(q: Q, partial: (a: number, b: number) => number[]): string {
  const r = m(q, `^What number goes in the box\\? ${N} × ${N} = (.+)$`) ?? fail(q)
  const a = num(r[1]), b = num(r[2])
  const terms = r[3].split(' + ')
  if (terms.filter(t => t === '?').length !== 1) fail(q)
  const known = terms.filter(t => t !== '?').map(num)
  const ans = a * b - known.reduce((x, y) => x + y, 0)
  if (sortNums([...known, ans]) !== sortNums(partial(a, b))) fail(q, `box ${ans} is not a missing partial product`)
  same(q, q.picture?.text, `${r[1]} × ${r[2]} = ${r[3]}`, 'eq')
  return String(ans)
}

const byOnes = (a: number, b: number) => parts(a).map(p => p * b)
const twoByTwo = (a: number, b: number) => parts(a).flatMap(x => parts(b).map(y => x * y))

/** The three things a remainder story can ask. */
function remainderAnswers(total: number, per: number) {
  return { need: Math.ceil(total / per), full: Math.floor(total / per), left: total % per }
}

export const SOLVE: Record<string, (q: Q) => string> = {
  // Multiply a two-digit number by a one-digit number (break apart by place value).
  'g4m3-t1': q => {
    let r = m(q, `^Find ${N} × ${N}\\. Break ${N} into ${N} and ${N}\\.$`)
    if (r) {
      const a = num(r[1]), b = num(r[2])
      if (num(r[3]) !== a || num(r[4]) + num(r[5]) !== a) fail(q, 'split does not add up')
      same(q, q.picture.cols, [r[4], r[5]], 'cols'); same(q, q.picture.rows, [r[2]], 'rows')
      return String(a * b)
    }
    r = m(q, `^Find ${N} × ${N}\\.$`)
    if (r) { same(q, q.picture?.text, `${r[1]} × ${r[2]} = ?`, 'eq'); return String(num(r[1]) * num(r[2])) }
    if (q.text === 'Which one is right?' && q.picture?.kind === 'eq') {
      const e = q.picture.text.match(/^(\d+) × (\d+)$/) ?? fail(q)
      const s = (q.picture.lines?.[0] ?? '').match(/^(\d+) = (\d+) \+ (\d+)$/) ?? fail(q)
      const a = Number(e[1]), b = Number(e[2])
      if (Number(s[1]) !== a || Number(s[2]) + Number(s[3]) !== a) fail(q, 'split does not add up')
      const want = [Number(s[2]) * b, Number(s[3]) * b]
      return pick(q, c => c.startsWith(`${e[1]} × ${e[2]} = `) && sumIs(c.slice(`${e[1]} × ${e[2]} = `.length), want, a * b))
    }
    if (/^What number goes in the box\?/.test(q.text)) return boxMul(q, byOnes)
    r = m(q, `^A store gets ${N} boxes of crayons with ${N} crayons in each box\\. It also has ${N} loose crayons\\. How many crayons does it have in all\\?$`)
    if (r) { same(q, q.picture?.text, `${r[2]} × ${r[1]} = ?`, 'eq'); return String(num(r[1]) * num(r[2]) + num(r[3])) }
    return fail(q)
  },

  // Multiply a three-digit number by a one-digit number.
  'g4m3-t2': q => {
    let r = m(q, `^Find ${N} × ${N}\\. Break ${N} into ${N}, ${N} and ${N}\\.$`)
    if (r) {
      const a = num(r[1])
      if (num(r[3]) !== a || num(r[4]) + num(r[5]) + num(r[6]) !== a) fail(q, 'split does not add up')
      same(q, q.picture.cols, [r[4], r[5], r[6]], 'cols')
      return String(a * num(r[2]))
    }
    r = m(q, `^Find ${N} × ${N}\\.$`)
    if (r) { same(q, q.picture?.text, `${r[1]} × ${r[2]} = ?`, 'eq'); return String(num(r[1]) * num(r[2])) }
    r = m(q, `^Which sum finds ${N} × ${N}\\?$`)
    if (r) { const a = num(r[1]), b = num(r[2]); return pick(q, c => sumIs(c, byOnes(a, b), a * b)) }
    if (/^What number goes in the box\?/.test(q.text)) return boxMul(q, byOnes)
    r = m(q, `^A train has ${N} cars\\. Each car has ${N} seats\\. ${N} seats are empty\\. How many people are sitting on the train\\?$`)
    if (r) { same(q, q.picture?.text, `${r[2]} × ${r[1]} = ?`, 'eq'); return String(num(r[1]) * num(r[2]) - num(r[3])) }
    return fail(q)
  },

  // The standard algorithm, one-digit multiplier.
  'g4m3-t3': q => {
    const cols = (a: string, b: string) => { if (q.picture?.kind !== 'columns') fail(q); same(q, q.picture.rows.map(num), [num(a), num(b)], 'columns') }
    let r = m(q, `^Multiply the standard way: ${N} × ${N}\\.`)
    if (r) { cols(r[1], r[2]); return String(num(r[1]) * num(r[2])) }
    if (q.text === 'One of these is right. Which one?') {
      const [a, b] = q.picture.rows.map(num)
      return pick(q, c => { const x = c.match(/^([\d,]+) × ([\d,]+) = ([\d,]+)$/); return !!x && num(x[1]) === a && num(x[2]) === b && num(x[3]) === a * b })
    }
    r = m(q, `^A (?:store|theater|farm) has ${N} (boxes|sections|crates)\\. Each (box|section|crate) (?:holds|has) ${N} (crayons|seats|apples)\\. How many (crayons|seats|apples) are there\\?$`)
    if (r) { if (r[5] !== r[6]) fail(q); cols(r[4], r[1]); return String(num(r[1]) * num(r[4])) }
    r = m(q, `^What digit goes in the box\\? (\\d*)\\?(\\d*) × ${N} = ${N}$`)
    if (r) {
      const hits = [...Array(10).keys()].filter(d => {
        if (d === 0 && r[1] === '') return false
        return Number(`${r[1]}${d}${r[2]}`) * num(r[3]) === num(r[4])
      })
      if (hits.length !== 1) fail(q, `${hits.length} digits fit`)
      return String(hits[0])
    }
    return fail(q)
  },

  // Two-digit × two-digit with an area model.
  'g4m3-t4': q => {
    let r = m(q, `^The four pieces of ${N} × ${N} are done\\. Add them to find ${N} × ${N}\\.$`)
    if (r) {
      const a = num(r[1]), b = num(r[2])
      if (num(r[3]) !== a || num(r[4]) !== b) fail(q)
      const cells: number[] = (q.picture?.cells ?? []).flat().map(num)
      if (sortNums(cells) !== sortNums(twoByTwo(a, b))) fail(q, 'the four pieces are not the partial products')
      return String(cells.reduce((x, y) => x + y, 0))
    }
    r = m(q, `^Find ${N} × ${N}\\.$`)
    if (r) {
      const a = num(r[1]), b = num(r[2])
      if (q.picture?.kind === 'area') { same(q, q.picture.cols, parts(a).map(String), 'cols'); same(q, q.picture.rows, parts(b).map(String), 'rows') }
      return String(a * b)
    }
    r = m(q, `^Which sum finds ${N} × ${N}\\?$`)
    if (r) { const a = num(r[1]), b = num(r[2]); return pick(q, c => sumIs(c, twoByTwo(a, b), a * b)) }
    if (/^What number goes in the box\?/.test(q.text)) return boxMul(q, twoByTwo)
    r = m(q, `^A school hall has ${N} rows of chairs\\. Each row has ${N} chairs\\. ${N} chairs are broken\\. How many chairs can children sit on\\?$`)
    if (r) { same(q, q.picture?.text, `${r[1]} × ${r[2]} = ?`, 'eq'); return String(num(r[1]) * num(r[2]) - num(r[3])) }
    return fail(q)
  },

  // Divide by breaking the number apart.
  'g4m3-t5': q => {
    let r = m(q, `^Find ${N} ÷ ${N}\\. Break ${N} into ${N} and ${N}\\.$`)
    if (r) {
      const a = num(r[1]), b = num(r[2]), x = num(r[4]), y = num(r[5])
      if (num(r[3]) !== a || x + y !== a || x % b || y % b) fail(q, 'split does not share evenly')
      same(q, q.picture?.cells?.[0], [r[4], r[5]], 'cells'); same(q, q.picture?.rows, [r[2]], 'rows')
      return div(q, a, b)
    }
    r = m(q, `^Find ${N} ÷ ${N}\\.$`)
    if (r) { same(q, q.picture?.text, `${r[1]} ÷ ${r[2]} = ?`, 'eq'); return div(q, num(r[1]), num(r[2])) }
    r = m(q, `^You want to find ${N} ÷ ${N}\\. Which parts are both easy to share by ${N}\\?$`)
    if (r) {
      const a = num(r[1]), b = num(r[2])
      if (num(r[3]) !== b) fail(q)
      return pick(q, c => { const x = c.match(/^([\d,]+) and ([\d,]+)$/); return !!x && num(x[1]) + num(x[2]) === a && num(x[1]) % b === 0 && num(x[2]) % b === 0 })
    }
    r = m(q, `^What number goes in the box\\? ${N} ÷ ${N} = ${N} ÷ ${N} \\+ \\? ÷ ${N}$`)
    if (r) {
      const a = num(r[1]), b = num(r[2]), x = num(r[3])
      if (num(r[4]) !== b || num(r[5]) !== b) fail(q)
      const y = a - x
      if (x % b || y % b || y <= 0) fail(q, 'the missing part does not share evenly')
      return String(y)
    }
    r = m(q, `^A baker makes ${N} muffins in the morning and ${N} muffins in the afternoon\\. She shares all of them equally onto ${N} trays\\. How many muffins go on each tray\\?$`)
    if (r) { same(q, q.picture?.text, `${r[1]} + ${r[2]} = ?`, 'eq'); return div(q, num(r[1]) + num(r[2]), num(r[3])) }
    return fail(q)
  },

  // Long division, one-digit divisor.
  'g4m3-t6': q => {
    let r = m(q, `^Find ${N} ÷ ${N}\\.`)
    if (r) {
      if (q.picture?.kind === 'longdiv') { same(q, num(q.picture.dividend), num(r[1]), 'dividend'); same(q, q.picture.divisor, r[2], 'divisor') }
      if (q.picture?.kind === 'table') {
        // the hundreds row: "H ÷ d = n"
        const row = q.picture.rows?.[0]?.[0]?.match(/^(\d+) ÷ (\d+) = (\d+)$/) ?? fail(q)
        if (row[1] !== r[1].replace(/,/g, '')[0] || row[2] !== r[2]) fail(q, 'the done step is not the hundreds of this division')
      }
      return div(q, num(r[1]), num(r[2]))
    }
    if (q.text === 'Which one is right?') {
      const e = q.picture?.text?.match(/^([\d,]+) ÷ ([\d,]+)$/) ?? fail(q)
      const a = num(e[1]), b = num(e[2])
      return pick(q, c => { const x = c.match(/^([\d,]+) ÷ ([\d,]+) = ([\d,]+)$/); return !!x && num(x[1]) === a && num(x[2]) === b && num(x[3]) * b === a })
    }
    r = m(q, `^What number goes in the box\\? \\? ÷ ${N} = ${N}$`)
    if (r) return String(num(r[1]) * num(r[2]))
    r = m(q, `^A farmer collects ${N} eggs one week and ${N} eggs the next week\\. He packs all of them equally into ${N} crates\\. How many eggs go in each crate\\?$`)
    if (r) { same(q, q.picture?.text, `${r[1]} + ${r[2]} = ?`, 'eq'); return div(q, num(r[1]) + num(r[2]), num(r[3])) }
    return fail(q)
  },

  // Remainders in stories: round up, drop, or the remainder itself.
  'g4m3-t7': q => {
    const brace = (total: string, per: string) => {
      const row = q.picture?.rows?.[0]
      if (!row?.brace?.startsWith(`${total} `)) fail(q, 'brace disagrees')
      const perCell = row.cells.find((c: any) => /per /.test(c.text))
      if (perCell && !perCell.text.startsWith(`${per} per`)) fail(q, 'per-cell disagrees')
    }
    let r = m(q, `^${N} children are going to the zoo\\. Each van holds ${N} children\\. ${N} ÷ ${N} is ${N} with ${N} left over\\. How many vans do they need\\?$`)
    if (r) {
      const t = num(r[1]), p = num(r[2]), a = remainderAnswers(t, p)
      if (num(r[3]) !== t || num(r[4]) !== p || num(r[5]) !== a.full || num(r[6]) !== a.left) fail(q, 'the stated division is wrong')
      brace(r[1], r[2])
      return String(a.need)
    }
    r = m(q, `^A baker has ${N} cookies\\. Each box holds ${N} cookies\\. How many boxes can she fill\\?$`)
    if (r) { brace(r[1], r[2]); return String(remainderAnswers(num(r[1]), num(r[2])).full) }
    r = m(q, `^${N} people come to a party\\. Each table seats ${N} people\\. Which question has the answer ${N}\\?$`)
    if (r) {
      brace(r[1], r[2])
      const a = remainderAnswers(num(r[1]), num(r[2])), want = num(r[3])
      const value: Record<string, number> = {
        'How many tables do they need?': a.need,
        'How many tables are full?': a.full,
        'How many people are left over?': a.left,
      }
      return pick(q, c => { if (!(c in value)) fail(q, `unknown choice "${c}"`); return value[c] === want })
    }
    r = m(q, `^Sam shares ${N} stickers equally among ${N} friends, giving each friend as many as he can\\. How many stickers are left over\\?$`)
    if (r) {
      if (!q.picture?.rows?.[0]?.brace?.startsWith(`${r[1]} `)) fail(q, 'brace disagrees')
      const friends = q.picture.rows[0].cells.filter((c: any) => !c.shade).length
      same(q, friends, num(r[2]), 'friend cells')
      return String(remainderAnswers(num(r[1]), num(r[2])).left)
    }
    r = m(q, `^A farmer has ${N} eggs\\. Each carton holds ${N} eggs\\. How many cartons can the farmer fill\\?$`)
    if (r) { brace(r[1], r[2]); return String(remainderAnswers(num(r[1]), num(r[2])).full) }
    r = m(q, `^${N} people wait for a ferry\\. The ferry carries ${N} people on each trip\\. How many trips does it need to carry everyone\\?$`)
    if (r) { brace(r[1], r[2]); return String(remainderAnswers(num(r[1]), num(r[2])).need) }
    return fail(q)
  },

  // Multi-step stories.
  'g4m3-t8': q => {
    const boxesRow = (n: number, per: string) => {
      const row = q.picture?.rows?.[0]
      if (row?.label !== 'Boxes' || row.cells.length !== n || row.cells.some((c: any) => c.text !== per)) fail(q, 'box row disagrees')
    }
    let r = m(q, `^A shop has ${N} boxes of pencils with ${N} in each box\\. That is ${N} pencils\\. The shop sells ${N} pencils\\. How many pencils are left\\?$`)
    if (r) {
      const total = num(r[1]) * num(r[2])
      if (num(r[3]) !== total) fail(q, 'the stated total is wrong')
      boxesRow(num(r[1]), r[2])
      return String(total - num(r[4]))
    }
    r = m(q, `^A shop has ${N} boxes of markers\\. Each box holds ${N} markers\\. The shop sells ${N} markers\\. How many markers are left\\?$`)
    if (r) { boxesRow(num(r[1]), r[2]); return String(num(r[1]) * num(r[2]) - num(r[3])) }
    r = m(q, `^A class has ${N} packs of juice boxes with ${N} in each pack\\. The children drink ${N}\\. Which answer is right\\?$`)
    if (r) {
      same(q, q.picture?.text, `${r[1]} × ${r[2]} = ?`, 'eq')
      const left = num(r[1]) * num(r[2]) - num(r[3])
      return pick(q, c => { const x = c.match(/^([\d,]+) juice boxes are left$/); return !!x && num(x[1]) === left })
    }
    r = m(q, `^A baker packs ${N} muffins equally onto ${N} trays\\. Then she adds ${N} more muffins to one tray\\. How many muffins are on that tray now\\?$`)
    if (r) return String(Number(div(q, num(r[1]), num(r[2]))) + num(r[3]))
    r = m(q, `^Movie tickets cost ${N} each\\. A group buys ${N} tickets and pays with ${N}\\. How many dollars do they get back\\?$`)
    if (r) {
      const back = num(r[3]) - num(r[1]) * num(r[2])
      if (back < 0) fail(q, 'they did not pay enough')
      return String(back)
    }
    return fail(q)
  },
}
