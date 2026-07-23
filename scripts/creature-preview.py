#!/usr/bin/env python3
"""
Render a walk-cycle strip for every rigged creature, straight from the RIGS table.

    python3 scripts/creature-preview.py out/            # all rigged creatures
    python3 scripts/creature-preview.py out/ crab ant   # just these

Reads src/features/chapters/story/canvas/rigs.ts so there is ONE source of truth — the strip shows
exactly what the runtime will draw. Frames are rendered at the size the parade actually uses
(~150px tall), because seams that look alarming at 1024px vanish there and judging at full
resolution leads you to fix things that were never visible.
"""
import math
import re
import sys
from pathlib import Path

STANCE = 0.62   # keep in sync with ParadeStage.ts

from PIL import Image

OUT = Path(sys.argv[1])
ONLY = set(a for a in sys.argv[2:] if a != '--gif')
# --gif writes a looping animation as well as the strip; timing is the thing a strip cannot show.
GIF = '--gif' in sys.argv
OUT.mkdir(parents=True, exist_ok=True)

ts = Path('src/features/chapters/story/canvas/rigs.ts').read_text()
ENTRY = re.compile(
    r"'(?P<url>[^']+)':\s*\{\s*cutY:\s*(?P<cut>\d+),\s*legTop:\s*(?P<top>\d+),"
    r"\s*bottom:\s*(?P<bot>\d+),\s*legs:\s*\[(?P<legs>.*?)\],\s*\},", re.S)
LEG = re.compile(
    r'x0:\s*(-?\d+),\s*x1:\s*(-?\d+),\s*pivotX:\s*(-?\d+),\s*pivotY:\s*(-?\d+),'
    r'\s*phase:\s*([\d.]+),\s*near:\s*(true|false),\s*amp:\s*([\d.]+)')

found = 0
for m in ENTRY.finditer(ts):
    url = m.group('url')
    name = url.rsplit('/', 1)[-1].replace('_side.png', '')
    if ONLY and name not in ONLY:
        continue
    found += 1
    cut, top, bot = int(m.group('cut')), int(m.group('top')), int(m.group('bot'))
    legs = [dict(x0=int(a), x1=int(b), px=int(c), py=int(d), phase=float(e), near=f == 'true',
                 amp=float(g)) for a, b, c, d, e, f, g in LEG.findall(m.group('legs'))]

    im = Image.open('public' + url).convert('RGBA')
    W, H = im.size

    # body = slab above the cut + the gap strips between the legs below it (matches buildRig)
    body = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    body.paste(im.crop((0, 0, W, cut)), (0, 0))
    x = 0
    for L in sorted(legs, key=lambda l: l['x0']):
        if L['x0'] > x:
            body.paste(im.crop((x, cut, L['x0'], H)), (x, cut))
        x = max(x, L['x1'])
    if x < W:
        body.paste(im.crop((x, cut, W, H)), (x, cut))

    layers = []
    for L in legs:
        lay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        lay.paste(im.crop((L['x0'], top, L['x1'], bot)), (L['x0'], top))
        layers.append((lay, L))

    def pose(lay, L, cyc, leglen):
        """MUST mirror the leg gait in ParadeStage.update — see STANCE there."""
        u = (cyc + L['phase']) % 1.0
        if u < STANCE:
            ang, lift = L['amp'] * (1 - 2 * (u / STANCE)), 0.0
        else:
            k = (u - STANCE) / (1 - STANCE)
            ang = -L['amp'] + 2 * L['amp'] * (k * k * (3 - 2 * k))
            lift = math.sin(k * math.pi)
        out = lay.rotate(math.degrees(ang), resample=Image.BICUBIC, center=(L['px'], L['py']))
        if lift:
            out = out.transform(out.size, Image.AFFINE, (1, 0, 0, 0, 1, lift * leglen * 0.16),
                                resample=Image.BICUBIC)
        return out

    leglen = bot - min(L['py'] for L in legs)
    frames = []
    N = 8 if not GIF else 20
    for i in range(N):
        cyc = i / N
        o = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        for lay, L in layers:
            if not L['near']:
                o.alpha_composite(pose(lay, L, cyc, leglen))
        o.alpha_composite(body)
        for lay, L in layers:
            if L['near']:
                o.alpha_composite(pose(lay, L, cyc, leglen))
        f = o.crop(im.getbbox())
        f.thumbnail((150, 150), Image.LANCZOS)
        frames.append(f)

    w = max(f.width for f in frames)
    h = max(f.height for f in frames)
    sheet = Image.new('RGBA', ((w + 8) * len(frames) + 8, h + 16), (250, 248, 244, 255))
    for i, f in enumerate(frames):
        sheet.alpha_composite(f, (8 + i * (w + 8), 8 + h - f.height))
    sheet.save(OUT / f'{name}.png')
    if GIF:
        pad = [Image.new('RGBA', (w + 16, h + 16), (250, 248, 244, 255)) for _ in frames]
        for c, f in zip(pad, frames):
            c.alpha_composite(f, (8, 8 + h - f.height))
        gs = [c.convert('P', palette=Image.ADAPTIVE) for c in pad]
        gs[0].save(OUT / f'{name}.gif', save_all=True, append_images=gs[1:],
                   duration=45, loop=0, disposal=2)
    print(f'{name:10s} {len(legs)} legs  cut={cut} → {OUT / (name + ".png")}')

if not found:
    print('no rigs matched', file=sys.stderr)
    sys.exit(1)
