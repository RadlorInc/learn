import { ImageResponse } from 'next/og'
import { APP_NAME, COMPANY } from '@/app/site'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = `${APP_NAME} by ${COMPANY} — adaptive math for grades 3 to 8`

/**
 * ⚠️ THIS REPLACES A 512×512 SQUARE, AND THE SHAPE WAS THE BUG.
 * `og:image` pointed at `/icons/icon-512.png` — the PWA icon. Every social card slot is 1.91:1, so
 * a square is letterboxed or cropped to a strip, and this is a product parents forward to each
 * other by link. The card now says the name, the promise and the grades at the size the slot is.
 *
 * ⚠️ It names Radlor, deliberately: a product name alone is easily lost in a crowded category, so
 * the card that travels furthest is the one place it can least afford to be unattributed.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(180deg, #FFF4D6 0%, #FCEAB6 100%)',
          color: '#3d2516',
          padding: 80,
        }}
      >
        <div style={{ fontSize: 36, letterSpacing: 6, color: '#F26B2C', textTransform: 'uppercase' }}>
          {`${APP_NAME} by ${COMPANY}`}
        </div>
        <div style={{ fontSize: 72, lineHeight: 1.15, maxWidth: 980 }}>
          Math lessons that adapt to your child.
        </div>
        <div style={{ fontSize: 30, color: '#7a6a55' }}>
          Grades 3 to 8 · No timer, no red crosses
        </div>
      </div>
    ),
    size,
  )
}
