'use client'
export const dynamic = 'force-static'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, Suspense } from 'react'
import nextDynamic from 'next/dynamic'
import { useMiloStore, type ChapterType } from '@/state/store'
import { getChapter, type AgeGroup } from '@/core/chapters'

import { getActiveLearner } from '@/data/supabase/useLearnerSession'
import { setLastPlayed } from '@/infra/storage/lastPlayed'
import { advancePlan } from '@/infra/storage/activePlan'
import CelebrationModal from '@/shared/ui/CelebrationModal'
import MiloPointer from '@/shared/ui/MiloPointer'
import { useChapterSync } from '@/data/supabase/useChapterSync'
import { useAuthGuard } from '@/data/supabase/useAuthGuard'
import { track } from '@/infra/analytics'

// Maps each chapter id to its component. The set of chapters lives in the
// registry (src/lib/chapters.ts); this map only wires ids → components, so a
// new chapter needs one line here. TypeScript's Record enforces completeness.
type ChapterProps = { onComplete: (correct: number, wrong: number, mastered?: boolean) => void; childName: string }
const lazyChapter = (loader: () => Promise<{ default: React.ComponentType<ChapterProps> }>) =>
  nextDynamic(loader, { ssr: false })

const CHAPTER_COMPONENTS: Record<ChapterType, React.ComponentType<ChapterProps>> = {
  counting:           lazyChapter(() => import('@/features/chapters/game/CountingStoryChapter')),
  numberOrdering:     lazyChapter(() => import('@/features/chapters/game/NumberOrderingChapter')),
  numberRecognition:  lazyChapter(() => import('@/features/chapters/game/NumberDoorsChapter')),
  matchingQuantities: lazyChapter(() => import('@/features/chapters/game/MatchingQuantitiesChapter')),
  numberComparison:   lazyChapter(() => import('@/features/chapters/game/NumberComparisonChapter')),
  shapes:             lazyChapter(() => import('@/features/chapters/game/ShapeHouseChapter')),
  colors:             lazyChapter(() => import('@/features/chapters/game/ColorGardenChapter')),
  patterns:           lazyChapter(() => import('@/features/chapters/game/PatternsChapter')),
  addition:           lazyChapter(() => import('@/features/chapters/game/AdditionChapter')),
  subtraction:        lazyChapter(() => import('@/features/chapters/game/SubtractionChapter')),
  measurement:        lazyChapter(() => import('@/features/chapters/game/MeasurementChapter')),
  numbersTo100:       lazyChapter(() => import('@/features/chapters/game/Numbers100Chapter')),
  placeValue:         lazyChapter(() => import('@/features/chapters/game/PlaceValueChapter')),
  skipCounting:       lazyChapter(() => import('@/features/chapters/game/SkipCountingChapter')),
  storyProblems:      lazyChapter(() => import('@/features/chapters/game/StoryProblemsChapter')),
  multiplication:     lazyChapter(() => import('@/features/chapters/game/MultiplicationChapter')),
  fractions:          lazyChapter(() => import('@/features/chapters/game/FractionsChapter')),
  money:              lazyChapter(() => import('@/features/chapters/game/MoneyChapter')),
  time:               lazyChapter(() => import('@/features/chapters/game/TimeChapter')),
  compareNumbers:     lazyChapter(() => import('@/features/chapters/game/CompareChapter')),
  additionTo100:      lazyChapter(() => import('@/features/chapters/game/ArithmeticChapter').then(m => ({ default: m.AdditionTo100Chapter }))),
  subtractionTo100:   lazyChapter(() => import('@/features/chapters/game/ArithmeticChapter').then(m => ({ default: m.SubtractionTo100Chapter }))),
  shapes2d3d:         lazyChapter(() => import('@/features/chapters/game/Shapes2D3DChapter')),
  // 9–11
  bigNumbers:         lazyChapter(() => import('@/features/chapters/game/BigNumbersChapter')),
  rounding:           lazyChapter(() => import('@/features/chapters/game/RoundingChapter')),
  timesTables:        lazyChapter(() => import('@/features/chapters/game/TimesTablesChapter')),
  division:           lazyChapter(() => import('@/features/chapters/game/DivisionChapter')),
  factorsMultiples:   lazyChapter(() => import('@/features/chapters/game/FactorsChapter')),
  fractionsCompare:   lazyChapter(() => import('@/features/chapters/game/FractionsCompareChapter')),
  decimals:           lazyChapter(() => import('@/features/chapters/game/DecimalsChapter')),
  measurementUnits:   lazyChapter(() => import('@/features/chapters/game/MeasureUnitsChapter')),
  areaPerimeter:      lazyChapter(() => import('@/features/chapters/game/AreaPerimeterChapter')),
  anglesSymmetry:     lazyChapter(() => import('@/features/chapters/game/AnglesSymmetryChapter')),
  dataGraphs:         lazyChapter(() => import('@/features/chapters/game/DataGraphsChapter')),
  wordProblems:       lazyChapter(() => import('@/features/chapters/game/WordProblemsChapter')),
  // 12–14 (teen "Field Lab")
  integers:             lazyChapter(() => import('@/features/chapters/game/IntegersChapter')),
  signedRationalOps:    lazyChapter(() => import('@/features/chapters/game/SignedRationalOpsChapter')),
  rationalOps:          lazyChapter(() => import('@/features/chapters/game/RationalOpsChapter')),
  ratioProportion:      lazyChapter(() => import('@/features/chapters/game/RatioProportionChapter')),
  percentages:          lazyChapter(() => import('@/features/chapters/game/PercentagesChapter')),
  exponentsRoots:       lazyChapter(() => import('@/features/chapters/game/ExponentsRootsChapter')),
  orderOfOperations:    lazyChapter(() => import('@/features/chapters/game/OrderOfOperationsChapter')),
  algebraicExpressions: lazyChapter(() => import('@/features/chapters/game/AlgebraicExpressionsChapter')),
  equationsInequalities:lazyChapter(() => import('@/features/chapters/game/EquationsInequalitiesChapter')),
  coordinatePlane:      lazyChapter(() => import('@/features/chapters/game/CoordinatePlaneChapter')),
  linearRelationships:  lazyChapter(() => import('@/features/chapters/game/LinearRelationshipsChapter')),
  geometryMeasurement:  lazyChapter(() => import('@/features/chapters/game/GeometryMeasurementChapter')),
  // 15–16 (Algebra I + Geometry)
  signedNumberFluency:        lazyChapter(() => import('@/features/chapters/game/SignedNumberFluencyChapter')),
  expressionsVariables:       lazyChapter(() => import('@/features/chapters/game/ExpressionsVariablesChapter')),
  linearEquationsInequalities: lazyChapter(() => import('@/features/chapters/game/LinearEquationsInequalitiesChapter')),
  slopeLinearGraphs:          lazyChapter(() => import('@/features/chapters/game/SlopeLinearGraphsChapter')),
  functionsFamilies:          lazyChapter(() => import('@/features/chapters/game/FunctionsFamiliesChapter')),
  systemsOfEquations:         lazyChapter(() => import('@/features/chapters/game/SystemsOfEquationsChapter')),
  exponentsPolynomials:       lazyChapter(() => import('@/features/chapters/game/ExponentsPolynomialsChapter')),
  radicalsPythagorean:        lazyChapter(() => import('@/features/chapters/game/RadicalsPythagoreanChapter')),
  factoringPolynomials:       lazyChapter(() => import('@/features/chapters/game/FactoringPolynomialsChapter')),
  quadraticsParabolas:        lazyChapter(() => import('@/features/chapters/game/QuadraticsParabolasChapter')),
  geometryTransformations:    lazyChapter(() => import('@/features/chapters/game/GeometryTransformationsChapter')),
  geometryProofTrig:          lazyChapter(() => import('@/features/chapters/game/GeometryProofTrigChapter')),
  // 17–18 (Algebra II / Pre-Calc / Statistics / intro Calculus)
  functionToolkit:      lazyChapter(() => import('@/features/chapters/game/FunctionToolkitChapter')),
  quadraticAnalysis:    lazyChapter(() => import('@/features/chapters/game/QuadraticAnalysisChapter')),
  polynomialFunctions:  lazyChapter(() => import('@/features/chapters/game/PolynomialFunctionsChapter')),
  complexNumbers:       lazyChapter(() => import('@/features/chapters/game/ComplexNumbersChapter')),
  rationalFunctions:    lazyChapter(() => import('@/features/chapters/game/RationalFunctionsChapter')),
  expLogFunctions:      lazyChapter(() => import('@/features/chapters/game/ExpLogFunctionsChapter')),
  unitCircleTrig:       lazyChapter(() => import('@/features/chapters/game/UnitCircleTrigChapter')),
  trigGraphsIdentities: lazyChapter(() => import('@/features/chapters/game/TrigGraphsIdentitiesChapter')),
  conicSections:        lazyChapter(() => import('@/features/chapters/game/ConicSectionsChapter')),
  systemsMatrices:      lazyChapter(() => import('@/features/chapters/game/SystemsMatricesChapter')),
  sequencesSeries:      lazyChapter(() => import('@/features/chapters/game/SequencesSeriesChapter')),
  statsInference:       lazyChapter(() => import('@/features/chapters/game/StatsInferenceChapter')),
  introCalculus:        lazyChapter(() => import('@/features/chapters/game/IntroCalculusChapter')),
}

// Teen chapters render their own full-screen portal + MasteryState completion, so
// the kids' CelebrationModal (which also auto-speaks) must NOT mount for them.
const TEEN_AGE_GROUPS: AgeGroup[] = ['12-14', '15-16', '17-18']
const isTeenChapter = (id: ChapterType | null) =>
  !!id && (getChapter(id)?.ageGroups ?? []).some(g => TEEN_AGE_GROUPS.includes(g))

export default function GamePage() {
  const router         = useRouter()
  const authed         = useAuthGuard()
  const profile        = useMiloStore(s => s.profile)
  const currentChapter = useMiloStore(s => s.currentChapter)
  const celebration    = useMiloStore(s => s.celebration)
  const { finishAndSync, flushQueue } = useChapterSync()

  const [playingChapter,  setPlayingChapter]  = useState(currentChapter)
  const [chapterDone,    setChapterDone]    = useState(false)
  const [ready,          setReady]          = useState(false)
  const [childName,      setChildName]      = useState(profile.childName)

  // ── Fit-to-screen: scale the chapter as large as possible while still fitting
  // the viewport, so it's BIG but never scrolls. Recomputes on resize / content
  // change. MAX caps how large; it shrinks below 1 only on very short screens.
  const fitRef = useRef<HTMLDivElement>(null)
  // Guards against a chapter firing onComplete twice (double-tap / re-render):
  // a second call would double-count XP, coins and stars both locally and via
  // sync. Reset when a new chapter opens.
  const completedRef = useRef(false)
  const zoomRef = useRef(1)
  const [zoom, setZoom] = useState(1)
  // The chapter's themed background, painted across the whole stage so the color
  // fills the screen even when the (centered) content is narrower/shorter than it.
  const [stageBg, setStageBg] = useState<{ backgroundColor: string; backgroundImage: string }>({ backgroundColor: 'var(--bg-page)', backgroundImage: 'none' })
  useEffect(() => {
    const MIN = 0.5, PAD = 0.985
    function measure() {
      const wrap = fitRef.current
      const content = wrap?.firstElementChild as HTMLElement | null
      if (!wrap || !content) return
      // Lessons are full-height (nav pinned top, canvas centered, ScaleToFill grows
      // the content) — they aren't zoom-scaled. Only practice chapters are scaled.
      if (content.classList.contains('milo-lesson')) {
        if (zoomRef.current !== 1) { zoomRef.current = 1; setZoom(1) }
        const csL = getComputedStyle(content)
        if (csL.backgroundColor !== stageBg.backgroundColor || csL.backgroundImage !== stageBg.backgroundImage) {
          setStageBg({ backgroundColor: csL.backgroundColor, backgroundImage: csL.backgroundImage })
        }
        return
      }
      const MAX = 1.45
      // Rendered size (includes the current zoom). The relative step converges to
      // "fit the viewport" in one tick regardless of how zoom affects measurement.
      const r = content.getBoundingClientRect()
      if (!r.height || !r.width) return
      const cur = zoomRef.current || 1
      const factor = Math.min((window.innerWidth * PAD) / r.width, (window.innerHeight * PAD) / r.height)
      const next = Math.max(MIN, Math.min(MAX, cur * factor))
      if (Math.abs(next - cur) > 0.01) { zoomRef.current = next; setZoom(next) }
      // Mirror the chapter's background onto the full-screen stage.
      const cs = getComputedStyle(content)
      if (cs.backgroundColor !== stageBg.backgroundColor || cs.backgroundImage !== stageBg.backgroundImage) {
        setStageBg({ backgroundColor: cs.backgroundColor, backgroundImage: cs.backgroundImage })
      }
    }
    measure()
    const id = window.setInterval(measure, 150)   // re-reads firstElementChild → handles round/phase swaps
    window.addEventListener('resize', measure)
    return () => { window.clearInterval(id); window.removeEventListener('resize', measure) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const learner = getActiveLearner()
    if (learner) {
      setChildName(learner.display_name)
      // Save last played chapter for resume flow (timestamped; reconciled with
      // the server on the menu so "Continue" syncs across devices).
      if (currentChapter) setLastPlayed(learner.id, currentChapter)
    }
    if (navigator.onLine) flushQueue()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (currentChapter) {
      setPlayingChapter(currentChapter)
      track('chapter_open', { chapter: currentChapter })
      setChapterDone(false)
      completedRef.current = false
      setReady(true)
      return
    }

    if (!celebration) {
      router.replace('/menu')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChapter])

  async function handleComplete(correct: number, wrong: number, mastered?: boolean) {
    if (!playingChapter) return
    if (completedRef.current) return   // ignore a double-fired completion
    completedRef.current = true
    setChapterDone(true)
    track('practice_complete', { chapter: playingChapter, correct, wrong })
    // Works offline — queues locally (IndexedDB via kv) if no network.
    // `mastered` (early finish at the top tier) forces the full 3 stars.
    await finishAndSync(playingChapter, correct, wrong, 'practice', mastered)
    // Step 7: if this was the child's current diagnostic-plan chapter, advance the pointer so the
    // menu's "Continue your plan" card moves to the next one.
    const learner = getActiveLearner()
    if (learner) advancePlan(learner.id, playingChapter)
  }

  if (!ready && !playingChapter) return null

  const props = { onComplete: handleComplete, childName: childName || profile.childName }

  if (authed === 'checking') return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FCEAB6', fontSize: 48 }}>🦊</div>
  )

  return (
    <>
    {/* Full-screen stage: holds the background and clips so nothing scrolls. The
        chapter is centered-at-top and scaled by the fit controller. */}
    <div className="kit-screen" style={{ backgroundColor: stageBg.backgroundColor, backgroundImage: stageBg.backgroundImage, position: 'fixed', inset: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div ref={fitRef} className="game-zoom" style={{ width: 'min(100vw, 680px)', ['--game-zoom' as any]: zoom } as React.CSSProperties}>
        {/* GameTopbar is rendered inside each chapter component */}
        {!chapterDone && playingChapter && (() => {
          const Chapter = CHAPTER_COMPONENTS[playingChapter]
          return Chapter ? (
            <Suspense fallback={null}>
              <Chapter {...props} />
            </Suspense>
          ) : null
        })()}
      </div>
    </div>
    {/* Modal + pointer live OUTSIDE the zoom wrapper so they stay full-screen and
        their fixed coords aren't double-scaled. The counting story renders its own
        celebration over the forest, so we skip the global one there. */}
    {playingChapter !== 'counting' && !isTeenChapter(playingChapter) && <CelebrationModal />}
    <MiloPointer />
    </>
  )
}