'use client'
/**
 * /story — standalone preview of the story-mode chapters (the same experiences also
 * run inside the game via the chapter registry). Pick which one with `?ch=`, per the
 * PREVIEW table below; `?world=` jumps straight into a world where a chapter has them.
 *
 * Counting opens a WORLD PICKER (Nature / Farm / Space). Skip it + jump straight into
 * one with `?story=`:  /story?story=farm  ·  /story?story=space  ·  /story?story=nature
 *
 * This route renders each experience BARE — no portal, no progress sync, no celebration.
 * WHERE each experience lives is not repeated here: it comes from the one shared table in
 * `storyChapters.tsx`, which the registry builds its portal-wrapped chapters from too.
 */
import { useEffect, useState } from 'react'
import nextDynamic from 'next/dynamic'
import { type Chapter } from '@/features/chapters/story/ForestWalk'
import WorldSelect from '@/features/chapters/story/WorldSelect'
import { makeCountingChapter } from '@/features/chapters/story/chapters'
import { COUNTING_WORLDS, storytellingById } from '@/features/chapters/story/biomes'
import { STORY_CHAPTERS, type StorySkill } from '@/features/chapters/storyChapters'
import TasteBanner from '@/features/chapters/story/TasteBanner'

/**
 * `?ch=` → the chapter whose experience it previews. Several keys are historical and are
 * kept working because they are linked from elsewhere (`grocery` predates `home`; `race`
 * and `doors` predate `nest`).
 */
const PREVIEW: Record<string, StorySkill> = {
  // ── 3–5 ──
  order: 'numberOrdering', kitchen: 'numberComparison',
  nest: 'numberRecognition', race: 'numberRecognition', doors: 'numberRecognition',
  home: 'matchingQuantities', grocery: 'matchingQuantities',
  shapes: 'shapes', rainbow: 'colors', beads: 'patterns',
  add: 'addition', sub: 'subtraction', measure: 'measurement',
  // ── 6–8 ──
  numbers: 'numbersTo100', place: 'placeValue', skip: 'skipCounting', compare: 'compareNumbers',
  story: 'storyProblems', multiply: 'multiplication', fractions: 'fractions',
  money: 'money', time: 'time', add100: 'additionTo100', sub100: 'subtractionTo100',
  solids: 'shapes2d3d',
  // ── 9–11 — pre-teen "Number Lab" (Mission-HUD) look — single lab, no world picker ──
  bignum: 'bigNumbers', round: 'rounding', times: 'timesTables', divide: 'division',
  factors: 'factorsMultiples', fcompare: 'fractionsCompare', decimals: 'decimals',
  units: 'measurementUnits', area: 'areaPerimeter', angles: 'anglesSymmetry',
  data: 'dataGraphs', word: 'wordProblems',
}

// Lazy-load each heavy chapter view so only the selected chapter's JS ships, mirroring the
// registry. Built ONCE at module scope: `next/dynamic` called during render returns a new
// component identity every time, which remounts the chapter on every state change.
const VIEWS = Object.fromEntries(
  Object.entries(STORY_CHAPTERS).map(([skill, { load }]) => [skill, nextDynamic(load, { ssr: false })]),
) as Record<StorySkill, React.ComponentType<{ world?: string }>>

const ForestWalk = nextDynamic(() => import('@/features/chapters/story/ForestWalk'), { ssr: false })

export default function StoryPage() {
  const [ch, setCh] = useState('counting')
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [orderWorld, setOrderWorld] = useState<string | undefined>(undefined)
  const [ready, setReady] = useState(false)
  const [taste, setTaste] = useState(false)   // ?taste=1 → this is the logged-out free sample → show the sign-up banner
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setCh(params.get('ch') || 'counting')
    setOrderWorld(params.get('world') || undefined)   // ?world=… jumps into a world where the chapter has them
    setTaste(params.get('taste') === '1')
    // ?story= jumps straight into a journey; otherwise the world picker shows.
    const forced = storytellingById(params.get('story'))
    if (forced) setChapter(makeCountingChapter(forced))
    setReady(true)
  }, [])

  return <>{renderChapter()}{taste && <TasteBanner />}</>

  function renderChapter() {
    const skill = PREVIEW[ch]
    if (skill) { const View = VIEWS[skill]; return <View world={orderWorld} /> }
    // Counting: play the forced/chosen world, else show the picker.
    if (chapter) return <ForestWalk chapter={chapter} />
    if (!ready) return null
    return <WorldSelect title="Where shall we count today?" worlds={COUNTING_WORLDS}
      onPick={(id) => { const s = storytellingById(id); if (s) setChapter(makeCountingChapter(s)) }} />
  }
}
