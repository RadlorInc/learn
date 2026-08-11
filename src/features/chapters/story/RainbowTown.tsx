'use client'
/**
 * Chapter 7 — COLOUR recognition (skill `colors`), as an actual COLOURING GAME.
 *
 * HOW A COLOURING GAME WORKS, which is what this now is. ONE picture, drawn as line art, cut by its
 * own ink into a hundred-odd enclosed areas. You pick a colour and TAP AN AREA, and the area floods.
 * You keep the colour and carry on. The picture fills up as you go.
 *
 * The two earlier attempts both missed that, and it is worth writing down why. The first was a
 * line-up: name a colour, tap the matching object out of three — colour as a quiz answer. The second
 * put five whole objects on an empty page and recoloured one per round — closer, but a picture is
 * not five objects floating on emptiness, and a tree is not one colour: it is a crown AND a trunk.
 * What makes it a colouring page is that the SCENE is the thing, the areas come from the drawing,
 * and there are far more of them than there are questions.
 *
 * THE LESSON RIDES ON TOP OF THAT, it does not replace it. Milo asks for a colour AND a thing —
 * "colour the roof red" — so the child learns the colour word and the object word together, and a
 * wrong tap names what was actually touched. Everything Milo has NOT asked for is still colourable,
 * with any colour, ungraded: that is the child's picture, and taking it away to protect the quiz
 * would be exactly the mistake the first two versions made.
 *
 * THE SKILL IS COLOUR, SO ONLY THE COLOUR IS GRADED. The asked-for area GLOWS. Finding which shape
 * is "the roof" is a second, unrelated hurdle standing in front of the thing this chapter measures,
 * and a child who knows red perfectly well could fail on it. So Milo names the thing AND shows it,
 * and the one decision left is which paint. Tapping the wrong area is a redirect, never a mark
 * against them; picking the wrong paint is the only thing that counts as wrong.
 *
 * AND MILO NEVER ASKS FOR A COLOUR THE THING CANNOT HONESTLY BE. The box holds six paints and none
 * of them is white, grey or brown, so the clouds and the tree trunk are simply not questions — they
 * stay free to colour, they are just never asked for. A chapter that says "colour the cloud purple"
 * teaches a three-year-old that the colour words do not mean anything.
 *
 * THE FILL IS A REAL FLOOD FILL — see floodFill.ts. The regions are not layers, sprites or masks cut
 * by hand; they are whatever the drawing encloses, which is why one 32KB PNG yields 113 colourable
 * areas and why a tree's trunk and crown are separate without anyone deciding they should be.
 *
 * ⚠️ THIS IS THE ONE CHAPTER IN THE BAND THAT GENUINELY NEEDS A VOICE. Naming colours IS the skill,
 * so there is no silent fallback that does not hand over the answer — unlike the shapes chapter,
 * whose question is a picture. It needs six recorded clips: red, yellow, blue, green, orange, purple.
 *
 * Landscape-first, wrapped by the registry / `?ch=rainbow`.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { speak, speakSteps, stopSpeech, unlockSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat, useChapterShell } from './StoryWorld'
import { useViewport } from '@/shared/hooks/useViewport'
import { useNeedsRotate, RotateGate } from './RotateGate'
import { getActiveLearner } from '@/data/supabase/useLearnerSession'
import { lessonSeen, markLessonSeen } from '@/infra/storage/lessonSeen'
import { loadPage, floodRegion, floodNearest, inRegion, paintRegion, type PageBitmap, type Region } from './floodFill'
import { shuffle } from '@/core/rand'

/**
 * The only thing a tap waits for. Deliberately NOT `useIsSpeaking()` — a wrong tap speaks a line and
 * `speechSynthesis.speaking` stays true for over three seconds after one, which swallows the retry.
 */
const TAP_LOCK_MS = 220
const SHORT_H = 470


// ─── The paints ──────────────────────────────────────────────────────────────────────
type ColorName = 'red' | 'yellow' | 'blue' | 'green' | 'orange' | 'purple'
const COLORS: Record<ColorName, { label: string; hex: string; deep: string }> = {
  red:    { label: 'red',    hex: '#E64545', deep: '#B5302F' },
  yellow: { label: 'yellow', hex: '#FFC93C', deep: '#D69A12' },
  blue:   { label: 'blue',   hex: '#3FA3EE', deep: '#2575B8' },
  green:  { label: 'green',  hex: '#5DB94B', deep: '#3C8B2F' },
  orange: { label: 'orange', hex: '#F2872C', deep: '#C25E13' },
  purple: { label: 'purple', hex: '#9B5FD6', deep: '#6E3CA8' },
}
const COLOR_ORDER: ColorName[] = ['red', 'yellow', 'blue', 'green', 'orange', 'purple']
/**
 * The glow on the asked-for area. Deliberately a NEUTRAL GREY: it is the only mark on the page that
 * is not one of the six paints, so it can say "this part" without whispering which pot to pick.
 */
const HINT_HEX = '#8C8C8C'
/**
 * How far outside the asked-for area a tap still counts, in the drawing's own pixels. Small — about
 * half a tulip's width — so it forgives a wobbly finger without quietly eating the page around it,
 * which is still the child's to colour freely.
 */
const NEAR_MISS = 46
/** The genuinely confusable partner at this age — forced into the box at the hardest tier. */
const TWIN: Record<ColorName, ColorName> = {
  red: 'orange', orange: 'red', yellow: 'orange', green: 'blue', blue: 'green', purple: 'blue',
}

// ─── The page ────────────────────────────────────────────────────────────────────────
/**
 * `at` is a point in the drawing's own pixel coordinates that lies inside the area being named. It
 * is how the game knows which area was tapped: flood from the finger, then ask whether this point
 * fell inside the flood. Every one of these was picked by rendering the region map and checking the
 * area it belongs to — see the probe pass in the session scratchpad — so none of them sits on a line
 * or inside some neighbouring shape.
 *
 * The named areas are deliberately ones that are ONE region: the tree's crown, not "the tree", whose
 * trunk is a separate shape. Naming something the drawing does not enclose as a single area would
 * ask a child to fill it and then only half fill it. (The daisies fail exactly this test — every
 * petal floods on its own, at ~1,400px each — which is why the flower questions are the tulips,
 * whose heads are each a single closed cup.)
 *
 * AND EVERY COLOUR HERE IS ONE THE THING CAN REALLY BE. Sun yellow, sky blue, leaves green, grass
 * green, a ginger rabbit orange; the man-made surfaces — roof, wall, door — are painted, so they may
 * honestly be any of these; and a tulip is the one thing on the page that is genuinely every colour,
 * which is what makes it the honest home for the paints nothing else can wear. The clouds (white)
 * and the trunk (brown) have no true colour in a six-paint box, so they are not asked for at all.
 */
interface Target { noun: string; color: ColorName; at: [number, number] }
interface Page { id: string; label: string; src: string; w: number; h: number; targets: Target[] }

/**
 * TWO PAGES, AND THEY DO DIFFERENT JOBS: THE GARDEN TEACHES THE SIX WORDS, THE TOY ROOM TESTS THEM.
 *
 * The split is not decoration, it is the only way the test is honest. A garden is made of things
 * that have ONE colour in the world — the sun is yellow, the sky is blue, grass is green — so
 * "colour the sun yellow" can be answered by a child who knows suns and has never learned the word
 * *yellow*. That makes the garden an excellent place to TEACH: the object anchors the word, which is
 * exactly how a three-year-old learns one.
 *
 * It makes it a poor place to test. A toy has no default colour — a ball is whatever colour it was
 * made — so in the toy room nothing in the picture can tell the child the answer and the spoken word
 * is the only thing that can. A child who gets the toy room right knows the word.
 *
 * Generalised, and now in the craft doc: TEACH where the world backs the answer up, TEST where it
 * cannot help.
 */
const TEACH_PAGE: Page = {
  id: 'garden', label: 'Garden', src: '/assets/backgrounds/colour_garden.png', w: 1376, h: 768,
  // ONE canonical home per colour, and only six, because the teaching pass is one beat per word.
  // Ordered by COLOR_ORDER so the lesson runs red · yellow · blue · green · orange · purple. The
  // rest of the garden is unnamed and therefore free to colour, all the way through the lesson.
  targets: [
    { noun: 'roof',   color: 'red',    at: [170, 300] },
    { noun: 'sun',    color: 'yellow', at: [870, 140] },
    { noun: 'sky',    color: 'blue',   at: [640, 60] },
    { noun: 'tree',   color: 'green',  at: [1150, 200] },
    { noun: 'rabbit', color: 'orange', at: [933, 654] },
    { noun: 'tulip',  color: 'purple', at: [1140, 645] },
  ],
}

const TEST_PAGE: Page = {
  // The parts are named as parts on purpose. This drawing encloses a teddy as a head AND a tummy AND
  // four limbs, and a cat as a head AND a body; asking for "the teddy" would fill a quarter of one
  // and look broken. A colouring book really does have you do a head and a tummy separately, and the
  // body-part words are worth having at this age anyway.
  id: 'toys', label: 'Toy room', src: '/assets/backgrounds/colour_toys.png', w: 1376, h: 768,
  // THE ORDER IS LOAD-BEARING: ALL SIX COLOURS MUST BE ASKED IN THE FIRST SIX ROUNDS. Mastery
  // early-exit ends the chapter after six right in a row at the top tier, so anything later is asked
  // only of a child who is struggling — and a child who does well would otherwise finish never
  // having been tested on the colour they were shakiest on, skipped as a reward for doing well. The
  // big shapes lead as well, so the opening rounds are the easiest to hit.
  targets: [
    { noun: 'balloon',       color: 'red',    at: [1000, 150] },
    { noun: 'car',           color: 'blue',   at: [300, 570] },
    { noun: 'star',          color: 'yellow', at: [735, 180] },
    { noun: 'wall',          color: 'green',  at: [640, 300] },
    { noun: "teddy's head",  color: 'purple', at: [770, 400] },
    { noun: 'rug',           color: 'orange', at: [600, 700] },
    { noun: 'ball',          color: 'red',    at: [935, 545] },
    { noun: 'car window',    color: 'blue',   at: [330, 495] },
    { noun: "cat's face",    color: 'orange', at: [1135, 480] },
    { noun: "teddy's tummy", color: 'yellow', at: [775, 545] },
  ],
}
const TEACH_STEPS = TEACH_PAGE.targets.length          // six, one per colour
const SCORED_ROUNDS = TEST_PAGE.targets.length

// ─── Round shape ─────────────────────────────────────────────────────────────────────
interface ColorRound { seq: number; pots: ColorName[] }

function makeColorRound(page: Page, d: 1 | 2 | 3, round: number): ColorRound {
  const seq = Math.min(round, page.targets.length - 1)
  const target = page.targets[seq].color
  const n = d === 1 ? 3 : d === 2 ? 4 : 6
  let pool = COLOR_ORDER.filter(c => c !== target)
  if (d === 1) pool = pool.filter(c => c !== TWIN[target])       // no twin against a beginner
  const twin = TWIN[target]
  const others = (d >= 3 && pool.includes(twin))
    ? [twin, ...shuffle(pool.filter(c => c !== twin)).slice(0, n - 2)]
    : shuffle(pool).slice(0, n - 1)
  return { seq, pots: shuffle([target, ...others]) }
}

// ─── Layout ──────────────────────────────────────────────────────────────────────────
/** The paint box and the frame around it — nothing here depends on which page is open. */
function useLayout() {
  const { w: vw, h: vh } = useViewport()
  const short = vh < SHORT_H
  const pot = Math.round(Math.max(40, Math.min(vw * 0.09, vh * 0.16, 78)))
  const boxH = pot * 1.2 + (short ? 14 : 22)
  const boxTop = vh - (short ? 6 : 12) - boxH
  return { vw, vh, short, pot, boxTop }
}

/**
 * Where the open page sits. CONTAIN, not cover, and computed here rather than left to `object-fit` —
 * the fill canvas and the line art have to land on exactly the same pixels, and a tap is mapped back
 * through this same arithmetic so a finger lands where the child thinks it did. Contain because a
 * colouring page is a PAGE: cover cropped 5% off the top and bottom on a landscape phone, which took
 * the top off the sun. The cream around it reads as the margin of the paper.
 */
function usePageRect(page: Page) {
  const { w: vw, h: vh } = useViewport()
  const s = Math.min(vw / page.w, vh / page.h)
  const pw = page.w * s, ph = page.h * s
  return { width: pw, height: ph, left: (vw - pw) / 2, top: (vh - ph) / 2 }
}

// ─── The paint box ───────────────────────────────────────────────────────────────────
// Always the same place and size — a child learns to point to red by pointing at it. The pots
// SHUFFLE every round, so what gets learned is the colour and not the position. A loaded pot STAYS
// loaded across taps: dipping once and colouring several things is the rhythm of the real activity.
// `hint` points at the right pot and is ONLY ever passed during the lesson — the whole job of the
// teaching page is to hand the answer over, and the whole job of the test page is not to. If it ever
// appears in the test the chapter stops measuring anything.
function PaintBox({ pots, loaded, onPick, hint }: {
  pots: ColorName[]; loaded: ColorName | null; onPick?: (c: ColorName) => void; hint?: ColorName | null
}) {
  const { pot, boxTop, short } = useLayout()
  return (
    <div style={{ position: 'fixed', top: boxTop, left: 0, right: 0, zIndex: 42, display: 'flex', justifyContent: 'center', padding: '0 10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: Math.round(pot * 0.2),
        background: 'rgba(255,255,255,.82)', borderRadius: 24, padding: `${short ? 7 : 11}px ${short ? 12 : 18}px`,
        border: '3px solid rgba(140,110,70,.5)', boxShadow: '0 5px 0 rgba(61,37,22,.12)' }}>
        {pots.map(c => {
          const on = loaded === c
          const show = hint === c && !on
          return (
            <button key={c} onClick={onPick ? () => onPick(c) : undefined} disabled={!onPick}
              aria-label={`${COLORS[c].label} paint${show ? ' (this one)' : ''}`}
              className={show ? 'rt-potcue' : undefined}
              style={{ width: pot, height: pot, padding: 0, borderRadius: '50%', cursor: onPick ? 'pointer' : 'default',
                background: `radial-gradient(circle at 34% 28%, rgba(255,255,255,.55), ${COLORS[c].hex} 52%, ${COLORS[c].deep} 100%)`,
                // The ring says only "this paint is on the brush". It appears AFTER a choice, never
                // before, so outside the lesson it can never tell the child which pot to choose.
                border: `${on ? 5 : 3}px solid ${on ? 'var(--paper)' : COLORS[c].deep}`,
                boxShadow: on ? '0 0 0 4px var(--milo-orange), 0 4px 8px rgba(0,0,0,.3)' : '0 3px 5px rgba(0,0,0,.25)',
                transform: on ? 'translateY(-9px)' : 'translateY(0)', transition: 'transform .18s, box-shadow .18s' }} />
          )
        })}
      </div>
    </div>
  )
}

// ─── Milo ────────────────────────────────────────────────────────────────────────────
function MiloPainter() {
  const [step, setStep] = useState(0)
  const { short } = useLayout()
  const srcs = ['/assets/characters/milo_painter.png', '/assets/characters/milo_idle.png']
  const dim = short ? 'min(19vh, 90px)' : 'min(22vh, 160px)'
  return (
    <div aria-hidden style={{ position: 'fixed', left: '6%', bottom: 0, transform: 'translateX(-50%)', zIndex: 26,
      width: dim, height: dim, pointerEvents: 'none' }}>
      <div style={{ width: '100%', height: '100%', animation: 'rt_float 3.4s ease-in-out infinite' }}>
        {step >= srcs.length
          ? <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <span style={{ fontSize: 70, filter: 'drop-shadow(0 5px 8px rgba(0,0,0,.35))' }}>🐴</span>
            </div>
          : <img src={srcs[step]} alt="" draggable={false} decoding="async" loading="lazy" onError={() => setStep(s => s + 1)}
              style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom', filter: 'drop-shadow(0 5px 8px rgba(0,0,0,.35))' }} />}
      </div>
    </div>
  )
}

// ─── Round copy ──────────────────────────────────────────────────────────────────────
const promptFor = (page: Page, d: ColorRound) => {
  const t = page.targets[d.seq]
  return `Colour the ${t.noun} ${COLORS[t.color].label}!`
}
const sayFor = (page: Page, d: ColorRound) => {
  const t = page.targets[d.seq]
  const c = COLORS[t.color].label
  // Names the colour twice and the glow once. The glow settles WHERE, so all the words can spend
  // themselves on the one thing being learned.
  return `Colour the ${t.noun} ${c}. See it glowing? Find the ${c} paint, then tap it!`
}

/**
 * The scored round's play surface renders NOTHING — the page, the canvas and the paint box are all
 * the orchestrator's, because a coloured picture has to survive a round ending and `SkillBeat`
 * rebuilds its contents every round. All this does is hand back the round's submit, which also keeps
 * the beat free of any dependency on the loaded paint: a beat that changed when the child picked up
 * a pot would regenerate the question under them and reshuffle the box mid-answer.
 */
const Register: React.FC<{ onSubmit: (c: boolean) => void; register: (f: (c: boolean) => void) => void }> = ({ onSubmit, register }) => {
  useEffect(() => { register(onSubmit) }, [onSubmit, register])
  return null
}

/**
 * THE RE-TEACH, and now the only thing this component does — the chapter's opening demonstration is
 * the whole garden lesson. It fires after three wrong in the toy room, so its job is to put the word
 * back together with the swatch the way the garden did, not to re-explain the mechanic.
 *
 * It DOES colour, and has to — after a re-teach `SkillBeat` moves on instead of re-asking, so a
 * demonstration that coloured nothing would leave a permanent hole in the picture exactly where the
 * child struggled. Renders nothing.
 */
const Explain: React.FC<{ page: Page; seq: number; onLoad: (c: ColorName) => void; onPaint: () => void; onDone: () => void }> = ({ page, seq, onLoad, onPaint, onDone }) => {
  const ran = useRef(false)
  useEffect(() => {
    if (ran.current) return; ran.current = true
    const t = page.targets[seq]
    const c = COLORS[t.color].label
    const cancel = speakSteps([
      `Let's do this one together. The ${t.noun} is glowing — that is the bit we colour.`,
      `We want ${c}. Remember the ${c} in the garden? This is the ${c} paint.`,
      `Watch the ${t.noun} turn ${c}!`,
    ], {
      onStep: i => { if (i === 1) onLoad(t.color); if (i === 2) onPaint() },
      onDone: () => window.setTimeout(onDone, 1500),
    })
    return cancel
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

// ─── Orchestrator ────────────────────────────────────────────────────────────────────
const RT_CSS = `
@keyframes rt_float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
/* Strong on purpose. At .10–.44 a big shape like the sky read fine and a tulip did not — 76px of
   pale grey on a white page, next to an identical tulip that is not the answer, is not a signpost.
   The floor matters as much as the peak: at the bottom of the pulse the mark has to still be there. */
@keyframes rt_hint { 0%,100%{opacity:.42} 50%{opacity:.86} }
/* The lesson's "this pot" cue. Bounces rather than glows, because a glow on a coloured disc reads as
   part of the paint and this has to read as a finger pointing at it. */
@keyframes rt_potcue { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-11px)} }
.rt-potcue{ animation: rt_potcue .9s ease-in-out infinite; box-shadow:0 0 0 5px var(--milo-orange),0 5px 10px rgba(0,0,0,.3)!important }
@media (prefers-reduced-motion: reduce){ .rt-potcue{animation:none!important} }
.rt-passthru{pointer-events:none}
.rt-passthru button{pointer-events:auto}
@media (prefers-reduced-motion: reduce){ .rt-hint{animation:none!important;opacity:.7} }

`

/**
 * start → teach (six words on the garden, nothing scored) → bridge → test (the toy room, scored).
 * There is no separate demo or guided round any more: the lesson IS the scaffold, and six taught
 * beats followed by a demo and a guided round would be three kinds of hand-holding in a row.
 *
 * ⚠️ `start` IS ONE TAP AND CANNOT BE REMOVED, however much it looks like a screen worth deleting.
 * `unlockSpeech()` has to run inside a real user gesture or mobile autoplay policy silences Milo for
 * the whole chapter, and nothing upstream unlocks it — every chapter in the app does its own. This
 * is the ONE chapter that is unanswerable without voice, because naming the colour IS the question.
 * So it is stripped to a single button over the picture, with no explaining card and no page picker:
 * one tap and the child is in the lesson.
 */
type Phase = 'start' | 'teach' | 'bridge' | 'test'
export default function RainbowTown({ onFinish, onExit }: {
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
  const needsRotate = useNeedsRotate()
  const [phase, setPhase] = useState<Phase>('start')
  // The skip is offered only to a child who has already sat through the lesson once. Read at mount,
  // so finishing the lesson now does not make the button appear behind the child mid-run.
  const learnerId = useMemo(() => getActiveLearner()?.id, [])
  const [canSkip] = useState(() => lessonSeen(getActiveLearner()?.id, 'colors'))
  // Which page is open follows the phase — the garden while teaching, the toy room while testing.
  const page = phase === 'test' ? TEST_PAGE : TEACH_PAGE
  const pageStyle = usePageRect(page)
  const { short } = useLayout()
  const [stepIdx, setStepIdx] = useState(0)
  // During the lesson every paint is on the tray in a FIXED order, so a child can build a stable
  // "the red one lives here" map while they are learning the words. The test shuffles them, so what
  // gets carried forward is the colour and not the position.
  const [pots, setPots] = useState<ColorName[]>(COLOR_ORDER)
  const [loaded, setLoaded] = useState<ColorName | null>(null)
  const pageEl = useRef<HTMLDivElement | null>(null)
  const nudge = useCallback(() => {
    pageEl.current?.animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }],
      { duration: 380, easing: 'ease' })
  }, [])

  // The bitmap and the fill canvas: the picture's whole state. Both live HERE, outside SkillBeat,
  // which rebuilds its contents every round — a picture coloured inside a round could never stay.
  const bmp = useRef<PageBitmap | null>(null)
  const canvas = useRef<HTMLCanvasElement | null>(null)
  const hint = useRef<HTMLCanvasElement | null>(null)
  const [ready, setReady] = useState(false)

  const phaseRef = useRef(phase); phaseRef.current = phase
  const loadedRef = useRef(loaded); loadedRef.current = loaded
  const stepRef = useRef(stepIdx); stepRef.current = stepIdx
  const submit = useRef<((correct: boolean) => void) | null>(null)
  const erred = useRef(false)
  const strayFills = useRef(0)
  const tapLock = useRef(false)
  const timers = useRef<number[]>([])
  useEffect(() => () => { timers.current.forEach(clearTimeout) }, [])

  const { exit, tally } = useChapterShell(onFinish, onExit)

  // Decode the open drawing and work out where its lines are. Re-runs if the page changes, which it
  // only does on the intro — `ready` gates the start button so nobody enters a half-decoded page.
  useEffect(() => {
    let live = true
    setReady(false)
    loadPage(page.src).then(p => { if (live) { bmp.current = p; setReady(true) } }).catch(() => setReady(true))
    return () => { live = false }
  }, [page])

  const fill = useCallback((r: Region, hex: string) => {
    const ctx = canvas.current?.getContext('2d')
    if (ctx && bmp.current) paintRegion(ctx, bmp.current, r, hex)
  }, [])

  const clearHint = useCallback(() => {
    hint.current?.getContext('2d')?.clearRect(0, 0, page.w, page.h)
  }, [page])
  // Read inside the tap handler, which must not be rebuilt per round — see `tapPage`.
  const pageRef = useRef(page); pageRef.current = page

  /**
   * Light up the area Milo is asking for. The child should never have to work out WHICH shape is the
   * roof — that is object vocabulary, not colour recognition, and failing it would be scored as
   * though they did not know red. Milo says the word and the shape glows; the only open question is
   * the paint. Repainted whenever the round moves on, and wiped the moment the area is filled.
   */
  useEffect(() => {
    const ctx = hint.current?.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, page.w, page.h)
    const p = bmp.current
    if (!p || phase === 'start' || phase === 'bridge') return
    const t = page.targets[stepIdx]
    if (!t) return
    const r = floodRegion(p, t.at[0], t.at[1])
    if (r) paintRegion(ctx, p, r, HINT_HEX)
  }, [stepIdx, phase, ready, page])

  /** Colour a NAMED area outright — Milo's demo and the re-teach both use this. */
  const fillTarget = useCallback((seq: number) => {
    const p = bmp.current
    if (!p) return
    const t = pageRef.current.targets[seq]
    const r = floodRegion(p, t.at[0], t.at[1])
    if (r) fill(r, COLORS[t.color].hex)
    clearHint()
    setLoaded(null)
  }, [fill, clearHint])

  /**
   * A tap on the picture. The flood answers both questions at once: which pixels to colour, and what
   * the child actually touched — by testing each named point against the flooded area.
   *
   * Anything Milo has NOT asked for simply fills, in whatever colour is on the brush, ungraded. That
   * is the difference between a colouring game and a quiz with a paint bucket, and it costs nothing:
   * the named areas are still graded, so the lesson is intact.
   */
  const tapPage = useCallback((e: React.MouseEvent) => {
    const p = bmp.current, cv = canvas.current
    if (!p || !cv || tapLock.current) return
    if (phaseRef.current !== 'teach' && phaseRef.current !== 'test') return
    tapLock.current = true
    window.setTimeout(() => { tapLock.current = false }, TAP_LOCK_MS)

    const box = cv.getBoundingClientRect()
    const ix = (e.clientX - box.left) / box.width * p.w
    const iy = (e.clientY - box.top) / box.height * p.h
    const targets = pageRef.current.targets
    const step = targets[stepRef.current]
    const brush = loadedRef.current
    if (!brush) { speak(`Pick up a paint first! We need ${COLORS[step.color].label}.`); return }

    const region = floodRegion(p, ix, iy)
    let area = region                                     // what actually gets painted
    let hit = region ? targets.find(t => inRegion(region, p.w, t.at[0], t.at[1])) : undefined

    /**
     * A NEAR MISS ON THE GLOW COUNTS — INCLUDING A TAP THAT LANDS ON THE OUTLINE.
     *
     * A tulip head is the smallest area on the page: 32×28 CSS px on a 640×320 phone, under the 44px
     * tap floor, ringed by a thick ink outline that the flood treats as a wall and thickened by
     * another 2px to close the artwork's gaps. So a three-year-old aiming squarely at it very often
     * lands on the line, `floodRegion` returns null, and the game does NOTHING — no fill, no word,
     * no sign it saw the tap. That is the single worst thing this chapter can do, and it is exactly
     * what "I'm clicking the tulip and it isn't colouring" looks like from the other side.
     *
     * So the rescue has to run BEFORE any bail-out on a failed flood, not after it: near the thing
     * that is glowing, ON the line still means the child pointed at it. Only ever rescues a wrong
     * FINGER — the paint is still checked below, so it can never turn a wrong colour into a right
     * answer.
     */
    if (!hit && Math.hypot(ix - step.at[0], iy - step.at[1]) <= NEAR_MISS) {
      const snapped = floodRegion(p, step.at[0], step.at[1])
      if (snapped) { area = snapped; hit = step }
    }
    // Still nothing under the finger: they tapped a line somewhere out in the picture — an internal
    // one on a big shape, the ridge of the roof, a ray of the sun. Take the nearest area instead, so
    // a tap is ALWAYS answered by something. Deliberately after the rescue above, so a line beside
    // the glowing target resolves to the target rather than to whichever neighbour happens to be a
    // pixel closer.
    if (!area) {
      area = floodNearest(p, ix, iy)
      hit = area ? targets.find(t => inRegion(area!, p.w, t.at[0], t.at[1])) : undefined
    }
    if (!area) return                                     // nothing paintable anywhere near — give up
    // Aiming at the wrong shape is NOT a wrong answer — the glow already says where, so a mis-tap is
    // a slipped finger or a wandering eye, and this chapter measures whether they know red. Point
    // back at the glow and leave the score alone.
    if (hit && hit !== step) {
      // "That's the tulip!" when they just tapped a tulip and were asked for the tulip is maddening.
      // The page has two of them and only the glow tells them apart, so the words have to admit it.
      speak(hit.noun === step.noun
        ? `That's the other ${hit.noun}! Tap the one that is glowing.`
        : `That's the ${hit.noun}! Tap the part that is glowing.`)
      nudge()
      return
    }
    if (!hit) {
      // Free colouring, and it stays free — but a child can otherwise paint the whole page without
      // ever meeting the question, with nothing telling them they have wandered off it. After a few
      // strokes Milo asks again and the glow gets a nudge. It never says which paint; it repeats the
      // question they already have.
      fill(area, COLORS[brush].hex)
      strayFills.current += 1
      if (strayFills.current % 3 === 0) { speak(`Now, where is the ${step.noun}? Look for the glowing part!`); nudge() }
      return
    }
    // The wrong paint, though, IS the skill, and it is the only thing here that counts as wrong.
    // In the LESSON it is not wrong either — the right pot is bouncing, so a wrong one is a child
    // who has not yet joined the word to the swatch, which is the entire thing being taught. Say the
    // name of what they picked, say the name we want, and point again. Nothing is recorded.
    if (brush !== step.color) {
      if (phaseRef.current === 'teach') {
        speak(`That one is ${COLORS[brush].label}. We want ${COLORS[step.color].label} — the paint that is jumping!`)
      } else {
        erred.current = true
        speak(`That's ${COLORS[brush].label} paint. We need ${COLORS[step.color].label}!`)
      }
      nudge()
      return
    }

    fill(area, COLORS[step.color].hex)
    clearHint()
    if (phaseRef.current === 'teach') {
      // Name it once more ON the finished colour, which is the moment the word and the thing are
      // both in front of the child at the same time.
      const c = COLORS[step.color].label
      speak(`${c}! The ${step.noun} is ${c}.`)
      const next = stepRef.current + 1
      timers.current.push(window.setTimeout(() => {
        setLoaded(null)
        if (next < TEACH_STEPS) setStepIdx(next)
        else { markLessonSeen(learnerId, 'colors'); setPhase('bridge') }
      }, 1900))
      return
    }
    const done = submit.current
    if (done) { submit.current = null; timers.current.push(window.setTimeout(() => done(!erred.current), 700)) }
  }, [fill, clearHint, nudge, learnerId])

  const register = useCallback((f: (c: boolean) => void) => { submit.current = f; erred.current = false; strayFills.current = 0 }, [])
  const interlude = useCallback(() => new Promise<void>(res => window.setTimeout(res, 700)), [])

  /**
   * THE LESSON. One beat per colour word, and every beat says the word THREE times: naming the
   * paint, naming it again on the tray, and naming it once more on the finished colour (in the tap
   * handler). A three-year-old learns a colour word by hearing it attached to a thing they are
   * looking at, so the sentence always carries both.
   *
   * There is no SkillBeat here and nothing is recorded — this is the half of the chapter that GIVES
   * the answer away, on purpose, and the toy room is where we find out whether it stuck.
   */
  useEffect(() => {
    if (phase !== 'teach') return
    const t = TEACH_PAGE.targets[stepIdx]
    if (!t) return
    const c = COLORS[t.color].label
    speak(`This colour is ${c}. The ${t.noun} is ${c}! Pick up the ${c} paint — it is jumping up and down — then tap the ${t.noun}.`)
  }, [phase, stepIdx])

  // Depends on the open page and nothing that changes DURING a round, so picking up a pot can never
  // regenerate the question or reshuffle the box under the child. The page is fixed before the test
  // starts, so listing it here costs nothing.
  const beat = useMemo<Beat<ColorRound>>(() => ({
    skillId: 'colors', rounds: SCORED_ROUNDS,
    make: (d, round = 0) => makeColorRound(page, (d || 1) as 1 | 2 | 3, round),
    sig: d => `${d.seq}`,   // one question per named area; the shuffled pot order is not variety
    prompt: d => promptFor(page, d),
    say: d => sayFor(page, d),
    Play: ({ onSubmit }) => <Register onSubmit={onSubmit} register={register} />,
    Reteach: ({ data, onDone }) => (
      <Explain page={page} seq={data.seq} onLoad={setLoaded} onPaint={() => fillTarget(data.seq)} onDone={onDone} />
    ),
  }), [register, fillTarget, page])

  // Landscape-first, like the rest of the 3–5 set: the picture is wide and the paint box needs the
  // width. Sits BELOW every hook — an early return above one makes turning the phone change the hook
  // count, which tore chapter 2 into the error boundary.
  if (needsRotate) return <RotateGate line="The colouring book plays in landscape! 🎨" />

  const target = page.targets[stepIdx]

  // pointerEvents:none, and it matters: the banner lies ACROSS the picture, and with it swallowing
  // taps a child aiming at the sky behind it got nothing at all. Caught in a fresh tab at 1280×720,
  // where the sky's probe point happens to land right under it — at other sizes it looked fine,
  // which is exactly how a dead zone survives testing.
  const Banner = (text: string) => (
    <div style={{ position: 'absolute', top: 50, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px', pointerEvents: 'none' }}>
      <div style={{ background: 'var(--paper)', border: '3px solid var(--milo-orange)', borderRadius: 999, padding: '10px 24px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19, color: 'var(--milo-orange)', boxShadow: '0 4px 0 rgba(242,107,44,.25)', textAlign: 'center' }}>{text}</div>
    </div>
  )

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden', background: '#fbf7ee' }}>
      <style>{RT_CSS}</style>

      {/* The picture. The fill canvas underneath holds nothing but flat colour; the drawing sits over
          it with `multiply`, so its white lets the colour through and its ink stays black. That is
          the composite a colouring book has always been, and it is why the lines never muddy. */}
      {/* NOT keyed, and never re-keyed. The nudge on a wrong tap was first done by bumping a `key`
          to restart the animation — which remounts the subtree, and the canvas is IN the subtree, so
          every colour the child had put down was wiped by getting one answer wrong. The Web
          Animations API retriggers without touching the DOM. */}
      {/* KEYED ON THE PAGE, and only on the page. Turning to a new page really does want a fresh
          sheet, so remounting the canvases is the correct thing here — the opposite of the wrong-tap
          nudge, which must never remount because it would wipe a picture mid-run. */}
      <div key={page.id} ref={pageEl} onClick={tapPage} style={{ position: 'absolute', ...pageStyle, zIndex: 20 }}>
        <canvas ref={canvas} width={page.w} height={page.h}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
        {/* The glow. Its own canvas, ABOVE the fills and BELOW the ink, so it pulses on and off with
            one CSS animation and never has to be un-painted out of the picture the child is making. */}
        <canvas ref={hint} className="rt-hint" width={page.w} height={page.h} aria-hidden
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none',
            animation: 'rt_hint 1.25s ease-in-out infinite' }} />
        <img src={page.src} alt="" draggable={false} decoding="async"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', mixBlendMode: 'multiply', pointerEvents: 'none' }} />
      </div>

      <div style={{ position: 'absolute', top: 12, left: 14, zIndex: 50 }}>
        <button onClick={exit} style={{ padding: '7px 14px', borderRadius: 50, background: 'var(--paper)', border: '3px solid var(--milo-orange)', color: 'var(--milo-orange)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>← Menu</button>
      </div>

      {/* One button on the open page — no explaining card, no picker. It exists only to carry the
          speech unlock (see the Phase comment); everything it used to say, Milo now says out loud in
          the first beat of the lesson, which is where a three-year-old was going to get it anyway. */}
      {phase === 'start' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 45, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(251,247,238,.55)' }}>
          <button onClick={() => { unlockSpeech(); setPhase('teach') }} disabled={!ready}
            style={{ padding: short ? '14px 38px' : '18px 50px', borderRadius: 50, border: 'none', cursor: ready ? 'pointer' : 'wait', opacity: ready ? 1 : 0.6, background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: short ? 22 : 28, boxShadow: '0 6px 16px rgba(242,107,44,.4)' }}>Let&apos;s colour! ▶</button>
        </div>
      )}

      {(phase === 'teach' || phase === 'test') && <PaintBox pots={pots} loaded={loaded} onPick={setLoaded}
        hint={phase === 'teach' ? target?.color : null} />}

      {phase === 'teach' && target && Banner(`${stepIdx + 1} of ${TEACH_STEPS} · This is ${COLORS[target.color].label.toUpperCase()}`)}

      {/* SKIP THE LESSON — and only ever for a child who has already been through it. Offered on the
          first run it is just a big button a three-year-old presses to leave the teaching, and then
          they meet a test nothing has prepared them for. Deliberately small, off in the corner and
          worded for the grown-up rather than shouted at the child. */}
      {phase === 'teach' && canSkip && (
        <div style={{ position: 'absolute', top: 12, right: 14, zIndex: 50 }}>
          <button onClick={() => {
            stopSpeech()
            setStepIdx(0)
            setPots(makeColorRound(TEST_PAGE, 1, 0).pots)
            setLoaded(null)
            setPhase('test')
          }} style={{ padding: '7px 14px', borderRadius: 50, background: 'rgba(255,255,255,.9)', border: '2px solid rgba(140,110,70,.5)', color: 'var(--ink)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Skip to the game →</button>
        </div>
      )}

      {/* The handover. Worth a screen of its own: the picture changes, the paints start shuffling and
          the pot stops being pointed at all at once, and a child who is not told that has simply had
          the game taken away from them. */}
      {phase === 'bridge' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 45, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: short ? 12 : 20, background: 'rgba(251,247,238,.94)', padding: '0 12px' }}>
          <div style={{ maxWidth: '78%', background: '#fff', border: '3px solid var(--outline)', borderRadius: 18, padding: short ? '10px 18px' : '14px 22px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: short ? 15 : 18, color: 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(61,37,22,.1)' }}>
            You know all six colours now! 🎨 Milo has a new picture — the toy room. This time nobody shows you which paint. Listen carefully!
          </div>
          <button onClick={() => {
            stopSpeech()
            setStepIdx(0)
            setPots(makeColorRound(TEST_PAGE, 1, 0).pots)
            setLoaded(null)
            setPhase('test')
          }} style={{ padding: short ? '10px 30px' : '14px 38px', borderRadius: 50, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: short ? 18 : 22, boxShadow: '0 6px 16px rgba(242,107,44,.4)' }}>I&apos;m ready! ▶</button>
        </div>
      )}

      {phase === 'test' && (
        // Same reason as the banner: SkillBeat's prompt row spans the width, so left tappable it
        // would carve a dead stripe across the picture. `rt-passthru` lets taps fall through to the
        // page while its BUTTONS keep theirs — the pill is a real control, it replays the question.
        <div className="rt-passthru" style={{ position: 'absolute', top: 48, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
          <SkillBeat beat={beat} onInterlude={interlude}
            onRound={(data: ColorRound) => { setStepIdx(data.seq); setPots(data.pots); setLoaded(null) }}
            onComplete={tally} />
        </div>
      )}

      {phase !== 'start' && <MiloPainter />}
    </div>
  )
}
