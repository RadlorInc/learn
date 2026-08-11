'use client'
/**
 * Chapter (6–8) — MULTIPLICATION (skill `multiplication`) as STORY MODE.
 *
 * Multiplication is EQUAL GROUPS, carried by the world's OWN creatures: `g` groups that each hold
 * `per` of the item — "3 pens of 4 chicks". The child skip-counts the groups and taps the
 * total. Two views of the same idea (both object-driven):
 *   GROUPS — `g` framed clusters, each holding `per` items
 *   ARRAY  — one neat grid of `g` rows × `per` columns
 * ONE chapter, not three behind a picker. All three settings are in the same run and the SETTING
 * CHANGES EVERY ROUND, so consecutive questions differ in place as well as in number — a picker
 * makes a child choose before they know what they are choosing, and then gives them ten rounds of
 * one backdrop. Same call chapter 2 took when its three biomes were merged.
 *   🐔 The Farm   — PENS of chicks · ducklings · lambs
 *   🌸 The Garden — PATCHES of bees · ladybugs · ants
 *   🌲 The Woods  — NESTS of birds · squirrels · eagles
 * EVERY item is a drawn walk cycle, so a group is made of living creatures rather than stickers.
 * The plan is 9 item+setting pairs, interleaved, so consecutive rounds change setting.
 *
 * Numbers stay small enough to SHOW every object (object-driven per the locked 6–8 rules): up to
 * 6×6. The demo + 3-wrong re-teach SKIP-COUNT the groups via ONE speakSteps — a group lights up
 * as the running total climbs "four, eight, twelve", then "3 × 4 = 12" (voice + visual synced when
 * audio plays, timer-paced when blocked). Reuses committed sprites only. Wrapped by
 * game/MultiplicationChapter.tsx.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { speak, stopSpeech, speakSteps, unlockSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat, useChapterShell } from './StoryWorld'
import { numberToWords } from '../lessons/_kit'
import FitBox from './FitBox'
import { useViewport } from '@/shared/hooks/useViewport'
import { useNeedsRotate, RotateGate } from './RotateGate'
import { SheetSprite, CRITTER_CSS, aspectOf, inFlowJourney } from './critters'
import { rint, shuffle } from '@/core/rand'

// Live viewport size — for layouts that must RESERVE room (objects vs. the answer buttons)
// so they never overlap on a short/landscape screen.

// ─── Items & Worlds ──────────────────────────────────────────────────────────────────
interface Item { img: string; one: string; many: string }
/**
 * EVERY item is a creature with a drawn walk cycle in sheets.ts. Equal groups made of cupcakes and
 * beads were a grid of dead stickers — the one thing on screen that never moved — and a still object
 * beside a living one reads as broken art rather than as a choice. A pen of chicks breathes.
 */
const IT = (n: string, one: string, many: string): Item =>
  ({ img: `/assets/objects/${n}_side.png`, one, many })

interface Bg { grad: string; img: string }
interface MultWorld {
  id: string
  bgs: Bg[]
  /**
   * Where the bottom of a group lands, as a screen-%. Measured off the backdrops, never guessed:
   * the group used to be centred at 40% of the height, which on the farm and garden scenes is
   * ABOVE the painted grass — pens of chicks hanging in the sky over the barn. Measured horizons:
   * farm 50–62% · garden 45–60% · forest 88%. The forest is the exception and is left high on
   * purpose: birds, squirrels and eagles live in the canopy, so a nest up a tree is where it
   * belongs — what was wrong there was the floating card, not the height.
   */
  ground: number
  items: Item[]
  group: string            // what one group is called: "tray", "bed", "pod"
  groupPlural: string
  dark?: boolean
  milo: { src: string; emoji: string; accessory: string }
}
const SETTINGS: MultWorld[] = [
  { id: 'farm', ground: 64, group: 'pen', groupPlural: 'pens',
    bgs: [
      { grad: 'linear-gradient(#cfe6f7 0%, #dcecc8 55%, #bcd894 100%)', img: '/assets/backgrounds/farm_barnyard.png' },
      { grad: 'linear-gradient(#d6ebf4 0%, #dfeeca 55%, #c2dc98 100%)', img: '/assets/backgrounds/farm_orchard.png' },
      { grad: 'linear-gradient(#cfe8f2 0%, #d8ebcc 55%, #b6d6a0 100%)', img: '/assets/backgrounds/farm_pond.png' },
    ],
    items: [IT('chick', 'chick', 'chicks'), IT('duckling', 'duckling', 'ducklings'), IT('lamb', 'lamb', 'lambs'),
      IT('duck', 'duck', 'ducks'), IT('rabbit', 'rabbit', 'rabbits')],
    milo: { src: '/assets/characters/milo_explorer.png', emoji: '🦊', accessory: '🐔' } },
  { id: 'garden', ground: 64, group: 'patch', groupPlural: 'patches',
    bgs: [
      { grad: 'linear-gradient(#cfe6f7 0%, #dcecdb 60%, #c6e0b6 100%)', img: '/assets/backgrounds/garden.png' },
      { grad: 'linear-gradient(#d3e9f6 0%, #dfeedb 60%, #c8e2b8 100%)', img: '/assets/backgrounds/garden_meadow.png' },
      { grad: 'linear-gradient(#cfe8f5 0%, #dcecda 60%, #c4dfb4 100%)', img: '/assets/backgrounds/garden_fence.png' },
    ],
    items: [IT('bee', 'bee', 'bees'), IT('ladybug', 'ladybug', 'ladybugs'), IT('ant', 'ant', 'ants'),
      IT('butterfly', 'butterfly', 'butterflies'), IT('dragonfly', 'dragonfly', 'dragonflies')],
    milo: { src: '/assets/characters/milo_explorer.png', emoji: '🦊', accessory: '🌼' } },
  { id: 'woods', ground: 62, group: 'nest', groupPlural: 'nests',
    bgs: [
      { grad: 'linear-gradient(#dbeecb 0%, #cfe4b4 55%, #a9cf88 100%)', img: '/assets/backgrounds/forest_1.jpeg' },
      { grad: 'linear-gradient(#d6ecc6 0%, #cae0ae 55%, #a4ca82 100%)', img: '/assets/backgrounds/forest_2.jpeg' },
      { grad: 'linear-gradient(#dcecc8 0%, #cfe2b0 55%, #a8cd86 100%)', img: '/assets/backgrounds/forest_4.jpeg' },
    ],
    items: [IT('bird', 'bird', 'birds'), IT('squirrel', 'squirrel', 'squirrels'), IT('eagle', 'eagle', 'eagles'),
      IT('firefly', 'firefly', 'fireflies')],
    milo: { src: '/assets/characters/milo_idle.png', emoji: '🦊', accessory: '🌲' } },
]
const INTRO = 'Milo makes things in EQUAL groups. Count the groups and how many are in each, then tap how many there are in all. First, watch Milo count!'
/** Every backdrop in the chapter, so one <Background> can crossfade between any two of them. */
const ALL_BGS = SETTINGS.flatMap(w => w.bgs)

/**
 * The run: one item+setting pair per round, INTERLEAVED across the settings rather than grouped, so
 * consecutive rounds change place as well as object. The backdrop is fixed BY the item, which is
 * load-bearing where a setting's scenes are item-specific — a scene must never be chosen
 * independently of what it is showing.
 *
 * ⚠️ IT COVERS THE WHOLE CHAPTER — the demo beats, then the guided round, then every scored round —
 * and NO CREATURE IS EVER SHOWN TWICE. It used to hold 9 pairs read as `PLAN[round % PLAN.length]`
 * against 10 scored rounds, so the last round wrapped onto the chick the chapter opened with, and
 * the demo and guided round picked out of `items[]` by hand on top of that. The cast is now
 * `DEMO_N + 1 + SCORED_N` deep and every index is read straight, never modulo.
 */
export const DEMO_N = 2   // this chapter opens with two beats (groups, then array), not three
export const SCORED_N = 10
const PLAN: { w: MultWorld; item: Item; bg: number }[] = (() => {
  const out: { w: MultWorld; item: Item; bg: number }[] = []
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
export const scoredSlot = (round: number): { w: MultWorld; item: Item; bg: number } =>
  RUN[DEMO_N + 1 + round] ?? PLAN[round % PLAN.length]

type View = 'groups' | 'array'
interface MultRound { w: MultWorld; bg: number; item: Item; view: View; g: number; per: number; answer: number }

const coin = () => Math.random() < 0.5
function multChoices(answer: number, g: number, per: number): number[] {
  const set = new Set<number>([answer])
  const cands = [g * (per + 1), g * (per - 1), (g + 1) * per, (g - 1) * per, answer + g, answer - g, answer + per, answer - per, answer + 1, answer - 1]
  for (const c of shuffle(cands)) { if (set.size >= 3) break; if (c > 0 && c !== answer) set.add(c) }
  while (set.size < 3) { const r = answer + rint(1, 4) * (coin() ? 1 : -1); if (r > 0 && r !== answer) set.add(r) }
  return shuffle([...set])
}
// Numbers stay small enough to SHOW every object; difficulty widens the factors + adds the array view.
function makeMultRound(d: 1 | 2 | 3, round: number): MultRound {
  const { w, item, bg } = scoredSlot(round)
  let g: number, per: number, view: View
  if (d === 1) { g = rint(2, 3); per = rint(2, 4); view = 'groups' }
  else if (d === 2) { g = rint(2, 5); per = rint(2, 5); view = coin() ? 'groups' : 'array' }
  else { g = rint(2, 6); per = rint(2, 6); view = coin() ? 'array' : 'groups' }
  return { w, bg, item, view, g, per, answer: g * per }
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

function MiloHost({ left, milo }: { left: number; milo: MultWorld['milo'] }) {
  const [step, setStep] = useState(0)
  const srcs = [milo.src, '/assets/characters/milo_idle.png']
  return (
    <div style={{ position: 'fixed', left: `${left}%`, bottom: 0, transform: 'translateX(-50%)', zIndex: 26, width: 'min(26vh, 220px)', height: 'min(26vh, 220px)', pointerEvents: 'none' }}>
      <div style={{ width: '100%', height: '100%', animation: 'md_float 3.4s ease-in-out infinite' }}>
        {step >= srcs.length
          ? <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <span style={{ fontSize: 80, filter: 'drop-shadow(0 5px 8px rgba(0,0,0,.35))' }}>{milo.emoji}</span>
              <span style={{ position: 'absolute', bottom: 12, right: 14, fontSize: 34 }}>{milo.accessory}</span>
            </div>
          : <img src={srcs[step]} alt="Milo" draggable={false} decoding="async" loading="lazy" onError={() => setStep(s => s + 1)}
              style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom', filter: 'drop-shadow(0 5px 8px rgba(0,0,0,.35))' }} />}
      </div>
    </div>
  )
}

// A creature steps in over 1.6 of its own body-heights (SheetSprite's default), staggered so a pen
// fills as a queue rather than all at once.
const ITEM_GAP = 90
/** How long the last creature of a group is still walking — so the answer is never offered while a
 *  pen is still filling. Derived from the sprite's own gait, never a guessed constant. */
const groupFillMs = (img: string, size: number, per: number) =>
  (per - 1) * ITEM_GAP + inFlowJourney(img, size, size * 1.6).ms

/**
 * One creature WALKING into its place. It used to be a still `SheetCell` that simply existed once
 * its tray had been lowered onto the counter — so the only thing that ever moved in this chapter
 * was the tray, and the creatures rode in inside it like cargo. `walkIn` goes true when the group's
 * turn comes, and the cycle runs for exactly as long as the body is covering ground.
 */
function ItemImg({ item, size, walkIn, delayMs }: { item: Item; size: number; walkIn: boolean; delayMs: number }) {
  return <SheetSprite src={item.img} h={size} walkIn={walkIn} delayMs={delayMs} />
}

/**
 * Item height in PX, not a CSS clamp — a living sprite has to crop its own sheet, which needs a
 * number. Same breakpoints the clamps had, evaluated here instead of by the browser.
 * On SHORT (landscape phone) frames the floors drop away so a full array + the equation box + the
 * buttons still fit inside the height.
 */
function itemPxFor(g: number, per: number, vw: number, vh: number, itemImg: string, short?: boolean): number {
  const vmin = Math.min(vw, vh)
  const px = (min: number, pct: number, max: number) => Math.round(Math.max(min, Math.min(max, vmin * pct / 100)))
  const density = g * per
  const tall = short
    ? (density <= 9 ? px(22, 7, 50) : density <= 16 ? px(18, 5.5, 40) : density <= 25 ? px(14, 4.2, 30) : px(11, 3.3, 24))
    : (density <= 9 ? px(34, 6.4, 58) : density <= 16 ? px(26, 4.9, 44) : density <= 25 ? px(20, 3.7, 33) : px(16, 2.9, 26))
  // Size by AREA, not by height: the cast is creatures and their aspects differ (a ladybug is 1.47x
  // wider than tall, a duckling 0.77). Sizing on height alone makes a narrow one a sliver and a wide
  // one hog its row — see the same note in StoryTime, where ten aliens came out 18px across.
  return Math.round(tall / Math.sqrt(aspectOf(itemImg)))
}

/**
 * One GROUP = a framed cluster of `per` items. `lit` means this pen's turn has come; `glow` is the
 * counting glow.
 *
 * THE PEN IS ALREADY THERE AND THE CREATURES WALK INTO IT. The empty place waits from the first
 * frame — the slot is reserved by layout, so the row never shuffles sideways under a child who is
 * part-way through counting — and when the group's turn comes its creatures come in on their own
 * legs. Two earlier versions were worse in the same way: the pen scale-popped into existence, then
 * it was lowered onto its place with the creatures riding inside it. Either way the only thing that
 * moved was the container, and a creature that arrives as cargo has not arrived.
 */
function Cluster({ item, per, itemPx, lit, glow, dark }: { item: Item; per: number; itemPx: number; lit: boolean; glow: boolean; dark?: boolean }) {
  const cols = per === 4 ? 2 : per <= 3 ? per : 3
  // A HUDDLE, NOT A GRID. Alternate members stand a little back and to the side, so a pen reads as
  // animals standing in it rather than as items laid out in a tray. Kept small — this is the
  // manipulative a child counts, and a scatter they cannot count is a wrong answer we caused.
  const jitter = (i: number) => ({
    transform: `translate(${([-0.09, 0.06, -0.04, 0.08, -0.07, 0.05][i % 6] * itemPx).toFixed(1)}px, ${(i % 2 ? -itemPx * 0.12 : 0).toFixed(1)}px)`,
  })
  return (
    <div style={{ position: 'relative' }}>
      {/* The empty place, waiting. A soft shadow with light on its rim, never a hairline outline —
          a painted scene contains no wireframes, so an outline reads as a blueprint laid over it. */}
      <span aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: 999,
        background: 'rgba(48,34,20,.17)', boxShadow: 'inset 0 0 0 3px rgba(255,252,244,.5)',
        opacity: lit ? 0 : 1, transition: 'opacity .3s ease' }} />
      {/* The pen's own contact shadow, so it SITS on the ground instead of hovering over it. Out
          of flow, or it would add height to the thing it decorates and push the group off its
          ground line — the same fault that put a 28px gap between the two ends of MeasureIt's run. */}
      <span aria-hidden style={{ position: 'absolute', left: '6%', right: '6%', bottom: -Math.round(itemPx * 0.16),
        height: Math.round(itemPx * 0.3), pointerEvents: 'none', opacity: lit ? 1 : 0, transition: 'opacity .3s ease',
        background: 'radial-gradient(ellipse at center, rgba(38,28,18,.3) 0%, rgba(38,28,18,0) 72%)' }} />
      <div style={{
        // A PATCH OF GROUND, not a card. A hard-edged rounded rectangle with a blue stroke and a
        // white fill is a UI panel, and laid over a painted forest that is exactly what it looked
        // like — a pane of glass with birds behind it. A stadium-shaped warm patch with a soft
        // light rim reads as the pen / patch / nest the group is actually called, and it still
        // marks the grouping unmistakably, which multiplication needs.
        display: 'grid', gridTemplateColumns: `repeat(${cols}, auto)`, gap: 'clamp(2px,0.7vmin,5px)',
        padding: `clamp(5px,1.2vmin,9px) clamp(10px,2.4vmin,20px)`, borderRadius: 999,
        boxShadow: `inset 0 0 0 3px ${dark ? 'rgba(180,205,255,.4)' : 'rgba(255,250,235,.6)'}`,
        // The fill has to be SEEN, or all that is left is the rim — and a hoop of hairline outline
        // laid over a painted forest is the wireframe fault, not a pen. Same formula as the empty
        // socket it replaces: a translucent warm dark with light catching its edge.
        background: glow
          ? (dark ? 'rgba(255,214,102,.38)' : 'rgba(255,201,84,.62)')
          : dark ? 'rgba(120,142,205,.26)' : 'rgba(52,38,22,.30)',
        // The FRAME only fades up around the arriving creatures — it is scenery, and a pen that
        // flies in is one more thing moving that nobody is counting.
        opacity: lit ? 1 : 0,
        transform: `scale(${glow ? 1.06 : 1})`,
        transition: 'transform .3s cubic-bezier(.22,.9,.3,1), opacity .3s ease, background .3s ease, filter .3s ease',
        filter: glow ? 'drop-shadow(0 0 12px var(--sun-yellow))' : 'drop-shadow(0 2px 4px rgba(0,0,0,.22))',
      }}>
        {Array.from({ length: per }).map((_, i) => (
          // One transform per wrapper: the huddle offset here, the walk-in inside.
          <span key={i} style={jitter(i)}>
            <ItemImg item={item} size={itemPx} walkIn={lit} delayMs={i * ITEM_GAP} />
          </span>
        ))}
      </div>
    </div>
  )
}

// GROUPS view — `g` clusters in a row; `shown`/`glowN` count them one-by-one.
function GroupsView({ item, g, per, itemPx, shown, glowN, dark }: { item: Item; g: number; per: number; itemPx: number; shown: number; glowN: number; dark?: boolean }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(8px,2.2vw,26px)', justifyContent: 'center', alignItems: 'center', maxWidth: '94vw' }}>
      {Array.from({ length: g }).map((_, i) => <Cluster key={i} item={item} per={per} itemPx={itemPx} lit={i < shown} glow={i < glowN} dark={dark} />)}
    </div>
  )
}

// ARRAY view — one grid of `g` rows × `per` cols; `shown`/`glowN` reveal/glow row-by-row.
function ArrayView({ item, g, per, itemPx, shown, glowN, dark }: { item: Item; g: number; per: number; itemPx: number; shown: number; glowN: number; dark?: boolean }) {
  return (
    // A PLOT ON THE GROUND, same formula as a pen — a white panel with a blue stroke is a UI card,
    // and it is at its worst here: the frame is full-size from the start (so the lane each row will
    // fill is reserved), which meant an empty white box hanging over the meadow with one row of
    // creatures in it. Kept rectangular, because an array's regularity is the point.
    <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', gap: 'clamp(4px,1vmin,8px)', padding: 'clamp(8px,1.6vmin,14px)', borderRadius: 26,
      boxShadow: `inset 0 0 0 3px ${dark ? 'rgba(180,205,255,.4)' : 'rgba(255,250,235,.55)'}`,
      background: dark ? 'rgba(120,142,205,.22)' : 'rgba(52,38,22,.26)', maxWidth: '94vw' }}>
      {/* Its contact shadow, out of flow so it adds no height to the thing it decorates. */}
      <span aria-hidden style={{ position: 'absolute', left: '5%', right: '5%', bottom: -Math.round(itemPx * 0.16),
        height: Math.round(itemPx * 0.3), pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, rgba(38,28,18,.3) 0%, rgba(38,28,18,0) 72%)' }} />
      {/* Each row WALKS in, same as a pen filling — the frame is already full-size, so the lane
          every row will occupy is reserved from the start and nothing shuffles under a child who is
          part-way through counting. */}
      {Array.from({ length: g }).map((_, r) => (
        <div key={r} style={{ display: 'flex', gap: 'clamp(3px,0.9vmin,7px)', justifyContent: 'center',
          opacity: r < shown ? 1 : 0,
          transition: 'opacity .3s ease, filter .3s ease, background .3s ease',
          filter: r < glowN ? 'drop-shadow(0 0 10px var(--sun-yellow))' : 'none', background: r < glowN ? 'rgba(255,214,102,.4)' : 'transparent', borderRadius: 10 }}>
          {Array.from({ length: per }).map((_, c) =>
            <ItemImg key={c} item={item} size={itemPx} walkIn={r < shown} delayMs={c * ITEM_GAP} />)}
        </div>
      ))}
    </div>
  )
}

// The × equation + answer box (the answer box climbs during the count-up).
function EquationBox({ g, per, value, done, show, dark, short, bottomPx }: { g: number; per: number; value: number | null; done: boolean; show: boolean; dark?: boolean; short?: boolean; bottomPx?: number }) {
  const txt = dark ? '#fff' : 'var(--ink)'
  // Shrunk on a short frame for the same reason as StoryTime's answer box: at 17vh the answer
  // furniture owned half a 320px screen, and the pens had to be clamped back up into the sky
  // to clear it.
  const boxSize = short ? 'clamp(42px,12vh,60px)' : 'clamp(84px,14vmin,124px)'
  // Where there are answer buttons the equation is anchored ABOVE THEM, off the same numbers they
  // are laid out with. A percentage of the height cannot do that: at 1024x620 the 76% line put the
  // box 33px INTO the button row, sitting on the middle answer. When two things must not overlap,
  // measure one off the other rather than picking a percentage that clears it on one screen.
  const place: React.CSSProperties = bottomPx != null
    ? { bottom: bottomPx }
    : { top: short ? '65%' : '76%', transform: 'translateY(-50%)' }
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, ...place, zIndex: 31, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: short ? 'clamp(6px,2vw,16px)' : 'clamp(8px,2.4vw,22px)',
      opacity: show ? 1 : 0, transition: 'opacity .4s ease', pointerEvents: 'none' }}>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: short ? 'clamp(22px,7vh,44px)' : 'clamp(30px,6.5vmin,54px)', color: txt, WebkitTextStroke: dark ? '0' : '1.5px var(--outline)', paintOrder: 'stroke fill' }}>{g} × {per} =</span>
      <div style={{ width: boxSize, height: boxSize, borderRadius: 24, border: '5px solid',
        background: done ? 'var(--garden-green)' : 'var(--paper)', borderColor: done ? 'var(--garden-green-deep)' : 'var(--outline)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 0 rgba(61,37,22,.2)', transition: 'all .3s ease',
        animation: done ? 'md_pop .5s ease' : 'none', filter: done ? 'drop-shadow(0 0 16px var(--garden-green))' : 'none' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: short ? 'clamp(26px,10vh,48px)' : 'clamp(44px,8.5vmin,68px)', color: done ? '#fff' : 'var(--ink-muted)', lineHeight: 1 }}>{value ?? '?'}</span>
      </div>
    </div>
  )
}

interface StageState { shown: number; glowN: number; boxValue: number | null; boxDone: boolean; showBox: boolean }
function Stage({ world, data, s, short, boxBottomPx }: { world: MultWorld; data: MultRound; s: StageState; short?: boolean; boxBottomPx?: number }) {
  const { item, view, g, per } = data
  const { w: vw, h: vh } = useViewport()
  const itemPx = itemPxFor(g, per, vw, vh, item.img, short)
  // Scale the groups/array up to fill the band between the banner and the equation box, so the
  // manipulative is big & clear on any viewport (not capped by itemPxFor's own maximum).
  const availW = vw * 0.92
  /**
   * The group STANDS ON THE GROUND — its bottom is anchored to the setting's ground line, not
   * centred at a share of the height. Centred, the pens floated in the sky above the barn: the
   * whole bottom third of grass sat empty while the animals hung over the roofline.
   *
   * `availH` is what is left between the prompt pill and that ground line, so the group can only
   * ever grow UPWARD into space that is actually free — the same "state the constraint" shape as
   * fitBands in the 3–5 band.
   */
  const ground = short ? Math.min(world.ground, 56) : world.ground
  const availH = short ? vh * 0.24 : vh * 0.40
  return (
    <>
      <div style={{ position: 'fixed', left: 0, right: 0, top: `${ground}%`, transform: 'translateY(-100%)', zIndex: 30, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', padding: '0 3vw' }}>
        <FitBox availW={availW} availH={availH} max={2.6}>
          {view === 'groups'
            ? <GroupsView item={item} g={g} per={per} itemPx={itemPx} shown={s.shown} glowN={s.glowN} dark={world.dark} />
            : <ArrayView item={item} g={g} per={per} itemPx={itemPx} shown={s.shown} glowN={s.glowN} dark={world.dark} />}
        </FitBox>
      </div>
      <EquationBox g={g} per={per} value={s.boxValue} done={s.boxDone} show={s.showBox} dark={world.dark} short={short} bottomPx={boxBottomPx} />
    </>
  )
}

// ─── Interactive play surface (guided / practice) ─────────────────────────────────────
type Mode = 'guided' | 'practice'
const empty: StageState = { shown: 0, glowN: 0, boxValue: null, boxDone: false, showBox: false }
const groupWord = (world: MultWorld, view: View) => view === 'array' ? 'rows' : world.groupPlural
const sayFor = (world: MultWorld, d: MultRound) =>
  `${numberToWords(d.g)} ${groupWord(world, d.view)} of ${numberToWords(d.per)} ${d.item.many}. How many in all?`

const MultPlay: React.FC<{ data: MultRound; mode: Mode; onComplete: (correct: boolean) => void }> = ({ data, mode, onComplete }) => {
  const { w: world, g, per, answer } = data
  const choices = useMemo(() => multChoices(answer, g, per), [g, per, answer])
  const { w: vw, h: vh } = useViewport()
  const short = vh < 470
  // Capped at 92 — see the same note in StoryTime: the answer furniture was taking the band the
  // creatures needed in order to stand on the grass.
  const btn = Math.max(56, Math.min(92, Math.round(Math.min(vw / 8.8, vh / 5.2))))
  const [s, setS] = useState<StageState>(empty)
  const [asking, setAsking] = useState(false)
  const [picked, setPicked] = useState<number | null>(null)
  const erred = useRef(false), done = useRef(false)
  const set = (patch: Partial<StageState>) => setS(prev => ({ ...prev, ...patch }))

  useEffect(() => {
    const T: number[] = []
    let t = 300
    if (mode === 'guided') speak(sayFor(world, data))
    for (let i = 1; i <= g; i++) { const c = i; T.push(window.setTimeout(() => set({ shown: c }), t)); t += 380 }
    // The last pen has to be FULL before the answer is offered — derived from the creatures' own
    // gait, so a slow-walking cast is waited out rather than talked over.
    t += groupFillMs(data.item.img, itemPxFor(g, per, vw, vh, data.item.img, short), per) + 120
    T.push(window.setTimeout(() => { setAsking(true); set({ showBox: true }); speak('How many in all?') }, t))
    return () => T.forEach(id => window.clearTimeout(id))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function choose(n: number) {
    if (done.current || picked !== null || !asking) return
    setPicked(n)
    if (n === answer) {
      done.current = true
      if (mode === 'guided') speak('Yes! Let’s skip-count.')
      let k = 0
      const tick = () => {
        k++; set({ glowN: k, boxValue: k * per })
        if (k < g) window.setTimeout(tick, 460)
        else { set({ boxDone: true }); if (mode === 'guided') speak(`${numberToWords(g)} times ${numberToWords(per)} is ${numberToWords(answer)}!`) }
      }
      window.setTimeout(tick, 250)
      window.setTimeout(() => onComplete(mode === 'practice' ? !erred.current : true), g * 460 + 1500)
    } else {
      erred.current = true
      speak(`Not quite — count the ${groupWord(world, data.view)} of ${numberToWords(per)}. Try again!`)
      window.setTimeout(() => setPicked(null), 1100)
    }
  }

  return (
    <>
      {/* The equation + answer box clear the button row by construction - see EquationBox. */}
      <Stage world={world} data={data} s={s} short={short}
        boxBottomPx={(short ? Math.max(6, Math.round(btn * 0.14)) : vh * 0.035) + btn + 14} />
      {/* The ONLY question pill in this chapter — see makeMultBeat for why beat.prompt is empty. */}
      <div style={{ position: 'fixed', top: short ? 58 : 82, left: 0, right: 0, zIndex: 32, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
        <button onClick={() => speak(sayFor(world, data))} aria-label="Hear it again"
          style={{ maxWidth: 'min(88vw, 600px)', cursor: 'pointer', background: world.dark ? 'rgba(20,22,44,.82)' : 'rgba(255,255,255,.92)', border: `3px solid ${world.dark ? '#8fb4ff' : 'var(--outline)'}`, borderRadius: 18, padding: short ? '5px 14px' : '10px 18px',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: short ? 'clamp(12px,3.4vh,15px)' : 'clamp(15px,2.2vh,19px)', color: world.dark ? '#fff' : 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(61,37,22,.14)' }}>
          {g} {groupWord(world, data.view)} of {per} {data.item.many} — how many in all?
        </button>
      </div>
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: short ? Math.max(6, Math.round(btn * 0.14)) : '3.5%', zIndex: 33, display: 'flex', justifyContent: 'center', gap: short ? Math.round(btn * 0.24) : 'clamp(12px,3.5vw,30px)', flexWrap: 'wrap', padding: '0 12px',
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

// ─── Teaching demo (opening preview + 3-wrong re-teach): skip-count the groups via ONE speakSteps ─
const MultExplain: React.FC<{ data: MultRound; onDone: () => void }> = ({ data, onDone }) => {
  const { w: world, g, per, answer, item } = data
  const { h: vh } = useViewport()
  const short = vh < 470
  const [s, setS] = useState<StageState>(empty)
  const set = (patch: Partial<StageState>) => setS(prev => ({ ...prev, ...patch }))
  const doneRef = useRef(onDone); doneRef.current = onDone
  useEffect(() => {
    const lines: string[] = []
    const steps: Array<() => void> = []
    lines.push(`${numberToWords(g)} ${groupWord(world, data.view)} of ${numberToWords(per)} ${item.many}. Let’s skip-count!`)
    steps.push(() => set({ shown: 0, glowN: 0, showBox: true, boxValue: 0 }))
    for (let k = 1; k <= g; k++) { const v = k; lines.push(numberToWords(v * per)); steps.push(() => set({ shown: v, glowN: v, boxValue: v * per })) }
    lines.push(`${numberToWords(g)} times ${numberToWords(per)} is ${numberToWords(answer)}! ${numberToWords(answer)} ${item.many} in all.`)
    steps.push(() => set({ boxDone: true, glowN: g }))
    const cancel = speakSteps(lines, {
      onStep: (i) => { steps[i]?.() },
      onDone: () => { window.setTimeout(() => doneRef.current(), 1100) },
      fallbackStepMs: 1000,
    })
    return cancel
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <>
      <Stage world={world} data={data} s={s} short={short} />
      <div style={{ position: 'fixed', top: short ? 58 : 82, left: 0, right: 0, zIndex: 32, display: 'flex', justifyContent: 'center', padding: '0 12px', pointerEvents: 'none' }}>
        <div style={{ maxWidth: 'min(88vw, 600px)', background: world.dark ? 'rgba(20,22,44,.82)' : 'rgba(255,255,255,.92)', border: `3px solid ${world.dark ? '#8fb4ff' : 'var(--outline)'}`, borderRadius: 18, padding: short ? '5px 14px' : '10px 18px',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: short ? 'clamp(12px,3.4vh,15px)' : 'clamp(15px,2.2vh,19px)', color: world.dark ? '#fff' : 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(61,37,22,.14)' }}>
          {g} {groupWord(world, data.view)} of {per} {item.many}
        </div>
      </div>
    </>
  )
}

// ─── Value generation ──────────────────────────────────────────────────────────────
function makeMultBeat(): Beat<MultRound> {
  return {
    skillId: 'multiplication', rounds: SCORED_N, walkEvery: 3,
    make: (d, round = 0) => makeMultRound((d || 1) as 1 | 2 | 3, round),
    sig: d => `${d.g}x${d.per}|${d.view}`,   // dedupe on the MATH (factors + view), not the rotating scene/item
    // Deliberately EMPTY, so SkillBeat draws no pill of its own: the play surface renders the same
    // sentence, and at 640x320 the two landed on top of each other and neither could be read. The
    // chapter's own pill takes SkillBeat's tap-to-replay with it, so nothing is lost.
    prompt: () => '',
    say: d => sayFor(d.w, d),
    Play: ({ data, onSubmit }) => <MultPlay data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <MultExplain data={data} onDone={onDone} />,
  }
}

// ─── Orchestrator ──────────────────────────────────────────────────────────────────
const MD_CSS = `
@keyframes md_float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes md_pop { 0%{transform:scale(0);opacity:0} 70%{transform:scale(1.12);opacity:1} 100%{transform:scale(1);opacity:1} }
`
type Phase = 'intro' | 'demo' | 'guided' | 'practice'
export default function MarketDay({ onFinish, onExit }: {
  world?: string     // accepted for the /story route's shared signature; the chapter is one run
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
  const needsRotate = useNeedsRotate()
  // The SETTING is now part of the round, not a choice made before the chapter starts.
  const [scene, setScene] = useState<MultWorld>(SETTINGS[0])
  const [phase, setPhase] = useState<Phase>('intro')
  const [bg, setBg] = useState(0)
  const [demoIdx, setDemoIdx] = useState(0)
  const { exit, tally } = useChapterShell(onFinish, onExit)

  const interlude = useCallback(() => new Promise<void>(res => window.setTimeout(res, 850)), [])
  const beat = useMemo(() => makeMultBeat(), [])

  // The band is landscape-only. This early return must sit BELOW every hook — above one, turning
  // the phone changes the hook count and React tears the chapter into the error boundary.
  if (needsRotate) return <RotateGate line="Milo lays out his trays in landscape! 🐴" />

  // One of each view, each in a DIFFERENT setting — so the first thing a child learns is that the
  // place changes but the rule does not, which is also what the scored rounds then do.
  // Creatures come off the FRONT of the same ordered run the scored rounds read, rather than being
  // picked out of `items[]` by hand — by hand they landed on the same entries the scored rounds
  // then served again. Taking them from the plan is what makes "no creature twice" structural.
  const DEMO: MultRound[] = [
    { ...RUN[0], view: 'groups', g: 3, per: 2, answer: 6 },
    { ...RUN[1], view: 'array', g: 3, per: 4, answer: 12 },
  ]
  const GUIDED: MultRound = { ...RUN[DEMO_N], view: 'groups', g: 2, per: 3, answer: 6 }
  const shown = phase === 'practice' ? { w: scene, bg } : phase === 'guided' ? GUIDED : DEMO[Math.min(demoIdx, DEMO.length - 1)]

  const Banner = (text: string) => (
    <div style={{ position: 'absolute', top: 46, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
      <div style={{ background: 'var(--paper)', border: '3px solid var(--milo-orange)', borderRadius: 999, padding: '9px 22px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--milo-orange)', boxShadow: '0 4px 0 rgba(242,107,44,.25)', textAlign: 'center' }}>{text}</div>
    </div>
  )

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      <style>{CRITTER_CSS}{MD_CSS}</style>
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
            style={{ padding: '14px 38px', borderRadius: 50, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, boxShadow: '0 6px 16px rgba(242,107,44,.4)' }}>Let&apos;s count! ▶</button>
        </div>
      )}

      {phase === 'demo' && (<>{Banner(`Watch Milo skip-count  (${demoIdx + 1}/${DEMO.length})`)}
        <MultExplain key={`demo${demoIdx}`} data={DEMO[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} /></>)}

      {phase === 'guided' && (<>{Banner('Now you! Tap how many in all')}
        <MultPlay key="guided" data={GUIDED} mode="guided" onComplete={() => setPhase('practice')} /></>)}

      {phase === 'practice' && (
        <div style={{ position: 'absolute', top: 44, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
          <SkillBeat beat={beat} onInterlude={interlude}
            onRound={(data) => { if (data?.w) { setScene(data.w); setBg(data.bg) } }}
            onComplete={tally} />
        </div>
      )}

      {/* Milo belongs to the round's setting — chef in the bakery, painter at the craft table. */}
      <MiloHost left={10} milo={shown.w.milo} />
    </div>
  )
}
