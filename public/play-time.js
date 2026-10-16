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
//
// Paused (2026-10-17): the game's Pause screen calls pause() and leaving it calls resume(), which stop and start the
// paid clock in the database (POST /api/game-time). While paused the count here is frozen; an answer from the server
// sets the frozen seconds, never the end. Calls go one at a time, in order, so a quick pause-resume cannot land
// backwards. A failed call keeps the local clock as it is and the next answer wins; an answer that disagrees with the
// screen (paused on the server while the game plays, or the reverse — a failed call, a game left paused) sends the
// call again, so the server's clock never stands still while the child plays.
// ponytail: a child with DevTools can change this file in their own browser. Points are spent by the database either way.

const LOCAL = ['localhost', '127.0.0.1'].includes(location.hostname);

const token = () => { try { return JSON.parse(localStorage.getItem('milo-auth')).access_token; } catch { return null; } };

// no action: how long is left; 'pause' | 'resume': do that first. keepalive: a pause sent as the tab closes still lands.
async function ask(learner, action) {
  const r = await fetch(`/api/game-time?learner=${encodeURIComponent(learner)}`, {
    headers: { authorization: `Bearer ${token()}`, ...(action && { 'content-type': 'application/json' }) },
    cache: 'no-store', signal: AbortSignal.timeout(10000),
    ...(action && { method: 'POST', body: JSON.stringify({ action }), keepalive: true }),
  });
  if (!r.ok) throw new Error(`game-time ${r.status}`);
  const { left, paused } = await r.json();
  if (typeof left !== 'number') throw new Error('game-time: no answer');
  return { left, paused: paused === true };
}

// `learner` from the URL (null = opened without /play); `show(left)` each second; `done()` when the time is up, before
// the game goes `back` 2.5 s later. Opened without /play, a game plays only on localhost (building it).
// Returns { pause, resume } for the game's Pause screen (nothing when opened without /play).
export const POLL_MS = 180000;

export function playTime({ learner, back, show, done }) {
  if (!learner) { if (!LOCAL) location.replace(back); return; }
  let end = null; // performance.now() when the time is up, as the database last said
  let frozen = null; // seconds left while paused (the count stands still)
  let finishing = false; // the last ask (at 0) is out
  let queue = Promise.resolve();
  const call = (action) => { const p = queue.then(() => ask(learner, action)); queue = p.catch(() => {}); return p; };
  const apply = ({ left, paused }) => {
    if (frozen !== null) { frozen = left; if (!paused && left > 0) call('pause').catch(() => {}); return; }
    end = performance.now() + left * 1000;
    if (paused) call('resume').catch(() => {});
  };
  const sync = () => call().then(
    (a) => { if (!finishing) apply(a); },
    () => { if (end === null) location.replace(back); },
  );
  const onShow = () => { if (!document.hidden) sync(); };
  sync();
  const poll = setInterval(() => { if (!document.hidden) sync(); }, POLL_MS);
  document.addEventListener('visibilitychange', onShow);
  const stop = () => {
    finishing = true; // for good: a late answer, pause() or resume() changes nothing after "Time's up"
    clearInterval(tick); clearInterval(poll); document.removeEventListener('visibilitychange', onShow);
    done(); setTimeout(() => location.replace(back), 2500);
  };
  const tick = setInterval(() => {
    if (end === null || finishing) return;
    if (frozen !== null) return show(frozen);
    const left = Math.max(0, Math.ceil((end - performance.now()) / 1000));
    show(left);
    if (left > 0) return;
    finishing = true;
    call().then((a) => { finishing = false; apply(a); return a.left; }, () => 0).then((more) => { if (!(more > 0)) stop(); });
  }, 1000);
  return {
    pause() {
      if (end === null || finishing || frozen !== null) return;
      frozen = Math.max(0, Math.ceil((end - performance.now()) / 1000));
      call('pause').then(apply, () => {});
    },
    resume() {
      if (frozen === null) return;
      end = performance.now() + frozen * 1000; frozen = null;
      call('resume').then(apply, () => {});
    },
  };
}
