'use client'
/**
 * GearLab — the Exponents & Roots chapter as a PLAYABLE GAME.
 * World: a TILE FACTORY where laying/stacking another layer MULTIPLIES a number
 * (powers: square tile patches n² and cube block stacks n³) and roots UNDO it
 * (given the area/number of tiles, find the side length). Powers are built by
 * cranking ×base up to the target (value starts at 1); roots are found by
 * sliding to the number that squares back. No slides of theory, no MCQ. Shared
 * adaptive engine underneath.
 *
 * Teaching is "I do → we do → you do": a step-by-step WALKTHROUGH (config.tutorial)
 * builds 3² layer-by-layer, then a GUIDED order (config.guided) lets the kid build
 * 2³ with Milo coaching (not scored), then the scored loop.
 */
import { Game, type BaseTask, type GameConfig } from './parts/GameShell'
import { Palette, CrankGear, SlideValue, pick, glideNumber } from './parts/gameKit'

const P: Palette = {
  nightTop: '#2a1712', nightBot: '#3a201a',
  cream: '#fff0e6', creamSoft: 'rgba(255,240,230,0.82)',
  inkOnPaper: '#3a201a', mutedOnPaper: '#a6836f',
  gold: '#ffb057', goldDeep: '#d97f27',
  coral: '#ff7a5b', coralDeep: '#e2523a', mint: '#7fd0a0',
  glass: 'rgba(42,23,18,0.6)', glassBorder: 'rgba(255,240,230,0.22)',
}

interface Task extends BaseTask { mech: 'crank' | 'slide'; answer: number; base?: number; min?: number; max?: number }

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
  return {
    mech: 'crank', answer, base,
    title: exp === 2 ? `${base} squared` : exp === 3 ? `${base} cubed` : `${base} to the ${exp}`,
    badge: `${base}${sup(exp)}`, tone: 'a',
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
    mech: 'slide', answer, min: 0, max: 12,
    title: `Side of ${n}`, badge: `√${n}`, tone: 'b',
    prompt: `A square patch has ${n} tiles. How long is each side? Slide to the side length.`,
    say: `A square patch has ${n} tiles. How long is each side? Slide to the number that squares back to ${n}.`,
    work: [`Finding the side of a square patch undoes squaring it.`, `${answer} × ${answer} = ${n}, so a ${n}-tile square has sides of ${answer}.`],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  const pool: (() => Task)[] =
    d === 1 ? [() => powerCrank(1), () => powerCrank(1), () => rootSlide(1)]
    : d === 2 ? [() => powerCrank(2), () => rootSlide(2), () => powerCrank(2)]
    : [() => powerCrank(3), () => rootSlide(3), () => powerCrank(3)]
  return pick(pool)()
}

// ── the worked example for the walkthrough (3² = 9) and the guided order (2³ = 8) ──
const DEMO_TASK: Task = { mech: 'crank', answer: 9, base: 3, title: '3 squared', badge: '3²', tone: 'a', prompt: '', say: '', work: [] }
const GUIDED_TASK: Task = {
  mech: 'crank', answer: 8, base: 2, title: '2 cubed', badge: '2³', tone: 'a',
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
// plus the step index. Only CSS transitions — Safari-safe, no JS animation loop.
const TILE_GLIDE = 'opacity 420ms ease, transform 480ms cubic-bezier(.34,1.4,.5,1)'
const ART = '/assets/teen/objects'

function TileFactoryScene({ palette: P, task, value, stepIndex, frameCount, ended }: {
  palette: Palette; task: Task; value: number; stepIndex: number; frameCount: number; ended: boolean
}) {
  const resultPhase = ended || stepIndex >= frameCount - 2
  const isRoot = task.mech === 'slide'
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

  const tileColor = done || resultPhase ? P.mint : P.gold
  const boxW = 'clamp(232px, 42vw, 344px)'
  const boxH = 'clamp(300px, 46vh, 440px)'

  // ── CUBE: a small isometric-ish growing stack (base layers of base²) ──
  if (isCube) {
    const layers = base                                    // e.g. 2³ → 2 layers
    const perLayer = base * base
    const filledLayers = Math.min(layers, Math.floor(placed / perLayer))
    const partialInLayer = placed - filledLayers * perLayer
    return (
      <div style={sceneBox(P, boxW, boxH)}>
        <style>{TILE_KEYFRAMES}</style>
        <img src={`${ART}/tile_factory_bg.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(${P.nightTop}cc, ${P.nightBot}e6)` }} />
        <div style={{ position: 'absolute', top: '9%', left: 0, right: 0, textAlign: 'center', fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(20px,3.4vw,30px)', color: resultPhase ? P.mint : P.cream }}>
          {label}{resultPhase ? ` = ${answerText}` : ''}
        </div>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', justifyContent: 'center', gap: 'clamp(4px,0.9vh,8px)', paddingTop: '10%' }}>
          {Array.from({ length: layers }).map((_, li) => {
            const layerActive = li < filledLayers
            const layerPartial = li === filledLayers
            return (
              <div key={li} style={{ display: 'grid', gridTemplateColumns: `repeat(${base}, 1fr)`, gap: 'clamp(3px,0.7vw,6px)', opacity: layerActive || (layerPartial && partialInLayer > 0) ? 1 : 0.16, transform: layerActive ? 'translateY(0)' : 'translateY(-6px)', transition: TILE_GLIDE }}>
                {Array.from({ length: perLayer }).map((_, ci) => {
                  const on = layerActive || (layerPartial && ci < partialInLayer)
                  return <div key={ci} style={{ width: 'clamp(20px,3.8vw,32px)', height: 'clamp(20px,3.8vw,32px)', borderRadius: 5, background: on ? tileColor : 'rgba(255,240,230,0.10)', border: `1.5px solid ${on ? P.goldDeep : P.glassBorder}`, boxShadow: on ? `inset 0 -3px 0 ${P.goldDeep}, 0 2px 6px rgba(0,0,0,0.4)` : 'none', transition: 'background 300ms, border-color 300ms' }} />
                })}
              </div>
            )
          })}
        </div>
        {(resultPhase || done) && (
          <div style={{ position: 'absolute', bottom: '7%', left: '50%', transform: 'translateX(-50%)', padding: '4px 16px', borderRadius: 999, background: P.glass, border: `1px solid ${P.mint}`, color: P.mint, fontWeight: 800, fontSize: 'clamp(12px,1.6vw,16px)', animation: 'tfPop 300ms ease' }}>{total} blocks</div>
        )}
      </div>
    )
  }

  // ── SQUARE (n²) and ROOT — an n×n tile grid that fills row by row ──
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
            {Array.from({ length: side }).map((_, c) => {
              const idx = r * side + c
              const on = idx < placed
              const cellSize = `clamp(${side > 6 ? 16 : 22}px, ${side > 6 ? 4 : 6}vw, ${side > 6 ? 30 : 44}px)`
              return (
                <div key={c} style={{
                  position: 'relative',
                  width: cellSize,
                  height: cellSize,
                  borderRadius: 6,
                  background: on ? 'transparent' : 'rgba(255,240,230,0.09)',
                  border: on ? 'none' : `1.5px solid ${P.glassBorder}`,
                  opacity: on ? 1 : 0.5,
                  transform: on ? 'scale(1)' : 'scale(0.82)',
                  transition: TILE_GLIDE,
                }}>
                  {on && (
                    <img src={`${ART}/tile_ceramic.png`} alt="" style={{
                      position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                      borderRadius: 6,
                      filter: done || resultPhase ? `drop-shadow(0 0 6px ${P.mint}) saturate(0.9)` : 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
                    }} />
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* dimension brackets — show the n × n reasoning; the root chapter highlights the side */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', bottom: 'calc(50% + clamp(4px,1vw,10px))', left: '50%', transform: 'translate(-50%,-140%)', color: isRoot && (resultPhase || done) ? P.mint : P.mutedOnPaper, fontWeight: 800, fontFamily: 'var(--font-numeric)', fontSize: 'clamp(13px,1.8vw,18px)', whiteSpace: 'nowrap', transition: 'color 400ms' }}>
          {side} {isRoot ? '?' : ''}
        </div>
      </div>

      {/* running tile counter through the build */}
      {!isRoot && !resultPhase && placed > 0 && (
        <div style={{ position: 'absolute', bottom: '8%', left: '50%', transform: 'translateX(-50%)', padding: '3px 14px', borderRadius: 999, background: P.glass, border: `1px solid ${P.glassBorder}`, color: done ? P.mint : P.gold, fontWeight: 800, fontFamily: 'var(--font-numeric)', fontSize: 'clamp(11px,1.4vw,15px)', animation: 'tfPop 240ms ease' }}>
          {placed} {placed === 1 ? 'tile' : 'tiles'}
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

const CONFIG: GameConfig<number, Task> = {
  chapterId: 'exponentsRoots',
  title: 'TILE FACTORY',
  motif: '🧱',
  ticketLabel: 'build order',
  palette: P,
  makeTask,
  initialValue: (t) => (t.mech === 'crank' ? 1 : 0),
  grade: (t, v) => Math.abs(v - t.answer) < 1e-6,
  revealText: (t) => `${t.answer}`,
  glide: (t, from, setValue, later) =>
    t.mech === 'crank' ? later(() => setValue(t.answer), 600) : glideNumber(from, t.answer, setValue, later),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) =>
    task.mech === 'crank'
      ? <CrankGear P={palette} value={value} setValue={setValue} base={task.base!} floor={1} disabled={disabled} reveal={reveal} onCommit={onCommit} commitLabel="BUILD ✓" />
      : <SlideValue P={palette} value={value} setValue={setValue} min={task.min!} max={task.max!} step={1} disabled={disabled} reveal={reveal} onCommit={onCommit} commitLabel="BUILD ✓" />,
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
