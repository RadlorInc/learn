'use client'
/**
 * The chapter registry — every chapter that runs on the shared portal, as data.
 *
 * These chapters used to be 55 near-identical wrapper files whose only real
 * content was the four values below (skill id, backdrop / band, which experience
 * to mount, and the mastery copy). The plumbing lives in ChapterPortal; this file
 * is the table. Adding a chapter is one row.
 *
 * Each row keeps its own dynamic import, so chapters stay code-split exactly as
 * they were — the portal is built inside the loader, after the chunk resolves.
 *
 * The 3–11 half of the table lives in `storyChapters.tsx`, because `/story` renders
 * those same experiences bare and must not pull this module's teen chain in with them.
 */
import nextDynamic from 'next/dynamic'
import { makeStoryChapter, makeTeenChapter, type ChapterProps, type TeenChapterCfg, type TeenGame, type Sim } from '@/features/chapters/ChapterPortal'
import { STORY_CHAPTERS, type StorySkill } from '@/features/chapters/storyChapters'
import type { ChapterType } from '@/core/chapters'

type Loaded = { default: React.ComponentType<ChapterProps> }
const lazy = (load: () => Promise<Loaded>) => nextDynamic(load, { ssr: false })

/** Each story experience, wrapped in the portal. Cast so `CHAPTER_COMPONENTS`'s
 *  `Record<ChapterType, …>` still fails to compile when a chapter is missing —
 *  `Object.fromEntries` alone would widen to an index signature and lose that. */
const STORY_PORTALS = Object.fromEntries(
  Object.entries(STORY_CHAPTERS).map(([skill, { bg, load }]) =>
    [skill, lazy(() => load().then(m => ({ default: makeStoryChapter(skill as ChapterType, bg, m.default) })))],
  ),
) as Record<StorySkill, React.ComponentType<ChapterProps>>

/** A 12–18 teen chapter, optionally preceded by an Explore sim. */
const teen = (
  cfg: TeenChapterCfg,
  load: () => Promise<{ default: TeenGame }>,
  loadSim?: () => Promise<{ default: Sim }>,
) => lazy(() =>
  Promise.all([load(), loadSim?.()]).then(([g, s]) => ({ default: makeTeenChapter(cfg, g.default, s?.default) })),
)

const TEEN_CHAPTERS = {
  algebraicExpressions: teen(
    { skill: "algebraicExpressions", band: "12-14", conceptsConfirmed: ["Evaluating expressions", "Solving for the input", "Combining like terms", "Reading a rule"], nextPointer: "Next: equations & inequalities." },
    () => import("@/features/chapters/teen/games/FunctionFactory"),
  ),
  systemsMatrices: teen(
    { skill: "systemsMatrices", band: "17-18", conceptsConfirmed: ["Solving 2\u00d72 systems", "One / none / infinite solutions", "Matrix add & scalar multiply", "2\u00d72 determinant"], nextPointer: "Next: sequences & series.", explore: { title: "Cross the lines", intro: "Slide the slopes and intercept and watch where the two lines meet. Equal slopes never cross. Get a feel for it, then continue.", continueLabel: "Skip to the game" } },
    () => import("@/features/chapters/teen/games/TwoReceipts"), () => import("@/features/chapters/teen/sims/SystemExplorer"),
  ),
  trigGraphsIdentities: teen(
    { skill: "trigGraphsIdentities", band: "17-18", conceptsConfirmed: ["Amplitude & period", "Midline & shift", "Reading a trig graph", "The Pythagorean identity"], nextPointer: "Next: conic sections.", explore: { title: "Tune a sine wave", intro: "Slide the amplitude A and the period factor B in y = A\u00b7sin(Bx). Watch the curve stretch and squeeze \u2014 and how the period 2\u03c0/B changes \u2014 then continue.", continueLabel: "Skip to the game" } },
    () => import("@/features/chapters/teen/games/DaylightHours"), () => import("@/features/chapters/teen/sims/WaveExplorer"),
  ),
  unitCircleTrig: teen(
    { skill: "unitCircleTrig", band: "17-18", conceptsConfirmed: ["Degrees \u2194 radians", "Sine & cosine as coordinates", "Special angles", "Signs by quadrant"], nextPointer: "Next: trig graphs & identities.", explore: { title: "Spin the circle", intro: "Drag the angle around the unit circle and watch the point's coordinates \u2014 cosine across, sine up \u2014 change with it. Get a feel for it, then continue.", continueLabel: "Skip to the game" } },
    () => import("@/features/chapters/teen/games/BigWheel"), () => import("@/features/chapters/teen/sims/UnitCircleExplorer"),
  ),
  conicSections: teen(
    { skill: "conicSections", band: "17-18", conceptsConfirmed: ["Identifying the conic", "Circle: center & radius", "Parabola & ellipse features", "Hyperbola basics"], nextPointer: "Next: systems & matrices.", explore: { title: "Stretch a circle", intro: "Slide the vertical radius and watch a circle stretch into an ellipse. Get a feel for how the equation's denominators shape the curve, then continue.", continueLabel: "Skip to the game" } },
    () => import("@/features/chapters/teen/games/TorchOnTheWall"), () => import("@/features/chapters/teen/sims/ConicExplorer"),
  ),
  expLogFunctions: teen(
    { skill: "expLogFunctions", band: "17-18", conceptsConfirmed: ["Growth vs decay", "Evaluating exponentials", "Logs as inverses", "Exponential ↔ log form"], nextPointer: "Next: the unit circle & trigonometry.", explore: { title: "Race the models", intro: "Slide the rates and watch a straight line lose to an exponential curve. Get a feel for how fast compounding takes over, then continue.", continueLabel: "Skip to the game" } },
    () => import("@/features/chapters/teen/games/BalanceThatGrows"), () => import("@/features/chapters/teen/sims/GrowthExplorer"),
  ),
  polynomialFunctions: teen(
    { skill: "polynomialFunctions", band: "17-18", conceptsConfirmed: ["Degree & leading term", "End behavior", "Real zeros & multiplicity", "Turning points"], nextPointer: "Next: rational functions.", explore: { title: "Trace the ends", intro: "Flip the leading sign and switch between odd and even degree. Watch how the ends of the curve swing to match — then continue.", continueLabel: "Skip to the game" } },
    () => import("@/features/chapters/teen/games/ColdSnap"), () => import("@/features/chapters/teen/sims/PolynomialExplorer"),
  ),
  statsInference: teen(
    { skill: "statsInference", band: "17-18", conceptsConfirmed: ["Mean, median, mode", "Range & spread", "Outliers & resistance", "Sampling & inference"], nextPointer: "Next: intro to calculus.", explore: { title: "Watch the mean move", intro: "Slide the added data point and watch the mean shift. Get a feel for how one far-out value drags the average, then continue.", continueLabel: "Skip to the game" } },
    () => import("@/features/chapters/teen/games/TheReviews"), () => import("@/features/chapters/teen/sims/MeanShiftSim"),
  ),
  complexNumbers: teen(
    { skill: "complexNumbers", band: "17-18", conceptsConfirmed: ["i and powers of i", "Adding & subtracting", "Multiplying", "Modulus & the plane"], nextPointer: "Next: rational functions.", explore: { title: "Plot on the plane", intro: "Slide the real and imaginary parts and watch the point move on the complex plane — and its modulus, the distance from the origin, update with it. Get a feel for it, or skip straight to the game.", continueLabel: "Skip to the game" } },
    () => import("@/features/chapters/teen/games/WalkHome"), () => import("@/features/chapters/teen/sims/ComplexPlaneExplorer"),
  ),
  functionToolkit: teen(
    { skill: "functionToolkit", band: "17-18", conceptsConfirmed: ["Function notation & evaluation", "Domain & range", "Transformations", "Composition & inverse"], nextPointer: "Next: analyzing quadratics.", explore: { title: "Reshape a figure", intro: "Slide the controls and watch the transformation rule update with the graph. Get a feel for how shifts, reflections and scaling move a shape, or skip straight to the game.", continueLabel: "Skip to the game" } },
    () => import("@/features/chapters/teen/games/PhotoFilters"), () => import("@/features/chapters/teen/sims/TransformExplorer"),
  ),
  introCalculus: teen(
    { skill: "introCalculus", band: "17-18", conceptsConfirmed: ["Limits by substitution", "Average rate of change", "Secant → tangent", "Derivative & the power rule"], nextPointer: "You've reached the top of the ladder — Module complete.", explore: { title: "Zoom in on the instant", intro: "Slide the second point Q toward the fixed point P and watch the secant slope close in on the tangent slope. The value it approaches is the derivative — or skip straight to the game.", continueLabel: "Skip to the game" } },
    () => import("@/features/chapters/teen/games/Pace"), () => import("@/features/chapters/teen/sims/SecantExplorer"),
  ),
  quadraticAnalysis: teen(
    { skill: "quadraticAnalysis", band: "17-18", conceptsConfirmed: ["Vertex & axis of symmetry", "Roots / x-intercepts", "The discriminant", "Direction & width"], nextPointer: "Next: polynomial functions.", explore: { title: "Reshape the parabola", intro: "Drag a, b, and c and watch the vertex, roots, and discriminant respond together. Get a feel for it, or skip straight to the game.", continueLabel: "Skip to the game" } },
    () => import("@/features/chapters/teen/games/ResaleFlip"), () => import("@/features/chapters/teen/sims/ParabolaExplorer"),
  ),
  rationalFunctions: teen(
    { skill: "rationalFunctions", band: "17-18", conceptsConfirmed: ["Domain restrictions", "Vertical asymptotes", "Horizontal asymptotes", "Holes"], nextPointer: "Next: exponential & log functions.", explore: { title: "Break at the edge", intro: "Plot y = 1/(x − a) and slide a. Watch the curve tear apart at the dashed vertical asymptote — the single input the function forbids. Or skip straight to the game.", continueLabel: "Skip to the game" } },
    () => import("@/features/chapters/teen/games/ShareTheWifi"), () => import("@/features/chapters/teen/sims/RationalExplorer"),
  ),
  sequencesSeries: teen(
    { skill: "sequencesSeries", band: "17-18", conceptsConfirmed: ["Arithmetic: common difference", "Geometric: common ratio", "nth-term formulas", "Series sums"], nextPointer: "Next: statistics & inference.", explore: { title: "Grow a sequence", intro: "Switch between adding a fixed step (arithmetic) and multiplying by a fixed factor (geometric), then slide the control and watch the terms climb the graph. Or skip straight to the game.", continueLabel: "Skip to the game" } },
    () => import("@/features/chapters/teen/games/TrainingBlock"), () => import("@/features/chapters/teen/sims/SequenceExplorer"),
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
  /**
   * ⚠️ THE FIRST 9–11 CHAPTER ON THIS SHELL (pilot, 2026-08-14). It sits in the TEEN table because
   * the table is about which ENGINE a chapter runs on, not how old the child is — `band: '9-11'`
   * is what makes it a ten-round, never-resuming, hand-answerable run. It left `storyChapters.tsx`
   * with the old bespoke component, so `/story?ch=decimals` now correctly reports an unknown key;
   * the preview is `/teen-preview?c=decimals`.
   */
  decimals: teen(
    { skill: "decimals", band: "9-11", conceptsConfirmed: ["Tenths and hundredths", "Reading a decimal", "Naming a place", "Adding and taking away across a ten"], nextPointer: "Next: measurement & converting units." },
    () => import("@/features/chapters/teen/games/CoinTrayGame"),
  ),
  /** ⚠️ THE 9–11 BAND, ON THE SAME ENGINE AS 12–18 (founder's call, 2026-08-14). These rows sit in
   *  the TEEN table because the table is about which ENGINE a chapter runs on, not how old the child
   *  is — `band: '9-11'` is what makes each a ten-round, never-resuming, hand-answerable run. They
   *  left `storyChapters.tsx`, so `/story?ch=…` now reports an unknown key for them by design; the
   *  preview is `/teen-preview?c=<id>`. */
  factorsMultiples: teen(
    { skill: "factorsMultiples", band: "9-11", conceptsConfirmed: ["Even and odd", "Counting in multiples", "Factors as equal rows", "Primes"], nextPointer: "Next: comparing fractions." },
    () => import("@/features/chapters/teen/games/FactorLabGame"),
  ),
  fractionsCompare: teen(
    { skill: "fractionsCompare", band: "9-11", conceptsConfirmed: ["Equivalent fractions", "Comparing two fractions", "Adding and taking away slices", "Why more parts means smaller ones"], nextPointer: "Next: decimals." },
    () => import("@/features/chapters/teen/games/PizzaCounterGame"),
  ),
  measurementUnits: teen(
    { skill: "measurementUnits", band: "9-11", conceptsConfirmed: ["Feet and inches", "Converting to compare", "How much more is needed", "Mass and capacity swaps"], nextPointer: "Next: area & perimeter." },
    () => import("@/features/chapters/teen/games/HeightBarGame"),
  ),
  anglesSymmetry: teen(
    { skill: "anglesSymmetry", band: "9-11", conceptsConfirmed: ["Acute, right and obtuse", "Judging against a square corner", "Setting an exact angle", "Lines of symmetry"], nextPointer: "Next: data & graphs." },
    () => import("@/features/chapters/teen/games/AngleShopGame"),
  ),
  wordProblems: teen(
    { skill: "wordProblems", band: "9-11", conceptsConfirmed: ["Choosing the operation", "One-step problems", "Two-step problems", "Reading a story for its maths"], nextPointer: "That is the whole set." },
    () => import("@/features/chapters/teen/games/MissionBriefGame"),
  ),
  /** ⚠️ THE ONE THAT WAS 3D. `story/FloorPlot.tsx` (react-three-fiber, first person) and its
   *  628-line procedural site generator are DELETED — founder's call, "totally remove that 3d
   *  concept". Same verb, drawn from above. */
  areaPerimeter: teen(
    { skill: "areaPerimeter", band: "9-11", conceptsConfirmed: ["Area as rows of tiles", "Perimeter as the way round", "Working a side back from the total", "Which one a job needs"], nextPointer: "Next: data & graphs." },
    () => import("@/features/chapters/teen/games/EmptyPlotGame"),
  ),
  /** ⚠️ FIRST OF THE THREE STORYBOOK ONES TO COME ACROSS. `story/LoadingBay.tsx` (815 lines — three
   *  painted depot backdrops, a foreman sprite, a speech bubble and its own layout chain) is DELETED;
   *  the maths lives in `story/cargo.ts` and the chapter is a data file. */
  dataGraphs: teen(
    { skill: "dataGraphs", band: "9-11", conceptsConfirmed: ["Reading a pictograph", "Counting one bar", "How many more", "Adding every bar"], nextPointer: "Next: word problems." },
    () => import("@/features/chapters/teen/games/LoadingBayGame"),
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

/** id → component for every chapter in the app. Record<> enforces completeness. */
export const CHAPTER_COMPONENTS: Record<ChapterType, React.ComponentType<ChapterProps>> = {
  ...STORY_PORTALS,
  ...TEEN_CHAPTERS,
  // The one chapter that still has a bespoke wrapper: counting owns a world picker that
  // "play again" returns to, which is a different run SHAPE, not a different backdrop.
  counting: lazy(() => import('@/features/chapters/game/CountingStoryChapter')),
}
