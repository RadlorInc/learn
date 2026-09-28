/**
 * WHERE THE RECORDED LESSON AUDIO LIVES — the one value to change to move it (founder, 2026-09-26: "a single config
 * value so we can move to Cloudflare R2 later by re-uploading and changing one value").
 *
 *   NEXT_PUBLIC_AUDIO_BASE_URL   if set: the base URL objects are fetched from (`<base>/<16 hex>.mp3`), e.g. an R2 bucket
 *   otherwise                    `<NEXT_PUBLIC_SUPABASE_URL>/storage/v1/object/public/lesson-audio` — the bucket made by
 *                                supabase/migrations/20260927100000_lesson_audio_bucket.sql
 *
 * Both the player (voiceClipPlayer) and the CSP (next.config.ts: media-src + connect-src) read it through this file, so
 * the browser is allowed to reach exactly the host the player asks. Object names are content hashes and the manifest
 * holds NAMES, never URLs: a move is `upload.py` against the new host, then this value — nothing else.
 * ⚠️ A move to a DIFFERENT COMPANY changes who receives a child's IP/user agent: docs/legal/07-subprocessors.md and the
 * cookie notice must change with it (docs/decisions.md, 2026-09-27).
 * Unset/invalid → null: the player asks for no clip at all and every line is spoken by the device (never a broken URL).
 */
export function audioBaseFrom(explicit: string | undefined, supabaseUrl: string | undefined): string | null {
  const pick = explicit?.trim() || (supabaseUrl?.trim() ? `${supabaseUrl.trim().replace(/\/+$/, '')}/storage/v1/object/public/lesson-audio` : '')
  try {
    const u = new URL(pick)
    if (u.protocol !== 'https:' && u.hostname !== '127.0.0.1' && u.hostname !== 'localhost') return null
    return pick.replace(/\/+$/, '')
  } catch {
    return null
  }
}

/** The origin the CSP must allow for media and fetch — null when there is no audio base. */
export const audioOriginFrom = (base: string | null): string | null => (base ? new URL(base).origin : null)

// ⚠️ Written as two LITERAL process.env reads on purpose: Next inlines NEXT_PUBLIC_* into the client bundle only for
// literal `process.env.NEXT_PUBLIC_X` accesses, so passing `process.env` around would leave the browser with undefined.
export const AUDIO_BASE = audioBaseFrom(process.env.NEXT_PUBLIC_AUDIO_BASE_URL, process.env.NEXT_PUBLIC_SUPABASE_URL)
