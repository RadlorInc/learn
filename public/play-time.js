// The paid game time, for every game /play opens (BlockCraft, BeatHop, Peak Rider, Rescue Rush). The end comes from
// the database (/api/game-time), never from the URL, and is counted on performance.now(), not the device's clock, so
// a child who edits either plays no longer. Asked when the game opens and every 30 s; until the first answer the game
// has no time, and a game that cannot get one goes back to /play. A later failed ask keeps the last answer: it can
// only run out, never grow.
// ponytail: a child with DevTools can change this file in their own browser. Points are spent by the database either way.

const LOCAL = ['localhost', '127.0.0.1'].includes(location.hostname);

const token = () => { try { return JSON.parse(localStorage.getItem('milo-auth')).access_token; } catch { return null; } };

async function secondsLeft(learner) {
  const r = await fetch(`/api/game-time?learner=${encodeURIComponent(learner)}`, {
    headers: { authorization: `Bearer ${token()}` }, cache: 'no-store', signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) throw new Error(`game-time ${r.status}`);
  const { left } = await r.json();
  if (typeof left !== 'number') throw new Error('game-time: no answer');
  return left;
}

// `learner` from the URL (null = opened without /play); `show(left)` each second; `done()` when the time is up, before
// the game goes `back` 2.5 s later. Opened without /play, a game plays only on localhost (building it).
export function playTime({ learner, back, show, done }) {
  if (!learner) { if (!LOCAL) location.replace(back); return; }
  let end = null; // performance.now() when the time is up, as the database last said
  const sync = () => secondsLeft(learner).then(
    (left) => { end = performance.now() + left * 1000; },
    () => { if (end === null) location.replace(back); },
  );
  sync();
  const poll = setInterval(sync, 30000);
  const tick = setInterval(() => {
    if (end === null) return;
    const left = Math.max(0, Math.ceil((end - performance.now()) / 1000));
    show(left);
    if (left === 0) { clearInterval(tick); clearInterval(poll); done(); setTimeout(() => location.replace(back), 2500); }
  }, 1000);
}
