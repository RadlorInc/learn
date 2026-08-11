'use client'
/**
 * The six shapes, their paths and colours, and the SVG that draws one — shared by
 * ShapeTown's shape sorter. All that survives of the pre-story-rebuild shapes lesson.
 */
import React from 'react'

export type ShapeName = 'circle' | 'square' | 'triangle' | 'rectangle' | 'star' | 'heart'
export interface Shape { name: ShapeName; label: string; path: string; fact: string }

export const SHAPES: Record<ShapeName, Shape> = {
  circle:    { name:'circle',    label:'circle',    path:'M50,10 a40,40 0 1,0 0.001,0 Z',                                   fact:'A circle is round, with no corners.' },
  square:    { name:'square',    label:'square',    path:'M10,10 h80 v80 h-80 Z',                                            fact:'A square has four equal sides and four corners.' },
  triangle:  { name:'triangle',  label:'triangle',  path:'M50,5 L95,95 L5,95 Z',                                             fact:'A triangle has three sides, like a roof.' },
  rectangle: { name:'rectangle', label:'rectangle', path:'M5,25 h90 v50 h-90 Z',                                             fact:'A rectangle has two long sides and two short sides.' },
  star:      { name:'star',      label:'star',      path:'M50,5 l12,35 h37 l-30,22 11,35 L50,77 l-30,20 11-35 L1,40 h37 Z', fact:'A star has five pointy points.' },
  heart:     { name:'heart',     label:'heart',     path:'M50,85 C20,65 5,50 5,30 a20,20 0 0,1 45,-5 a20,20 0 0,1 45,5 C95,50 80,65 50,85 Z', fact:'A heart, the shape of love!' },
}
export const SHAPE_ORDER: ShapeName[] = ['circle','square','triangle','rectangle','star','heart']
export const COLORS: Record<ShapeName, string> = {
  circle:'#5BC3F0', square:'#F26B2C', triangle:'#6FBE3F',
  rectangle:'#9362D8', star:'#FFC933', heart:'#E64545',
}

/**
 * `socket` is the EMPTY version of a shape — a hole waiting for its piece, used by the shape-sorter
 * chapter. It REPLACED an `outline` variant (a hairline stroke, no fill) and the difference is the
 * whole reason it exists: a wireframe is the one thing a painted scene never contains, so an empty
 * outline read as a diagram laid over the garden rather than a part of it. A hole in the world is a
 * soft SHADOW with light catching its rim, and painted art is full of those.
 *
 * Same `path` as the solid piece either way, which is what keeps the sorter honest: a triangle is
 * matched against a real triangle by construction.
 */
export function ShapeSVG({ name, size = 96, socket = false }: {
  name: ShapeName; size?: number; socket?: boolean
}) {
  const s = SHAPES[name]
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <path d={s.path}
        fill={socket ? 'rgba(44,30,18,.30)' : COLORS[name]}
        stroke={socket ? 'rgba(255,252,244,.8)' : 'none'}
        strokeWidth={socket ? 4 : 0} strokeLinejoin="round" />
    </svg>
  )
}

