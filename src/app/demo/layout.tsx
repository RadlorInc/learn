import type { Metadata } from 'next'

/**
 * /demo is a thin legacy page ("New lessons are on the way" while `LEGACY_CHAPTERS_HIDDEN`) that inherited the home
 * title and description and was indexable (SEO-04). It is `'use client'`, so it cannot export `metadata` itself.
 * Only `robots` is set: Next merges shallowly, so everything else is still inherited from the root.
 */
export const metadata: Metadata = { robots: { index: false } }

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children
}
