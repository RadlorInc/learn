# Phase-0 Design Brief — Webcam AR activities across all age groups

**For:** the deep-planning pass (Fable). **Output:** design docs only — NO implementation.
**Reviewer:** founder + Opus (who implements the shared engine in Phase 1).

---

## 1. Objective & vision

**The vision:** kids understand math better through a great *visual, tangible* experience. Concepts should *click* by being seen and done, not just read. That is the goal.

**The hero mechanism:** **webcam hand-tracking AR** — embodied/kinesthetic learning where a physical gesture (show fingers, pinch, point, air-trace, move a hand) drives the on-screen math. Doing a thing cements it.

**But the goal is visual understanding, not AR-for-its-own-sake.** So: use AR wherever a gesture genuinely teaches (strongest for young kids); wherever a webcam gesture would be a gimmick (often older kids), design the **richest visual/interactive alternative instead** (a manipulable simulation, a live-updating visualization) so *every* age gets a stronger visual experience — just via the right modality. No age is left out of the vision; the modality is chosen to fit the concept.

The deliverable is a **plan**, not code: an honest per-age catalog of **visual/embodied learning experiences** (AR where it teaches, interactive visual sims where that teaches), a shared AR engine design, a skill→modality map, a privacy spec, and a reusable build contract — enough that Opus can build the engine and Fable can fan out the activities off it.

## 2. Audit FIRST — this is NOT greenfield

There is a working AR foundation. **Read it before designing; extend it, don't reinvent it.** Note what to keep, consolidate, or replace, with reasons.

- **Dependency:** `@mediapipe/tasks-vision ^0.10.35` (on-device hand landmarks; lazy-loaded).
- **Hooks (`src/infra/ar/`):** `handLandmarker.ts`, `useFingerCounter.ts`, `useHandGesture.ts`, `useHandPincher.ts`, `fingerCount.ts`, `quizQuestions.ts`, `dispose.ts`. **Three overlapping hooks** — the plan must design ONE consolidated AR engine they fold into.
- **10 existing AR mini-games** (`src/app/play/*`): `finger-counting`, `finger-addition`, `catch-color`, `catch-it`, `catch-number`, `match-number`, `number-order`, `pattern-builder`, `sort-bins`, `thumbs-quiz`. All young-age. Assess each: keep / rework / retire.
- **Consent + fallback already exist:** consent stored in kv key `milo-camera-consent`; `src/shared/ui/CameraError.tsx` fallback; `Permissions-Policy: camera=(self)` header already set.
- **Known debt to fix in this plan:** (a) the AR games are **standalone `/play/*` routes, NOT integrated** into the chapter/menu/progress/plan system that regular chapters use; (b) "AR chapters always score 3 stars" (no real assessment); (c) three un-consolidated hooks.

## 3. Non-negotiable constraints (design AROUND these)

1. **Privacy is the #1 constraint (COPPA — children + camera).**
   - **100% on-device.** Video frames NEVER leave the device; nothing recorded, nothing uploaded. Only abstract hand-landmark coordinates are used, and they stay local too.
   - **Explicit parental/grown-up consent** before the camera activates; camera **off by default**; a visible "camera on" indicator; easy off.
   - The plan must include a short **privacy spec** stating exactly what data exists, where, for how long (ideally: none persisted).
2. **Camera is never required.** The app is a mobile-first PWA; many kids have no webcam, a poor camera, or a low-end CPU (MediaPipe is heavy). **Every AR activity must have a non-AR fallback** (tap/drag) that teaches the same skill and yields the same rewards. AR is an *enhancement*, never a gate.
3. **Performance + accessibility.** Lazy-load the model (don't bloat the base bundle); target ~30fps with graceful degradation; forgiving/debounced detection thresholds (young kids' hands are imprecise); consider motion comfort and kids with motor differences.
4. **Reuse the real systems.** AR activities must feed the SAME progress/rewards/streak pipeline as regular chapters (`finishAndSync`, the store, `sync_session`) — not a parallel universe. Respect the clean-architecture layering (`docs/architecture.md`) and the security posture (`docs/security.md`).

## 4. The central design judgment — pick the RIGHT visual modality per concept, per age

**This is the most important part of the plan.** The goal (§1) is visual understanding for every age; the judgment is *which modality* delivers it best for each concept — **webcam AR** or a **rich interactive visual sim**. Do not force AR where a gesture is spectacle, and do not leave older kids with a plain drill — give them the best *visual* experience instead.

For each age band, choose per concept:
- **3–5:** AR is the hero (finger counting, show-N-fingers, pinch-to-place, air-trace a numeral/shape). Embodiment is exactly how this age learns number.
- **6–8:** mostly AR (equal groups by hand, add/subtract by adding/removing fingers, sort by grab).
- **9–11:** mixed (AR: build arrays/fractions by hand placement, "grab" a factor; sims: number line, area model).
- **12–14:** mostly sims, some AR (AR maybe: manipulate integer chips / rotate a geometry figure; sims: everything else).
- **15–18:** **default to interactive visual sims, not webcam AR** (steer a function graph, morph a parabola live, rotate a 3D solid, unit-circle explorer). A webcam gesture here usually *cheapens* an app teens find credible. Allow AR only where it clearly beats a sim — and say why. Note: the codebase already has an "Explore" sim pattern (`PtSlider`/`ExploreScaffold`, teen `CoordGrid`/`FigureDiagram`) to build on.

For every proposed activity, state: the **skill it targets**, the **modality** (AR gesture *or* sim) and **why that modality wins here**, the **fallback**, and a **confidence/feasibility** rating.

## 5. Required deliverables (the plan Fable produces)

1. **Foundation audit** — verdict on each existing hook + `/play` game (keep/rework/retire) with reasons; the consolidation plan for the three hooks.
2. **Shared AR engine design** — one lazy-loaded engine + a reusable **AR-activity scaffold** (mirror the existing `docs/teen-kit-build-contract.md` style): lifecycle (consent → camera init → per-frame gesture → activity logic → reward/fallback), the gesture-primitive API (count / pinch / point / trace / move), disposal, error states. This is what Opus builds in Phase 1.
3. **Per-age activity catalog** — the honest table from §4: age → activity → skill → gesture → why-AR → fallback → confidence. Include the "no AR" verdicts.
4. **Skill→gesture→activity map** — tie activities to the real skill graph (`src/core/skillGraph.ts`) and existing chapters they enhance.
5. **Privacy & consent spec** — the data-flow guarantee, consent UX, indicators, retention (none), and how it satisfies COPPA + the existing security posture.
6. **Integration decision** — resolve: do AR activities become **first-class chapters** (in menu/progress/plan/diagnostic) or stay a separate **"play" lane**? Recommend one, with migration notes for the 10 existing `/play` games. Include the assessment/star fix (replace "always 3 stars").
7. **Fan-out build plan** — how Phase 2 parallelizes (waves, per-activity contract, what each fan-out agent gets), so many activities can be built off the scaffold like the teen-chapter waves were.
8. **Risks & open questions** — perf on low-end devices, detection reliability per gesture, the human real-camera test requirement (headless can't verify a webcam), and anything needing a founder decision.

## 6. Non-goals (out of scope for this plan)

- No implementation / no code changes.
- No new backend, no cloud vision APIs, no video storage — on-device only.
- No AR-gating of any content (fallback always teaches the same skill).
- Don't force parity across ages — an uneven distribution (lots for 3–8, little/none for teens) is the *correct* expected outcome if that's where the pedagogy lands.

## 7. Definition of done (how we judge the plan)

The plan is done when the founder + Opus can, from it alone: (a) build the shared AR engine + scaffold without further design; (b) hand each catalog entry to a fan-out agent as a self-contained build ticket; (c) trust that privacy/fallback/assessment are specified, not hand-waved; and (d) see a clear, justified answer to "where AR teaches vs. where we deliberately skipped it."
