'use client'
/**
 * leadEmail — the email a cold (logged-out) visitor gives at the start of the checkup.
 * Kept locally so the later "create a free account" step can prefill it (continue with
 * that email). Durable server-side lead capture is a separate best-effort insert
 * (captureDiagnosticLead) so a visitor who never signs up is still counted.
 */
import { kv } from '@/infra/storage/kv'

const KEY = 'milo_lead_email'

export function setLeadEmail(email: string): void {
  try { kv.set(KEY, email) } catch { /* private mode — non-fatal */ }
}
export function getLeadEmail(): string | null {
  try { return kv.get(KEY) || null } catch { return null }
}
export function clearLeadEmail(): void {
  try { kv.remove(KEY) } catch { /* non-fatal */ }
}
