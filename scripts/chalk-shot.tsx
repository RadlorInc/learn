/**
 * Every chalkboard of one topic, finished (all marks up), with each beat's line under it — as a PNG to look at.
 *
 *   npx tsx scripts/chalk-shot.tsx g4m2-t3 [out.png]
 *
 * Renders the real Chalkboard (`still`) with the real chalk face (Gaegu 700, from Google Fonts) and screenshots it
 * with Playwright's Chromium. No dev server. Read the PNG and ask of every board: does it draw what she says, is
 * every mark legible, does anything overlap or run off the edge, does any board show an answer before it is said?
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { chromium } from 'playwright'
import { MODULES } from '../src/features/lessons/modules'
import { Chalkboard } from '../src/features/lessons/Chalkboard'

const [id, out = `${id}-chalk.png`] = process.argv.slice(2)
const lesson = MODULES.flatMap(m => m.lessons).find(l => l.id === id)
if (!lesson) { console.error(`no topic ${id}`); process.exit(2) }

const boards = lesson.screens.map((s, i) => ({ s, i })).filter(({ s }) => s.chalk && s.beats)
if (!boards.length) { console.error(`${id} has no chalkboards`); process.exit(2) }
const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const body = boards.map(({ s, i }) => `<section><h2>Screen ${i + 1} · ${esc(s.title)}</h2>
  <div class="b">${renderToStaticMarkup(createElement(Chalkboard as never, { marks: s.chalk!, says: s.beats!.map(b => b.say), shown: s.beats!.length, label: s.text, still: true }))}</div>
  <ol>${s.beats!.map(b => `<li>${esc(b.say)}</li>`).join('')}</ol></section>`).join('')

const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Gaegu:wght@700&family=Fredoka:wght@600&display=block" rel="stylesheet">
<style>:root{--font-chalk:'Gaegu';--font-display:'Fredoka'} body{margin:0;padding:16px;font:14px system-ui;background:#fff;width:1280px}
main{display:grid;grid-template-columns:1fr 1fr;gap:18px} h2{font-size:15px;margin:0 0 6px} ol{margin:6px 0 0;padding-left:20px}
.b{width:620px}</style></head><body><h1 style="font-size:18px">${esc(id)} · ${esc(lesson.title)}</h1><main>${body}</main></body></html>`

async function main() {
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1312, height: 800 } })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: out, fullPage: true })
await browser.close()
console.log(`${boards.length} boards → ${out}`)
}
main().catch(e => { console.error(e); process.exit(1) })
