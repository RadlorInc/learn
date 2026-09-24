# Review 1 quick wins: what needs the founder (Round 2)

Written 24 September 2026, at the end of the loop. The loop's record, with every proof, is in `LOOP-STATE.md` → *Review 1
quick wins*. **Nothing here touches production.** The agent merged nothing, applied nothing and read nothing from
production. Every PR is a **Draft**.

## 1. The PRs, in the order to merge them

The seven Q-PRs were trial-merged onto `main` **in this order**, one after another, with no conflict. The full unit suite was
run on the merged result: **138 files, 3,793 passed, 11 skipped** (tsc clean). Each PR is independent; the order only keeps each diff small and conflict-free.

| # | PR | item | migration | notes |
|---|---|---|---|---|
| 1 | [#213](https://github.com/RadlorInc/learn/pull/213) | Q1 dots + Q2 gentle feedback | none | the cheer changes on screen; **the voice still says "Right!"** |
| 2 | [#214](https://github.com/RadlorInc/learn/pull/214) | Q3 module summary + Practice again | none | adds `&summary=1` and `&practice=1` routes |
| 3 | [#215](https://github.com/RadlorInc/learn/pull/215) | Q4 parent: mastered list | none | a new **read** of `point_events` (the parent's own rows) |
| 4 | [#219](https://github.com/RadlorInc/learn/pull/219) | Q5 text size | none | **changes doc 08 (published)**: see §3 |
| 5 | [#216](https://github.com/RadlorInc/learn/pull/216) | Q6 pad: colours, Arrow, Undo | none | |
| 6 | [#217](https://github.com/RadlorInc/learn/pull/217) | Q7 vertical number line (g7m2) | none | |
| 7 | [#218](https://github.com/RadlorInc/learn/pull/218) | Q8 home motion | none | |
| 8 | [#221](https://github.com/RadlorInc/learn/pull/221) | Privacy at 320 px + the sweep finishes + Save/Cancel clears the home bar | none | independent of the seven; any time |
| 9 | [#222](https://github.com/RadlorInc/learn/pull/222) | The offline bar no longer covers Sign out (iPad Pro); sweep `OFFLINE=1` | none | independent; any time |

For each: mark it *Ready for review* only when you mean to merge, then merge. `main` deploys through `deploy.yml` →
`release`. **No `migrate-prod` step for any of them.**
⚠️ **No PR bumps the service-worker version** (`public/sw.js` is `v233`), because seven bumps would conflict. Pages are
network-first since R1 (#185), so the new screens reach a returning device without one. If you want the usual bump,
it's one line after the last merge.

## 2. Migrations

**None.** `git diff origin/main -- supabase/` is empty on every branch. Nothing new is stored about a child: Q5 keeps a
device setting, and Q4 reads a table the Progress tab already reads.

## 3. Legal and doc lines to approve

**Doc 08, *Cookie and Tracking Notice* (published at `/legal/cookies`), changed by #219, English + Spanish draft:**

1. A new row: `al-text-size` · Local storage · *"The text size chosen on this device (Large or Extra large; nothing is
   kept for Normal) (read from the code, 24 Sep 2026)"* · Until you clear it · Functional.
2. The signed-out paragraph, after "local storage held `milo-kv-migrated`", adds: *"…and holds `al-text-size` only if a
   bigger text size was chosen on this device."* (The "Aa" button also shows to a visitor who is not signed in.)
3. ✅ **Approved by the founder (24 Sep 2026)**, rows 1 and 2 as written. *Effective* stays 25 September 2026; a
   **"Last updated"** line (EN + ES) carries **the day #219 merges**. ⏳ It goes in once the founder names that day.
   ATTORNEY-PACKET has a one-line note (on #219).

**Doc 02 (the notice) and doc 11 (Privacy):** no change. Nothing new about a child is collected, stored or shared, so
**no notice bump**.

**Spanish:** every new string has an unreviewed ES draft (`sessionCopy.ts` for the child screens, `i18n.tsx` for the
dashboard, `es/08` for doc 08). The child screens still have no language switch.

## 4. Live checks after each deploy (on radlic.com, with a signed-in **test** child)

| # | PR | do | expect |
|---|---|---|---|
| 1 | #213 | open any topic's practice | 5 hollow dots above the problem; a right answer turns the next one green before the next problem comes |
| 2 | #213 | answer 5 problems | the checkpoint shows all 5 filled; after **Keep going**, 5 hollow again. Never "X of N", never % |
| 3 | #213 | give a wrong answer | a **yellow** box: ↻ **Try again!** and the big idea under it. No red anywhere |
| 4 | #213 | a right answer, twice | green ✓ with a cheer; the second cheer differs from the first ("Right!", "Nice!", "You got it!", "Great thinking!") |
| 5 | #214 | finish the **last** topic of a module (or have a module fully done) | its end screen says **See what you learned ⭐** → "Module complete! ⭐", "N topics done · +P points", **You got really good at:** / **Let's keep practicing:**, Practice again on each |
| 6 | #214 | tap **Practice again** on a topic | straight to a practice problem: no teaching screen, no "Welcome back" |
| 7 | #214 | that module's topic map | the "N of M done" chip now reads **See what you learned ⭐** |
| 8 | #215 | parent → the child → **Progress**, with a topic mastered | the **Topics mastered** tile says "▾ Show the list"; tapped: topics grouped by module with "Mastered Sep 24"; one mastered before 17 Sep says "Mastered, date not recorded" |
| 9 | #219 | child home → **Aa** → Extra large | everything grows; nothing is cut off on a phone; still Extra large after closing and reopening the app |
| 10 | #219 | parent → Account → **Text size** → Large | the dashboard grows; the child's screens on that device too; Normal puts it back |
| 11 | #216 | practice → the pad: Blue, draw; Arrow + Orange, drag | a blue line; a straight orange arrow with a head; **Undo** removes the arrow; **Clear pad** then **Undo** brings the drawing back |
| 12 | #217 | a Grade 7 Module 2 topic's practice → **↕ Number line** | 10 at the top, −10 at the bottom; tap −3: a dot; tap again: gone. Not offered on any other topic |
| 13 | #218 | child home, watch 20 s | the three background circles drift slowly; with the device's *Reduce Motion* on, they are still |
| 14 | all | a real iPad with an Apple Pencil | the pad still draws with the Pencil (the Pencil fix is kept; the agent had no device) |

## 5. Found on the way, not built (for you to decide)

- **Grade 6 has no negative-numbers module (CCSS 6.NS.5–7)**; signed numbers first appear in Grade 7 Module 2.
  ✅ Logged in `READINESS.md` → *For the content loop* (founder, 24 Sep 2026).
- A wrong answer brings an **easier kind** of question after the **second** miss (the worked steps); after one miss
  the child retries the same problem with the big idea shown. ✅ **Kept as is, by design** (founder, 24 Sep 2026).
- `/ui-preview` still shows a fox avatar on the demo child, which the rename (#205) retired elsewhere.
- The number line's numbers are 26 px tall targets (WCAG 2.2 AA asks 24; the app usually uses 44).
- **Fixed in #221** (founder, 24 Sep 2026): `/legal/privacy` scrolled sideways at 320 px, and the sweep still tapped
  #212's removed Change button. Once the sweep could look it also found **the Lessons tab's Save / Cancel under the
  home bar** on six phones (fixed there too) and two faults in the sweep itself (fixed).
- **The offline bar covered Sign out** on the parent dashboard at iPad Pro landscape: fixed in
  [#222](https://github.com/RadlorInc/learn/pull/222) (founder, 24 Sep 2026). The bar now keeps its own height clear,
  and the sweep checks every screen offline too (`OFFLINE=1`).

## 6. Blocked

- **"Last updated" on doc 08:** waiting for the day #219 will merge (§3).
- **The service-worker bump:** opened as a one-line Draft **after the last Q-PR merges** (founder, 24 Sep 2026).
