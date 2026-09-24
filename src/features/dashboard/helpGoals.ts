import { BILLING_LIVE } from '@/app/legal/registry'
import type { Tour } from './Helpers'
import { makeT, type Lang } from './i18n'

/** "Show me how": step-by-step walkthroughs on the real screens (under Help), grouped. Founder, 2026-09-21: EVERY
 *  thing an adult can do on the dashboard has one here — add a walkthrough when you add a thing to do. */
export function helpGoals({ tea, paid, c, k, lang = 'en' }: { tea: boolean; paid: boolean; c?: string; k?: string; lang?: Lang }): { h: string; items: { t: string; d: string; tour: Tour }[] }[] {
  const t = makeT(tea ? 'en' : lang)   // a teacher's dashboard is English only (founder, 2026-09-22)
  const reminders = { t: t('Choose which reminders I get'), d: t('Read them, snooze one, or turn a kind off.'), tour: { title: t('Reminders'), steps: [
    { url: '/parent', target: 'bell', title: t('Your reminders'), text: t('Everything worth a look waits under the bell. ⋯ on one snoozes or hides it.') },
    { url: '/parent?view=account', target: 'reminders-card', title: t('Turn a kind on or off'), text: t('Switch off anything you don’t want pointed out. Saved on this device.') }] } }
  const plan = { t: tea ? 'See my plan' : t('See my plan and billing'), d: tea ? 'Free or paid, and what your students get.' : t('What you pay and what you get.'), tour: { title: t('Your plan'), steps: [
    { url: '/parent?view=account', target: 'plan-card', title: t('Your plan'), text: tea ? 'Paid: students get modules and exercises. Free: exercises only.' : t('See plans shows each plan and its price.') }] } }
  const close = { t: t('Close my account'), d: tea ? 'Delete the account and every student profile in it.' : t('Delete the account and every child profile in it.'), tour: { title: t('Close my account'), steps: [
    { url: '/parent?view=account', target: 'close-card', title: t('Close your account'), text: t('It asks you to confirm first, and it cannot be undone.') }] } }
  if (tea) return [
    { h: 'Getting started', items: [
      { t: 'Set up a new class', d: 'Make the class, add students, choose lessons.', tour: { title: 'Set up a new class', steps: [
        { url: '/parent', target: 'new-class', title: 'Make a class', text: 'Give it a name and a grade.' },
        ...(k ? [{ url: `/parent?class=${k}&tab=students`, target: 'add-students', title: 'Add your students', text: 'Upload a list of usernames. Everyone gets a temporary password you can print.' },
                 { url: `/parent?class=${k}&tab=lessons`, target: 'tab-lessons', title: 'Choose the class’s lessons', text: 'Tick modules. Students added later get them too.' }] : [])] } },
    ] },
    ...(k ? [
      { h: 'Students', items: [
        { t: 'Add more students', d: 'One at a time, or a list of usernames.', tour: { title: 'Add more students', steps: [
          { url: `/parent?class=${k}&tab=students`, target: 'add-students', title: 'Add students', text: 'Each new student gets a temporary password, and the class’s modules.' }] } },
        { t: 'Help a student who can’t sign in', d: 'Give them a new temporary password.', tour: { title: 'Help a student sign in', steps: [
          { url: `/parent?class=${k}&tab=students`, target: 'roster', title: 'Find them in the list', text: '“New password” gives them a temporary one; they choose their own at first sign-in. “Set up login” for anyone without one.' }] } },
        { t: 'Look at one student', d: 'Their progress, lessons and due dates.', tour: { title: 'Look at one student', steps: [
          { url: `/parent?class=${k}&tab=students`, target: 'roster', title: 'Tap a name', text: 'Their own page: progress, the lessons they see, due dates and their login.' }] } },
      ] },
      { h: 'Lessons and tests', items: [
        { t: 'Choose what my class learns', d: 'Pick the class’s modules.', tour: { title: 'Choose the class’s lessons', steps: [
          { url: `/parent?class=${k}&tab=lessons`, target: paid ? 'lessons-what' : 'tab-lessons', title: 'The class’s modules', text: paid ? '“Change” to tick modules from any grade. Every student in the class gets them.' : 'On the free plan students see the class exercises only; modules come with the classroom plan.' }] } },
        { t: 'Give my class a test', d: 'Make an exercise, unlock it, read the results.', tour: { title: 'Give my class a test', steps: [
          { url: `/parent?class=${k}&tab=exercises`, target: 'exercises', title: 'Exercises', text: 'Make one (module, level, how many questions). It stays locked until you tap “Unlock for the class”; “Lock again” closes it.' },
          { url: `/parent?class=${k}&tab=exercises`, target: 'exercises', title: 'Read the results', text: 'Each exercise shows every student’s score and how each question went. “Remove” deletes it.' }] } },
        { t: 'Find who is stuck', d: 'Topics the class finds hard, and who.', tour: { title: 'Find who is stuck', steps: [
          { url: `/parent?class=${k}&tab=progress`, target: 'tab-progress', title: 'Progress', text: 'Pick a student to see what they find hard.' }] } },
      ] },
      { h: 'Class settings', items: [
        { t: 'Rename or delete a class', d: 'Students keep their logins and lessons.', tour: { title: 'Rename or delete a class', steps: [
          { url: `/parent?class=${k}&tab=settings`, target: 'tab-settings', title: 'Settings', text: 'Change the class name, or delete the class. Its students stay, just not in a class.' }] } },
      ] },
    ] : []),
    { h: 'Your account', items: [reminders, plan, close] },
  ]
  return [
    { h: t('Getting started'), items: [
      { t: t('Set up a new child'), d: t('Add them, give them a login, choose their lessons.'), tour: { title: t('Set up a new child'), steps: [
        { url: '/parent', target: 'add-child', title: t('Add a child'), text: t('Their name, and the modules they should see.') },
        ...(c ? [{ url: `/parent?child=${c}&tab=login`, target: 'login-card', title: t('Give them a login'), text: t('With a username and password they can sign in on any device, on their own.') },
                 { url: `/parent?child=${c}&tab=lessons`, target: 'lessons-what', title: t('Choose what they learn'), text: t('Tap “Change” and tick modules or single topics, from any grade.') },
                 { url: `/parent?child=${c}&tab=game`, target: 'game-card', title: t('Game time (optional)'), text: t('They earn minutes of the game by practicing. It starts on, at 20 minutes a day; turn it off or change the limit here.') }] : [])] } },
      ...(c ? [{ t: t('Let my child start learning here'), d: t('Open their lessons on this device.'), tour: { title: t('Start learning'), steps: [
        { url: `/parent?child=${c}`, target: 'start-learning', title: t('Start learning'), text: t('Opens their lessons on this device. On their own device they sign in with their login instead.') }] } }] : []),
    ] },
    ...(c ? [
      { h: t('Lessons and progress'), items: [
        { t: t('See how my child is doing'), d: t('Progress, and what they find hard.'), tour: { title: t('See how they’re doing'), steps: [
          { url: '/parent', target: `child-${c}`, title: t('Every child has a card'), text: t('Their next lesson and how far along they are.') },
          { url: `/parent?child=${c}&tab=progress`, target: 'tab-progress', title: t('Their progress'), text: t('Lessons finished, topics mastered, and what they find hard.') }] } },
        { t: t('Change what my child learns'), d: t('Whole modules or single topics, any grade.'), tour: { title: t('Change what they learn'), steps: [
          { url: `/parent?child=${c}&tab=lessons`, target: 'lessons-what', title: t('What they see'), text: t('“Change” opens the list: tick whole modules or single topics from any grade, or give them every topic. Then Save.') }] } },
        { t: t('Give homework with a due date'), d: t('Pick a lesson and a day.'), tour: { title: t('Give homework'), steps: [
          { url: `/parent?child=${c}&tab=lessons`, target: 'lessons-what', title: t('Check they can see it'), text: t('“Change” adds a module or a single topic.') },
          { url: `/parent?child=${c}&tab=lessons`, target: 'lessons-due', title: t('Add a due date'), text: t('The lesson goes to the top of their list, with the date. It saves straight away.') }] } },
      ] },
      { h: t('Login and game time'), items: [
        { t: t('Give my child a login, or a new password'), d: t('So they can sign in on their own device.'), tour: { title: t('Their login'), steps: [
          { url: `/parent?child=${c}&tab=login`, target: 'login-card', title: t('Their login'), text: t('Set a username and password, or change them if they forgot.') }] } },
        { t: t('Set game time'), d: t('Turn it on or off, and the most minutes a day.'), tour: { title: t('Game time'), steps: [
          { url: `/parent?child=${c}&tab=game`, target: 'game-card', title: t('Game time'), text: t('They earn points by practicing and spend them on minutes of the game. You choose on/off and the daily limit.') }] } },
      ] },
      { h: t('Family and data'), items: [
        { t: t('Share with my partner'), d: t('Let another adult see the dashboard.'), tour: { title: t('Share with my partner'), steps: [
          { url: `/parent?child=${c}&tab=login`, target: 'share-card', title: t('Invite someone'), text: t('They get their own sign-in and see the child’s progress. When they accept, the child appears on their Home.') }] } },
        { t: t('Download or delete my child’s data'), d: t('See everything we store, or remove the profile.'), tour: { title: t('Your child’s data'), steps: [
          { url: `/parent?child=${c}&tab=login`, target: 'data-card', title: t('Their data'), text: t('Download a copy of everything stored about them, or delete their profile for good.') }] } },
      ] },
    ] : []),
    // No plan step while the beta is free: the card it points at is not shown (founder, 2026-09-24).
    { h: t('Your account'), items: BILLING_LIVE ? [reminders, plan, close] : [reminders, close] },
  ]
}
