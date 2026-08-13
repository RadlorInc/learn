/**
 * The self-view's coordinate map — the arithmetic that puts a marker on the hand rather than near it.
 *
 * A landmark comes back as a fraction of the CAMERA FRAME; the overlay is drawn in pixels of the
 * BOX the video is displayed in; and `objectFit: cover` is what makes those two different things.
 * In a 4:3 panel showing a 4:3 stream they coincide exactly, which is why the naive `y * clientHeight`
 * survived for as long as there were only corner panels. Full screen breaks it: a 4:3 stream in a
 * 16:9 box is scaled to the WIDTH and cropped top and bottom, so every marker drifts vertically.
 *
 * This is the same correction a chapter makes for a painted ground line under `objectFit: cover` —
 * the fault this repo shipped once, where a train floated 44px above its rail on any window whose
 * aspect did not match the artwork's. It is pure arithmetic, so unlike the canvas drawing it can be
 * gated.
 */
import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import { coverView, sxy } from '@/infra/ar/useFingerCounter'

const CAM_43 = { videoWidth: 640, videoHeight: 480 }   // what `openCamera` asks for
const CAM_169 = { videoWidth: 1280, videoHeight: 720 } // what some laptops hand back anyway

/**
 * ⚠️ THE LOOP'S OWN MAPPER, not a second copy of it. Written out here instead, this file passed
 * with the real `sxy` reverted to `x * W` — a gate that re-implements a rule cannot see the rule
 * being removed, which is exactly the fault it was written to guard.
 */
const at = sxy

describe('the self-view cover map', () => {
  it('is the identity when the panel matches the stream — the corner path does not move', () => {
    const v = coverView(CAM_43, 214, 160.5)
    expect(v.ox).toBeCloseTo(0)
    expect(v.oy).toBeCloseTo(0)
    expect(v.dw).toBeCloseTo(214)
    expect(v.dh).toBeCloseTo(160.5)
    expect(at(v, 0.5, 0.5).sy).toBeCloseTo(80.25)
  })

  it('a 4:3 stream on a 16:9 screen is cropped top and bottom, never left and right', () => {
    const v = coverView(CAM_43, 1280, 720)
    expect(v.dw).toBeCloseTo(1280)       // fits by width
    expect(v.dh).toBeCloseTo(960)        // taller than the box
    expect(v.oy).toBeCloseTo(-120)       // 120 cropped off each end
    expect(v.ox).toBeCloseTo(0)
    // the number the naive map got wrong: 0.2 of the frame is 72px down, not 144
    expect(at(v, 0.2, 0.2).sy).toBeCloseTo(72)
    expect(at(v, 0.2, 0.2).sy).not.toBeCloseTo(0.2 * 720)
  })

  it('and a 16:9 stream in a 4:3 panel is cropped left and right instead', () => {
    const v = coverView(CAM_169, 214, 160.5)
    expect(v.dh).toBeCloseTo(160.5)
    expect(v.dw).toBeGreaterThan(214)
    expect(v.ox).toBeLessThan(0)
    expect(v.oy).toBeCloseTo(0)
  })

  it('the centre of the frame is always the centre of the box, whatever the aspects', () => {
    for (const cam of [CAM_43, CAM_169]) {
      for (const [W, H] of [[214, 160.5], [1280, 720], [640, 320], [390, 844]]) {
        const p = at(coverView(cam, W, H), 0.5, 0.5)
        expect(p.sx).toBeCloseTo(W / 2)
        expect(p.sy).toBeCloseTo(H / 2)
      }
    }
  })

  it('the loop maps through it rather than around it', () => {
    // ⚠️ Proving the mapper is right says nothing about whether the loop CALLS it — reverting the
    // call site to `(1 - t.x) * W` walked through every assertion above.
    const src = readFileSync('src/infra/ar/useFingerCounter.ts', 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    expect(src).toMatch(/pts\.push\(sxy\(/)
    for (const draw of ['drawCount', 'drawSweep', 'drawTilt', 'drawSlide', 'drawPinch']) {
      // each overlay takes the view, so none of them can quietly keep its own W/H mapping
      expect(src).toMatch(new RegExp(`function ${draw}\\(`))
    }
    expect(src).not.toMatch(/W: number, H: number, fill: string/)
  })

  it('never scales down — cover fills the box on both axes', () => {
    for (const cam of [CAM_43, CAM_169]) {
      for (const [W, H] of [[214, 160.5], [1280, 720], [640, 320], [390, 844]]) {
        const v = coverView(cam, W, H)
        expect(v.dw).toBeGreaterThanOrEqual(W - 1e-6)
        expect(v.dh).toBeGreaterThanOrEqual(H - 1e-6)
      }
    }
  })
})
