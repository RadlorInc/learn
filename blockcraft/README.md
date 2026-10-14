# BlockCraft

A Minecraft-style voxel sandbox for the browser — a separate Vite + Three.js project, not part of the Next app.

**Made for children: no violence.** No monsters, no Ender Dragon, no weapons (swords, bow, arrows, TNT, harmful potions), no pigs, and no health, hunger, damage or dying — falling into the void puts you back on top. Animals can still be tapped (they run off) and drop what they drop.
All textures, icons and sounds are generated in code; there are no Mojang assets and no Minecraft branding.

```bash
cd blockcraft
npm install
npm run dev      # http://localhost:5190
npm run build    # static site in dist/
```

## What is in

- **World:** endless seeded world in 16×16×128 chunks — plains, forest, desert, snowy, mountains, ocean/shore; caves, lava lakes, ores (coal, iron, gold, diamond, lapis, emerald, redstone), oak and spruce trees, cactus, sugar cane, flowers, pumpkins, melons
- **Weather:** rain, snow in cold biomes, thunderstorms with lightning; rain speeds up crops and fishing
- **Structures:** villages with villagers and trading; dungeons; stronghold with the End portal room; ocean monuments with gold; woodland mansions with loot; Nether fortresses with nether wart and blaze rods in the chest; End cities with an elytra in every city chest
- **Modes:** Survival and Creative
- **Blocks:** Minecraft break timing, cracks, tool durability, falling sand/gravel; doors, ladders, slabs, stairs, fences, beds, cobwebs, rails, anvil, brewing stand and more
- **Redstone:** dust that carries power 15 blocks, levers, buttons, pressure plates, redstone torches (NOT gates), redstone blocks, lamps, pistons that push up to 12 blocks, doors that react to power
- **Fluids:** flowing water and lava; obsidian/cobblestone where they meet; buckets and milk
- **Crafting:** 2×2 and 3×3, 89 recipes
- **Furnace**, **chests**, **brewing** (water → awkward → swiftness or night vision; gunpowder for splash), **anvil** (repair with material or a second item, combine enchantments)
- **Farming:** hoe, seeds, wheat, bone meal, saplings, sugar cane, nether wart; breeding (cows and sheep with wheat, chickens with seeds); chickens lay eggs
- **Survival:** XP and potion effects (armour can still be crafted and worn; with no damage it is for looks)
- **Enchanting:** Efficiency, Protection, Unbreaking
- **Travel:** boats, minecarts on rails (corners too), elytra gliding, ender pearls (librarians sell them; also in dungeon and stronghold chests), Nether portals, End portal, End gateway to the outer islands; the portal home is in the middle of the End from the start
- **Fishing** with a rod: fish, junk and treasure
- **Map** (live top-down view of the area) and **compass** (points home)
- **Animals:** cow, sheep, chicken, wolf (tame with bones: sits, follows, comes through portals), villager
- Day/night, sun, moon, stars, clouds, fog, torch/lava/lamp light, ambient occlusion
- Synthesized sounds, autosave (all dimensions, pets, vehicles, effects), settings, touch controls

## Not in (yet)

Multiplayer (needs a server). Simplified compared with Minecraft: repeaters/comparators/hoppers/sticky pistons are missing from redstone; no rail slopes or powered rails; mansions, monuments and end cities are smaller single-building versions; no end ships; fewer animals (no bats, squid, rabbits, horses, llamas…); no banners, paintings, item frames, maps are not saved as items; no villager professions beyond four.

## Inside the learning app (/play)

`npm run build` here writes to `../public/blockcraft` (see `vite.config.js`); the app's `npm run build` runs
`npm run build:game` first, so a deploy always carries the current game. `/play` loads
`/blockcraft/index.html?embed=1` in a frame (`src/app/play/GameFrame.tsx`). In embed mode there is no title screen
and no quit button, and **the page owns the save**:

| from the game | from the page |
|---|---|
| `bc:ready` — loaded, waiting | `bc:start {save, key}` — start from `save` (null = a new world); `key` is the child's device-copy key |
| `bc:save {data}` — every ~15 s, on pause, on pagehide; also written to `localStorage[key]` | `bc:stop` — game time is up: save and freeze |
| `bc:stopped` — saved; the page may remove the frame | |

The page uploads saves to the child's account (`game_saves`). Only this one path may be framed (`next.config.ts`).
⚠️ Run `npm run build:game` at the repo root once before `next dev` if you want the game on the local `/play`.

## Testing

`dev-harness.js` (dev server only, never in the build) adds `window.H` helpers for driving the game from the console: `await import('/dev-harness.js')`.

## Files

`src/noise.js` simplex noise · `src/blocks.js` blocks, items, texture atlas, icons · `src/gen.js` terrain, structures, loot, Nether and End · `src/world.js` streaming, fluids, lighting, meshing, raycast · `src/shapes.js` doors/stairs/slabs geometry ·
`src/entities.js` physics, animals, thrown items, boats, minecarts, fishing bobber · `src/redstone.js` redstone power · `src/inventory.js` inventory, recipes, furnace, enchanting, trading, screens · `src/audio.js` sounds · `src/main.js` game loop, input, HUD, menus, saving.
