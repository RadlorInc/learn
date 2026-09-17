import type { ReactNode } from 'react'
import { ParentPinGate } from '@/shared/ui/ParentPinGate'

/** Every /parent screen sits behind the parent PIN, asked each time the dashboard is opened (see ParentPinGate). */
export default function ParentLayout({ children }: { children: ReactNode }) {
  return <ParentPinGate>{children}</ParentPinGate>
}
