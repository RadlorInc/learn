/**
 * The bit that makes a colouring game a colouring game: TAP AN AREA AND IT FILLS.
 *
 * A real colouring app does not hand you a handful of whole objects to recolour — it hands you one
 * picture cut into dozens of enclosed areas by its own ink, and a tap floods the area under your
 * finger out to the lines around it. That is a scanline flood fill, which is what this is. The
 * regions come free from the artwork; nothing has to be cut, layered or registered by hand.
 *
 * Two things follow, and both are the point:
 *   • a page has as many colourable areas as the drawing has enclosed shapes — a tree is a trunk
 *     AND a crown, a house is a roof AND a wall AND a door AND a window
 *   • the same flood that decides which pixels to paint also answers WHICH AREA was tapped, by
 *     testing whether a known probe point fell inside it. One pass, both answers.
 *
 * THE ONE THING THE ARTWORK MUST DO is close its outlines. A hairline gap where two lines nearly
 * meet lets the flood escape and swallow the whole page, so `loadPage` thickens the ink slightly
 * before anything is filled — see CLOSE_PX.
 */

/** Anything at least this dark is ink, i.e. a wall the flood cannot cross. */
const INK_LEVEL = 128
/**
 * Grow the ink by this many pixels before flooding. Generated line art almost always has a few
 * one-pixel gaps where strokes nearly meet, and one gap is enough to merge two areas into one — the
 * sky and the grass become a single region and the picture is unfillable. Dilating closes them.
 * It also thins the fills by a pixel at every edge, which is invisible: the line art is drawn back
 * over the top, and its own stroke is far wider than that.
 */
const CLOSE_PX = 2

export interface PageBitmap {
  w: number
  h: number
  /** 1 where the drawing has ink (a boundary), 0 where it can be coloured. */
  ink: Uint8Array
}

/** Decode the page and work out where its lines are. Done once per page. */
export async function loadPage(src: string): Promise<PageBitmap> {
  const img = new Image()
  img.decoding = 'async'
  await new Promise<void>((res, rej) => {
    img.onload = () => res()
    img.onerror = () => rej(new Error(`colouring page failed to load: ${src}`))
    img.src = src
  })
  const w = img.naturalWidth, h = img.naturalHeight
  const cv = document.createElement('canvas')
  cv.width = w; cv.height = h
  const ctx = cv.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0)
  const d = ctx.getImageData(0, 0, w, h).data

  const raw = new Uint8Array(w * h)
  for (let i = 0, p = 0; i < raw.length; i++, p += 4) {
    // Luma, and a transparent pixel counts as paper rather than as ink.
    const a = d[p + 3]
    const l = a < 128 ? 255 : (d[p] * 299 + d[p + 1] * 587 + d[p + 2] * 114) / 1000
    raw[i] = l < INK_LEVEL ? 1 : 0
  }
  return { w, h, ink: dilate(raw, w, h, CLOSE_PX) }
}

/** Square dilation, separable — grow the ink so near-misses in the line work become real walls. */
function dilate(src: Uint8Array, w: number, h: number, r: number): Uint8Array {
  if (r <= 0) return src
  const tmp = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    const row = y * w
    for (let x = 0; x < w; x++) {
      let v = 0
      for (let k = -r; k <= r && !v; k++) {
        const xx = x + k
        if (xx >= 0 && xx < w && src[row + xx]) v = 1
      }
      tmp[row + x] = v
    }
  }
  const out = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = 0
      for (let k = -r; k <= r && !v; k++) {
        const yy = y + k
        if (yy >= 0 && yy < h && tmp[yy * w + x]) v = 1
      }
      out[y * w + x] = v
    }
  }
  return out
}

export interface Region {
  /** 1 for every pixel in the flooded area, indexed the same way as `PageBitmap.ink`. */
  mask: Uint8Array
  size: number
}

/**
 * Flood the area under (x, y) out to the surrounding ink. Scanline fill: walk each run of paper
 * left to right and only queue the rows above and below where the run is actually open, so a large
 * area costs one pass rather than one stack frame per pixel.
 *
 * Returns null when the tap landed ON a line, or on an area smaller than `minSize` — a three-year-old
 * aiming at a picture will sometimes hit the outline itself, and silently filling four pixels reads
 * as the game ignoring them.
 */
export function floodRegion(p: PageBitmap, x: number, y: number, minSize = 40): Region | null {
  const { w, h, ink } = p
  x = Math.round(x); y = Math.round(y)
  if (x < 0 || y < 0 || x >= w || y >= h || ink[y * w + x]) return null

  const mask = new Uint8Array(w * h)
  const stack: number[] = [x, y]
  let size = 0
  const open = (i: number) => !ink[i] && !mask[i]

  while (stack.length) {
    const cy = stack.pop()!, cx = stack.pop()!
    const row = cy * w
    if (!open(row + cx)) continue
    let l = cx; while (l > 0 && open(row + l - 1)) l--
    let r = cx; while (r < w - 1 && open(row + r + 1)) r++
    for (let i = l; i <= r; i++) { mask[row + i] = 1; size++ }
    for (const ny of [cy - 1, cy + 1]) {
      if (ny < 0 || ny >= h) continue
      const nrow = ny * w
      let run = false
      for (let i = l; i <= r; i++) {
        if (open(nrow + i)) {
          if (!run) { stack.push(i, ny); run = true }
        } else run = false
      }
    }
  }
  return size < minSize ? null : { mask, size }
}

/**
 * The nearest paintable area to a point that landed ON a line.
 *
 * A tap on the ink is still a tap at SOMETHING — and for a small shape the outline is most of the
 * shape, so this is not an edge case: measured over a realistic aim spread, 40% of taps aimed at the
 * colouring page's tulips landed on ink. Answering those with nothing at all is the worst response a
 * colouring page can give, because it is indistinguishable from the game being broken.
 *
 * Walks out ring by ring, and among the areas touching the first ring that has any, takes the
 * SMALLEST. Which side of a line you meant is genuinely ambiguous, but not evenly so: a line is the
 * outline OF the smaller shape, and someone pointing at a flower petal meant the petal, not the lawn
 * it is drawn on. Picking the smaller neighbour matches that, and it also bounds the damage when the
 * guess is wrong — an accidentally filled petal is a shrug, an accidentally filled lawn is the whole
 * picture changing colour under a three-year-old.
 *
 * Cheap: it tests `ink` directly and only floods once it has somewhere to flood from, and skips any
 * candidate already inside an area it has flooded, so a ring lying along one big region costs one
 * pass rather than one per pixel.
 */
export function floodNearest(p: PageBitmap, x: number, y: number, reach = 14, minSize = 40): Region | null {
  const { w, h, ink } = p
  x = Math.round(x); y = Math.round(y)
  for (let d = 1; d <= reach; d++) {
    const found: Region[] = []
    for (let k = -d; k <= d && found.length < 6; k++) {
      for (const [px, py] of [[x + k, y - d], [x + k, y + d], [x - d, y + k], [x + d, y + k]]) {
        if (px < 0 || py < 0 || px >= w || py >= h || ink[py * w + px]) continue
        if (found.some(r => r.mask[py * w + px])) continue     // already have the area this sits in
        const r = floodRegion(p, px, py, minSize)
        if (r) found.push(r)
      }
    }
    if (found.length) return found.reduce((a, b) => (b.size < a.size ? b : a))
  }
  return null
}

export const inRegion = (r: Region, w: number, x: number, y: number) =>
  !!r.mask[Math.round(y) * w + Math.round(x)]

/** Paint a flooded area into the fill canvas. Flat colour only — the ink is drawn over the top. */
export function paintRegion(ctx: CanvasRenderingContext2D, p: PageBitmap, r: Region, hex: string) {
  const img = ctx.getImageData(0, 0, p.w, p.h)
  const d = img.data
  const R = parseInt(hex.slice(1, 3), 16), G = parseInt(hex.slice(3, 5), 16), B = parseInt(hex.slice(5, 7), 16)
  for (let i = 0, q = 0; i < r.mask.length; i++, q += 4) {
    if (!r.mask[i]) continue
    d[q] = R; d[q + 1] = G; d[q + 2] = B; d[q + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
}

/**
 * Screen point → image point, for a page drawn with `object-fit: cover`. The scale is uniform and
 * the overflow is split evenly, so this is the same arithmetic the browser used to lay the page out
 * — which is why a tap lands where the child thinks it did.
 */
export function toImagePoint(p: PageBitmap, box: DOMRect, clientX: number, clientY: number) {
  const s = Math.max(box.width / p.w, box.height / p.h)
  return {
    x: (clientX - box.left - (box.width - p.w * s) / 2) / s,
    y: (clientY - box.top - (box.height - p.h * s) / 2) / s,
  }
}
