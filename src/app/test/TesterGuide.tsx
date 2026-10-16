/**
 * The "How to test" guide on /test for a KG–2 CHAPTER (founder, 2026-10-04: "proper instructions in the box, explained
 * with drawings"). A Grade 3–8 module's tester gets walkthroughs on the real controls instead (testerTours.ts, 8 Oct):
 * a drawing of the level row was tapped as if it were the row. Each step is a small drawing beside one or two sentences. Drawings are inline SVG in the lesson's own colours; no images to load.
 * It is open on the topic list and can be folded away (a <details>), so a returning tester is not made to scroll past it.
 */
import type { ReactNode } from 'react'
import { INK, TEAL, ON_TEAL } from '@/features/lessons/Pictures'

const YELLOW = '#fffbe8', GREY = '#c9d6e6', WHITE = '#fff'

type Step = { title: string; text: ReactNode; pic: ReactNode }

/** A rounded box, the shape every card and button in the lesson has. */
const Box = ({ x, y, w, h, fill = WHITE, r = 8, stroke = INK }: { x: number; y: number; w: number; h: number; fill?: string; r?: number; stroke?: string }) =>
  <rect x={x} y={y} width={w} height={h} rx={r} fill={fill} stroke={stroke} strokeWidth={3} />
const T = ({ x, y, children, size = 13, w = 700, fill = INK, anchor = 'middle' }: { x: number; y: number; children: ReactNode; size?: number; w?: number; fill?: string; anchor?: 'start' | 'middle' }) =>
  <text x={x} y={y} fontSize={size} fontWeight={w} fill={fill} textAnchor={anchor} fontFamily="inherit">{children}</text>
/** The review bar, as it looks at the bottom of every screen. */
const Bar = ({ y }: { y: number }) => <>
  <Box x={10} y={y} w={220} h={38} fill={YELLOW} />
  <Box x={18} y={y + 7} w={92} h={24} fill={TEAL} r={12} /><T x={64} y={y + 23} size={10} fill={ON_TEAL}>👍 Looks right</T>
  <Box x={116} y={y + 7} w={106} h={24} r={12} /><T x={169} y={y + 23} size={10}>⚠️ Something wrong</T>
</>
const Svg = ({ children, label }: { children: ReactNode; label: string }) =>
  <svg viewBox="0 0 240 150" role="img" aria-label={label} style={{ width: '100%', maxWidth: 240, height: 'auto', flexShrink: 0 }}>{children}</svg>

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

const CH_END: Step = {
  title: 'Play to the end',
  text: <>The end card asks about the chapter as a whole. Something wrong that was not on one screen — too long, too hard, boring? Write it there. Then the chapter shows <b>✓ done</b> on this page.</>,
  pic: <Svg label="The chapter's end card with stars, and the review bar">
    <Box x={40} y={8} w={160} h={88} r={14} /><T x={120} y={42} size={22}>⭐ ⭐ ⭐</T><T x={120} y={70} size={13}>All done! Nice work.</T>
    <Bar y={104} />
  </Svg>,
}
const CHAPTER_STEPS = [CH_PLAY, CH_STOP, REVIEW, CH_END]

export function TesterGuide() {
  const steps = CHAPTER_STEPS
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
