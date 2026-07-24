'use client'
/**
 * The chapter registry — every chapter that runs on the shared portal, as data.
 *
 * These 55 chapters used to be 55 near-identical wrapper files whose only real
 * content was the four values below (skill id, backdrop / band, which experience
 * to mount, and the mastery copy). The plumbing lives in ChapterPortal; this file
 * is the table. Adding a chapter is one row.
 *
 * Each row keeps its own dynamic import, so chapters stay code-split exactly as
 * they were — the portal is built inside the loader, after the chunk resolves.
 */
import nextDynamic from 'next/dynamic'
import { makeStoryChapter, makeTeenChapter, type ChapterProps, type TeenChapterCfg, type StoryInner, type TeenGame, type Sim } from '@/features/chapters/ChapterPortal'
import type { ChapterType } from '@/state/store'

type Loaded = { default: React.ComponentType<ChapterProps> }
const lazy = (load: () => Promise<Loaded>) => nextDynamic(load, { ssr: false })

/** A 3–11 story chapter: its own experience over a per-chapter backdrop. */
const story = (skill: ChapterType, bg: string, load: () => Promise<{ default: StoryInner }>) =>
  lazy(() => load().then(m => ({ default: makeStoryChapter(skill, bg, m.default) })))

/** A 12–18 teen chapter, optionally preceded by an Explore sim. */
const teen = (
  cfg: TeenChapterCfg,
  load: () => Promise<{ default: TeenGame }>,
  loadSim?: () => Promise<{ default: Sim }>,
) => lazy(() =>
  Promise.all([load(), loadSim?.()]).then(([g, s]) => ({ default: makeTeenChapter(cfg, g.default, s?.default) })),
)

const PORTAL_CHAPTERS = {
  addition: story("addition", "#dff0c8", () => import("@/features/chapters/story/Orchard")),
  anglesSymmetry: story("anglesSymmetry", "#0a1026", () => import("@/features/chapters/story/AngleScope")),
  areaPerimeter: story("areaPerimeter", "#0a1026", () => import("@/features/chapters/story/GridPlotter")),
  bigNumbers: story("bigNumbers", "#0a1026", () => import("@/features/chapters/story/NumberVault")),
  colors: story("colors", "#e6f0f7", () => import("@/features/chapters/story/RainbowTown")),
  compareNumbers: story("compareNumbers", "#cfe6f7", () => import("@/features/chapters/story/SeesawPark")),
  dataGraphs: story("dataGraphs", "#0a1026", () => import("@/features/chapters/story/DataDeck")),
  decimals: story("decimals", "#0a1026", () => import("@/features/chapters/story/DecimalGrid")),
  division: story("division", "#0a1026", () => import("@/features/chapters/story/DivisionShare")),
  factorsMultiples: story("factorsMultiples", "#0a1026", () => import("@/features/chapters/story/FactorLab")),
  fractions: story("fractions", "#f3ead8", () => import("@/features/chapters/story/SliceShop")),
  fractionsCompare: story("fractionsCompare", "#0a1026", () => import("@/features/chapters/story/FractionForge")),
  matchingQuantities: story("matchingQuantities", "#241c39", () => import("@/features/chapters/story/Grocery")),
  measurementUnits: story("measurementUnits", "#0a1026", () => import("@/features/chapters/story/UnitConverter")),
  measurement: story("measurement", "#cfe9f7", () => import("@/features/chapters/story/TallForest")),
  money: story("money", "#f3ead8", () => import("@/features/chapters/story/CoinShop")),
  multiplication: story("multiplication", "#f3ead8", () => import("@/features/chapters/story/MarketDay")),
  numberComparison: story("numberComparison", "#241c39", () => import("@/features/chapters/story/Kitchen")),
  numberRecognition: story("numberRecognition", "#241c39", () => import("@/features/chapters/story/NestTree")),
  numberOrdering: story("numberOrdering", "#bfe6f7", () => import("@/features/chapters/story/FollowTheLeader")),
  numbersTo100: story("numbersTo100", "#cfe6f7", () => import("@/features/chapters/story/NumberTown")),
  placeValue: story("placeValue", "#cfe6f7", () => import("@/features/chapters/story/BuildingBlocks")),
  rounding: story("rounding", "#0a1026", () => import("@/features/chapters/story/RoundingTrail")),
  shapes: story("shapes", "#dff0e4", () => import("@/features/chapters/story/ShapeTown")),
  shapes2d3d: story("shapes2d3d", "#efe6d8", () => import("@/features/chapters/story/ShapeStudio")),
  skipCounting: story("skipCounting", "#dcecdb", () => import("@/features/chapters/story/HopAlong")),
  storyProblems: story("storyProblems", "#f3ead8", () => import("@/features/chapters/story/StoryTime")),
  subtraction: story("subtraction", "#bfe7ff", () => import("@/features/chapters/story/LilyPond")),
  time: story("time", "#f3ead8", () => import("@/features/chapters/story/TickTock")),
  timesTables: story("timesTables", "#0a1026", () => import("@/features/chapters/story/TimesGrid")),
  wordProblems: story("wordProblems", "#0a1026", () => import("@/features/chapters/story/MissionBrief")),

  algebraicExpressions: teen(
    { skill: "algebraicExpressions", band: "12-14", conceptsConfirmed: ["Evaluating expressions", "Solving for the input", "Combining like terms", "Reading a rule"], nextPointer: "Next: equations & inequalities." },
    () => import("@/features/chapters/teen/games/FunctionFactory"),
  ),
  coordinatePlane: teen(
    { skill: "coordinatePlane", band: "12-14", conceptsConfirmed: ["Plotting (x, y)", "All four quadrants", "Reflecting across an axis", "Finding a midpoint"], nextPointer: "Next: linear relationships." },
    () => import("@/features/chapters/teen/games/NightFlight"),
  ),
  equationsInequalities: teen(
    { skill: "equationsInequalities", band: "12-14", conceptsConfirmed: ["Balancing an equation", "Solving for x", "Undoing operations", "Checking the solution"], nextPointer: "Next: the coordinate plane." },
    () => import("@/features/chapters/teen/games/BalanceBench"),
  ),
  exponentsPolynomials: teen(
    { skill: "exponentsPolynomials", band: "15-16", conceptsConfirmed: ["Exponent laws (×, ÷, power)", "Zero & negative exponents", "Scientific notation", "Evaluate powers & polynomials"], nextPointer: "Next: radicals & the Pythagorean theorem.", explore: { title: "Change the base and the power", intro: "Drag the base and the exponent, and watch the repeated multiplication and the value climb together. Get a feel for how fast powers grow, or skip straight to the game.", continueLabel: "Skip to the game" } },
    () => import("@/features/chapters/teen/games/PowerUps"), () => import("@/features/chapters/teen/sims/PowerExplorer"),
  ),
  exponentsRoots: teen(
    { skill: "exponentsRoots", band: "12-14", conceptsConfirmed: ["Powers as repeated multiplication", "Square & cube numbers", "Square roots", "Powers of ten"], nextPointer: "Next: the order of operations." },
    () => import("@/features/chapters/teen/games/GearLab"),
  ),
  expressionsVariables: teen(
    { skill: "expressionsVariables", band: "15-16", conceptsConfirmed: ["Evaluating at a value", "Phrase ↔ expression", "Combining like terms", "Distributing & simplifying"], nextPointer: "Next: linear equations & inequalities.", explore: { title: "Slide x", intro: "Slide x and watch the ticket price resolve to a value — same idea as the game. Have a play, or skip straight to the checkout.", continueLabel: "Skip to the game" } },
    () => import("@/features/chapters/teen/games/TicketCheckout"), () => import("@/features/chapters/teen/sims/ExpressionEvaluator"),
  ),
  factoringPolynomials: teen(
    { skill: "factoringPolynomials", band: "15-16", conceptsConfirmed: ["Factoring x²+bx+c", "Difference of squares", "Building the two factors", "Signs of the constants"], nextPointer: "Next: quadratics & parabolas.", explore: { title: "Factor as a rectangle", intro: "Drag the side lengths and watch the area rearrange — factoring is finding the sides that make an area. Have a play, or skip straight to the game.", continueLabel: "Skip to the game" } },
    () => import("@/features/chapters/teen/games/BuildPlot"), () => import("@/features/chapters/teen/sims/AreaFactorExplorer"),
  ),
  functionsFamilies: teen(
    { skill: "functionsFamilies", band: "15-16", conceptsConfirmed: ["Function notation & evaluating f(x)", "Domain, range & intercepts from a graph", "Linear vs exponential growth", "Growth/decay & geometric sequences"], nextPointer: "Next: systems of equations.", explore: { title: "Linear vs exponential growth", intro: "Slide the rates and watch a straight line (adding each step) race a curve (multiplying each step) — see where the curve overtakes. Then play, or skip straight to the game.", continueLabel: "Skip to the game" } },
    () => import("@/features/chapters/teen/games/GoingViral"), () => import("@/features/chapters/teen/sims/GrowthExplorer"),
  ),
  geometryMeasurement: teen(
    { skill: "geometryMeasurement", band: "12-14", conceptsConfirmed: ["Area of a rectangle", "Perimeter", "Volume of a box", "Pythagoras (the brace)"], nextPointer: "You have finished the 12-14 set." },
    () => import("@/features/chapters/teen/games/BuildSite"),
  ),
  geometryProofTrig: teen(
    { skill: "geometryProofTrig", band: "15-16", conceptsConfirmed: ["Angle relationships & the triangle-angle sum", "Congruence proofs (SSS / SAS / ASA)", "SOH-CAH-TOA for a missing side", "Inverse trig & angle of elevation"], nextPointer: "You've finished the 15-16 band!", explore: { title: "SOH-CAH-TOA, live", intro: "Drag the angle and watch the opposite, adjacent, and hypotenuse re-label — and the three ratios update with them. The ratio depends only on the angle. Have a play, or skip straight to the game.", continueLabel: "Skip to the game" } },
    () => import("@/features/chapters/teen/games/SkateRamp"), () => import("@/features/chapters/teen/sims/TrigTriangleExplorer"),
  ),
  geometryTransformations: teen(
    { skill: "geometryTransformations", band: "15-16", conceptsConfirmed: ["Circumference, area, arc & sector", "Surface area & volume of solids", "Translate, reflect & dilate on the grid", "Identify the rule & find the midpoint"], nextPointer: "Next: triangles, proof & right-triangle trig.", explore: { title: "Move, flip, and scale a shape", intro: "Slide the translate and scale controls and pick a reflect axis — watch the image triangle and its rule update together. Have a play, or skip straight to the game.", continueLabel: "Skip to the game" } },
    () => import("@/features/chapters/teen/games/MapMaker"), () => import("@/features/chapters/teen/sims/TransformExplorer"),
  ),
  integers: teen(
    { skill: "integers", band: "12-14", conceptsConfirmed: ["Negatives below zero", "Comparing integers", "Opposites", "Distance from zero (absolute value)"], nextPointer: "Next: operations with signed numbers." },
    () => import("@/features/chapters/teen/games/WeatherStation"),
  ),
  linearEquationsInequalities: teen(
    { skill: "linearEquationsInequalities", band: "15-16", conceptsConfirmed: ["Solving one- & two-step equations", "Distributing through brackets", "Variables on both sides", "Inequalities & the sign-flip rule"], nextPointer: "Next: slope & linear graphs.", explore: { title: "Balance the scale", intro: "Slide x until the beam sits level. Whatever keeps both pans equal is the solution — same idea as the game. Have a play, or skip straight to the savings plan.", continueLabel: "Skip to the game" } },
    () => import("@/features/chapters/teen/games/SavingGoal"), () => import("@/features/chapters/teen/sims/BalanceExplorer"),
  ),
  linearRelationships: teen(
    { skill: "linearRelationships", band: "12-14", conceptsConfirmed: ["Slope from two points", "The start value (y-intercept)", "Drawing the line", "Reading a linear graph"], nextPointer: "Next: area, volume & Pythagoras." },
    () => import("@/features/chapters/teen/games/CableCar"),
  ),
  orderOfOperations: teen(
    { skill: "orderOfOperations", band: "12-14", conceptsConfirmed: ["Brackets first", "Times & divide next", "Add & subtract last", "Reading an expression"], nextPointer: "Next: algebraic expressions." },
    () => import("@/features/chapters/teen/games/ScoreMachine"),
  ),
  percentages: teen(
    { skill: "percentages", band: "12-14", conceptsConfirmed: ["Percent ↔ fraction ↔ decimal", "Percent of a price", "Finding the percent", "Increase, discount & reverse"], nextPointer: "Next: exponents, roots & scientific notation." },
    () => import("@/features/chapters/teen/games/StoreCheckout"),
  ),
  quadraticsParabolas: teen(
    { skill: "quadraticsParabolas", band: "15-16", conceptsConfirmed: ["Vertex, axis & roots from a parabola", "Solving by factoring & square roots", "The quadratic formula", "The discriminant & number of roots"], nextPointer: "Next: geometry — mensuration & transformations.", explore: { title: "Shape the parabola", intro: "Drag a, b and c and watch the vertex, the roots, and the discriminant move together — get a feel for how the equation controls the arc. Have a play, or skip straight to the game.", continueLabel: "Skip to the game" } },
    () => import("@/features/chapters/teen/games/TheShot"), () => import("@/features/chapters/teen/sims/ParabolaExplorer"),
  ),
  radicalsPythagorean: teen(
    { skill: "radicalsPythagorean", band: "15-16", conceptsConfirmed: ["Square roots & perfect squares", "Simplifying radicals (a√b)", "Adding like radicals", "Pythagorean theorem & diagonals"], nextPointer: "Next: factoring.", explore: { title: "Squares on the sides", intro: "Drag the two legs and watch the square on each side. The two small squares always add up to the square on the slanted side — that is the whole theorem. Have a play, or skip straight to the game.", continueLabel: "Skip to the game" } },
    () => import("@/features/chapters/teen/games/ScreenDistance"), () => import("@/features/chapters/teen/sims/PythagorasExplorer"),
  ),
  ratioProportion: teen(
    { skill: "ratioProportion", band: "12-14", conceptsConfirmed: ["Filling to a ratio", "Scaling a recipe", "Finding the missing part", "Equivalent ratios"], nextPointer: "Next: percentages." },
    () => import("@/features/chapters/teen/games/JuiceBar"),
  ),
  rationalOps: teen(
    { skill: "rationalOps", band: "12-14", conceptsConfirmed: ["Fraction of a fraction", "Multiplying decimals", "Dividing by a fraction", "Reading the result"], nextPointer: "Next: ratios and proportions." },
    () => import("@/features/chapters/teen/games/KitchenCounter"),
  ),
  signedNumberFluency: teen(
    { skill: "signedNumberFluency", band: "15-16", conceptsConfirmed: ["Adding & subtracting signed numbers", "Multiplying & dividing signs", "Order of operations with negatives & exponents", "Rational vs irrational"], nextPointer: "Next: expressions & variables.", explore: { title: "Add a positive and a negative", intro: "Set a start and a jump, then watch where you land — adding a negative slides you left, adding a positive slides you right. Have a play, or skip straight to the game.", continueLabel: "Skip to the game" } },
    () => import("@/features/chapters/teen/games/Leaderboard"), () => import("@/features/chapters/teen/sims/SignedJumpExplorer"),
  ),
  signedRationalOps: teen(
    { skill: "signedRationalOps", band: "12-14", conceptsConfirmed: ["Adding & subtracting signed numbers", "Multiplying signs", "Dividing signs", "Chained operations"], nextPointer: "Next: multiplying and dividing fractions." },
    () => import("@/features/chapters/teen/games/SkyTower"),
  ),
  slopeLinearGraphs: teen(
    { skill: "slopeLinearGraphs", band: "15-16", conceptsConfirmed: ["Read slope from a graph", "Read the y-intercept", "Slope from two points", "Write y = mx + b (incl. standard form)"], nextPointer: "Next: functions — notation, linear & exponential.", explore: { title: "Drag the slope and intercept", intro: "Drag the slope (m) and intercept (b) and watch the line and its equation move together — same idea as the game. Have a play, or skip straight to the game.", continueLabel: "Skip to the game" } },
    () => import("@/features/chapters/teen/games/FollowerGrowth"), () => import("@/features/chapters/teen/sims/LineExplorer"),
  ),
  systemsOfEquations: teen(
    { skill: "systemsOfEquations", band: "15-16", conceptsConfirmed: ["Solution = where the plans meet", "Solving by substitution", "Solving by elimination", "One / none / infinite solutions"], nextPointer: "Next: exponents & polynomials.", explore: { title: "Find where two lines meet", intro: "Slide the slopes and intercept and watch the crossing point move — that meeting point is where the two plans break even. Make the lines parallel and see what happens. Or skip straight to the game.", continueLabel: "Skip to the game" } },
    () => import("@/features/chapters/teen/games/BestPlan"), () => import("@/features/chapters/teen/sims/SystemExplorer"),
  ),
}

/** Chapters that still have a bespoke wrapper — their own phases, sims or copy
 *  don't fit the portal table yet. */
const BESPOKE_CHAPTERS = {
  counting:           lazy(() => import('@/features/chapters/game/CountingStoryChapter')),
  patterns:           lazy(() => import('@/features/chapters/game/PatternsChapter')),
  additionTo100:      lazy(() => import('@/features/chapters/game/ArithmeticChapter').then(m => ({ default: m.AdditionTo100Chapter }))),
  subtractionTo100:   lazy(() => import('@/features/chapters/game/ArithmeticChapter').then(m => ({ default: m.SubtractionTo100Chapter }))),
  functionToolkit:      lazy(() => import('@/features/chapters/game/FunctionToolkitChapter')),
  quadraticAnalysis:    lazy(() => import('@/features/chapters/game/QuadraticAnalysisChapter')),
  polynomialFunctions:  lazy(() => import('@/features/chapters/game/PolynomialFunctionsChapter')),
  complexNumbers:       lazy(() => import('@/features/chapters/game/ComplexNumbersChapter')),
  rationalFunctions:    lazy(() => import('@/features/chapters/game/RationalFunctionsChapter')),
  expLogFunctions:      lazy(() => import('@/features/chapters/game/ExpLogFunctionsChapter')),
  unitCircleTrig:       lazy(() => import('@/features/chapters/game/UnitCircleTrigChapter')),
  trigGraphsIdentities: lazy(() => import('@/features/chapters/game/TrigGraphsIdentitiesChapter')),
  conicSections:        lazy(() => import('@/features/chapters/game/ConicSectionsChapter')),
  systemsMatrices:      lazy(() => import('@/features/chapters/game/SystemsMatricesChapter')),
  sequencesSeries:      lazy(() => import('@/features/chapters/game/SequencesSeriesChapter')),
  statsInference:       lazy(() => import('@/features/chapters/game/StatsInferenceChapter')),
  introCalculus:        lazy(() => import('@/features/chapters/game/IntroCalculusChapter')),
}

/** id → component for every chapter in the app. Record<> enforces completeness. */
export const CHAPTER_COMPONENTS: Record<ChapterType, React.ComponentType<ChapterProps>> = {
  ...PORTAL_CHAPTERS,
  ...BESPOKE_CHAPTERS,
}
