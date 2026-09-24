'use client'
/**
 * Text size on this device (Review 1 Q5, founder 2026-09-24): Normal / Large / Extra large = 100 / 115 / 130 %, the
 * WHOLE screen — words and buttons together, so nothing crowds (a phone at 130 % lays out like a 288 px one).
 * Saved per device in local storage under `al-text-size` (named in doc 08). `public/text-size.js` applies it before
 * the first paint; `html[data-text]` in globals.css does the zoom.
 */
import { useSyncExternalStore } from 'react'

export type TextSize = 'normal' | 'large' | 'xl'
export const TEXT_SIZES: readonly TextSize[] = ['normal', 'large', 'xl']
const KEY = 'al-text-size'

export function loadTextSize(): TextSize {
  try { const v = localStorage.getItem(KEY); return v === 'large' || v === 'xl' ? v : 'normal' } catch { return 'normal' }
}

export function saveTextSize(s: TextSize): void {
  // Normal is the absence of a choice: nothing is kept for it.
  try { if (s === 'normal') localStorage.removeItem(KEY); else localStorage.setItem(KEY, s) } catch { /* private mode: this visit only */ }
  if (s === 'normal') document.documentElement.removeAttribute('data-text')
  else document.documentElement.setAttribute('data-text', s)
  window.dispatchEvent(new Event(KEY))
}

export const useTextSize = (): TextSize => useSyncExternalStore(
  on => { window.addEventListener(KEY, on); window.addEventListener('storage', on); return () => { window.removeEventListener(KEY, on); window.removeEventListener('storage', on) } },
  loadTextSize, () => 'normal')
