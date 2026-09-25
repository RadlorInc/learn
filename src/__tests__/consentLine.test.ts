/**
 * `ConsentLine` belongs wherever an adult hands over an address. ⚠️ It used to have TWO sites —
 * `/auth` and the check's own lead capture, which asked a stranger for their email and for weeks
 * showed them neither the Terms nor the Privacy Policy. The check was deleted 2026-09-20 and ①
 * with it; if a second address-collecting surface ever ships, restore that assertion from history.
 * ② pins `/auth` byte-for-byte: the
 * expected markup was rendered from the component (re-taken for the Sky light recolour, 2026-09-25) and is
 * written out here rather than re-rendered, so a changed default goes red. ③ measures the contrast
 * of both palettes with the WCAG formula — 12px text wants headroom over 4.5:1, not a hair past it.
 */
import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ConsentLine } from '@/shared/ui/ConsentLine'
import { PT, ACCENTS } from '@/features/chapters/story/preteen/kit'

const hrefs = (html: string) => Array.from(html.matchAll(/href="([^"]+)"/g), m => m[1])

describe('/auth is unchanged', () => {
  it('ConsentLine with no props renders the pre-change markup, byte for byte', () => {
    expect(renderToStaticMarkup(createElement(ConsentLine))).toBe(
      '<p style="margin:10px 0 0;font-size:12px;line-height:1.5;color:#3d6fb8;text-align:center">By continuing you agree to our <a style="color:#0B4FA8;font-weight:700" href="/legal/terms">Terms</a> and <a style="color:#0B4FA8;font-weight:700" href="/legal/privacy">Privacy Policy</a>.</p>',
    )
  })
})

// ── WCAG 2.x relative luminance / contrast ratio ────────────────────────────────────────
function lum(hex: string): number {
  const c = hex.replace('#', '').match(/../g)!.map(h => parseInt(h, 16) / 255)
    .map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
export const contrast = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }

describe('contrast', () => {
  it('the formula is live (black on white = 21:1, positive control)', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 1)
  })
  it('auth pair clears 4.5:1 on the white card — gated since the Sky light recolour (2026-09-25)', () => {
    // The warm pair it replaced measured 4.16:1 and 3.04:1 and was only recorded. Both blues are written
    // out here, not imported, so a changed default goes red in ② and a paler one goes red here.
    expect(contrast('#3d6fb8', '#ffffff')).toBeGreaterThanOrEqual(4.5)
    expect(contrast('#0B4FA8', '#ffffff')).toBeGreaterThanOrEqual(4.5)
  })
  it('diagnostic pair on the dark ground clears 4.5:1 with headroom', () => {
    // the panel is rgba(21,31,64,.72) over bg0 — composite it, and also take bare bg0 (the darker of the two)
    const over = (fg: [number, number, number], a: number, bg: [number, number, number]) =>
      '#' + fg.map((v, i) => Math.round(v * a + bg[i] * (1 - a)).toString(16).padStart(2, '0')).join('')
    const panel = over([21, 31, 64], 0.72, [10, 16, 38])
    for (const ground of [PT.bg0, panel]) {
      expect(contrast(PT.inkSoft, ground)).toBeGreaterThanOrEqual(6)
      for (const key of ['lime', 'cyan'] as const) expect(contrast(ACCENTS[key].base, ground)).toBeGreaterThanOrEqual(6)
    }
  })
})
