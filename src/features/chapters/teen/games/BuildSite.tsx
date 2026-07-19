'use client'
/**
 * BuildSite — the Geometry & Measurement chapter as a PLAYABLE GAME where the child
 * SOLVES ON the illustration (a ROOM RENOVATION), never by recalling a formula and
 * dialing the answer:
 *
 *   • AREA — lay unit tiles across the floor; the tiles you place ARE the area.
 *   • PERIMETER — walk the skirting board around the edge; the segments you lay ARE
 *     the perimeter.
 *   • CIRCLE (in terms of π) — tile the SQUARE ON THE RADIUS (r × r → the r²π area),
 *     or lay the DIAMETER across the pond (2r → the dπ edge).
 *   • VOLUME — stack unit cubes layer by layer; the cubes you stack ARE the volume.
 *   • PYTHAGORAS — build the SQUARE ON THE SLOPED SIDE out of the two smaller squares'
 *     tiles; its side length is the answer (find the n whose n×n square matches).
 *   • TRIANGLE (½·b·h) — a right triangle can't be tiled into whole unit squares, so
 *     instead we tile the FULL b×h rectangle (an honest count) and then FOLD it in half
 *     along the diagonal: the two triangles are identical, so one roof = half the tiles.
 *     The ½ is PERFORMED (fold), not computed — and the child sees WHY area = ½·b·h.
 *
 * The measurement always EMERGES from the tiles — nothing is worked out in the head.
 * No slides, no MCQ. Shared adaptive engine underneath (branches by task.kind).
 */
import { useRef } from 'react'
import { Game, type BaseTask, type GameConfig } from './parts/GameShell'
import { Palette, CommitBtn, Nudge, pick, glideNumber, numChoices } from './parts/gameKit'

const P: Palette = {
  nightTop: '#241a12', nightBot: '#33251a',
  cream: '#fff4e8', creamSoft: 'rgba(255,244,232,0.82)',
  inkOnPaper: '#33251a', mutedOnPaper: '#a68a70',
  gold: '#ffc65c', goldDeep: '#d99327',
  coral: '#ff8a6b', coralDeep: '#e25b3f', mint: '#7fd0a0',
  glass: 'rgba(36,26,18,0.6)', glassBorder: 'rgba(255,244,232,0.22)',
}

type Kind = 'fill' | 'border' | 'square' | 'tri'
interface Task extends BaseTask {
  kind: Kind; answer: number; suffix?: string
  rows?: number; cols?: number; layers?: number    // fill / tri (area / circle / volume / triangle rect)
  w?: number; h?: number                            // border room (perimeter)
  targetArea?: number; legA?: number; legB?: number; subtract?: boolean // square (Pythagoras)
  unit?: string                                     // what the count is (tiles / m …)
}
// fill/border → `fill` counts tiles/segments laid; square → `side` is the built length;
// tri → `fill` tiles the rectangle, then `folded` halves it and `half` holds the answer.
interface GV { fill: number; side: number; folded?: boolean; half?: number }

// ── generators (math preserved; answers identical to the shipped version) ──
function area(d: 1 | 2 | 3): Task {
  const [w, h] = d === 1 ? pick([[4, 3], [5, 2]]) : d === 3 ? pick([[7, 4], [6, 5]]) : pick([[6, 3]])
  const answer = w * h
  return {
    kind: 'fill', rows: h, cols: w, title: 'Floor area', badge: `area ${w} m × ${h} m`, tone: 'a', unit: 'm²',
    context: `A room floor is ${w} by ${h} metres, ready for new tiles.`,
    padInstruction: 'Tap the FLOOR AREA in square metres (m²).',
    prompt: `This floor is ${w} by ${h} metres. Lay tiles across it — the tiles you place are the AREA.`,
    say: `This floor is ${w} by ${h} metres. Its area is how many one-metre tiles cover it.`,
    answer,
    work: ['Floor area = the tiles that cover it = length × width.', `${w} × ${h} = ${answer}.`],
  }
}
function perimeter(): Task {
  const [w, h] = pick([[4, 3], [5, 3]])
  const answer = 2 * (w + h)
  return {
    kind: 'border', w, h, title: 'Skirting board', badge: `distance around a ${w} m × ${h} m room`, tone: 'a', unit: 'm',
    context: `A room is ${w} by ${h} metres. Skirting board has to run all the way around its edge.`,
    padInstruction: 'Tap the DISTANCE ALL THE WAY AROUND the edge, in metres (m) — not the floor space inside.',
    prompt: `This room is ${w} by ${h} metres. Lay skirting around the edge — the segments you lay are the PERIMETER.`,
    say: `This room is ${w} by ${h} metres. The perimeter is the whole distance around its edge — all four sides added up.`,
    answer,
    work: ['Perimeter = the edge all the way round = 2 × (width + height).', `2 × (${w} + ${h}) = ${answer}.`],
  }
}
function volume(): Task {
  // seeds deliberately give DIFFERENT answers (8·12·16·18·24) so the same volume
  // can't repeat within one set — `sig` is the badge, and the badge carries the dims.
  const [l, w, h] = pick([[2, 2, 2], [2, 3, 2], [4, 2, 2], [3, 3, 2], [3, 2, 3], [4, 3, 2]])
  const answer = l * w * h
  return {
    kind: 'fill', rows: w, cols: l, layers: h, title: 'Storage box', badge: `volume of a ${l} m × ${w} m × ${h} m box`, tone: 'b', unit: 'm³',
    context: `A storage box measures ${l} metres long, ${w} metres wide and ${h} metres tall.`,
    padInstruction: 'Tap the VOLUME in cubic metres (m³) — how many 1-metre cubes fill the box.',
    prompt: `This box is ${l} × ${w} × ${h}. Stack cubes to fill it — the cubes are the VOLUME.`,
    say: `This box is ${l} by ${w} by ${h} metres. Its volume is how many one-metre cubes fit inside it.`,
    answer,
    work: ['Volume = the cubes that fill it = length × width × height.', `${l} × ${w} × ${h} = ${answer}.`],
  }
}
function circleArea(): Task {
  const r = pick([2, 3, 4, 5])
  const answer = r * r
  return {
    kind: 'fill', rows: r, cols: r, title: 'Round patio', badge: `π × ${r}²`, tone: 'a', suffix: 'π', unit: '',
    context: `A round patio is ${r} metres from the middle to the edge. That is its area, written with π.`,
    padInstruction: 'Tap HOW MANY π — the number that goes in front of π.',
    prompt: `A round patio has radius ${r} m. Tile the SQUARE ON THE RADIUS (${r} × ${r}) — that many π is the area.`,
    say: `A round patio is ${r} metres from the middle to the edge. Work out ${r} squared — that is how many pi the area is.`,
    answer,
    work: ['A circle’s area = π × radius × radius.', `${r} × ${r} = ${answer}, so the area is ${answer}π.`],
  }
}
function circleCircumference(): Task {
  const r = pick([2, 3, 4, 5, 6])
  const d = 2 * r
  return {
    kind: 'fill', rows: 1, cols: d, title: 'Round pond', badge: `2 × π × ${r}`, tone: 'a', suffix: 'π', unit: '',
    context: `A round pond is ${r} metres from the middle to the edge. That is the distance all the way round it, written with π.`,
    padInstruction: 'Tap HOW MANY π — the number that goes in front of π.',
    prompt: `A round pond has diameter ${d} m. Lay the DIAMETER (${d} tiles) — that many π is the edge length.`,
    say: `A round pond is ${r} metres from the middle to the edge. Work out two times ${r} — that is how many pi the distance round it is.`,
    answer: d,
    work: ['The distance round a circle = 2 × π × radius.', `2 × ${r} = ${d}, so it is ${d}π.`],
  }
}
function hypotenuse(): Task {
  const [a, b] = Math.random() < 0.5 ? [3, 4] : [6, 8]
  const answer = Math.round(Math.sqrt(a * a + b * b))
  return {
    kind: 'square', legA: a, legB: b, targetArea: a * a + b * b, title: 'Wall brace', badge: `sloping brace across ${a} m and ${b} m`, tone: 'b', unit: 'm',
    context: `A straight brace cuts across a square corner — ${a} metres along one wall and ${b} metres up the other.`,
    padInstruction: 'Tap how long the SLOPING BRACE is, in metres (m) — the side across the corner, not along the walls.',
    prompt: `A brace crosses a corner ${a} and ${b} m. Build the square on the sloped BRACE — its side is the length.`,
    say: `A brace cuts across a square corner, ${a} metres along one wall and ${b} up the other. Square each wall length, add them, then find what number times itself gives that.`,
    answer,
    work: [`Square each wall side and add: ${a} × ${a} + ${b} × ${b} = ${a * a + b * b}.`, `The brace times itself must give ${a * a + b * b}, so the brace is ${answer} m.`],
  }
}
function missingLeg(): Task {
  const [leg, hyp, other] = pick([[3, 5, 4], [4, 5, 3], [6, 10, 8], [8, 10, 6], [5, 13, 12]])
  return {
    kind: 'square', legA: hyp, legB: leg, targetArea: hyp * hyp - leg * leg, subtract: true, title: 'Missing leg', badge: `sloping side ${hyp} m, one wall ${leg} m — other wall?`, tone: 'b', unit: 'm',
    context: `A square corner has a sloping side of ${hyp} metres. One of its two walls is ${leg} metres.`,
    padInstruction: 'Tap how long the OTHER WALL is, in metres (m) — the straight side that is missing, not the sloping one.',
    prompt: `A right corner has a ${hyp} m sloped side and one ${leg} m side. Build the square on the OTHER side — its side is the length.`,
    say: `A square corner has a sloping side of ${hyp} metres and one wall of ${leg}. Square the sloping side, take away the square of the wall you know, then find what number times itself gives what is left.`,
    answer: other,
    work: [`Square the sloping side, take away the known wall squared: ${hyp} × ${hyp} − ${leg} × ${leg} = ${hyp * hyp - leg * leg}.`, `The missing wall times itself must give ${hyp * hyp - leg * leg}, so it is ${other} m.`],
  }
}

// TRIANGLE (½·b·h): a right triangle won't tile into whole unit squares, so tile the
// full b×h rectangle (honest count) then FOLD along the diagonal — one of the two equal
// triangles is the area. Dims are chosen so the diagonal splits the cells exactly 50/50.
function triangle(): Task {
  const [b, h] = pick([[4, 3], [6, 4], [8, 3], [4, 5], [3, 4], [5, 4]])
  const rect = b * h
  const answer = rect / 2
  return {
    kind: 'tri', rows: h, cols: b, title: 'Roof panel', badge: `half of a ${b} m × ${h} m rectangle`, tone: 'b', unit: 'm²',
    context: `A triangular roof panel is exactly half of a ${b} by ${h} metre rectangle, cut corner to corner.`,
    padInstruction: 'Tap the area of the TRIANGLE in square metres (m²) — HALF the rectangle, not the whole one.',
    prompt: `This roof is HALF of a ${b} by ${h} rectangle. Tile the rectangle, then fold along the diagonal — one half is the AREA.`,
    say: `This roof is half of a ${b} by ${h} metre rectangle. Work out the whole rectangle first, then halve it.`,
    answer,
    work: [`The whole rectangle: ${b} × ${h} = ${rect} m².`, `The triangle is half of it: ${rect} ÷ 2 = ${answer} m².`],
  }
}

// ── ANSWER PAD — the child taps a number instead of working the tiles. Every kind
//    stores its answer in `t.answer` (v.fill / v.side / v.half all compare to it), so
//    the pad is uniform; the distractors are the real geometry misconceptions.
//    Circle tasks answer IN TERMS OF π: the number IS the coefficient (revealText
//    appends the π), so the pad stays bare numbers — same as the count readout.
function padNear(t: Task): number[] {
  const a = t.answer
  switch (t.kind) {
    case 'border': return [t.w! * t.h!]                                       // area instead of perimeter
    case 'tri': return [2 * a]                                                // forgot to fold — the whole rectangle
    case 'square': return t.subtract
      ? [t.legA! - t.legB!, t.legB!]                                          // hyp − leg (not √); the given leg
      : [t.legA! + t.legB!, t.legB!]                                          // a + b (not √); a leg, not the hypotenuse
    default:
      if (t.suffix) return t.rows === 1 ? [(t.cols! / 2) ** 2] : [2 * t.rows!] // circle: area ↔ circumference coefficient
      if (t.layers) return [t.rows! * t.cols!]                                // base area, height forgotten
      return [2 * (t.rows! + t.cols!)]                                        // perimeter instead of area
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  if (d === 1) return pick([() => area(1), perimeter, () => area(1)])()
  if (d === 2) return pick([circleArea, circleCircumference, volume, triangle])()
  return pick([hypotenuse, missingLeg, triangle])()
}

// ── shared job panel ──
function JobPanel({ P, children, height }: { P: Palette; children: React.ReactNode; height?: string }) {
  return (
    <div style={{ width: 'clamp(268px, 50vw, 460px)', height, minHeight: height ? undefined : 'clamp(180px,28vh,260px)', boxSizing: 'border-box', borderRadius: 16, background: `linear-gradient(160deg, ${P.nightTop}, ${P.nightBot})`, border: `1.5px solid ${P.glassBorder}`, boxShadow: '0 12px 34px rgba(0,0,0,0.42)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'clamp(8px,1.4vh,14px)', padding: 'clamp(14px,2.2vw,24px)' }}>
      {children}
    </div>
  )
}
const jobHead = (P: Palette): React.CSSProperties => ({ fontFamily: 'var(--font-body)', fontSize: 'clamp(10px,1.1vw,13px)', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: P.creamSoft, textAlign: 'center' })
const countBig = (P: Palette, on: boolean): React.CSSProperties => ({ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: 'clamp(26px,4.2vw,44px)', lineHeight: 1, color: on ? P.mint : P.gold })

// ── FILL: lay unit tiles across the region (area / circle / volume). The child
//    drag-paints the cells; the count of laid tiles IS the answer. ──
function TileFill({ P, task, value, setValue, disabled, reveal, onCommit, scene }: {
  P: Palette; task: Task; value: GV; setValue: (v: GV) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: GV) => void; scene?: boolean
}) {
  const rows = task.rows!, cols = task.cols!, layers = task.layers ?? 1
  const per = rows * cols
  const total = per * layers
  const painting = useRef(false)
  const laid = value.fill
  const fillCol = reveal || scene ? P.mint : P.gold
  const cellPx = `clamp(16px, ${Math.max(5, 40 / cols)}vw, 46px)`
  const setLaid = (n: number) => { if (!disabled && !scene) setValue({ ...value, fill: Math.max(0, Math.min(total, n)) }) }
  const grid = (layer: number) => (
    <div key={layer} onPointerUp={() => { painting.current = false }} onPointerLeave={() => { painting.current = false }}
      style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${cellPx})`, gap: 3, padding: 6, borderRadius: 8, background: 'rgba(0,0,0,0.28)', border: `2px solid ${P.glassBorder}`, touchAction: 'none' }}>
      {Array.from({ length: per }, (_, i) => {
        const idx = layer * per + i
        const on = idx < laid
        return (
          <div key={i}
            onPointerDown={() => { if (disabled || scene) return; painting.current = true; setLaid(idx + 1) }}
            onPointerEnter={() => { if (painting.current) setLaid(idx + 1) }}
            style={{ width: cellPx, height: cellPx, borderRadius: 3, background: on ? `linear-gradient(${fillCol}, ${P.goldDeep})` : 'rgba(255,244,232,0.06)', border: `1px solid ${on ? P.goldDeep : 'rgba(255,244,232,0.18)'}`, cursor: disabled || scene ? 'default' : 'pointer', transition: 'background 90ms' }} />
        )
      })}
    </div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px,1.4vw,16px)', width: '100%' }}>
      <JobPanel P={P} height={scene ? 'clamp(300px,46vh,440px)' : undefined}>
        <div style={jobHead(P)}>🏠 {task.badge}{layers > 1 ? ` · ${layers} layers` : ''}</div>
        <div style={{ display: 'flex', gap: 'clamp(6px,1.2vw,12px)', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start' }}>{Array.from({ length: layers }, (_, L) => grid(L))}</div>
        <div style={countBig(P, laid === total)}>{laid}{task.suffix ?? ''} {task.unit}</div>
        <div style={{ minHeight: '1.3em', fontFamily: 'var(--font-body)', fontSize: 'clamp(10px,1.1vw,14px)', color: laid === total ? P.mint : P.creamSoft }}>{laid === total ? 'floor covered ✓' : `${laid} of ${total} laid`}</div>
      </JobPanel>
      {!scene && <CommitBtn P={P} label="ORDER ✓" disabled={disabled} onClick={() => onCommit(value)} />}
    </div>
  )
}

// ── BORDER: lay skirting on each edge segment around the room (perimeter). ──
function BorderWalk({ P, task, value, setValue, disabled, reveal, onCommit, scene }: {
  P: Palette; task: Task; value: GV; setValue: (v: GV) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: GV) => void; scene?: boolean
}) {
  const w = task.w!, h = task.h!
  const total = 2 * (w + h)
  const laid = value.fill
  const col = reveal || scene ? P.mint : P.gold
  const S = 220, pad = 26, cw = (S - 2 * pad) / w, ch = (S - 2 * pad) / h
  // ordered boundary segments: top L→R, right T→B, bottom R→L, left B→T
  const segs: { x1: number; y1: number; x2: number; y2: number }[] = []
  for (let i = 0; i < w; i++) segs.push({ x1: pad + i * cw, y1: pad, x2: pad + (i + 1) * cw, y2: pad })
  for (let i = 0; i < h; i++) segs.push({ x1: S - pad, y1: pad + i * ch, x2: S - pad, y2: pad + (i + 1) * ch })
  for (let i = 0; i < w; i++) segs.push({ x1: S - pad - i * cw, y1: S - pad, x2: S - pad - (i + 1) * cw, y2: S - pad })
  for (let i = 0; i < h; i++) segs.push({ x1: pad, y1: S - pad - i * ch, x2: pad, y2: S - pad - (i + 1) * ch })
  const setLaid = (n: number) => { if (!disabled && !scene) setValue({ ...value, fill: Math.max(0, Math.min(total, n)) }) }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px,1.4vw,16px)', width: '100%' }}>
      <JobPanel P={P} height={scene ? 'clamp(300px,46vh,440px)' : undefined}>
        <div style={jobHead(P)}>🏠 skirting · {w} × {h} room</div>
        <svg viewBox={`0 0 ${S} ${S}`} style={{ width: 'min(70vw, 300px)', height: 'auto', touchAction: 'none' }}>
          <rect x={pad} y={pad} width={S - 2 * pad} height={S - 2 * pad} fill="rgba(0,0,0,0.28)" stroke={P.glassBorder} strokeWidth={1} />
          {segs.map((s, i) => {
            const on = i < laid
            return <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={on ? col : 'rgba(255,244,232,0.22)'} strokeWidth={on ? 7 : 4} strokeLinecap="round"
              onPointerDown={() => setLaid(i + 1)} style={{ cursor: disabled || scene ? 'default' : 'pointer' }} />
          })}
        </svg>
        <div style={countBig(P, laid === total)}>{laid} {task.unit}</div>
        <div style={{ minHeight: '1.3em', fontFamily: 'var(--font-body)', fontSize: 'clamp(10px,1.1vw,14px)', color: laid === total ? P.mint : P.creamSoft }}>{laid === total ? 'edge covered ✓' : `${laid} of ${total} laid · tap the next segment`}</div>
      </JobPanel>
      {!scene && <CommitBtn P={P} label="ORDER ✓" disabled={disabled} onClick={() => onCommit(value)} />}
    </div>
  )
}

// ── SQUARE: build the square on the sloped side to match the two smaller squares
//    (Pythagoras). Set the side n; its area n² must equal the target area. ──
function BuildSquare({ P, task, value, setValue, disabled, reveal, onCommit, scene }: {
  P: Palette; task: Task; value: GV; setValue: (v: GV) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: GV) => void; scene?: boolean
}) {
  const n = value.side
  const target = task.targetArea!
  const built = n * n
  const hit = built === target
  const col = reveal || scene ? P.mint : hit ? P.mint : P.gold
  const set = (nn: number) => { if (!disabled && !scene) setValue({ ...value, side: Math.max(0, Math.min(15, nn)) }) }
  const cellPx = `clamp(9px, ${Math.max(3, 26 / Math.max(1, n))}vw, 22px)`
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px,1.4vw,16px)', width: '100%' }}>
      <JobPanel P={P} height={scene ? 'clamp(300px,46vh,440px)' : undefined}>
        <div style={jobHead(P)}>🏠 square on the sloped side</div>
        <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(11px,1.3vw,16px)', color: P.creamSoft }}>{task.subtract ? `${task.legA}² − ${task.legB}²` : `${task.legA}² + ${task.legB}²`} = {target}</div>
        {/* the square the child is building */}
        {n > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${n}, ${cellPx})`, gap: 2, padding: 5, borderRadius: 8, background: 'rgba(0,0,0,0.28)', border: `2px solid ${col}` }}>
            {Array.from({ length: built }, (_, i) => <div key={i} style={{ width: cellPx, height: cellPx, borderRadius: 2, background: `linear-gradient(${col}, ${P.goldDeep})` }} />)}
          </div>
        ) : <div style={{ fontSize: 'clamp(10px,1.1vw,13px)', color: P.mutedOnPaper }}>set the side below</div>}
        <div style={countBig(P, hit)}>{built} {hit ? '= ✓' : built < target ? '· too small' : '· too big'}</div>
        <div style={{ minHeight: '1.3em', fontFamily: 'var(--font-body)', fontSize: 'clamp(10px,1.1vw,14px)', color: hit ? P.mint : P.creamSoft }}>{hit ? `side = ${n} m ✓` : `match the area ${target}`}</div>
      </JobPanel>
      {!scene && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Nudge P={P} label="−" disabled={disabled} onClick={() => set(n - 1)} />
            <div style={{ minWidth: 120, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(22px,2.4vw,32px)', fontWeight: 800, color: reveal ? P.mint : P.gold }}>side {n}</div>
              <div style={{ fontSize: 'clamp(11px,1.1vw,14px)', color: P.creamSoft }}>metres</div>
            </div>
            <Nudge P={P} label="+" disabled={disabled} onClick={() => set(n + 1)} />
          </div>
          <CommitBtn P={P} label="ORDER ✓" disabled={disabled} onClick={() => onCommit(value)} />
        </>
      )}
    </div>
  )
}

// ── TRIANGLE: tile the full b×h rectangle, then FOLD it in half along the diagonal.
//    The two triangles are identical, so one roof = half the tiles = the area. The child
//    lays every tile (honest count) then taps "fold in half" — the ½ is performed, not
//    computed, and they see WHY a triangle is half its rectangle. ──
function RoofFold({ P, task, value, setValue, disabled, reveal, onCommit, scene }: {
  P: Palette; task: Task; value: GV; setValue: (v: GV) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: GV) => void; scene?: boolean
}) {
  const rows = task.rows!, cols = task.cols!
  const total = rows * cols
  const answer = total / 2
  const painting = useRef(false)
  const laid = value.fill
  const folded = !!value.folded
  const full = laid >= total
  const cellPx = `clamp(16px, ${Math.max(5, 40 / cols)}vw, 46px)`
  // bottom-left triangle (below the top-left→bottom-right diagonal) = the roof / answer half
  const isRoof = (c: number, r: number) => (r + 0.5) * cols > (c + 0.5) * rows
  const setLaid = (n: number) => { if (!disabled && !scene && !folded) setValue({ ...value, fill: Math.max(0, Math.min(total, n)) }) }
  const doFold = () => { if (!disabled && !scene) setValue({ ...value, folded: true, half: answer }) }
  const count = folded ? answer : laid
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px,1.4vw,16px)', width: '100%' }}>
      <JobPanel P={P} height={scene ? 'clamp(300px,46vh,440px)' : undefined}>
        <div style={jobHead(P)}>🏠 {task.badge} · roof = half the rectangle</div>
        <div style={{ position: 'relative', touchAction: 'none' }}
          onPointerUp={() => { painting.current = false }} onPointerLeave={() => { painting.current = false }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${cellPx})`, gap: 3, padding: 6, borderRadius: 8, background: 'rgba(0,0,0,0.28)', border: `2px solid ${P.glassBorder}` }}>
            {Array.from({ length: total }, (_, i) => {
              const c = i % cols, r = Math.floor(i / cols)
              const on = i < laid
              const roof = isRoof(c, r)
              let bg = 'rgba(255,244,232,0.06)', bd = 'rgba(255,244,232,0.18)', op = 1
              if (folded) {
                if (roof) { bg = `linear-gradient(${P.mint}, ${P.goldDeep})`; bd = P.mint }
                else { op = 0.28 }
              } else if (on) {
                bg = `linear-gradient(${P.gold}, ${P.goldDeep})`; bd = P.goldDeep
              }
              return (
                <div key={i}
                  onPointerDown={() => { if (disabled || scene || folded) return; painting.current = true; setLaid(i + 1) }}
                  onPointerEnter={() => { if (painting.current && !folded) setLaid(i + 1) }}
                  style={{ width: cellPx, height: cellPx, borderRadius: 3, background: bg, border: `1px solid ${bd}`, opacity: op, cursor: disabled || scene || folded ? 'default' : 'pointer', transition: 'background 160ms, opacity 300ms' }} />
              )
            })}
          </div>
          {(full || folded) && (
            <svg viewBox={`0 0 ${cols} ${rows}`} preserveAspectRatio="none" style={{ position: 'absolute', inset: 6, width: 'calc(100% - 12px)', height: 'calc(100% - 12px)', pointerEvents: 'none' }}>
              <line x1={0} y1={0} x2={cols} y2={rows} stroke={folded ? P.mint : 'rgba(255,244,232,0.55)'} strokeWidth={folded ? 3 : 2} strokeDasharray={folded ? undefined : '6 5'} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </svg>
          )}
        </div>
        <div style={countBig(P, folded)}>{count} {task.unit}</div>
        <div style={{ minHeight: '1.3em', fontFamily: 'var(--font-body)', fontSize: 'clamp(10px,1.1vw,14px)', color: folded ? P.mint : P.creamSoft }}>
          {folded ? `two equal halves → one roof = ${answer} ✓` : full ? 'rectangle tiled — now fold it in half ▽' : `${laid} of ${total} tiles`}
        </div>
      </JobPanel>
      {!scene && !disabled && (
        folded
          ? <CommitBtn P={P} label="ORDER ✓" onClick={() => onCommit(value)} />
          : full
            ? <CommitBtn P={P} label="Fold in half ▽" onClick={doFold} />
            : <div style={{ fontSize: 'clamp(10px,1.1vw,13px)', color: P.mutedOnPaper }}>tile the whole rectangle first</div>
      )}
    </div>
  )
}

const InstrumentFor = (p: { P: Palette; task: Task; value: GV; setValue: (v: GV) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: GV) => void; scene?: boolean }) =>
  p.task.kind === 'fill' ? <TileFill {...p} /> : p.task.kind === 'border' ? <BorderWalk {...p} /> : p.task.kind === 'tri' ? <RoofFold {...p} /> : <BuildSquare {...p} />

// ── worked example (6×4 floor area → 24) + guided (3×2 → 6) ──
const DEMO_TASK: Task = { kind: 'fill', rows: 4, cols: 6, title: 'Floor area', badge: 'area 6×4', tone: 'a', answer: 24, unit: 'm²', context: 'A room floor is 6 by 4 metres.', instruction: 'Lay tiles across the whole floor.', prompt: '', say: '', work: [] }
const GUIDED_TASK: Task = {
  kind: 'fill', rows: 2, cols: 3, title: 'Floor area', badge: 'area 3 m × 2 m', tone: 'a', answer: 6, unit: 'm²',
  context: 'A room floor is 3 by 2 metres, ready for tiles.',
  padInstruction: 'Tap the FLOOR AREA in square metres (m²).',
  prompt: 'This floor is 3 by 2 metres. Lay tiles across it — the tiles are the area.',
  say: 'This floor is three by two metres. Lay tiles across the whole floor. The tiles you place are the area.',
  work: ['Area = the tiles that cover it.', '3 × 2 = 6.'],
}
const DEMO_STATES: GV[] = [{ fill: 0, side: 0 }, { fill: 6, side: 0 }, { fill: 12, side: 0 }, { fill: 18, side: 0 }, { fill: 24, side: 0 }]

const CONFIG: GameConfig<GV, Task> = {
  chapterId: 'geometryMeasurement',
  title: 'ROOM RENO',
  motif: '🏠',
  ticketLabel: 'job sheet',
  palette: P,
  makeTask,
  initialValue: () => ({ fill: 0, side: 0 }),
  answerPad: (t) => numChoices(t.answer, padNear(t), { min: 1 }),
  // AnswerPad submits a raw number (V is an object), so grade takes it on the fast path.
  grade: (t, v) => typeof (v as unknown) === 'number'
    ? (v as unknown as number) === t.answer
    : (t.kind === 'square' ? v.side === t.answer : t.kind === 'tri' ? v.half === t.answer : v.fill === t.answer),
  revealText: (t) => `${t.answer}${t.suffix ?? ''}`,
  glide: (t, from, setValue, later) => {
    if (t.kind === 'square') { glideNumber(from.side, t.answer, (n) => setValue({ fill: 0, side: n }), later); return }
    if (t.kind === 'tri') {
      const total = t.rows! * t.cols!
      glideNumber(from.fill, total, (n) => setValue({ fill: n, side: 0 }), later)
      later(() => setValue({ fill: total, side: 0, folded: true, half: t.answer }), 2000)
      return
    }
    glideNumber(from.fill, t.answer, (n) => setValue({ fill: n, side: 0 }), later)
  },
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) =>
    <InstrumentFor P={palette} task={task} value={value} setValue={setValue} disabled={disabled} reveal={reveal} onCommit={onCommit} />,
  tutorial: {
    task: DEMO_TASK,
    initial: DEMO_STATES[0],
    hand: 'drag',
    steps: [
      { say: "Time to renovate! First job: tile a floor. To find the AREA, we don't calculate — we lay tiles and count them. This floor is six metres long and four wide.", value: DEMO_STATES[0], hand: 'drag', board: 'floor: 6 long, 4 wide' },
      { say: "Lay the first row — six tiles fit along the length.", value: DEMO_STATES[1], hand: 'drag', board: 'row 1: 6 tiles' },
      { say: "Lay the second row — that's twelve tiles so far.", value: DEMO_STATES[2], hand: 'drag', board: 'rows 1–2: 12' },
      { say: "Third row — eighteen.", value: DEMO_STATES[3], hand: 'drag', board: 'rows 1–3: 18' },
      { say: "The last row fills the floor — twenty-four tiles. That's four rows of six.", value: DEMO_STATES[4], hand: 'drag', board: '6 × 4 = 24 tiles' },
      { say: "The tiles cover twenty-four square metres — that IS the area. When it's covered, order them. Now let's try one together.", value: DEMO_STATES[4], hand: 'drag', board: 'area = 24 m²' },
    ],
  },
  guided: {
    task: GUIDED_TASK,
    coach: 'Your turn — I will help.',
    hand: 'drag',
  },
  TutorialScene: ({ palette, task, value }) => <InstrumentFor P={palette} task={task} value={value} setValue={() => {}} disabled onCommit={() => {}} scene />,
  start: { blurb: <><strong style={{ color: P.cream }}>You&apos;re renovating a room.</strong> Tile the floors, lay the skirting, stack the storage cubes and build the braces — the tiles you place are the measurement.</>, ticket: { title: 'Floor area', badge: '4 × 3', tone: 'a' }, startLabel: 'Start the job →' },
  overview: {
    say: "Here is what we are figuring out: we are tiling a room floor, and to find the area we don't calculate — we lay tiles and count them. The floor is six metres long and four wide, so we lay four rows of six tiles and the tiles that cover it are the area.",
    problem: <>How many tiles cover a <strong>6 m by 4 m</strong> floor? That count <em>is</em> the <strong>area</strong>.</>,
    points: [
      <>Don&apos;t calculate — <strong>lay the tiles</strong> and count them.</>,
      <>Four rows of six: <strong>6, 12, 18, 24</strong>.</>,
      <>The tiles cover <strong>24 m²</strong> — that&apos;s the area.</>,
    ],
  },
  sig: (t) => t.badge,
}

export default function BuildSite(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
