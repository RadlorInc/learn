/**
 * Grade 3 · Module 5 — Fractions as numbers. Practice ladders, easiest style first (see ../adaptive.ts and the
 * reference ladders in ./g5m1.ts). Bottom numbers stay in the lessons' set: 2, 3, 4, 6, 8. Fraction answers are
 * written like the lessons write them — `{ frac }` with no `exact`, so an equal fraction is also right.
 */
import type { Picture } from '../script'
import { int, pick, shuffle, type Level, type Rng } from '../adaptive'

const DEN = [2, 3, 4, 6, 8] as const
const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth']

const f = (n: number, d: number) => `${n}/${d}`
const pl = (k: number, w: string) => `${k} ${w}${k === 1 ? '' : 's'}`
const upto = (n: number) => Array.from({ length: n }, (_, i) => i + 1).join(', ')
const until = <T>(gen: () => T, ok: (x: T) => boolean): T => { let x = gen(); while (!ok(x)) x = gen(); return x }

type Bar = { parts: number; shaded: number; label?: string }
const bar = (parts: number, shaded: number, label?: string): Bar => (label ? { parts, shaded, label } : { parts, shaded })
const bars = (...b: Bar[]): Picture => ({ kind: 'bars', bars: b })
const cells = (ws: number[]) => ({ cells: ws.map(w => ({ w })) })
const tape = (...rows: number[][]): Picture => ({ kind: 'tape', rows: rows.map(cells) })
const eq = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })
const line = (d: number, extra: Partial<Extract<Picture, { kind: 'numline' }>> = {}): Picture => ({ kind: 'numline', min: 0, max: 1, ticks: d, labels: 'ends', ...extra })

const YES_NO = (yes: boolean) => ({ choices: ['yes', 'no'], correct: yes ? 0 : 1 })
/** Choices in the order they are named; `correct` follows the right one. */
const inOrder = (choices: string[], right: string) => ({ choices, correct: choices.indexOf(right) })
const choose = (r: Rng, right: string, wrong: string[]) => inOrder(shuffle(r, [right, ...wrong]), right)

/** n equal pieces with one piece (at k) twice as wide. */
const oneBig = (n: number, k: number) => Array.from({ length: n }, (_, i) => (i === k ? 2 : 1))
const THING = ['bar', 'granola bar', 'sandwich', 'cracker'] as const

// ── t1 · Equal parts of a whole ─────────────────────────────────────────────────────────────────────────────
const T1: Level[] = [
  { style: 'count the equal pieces', make: r => {
    const n = int(r, 2, 8), thing = pick(r, THING)
    return { text: `This ${thing} is cut into equal pieces. How many equal pieces are there?`, picture: tape(Array(n).fill(1)), answer: n,
      steps: ['Every piece is the same size, so we can count them.', `Count them: ${upto(n)}.`, `There are ${n} equal pieces.`] }
  } },
  { style: 'fair or not', make: r => {
    const fair = r() < 0.5, thing = pick(r, THING)
    const n = fair ? int(r, 2, 8) : int(r, 3, 6), k = int(r, 0, n - 1)
    return { text: `This ${thing} is cut into ${n} pieces. Are the pieces fair?`, picture: tape(fair ? Array(n).fill(1) : oneBig(n, k)), answer: YES_NO(fair),
      steps: fair ? ['Look at the size of each piece.', `All ${n} pieces are the same size.`, 'The pieces all match, so the answer is yes.']
        : ['Look at the size of each piece.', `The ${ORD[k]} piece is bigger than the others.`, 'The pieces are not all the same size, so the answer is no.'] }
  } },
  { style: 'which of two bars is fair', make: r => {
    const n = int(r, 3, 6), k = int(r, 0, n - 1), top = r() < 0.5
    const right = top ? 'the top bar' : 'the bottom bar', other = top ? 'bottom' : 'top'
    const fair = Array(n).fill(1), not = oneBig(n, k)
    return { text: `Both bars are cut into ${n} pieces. Which bar is cut into fair pieces?`, picture: tape(...(top ? [fair, not] : [not, fair])),
      answer: inOrder(['the top bar', 'the bottom bar'], right),
      steps: ['Look along each bar at the size of every piece.', `On the ${other} bar, the ${ORD[k]} piece is bigger than the others.`, `Every piece matches on ${right}, so the answer is ${right}.`] }
  } },
  { style: 'find the piece that is not the same size', make: r => {
    const n = int(r, 4, 7), k = int(r, 0, n - 1)
    return { text: 'One piece of this bar is bigger than the others. Which piece is it? Count from the left.', picture: tape(oneBig(n, k)), answer: k + 1,
      steps: ['Start at the left and look at each piece.', `Every piece matches except the ${ORD[k]} one, which is bigger.`, `So the answer is ${k + 1}.`] }
  } },
  { style: 'two checks: enough pieces, and equal pieces', make: r => {
    const kind = pick(r, ['good', 'good', 'fewer', 'unequal'] as const)
    const F = int(r, 3, 6), k = int(r, 0, F - 1), name = pick(r, ['Ben', 'Mia', 'Jo', 'Sam'])
    const n = kind === 'fewer' ? F - 1 : F
    const picture = tape(kind === 'unequal' ? oneBig(n, k) : Array(n).fill(1))
    const steps = kind === 'good' ? [`There are ${n} pieces, one for each of the ${F} friends.`, 'Every piece is the same size.', 'Every friend gets 1 equal piece, so the answer is yes.']
      : kind === 'fewer' ? [`There are only ${n} pieces for ${F} friends.`, 'One friend gets no piece at all.', 'So the answer is no.']
      : [`There are ${n} pieces, one for each of the ${F} friends.`, `But the ${ORD[k]} piece is bigger than the others.`, 'The pieces are not equal, so the answer is no.']
    return { text: `${F} friends share a long sub sandwich. ${name} cuts it like the picture. Does every friend get 1 equal piece?`, picture, answer: YES_NO(kind === 'good'), steps }
  } },
]

// ── t2 · One equal piece: 1/d ───────────────────────────────────────────────────────────────────────────────
const T2: Level[] = [
  { style: 'read the shaded piece, counts told', make: r => {
    const d = pick(r, DEN), thing = pick(r, THING)
    return { text: `A ${thing} is cut into ${d} equal pieces. 1 piece is shaded. How much of the ${thing} is shaded?`, picture: bars(bar(d, 1)), answer: { frac: [1, d] },
      steps: [`The ${thing} is cut into ${d} equal pieces, so ${d} goes on the bottom.`, '1 piece is shaded, so 1 goes on the top.', `So the answer is ${f(1, d)}.`] }
  } },
  { style: 'bottom number tells how many pieces', make: r => {
    const d = pick(r, DEN), thing = pick(r, THING)
    return { text: `A ${thing} is cut into equal pieces. Each piece is ${f(1, d)} of the ${thing}. How many pieces are there?`, picture: eq(`each piece = ${f(1, d)}`), answer: d,
      steps: [`${f(1, d)} means 1 of ${d} equal pieces.`, `The bottom number tells how many equal pieces make the whole ${thing}.`, `So there are ${d} pieces.`] }
  } },
  { style: 'pick the fraction (left-over trap)', make: r => {
    const d = pick(r, [3, 4, 6, 8]), right = f(1, d)
    return { text: 'Which fraction shows the shaded part of the bar?', picture: bars(bar(d, 1)), answer: choose(r, right, [f(1, d - 1), f(d, 1)]),
      steps: [`The bar is cut into ${d} equal pieces, so ${d} goes on the bottom, not the ${d - 1} pieces left over.`, '1 piece is shaded, so 1 goes on the top.', `So the answer is ${right}.`] }
  } },
  { style: 'story, nothing shaded', make: r => {
    const d = pick(r, DEN), [who, to, thing] = pick(r, [['Mia', 'Jo', 'ribbon'], ['Leo', 'Ana', 'rope'], ['Zoe', 'Sam', 'strip of paper']] as const)
    return { text: `${who} cuts a ${thing} into ${d} equal pieces. ${who} gives 1 piece to ${to}. How much of the ${thing} does ${to} get?`, picture: bars(bar(d, 0)), answer: { frac: [1, d] },
      steps: [`The ${thing} is cut into ${d} equal pieces, so ${d} goes on the bottom.`, `${to} gets 1 piece, so 1 goes on the top.`, `So ${to} gets ${f(1, d)} of the ${thing}.`] }
  } },
  { style: 'work backwards from the pieces left', make: r => {
    const d = pick(r, DEN), left = d - 1, [name, food] = pick(r, [['Sam', 'sandwich'], ['Ava', 'pizza'], ['Kai', 'pan of cornbread']] as const)
    return { text: `${name} cuts a ${food} into equal pieces and eats 1 piece. ${left === 1 ? '1 piece is' : `${left} pieces are`} left. How much of the ${food} did ${name} eat?`,
      picture: eq(`1 eaten + ${left} left`), answer: { frac: [1, d] },
      steps: [`All the pieces: 1 eaten + ${left} left = ${d} equal pieces. So ${d} goes on the bottom.`, 'The 1 piece eaten goes on the top.', `So ${name} ate ${f(1, d)} of the ${food}.`] }
  } },
]

// ── t3 · More than one equal piece: n/d ─────────────────────────────────────────────────────────────────────
const nd3 = (r: Rng) => { const d = pick(r, [3, 4, 6, 8]); return { d, n: int(r, 2, d - 1) } }

const T3: Level[] = [
  { style: 'read the shaded pieces', make: r => {
    const { d, n } = nd3(r)
    return { text: 'Count all the pieces for the bottom and the shaded pieces for the top. How much of the bar is shaded?', picture: bars(bar(d, n)), answer: { frac: [n, d] },
      steps: [`The bar is cut into ${d} equal pieces, so ${d} goes on the bottom.`, `Count the shaded pieces: ${upto(n)}. So ${n} goes on the top.`, `So the answer is ${f(n, d)}.`] }
  } },
  { style: 'read the white pieces', make: r => {
    const { d, n: w } = nd3(r)
    return { text: 'How much of the bar is white?', picture: bars(bar(d, d - w)), answer: { frac: [w, d] },
      steps: [`The bar is cut into ${d} equal pieces, so ${d} goes on the bottom.`, `Count only the white pieces: ${upto(w)}. So ${w} goes on the top.`, `So the answer is ${f(w, d)}.`] }
  } },
  { style: 'pick the fraction (left-over trap)', make: r => {
    const { d, n } = nd3(r), right = f(n, d)
    return { text: 'Which fraction shows the shaded part of the bar?', picture: bars(bar(d, n)), answer: choose(r, right, [f(n, d - n), f(d, n)]),
      steps: [`The bar is cut into ${d} equal pieces, so ${d} goes on the bottom. The ${pl(d - n, 'white piece')} ${d - n === 1 ? 'does' : 'do'} not go there.`, `${n} pieces are shaded, so ${n} goes on the top.`, `So the answer is ${right}.`] }
  } },
  { style: 'from a fraction to the pieces left', make: r => {
    const { d, n } = nd3(r), left = d - n
    return { text: `A pizza is cut into ${d} equal slices. The family eats ${f(n, d)} of it. How many slices are left?`, picture: bars(bar(d, 0)), answer: left,
      steps: [`${f(n, d)} means ${n} of the ${d} slices were eaten.`, `${d} − ${n} = ${left}.`, `So ${left === 1 ? '1 slice is' : `${left} slices are`} left.`] }
  } },
  { style: 'two-step story (add the pieces)', make: r => {
    const d = pick(r, [4, 6, 8]), a = int(r, 1, d - 2), b = int(r, 1, d - 1 - a)
    return { text: `A pizza is cut into ${d} equal slices. Mom eats ${pl(a, 'slice')}. Dad eats ${pl(b, 'slice')}. How much of the pizza did they eat in all?`, picture: bars(bar(d, 0)), answer: { frac: [a + b, d] },
      steps: [`The pizza is cut into ${d} equal slices, so ${d} goes on the bottom.`, `They ate ${a} + ${b} = ${a + b} slices, so ${a + b} goes on the top.`, `So they ate ${f(a + b, d)} of the pizza.`] }
  } },
]

// ── t4 · A fraction is a point on the number line ───────────────────────────────────────────────────────────
const T4: Level[] = [
  { style: 'dot on the line, jumps told', make: r => {
    const d = pick(r, DEN), n = int(r, 1, d - 1)
    return { text: `This line from 0 to 1 is cut into ${d} equal jumps. Which fraction is at the dot?`, picture: line(d, { points: [{ at: n / d }] }), answer: { frac: [n, d] },
      steps: [`The line is cut into ${d} equal jumps, so the bottom number is ${d}.`, n === 1 ? 'The dot is 1 jump from 0.' : `Count the jumps from 0 to the dot: ${upto(n)}.`, `So the dot is at ${f(n, d)}.`] }
  } },
  { style: 'name the missing mark', make: r => {
    const d = pick(r, [3, 4, 6, 8]), n = int(r, 1, d - 1)
    const labels = Array.from({ length: d + 1 }, (_, i) => (i === n ? null : i === 0 ? '0' : i === d ? '1' : f(i, d)))
    return { text: 'Every mark on this line has a name. The name at the dot is missing. Which fraction goes there?', picture: line(d, { labels, points: [{ at: n / d }] }), answer: { frac: [n, d] },
      steps: [`The marks count jumps of ${f(1, d)}, so the bottom number is ${d}.`, n === 1 ? 'The dot is 1 jump from 0.' : `The mark just before the dot is ${f(n - 1, d)}, and the dot is one jump more.`, `So the dot is at ${f(n, d)}.`] }
  } },
  { style: 'pick the fraction (the 0 is not a jump)', make: r => {
    const { d, n } = until(() => { const d = pick(r, [3, 4, 6, 8]); return { d, n: int(r, 1, d - 1) } }, x => x.d - x.n !== x.n && x.d - x.n !== x.n + 1)
    const right = f(n, d)
    return { text: 'Which fraction is at the dot?', picture: line(d, { points: [{ at: n / d }] }), answer: choose(r, right, [f(n + 1, d), f(d - n, d)]),
      steps: [`The line is cut into ${d} equal jumps, so the bottom number is ${d}.`, `Start at 0 and count the jumps to the dot: ${upto(n)}. The 0 is where you start, not a jump.`, `So the dot is at ${right}.`] }
  } },
  { style: 'path story, no dot', make: r => {
    const d = pick(r, DEN), n = int(r, 1, d - 1), [from, to, name] = pick(r, [['house', 'gate', 'Ava'], ['tent', 'lake', 'Leo'], ['school', 'park', 'Zoe']] as const)
    return { text: `The path from the ${from} to the ${to} is cut into ${d} equal parts. The ${from} is 0 and the ${to} is 1. ${name} walks ${pl(n, 'part')}. What fraction of the way has ${name} walked?`,
      picture: line(d), answer: { frac: [n, d] },
      steps: [`The path is cut into ${d} equal parts, so the bottom number is ${d}.`, `${name} walked ${pl(n, 'part')} from 0.`, `So ${name} has walked ${f(n, d)} of the way.`] }
  } },
  { style: 'two-step path story (what is left)', make: r => {
    const d = pick(r, [4, 6, 8]), a = int(r, 1, d - 2), b = int(r, 1, d - 1 - a), left = d - a - b
    const [from, to, name] = pick(r, [['house', 'gate', 'Ava'], ['tent', 'lake', 'Leo'], ['school', 'park', 'Zoe']] as const)
    return { text: `The path from the ${from} (0) to the ${to} (1) is cut into ${d} equal parts. ${name} walks ${pl(a, 'part')}, stops for a drink, then walks ${pl(b, 'more part')}. What fraction of the way is still left?`,
      picture: line(d), answer: { frac: [left, d] },
      steps: [`${name} has walked ${a} + ${b} = ${a + b} parts.`, `The whole path is ${d} parts, and ${d} − ${a + b} = ${left}.`, `So ${f(left, d)} of the way is still left.`] }
  } },
]

// ── t5 · Equal fractions cover the same amount ──────────────────────────────────────────────────────────────
/** n/d = N/D with D = d × k, D at most 8. */
const pair = (r: Rng) => {
  const [d, k] = pick(r, [[2, 2], [2, 3], [2, 4], [3, 2], [4, 2]] as const), n = int(r, 1, d - 1)
  return { d, k, n, D: d * k, N: n * k }
}

const T5: Level[] = [
  { style: 'shade the bottom bar to match', make: r => {
    const { d, k, n, D, N } = pair(r)
    return { text: `The top bar shows ${f(n, d)}. The bottom bar is cut into ${D} equal pieces. How many pieces do you shade to cover the same amount?`,
      picture: bars(bar(d, n, f(n, d)), bar(D, 0)), answer: N,
      steps: [`Each piece of the top bar sits over ${k} small pieces.`, `There ${n === 1 ? 'is 1 shaded piece' : `are ${n} shaded pieces`} on top, so ${n} × ${k} small pieces.`, `So you shade ${N} pieces.`] }
  } },
  { style: 'same amount or not', make: r => {
    const { d, k, n, D, N } = pair(r)
    const M = pick(r, [N, N, N - 1, N + 1].filter(m => m >= 1 && m <= D)), same = M === N
    return { text: `Do ${f(n, d)} and ${f(M, D)} cover the same amount?`, picture: bars(bar(d, n, f(n, d)), bar(D, M, f(M, D))), answer: YES_NO(same),
      steps: same ? ['Both bars are the same size.', `Each piece of the top bar is cut into ${k} smaller pieces on the bottom bar.`, 'The shading stops at the same place, so the answer is yes.']
        : ['Both bars are the same size.', `To match ${f(n, d)}, the bottom bar needs ${N} shaded pieces, but it has ${M}.`, 'The shading does not stop at the same place, so the answer is no.'] }
  } },
  { style: 'missing top number', make: r => {
    const { d, k, n, D, N } = pair(r)
    return { text: `What number goes in the box? ${f(n, d)} = ?/${D}`, picture: eq(`${f(n, d)} = ?/${D}`), answer: N,
      steps: [`To make ${D} pieces, each of the ${d} pieces is cut into ${k} smaller pieces.`, `So ${pl(n, 'piece')} ${n === 1 ? 'becomes' : 'become'} ${n} × ${k} = ${N} smaller pieces.`, `The missing number is ${N}.`] }
  } },
  { style: 'pick the true one (change only one number trap)', make: r => {
    const { d, k, n, D, N } = pair(r), right = `${f(n, d)} = ${f(N, D)}`
    return { text: 'Which one is true?', picture: bars(bar(d, n), bar(D, 0)), answer: choose(r, right, [`${f(n, d)} = ${f(n, D)}`, `${f(n, d)} = ${f(N, d)}`]),
      steps: ['When the pieces get smaller, you need more of them to cover the same amount.', `Each piece of ${d} is cut into ${k} pieces of ${D}, so ${n} × ${k} = ${N}.`, `So ${right}.`] }
  } },
  { style: 'two-step story (how many more pieces)', make: r => {
    const { d, k, n, D, N } = pair(r), a = int(r, 1, N - 1), more = N - a
    return { text: `Jay eats ${f(n, d)} of a pan of cornbread. Kim has a same-size pan cut into ${D} equal pieces. Kim has eaten ${pl(a, 'piece')}. How many more pieces must Kim eat to eat the same amount as Jay?`,
      picture: bars(bar(d, n, f(n, d)), bar(D, a)), answer: more,
      steps: [`Each piece of Jay's pan is the size of ${k} pieces of Kim's pan, so Kim needs ${n} × ${k} = ${N} pieces.`, `Kim has eaten ${a}, and ${N} − ${a} = ${more}.`, `So Kim must eat ${pl(more, 'more piece')}.`] }
  } },
]

// ── t6 · All the pieces make 1 whole ────────────────────────────────────────────────────────────────────────
const T6: Level[] = [
  { style: 'all shaded, write the fraction', make: r => {
    const d = pick(r, DEN), thing = pick(r, THING)
    return { text: `A ${thing} is cut into ${d} equal pieces. All the pieces are shaded. How much of the ${thing} is shaded? Write it with a top and bottom number.`,
      picture: bars(bar(d, d)), answer: { frac: [d, d] },
      steps: [`The ${thing} is cut into ${d} equal pieces, so ${d} goes on the bottom.`, `All ${d} pieces are shaded, so ${d} goes on the top.`, `So the answer is ${f(d, d)}. That is 1 whole.`] }
  } },
  { style: 'how many pieces make 1 whole', make: r => {
    const d = pick(r, DEN)
    return { text: 'This bar is cut into equal pieces. How many of these pieces make 1 whole?', picture: bars(bar(d, 0)), answer: d,
      steps: ['1 whole means every piece of the bar.', `Count the equal pieces: ${upto(d)}.`, `So ${d} pieces make 1 whole.`] }
  } },
  { style: 'missing number in n/n = 1', make: r => {
    const d = pick(r, DEN), top = r() < 0.5
    const q = top ? `?/${d} = 1` : `${d}/? = 1`
    return { text: `${q}. What number goes on the ${top ? 'top' : 'bottom'}?`, picture: eq(q), answer: d,
      steps: ['1 whole means you have all the pieces.', 'So the top and bottom numbers are the same.', `The ${top ? 'top' : 'bottom'} number is ${d}.`] }
  } },
  { style: 'pick the true one (bigger numbers trap)', make: r => {
    const [d, D] = until(() => [pick(r, DEN), pick(r, DEN)], ([a, b]) => a < b)
    const right = `${f(D, D)} = ${f(d, d)}`
    return { text: 'Which one is true?', picture: bars(bar(d, d), bar(D, D)), answer: choose(r, right, [`${f(D, D)} > ${f(d, d)}`, `${f(D, D)} < ${f(d, d)}`]),
      steps: [`${f(D, D)} is all ${D} pieces, so it is 1 whole.`, `${f(d, d)} is all ${d} pieces, so it is 1 whole too.`, `So ${right}.`] }
  } },
  { style: 'two-step story (pieces still to eat)', make: r => {
    const d = pick(r, [4, 6, 8]), a = int(r, 1, d - 2), b = int(r, 1, d - 1 - a), left = d - a - b
    return { text: `A pizza is cut into ${d} equal slices. Mom eats ${pl(a, 'slice')} and Dad eats ${pl(b, 'slice')}. How many more slices must be eaten so the whole pizza is gone?`,
      picture: bars(bar(d, 0)), answer: left,
      steps: [`The whole pizza is ${f(d, d)}, all ${d} slices.`, `Mom and Dad ate ${a} + ${b} = ${a + b} slices.`, `${d} − ${a + b} = ${left}, so ${pl(left, 'more slice')} must be eaten.`] }
  } },
]

// ── t7 · Compare, same bottom number ────────────────────────────────────────────────────────────────────────
const two7 = (r: Rng) => { const d = pick(r, [3, 4, 6, 8]); return until(() => ({ d, a: int(r, 1, d - 1), b: int(r, 1, d - 1) }), x => x.a !== x.b) }
const more7 = (d: number, a: number, b: number) => {
  const hi = Math.max(a, b), lo = Math.min(a, b)
  return [`Both are cut into ${d} equal pieces, so the pieces are the same size.`, `${pl(hi, 'piece')} is more than ${pl(lo, 'piece')}.`]
}

const T7: Level[] = [
  { style: 'shaded bars, which is bigger', make: r => {
    const { d, a, b } = two7(r), big = f(Math.max(a, b), d)
    return { text: `The top bar shows ${f(a, d)}. The bottom bar shows ${f(b, d)}. Which is bigger?`, picture: bars(bar(d, a), bar(d, b)),
      answer: inOrder([f(a, d), f(b, d)], big), steps: [...more7(d, a, b), `So the bigger one is ${big}.`] }
  } },
  { style: 'bare fractions, which is bigger', make: r => {
    const { d, a, b } = two7(r), big = f(Math.max(a, b), d)
    return { text: `Which is bigger: ${f(a, d)} or ${f(b, d)}?`, picture: eq('? > ?'),
      answer: inOrder([f(a, d), f(b, d)], big), steps: [...more7(d, a, b), `So the bigger one is ${big}.`] }
  } },
  { style: 'which sign goes in the middle', make: r => {
    const { d, a, b } = two7(r), sign = a > b ? '>' : '<', q = `${f(a, d)} ? ${f(b, d)}`
    return { text: `Which sign goes in the middle? ${q}`, picture: eq(q), answer: inOrder(['<', '>', '='], sign),
      steps: [`Both are cut into ${d} equal pieces.`, `${pl(a, 'piece')} is ${a > b ? 'more' : 'fewer'} than ${pl(b, 'piece')}, so ${f(a, d)} is ${a > b ? 'bigger' : 'smaller'}.`,
        `The open side faces the bigger number, so ${f(a, d)} ${sign} ${f(b, d)}.`] }
  } },
  { style: 'smallest of three', make: r => {
    const d = pick(r, [4, 6, 8]), [a, b, c] = shuffle(r, Array.from({ length: d - 1 }, (_, i) => i + 1)).slice(0, 3), lo = Math.min(a, b, c)
    return { text: `Which is the smallest: ${f(a, d)}, ${f(b, d)} or ${f(c, d)}?`, picture: line(d),
      answer: inOrder([f(a, d), f(b, d), f(c, d)], f(lo, d)),
      steps: [`All three are cut into ${d} equal pieces, so the pieces are the same size.`, `The fewest pieces is ${lo}.`, `So the smallest is ${f(lo, d)}.`] }
  } },
  { style: 'two-step story (compare what is left)', make: r => {
    const { d, a, b } = two7(r), [she, he] = pick(r, [['Ana', 'Ben'], ['Mia', 'Leo'], ['Zoe', 'Sam']] as const)
    const winner = a < b ? she : he
    return { text: `${she} and ${he} each have a same-size pizza cut into ${d} equal slices. ${she} has ${f(a, d)} of her pizza left. ${he} has ${f(b, d)} of his pizza left. Who ate more?`,
      picture: bars(bar(d, d - a), bar(d, d - b)), answer: inOrder([she, he], winner),
      steps: [`${she} has ${pl(a, 'slice')} left, so she ate ${d} − ${a} = ${d - a}.`, `${he} has ${pl(b, 'slice')} left, so he ate ${d} − ${b} = ${d - b}.`, `So ${winner} ate more.`] }
  } },
]

// ── t8 · Compare, same top number ───────────────────────────────────────────────────────────────────────────
const two8 = (r: Rng) => until(() => {
  const a = pick(r, DEN), b = pick(r, DEN)
  return { a, b, n: int(r, 1, Math.max(1, Math.min(a, b) - 1)) }
}, x => x.a !== x.b)
const bigger8 = (n: number, a: number, b: number) => {
  const few = Math.min(a, b), many = Math.max(a, b)
  return { few, many, why: [`Both take ${pl(n, 'piece')}.`, `A bar cut into ${few} has bigger pieces than a bar cut into ${many}.`] }
}

const T8: Level[] = [
  { style: 'shaded bars, which is bigger', make: r => {
    const { a, b, n } = two8(r), { few, why } = bigger8(n, a, b)
    return { text: `The top bar shows ${f(n, a)}. The bottom bar shows ${f(n, b)}. Which is bigger?`, picture: bars(bar(a, n), bar(b, n)),
      answer: inOrder([f(n, a), f(n, b)], f(n, few)), steps: [...why, `So the bigger one is ${f(n, few)}.`] }
  } },
  { style: 'bare fractions, which is bigger', make: r => {
    const { a, b, n } = two8(r), { few, why } = bigger8(n, a, b)
    return { text: `Which is bigger: ${f(n, a)} or ${f(n, b)}?`, picture: eq('? > ?'),
      answer: inOrder([f(n, a), f(n, b)], f(n, few)), steps: [...why, `So the bigger one is ${f(n, few)}.`] }
  } },
  { style: 'which sign goes in the middle', make: r => {
    const { a, b, n } = two8(r), sign = a < b ? '>' : '<', q = `${f(n, a)} ? ${f(n, b)}`
    return { text: `Which sign goes in the middle? ${q}`, picture: eq(q), answer: inOrder(['<', '>', '='], sign),
      steps: [`Both take ${pl(n, 'piece')}.`, `Pieces of ${a} are ${a < b ? 'bigger' : 'smaller'} than pieces of ${b}, so ${f(n, a)} is ${a < b ? 'bigger' : 'smaller'}.`,
        `The open side faces the bigger number, so ${f(n, a)} ${sign} ${f(n, b)}.`] }
  } },
  { style: 'check a claim (bigger bottom number trap)', make: r => {
    const { a, b, n } = two8(r), { few, many, why } = bigger8(n, a, b)
    const right = r() < 0.5, [dx, dy] = right ? [few, many] : [many, few], [x, y] = [f(n, dx), f(n, dy)], name = pick(r, ['Tom', 'Nia', 'Raj'])
    return { text: `${name} says ${x} is bigger than ${y}. Is ${name} right?`, picture: bars(bar(dx, n), bar(dy, n)), answer: YES_NO(right),
      steps: [...why, `So ${f(n, few)} is bigger, and the answer is ${right ? 'yes' : 'no'}.`] }
  } },
  { style: 'two-step story (kids sharing a pizza)', make: r => {
    const { a, b } = two8(r), right = a < b ? 'the red table' : 'the blue table'
    return { text: `${a} kids share one pizza equally at the red table. ${b} kids share a same-size pizza equally at the blue table. At which table does each kid get more pizza?`,
      picture: bars(bar(a, 0), bar(b, 0)), answer: inOrder(['the red table', 'the blue table'], right),
      steps: [`At the red table each kid gets ${f(1, a)} of a pizza. At the blue table each kid gets ${f(1, b)}.`, 'Fewer kids means fewer cuts, so bigger pieces.', `So each kid gets more at ${right}.`] }
  } },
]

export const G3M5_LADDERS: Record<string, Level[]> = {
  'g3m5-t1': T1, 'g3m5-t2': T2, 'g3m5-t3': T3, 'g3m5-t4': T4, 'g3m5-t5': T5, 'g3m5-t6': T6, 'g3m5-t7': T7, 'g3m5-t8': T8,
}
