import type { Metadata } from 'next'

/** A paid tester's link: token-bearing and never worth a search result. */
export const metadata: Metadata = { title: 'Radlic · tester', robots: { index: false, follow: false } }

export default function TestLayout({ children }: { children: React.ReactNode }) {
  return children
}
