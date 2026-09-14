'use client'
/**
 * RoleGate — shows a page only to the role it belongs to; anyone else goes to /parent, which
 * routes a signed-out visitor to /auth and a role-less account to the one-time picker.
 *
 * ⚠️ A UX gate, NOT the security boundary: RLS decides what data anyone can read. So a failed role
 * read fails OPEN (renders the page) rather than bouncing a real teacher off their class mid-lesson.
 */
import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { getMyRole } from '@/data/repositories'
import type { UserRole } from '@/data/supabase/types'

/** null = allowed; otherwise where to send them. */
export function roleGateRedirect(allowed: UserRole, role: UserRole | null): string | null {
  return role === allowed ? null : '/parent'
}

export function RoleGate({ role, children }: { role: UserRole; children: ReactNode }) {
  const router = useRouter()
  const [ok, setOk] = useState(false)
  useEffect(() => {
    let cancelled = false
    getMyRole()
      .then(r => {
        if (cancelled) return
        const to = roleGateRedirect(role, r)
        if (to) router.replace(to)
        else setOk(true)
      })
      .catch(() => { if (!cancelled) setOk(true) })
    return () => { cancelled = true }
  }, [role, router])
  return ok ? <>{children}</> : null
}
