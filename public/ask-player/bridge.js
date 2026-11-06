// The app page drives these prototype players by postMessage (PLAN.md §7.8). The player runs in an
// <iframe sandbox="allow-scripts"> (opaque origin, connect-src 'none'), so it can only draw what it is sent.
// Messages: {type:'els', els, voice?} (voice: the page sends each step's line later as {type:'stepWav', i, wav}) · {type:'poster', script} (whiteboard: the finished board at once, silent) · {type:'seek', i} (whiteboard: jump to step i) · {type:'pause'} / {type:'resume'} (whiteboard) · {type:'reset'} · {type:'els', els} · {type:'els_add', els} · {type:'step', step, wav?} · {type:'done'}
//           · {type:'script', script, voice?} (a finished script: replay, or paper/match-cut after streaming; voice =
//             how many spoken lines will follow as WAVs from the app's voice) · {type:'wav', i, wav} (line i's WAV, or null when
//             the voice could not make it: that line gets the browser voice)
// · {type:'started', id} (the page's sound for play id has begun: word cues time from it)
// The player answers {type:'need', i} (step i waits for its line) · {type:'posterDone'} · {type:'size', h} (its content height) · {type:'at', i, n, done, paused} as each step starts (and when a
// click on a drawing jumps to its step), {type:'ended'} when a run finishes and {type:'error', message} if a run throws.
// Sound: an iPhone refuses audio started in this frame (no tap ever lands here), so the player asks the page to play
// each WAV — {type:'play', id, wav} → the page answers {type:'played', id} when it has ended — and {type:'hush'}
// stops it (13 Oct 2026).
(() => {
  const style = document.documentElement.dataset.style;
  document.documentElement.classList.add('embed');
  const tell = msg => parent.postMessage(msg, '*');       // the parent checks event.source, not the origin (ours is opaque)

  // A step may arrive with its line already spoken by the app (a WAV): play that. Without one (voice off
  // or failed), the player's own say() uses the browser's voice.
  let seq = 0;
  const playing = new Map();                                // id -> resolve, until the page says 'played'
  const starts = new Map();                                 // id -> start the voice clock, when the page says 'started'
  const hush = () => {
    window.speechSynthesis?.cancel(); V.done = true;
    if (playing.size) { tell({ type: 'hush' }); playing.forEach(f => f()); playing.clear(); starts.clear(); }
  };

  // Word cues (20 Oct 2026): "@nucleus draw n1" draws when the voice says "nucleus", the way a teacher draws on the
  // word. The voice gives no word times (Pocket TTS makes only a WAV), so a word's time is its place in the line,
  // weighted for the pauses at punctuation, times the line's length; the browser voice reports each word (voiceAt).
  // V: the line being spoken. t = seconds into it (held while paused), char = the browser voice's last word.
  const V = { on: false, done: false, t: 0, last: 0, dur: 0, text: '', char: -1 };
  self.voiceStart = (text, dur) => Object.assign(V, { on: true, done: false, t: 0, last: performance.now(), dur, text, char: -1 });
  self.voiceAt = i => { V.char = i; };
  const wavSecs = w => { try { const v = new DataView(w); return (w.byteLength - 44) / v.getUint32(28, true); } catch { return 0; } };
  const weight = (text, end) => { let n = 0; for (const ch of text.slice(0, end)) n += /[.!?]/.test(ch) ? 7 : /[,;:]/.test(ch) ? 4 : 1; return n; };
  const norm = w => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  // where the cue's word starts in the line, searching on from 'from' (cues follow the spoken order); -1 if absent
  function wordAt(text, cue, from) {
    const want = norm(cue);
    for (const m of text.matchAll(/\S+/g)) if (m.index >= from && norm(m[0]) === want) return m.index;
    return -1;
  }
  const untilWord = (i, my) => new Promise(go => {
    (function f() {
      const now = performance.now();
      if (V.on && !PAUSED) V.t += (now - V.last) / 1000;
      V.last = now;
      const reached = V.char >= 0 ? V.char >= i : V.on && V.t >= V.dur * weight(V.text, i) / Math.max(1, weight(V.text));
      if (my !== gen || V.done || reached) go(); else setTimeout(f, 30);
    })();
  });
  const playWav = (wav, text) => new Promise(done => {
    if (text != null) document.getElementById('caption').textContent = text;
    const id = ++seq;
    playing.set(id, done); starts.set(id, () => self.voiceStart(text ?? '', wavSecs(wav)));
    tell({ type: 'play', id, wav });                        // copied, not transferred: a replay plays it again
  });

  // Paper and match-cut (stopmotion-topics.html play(), styles-lib.js narratedPlayer) start on the script and get
  // their lines as the app makes them (each ~2 s): VOICE_WAVS[i] is undefined until line i arrives, then a WAV, or
  // null for the browser voice. waitLine(i) waits for it; sayLine(i, text) speaks it either way.
  self.VOICE_WAVS = null;
  let waiters = [];
  self.waitLine = i => self.VOICE_WAVS?.[i] !== undefined ? Promise.resolve(self.VOICE_WAVS[i])
    : new Promise(r => (waiters[i] ||= []).push(r));
  self.sayLine = (wav, text) => wav ? playWav(wav, null) : new Promise(done => {
    if (!window.speechSynthesis) return setTimeout(done, 1200 + text.length * 70);
    const u = new SpeechSynthesisUtterance(text); u.rate = 1.02; u.onend = u.onerror = () => done(); speechSynthesis.speak(u);
  });
  self.hushVoice = () => hush();

  // The prototype pages draw a demo answer on load; an embedded player starts blank and silent.
  const blank = () => {
    hush(); document.getAnimations().forEach(a => a.cancel());
    if (style === 'whiteboard') scene.replaceChildren();
    else { const c = document.getElementById('cv'); c.getContext('2d').clearRect(0, 0, c.width, c.height); if (typeof player !== 'undefined') player?.stop?.(); }
    document.getElementById('caption').textContent = '';
  };
  blank();

  // Whiteboard: steps play as they arrive. Paper and match-cut play the finished script.
  // Whiteboard: steps play as they arrive, and the page can seek to any step that has arrived ({type:'seek', i}):
  // the steps before it are drawn at once (FAST, index.html), then it plays on from there. The player tells the page
  // where it is: {type:'at', i, n, done} (i = n once it has ended).
  let A = null, done = false, gen = 0, at = 0, fastBy = 0, wavWait = {};
  // waiting: the step's line is still being made. Past the last step of a finished video there is no line to wait for
  // (21 Oct 2026: "Preparing the voice for step 6…" stayed up over "End" on a 5-step video).
  const where = () => tell({ type: 'at', i: at, n: A.steps.length, done, paused: PAUSED,
    waiting: !!A.voice && !(done && at >= A.steps.length) && A.steps[at]?.wav === undefined });
  async function streamPlay(my, i = 0) {
    try {
      while (my === gen) {
        if (i < A.steps.length) {
          const s = A.steps[i]; at = i++;
          // The page makes the voice behind the board (every step is here at once, so any step can be jumped to) and
          // makes this step's line next ('need'). The first step waits for its line, so a video starts in sync; any
          // other step waits at most 1.2 s, then draws anyway and its line joins as soon as it is made (founder,
          // 18 Oct 2026: a jump ahead must not sit still while the voice catches up).
          let line = null;
          if (A.voice && s.wav === undefined) {
            const idx = at;
            line = new Promise(r => (wavWait[idx] ||= []).push(r));
            where(); tell({ type: 'need', i: idx });
            document.getElementById('caption').textContent = s.say;
            await (idx === 0 ? line : Promise.race([line, new Promise(r => setTimeout(r, 1200))]));
            while (PAUSED && my === gen) await new Promise(r => setTimeout(r, 120));   // paused while it waited
            if (my !== gen) return;
          }
          where();
          // Spotlight: a step that draws a flow (an arrow, line or travel) over a realistic drawing dims the drawing;
          // flows from earlier steps fade back so only this step's movement stands out.
          // (a flow this step still uses, e.g. "pop leak", stays bright and keeps the spotlight)
          const ids = s.do.map(c => bare(c).split(/\s+/)).filter(([op]) => !['wait', 'cam'].includes(op)).flatMap(([, a = '']) => a.split(','));
          scene.querySelectorAll('.flow').forEach(e => e.classList.toggle('old', !ids.some(id => els[id] === e)));
          scene.classList.toggle('spot', ids.some(id => isFlow(els[id])));
          Object.assign(V, { on: false, done: false, char: -1 });
          const voice = (s.wav ? playWav(s.wav, s.say)
            : s.wav === undefined && line ? line.then(() => { if (my !== gen) return; where(); return s.wav ? playWav(s.wav, s.say) : say(s.say); })
            : say(s.say)).finally(() => { V.done = true; });      // a line over (or failed): any cue still waiting goes
          await Promise.all([voice,
            (async () => {
              let from = 0;
              for (const c of s.do) {
                if (my !== gen) return;
                const cue = /^&?\s*@(\S+)/.exec(c)?.[1], i = cue ? wordAt(s.say, cue, from) : -1;
                if (i >= 0) { from = i; await untilWord(i, my); if (my !== gen) return; }
                await run(c);
              }
              await penUp();
            })()]);
          if (my !== gen) return;
          await wait(250);
        } else if (done) break;
        else await new Promise(r => setTimeout(r, 80));
      }
      if (my === gen) { at = A.steps.length; where(); scene.classList.remove('spot'); still(); tell({ type: 'ended' }); }
    } catch (e) { tell({ type: 'error', message: String(e.message || e) }); }
  }
  // The end: nothing moves on (14 Oct 2026). Looping motion (a beat, a flow, rain) holds where it is; a travelling
  // dot stops (runId ends its trip) and goes.
  const still = () => {
    runId++;
    document.getAnimations().forEach(a => { if (a.effect?.getTiming().iterations === Infinity) a.pause(); });
    scene.querySelectorAll('.trip').forEach(d => d.remove());
  };
  // Pause holds everything where it is: timed drawing and waits (PAUSED in index.html), running animations, and the
  // line being spoken (the page's audio, or the browser voice). Resume carries on from the same moment.
  let held = [];
  function pause() {
    if (!A || PAUSED || at >= A.steps.length) return;
    PAUSED = true; held = document.getAnimations().filter(a => a.playState === 'running'); held.forEach(a => a.pause());
    window.speechSynthesis?.pause(); tell({ type: 'pauseSound' }); where();
  }
  function resume() {
    if (!PAUSED) return;
    PAUSED = false; held.forEach(a => a.play()); held = [];
    window.speechSynthesis?.resume(); tell({ type: 'resumeSound' }); where();
  }
  // A click on a drawing (a box, a label, a shape) plays the video again from the step that first drew it.
  const stepOf = id => A?.steps.findIndex(s => s.do.some(c => bare(c).split(/\s+/).slice(1).some(w => w.split(',').includes(id))));
  const idAt = node => { for (; node && node !== scene; node = node.parentNode) for (const id in els) if (els[id] === node) return id; return null; };
  if (style === 'whiteboard') scene.addEventListener('click', e => { const id = idAt(e.target), k = id == null ? -1 : stepOf(id); if (k >= 0) seek(k); });
  if (style === 'whiteboard') scene.addEventListener('pointerover', e => { const id = idAt(e.target); scene.style.cursor = id != null && stepOf(id) >= 0 ? 'pointer' : ''; });

  async function seek(k) {
    if (!A) return;
    if (PAUSED) { PAUSED = false; held = []; window.speechSynthesis?.resume(); }
    k = Math.max(0, Math.min(k, A.steps.length - 1));
    const my = ++gen; runId++; hush(); document.getAnimations().forEach(a => a.cancel()); build(A);
    FAST = true; fastBy = my;
    try { for (const s of A.steps.slice(0, k)) for (const c of s.do) { if (my !== gen) return; await run(c); } }
    catch (e) { tell({ type: 'error', message: String(e.message || e) }); }
    finally { if (fastBy === my) FAST = false; }        // unless a newer seek took over
    if (my !== gen) return;
    marker.style.opacity = 0;
    document.getElementById('caption').textContent = '';
    streamPlay(my, k);
  }
  const restart = () => seek(0);

  const COLOUR = /^#[0-9a-f]{3,8}$/i;
  const okDrawing = d => !!d && Number.isFinite(d.w) && d.w > 0 && d.w < 20000 && d.h === 1000 && Array.isArray(d.shapes) && d.shapes.length <= 2000
    && d.shapes.every(s => Array.isArray(s) && typeof s[0] === 'string' && s[0].length < 20000 && /^[MLCSQTAZ0-9 .-]*$/.test(s[0])
      && (s[1] === 'none' || COLOUR.test(s[1])) && (s[3] === null || COLOUR.test(s[3])));
  // Realistic drawings ("sv id=...") load on demand before the board is built (SV, lib/wb/anatomy.js).
  const needSv = els => self.SV ? SV.need(Object.values(els || {}).map(v => /^\s*sv\b.*\bid=([a-z0-9-]+)/.exec(String(v))?.[1]).filter(Boolean)) : Promise.resolve();
  async function playScript(script, voice) {
    gen++; hush();
    self.VOICE_WAVS = Number.isInteger(voice) && voice > 0 ? new Array(voice).fill(undefined) : null; waiters = [];
    try {
      if (style === 'whiteboard') { const my = ++gen; A = { ...script, steps: [...script.steps] }; done = true; await needSv(A.els); if (my === gen) restart(); return; }
      if (style === 'paper') { TOPICS.embed = fromRecipe(script); current = 'embed'; play('embed'); }
      else { ANS.length = 0; ANS.push(script); show(0); }
    } catch (e) { tell({ type: 'error', message: String(e.message || e) }); }
  }

  addEventListener('message', ev => {
    if (ev.source !== parent || !ev.data || typeof ev.data !== 'object') return;
    const m = ev.data;
    if (m.type === 'hello') { tell({ type: 'ready' }); return; }   // the page may have missed our first 'ready'
    if (m.type === 'started') { starts.get(m.id)?.(); starts.delete(m.id); return; }
    if (m.type === 'played') { const f = playing.get(m.id); playing.delete(m.id); starts.delete(m.id); f?.(); return; }
    // Approved model-made drawings ride with the message (library_drawings; the frame cannot fetch them): checked,
    // then registered like a realistic drawing, before needSv looks for them (src/lib/generation/drawings.mjs validDrawing).
    const carried = m.drawings || m.script?.drawings;
    if (carried && typeof carried === 'object' && self.SV) for (const [id, d] of Object.entries(carried))
      if (/^[a-z0-9-]{1,60}$/.test(id) && !SV.data[id] && okDrawing(d)) SV.add(id, d);
    if (m.type === 'reset') { gen++; A = null; done = false; PAUSED = false; held = []; hush(); }
    else if (m.type === 'script') playScript(m.script, m.voice);
    else if (m.type === 'wav' && self.VOICE_WAVS && Number.isInteger(m.i) && m.i >= 0 && m.i < self.VOICE_WAVS.length) {
      const w = self.VOICE_WAVS[m.i] = m.wav instanceof ArrayBuffer ? m.wav : null;
      (waiters[m.i] || []).forEach(f => f(w)); waiters[m.i] = [];
    }
    else if (style !== 'whiteboard') return;
    // A still of the finished board for an Explore card (18 Oct 2026): every step drawn at once, silent, nothing moving.
    else if (m.type === 'poster' && m.script && typeof m.script === 'object') {
      const my = ++gen, a = A = { ...m.script, steps: [...(m.script.steps || [])] }; done = true; hush();
      needSv(a.els).then(async () => {
        if (my !== gen) return;
        build(a); FAST = true; fastBy = my;
        try { for (const s of a.steps) for (const c of s.do) { if (my !== gen) return; await run(c); } }
        catch (e) { tell({ type: 'error', message: String(e.message || e) }); }
        finally { if (fastBy === my) FAST = false; }
        if (my !== gen) return;
        marker.style.opacity = 0; still(); scene.classList.remove('spot');
        document.getElementById('caption').textContent = '';
        tell({ type: 'posterDone' });
      });
    }
    else if (m.type === 'els') { const my = gen, a = A = { els: { ...m.els }, steps: [], voice: m.voice === true }; done = false; wavWait = {}; needSv(a.els).then(() => { if (my === gen && A === a) restart(); }); }
    else if (m.type === 'els_add' && A) { const a = A; Object.assign(a.els, m.els); needSv(m.els).then(() => { if (A === a) seek(at); }); }   // rare: redraw with the new drawings, same step
    else if (m.type === 'step' && A) A.steps.push(m.wav instanceof ArrayBuffer ? { ...m.step, wav: m.wav } : m.step);
    else if (m.type === 'stepWav' && A && Number.isInteger(m.i) && A.steps[m.i]) {
      A.steps[m.i].wav = m.wav instanceof ArrayBuffer ? m.wav : null;      // null: the voice failed, the browser speaks it
      (wavWait[m.i] || []).forEach(f => f()); delete wavWait[m.i];
    }
    else if (m.type === 'done') { done = true; if (A) where(); }
    else if (m.type === 'seek' && Number.isInteger(m.i)) seek(m.i);
    else if (m.type === 'pause') pause();
    else if (m.type === 'resume') resume();
  });
  // The page sizes the frame to what is drawn: a caption that wraps to two lines on a phone was cut off.
  new ResizeObserver(() => tell({ type: 'size', h: Math.ceil(document.body.getBoundingClientRect().height) })).observe(document.body);
  tell({ type: 'ready' });
})();
