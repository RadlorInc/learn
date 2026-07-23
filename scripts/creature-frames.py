#!/usr/bin/env python3
"""
Turn a generated walk-cycle VIDEO into a transparent sprite sheet for the parade.

    python3 scripts/creature-frames.py rabbit.mp4 rabbit --frames 12 --out public/assets/objects

Why video and not a set of stills: independently generated frames drift in style — the ears change
shape, the colour shifts, the outline thickness wanders. A video model produces temporally coherent
frames by construction, so the character stays itself across the cycle.

What this does:
  1. decodes every frame (imageio ships its own ffmpeg — no brew needed)
  2. keys out the flat green background and despills the green fringe off the outline
  3. finds ONE bounding box across all frames and crops them all to it, so the sprite does not
     jitter frame to frame — cropping each frame to its own bbox is what makes a sheet wobble
  4. picks `--frames` evenly spaced frames and writes a horizontal strip + a preview GIF

The sheet is a plain horizontal strip of equal cells, which is what Pixi's AnimatedSprite wants.
"""
import argparse
import sys

import imageio.v3 as iio
import numpy as np
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('video')
ap.add_argument('name')
ap.add_argument('--frames', type=int, default=12)
ap.add_argument('--out', default='public/assets/objects')
ap.add_argument('--start', type=float, default=0.0, help='fraction of the clip to skip at the front')
ap.add_argument('--end', type=float, default=1.0, help='fraction of the clip to stop at')
ap.add_argument('--cell', type=int, default=256, help='height of one sheet cell, px')
ap.add_argument('--colors', type=int, default=96,
                help='Palette-quantise the sheet to this many colours (0 = off). These are flat '
                     'cartoons, so this cuts ~80%% off the file with no visible loss — a full-colour '
                     'sheet is ~1MB and the parade needs a dozen of them.')
ap.add_argument('--pingpong', action='store_true',
                help="Append the frames in reverse so the strip loops seamlessly. Use when the clip "
                     "has no clean cycle AND the motion just oscillates (paddling flippers, "
                     "flapping wings). NEVER for a walk — reversed legs moonwalk.")
ap.add_argument('--key', default='green', choices=['green', 'magenta'],
                help="Background colour to key out. Use magenta for GREEN creatures — keying green "
                     "off a green turtle eats its own flippers.")
a = ap.parse_args()

SOFT_LO, SOFT_HI = 6, 30      # greenness band over which alpha ramps 255 → 0

raw = [f for f in iio.imiter(a.video)]
if not raw:
    sys.exit('no frames decoded')
lo, hi = int(len(raw) * a.start), int(len(raw) * a.end)
raw = raw[lo:hi] or raw
print(f'{len(raw)} frames, {raw[0].shape[1]}x{raw[0].shape[0]}')


def key(frame):
    """Flat background colour → alpha, plus a despill so the outline keeps its own colour."""
    rgb = frame[:, :, :3].astype(np.int16)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    out = frame[:, :, :3].copy()
    if a.key == 'green':
        d = g - np.maximum(r, b)              # how much greener than anything else
        out[:, :, 1] = np.where(d > SOFT_LO, np.maximum(r, b).astype(np.uint8), out[:, :, 1])
    else:                                     # magenta: red AND blue both above green
        d = np.minimum(r, b) - g
        keep = np.minimum(r, b).astype(np.uint8)
        out[:, :, 0] = np.where(d > SOFT_LO, keep, out[:, :, 0])
        out[:, :, 2] = np.where(d > SOFT_LO, keep, out[:, :, 2])
    # SOFT key: fully transparent above SOFT_HI, fully opaque below SOFT_LO, ramped between. A hard
    # threshold leaves a halo of half-green motion-blur pixels around fast parts (an eagle's wings
    # came out ringed in green smudges); the ramp dissolves those instead of keeping or eating them.
    alpha = np.clip((SOFT_HI - d) / max(1, SOFT_HI - SOFT_LO), 0, 1) * 255
    return np.dstack([out, alpha.astype(np.uint8)])


keyed = [key(f) for f in raw]

# one shared bbox across every frame, or the sprite jitters
boxes = [Image.fromarray(k).getbbox() for k in keyed]
boxes = [b for b in boxes if b]
if not boxes:
    sys.exit('everything keyed out — is the background actually green?')
x0 = min(b[0] for b in boxes); y0 = min(b[1] for b in boxes)
x1 = max(b[2] for b in boxes); y1 = max(b[3] for b in boxes)
print(f'shared bbox {(x0, y0, x1, y1)}')

# Find the actual walk-cycle period, so the sheet loops instead of hitching. Evenly spaced frames
# across an arbitrary clip length almost never span a whole number of cycles — the jump back to
# frame 0 is then a visible stutter, which is the tell that something is a chopped-up video.
def period(frames):
    small = [np.asarray(Image.fromarray(f).convert('L').resize((64, 64)), dtype=np.float32)
             for f in frames]
    best, score = len(frames) - 1, None
    # Only search up to HALF the clip: a period longer than that cannot be verified (there is no
    # second repetition to compare against) and the scorer happily picks one, which is how a
    # 49-of-61-frame "cycle" gets chosen and the loop then visibly hitches.
    for pd in range(8, max(9, len(frames) // 2 + 1)):
        pairs = [(small[i], small[i + pd]) for i in range(len(frames) - pd)]
        if len(pairs) < 4:
            break
        d = float(np.mean([np.abs(x - y).mean() for x, y in pairs]))
        if score is None or d < score:
            best, score = pd, d
    return best, score


pd, sc = period(keyed)
# A high mismatch means the clip has NO clean cycle (irregular or very subtle motion). Forcing a
# period on it then picks a near-identical run of frames and the sprite barely moves — worse than
# just spanning the whole clip. Trust the detector only when it actually found a repeat.
if sc is None or sc > 3.0:
    print(f'no clean cycle (best mismatch {sc:.2f}) — spanning the whole clip instead')
    pd = len(keyed) - 1
else:
    print(f'walk cycle ≈ {pd} frames (mismatch {sc:.2f})')
idx = [round(i * pd / a.frames) for i in range(a.frames)]
cells = []
for i in idx:
    im = Image.fromarray(keyed[i]).crop((x0, y0, x1, y1))
    im.thumbnail((a.cell * 2, a.cell), Image.LANCZOS)
    cells.append(im)

if a.pingpong and len(cells) > 2:
    cells = cells + cells[-2:0:-1]

cw = max(c.width for c in cells)
ch = max(c.height for c in cells)
sheet = Image.new('RGBA', (cw * len(cells), ch), (0, 0, 0, 0))
for i, c in enumerate(cells):
    sheet.paste(c, (i * cw + (cw - c.width) // 2, ch - c.height))
if a.colors:
    # FASTOCTREE is the one PIL quantiser that keeps the alpha channel.
    sheet = sheet.quantize(colors=a.colors, method=Image.FASTOCTREE).convert('RGBA')
sheet.save(f'{a.out}/{a.name}_walk.png', optimize=True)

# Preview GIF for eyeballing the cycle — written next to the sheet, but it is a REVIEW artifact,
# not a runtime asset. Don't leave it in public/assets (it shipped once).
gif = [Image.new('RGBA', (cw, ch), (250, 248, 244, 255)) for _ in cells]
for gimg, c in zip(gif, cells):
    gimg.alpha_composite(c, ((cw - c.width) // 2, ch - c.height))
gp = [g.convert('P', palette=Image.ADAPTIVE) for g in gif]
gp[0].save(f'{a.out}/{a.name}_walk.gif', save_all=True, append_images=gp[1:],
           duration=70, loop=0, disposal=2)
print(f'{a.out}/{a.name}_walk.png  {len(cells)} frames of {cw}x{ch}')
