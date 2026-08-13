# Chapter craft — art production and 3D scenes

The asset-production half of [chapter-craft.md](chapter-craft.md). **Read this before generating any new art** (a sprite, a walk cycle, a backdrop, line art) **or before touching a code-drawn 3D scene.** Not needed when building a chapter out of art that already exists, which is why it lives here and is not auto-loaded.

### A code-drawn 3D scene

All of these were paid for on The Empty Plot, whose founder verdict was *"visuals acche naii hai"*.
**Not one of the faults was geometry.** A 3D scene that reads as untextured primitives is almost never
short of shapes — it is short of light, contact and palette, and every fix below is a constant or a flag.

- **CONTACT SHADOWS ARE NOT OPTIONAL IN 3D EITHER, and this is the one everybody skips** — because the
  geometry genuinely *is* grounded, and it is very easy to believe that settles it. It does not: with
  no shadow a van, a mast and a character all read as cut-outs standing on a plane, exactly as a
  sprite with no contact ellipse does. `shadows` on the canvas plus `castShadow`/`receiveShadow` is
  four words of JSX and it is the single biggest change you can make to one of these scenes.
- **THE FILL MUST NOT DROWN THE KEY.** Hemisphere 1.5 + ambient 0.4 against a directional 1.5 means
  every face of every box arrives at nearly the same brightness, so a cube renders as a flat
  rectangle. The directional has to WIN; the fill is a floor that keeps shadowed sides readable, not
  a second sun. ⚠️ **Then check your darkest object**: a dark tone that was fine under a bright wash
  goes to a black silhouette under a directional-dominant one, and *a dark object needs more ambient
  than a pale one while there is only one ambient* — so the floor moves on the OBJECT, not the light.
- **A LARGE FLAT AREA OF ONE COLOUR READS AS A VOID**, and there are usually two of them: the sky and
  the ground. Neither needs a shader. The sky is a **CSS gradient behind a transparent canvas**
  (`gl: { alpha: true }`, no `scene.background`) — ⚠️ and the fog must then fade to the gradient's
  **horizon** tone, not its midpoint, or the ground's far edge dissolves into a colour that is not
  there and draws a seam across the horizon. The ground is **one non-tiled `CanvasTexture`** stretched
  across the whole plane.
  ⚠️ **NON-TILED IS NOT A DETAIL — IT IS THE WHOLE SAFETY ARGUMENT.** A tiled texture is precisely how
  the printed answer arrives (see the grid rule in §0a); stretched once, 512 px over 120 m is ~0.23 m
  a texel and the smallest wash is tens of metres across, so there is no scale at which it could
  become a ruler.
- **THE MARKERS ARE THE LIGHT ELEMENTS.** Drawing a road and the boundary posts *darker* than the
  ground made the road own the bottom third of the frame as one flat dark bar and turned the posts and
  rails — the things that say where the plot IS — into harsh black lines. Whatever marks the working
  area is the pale thing on it.
- ⚠️ **TWO LARGE FIELDS MUST NOT SHARE A HUE ARC.** When a palette check leaves you only two legal arcs
  and you have three layers to separate (sky · ground · props), two of the three must share one —
  **make it the small objects that share with a field, never field-with-field.** Two of this chapter's
  four settings had ground AND sky in the same band, so those worlds were flat *before a single line
  ran* and no amount of saturation could have rescued them.
- ⚠️ **AND A PALETTE HUGGING THE FLOOR OF ITS LEGAL RANGE IS A LEGAL PALETTE THAT READS AS NO PALETTE.**
  The separation check gave a ceiling of 0.34 saturation and the generator was running at 0.06–0.25.
  Sit near the ceiling the check gives you, not at the bottom of it.
- ⚠️ **EMPTINESS IS USUALLY A DISTANCE BAND WITH NO CONTENT, NOT A MATERIAL WITHOUT A MAP.** Told the
  ground looked empty, the texture was the obvious answer and it was only half of it: everything the
  generator produced sat at **z ≤ 13 while the skyline started at z ≥ 34**, so the forward view was a
  bare twenty-metre band. **Measure the gap between your near set and your far scenery before adding
  detail to a surface.**
- ⚠️ **ANYTHING IN THE CORRIDOR BETWEEN A REVIEW CAMERA AND ITS SUBJECT WILL EVENTUALLY BLOCK THE SHOT.**
  A scatter generator does not know where the camera goes, so on the one beat that shows the child what
  they built, a randomly-placed prop stood square in front of it. Either place the scatter outside the
  corridor or place the camera outside the scatter — but state it, because nothing will fail.
- **A character made of four primitives is a bowling pin**, and in a first-person chapter they are on
  screen in every beat. Two arms and one band of colour is the difference between a skittle and a
  person, and the band can do palette work at the same time (a hi-vis vest pulled the foreman off the
  clay hue his own tiles use). **And give them the thing their job implies** — a foreman on a building
  site with no hard hat is a costume with a piece missing, and a brim is also the strongest silhouette
  cue available on a round head above a round body.
- ⚠️ **AND EVERY OTHER PROP IS THE SAME RULE: A NAKED PRIMITIVE READS AS A PLACEHOLDER, AND NO AMOUNT
  OF LIGHTING FIXES IT.** This is the one that produced *"visuals bhot acche naii hai"* on a scene that
  had already had a full lighting and palette pass. A box is not a van and a cone is not a tree,
  however well lit; the yard read as grey slabs on the horizon and a purple cone in a field. **What is
  read in a low-poly scene is the SILHOUETTE** — a trunk under a canopy, wheels under a body, a pitched
  roof over walls, legs under a hoarding, a parapet on a distant block. Two or three parts each, and it
  costs no assets.
  • **Promote the comment to a field.** The catalogue already said `// a van` and `// a tree` in prose
    while handing the renderer a bare `w/h/d`; a `role` on each entry is the same information where the
    scene can act on it, and it beats inferring the thing from its proportions (clever, and it breaks
    the moment the catalogue changes).
  • ⚠️ **EVERY SUB-PART TAKES A SHADE OF THE PROP'S OWN TONE, NEVER A COLOUR OF ITS OWN.** A separation
    check is computed on the tone the GENERATOR produced, so a brown trunk or a green canopy invented
    down in the scene clears a check that never saw it — the doc's own *"a gate that reads the DATA
    cannot see how the scene draws it"*. Lightness is free; hue is not, and the silhouette is doing the
    reading anyway.
  • **`flatShading` is the other half and it is free.** A 10-segment cone smooth-shaded is a soft grey
    blob; faceted, it is a deliberate low-poly tree. Boxes are unaffected.
- ⚠️⚠️ **THE SUN'S *ANGLE* IS WHAT MAKES A BOX READ AS A BOX, AND A HIGH SUN POINTING AWAY FROM THE
  PLAYER IS THE ARITHMETIC DEFINITION OF "THESE ARE SHAPES".** This is the one that survived two
  visual passes because everyone kept tuning brightness. Work it out on the actual rig before touching
  anything else: a key at `[16,30,11]` is `L = [0.448, 0.840, 0.308]`, i.e. **57° elevation — midday,
  the flattest light there is.** The child spawns looking down +Z, so every prop face they can see is
  the −Z face, where `N·L = −0.308` — *no key at all*. Add up what is left and the face TOWARD the
  player and the LEFT face both land on exactly **0.580** (hemisphere + ambient and nothing else),
  while the roof lands on **1.546**. **Two of the three faces a child sees on every box render at
  literally the same value, and the brightest thing in the frame is a roof they are looking down on.**
  No palette, silhouette, texture or shadow work can survive that — a cube lit like that *is* a
  rectangle. The fix is direction, not intensity: a low key (~25°) placed ~60° off the player's
  forward axis, and the flat fill replaced by two SHADOWLESS directionals that fill with direction
  rather than with a wash. Five distinct face values at 4.6:1 instead of two identical ones.
  **Compute `N·L` for the faces the camera can actually see before you touch a single colour.**
- ⚠️ **AND THE SOFT SHADOW SHIPS IN THE SAME CHANGE AS THE LOWERED SUN, NEVER AFTER IT.** Dropping a
  key from 57° to 25° takes the shadow-length multiplier from 0.65 to 2.10 — a 2.6 m cabin casts 5.5 m
  instead of 1.7 m. Long **hard-edged** shadows read as black smears, which is exactly why an earlier
  pass raised the sun in the first place: *it removed the light to hide the shadow, and paid with all
  the form.* Ship them together or you will draw the wrong conclusion and revert the thing that was
  working. ⚠️ Refit the bias with the angle too — and expect the derivation to be optimistic, because
  a big horizontal receiver sits at a *grazing* angle to a low sun: a derived `normalBias` of 0.04
  still speckled the whole near band, and 0.09 was what actually cleared it.
- ⚠️ **A `CanvasTexture` DEFAULTS TO `NoColorSpace`, SO EVERY COLOUR YOU PAINT INTO IT ARRIVES WRONG.**
  The renderer treats it as linear data and skips the sRGB decode, so the texture renders darker and
  flatter than the colour authored into it. Silent, no warning. Worse than the look: **every palette
  number in the generator had been hand-tuned by eye against a wrongly-decoded ground**, so the whole
  palette was being judged on a false baseline and each successive pass was re-tuning on top of a bug.
  `tex.colorSpace = THREE.SRGBColorSpace` on anything carrying colour, and land it BEFORE any palette
  work, not after.
- ⚠️ **A PERFECTLY FLAT PLANE CANNOT LOOK LIKE GROUND, HOWEVER WELL IT IS LIT.** One quad takes one
  lighting value across the whole lower half of the frame, so the ground reads as a coloured backdrop
  the props are standing in front of. Gentle relief plus `flatShading` gives every facet its own value
  and the surface acquires form — this is the single biggest difference between a code-drawn scene and
  a shipped low-poly game, and it is invisible until you put the two side by side.
  • ⚠️ **THE HIGH OCTAVE IS WHAT MAKES IT READ, NOT THE AMPLITUDE.** Broad 30–60 m swells move the
    whole sheet together, so adjacent facets end up with nearly the same normal and it still looks
    flat however tall the hills are. What the eye reads is *neighbouring faces catching the key
    differently*, which needs a term whose wavelength is a small multiple of the cell.
  • ⚠️ **AND IT MUST BE DEAD FLAT WHEREVER THE CHILD CAN STAND** — a fixed eye height clips through a
    slope, and relief inside the working area is a landmark to pace against instead of dividing.
  • ⚠️ **BUILD IT IN THE PURE MODULE AND BIND THE ARRAYS.** The scene's anti-grid source rules forbid
    loops precisely because a nested loop is how a grid arrives; generating the vertices next door and
    handing over a `Float32Array` keeps those rules meaningful AND lets the gate assert the real
    geometry — cell size, jitter, and zero displacement inside the plot.
- ⚠️ **AN AXIS-ALIGNED WORLD IS THE LOUDEST "THIS WAS GENERATED" SIGNAL IN A FRAME, AND IT IS FREE TO
  REMOVE.** Every box square to the world presents the same two faces at the same two angles. A
  founder cannot name it and reads it instantly as placeholder geometry. One seeded Y-rotation per
  prop. **And it strengthens the pedagogy rather than costing anything**: an axis-aligned world is the
  only one in which two props could line up parallel to the pacing direction and read as a marked
  interval. The rare change that is both better-looking and harder to cheat.
- ⚠️ **THE RENDERER'S TONE-MAPPING DEFAULT IS A COLOUR DECISION NOBODY MADE.** r3f sets
  `ACESFilmicToneMapping` on every `<Canvas>` — a film-response curve that rolls off highlights and
  desaturates as it goes. On a photoreal scene that is what you want; on a deliberately low-saturation
  stylised one it eats the little colour there is and everything arrives milky grey. `flat` on the
  Canvas selects `NoToneMapping`, so the palette that was so carefully computed is the palette that
  reaches the screen. ⚠️ **It is not free:** with no roll-off the light intensities become a HARD
  ceiling rather than a soft one, so every intensity has to come down with it (2.5 → 1.15 here) or lit
  faces clip to white — which is what the tone mapping was hiding.
- ⚠️ **A NEARLY-WHITE FOG COLOUR MAKES EVERY DISTANT THING WHITE, AND DARKENING THE OBJECT CANNOT FIX
  IT.** The distant band was darkened twice before anyone did the arithmetic: a building is multiplied
  by the key light (~×1.7 on a lit face) and *then* blended toward the fog colour by its depth, so a
  haze at 0.93 lightness returns everything past the mid-ground as white cardboard whatever tone the
  generator gave it. **Fix the haze, not the thing in it** — and keep most of the sky's saturation in
  it, or distance reads as fade-out rather than as distance.
- ⚠️ **A GRADIENT SKY'S HAZE STOP MUST LAND *ABOVE* THE HIGHEST HORIZON ANY CAMERA PRODUCES.** Fog
  fades the ground plane's far edge to the haze tone; if the gradient only reaches that tone at 100% of
  the viewport, the fogged ground meets a sky two stops darker and the join draws a hard line straight
  across the frame. And a stop tuned to one camera reopens the seam at another — a review shot pitching
  down 30° puts the horizon somewhere quite different from a walking one. Reach haze early and hold it
  all the way down: everything below the horizon is covered by ground, so it costs nothing.
- ⚠️ **A GROUND WASH SIZED FOR THE PLANE IS SIZED FOR THE WRONG THING — SIZE IT FOR WHAT IS ON SCREEN.**
  A 120 m texture sounds generous until you notice the camera is at eye height looking along the ground,
  so everything past the fog is gone and the band actually visible is roughly a QUARTER of the sheet.
  Washes 200 px across therefore fill that window edge to edge with one tone and the yard reads as a
  flat field however strong they are. Mix in blobs small enough that any quarter of the sheet carries
  variation.

### Generating new art

⚠️ **IMAGE→3D IS NOT LOW-POLY, AND ONE TEST SETTLES IT FOR ABOUT 30 CREDITS.** Generated *images* of
stylised props are excellent — clean facets, warm muted colour, exactly the target look. The 3D
conversion is a different thing entirely: measured on one van, `image_to_3d` returned **28,357
triangles and a 3.1 MB embedded JPEG in a 4.6 MB GLB**, and dropped into the real scene it was a
melted lump — wheels gone, roof rack smeared into the body — that looked visibly *worse* than the
60-triangle hand-built prop beside it. Eight of those is ~227k triangles and ~37 MB against a
whole-repo asset budget of 22.8 MB. **Reconstruction produces photogrammetry topology; it cannot
produce facets.** Generate ONE and put it in the scene before committing to a set.

⚠️ **SO SPEND THE ART BUDGET ON A TARGET FRAME INSTEAD — it is worth more than any brief.** A single
generated image of *the whole scene as it should look* turns "the visuals aren't good" into a list you
can work through: which colours, which silhouettes, where the near-field furniture goes, how faint the
horizon is, where the sun sits. Two 1k images cost ~3 credits, land in `docs/art/`, and become the
standing reference the next session builds against — the same role the accepted backdrops already
play for 2D chapters. **Get it approved before building to it.**

Only generate when the library genuinely lacks something or fits poorly — but when it does,
generate rather than settling for an emoji or a CSS shape.

**Style reference: reference the ORIGINAL / earliest art** for SPRITES — `apple.png`, `cookie.png`,
`duck.png`. Later AI batches drift, and referencing them compounds the drift. References must be
**deployed URLs** — `media_import_url` silently fails on a 404 and the model then generates from
text alone.

⚠️ **BUT THIS RULE USED TO NAME `pond.jpeg` AND `forest_*.jpeg` AS BACKDROP REFERENCES, AND THOSE
TWO FILES ARE THEMSELVES FLAT VECTOR — ink outlines, flat fills, no brushwork.** So it told you to
attach a picture of the exact style the style rule above forbids, and **the picture wins over the
prose every time.** That is what produced FitOut's first badge-world failure: a prompt demanding
painted, with a cartoon stapled to it, returning a cartoon. The second attempt then dropped the
reference and produced a featureless gradient — the two recorded failure modes are the two halves of
one bad reference list. **The correct backdrop reference is a scene THIS CHAPTER has already
accepted** (`fit_station.jpeg` + `fit_sign.jpeg` for FitOut); referencing those landed the same
world in one pass, zero retries. Generalise: **reference the nearest ACCEPTED artefact, not the
oldest one** — and open every reference and look at it before attaching it, because a reference that
returns 200 is more dangerous than one that 404s, not less.

⚠️ **AND "A SCENE WITH REAL CONTENT" IS THE WRONG CORRECTION FOR AN EMPTY-GRADIENT FAILURE.** The
accepted scenes in a chapter whose frame fills the middle are *deliberately* near-empty — a wall, a
floor, and two painted objects pinned to the far left and right edges. What separates them from the
rejected "flat featureless bands" is not content density but **(a) visible brush texture instead of
a smooth ramp, (b) one hard readable wall/floor or horizon line, and (c) two to four real painted
objects at the frame's EDGES giving the place an identity.** Ask for those three things by name;
asking for "more stuff" gets you a scene the layout has to fight.

**Walk-cycle pipeline** (this is how every drawn cycle in the app was made):

```
generate_image  (subject on a FLAT chroma background)
      ↓
generate_video  kling3_0_turbo, 5s, "walks in place, camera locked, background stays flat"
      ↓
python3 scripts/creature-frames.py <clip>.mp4 <name> --frames 12 --start 0.5 [--key magenta]
      ↓
register in canvas/sheets.ts  { url, frames, fps, cellAspect }
```

**When a side-facing still already exists, this is IMAGE-TO-VIDEO and the `generate_image` step is
skipped entirely.** Composite the transparent cutout onto a flat chroma field (Kling needs an opaque
start frame), pass it as `start_image`, and the still itself locks the style — cheaper and far more
reliable than generating a fresh still. `scratchpad/chroma.py` does the compositing.

**DERIVE the chroma field, don't remember it.** Measure the distance from green and from magenta to
the subject's *nearest actual pixel* and take whichever is further. Run blind on the existing cast
this independently reproduced every case the sessions below learned by burning credits — frog
(green clearance 156 vs magenta 206), alien (173), and Milo, whose green backpack gives green a
clearance of 172 against magenta's 209. It also flags the marginal ones: the dragonfly is 169 green
/ 153 magenta, i.e. neither field is comfortable and it is the one to expect a retry on.

Gotchas that have each cost real credits:
- **Key on MAGENTA whenever the subject contains green** — a green key eats a green backpack or a
  turtle's own flippers. (Now derived automatically; see above.)
- **Kling fades the background in** rather than starting flat; always use the settled tail
  (`--start 0.5`), or generate 10s so the settled part holds real motion.
- ⚠️ **AND THE MOTION HAS ITS OWN SETTLE — CUT FROM THE ACTIVE WINDOW, NOT THE FRONT OF THE CLIP.**
  The model holds the start frame for a beat before it begins moving, and a strip cut from there is
  a character standing still. Measured on the 9–11 foreman bear: **frames 0–17 of 121 have an
  IDENTICAL feet-span**, so a cut at `--start 0` gave a 12-cell strip that was **9 cells STATIC**
  and read as a shuffle rather than a walk. ⚠️ **A stronger prompt does not fix this and the retry
  is wasted money** — a second take demanding "BIG deliberate strides" bought **1%** more stride
  (29% → 30% of frame height); re-cutting the SAME clip from its middle bought all of it.
  **Find the window before paying for another generation:** measure a per-frame motion signal (the
  ink span in the bottom fifth of the frame is enough), take the first frame that deviates from the
  held start value, and cut one autocorrelation period from there.
- **A walk's feet-span signal has HALF the walk's period**, because it cannot tell left-leg-forward
  from right-leg-forward. Autocorrelate the whole frame to get the cycle; use the span only to find
  where the motion starts and how big the stride is (26% of body height reads as a heavy plod, 18–20%
  as a light one).
- ⚠️ **THE SUBJECT SETTLES TOO, AND THAT IS THE BIGGER EFFECT.** On an image-to-video run the
  magenta field was solid from frame 0 — but the model spent the **first 20 of 121 frames
  re-rendering the subject**, shrinking it from 610px to 360px wide and drifting it 89px right,
  before locking in. From frame 20 on it was stable to 6%. So `--start` is not only about the
  background; discard the front regardless. Measure per-frame bbox width and centre to find where it
  locks, rather than guessing.
- **Say "at a CONSTANT size, must not drift, grow or shrink."** The prompts that settle fastest all
  carry that clause; the one that omitted it produced the 20-frame settle above.
- **The reported output geometry is not the delivered geometry.** A job whose params said
  `1280×720` delivered a **960×960 square** file. Check the actual frames before concluding a square
  subject got cropped.
- **The preset matcher intercepts on keywords and it is a pre-submission notice, not a charge.**
  "wings **beating**" matched a music preset; other prompts matched a lighting one. Pass the
  suggested id back as `declined_preset_id` to generate literally — but it suppresses only **that
  one id**, so a retry can match a different preset and need a second decline. Three interceptions
  across a 10-video batch cost nothing: the balance came out at exactly 10 × 7.5.
- **Verify the spend against the balance after a batch**, which is how you catch the
  "server isn't responding but it submitted anyway" duplicate.
- **The safety filter false-positives.** Rephrasing in the same register as a known-good prompt
  clears it; the first Milo prompt returned `status: "nsfw"` for nothing.
- ⚠️ **A CREATURE WITHOUT A REGISTERED SHEET SILENTLY BECOMES A STILL — AND A STILL THAT TRAVELS IS
  A STICKER BEING DRAGGED.** `SheetCell` falls back to a plain `<img>` when `SHEETS` has no entry for
  the src, which is the correct fallback and also completely invisible: the creature is drawn, it is
  the right creature, and it slides. **Assert `hasSheet()` for every creature a chapter casts** —
  it is one line in the gate and it is the only thing standing between you and the cardinal fault.
- ⚠️ **A PROP'S ART STYLE MATTERS AS MUCH AS A BACKDROP'S, AND THE LIBRARY MIXES BOTH.**
  `train_car.png` and `train_engine.png` are flat-VECTOR cartoons — thick uniform outlines, flat
  fills, a face on the engine — and a painted chick sitting in one is the same mismatch the founder
  rejected in the pond backdrops. `cart.png` next to them is genuinely painted. **Open the file
  before designing a chapter around it**; the check that saved BlockYard is the same one the
  `milo_hop` lesson asks for, applied to a prop instead of a sheet.
- ⚠️ **AND SO IS WHICH WAY IT FACES — CHECK IT LARGE, BY EYE, PER SPRITE.** CoinShop's six shoppers
  were rendered as thumbnails, called "all left-facing" in one line, and a **duck and a squirrel
  shipped walking backwards** — caught by the founder on a screenshot. The retry was worse: a script
  scoring ink mass in the top third *also* said the squirrel faced left, because **its bushy tail
  fills the top-left and outweighs its head.** Two instruments, same wrong answer. Render each one
  BIG and look, then cross-check the app's own registry — `CAST` in critters.tsx already carried
  `facesLeft` for two of the six, and pinning the two sources together is a gate a heuristic cannot
  be. A blanket answer for a set of sprites is the fault; facing is per sprite.
- ⚠️ **A SHEET'S NAME IS A CLAIM, NOT A FACT — MEASURE IT BEFORE YOU DESIGN ON IT.**
  `milo_hop.png` shipped, was registered with a comment reading *"Milo's HOP, for a chapter where he
  jumps between places"*, and was named as the foundation of A3 in both the handoff and the rethink
  doc. **It is a walk cycle** — a second take of `milo_walk.png`, measured lift `0` in all 12 frames
  and height varying by under 2%. A whole chapter was designed on it before anyone opened it. The
  check is thirty seconds: split the strip and print each cell's alpha bbox — **lift ≠ 0 somewhere
  means it leaves the ground, and a flat 0 down the column means it does not.** Then render a
  contact sheet and look. Do this the moment a sheet becomes load-bearing, not after.
  (Its registry key `milo_hop_side.png` also pointed at a file that did not exist, which nothing
  caught because no caller had ever used it.)
- **Never `--pingpong` a walk** — reversed legs moonwalk. Ping-pong is only for motion that
  oscillates with no clean cycle (a chirping beak, paddling flippers).
  ⚠️ **And decide it by MEASUREMENT, not by what the motion is called.** Divide the last-to-first
  cell difference by the mean cell-to-cell step: on CoinShop's ten keeper strips that ratio is
  **1.3–2.7**, i.e. the period the cutter "found" is not a loop and the cycle hitches once a round.
  A wave, a nod, a wing-flap — anything that returns the way it came — has no clean cycle to find,
  and `animation-direction: alternate` is one CSS property.
- ⚠️ **A CHARACTER GENERATED INSIDE ITS SCENE CAN ONLY EVER WIGGLE IN PLACE; ONE GENERATED ON FLAT
  CHROMA CAN WALK — AND THAT IS DECIDED BEFORE ANY CODE RUNS.** Splitting a video into frames is the
  same pipeline either way, so it is easy to believe you have made an animation when you have not.
  A cutout crosses the screen, leaves, and turns up on another backdrop. A whole-scene generation has
  no alpha and nothing to key, so the strip is an opaque crop and the only thing it can do is twitch
  inside its own rectangle — measured on CoinShop's stalls, that rectangle is **4.4–10.5% of the
  frame**, i.e. **93–96% of the picture never moved.** The founder's question was the right one:
  *we already do frame-by-frame properly, why is this one like this?* **Decide whether the character
  needs to travel BEFORE generating it**, and if it does, generate it alone on a flat field.
  (CoinShop's keepers were built, wired, driven and then removed for exactly this. The strips are
  still on disk and deliberately unused.)
- ⚠️ **NEVER ATTACH A CHARACTER REFERENCE TO A BACKDROP PROMPT — YOU GET THE CHARACTER COMPOSITED
  INTO THE SCENE.** Generating The Angle Shop's three sites, I passed both an accepted backdrop AND
  the foreman's sprite as references, on the theory that two references lock the style harder. The
  model read the sprite as *a subject to include*: **two of the three came back as the reference
  backdrop with the bear standing in it**, one of them with invented signage I had explicitly
  forbidden. A backdrop with a character baked in is unusable — it is the welded-in-keeper fault
  above, arrived at by accident. **One reference, and it is a scene.**
- ⚠️ **AND A STYLE REFERENCE THAT IS COMPOSITIONALLY CLOSE TO WHAT YOU ASKED FOR GETS COPIED INSTEAD
  OF STYLED.** `depot_yard` is *a wall with a yard in front of it* and I asked for *a wall with a yard
  in front of it*, so the model returned `depot_yard`. The one site that came out right was the one
  whose subject the reference could not supply (a stone embankment over a stream) — it had to build
  that. **Reference for BRUSHWORK from something the prompt cannot be mistaken for**, or describe a
  subject the reference plainly does not contain, and add the reference's own motifs as negatives
  (`no brick archways, no green garage doors`).
- ⚠️ **GIVE A BACKDROP A HOLE WHERE THE ANSWER GOES.** The retry that worked asked for *a cottage with
  its roof removed, the gable open to the sky* and *a shelter whose posts have nothing on top* — so
  the scene is visibly waiting for the thing the child makes. It fixes the composition problem at the
  same time: the centre is empty because something is missing from it, which is a reason rather than
  a rule. A variant that came back with the gable **complete** was rejected on exactly this, however
  well painted it was.
- ⚠️ **A BACKDROP THAT FAILS ON VALUE IS GRADED, NOT RE-ROLLED.** Two of these measured **0.754 and
  0.642 against a cast at 0.539–0.597** — the `grocery_sweets` fault, which turns the cast into
  cut-outs on a blank page. Re-rolling costs credits AND the composition you just approved. A
  **highlight-weighted curve** (bisect a gamma on the RGB until the mean value hits target) pulls the
  SKY down hardest and barely moves the midtone ground the cast stands on, which is exactly the
  correction wanted; add back ~12% saturation, since gamma desaturates. Three lines, deterministic,
  and the painting survives.
- ⚠️ **A SCENE AND ITS CHARACTER GENERATED IN ONE FRAME GIVE AN OPAQUE STRIP, NOT A CUTOUT — AND IT
  ONLY MAKES SENSE LAID BACK OVER ITS OWN PIXELS.** This pipeline (generate the whole picture →
  animate it → crop the rectangle the motion happened in) is cheaper and better-blended than a
  chroma cutout, because the character is painted INTO its stall rather than pasted onto it. The
  price is that the crop rectangle is load-bearing and nothing records it. Recover it by
  **template-matching cell 0 back into its own backdrop** (mean abs error 5–8 of 255 is codec plus
  palette noise, and the minimum is unambiguous), then composite a MID-CYCLE cell back and look.
  ⚠️ **Cell 0 matching invisibly does not mean the strip does**: the moving cells carry a percent or
  two of drift, so a faint rectangle appears the moment it plays. Fade ~3% of each edge — the border
  pixels ARE the background, so it costs nothing — with two crossed gradients intersected, never a
  radial one, which would dim the middle.
- ⚠️ **AND EVERYTHING PINNED TO THAT PICTURE MUST SHARE ITS TRANSFORM.** The backdrop, the patch and
  the ground line go through ONE function. The moment the backdrop is laid out by `object-fit:
  cover` and the patch by anything else, a percentage of the viewport stops being a percentage of
  the image and they come apart at every aspect but the one you tested.
- Judge a sheet on its `motion` / `loopgap` numbers and at real display size, not on the strip.
- ⚠️ **"THE MATH MUST BE EXACT" IS NOT A REASON TO DRAW GEOMETRY — CLIP REAL ART BY THE EXACT
  GEOMETRY INSTEAD.** SliceShop drew its fractions as flat SVG wedges and segments for years, on the
  honest-sounding argument that any denominator has to divide cleanly. It reads as a **pie chart laid
  over a painted shop** — the same family as the brown slab and the hairline ghost house, and the
  founder rejected it on sight. The two are not a choice: put the sprite inside an SVG `clipPath` cut
  by the wedge and the division stays arithmetic while what a child sees is an actual pizza. Nudge
  each piece out along its own middle so the parts read as separate PIECES rather than one
  undisturbed picture with lines on it.
  • **A food drawn for this must FILL its frame** — a circle touching all four edges, or a slab edge
    to edge — because the clip samples inside the shape and any margin shows as background. Crop the
    generated art to its own content bbox; the "draw from the ink box, not the file box" rule again.
  • **And its surface must be PLAIN.** A moulded chocolate grid, a waffle pattern or piped icing lines
    are repeating marks across the thing being divided, which is the vertical-grain rule: before
    adding texture to anything countable, ask which axis already means something. Every prompt says
    *no scored lines, no grid, no squares, no repeating pattern* for exactly this.

**Line-art pipeline** (the colouring chapter, and anything else that must be filled with colour):

```
generate_image  "children's colouring book … THICK uniform outlines, EVERY shape fully closed,
                 flat white fill, no shading/hatching/dots"   ← on flat MAGENTA for a cutout,
                                                                on WHITE for a full page
      ↓
python3 <chroma key>   min(R,B) − G, soft ramp + despill      ← only when a cutout is needed
      ↓
verify it FLOODS  (threshold → dilate 2px → connected components; see the scratch `regions.py`)
```

- **Do not use `remove_background` on line art.** It is an AI matte, and these subjects are pure
  white inside a black outline — a matte that decides "white is background" eats the interior, which
  is exactly the region the paint has to fill. A flat magenta backdrop keyed by hand is more
  reliable AND free.
- **A full PAGE needs no cutout at all**: `mix-blend-mode: multiply` drops its white straight out
  onto the paper.
- **Colouring is a two-layer composite, and it is exact**: a solid fill shaped by the drawing's
  silhouette, with the drawing multiplied on top. White fill × colour is the colour; black ink ×
  colour is still black ink, so the lines never muddy at any hue. This is also why painted sprites
  fought it — greyscaling and brightening them to fake line art was three filters of guesswork that
  line art makes unnecessary.
- **PROVE the artwork floods before wiring it.** One hairline gap where two strokes nearly meet lets
  the fill escape and swallow the page. Dilate the ink ~2px to close near-misses, then count the
  regions: a good page returns ~100 with the largest around 20% (the sky). One giant region means
  the line work is open and the art is unusable — regenerate rather than patch.
- **An area's colour must differ from whatever it sits inside.** A blue cloud on a blue sky gave a
  correct tap no feedback at all.
- Greyscale `pat_*` sprites are greyscale **by design** — code-tint them, never bake colour in.
- ⚠️ **AND A SPRITE'S COLOUR IS A CLAIM LIKE ITS NAME — MEASURE IT BEFORE CASTING IT.** The
  greyscale set is not confined to the `pat_*` prefix: `candy_cupcake`, `candy_lollipop` and
  `candy_candy` all measure **saturation 0.0** and render as grey ghosts if drawn raw. Mean
  `max(RGB) − min(RGB)` over the opaque pixels separates them instantly — under ~18 is greyscale,
  a real sprite runs 90–190. Thirty seconds with PIL, and it is worth putting in the chapter's gate
  rather than an allow-list, so a future swap is covered too.

