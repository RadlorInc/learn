# BeatHop

A one-button running and jumping game for the browser: Geometry Dash's auto-run and instant retry, with a
Mario-style jump (tap for a hop, hold for a big jump), bump blocks, gems, stars and checkpoint flags, plus ideas from
other runners (below). A prototype — nothing in the app opens it yet.

**Made for children:** no enemies, no weapons, no health; touching a thorn is an "oops" and the run restarts from the
last flag at once. All art and sound are drawn and synthesised in code; there is no background music, only sound
effects. No names, characters, art, music or levels from any other game — only general mechanics, which are not
anyone's to own.

```bash
python3 -m http.server 5191 --directory beathop   # http://localhost:5191 (plain ES modules, no build, no dependencies)
node beathop/check.mjs                            # proves every level can be finished with all 3 stars (~1 min)
```

## What is in

- **Ten levels**, each with its own look, three stars, a shield, a magnet and checkpoint flags; the next opens when one
  is done: 1 Sunny Meadow (jumps, bump blocks, a jump pad) · 2 Crystal Cave (glider) · 3 Upside-Down Sky (rings,
  gravity flip) · 4 Sandy Dunes (long jumps) · 5 Snowy Peaks (an ice-cave glide) · 6 Night Forest (ring chains, flips)
  · 7 Lava Mountain (thick thorns, a tight glide) · 8 Flip Beach (flips and a glide) · 9 Star Station (everything,
  harder) · 10 Rainbow Road (the finale).
- **Feel:** coyote time (0.1 s), jump buffering (0.12 s), hold-to-keep-jumping, a small nudge over lips and corners,
  thorns that only hurt at the point.
- **Points:** gems are points; quick gems in a row are a combo — each a note higher, worth 2 from the 5th on; a star
  is 10. **Shield bubble** (one thorn can not hurt) and **gem magnet** (6 s), in every level, back on every try.
- **Slow mode** (Celeste's assist idea): the whole game at 70% — the same jumps, more time; no penalty.
- **Hats** open at 25, 60 and 120 gems ever collected (unlockable looks from endless runners).
- Obstacles on multiples of 4 tiles keep a steady rhythm (one every 0.57 s). Sound on/off is remembered.
- Pick a colour for your block; progress, best % and stars are saved in `localStorage`.

## Inside the app (/play)

`/play` offers BlockCraft or BeatHop for the same paid time (`src/app/play/page.tsx`). `npm run build:game` (run by the
app's build) copies `index.html` and `src/` into `public/beathop/`; there is no bundler, and nothing else is shipped.
The app opens `/beathop/index.html?key=beathop.save.<child id>&until=<ms>` full page: the game saves under `key`,
shows a timer, and goes back to `/play` at `until`; "Stop and keep my minutes" on the title screen goes to
`/play?stop=1`. **The save stays on the device** (not uploaded to `game_saves`, which holds one save per child) —
see `src/data/repositories/gameSave.ts`. Tests: `gameOpen.test.ts`, `playGamePicker.test.ts`.

## Files

`src/game.js` the rules (pure, shared with the check) · `src/levels.js` the levels · `src/main.js` drawing, input,
screens, saving · `src/audio.js` sound effects · `check.mjs` the solver (it presses or lets go only every 100 ms, so no level needs fast fingers), and a check that a shield takes exactly one thorn.
