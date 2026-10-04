/**
 * The "How to test" guide on /test (founder, 2026-10-04: "proper instructions in the box, explained with drawings").
 * Each step is a small drawing of the thing the tester will actually see — the review bar, the locked Next, the Level
 * row — beside one or two plain sentences. Drawings are inline SVG in the lesson's own colours; no images to load.
 * It is open on the topic list and can be folded away (a <details>), so a returning tester is not made to scroll past it.
 */
import type { ReactNode } from 'react'
import { INK, TEAL, ON_TEAL } from '@/features/lessons/Pictures'

const YELLOW = '#fffbe8', GREY = '#c9d6e6', RED = '#c1121f', WHITE = '#fff'

type Step = { title: string; text: ReactNode; pic: ReactNode }

/** A rounded box, the shape every card and button in the lesson has. */
const Box = ({ x, y, w, h, fill = WHITE, r = 8, stroke = INK, dash }: { x: number; y: number; w: number; h: number; fill?: string; r?: number; stroke?: string; dash?: boolean }) =>
  <rect x={x} y={y} width={w} height={h} rx={r} fill={fill} stroke={stroke} strokeWidth={3} strokeDasharray={dash ? '6 5' : undefined} />
const T = ({ x, y, children, size = 13, w = 700, fill = INK, anchor = 'middle' }: { x: number; y: number; children: ReactNode; size?: number; w?: number; fill?: string; anchor?: 'start' | 'middle' }) =>
  <text x={x} y={y} fontSize={size} fontWeight={w} fill={fill} textAnchor={anchor} fontFamily="inherit">{children}</text>
/** The review bar, as it looks at the bottom of every screen. */
const Bar = ({ y, saved }: { y: number; saved?: boolean }) => <>
  <Box x={10} y={y} w={220} h={38} fill={YELLOW} />
  {saved
    ? <T x={20} y={y + 24} anchor="start">✓ Saved. Tap Next.</T>
    : <>
        <Box x={18} y={y + 7} w={92} h={24} fill={TEAL} r={12} /><T x={64} y={y + 23} size={10} fill={ON_TEAL}>👍 Looks right</T>
        <Box x={116} y={y + 7} w={106} h={24} r={12} /><T x={169} y={y + 23} size={10}>⚠️ Something wrong</T>
      </>}
</>
const Svg = ({ children, label }: { children: ReactNode; label: string }) =>
  <svg viewBox="0 0 240 150" role="img" aria-label={label} style={{ width: '100%', maxWidth: 240, height: 'auto', flexShrink: 0 }}>{children}</svg>

const SOUND: Step = {
  title: 'Sound on, then open a topic',
  text: <>Use headphones or turn the volume up. Every screen is read aloud — a wrong word or a cut-off sentence is a real problem, so listen as well as look.</>,
  pic: <Svg label="A phone with the sound turned up">
    <Box x={80} y={10} w={80} h={130} r={14} /><Box x={90} y={24} w={60} h={90} fill="#eaf5fe" r={6} />
    <path d="M104 62 h10 l12 -10 v32 l-12 -10 h-10 z" fill={INK} />
    <path d="M132 58 q8 10 0 20 M138 52 q14 16 0 32" stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />
    <T x={120} y={132} size={11}>🎧 sound on</T>
  </Svg>,
}
const PLAY: Step = {
  title: 'Let the screen play to the end',
  text: <>Don&apos;t rush. The review buttons appear only after the voice has finished (or, on a question, after you answer it). Watch the board being drawn and read every line.</>,
  pic: <Svg label="A lesson screen still playing; the review bar asks to wait">
    <Box x={10} y={10} w={220} h={86} /><T x={60} y={58} size={22}>1/2 = 2/4</T>
    <Box x={130} y={26} w={90} h={16} r={8} fill={GREY} stroke={GREY} /><Box x={130} y={50} w={60} h={16} r={8} fill={GREY} stroke={GREY} />
    <rect x={14} y={14} width={120} height={6} rx={3} fill={TEAL} />
    <Box x={10} y={104} w={220} h={38} fill={YELLOW} /><T x={120} y={128} size={11}>⏳ Let the screen play to the end…</T>
  </Svg>,
}
const REVIEW: Step = {
  title: 'Say if it is right',
  text: <><b>👍 Looks right</b> if everything is correct. <b>⚠️ Something is wrong</b> if anything is off — tap what kind (voice, text, picture, answer…) and write what it should be, e.g. <i>&quot;says 3 groups, picture shows 4&quot;</i>. At least 5 letters.</>,
  pic: <Svg label="The review bar with Looks right and Something is wrong, and a note being written">
    <Bar y={8} />
    <path d="M169 50 v12" stroke={INK} strokeWidth={3} markerEnd="url(#g-arrow)" />
    <defs><marker id="g-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill={INK} /></marker></defs>
    <Box x={10} y={68} w={220} h={74} fill={YELLOW} />
    <Box x={18} y={76} w={44} h={18} r={9} fill={TEAL} /><T x={40} y={89} size={10} fill={ON_TEAL}>Picture</T>
    <Box x={66} y={76} w={40} h={18} r={9} /><T x={86} y={89} size={10}>Voice</T>
    <Box x={18} y={100} w={204} h={34} r={6} /><T x={24} y={121} size={11} w={500} anchor="start">says 3 groups, picture shows 4|</T>
  </Svg>,
}
const NEXT: Step = {
  title: 'Then Next opens',
  text: <>Next stays grey until your review is saved. You can always go <b>← Back</b> to look again, or use <b>Change my review</b>.</>,
  pic: <Svg label="Next is grey before the review and blue after it">
    <Box x={14} y={22} w={96} h={40} r={12} fill={GREY} stroke={GREY} /><T x={62} y={47} size={14} fill="#7f93ad">Next 🔒</T>
    <T x={62} y={82} size={11} w={600}>before review</T>
    <path d="M114 42 h12" stroke={INK} strokeWidth={3} markerEnd="url(#g-arrow2)" />
    <defs><marker id="g-arrow2" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill={INK} /></marker></defs>
    <Box x={130} y={22} w={96} h={40} r={12} fill={TEAL} /><T x={178} y={47} size={14} fill={ON_TEAL}>Next ▶</T>
    <T x={178} y={82} size={11} w={600}>after review</T>
    <Bar y={104} saved />
  </Svg>,
}
const ANSWER: Step = {
  title: 'Answer like a real child',
  text: <>On &quot;Now you try&quot; and practice, solve it yourself. Try one <b>wrong answer on purpose</b> sometimes — check the hint and the worked steps are right too. Your answers are saved with your review.</>,
  pic: <Svg label="A practice problem with an answer box and a Check button">
    <Box x={10} y={10} w={220} h={34} /><T x={120} y={32} size={13}>What goes in the box? 1/2 = 3/?</T>
    <Box x={30} y={56} w={70} h={40} /><T x={65} y={83} size={20}>6</T>
    <Box x={120} y={56} w={90} h={40} r={12} fill={TEAL} /><T x={165} y={81} size={14} fill={ON_TEAL}>Check</T>
    <Box x={10} y={106} w={220} h={36} fill="#eaf5fe" /><T x={20} y={128} size={11} w={600} anchor="start">Here&apos;s how this one works: 1. …</T>
  </Svg>,
}
const LEVELS: Step = {
  title: 'Practice: test every level',
  text: <>Practice questions come in levels, easy (<b>L1</b>) to hard (L5 on most topics). Tap a level to get a question from it. Do <b>at least 2 questions at every level</b>, then tap <b>Finish practice</b>. Is a hard level really harder? Is the answer ever wrong?</>,
  pic: <Svg label="The Level row, L1 to L5, with L3 chosen">
    <T x={14} y={30} anchor="start" size={13}>Level</T>
    {[0, 1, 2, 3, 4].map(i => <g key={i}>
      <Box x={58 + i * 36} y={14} w={30} h={24} r={12} fill={i === 2 ? TEAL : WHITE} />
      <T x={73 + i * 36} y={31} size={11} fill={i === 2 ? ON_TEAL : INK}>L{i + 1}</T>
    </g>)}
    {[0, 1, 2, 3, 4].map(i => <g key={`c${i}`}>
      <T x={73 + i * 36} y={60} size={13} fill={i < 3 ? '#1f7a43' : RED}>{i < 3 ? '✓✓' : '—'}</T>
    </g>)}
    <T x={120} y={82} size={11} w={600}>✓✓ = 2 questions checked at that level</T>
    <Box x={60} y={98} w={120} h={36} r={12} /><T x={120} y={121} size={13}>Finish practice</T>
  </Svg>,
}
const DONE: Step = {
  title: 'Finish the topic',
  text: <>The last screen (9) gets a review too — then the topic shows <b>✓ done</b> on this list. Go through every topic. Your progress is saved, so you can stop and come back with the same link.</>,
  pic: <Svg label="The topic list with one topic done">
    {['Plates of cookies', 'Rows of chairs', 'Turn the tray'].map((t, i) => <g key={t}>
      <Box x={10} y={10 + i * 44} w={220} h={36} r={12} fill={i === 0 ? TEAL : WHITE} />
      <T x={22} y={33 + i * 44} size={12} anchor="start" fill={i === 0 ? ON_TEAL : INK}>{t}</T>
      <text x={220} y={33 + i * 44} fontSize={11} fontWeight={700} textAnchor="end" fill={i === 0 ? ON_TEAL : INK}>{i === 0 ? '✓ done' : i === 1 ? '4 screens' : 'not started'}</text>
    </g>)}
  </Svg>,
}

// ── a KG–2 chapter ───────────────────────────────────────────────────────────────────────────────────────────
const CH_PLAY: Step = {
  title: 'Play it like a 4–7 year old',
  text: <>Sound on, phone sideways if it asks. Tap the way a young child would — big taps, sometimes the wrong thing. Does every tap work? Is every word clear?</>,
  pic: <Svg label="A phone held sideways with a story scene">
    <Box x={20} y={30} w={200} h={100} r={14} /><Box x={32} y={40} w={176} h={80} fill="#dff0c8" r={6} />
    <circle cx={80} cy={88} r={12} fill={TEAL} stroke={INK} strokeWidth={3} /><circle cx={120} cy={88} r={12} fill={WHITE} stroke={INK} strokeWidth={3} /><circle cx={160} cy={88} r={12} fill={WHITE} stroke={INK} strokeWidth={3} />
    <T x={120} y={60} size={12}>How many now?</T><T x={120} y={22} size={11}>🎧 sound on · ↻ sideways</T>
  </Svg>,
}
const CH_STOP: Step = {
  title: 'It stops after every step',
  text: <>After the intro, after <b>every question</b> and after every explanation, the chapter pauses and the yellow bar asks if it was right. While it is up, the chapter cannot be tapped.</>,
  pic: <Svg label="The chapter paused under a cover, with the review bar">
    <Box x={10} y={10} w={220} h={86} fill="#dff0c8" />
    <rect x={10} y={10} width={220} height={86} rx={8} fill={INK} opacity={0.12} />
    <T x={120} y={58} size={13}>⏸ paused for your review</T>
    <Bar y={104} />
  </Svg>,
}

const LESSON_STEPS = [SOUND, PLAY, REVIEW, NEXT, ANSWER, LEVELS, DONE]
const CH_END: Step = {
  title: 'Play to the end',
  text: <>The end card asks about the chapter as a whole. Something wrong that was not on one screen — too long, too hard, boring? Write it there. Then the chapter shows <b>✓ done</b> on this page.</>,
  pic: <Svg label="The chapter's end card with stars, and the review bar">
    <Box x={40} y={8} w={160} h={88} r={14} /><T x={120} y={42} size={22}>⭐ ⭐ ⭐</T><T x={120} y={70} size={13}>All done! Nice work.</T>
    <Bar y={104} />
  </Svg>,
}
const CHAPTER_STEPS = [CH_PLAY, CH_STOP, REVIEW, CH_END]

export function TesterGuide({ chapter }: { chapter: boolean }) {
  const steps = chapter ? CHAPTER_STEPS : LESSON_STEPS
  return (
    <details open style={{ background: WHITE, border: `4px solid ${INK}`, borderRadius: 18, padding: 14, color: INK }}>
      <summary style={{ fontSize: 20, fontWeight: 800, cursor: 'pointer' }}>How to test ({steps.length} steps)</summary>
      <p style={{ margin: '8px 0 4px', fontSize: 16, lineHeight: 1.5 }}>
        You are checking that every screen is <b>correct</b> — the maths, the words, the voice and the pictures. Your review of each
        screen is how we know what to fix, so a specific note is worth more than many 👍.
      </p>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {steps.map((s, i) => (
          <li key={s.title} style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', borderTop: i ? `2px solid ${GREY}` : 'none', paddingTop: i ? 12 : 4 }}>
            {s.pic}
            <div style={{ flex: '1 1 260px', minWidth: 0 }}>
              <b style={{ fontSize: 18 }}>{i + 1}. {s.title}</b>
              <p style={{ margin: '4px 0 0', fontSize: 16, lineHeight: 1.5 }}>{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </details>
  )
}
