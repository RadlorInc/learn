import { createContext } from 'react'

/**
 * ONE TAKE = 5 QUESTIONS (founder, 2026-09-25: the lessons' checkpoint for KG–2, "5 questions only in one take", no
 * Keep going / Take a break). After the 5th answer of a sitting the chapter stops and says the spot is saved; the saved
 * resume point (written after every answer) opens the next sitting at question 6 of the same run. The run still ends —
 * and the chapter counts as done — at `beat.rounds`, or on the mastery exit, exactly as before.
 * The chapter's host provides the handler; with none (the /story preview) a run plays straight through.
 */
export const CHAPTER_TAKE = 5
export const ChapterTakeContext = createContext<((answered: number) => void) | null>(null)
