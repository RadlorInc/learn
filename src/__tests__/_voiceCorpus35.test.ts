/**
 * The 3–5 spoken corpus → scripts/.voice-corpus-3-5.json, for voice-generate.mts --corpus.
 *
 *   VOICE_CORPUS=1 npx vitest run src/__tests__/_voiceCorpus35.test.ts
 *
 * A vitest file rather than a script because the story chapters import through `@/` and need
 * jsdom, which this runner already has. Opt-in: it writes a file and is not a check.
 *
 * Every line a 3–5 chapter can SPEAK, in four buckets so the render can be cut to a character
 * budget in priority order (the generator renders the file top to bottom; `--limit` slices it):
 *   scored   — said on every scored round (the beat's say, praise, misses, numbers)
 *   teach    — the fixed demo / guided round a first run always plays, intros, world labels
 *   redirect — wrong-tap nudges, bounded by their small vocabularies
 *   reteach  — the demo lines over EVERY round the re-teach can replay (the cross-products)
 * Templated lines are enumerated here from the same tables the components read. That is a copy
 * of each template, deliberately: when a chapter rewords one, the old clip is simply never asked
 * for and the line falls back to browser speech until the corpus is rebuilt.
 */
import { it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { clipKey } from '@/core/voiceClips'
import { PRAISE } from '@/core/praise'
import { ENCOURAGEMENT } from '@/shared/hooks/useAdaptive'
import type { Beat } from '@/features/chapters/story/StoryWorld'
import { CAST } from '@/features/chapters/story/critters'
import { STORYTELLINGS, COUNTING_WORLDS } from '@/features/chapters/story/biomes'
import { makePracticeCountBeat } from '@/features/chapters/story/world1'
import { makeLineBeat } from '@/features/chapters/story/FollowTheLeader'
import { makeNestBeat, WORLDS as NEST_WORLDS, guidedSay } from '@/features/chapters/story/NestTree'
import { makeHomeBeat } from '@/features/chapters/story/HomeTime'
import { makeCmpBeat } from '@/features/chapters/story/BigOrSmall'
import { makeShapeBeat, BUILDS, SEQUENCE } from '@/features/chapters/story/ShapeTown'
import { SHAPES, SHAPE_ORDER } from '@/features/chapters/lessons/ShapesLesson'
import { makeColorRound, sayFor as colorSay, TEST_PAGE, TEACH_PAGE, COLORS } from '@/features/chapters/story/RainbowTown'
import { makePatternRound, sayFor as beadSay, EMPTY_STRAND, BEADS, MAKES } from '@/features/chapters/story/BeadShop'
import { makePlayBeat } from '@/features/chapters/story/PlayTime'
import { makeMeasureBeat, WORLDS as MEASURE_WORLDS } from '@/features/chapters/story/MeasureIt'

type Bucket = 'scored' | 'teach' | 'redirect' | 'reteach'
const ORDER: Bucket[] = ['scored', 'teach', 'redirect', 'reteach']
const lines = new Map<string, { text: string; kind: Bucket; sources: string[] }>()

function add(kind: Bucket, src: string, ...texts: string[]) {
  for (const raw of texts) {
    const text = raw.replace(/\s+/g, ' ').trim()
    if (!text || !/[a-zA-Z0-9]/.test(text)) continue
    const key = clipKey(text)
    const hit = lines.get(key)
    if (!hit) lines.set(key, { text, kind, sources: [src] })
    else {
      if (!hit.sources.includes(src)) hit.sources.push(src)
      if (ORDER.indexOf(kind) < ORDER.indexOf(hit.kind)) hit.kind = kind   // keep the higher priority
    }
  }
}
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i)
const DRAWS = 1200

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromBeat(src: string, beat: Beat<any>) {
  const cov = beat.coverage?.all ?? []
  for (let i = 0; i < DRAWS; i++) {
    const d = ((i % 3) + 1) as 1 | 2 | 3
    const asked = cov.slice(0, i % (cov.length + 1))
    const data = beat.make(d, i % beat.rounds, asked)
    add('scored', src, (beat.say ?? beat.prompt)(data))     // exactly what SkillBeat speaks
  }
}

it('builds the 3–5 corpus', () => {
  if (!process.env.VOICE_CORPUS) return

  // ── shared by every storybook chapter ──────────────────────────────────────
  add('scored', 'StoryWorld', ...PRAISE, ...ENCOURAGEMENT.flat())
  add('scored', 'numbers', ...range(1, 10).map(String))

  // ── counting ────────────────────────────────────────────────────────────────
  for (const story of STORYTELLINGS) {
    fromBeat('counting', makePracticeCountBeat(story))
    add('teach', 'counting', story.intro, story.outro)
  }
  add('teach', 'counting', ...COUNTING_WORLDS.map(w => w.label),
    'Now you count! Tap each one you see.', "Let's count together!", 'So how many did you count? Tap the number!')

  // ── numberOrdering · Follow the Leader ──────────────────────────────────────
  fromBeat('numberOrdering', makeLineBeat())
  add('teach', 'numberOrdering', 'Off we go! Smallest first.', 'Everybody in line!',
    `${CAST[0].mother} is waiting. The smallest one goes first.`, 'The smallest is 1. Come along, 1!', 'Then 2.', 'Then 3.',
    `Now you! Tap the smallest ${CAST[1].little} first.`)
  for (const k of CAST) {
    add('redirect', 'numberOrdering', `Not yet! Find the smallest ${k.little}.`)
    add('reteach', 'numberOrdering', `${k.mother} is waiting. The smallest one goes first.`, `Now you! Tap the smallest ${k.little} first.`)
  }
  for (const v of range(1, 10)) add('reteach', 'numberOrdering', `The smallest is ${v}. Come along, ${v}!`, `Then ${v}.`)

  // ── numberRecognition · Nest Tree ───────────────────────────────────────────
  const nestDemo = (noun: string, t: number) => [
    `This ${noun} is hungry. Milo says nest number ${t}.`, `${t}! Find the nest that says ${t}.`, `There it is! Mummy bird feeds nest number ${t}.`]
  for (const w of NEST_WORLDS) {
    fromBeat('numberRecognition', makeNestBeat(w))
    add('teach', 'numberRecognition', w.label, ...nestDemo(w.noun, 3), ...nestDemo(w.noun, 5), guidedSay(w, 2))
    for (const t of range(1, 10)) add('reteach', 'numberRecognition', ...nestDemo(w.noun, t), guidedSay(w, t))
  }
  add('teach', 'numberRecognition', 'Yes! Nest number 2! Great job!')
  for (const t of range(1, 10)) {
    add('redirect', 'numberRecognition', `Yes! Nest number ${t}! Great job!`)
    for (const x of range(1, 10)) if (x !== t) add('redirect', 'numberRecognition', `That's ${x}. Find nest number ${t}!`)
  }

  // ── matchingQuantities · Home Time ──────────────────────────────────────────
  fromBeat('matchingQuantities', makeHomeBeat())
  const HOME_WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven']
  add('teach', 'matchingQuantities', `Milo needs exactly 3 ${CAST[0].plural} to walk home.`, 'One.', 'Two.', 'Three.',
    'That is 3. Milo has enough — so he STOPS, even though there are more.', 'Ready! Off we go.', '3! Just right. Off we go!',
    `Now you! Milo needs exactly 2 ${CAST[1].plural}.`, '2! Just right. Off we go!', 'Back you go.')
  for (const k of CAST) add('redirect', 'matchingQuantities', `Tap the ${k.plural} to send them to Milo.`)
  for (const t of range(1, 7)) {
    for (const h of range(1, 10)) {
      if (h < t) add('redirect', 'matchingQuantities', `That is only ${h}. Milo needs ${t} — send some more!`)
      if (h > t) add('redirect', 'matchingQuantities', `That is ${h} — too many! Milo needs ${t}. Tap one to send it back.`)
    }
    add('reteach', 'matchingQuantities', `${HOME_WORDS[t]}.`, `That is ${t}. Milo has enough — so he STOPS, even though there are more.`, `${t}! Just right. Off we go!`)
    for (const k of CAST) add('reteach', 'matchingQuantities', `Milo needs exactly ${t} ${k.plural} to walk home.`,
      `Now you! Milo needs exactly ${t} ${t === 1 ? k.little : k.plural}.`)
  }

  // ── numberComparison · Bigger or Smaller ────────────────────────────────────
  fromBeat('numberComparison', makeCmpBeat())
  add('teach', 'numberComparison', "Let's count this bunch. 4.", 'And this bunch. 2.', '4 is more — that is the one Milo takes.', 'Now you! Tap the bunch with MORE.')
  add('redirect', 'numberComparison', 'Not that one — look at the numbers again.', 'Not quite — count each bunch again.',
    'Now you! Tap the bunch with FEWER.', 'Now you! Tap the bunch with the MOST.', 'Now you! Tap the bunch with the FEWEST.')
  for (const n of range(1, 9)) add('reteach', 'numberComparison', `Let's count this bunch. ${n}.`, `And this bunch. ${n}.`,
    `${n} is more — that is the one Milo takes.`, `${n} is fewer — that is the one Milo takes.`)
  for (const n of range(1, 10)) {
    add('reteach', 'numberComparison', `${n} is bigger. Tap that one!`, `${n} is smaller. Tap that one!`)
    for (const m of range(1, 10)) if (m !== n) add('reteach', 'numberComparison', `This one has ${n}. This one has ${m}.`)
  }

  // ── shapes · Shape House ────────────────────────────────────────────────────
  fromBeat('shapes', makeShapeBeat(() => 1))
  const shapeLines = (bi: number, pi: number) => {
    const part = BUILDS[bi].parts[pi], label = SHAPES[part.name].label
    return [`Look — the ${part.label} is missing. It needs a ${label}.`, `This one is a ${label}. Watch it fit!`,
      `Now you! The ${part.label} needs a ${label}. Tap it!`, `Great job! The ${label} fits!`]
  }
  add('teach', 'shapes', 'These are the shapes!', ...SHAPE_ORDER.map(s => SHAPES[s].label), ...BUILDS.map(b => b.opening),
    ...shapeLines(SEQUENCE[0].bi, SEQUENCE[0].pi), ...shapeLines(SEQUENCE[1].bi, SEQUENCE[1].pi))
  for (const s of SHAPE_ORDER) add('redirect', 'shapes', `That's a ${SHAPES[s].label}. It doesn't fit. Look at the hole!`)
  for (const st of SEQUENCE) add('reteach', 'shapes', ...shapeLines(st.bi, st.pi))

  // ── colors · Rainbow Town ───────────────────────────────────────────────────
  for (const d of [1, 2, 3] as const) for (let r = 0; r < TEST_PAGE.targets.length; r++)
    add('scored', 'colors', colorSay(TEST_PAGE, makeColorRound(TEST_PAGE, d, r)))
  const hues = Object.values(COLORS).map(c => c.label)
  const targets = [...TEACH_PAGE.targets, ...TEST_PAGE.targets]
  for (const t of targets) add('scored', 'colors', `${COLORS[t.color].label}! The ${t.noun} is ${COLORS[t.color].label}.`)
  for (const t of TEACH_PAGE.targets) {
    const c = COLORS[t.color].label
    add('teach', 'colors', `This colour is ${c}. The ${t.noun} is ${c}! Pick up the ${c} paint — it is jumping up and down — then tap the ${t.noun}.`,
      `Let's do this one together. The ${t.noun} is glowing — that is the bit we colour.`,
      `We want ${c}. Remember the ${c} in the garden? This is the ${c} paint.`, `Watch the ${t.noun} turn ${c}!`)
  }
  for (let r = 0; r < TEACH_PAGE.targets.length; r++) add('teach', 'colors', colorSay(TEACH_PAGE, makeColorRound(TEACH_PAGE, 1, r)))
  for (const c of hues) add('redirect', 'colors', `Pick up a paint first! We need ${c}.`)
  for (const a of hues) for (const b of hues) if (a !== b)
    add('redirect', 'colors', `That one is ${a}. We want ${b} — the paint that is jumping!`, `That's ${a} paint. We need ${b}!`)
  for (const t of targets) add('redirect', 'colors', `Now, where is the ${t.noun}? Look for the glowing part!`,
    `That's the other ${t.noun}! Tap the one that is glowing.`, `That's the ${t.noun}! Tap the part that is glowing.`)

  // ── patterns · Bead Shop ────────────────────────────────────────────────────
  const chants = new Set<string>()
  for (const make of MAKES) for (const d of [1, 2, 3] as const) for (let r = 0; r < 10; r++) {
    const round = makePatternRound(EMPTY_STRAND, d, r)
    add('scored', 'patterns', beadSay(make)(round))
    chants.add(round.unit.map(c => BEADS[c].label).join(', '))
  }
  add('teach', 'patterns', 'Look at the pattern. It goes red, blue, red, blue, over and over.', 'Yes! The blue one!', 'Yes! The red one!',
    ...MAKES.flatMap(m => [`So the next ${m.noun} is blue. Watch it go on!`, `Now you! What ${m.noun} comes next? Tap it!`]))
  for (const l of Object.values(BEADS).map(b => b.label))
    add('redirect', 'patterns', `Yes! The ${l} one!`, `That one is ${l}. Look at the pattern again — what comes next?`)
  for (const chant of chants) add('reteach', 'patterns', `Look at the pattern. It goes ${chant}, ${chant}, over and over.`)
  for (const m of MAKES) for (const l of Object.values(BEADS).map(b => b.label)) add('reteach', 'patterns', `So the next ${m.noun} is ${l}. Watch it go on!`)

  // ── addition / subtraction · Play Time ──────────────────────────────────────
  fromBeat('addition', makePlayBeat('+'))
  fromBeat('subtraction', makePlayBeat('-'))
  const PLAY_WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten']
  add('teach', 'addition', `Two ${CAST[0].plural} are playing with Milo.`, 'Another one comes to play!', 'Now count them ALL.',
    'One.', 'Two.', 'Three.', 'Four.', 'That makes 4. Tap the 4!', 'Some more come to play! Count them all, then tap how many.')
  add('teach', 'subtraction', `Five ${CAST[0].plural} are playing with Milo.`, 'One goes home.', 'Now count who is LEFT.',
    'That makes 3. Tap the 3!', 'Some go home! Count who is left, then tap how many.')
  add('redirect', 'addition', 'Not quite — count them all again, one by one.')
  add('redirect', 'subtraction', 'Not quite — count who is still here.')
  for (const n of range(1, 10)) {
    add('reteach', 'addition', `That makes ${n}. Tap the ${n}!`, `${PLAY_WORDS[n]}.`)
    for (const k of CAST) add('reteach', 'addition', `${PLAY_WORDS[n]} ${k.plural} are playing with Milo.`)
  }

  // ── measurement · Measuring ─────────────────────────────────────────────────
  for (const w of MEASURE_WORLDS) {
    fromBeat('measurement', makeMeasureBeat(w, () => {}))
    const end = w.axis === 'up' ? 'the very top' : 'the very end'
    const demo = (t: typeof w.things[number]) => [`How ${w.word} is the ${t.noun}? Let's lay Milo's blocks!`,
      `We reached ${end}! So the ${t.noun} is ${t.units} blocks ${w.word}.`]
    add('teach', 'measurement', w.label, ...demo(w.things[0]), ...demo(w.things[2]),
      `Your turn! Lay the blocks until you reach the end of the ${w.things[1].noun}.`)
    for (const t of w.things) {
      add('scored', 'measurement', `${t.units}. The ${t.noun} is ${t.units} blocks ${w.word}.`,
        ...range(1, 6).map(n => `${n} blocks! The ${t.noun} is ${n} blocks ${w.word}.`))
      add('reteach', 'measurement', ...demo(t), `Your turn! Lay the blocks until you reach the end of the ${t.noun}.`)
    }
  }

  // ── write, in priority order ────────────────────────────────────────────────
  const out = [...lines.entries()]
    .map(([key, v]) => ({ key, text: v.text, chars: v.text.length, kind: v.kind, sources: v.sources }))
    .sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind) || b.chars - a.chars)
  writeFileSync('scripts/.voice-corpus-3-5.json', JSON.stringify(out, null, 2))
  let cum = 0
  const report = ORDER.map(k => { const ls = out.filter(l => l.kind === k); const c = ls.reduce((n, l) => n + l.chars, 0); cum += c
    return `${k.padEnd(9)} ${String(ls.length).padStart(4)} lines ${String(c).padStart(6)} chars  (cumulative ${cum})` })
  writeFileSync('scripts/.voice-corpus-3-5.txt', report.join('\n') + '\n')
})
