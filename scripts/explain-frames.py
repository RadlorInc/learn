#!/usr/bin/env python3
"""
Turn a generated EXPLAINER clip into an opaque horizontal frame strip the chapter can step through.

    python3 scripts/explain-frames.py area.mp4 plot_area --frames 10 --out public/assets/explain

⚠️ WHY NOT `creature-frames.py`. That one chroma-keys a subject off a flat field and crops every frame
to one shared ink bbox — exactly right for a creature that has to travel over a backdrop, and exactly
wrong here: this clip IS the picture, edge to edge, and keying it would eat the navy it is drawn on.
Same pipeline, different job, so a separate forty lines rather than a `--no-key` flag bolted onto the
one that is load-bearing for eighteen sprites.

⚠️ IT CUTS FROM THE ACTIVE WINDOW. A video model holds its start frame for a beat before it begins
moving, so a strip taken from frame 0 is mostly a still — measured on this repo's foreman bear, 9 of
12 cells were identical. The per-frame mean-absolute-difference finds where the motion really starts
and where it settles, and the cut runs between them.
"""
import argparse
import os

import imageio.v3 as iio
import numpy as np
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('video')
ap.add_argument('name')
ap.add_argument('--frames', type=int, default=10)
ap.add_argument('--out', default='public/assets/explain')
ap.add_argument('--cell-w', type=int, default=440, help='width of one cell in the strip, px')
ap.add_argument('--colors', type=int, default=128, help='palette-quantise the strip (0 = off)')
ap.add_argument('--hold', type=float, default=0.06,
                help='motion below this share of the peak counts as "not moving yet"')
a = ap.parse_args()

raw = [f[:, :, :3] for f in iio.imiter(a.video)]
if not raw:
    raise SystemExit('no frames decoded')
h, w = raw[0].shape[:2]
print(f'{len(raw)} frames, {w}x{h}')

# ── where the motion STARTS: the first frame that differs from the one before it ──
diff = np.array([0.0] + [np.abs(raw[i].astype(np.int16) - raw[i - 1].astype(np.int16)).mean()
                         for i in range(1, len(raw))])
peak = diff.max() or 1.0
moving = np.where(diff > peak * a.hold)[0]
lo = max(0, int(moving[0]) - 2 if len(moving) else 0)

# ── where it FINISHES: the first frame that has ARRIVED at the end image ──
# ⚠️ NOT "the last frame with motion in it". A keyframe-interpolated clip converges on its end frame
# slowly, so the per-frame difference drops away while the picture is still visibly assembling —
# measured here, the fence went on settling for 60 frames after the motion signal had fallen to 7%
# of peak, and a window cut on motion alone ended before the loop closed. Distance to the FINAL
# frame is the honest signal, because with a composed end_image that frame is the answer.
dist = np.array([np.abs(f.astype(np.int16) - raw[-1].astype(np.int16)).mean() for f in raw])
span = dist[lo] or 1.0
arrived = np.where(dist < span * 0.06)[0]
hi = min(len(raw) - 1, (int(arrived[0]) + 2) if len(arrived) else len(raw) - 1)
if hi <= lo:
    hi = len(raw) - 1
print(f'window {lo}..{hi} of {len(raw)} (motion peak {peak:.2f}, arrives at {hi})')

idx = np.linspace(lo, hi, a.frames).round().astype(int)
cell_w = a.cell_w
cell_h = round(cell_w * h / w)
cells = [Image.fromarray(raw[i]).resize((cell_w, cell_h), Image.LANCZOS) for i in idx]

strip = Image.new('RGB', (cell_w * len(cells), cell_h))
for i, c in enumerate(cells):
    strip.paste(c, (i * cell_w, 0))
if a.colors:
    strip = strip.quantize(colors=a.colors, method=Image.FASTOCTREE).convert('RGB')

os.makedirs(a.out, exist_ok=True)
path = f'{a.out}/{a.name}.png'
strip.save(path, optimize=True)
print(f'{path}  {len(cells)} cells of {cell_w}x{cell_h}  {os.path.getsize(path) // 1024} KB')

gif = f'{a.out}/{a.name}_preview.gif'
cells[0].save(gif, save_all=True, append_images=cells[1:], duration=620, loop=0)
print(f'{gif}')
