import type { Metadata } from 'next'

/** Pages reached from a consent email: token-bearing, personal, and never worth a search result. */
export const metadata: Metadata = { title: 'Milo', robots: { index: false, follow: false } }

export default function ConsentLayout({ children }: { children: React.ReactNode }) {
  return children
}
