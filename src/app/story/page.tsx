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
  bignum: 'bigNumbers', round: 'rounding',
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

/** What an unknown `?ch=` gets. A dev preview route, so it lists the keys that DO work — that is
 *  the useful thing to say, and deriving it means it stays true for free. */
const Missing = ({ ch }: { ch: string }) => (
  <main style={{
    minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24,
    background: '#f6efe1', color: 'var(--ink, #3d2516)', fontFamily: 'var(--font-display)',
  }}>
    <div style={{ maxWidth: 620, textAlign: 'center' }}>
      <div style={{ fontSize: 44 }} aria-hidden>🗺️</div>
      <h1 style={{ fontSize: 24, fontWeight: 900, margin: '10px 0 6px' }}>
        There is no chapter called “{ch}”.
      </h1>
      <p style={{ margin: '0 0 18px', opacity: .75, lineHeight: 1.45 }}>
        It may have been removed, or the link may be old. Nothing has been lost — pick one below.
      </p>
      <p style={{
        fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 13, lineHeight: 1.9,
        wordBreak: 'break-word', opacity: .8,
      }}>
        {['counting', ...Object.keys(PREVIEW)].sort().map((k, i) => (
          <span key={k}>{i ? ' · ' : ''}<a href={`/story?ch=${k}`} style={{ color: 'inherit' }}>{k}</a></span>
        ))}
      </p>
    </div>
  </main>
)

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
    if (!ready) return null
    /**
     * ⚠️ AN UNKNOWN `?ch=` SAYS SO RATHER THAN FALLING THROUGH TO COUNTING. It used to land on the
     * counting picker, which reads as "that chapter is fine" — and the case that actually produces
     * one is a chapter that has been REMOVED (`divide` and `times`, 2026-08-13), where quietly
     * showing a different chapter is the worst possible answer.
     *
     * ⚠️ THE LIST IS DERIVED FROM `PREVIEW`, never typed out, so it cannot rot as chapters come and
     * go — which is the whole reason this is worth having rather than a sentence naming the two.
     */
    if (ch !== 'counting') return <Missing ch={ch} />
    // Counting: play the forced/chosen world, else show the picker.
    if (chapter) return <ForestWalk chapter={chapter} />
    return <WorldSelect title="Where shall we count today?" worlds={COUNTING_WORLDS}
      onPick={(id) => { const s = storytellingById(id); if (s) setChapter(makeCountingChapter(s)) }} />
  }
}
