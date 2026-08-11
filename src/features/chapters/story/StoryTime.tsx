'use client'
/**
 * Chapter (6–8) — STORY PROBLEMS (skill `storyProblems`) as STORY MODE.
 *
 * The child HEARS a little story and watches the world's OWN creatures act it out, then taps the
 * answer. Three problem types, all carried by the same shuffling world creatures:
 *   ADD      — Milo has `a`, then `b` MORE join   → count them all      (answer a+b)
 *   TAKE-AWAY— Milo has `a`, then `b` LEAVE       → count what's left    (answer a-b)
 *   COMPARE  — Milo has `a`, a friend has `b`      → how many MORE?       (answer a-b, a>b)
 * ONE chapter, not three behind a picker. All three settings are in the same run and the SETTING
 * CHANGES EVERY ROUND, so consecutive questions differ in place as well as in number — a picker
 * makes a child choose before they know what they are choosing, and then gives them ten rounds of
 * one backdrop. Same call chapter 2 took when its three biomes were merged.
 *   🐠 Coral Reef  — fish · crab · shark · turtle                  (swim over/away · who has more)
 *   🌳 Green Park  — duck · rabbit · squirrel · lamb · chick · duckling  (wander · who has more)
 *   🌼 Flower Beds — dragonfly · butterfly · bee · ladybug          (flutter · who has more)
 * EVERY item is a drawn walk cycle, so the things that join and leave do it on their own legs — and
 * the cast is 14 deep against 14 questions (3 demo + guided + 10 scored), so NO CREATURE IS EVER
 * SHOWN TWICE in a run. See ROUND_PLAN / RUN below and chapterCastDistinct.test.ts.
 *
 * Numbers stay small enough to SHOW the objects (object-driven, per the locked 6–8 rules) — the
 * difficulty grows by mixing in take-away then compare and nudging the totals up, not by going
 * two-digit. The demo + 3-wrong re-teach narrate the story via ONE speakSteps (voice + visual
 * synced when audio plays, timer-paced when blocked). Reuses committed sprites only.
 * Wrapped by game/StoryProblemsChapter.tsx.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { speak, stopSpeech, speakSteps, unlockSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat, useChapterShell } from './StoryWorld'
import { numberToWords } from '../lessons/_kit'
import { useViewport } from '@/shared/hooks/useViewport'
import { useNeedsRotate, RotateGate } from './RotateGate'
import { Arrive, SheetCell, CRITTER_CSS, inFlowJourney, aspectOf } from './critters'
import { rint, pick } from '@/core/rand'

// Live viewport size — for layouts that must RESERVE room (objects vs. the answer buttons)
// so they never overlap on a short/landscape screen.

// ─── Items & Worlds ──────────────────────────────────────────────────────────────────
interface Item { img: string; one: string; many: string; facesLeft?: boolean; flies?: boolean }
/**
 * EVERY item is a creature with a drawn walk cycle in sheets.ts. That is not decoration: a story
 * problem is about things ARRIVING and LEAVING, and a fruit cannot arrive — it can only be slid
 * across the picture like a cut-out being dragged, which is what this chapter used to do. A creature
 * walks in on its own legs, and the sum is the journey. It also settles the art: a pan of stills
 * beside a pan of living creatures reads as broken, so the cast is all-or-nothing.
 *
 * `facesLeft` mirrors the ART's own facing (only the shark and rabbit were drawn looking left), so
 * the sprite can be flipped to whichever way it is currently travelling.
 */
const IT = (n: string, one: string, many: string, facesLeft?: boolean, flies?: boolean): Item =>
  ({ img: `/assets/objects/${n}_side.png`, one, many, facesLeft, flies })

interface Bg { grad: string; img: string }
interface SpWorld {
  id: string
  bgs: Bg[]
  /**
   * Where the creatures' FEET land, as a screen-%. Measured off the backdrops, never guessed: the
   * group used to be centred at 40% of the height, which on every one of these scenes is above the
   * painted ground — chicks in the sky, ducks over open sea on a wooden plank that was drawn purely
   * to give them something to stand on. Measured horizons: reef 36–62% · beach 44–76% · space
   * 54–84%. A setting's three scenes are close enough to share one line; a set that ever needs
   * three different ones should carry the number on the Bg instead.
   */
  ground: number
  items: Item[]
  friend: string           // the compare-friend's name
  join: string             // add verb: "picks", "meets", "spots"
  leave: string            // take-away phrase: "{b} get eaten", "{b} swim away", "{b} zoom away"
  dark?: boolean
  milo: { src: string; emoji: string; accessory: string }
}
const SETTINGS: SpWorld[] = [
  { id: 'reef',
    bgs: [
      { grad: 'linear-gradient(#aee3f2 0%, #7fcbe8 55%, #4ea7cf 100%)', img: '/assets/backgrounds/reef_open.png' },
      { grad: 'linear-gradient(#bfe9f4 0%, #8fd2ea 55%, #5bb0d4 100%)', img: '/assets/backgrounds/reef_sand.png' },
      { grad: 'linear-gradient(#a9dff0 0%, #79c6e4 55%, #469fc8 100%)', img: '/assets/backgrounds/reef_deep.png' },
    ],
    ground: 57,
    items: [IT('fish', 'fish', 'fish'), IT('crab', 'crab', 'crabs'), IT('shark', 'shark', 'sharks', true),
      IT('turtle', 'turtle', 'turtles')],
    friend: 'Finn', join: 'meets', leave: 'swim away',
    milo: { src: '/assets/characters/milo_underwater.png', emoji: '🐢', accessory: '🫧' } },
  /**
   * A WALKING cast needs a scene with real painted GROUND under it. The beach scenes this replaces
   * are a flat plane of water below the horizon, so ducks standing on them read as hovering however
   * carefully the ground line is placed — there is nothing there to stand on. These three are open
   * grass from ABOVE the ground line, so the feet land on painted grass rather than on the pale
   * band just under the horizon: garden_park 48% · town_garden 48% · farm_barnyard 52%, all clear
   * of the 62% the group stands at.
   *
   * ⚠️ `town_park` was tried here and pulled: its grass does not start until ~65%, BELOW the ground
   * line, so the ducks stood on the sky gradient just above it and still read as hovering. A scene
   * only counts as ground if its horizon is ABOVE where the feet will be — the number to check is
   * the horizon against the ground line, not whether the picture "has grass in it".
   *
   * `farm_barnyard` is also MarketDay's, deliberately: pens of chicks in a fenced yard and a row of
   * ducks walking across it cannot be mistaken for one another, and it is the same call already
   * made for the forest scenes SeesawPark and MarketDay share. Only two other scenes in the library
   * have grass this high.
   */
  { id: 'park',
    bgs: [
      { grad: 'linear-gradient(#cfe9f7 0%, #dcecc8 52%, #b9d894 100%)', img: '/assets/backgrounds/garden_park.png' },
      { grad: 'linear-gradient(#d6edf7 0%, #dfeeca 52%, #bcda98 100%)', img: '/assets/backgrounds/town_garden.jpeg' },
      { grad: 'linear-gradient(#cfe6f7 0%, #dcecc8 55%, #bcd894 100%)', img: '/assets/backgrounds/farm_barnyard.png' },
    ],
    ground: 62,
    items: [IT('duck', 'duck', 'ducks'), IT('rabbit', 'rabbit', 'rabbits', true), IT('squirrel', 'squirrel', 'squirrels'),
      IT('lamb', 'lamb', 'lambs'), IT('chick', 'chick', 'chicks'), IT('duckling', 'duckling', 'ducklings')],
    friend: 'Pat', join: 'spots', leave: 'wander off',
    milo: { src: '/assets/characters/milo_explorer.png', emoji: '🦊', accessory: '🌼' } },
  /**
   * Replaces the moon base (its astronaut and alien were the only cast here that could not belong
   * anywhere a child has been), and then replaced the LILY POND that first stood in for it.
   *
   * ⚠️ THE POND'S FAULT WAS THE ART STYLE, WHICH IS A DIFFERENT KIND OF WRONG FROM A GROUND LINE.
   * `pond` / `lake` / `pond_top` are flat VECTOR cartoons — thick uniform outlines, flat fills, no
   * brushwork — and every sprite in this app is painted. A painted dragonfly over an outlined river
   * is a style mismatch, so no placement, shadow or horizon fixes it; a founder simply sees that it
   * "isn't blending". `sky` and `fishing_bg` are the same family. Check for ink outlines BEFORE
   * checking anything else about a candidate backdrop.
   *
   * These two FLY, so nothing here needs painted ground and they carry no contact shadow (see
   * `flies`) — a flier touches nothing. A flower garden is where a dragonfly and a butterfly
   * actually are, which the pond only half was.
   *
   * The three scenes are MarketDay's Garden, shared deliberately — founder's call, and the same
   * trade already made for the forests SeesawPark and MarketDay share and the barnyard this
   * chapter shares with MarketDay's farm. Those are the only painted flower scenes in the library,
   * and a row of butterflies drifting across a lawn cannot be mistaken for a grid of bee patches.
   */
  { id: 'garden',
    bgs: [
      { grad: 'linear-gradient(#cfe9f7 0%, #dcecc8 52%, #b9d894 100%)', img: '/assets/backgrounds/garden.png' },
      { grad: 'linear-gradient(#d3ecf6 0%, #dfeeca 52%, #bcda98 100%)', img: '/assets/backgrounds/garden_meadow.png' },
      { grad: 'linear-gradient(#d6edf7 0%, #dcecc8 55%, #bcd894 100%)', img: '/assets/backgrounds/garden_fence.png' },
    ],
    ground: 64,
    // `flies` is per CREATURE, not per setting: a dragonfly, a butterfly and a bee hover and so carry
    // no contact shadow, while a ladybug walks the flowerbed on its legs and needs one. The garden
    // has painted grass under all four, so the walker is on the ground and the fliers are above it.
    items: [IT('dragonfly', 'dragonfly', 'dragonflies', false, true), IT('butterfly', 'butterfly', 'butterflies', false, true),
      IT('bee', 'bee', 'bees', false, true), IT('ladybug', 'ladybug', 'ladybugs')],
    friend: 'Bo', join: 'meets', leave: 'flutter away',
    milo: { src: '/assets/characters/milo_explorer.png', emoji: '🦊', accessory: '🌼' } },
]
const INTRO = "Milo has a story for you! Listen, watch it happen, then tap the number that answers it. Ready? First, let's hear one together!"
/** Every backdrop in the chapter, so one <Background> can crossfade between any two of them. */
const ALL_BGS = SETTINGS.flatMap(w => w.bgs)

/** How many demo beats the chapter opens with. The guided round follows, then the scored rounds. */
export const DEMO_N = 3
/** Scored rounds — must match `rounds` on the beat below. */
export const SCORED_N = 10

/**
 * THE RUN: one item+setting pair per QUESTION, covering the WHOLE chapter — the demo beats first,
 * then the guided round, then every scored round — INTERLEAVED across the settings so consecutive
 * questions change place as well as object.
 *
 * ⚠️ NO CREATURE IS EVER SHOWN TWICE IN A RUN, and that is what the length is for. The plan used to
 * hold 8 pairs and be read as `PLAN[round % PLAN.length]`, so rounds 9 and 10 wrapped back onto the
 * fish and the duck the chapter had already opened with — and the demo and guided round drew from
 * `items[0]`/`items[1]` separately, which are the same two again. Meanwhile half the drawn cycles in
 * sheets.ts had no chapter using them at all. The cast is now `DEMO_N + 1 + SCORED_N` deep and every
 * index is read straight, never modulo, so a repeat is impossible rather than unlikely.
 *
 * Each pair also fixes its own backdrop, so a setting with item-specific scenes can never show the
 * wrong object.
 */
const PLAN: { w: SpWorld; item: Item; bg: number }[] = (() => {
  const out: { w: SpWorld; item: Item; bg: number }[] = []
  const deepest = Math.max(...SETTINGS.map(w => w.items.length))
  for (let i = 0; i < deepest; i++)
    for (const w of SETTINGS) if (i < w.items.length) out.push({ w, item: w.items[i], bg: i % w.bgs.length })
  return out
})()
/**
 * THE RUN, as the ONE sequence both the chapter and its gate read: the demo beats, then the guided
 * round, then the scored rounds, one entry per question. Exported because a gate that re-derives
 * this order can agree with its own copy while the screen repeats a creature — the same trap that
 * let chapter 4's geometry sweep pass while the layout was wrong. `scoredSlot` is the only way the
 * scored rounds reach it, so mutating the index is a thing the gate can actually catch.
 */
export const RUN = PLAN.slice(0, DEMO_N + 1 + SCORED_N)
export const scoredSlot = (round: number): { w: SpWorld; item: Item; bg: number } =>
  RUN[DEMO_N + 1 + round] ?? PLAN[round % PLAN.length]

type Op = 'add' | 'sub' | 'compare'
interface SpRound { w: SpWorld; bg: number; item: Item; op: Op; a: number; b: number; answer: number }

const qty = (n: number, it: Item) => `${n} ${n === 1 ? it.one : it.many}`

function buildChoices(answer: number): number[] {
  const opts = new Set<number>([answer])
  while (opts.size < 3) {
    const d = rint(1, 3)
    const v = Math.random() < 0.5 ? answer + d : Math.max(0, answer - d)
    if (v !== answer) opts.add(v)
  }
  const arr = [...opts]
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[arr[i], arr[j]] = [arr[j], arr[i]] }
  return arr
}

// Numbers stay small enough to SHOW the objects; difficulty mixes in more operations + bigger totals.
function makeStoryRound(d: 1 | 2 | 3, round: number): SpRound {
  // The scored rounds start AFTER the demo beats and the guided round have each taken a creature,
  // so the child never meets one twice. `%` is a backstop only — the plan is built long enough that
  // it can never fire, and the gate asserts exactly that.
  const { w, item, bg } = PLAN[(DEMO_N + 1 + round) % PLAN.length]
  const ops: Op[] = d === 1 ? ['add', 'sub'] : d === 2 ? ['add', 'sub', 'sub'] : ['add', 'sub', 'compare', 'compare']
  const op = pick(ops)
  let a: number, b: number, answer: number
  if (op === 'add') {
    const cap = d === 1 ? 9 : d === 2 ? 13 : 16
    a = rint(1, cap - 2); b = rint(1, Math.max(1, cap - a)); answer = a + b
  } else if (op === 'sub') {
    a = d === 1 ? rint(3, 9) : d === 2 ? rint(5, 13) : rint(6, 16)
    b = rint(1, a - 1); answer = a - b
  } else { // compare — Milo has the bigger pile
    a = d === 3 ? rint(4, 12) : rint(3, 8)
    b = rint(1, a - 1); answer = a - b
  }
  return { w, bg, item, op, a, b, answer }
}

function storyText(world: SpWorld, op: Op, a: number, b: number, it: Item) {
  if (op === 'add')
    return { story: `Milo has ${qty(a, it)}. Then Milo ${world.join} ${b} more!`, question: `How many ${it.many} altogether?` }
  if (op === 'sub')
    return { story: `Milo has ${qty(a, it)}. Then ${b} ${world.leave}!`, question: `How many ${it.many} are left?` }
  return { story: `Milo has ${qty(a, it)}. ${world.friend} has ${qty(b, it)}. How many MORE does Milo have?`, question: `How many more ${it.many} does Milo have?` }
}
const boxLabel = (op: Op) => op === 'add' ? 'ALTOGETHER' : op === 'sub' ? 'LEFT' : 'MORE'

// Stagger between one mover and the next, so a group files in rather than swarming.
const ARRIVE_GAP = 380
// The tighter stagger for the group that is already Milo's. It walks the same distance as the
// joiners, so the queue is what keeps the opening from outlasting the sum it is setting up: they
// file in together rather than one behind the other across the whole width.
const STEP_GAP = 180

/**
 * The whole sizing + travel chain for a screen and a question, as one function the SCENE renders
 * from and the choreography times itself off. Both used to guess separately: the stage sized items
 * with CSS clamps while the play surface opened the question on a hand-picked 700ms, so on a slow
 * arrival the answer buttons appeared while the story was still happening.
 *
 * ARRIVALS COME IN FROM OFF-FRAME RIGHT, AND DEPARTURES LEAVE THE SAME WAY. That is not a taste
 * call — the movers always own the right-hand end of the row (group B in an addition, the trailing
 * few in a take-away), so travelling right is the only direction that never walks a creature
 * through the group the child is counting. Same reasoning as PlayTime's slot order, mirrored.
 */
function storyLayout(vw: number, vh: number, op: Op, a: number, b: number, itemImg: string) {
  const short = vh < 470
  const two = op === 'compare'
  const maxN = op === 'add' ? Math.max(a, b) : a
  const vmin = Math.min(vw, vh)
  const px = (min: number, pct: number, max: number) => Math.round(Math.max(min, Math.min(max, vmin * pct / 100)))
  const tall = short
    ? (maxN <= 3 ? (two ? px(38, 9, 72) : px(46, 13, 92))
      : maxN <= 6 ? (two ? px(30, 7, 56) : px(38, 10, 74))
      : (two ? px(24, 5, 44) : px(30, 7.5, 58)))
    : (maxN <= 3 ? (two ? px(60, 11, 120) : px(92, 17, 200))
      : maxN <= 6 ? (two ? px(48, 8.5, 92) : px(74, 13, 160))
      : (two ? px(38, 6.4, 68) : px(58, 10, 120)))
  // ⚠️ SIZE BY AREA, NOT BY HEIGHT — the cast is creatures now and their aspects run from 0.457
  // (the alien: tall and thin) to 1.746 (the shark). Sizing on height alone drew ten aliens as 18px
  // SLIVERS, which in a chapter about counting them is fatal rather than cosmetic; the same number
  // makes a shark far wider than its share of the row. Dividing by √aspect holds the drawn AREA
  // roughly constant, so every creature reads at the same weight whatever shape it was drawn.
  const size = Math.round(tall / Math.sqrt(aspectOf(itemImg)))
  // Far enough that an item anywhere in the row starts (or finishes) outside the picture. The root
  // clips it, so nothing is ever seen materialising in mid-air.
  const dist = Math.round(vw * 0.9)
  const { ms } = inFlowJourney(itemImg, size, dist)
  return { short, two, size, dist, ms }
}

// ─── Background — crossfades between ANY two backdrops in the chapter, since the setting now
// changes every round rather than being chosen once up front. ──────────────────────────
function Background({ bg, dark }: { bg: Bg; dark?: boolean }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: dark ? '#161d3a' : '#f3ead8' }}>
      {ALL_BGS.map(b => (
        <div key={b.img} style={{ position: 'absolute', inset: 0, opacity: b === bg ? 1 : 0, transition: 'opacity .6s ease' }}>
          <div style={{ position: 'absolute', inset: 0, background: b.grad }} />
          <img src={b.img} alt="" draggable={false} decoding="async"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ))}
    </div>
  )
}

function MiloHost({ left, milo }: { left: number; milo: SpWorld['milo'] }) {
  const [step, setStep] = useState(0)
  const srcs = [milo.src, '/assets/characters/milo_idle.png']
  return (
    <div style={{ position: 'fixed', left: `${left}%`, bottom: 0, transform: 'translateX(-50%)', zIndex: 26, width: 'min(28vh, 240px)', height: 'min(28vh, 240px)', pointerEvents: 'none' }}>
      <div style={{ width: '100%', height: '100%', animation: 'st_float 3.4s ease-in-out infinite' }}>
        {step >= srcs.length
          ? <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <span style={{ fontSize: 88, filter: 'drop-shadow(0 5px 8px rgba(0,0,0,.35))' }}>{milo.emoji}</span>
              <span style={{ position: 'absolute', bottom: 12, right: 14, fontSize: 38 }}>{milo.accessory}</span>
            </div>
          : <img src={srcs[step]} alt="Milo" draggable={false} decoding="async" loading="lazy" onError={() => setStep(s => s + 1)}
              style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom', filter: 'drop-shadow(0 5px 8px rgba(0,0,0,.35))' }} />}
      </div>
    </div>
  )
}

/**
 * A grounded item with a contact shadow + jitter. `lit` = counting glow.
 *
 * `arriving` and `leaving` are JOURNEYS, not a scale-pop and a fade. That was the whole fault: a
 * story problem's arithmetic was happening in a jump cut — joiners appeared out of nothing and
 * leavers dimmed on the spot without going anywhere, which is exactly what PlayTime was built to
 * fix in the 3–5 band. The travel wraps the sprite AND its shadow together, because a shadow
 * positioned alongside its subject is one duration change away from sliding out ahead of it.
 */
function GroundedItem({ item, size, i, lit, arriving, leaving, delayMs, dist }: {
  item: Item; size: number; i: number; lit?: boolean
  arriving?: boolean; leaving?: boolean; delayMs: number; dist: number
}) {
  // A HUDDLE, NOT A QUEUE. Alternate members stand further back — higher up the picture and
  // smaller, which is what depth looks like in a painted scene — with an organic sideways nudge on
  // top. Evenly spaced on one baseline at one size they read as a row of identical stickers, which
  // is what a founder sees before they can name it. Both offsets are a share of the sprite's own
  // height, so the cluster holds its shape at every size.
  const back = i % 2 === 1
  const depth = back ? 0.4 : 0.1
  const jx = [-0.10, 0.07, -0.04, 0.11, -0.08, 0.05][i % 6] * size
  const dy = back ? -size * 0.3 : 0
  const shOp = (0.24 - depth * 0.12).toFixed(2)
  const shW = Math.round(size * 0.62)
  const travels = !!arriving || !!leaving
  const journey = inFlowJourney(item.img, size, dist)
  // Face the way it is actually going, or the drawn cycle contradicts the travel and it moonwalks:
  // arrivals come from the right (so they head LEFT), and a leaver turns round and heads right.
  // Folded together with the ART's own facing — the shark was drawn looking left, so for it the
  // flip is the other way round. Getting this from the sprite rather than assuming one direction is
  // the same rule Critter follows.
  const headingLeft = leaving ? dist < 0 : dist > 0
  const flip = item.facesLeft ? !headingLeft : headingLeft
  // OUTER wrapper holds the depth/jitter/lit transform; the travel and the entrance pop each get
  // their own element. Stack two transforms on one and the later silently wins — st_pop has
  // fill:both and its 100% keyframe sets transform:scale(1), which clobbers whatever it shares with.
  return (
    <div style={{ position: 'relative',
      transform: `translate(${jx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${(back ? 0.86 : 1) * (lit ? 1.18 : 1)})`,
      zIndex: back ? 1 : 2, transformOrigin: 'bottom center',
      filter: lit ? 'drop-shadow(0 0 12px var(--sun-yellow))' : 'none',
      transition: 'transform .45s cubic-bezier(.34,1.56,.64,1), filter .2s ease' }}>
      <Arrive dist={travels ? dist : 0} ms={travels ? journey.ms : 0} delayMs={delayMs} leave={leaving}>
        {moving => (
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center',
            // Only the ones that stay put still pop in — the movers walk in instead, which is
            // the point. A pop on top of a journey would be two arrivals for one event.
            animation: travels ? 'none' : 'st_pop .3s ease both' }}>
            <SheetCell src={item.img} h={size} facesLeft={flip} moving={moving}
              cycleScale={journey.cycleScale} delayMs={delayMs} />
            {/* A contact shadow is a CONTACT cue — a flier touches nothing, and giving one a shadow
                on the water is the same "doesn't belong" fault as denying one to a creature that
                really is standing on the grass.
                ⚠️ OUT OF FLOW, centred on the feet. In flow it added its own height to the column,
                and the group is bottom-anchored on the ground line — so the line was where the
                SHADOW ended and every creature stood a whole shadow above it. Measured at 1024×620:
                ground 384.4px, duck feet 363.5px, i.e. 21px of clear air under a 93px duck, which
                is exactly what a founder sees and calls floating. Same fault as the 28px gap
                between the two ends of MeasureIt's run: a decoration must never add layout height
                to the thing it decorates. */}
            <div aria-hidden style={{ position: 'absolute', left: '50%', bottom: 0, width: shW, height: Math.round(shW * 0.3),
              transform: 'translate(-50%, 50%)',
              background: item.flies ? 'none'
                : `radial-gradient(ellipse at center, rgba(38,28,18,${shOp}) 0%, rgba(38,28,18,0) 72%)`,
              pointerEvents: 'none' }} />
          </div>
        )}
      </Arrive>
    </div>
  )
}

/**
 * A row of the same item. `shown` are present; items from `arriveFrom` travel in and items from
 * `leaveFrom` travel out, each staggered by its place in the row; items from `highlightFrom` (the
 * compare surplus) keep a soft ring; `litN` counts with a glow.
 *
 * ARRIVAL AND DEPARTURE ARE GIVEN THEIR OWN DISTANCES, and the signs are the whole geometry of the
 * chapter. A row's own group steps in from the LEFT (negative), the joiners come from off-frame
 * RIGHT (positive) and the leavers go out the same way — so a creature never walks through the
 * group the child is counting, in either direction. One shared distance cannot express that: in a
 * take-away the row both fills from the left and empties to the right.
 */
function Row({ item, size, shown, arriveDist = 0, leaveDist = 0, arriveGap = ARRIVE_GAP, litFrom = 0, litN = 0, leaveFrom = Infinity, arriveFrom = Infinity, highlightFrom = Infinity, tag, maxW = 'min(72vw, 660px)' }: {
  item: Item; size: number; shown: number
  arriveDist?: number; leaveDist?: number; arriveGap?: number
  litFrom?: number; litN?: number; leaveFrom?: number; arriveFrom?: number; highlightFrom?: number; tag?: React.ReactNode
  /** How wide the row may run before it wraps — halved when the compare view puts two side by side. */
  maxW?: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px,1.4vw,16px)' }}>
      {tag}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.2vmin', alignItems: 'flex-end', justifyContent: 'flex-start', maxWidth: maxW, minHeight: size }}>
        {Array.from({ length: shown }).map((_, i) => {
          const arriving = i >= arriveFrom, leaving = i >= leaveFrom
          return (
            <div key={i} style={{ borderRadius: 16, padding: 2,
              outline: i >= highlightFrom ? '4px dashed var(--sun-yellow-deep)' : 'none', outlineOffset: 2,
              background: i >= highlightFrom ? 'rgba(255,214,102,.22)' : 'transparent', transition: 'background .3s ease' }}>
              <GroundedItem item={item} size={size} i={i} lit={i >= litFrom && i < litN}
                arriving={arriving} leaving={leaving} dist={leaving ? leaveDist : arriveDist}
                delayMs={leaving ? (i - leaveFrom) * ARRIVE_GAP : arriving ? (i - arriveFrom) * arriveGap : 0} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Operator({ sym, show, dark }: { sym: string; show: boolean; dark?: boolean }) {
  return (
    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(38px,7.5vmin,70px)', color: dark ? '#fff' : 'var(--milo-orange)',
      WebkitTextStroke: '2px var(--outline)', paintOrder: 'stroke fill', lineHeight: 1, marginBottom: '2.6vh',
      opacity: show ? 1 : 0, transform: show ? 'scale(1)' : 'scale(0.4)', transition: 'opacity .3s ease, transform .3s cubic-bezier(.34,1.56,.64,1)' }}>{sym}</span>
  )
}

function AnswerBox({ label, value, done, show, dark, short, topPct, bottomPx }: { label: string; value: number | null; done: boolean; show: boolean; dark?: boolean; short?: boolean; topPct?: string; bottomPx?: number }) {
  // On a 320px-tall frame the answer furniture was taking HALF the height, which is what forced the
  // creatures back up into the sky — the ground line had to be clamped above the shore to clear it.
  // A smaller box (and no label, which the spoken question already says) hands that band back.
  const boxSize = short ? 'clamp(44px,13vh,64px)' : 'clamp(96px,16vmin,140px)'
  // Where there are answer buttons the box is anchored ABOVE THEM, off the same numbers they are
  // laid out with. A percentage of the height cannot do that: at 1024×620 the 73% line put the box
  // 29px INTO the button row, sitting on the middle answer. When two things must not overlap,
  // measure one off the other — do not pick a percentage that happens to clear it on your screen.
  const place: React.CSSProperties = bottomPx != null
    ? { bottom: bottomPx }
    : { top: topPct ?? (short ? '64%' : '73%'), transform: 'translateY(-50%)' }
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, ...place, zIndex: 31, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: short ? '0.2vh' : '0.6vh',
      opacity: show ? 1 : 0, transition: 'opacity .4s ease', pointerEvents: 'none' }}>
      {!short && <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(12px,1.9vh,16px)', letterSpacing: '.08em', color: dark ? '#dfe6ff' : 'var(--ink-soft)' }}>{label}</span>}
      <div style={{ width: boxSize, height: boxSize, borderRadius: 28, border: '5px solid',
        background: done ? 'var(--garden-green)' : 'var(--paper)', borderColor: done ? 'var(--garden-green-deep)' : 'var(--outline)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 0 rgba(61,37,22,.2)', transition: 'all .3s ease',
        animation: done ? 'st_pop .5s ease' : 'none', filter: done ? 'drop-shadow(0 0 16px var(--garden-green))' : 'none' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: short ? 'clamp(28px,11vh,50px)' : 'clamp(48px,9.5vmin,76px)', color: done ? '#fff' : 'var(--ink-muted)', lineHeight: 1 }}>{value ?? '?'}</span>
      </div>
    </div>
  )
}

// The shared stage — renders the right layout for the op from plain state.
interface StageState { aShown: number; bShown: number; showOp: boolean; leaving: boolean; litA: number; litExtra: number; boxValue: number | null; boxDone: boolean; showBox: boolean }
function Stage({ world, item, op, a, b, s, short, boxBottomPx }: { world: SpWorld; item: Item; op: Op; a: number; b: number; s: StageState; short?: boolean; boxBottomPx?: number }) {
  const { w: vw, h: vh } = useViewport()
  const { two, size: itemSize, dist } = storyLayout(vw, vh, op, a, b, item.img)
  const dark = world.dark
  /**
   * EVERY ROW WALKS ON FROM OFF-FRAME — nothing on this stage is ever seen materialising, and
   * nothing takes a token step either. An earlier pass gave the standing group a short 1.8
   * body-height step to spare it the clamp, and a founder read that exactly as it is: "random
   * appearing and little movement". A move too short to leave the picture is not an arrival.
   *
   * The distance is the joiners' own `dist`, negated: they own the right-hand end of the row and
   * come in from off-frame right, so the group that is already there comes in from off-frame LEFT.
   * It has to be the FULL width — the rightmost member of a centred take-away row sits near 72%,
   * so anything shorter starts it inside the frame and it pops after all. `STEP_GAP` keeps the
   * stagger tight so a group files in together rather than trailing across the whole opening.
   */
  const stepIn = { arriveFrom: 0, arriveDist: -dist, arriveGap: STEP_GAP }

  const friendTag = (name: string, emoji: string) => (
    <span style={{ minWidth: 'clamp(48px,9vmin,74px)', textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(13px,2.3vmin,18px)',
      color: dark ? '#fff' : 'var(--ink)', display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.1 }}>
      <span style={{ fontSize: 'clamp(22px,4.4vmin,36px)' }}>{emoji}</span>{name}</span>
  )

  /**
   * THE GROUP STANDS ON THE GROUND — its BOTTOM is anchored to the setting's ground line, rather
   * than the whole block being centred at a share of the height. Centred, it floated: at 40% of a
   * 620px frame the creatures sat above every one of these backdrops' painted ground, so the scene
   * needed a wooden plank drawn under them to give them something to stand on. That plank is gone;
   * the painted scene is the floor now.
   *
   * On a short landscape frame the ground is pulled up to whatever the answer furniture leaves —
   * the same "state the constraint, don't nudge a constant" rule fitBands follows in the 3–5 band.
   */
  const ground = short ? Math.min(world.ground, 55) : world.ground
  return (
    <>
      <div style={{ position: 'fixed', left: 0, right: 0, top: `${ground}%`, transform: 'translateY(-100%)', zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: short ? '0.3vh' : '1vh' }}>
        {op === 'add' && (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 'clamp(8px,2.2vw,34px)', maxWidth: '94vw' }}>
            <Row item={item} size={itemSize} {...stepIn} shown={s.aShown} litN={Math.min(s.litA, a)} />
            <Operator sym="+" show={s.showOp} dark={dark} />
            {/* The joiners are the whole point of the sum, so they come the whole way — in from
                off-frame RIGHT, the only direction that never crosses the group being counted. */}
            <Row item={item} size={itemSize} shown={s.bShown} arriveFrom={0} arriveDist={dist} litN={Math.max(0, s.litA - a)} />
          </div>
        )}
        {op === 'sub' && (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', maxWidth: '94vw' }}>
            {/* Fills from the left, empties to the right: the trailing few turn round and walk out
                off-frame, so nobody leaves through the ones still being counted. */}
            <Row item={item} size={itemSize} {...stepIn} shown={s.aShown} litN={s.litA}
              leaveDist={dist} leaveFrom={s.leaving ? a - b : Infinity} />
          </div>
        )}
        {op === 'compare' && (
          // SIDE BY SIDE ON A SHORT FRAME, stacked when there is height for it. Two stacked rows
          // bottom-anchored on the ground line simply do not fit at 640×320: the band between the
          // prompt and the answer box is ~19% of the height, so Milo's row was pushed up behind the
          // banner. Side by side needs only ONE row's height, which is the same call BigOrSmall
          // makes for its two bunches.
          <div style={{ display: 'flex', flexDirection: short ? 'row' : 'column',
            alignItems: short ? 'flex-end' : 'flex-start', gap: short ? 'clamp(10px,3vw,28px)' : '1.4vh' }}>
            <Row item={item} size={itemSize} {...stepIn} shown={s.aShown} litFrom={b} litN={b + s.litExtra} highlightFrom={s.showBox ? b : Infinity} tag={friendTag('Milo', world.milo.emoji)} maxW={short ? 'min(40vw, 300px)' : undefined} />
            <Row item={item} size={itemSize} {...stepIn} shown={s.bShown} tag={friendTag(world.friend, '🧒')} maxW={short ? 'min(40vw, 300px)' : undefined} />
          </div>
        )}
      </div>
      <AnswerBox label={boxLabel(op)} value={s.boxValue} done={s.boxDone} show={s.showBox} dark={dark} short={short}
        topPct={two && short ? '70%' : undefined} bottomPx={boxBottomPx} />
    </>
  )
}

// ─── Interactive play surface (guided / practice) ─────────────────────────────────────
type Mode = 'guided' | 'practice'
const emptyStage: StageState = { aShown: 0, bShown: 0, showOp: false, leaving: false, litA: 0, litExtra: 0, boxValue: null, boxDone: false, showBox: false }

const StoryPlay: React.FC<{ data: SpRound; mode: Mode; onComplete: (correct: boolean) => void }> = ({ data, mode, onComplete }) => {
  const { w: world, item, op, a, b, answer } = data
  const txt = useMemo(() => storyText(world, op, a, b, item), [world, op, a, b, item])
  const choices = useMemo(() => buildChoices(answer), [op, a, b, answer])
  const { w: vw, h: vh } = useViewport()
  const short = vh < 470
  // Capped at 92, not 120. A 120px answer square is bigger than any 6–8 child needs (the 3–5
  // band's number markers top out at 54) and every pixel of it is pushed UP into the picture,
  // where it was crowding the creatures off the painted ground.
  const btn = Math.max(56, Math.min(92, Math.round(Math.min(vw / 8.8, vh / 5.2))))
  const [s, setS] = useState<StageState>(emptyStage)
  const [asking, setAsking] = useState(false)
  const [picked, setPicked] = useState<number | null>(null)
  const erred = useRef(false), done = useRef(false)
  const set = (patch: Partial<StageState>) => setS(prev => ({ ...prev, ...patch }))

  useEffect(() => {
    const T: number[] = []
    const L = storyLayout(vw, vh, op, a, b, item.img)
    // How long the LAST of a group is still on its way. Derived, not picked: the old fixed 700ms
    // opened the answer buttons while the take-away was still happening on screen. A group is
    // MOUNTED all at once and the queue lives in each one's own stagger delay, so no timer chain
    // can ever put a creature on screen before it has travelled there.
    const stepFor = (n: number) => (n > 0 ? (n - 1) * STEP_GAP + L.ms : 0)
    const movers = op === 'compare' ? 0 : b
    const travel = movers ? (movers - 1) * ARRIVE_GAP + L.ms : 0
    let t = 300
    if (mode === 'guided') speak(txt.story)
    // Group A steps into place — it no longer pops in one at a time.
    T.push(window.setTimeout(() => set({ aShown: a }), t)); t += stepFor(a)
    if (op === 'add') {
      t += 300; T.push(window.setTimeout(() => set({ showOp: true }), t)); t += 380
      T.push(window.setTimeout(() => set({ bShown: b }), t)); t += travel
    } else if (op === 'sub') {
      t += 500; T.push(window.setTimeout(() => set({ leaving: true }), t)); t += travel
    } else { // compare: the friend's row steps in too
      t += 300
      T.push(window.setTimeout(() => set({ bShown: b }), t)); t += stepFor(b)
    }
    t += 400
    T.push(window.setTimeout(() => { setAsking(true); set({ showBox: true }); speak(txt.question) }, t))
    return () => T.forEach(id => window.clearTimeout(id))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function choose(n: number) {
    if (done.current || picked !== null || !asking) return
    setPicked(n)
    if (n === answer) {
      done.current = true
      if (mode === 'guided') speak('Yes! Let’s count.')
      // count the answer objects one-by-one, box climbing 1..answer
      let k = 0
      const tick = () => {
        k++
        if (op === 'compare') set({ litExtra: k, boxValue: k })
        else set({ litA: k, boxValue: k })
        if (k < answer) window.setTimeout(tick, 300)
        else { set({ boxDone: true }); if (mode === 'guided') speak(`${numberToWords(answer)}!`) }
      }
      window.setTimeout(tick, 250)
      window.setTimeout(() => onComplete(mode === 'practice' ? !erred.current : true), answer * 300 + 1500)
    } else {
      erred.current = true
      speak('Not quite — listen to the story again, then try!')
      window.setTimeout(() => setPicked(null), 1100)
    }
  }

  return (
    <>
      {/* The answer box clears the button row by construction — see AnswerBox. */}
      <Stage world={world} item={item} op={op} a={a} b={b} s={s} short={short}
        boxBottomPx={(short ? Math.max(6, Math.round(btn * 0.14)) : vh * 0.035) + btn + 14} />
      {/* The story pill — the ONLY question pill in this chapter. `beat.prompt` is deliberately
          empty (see makeStoryBeat), because SkillBeat would otherwise draw a second pill saying the
          same thing: at 640×320 the two landed on top of each other and the question was unreadable.
          It carries SkillBeat's tap-to-replay affordance with it, so nothing is lost by deleting it. */}
      <div style={{ position: 'fixed', top: short ? 60 : 84, left: 0, right: 0, zIndex: 32, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
        <button onClick={() => speak(picked === null ? txt.story : txt.question)} aria-label="Hear it again"
          style={{ maxWidth: 'min(88vw, 620px)', cursor: 'pointer', background: world.dark ? 'rgba(20,22,44,.82)' : 'rgba(255,255,255,.92)', border: `3px solid ${world.dark ? '#8fb4ff' : 'var(--outline)'}`, borderRadius: 18, padding: short ? '5px 14px' : '10px 18px',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: short ? 'clamp(12px,3.4vh,15px)' : 'clamp(15px,2.2vh,19px)', color: world.dark ? '#fff' : 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(61,37,22,.14)' }}>
          {picked === null ? txt.story : txt.question}
        </button>
      </div>
      {/* choices */}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: short ? Math.max(6, Math.round(btn * 0.14)) : '3.5%', zIndex: 33, display: 'flex', justifyContent: 'center', gap: short ? Math.round(btn * 0.26) : 'clamp(14px,4vw,32px)', flexWrap: 'wrap', padding: '0 12px',
        opacity: asking ? 1 : 0, transform: asking ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity .4s ease, transform .4s ease', pointerEvents: asking ? 'auto' : 'none' }}>
        {choices.map(n => {
          const isPick = picked === n, isOk = n === answer
          return (
            <button key={n} onClick={() => choose(n)} disabled={picked !== null} style={{
              width: btn, height: btn, borderRadius: Math.round(btn * 0.2),
              background: (isPick && isOk) ? 'var(--garden-green-soft)' : 'var(--paper)',
              border: `4px solid ${(isPick && isOk) ? 'var(--garden-green)' : isPick ? 'var(--ink-muted)' : 'var(--outline)'}`,
              boxShadow: `0 6px 0 ${(isPick && isOk) ? 'var(--garden-green-deep)' : '#c8ac79'}`,
              fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: Math.round(btn * 0.42), color: 'var(--ink)',
              cursor: picked !== null ? 'default' : 'pointer', transform: (isPick && isOk) ? 'scale(1.08) translateY(-3px)' : 'scale(1)',
              transition: 'transform 160ms cubic-bezier(.34,1.56,.64,1), background 160ms ease',
            }}>{n}</button>
          )
        })}
      </div>
    </>
  )
}

// ─── Teaching demo (opening preview + 3-wrong re-teach): narrate the story via ONE speakSteps ─
const StoryExplain: React.FC<{ data: SpRound; onDone: () => void }> = ({ data, onDone }) => {
  const { w: world, item, op, a, b, answer } = data
  const txt = useMemo(() => storyText(world, op, a, b, item), [world, op, a, b, item])
  const { w: vw, h: vh } = useViewport()
  const short = vh < 470
  const [s, setS] = useState<StageState>(emptyStage)
  const set = (patch: Partial<StageState>) => setS(prev => ({ ...prev, ...patch }))
  const doneRef = useRef(onDone); doneRef.current = onDone
  useEffect(() => {
    const lines: string[] = []
    const steps: Array<() => void> = []
    // One line per mover after the first, so the narration lasts as long as the arrival does and
    // "let's count" never lands while somebody is still walking in. Same device as PlayTime's demo.
    const alsoArriving = Array.from({ length: Math.max(0, b - 1) })
    /**
     * The same device for the group that STEPS in — but counted from the journey rather than one
     * line per member, because a group of five does not need five lines. Without it the narration
     * reaches "then two wander off" while the last two are still walking in, and they snap to their
     * places before turning round. Measured against the ~950ms a spoken line takes here.
     */
    const L = storyLayout(vw, vh, op, a, b, item.img)
    const holdsFor = (n: number) =>
      Array.from({ length: Math.max(0, Math.ceil(((Math.max(1, n) - 1) * STEP_GAP + L.ms) / 950) - 1) })
    if (op === 'add') {
      lines.push(`Milo has ${qty(a, item)}.`); steps.push(() => set({ aShown: a }))
      holdsFor(a).forEach(() => { lines.push('Here they come.'); steps.push(() => {}) })
      lines.push(`Then Milo ${world.join} ${qty(b, item)} more.`); steps.push(() => set({ bShown: b, showOp: true }))
      alsoArriving.forEach(() => { lines.push('Here comes another one!'); steps.push(() => {}) })
      lines.push('Let’s count them all!'); steps.push(() => set({ showBox: true, boxValue: 0 }))
      for (let k = 1; k <= answer; k++) { const v = k; lines.push(numberToWords(v)); steps.push(() => set({ litA: v, boxValue: v })) }
      lines.push(`${numberToWords(answer)} ${item.many} altogether!`); steps.push(() => set({ boxDone: true }))
    } else if (op === 'sub') {
      lines.push(`Milo has ${qty(a, item)}.`); steps.push(() => set({ aShown: a }))
      holdsFor(a).forEach(() => { lines.push('Here they come.'); steps.push(() => {}) })
      lines.push(`Then ${qty(b, item)} ${world.leave}.`); steps.push(() => set({ leaving: true }))
      alsoArriving.forEach(() => { lines.push('There goes another one.'); steps.push(() => {}) })
      lines.push('Let’s count what’s left!'); steps.push(() => set({ showBox: true, boxValue: 0 }))
      for (let k = 1; k <= answer; k++) { const v = k; lines.push(numberToWords(v)); steps.push(() => set({ litA: v, boxValue: v })) }
      lines.push(`${numberToWords(answer)} ${item.many} left!`); steps.push(() => set({ boxDone: true }))
    } else {
      lines.push(`Milo has ${qty(a, item)}.`); steps.push(() => set({ aShown: a }))
      holdsFor(a).forEach(() => { lines.push('Here they come.'); steps.push(() => {}) })
      lines.push(`${world.friend} has ${qty(b, item)}.`); steps.push(() => set({ bShown: b }))
      holdsFor(b).forEach(() => { lines.push('And here are theirs.'); steps.push(() => {}) })
      lines.push('Milo has more! How many more?'); steps.push(() => set({ showBox: true, boxValue: 0 }))
      for (let k = 1; k <= answer; k++) { const v = k; lines.push(numberToWords(v)); steps.push(() => set({ litExtra: v, boxValue: v })) }
      lines.push(`Milo has ${numberToWords(answer)} more!`); steps.push(() => set({ boxDone: true }))
    }
    const cancel = speakSteps(lines, {
      onStep: (i) => { steps[i]?.() },
      onDone: () => { window.setTimeout(() => doneRef.current(), 1100) },
      fallbackStepMs: 950,
    })
    return cancel
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <>
      <Stage world={world} item={item} op={op} a={a} b={b} s={s} short={short} />
      {/* On a short/landscape demo the orchestrator already shows a "Watch Milo's story" banner up
          top; the extra story pill would double up and collide with the objects — so hide it there. */}
      {!short && (
        <div style={{ position: 'fixed', top: 84, left: 0, right: 0, zIndex: 32, display: 'flex', justifyContent: 'center', padding: '0 12px', pointerEvents: 'none' }}>
          <div style={{ maxWidth: 'min(88vw, 620px)', background: world.dark ? 'rgba(20,22,44,.82)' : 'rgba(255,255,255,.92)', border: `3px solid ${world.dark ? '#8fb4ff' : 'var(--outline)'}`, borderRadius: 18, padding: '10px 18px',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(15px,2.2vh,19px)', color: world.dark ? '#fff' : 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(61,37,22,.14)' }}>
            {txt.story}
          </div>
        </div>
      )}
    </>
  )
}

// ─── Value generation ──────────────────────────────────────────────────────────────
function makeStoryBeat(): Beat<SpRound> {
  return {
    skillId: 'storyProblems', rounds: SCORED_N, walkEvery: 3,
    make: (d, round = 0) => makeStoryRound((d || 1) as 1 | 2 | 3, round),
    sig: d => `${d.op}|${d.a}|${d.b}`,   // dedupe on the MATH (op + operands), not the rotating scene/item
    // Deliberately EMPTY, so SkillBeat draws no pill of its own: the play surface already renders
    // the story and then the question in one pill, and two pills saying the same thing collided at
    // 640×320 with the question unreadable behind the story. Same call as MissionBrief — a
    // text-forward chapter whose own prompt is richer than the beat's one-liner owns the pill.
    prompt: () => '',
    say: d => storyText(d.w, d.op, d.a, d.b, d.item).story,
    Play: ({ data, onSubmit }) => <StoryPlay data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <StoryExplain data={data} onDone={onDone} />,
  }
}

// ─── Orchestrator ──────────────────────────────────────────────────────────────────
const ST_CSS = `
@keyframes st_float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes st_pop { 0%{transform:scale(0);opacity:0} 70%{transform:scale(1.15);opacity:1} 100%{transform:scale(1);opacity:1} }
`
type Phase = 'intro' | 'demo' | 'guided' | 'practice'
export default function StoryTime({ onFinish, onExit }: {
  world?: string     // accepted for the /story route's shared signature; the chapter is one run
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
  const needsRotate = useNeedsRotate()
  const [phase, setPhase] = useState<Phase>('intro')
  // The SETTING is now part of the round, not a choice made before the chapter starts.
  const [scene, setScene] = useState<SpRound['w']>(SETTINGS[0])
  const [bg, setBg] = useState(0)
  const [demoIdx, setDemoIdx] = useState(0)
  const { exit, tally } = useChapterShell(onFinish, onExit)

  const interlude = useCallback(() => new Promise<void>(res => window.setTimeout(res, 850)), [])
  const beat = useMemo(() => makeStoryBeat(), [])

  // The band is landscape-only: joiners come in from off-frame and leavers walk out, which a
  // portrait column has no room for. This early return must sit BELOW every hook — above one,
  // turning the phone changes the hook count and React tears the chapter into the error boundary.
  if (needsRotate) return <RotateGate line="Milo tells his stories in landscape! 🐴" />

  // One of each kind, each in a DIFFERENT setting — so the first thing a child learns is that the
  // place changes but the rule does not, which is also what the scored rounds then do.
  //
  // The creatures come from the SAME plan the scored rounds read, at its first four slots, rather
  // than being picked out of `items[]` by hand. Picked by hand they were `items[0]` and `items[1]`
  // — which is exactly where the scored rounds also started, so the chapter opened on a fish and
  // then served the same fish again as a question. Taking them off the front of the one ordered run
  // is what makes "no creature twice" true by construction instead of by remembering.
  const DEMO: SpRound[] = [
    { ...RUN[0], op: 'add', a: 3, b: 2, answer: 5 },
    { ...RUN[1], op: 'sub', a: 5, b: 2, answer: 3 },
    { ...RUN[2], op: 'compare', a: 4, b: 2, answer: 2 },
  ]
  const GUIDED: SpRound = { ...RUN[DEMO_N], op: 'add', a: 2, b: 2, answer: 4 }
  const shown = phase === 'practice' ? { w: scene, bg } : phase === 'guided' ? GUIDED : DEMO[Math.min(demoIdx, DEMO.length - 1)]

  const Banner = (text: string) => (
    <div style={{ position: 'absolute', top: 46, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
      <div style={{ background: 'var(--paper)', border: '3px solid var(--milo-orange)', borderRadius: 999, padding: '9px 22px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--milo-orange)', boxShadow: '0 4px 0 rgba(242,107,44,.25)', textAlign: 'center' }}>{text}</div>
    </div>
  )

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      <style>{CRITTER_CSS}{ST_CSS}</style>
      <Background bg={shown.w.bgs[shown.bg]} dark={shown.w.dark} />
      <div style={{ position: 'absolute', top: 12, left: 14, right: 14, display: 'flex', alignItems: 'center', zIndex: 50 }}>
        <button onClick={exit} style={{ padding: '7px 14px', borderRadius: 50, background: 'var(--paper)', border: '3px solid var(--milo-orange)', color: 'var(--milo-orange)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>← Menu</button>
      </div>

      {phase === 'intro' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 45, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ maxWidth: '76%', background: '#fff', border: '3px solid var(--outline)', borderRadius: 18, padding: '14px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, color: 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(61,37,22,.1)' }}>
            {INTRO}
          </div>
          <button onClick={() => { unlockSpeech(); setPhase('demo') }}
            style={{ padding: '14px 38px', borderRadius: 50, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, boxShadow: '0 6px 16px rgba(242,107,44,.4)' }}>Tell me a story! ▶</button>
        </div>
      )}

      {phase === 'demo' && (<>{Banner(`Watch Milo's story  (${demoIdx + 1}/${DEMO.length})`)}
        <StoryExplain key={`demo${demoIdx}`} data={DEMO[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} /></>)}

      {phase === 'guided' && (<>{Banner('Now you! Tap the answer')}
        <StoryPlay key="guided" data={GUIDED} mode="guided" onComplete={() => setPhase('practice')} /></>)}

      {phase === 'practice' && (
        <div style={{ position: 'absolute', top: 44, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
          <SkillBeat beat={beat} onInterlude={interlude}
            onRound={(data) => { if (data?.w) { setScene(data.w); setBg(data.bg) } }}
            onComplete={tally} />
        </div>
      )}

      {/* Milo belongs to the round's setting — a walking pony on a seabed is the same
          "doesn't belong" fault as an emoji in a painted scene. */}
      <MiloHost left={10} milo={shown.w.milo} />
    </div>
  )
}
