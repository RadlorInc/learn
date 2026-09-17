/**
 * Grade 4 · Module 6 — Place value for decimal fractions. Practice ladders, easiest style first (see ../adaptive.ts and
 * the reference ladders in ./g5m1.ts). Decimals are answered as numbers, fractions as `{ frac }` with no `exact`, the way
 * the lessons write them. Every decimal is built from whole tenths or hundredths, never from float arithmetic.
 */
import type { Picture } from '../script'
import { int, pick, shuffle, fmt, type Level, type Rng } from '../adaptive'

/** n hundredths (or tenths when d = 10) as a clean number. */
const dec = (n: number, d = 100) => Math.round((n / d) * 1000) / 1000
const pl = (k: number, w: string) => `${k} ${w}${k === 1 ? '' : 's'}`
const SIGNS = ['<', '>', '=']
const sign = (a: number, b: number) => ({ choices: SIGNS, correct: a < b ? 0 : a > b ? 1 : 2 })
const choose = (r: Rng, right: string, wrong: string[]) => { const choices = shuffle(r, [right, ...wrong]); return { choices, correct: choices.indexOf(right) } }
const YES_NO = (yes: boolean) => ({ choices: ['yes', 'no'], correct: yes ? 0 : 1 })

const eq = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })
const bar = (shaded: number): Picture => ({ kind: 'bars', bars: [{ parts: 10, shaded }] })
const hund = (n: number): Picture => {
  const cols = Math.floor(n / 10), extra = n % 10
  const shade: { r: number; c: number; h: number; w: number; tone?: 1 | 2 }[] = []
  if (cols) shade.push({ r: 0, c: 0, h: 10, w: cols, tone: 1 })
  if (extra) shade.push({ r: 0, c: cols, h: extra, w: 1, tone: 2 })
  return { kind: 'grid', rows: 10, cols: 10, shade }
}
const blank: Picture = { kind: 'grid', rows: 10, cols: 10 }
const line = (min: number, max: number, at: number): Picture => ({ kind: 'numline', min, max, ticks: 10, labels: 'ends', points: [{ at }] })
const coins = (d: number, dimes: number, p: number): Picture => ({ kind: 'table', head: ['Dollars', 'Dimes', 'Pennies'], rows: [[String(d), String(dimes), String(p)]] })
/** A hundredths count that is not a whole number of tenths (so it really needs two places). */
const notTens = (r: Rng, lo: number, hi: number) => { let n = int(r, lo, hi); while (n % 10 === 0) n = int(r, lo, hi); return n }

// ── t1 · Tenths as decimals ───────────────────────────────────────────────────────────────────────────────
const T1: Level[] = [
  { style: 'shaded bar to a decimal', make: r => {
    const k = int(r, 1, 9)
    return { text: `A bar is cut into 10 equal strips. ${pl(k, 'strip')} ${k === 1 ? 'is' : 'are'} shaded. Write the shaded part as a decimal.`, picture: bar(k), answer: dec(k, 10),
      steps: ['Each strip is one tenth of the bar.', `${pl(k, 'strip')} ${k === 1 ? 'is' : 'are'} ${k} ${k === 1 ? 'tenth' : 'tenths'}, or ${k}/10.`, `So the shaded part is ${fmt(dec(k, 10))}.`] }
  } },
  { style: 'bare decimal to a fraction', make: r => {
    const k = int(r, 1, 9)
    return { text: `Write ${fmt(dec(k, 10))} as a fraction with 10 on the bottom.`, picture: bar(0), answer: { frac: [k, 10] },
      steps: [`The ${k} is right after the point, so it means ${k} ${k === 1 ? 'tenth' : 'tenths'}.`, `${k} ${k === 1 ? 'tenth' : 'tenths'} is ${pl(k, 'strip')} out of 10.`, `So ${fmt(dec(k, 10))} is ${k}/10.`] }
  } },
  { style: 'pick the decimal that matches (spot the slid digit)', make: r => {
    const k = int(r, 1, 9), right = `0.${k}`
    return { text: `Which decimal is the same as ${k}/10?`, picture: eq(`${k}/10 = ?`), answer: choose(r, right, [`0.0${k}`, `${k}`]),
      steps: [`${k}/10 is ${k} ${k === 1 ? 'tenth' : 'tenths'}.`, 'Tenths sit right after the point, not one place further.', `So the answer is ${right}.`] }
  } },
  { style: 'what is left', make: r => {
    const k = int(r, 1, 9), left = 10 - k
    return { text: 'A bar has 10 equal strips. The shaded strips are eaten. What part of the bar is left, as a decimal?', picture: bar(k), answer: dec(left, 10),
      steps: [`${k} of the 10 strips ${k === 1 ? 'is' : 'are'} eaten.`, `10 − ${k} = ${left} ${left === 1 ? 'strip is' : 'strips are'} left. That is ${left} ${left === 1 ? 'tenth' : 'tenths'}.`, `So ${fmt(dec(left, 10))} of the bar is left.`] }
  } },
  { style: 'two-step story (two people share)', make: r => {
    const a = int(r, 1, 7), b = int(r, 1, 8 - a)
    const [whole, piece, x, y] = pick(r, [['sheet of paper', 'strip', 'Mom', 'Dad'], ['ribbon', 'piece', 'Lily', 'Sam'], ['garden', 'row', 'Ana', 'Ben']] as const)
    const t = a + b
    return { text: `A ${whole} is cut into 10 equal ${piece}s. ${x} uses ${pl(a, piece)} and ${y} uses ${pl(b, piece)}. What part of the ${whole} do they use together, as a decimal?`,
      picture: bar(0), answer: dec(t, 10),
      steps: [`Together they use ${a} + ${b} = ${pl(t, piece)}.`, `Each ${piece} is one tenth, so that is ${t} tenths, or ${t}/10.`, `So they use ${fmt(dec(t, 10))} of the ${whole}.`] }
  } },
]

// ── t2 · Hundredths as decimals ───────────────────────────────────────────────────────────────────────────
const T2: Level[] = [
  { style: 'shaded grid to a decimal', make: r => {
    const n = notTens(r, 11, 99), c = Math.floor(n / 10)
    return { text: 'This grid has 100 equal squares. What part is shaded, as a decimal?', picture: hund(n), answer: dec(n),
      steps: ['Each square is one hundredth.', `${pl(c, 'full column')} ${c === 1 ? 'is' : 'are'} ${c * 10}. Then ${n % 10} more makes ${n}.`, `${n} hundredths is ${n}/100, so the shaded part is ${fmt(dec(n))}.`] }
  } },
  { style: 'bare fraction to a decimal (with the 0 for no tenths)', make: r => {
    const n = r() < 0.35 ? int(r, 1, 9) : notTens(r, 11, 99)
    return { text: `Write ${n}/100 as a decimal.`, picture: blank, answer: dec(n),
      steps: n < 10
        ? [`${n}/100 is ${n} ${n === 1 ? 'hundredth' : 'hundredths'} and no tenths.`, `Put 0 in the first place after the point and ${n} in the second.`, `So ${n}/100 is ${fmt(dec(n))}.`]
        : [`${n}/100 is ${n} hundredths.`, `That is ${Math.floor(n / 10)} tenths and ${n % 10} ${n % 10 === 1 ? 'hundredth' : 'hundredths'}.`, `So ${n}/100 is ${fmt(dec(n))}.`] }
  } },
  { style: 'bare decimal to a fraction over 100', make: r => {
    const n = notTens(r, 11, 99)
    return { text: `Write ${fmt(dec(n))} as a fraction with 100 on the bottom.`, picture: blank, answer: { frac: [n, 100] },
      steps: [`${fmt(dec(n))} has two places after the point, so it counts hundredths.`, `It is ${n} hundredths.`, `So ${fmt(dec(n))} is ${n}/100.`] }
  } },
  { style: 'pick the right decimal (not 2.5, not the digits swapped)', make: r => {
    const small = r() < 0.35
    const n = small ? int(r, 1, 9) : (() => { let m = notTens(r, 12, 98); while (Math.floor(m / 10) === m % 10) m = notTens(r, 12, 98); return m })()
    const right = fmt(dec(n))
    const wrong = small ? [`0.${n}`, `${n}`] : [fmt(dec(n, 10)), `0.${n % 10}${Math.floor(n / 10)}`]
    return { text: `Which decimal is the same as ${n}/100?`, picture: eq(`${n}/100 = ?`), answer: choose(r, right, wrong),
      steps: ['Hundredths need two places after the point.', small ? `There are no tenths, so a 0 goes first and ${n} goes second.` : `The ${Math.floor(n / 10)} goes in the tenths place and the ${n % 10} in the hundredths place.`, `So the answer is ${right}.`] }
  } },
  { style: 'two-step story (what is left of 100)', make: r => {
    const a = int(r, 5, 40), b = int(r, 5, 40), left = 100 - a - b
    const [box, thing, x, y] = pick(r, [['sheet', 'stickers', 'Ava', 'Ben'], ['box', 'crayons', 'Mia', 'Leo'], ['bag', 'marbles', 'Kai', 'Zoe']] as const)
    return { text: `A ${box} has 100 ${thing}. ${x} uses ${a} ${thing} and ${y} uses ${b}. What part of the ${box} is left, as a decimal?`, picture: blank, answer: dec(left),
      steps: [`They use ${a} + ${b} = ${a + b} ${thing}.`, `100 − ${a + b} = ${left} are left. That is ${left} hundredths, or ${left}/100.`, `So ${fmt(dec(left))} of the ${box} is left.`] }
  } },
]

// ── t3 · 0.5 is the same as 0.50 ──────────────────────────────────────────────────────────────────────────
const T3: Level[] = [
  { style: 'count the shaded squares for tenths', make: r => {
    const k = int(r, 1, 9)
    return { text: `0.${k} of this 100-square grid is shaded. How many small squares is that?`, picture: hund(10 * k), answer: 10 * k,
      steps: [`0.${k} is ${k} ${k === 1 ? 'tenth' : 'tenths'}, which is ${pl(k, 'full column')}.`, `Each column has 10 squares.`, `So 0.${k} is ${10 * k} squares.`] }
  } },
  { style: 'bare: tenths to squares, no picture to count', make: r => {
    const k = int(r, 1, 9)
    return { text: `You shade 0.${k} of a 100-square grid. How many small squares do you shade?`, picture: blank, answer: 10 * k,
      steps: [`0.${k} is ${k} ${k === 1 ? 'tenth' : 'tenths'}, and each tenth is a column of 10 squares.`, `${pl(k, 'column')} of 10 squares is ${10 * k} squares.`, `So you shade ${10 * k} squares, or 0.${k}0.`] }
  } },
  { style: 'which sign (equal, or not)', make: r => {
    const k = int(r, 1, 9), kind = int(r, 0, 2)
    // =: 0.k vs 0.k0 · a 0 in the wrong place: 0.k vs 0.0k · a different tenth: 0.k0 vs 0.j
    const j = (k + int(r, 1, 8) - 1) % 9 + 1
    const [sa, va, sb, vb] = kind === 0 ? [`0.${k}`, 10 * k, `0.${k}0`, 10 * k] : kind === 1 ? [`0.${k}`, 10 * k, `0.0${k}`, k] : [`0.${k}0`, 10 * k, `0.${j}`, 10 * j]
    const flip = r() < 0.5
    const [L, lv, R, rv] = flip ? [sb, vb, sa, va] : [sa, va, sb, vb]
    const ans = sign(lv, rv)
    return { text: `Which sign goes between them? ${L} ? ${R}`, picture: eq(`${L} ? ${R}`), answer: ans,
      steps: [`${L} is ${lv} hundredths.`, `${R} is ${rv} hundredths.`, `So ${L} ${SIGNS[ans.correct]} ${R}, and the sign is ${SIGNS[ans.correct]}.`] }
  } },
  { style: 'missing number in an equal decimal', make: r => {
    const k = int(r, 1, 9)
    if (r() < 0.5) return { text: `What number goes in the box? 0.${k} = ?/100`, picture: eq(`0.${k} = ?/100`), answer: 10 * k,
      steps: [`0.${k} is ${k} ${k === 1 ? 'tenth' : 'tenths'}.`, `Each tenth is 10 hundredths, so that is ${10 * k} hundredths, the same as 0.${k}0.`, `The missing number is ${10 * k}.`] }
    return { text: `0.${k}0 of a 100-square grid is shaded. How many full columns of 10 is that?`, picture: blank, answer: k,
      steps: [`0.${k}0 is ${10 * k} hundredths, which is ${10 * k} squares.`, `Each column has 10 squares, so ${10 * k} squares fill ${pl(k, 'column')}.`, `So it is ${k}, the same as 0.${k}.`] }
  } },
  { style: 'two-step story (one tenths, one hundredths)', make: r => {
    const a = int(r, 1, 8), b = int(r, 1, 9 - a)
    const [place, beds, x, y] = pick(r, [['garden', 'beds', 'beans', 'corn'], ['farm', 'fields', 'wheat', 'oats'], ['wall', 'tiles', 'red', 'blue']] as const)
    const one = place === 'wall' ? `0.${a} of the ${beds} are ${x}` : `0.${a} of the ${place} has ${x}`
    const two = place === 'wall' ? `0.${b}0 are ${y}` : `0.${b}0 has ${y}`
    const q = place === 'wall' ? `How many ${beds} are ${x} or ${y}?` : `How many ${beds} have ${x} or ${y}?`
    return { text: `A ${place} has 100 equal ${beds}. ${one}. ${two}. ${q}`, picture: blank, answer: 10 * (a + b),
      steps: [`0.${a} is the same as 0.${a}0, which is ${10 * a} ${beds}.`, `0.${b}0 is ${10 * b} ${beds}.`, `So ${10 * a} + ${10 * b} = ${10 * (a + b)} ${beds}.`] }
  } },
]

// ── t4 · Decimals on a number line ────────────────────────────────────────────────────────────────────────
const T4: Level[] = [
  { style: 'dot on a line from 0 to 1', make: r => {
    const k = int(r, 1, 9)
    return { text: 'What number is at the dot?', picture: line(0, 1, dec(k, 10)), answer: dec(k, 10),
      steps: ['There are 10 equal jumps from 0 to 1, so each jump is 0.1.', `Count the jumps from 0 to the dot: ${pl(k, 'jump')}.`, `So the dot is at ${fmt(dec(k, 10))}.`] }
  } },
  { style: 'dot on a line that does not start at 0', make: r => {
    const w = int(r, 1, 8), k = int(r, 1, 9), at = dec(10 * w + k, 10)
    return { text: `This line goes from ${w} to ${w + 1}. What number is at the dot?`, picture: line(w, w + 1, at), answer: at,
      steps: [`There are 10 equal jumps from ${w} to ${w + 1}, so each jump is 0.1.`, `Start at ${w} and count ${pl(k, 'jump')} to the dot.`, `So the dot is at ${fmt(at)}.`] }
  } },
  { style: 'spot the mistake: marks counted, not jumps', make: r => {
    const k = int(r, 2, 8), right = `${k} tenths`
    return { text: `Max counted the marks up to the dot, starting with the mark at 0. He got ${k + 1} marks, so he said the dot is at 0.${k + 1}. How much is the dot really at?`,
      picture: line(0, 1, dec(k, 10)), answer: choose(r, right, [`${k + 1} tenths`, `${k} hundredths`]),
      steps: ["Don't count the marks. The mark at 0 is where you start, not a jump.", `Count the jumps from 0: ${k} jumps of one tenth.`, `So the dot is at ${right}.`] }
  } },
  { style: 'zoomed line in hundredths', make: r => {
    const t = int(r, 1, 8), h = int(r, 1, 9), at = dec(10 * t + h)
    return { text: `This line starts at ${fmt(dec(t, 10))} and ends at ${fmt(dec(t + 1, 10))}. What number is at the dot?`, picture: line(dec(t, 10), dec(t + 1, 10), at), answer: at,
      steps: [`There are 10 equal jumps from ${fmt(dec(t, 10))} to ${fmt(dec(t + 1, 10))}, so each jump is one hundredth, 0.01.`, `Start at ${fmt(dec(t, 10))} and count ${pl(h, 'jump')}.`, `So the dot is at ${fmt(at)}.`] }
  } },
  { style: 'two-step story (read the dot, then walk on)', make: r => {
    const w = int(r, 1, 7), k = int(r, 1, 7), j = int(r, 1, 9 - k), at = dec(10 * w + k, 10), end = dec(10 * w + k + j, 10)
    const who = pick(r, ['Ava', 'Leo', 'Nia', 'Sam'])
    return { text: `This part of a bike trail goes from mile ${w} to mile ${w + 1}. ${who} stops at the dot for a drink. Then ${who} rides 0.${j} of a mile more. How many miles along the trail is ${who} now?`,
      picture: line(w, w + 1, at), answer: end,
      steps: [`Each jump from ${w} to ${w + 1} is 0.1 of a mile. The dot is ${pl(k, 'jump')} past ${w}, at ${fmt(at)}.`, `0.${j} more is ${pl(j, 'jump')} more: ${k} + ${j} = ${k + j} jumps past ${w}.`, `So ${who} is ${fmt(end)} miles along the trail.`] }
  } },
]

// ── t5 · Compare decimals ─────────────────────────────────────────────────────────────────────────────────
/** A decimal in hundredths, written the short way (0.5, not 0.50). */
const d2 = (n: number) => fmt(dec(n))
const T5: Level[] = [
  { style: 'both on a zoomed number line, which sign', make: r => {
    const t = int(r, 1, 8), i = int(r, 1, 9)
    let j = int(r, 1, 9); while (j === i) j = int(r, 1, 9)
    const a = 10 * t + i, b = 10 * t + j, ans = sign(a, b)
    return { text: `The dots on the line show ${d2(a)} and ${d2(b)}. Which sign goes between them? ${d2(a)} ? ${d2(b)}`,
      picture: { kind: 'numline', min: dec(t, 10), max: dec(t + 1, 10), ticks: 10, labels: 'ends', points: [{ at: dec(a), label: d2(a) }, { at: dec(b), label: d2(b) }] }, answer: ans,
      steps: [`Both have ${t} tenths, so look at the hundredths. Each jump on this line is one hundredth.`,
        `${d2(Math.max(a, b))} is ${Math.abs(i - j)} ${Math.abs(i - j) === 1 ? 'jump' : 'jumps'} farther along, so it is bigger.`,
        `So ${d2(a)} ${SIGNS[ans.correct]} ${d2(b)}, and the sign is ${SIGNS[ans.correct]}.`] }
  } },
  { style: 'bare numbers, which sign (longer is not bigger)', make: r => {
    const kind = int(r, 0, 2)
    let sa: string, va: number, sb: string, vb: number
    if (kind === 0) { const k = int(r, 2, 9); va = 10 * k; sa = `0.${k}`; vb = notTens(r, 11, va - 1); sb = d2(vb) } // fewer digits, more tenths
    else if (kind === 1) { const k = int(r, 1, 9); va = 10 * k; sa = `0.${k}`; vb = va + int(r, 1, 9); sb = d2(vb) } // same tenths
    else { const k = int(r, 1, 9); va = 10 * k; sa = `0.${k}`; sb = `0.${k}0`; vb = va }
    const flip = r() < 0.5
    const [L, lv, R, rv] = flip ? [sb, vb, sa, va] : [sa, va, sb, vb]
    const ans = sign(lv, rv)
    return { text: `Which sign goes between them? ${L} ? ${R}`, picture: eq(`${L} ? ${R}`), answer: ans,
      steps: [`Give both two places: ${L} is ${lv} hundredths and ${R} is ${rv} hundredths.`, lv === rv ? 'They are the same amount.' : `${Math.max(lv, rv)} hundredths is more.`, `So ${L} ${SIGNS[ans.correct]} ${R}, and the sign is ${SIGNS[ans.correct]}.`] }
  } },
  { style: 'spot the mistake: is the longer number bigger?', make: r => {
    const short = int(r, 2, 9), long = notTens(r, 11, 99), who = pick(r, ['Raj', 'Kim', 'Leo', 'Ana'])
    const yes = long > 10 * short
    return { text: `${who} says ${d2(long)} > 0.${short}, because ${long} is more than ${short}. Is the sign right?`, picture: eq(`${d2(long)} > 0.${short}`), answer: YES_NO(yes),
      steps: [`Look at the tenths first: ${d2(long)} has ${Math.floor(long / 10)} tenths and 0.${short} has ${short} tenths.`,
        yes ? `${Math.floor(long / 10)} tenths is more, so the sign is right, even though the reason is not.` : `0.${short} is ${10 * short} hundredths, which is more than ${long} hundredths.`,
        `So the answer is ${yes ? 'yes' : 'no'}.`] }
  } },
  { style: 'story: who jumps farther', make: r => {
    const [x, y] = shuffle(r, ['Leo', 'Ana', 'Mia', 'Kai'])
    const w = 1, t = int(r, 1, 9)
    const a = 100 * w + 10 * t, b = 100 * w + 10 * int(r, 0, t - 1) + int(r, 1, 9) // a has more tenths, b has more digits
    if (r() < 0.2) { // a tie: the same jump written with a 0 on the end
      const sa = d2(a), sb = `${sa}0`, [s1, s2] = r() < 0.5 ? [sa, sb] : [sb, sa]
      return { text: `${x} jumps ${s1} meters. ${y} jumps ${s2} meters. Who jumps farther?`, picture: eq(`${s1} ? ${s2}`), answer: { choices: [x, y, 'They tie'], correct: 2 },
        steps: [`Both jump ${pl(w, 'whole meter')} and ${t} tenths.`, `${sb} is the same as ${sa}. A 0 at the end does not change the amount.`, 'So the answer is They tie.'] }
    }
    const [va, vb] = r() < 0.5 ? [a, b] : [b, a]
    const win = va > vb ? x : y
    return { text: `${x} jumps ${d2(va)} meters. ${y} jumps ${d2(vb)} meters. Who jumps farther?`, picture: eq(`${d2(va)} ? ${d2(vb)}`), answer: { choices: [x, y, 'They tie'], correct: va > vb ? 0 : 1 },
      steps: [`Both jump ${pl(w, 'whole meter')}.`, `${d2(va)} has ${Math.floor(va / 10) % 10} tenths. ${d2(vb)} has ${Math.floor(vb / 10) % 10} tenths. More tenths is farther.`, `So the answer is ${win}.`] }
  } },
  { style: 'story: the farthest of three', make: r => {
    const names = shuffle(r, ['Leo', 'Ana', 'Mia', 'Kai', 'Zoe']).slice(0, 3)
    const t = int(r, 3, 9)
    // the farthest has the fewest digits; the other two are longer with fewer tenths
    const vals = shuffle(r, [100 + 10 * t, 100 + 10 * (t - 1) + int(r, 1, 9), 100 + 10 * int(r, 0, t - 2) + int(r, 1, 9)])
    const best = vals.indexOf(Math.max(...vals))
    return { text: `Three friends throw a ball. ${names[0]} throws it ${d2(vals[0])} meters, ${names[1]} throws it ${d2(vals[1])} meters and ${names[2]} throws it ${d2(vals[2])} meters. Who throws it the farthest?`,
      picture: eq(vals.map(d2).join(', ')), answer: { choices: names, correct: best },
      steps: ['All three throw it 1 whole meter, so look at the tenths first.', `${d2(vals[best])} has ${t} tenths, and the others have fewer.`, `So the answer is ${names[best]}.`] }
  } },
]

// ── t6 · Add tenths and hundredths ────────────────────────────────────────────────────────────────────────
const T6: Level[] = [
  { style: 'grid shows the sum, fraction answer', make: r => {
    const a = int(r, 1, 9), b = int(r, 1, 9), s = 10 * a + b
    return { text: `The grid shows ${a}/10 and ${b}/100 shaded. Add. ${a}/10 + ${b}/100 = ?`, picture: hund(s), answer: { frac: [s, 100] },
      steps: [`${a}/10 is ${pl(a, 'column')} of 10 squares, so ${a}/10 = ${10 * a}/100.`, `Now add the hundredths: ${10 * a} and ${b} more.`, `So the answer is ${s}/100.`] }
  } },
  { style: 'bare fractions, either order', make: r => {
    const a = int(r, 1, 9), b = int(r, 1, 9), s = 10 * a + b
    const expr = r() < 0.5 ? `${a}/10 + ${b}/100` : `${b}/100 + ${a}/10`
    return { text: `Add. ${expr} = ?`, picture: eq(`${expr} = ?`), answer: { frac: [s, 100] },
      steps: [`Change the tenths into hundredths: ${a}/10 = ${10 * a}/100.`, `${10 * a}/100 + ${b}/100 = ${s}/100.`, `So the answer is ${s}/100.`] }
  } },
  { style: 'two-digit hundredths, decimal answer', make: r => {
    const a = int(r, 1, 7), b = notTens(r, 11, 99 - 10 * a), s = 10 * a + b
    return { text: `Add, and write the answer as a decimal. ${a}/10 + ${b}/100 = ?`, picture: eq(`${a}/10 + ${b}/100 = ?`), answer: dec(s),
      steps: [`${a}/10 = ${10 * a}/100.`, `${10 * a}/100 + ${b}/100 = ${s}/100.`, `So the sum is ${fmt(dec(s))}.`] }
  } },
  { style: 'spot the mistake: tops and bottoms added', make: r => {
    const a = int(r, 1, 9), b = int(r, 1, 9), s = 10 * a + b, who = pick(r, ['Mo', 'Ivy', 'Jay', 'Pia'])
    const right = `${s}/100`
    return { text: `${who} says ${a}/10 + ${b}/100 = ${a + b}/110. What is the right answer?`, picture: eq(`${a}/10 + ${b}/100`),
      answer: choose(r, right, [`${a + b}/110`, `${a + b}/100`]),
      steps: ["Don't add the bottom numbers. 10 and 100 are the sizes of the pieces.", `Change the tenths first: ${a}/10 = ${10 * a}/100, and ${10 * a}/100 + ${b}/100 = ${s}/100.`, `So the answer is ${right}.`] }
  } },
  { style: 'two-step story: how much is still empty', make: r => {
    const a = int(r, 1, 6), b = int(r, 11, 89 - 10 * a), full = 10 * a + b, left = 100 - full
    const [who, jar, x, y] = pick(r, [['Nia', 'jar', 'red beads', 'blue beads'], ['Omar', 'box', 'green blocks', 'yellow blocks'], ['Tess', 'tank', 'sand', 'rocks']] as const)
    return { text: `${who} fills ${a}/10 of a ${jar} with ${x} and ${b}/100 of it with ${y}. How much of the ${jar} is still empty? Write it as a decimal.`, picture: blank, answer: dec(left),
      steps: [`${a}/10 = ${10 * a}/100, so ${10 * a}/100 + ${b}/100 = ${full}/100 is full.`, `100/100 − ${full}/100 = ${left}/100 is empty.`, `So ${fmt(dec(left))} of the ${jar} is still empty.`] }
  } },
]

// ── t7 · Money as decimals ────────────────────────────────────────────────────────────────────────────────
const money = (cents: number) => `$${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`
const T7: Level[] = [
  { style: 'dollars, dimes and pennies from a table', make: r => {
    const d = int(r, 1, 9), x = int(r, 0, 9), p = int(r, 1, 9), c = 100 * d + 10 * x + p
    return { text: `You have ${pl(d, 'dollar')}, ${x === 1 ? '1 dime' : `${x} dimes`} and ${p === 1 ? '1 penny' : `${p} pennies`}. How much money is that?`, picture: coins(d, x, p), answer: dec(c),
      steps: [`The ${pl(d, 'dollar')} ${d === 1 ? 'goes' : 'go'} before the point.`, `${x === 1 ? '1 dime is' : `${x} dimes are`} ${x} ${x === 1 ? 'tenth' : 'tenths'}. ${p === 1 ? '1 penny is' : `${p} pennies are`} ${p} ${p === 1 ? 'hundredth' : 'hundredths'}.`, `So it is $${fmt(dec(c))}.`] }
  } },
  { style: 'dollars and cents in words (with the 0 for no dimes)', make: r => {
    const d = int(r, 1, 20), cc = r() < 0.4 ? int(r, 1, 9) : notTens(r, 11, 99), c = 100 * d + cc
    return { text: `Write ${pl(d, 'dollar')} and ${pl(cc, 'cent')} with a point.`, picture: eq('$ ? . ? ?'), answer: dec(c),
      steps: [`The ${d} goes before the point.`, cc < 10 ? `${pl(cc, 'cent')} is ${cc} hundredths and no dimes, so a 0 goes right after the point.` : `${cc} cents are ${cc} hundredths, so they take the two places after the point.`, `So it is $${fmt(dec(c))}.`] }
  } },
  { style: 'pick the right price tag', make: r => {
    const d = int(r, 1, 9), p = int(r, 1, 9), who = pick(r, ['Tia', 'Ben', 'Rosa', 'Eli'])
    const right = `$${d}.0${p}`
    return { text: `${who} has ${pl(d, 'dollar')} and ${p === 1 ? '1 penny' : `${p} pennies`}, and no dimes. Which price tag shows that much?`, picture: coins(d, 0, p),
      answer: choose(r, right, [`$${d}.${p}`, `$0.${d}${p}`]),
      steps: ['The dollars go before the point.', `There are no dimes, so a 0 goes right after the point. The ${p} ${p === 1 ? 'penny goes' : 'pennies go'} second.`, `So the answer is ${right}.`] }
  } },
  { style: 'work backwards: a price into cents', make: r => {
    const d = int(r, 1, 9), cc = int(r, 1, 99), c = 100 * d + cc
    return { text: `How many cents is ${money(c)}?`, picture: eq(`${money(c)} = ? cents`), answer: c,
      steps: [`Each dollar is 100 cents, so ${pl(d, 'dollar')} ${d === 1 ? 'is' : 'are'} ${100 * d} cents.`, `The .${String(cc).padStart(2, '0')} is ${pl(cc, 'cent')}.`, `So ${money(c)} is ${fmt(c)} cents.`] }
  } },
  { style: 'two-step story: trade 10 pennies for a dime', make: r => {
    const d = int(r, 1, 9), p = notTens(r, 11, 29), q = Math.floor(p / 10), x = int(r, 0, 9 - q), c = 100 * d + 10 * x + p
    return { text: `Sam empties his piggy bank. He finds ${pl(d, 'dollar')}, ${x === 1 ? '1 dime' : `${x} dimes`} and ${p} pennies. How much money is that?`, picture: coins(d, x, p), answer: dec(c),
      steps: [`${p} pennies is ${q === 1 ? '1 dime' : `${q} dimes`} and ${p % 10 === 1 ? '1 penny' : `${p % 10} pennies`}.`, `So he has ${pl(d, 'dollar')}, ${x + q} dimes and ${p % 10 === 1 ? '1 penny' : `${p % 10} pennies`}.`, `So it is $${fmt(dec(c))}.`] }
  } },
]

export const G4M6_LADDERS: Record<string, Level[]> = {
  'g4m6-t1': T1, 'g4m6-t2': T2, 'g4m6-t3': T3, 'g4m6-t4': T4, 'g4m6-t5': T5, 'g4m6-t6': T6, 'g4m6-t7': T7,
}
