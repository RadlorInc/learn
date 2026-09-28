# The lesson voice

Who speaks in Radlic, how a line is written so it can be spoken, and what happens when a recording is missing.
Rendering and uploading clips is a separate job: [../runbooks/audio-upload.md](../runbooks/audio-upload.md). How
lessons are built: [building-lessons.md](building-lessons.md).

## Who speaks

**Josh**, one recorded voice, made with the Chatterbox text-to-speech model from a reference recording. It is the only
recorded voice; the earlier voices were deleted on 2026-09-26. Every Grade 3–8 module is voiced in Josh (the modules
listed in `JOSH_MODULES`, `src/infra/storage/voicePref.ts`; `lessonVoiceClips.test.ts` fails if a module is missing),
and so is every KG–2 story chapter.

A Grade 3–8 lesson speaks these lines, each from its own recorded clip:

- Screen 1 (its title and text), then every teaching line (`beats[].say`) on Screens 2–7;
- the big idea, which is said again when a practice answer misses;
- Screen 8 ("Now you try." with the question and prompt), both hints, the twin ("Try a new one."), "Right!",
  "Here is how this one works.", and Screen 9 (all three versions).

Not spoken: the worked steps (shown only) and the practice problems, which the ladders generate with random numbers,
so there is no fixed set to record (the founder: not now). A teaching screen moves on by itself once her last line
has finished.

A KG–2 chapter speaks every line its component says. Lines built from numbers (a count, "That makes seventeen") are
recorded value by value; a line with a child's name in it is never recorded.

## Render styles

The expression comes from the model's settings, never from markup. The names are in
`src/features/lessons/content/voice/styles.ts`; the settings are `STYLES` in `scripts/chatterbox-render.py`.

| style | model and settings | used for |
|---|---|---|
| **A** | Chatterbox Turbo, the words as written | the default: Screen 1, the question, hints, Screen 9, and every KG–2 line |
| **B** | original Chatterbox, exaggeration 0.5, cfg_weight 0.5 | the everyday teacher: every teaching line and the big idea |
| **B+** | original Chatterbox, exaggeration 0.7, cfg_weight 0.3 | Screen 7's warning, a little more punch (its last line, `Okay. Your turn.`, is B) |

High exaggeration speeds the talk up; if the reference voice runs fast, lower `cfg_weight` toward 0.3. As of
2026-09-28 these settings come from the founder's documents, not from listening (see
[content-backlog.md](content-backlog.md)).

Each module has a file of render rows, `src/features/lessons/content/voice/<module>.ts`:

```ts
"Look at 40. The 4 is in the tens place.": { style: 'B' },
"Now read it across. The seed weighs 0.047 grams.": { style: 'B', say: "Now read it across. The seed weighs zero point zero four seven grams." },
```

The key is the line **exactly as the lesson says it**: that is what the clip is found by. `say` is only for a line
that `speakable()` cannot say on its own; it is the same words with the maths spoken. A line said in two topics has
one row (a repeated key does not compile), and every row must still be a line some lesson says
(`lessonVoiceClips.test.ts`). A line with no row renders as style A from its own text.

## Writing a line that can be spoken

The screen and the mouth differ. The screen keeps the symbols (`1/10`, `37 × 10`, `4:15`); the voice is given words.
Most of that is automatic: `speakable()` (in `styles.ts`) turns `3/4` into "three fourths", `2 1/2` into "2 and one
half", `5 cm` into "5 centimeters" (and `1 cm` into "1 centimeter"), `4:15` into "4 15", `4:00` into "4 o'clock",
`×` `÷` `+` `−` `=` `<` `>` into words, `3 : 2` into "3 to 2", `25%`, `90°`, `$3.75`, `x²`, `−3`, `π` and `√16`.

The rules, from the founder's two documents (2026-09-22) and the gates that hold them:

- **Punctuation is the performance.** `.` a full stop, `,` a breath, `?` a lift, `—` only for a real turn in
  thought. A new beat is a new move.
- **No `...`, no stacked `!`, no emoji, no tags** (`[happy]` is not a command and may be read out), no SSML.
- **No capitals in the voice.** The model spells a word in capitals letter by letter ("ADD" becomes "A-D-D"). CAPS
  appear only on Screen 7's warning word, for the eye; `speakable()` lowercases them (AM and PM excepted), and the gate
  fails on any that reach the voice.
- **Decimals need a `say`.** `speakable()` does not spell `0.25`: say the digits ("zero point two five") where the
  topic is the written form, and the value ("twenty-five hundredths") where it is how much.
- Never "slash", never "over" (unless the topic is the fraction bar), never "open parenthesis". `( )` are
  "parentheses"; `(x + 2)` is "x plus 2, all together".
- `in` is not read as inches: give such a line a `say`.
- What reaches the voice may hold only letters, digits, spaces and `, . ? ! ' ’ — -` (`SPEAKABLE` in `styles.ts`).
  Anything else fails `lessonExplainStyle.test.ts`, which names the line and asks for a `say`.

`speakableUnits.test.ts` holds the conversions above; `lessonExplainStyle.test.ts` holds the rest for every module
(run one with `-t <module>`).

## When there is no clip: the device voice

A line is spoken by the device (the browser's own speech) when it has no clip: a reworded line not yet rendered, a
line built at runtime (a child's name), a clip index that failed to load, or no audio address configured. Two rules
hold it:

- **One line, one voice.** A line is settled once: clip or device, never both, and a clip that starts after the
  device began is stopped (`oneVoicePerLine.test.ts`).
- **Only an on-device voice.** A network voice would send the words, which can include a child's name, to the
  browser maker's servers, so only a voice that runs on the device is used; with none, the line is not spoken
  (`speechLocalVoiceOnly.test.ts`).

## Clip keys, and why a URL never carries a child's name

- A clip is found by two hashes of the line as the lesson says it (spaces collapsed): `clipKey` (32 bits) and
  `clipCheck` (an independent 53 bits), both in `src/core/voiceClips.ts`.
- Each module has a clip index (`src/features/lessons/voice-index/<module>.json`) and each KG–2 chapter one
  (`src/features/chapters/voice-index/<chapter>.json`): key → object name, check, size. They are generated with
  `scripts/audio/manifest.json`, which says which line is which object; never edit them by hand.
- The object name is the first 16 hex digits of the clip's SHA-256, so the address is
  `<audio base>/<16 hex>.mp3` and nothing else: no voice, grade, learner or query string. A re-rendered clip gets a new
  name, which is why clips can be cached for a year.
- **A line with a child's name is never recorded, and never requested.** A 32-bit key alone is not enough: a line with
  a name in it was measured to share its key with a real lesson line. So the player plays a clip only when the key
  **and** the check both match; a line carrying a name is spoken by the device and asks for nothing
  (`noChildDataInAudioUrl.test.ts`).
- **KG–2: the requests never depend on the answer.** When a chapter's question loads, the clips for every line it can
  lead to are fetched into memory; while it is open, nothing else is asked for (`questionLock.test.ts`). Money is the
  one exception, within a small budget (`moneyAnswerBudget.test.ts`).
- The audio base is one value, `src/core/audioBase.ts`: `NEXT_PUBLIC_AUDIO_BASE_URL` if set, otherwise the project's
  public `lesson-audio` storage bucket. The same value sets the Content-Security-Policy, so moving the audio is a
  re-upload and one value (a move to another company also changes the legal pages that name who serves the audio).
  The clips are not in git.

## Adding or changing a line

A new or reworded line has no clip until it is rendered, and `lessonVoiceClips.test.ts` (lessons) or
`chapterVoiceCorpus.test.ts` (KG–2) fails until it has one. The steps (rebuild the corpus, render the missing rows,
rebuild the manifest and indexes, upload, then merge) are in
[../runbooks/audio-upload.md](../runbooks/audio-upload.md). A reworded teaching line must keep the words its chalk
marks hang on, or move the marks.

The chalkboard is timed by an estimate: each beat starts when its clip starts, but a mark inside the beat goes up at
its word's place in the line times an estimated length (`beatMs` in `src/features/lessons/chalk.ts`). A slow, expressive
clip can make a mark land early.
