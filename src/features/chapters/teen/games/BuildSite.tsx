'use client'
/**
 * BuildSite — the Geometry & Measurement chapter as a PLAYABLE GAME.
 * World: a ROOM RENOVATION. The kid runs each job by DIALLING in the
 * measurement — floor area (tiles/carpet), skirting-board perimeter, box volume,
 * brace length (Pythagoras) and gable area — on a warm SlideValue and locking it in.
 * No slides, no MCQ. Shared adaptive engine underneath.
 *
 * Teaching is "I do → we do → you do": a step-by-step WALKTHROUGH (config.tutorial)
 * works a 6×4 floor area, dialling the value up strip by strip, then a GUIDED job
 * (config.guided) lets the kid measure a 3×2 floor with Milo coaching (not scored),
 * then the scored loop.
 */
import { Game, type BaseTask, type GameConfig } from './parts/GameShell'
import { Palette, SlideValue, pick, glideNumber } from './parts/gameKit'

const P: Palette = {
  nightTop: '#241a12', nightBot: '#33251a',
  cream: '#fff4e8', creamSoft: 'rgba(255,244,232,0.82)',
  inkOnPaper: '#33251a', mutedOnPaper: '#a68a70',
  gold: '#ffc65c', goldDeep: '#d99327',
  coral: '#ff8a6b', coralDeep: '#e25b3f', mint: '#7fd0a0',
  glass: 'rgba(36,26,18,0.6)', glassBorder: 'rgba(255,244,232,0.22)',
}

interface Task extends BaseTask { answer: number }
const MIN = 0, MAX = 60

function area(d: 1 | 2 | 3): Task {
  const [w, h] = d === 1 ? pick([[4, 3], [5, 2]]) : pick([[6, 3]])
  const answer = w * h
  return {
    title: 'Floor area', badge: `area ${w}×${h}`, tone: 'a',
    prompt: `This room floor is ${w} by ${h} metres. Dial the floor AREA — that's how much carpet to buy.`,
    say: `This room floor is ${w} by ${h} metres. Dial the floor area — that's how much carpet to buy.`,
    answer,
    work: ['Floor area = width × height.', `${w} × ${h} = ${answer}.`],
  }
}
function perimeter(): Task {
  const [w, h] = pick([[4, 3]])
  const answer = 2 * (w + h)
  return {
    title: 'Skirting board', badge: `perim ${w}×${h}`, tone: 'a',
    prompt: `This room is ${w} by ${h} metres. Dial the PERIMETER — the length of skirting board around the whole room.`,
    say: `This room is ${w} by ${h} metres. Dial the perimeter, the length of skirting board around the whole room.`,
    answer,
    work: ['Perimeter = 2 × (width + height).', `2 × (${w} + ${h}) = ${answer}.`],
  }
}
function volume(): Task {
  const [l, w, h] = Math.random() < 0.5 ? pick([[2, 3, 4]]) : pick([[3, 3, 3]])
  const answer = l * w * h
  return {
    title: 'Storage box', badge: `vol ${l}×${w}×${h}`, tone: 'b',
    prompt: `A storage box is ${l} × ${w} × ${h}. Dial the VOLUME.`,
    say: `A storage box is ${l} by ${w} by ${h}. Dial the volume.`,
    answer,
    work: ['Volume = length × width × height.', `${l} × ${w} × ${h} = ${answer}.`],
  }
}
function hypotenuse(): Task {
  const [a, b] = Math.random() < 0.5 ? pick([[3, 4]]) : pick([[6, 8]])
  const answer = Math.round(Math.sqrt(a * a + b * b))
  return {
    title: 'Wall brace', badge: `brace ${a},${b}`, tone: 'b',
    prompt: `A diagonal brace fits a corner ${a} and ${b} metres. Dial the length of the sloped BRACE (the hypotenuse).`,
    say: `A diagonal brace fits a corner ${a} and ${b} metres. Dial the length of the sloped brace, the hypotenuse.`,
    answer,
    work: [`Pythagoras: brace² = ${a}² + ${b}².`, `√(${a * a} + ${b * b}) = ${answer}.`],
  }
}
function triangle(): Task {
  const [base, height] = pick([[6, 4]])
  const answer = (base * height) / 2
  return {
    title: 'Attic gable', badge: `tri ${base}×${height}`, tone: 'b',
    prompt: `An attic gable wall has base ${base} and height ${height}. Dial its AREA.`,
    say: `An attic gable wall has base ${base} and height ${height}. Dial its area.`,
    answer,
    work: ['Triangle area = ½ × base × height.', `½ × ${base} × ${height} = ${answer}.`],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  if (d === 1) return pick([() => area(1), perimeter, () => area(1)])()
  if (d === 2) return pick([volume, hypotenuse, () => area(2)])()
  return pick([hypotenuse, volume, triangle])()
}

// ── worked example for the walkthrough (6×4 floor area → 24) + guided order (3×2 → 6) ──
const DEMO_TASK: Task = { title: 'Floor area', badge: 'area 6×4', tone: 'a', answer: 24, prompt: '', say: '', work: [] }
const GUIDED_TASK: Task = {
  title: 'Floor area', badge: 'area 3×2', tone: 'a', answer: 6,
  prompt: 'This room floor is 3 by 2 metres. Work out the floor area, dial it, then press Order.',
  say: 'This room floor is three by two metres. Floor area is length times width. Dial it, then press order.',
  work: ['Floor area = width × height.', '3 × 2 = 6.'],
}

// ── Animated walkthrough scene — the storyboard, in motion (ILLUSTRATED) ──────
// A cutaway ROOM floor plan dressed in generated illustrations (Nano Banana 2):
// a bold-cartoon empty renovation-room backdrop, and a real terracotta floor TILE
// image laid into each grid cell. The 6×4 floor is a grid of 24 unit tiles. As the
// narration counts rows, tiles POP IN row by row (CSS transition on opacity/scale,
// keyed to the step's `value` = tiles laid so far), the running count climbs, and
// at the end the full floor glows mint under "6 × 4 = 24 m²". Unlaid cells keep the
// faint code-drawn placeholder. The one tile image is reused across all 24 cells.
// Driven purely by the walkthrough's per-step `value` + step index. No JS loops.
const ROOM_W = 6, ROOM_H = 4, ROOM_TILES = ROOM_W * ROOM_H
const TILE_POP = 'opacity 420ms ease, transform 420ms cubic-bezier(.34,1.4,.5,1), background 500ms, box-shadow 500ms'
const ART = '/assets/teen/objects'

function RoomRenoScene({ palette: P, value, stepIndex, frameCount, ended }: {
  palette: Palette; value: number; stepIndex: number; frameCount: number; ended: boolean
}) {
  const laid = Math.max(0, Math.min(ROOM_TILES, Math.round(value)))   // tiles placed so far
  const rowsDone = Math.floor(laid / ROOM_W)                          // completed rows (0..4)
  const resultPhase = ended || stepIndex >= frameCount - 2            // last 2 beats: the answer
  const intro = stepIndex === 0
  const showDims = stepIndex >= 3                                     // once the 6×4 is stated
  const counting = stepIndex >= 6 && !resultPhase                     // laying tiles row by row

  return (
    <div style={{ position: 'relative', width: 'clamp(232px, 44vw, 360px)', height: 'clamp(300px, 46vh, 440px)', borderRadius: 16, background: P.nightBot, border: `1.5px solid ${P.glassBorder}`, overflow: 'hidden', boxShadow: '0 12px 34px rgba(0,0,0,0.42)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '18px 14px' }}>
      <style>{'@keyframes rrPulse{0%,100%{opacity:.55}50%{opacity:1}}@keyframes rrPop{0%{opacity:0;transform:translateX(-50%) scale(.7)}100%{opacity:1;transform:translateX(-50%) scale(1)}}'}</style>

      {/* illustrated empty-renovation-room backdrop + a soft dark scrim so the grid + labels read clearly */}
      <img src={`${ART}/room_empty_reno.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(rgba(36,26,18,0.42), rgba(36,26,18,0.66))' }} />

      {/* header — the job, then the running count */}
      <div style={{ position: 'relative', zIndex: 2, fontFamily: 'var(--font-numeric)', fontSize: 'clamp(11px,1.3vw,14px)', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: resultPhase ? P.mint : P.gold, marginBottom: 10, transition: 'color 400ms', textAlign: 'center' }}>
        {intro ? 'Room Reno · tile the floor' : resultPhase ? `6 × 4 = ${ROOM_TILES} m²` : counting ? `laid: ${laid} tile${laid === 1 ? '' : 's'}` : 'the floor: 6 × 4'}
      </div>

      {/* the floor plan: a bordered room with a 6×4 tile grid */}
      <div style={{ position: 'relative', zIndex: 2, padding: 'clamp(10px,2.2vw,18px)' }}>
        {/* width label above */}
        {showDims && (
          <div style={{ position: 'absolute', top: 'clamp(-6px,-0.4vw,-2px)', left: '50%', transform: 'translateX(-50%)', color: P.coral, fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(11px,1.4vw,15px)', whiteSpace: 'nowrap', animation: 'rrPop 300ms ease' }}>← 6 m →</div>
        )}
        {/* height label at left */}
        {showDims && (
          <div style={{ position: 'absolute', left: 'clamp(-30px,-3vw,-8px)', top: '50%', transform: 'translateY(-50%) rotate(-90deg)', transformOrigin: 'center', color: P.mint, fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(11px,1.4vw,15px)', whiteSpace: 'nowrap' }}>← 4 m →</div>
        )}

        {/* room outline + tile grid */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${ROOM_W}, 1fr)`, gridTemplateRows: `repeat(${ROOM_H}, 1fr)`, gap: 'clamp(2px,0.5vw,4px)', width: 'clamp(180px,32vw,264px)', height: 'clamp(120px,22vw,176px)', padding: 'clamp(3px,0.7vw,6px)', borderRadius: 8, background: 'rgba(0,0,0,0.28)', border: `2px solid ${resultPhase ? P.mint : P.glassBorder}`, boxShadow: resultPhase ? `0 0 20px ${P.mint}66` : 'none', transition: 'border-color 500ms, box-shadow 500ms' }}>
          {Array.from({ length: ROOM_TILES }).map((_, i) => {
            const row = Math.floor(i / ROOM_W)       // 0..3 (top row laid first)
            const shown = i < laid                    // laid cell → real tile image
            const inFreshRow = counting && shown && row === rowsDone - 1
            return (
              <div key={i} style={{
                position: 'relative',
                borderRadius: 3,
                overflow: 'hidden',
                transition: TILE_POP,
                transitionDelay: shown ? `${(i % ROOM_W) * 55}ms` : '0ms',
                opacity: shown ? 1 : 0.12,
                transform: shown ? 'scale(1)' : 'scale(0.6)',
                background: shown ? 'transparent' : 'rgba(255,244,232,0.05)',
                border: `1px solid ${shown ? 'rgba(0,0,0,0.28)' : P.glassBorder}`,
                boxShadow: resultPhase && shown ? `0 0 8px ${P.mint}88` : 'none',
              }}>
                {shown && (
                  <>
                    {/* real terracotta floor tile fills the cell */}
                    <img src={`${ART}/room_floor_tile.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    {/* fresh-row highlight (warm wash) while counting; mint glow at the result */}
                    <div style={{ position: 'absolute', inset: 0, transition: 'background 500ms, box-shadow 500ms', background: resultPhase ? `${P.mint}55` : inFreshRow ? `${P.gold}44` : 'transparent', boxShadow: resultPhase ? `inset 0 0 6px ${P.mint}` : 'none' }} />
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* footer cue */}
      <div style={{ position: 'relative', zIndex: 2, marginTop: 12, minHeight: 'clamp(20px,2.6vh,26px)', display: 'flex', alignItems: 'center' }}>
        {intro && (
          <div style={{ color: P.creamSoft, fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 'clamp(11px,1.4vw,15px)' }}>area = length × width</div>
        )}
        {counting && (
          <div style={{ padding: '4px 14px', borderRadius: 999, background: P.glass, border: `1px solid ${P.glassBorder}`, color: P.gold, fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(11px,1.3vw,14px)', animation: 'rrPulse 900ms ease-in-out infinite' }}>
            {rowsDone > 0 ? `${rowsDone} row${rowsDone === 1 ? '' : 's'} of 6 = ${laid}` : 'laying tiles…'}
          </div>
        )}
        {resultPhase && (
          <div style={{ color: P.mint, fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(14px,1.8vw,20px)', textShadow: `0 0 14px ${P.mint}66` }}>{ROOM_TILES} m² of tiles ✓</div>
        )}
      </div>
    </div>
  )
}

const CONFIG: GameConfig<number, Task> = {
  chapterId: 'geometryMeasurement',
  title: 'ROOM RENO',
  motif: '🏠',
  ticketLabel: 'job sheet',
  palette: P,
  makeTask,
  initialValue: () => 0,
  grade: (t, v) => Math.abs(v - t.answer) < 1e-6,
  revealText: (t) => `${t.answer}`,
  glide: (t, from, setValue, later) => glideNumber(from, t.answer, setValue, later),
  Instrument: ({ value, setValue, disabled, reveal, palette, onCommit }) => (
    <SlideValue P={palette} value={value} setValue={setValue} min={MIN} max={MAX} step={1} disabled={disabled} reveal={reveal} onCommit={onCommit} commitLabel="ORDER ✓" />
  ),
  tutorial: {
    task: DEMO_TASK,
    initial: 0,
    hand: 'drag',
    steps: [
      { say: "Time to renovate a room! Drag this dial to set a measurement, then order it.", value: 0, hand: 'drag' },
      { say: "First job: we're tiling the floor, so we need its AREA — that's how much tile to buy.", value: 0, hand: 'drag', board: 'tiles: need the AREA' },
      { say: "To find the area of a floor, we multiply its length by its width. Let's build it up slowly.", value: 0, board: 'area = length × width' },
      { say: "This room is six metres long and four metres wide.", value: 0, board: 'floor: 6 long, 4 wide' },
      { say: "Picture the floor covered in tiles. Along one edge, six tiles fit in a row.", value: 0, board: '6 tiles in a row' },
      { say: "And the room is four metres wide, so there are four of those rows, one behind another.", value: 0, board: '4 rows of 6' },
      { say: "Now count the tiles, row by row. One row is six.", value: 6, hand: 'drag', board: 'row 1: 6' },
      { say: "Two rows: six and six more makes twelve. Watch the dial climb.", value: 12, hand: 'drag', board: 'rows 1–2: 12' },
      { say: "Three rows: twelve and six is eighteen.", value: 18, hand: 'drag', board: 'rows 1–3: 18' },
      { say: "Four rows: eighteen and six is twenty-four. Six, twelve, eighteen, twenty-four.", value: 24, hand: 'drag', board: 'rows 1–4: 24' },
      { say: "So six times four is twenty-four. We need twenty-four square metres of tiles.", value: 24, hand: 'drag', board: '6 × 4 = 24 m²' },
      { say: "When the number is right, press order to buy them. Now let's try one together.", value: 24, hand: 'tap' },
    ],
  },
  guided: {
    task: GUIDED_TASK,
    coach: 'Your turn — I will help.',
    hand: 'drag',
  },
  TutorialScene: RoomRenoScene,
  start: { blurb: <><strong style={{ color: P.cream }}>You&apos;re renovating a room.</strong> Work out each floor area, skirting length, volume and brace, then dial it in and order it.</>, ticket: { title: 'Floor area', badge: '4 × 3', tone: 'a' }, startLabel: 'Start the job →' },
  overview: {
    say: "Here is what we are figuring out: we are tiling a room floor and need to know how much tile to buy. The floor is six metres long and four metres wide, so we will work out its area — six times four square metres.",
    problem: <>How much tile covers the floor? We&apos;ll measure a room that&apos;s <strong>6 m by 4 m</strong> and find its <strong>AREA</strong>.</>,
    points: [
      <>Floor <strong>area = length × width</strong> — that&apos;s how much tile it takes to cover it.</>,
      <>We&apos;re working out <strong>6 × 4</strong> by counting the tiles row by row.</>,
      <>The answer is in <strong>square metres (m²)</strong> — watch it land on <strong>24</strong>.</>,
    ],
  },
  sig: (t) => t.badge,
}

export default function BuildSite(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
