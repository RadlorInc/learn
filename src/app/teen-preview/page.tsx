'use client'
// Dev-only: preview any teen chapter by id, e.g. /teen-preview?c=coordinatePlane
import { useEffect, useState } from 'react'
import nextDynamic from 'next/dynamic'
import TasteBanner from '@/features/chapters/story/TasteBanner'

const MAP: Record<string, React.ComponentType<{ onComplete: (c: number, w: number) => void; childName: string }>> = {
  integers: nextDynamic(() => import('@/features/chapters/game/IntegersChapter'), { ssr: false }),
  signedRationalOps: nextDynamic(() => import('@/features/chapters/game/SignedRationalOpsChapter'), { ssr: false }),
  rationalOps: nextDynamic(() => import('@/features/chapters/game/RationalOpsChapter'), { ssr: false }),
  ratioProportion: nextDynamic(() => import('@/features/chapters/game/RatioProportionChapter'), { ssr: false }),
  percentages: nextDynamic(() => import('@/features/chapters/game/PercentagesChapter'), { ssr: false }),
  exponentsRoots: nextDynamic(() => import('@/features/chapters/game/ExponentsRootsChapter'), { ssr: false }),
  orderOfOperations: nextDynamic(() => import('@/features/chapters/game/OrderOfOperationsChapter'), { ssr: false }),
  algebraicExpressions: nextDynamic(() => import('@/features/chapters/game/AlgebraicExpressionsChapter'), { ssr: false }),
  equationsInequalities: nextDynamic(() => import('@/features/chapters/game/EquationsInequalitiesChapter'), { ssr: false }),
  coordinatePlane: nextDynamic(() => import('@/features/chapters/game/CoordinatePlaneChapter'), { ssr: false }),
  linearRelationships: nextDynamic(() => import('@/features/chapters/game/LinearRelationshipsChapter'), { ssr: false }),
  geometryMeasurement: nextDynamic(() => import('@/features/chapters/game/GeometryMeasurementChapter'), { ssr: false }),
  // 15–16
  signedNumberFluency: nextDynamic(() => import('@/features/chapters/game/SignedNumberFluencyChapter'), { ssr: false }),
  expressionsVariables: nextDynamic(() => import('@/features/chapters/game/ExpressionsVariablesChapter'), { ssr: false }),
  linearEquationsInequalities: nextDynamic(() => import('@/features/chapters/game/LinearEquationsInequalitiesChapter'), { ssr: false }),
  slopeLinearGraphs: nextDynamic(() => import('@/features/chapters/game/SlopeLinearGraphsChapter'), { ssr: false }),
  functionsFamilies: nextDynamic(() => import('@/features/chapters/game/FunctionsFamiliesChapter'), { ssr: false }),
  systemsOfEquations: nextDynamic(() => import('@/features/chapters/game/SystemsOfEquationsChapter'), { ssr: false }),
  exponentsPolynomials: nextDynamic(() => import('@/features/chapters/game/ExponentsPolynomialsChapter'), { ssr: false }),
  radicalsPythagorean: nextDynamic(() => import('@/features/chapters/game/RadicalsPythagoreanChapter'), { ssr: false }),
  factoringPolynomials: nextDynamic(() => import('@/features/chapters/game/FactoringPolynomialsChapter'), { ssr: false }),
  quadraticsParabolas: nextDynamic(() => import('@/features/chapters/game/QuadraticsParabolasChapter'), { ssr: false }),
  geometryTransformations: nextDynamic(() => import('@/features/chapters/game/GeometryTransformationsChapter'), { ssr: false }),
  geometryProofTrig: nextDynamic(() => import('@/features/chapters/game/GeometryProofTrigChapter'), { ssr: false }),
  // 17–18
  functionToolkit: nextDynamic(() => import('@/features/chapters/game/FunctionToolkitChapter'), { ssr: false }),
  quadraticAnalysis: nextDynamic(() => import('@/features/chapters/game/QuadraticAnalysisChapter'), { ssr: false }),
  expLogFunctions: nextDynamic(() => import('@/features/chapters/game/ExpLogFunctionsChapter'), { ssr: false }),
  systemsMatrices: nextDynamic(() => import('@/features/chapters/game/SystemsMatricesChapter'), { ssr: false }),
  polynomialFunctions: nextDynamic(() => import('@/features/chapters/game/PolynomialFunctionsChapter'), { ssr: false }),
  rationalFunctions: nextDynamic(() => import('@/features/chapters/game/RationalFunctionsChapter'), { ssr: false }),
  complexNumbers: nextDynamic(() => import('@/features/chapters/game/ComplexNumbersChapter'), { ssr: false }),
  sequencesSeries: nextDynamic(() => import('@/features/chapters/game/SequencesSeriesChapter'), { ssr: false }),
  statsInference: nextDynamic(() => import('@/features/chapters/game/StatsInferenceChapter'), { ssr: false }),
  unitCircleTrig: nextDynamic(() => import('@/features/chapters/game/UnitCircleTrigChapter'), { ssr: false }),
  trigGraphsIdentities: nextDynamic(() => import('@/features/chapters/game/TrigGraphsIdentitiesChapter'), { ssr: false }),
  conicSections: nextDynamic(() => import('@/features/chapters/game/ConicSectionsChapter'), { ssr: false }),
  introCalculus: nextDynamic(() => import('@/features/chapters/game/IntroCalculusChapter'), { ssr: false }),
}

export default function TeenPreviewPage() {
  const [c, setC] = useState('integers')
  const [taste, setTaste] = useState(false)   // ?taste=1 → logged-out free sample from the diagnostic
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setC(p.get('c') || 'integers')
    setTaste(p.get('taste') === '1')
  }, [])
  const Chapter = MAP[c]
  if (!Chapter) return <div style={{ padding: 24, fontFamily: 'sans-serif' }}>Unknown chapter: {c}</div>
  return <>{<Chapter onComplete={() => {}} childName="Sam" />}{taste && <TasteBanner />}</>
}
