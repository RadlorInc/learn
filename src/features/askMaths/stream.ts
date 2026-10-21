/**
 * Ask maths (docs/product/ask-maths.md): the parts the server route and the page share. No React, no browser APIs.
 * The lesson arrives as the whiteboard service's server-sent events (askRadlor's /api/partner/maths): accepted,
 * stage, els, need, els_add, step…, then done or failed.
 */

/** Server: the whole feature is off unless ASK_MATHS=on (and the page needs NEXT_PUBLIC_ASK_MATHS=on to show it). */
export const ASK_MATHS_ON = () => process.env.ASK_MATHS === 'on'
/** Browser: the button and the page. Baked in at build, like every NEXT_PUBLIC_ value. */
export const ASK_MATHS_PUBLIC = process.env.NEXT_PUBLIC_ASK_MATHS === 'on'
/** The longest question a child may send (the whiteboard service refuses longer). */
export const MAX_QUESTION = 300

export type SseEvent = { event: string; data: Record<string, unknown> }

/** Every complete event in `text` (a trailing half event is left out); comments (": hb") are skipped. */
export function parseSse(text: string): SseEvent[] {
  const out: SseEvent[] = []
  const blocks = text.split('\n\n')
  blocks.pop()                                      // the part after the last blank line is not finished yet
  for (const block of blocks) {
    const event = /^event: (.*)$/m.exec(block)?.[1], data = /^data: (.*)$/m.exec(block)?.[1]
    if (!event || data === undefined) continue
    try { out.push({ event, data: JSON.parse(data) }) } catch { /* a broken event is skipped, never thrown */ }
  }
  return out
}

/** The finished lesson the events carried, in the shape the player replays: {els, drawings?, steps}. */
export function scriptOf(events: SseEvent[]): { els: Record<string, unknown>; drawings?: Record<string, unknown>; steps: unknown[] } {
  const els: Record<string, unknown> = {}, drawings: Record<string, unknown> = {}, steps: unknown[] = []
  for (const { event, data } of events) {
    if (event === 'els' || event === 'els_add') {
      Object.assign(els, data.els ?? {})
      if (data.drawings && typeof data.drawings === 'object') Object.assign(drawings, data.drawings)
    }
    if (event === 'step' && Number.isInteger(data.i)) steps[data.i as number] = data.step
  }
  return { els, ...(Object.keys(drawings).length ? { drawings } : {}), steps: steps.filter(Boolean) }
}
