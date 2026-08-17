import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * A creature's journey must be a `transform`, and nothing else.
 *
 * `Critter` used to travel on `left`, `top`, `width` and `height`. All four are LAYOUT properties,
 * so every frame of every journey relaid out the document, once per travelling creature. Measured
 * on the real component with Chrome's own counters (CDP Performance.getMetrics), 63 creatures
 * journeying continuously for six seconds:
 *
 *     left/top/width/height   195 layout passes, 59.1 ms of layout
 *     transform                 4 layout passes,  1.7 ms
 *
 * ⚠️ AND THE OBVIOUS REPLACEMENT IS WRONG. `translate(Xvw, Yvh)` reads as the same thing as
 * `left: X%` and is not: `/game` wraps every chapter in `.game-zoom { zoom: … }`, a fixed element's
 * percentage offsets are scaled by that zoom, and viewport units are not. Measured, the two forms
 * diverge by up to 576px at zoom 1.45. The shipped form keeps the position as a PERCENTAGE of a
 * stage that is itself the size of the containing block — so it means the same thing at every zoom.
 *
 * ⚠️ AND THE BASE SIZE IS `w / scale`, NOT `size`. `w` and `h` are each rounded, so re-deriving
 * them through a different rounding chain moved the visible creature by up to 2.2px and its strip
 * by 26px. Dividing by the scale means `scale()` exactly undoes it: 0.0px across 2,772 rects
 * (sprite · sheet cell · contact shadow · number sign) over 63 combinations × 4 viewports × 3 zooms.
 *
 * None of this is visible to a type-checker, a screenshot, or a green chapter sweep — the old form
 * rendered correctly, it just cost fifteen times more per frame than it needed to.
 */
const SRC = readFileSync(join(process.cwd(), 'src/features/chapters/story/critters.tsx'), 'utf8')
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')

/** `Critter` alone — a transition elsewhere in the file must not decide this either way. */
const CRITTER = strip(SRC.slice(SRC.indexOf('export function Critter('), SRC.indexOf('export function SheetSprite(')))

describe('Critter travel', () => {
  it('the slice under test is real', () => {
    expect(CRITTER.length).toBeGreaterThan(800)
    expect(CRITTER).toMatch(/transformOrigin/)
  })

  it('never transitions a layout property', () => {
    const offenders = [...CRITTER.matchAll(/transition[^,;}]*/g)]
      .map(m => m[0])
      .filter(t => /\b(left|top|right|bottom|width|height|margin|padding)\b/.test(t))
    expect(offenders, 'a journey on a layout property relays out the document every frame').toEqual([])
  })

  it('travels on transform, at a linear rate', () => {
    expect(CRITTER).toMatch(/transform \$\{durMs\}ms linear/)
  })

  it('positions with a PERCENTAGE, never a viewport unit — CSS zoom scales one and not the other', () => {
    expect(CRITTER).toMatch(/translate\(\$\{at\.left\}%, \$\{at\.top\}%\)/)
    expect(CRITTER).not.toMatch(/\d*vw|\$\{[^}]*\}vw|\$\{[^}]*\}vh/)
  })

  it('scales about the FEET, so a creature stays on its ground line at every scale', () => {
    expect(CRITTER).toMatch(/transformOrigin: '50% 100%'/)
  })

  it('derives the base box by dividing the real box by the scale, so scale() undoes it exactly', () => {
    expect(CRITTER).toMatch(/const baseH = h \/ s/)
    expect(CRITTER).toMatch(/const baseW = w \/ s/)
    expect(CRITTER).toMatch(/Math\.max\(at\.scale, 0\.05\)/)   // never divide by a zero scale
  })
})
