'use client'
/**
 * Dev-only: look at pictures without clicking through a lesson. 404s in production, like /ui-preview.
 *   /lesson-preview                 one sample of every diagram kind
 *   /lesson-preview?module=g4m1     every screen, Screen 8, the twin and all 5 practice problems of every topic in a module,
 *                                   each with its text and answer — the page to LOOK at before a module ships.
 *   /lesson-preview?picker=1        the parent's topic picker with a stand-in save (the real page needs a signed-in parent).
 */
import { Suspense } from 'react'
import { notFound, useSearchParams } from 'next/navigation'
import { Pic, INK, PAGE_BG, LESSON_KEYFRAMES } from '@/features/lessons/Pictures'
import { findModule } from '@/features/lessons/modules'
import { TopicPicker } from '@/features/lessons/TopicPicker'
import { solutionOf, showAnswer, stepsOf, type Picture, type Problem } from '@/features/lessons/script'

const SAMPLES: [string, Picture][] = [
  ['bars', { kind: 'bars', bars: [{ parts: 2, shaded: 1, label: '1/2', split: 2 }, { parts: 4, shaded: 1, shade2: 2, label: '3/4' }] }],
  ['tape', { kind: 'tape', rows: [{ label: 'Red', cells: [{ w: 1, text: '4', shade: true }, { w: 1, text: '4', shade: true }, { w: 1, text: '4', shade: true }] }, { label: 'Blue', cells: [{ w: 1, text: '4' }, { w: 1, text: '4' }], brace: '20 marbles' }] }],
  ['numline fractions', { kind: 'numline', min: 0, max: 1, ticks: 4, labels: ['0', '1/4', '2/4', '3/4', '1'], points: [{ at: 0.75 }], jumps: [{ from: 0, to: 0.25 }, { from: 0.25, to: 0.5 }, { from: 0.5, to: 0.75 }] }],
  ['numline ray', { kind: 'numline', min: -5, max: 5, ticks: 10, ray: { from: 2, dir: 'left', open: true } }],
  ['clock', { kind: 'clock', h: 7, m: 35, fives: true }],
  ['ruler', { kind: 'measure', tool: 'ruler', max: 6, step: 0.25, labelEvery: 1, value: 3.5, unit: 'inches' }],
  ['scale', { kind: 'measure', tool: 'scale', max: 10, step: 1, labelEvery: 2, value: 7, unit: 'kg' }],
  ['jug', { kind: 'measure', tool: 'jug', max: 1000, step: 100, labelEvery: 200, value: 600, unit: 'mL' }],
  ['thermometer', { kind: 'measure', tool: 'thermometer', min: -10, max: 30, step: 5, labelEvery: 10, value: -5, unit: '°C' }],
  ['blocks', { kind: 'blocks', hundreds: 2, tens: 3, ones: 12, trade: 'ones' }],
  ['columns', { kind: 'columns', rows: ['348', '275'], op: '+', carry: '11 ', answer: null, places: ['H', 'T', 'O'] }],
  ['longdiv', { kind: 'longdiv', divisor: '4', dividend: '96', quotient: '24', work: ['−8 ', ' 16', '−16', '  0'] }],
  ['grid L-shape', { kind: 'grid', rows: 5, cols: 6, hide: [{ r: 0, c: 3, h: 2, w: 3 }], shade: [{ r: 2, c: 0, h: 3, w: 6, tone: 2 }], top: '6 ft', left: '5 ft', split: { row: 2 } }],
  ['area model', { kind: 'area', cols: ['10', '6'], rows: ['3'], cells: [['30', '18']], widths: [10, 6] }],
  ['poly triangle', { kind: 'poly', shapes: [{ pts: [[0, 0], [4, 0], [0, 3]], sides: ['4 cm', '?', '3 cm'], right: [0] }] }],
  ['poly transform', { kind: 'poly', grid: true, shapes: [{ pts: [[1, 1], [3, 1], [1, 3]], tone: 1 }, { pts: [[5, 1], [7, 1], [5, 3]], tone: 2, dashed: true }], segs: [{ a: [2, 2], b: [5.5, 2], arrow: 'end', tone: 2, label: '4 right' }] }],
  ['poly circle', { kind: 'poly', shapes: [], circles: [{ c: [0, 0], r: 3, label: 'r = 3', show: 'r' }] }],
  ['angle protractor', { kind: 'angle', deg: 130, protractor: true }],
  ['angle parts', { kind: 'angle', deg: 90, parts: [35, 55] }],
  ['chart bar', { kind: 'chart', type: 'bar', labels: ['Mon', 'Tue', 'Wed', 'Thu'], values: [4, 7, 3, 6], scale: 1, yLabel: 'Books' }],
  ['chart picture', { kind: 'chart', type: 'picture', labels: ['Apples', 'Pears', 'Plums'], values: [6, 3, 8], scale: 2, unit: 'fruits' }],
  ['chart dot', { kind: 'chart', type: 'dot', labels: ['1', '1 1/2', '2', '2 1/2', '3'], values: [1, 3, 2, 0, 1], xLabel: 'Length (inches)' }],
  ['plot', { kind: 'plot', points: [[1, 2], [2, 3], [3, 5], [4, 4], [5, 6], [6, 7]], xMax: 8, yMax: 8, fit: [[0, 1], [8, 9]], xLabel: 'Hours', yLabel: 'Score' }],
  ['coord', { kind: 'coord', min: -5, max: 5, points: [{ x: 2, y: 3, label: '(2, 3)' }], lines: [{ a: [0, 1], b: [2, 3], extend: true }, { a: [0, 1], b: [2, 1], dashed: true, label: 'run 2', tone: 2 }] }],
  ['table', { kind: 'table', head: ['Cups of flour', '1', '2', '3'], rows: [['Cookies', '12', '24', '?']], rowHead: true }],
  ['cubes', { kind: 'cubes', l: 4, w: 3, h: 2, layers: 1 }],
  ['cubes full', { kind: 'cubes', l: 3, w: 2, h: 3 }],
  ['solid cylinder', { kind: 'solid', shape: 'cylinder', labels: { r: '3 cm', h: '10 cm' } }],
  ['solid prism', { kind: 'solid', shape: 'prism', labels: { l: '8 m', w: '3 m', h: '4 m' } }],
  ['chips', { kind: 'chips', pos: 3, neg: 5, pairs: 3 }],
  ['balance', { kind: 'balance', left: 'x + 4', right: '9' }],
  ['spinner', { kind: 'spinner', parts: ['A', 'B', 'C', 'D'] }],
  ['eq lines', { kind: 'eq', text: '3x + 5 = 20', lines: ['3x = 15', 'x = 5'] }],
]

export default function LessonPreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound()   // dev scaffolding — 404 in the shipped app
  return <Suspense fallback={null}><style>{LESSON_KEYFRAMES}</style><Preview /></Suspense>
}

const card = { background: '#fff', border: `4px solid ${INK}`, borderRadius: 18, padding: 12, display: 'flex', flexDirection: 'column', gap: 10, '--lp-u': '26px' } as React.CSSProperties

function Preview() {
  const params = useSearchParams()
  if (params.get('picker')) {
    return <TopicPicker childName="Ava" initial={['g4m2-t1', 'g4m2-t3']} canEdit onBack={() => history.back()}
      onSave={async ids => { console.log('[preview] save', ids); return params.get('picker') === 'notready' ? 'not_ready' : 'ok' }} />
  }
  const m = findModule(params.get('module'))
  if (!m) {
    return (
      <div style={{ background: PAGE_BG, minHeight: '100dvh', padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {SAMPLES.map(([name, p]) => <div key={name} data-kind={p.kind} style={card}><b>{name}</b><Pic p={p} /></div>)}
      </div>
    )
  }
  const prob = (label: string, x: Problem) => (
    <div style={card}>
      <b>{label}</b><span>{x.text}</span><Pic p={x.picture} />
      <small>Answer: <b>{showAnswer(solutionOf(x))}</b> · {stepsOf(x).join(' → ')}</small>
    </div>
  )
  return (
    <div style={{ background: PAGE_BG, minHeight: '100dvh', padding: 16 }}>
      <h1>Grade {m.grade} · Module {m.n}: {m.title}</h1>
      {m.lessons.map(l => (
        <section key={l.id} id={l.id} style={{ marginBottom: 40 }}>
          <h2>{l.id} · {l.title}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 14 }}>
            {l.screens.map((s, i) => <div key={i} style={card}><b>Screen {i + 1}: {s.title}</b><span>{s.text}</span>{s.pictures.map((p, k) => <Pic key={k} p={p} />)}</div>)}
            {prob('Screen 8', l.turn)}
            {prob('Twin', l.turn.twin)}
            {l.practice.map((x, i) => <div key={i}>{prob(`Practice ${i + 1} · ${x.why}`, x.problem)}</div>)}
          </div>
        </section>
      ))}
    </div>
  )
}
