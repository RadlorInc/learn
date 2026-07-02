'use client'
/**
 * /story — standalone preview of the story-mode chapters (the same experiences also
 * run inside the game via their chapter wrappers). Pick which one with `?ch=`:
 *   /story            → Counting    (forest walk)        [default]
 *   /story?ch=order   → Number Order (river crossing)
 *   /story?ch=kitchen → Comparison   (kitchen)
 *   /story?ch=doors   → Recognition  (number doors)
 *   /story?ch=grocery → Matching qty (little grocery)
 *   /story?ch=shapes  → Shapes       (shape town walk)
 *   /story?ch=rainbow → Colours      (rainbow town walk)
 *   /story?ch=beads   → Patterns     (bead shop)
 *
 * Counting opens a WORLD PICKER (Nature / Farm / Space). Skip it + jump straight into
 * one with `?story=`:  /story?story=farm  ·  /story?story=space  ·  /story?story=nature
 */
import { useEffect, useState } from 'react'
import ForestWalk from '@/components/story/ForestWalk'
import { type Chapter } from '@/components/story/ForestWalk'
import WorldSelect from '@/components/story/WorldSelect'
import { makeCountingChapter } from '@/components/story/chapters'
import { STORYTELLINGS, BIOMES, storytellingById } from '@/components/story/biomes'
import RiverCrossing from '@/components/story/RiverCrossing'
import Kitchen from '@/components/story/Kitchen'
import NumberDoors from '@/components/story/NumberDoors'
import Grocery from '@/components/story/Grocery'
import ShapeTown from '@/components/story/ShapeTown'
import RainbowTown from '@/components/story/RainbowTown'
import BeadShop from '@/components/story/BeadShop'
import Orchard from '@/components/story/Orchard'
import LilyPond from '@/components/story/LilyPond'
import TallForest from '@/components/story/TallForest'
import NumberTown from '@/components/story/NumberTown'
import BuildingBlocks from '@/components/story/BuildingBlocks'
import HopAlong from '@/components/story/HopAlong'
import SeesawPark from '@/components/story/SeesawPark'
import StoryTime from '@/components/story/StoryTime'
import MarketDay from '@/components/story/MarketDay'
import SliceShop from '@/components/story/SliceShop'
import CoinShop from '@/components/story/CoinShop'
import TickTock from '@/components/story/TickTock'
import BlockYard from '@/components/story/BlockYard'
import ShapeStudio from '@/components/story/ShapeStudio'
import NumberVault from '@/components/story/NumberVault'
import RoundingTrail from '@/components/story/RoundingTrail'
import TimesGrid from '@/components/story/TimesGrid'
import DivisionShare from '@/components/story/DivisionShare'
import FactorLab from '@/components/story/FactorLab'
import FractionForge from '@/components/story/FractionForge'
import DecimalGrid from '@/components/story/DecimalGrid'
import UnitConverter from '@/components/story/UnitConverter'
import GridPlotter from '@/components/story/GridPlotter'
import AngleScope from '@/components/story/AngleScope'
import DataDeck from '@/components/story/DataDeck'
import MissionBrief from '@/components/story/MissionBrief'

export default function StoryPage() {
  const [ch, setCh] = useState('counting')
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [orderWorld, setOrderWorld] = useState<string | undefined>(undefined)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setCh(params.get('ch') || 'counting')
    setOrderWorld(params.get('world') || undefined)   // ?world=river|train|sky jumps into an ordering world
    // ?story= jumps straight into a journey; otherwise the world picker shows.
    const forced = storytellingById(params.get('story'))
    if (forced) setChapter(makeCountingChapter(forced))
    setReady(true)
  }, [])

  if (ch === 'order') return <RiverCrossing world={orderWorld} />
  // ?world=kitchen|grocery|bakery jumps into a comparison world.
  if (ch === 'kitchen') return <Kitchen world={orderWorld} />
  // ?world=doors|balloons|buses jumps into a recognition world.
  if (ch === 'doors') return <NumberDoors world={orderWorld} />
  if (ch === 'grocery') return <Grocery world={orderWorld} />
  // ?world=town|fair|beach jumps into a shape world.
  if (ch === 'shapes') return <ShapeTown world={orderWorld} />
  // ?world=town|reef|candy jumps into a colour world.
  if (ch === 'rainbow') return <RainbowTown world={orderWorld} />
  // ?world=beads|party|train jumps into a pattern world.
  if (ch === 'beads') return <BeadShop world={orderWorld} />
  // ?world=orchard|reef|space jumps into an addition world.
  if (ch === 'add') return <Orchard world={orderWorld} />
  // ?world=pond|party|night jumps into a subtraction world.
  if (ch === 'sub') return <LilyPond world={orderWorld} />
  // ?world=forest|trail|market jumps into a measurement world.
  if (ch === 'measure') return <TallForest world={orderWorld} />
  // ── 6–8 ──
  // ?world=town|train|space jumps into a numbers-to-100 world.
  if (ch === 'numbers') return <NumberTown world={orderWorld} />
  if (ch === 'place') return <BuildingBlocks world={orderWorld} />
  if (ch === 'skip') return <HopAlong world={orderWorld} />
  if (ch === 'compare') return <SeesawPark world={orderWorld} />
  // ?world=picnic|reef|fair jumps into a story-problems world.
  if (ch === 'story') return <StoryTime world={orderWorld} />
  // ?world=bakery|garden|craft jumps into a multiplication world.
  if (ch === 'multiply') return <MarketDay world={orderWorld} />
  // ?world=pizza|party|choc jumps into a fractions world.
  if (ch === 'fractions') return <SliceShop world={orderWorld} />
  // ?world=grocery|train|beach jumps into a money world.
  if (ch === 'money') return <CoinShop world={orderWorld} />
  // ?world=morning|afternoon|night jumps into a time world.
  if (ch === 'time') return <TickTock world={orderWorld} />
  // ?world=orchard|eggranch|cookiejar jumps into an add-to-100 world.
  if (ch === 'add100') return <BlockYard op="+" world={orderWorld} />
  // ?world=starlab|meadow|fishdock jumps into a subtract-to-100 world.
  if (ch === 'sub100') return <BlockYard op="-" world={orderWorld} />
  // ?world=studio|build|playroom jumps into a shapes 2D/3D world.
  if (ch === 'solids') return <ShapeStudio world={orderWorld} />
  // ── 9–11 — pre-teen "Number Lab" (Mission-HUD) look — single lab, no world picker ──
  if (ch === 'bignum') return <NumberVault />
  if (ch === 'round') return <RoundingTrail />
  if (ch === 'times') return <TimesGrid />
  if (ch === 'divide') return <DivisionShare />
  if (ch === 'factors') return <FactorLab />
  if (ch === 'fcompare') return <FractionForge />
  if (ch === 'decimals') return <DecimalGrid />
  if (ch === 'units') return <UnitConverter />
  if (ch === 'area') return <GridPlotter />
  if (ch === 'angles') return <AngleScope />
  if (ch === 'data') return <DataDeck />
  if (ch === 'word') return <MissionBrief />
  // Counting: play the forced/chosen world, else show the picker.
  if (chapter) return <ForestWalk chapter={chapter} />
  if (!ready) return null
  const worlds = STORYTELLINGS.map(s => ({ id: s.id, label: s.label, emoji: s.emoji, bgImage: BIOMES[s.biomes[0]].bgImage }))
  return <WorldSelect title="Where shall we count today?" worlds={worlds} onPick={(id) => { const s = storytellingById(id); if (s) setChapter(makeCountingChapter(s)) }} />
}
