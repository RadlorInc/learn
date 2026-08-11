'use client'
/**
 * The 2D/3D shape vocabulary, and the SVG that draws one — shared by ShapeStudio.
 * All that survives of the pre-story-rebuild shapes lesson.
 */
import React from 'react'
import { shuffle } from '@/core/rand'

export const SHAPES_2D = ['circle', 'triangle', 'square', 'rectangle', 'pentagon', 'hexagon', 'star']
export const SHAPES_3D = ['cube', 'sphere', 'cone', 'cylinder']
const SIDES: Record<string, number> = { triangle: 3, square: 4, rectangle: 4, pentagon: 5, hexagon: 6 }
const EMOJI_3D: Record<string, string> = { cube: '🧊', sphere: '⚽', cone: '🍦', cylinder: '🥫' }
export function sidesOf(name: string): number | null { return SIDES[name] ?? null }
export function is3D(name: string): boolean { return SHAPES_3D.includes(name) }

const poly = (n: number, cx: number, cy: number, r: number, rot = -90) =>
  Array.from({ length: n }, (_, i) => { const a = (rot + i * 360 / n) * Math.PI / 180; return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}` }).join(' ')
const starPts = (cx: number, cy: number, ro: number, ri: number) =>
  Array.from({ length: 10 }, (_, i) => { const r = i % 2 === 0 ? ro : ri; const a = (-90 + i * 36) * Math.PI / 180; return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}` }).join(' ')

export function ShapeView({ name, size = 120 }: { name: string; size?: number }) {
  if (is3D(name)) return <span style={{ fontSize: size * 0.92, lineHeight: 1 }}>{EMOJI_3D[name]}</span>
  const s = size, cx = s / 2, cy = s / 2, r = s * 0.42
  const fill = 'var(--milo-orange)', stroke = 'var(--outline)', sw = 4
  let el: React.ReactNode = null
  if (name === 'circle') el = <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={sw} />
  else if (name === 'square') el = <rect x={cx - r} y={cy - r} width={2 * r} height={2 * r} rx={6} fill={fill} stroke={stroke} strokeWidth={sw} />
  else if (name === 'rectangle') el = <rect x={s * 0.08} y={s * 0.26} width={s * 0.84} height={s * 0.48} rx={6} fill={fill} stroke={stroke} strokeWidth={sw} />
  else if (name === 'triangle') el = <polygon points={poly(3, cx, cy + 6, r)} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
  else if (name === 'pentagon') el = <polygon points={poly(5, cx, cy, r)} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
  else if (name === 'hexagon') el = <polygon points={poly(6, cx, cy, r, 0)} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
  else if (name === 'star') el = <polygon points={starPts(cx, cy, r, r * 0.45)} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
  return <svg viewBox={`0 0 ${s} ${s}`} width={size} height={size} style={{ maxWidth: '72vw' }}>{el}</svg>
}

export function buildNameChoices(answer: string, pool: string[]): string[] {
  const opts = new Set<string>([answer])
  for (const v of shuffle(pool)) { if (opts.size >= 3) break; if (v !== answer) opts.add(v) }
  // shuffle(), not sort(() => Math.random() - 0.5): `answer` goes into the Set FIRST, and a
  // random comparator barely moves the leading elements, so the correct chip sat in position 0
  // far more often than a third of the time.
  return shuffle([...opts])
}
