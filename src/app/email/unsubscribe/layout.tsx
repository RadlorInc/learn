import type { Metadata } from 'next'

/** Reached from a commercial email's footer: token-bearing, and never worth a search result. */
export const metadata: Metadata = { title: 'Milo', robots: { index: false, follow: false } }

export default function UnsubscribeLayout({ children }: { children: React.ReactNode }) {
  return children
}
