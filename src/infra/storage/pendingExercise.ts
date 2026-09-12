'use client'
/**
 * Which piece of set work the chapter now starting belongs to.
 *
 * ⚠️ PER-TAB (sessionStorage), NOT the durable kv store, and that is the whole design. It is true
 * only for the length of one chapter run; a value surviving a browser restart would file a child's
 * free play as a teacher's exercise they never opened.
 *
 * ⚠️ READ-ONCE. `take` clears as it reads, so replaying a chapter for fun after finishing set work
 * is free play and not a second submission.
 */
const KEY = 'milo_active_exercise'

export function setPendingExercise(id: string): void {
  try { sessionStorage.setItem(KEY, id) } catch { /* private mode — the run still scores, it just is not filed */ }
}

export function takePendingExercise(): string | null {
  try {
    const v = sessionStorage.getItem(KEY)
    if (v) sessionStorage.removeItem(KEY)
    return v
  } catch { return null }
}
