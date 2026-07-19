# Lessons — defect classes this project has actually shipped

Every entry here was a real defect that reached `main` or came within one review of it.
Read this before starting work in the area it names. Add to it when a defect is
confirmed — see "Feeding this file" at the bottom.

The ordering principle: **encode a lesson at the lowest level that can enforce it.**

| level | durability |
|---|---|
| an executable gate (test/CI) | cannot recur |
| a type or API shape | hard to get wrong |
| an agent definition (`.claude/agents/*.md`) | recalled every run |
| this file / `docs/agent-log.md` | recalled if read |
| prose in a one-off prompt | forgotten under load |

A lesson worth writing down is usually worth a test. Ask "can this be a gate?" before
"can this be a paragraph?" — the paragraph is the fallback, not the goal.

---

## Verification

**An agent that cannot verify must report work as UNVERIFIED, never as done.**
2026-07-19: five of six content agents lacked a Bash tool, could not run `tsc`, and
correctly said so — but if the parent session had not run the gates, six files of edits
would have merged unchecked. Two consequences, both now in force: content agents that
edit code get Bash, and "I could not run the check" is a required sentence, not an
optional courtesy. Never write "done" for something you did not execute.

**Measure against pixels, not selectors.** 2026-07-19, twice in one session: a
Playwright assertion used `button:not([disabled])` on a pad that is *deliberately*
disabled during a reveal, and reported a blank screen that was not blank; then a DOM
measurement grabbed an inner element instead of the board container and reported a
2681px² overlap that did not exist. Both times the screenshot was right and the
measurement was wrong. **A measurement that disagrees with the pixels is guilty until
proven innocent** — screenshot first, then trust the number.

**A heuristic gate needs its own test.** The same session, the phantom-gesture regex
matched `weigh` inside "the case **weigh**t" and `tile` inside "how many **tile**s",
flagging correct copy twice. Tightening a regex to kill false positives can silently
gut it, so `e2e/` keeps an offline check asserting the known-bad strings still flag AND
the known-good strings stay clean. Loosen only with that check green.

---

## Teen game shell (12–14 / 15–16)

**Prose in a field the board does not render does not exist.** `QuestionBoard` switches
to structured mode when a task sets `context` or `instruction`, and in that mode the
prose `prompt` is never displayed; separately, `loadTask` only speaks `say` at tiers 1–2.
So at tier 3 a question is neither shown nor spoken and the badge is the entire question.
This shipped items that were literally unanswerable (a ratio showing `2 : 3` with the
poured amount only in `prompt`; a "make the batch" task whose batch size appeared
nowhere). **Gate:** `e2e/question-quality.spec.ts` reconstructs the rendered board.

**Changing the answer mechanic orphans the copy that described the old one.**
2026-07-19: adding the tap-a-number `AnswerPad` hid the instrument, and nine chapters
kept telling the child to "crank the gear" / "shade the grid" / "slide your worth".
`say` kept narrating vanished gestures to exactly the tiers that still get audio.
**Gate:** the same spec fails on gesture verbs in a padded question's action chip.

**Two items may never render the same board with different answers.** Sale price and
money-saved on `$80 · 25% off` became indistinguishable once the disambiguating string
stopped rendering, with both values on the pad. Whatever names the wanted quantity has
to live somewhere the child sees.

**A wrong answer must never leave an empty stage.** Pad chapters had no instrument to
glide, and the pad unmounted on reveal → blank centre for 2.3s (6.4s on a reteach).
**Gate:** covered by the same spec.

**The reteach must not voice the misconception it tests.** "3² means 3 multiplied 2
times" is precisely how a child arrives at 6 — the item's own first distractor — and it
plays after three wrong in a row, when they are most suggestible. Build reteach lines
from the generator's variables so they are true for every seed.

**Visible math and spoken math are different artifacts.** A proper minus (U+2212) reads
correctly and speaks as nothing; superscripts speak as "three two"; `x/2` speaks as
"x slash 2". This repo separates them: `disp()` for display, `signed()`/words for speech.

**Stale animation timers bleed across questions.** A wrong-answer glide schedules
`setValue` frames; if the next question loads before they fire, a stale value lands on
the fresh instrument. `loadTask` clears `timers.current` first — keep it that way.

---

## Layout / responsive

**`animation-fill-mode: both` silently overrides an inline `transform`.** The single
most-rediscovered bug in this codebase. An entrance keyframe ending on
`transform: translateY(0) scale(1)` clobbers a sibling `translateX(-50%)` (centring
lost) or an inline `opacity` (fade never runs). **Fix:** centring/state transform on an
OUTER wrapper, the keyframe on an INNER child.

**Sizing without a `vh` term collides on short frames.** Instruments sized on
`vw`/`vmin` stay large when the viewport is short and grow up under the question board:
measured −51px overlap at 640×320. The repo's answer is `FitBox` (measure natural size,
`transform: scale()` to fit) applied once at the slot, not per component. The
`short = vh < 470` gate plus a reserved bottom strip is the companion pattern.

**Landscape phones are the failure case, not portrait.** 320×568 and 360×740 passed
every check while 640×320, 667×375, 740×360 and 1024×400 broke. Any responsive claim
must name the short-landscape sizes it was measured at.

**Verify in the browser, and on Safari.** Headless Chromium is a real engine but it is
one engine; this codebase has shipped Safari-only defects (CSS `min()` in SVG geometry
*attributes*; `upgrade-insecure-requests` breaking plain-HTTP localhost). Headless
results are evidence, not proof.

---

## Data / security

**A policy that checks the caller but not the resource is not tenant isolation.**
V1 (CRITICAL, 2026-07-03): `learner_invites` INSERT verified `invited_by = auth.uid()`
but never that the caller owned the `learner_id`, so a forged self-invite read another
family's child. V12 (2026-07-19), same class: an UPDATE policy pinned only
`invited_email`, so a recipient could rewrite `learner_id`. RLS `WITH CHECK` cannot see
OLD values — use column-level `GRANT` when only some columns may change.
**Gate:** `supabase/tests/rls_regression.sql`.

**Never trust a client-supplied score.** `sync_session` once accepted client `xp`/`coins`;
they are now derived server-side from `core/scoring.ts`.

**Subagents cannot reliably reach MCP tools.** Supabase work (migrations, SQL, advisors)
must run from the MAIN session; a subagent that tries will correctly report a blocker
and get nothing done.

---

## Feeding this file

When a defect is confirmed:
1. **Try to make it a gate first.** A test that fails on recurrence beats any prose.
2. Append one line to `docs/agent-log.md` prefixed `LESSON:` naming the responsible
   role and the defect class.
3. If it is a reasoning habit rather than a rule, fold it into that role's
   `.claude/agents/*.md` as a principle **with the concrete case attached** — a rule
   with its scar tissue survives; a bullet point does not.
4. Add it here with the gate that now catches it, or "no gate" if none is possible.
