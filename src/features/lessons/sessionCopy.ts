/**
 * Every child-facing line of short practice sessions (checkpoint, break, welcome back, the prerequisite nudge, the set's
 * dots, answer feedback), in one
 * place so `childWords.test.ts` can hold all of them to the words a child must never see.
 *
 * Wording approved by the founder, 2026-09-24. ⚠️ SPANISH IS AN UNREVIEWED DRAFT: the child screens have no language
 * switch yet, so only `en` is shown; `es` waits for the child screens' language system and a reviewer's sign-off.
 */
export const SESSION_COPY = {
  en: {
    checkpoint: (n: number) => `${n} questions done! ⭐ Nice work.`,
    mastered: "You've got this topic! ⭐",
    keepGoing: 'Keep going',
    takeBreak: 'Take a break',
    breakTitle: (n: number) => (n === 1 ? 'Great work, 1 question done! ⭐' : `Great work, ${n} questions done! ⭐`),
    breakMastered: "Great work! ⭐ You've got this topic.",
    spotSaved: 'Your spot is saved.',
    points: (n: number) => (n === 1 ? '+1 point' : `+${n} points`),
    backToTopics: 'Back to topics',
    welcomeTitle: 'Welcome back! ⭐',
    keepPractising: 'Keep practicing',
    watchFirst: 'Watch the lesson first',
    started: 'Keep practicing',
    nudge: (prev: string, next: string) => `You're on your way with ${prev}! ⭐ Getting a bit further there (past halfway) will make ${next} easier.`,
    practiseFirst: (prev: string) => `Practice ${prev} first`,
    goAnyway: (next: string) => `Go to ${next} anyway`,
    progressLabel: (prev: string) => `How far you are with ${prev}`,
    // Review 1 (founder, 2026-09-24): the five dots, and gentle answer feedback. Shown on screen only — the voice keeps
    // saying "Right!", the one line with a recorded clip.
    setDots: (n: number) => (n === 1 ? '1 question done in this set' : `${n} questions done in this set`),
    tryAgain: 'Try again!',
    cheers: ['Right!', 'Nice!', 'You got it!', 'Great thinking!'],
  },
  // REVIEWED-BY: (unreviewed draft)
  es: {
    checkpoint: (n: number) => `¡${n} preguntas hechas! ⭐ Buen trabajo.`,
    mastered: '¡Ya dominas este tema! ⭐',
    keepGoing: 'Seguir',
    takeBreak: 'Tomar un descanso',
    breakTitle: (n: number) => (n === 1 ? '¡Muy bien, 1 pregunta hecha! ⭐' : `¡Muy bien, ${n} preguntas hechas! ⭐`),
    breakMastered: '¡Muy bien! ⭐ Ya dominas este tema.',
    spotSaved: 'Guardamos tu lugar.',
    points: (n: number) => (n === 1 ? '+1 punto' : `+${n} puntos`),
    backToTopics: 'Volver a los temas',
    welcomeTitle: '¡Qué bueno verte! ⭐',
    keepPractising: 'Seguir practicando',
    watchFirst: 'Ver la lección primero',
    started: 'Seguir practicando',
    nudge: (prev: string, next: string) => `¡Vas muy bien con ${prev}! ⭐ Avanzar un poco más ahí (más de la mitad) hará más fácil ${next}.`,
    practiseFirst: (prev: string) => `Practicar ${prev} primero`,
    goAnyway: (next: string) => `Ir a ${next} de todos modos`,
    progressLabel: (prev: string) => `Cuánto llevas en ${prev}`,
    setDots: (n: number) => (n === 1 ? '1 pregunta hecha en esta ronda' : `${n} preguntas hechas en esta ronda`),
    tryAgain: '¡Inténtalo otra vez!',
    cheers: ['¡Correcto!', '¡Muy bien!', '¡Lo lograste!', '¡Qué buena idea!'],
  },
} as const

/** What the screens show today. */
export const C = SESSION_COPY.en
