#!/usr/bin/env python3
"""
Find the leg cut coordinates for a parade creature, for a RIGS entry in
src/features/chapters/story/canvas/rigs.ts.

    # 1. scan: find the row where the legs separate from the body
    python3 scripts/creature-legs.py public/assets/objects/rabbit_side.png

    # 2. emit: label each leg below that row and print a paste-ready rig entry
    python3 scripts/creature-legs.py public/assets/objects/rabbit_side.png 796

Everything comes off the alpha channel; do NOT eyeball coordinates off the image. Eyeballing
produced boxes that notched the belly and missed the legs entirely.

Pick `cutY` as the first row where the leg runs are cleanly separated (the scan prints the run
count per row — look for it to jump and stay up). The emitted `legTop` sits above it so the leg
piece overlaps the body and the joint seam stays buried; shrink `overlap` for thin insect legs
where the body would otherwise get dragged into the piece.
"""
import sys
from collections import deque

from PIL import Image

path = sys.argv[1]
cut = int(sys.argv[2]) if len(sys.argv) > 2 else None
overlap = int(sys.argv[3]) if len(sys.argv) > 3 else 50

im = Image.open(path).convert('RGBA')
alpha = im.split()[3].load()
W, H = im.size
bbox = im.getbbox()
THR = 60


def runs(y, minw=3):
    out, s = [], None
    for x in range(W):
        on = alpha[x, y] > THR
        if on and s is None:
            s = x
        if not on and s is not None:
            out.append((s, x - 1))
            s = None
    if s is not None:
        out.append((s, W - 1))
    return [r for r in out if r[1] - r[0] > minw]


if cut is None:
    print(f'{path}  size={im.size}  art bbox={bbox}')
    print('\n  y    n  opaque column runs  (pick cutY where n jumps up and stays)')
    top, bot = bbox[1], bbox[3]
    for y in range(top + int((bot - top) * 0.60), bot + 1, 10):
        r = runs(y)
        print(f'{y:5d}  {len(r)}  {r}')
    sys.exit()

# ── label each leg below the cut (8-connected flood fill) ──────────────────────────────────
seen = [[False] * (bbox[3] + 1 - cut) for _ in range(W)]
legs = []
for x0 in range(W):
    for y0 in range(cut, bbox[3] + 1):
        if seen[x0][y0 - cut] or alpha[x0, y0] <= THR:
            continue
        q, px = deque([(x0, y0)]), []
        seen[x0][y0 - cut] = True
        while q:
            x, y = q.popleft()
            px.append((x, y))
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    nx, ny = x + dx, y + dy
                    if cut <= ny <= bbox[3] and 0 <= nx < W and not seen[nx][ny - cut] \
                            and alpha[nx, ny] > THR:
                        seen[nx][ny - cut] = True
                        q.append((nx, ny))
        if len(px) < 150:            # speck, not a leg
            continue
        xs = [p[0] for p in px]
        ys = [p[1] for p in px]
        topx = [p[0] for p in px if p[1] <= cut + 2]
        legs.append(dict(
            x0=min(xs) - 4, x1=max(xs) + 4, bottom=max(ys) + 4,
            pivotX=(sum(topx) // len(topx)) if topx else (min(xs) + max(xs)) // 2,
        ))

legs.sort(key=lambda l: l['pivotX'])
bottom = max(l['bottom'] for l in legs)
print(f"// {path.split('/')[-1]} — {len(legs)} legs found below y={cut}")
print(f'    cutY: {cut},')
print(f'    legTop: {cut - overlap},')
print(f'    bottom: {bottom},')
print('    legs: [')
for i, l in enumerate(legs):
    print(f"      {{ x0: {l['x0']}, x1: {l['x1']}, pivotX: {l['pivotX']}, "
          f"pivotY: {cut - overlap // 2}, phase: {i % 2}, near: true, amp: 0.18 }},")
print('    ],')
