/**
 * The public pages' search surface — the thing that broke silently and was found by measuring
 * production rather than by any check in this repo.
 *
 * ⚠️ WHAT WENT WRONG, SO NOBODY UNDOES IT: on 2026-08-19 four of the five `PUBLIC_ROUTES`
 * declared NO canonical and all five inherited the landing page's description, so `/help`,
 * `/legal/privacy`, `/legal/terms` and `/diagnostic` were all advertising a placement check and
 * none of them declared which URL it was. `/diagnostic` — the highest-intent page in the product —
 * had no title of its own either, because it is `'use client'` and a client component cannot
 * export `metadata`. It needed a `layout.tsx`.
 *
 * ⚠️ THIS GATE READS THE REAL `metadata` EXPORTS, not a copy of the rules. A check that
 * re-implements "every page should have a description" cannot see a page stop exporting one.
 */
import { describe, expect, it } from 'vitest'
import type { Metadata } from 'next'
import { PUBLIC_ROUTES } from '@/app/site'

import { metadata as home } from '@/app/page'
import { metadata as diagnostic } from '@/app/diagnostic/layout'
import { metadata as help } from '@/app/help/page'
import { generateMetadata as legalMeta } from '@/app/legal/[slug]/page'
import { DOCS } from '@/app/legal/content'

const canonicalOf = (m: Metadata) => m.alternates?.canonical

/**
 * ⚠️ THE ROOT LAYOUT IS DELIBERATELY NOT IMPORTED. It calls `next/font/google` at module scope,
 * which throws under vitest — so a check written as "differs from the root's description" cannot
 * run at all here. It is also the weaker claim: the bug was that these pages DECLARED nothing and
 * silently inherited. Assert that each one declares its own, and that no two are the same. That
 * needs no root import and it fails on the exact defect.
 */

describe('every public route declares its own search surface', () => {
  const pages: [string, Metadata][] = [
    ['/', home],
    ['/diagnostic', diagnostic],
    ['/help', help],
  ]

  it.each(pages)('%s declares a canonical equal to its own path', (route, m) => {
    expect(canonicalOf(m)).toBe(route)
  })

  it.each(DOCS.map(d => [d.slug] as const))('/legal/%s declares its own canonical', async slug => {
    const m = await legalMeta({ params: Promise.resolve({ slug }) })
    expect(canonicalOf(m)).toBe(`/legal/${slug}`)
  })

  /**
   * The root's description is correct FOR THE ROOT. Anywhere else it is the bug: a legal page that
   * advertises a placement check is a duplicate meta description and a lie about the page.
   */
  it.each([
    ['/diagnostic', diagnostic],
    ['/help', help],
  ])('%s declares its own description and title', (_route, m) => {
    expect(m.description).toBeTruthy()
    expect((m.description as string).length).toBeGreaterThan(60)
    expect(m.title).toBeTruthy()
  })

  it.each(DOCS.map(d => [d.slug] as const))('/legal/%s declares its own description', async slug => {
    const m = await legalMeta({ params: Promise.resolve({ slug }) })
    expect(m.description).toBeTruthy()
  })

  /** Two pages sharing a description is the same defect as inheriting one, one step along. */
  it('no two public pages share a description', async () => {
    const legal = await Promise.all(
      DOCS.map(d => legalMeta({ params: Promise.resolve({ slug: d.slug }) })),
    )
    const all = [diagnostic, help, ...legal].map(m => m.description)
    expect(new Set(all).size).toBe(all.length)
  })

  /**
   * ⚠️ The list of pages above is hand-written, so it can fall behind `PUBLIC_ROUTES` — which is
   * the shape of every "the unit was fine, nothing called it" bug in this repo. Count them.
   */
  it('covers every route in PUBLIC_ROUTES', () => {
    const covered = new Set([...pages.map(([r]) => r), ...DOCS.map(d => `/legal/${d.slug}`)])
    expect([...PUBLIC_ROUTES].filter(r => !covered.has(r))).toEqual([])
  })
})

describe('the product is attached to the brand', () => {
  /**
   * ⚠️ "AdaptiveLearn" is a generic phrase in a crowded category and resolves to the category on
   * its own. The distinctive token is "Radlor", so the schema has to name it — and it must name it
   * by REFERENCE to radlor.com's node, not by declaring a second Organization with the same name.
   */
  it('names Radlor as publisher, by the same id radlor.com declares', async () => {
    const src = await import('node:fs').then(fs =>
      fs.readFileSync('src/app/page.tsx', 'utf8'))
    expect(src).toContain("publisher: { '@id': COMPANY_ID }")
    expect(src).toContain("'@id': APP_ID")

    const { COMPANY_ID, APP_ID } = await import('@/app/site')
    expect(COMPANY_ID).toBe('https://radlor.com/#organization')
    expect(APP_ID).toBe('https://adaptivelearn.radlor.com/#app')
  })

  it('links to radlor.com visibly, not only in schema', async () => {
    const src = await import('node:fs').then(fs =>
      fs.readFileSync('src/app/page.tsx', 'utf8'))
    expect(src).toMatch(/href=\{COMPANY_URL\}/)
    expect(src).toContain('is made by')
  })
})
