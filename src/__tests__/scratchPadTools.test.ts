/**
 * REVIEW 1, Q6 (founder, 2026-09-24): the scratch pad gets colours and an Arrow, and Undo works.
 * Driven on the real component, with a canvas that RECORDS what is drawn (jsdom has none): a pencil line in the chosen
 * colour, an arrow with a head at the point where the drag ended, Undo taking the last stroke away, Clear taken back by
 * Undo, the eraser, and a new problem giving a clean pad. Every control has a name; the chosen colour carries a ✓ and
 * aria-pressed, never colour alone.
 * ⚠️ Colours and names are written out here, never imported.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { createElement, act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as never

/** What the canvas was last asked to draw, as a list of finished strokes: colour, mode, points, and whether a head was filled. */
type Drawn = { color: string; erase: boolean; pts: [number, number][]; head: boolean }
let frame: Drawn[] = []
const recorder = () => {
  let cur: Drawn | null = null, st = { strokeStyle: '', fillStyle: '', globalCompositeOperation: 'source-over', lineWidth: 1, lineCap: '', lineJoin: '' }
  const ctx = {
    canvas: { width: 300, height: 300 },
    clearRect: () => { frame = [] },
    beginPath: () => { cur = null },
    moveTo: (x: number, y: number) => { cur = { color: st.strokeStyle, erase: st.globalCompositeOperation === 'destination-out', pts: [[x, y]], head: false } },
    lineTo: (x: number, y: number) => { cur?.pts.push([x, y]) },
    stroke: () => { if (cur) frame.push(cur) },
    closePath: () => {},
    fill: () => { const last = frame.at(-1); if (last) last.head = true },
  }
  return new Proxy(ctx, { get: (t, k) => (k in t ? t[k as keyof typeof t] : (st as Record<string, unknown>)[k as string]), set: (_t, k, v) => { (st as Record<string, unknown>)[k as string] = v; return true } })
}
HTMLCanvasElement.prototype.getContext = function () { return recorder() } as never

const { ScratchPad } = await import('@/features/lessons/ScratchPad')
let host: HTMLDivElement, root: Root
const btn = (name: string) => [...host.querySelectorAll('button')].find(b => (b.getAttribute('aria-label') ?? b.textContent?.replace(/^[↗↶✓] ?/, '')) === name)!
const click = async (name: string) => { const b = btn(name); expect(b, `button "${name}"`).toBeTruthy(); await act(async () => { b.click() }) }
/** A drag on the pad through these points (CSS pixels; jsdom's canvas sits at 0,0 with dpr 1). */
async function drag(...pts: [number, number][]) {
  const pad = host.querySelector('canvas')!
  const fire = (type: string, [x, y]: [number, number], buttons: number) => pad.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, buttons }))
  await act(async () => {
    fire('pointerdown', pts[0], 1)
    for (const p of pts.slice(1)) fire('pointermove', p, 1)
    fire('pointerup', pts.at(-1)!, 0)
  })
}
async function mount(key = 0) {
  if (!host) { host = document.createElement('div'); document.body.append(host); root = createRoot(host) }
  await act(async () => { root.render(createElement(ScratchPad, { clearKey: key })) })
}

beforeEach(async () => { document.body.innerHTML = ''; host = undefined as never; frame = []; await mount() })

describe('the scratch pad tools', () => {
  it('every tool and colour has a name; ink is chosen at first, with a ✓ — not colour alone', () => {
    for (const n of ['Pencil', 'Arrow', 'Eraser', 'Undo', 'Clear pad', 'Black', 'Blue', 'Green', 'Orange', 'Purple']) expect(btn(n), n).toBeTruthy()
    expect(host.querySelector('[role="group"]')?.getAttribute('aria-label')).toBe('Colors')
    expect(btn('Black').getAttribute('aria-pressed')).toBe('true')
    expect(btn('Black').textContent).toBe('✓')
    expect(btn('Blue').textContent).toBe('')
    expect(btn('Undo').disabled).toBe(true)
  })

  it('a pencil line is drawn in the chosen colour', async () => {
    await click('Blue')
    expect(btn('Blue').getAttribute('aria-pressed')).toBe('true')
    await drag([10, 10], [20, 12], [30, 14])
    expect(frame).toEqual([{ color: '#1d63c9', erase: false, pts: [[10, 10], [20, 12], [30, 14]], head: false }])
  })

  it('an arrow goes straight from where the drag began to where it ended, with a head there', async () => {
    await click('Arrow')
    await click('Orange')
    await drag([10, 50], [40, 60], [90, 50])
    expect(frame).toHaveLength(1)
    expect(frame[0]).toMatchObject({ color: '#d9480f', erase: false, head: true, pts: [[10, 50], [90, 50]] })
  })

  it('Undo takes the last stroke away; Clear empties the pad and Undo brings it back', async () => {
    await drag([1, 1], [5, 5]); await drag([10, 10], [15, 15])
    expect(frame).toHaveLength(2)
    await click('Undo')
    expect(frame.map(f => f.pts[0])).toEqual([[1, 1]])
    await click('Clear pad')
    expect(frame).toEqual([])
    await click('Undo')
    expect(frame.map(f => f.pts[0])).toEqual([[1, 1]])
  })

  it('the eraser rubs out; picking a colour goes back to the pencil', async () => {
    await click('Eraser')
    await drag([5, 5], [6, 6])
    expect(frame[0].erase).toBe(true)
    await click('Green')
    expect(btn('Pencil').getAttribute('aria-pressed')).toBe('true')
  })

  it('a new problem gives a clean pad with nothing to undo', async () => {
    await drag([1, 1], [5, 5])
    await mount(1)
    expect(frame).toEqual([])
    expect(btn('Undo').disabled).toBe(true)
  })
})
