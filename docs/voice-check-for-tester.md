# Milo's voice went quiet — what we need you to send us

Thank you for reporting this. You told us that in **Milo's House**, when you got to the boat's
hull, Milo stopped speaking.

We have not been able to make it happen on any computer we have here, so we cannot tell yet
*why* it went quiet. There are two very different reasons it could be, and they need two
different fixes — so before we change anything, we need to see what happened on **your** device.

We have added a small thing to the app that quietly writes down, for each sentence Milo tries to
say, whether it actually started and whether it finished. It takes about five minutes to collect,
and you do not need to know anything technical. It is nine steps.

---

> ⚠️ **Send this only once the new version is live.** The notes it asks for are collected by
> something we added on 2026-08-31 — on an older build the last step will say
> `__miloSpeech is not defined`, and the tester will have spent their time for nothing.

## What you need

- The same computer you were testing on
- The Chrome web browser
- Sound turned on, and your volume up

## Step by step

**1.** Open Chrome and go to the app as usual, and start a child's session.

**2.** Open **Milo's House** (the shape chapter — Milo builds a house out of shapes).

**3.** Play it normally, with the sound on. Do not skip anything and do not refresh the page
— if the page reloads, the notes are lost and you have to start again.

**4.** Keep playing until Milo goes quiet — you said this happened around the boat's **hull**,
which is the first piece of the boat, after the house is finished. If he does *not* go quiet
this time, just play to the end of the chapter; that is a useful answer too, and you can say so.

**5.** The moment you notice he has stopped speaking, **stop playing** and leave the page open.
Do not close the tab, do not press refresh.

**6.** Press these keys together to open Chrome's developer panel:

- **Windows:** `Ctrl` + `Shift` + `J`
- **Mac:** `Cmd` + `Option` + `J`

A panel opens at the side or the bottom of the window, with a blinking cursor next to a `>`
symbol. That is all you need — you can ignore everything else in there, including any red text.
Nothing you do here can break anything.

**7.** Click next to that `>` symbol, type this exactly, and press Enter:

```
copy(JSON.stringify(__miloSpeech(), null, 2))
```

*(If typing it is awkward, copy the line from this document and paste it in. If Chrome asks you
to allow pasting, it may ask you to type the words `allow pasting` first — that is a normal
Chrome safety prompt.)*

**8.** That command has copied the notes to your clipboard. Paste them into an email or a
message to us (`Ctrl`/`Cmd` + `V`).

**9.** Please also tell us, in your own words:

- roughly **where** in the chapter he went quiet (which piece was he asking for?)
- whether he was speaking **normally before that**, or had been quiet from the start
- whether **any other sound** in the app still worked
- what device and browser you were on

---

## What it looks like when it worked

You will paste something that starts like this. You do not have to understand it — but if you
are curious, the useful part is the four numbers at the top:

```json
{
  "spoken": 14,
  "started": 9,
  "hung": 1,
  "silent": 4,
  ...
}
```

- **spoken** — how many sentences Milo tried to say
- **started** — how many actually began out loud
- **hung** — began, and then never finished. **This is the one we are hunting.**
- **silent** — never began at all

## If something goes wrong

- **`__miloSpeech is not defined`** — the app on that computer is an older version than the one
  with this in it. Tell us and we will check what is deployed before you try again.
- **You cannot find the `>` cursor** — look for a tab called **Console** along the top of the
  panel that opened, and click it.
- **You refreshed the page by accident** — the notes are gone; start again from step 1. It is
  not a problem, it just has to be one unbroken run.

---

That is everything. This tells us in one go whether Milo's voice is being cut off part way
through a chapter, or never starting on your device at all — and those two need different
fixes, which is why we would rather not guess.
