/**
 * REVIEW 1, Q5 (founder, 2026-09-24): Normal / Large / Extra large = 100 / 115 / 130 %, the whole screen, per device.
 *   · the store: `al-text-size` holds 'large' or 'xl'; Normal keeps nothing; anything else reads as Normal;
 *   · the boot script (public/text-size.js) — run as the browser runs it — marks <html> before React paints;
 *   · the CSS zooms exactly those two marks, by exactly 1.15 and 1.3.
 * ⚠️ Key, marks and factors are written out here, never imported.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { loadTextSize, saveTextSize } from '@/infra/storage/textSize'

const html = document.documentElement
const boot = () => new Function(readFileSync('public/text-size.js', 'utf8'))()

beforeEach(() => { localStorage.clear(); html.removeAttribute('data-text') })

describe('text size on this device', () => {
  it('saves Large and Extra large under al-text-size and marks <html>; Normal removes both', () => {
    saveTextSize('large')
    expect(localStorage.getItem('al-text-size')).toBe('large')
    expect(html.getAttribute('data-text')).toBe('large')
    saveTextSize('xl')
    expect(localStorage.getItem('al-text-size')).toBe('xl')
    expect(html.getAttribute('data-text')).toBe('xl')
    saveTextSize('normal')
    expect(localStorage.getItem('al-text-size')).toBeNull()
    expect(html.hasAttribute('data-text')).toBe(false)
  })

  it('reads anything unknown as Normal', () => {
    localStorage.setItem('al-text-size', 'huge')
    expect(loadTextSize()).toBe('normal')
  })

  it('the boot script marks <html> from storage — and ignores an unknown value', () => {
    localStorage.setItem('al-text-size', 'xl'); boot()
    expect(html.getAttribute('data-text')).toBe('xl')
    html.removeAttribute('data-text')
    localStorage.setItem('al-text-size', 'huge'); boot()
    expect(html.hasAttribute('data-text')).toBe(false)
  })

  it('the stylesheet zooms the whole page by 1.15 and 1.3, and the layout loads the boot script in <head>', () => {
    const css = readFileSync('src/app/globals.css', 'utf8')
    expect(css).toMatch(/html\[data-text="large"\]\s*\{\s*zoom:\s*1\.15;\s*\}/)
    expect(css).toMatch(/html\[data-text="xl"\]\s*\{\s*zoom:\s*1\.3;\s*\}/)
    const layout = readFileSync('src/app/layout.tsx', 'utf8')
    const head = layout.slice(layout.indexOf('<head>'), layout.indexOf('</head>'))
    expect(head).toContain('<script src="/text-size.js" />')
  })
})

// ── The parent's Account card, rendered and clicked ────────────────────────────────────────────────────────────
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'
import { TextSizeCard } from '@/features/dashboard/TextSizeCard'
import { LangContext } from '@/features/dashboard/i18n'
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('Account → Text size', () => {
  async function card(lang: 'en' | 'es') {
    const host = document.createElement('div'); document.body.append(host)
    await act(async () => { createRoot(host).render(createElement(LangContext.Provider, { value: lang }, createElement(TextSizeCard, { style: {} }))) })
    return host
  }
  it('three named buttons in a named group; a press saves the size and says which is on, not by colour alone', async () => {
    const host = await card('en')
    expect(host.querySelector('[role="group"]')?.getAttribute('aria-label')).toBe('Text size')
    const buttons = () => [...host.querySelectorAll('button')]
    expect(buttons().map(b => b.textContent)).toEqual(['✓ Normal', 'Large', 'Extra large'])
    await act(async () => { buttons()[2].click() })
    expect(localStorage.getItem('al-text-size')).toBe('xl')
    expect(html.getAttribute('data-text')).toBe('xl')
    expect(buttons().map(b => [b.textContent, b.getAttribute('aria-pressed')])).toEqual([['Normal', 'false'], ['Large', 'false'], ['✓ Extra large', 'true']])
  })
  it('in Spanish', async () => {
    const host = await card('es')
    expect([...host.querySelectorAll('button')].map(b => b.textContent)).toEqual(['✓ Normal', 'Grande', 'Muy grande'])
    expect(host.querySelector('h2')?.textContent).toBe('Tamaño del texto')
  })
})
