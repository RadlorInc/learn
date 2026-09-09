/**
 * NO CHAPTER MAY FIRE THE CANCELLING `speak()` FROM A DEFERRED PATH.
 *
 * ⚠️ THIS EXISTS BECAUSE THE ENGINE FIX WAS NOT A FIX FOR ANYONE WHO KEEPS CALLING THE WRONG VERB.
 * `speakAfterCurrent` now queues correctly (see voiceNoOverlap.test.ts) and that helps only a call
 * site that ASKS for it; a chapter still calling plain `speak()` at a round boundary cuts exactly as
 * before, with a repaired engine underneath it. Founder, 2026-09-04, on being handed fourteen fixed
 * call sites out of seventy-two chapters: *"the answer to 'is it fixed everywhere' is unknown, not
 * yes"*. It was — and this gate is the difference between checked-once and checkable.
 *
 * THE RULE. `speak()` SUPERSEDES, which is right when the child just acted (a tap, a count) and
 * wrong when the line lands on a moment nobody chose. So in the chapter directories a cancelling
 * verb may not appear in a DEFERRED context — the body of a `useEffect`, or a callback handed to a
 * scheduler — unless it is named in ALLOW below with the reason it must cut in.
 *
 * ⚠️ IT COUNTS LOCAL WRAPPERS, WHICH IS THE HALF A GREP MISSES. BlockYard and BuildingBlocks route
 * every line through `say()`, so thirteen emission sites were invisible to a `speak(` search — and
 * two of them were the round's own QUESTION, fired from a timer 400ms in, cancelling the previous
 * round's verdict and praise. Nobody had ever read them. A gate that only knows the verb's name
 * would have reported those two chapters clean.
 *
 * ⚠️ ASSERTED EXACTLY, NOT AS A FLOOR. A new chapter's boundary `speak()` fails it; so does deleting
 * an ALLOW entry whose call is still there. Both directions are mutation-tested at the bottom of
 * this file's history — see the commit.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { strip } from './_window'

const ROOT = 'src/features/chapters'
/** The verbs that CANCEL whatever is talking. `speakAfterCurrent`/`speakPaced`/`speakSteps` queue or self-pace. */
const CANCELS = ['speak', 'speakAt']
/** Local one-line wrappers around them — their call sites are emission sites a grep never sees. */
const WRAPPERS = /(?:const|function)\s+(say|tell)\b/g
/** Callers whose callback runs at a moment the author did not choose. */
const DEFERRED = ['useEffect', 'useLayoutEffect', 'setTimeout', 'setInterval', 'requestAnimationFrame', 'after', 'later', 'at', 'then']

/**
 * The deferred cancelling lines that are CORRECT, each with why it must cut in rather than wait.
 * Keyed on a fragment of the call, so it survives an edit above it and dies if the call is reworded.
 */
const ALLOW: Array<[file: string, fragment: string, why: string]> = [
  ['story/BlockYard.tsx', "say('Ten ones make ONE rod.",
   'the child tapped the pile; the carry animation is the only reason it is deferred at all'],
  ['story/BlockYard.tsx', "say('One rod opens back into ten ones.",
   'same — the answer to a tap, held back until Milo has walked the rod over'],
  ['story/BuildingBlocks.tsx', "say('Ten ones on the ground — you cannot leave ten there.",
   'derived from the COUNT rather than the tap that caused it (a batched pair announces the wrong one), so it is an effect by necessity and still the child\'s own action'],
  ['story/BuildingBlocks.tsx', 'say(ASK[kind])',
   'the tap finished a trade; the standing instruction returns as its consequence'],
  ['story/BuildingBlocks.tsx', "say('Ten again — trade them up.')",
   'the same tap, the branch where a second ten has already landed in the bay'],
  ['story/BuildingBlocks.tsx', "say('Ten ones make ONE ten. It goes on the left shelf.')",
   'the same tap, the branch where the bay is empty and the trade is finished'],
  ['story/HopAlong.tsx', 'speak(String(next * data.group))',
   'the running total the child just earned; deferred only until his feet land, and a faster tapper must hear the NEWEST number'],
  ['story/LevelRun.tsx', 'speak(lines[i])',
   'inside the walkthrough walk, whose next step waits on `afterSpeech` — the line that follows cannot start until this one has ended'],
  ['story/OrderDesk.tsx', 'speak(lines[i])',
   'same walkthrough shape, same `afterSpeech` gate'],
  ['story/StoryWorld.tsx', 'speak(scene.bubble)',
   'a WORLD scene change is a deliberate hard cut — the effect calls stopSpeech() on the way out, and the bubble is the first thing in the new scene'],
  ['story/world1.tsx', 'speak(String(n))',
   'the counting demo says one number per 2.7s cadence; each is a syllable and the newest is the one the parade is showing'],
]

function files(d: string, out: string[] = []): string[] {
  for (const f of readdirSync(d)) {
    const p = join(d, f)
    if (statSync(p).isDirectory()) files(p, out)
    else if (/\.tsx?$/.test(p)) out.push(p)
  }
  return out
}

/** Every deferred cancelling emission in the chapter tree, as `file » fragment`. */
function deferredSites(): string[] {
  const hits: string[] = []
  for (const f of files(ROOT)) {
    const src = strip(readFileSync(f, 'utf8'))
    const verbs = new Set([...CANCELS, ...[...src.matchAll(WRAPPERS)].map(m => m[1])])
    for (const v of verbs) {
      const re = new RegExp(`(^|[^\\w.$])${v}\\s*\\(`, 'g')
      let m: RegExpExecArray | null
      while ((m = re.exec(src))) {
        const at = m.index + m[1].length
        // the wrapper's own DEFINITION is not a call
        if (/(?:const|function)\s+$/.test(src.slice(Math.max(0, at - 30), at))) continue
        // walk out: which still-open `(` are we inside, and who opened each?
        const open: number[] = []
        for (let i = 0; i < at; i++) { const c = src[i]; if (c === '(') open.push(i); else if (c === ')') open.pop() }
        const owners = open.map(i => (src.slice(Math.max(0, i - 40), i).match(/([\w$.]+)\s*$/)?.[1] ?? '').split('.').pop())
        if (!owners.some(o => o && DEFERRED.includes(o))) continue
        hits.push(`${f.replace(ROOT + '/', '')} » ${src.slice(at, at + 70).replace(/\s+/g, ' ').trim()}`)
      }
    }
  }
  return hits.sort()
}

describe('the cancelling verb never fires from a deferred path', () => {
  /**
   * ⚠️ POSITIVE CONTROL FIRST. A finder that has stopped finding is the whole defect class this
   * repo is built around, and this one has three independent ways to go silently blind: the file
   * walk, the wrapper discovery, and the paren walk. If the known-correct deferred sites stop being
   * seen, every chapter reads clean.
   */
  it('the finder still finds the sites it is supposed to find', () => {
    const hits = deferredSites()
    expect(hits.length, 'the deferred-site finder returned nothing — it is blind, not clean').toBeGreaterThan(5)
    // it must see through a LOCAL WRAPPER, which is the half a `speak(` grep cannot reach
    expect(hits.some(h => h.startsWith('story/BuildingBlocks.tsx » say(')), 'wrapper calls are invisible to the finder').toBe(true)
    // and through a nested scheduler inside an effect
    expect(hits.some(h => h.startsWith('story/BlockYard.tsx » say(')), 'nested `after()` inside `useEffect` is invisible').toBe(true)
  })

  it('every deferred cancelling line is a listed, reasoned exception', () => {
    const unlisted = deferredSites().filter(h =>
      !ALLOW.some(([f, frag]) => h.startsWith(f + ' » ') && h.includes(frag)))
    expect(unlisted, [
      'A chapter fires the CANCELLING speak() from an effect or a timer, so it lands on whatever',
      'Milo is still saying. Use `speakAfterCurrent` (queues), `speakPaced` (self-paced narration),',
      'or add it to ALLOW in this file with the reason it must cut in.',
    ].join('\n')).toEqual([])
  })

  /** The other direction: an ALLOW entry that no longer matches anything is a rule about nothing. */
  it('no ALLOW entry has gone stale', () => {
    const hits = deferredSites()
    const dead = ALLOW.filter(([f, frag]) => !hits.some(h => h.startsWith(f + ' » ') && h.includes(frag)))
    expect(dead.map(d => `${d[0]} » ${d[1]}`), 'listed as a deliberate exception, but no such call exists any more').toEqual([])
  })

  /** Every exception states WHY, or the list becomes a place to make failures go away. */
  it('every exception carries a reason', () => {
    for (const [f, frag, why] of ALLOW) {
      expect(why.trim().length, `${f} » ${frag} has no reason`).toBeGreaterThan(30)
    }
  })
})
