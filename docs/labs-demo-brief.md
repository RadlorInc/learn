# Milo Labs — Demo Build Brief (for Opus 4.8 implementation)

_Authored by the Fable planning pass, 2026-07-04. Strategy context: [`labs-vision.md`](labs-vision.md) (read §1–§5 first — 2 minutes)._

**You (Opus) are building the 90-second investor/pilot demo:** two or more devices around a table all see **the same 3D object anchored to a printed marker**, live-synced; a **teacher device conducts** (rotate, slice, labels, explode, quiz). Web-only, no app install — students open a URL in Safari/Chrome and point the camera at the mat.

---

## 0. Hard constraints (do not violate)

1. **No Unity, no native app.** Pure web: this is the founder's explicit call — it cuts build time and makes the demo "nothing to install," which is itself the pitch.
2. **Do NOT touch the production app.** Everything lives in a new **`labs-demo/`** directory at the repo root — a standalone Vite app with its own `package.json`. No imports from `src/`, no changes to the Next.js app, no shared config. (It shares the repo for convenience only.)
3. **No commit/push unless the founder asks** (standing project rule).
4. **iPad Safari is the primary target.** iPad Safari does NOT support WebXR AR — that is WHY the stack below is marker-based (getUserMedia + WebGL), not WebXR. Do not "upgrade" to WebXR.
5. **Camera code cannot be verified headlessly.** You MUST build the **simulator mode (§5)** first and use it for all your own verification; real-camera testing is a human step at the end (§9).
6. **The REAL DELIVERABLE is the SHARED, SYNCHRONIZED in-room camera AR (founder decision 2026-07-04, final):** every device in the room (iPad + iPhone + more) points its camera at the table and sees **the same heart in the same physical spot, live-synced** — teacher slices/labels/quizzes, all screens update together. That is the demo. Sim mode is ONLY your internal test harness, never a substitute for the camera experience. (The single-device markerless Quick Look viewer is a STRETCH extra — §7 — build it only after the shared demo is done; it must not consume main-run time.)

## 1. Stack (decided — with escape hatches)

| Concern | Decision | Why | Escape hatch (only if acceptance test fails) |
|---|---|---|---|
| App scaffold | **Vite + TypeScript** (vanilla or minimal React — your call) | Fast, simple, no SSR needed | — |
| 3D | **Three.js** | glTF loading, clipping planes (slice), mature | — |
| Marker tracking | **MindAR** (image target) — MIT, runs in iOS Safari | Best maintained web image-tracker; smooth; no WebXR needed | **AR.js / ARToolKit barcode marker** (more robust pose at distance, uglier mat). If both fail the stability test (§8), flag for a paid SDK (8th Wall / Variant Launch) — founder decision, do not integrate one yourself |
| Sync | **Supabase Realtime broadcast channels** (existing project `qaymxunzlarwusogwyak`, anon key, channel `labs:<code>`) | Zero new infra; works across any network; broadcast-only (no DB writes, no RLS surface) | Local `ws` Node server for offline demos (stretch, §7) |
| Deploy | **Separate Vercel project** rooted at `labs-demo/` | Camera requires HTTPS; Vercel gives it for free | `vite --host` + mkcert for LAN dev |

**On-device dev loop:** camera needs HTTPS. Fastest loop = push to a Vercel preview URL and open it on the iPad. Do not fight local certs unless you need to.

## 2. What the demo does (product spec)

Two routes:

### `/` — Student view (camera AR)
1. Join screen: enter 4-letter session code (or `?s=CODE` link/QR) → subscribes to the channel.
2. Camera opens (user-gesture-gated, `playsinline`), tracks the printed mat.
3. The current model renders anchored to the mat, in the **shared state** (same rotation/slice/labels for everyone — teacher-authoritative).
4. During a quiz: 3 tappable hotspots appear on the model on the STUDENT's device; tap → answer sent to teacher. One tap, instant "✓ sent" feedback, no right/wrong reveal (math-without-fear DNA).
5. Marker lost: freeze the object briefly (≤2s), then fade it + show a gentle "point at the mat" hint. Reacquire silently.

### `/teach` — Conductor view (NO camera)
A big-buttons control panel + a live 3D preview of the model (plain Three.js orbit view, no AR):
- **Model switcher:** Heart (primary). A second SCIENCE model (cell) is a stretch switch target — see §4. **No math scene in this demo.**
- **Rotate:** drag on the preview → broadcasts orientation (throttled).
- **Slice:** a slider driving a clipping plane (0 = off).
- **Labels:** toggle on/off.
- **Explode:** slider 0→1 (only if the model has parts; hide otherwise).
- **Quiz:** one button — "Where is the left ventricle?" (heart) / "Find the nucleus" (cell). Shows a live answer tally (n correct / n answered / n connected) and a Reset.
- **Presence:** "3 students connected."
- Session code displayed huge + as a QR of the student URL.

### Shared state protocol (keep it this simple)
One JSON doc, teacher-authoritative, broadcast on change (throttle ≥66ms) + re-broadcast full state on any `request_state` (new joiner):
```ts
interface LabState {
  model: 'heart' | 'cell'                  // science only — no math scene in this demo
  quat: [number, number, number, number]   // model orientation
  scale: number
  slice: { on: boolean; t: number }        // t 0..1 → clip plane height
  labels: boolean
  explode: number                          // 0..1
  quiz: null | { id: string; prompt: string }
  rev: number                              // monotonically increasing revision
}
```
Students send only: `{ type: 'answer', quizId, choice, deviceId }` and presence. Apply remote state with ~120ms slerp/lerp interpolation so motion looks smooth, and drop any message with `rev` older than the last applied.

## 3. Colocation model (why this works with no cloud anchors)

Every device tracks the **same physical mat** → each gets its own camera-to-mat transform → rendering the model at the mat origin means everyone sees it in the same physical spot from their own angle. Colocation is a *geometric freebie* of marker tracking. There is no anchor sharing, no SLAM, no calibration step. This is the demo's engineering moat — keep it.

**The mat (full spec — it IS the tracking target, design to this standard):**
- **Tracking image (~18–20cm square):** a dense, colorful, NON-repeating kid-friendly "Milo Labs" illustration (Milo fox + scattered science doodles — beakers, planets, leaves, gears, stars — varied sizes/colors, filling edge-to-edge). Rules: high feature density everywhere (no flat/empty regions); non-repetitive + asymmetric (rotated 180° it must look clearly different); high contrast (no pastel-on-pastel). NEVER a clean logo on white, no tiled patterns, no large solid areas.
- **Outside the tracked zone:** thin border; "Milo Labs — point your camera here"; a QR code to the student URL (devices join by scanning the mat); footer "Print at 100% scale on MATTE paper · US Letter".
- **Print instructions in the PDF margins:** matte paper only (gloss + classroom lights blinds tracking — the #1 real-world failure); 100% scale, never fit-to-page (physical size must match calibration); keep the sheet flat.
- **Deliverables (must match exactly — the `.mind` is a fingerprint of that exact image):** source PNG + compiled `.mind` (MindAR CLI/compiler) + print-ready US-Letter PDF, all in `labs-demo/public/mat/`. Bigger mat = stabler pose at 40–80cm.
- **Print-free fallback (REQUIRED):** add a `/mat` route that renders the mat image true-to-size full-screen (with a wake-lock + max-brightness hint), so a spare tablet/laptop lying FLAT on the table can BE the mat — no printer needed. Document in DEMO-RUNBOOK.md: brightness up, auto-lock off, avoid overhead-light reflections. (Roadmap note for the runbook, do not build: teacher photographs ANY textured object → in-browser target compilation → "any book becomes the anchor"; and paid WebAR SDKs for true markerless shared AR.)

**Pose smoothing (required):** raw marker pose jitters. Apply a One-Euro filter (or slerp/lerp low-pass) to the pose before rendering, and a short freeze-on-loss (§2). Tune until the object does not visibly swim at rest (§8).

## 4. The scene (science-only — the HEART is the hero)

**Founder decision (2026-07-04): this is the SCIENCE demo. The hero and only REQUIRED scene is the human HEART. There is NO math scene.** Go straight to the heart AR — slice / label / quiz the heart is the entire wow.

### 4a. M0 sync scaffold (throwaway — NOT a product scene)
For M0 only, render a plain placeholder primitive (a single cube) purely to prove the sync + verb plumbing round-trips between tabs. It is internal scaffolding — replace it with the heart as soon as M1 starts. **Do not build a math scene.**

### 4b. Heart — the hero scene (the real deliverable; prioritize this)
- **Asset:** find a CC-licensed glTF/GLB human heart. Try, in order: Z-Anatomy (open source, GitHub — heart meshes exportable via their Blender project; CC BY-SA), NIH 3D Print Exchange, Sketchfab filtered to CC-BY + downloadable glTF. Budget ≤ 15 MB; Draco-compress if needed. Normalize scale/origin on import (§10.7). **Record license + attribution in `labs-demo/CREDITS.md`.**
- **Asset-risk fallback (still SCIENCE, never math):** if no acceptable heart GLB is found, build a simplified heart procedurally (lobed mesh from merged/metaball ellipsoids) OR substitute another clean CC organ (brain, lungs). Keep it a science organ. The verbs are asset-agnostic, so the demo can never be blocked. Flag any substitution for the founder.
- **Slice** = Three.js `clippingPlanes` + a slightly emissive cap color — works on ANY mesh, no segmentation needed. This is the PRIMARY wow verb; guaranteed regardless of asset quality.
- **Labels** = 3–5 billboarded hotspots (sprite + line) at hand-placed local coordinates (left ventricle, right atrium, aorta, chambers). Hotspots double as the quiz tap-targets.
- **Explode** = only if the model has separable named sub-meshes (chambers/vessels): translate parts outward from the centroid by `explode`. If it's one fused mesh, hide the explode control — do NOT attempt mesh segmentation; slice + labels + quiz is plenty.

### 4c. (moved) Markerless single-device viewer → STRETCH only, see §7
The shared, synchronized marker experience (§3 + §4b) IS the demo. A markerless AR Quick Look viewer (USDZ) is a nice single-device extra but does not sync or conduct — build it only as stretch (§7), never at the expense of the shared demo.

## 5. Simulator mode — build this FIRST, it is how YOU verify

`?sim=1` on the student route replaces camera+tracking with a **fake mat pose**: the scene renders as if the mat were centered ~50cm in front of a virtual camera, with an on-screen drag = orbit (simulating a student walking around the table). Everything else (state sync, slice, labels, explode, quiz taps, join flow) is byte-identical to the real path.

- Architecturally: isolate tracking behind a `PoseSource` interface — `MarkerPoseSource` (MindAR) vs `SimPoseSource`. The render/sync layers must not know which is active.
- **Your verification loop:** open `/teach` in one browser tab + two `/?sim=1` tabs (the preview tools drive all three), assert: state propagates <500ms, slice/labels/explode/quiz all round-trip, late joiner gets full state, teacher refresh recovers.
- Sim mode also becomes the desktop fallback in real demos (a laptop can "join" a session without a camera).

## 6. Milestones (each independently verifiable)

- **M0 — Scaffold + sync skeleton.** Vite app in `labs-demo/`; `/teach` + `/` routes; Supabase Realtime channel join by code; LabState round-trips between three browser tabs (sim stub can be a plain cube). ✅ verify headless via preview tabs.
- **M1 — Sim mode + heart scene logic (PRIORITY).** Full `PoseSource` split; the heart scene (or §4b fallback) with all verbs — rotate/slice/labels/quiz (+ explode if parts); quiz loop incl. tally. Use the M0 placeholder only until the heart asset lands, then swap it in. ✅ verify headless in sim (full product logic, minus camera).
- **M2 — Real tracking.** MindAR integration; mat designed + compiled + PDF; pose smoothing; lost-marker UX. ⚠️ needs the human device test (§9) — everything up to the tracking callback is still unit-testable.
- **M3 — Heart polish.** Real asset sourced + credited + normalized; labels hand-placed on the actual anatomy; slice cap color; lighting/material tuned so it clearly reads as a heart. ✅ verify in sim mode.
- **M4 — Polish + demo kit.** Join QR; presence; connection-drop resilience; Vercel deploy; `labs-demo/DEMO-RUNBOOK.md` (what to print, hotspot/Wi-Fi setup, the 90-second choreography, failure recovery: refresh = rejoin with full state).

## 7. Stretch (only if M0–M4 are done and green)

- Local offline sync server (`labs-demo/server/` tiny `ws` relay + `?server=local`) for internet-dead classrooms.
- A SECOND SCIENCE scene (cell or molecule) to show the content pipeline generalizes — keep it science, not math.
- Markerless single-device AR Quick Look viewer: export the heart to USDZ (+ GLB for Android Scene Viewer), static page with `<a rel="ar">` → heart drops into the room with no mat on iPhone/iPad. View-only (Apple's viewer — no sync/conducting). Note in DEMO-RUNBOOK.md that markerless+shared+interactive on iOS Safari requires a paid WebAR SDK (8th Wall / Variant Launch) — founder decision for later, do NOT integrate one.
- Conductor "isolate part" verb (tap a label on `/teach` → others fade).

## 8. Acceptance criteria

**Headless (you, via sim):** 3-tab session syncs every verb <500ms; late-join full-state <1s; 20-minute soak with no desync (rev-guard holds); Lighthouse perf ≥ 80 on `/` (sim).
**On-device (human, §9):** mat acquired <2s at 40–80cm on an A12-or-newer iPad/iPhone; object visibly stable at rest (no swim/jitter that reads as "broken"); ≥24fps student view; two devices agree on the object's physical position (visually, from opposite sides); full 90-second script runs without touching a terminal.

## 9. The human test loop (you cannot do this part)

When M2 lands, ask the founder to: print the mat PDF; open the Vercel URL on two iPhones/iPads; run `/teach` on a laptop; walk the 90-second script in DEMO-RUNBOOK.md. Collect: acquire time, stability impression, fps feel, any drift between devices. Iterate smoothing/mat size from that feedback. Plan 2–3 rounds.

## 10. Known traps (learned the hard way elsewhere — respect these)

1. **iOS camera:** `getUserMedia` only after a user gesture, over HTTPS, `<video playsinline muted>`; Safari kills the stream on tab-switch — handle `visibilitychange` by re-acquiring.
2. **MindAR image targets need texture.** A sparse logo mat will not track. Dense illustration, matte paper (glare kills tracking under classroom lights — note matte printing in the runbook).
3. **Do not sync poses.** Only the model STATE is shared; each device's camera pose is local (that's the colocation freebie). Never network per-frame camera transforms.
4. **Clipping planes:** set `renderer.localClippingEnabled = true`; give the clipped material `side: THREE.DoubleSide` or the heart looks hollow-wrong.
5. **Supabase Realtime:** use `broadcast` (not presence-only, not postgres_changes); `self: false`; one channel per session code; throttle teacher broadcasts ≥66ms and coalesce.
6. **Vercel + Vite subdir:** separate Vercel project with root directory `labs-demo/` — do NOT entangle with the main app's project/config.
7. **Z-Anatomy/Sketchfab GLBs** often have wild scales/origins — normalize to ~25cm bounding box, recenter to origin, bake that in an import step (small Node script), not at runtime.

## 11. Definition of done

A Vercel URL + a printed mat + DEMO-RUNBOOK.md such that the founder can, alone, run the full round-table demo to a school principal in under 5 minutes of setup: laptop as conductor, two iPads/iPhones as students, the **heart floating on the mat — slice it, label it, quiz the room** — the science wow, done. (No math scene.)
