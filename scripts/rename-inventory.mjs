#!/usr/bin/env node
/**
 * The Radlic rename's N0 inventory (2026-09-24): every hit of the old names, the old domain and the mascot, one row
 * each, with a category. Read-only; writes docs/rename/inventory.tsv and prints a per-file summary.
 *
 *   node scripts/rename-inventory.mjs            # writes the TSV, prints the summary as a markdown table
 *
 * Categories (the rules are below, in `category()`; a row's category is a heuristic, not a verdict):
 *   visible          — a person sees it: UI text, page metadata, emails, public legal pages, docs people read
 *   identifier       — a machine depends on it: a storage key, a CSS token, a module/function name, a lookup key
 *   url-domain       — an address: the old product domain or an old deploy host
 *   mascot           — the Milo character: its images, its lines, and the hidden legacy chapters built around it
 *   historical       — a record of what was: session history, the legal loop's log, applied migrations, SQL proofs
 *   third-party      — text another service shows people: Stripe products, Kaggle notebooks, Supabase auth config
 *
 * ⚠️ It counts the company domain too (`radlor.com`), because the brief asks for every URL. `support@radlor.com`,
 * `noreply@radlor.com` and `radlor.com` itself are the COMPANY and stay; they are categorised `identifier` so the
 * summary does not read them as work.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const PATTERNS = ['milo', 'adaptivelearn', 'adaptive learn', 'adaptive-learn', 'radlor\\.com', 'mascot', '🦊']
const grep = p => {
  try {
    return execFileSync('git', ['grep', '-n', '-I', '-i', '-P', '-o', `[A-Za-z0-9_.@/:#-]*${p}[A-Za-z0-9_./#-]*`, '--', '.', ':!package-lock.json', ':!docs/rename/inventory.tsv'],
      { encoding: 'utf8', maxBuffer: 1 << 28 }).split('\n').filter(Boolean)
  } catch (e) { if (e.status === 1) return []; throw e }
}

const HISTORICAL = [/^handoff\.md$/, /^docs\/handoff-archive\.md$/, /^docs\/legal\/LOOP-STATE\.md$/, /^docs\/legal\/sql\//,
  /^supabase\/migrations\//, /^supabase\/held\//, /^docs\/recovered-/, /^docs\/legal\/ROUND-2\.md$/, /^docs\/legal\/CONSENT-ONCE-ROUND2\.md$/]
const MASCOT_PATHS = [/^src\/features\/chapters\//, /^scripts\/\.voice-corpus/, /^public\/assets\/characters\//, /^docs\/storyboards\//,
  /Milo(Sprite|Pointer|Mark|Avatar|Bubble|Bead|Painter|Chef|Builder)/, /miloPointer/]
// Tests and design docs whose "Milo" is the CHARACTER inside the hidden legacy chapters (bands 3–8, hidden since
// 2026-09-13), or in teen/lab designs whose code was deleted 2026-09-20: mascot, not product name.
const CHARACTER_DOCS = [/^docs\/(ux-design|ux-invariants|framing-12-18|labs-vision|teen-[\w-]+|chapter-[\w-]+)\.md$/, /^e2e\//]
const importsChapters = f => { try { return /@\/features\/chapters|features\/chapters\//.test(readFileSync(f, 'utf8')) } catch { return false } }
const THIRD_PARTY = [/^scripts\/stripe-products\.mts$/, /^scripts\/kaggle/, /^scripts\/chatterbox-kaggle/, /^supabase\/config\.toml$/]
const COMPANY = /^(support|noreply|admin)@radlor\.com\.?$|^(https?:\/\/)?(www\.)?radlor\.com(\/#organization|\/)?\.?$|^[a-z]+\.radlor\.com$/i

function category(file, token) {
  if (HISTORICAL.some(r => r.test(file))) return 'historical'
  if (/adaptivelearn\.radlor\.com|milo-story-mode[\w.-]*\.vercel\.app/i.test(token)) return 'url-domain'
  if (/radlor\.com/i.test(token) && COMPANY.test(token.replace(/^mailto:/, ''))) return 'identifier'
  if (THIRD_PARTY.some(r => r.test(file))) return 'third-party'
  if (/^(Milo|MILO)\b/.test(token) && (CHARACTER_DOCS.some(r => r.test(file)) || (/^src\/__tests__\//.test(file) && importsChapters(file)))) return 'mascot'
  if (MASCOT_PATHS.some(r => r.test(file) || r.test(token)) || /characters\/milo|milo[-_](happy|idle|side|thinking)/i.test(token) || token === '🦊') return 'mascot'
  // The bare word is a name a person reads; anything glued to other word characters is a name a machine reads.
  if (/^(Milo|MILO|AdaptiveLearn|adaptive learn|mascot)[.,:;!?'’s)]*$/i.test(token.replace(/^[^A-Za-z]+/, ''))) return 'visible'
  return 'identifier'
}

const rows = []
const seen = new Set()
for (const p of PATTERNS) for (const line of grep(p)) {
  const m = line.match(/^([^:]+):(\d+):(.*)$/)
  if (!m) continue
  const [, file, ln, token] = m
  const key = `${file}:${ln}:${token}`
  if (seen.has(key)) continue
  seen.add(key)
  rows.push({ file, ln, token, cat: category(file, token) })
}
// Mascot image FILES (a name in a path is not a line of text).
for (const f of execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n'))
  if (/(^|\/)milo[^/]*\.(png|webp|svg|jpg|riv)$/i.test(f)) rows.push({ file: f, ln: '-', token: '(image file)', cat: 'mascot' })

rows.sort((a, b) => a.file.localeCompare(b.file) || (+a.ln || 0) - (+b.ln || 0))
mkdirSync('docs/rename', { recursive: true })
writeFileSync('docs/rename/inventory.tsv', 'category\tfile\tline\ttoken\n' + rows.map(r => `${r.cat}\t${r.file}\t${r.ln}\t${r.token}`).join('\n') + '\n')

const by = new Map()
for (const r of rows) { const k = `${r.cat}\t${r.file}`; by.set(k, (by.get(k) ?? 0) + 1) }
const cats = {}
for (const r of rows) cats[r.cat] = (cats[r.cat] ?? 0) + 1
console.log(`| category | hits |\n|---|---|\n${Object.entries(cats).sort().map(([c, n]) => `| ${c} | ${n} |`).join('\n')}\n| **total** | **${rows.length}** |\n`)
console.log('| category | file | hits |\n|---|---|---|')
for (const [k, n] of [...by].sort()) { const [c, f] = k.split('\t'); console.log(`| ${c} | \`${f}\` | ${n} |`) }
