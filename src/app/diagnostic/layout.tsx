import type { Metadata } from 'next'

/**
 * ⚠️ `diagnostic/page.tsx` IS `'use client'`, AND A CLIENT COMPONENT CANNOT EXPORT `metadata`.
 * So the highest-intent public page in the app — the free placement check, the one thing a parent
 * actually searches for — was inheriting the root's title and description and declaring no
 * canonical at all. To search engines it was not a distinct page. This layout is the only place
 * that can fix that without turning the page into a server component.
 */
export const metadata: Metadata = {
  title: 'Free maths placement check',
  description:
    'A ten-minute check that finds the deepest gap under your child’s maths — not the newest thing they got wrong. No account needed, no timer, no score. Ages 3 to 18.',
  alternates: { canonical: '/diagnostic' },
}

export default function DiagnosticLayout({ children }: { children: React.ReactNode }) {
  return children
}
