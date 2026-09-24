import Link from 'next/link'

/**
 * What every route that used to open a legacy chapter shows while `LEGACY_CHAPTERS_HIDDEN` is on
 * (see src/core/chapters.ts). One screen so the wording and the way back live in one place.
 */
export function NewLessonsSoon({ back = '/parent', label = 'Back' }: { back?: string; label?: string }) {
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 14, padding: 24, textAlign: 'center', background: '#FCEAB6',
    }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 30, color: '#3d2516', margin: 0 }}>
        New lessons are on the way
      </h1>
      <p style={{ fontSize: 17, lineHeight: 1.5, color: '#5b4c39', margin: 0, maxWidth: 440 }}>
        We are rebuilding every chapter in a new step-by-step format. They will appear here as soon as they are ready.
      </p>
      <Link href={back} style={{
        minHeight: 48, display: 'inline-flex', alignItems: 'center', background: '#F26B2C', color: '#fff',
        borderRadius: 50, padding: '12px 28px', fontWeight: 800, textDecoration: 'none',
      }}>{label}</Link>
    </div>
  )
}
