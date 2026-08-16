/**
 * Recompress the shipped PNGs. `public/` is 83 MB and 80 files account for 43.7 MB of it — a
 * 1024×1024 PNG of a butterfly that renders at ~80px, served raw to a child on a phone.
 *
 * ⚠️ WHY THIS AND NOT A next/image MIGRATION. 21 of the 90 raw `<img>` in this app are SPRITE
 * SHEETS — `width: cell * frames`, `maxWidth: 'none'`, positioned inside an overflow-hidden cell
 * and driven by a CSS `steps()` animation. `next/image` rewrites exactly those properties, and
 * chapter-craft records that `getBoundingClientRect` on a sheet already returns the whole strip.
 * Recompressing helps every one of the 90 tags, the service-worker cache and the sheets at once,
 * without touching a line of layout code.
 *
 * ⚠️ DIMENSIONS AND ALPHA ARE PRESERVED EXACTLY, and that is load-bearing rather than tidy:
 * `canvas/sheets.ts` carries a `cellAspect` and a `frames` count per sheet, so a resize would
 * silently land every cell on the wrong picture. This only re-encodes. It verifies both after
 * writing and restores the original if either moved.
 *
 * ⚠️ IT IS A DRY RUN UNLESS YOU PASS --write, ON PURPOSE. Palette quantization is slightly lossy:
 * measured on the worst sprite, 6.4% of solidly-visible pixels move by more than 8/255 (mean 4.7).
 * That is almost certainly invisible at the size these render — and "almost certainly" is not the
 * standard this repo holds for painted art, where the eye is the gate. Run it, look at the sprites,
 * then decide. `git checkout public/assets` undoes it whole.
 *
 *   node scripts/compress-assets.mjs            # report only
 *   node scripts/compress-assets.mjs --write    # actually rewrite
 */
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

const WRITE = process.argv.includes('--write')
const ROOT = 'public/assets'
const MIN_BYTES = 100_000        // below this the win is not worth a changed binary in git
const MIN_SAVING = 0.15          // skip anything that does not shrink by at least 15%

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(join(dir, e.name)) : e.name.toLowerCase().endsWith('.png') ? [join(dir, e.name)] : [])
}

let before = 0, after = 0, changed = 0, skipped = 0
for (const file of walk(ROOT)) {
  const src = readFileSync(file)
  if (src.length < MIN_BYTES) continue
  const m = await sharp(src).metadata()
  const out = await sharp(src).png({ palette: true, quality: 90, effort: 9 }).toBuffer()

  if (1 - out.length / src.length < MIN_SAVING) { skipped++; continue }

  // The check that makes this safe to run unattended: re-read what we produced and refuse it
  // unless the geometry is untouched. A sheet whose width moved by one pixel is a chapter whose
  // every frame is offset, and nothing else in the app would report it.
  const m2 = await sharp(out).metadata()
  if (m2.width !== m.width || m2.height !== m.height || !!m2.hasAlpha !== !!m.hasAlpha) {
    console.error(`REFUSED ${file}: ${m.width}x${m.height} a=${m.hasAlpha} -> ${m2.width}x${m2.height} a=${m2.hasAlpha}`)
    continue
  }

  before += src.length; after += out.length; changed++
  console.log(`${(src.length / 1024 | 0).toString().padStart(5)}KB -> ${(out.length / 1024 | 0).toString().padStart(4)}KB  ${(100 - out.length / src.length * 100).toFixed(0).padStart(3)}%  ${file}`)
  if (WRITE) writeFileSync(file, out)
}

console.log(`\n${changed} files${WRITE ? ' rewritten' : ' would change'}, ${skipped} skipped (already tight).`)
console.log(`${(before / 1e6).toFixed(1)} MB -> ${(after / 1e6).toFixed(1)} MB  (${(100 - after / before * 100).toFixed(0)}% off, ${((before - after) / 1e6).toFixed(1)} MB saved)`)
if (!WRITE) console.log('\nDry run. Re-run with --write, look at the art, and bump public/sw.js if you keep it.')
