/**
 * Which recorded voice a lesson speaks in.
 *
 * ⚠️ JOSH IS THE ONLY RECORDED VOICE (founder, 2026-09-26). Stevie and Teddy — and with them the per-device voice pick
 * (`getVoicePref`, whose picker was deleted 2026-09-17) and the 3–5 band's voice (`BAND_VOICE`) — are gone, and their
 * clips are out of the repo and never uploaded. A line with no recorded voice is spoken by the device, as it always was.
 * The player (voiceClipPlayer.voiceNow) refuses any voice but JOSH, so nothing can ask for a deleted voice's files.
 */

/** Josh — ElevenLabs "Josh - Teacher for Kids", cloned into Chatterbox from scripts/chatterbox-ref/<id>.wav (2026-09-22). */
export const JOSH = 'nzFihrBIvB34imQBuxub'

/**
 * Modules rewritten to the founder's explanation documents and voiced in Josh (founder, 2026-09-22: every module moves,
 * one at a time). A module joins in the same PR that brings its Josh clips — its lines are queued for Kaggle from the
 * moment it is listed, and the PR is not merged until they are rendered, or it plays browser speech.
 * ⚠️ scripts/explain-merge.sh rewrites this declaration by regex: keep it one `new Set([...])` on one line.
 */
export const JOSH_MODULES = new Set(['g5m1', 'g3m1', 'g3m2', 'g3m3', 'g3m4', 'g3m5', 'g3m6', 'g4m1', 'g4m3', 'g4m2', 'g4m4', 'g4m5', 'g4m6', 'g5m2', 'g5m3', 'g5m5', 'g5m4', 'g5m6', 'g6m1', 'g6m4', 'g6m2', 'g6m3', 'g6m6', 'g6m5', 'g6m7', 'g7m2', 'g7m1', 'g7m3', 'g7m5', 'g7m4', 'g8m1', 'g8m2', 'g8m3', 'g8m4', 'g8m5', 'g8m6'])

/**
 * A new-flow lesson's voice: Josh for a JOSH_MODULES module, otherwise none (the device speaks). The SAME function
 * scripts/lesson-voice-corpus.mts cuts the render corpus on, so a lesson asks exactly the voice its clips were rendered in.
 */
export const lessonVoice = (lessonId: string): string | null =>
  JOSH_MODULES.has(lessonId.split('-')[0]) ? JOSH : null
