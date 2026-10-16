// The paid game time, for every game /play opens (BlockCraft, BeatHop, Peak Rider, Rescue Rush). The end comes from
// the database (/api/game-time), never from the URL, and is counted on performance.now(), not the device's clock, so
// a child who edits either plays no longer. Until the first answer the game has no time, and a game that cannot get one
// goes back to /play. A later failed ask keeps the last answer: it can only run out, never grow.
//
// When it asks (2026-10-16; it was every 30 s, the game's only steady server cost): when the game opens; at once when
// the tab is shown again (a device that slept may have paused performance.now(), so this is where the clock can drift);
// every 3 minutes while it is on screen, never while hidden (the server's clock keeps running regardless); and once
// more when the count reaches 0, so time bought meanwhile on another tab or device is not cut off. A failed last ask
// ends the game.
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
export const POLL_MS = 180000;

export function playTime({ learner, back, show, done }) {
  if (!learner) { if (!LOCAL) location.replace(back); return; }
  let end = null; // performance.now() when the time is up, as the database last said
  let finishing = false; // the last ask (at 0) is out
  const sync = () => secondsLeft(learner).then(
    (left) => { if (!finishing) end = performance.now() + left * 1000; },
    () => { if (end === null) location.replace(back); },
  );
  const onShow = () => { if (!document.hidden) sync(); };
  sync();
  const poll = setInterval(() => { if (!document.hidden) sync(); }, POLL_MS);
  document.addEventListener('visibilitychange', onShow);
  const stop = () => {
    clearInterval(tick); clearInterval(poll); document.removeEventListener('visibilitychange', onShow);
    done(); setTimeout(() => location.replace(back), 2500);
  };
  const tick = setInterval(() => {
    if (end === null || finishing) return;
    const left = Math.max(0, Math.ceil((end - performance.now()) / 1000));
    show(left);
    if (left > 0) return;
    finishing = true;
    secondsLeft(learner).then((more) => more, () => 0).then((more) => {
      if (more > 0) { end = performance.now() + more * 1000; finishing = false; } else stop();
    });
  }, 1000);
}
