'use client'
/**
 * SceneImage — a friendly scenario illustration used across a teen chapter to
 * anchor its real-world story (in the CaseCard opener, the Explore header, and
 * the mastery card). Warm flat-illustration art that sits on the paper theme.
 * One image per chapter lives in /public/assets/teen/scene_<chapter>.png.
 *
 * This is the small piece that makes the band feel like a friendly product and
 * not a bare drill — every chapter reuses it, so the look stays consistent.
 */
import Image from 'next/image'

export interface SceneImageProps {
  /** chapter id, e.g. "percentages" → /assets/teen/scene_percentages.png */
  chapter: string
  alt: string
  /** rendered height in px (width scales, capped by maxWidth) */
  height?: number
  maxWidth?: number
}

export default function SceneImage({ chapter, alt, height = 150, maxWidth = 440 }: SceneImageProps) {
  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth, height }}>
        <Image
          src={`/assets/teen/scene_${chapter}.png`}
          alt={alt}
          fill
          sizes="440px"
          style={{ objectFit: 'contain' }}
          priority={false}
        />
      </div>
    </div>
  )
}
