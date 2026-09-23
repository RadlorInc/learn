/**
 * THE LEGAL SURFACE, CHECKED AGAINST ITS MANIFEST — `docs/legal/SURFACE.md` IS THE EXPECTATION.
 *
 * ⚠️ THE EXPECTATION IS READ FROM THE MANIFEST, NEVER FROM THE CODE. Each row of SURFACE.md's two
 * tables names a page or a link the product owes; this file paints the real component in jsdom and
 * reads its hrefs. A link is found by RENDERING, not by grepping for a component name — `RoleGate`
 * renders nothing until an effect resolves, so a source grep would call an empty screen covered.
 *
 * ⚠️ `state` IS HELD HONEST BOTH WAYS. `present` → every target must be linked. `GAP` → at least one
 * target must be MISSING, so a gap that closes without the manifest noticing goes red too. The gaps
 * are there to be closed (item 8); they are recorded, not excused.
 *
 * ⚠️ AND IT CANNOT GO QUIET BY LOSING A ROW. Every manifest row needs a renderer here and every
 * renderer needs a row; each paint must contain text only that screen produces (a positive control),
 * or "no link missing" would be indistinguishable from "nothing rendered".
 */
import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

vi.mock('@/data/repositories', async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  getMyRole: async () => 'parent',
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: () => {}, push: () => {}, refresh: () => {} }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))
// Every query answers "nothing": the add-a-child flow then shows the notice, which is the state it collects in.
vi.mock('@/data/supabase/client', () => {
  const empty = { data: [], error: null }
  const chain: unknown = new Proxy(() => {}, {
    get: (_t, k) => (k === 'then' ? (r: (v: unknown) => void) => r(empty) : chain),
    apply: () => chain,
  })
  return {
    createClient: () => ({
      auth: {
        getUser: async () => ({ data: { user: null } }),
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      },
      from: () => chain,
      rpc: () => chain,
    }),
  }
})

const ORIGIN = 'https://adaptivelearn.radlor.com'
const MANIFEST = readFileSync(resolve(__dirname, '../../docs/legal/SURFACE.md'), 'utf8')

/** The rows of the table under `## <heading>`, as objects keyed by the header cells. */
function table(heading: string): Record<string, string>[] {
  const at = MANIFEST.indexOf(`\n## ${heading}\n`)
  if (at < 0) throw new Error(`SURFACE.md has no "## ${heading}" — the manifest moved; fix the heading, do not weaken the check`)
  const lines = MANIFEST.slice(at).split('\n').slice(2)
  const start = lines.findIndex(l => l.startsWith('|'))
  const rows: string[][] = []
  for (const l of lines.slice(start)) {
    if (!l.startsWith('|')) break
    rows.push(l.split('|').slice(1, -1).map(c => c.trim()))
  }
  const [head, , ...body] = rows
  return body.map(r => Object.fromEntries(head.map((h, i) => [h, r[i]])))
}

async function paint(el: unknown, then?: (host: HTMLElement) => void): Promise<string> {
  const { act } = await import('react')
  const { createRoot } = await import('react-dom/client')
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  await act(async () => { root.render(el as never) })
  await act(async () => { await new Promise(r => setTimeout(r, 30)) })
  if (then) await act(async () => { then(host); await new Promise(r => setTimeout(r, 30)) })
  const html = host.innerHTML
  await act(async () => { root.unmount() })
  host.remove()
  return html
}

const h = async (mod: Promise<Record<string, unknown>>, name = 'default', props: Record<string, unknown> = {}) => {
  const React = await import('react')
  return React.createElement((await mod)[name] as never, props as never)
}

/** Each manifest row → how to paint it, and a string only that screen renders (the positive control). */
const SURFACES: Record<string, { paint: () => Promise<string>; control: string }> = {
  home: { paint: async () => paint(await h(import('@/app/page'))), control: 'Math lessons that adapt' },
  signup: { paint: async () => paint(await h(import('@/app/auth/page'))), control: 'Quiet insight' },
  checkout: { paint: async () => paint(await h(import('@/app/parent/plan/page'))), control: 'Milo for your family' },
  'add-child': {
    paint: async () => paint(await h(import('@/app/parent/page'), 'AddLearnerModal', { onClose() {}, onAdded() {} })),
    control: 'Child',
  },
  notice: {
    paint: async () => paint(await h(import('@/features/consent/AddChildFlow'), 'AddChildFlow', { lang: 'en', onClose() {}, renderAdd: () => null })),
    control: 'Before your child starts',
  },
  'consent-email': {
    paint: async () => (await import('@/features/consent/email')).renderB1('en', `${ORIGIN}/consent/respond#t=x`, `${ORIGIN}/consent/respond#t=x&choice=decline`).html,
    control: 'Someone — we believe you',
  },
  'withdraw-email': {
    paint: async () => (await import('@/features/consent/email')).renderB3('en', `${ORIGIN}/consent/withdraw#t=x`).html,
    control: 'Yesterday you gave permission',
  },
  account: { paint: async () => paint(await h(import('@/app/parent/account/page'))), control: 'Close your account' },
  invites: { paint: async () => paint(await h(import('@/app/parent/invites/page'))), control: 'Share Access' },
  support: {
    // Collapsed it is one button; the form — the thing that collects — exists only after the click.
    paint: async () => paint(await h(import('@/shared/ui/SupportPanel'), 'SupportPanel'),
      host => [...host.querySelectorAll('button')].find(b => /Need help/.test(b.textContent ?? ''))?.click()),
    control: 'What happened?',
  },
  'child-home': { paint: async () => paint(await h(import('@/app/modules/page'))), control: '/lesson?module=' },
  roster: {
    paint: async () => paint(await h(import('@/features/classes/Classes'), 'AddStudents',
      { cls: { id: 'c', name: 'Room 12', grade: 5 }, onAdded() {}, onDone() {} })),
    control: 'One student per line',
  },
}

const route = (slug: string) => `/legal/${slug}`
const hrefs = (html: string) =>
  new Set([...html.matchAll(/href="([^"]+)"/g)].map(m => m[1].replace(/&amp;/g, '&').replace(ORIGIN, '').split('#')[0]))

const PAGES = table('Pages')
const LINKS = table('Required links')

describe('the manifest is readable — positive control', () => {
  it('parses both tables', () => {
    expect(PAGES.map(p => p.slug)).toContain('privacy')
    expect(LINKS.length, 'the links table yielded almost nothing — the parser is blind').toBeGreaterThan(8)
    for (const r of [...PAGES, ...LINKS]) expect(['present', 'GAP'], `state "${r.state}"`).toContain(r.state)
  })
  it('every manifest row has a renderer, and every renderer a row', () => {
    expect(Object.keys(SURFACES).sort()).toEqual(LINKS.map(r => r.id).sort())
  })
  it('every link target is a page the manifest lists', () => {
    const slugs = new Set(PAGES.map(p => p.slug))
    for (const r of LINKS) for (const s of r['must link to'].split(',').map(x => x.trim()))
      expect(slugs.has(s), `${r.id} must link to "${s}", which is not a page in the manifest`).toBe(true)
  })
})

describe('every legal page the manifest lists has a route', () => {
  it.each(PAGES.map(p => [p.slug, p.state] as const))('%s — %s', async (slug, state) => {
    // Exists = the one legal page component renders it (its title), rather than notFound().
    const { pageBySlug } = await import('@/app/legal/registry')
    const { default: View } = await import('@/app/legal/[slug]/page')
    const { renderToStaticMarkup } = await import('react-dom/server')
    const p = pageBySlug(slug)
    const exists = !!p && renderToStaticMarkup(await View({ params: Promise.resolve({ slug }) })).includes(p.title)
    expect(exists, state === 'present'
      ? `${route(slug)} is in the manifest as present and does not exist`
      : `${route(slug)} exists but the manifest still says GAP — update SURFACE.md`).toBe(state === 'present')
  })
})

describe('every point of collection links where the manifest says it must — read from the rendered screen', () => {
  it.each(LINKS.map(r => [r.id, r] as const))('%s', async (id, row) => {
    const html = await SURFACES[id].paint()
    expect(html, `${id} did not render — this check is blind, not clean`).toContain(SURFACES[id].control)
    const got = hrefs(html)
    const want = row['must link to'].split(',').map(s => route(s.trim()))
    const missing = want.filter(w => !got.has(w))
    if (row.state === 'present') {
      expect(missing, `${row.surface} (${row.where}) collects ${row.collects} and has lost its link`).toEqual([])
    } else {
      expect(missing.length, `${row.surface} now links everything it must — mark it present in SURFACE.md`).toBeGreaterThan(0)
    }
  })
})
