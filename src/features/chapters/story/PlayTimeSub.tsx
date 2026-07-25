'use client'
/**
 * Simple subtraction — PLAY TIME run in the other direction. All of it lives in ./PlayTime; this
 * module exists only so the registry and the /story route can code-split it and mount it with `op`
 * bound, since StoryInner is a fixed two-prop contract with nowhere to pass a variant.
 */
import PlayTime from './PlayTime'

export default function PlayTimeSub(p: {
  world?: string
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
  return <PlayTime {...p} op="-" />
}
