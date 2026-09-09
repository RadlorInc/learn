/**
 * `ConsentLine` belongs wherever an adult hands over an address — its own docstring names two
 * places, the signup form and the cold funnel's lead capture — and for weeks it was rendered on
 * only the first. `/diagnostic` asked a stranger for their email and never showed them the Terms or
 * the Privacy Policy. ① renders the email step and looks for the links a PERSON would see (a grep
 * for the import would pass the moment the import exists). ② pins `/auth` byte-for-byte: the
 * expected markup was rendered from the component BEFORE the colour props were added, and is
 * written out here rather than re-rendered, so a changed default goes red. ③ measures the contrast
 * of both palettes with the WCAG formula — 12px text wants headroom over 4.5:1, not a hair past it.
 */
import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ConsentLine } from '@/shared/ui/ConsentLine'
import { EmailGate } from '@/features/diagnostic/EmailGate'
import { PT, ACCENTS } from '@/features/chapters/story/preteen/kit'

const hrefs = (html: string) => Array.from(html.matchAll(/href="([^"]+)"/g), m => m[1])

describe('the lead capture shows the documents at the moment of submission', () => {
  for (const key of ['lime', 'cyan'] as const) {   // the two accents `/diagnostic` actually uses
    it(`EmailGate (${key}) links /legal/terms and /legal/privacy`, () => {
      const html = renderToStaticMarkup(createElement(EmailGate, { accent: ACCENTS[key], onSubmit: () => {} }))
      expect(html).toContain('Start the check →')                 // it IS the email step
      expect(hrefs(html)).toContain('/legal/terms')
      expect(hrefs(html)).toContain('/legal/privacy')
      // where: after the button, not at the top of the card
      expect(html.indexOf('/legal/terms')).toBeGreaterThan(html.indexOf('Start the check →'))
    })
  }
})

describe('the short frame pays for the line out of duplicated chrome, not out of the line', () => {
  // Measured 2026-09-09 at 640×320: the card was 317px tall and fitted; with the consent line it was
  // 345px and clipped 12px off BOTH ends (no scroll). The footnote repeats the age picker's own
  // eyebrow ("Free · about 10 minutes · no account needed"), so on a short frame it goes and the
  // documents stay. Roomy frames keep both.
  it('short: footnote gone, links present', () => {
    const html = renderToStaticMarkup(createElement(EmailGate, { accent: ACCENTS.cyan, short: true, onSubmit: () => {} }))
    expect(html).not.toContain('takes about ten minutes')
    expect(hrefs(html)).toEqual(['/legal/terms', '/legal/privacy'])
  })
  it('roomy: footnote present', () => {
    const html = renderToStaticMarkup(createElement(EmailGate, { accent: ACCENTS.cyan, onSubmit: () => {} }))
    expect(html).toContain('takes about ten minutes')
  })
})

describe('/auth is unchanged', () => {
  it('ConsentLine with no props renders the pre-change markup, byte for byte', () => {
    expect(renderToStaticMarkup(createElement(ConsentLine))).toBe(
      '<p style="margin:10px 0 0;font-size:12px;line-height:1.5;color:#8a7a63;text-align:center">By continuing you agree to our <a style="color:#F26B2C;font-weight:700" href="/legal/terms">Terms</a> and <a style="color:#F26B2C;font-weight:700" href="/legal/privacy">Privacy Policy</a>.</p>',
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
  it('auth pair — recorded, not gated: it is pre-existing and this change leaves /auth byte-identical', () => {
    // Measured 2026-09-09: #8a7a63 on the white card is 4.16:1 — UNDER the 4.5:1 floor for 12px
    // text. Not touched here (the brief was "/auth unchanged"); it is the founder's call. Pinned so a
    // silent shift in either direction shows up as a diff rather than a surprise.
    expect(contrast('#8a7a63', '#ffffff')).toBeCloseTo(4.16, 2)
    expect(contrast('#F26B2C', '#ffffff')).toBeCloseTo(3.04, 2)
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
