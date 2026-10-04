# Paid testers

A tester is paid to go through one Grade 3–8 module or one KG–2 chapter and say, screen by screen, whether it is
right. The app makes sure they cannot skip: nothing moves on by itself, and each step waits until the screen has
played out (her lines finished, the question answered) and the tester has tapped **Looks right** or written what is
wrong. Every review is saved, so an admin can see whether the testing really happened before anyone is paid.

**Where things live.** The links and reviews are in the **Radlor Ops** app (its "Radlic testers" tab, ops admins
only) and its database — not in Radlic's, which holds nothing about testers. Radlic has the tester's page
(`/test`) and `POST /api/tester`, which forwards each call from Radlic's server to Ops `/api/radlic-tester`
(set `TESTER_API` to point elsewhere; unset = `https://ops.radlor.com`). The Ops side is documented in the radlor-ops
repository (its Radlic testers doc).

## 1. Make a link (an ops admin)

Radlor Ops → **Radlic testers** → email, module or chapter, an optional note → **Create link**. Copy the
`https://radlic.com/test#t=…` link and send it to the tester yourself (nothing is emailed). One link = one email +
one module or chapter. The token after `#t=` is the only key: anyone holding the link can review as that tester, so
send it to them alone. **Revoke** closes it at once.

## 2. What the tester does

They open the link, see the module's topics (or the chapter) and a short "how to test", and play the real thing —
same voice, screens and questions as a child gets; it is the live code, not a copy. A yellow bar asks "Is this
screen right?":

- before a screen has played (teaching) or been answered (Screen 8, practice) the bar says so;
- **👍 Looks right** saves and lets it go on;
- **⚠️ Something is wrong** asks for tags (voice, text, picture, answer, speed, confusing, bug) and a note of at least
  5 letters, then saves and lets it go on;
- **Change my review** (lessons) replaces the saved one.

**A lesson** keys its screens `1`–`7` (teaching), `8` and `8-twin` (Now you try), `p1`, `p2`… (practice), `9` (the
end). Next stays disabled until that screen is reviewed; Back and ← Topics always work.

**Practice levels.** A topic's practice has a ladder of question levels (most have 5). For a tester the ladder does not
move by itself: a **Level** row (L1, L2, …) above the problem picks the level; tapping one swaps in a new problem at
that level, and **Next problem** keeps drawing from it. Nothing about levels is saved for a child's account, there is
no 5-answer checkpoint and no end at 12 answers. A yellow line counts the tester's reviewed questions per level
(`L1 2/2 · L2 1/2 …`, from every sitting); **Finish practice ▶** opens only when every level has 2, and leads to the
real Screen 9. Each practice review's answer starts with its level (`L3 · 7 → 12 ✓`). A later sitting numbers its
practice on from the last saved one (p6, p7…), so an earlier review is never shown as this question's.

**When a topic is "✓ done":** every practice level has 2 reviewed questions **and** screen `9` is reviewed. Until then
the list shows `n screens reviewed · practice x/y`. The ops tab counts topics done by the same rule.

**A KG–2 chapter** plays as a child gets it (landscape on a phone). It stops after its intro (`intro`: the demo and
guided round together), after every answer (`q1`…; the answer column says ✓ or ✗ and the question), after every
re-teach (`r1`…) and after each spoken line of a walk (`s1`…, the counting chapters). While the bar is up a
see-through cover stops taps. The tester plays the whole run (the 5-question break is off for them), and the end card
asks for `9`, the chapter as a whole.

A topic or chapter counts as finished when `9` is reviewed. Nothing the tester does is saved to a child, even on a
device where a child is chosen: the lesson player gets no learner, and `ChapterReviewContext` turns off a chapter's
standing, score and resume point.

## 3. Check the work, then pay (an ops admin)

On the tab, per link: topics finished of the total, screens reviewed, issues, **Not played** (reviews saved before
the screen finished — the app blocks this, so anything but 0 needs a look), median time a screen was open, last
activity. **Reviews** lists every screen: verdict, note, the answers typed (`7 → 12 ✓` = wrong then right; `(steps
shown)` = missed twice), time open.

Signs of a genuine test: every topic reaches `9`; times look like someone listening; answers vary and are sometimes
wrong; issues name something specific. Signs of not: topics missing, the same answer everywhere, no issue across a
whole module. Pay outside the app, then **Mark paid** (this also closes the link). Fix issues through the normal
lesson workflow ([building-lessons](../product/building-lessons.md)).
