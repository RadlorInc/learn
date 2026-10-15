// The calls: each a road to a hospital, a time to get there, and its traffic — how many lanes and how many of them come
// the other way, how far apart vehicles appear (`gap`), what kinds (`mix`), how often one changes lane (`weave`), and
// whether the road is wet. Clocks (+3 s) and coins lie in the lanes. `node rush/check.mjs` proves each call can be done
// in time (an autopilot with the vehicle as it comes, no upgrades), and that it cannot be done by holding a steady,
// slow speed — the clock means hurrying — nor by driving straight down one lane — the traffic means steering.

const CALLS = [
  { id: 'tea', name: 'Tea Garden Hills', theme: 'tea', seed: 3, lanes: 3, oncoming: 0, length: 1100, time: 62, gap: 34, weave: 0.1,
    mix: [['car', 5], ['auto', 3], ['scooter', 2]], hint: 'A call from the tea gardens! You speed up by yourself: ◀ ▶ to change lanes, BRAKE to slow down.' },
  { id: 'market', name: 'Riverside Market', theme: 'market', seed: 5, lanes: 4, oncoming: 0, length: 1300, time: 70, gap: 24, weave: 0.2,
    mix: [['car', 4], ['auto', 4], ['scooter', 3], ['bus', 1]], hint: 'Busy market road. Blinking lights mean a vehicle is about to change lanes!' },
  { id: 'coast', name: 'Coastal Highway', theme: 'coast', seed: 9, lanes: 4, oncoming: 2, length: 1500, time: 84, gap: 26, weave: 0.15,
    mix: [['car', 5], ['bus', 2], ['truck', 2], ['auto', 1]], hint: 'Two-way road: the left lanes come towards you. Stay on your side!' },
  { id: 'desert', name: 'Desert Highway', theme: 'desert', seed: 13, lanes: 4, oncoming: 0, length: 1800, time: 90, gap: 22, weave: 0.2,
    mix: [['truck', 4], ['car', 3], ['bus', 2]], hint: 'Long trucks ahead. Press SIREN and they pull over to let you pass.' },
  { id: 'monsoon', name: 'Monsoon City', theme: 'monsoon', seed: 17, lanes: 4, oncoming: 2, length: 1500, time: 82, gap: 24, weave: 0.2, wet: true,
    mix: [['car', 4], ['auto', 3], ['scooter', 2], ['bus', 1]], hint: 'Rain! The road is wet: change lanes early, they take longer.' },
  { id: 'ghat', name: 'Ghat Road', theme: 'ghat', seed: 23, lanes: 3, oncoming: 1, length: 1600, time: 90, gap: 22, weave: 0.15,
    mix: [['truck', 3], ['bus', 3], ['car', 3]], hint: 'A narrow mountain road with buses. Use the siren wisely: it needs time to fill again.' },
  { id: 'night', name: 'Night Market', theme: 'night', seed: 29, lanes: 4, oncoming: 0, length: 1700, time: 96, gap: 18, weave: 0.3,
    mix: [['car', 4], ['auto', 3], ['scooter', 3], ['bus', 1]], hint: 'A night call. Watch for blinking lights in the dark.' },
  { id: 'pass', name: 'Himalayan Pass', theme: 'snow', seed: 31, lanes: 4, oncoming: 2, length: 2000, time: 104, gap: 20, weave: 0.25, wet: true,
    mix: [['truck', 3], ['bus', 2], ['car', 4]], hint: 'The last call: snow on the pass. Everything you have learned!' },
];

// clocks and coins in the lanes (going the player's way), from the call's own seed
function build(def) {
  let seed = def.seed * 7919;
  const R = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const items = [];
  for (let z = 120; z < def.length - 60; z += 70 + R() * 50) {
    const lane = def.oncoming + Math.floor(R() * (def.lanes - def.oncoming));
    if (R() < 0.3) items.push({ kind: 'clock', lane, z });
    else for (let k = 0; k < 4; k++) items.push({ kind: 'coin', lane, z: z + k * 3 });
  }
  return { ...def, items };
}

export const LEVELS = CALLS.map(build);
