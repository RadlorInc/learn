/**
 * PERF-05 (docs/review/PERFORMANCE.md). The sign-in page's LCP element is the Radlic logo, drawn
 * 56 px tall (`/auth`; the dashboard draws it 30 and 24 px). It shipped as a 105,620-byte truecolor
 * PNG — ~77 KB more than it needs on the critical path of a 1.44 Mbit/s phone.
 *
 * The property: the file is at most 40 KB AND still has at least 2× the pixels of its largest
 * rendering, so a retina screen does not get a blurrier logo in exchange. The numbers are written
 * out here, not read from the pages, on purpose.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const FILE = join(__dirname, '../../public/brand/radlic-logo-640.png')
const MAX_BYTES = 40 * 1024
const SHOWN_H = 56                              // /auth: style height 56, width auto
const SHOWN_W = Math.ceil(SHOWN_H * 640 / 167)  // 215 px at the logo's 640:167 ratio

describe('the sign-in logo', () => {
  it(`weighs at most ${MAX_BYTES} bytes`, () => {
    expect(statSync(FILE).size).toBeLessThanOrEqual(MAX_BYTES)
  })

  it(`has at least 2× the pixels it is shown at (${2 * SHOWN_W}×${2 * SHOWN_H})`, () => {
    const png = readFileSync(FILE)
    expect(png.subarray(1, 4).toString('latin1')).toBe('PNG')   // positive control: we are reading a PNG header
    const w = png.readUInt32BE(16), h = png.readUInt32BE(20)       // IHDR width / height
    expect(w).toBeGreaterThanOrEqual(2 * SHOWN_W)
    expect(h).toBeGreaterThanOrEqual(2 * SHOWN_H)
  })
})
