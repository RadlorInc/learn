'use client'
/**
 * GearLab — the Exponents & Roots chapter as a PLAYABLE GAME.
 * World: a TILE FACTORY where laying/stacking another layer MULTIPLIES a number
 * (powers: square tile patches n² and cube block stacks n³) and roots UNDO it
 * (given the number of tiles, find the side length). Powers are built by cranking
 * ×base up to the target (value starts at 1); roots are SOLVED ON the illustration
 * by BUILDING a square out of the n tiles — set the side and the patch shows too
 * small / too big / fits, so the side that uses all n tiles is the answer (never a
 * √ worked out in the head and dialled). No slides of theory, no MCQ. Shared
 * adaptive engine underneath.
 *
 * Teaching is "I do → we do → you do": a step-by-step WALKTHROUGH (config.tutorial)
 * builds 3² layer-by-layer, then a GUIDED order (config.guided) lets the kid build
 * 2³ with Milo coaching (not scored), then the scored loop.
 */
import { useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate, useReducedMotion, type MotionValue } from 'motion/react'
import { Game, type BaseTask, type GameConfig } from './parts/GameShell'
import { Palette, CrankGear, Nudge, CommitBtn, pick, glideNumber } from './parts/gameKit'

const P: Palette = {
  nightTop: '#2a1712', nightBot: '#3a201a',
  cream: '#fff0e6', creamSoft: 'rgba(255,240,230,0.82)',
  inkOnPaper: '#3a201a', mutedOnPaper: '#a6836f',
  gold: '#ffb057', goldDeep: '#d97f27',
  coral: '#ff7a5b', coralDeep: '#e2523a', mint: '#7fd0a0',
  glass: 'rgba(42,23,18,0.6)', glassBorder: 'rgba(255,240,230,0.22)',
}

interface Task extends BaseTask { mech: 'crank' | 'root'; answer: number; base?: number; n?: number; coef?: number }

const SUPER: Record<number, string> = { 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶' }
const sup = (e: number) => SUPER[e] ?? `^${e}`

// [base, exp] — the answer (base^exp) is computed. Squares, cubes & a few higher
// powers, spread across the difficulty tiers (bigger / less familiar = harder).
const POW: Record<1 | 2 | 3, [number, number][]> = {
  1: [[2, 2], [3, 2], [4, 2], [5, 2], [2, 3], [3, 3]],                                      // 4,9,16,25,8,27
  2: [[5, 2], [6, 2], [7, 2], [8, 2], [3, 3], [4, 3], [5, 3], [2, 4]],                       // 25…64, 27,64,125,16
  3: [[9, 2], [10, 2], [11, 2], [12, 2], [5, 3], [6, 3], [7, 3], [10, 3], [2, 5], [2, 6], [3, 4]], // 81…144, 125,216,343,1000, 32,64,81
}
// square roots: the base is the answer (0–12 slider), n = base².
const ROOT: Record<1 | 2 | 3, number[]> = {
  1: [2, 3, 4, 5, 6],       // √4 … √36
  2: [5, 6, 7, 8, 9],       // √25 … √81
  3: [8, 9, 10, 11, 12],    // √64 … √144
}

function powerCrank(d: 1 | 2 | 3): Task {
  const [base, exp] = pick(POW[d])
  const answer = Math.round(base ** exp)
  // Story fits a square of tiles (n²) or a cube of blocks (n³); higher powers
  // aren't a real square/cube shape, so no context — instruction only.
  const context =
    exp === 2 ? 'A square patch has the same number of tiles across as down.'
    : exp === 3 ? 'A cube stacks as many block layers as there are blocks along each edge.'
    : undefined
  return {
    mech: 'crank', answer, base,
    title: exp === 2 ? `${base} squared` : exp === 3 ? `${base} cubed` : `${base} to the ${exp}`,
    badge: `${base}${sup(exp)}`, tone: 'a',
    ...(context ? { context } : {}),
    instruction: 'Crank the gear to the power.',
    prompt: exp === 2
      ? `Lay a ${base}×${base} tile patch — ${base}${sup(exp)}. Turn to add each layer (×${base}).`
      : `Stack a ${base} block cube — ${base}${sup(exp)}. Turn to add each layer (×${base}).`,
    say: exp === 2
      ? `Lay ${base} rows of ${base} tiles to build ${base} squared — each turn adds a layer of ${base}.`
      : `Stack blocks ${exp} layers deep to build ${base} to the power ${exp} — each turn adds a layer of ${base}.`,
    work: [`${base}${sup(exp)} means ${base} multiplied ${exp} times.`, `1 ×${base} … = ${answer} tiles.`],
  }
}

function rootSlide(d: 1 | 2 | 3): Task {
  const answer = pick(ROOT[d])
  const n = answer * answer
  return {
    mech: 'root', answer, n,
    title: `Side of ${n}`, badge: `√${n}`, tone: 'b',
    context: `You have ${n} tiles to lay into one square patch.`,
    instruction: 'Build the square that uses every tile.',
    prompt: `A square patch has ${n} tiles. Build the square — set the side until it uses all ${n} tiles. That side is √${n}.`,
    say: `You have ${n} tiles. Build them into one square patch. Set the side until the square uses every tile — that side length is the square root.`,
    work: [`Finding the side of a square patch undoes squaring it.`, `${answer} × ${answer} = ${n}, so a ${n}-tile square has sides of ${answer}.`],
  }
}

// ── scientific notation a × 10ᵏ → standard form, SOLVED ON the crank: start at the
//    coefficient `a` and crank ×10 exactly k times (each turn shifts it up a place),
//    so a × 10ᵏ is BUILT, never worked out in the head. ──
const SCI: Record<1 | 2 | 3, [number, number][]> = {   // [coefficient, exponent]
  1: [[3, 2], [4, 2], [5, 2]],
  2: [[6, 2], [2, 3], [7, 2]],
  3: [[3, 3], [5, 3], [2, 4]],
}
function sciNotation(d: 1 | 2 | 3): Task {
  const [a, k] = pick(SCI[d])
  const answer = Math.round(a * 10 ** k)
  return {
    mech: 'crank', answer, base: 10, coef: a,
    title: 'Scientific notation', badge: `${a} × 10${sup(k)}`, tone: 'b',
    context: 'Scientific notation packs a big number as a digit times a power of ten.',
    instruction: 'Crank ×10 once for each power.',
    prompt: `Write ${a} × 10${sup(k)} in full. Start at ${a} and crank ×10 — each turn makes it ten times bigger.`,
    say: `${a} times ten to the power ${k}. Start at ${a}, then crank times ten, ${k} times. Each turn shifts it up a place.`,
    work: [`10${sup(k)} means multiply by ten ${k} times.`, `${a} × 10${sup(k)} = ${answer}.`],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  const pool: (() => Task)[] =
    d === 1 ? [() => powerCrank(1), () => powerCrank(1), () => rootSlide(1)]
    : d === 2 ? [() => powerCrank(2), () => rootSlide(2), () => sciNotation(2)]
    : [() => powerCrank(3), () => rootSlide(3), () => sciNotation(3)]
  return pick(pool)()
}

// ── the worked example for the walkthrough (3² = 9) and the guided order (2³ = 8) ──
const DEMO_TASK: Task = { mech: 'crank', answer: 9, base: 3, title: '3 squared', badge: '3²', tone: 'a', prompt: '', say: '', work: [] }
const GUIDED_TASK: Task = {
  mech: 'crank', answer: 8, base: 2, title: '2 cubed', badge: '2³', tone: 'a',
  context: 'A cube stacks as many block layers as there are blocks along each edge.',
  instruction: 'Crank the gear to the power.',
  prompt: 'Stack a 2-block cube — 2³. Add three layers (×2 each turn), then press Build.',
  say: 'Stack a two-block cube. Add three layers — each layer doubles the blocks — then press build.',
  work: ['2³ means 2 multiplied 3 times.', '1 ×2 ×2 ×2 = 8 blocks.'],
}

// ── Animated walkthrough scene — the storyboard, in motion ────────────────────
// A code-drawn tile-factory floor. For a SQUARE (n²) it lays unit TILES into an
// n×n grid — tiles pop in row by row, one row per counting beat, until the whole
// patch is filled and labelled n². For a CUBE (n³) a small stack of blocks grows.
// For a ROOT it shows a filled square and reveals the side length. Driven purely
// by the walkthrough's per-step `value` (how many tiles/blocks are laid so far)
// plus the step index. A single Framer-Motion value (`pv` = tiles placed) glides on
// a spring, and each cell derives its own fade-in from where that sweeping front has
// reached — so the patch fills continuously at 60fps instead of snapping row-by-row.
const ART = '/assets/teen/objects'

// One tile/block. As the shared `pv` (placed count) sweeps past this cell's index it
// crossfades from empty slot → filled unit and springs to full scale. Every animated
// prop is a MotionValue, so the motion is continuous (no per-step CSS jump). Under
// reduced motion `pv` snaps, so `fill` snaps 0→1 too — nothing is ever hidden.
function SmoothTile({ pv, idx, size, kind, filled, P }: {
  pv: MotionValue<number>; idx: number; size: string; kind: 'tile' | 'block'; filled: boolean; P: Palette
}) {
  const fill = useTransform(pv, [idx, idx + 1], [0, 1])          // 0 → 1 as the front passes
  const scale = useTransform(fill, [0, 1], [0.82, 1])
  const emptyOpacity = useTransform(fill, [0, 1], [0.55, 0])
  const radius = kind === 'tile' ? 6 : 5
  return (
    <motion.div style={{ position: 'relative', width: size, height: size, borderRadius: radius, scale }}>
      <motion.div style={{ position: 'absolute', inset: 0, borderRadius: radius, background: 'rgba(255,240,230,0.10)', border: `1.5px solid ${P.glassBorder}`, opacity: emptyOpacity }} />
      {kind === 'tile' ? (
        <motion.img src={`${ART}/tile_ceramic.png`} alt="" style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: radius, opacity: fill,
          filter: filled ? `drop-shadow(0 0 6px ${P.mint}) saturate(0.9)` : 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
        }} />
      ) : (
        <motion.div style={{
          position: 'absolute', inset: 0, borderRadius: radius, opacity: fill,
          background: filled ? P.mint : P.gold, border: `1.5px solid ${P.goldDeep}`,
          boxShadow: `inset 0 -3px 0 ${P.goldDeep}, 0 2px 6px rgba(0,0,0,0.4)`,
          transition: 'background 300ms, border-color 300ms',
        }} />
      )}
    </motion.div>
  )
}

function TileFactoryScene({ palette: P, task, value, stepIndex, frameCount, ended }: {
  palette: Palette; task: Task; value: number; stepIndex: number; frameCount: number; ended: boolean
}) {
  const resultPhase = ended || stepIndex >= frameCount - 2
  const isRoot = task.mech === 'root'
  const base = task.base ?? (Math.round(Math.sqrt(task.answer)) || 3)
  const exp = task.answer === base * base ? 2 : task.answer === base ** 3 ? 3 : 2
  const isCube = !isRoot && exp === 3

  // how many units are placed so far — the crank counter (1 → base → base²) IS
  // the tile count; value 1 (nothing laid yet) shows as 0 tiles.
  const placed = isRoot ? task.answer * task.answer : value <= 1 ? 0 : Math.round(value)
  const total = isRoot ? task.answer * task.answer : task.answer
  const side = isRoot ? task.answer : base                 // grid is side × side
  const done = placed >= total

  const label = isRoot ? `√${total}` : `${base}${sup(exp)}`
  const answerText = isRoot ? `${task.answer}` : `${total}`

  const boxW = 'clamp(232px, 42vw, 344px)'
  const boxH = 'clamp(300px, 46vh, 440px)'

  // ── Framer Motion: `pv` = tiles/blocks placed, glides on a spring (continuous
  //    60fps, not a per-step CSS jump). Each cell reads the sweeping front off it.
  //    Overdamped so it never overshoots past `total`; reduced-motion → snaps. ──
  const reduce = useReducedMotion()
  const pv = useMotionValue(placed)
  useEffect(() => {
    const controls = animate(pv, placed, reduce ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 24, mass: 0.9 })
    return () => controls.stop()
  }, [placed, reduce, pv])
  const countText = useTransform(pv, (p) => `${Math.max(0, Math.round(p))}`)

  // ── CUBE: a small growing stack (base layers of base²) ──
  if (isCube) {
    const layers = base                                    // e.g. 2³ → 2 layers
    const perLayer = base * base
    return (
      <div style={sceneBox(P, boxW, boxH)}>
        <style>{TILE_KEYFRAMES}</style>
        <img src={`${ART}/tile_factory_bg.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(${P.nightTop}cc, ${P.nightBot}e6)` }} />
        <div style={{ position: 'absolute', top: '9%', left: 0, right: 0, textAlign: 'center', fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(20px,3.4vw,30px)', color: resultPhase ? P.mint : P.cream }}>
          {label}{resultPhase ? ` = ${answerText}` : ''}
        </div>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', justifyContent: 'center', gap: 'clamp(4px,0.9vh,8px)', paddingTop: '10%' }}>
          {Array.from({ length: layers }).map((_, li) => (
            <div key={li} style={{ display: 'grid', gridTemplateColumns: `repeat(${base}, 1fr)`, gap: 'clamp(3px,0.7vw,6px)' }}>
              {Array.from({ length: perLayer }).map((_, ci) => (
                <SmoothTile key={ci} pv={pv} idx={li * perLayer + ci} size={'clamp(20px,3.8vw,32px)'} kind="block" filled={done || resultPhase} P={P} />
              ))}
            </div>
          ))}
        </div>
        {(resultPhase || done) && (
          <div style={{ position: 'absolute', bottom: '7%', left: '50%', transform: 'translateX(-50%)', padding: '4px 16px', borderRadius: 999, background: P.glass, border: `1px solid ${P.mint}`, color: P.mint, fontWeight: 800, fontSize: 'clamp(12px,1.6vw,16px)', animation: 'tfPop 300ms ease' }}>{total} blocks</div>
        )}
      </div>
    )
  }

  // ── SQUARE (n²) and ROOT — an n×n tile grid that fills row by row ──
  const cellSize = `clamp(${side > 6 ? 16 : 22}px, ${side > 6 ? 4 : 6}vw, ${side > 6 ? 30 : 44}px)`
  return (
    <div style={sceneBox(P, boxW, boxH)}>
      <style>{TILE_KEYFRAMES}</style>
      <img src={`${ART}/tile_factory_bg.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(${P.nightTop}cc, ${P.nightBot}e6)` }} />

      {/* header: the power/root label, → answer on the result beat */}
      <div style={{ position: 'absolute', top: '8%', left: 0, right: 0, textAlign: 'center', fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(20px,3.4vw,30px)', color: resultPhase ? P.mint : P.cream, transition: 'color 400ms' }}>
        {label}{resultPhase ? ` = ${answerText}` : ''}
      </div>

      {/* the tile patch */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', display: 'flex', flexDirection: 'column', gap: 'clamp(3px,0.7vw,6px)', padding: 'clamp(6px,1.4vw,12px)', borderRadius: 12, background: 'rgba(0,0,0,0.24)', border: `1.5px solid ${P.glassBorder}`, boxShadow: (resultPhase || done) ? `0 0 22px ${P.mint}66` : 'none' }}>
        {Array.from({ length: side }).map((_, r) => (
          <div key={r} style={{ display: 'flex', gap: 'clamp(3px,0.7vw,6px)' }}>
            {Array.from({ length: side }).map((_, c) => (
              <SmoothTile key={c} pv={pv} idx={r * side + c} size={cellSize} kind="tile" filled={done || resultPhase} P={P} />
            ))}
          </div>
        ))}
      </div>

      {/* dimension brackets — show the n × n reasoning; the root chapter highlights the side */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', bottom: 'calc(50% + clamp(4px,1vw,10px))', left: '50%', transform: 'translate(-50%,-140%)', color: isRoot && (resultPhase || done) ? P.mint : P.mutedOnPaper, fontWeight: 800, fontFamily: 'var(--font-numeric)', fontSize: 'clamp(13px,1.8vw,18px)', whiteSpace: 'nowrap', transition: 'color 400ms' }}>
          {side} {isRoot ? '?' : ''}
        </div>
      </div>

      {/* running tile counter through the build — ticks with the sweeping front */}
      {!isRoot && !resultPhase && placed > 0 && (
        <div style={{ position: 'absolute', bottom: '8%', left: '50%', transform: 'translateX(-50%)', padding: '3px 14px', borderRadius: 999, background: P.glass, border: `1px solid ${P.glassBorder}`, color: done ? P.mint : P.gold, fontWeight: 800, fontFamily: 'var(--font-numeric)', fontSize: 'clamp(11px,1.4vw,15px)', animation: 'tfPop 240ms ease' }}>
          <motion.span>{countText}</motion.span> {placed === 1 ? 'tile' : 'tiles'}
        </div>
      )}

      {/* result banner */}
      {(resultPhase || (isRoot && done)) && (
        <div style={{ position: 'absolute', bottom: '7%', left: '50%', transform: 'translateX(-50%)', padding: '4px 16px', borderRadius: 999, background: P.glass, border: `1px solid ${P.mint}`, color: P.mint, fontWeight: 800, fontSize: 'clamp(12px,1.6vw,16px)', animation: 'tfPop 300ms ease' }}>
          {isRoot ? `side = ${answerText}` : `${total} tiles`}
        </div>
      )}
    </div>
  )
}

const TILE_KEYFRAMES = '@keyframes tfPop{0%{opacity:0;transform:translateX(-50%) scale(.7)}100%{opacity:1;transform:translateX(-50%) scale(1)}}'
const sceneBox = (P: Palette, w: string, h: string): React.CSSProperties => ({
  position: 'relative', width: w, height: h, borderRadius: 16,
  background: P.nightBot,
  border: `1.5px solid ${P.glassBorder}`, overflow: 'hidden',
  boxShadow: '0 12px 34px rgba(0,0,0,0.42)',
})

// ── ROOT: SOLVE √n ON the illustration by BUILDING a square out of the n tiles.
//    Set the side; the patch shows side² vs n as "too small / too big / fits ✓", so
//    the side that uses every tile IS the root — no √ worked out in the head. ──
function RootPatch({ P, task, value, setValue, disabled, reveal, onCommit }: {
  P: Palette; task: Task; value: number; setValue: (v: number) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: number) => void
}) {
  const n = task.n!
  const side = Math.max(0, Math.min(12, Math.round(value)))
  const built = side * side
  const hit = built === n
  const col = reveal || hit ? P.mint : P.gold
  const set = (s: number) => { if (!disabled) setValue(Math.max(0, Math.min(12, s))) }
  const cellPx = `clamp(9px, ${Math.max(3, 26 / Math.max(1, side))}vw, 24px)`
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px,1.4vw,16px)', width: '100%' }}>
      <div style={{ width: 'clamp(240px, 46vw, 400px)', minHeight: 'clamp(180px,28vh,260px)', boxSizing: 'border-box', borderRadius: 16, background: `linear-gradient(160deg, ${P.nightTop}, ${P.nightBot})`, border: `1.5px solid ${P.glassBorder}`, boxShadow: '0 12px 34px rgba(0,0,0,0.42)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'clamp(8px,1.4vh,14px)', padding: 'clamp(14px,2.2vw,24px)' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(10px,1.1vw,13px)', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: P.creamSoft }}>🧱 √{n} · build the square</div>
        {side > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${side}, ${cellPx})`, gap: 2, padding: 5, borderRadius: 8, background: 'rgba(0,0,0,0.28)', border: `2px solid ${col}` }}>
            {Array.from({ length: built }, (_, i) => <div key={i} style={{ width: cellPx, height: cellPx, borderRadius: 2, background: `linear-gradient(${col}, ${P.goldDeep})` }} />)}
          </div>
        ) : <div style={{ fontSize: 'clamp(10px,1.1vw,13px)', color: P.mutedOnPaper }}>set the side below</div>}
        <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: 'clamp(22px,3.6vw,38px)', lineHeight: 1, color: hit ? P.mint : P.gold }}>{built} {hit ? '= ✓' : built < n ? '· too few' : '· too many'}</div>
        <div style={{ minHeight: '1.3em', fontFamily: 'var(--font-body)', fontSize: 'clamp(10px,1.1vw,14px)', color: hit ? P.mint : P.creamSoft }}>{hit ? `side = ${side}, uses all ${n} tiles ✓` : `use all ${n} tiles`}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Nudge P={P} label="−" disabled={disabled} onClick={() => set(side - 1)} />
        <div style={{ minWidth: 120, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(22px,2.4vw,32px)', fontWeight: 800, color: reveal ? P.mint : P.gold }}>side {side}</div>
          <div style={{ fontSize: 'clamp(11px,1.1vw,14px)', color: P.creamSoft }}>tiles across</div>
        </div>
        <Nudge P={P} label="+" disabled={disabled} onClick={() => set(side + 1)} />
      </div>
      <CommitBtn P={P} label="BUILD ✓" disabled={disabled} onClick={() => onCommit(side)} />
    </div>
  )
}

const CONFIG: GameConfig<number, Task> = {
  chapterId: 'exponentsRoots',
  title: 'TILE FACTORY',
  motif: '🧱',
  ticketLabel: 'build order',
  palette: P,
  makeTask,
  initialValue: (t) => (t.mech === 'crank' ? (t.coef ?? 1) : 0),
  grade: (t, v) => Math.abs(v - t.answer) < 1e-6,
  revealText: (t) => `${t.answer}`,
  glide: (t, from, setValue, later) =>
    t.mech === 'crank' ? later(() => setValue(t.answer), 600) : glideNumber(from, t.answer, setValue, later),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) =>
    task.mech === 'crank'
      ? <CrankGear P={palette} value={value} setValue={setValue} base={task.base!} floor={task.coef ?? 1} disabled={disabled} reveal={reveal} onCommit={onCommit} commitLabel={task.coef ? 'WRITE ✓' : 'BUILD ✓'} />
      : <RootPatch P={palette} task={task} value={value} setValue={setValue} disabled={disabled} reveal={reveal} onCommit={onCommit} />,
  tutorial: {
    task: DEMO_TASK,
    initial: 1,
    hand: 'crank',
    steps: [
      { say: "Welcome to the Tile Factory! Today's order is three squared — that little two means squared.", value: 1, hand: 'crank', board: '3² = ?' },
      { say: 'Three squared means three multiplied by itself — three times three.', value: 1, hand: 'crank', board: '3² = 3 × 3' },
      { say: 'Every build starts at one, before we lay any tiles. Watch the counter.', value: 1, hand: 'crank', board: 'start: 1' },
      { say: 'One turn of the crank multiplies by three. So turn once.', value: 1, hand: 'crank', board: '1 × 3 = ?' },
      { say: 'One times three is three — that is our first row of three tiles.', value: 3, hand: 'crank', board: '1 × 3 = 3' },
      { say: 'Now turn again to lay another row. That multiplies by three once more.', value: 3, hand: 'crank', board: '3 × 3 = ?' },
      { say: 'Three times three is nine tiles.', value: 9, hand: 'crank', board: '3 × 3 = 9' },
      { say: "We've turned twice — that's three multiplied twice. That's what squared means.", value: 9, board: '3² = 3 × 3' },
      { say: 'So three squared is nine. Nine tiles fill the patch.', value: 9, board: '3² = 9' },
      { say: 'Laid one layer too many? Just turn the handle back the other way to undo it.', value: 9, hand: 'crank' },
      { say: "When your patch is built, press Build. Now let's try one together.", value: 9, hand: 'tap' },
    ],
  },
  guided: {
    task: GUIDED_TASK,
    coach: 'Your turn — I will help.',
    hand: 'crank',
  },
  TutorialScene: TileFactoryScene,
  start: {
    blurb: <><strong style={{ color: P.cream }}>You&apos;re running the Tile Factory.</strong> Lay tile patches and stack block cubes to build powers — and slide to find the side length of a square patch.</>,
    ticket: { title: 'Two cubed', badge: '2³', tone: 'a' },
    startLabel: 'Fire up the kiln →',
  },
  overview: {
    say: "Here is what we are figuring out: what a small number with a tiny two above it really means. Today's order is three squared, and we will build it by laying three rows of three tiles — that is three times three.",
    problem: <>What is <strong>3²</strong> (three squared)? We&apos;ll lay a <strong>3 × 3 tile patch</strong> and count the tiles.</>,
    points: [
      <>That little <strong>²</strong> means &quot;multiply the number by itself&quot; — so <strong>3² = 3 × 3</strong>.</>,
      <>We build starting at <strong>1</strong>, then crank <strong>×3</strong> for each row of tiles.</>,
      <>Fill the whole square and count the tiles — that&apos;s our answer.</>,
    ],
  },
  sig: (t) => t.badge,
}

export default function GearLab(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
