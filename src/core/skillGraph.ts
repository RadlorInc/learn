/**
 * Milo Skill Graph — the unified 3→18 prerequisite graph that powers the diagnostic.
 *
 * SOURCE OF TRUTH (like chapters.ts). The diagnostic probe reads this in-code; the DB stores
 * only diagnostic *results* (see supabase migration ..._diagnostic_engine_schema.sql), keyed
 * by the string skill ids below. Human-readable companion + rationale: docs/skill-graph.md.
 *
 * STATUS: v0.9 DRAFT — prerequisite edges are pedagogical claims pending teacher validation
 * (docs/skill-graph-validation.md). A wrong edge = a wrong root gap. Do not ship the guarantee
 * on a band until that band's spine edges are validated.
 *
 * Granularity ≈ one chapter; split only where a chapter bundles skills at different prereq
 * depths (e.g. timesTables → multFacts + multMultiDigit). `chapter` maps to chapters.ts ids.
 */

export type Band = '3-5' | '6-8' | '9-11' | '12-14' | '15-16' | '17-18'

export interface SkillNode {
  id: string
  band: Band
  label: string
  chapter: string      // chapters.ts id — the remediation unit for this skill
  prereqs: string[]     // direct prerequisite skill ids (may cross bands)
}

export const SKILL_NODES: SkillNode[] = [
  // ── Band 3–5 · Early number sense (readiness) ──────────────────────────────
  { id: 'e.counting10',    band: '3-5', label: 'Count to 10 (one-to-one)',   chapter: 'counting',           prereqs: [] },
  { id: 'e.numeralRecog',  band: '3-5', label: 'Recognize & name numerals',  chapter: 'numberRecognition',  prereqs: [] },
  { id: 'e.matchQty',      band: '3-5', label: 'Match numeral ↔ quantity',   chapter: 'matchingQuantities', prereqs: ['e.counting10', 'e.numeralRecog'] },
  { id: 'e.numberOrder',   band: '3-5', label: 'Order numbers',              chapter: 'numberOrdering',     prereqs: ['e.counting10'] },
  { id: 'e.compare',       band: '3-5', label: 'More / less / equal',        chapter: 'numberComparison',   prereqs: ['e.matchQty'] },
  { id: 'e.addWithin10',   band: '3-5', label: 'Join groups (add ≤10)',      chapter: 'addition',           prereqs: ['e.counting10', 'e.matchQty'] },
  { id: 'e.subWithin10',   band: '3-5', label: 'Take away (sub ≤10)',        chapter: 'subtraction',        prereqs: ['e.addWithin10'] },
  { id: 'e.shapes2d',      band: '3-5', label: 'Recognize 2D shapes',        chapter: 'shapes',             prereqs: [] },
  { id: 'e.patterns',      band: '3-5', label: 'Repeating patterns',         chapter: 'patterns',           prereqs: [] },
  { id: 'e.colors',        band: '3-5', label: 'Colors (non-math)',          chapter: 'colors',             prereqs: [] },
  { id: 'e.measureCompare',band: '3-5', label: 'Compare size/length/weight', chapter: 'measurement',        prereqs: ['e.compare'] },

  // ── Band 6–8 · Primary ─────────────────────────────────────────────────────
  { id: 'p.numbersTo100',  band: '6-8', label: 'Read/write numbers to 100',  chapter: 'numbersTo100',       prereqs: ['e.counting10'] },
  { id: 'p.placeValue2',   band: '6-8', label: 'Tens & ones',                chapter: 'placeValue',         prereqs: ['p.numbersTo100'] },
  { id: 'p.compare100',    band: '6-8', label: 'Compare to 100',             chapter: 'compareNumbers',     prereqs: ['p.placeValue2'] },
  { id: 'p.skipCount',     band: '6-8', label: 'Skip count 2s/5s/10s',       chapter: 'skipCounting',       prereqs: ['e.counting10'] },
  { id: 'p.addTo100',      band: '6-8', label: 'Add within 100 (regroup)',   chapter: 'additionTo100',      prereqs: ['p.placeValue2', 'e.addWithin10'] },
  { id: 'p.subTo100',      band: '6-8', label: 'Subtract within 100',        chapter: 'subtractionTo100',   prereqs: ['p.addTo100'] },
  { id: 'p.multConcept',   band: '6-8', label: 'Multiply as equal groups',   chapter: 'multiplication',     prereqs: ['p.skipCount'] },
  { id: 'p.fractionsIntro',band: '6-8', label: 'Unit fractions / equal parts',chapter: 'fractions',         prereqs: ['p.numbersTo100'] },
  { id: 'p.wordProbAddSub',band: '6-8', label: '1-step add/sub story problems',chapter: 'storyProblems',    prereqs: ['p.addTo100', 'p.subTo100'] },
  { id: 'p.money',         band: '6-8', label: 'Money & coins',              chapter: 'money',              prereqs: ['p.skipCount', 'p.addTo100'] },
  { id: 'p.time',          band: '6-8', label: 'Telling time',               chapter: 'time',               prereqs: ['p.skipCount'] },
  { id: 'p.shapes2d3d',    band: '6-8', label: '2D/3D shapes & attributes',  chapter: 'shapes2d3d',         prereqs: ['e.shapes2d'] },

  // ── Band 9–11 · Intermediate (remediation core) ────────────────────────────
  { id: 'i.bigNumbers',    band: '9-11', label: 'Place value to 10,000+',    chapter: 'bigNumbers',         prereqs: ['p.placeValue2'] },
  { id: 'i.rounding',      band: '9-11', label: 'Rounding',                  chapter: 'rounding',           prereqs: ['i.bigNumbers'] },
  { id: 'i.multFacts',     band: '9-11', label: 'Multiplication facts fluency', chapter: 'timesTables',     prereqs: ['p.skipCount', 'p.multConcept'] },
  { id: 'i.multMultiDigit',band: '9-11', label: 'Multi-digit multiplication', chapter: 'timesTables',       prereqs: ['i.multFacts', 'p.placeValue2'] },
  { id: 'i.division',      band: '9-11', label: 'Division w/ remainders',    chapter: 'division',           prereqs: ['i.multFacts', 'p.subTo100'] },
  { id: 'i.factors',       band: '9-11', label: 'Factors, multiples, primes', chapter: 'factorsMultiples',  prereqs: ['i.multFacts', 'i.division'] },
  { id: 'i.fractionEquiv', band: '9-11', label: 'Equivalent fractions & compare', chapter: 'fractionsCompare', prereqs: ['p.fractionsIntro', 'i.multFacts'] },
  { id: 'i.fractionOps',   band: '9-11', label: 'Add/subtract fractions',    chapter: 'fractionsCompare',   prereqs: ['i.fractionEquiv'] },
  { id: 'i.decimals',      band: '9-11', label: 'Decimals (tenths/hundredths)', chapter: 'decimals',        prereqs: ['i.bigNumbers', 'i.fractionEquiv'] },
  { id: 'i.measureUnits',  band: '9-11', label: 'Units & conversion',        chapter: 'measurementUnits',   prereqs: ['i.multFacts', 'i.decimals'] },
  { id: 'i.areaPerimeter', band: '9-11', label: 'Area & perimeter',          chapter: 'areaPerimeter',      prereqs: ['i.multFacts', 'p.shapes2d3d'] },
  { id: 'i.anglesSymmetry',band: '9-11', label: 'Angles & symmetry',         chapter: 'anglesSymmetry',     prereqs: ['p.shapes2d3d'] },
  { id: 'i.dataGraphs',    band: '9-11', label: 'Data & graphs',             chapter: 'dataGraphs',         prereqs: ['i.bigNumbers', 'i.division'] },
  { id: 'i.wordProbMulti', band: '9-11', label: 'Multi-step word problems',  chapter: 'wordProblems',       prereqs: ['i.division', 'i.multMultiDigit', 'i.fractionOps'] },

  // ── Band 12–14 · Middle ────────────────────────────────────────────────────
  { id: 'm.integers',      band: '12-14', label: 'Integers & number line',   chapter: 'integers',           prereqs: ['p.compare100', 'p.subTo100'] },
  { id: 'm.signedOps',     band: '12-14', label: 'Signed number operations', chapter: 'signedRationalOps',  prereqs: ['m.integers'] },
  { id: 'm.rationalOps',   band: '12-14', label: 'Fraction/decimal ×÷',      chapter: 'rationalOps',        prereqs: ['i.fractionOps', 'i.decimals', 'i.multFacts'] },
  { id: 'm.ratioProportion',band: '12-14', label: 'Ratios & proportions',    chapter: 'ratioProportion',    prereqs: ['i.fractionEquiv', 'i.division'] },
  { id: 'm.percentages',   band: '12-14', label: 'Percentages',              chapter: 'percentages',        prereqs: ['m.ratioProportion', 'i.decimals'] },
  { id: 'm.exponentsRoots',band: '12-14', label: 'Exponents, roots, sci notation', chapter: 'exponentsRoots', prereqs: ['i.multFacts', 'i.factors'] },
  { id: 'm.orderOps',      band: '12-14', label: 'Order of operations',      chapter: 'orderOfOperations',  prereqs: ['m.signedOps', 'm.exponentsRoots'] },
  { id: 'm.algExpressions',band: '12-14', label: 'Algebraic expressions',    chapter: 'algebraicExpressions', prereqs: ['m.orderOps', 'm.signedOps'] },
  { id: 'm.equationsIneq', band: '12-14', label: 'Equations & inequalities (1-var)', chapter: 'equationsInequalities', prereqs: ['m.algExpressions', 'm.signedOps'] },
  { id: 'm.coordinatePlane',band: '12-14', label: 'Coordinate plane',        chapter: 'coordinatePlane',    prereqs: ['m.integers', 'e.numberOrder'] },
  { id: 'm.linearRel',     band: '12-14', label: 'Linear relationships (tables/slope)', chapter: 'linearRelationships', prereqs: ['m.coordinatePlane', 'm.ratioProportion', 'm.equationsIneq'] },
  { id: 'm.geomMeasure',   band: '12-14', label: 'Area, volume & Pythagoras', chapter: 'geometryMeasurement', prereqs: ['i.areaPerimeter', 'i.multMultiDigit', 'm.exponentsRoots'] },

  // ── Band 15–16 · Algebra I / Geometry ──────────────────────────────────────
  { id: 'a.signedFluency', band: '15-16', label: 'Signed & real number fluency', chapter: 'signedNumberFluency', prereqs: ['m.signedOps', 'm.rationalOps'] },
  { id: 'a.expressions',   band: '15-16', label: 'Expressions & variables',  chapter: 'expressionsVariables', prereqs: ['m.algExpressions', 'm.orderOps'] },
  { id: 'a.linearEqIneq',  band: '15-16', label: 'Linear equations & inequalities', chapter: 'linearEquationsInequalities', prereqs: ['m.equationsIneq', 'a.expressions', 'a.signedFluency'] },
  { id: 'a.slopeGraphs',   band: '15-16', label: 'Slope & linear graphs',    chapter: 'slopeLinearGraphs',  prereqs: ['m.linearRel', 'm.coordinatePlane', 'a.linearEqIneq'] },
  { id: 'a.functions',     band: '15-16', label: 'Functions (f(x), domain/range)', chapter: 'functionsFamilies', prereqs: ['a.slopeGraphs', 'a.linearEqIneq'] },
  { id: 'a.systems',       band: '15-16', label: 'Systems of equations',     chapter: 'systemsOfEquations', prereqs: ['a.linearEqIneq', 'a.slopeGraphs'] },
  { id: 'a.expPolynomials',band: '15-16', label: 'Exponents & polynomials',  chapter: 'exponentsPolynomials', prereqs: ['m.exponentsRoots', 'a.expressions'] },
  { id: 'a.radicals',      band: '15-16', label: 'Radicals & Pythagoras',    chapter: 'radicalsPythagorean', prereqs: ['m.exponentsRoots', 'm.geomMeasure'] },
  { id: 'a.factoring',     band: '15-16', label: 'Factoring',                chapter: 'factoringPolynomials', prereqs: ['a.expPolynomials', 'i.multFacts'] },
  { id: 'a.quadratics',    band: '15-16', label: 'Quadratics & parabolas',   chapter: 'quadraticsParabolas', prereqs: ['a.factoring', 'a.expPolynomials', 'a.functions'] },
  { id: 'a.geomTransform', band: '15-16', label: 'Geometry & transformations', chapter: 'geometryTransformations', prereqs: ['m.geomMeasure', 'm.coordinatePlane'] },
  { id: 'a.proofTrig',     band: '15-16', label: 'Proof & right-triangle trig', chapter: 'geometryProofTrig', prereqs: ['a.radicals', 'm.ratioProportion'] },

  // ── Band 17–18 · Algebra II / Pre-Calc / Stats / Calc ──────────────────────
  { id: 'c.functionToolkit',band: '17-18', label: 'Function notation/domain/transform', chapter: 'functionToolkit', prereqs: ['a.functions'] },
  { id: 'c.quadraticAnalysis',band: '17-18', label: 'Vertex/roots/discriminant', chapter: 'quadraticAnalysis', prereqs: ['a.quadratics', 'c.functionToolkit'] },
  { id: 'c.polynomialFns', band: '17-18', label: 'Polynomial functions',     chapter: 'polynomialFunctions', prereqs: ['a.factoring', 'c.functionToolkit', 'c.quadraticAnalysis'] },
  { id: 'c.complex',       band: '17-18', label: 'Complex numbers',          chapter: 'complexNumbers',     prereqs: ['a.quadratics', 'a.radicals'] },
  { id: 'c.rationalFns',   band: '17-18', label: 'Rational functions',       chapter: 'rationalFunctions',  prereqs: ['c.polynomialFns', 'a.factoring', 'i.fractionOps'] },
  { id: 'c.expLog',        band: '17-18', label: 'Exponential & log',        chapter: 'expLogFunctions',    prereqs: ['a.expPolynomials', 'c.functionToolkit'] },
  { id: 'c.unitCircleTrig',band: '17-18', label: 'Unit circle & trig',       chapter: 'unitCircleTrig',     prereqs: ['a.proofTrig', 'm.ratioProportion'] },
  { id: 'c.trigGraphsId',  band: '17-18', label: 'Trig graphs & identities', chapter: 'trigGraphsIdentities', prereqs: ['c.unitCircleTrig', 'c.functionToolkit'] },
  { id: 'c.conics',        band: '17-18', label: 'Conic sections',           chapter: 'conicSections',      prereqs: ['a.quadratics', 'a.geomTransform'] },
  { id: 'c.systemsMatrices',band: '17-18', label: 'Systems & matrices',      chapter: 'systemsMatrices',    prereqs: ['a.systems'] },
  { id: 'c.sequencesSeries',band: '17-18', label: 'Sequences & series',      chapter: 'sequencesSeries',    prereqs: ['a.functions', 'a.expPolynomials'] },
  { id: 'c.statsInference',band: '17-18', label: 'Statistics & inference',   chapter: 'statsInference',     prereqs: ['i.dataGraphs', 'm.percentages', 'm.ratioProportion'] },
  { id: 'c.introCalculus', band: '17-18', label: 'Limits / derivative intro', chapter: 'introCalculus',     prereqs: ['c.functionToolkit', 'a.slopeGraphs', 'c.rationalFns'] },
]

/** Where the probe starts for each band (grade-expected nodes); it branches DOWN on failure. */
export const PROBE_ENTRY: Record<Band, string[]> = {
  '3-5':   ['e.counting10', 'e.numeralRecog', 'e.matchQty', 'e.compare', 'e.numberOrder', 'e.addWithin10', 'e.shapes2d', 'e.patterns'],
  '6-8':   ['p.compare100', 'p.addTo100', 'p.multConcept', 'p.fractionsIntro'],
  '9-11':  ['i.multFacts', 'i.fractionEquiv', 'i.division', 'i.decimals', 'i.areaPerimeter', 'i.dataGraphs'],
  '12-14': ['m.signedOps', 'm.rationalOps', 'm.ratioProportion', 'm.equationsIneq', 'm.linearRel', 'm.geomMeasure'],
  '15-16': ['a.signedFluency', 'a.linearEqIneq', 'a.functions', 'a.quadratics', 'a.systems', 'a.geomTransform', 'a.proofTrig'],
  '17-18': ['c.introCalculus', 'c.trigGraphsId', 'c.expLog', 'c.complex', 'c.conics', 'c.systemsMatrices', 'c.sequencesSeries', 'c.statsInference'],
}

// ── Derived lookups + helpers (pure; the probe engine builds on these) ─────────
export const NODE_BY_ID: Record<string, SkillNode> = Object.fromEntries(SKILL_NODES.map(n => [n.id, n]))
export const prereqsOf = (id: string): string[] => NODE_BY_ID[id]?.prereqs ?? []
export const dependentsOf = (id: string): string[] => SKILL_NODES.filter(n => n.prereqs.includes(id)).map(n => n.id)
export const chapterFor = (id: string): string | undefined => NODE_BY_ID[id]?.chapter

/** All skills that (transitively) depend on `id` — the "downstream cost" of a root gap. */
export function blockedBy(id: string): string[] {
  const out = new Set<string>()
  const walk = (x: string) => dependentsOf(x).forEach(d => { if (!out.has(d)) { out.add(d); walk(d) } })
  walk(id)
  return [...out]
}
