# Next legal round — queued items

Items the founder has deferred to the next legal round. Each one names where the text lives and why it is waiting.
Move an item out when its round is planned; do not delete it silently.

| added | item | where | why it waits |
|---|---|---|---|
| 2026-09-28 | **B1 opens "Thanks for signing up with Radlic." even when an existing parent receives it.** Since notice-v7 (learn#307), B1 also reaches parents who signed up long ago: when a Kindergarten / Grades 1–2 child on their account is refused, or when they move a child into those grades (`/api/consent/child-blocked`). A variant opening for an existing parent would be a doc 03 wording change (B1 is the verbatim consent email; `consentCopy.test.ts` holds it to the document). | doc 03 §B1, `src/features/consent/copy.ts` `B1.thanks` | Founder, 2026-09-28: "leave for now; add to the next legal round". |
