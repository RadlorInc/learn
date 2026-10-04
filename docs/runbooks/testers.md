# Paid testers

A tester is paid to go through one module and say, screen by screen, whether it is right. The app makes sure they
cannot skip: nothing moves on by itself, Next opens only after the screen has played out (her lines finished, the
question answered) and the tester has tapped **Looks right** or written what is wrong. Every review is saved, so
`/admin/testers` shows whether the testing really happened before anyone is paid.

Who does what: the founder (or another admin) makes links and pays; the tester needs no account.

## 1. Make a link (admin)

1. Sign in at `/admin/login`, open **Testers**.
2. Type the tester's email, pick the module (Grades 3–8), add a note if useful (rate, deadline), **Create link**.
3. Copy the link (`https://radlic.com/test#t=…`) and send it to the tester yourself. The app sends no email.

One link = one email + one module. For a second module, make a second link. The token after `#t=` is the only key:
anyone holding the link can review as that tester, so send it to them alone. **Revoke** closes it at once.

## 2. What the tester does

They open the link, see the module's topics and a short "how to test", open a topic, and go through it in the real
lesson player (same voice, screens and questions as a child gets; it is the live code, not a copy). Under every
screen a yellow bar asks "Is this screen right?":

- before the screen has played (teaching screens) or been answered (Screen 8 and practice) the bar says so and the
  buttons are not there;
- **👍 Looks right** saves and opens Next;
- **⚠️ Something is wrong** asks for tags (voice, text, picture, answer, speed, confusing, bug) and a note of at least
  5 letters, then saves and opens Next;
- **Change my review** replaces the saved one.

Screens are keyed `1`–`7` (teaching), `8` and `8-twin` (Now you try), `p1`, `p2`… (practice), `9` (the end). A topic
counts as done when screen `9` is reviewed. Nothing the tester does is saved as a child's progress (no learner).

## 3. Check the work, then pay (admin)

On `/admin/testers`, per link: topics done of the module's total, screens reviewed, issues, **Not played** (reviews
saved before the screen finished — the app blocks this, so anything but 0 needs a look), median time a screen was
open, last activity. **Reviews** lists every screen: verdict, note, the answers they typed (`7 → 12 ✓` = wrong then
right; `(steps shown)` = missed twice), time open.

Signs of a genuine test: every topic reaches `9`; times look like someone listening (a teaching screen is open at
least as long as her lines take); answers vary and are sometimes wrong; issues name something specific. Signs of
not: topics missing, the same answer typed everywhere, no issue across a whole module.

Pay outside the app, then **Mark paid** (this also closes the link). Fix issues through the normal lesson workflow
([building-lessons](../product/building-lessons.md)).

## Data

Tables `tester_assignments` and `tester_reviews` (migration `20261004120000_tester_reviews.sql`): RLS on, no
policies, reached only through `admin_tester_*` (admin) and `tester_open` / `tester_review` (the token). They hold
the tester's email and their reviews — an adult's, never a child's. Delete a tester's rows on request
([data-requests](data-requests.md)): `delete from tester_assignments where email = '…'` (their reviews go with it).
