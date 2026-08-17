'use client'
import Image from 'next/image'
import type { CSSProperties } from 'react'

/**
 * The full-bleed painted backdrop, served through the image optimizer.
 *
 * ⚠️ THIS IS THE APP'S LARGEST PAYLOAD BY A WIDE MARGIN, AND IT WAS SHIPPING AS RAW PNG.
 * `public/assets/backgrounds` is 25 MB across 105 files — a backdrop averages 245 KB and the
 * biggest (`garden.png`) is 583 KB at 1536 × 1024, drawn into a viewport that is never wider than
 * 1280 and usually 640. Measured with `sharp` on that exact file: **583 KB PNG → 149 KB WebP →
 * 108 KB AVIF at w=1280.** Every chapter paints one, several chapters mount three at once so the
 * scene can cross-fade, and it is the LCP element on every one of them.
 *
 * `next/image` is the fix and it needed no new configuration — `next.config.ts` has had
 * `formats: ['image/avif','image/webp']` with a year of `minimumCacheTTL` since the C10 pass, and
 * its own comment says it was waiting for exactly this: *"as <img> tags migrate to next/image they
 * inherit it."* The optimizer negotiates the format, picks a width off `deviceSizes`, and serves
 * the result immutable, so this is one component rather than a build step and 25 MB of generated
 * siblings in git.
 *
 * `fill` puts `position:absolute; inset:0; width:100%; height:100%` on the <img> itself, which is
 * byte-for-byte the idiom this replaced at 34 call sites — so a caller only passes what was
 * EXTRA there (opacity for a cross-fade, objectPosition, a filter, a transition).
 *
 * ⚠️ TWO THINGS A CALLER STILL OWES:
 *  • The parent must be positioned. `fill` is absolute, so an unpositioned ancestor lets the
 *    backdrop escape to the nearest one that is. Every site this replaced was already inside one
 *    (they were passing `inset: 0` themselves), but a NEW site has to check.
 *  • `priority` on the one that is actually visible. Backdrops are the LCP element, and `fill`
 *    lazy-loads by default — which on a cross-fade stack is right for the hidden ones and wrong
 *    for the shown one.
 */
export function SceneBg({ src, style, priority, onError, sizes = '100vw', unoptimized }: {
  src: string
  /** Only what the raw <img> carried BEYOND the full-bleed idiom: opacity, objectPosition, filter,
   *  transition, borderRadius, pointerEvents. `objectFit: 'cover'` is the default and stays unless
   *  overridden. */
  style?: CSSProperties
  priority?: boolean
  onError?: React.ReactEventHandler<HTMLImageElement>
  /** Defaults to the full frame, which is what a backdrop is. Narrow it where the art is drawn into
   *  a panel rather than the whole screen, or the optimizer buys a width nobody displays. */
  sizes?: string
  /** Escape hatch for art that must not be re-encoded (a sprite SHEET, where a lossy pass across
   *  the cell seams is visible). Backdrops never need it. */
  unoptimized?: boolean
}) {
  return (
    <Image
      src={src}
      alt=""
      aria-hidden
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={unoptimized}
      draggable={false}
      onError={onError}
      style={{ objectFit: 'cover', ...style }}
    />
  )
}

export default SceneBg
