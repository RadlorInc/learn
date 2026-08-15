#!/usr/bin/env python3
"""
Compose the EXACT start and end frames for The Empty Plot's explainer film.

    python3 scripts/plot-keyframes.py

⚠️ WHY THESE ARE DRAWN AND NOT GENERATED. A video model cannot count: ask Kling for twelve tiles in
rows of four and it will cheerfully return eleven, and in a maths chapter a picture that disagrees
with the number is the worst defect there is. `kling3_0` takes a start_image AND an end_image, so the
two ends of the film are composed here — exactly 12 tiles, exactly 3 rows of 4 — and the model is
left to do only the thing it is good at, which is the motion between them.

The palette is the chapter's own (kidKit's KID_P), so the film cannot arrive as a pasted-on
photographic thing on a neon board — the standing style rule, applied to a video instead of a sprite.
"""
from PIL import Image, ImageDraw, ImageFilter
import os

W, H = 1280, 720
NIGHT_TOP, NIGHT_BOT = (17, 26, 60), (10, 16, 38)
VIOLET, MINT, CREAM = (160, 107, 255), (46, 230, 166), (234, 241, 255)
ROADFILL = (26, 36, 74)
OUT = 'scratch/keyframes'


def base() -> Image.Image:
    """The board: a vertical navy gradient, exactly the chapter's own two nights."""
    img = Image.new('RGB', (W, H), NIGHT_BOT)
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        d.line([(0, y), (W, y)], fill=tuple(int(a + (b - a) * t) for a, b in zip(NIGHT_TOP, NIGHT_BOT)))
    return img


def glow(img: Image.Image, layer: Image.Image, blur: int = 18) -> Image.Image:
    """Neon: the shape, plus a blurred copy of itself underneath."""
    g = layer.filter(ImageFilter.GaussianBlur(blur))
    return Image.alpha_composite(Image.alpha_composite(img.convert('RGBA'), g), layer).convert('RGB')


def plan(frontage: int, depth: int, unit: int):
    """Where the road and the plot sit, centred, with the plot's own aspect preserved."""
    pw, ph = frontage * unit, depth * unit
    x0 = (W - pw) // 2
    road_h = 96
    y0 = (H - ph - road_h) // 2 + road_h
    return x0, y0, pw, ph, road_h


def draw_world(img: Image.Image, frontage: int, depth: int, unit: int):
    x0, y0, pw, ph, road_h = plan(frontage, depth, unit)
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    # the road, across the top — the one edge that is given
    d.rectangle([0, y0 - road_h, W, y0], fill=ROADFILL + (255,))
    for x in range(40, W, 120):                      # kerb dashes, so it reads as a road
        d.rectangle([x, y0 - road_h // 2 - 3, x + 60, y0 - road_h // 2 + 3], fill=(70, 90, 150, 255))
    img = Image.alpha_composite(img.convert('RGBA'), lay).convert('RGB')
    # the frontage: ONE unbroken line, no ticks — it says how wide, never how deep
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    d.rectangle([x0, y0 - 5, x0 + pw, y0 + 5], fill=VIOLET + (255,))
    for cx in (x0, x0 + pw):
        d.ellipse([cx - 14, y0 - 14, cx + 14, y0 + 14], fill=VIOLET + (255,))
    return glow(img, lay), (x0, y0, pw, ph)


def tiles(img, boxes, colour, radius=10):
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    for (a, b, c, e) in boxes:
        d.rounded_rectangle([a, b, c, e], radius=radius, fill=colour + (110,), outline=colour + (255,), width=4)
    return glow(img, lay, 14)


def area_frames(frontage=4, depth=3, unit=150):
    target = frontage * depth
    # ── START: the load, laid along the kerb in ONE line. The plot is bare.
    img, (x0, y0, pw, ph) = draw_world(base(), frontage, depth, unit)
    tw = min(64, (W - 120) // target)
    gap = 8
    run = target * tw + (target - 1) * gap
    sx = (W - run) // 2
    ty = y0 - 96 - 34
    start = tiles(img, [(sx + i * (tw + gap), ty, sx + i * (tw + gap) + tw, ty + 46) for i in range(target)], MINT)
    # ── END: the same load, in rows of the frontage, filling the plot exactly. Plus the far edge.
    img2, _ = draw_world(base(), frontage, depth, unit)
    boxes = []
    for row in range(depth):
        for col in range(frontage):
            a = x0 + col * unit + 8
            b = y0 + row * unit + 8
            boxes.append((a, b, a + unit - 16, b + unit - 16))
    end = tiles(img2, boxes, MINT, radius=14)
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    d.rectangle([x0, y0 + ph - 5, x0 + pw, y0 + ph + 5], fill=CREAM + (255,))     # the far edge
    d.ellipse([x0 + pw // 2 - 16, y0 + ph - 16, x0 + pw // 2 + 16, y0 + ph + 16], fill=CREAM + (255,))
    end = glow(end, lay)
    return start, end


def perimeter_frames(frontage=5, depth=2, unit=150):
    target = 2 * (frontage + depth)
    img, (x0, y0, pw, ph) = draw_world(base(), frontage, depth, unit)
    tw = min(52, (W - 120) // target)
    gap = 7
    run = target * tw + (target - 1) * gap
    sx = (W - run) // 2
    ty = y0 - 96 - 34
    start = tiles(img, [(sx + i * (tw + gap), ty, sx + i * (tw + gap) + tw, ty + 46) for i in range(target)], MINT)
    # ── END: the same panels, run right round the plot — two of the frontage, two of the depth.
    img2, _ = draw_world(base(), frontage, depth, unit)
    t = 18
    boxes = []
    for i in range(frontage):
        boxes.append((x0 + i * unit + 6, y0 - t // 2, x0 + (i + 1) * unit - 6, y0 + t // 2))
        boxes.append((x0 + i * unit + 6, y0 + ph - t // 2, x0 + (i + 1) * unit - 6, y0 + ph + t // 2))
    for j in range(depth):
        boxes.append((x0 - t // 2, y0 + j * unit + 6, x0 + t // 2, y0 + (j + 1) * unit - 6))
        boxes.append((x0 + pw - t // 2, y0 + j * unit + 6, x0 + pw + t // 2, y0 + (j + 1) * unit - 6))
    end = tiles(img2, boxes, MINT, radius=6)
    return start, end


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for name, (s, e) in (('area', area_frames()), ('perimeter', perimeter_frames())):
        s.save(f'{OUT}/{name}_start.png')
        e.save(f'{OUT}/{name}_end.png')
        print(f'{OUT}/{name}_start.png  {OUT}/{name}_end.png')
