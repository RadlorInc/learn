import type { Tour } from './Helpers'

/** "Show me how": step-by-step walkthroughs on the real screens (under Help), grouped. Founder, 2026-09-21: EVERY
 *  thing an adult can do on the dashboard has one here — add a walkthrough when you add a thing to do. */
export function helpGoals({ tea, paid, c, k }: { tea: boolean; paid: boolean; c?: string; k?: string }): { h: string; items: { t: string; d: string; tour: Tour }[] }[] {
  const reminders = { t: 'Choose which reminders I get', d: 'Read them, snooze one, or turn a kind off.', tour: { title: 'Reminders', steps: [
    { url: '/parent', target: 'bell', title: 'Your reminders', text: 'Everything worth a look waits under the bell. ⋯ on one snoozes or hides it.' },
    { url: '/parent?view=account', target: 'reminders-card', title: 'Turn a kind on or off', text: 'Switch off anything you don’t want pointed out. Saved on this device.' }] } }
  const plan = { t: tea ? 'See my plan' : 'See my plan and billing', d: tea ? 'Free or paid, and what your students get.' : 'What you pay and what you get.', tour: { title: 'Your plan', steps: [
    { url: '/parent?view=account', target: 'plan-card', title: 'Your plan', text: tea ? 'Paid: students get modules and exercises. Free: exercises only.' : 'See plans shows each plan and its price.' }] } }
  const close = { t: 'Close my account', d: `Delete the account and every ${tea ? 'student' : 'child'} profile in it.`, tour: { title: 'Close my account', steps: [
    { url: '/parent?view=account', target: 'close-card', title: 'Close your account', text: 'It asks you to confirm first, and it cannot be undone.' }] } }
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
          { url: `/parent?class=${k}&tab=students`, target: 'roster', title: 'Find them in the list', text: '“New password” gives them a temporary one; they choose their own at first sign-in. “Set a login” for anyone without one.' }] } },
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
    { h: 'Getting started', items: [
      { t: 'Set up a new child', d: 'Add them, give them a login, choose their lessons.', tour: { title: 'Set up a new child', steps: [
        { url: '/parent', target: 'add-child', title: 'Add a child', text: 'Their name, and the modules they should see.' },
        ...(c ? [{ url: `/parent?child=${c}&tab=login`, target: 'login-card', title: 'Give them a login', text: 'With a username and password they can sign in on any device, on their own.' },
                 { url: `/parent?child=${c}&tab=lessons`, target: 'lessons-what', title: 'Choose what they learn', text: 'Tap “Change” and tick modules or single topics, from any grade.' },
                 { url: `/parent?child=${c}&tab=game`, target: 'game-card', title: 'Game time (optional)', text: 'They earn minutes of the game by practising. It starts on, at 20 minutes a day; turn it off or change the limit here.' }] : [])] } },
      ...(c ? [{ t: 'Let my child start learning here', d: 'Open their lessons on this device.', tour: { title: 'Start learning', steps: [
        { url: `/parent?child=${c}`, target: 'start-learning', title: 'Start learning', text: 'Opens their lessons on this device. On their own device they sign in with their login instead.' }] } }] : []),
    ] },
    ...(c ? [
      { h: 'Lessons and progress', items: [
        { t: 'See how my child is doing', d: 'Progress, and what they find hard.', tour: { title: 'See how they’re doing', steps: [
          { url: '/parent', target: `child-${c}`, title: 'Every child has a card', text: 'Their next lesson and how far along they are.' },
          { url: `/parent?child=${c}&tab=progress`, target: 'tab-progress', title: 'Their progress', text: 'Lessons finished, topics mastered, and what they find hard.' }] } },
        { t: 'Change what my child learns', d: 'Whole modules or single topics, any grade.', tour: { title: 'Change what they learn', steps: [
          { url: `/parent?child=${c}&tab=lessons`, target: 'lessons-what', title: 'What they see', text: '“Change” opens the list: tick whole modules or single topics from any grade, or give them every topic. Then Save.' }] } },
        { t: 'Give homework with a due date', d: 'Pick a lesson and a day.', tour: { title: 'Give homework', steps: [
          { url: `/parent?child=${c}&tab=lessons`, target: 'lessons-what', title: 'Check they can see it', text: '“Change” adds a module or a single topic.' },
          { url: `/parent?child=${c}&tab=lessons`, target: 'lessons-due', title: 'Add a due date', text: 'The lesson goes to the top of their list, with the date. It saves straight away.' }] } },
      ] },
      { h: 'Login and game time', items: [
        { t: 'Give my child a login, or a new password', d: 'So they can sign in on their own device.', tour: { title: 'Their login', steps: [
          { url: `/parent?child=${c}&tab=login`, target: 'login-card', title: 'Their login', text: 'Set a username and password, or change them if they forgot.' }] } },
        { t: 'Set game time', d: 'Turn it on or off, and the most minutes a day.', tour: { title: 'Game time', steps: [
          { url: `/parent?child=${c}&tab=game`, target: 'game-card', title: 'Game time', text: 'They earn points by practising and spend them on minutes of the game. You choose on/off and the daily limit.' }] } },
      ] },
      { h: 'Family and data', items: [
        { t: 'Share with my partner', d: 'Let another adult see the dashboard.', tour: { title: 'Share with my partner', steps: [
          { url: `/parent?child=${c}&tab=login`, target: 'share-card', title: 'Invite someone', text: 'They get their own sign-in and see the child’s progress. When they accept, the child appears on their Home.' }] } },
        { t: 'Download or delete my child’s data', d: 'See everything we store, or remove the profile.', tour: { title: 'Your child’s data', steps: [
          { url: `/parent?child=${c}&tab=login`, target: 'data-card', title: 'Their data', text: 'Download a copy of everything stored about them, or delete their profile for good.' }] } },
      ] },
    ] : []),
    { h: 'Your account', items: [reminders, plan, close] },
  ]
}
