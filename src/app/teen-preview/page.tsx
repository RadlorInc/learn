'use client'
// Dev-only: preview any teen chapter by id, e.g. /teen-preview?c=coordinatePlane
import { useEffect, useState } from 'react'
import nextDynamic from 'next/dynamic'
import TasteBanner from '@/components/story/TasteBanner'

const MAP: Record<string, React.ComponentType<{ onComplete: (c: number, w: number) => void; childName: string }>> = {
  integers: nextDynamic(() => import('@/components/game/IntegersChapter'), { ssr: false }),
  signedRationalOps: nextDynamic(() => import('@/components/game/SignedRationalOpsChapter'), { ssr: false }),
  rationalOps: nextDynamic(() => import('@/components/game/RationalOpsChapter'), { ssr: false }),
  ratioProportion: nextDynamic(() => import('@/components/game/RatioProportionChapter'), { ssr: false }),
  percentages: nextDynamic(() => import('@/components/game/PercentagesChapter'), { ssr: false }),
  exponentsRoots: nextDynamic(() => import('@/components/game/ExponentsRootsChapter'), { ssr: false }),
  orderOfOperations: nextDynamic(() => import('@/components/game/OrderOfOperationsChapter'), { ssr: false }),
  algebraicExpressions: nextDynamic(() => import('@/components/game/AlgebraicExpressionsChapter'), { ssr: false }),
  equationsInequalities: nextDynamic(() => import('@/components/game/EquationsInequalitiesChapter'), { ssr: false }),
  coordinatePlane: nextDynamic(() => import('@/components/game/CoordinatePlaneChapter'), { ssr: false }),
  linearRelationships: nextDynamic(() => import('@/components/game/LinearRelationshipsChapter'), { ssr: false }),
  geometryMeasurement: nextDynamic(() => import('@/components/game/GeometryMeasurementChapter'), { ssr: false }),
  // 15–16
  signedNumberFluency: nextDynamic(() => import('@/components/game/SignedNumberFluencyChapter'), { ssr: false }),
  expressionsVariables: nextDynamic(() => import('@/components/game/ExpressionsVariablesChapter'), { ssr: false }),
  linearEquationsInequalities: nextDynamic(() => import('@/components/game/LinearEquationsInequalitiesChapter'), { ssr: false }),
  slopeLinearGraphs: nextDynamic(() => import('@/components/game/SlopeLinearGraphsChapter'), { ssr: false }),
  functionsFamilies: nextDynamic(() => import('@/components/game/FunctionsFamiliesChapter'), { ssr: false }),
  systemsOfEquations: nextDynamic(() => import('@/components/game/SystemsOfEquationsChapter'), { ssr: false }),
  exponentsPolynomials: nextDynamic(() => import('@/components/game/ExponentsPolynomialsChapter'), { ssr: false }),
  radicalsPythagorean: nextDynamic(() => import('@/components/game/RadicalsPythagoreanChapter'), { ssr: false }),
  factoringPolynomials: nextDynamic(() => import('@/components/game/FactoringPolynomialsChapter'), { ssr: false }),
  quadraticsParabolas: nextDynamic(() => import('@/components/game/QuadraticsParabolasChapter'), { ssr: false }),
  geometryTransformations: nextDynamic(() => import('@/components/game/GeometryTransformationsChapter'), { ssr: false }),
  geometryProofTrig: nextDynamic(() => import('@/components/game/GeometryProofTrigChapter'), { ssr: false }),
  // 17–18
  functionToolkit: nextDynamic(() => import('@/components/game/FunctionToolkitChapter'), { ssr: false }),
  quadraticAnalysis: nextDynamic(() => import('@/components/game/QuadraticAnalysisChapter'), { ssr: false }),
  expLogFunctions: nextDynamic(() => import('@/components/game/ExpLogFunctionsChapter'), { ssr: false }),
  systemsMatrices: nextDynamic(() => import('@/components/game/SystemsMatricesChapter'), { ssr: false }),
  polynomialFunctions: nextDynamic(() => import('@/components/game/PolynomialFunctionsChapter'), { ssr: false }),
  rationalFunctions: nextDynamic(() => import('@/components/game/RationalFunctionsChapter'), { ssr: false }),
  complexNumbers: nextDynamic(() => import('@/components/game/ComplexNumbersChapter'), { ssr: false }),
  sequencesSeries: nextDynamic(() => import('@/components/game/SequencesSeriesChapter'), { ssr: false }),
  statsInference: nextDynamic(() => import('@/components/game/StatsInferenceChapter'), { ssr: false }),
  unitCircleTrig: nextDynamic(() => import('@/components/game/UnitCircleTrigChapter'), { ssr: false }),
  trigGraphsIdentities: nextDynamic(() => import('@/components/game/TrigGraphsIdentitiesChapter'), { ssr: false }),
  conicSections: nextDynamic(() => import('@/components/game/ConicSectionsChapter'), { ssr: false }),
  introCalculus: nextDynamic(() => import('@/components/game/IntroCalculusChapter'), { ssr: false }),
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
