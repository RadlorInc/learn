/**
 * The spoken corpus of the eleven ex-3–5 story chapters (now KG and Grade 1) → scripts/.voice-corpus-3-5.json.
 *
 *   VOICE_CORPUS=1 npx vitest run src/__tests__/_voiceCorpus35.test.ts
 *
 * Opt-in: it writes a file and is not a check. `_voiceCorpusChapters.test.ts` runs `build35` with
 * `build68` to make the one Josh corpus; `chapterVoiceCorpus.test.ts` is the check that it is current.
 *
 * Every line a chapter can SPEAK, in four buckets so the render can be cut in priority order:
 *   scored   — said on every scored round (the beat's say, praise, misses, numbers)
 *   teach    — the fixed demo / guided round a first run always plays, intros, world labels
 *   redirect — wrong-tap nudges, bounded by their small vocabularies
 *   reteach  — the demo lines over EVERY round the re-teach can replay (the cross-products)
 *
 * WHERE THE WORDS COME FROM, in order of preference:
 *   1. the chapter's own exports — `beat.say`, the tables (CAST, BUILDS, COLORS…), exported helpers;
 *   2. RENDERING the chapter's Reteach with the speaker stubbed (`Corpus.fromReteach`) — over the
 *      beat's own draws and over the opening demo's fixed round, so demo lines are never copied;
 *   3. a hand copy, only for lines that live inside a component with no exported way in (guided
 *      and wrong-tap lines, and the cross-products that make the re-teach complete). Copied from the
 *      chapter code as of 2026-09-25 (no mascot). A reworded template turns
 *      `chapterVoiceCorpus.test.ts` red: every spoken template in the chapter source must match at
 *      least one row of the merged corpus.
 */
import { it, vi, expect } from 'vitest'
import { writeFileSync } from 'node:fs'
import { PRAISE } from '@/core/praise'
import { ENCOURAGEMENT } from '@/shared/hooks/useAdaptive'
import { C } from '@/features/lessons/sessionCopy'
import { CHAPTER_TAKE } from '@/features/chapters/story/take'
import { CAST, HABITATS } from '@/features/chapters/story/critters'
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
import { Corpus, ORDER, range, polyfillResizeObserver, seedRandom } from './_voiceCorpusKit'

vi.mock('@/infra/useMiloSpeaker', async (orig) =>
  ({ ...(await orig<object>()), ...(await import('./_voiceCorpusKit')).SPEAKER_STUB }))

export async function build35(c: Corpus) {
  polyfillResizeObserver()
  seedRandom(35)            // the same draws every rebuild — see seedRandom
  const add = c.add.bind(c)

  // ── shared by every storybook chapter (SkillBeat: praise on right, encouragement on wrong) ──
  add('counting', 'scored', ...PRAISE, ...ENCOURAGEMENT.flat())
  // Numbers said one at a time: counting taps, the line-up, Home Time's send, MeasureIt's block
  // count. MeasureIt's "Add block" has no ceiling and "Remove block" can say 0, so 0–20.
  add('counting', 'scored', ...range(0, 20).map(String))
  add('counting', 'teach', 'All done! Nice work.')      // ChapterDone, every chapter's end card
  // ChapterDone's end-of-take card (KG–2: 5 questions a sitting) — the same string ChapterDone builds.
  add('counting', 'teach', `${C.breakTitle(CHAPTER_TAKE).replace(' ⭐', '')} ${C.spotSaved}`)

  // ── counting ────────────────────────────────────────────────────────────────
  for (const story of STORYTELLINGS) {
    const beat = makePracticeCountBeat(story)
    c.fromBeat('counting', beat)
    await c.fromReteach('counting', beat)
    add('counting', 'teach', story.intro, story.outro)
  }
  add('counting', 'teach', ...COUNTING_WORLDS.map(w => w.label),
    'Now you count! Tap each one you see.', "Let's count together!", 'So how many did you count? Tap the number!')

  // ── numberOrdering · Follow the Leader ──────────────────────────────────────
  const line = makeLineBeat()
  c.fromBeat('numberOrdering', line)
  await c.fromReteach('numberOrdering', line, [    // DEMO_ROUND, FollowTheLeader.tsx
    { kind: 'teach', data: { scene: HABITATS.meadow.scenes[0], nums: [3, 1, 2], castIdx: 0 } }])
  add('numberOrdering', 'teach', 'Off we go! Smallest first.', `Now you! Tap the smallest ${CAST[1].little} first.`)
  for (const k of CAST) {
    add('numberOrdering', 'redirect', `Not yet! Find the smallest ${k.little}.`)
    add('numberOrdering', 'reteach', `${k.mother} is waiting. The smallest one goes first.`, `Now you! Tap the smallest ${k.little} first.`)
  }
  for (const v of range(1, 10)) add('numberOrdering', 'reteach', `The smallest is ${v}. Come along, ${v}!`, `Then ${v}.`)

  // ── numberRecognition · Nest Tree ───────────────────────────────────────────
  for (const w of NEST_WORLDS) {
    const beat = makeNestBeat(w)
    c.fromBeat('numberRecognition', beat)
    await c.fromReteach('numberRecognition', beat, [     // DEMO_ROUNDS, NestTree.tsx
      { kind: 'teach', data: { scene: w.scenes[0], nums: [2, 3], answerIdx: 1 } },
      { kind: 'teach', data: { scene: w.scenes[0], nums: [5, 1, 8], answerIdx: 0 } }])
    add('numberRecognition', 'teach', w.label, guidedSay(w, 2))
    for (const t of range(1, 10)) add('numberRecognition', 'reteach', guidedSay(w, t),
      `This ${w.noun} is hungry. Listen: nest number ${t}.`, `${t}! Find the nest that says ${t}.`,
      `There it is! Mommy bird feeds nest number ${t}.`)
  }
  add('numberRecognition', 'teach', 'Yes! Nest number 2! Great job!')
  for (const t of range(1, 10)) {
    add('numberRecognition', 'redirect', `Yes! Nest number ${t}! Great job!`)
    for (const x of range(1, 10)) if (x !== t) add('numberRecognition', 'redirect', `That's ${x}. Find nest number ${t}!`)
  }

  // ── matchingQuantities · Home Time ──────────────────────────────────────────
  const home = makeHomeBeat()
  c.fromBeat('matchingQuantities', home)
  await c.fromReteach('matchingQuantities', home, [     // DEMO_ROUND, HomeTime.tsx
    { kind: 'teach', data: { scene: HABITATS.meadow.scenes[0], target: 3, pool: 6, castIdx: 0 } }])
  const HOME_WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven']
  const homeNoun = (t: number, k: typeof CAST[number]) => (t === 1 ? k.little : k.plural)
  add('matchingQuantities', 'teach', 'Back you go.', '3! Just right. Off we go!', 'Ready! Off we go.',
    `Now you! Send exactly 2 ${CAST[1].plural} home.`, '2! Just right. Off we go!')
  for (const k of CAST) add('matchingQuantities', 'redirect', `Tap the ${k.plural} to send them home.`)
  for (const t of range(1, 7)) {
    for (const h of range(1, 10)) {
      if (h < t) add('matchingQuantities', 'redirect', `That is only ${h}. We need ${t} — send some more!`)
      if (h > t) add('matchingQuantities', 'redirect', `That is ${h} — too many! We need ${t}. Tap one to send it back.`)
    }
    add('matchingQuantities', 'reteach', `${HOME_WORDS[t]}.`, `That is ${t}. We have enough — so we STOP, even though there are more.`, `${t}! Just right. Off we go!`)
    for (const k of CAST) add('matchingQuantities', 'reteach', `We need exactly ${t} ${homeNoun(t, k)} to walk home.`,
      `Now you! Send exactly ${t} ${homeNoun(t, k)} home.`)
  }

  // ── numberComparison · Bigger or Smaller ────────────────────────────────────
  const cmp = makeCmpBeat()
  c.fromBeat('numberComparison', cmp)
  await c.fromReteach('numberComparison', cmp, [        // DEMO_ROUND, BigOrSmall.tsx
    { kind: 'teach', data: { scene: HABITATS.meadow.scenes[0], counts: [4, 2], mode: 'more', want: 0, castIdx: 0 } }])
  add('numberComparison', 'teach', 'Now you! Tap the bunch with MORE.')
  add('numberComparison', 'redirect', 'Not that one — look at the numbers again.', 'Not quite — count each bunch again.',
    'Now you! Tap the bunch with FEWER.', 'Now you! Tap the bunch with the MOST.', 'Now you! Tap the bunch with the FEWEST.')
  for (const n of range(1, 9)) add('numberComparison', 'reteach', `Let's count this bunch. ${n}.`, `And this bunch. ${n}.`,
    `${n} is more — that is the one we pick.`, `${n} is fewer — that is the one we pick.`)
  for (const n of range(1, 10)) {
    add('numberComparison', 'reteach', `${n} is bigger. Tap that one!`, `${n} is smaller. Tap that one!`)
    for (const m of range(1, 10)) if (m !== n) add('numberComparison', 'reteach', `This one has ${n}. This one has ${m}.`)
  }

  // ── shapes · Shape House ────────────────────────────────────────────────────
  c.fromBeat('shapes', makeShapeBeat(() => 1))
  const shapeLines = (bi: number, pi: number) => {
    const part = BUILDS[bi].parts[pi], label = SHAPES[part.name].label
    return [`Look — the ${part.label} is missing. It needs a ${label}.`, `This one is a ${label}. Watch it fit!`,
      `Now you! The ${part.label} needs a ${label}. Tap it!`, `Great job! The ${label} fits!`]
  }
  add('shapes', 'teach', 'These are the shapes!', ...SHAPE_ORDER.map(s => SHAPES[s].label), ...BUILDS.map(b => b.opening),
    ...shapeLines(SEQUENCE[0].bi, SEQUENCE[0].pi), ...shapeLines(SEQUENCE[1].bi, SEQUENCE[1].pi))
  for (const s of SHAPE_ORDER) add('shapes', 'redirect', `That's a ${SHAPES[s].label}. It doesn't fit. Look at the hole!`)
  for (const st of SEQUENCE) add('shapes', 'reteach', ...shapeLines(st.bi, st.pi))

  // ── colors · Rainbow Town ───────────────────────────────────────────────────
  // (the chapter still says "colour" in two lines — the clip keys the words as spoken)
  for (const d of [1, 2, 3] as const) for (let r = 0; r < TEST_PAGE.targets.length; r++)
    add('colors', 'scored', colorSay(TEST_PAGE, makeColorRound(TEST_PAGE, d, r)))
  const hues = Object.values(COLORS).map(x => x.label)
  const targets = [...TEACH_PAGE.targets, ...TEST_PAGE.targets]
  for (const t of targets) add('colors', 'scored', `${COLORS[t.color].label}! The ${t.noun} is ${COLORS[t.color].label}.`)
  for (const t of TEACH_PAGE.targets) {
    const x = COLORS[t.color].label
    add('colors', 'teach', `This color is ${x}. The ${t.noun} is ${x}! Pick up the ${x} paint — it is jumping up and down — then tap the ${t.noun}.`)
  }
  for (const t of targets) {
    const x = COLORS[t.color].label
    add('colors', 'reteach', `Let's do this one together. The ${t.noun} is glowing — that is the bit we color.`,
      `We want ${x}. Remember the ${x} in the garden? This is the ${x} paint.`, `Watch the ${t.noun} turn ${x}!`)
  }
  for (let r = 0; r < TEACH_PAGE.targets.length; r++) add('colors', 'teach', colorSay(TEACH_PAGE, makeColorRound(TEACH_PAGE, 1, r)))
  for (const x of hues) add('colors', 'redirect', `Pick up a paint first! We need ${x}.`)
  for (const a of hues) for (const b of hues) if (a !== b)
    add('colors', 'redirect', `That one is ${a}. We want ${b} — the paint that is jumping!`, `That's ${a} paint. We need ${b}!`)
  for (const t of targets) add('colors', 'redirect', `Now, where is the ${t.noun}? Look for the glowing part!`,
    `That's the other ${t.noun}! Tap the one that is glowing.`, `That's the ${t.noun}! Tap the part that is glowing.`)

  // ── patterns · Bead Shop ────────────────────────────────────────────────────
  const chants = new Set<string>()
  for (const make of MAKES) for (const d of [1, 2, 3] as const) for (let r = 0; r < 10; r++) {
    const round = makePatternRound(EMPTY_STRAND, d, r)
    add('patterns', 'scored', beadSay(make)(round))
    chants.add(round.unit.map(u => BEADS[u].label).join(', '))
  }
  add('patterns', 'teach', ...MAKES.map(m => m.label), 'Look at the pattern. It goes red, blue, red, blue, over and over.',
    'Yes! The blue one!', 'Yes! The red one!',
    ...MAKES.flatMap(m => [`So the next ${m.noun} is blue. Watch it go on!`, `Now you! What ${m.noun} comes next? Tap it!`]))
  for (const l of Object.values(BEADS).map(b => b.label))
    add('patterns', 'redirect', `Yes! The ${l} one!`, `That one is ${l}. Look at the pattern again — what comes next?`)
  for (const chant of chants) add('patterns', 'reteach', `Look at the pattern. It goes ${chant}, ${chant}, over and over.`)
  for (const m of MAKES) for (const l of Object.values(BEADS).map(b => b.label)) add('patterns', 'reteach', `So the next ${m.noun} is ${l}. Watch it go on!`)

  // ── addition / subtraction · Play Time ──────────────────────────────────────
  for (const op of ['+', '-'] as const) {
    const ch = op === '+' ? 'addition' : 'subtraction'
    const beat = makePlayBeat(op)
    c.fromBeat(ch, beat)
    await c.fromReteach(ch, beat, [{ kind: 'teach', data: op === '+'     // DEMO_ROUND, PlayTime.tsx
      ? { scene: HABITATS.meadow.scenes[0], op, a: 2, b: 2, answer: 4, choices: [3, 4, 5], castIdx: 0 }
      : { scene: HABITATS.meadow.scenes[0], op, a: 5, b: 2, answer: 3, choices: [2, 3, 4], castIdx: 0 } }])
  }
  const PLAY_WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten']
  add('addition', 'teach', 'Some more come to play! Count them all, then tap how many.')
  add('subtraction', 'teach', 'Some go home! Count who is left, then tap how many.')
  add('addition', 'redirect', 'Not quite — count them all again, one by one.')
  add('subtraction', 'redirect', 'Not quite — count who is still here.')
  add('addition', 'reteach', 'Another one comes to play!', 'Now count them ALL.')
  add('subtraction', 'reteach', 'One goes home.', 'Now count who is LEFT.')
  for (const n of range(1, 10)) {
    add('addition', 'reteach', `That makes ${n}. Tap the ${n}!`, `${PLAY_WORDS[n]}.`)
    for (const k of CAST) add('addition', 'reteach', `${PLAY_WORDS[n]} ${k.plural} are playing.`)
  }

  // ── measurement · Measuring ─────────────────────────────────────────────────
  for (const w of MEASURE_WORLDS) {
    const beat = makeMeasureBeat(w, () => {})
    c.fromBeat('measurement', beat)
    // Demo = the world's things[0] and things[2] (MeasureIt.tsx), guided = things[1].
    await c.fromReteach('measurement', beat, [w.things[0], w.things[2]].map(data => ({ kind: 'teach' as const, data })))
    const end = w.axis === 'up' ? 'the very top' : 'the very end'
    add('measurement', 'teach', w.label, `Your turn! Lay the blocks until you reach the end of the ${w.things[1].noun}.`)
    for (const t of w.things) {
      add('measurement', 'scored', `${t.units}. The ${t.noun} is ${t.units} blocks ${w.word}.`, `${t.units} blocks! The ${t.noun} is ${t.units} blocks ${w.word}.`)
      add('measurement', 'reteach', `How ${w.word} is the ${t.noun}? Let's lay the blocks!`,
        `We reached ${end}! So the ${t.noun} is ${t.units} blocks ${w.word}.`,
        `Your turn! Lay the blocks until you reach the end of the ${t.noun}.`)
    }
  }
  add('measurement', 'redirect', 'Oops — that went past the end. Watch…', 'Not quite there yet. Watch…')
}

it('builds the 3–5 corpus', async () => {
  // Also imported by _voiceCorpusChapters.test.ts, where this must not run a second time.
  if (!process.env.VOICE_CORPUS || !expect.getState().testPath?.endsWith('_voiceCorpus35.test.ts')) return
  const c = new Corpus()
  await build35(c)
  const out = [...c.lines.entries()]
    .map(([key, v]) => ({ key, text: v.text, chars: v.text.length, kind: v.kind, sources: v.chapters }))
    .sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind) || b.chars - a.chars)
  writeFileSync(process.env.VOICE_OUT ?? 'scripts/.voice-corpus-3-5.json', JSON.stringify(out, null, 2))
  expect([...c.holes], 'a chapter’s re-teach yielded nothing — this corpus is short by that chapter').toEqual([])
}, 300_000)
