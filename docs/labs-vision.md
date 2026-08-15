# Milo Labs — Vision & Strategy

_Status: strategy locked with founder 2026-07-04 (Fable planning pass). The demo is BUILT — see [`../labs-demo/DEMO-RUNBOOK.md`](../labs-demo/DEMO-RUNBOOK.md) to run it._

## 1. The vision

**Colocated, shared mixed reality for classrooms.** Students sit around a table. Through tablets (back camera) — later VR/MR headsets — every student sees **the same 3D object floating over the same spot on the table**, each from their own angle: a beating heart, a cell, a molecule, fraction blocks. The **teacher conducts**: explodes it into components, isolates a part, slices it, labels it, launches a quick quiz. Students interact from their own devices.

This is "the lab on the classroom table."

## 2. Locked founder decisions (2026-07-04)

1. **First market: US K-12.**
2. **Wedge: science-led sales** (the floating heart sells the vision), with the **math manipulative library** (Milo's existing 3–18 curriculum DNA) as the daily-use content that survives renewals.
3. **Business model: Lab-as-a-Service (LaaS)** — lease the kit per classroom/month; hardware included for schools that lack it; cheaper for schools that already have iPads.
4. **Parallel track** — Milo (the math app) continues shipping; Labs is a second track, not a pivot.
5. **Path: 90-second demo → one pilot school → raise on demo + pilot + LOIs.**

## 3. Architecture stance

- **Milo app (today)** = the curriculum brain: skill graph, adaptive engine, diagnostics, progress. It stays the moat.
- **Milo Labs** = a *separate spatial client* (web-first on tablets; headsets later) talking to the **same backend** (same accounts, same skill graph, same progress pipeline). Share the brain, not the body. Do not wedge 3D into the PWA.

## 4. Competitive landscape (researched 2026-07)

| Player | What they sell | Gap they leave |
|---|---|---|
| **zSpace** (Nasdaq: ZSPC, 3,700+ institutions) | Glasses-free 3D laptops/stations | One student per station; proprietary hardware; nothing shared-in-room |
| **ClassVR / Avantis** | Proprietary headset kits + content | Each kid isolated in a headset |
| **Prisms VR** (~$19.1M raised; WestEd RCT +11%; Broward: 3,600 headsets + 4 full-time VR coaches) | Math VR on Quest, kits-as-service | Headset-first; documented device-management pain; isolating |
| **Merge Cube** | $25 cube + tablet AR | Single-user, no shared sync, no teacher conductor, toy-depth content |
| **Labster / Inspirit** | Desktop/2D virtual labs | Not spatial, not in-room |

**The unowned position:** *colocated shared hologram, on hardware the school already owns, with the teacher as conductor.* Everyone else is either individual-station, individual-headset, or single-user AR.

Category validation: Prisms raised on **efficacy data** and leases kits — outcomes-selling works here. The documented failure modes (device management hell, teachers losing eye contact, motion sickness, VR-coach dependency) are precisely what the round-table tablet design avoids.

## 5. The five moats (how a non-unique idea becomes unique)

1. **Colocated-first, headset-optional.** "The science lab that floats on the classroom table — on the iPads your school already owns." Zero new hardware to start; headset carts are the premium tier later. A printed marker mat gives every device the same spatial origin — offline, no cloud anchors, works in any classroom.
2. **Teacher-as-conductor.** The teacher drives the lesson from a simple conductor view (no headset needed) while keeping eye contact with the class. Competitors make the teacher an IT admin; we make them more powerful than a whiteboard.
3. **Outcomes spine.** Every lab ships with a built-in pre/post concept check wired into the skill graph — Milo's root-gap/assessment DNA applied to labs. Districts buy measured mastery, not wow.
4. **LaaS with white-glove ops.** Monthly per-classroom lease: devices (if needed), router, marker mats, training, support. We own the ops pain — as a feature of the model.
5. **Two-subject kit.** Science showcases open doors; the math manipulative library makes it daily-use. Daily use survives renewal; field trips don't.

## 6. Phased roadmap

- **Phase 1 — Single-tablet AR station.** One student, one tablet, dissectable/labeled/quizzed object on the table. Builds the content + interaction stack without multi-user sync. → one-classroom pilot.
- **Phase 2 — The round table, on tablets.** Shared session via the printed marker (common origin) + local/realtime state sync; teacher conductor view. *This is the vision, achieved on school-owned iPads.*
- **Phase 3 — Headsets.** Quest-class passthrough MR (~$300/seat), same session protocol and content. Premium kit.
- **Phase 4 — Lab-in-a-box.** Cart + charging + preconfigured router + marker mats + MDM + training + curriculum packs mapped to standards. Schools buy **a lab**, not an app.

**Content pipeline principle:** a reusable interaction grammar — every model supports the same verbs (*explode, isolate, slice, label, quiz*) via metadata, so lab #12 is an asset task, not an engineering project. License models first (Z-Anatomy, BodyParts3D, CC-licensed Sketchfab), don't sculpt.

## 7. The demo → pilot → raise loop

1. **90-second demo** (built — how to run it: [`../labs-demo/DEMO-RUNBOOK.md`](../labs-demo/DEMO-RUNBOOK.md)): a dissectable heart + math blocks on a marker, 2+ devices in sync, teacher conducting — served from a URL, nothing installed.
2. **One pilot classroom**: free 6-week engagement, one science unit + one math unit; measure pre/post per lab (mirror the math app's week-6 gap-closed discipline).
3. **Raise** on: shipped production math platform + working colocated demo + pilot data + 2–3 LOIs. Seed story: *"We shipped adaptive K-12 math; now the lab floats on the classroom table."*

**Investor pushbacks to pre-empt:** school sales cycles (LaaS shortens the decision), content cost (interaction grammar caps it), "won't Apple/Meta do this?" (platforms ship primitives, not curriculum + assessment + classroom ops).

## 8. Open questions (not blocking the demo)

- Pilot school sourcing (founder network vs cold outreach; science teacher vs math teacher as champion).
- Kit pricing shape ($/classroom/month tiers with vs without hardware).
- Whether Labs is a separate legal product/brand or "Milo Labs" under the same entity.
- Headset timing (only after tablet pilots prove retention).
