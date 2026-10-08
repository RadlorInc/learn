/**
 * The paid tester's walkthroughs (founder, 2026-10-08): a spotlight on the REAL control and a card saying what to do
 * there — the dashboard's TourRunner, not pictures of buttons. A tester on a phone tapped the old guide's drawing of the
 * level row and reported "L4 will not open". Each walkthrough runs once by itself where it first applies, and again from
 * "Show me how" (topic list) or "How this works" (the review bar). Targets are `data-tour` keys on /test and in
 * LessonPlayer's review mode; `testerTours.test.ts` checks each one is rendered.
 */
import type { Tour } from '@/features/dashboard/Helpers'

export type TourName = 'list' | 'lesson' | 'question' | 'practice'

export const TESTER_TOURS: Record<TourName, Tour> = {
  list: { title: 'How to test', steps: [
    { target: 'tester-help', title: 'Sound on', text: 'Every screen is read aloud. Android and no sound? In Chrome: the icon left of the address → Permissions → Sound → Allow.' },
    { target: 'tester-topic', title: 'Open a topic', text: 'Start here and go in order. Each line shows how far you are, then ✓ done. Your progress is saved.' },
  ] },
  lesson: { title: 'Review each screen', steps: [
    { target: 'tester-bar', title: 'Let it play, then review', text: 'Listen to the end. Then 👍 Looks right, or ⚠️ Something is wrong: say what is wrong and what it should be.' },
    { target: 'tester-next', title: 'Next opens after your review', text: 'It stays grey until your review is saved. ← Back lets you look again.' },
  ] },
  question: { title: 'Answer like a real child', steps: [
    { target: 'tester-answer', title: 'Solve it yourself', text: 'Type your answer and tap Check. Sometimes answer wrong on purpose, to check the hints and steps.' },
    { target: 'tester-bar', title: 'Then review it', text: 'Once it is answered, review it here. Your answer is saved with your review.' },
  ] },
  practice: { title: 'Practice: every level', steps: [
    { target: 'tester-levels', title: 'These are the level buttons', text: 'Tap a level BEFORE you answer to get a question from it. After an answer, tap Next problem first.' },
    { target: 'tester-count', title: '2 questions at every level', text: 'This line counts them: L1 2/2 · L2 1/2 … Only this line counts levels.' },
    { target: 'tester-finish', title: 'Then finish', text: 'It opens when every level has 2. It leads to screen 9: review that too, and the topic is ✓ done.' },
  ] },
}

/** The walkthrough for a review key: '1'–'7' teaching, '8' / '8-twin' Now you try, 'p1'… practice; none for '9'. */
export const tourFor = (screen: string): TourName | null =>
  screen === '9' ? null : screen.startsWith('p') ? 'practice' : screen.startsWith('8') ? 'question' : 'lesson'

const KEY = 'radlic-tester-tour:'
const shown = new Set<TourName>()
/** Seen once on this device. Storage can throw or be empty (private window): then once per page load instead. */
export function firstTime(name: TourName): boolean {
  if (shown.has(name)) return false
  shown.add(name)
  try {
    if (localStorage.getItem(KEY + name)) return false
    localStorage.setItem(KEY + name, '1')
  } catch {}
  return true
}
