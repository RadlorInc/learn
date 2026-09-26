/**
 * N17 (ARC-03, SEO-04), founder 2026-09-26: "/modules everywhere, retire /menu, delete /demo."
 *
 * `/menu` was a second child home that skipped class mode, the temporary-password redirect and Sign out, and the
 * error pages, 404 and the parent's "Start" all led there. This holds the decision two ways:
 *  1. nothing in `src/` or `public/sw.js` points at `/menu` or `/demo` (a route string, not prose in a comment);
 *  2. both routes are gone as pages and `next.config.ts` redirects them, so an old bookmark still lands.
 *
 * Expected values are written out by hand (CLAUDE.md: a check must not import the value it asserts).
 */
import { describe, expect, it } from 'vitest'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const RETIRED = /(['"`])\/(menu|demo)(?=[/?#'"`$])/

/** Route strings to `/menu` or `/demo` in CODE. Comment lines and trailing `//` comments are prose, not links. */
function retiredRouteHits(src: string): string[] {
  return src.split('\n')
    .filter(l => !/^\s*(\*|\/\/|\/\*)/.test(l))
    .map(l => l.replace(/\s\/\/.*$/, ''))
    .filter(l => RETIRED.test(l))
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap(f => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|mts|js)$/.test(f) ? [p] : []
  })
}

const FILES = [...walk('src').filter(f => !f.startsWith(join('src', '__tests__'))), 'public/sw.js']

describe('one child home: nothing links to /menu or /demo', () => {
  it('the scan sees a planted link in every shape, and ignores prose', () => {
    // Positive controls: if these stop matching, the scan below is blind and its green means nothing.
    expect(retiredRouteHits(`<Link href="/menu" style={{`)).toHaveLength(1)
    expect(retiredRouteHits(`    router.push('/menu')`)).toHaveLength(1)
    expect(retiredRouteHits('  router.push(`/menu?grade=${g}`)')).toHaveLength(1)
    expect(retiredRouteHits(`const APP_PAGES = ['/menu', '/game']`)).toHaveLength(1)
    expect(retiredRouteHits(`secondary={{ label: 'Go back home', href: '/demo' }}`)).toHaveLength(1)
    // …and does not cry wolf on prose or on a longer route that merely starts with the word.
    expect(retiredRouteHits(' * Defaults to `/menu`, which bounced a visitor')).toHaveLength(0)
    expect(retiredRouteHits(`  go() // was '/menu'`)).toHaveLength(0)
    expect(retiredRouteHits(`href: '/menus-and-more'`)).toHaveLength(0)
  })

  it('the scan reads the real tree (it finds the /modules links that replaced them)', () => {
    expect(FILES.length).toBeGreaterThan(100)
    const home = FILES.filter(f => /['"`]\/modules['"`?]/.test(readFileSync(f, 'utf8')))
    expect(home).toEqual(expect.arrayContaining([
      'src/app/error.tsx', 'src/app/global-error.tsx', 'src/app/not-found.tsx', 'src/app/parent/page.tsx',
    ]))
  })

  it('no source file points at /menu or /demo', () => {
    const hits = FILES.flatMap(f => retiredRouteHits(readFileSync(f, 'utf8')).map(l => `${f}: ${l.trim()}`))
    expect(hits, 'a link to a retired route — point it at /modules (or / for the demo)').toEqual([])
  })
})

describe('the retired routes are gone and redirected', () => {
  it('no page exists at /menu or /demo', () => {
    expect(existsSync('src/app/menu')).toBe(false)
    expect(existsSync('src/app/demo')).toBe(false)
  })

  it('next.config redirects /menu → /modules and /demo → / permanently, on every host', async () => {
    const { default: config } = await import('../../next.config')
    const rules = (await config.redirects?.()) ?? []
    const find = (source: string) => rules.find(r => r.source === source && !r.has)
    expect(find('/menu')).toMatchObject({ destination: '/modules', permanent: true })
    expect(find('/demo')).toMatchObject({ destination: '/', permanent: true })
  })
})
