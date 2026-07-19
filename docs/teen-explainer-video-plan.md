# Plan — Higgsfield explanation-animation videos for the 12–14 walkthrough

Replace the code/SVG **illustration** in each 12–14 game's walkthrough with a
generated **animation video** (Higgsfield), placed in the same illustration slot.
The explanation chalkboard (left) and baby-step chalkboard (top) stay exactly as
they are and keep carrying the lesson.

Status: **plan only — nothing generated, no credits spent.** Balance at planning:
779.7 credits (Plus). Awaiting founder sign-off on §8 before any generation.

---

## 1. What changes (and what does NOT)

The new 3-panel teaching layout has three regions:

- **Explanation chalkboard** (left / top on mobile) — the spoken summary. **UNCHANGED.**
- **Baby-step chalkboard** (top-right / above illustration on mobile) — the math
  lines written one at a time, synced to Milo's narration. **UNCHANGED.**
- **Illustration** (the third region) — today a code-drawn / SVG `TutorialScene`.
  **→ This is the only thing we swap for a looping animation video.**

So the video is a richer *illustration*, not a new lesson. Milo's voice + the two
chalkboards still teach; the video makes the theme come alive behind the math.

## 2. Non-negotiable rules (why this is safe)

1. **NO math inside the video.** No numbers, equations, or labels rendered by the
   model — it garbles digits and morphs text. Every exact value stays on the
   code-drawn chalkboards. If a specific number must sit on the scene, it is a
   code-drawn overlay on top of the video (same pattern the illustrated explainers
   already use: soft themed art + precise code skeleton). This preserves the
   founder's standing rule: *precise skeleton stays code-drawn.*
2. **Silent clips.** Generate with audio off. Milo narrates over them (TTS +
   read-along). Avoids double audio and English-mismatch.
3. **Synced to the steps, not free-running.** The clip's playhead is driven by the
   walkthrough's step index (§3) so the animation and Milo's explanation move
   together. Sync is at STEP granularity (robust), never frame-locked to TTS.
4. **Reduced-motion + autoplay-safe.** `muted`, `loop`, `playsInline`, `autoPlay`;
   a **poster still** paints instantly and is what shows under
   `prefers-reduced-motion`.
5. **Fallback preserved.** A chapter with no video keeps its current code
   `TutorialScene`. Rollout can be partial; nothing breaks.
6. **One visual language.** All clips share the existing bold-cartoon Nano-Banana
   style via reference images, so they feel like one set.

## 3. Sync model — video and explanation go HAND IN HAND (founder requirement)

The video must ADVANCE with Milo's explanation, not just loop in the background.
As he narrates each baby step, the animation shows the matching moment.

**Chosen model — "scrub by step" (one clip per chapter, playhead driven by the
walkthrough):**

- Generate ONE silent clip per chapter that animates the worked example from its
  **start state → end state** as a monotonic build (elevator descending to −3, tank
  filling, drone flying across-then-down, coins counting down into overdraft…).
- In code the clip does **not** autoplay. `VideoScene` receives the same props the
  code scene does — `{ value, stepIndex, frameCount, ended }` — and maps the step to
  a playhead position: `target = (stepIndex / (frameCount − 1)) × duration`, then
  **smoothly seeks** the video toward `target` (~0.6–0.9s glide) and holds.
- So Milo's narration is the transport: step forward → the video moves forward the
  matching slice; on the final step it lands on the end frame. TTS timing can drift
  all it likes — the video only moves when the step moves. Frame-level jitter doesn't
  matter; step-level correspondence is what "hand in hand" needs.
- Reduced-motion → show the poster (end frame) and skip scrubbing.

Why one clip (not per-step clips): 9–14 baby steps × 12 chapters of separate video
gen is cost-prohibitive and fragile. One monotonic clip, scrubbed, gives the synced
feel for ~1 clip/chapter. **Fallback if scrubbing looks rough on a theme:** cut that
chapter into 3–5 **phase clips** and swap the source on phase boundaries (a `phase`
tag per baby step) — higher fidelity, more clips. Decide per chapter at review.

Rejected: a single background loop (not synced — fails the requirement); a full
pre-narrated explainer (drops Milo's TTS + the read-along + correctness).

## 4. Production pipeline (per chapter)

1. **Start still** — Nano Banana (`nano_banana_2`) image, style refs = existing
   teen art, the themed scene at rest (e.g. an empty basketball court). ~1.5 cr.
2. *(optional)* **End still** — the scene at the end of the motion, to steer the
   image-to-video arc (e.g. ball in the hoop).
3. **Animate** — `generate_video` image-to-video, silent, chosen ratio, ~6–8s,
   motion that loops cleanly. Candidate models: **Kling 3.0 Turbo** (budget) or
   **Seedance** (reference-driven, best style consistency). **Confirm per-clip
   credit cost via `confirm_cost` before any batch.**
4. **Optimize** — transcode to a small `.mp4` (+ `.webm` if worth it), short,
   720p, low bitrate; export the poster frame.
5. **Save** — `public/assets/teen/anim/<chapterId>.mp4` + `<chapterId>.jpg` poster.
6. **Wire** — see §5.

## 5. Code changes (small, additive)

- **`GameConfig`** gains an optional field:
  ```ts
  tutorialVideo?: { src: string; poster: string; ratio?: '1:1' | '4:3' | '3:4' }
  ```
- **`GameShell`** — in the teaching frame's illustration slot, if
  `config.tutorialVideo` is present render a new `<VideoScene>`; else the current
  `config.TutorialScene`. Used for both the intro pose (holds frame 0) and the
  walkthrough (scrubs with the steps).
- **`VideoScene`** — receives the scene props `{ value, stepIndex, frameCount, ended }`
  and drives playback (§3): `<video muted playsInline preload="auto" poster>` that
  is **not** autoplaying/looping; an effect seeks `video.currentTime` toward
  `(stepIndex/(frameCount−1)) × duration` on each step, gliding over ~0.7s. On
  `prefers-reduced-motion` it renders the poster `<img>` (end frame) only.
  `max-width/height:100%` so it obeys the frame's no-scroll fit rules (`.teach-illo`).
- Teen game files are already `next/dynamic`, so the video assets never touch the
  3–11 bundle.
- Aspect ratio: recommend **4:3 or 1:1** to match the current ~340×300 slot and
  stack cleanly on mobile.

## 6. Per-chapter creative briefs (12 × 12–14) — themed motion, no text in frame

| chapterId | theme | looping motion |
|---|---|---|
| integers | Bank Account 🏦 | coins stack up, then a withdrawal; balance needle dips below a line |
| signedRationalOps | Sky Tower 🏢 | glass elevator glides up and down past a ground line |
| rationalOps | Cutting Bench 🪚 | a saw slices a plank into equal pieces |
| ratioProportion | Paint Studio 🎨 | two paint streams pour into a tray and swirl to a new colour |
| exponentsRoots | Tile Factory 🧱 | unit tiles fill out a growing square |
| orderOfOperations | Event Budget 🧾 | a receipt prints; items light up one group at a time |
| algebraicExpressions | Taxi Meter 🚕 | a taxi drives; the meter face ticks (no digits) |
| equationsInequalities | Baggage Scale 🧳 | a balance scale tips, then settles level |
| coordinatePlane | Delivery Drone 📍 | a drone flies across, then down, to a map pin |
| linearRelationships | Water Tank 💧 | a tank fills in steady equal steps |
| geometryMeasurement | Room Reno 🏠 | floor tiles lay down row by row |
| percentages | Store Checkout 🛒 | a discount sticker slaps onto a price tag; sale glow |

Each mirrors the chapter's existing theme, so the video reinforces the concept.

## 7. Cost & budget

- **Stills:** 12 × ~1.5 cr ≈ **18 cr** (cheap, known).
- **Videos:** the expensive, **unknown** part until measured. **Confirm the real
  per-clip cost on the chosen model before committing to a batch.**
- **Approach:** **pilot ONE chapter** end-to-end (still → video → wire → verify) to
  (a) prove quality and (b) measure the true credit cost, then extrapolate ×12 and
  get a go/no-go. 779 cr is comfortable for a pilot; the full rollout decision waits
  on the measured number. Fallback (§2.5) makes a partial rollout safe.

## 8. Founder decisions — LOCKED (2026-07-09)

1. **Video = themed motion only.** No math baked in; all numbers stay on the
   chalkboards. ✅
2. **Silent loop under Milo's voice.** Video is silent; Milo's TTS + the read-along
   still narrate. ✅
3. **Scope = 12–14 only** (the 12 chapters in §6). 15–16 / 17–18 not in scope. ✅
4. **Start with a one-chapter pilot**, measure real cost + quality, then decide the
   rollout. ✅
5. Aspect ratio: still to confirm at pilot — default to **4:3** for the slot.

## 8a. Pilot result (2026-07-09) — REVERTED

Piloted on **signedRationalOps / Sky Tower**: generated a start still (Nano Banana,
elevator shaft) → Kling 3.0 Turbo image-to-video (9 cr, silent, 6s, downward glide)
→ wired `tutorialVideo` + a `VideoScene` that scrubs the playhead by step. Founder
verdict: **the earlier code-drawn illustration (`SkyTowerScene`) looked better** — the
generated clip didn't beat it. Reverted Sky Tower to its illustration; deleted the
pilot asset. Total spend ≈ **10.5 cr** (still + clip).

Kept dormant (guarded, unused, tsc-clean): the `GameConfig.tutorialVideo` field +
`VideoScene` (scrub-by-step) in `GameShell`. So the video path exists if we retry on
a different chapter/theme, but nothing uses it and every chapter shows its
illustration. Can be stripped entirely if we drop the idea.

**Takeaways for any retry:** (a) the generated clip must clearly beat the hand-drawn
scene to be worth it — pick themes where real motion/texture adds something the code
scene can't (fluid, crowds, texture), not clean geometric motion the SVG already
nails; (b) scrub-by-step must be driven by **seeking** `currentTime`, not `play()`
(muted autoplay is blocked in the preview and flaky on iOS) — and even seeking needs
a real device to confirm; (c) aspect: match the ~4:3 slot, don't ship 9:16.

## 9. Recommended sequence

1. Founder answers §8.
2. **Pilot** one chapter (recommend **Delivery Drone / coordinatePlane** — clean,
   loopable across-then-down motion — or **Bank Account / integers**).
3. Measure cost + eyeball quality → go/no-go on the full 12.
4. Land the `tutorialVideo` field + `VideoScene` in `GameShell` (fallback kept).
5. Batch-generate the remaining 11 with shared style refs.
6. Verify each (autoplay muted+loop on Chrome + iOS Safari, poster on reduced
   motion, fits the slot without scroll, no math in-video, boards + voice still
   drive the lesson). Bump `public/sw.js` version; commit.

## 10. Verification checklist (per chapter)

- [ ] Autoplays muted + loops seamlessly (Chrome + iOS Safari).
- [ ] Poster shows instantly and is the `prefers-reduced-motion` fallback.
- [ ] Fits the illustration slot; **the teaching view still does not scroll.**
- [ ] **No numbers/equations/text visible inside the video.**
- [ ] Milo's narration + baby-step board still carry the worked example.
- [ ] Style matches the rest of the set.
