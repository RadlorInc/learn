/**
 * THE RADLIC RENAME (2026-09-24) — the old names, the old domain and the mascot stay gone from everything a person sees.
 *
 * Three greps over the VISIBLE surfaces (the app's source — the KG–2 story chapters included since 2026-09-25 —, `public/` text, the
 * legal documents, the docs people read). Each hit must be ZERO except a line matched by a named exception below,
 * and every exception must still match something — an exception that matches nothing is an inert clause, and it
 * would silently let its pattern back in anywhere in that file.
 *
 * ⚠️ "I cannot see" and "there is nothing to see" must not render the same: the scope has a floor and must contain
 * the files that carried the most hits before the rename, and the scanner is run against planted lines first.
 *
 * ⚠️ The expectations are written out here, never imported from `site.ts`: a gate that read `APP_NAME` would pass
 * whatever the product were called.
 */
import { describe, it, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const GREPS = {
  name: /\bMilo\b|\bMILO\b|AdaptiveLearn|ADAPTIVELEARN|\bAdaptive Learn\b/,
  domain: /adaptivelearn\.radlor\.com/i,
  mascot: /🦊|assets\/characters\/milo|\bmilo[-_](happy|idle|thinking|side)\.png/i,
} as const
type Kind = keyof typeof GREPS

const TEXT = /\.(tsx?|jsx?|mjs|css|html|json|txt|md|webmanifest)$/
const inScope = (f: string) => TEXT.test(f) && (
  (f.startsWith('src/') && !f.startsWith('src/__tests__/'))
  || (f.startsWith('public/') && !f.startsWith('public/audio/') && !f.startsWith('public/assets/'))
  || (f.startsWith('docs/legal/') && !HISTORICAL.some(r => r.test(f)))
  || ['README.md', 'CLAUDE.md', 'AGENTS.md', 'next.config.ts', 'vercel.json'].includes(f)
)
/** Records of what was. They keep the old names by design (rule 3 of the rename brief). */
const HISTORICAL = [/^docs\/legal\/LOOP-STATE\.md$/, /^docs\/legal\/ROUND-2\.md$/, /^docs\/legal\/CONSENT-ONCE-ROUND2\.md$/, /^docs\/legal\/sql\//,
  /^docs\/legal\/14-supabase-findings-and-ai-content\.md$/]   // 14: dated findings, 2026-09-22

/** Each exception: the file, the lines it covers, which greps it may silence, and why. */
const EXCEPTIONS: { file: string; line: RegExp; kinds: Kind[]; why: string }[] = [
  { file: 'src/app/parent/page.tsx', line: /^const AVATARS\s+= \['🦊', '🐰', '🐻', '🐱'\]$/, kinds: ['mascot'],
    why: "a child's own avatar choices — the notice lists the avatar as collected data, so the fox stays as an avatar" },
  { file: 'src/app/llms.txt/route.ts', line: /It was called Milo until August 2026 and AdaptiveLearn until$|^September 2026, at adaptivelearn\.radlor\.com, which now redirects here/, kinds: ['name', 'domain'],
    why: 'the earlier names, said once, so an answer engine links the old name to this product' },
  { file: 'src/app/layout.tsx', line: /renamed 2026-09-24 from AdaptiveLearn, which was renamed from Milo/, kinds: ['name'],
    why: 'a dated historical note in a comment' },
  { file: 'src/app/site.ts', line: /"AdaptiveLearn", the product's name until 2026-09-24/, kinds: ['name'],
    why: 'a dated historical note in a comment' },
  { file: 'src/app/site.ts', line: /^export const OLD_HOST = 'adaptivelearn\.radlor\.com'$/, kinds: ['domain'],
    why: 'the redirect code: the old host it answers for' },
  { file: 'next.config.ts', line: /^\/\/ The old domain \(adaptivelearn\.radlor\.com\) → radlic\.com, once SITE_URL has moved/, kinds: ['domain'],
    why: 'the redirect code' },
  { file: 'docs/legal/ATTORNEY-PACKET.md', line: /^\*\*Product renamed to Radlic and moved to radlic\.com on \[date\]|^- \*\*Today \(once the rename ships\):\*\* the notice a parent agrees to changed only in the product's name/, kinds: ['name', 'domain'],
    why: 'the rename itself, told to the attorney (brief N4)' },
  { file: 'README.md', line: /^The product was called \*\*Milo\*\* until August 2026 and \*\*AdaptiveLearn\*\* until September 2026|^\*\*Live:\*\* https:\/\/radlic\.com \(until the domain switch, https:\/\/adaptivelearn\.radlor\.com/, kinds: ['name', 'domain'],
    why: 'the earlier names and the switch — history a reader of the repo needs' },
  { file: 'CLAUDE.md', line: /^called Milo, then AdaptiveLearn at adaptivelearn\.radlor\.com, which becomes a 308 to radlic\.com|^\*\*There is no mascot\*\*: no named character, no "Milo says…"/, kinds: ['name', 'domain'],
    why: 'the rename, told to future sessions' },
  { file: 'CLAUDE.md', line: /^\| ⚠️⚠️ \*\*a gate grepping `menu\/page\.tsx` for `'Milo picked this to close the gap'`/, kinds: ['name'],
    why: 'a historical record in the defect table (rule 3: records of what was stay)' },
]

const files = execFileSync('git', ['ls-files'], { encoding: 'utf8', maxBuffer: 64 << 20 }).split('\n').filter(inScope)

function scan(sources: [file: string, text: string][]) {
  const hits: string[] = []
  const used = new Set<number>()
  for (const [file, text] of sources) text.split('\n').forEach((line, i) => {
    for (const kind of Object.keys(GREPS) as Kind[]) {
      if (!GREPS[kind].test(line)) continue
      const ex = EXCEPTIONS.findIndex(e => e.file === file && e.kinds.includes(kind) && e.line.test(line.trim()))
      if (ex >= 0) { used.add(ex); continue }
      hits.push(`${kind}  ${file}:${i + 1}  ${line.trim().slice(0, 140)}`)
    }
  })
  return { hits, used }
}

describe('the Radlic rename — nothing visible still says Milo, AdaptiveLearn, the old domain, or shows the mascot', () => {
  it('control: the scanner catches a planted line of each kind, and an exception silences only its own line', () => {
    const planted = scan([
      ['src/app/x.tsx', '<h1>Welcome to Milo</h1>'],
      ['src/app/y.tsx', "title: 'AdaptiveLearn'"],
      ['public/z.html', '<a href="https://adaptivelearn.radlor.com/legal/privacy">'],
      ['src/app/w.tsx', '<div>🦊</div>'],
      ['src/app/parent/page.tsx', "const AVATARS     = ['🦊', '🐰', '🐻', '🐱']"],
      ['src/app/parent/page.tsx', '<span>🦊 Brand</span>'],
    ])
    expect(planted.hits.map(h => h.split('  ')[0])).toEqual(['name', 'name', 'domain', 'mascot', 'mascot'])
    // …and none of the identifiers that stay (CSS tokens, module names, storage keys, the child-login domain).
    expect(scan([['src/a.ts', "var(--milo-orange); useMiloSpeaker(); 'milo_active_learner'; 'x@learner.adaptivelearn.invalid'; adaptive learning"]]).hits).toEqual([])
  })

  it('control: the scope is real — it holds the files that carried the most visible hits before the rename', () => {
    expect(files.length, 'the gate is looking at almost nothing').toBeGreaterThan(400)
    for (const f of ['src/features/consent/copy.ts', 'src/features/dashboard/DashNav.tsx', 'src/app/layout.tsx', 'public/manifest.json',
      'docs/legal/11-privacy-policy.md', 'docs/legal/es/11-privacy-policy.md', 'src/features/consent/server.ts',
      // The story chapters: KG–2 children see them (2026-09-25), and before that day they were the mascot's home.
      'src/features/chapters/story/StoryTime.tsx', 'src/features/chapters/story/HomeTime.tsx', 'src/features/chapters/story/ForestWalk.tsx'])
      expect(files, `${f} is out of the gate's scope`).toContain(f)
  })

  const result = scan(files.map(f => [f, readFileSync(f, 'utf8')]))

  it.each(Object.keys(GREPS) as Kind[])('zero visible %s hits outside the named exceptions', kind => {
    expect(result.hits.filter(h => h.startsWith(`${kind}  `))).toEqual([])
  })

  it('every exception still matches something (an exception that matches nothing is an inert clause)', () => {
    expect(EXCEPTIONS.filter((_, i) => !result.used.has(i)).map(e => `${e.file}: ${e.line}`)).toEqual([])
  })

  it('N6: the one identifier a person sees — the export download — is named for the product', async () => {
    const { exportFilename } = await import('@/shared/ui/DataRights')
    expect(exportFilename('Ava Rose', new Date('2026-09-24T12:00:00Z'))).toBe('radlic-ava-rose-2026-09-24.json')
  })

})
