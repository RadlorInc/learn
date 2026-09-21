#!/usr/bin/env node
/**
 * RESPONSIVE SWEEP — every live page, at 19 screen sizes, with the phone's real safe areas.
 *
 *   npm run dev            # in another terminal (ui-preview is dev-only)
 *   npm run sweep:responsive                      # all sizes
 *   ONLY=iphone npm run sweep:responsive          # sizes whose name contains "iphone"
 *   ENGINE=webkit npm run sweep:responsive        # Safari's engine (no inset emulation there)
 *
 * What it reports, per page × size, after load AND after each scripted tap (menu, bell, ⋯, every lesson screen):
 *   hscroll · under-status-bar · under-home-bar · under-notch-left/right · covered (a control under something else)
 *   · offscreen-x (a control cut off at the side) · text-clipped (text cut by its own box).
 * Safe areas come from Chrome's `Emulation.setSafeAreaInsetsOverride` — env(safe-area-inset-*) resolves to the
 * iPhone's real numbers (59 top / 34 bottom portrait, 59 sides / 21 bottom landscape), so a fixed bar under the home
 * indicator is measured, not guessed.
 *
 * Exit 0 = looked and clean · 1 = looked and found something · 2 = could not look (a page failed to load or a
 * scripted tap found nothing to tap). Written 2026-09-21; watched red on /help's back link at a 59px status bar and on
 * the /admin/login reload loop before any fix.
 *
 * ⚠️ It checks the INITIAL scroll position for in-flow content (content that scrolls under the bar later is normal)
 * and every scroll position for fixed/sticky content. It does not judge beauty — only overlap, overflow and clipping.
 */
import { chromium, webkit } from 'playwright'
import { writeFileSync } from 'node:fs'
const BASE = process.env.BASE ?? 'http://localhost:3000'
const ROUTES = process.env.ROUTES ? JSON.parse(process.env.ROUTES) : [
  "/",
  "/help",
  "/legal/privacy",
  "/legal/terms",
  "/auth",
  "/auth/new-password",
  "/modules?grade=3",
  "/modules?grade=5",
  "/modules?grade=8",
  "/play",
  "/ui-preview?p=role",
  "/ui-preview?p=empty",
  "/ui-preview?p=sheet",
  "/ui-preview?p=childlogin",
  "/ui-preview?p=pin",
  "/ui-preview?p=pinset",
  "/ui-preview?p=mhex",
  "/ui-preview?p=exhome",
  "/ui-preview?p=lessons",
  {
  "url": "/lesson?module=g5m1&id=g5m1-t1",
  "steps": [
  {
  "click": ".lp-action button, .lp-action a",
  "times": 8,
  "label": "next",
  "wait": 800
  },
  {
  "click": "main input[type=text], main input[inputmode]",
  "fill": "0",
  "label": "type answer"
  },
  {
  "click": "button:has-text('Check')",
  "label": "check wrong",
  "wait": 900
  }
  ]
  },
  {
  "url": "/lesson?module=g3m1&id=g3m1-t1",
  "steps": [
  {
  "click": ".lp-action button, .lp-action a",
  "times": 8,
  "label": "next",
  "wait": 800
  },
  {
  "click": "main input[type=text], main input[inputmode]",
  "fill": "0",
  "label": "type answer"
  },
  {
  "click": "button:has-text('Check')",
  "label": "check wrong",
  "wait": 900
  }
  ]
  },
  {
  "url": "/lesson?module=g8m1&id=g8m1-t1",
  "steps": [
  {
  "click": ".lp-action button, .lp-action a",
  "times": 8,
  "label": "next",
  "wait": 800
  },
  {
  "click": "main input[type=text], main input[inputmode]",
  "fill": "0",
  "label": "type answer"
  },
  {
  "click": "button:has-text('Check')",
  "label": "check wrong",
  "wait": 900
  }
  ]
  },
  {
  "url": "/practice?module=g5m1",
  "steps": [
  {
  "click": "main input[type=text], main input[inputmode]",
  "fill": "0",
  "label": "type answer"
  },
  {
  "click": "button:has-text('Check')",
  "label": "check wrong",
  "wait": 900
  }
  ]
  },
  {
  "url": "/ui-preview?p=home",
  "steps": [
  {
  "click": "[data-tour=menu]",
  "label": "menu open", "optional": 1
  },
  {
  "reload": 1,
  "click": "[data-tour=bell]",
  "label": "bell open"
  },
  {
  "reload": 1,
  "click": "summary[aria-label='More options']",
  "label": "more open", "optional": 1
  },
  {
  "reload": 1,
  "click": "button:has-text('Preview the tour')",
  "label": "tour"
  },
  {
  "click": "[data-next]",
  "times": 3,
  "label": "tour next"
  }
  ]
  },
  {
  "url": "/ui-preview?p=teacher",
  "steps": [
  {
  "click": "[data-tour=menu]",
  "label": "menu open", "optional": 1
  },
  {
  "reload": 1,
  "click": "[data-tour=bell]",
  "label": "bell open"
  },
  {
  "reload": 1,
  "click": "summary[aria-label='More options']",
  "label": "more open", "optional": 1
  }
  ]
  },
  {
  "url": "/ui-preview?p=child&tab=progress",
  "steps": [
  {
  "click": "[data-tour=menu]",
  "label": "menu open", "optional": 1
  },
  {
  "reload": 1,
  "click": "[data-tour=bell]",
  "label": "bell open"
  },
  {
  "reload": 1,
  "click": "summary[aria-label='More options']",
  "label": "more open", "optional": 1
  }
  ]
  },
  {
  "url": "/ui-preview?p=child&tab=lessons",
  "steps": [
  {
  "click": "[data-tour=menu]",
  "label": "menu open", "optional": 1
  },
  {
  "reload": 1,
  "click": "[data-tour=bell]",
  "label": "bell open"
  },
  {
  "reload": 1,
  "click": "summary[aria-label='More options']",
  "label": "more open", "optional": 1
  }
  ]
  },
  {
  "url": "/ui-preview?p=child&tab=game",
  "steps": [
  {
  "click": "[data-tour=menu]",
  "label": "menu open", "optional": 1
  },
  {
  "reload": 1,
  "click": "[data-tour=bell]",
  "label": "bell open"
  },
  {
  "reload": 1,
  "click": "summary[aria-label='More options']",
  "label": "more open", "optional": 1
  }
  ]
  },
  {
  "url": "/ui-preview?p=child&tab=login",
  "steps": [
  {
  "click": "[data-tour=menu]",
  "label": "menu open", "optional": 1
  },
  {
  "reload": 1,
  "click": "[data-tour=bell]",
  "label": "bell open"
  },
  {
  "reload": 1,
  "click": "summary[aria-label='More options']",
  "label": "more open", "optional": 1
  }
  ]
  },
  {
  "url": "/ui-preview?p=class&tab=students",
  "steps": [
  {
  "click": "[data-tour=menu]",
  "label": "menu open", "optional": 1
  },
  {
  "reload": 1,
  "click": "[data-tour=bell]",
  "label": "bell open"
  },
  {
  "reload": 1,
  "click": "summary[aria-label='More options']",
  "label": "more open", "optional": 1
  }
  ]
  },
  {
  "url": "/ui-preview?p=class&tab=lessons",
  "steps": [
  {
  "click": "[data-tour=menu]",
  "label": "menu open", "optional": 1
  },
  {
  "reload": 1,
  "click": "[data-tour=bell]",
  "label": "bell open"
  },
  {
  "reload": 1,
  "click": "summary[aria-label='More options']",
  "label": "more open", "optional": 1
  }
  ]
  },
  {
  "url": "/ui-preview?p=class&tab=exercises",
  "steps": [
  {
  "click": "[data-tour=menu]",
  "label": "menu open", "optional": 1
  },
  {
  "reload": 1,
  "click": "[data-tour=bell]",
  "label": "bell open"
  },
  {
  "reload": 1,
  "click": "summary[aria-label='More options']",
  "label": "more open", "optional": 1
  }
  ]
  },
  {
  "url": "/ui-preview?p=class&tab=progress",
  "steps": [
  {
  "click": "[data-tour=menu]",
  "label": "menu open", "optional": 1
  },
  {
  "reload": 1,
  "click": "[data-tour=bell]",
  "label": "bell open"
  },
  {
  "reload": 1,
  "click": "summary[aria-label='More options']",
  "label": "more open", "optional": 1
  }
  ]
  },
  {
  "url": "/ui-preview?p=class&tab=settings",
  "steps": [
  {
  "click": "[data-tour=menu]",
  "label": "menu open", "optional": 1
  },
  {
  "reload": 1,
  "click": "[data-tour=bell]",
  "label": "bell open"
  },
  {
  "reload": 1,
  "click": "summary[aria-label='More options']",
  "label": "more open", "optional": 1
  }
  ]
  },
  {
  "url": "/ui-preview?p=lessons",
  "steps": [
  {
  "click": "button:has-text('Change')",
  "label": "change open"
  }
  ]
  },
  "/admin/login"
  ]
const ONLY = process.env.ONLY // optional filter substring of profile name
// name, w, h, insets, mobile
const PROFILES = [
  ['se1-portrait', 320, 568, [20, 0, 0, 0], 1],
  ['android-s', 360, 640, [0, 24, 0, 0], 1],
  ['se3-portrait', 375, 667, [20, 0, 0, 0], 1],
  ['iphone15-portrait', 393, 852, [59, 34, 0, 0], 1],
  ['iphone-promax-portrait', 430, 932, [59, 34, 0, 0], 1],
  ['pixel-portrait', 412, 915, [0, 24, 0, 0], 1],
  ['se1-landscape', 568, 320, [0, 0, 0, 0], 1],
  ['se3-landscape', 667, 375, [0, 0, 0, 0], 1],
  ['iphone15-landscape', 852, 393, [0, 21, 59, 59], 1],
  ['promax-landscape', 932, 430, [0, 21, 59, 59], 1],
  ['android-landscape', 915, 412, [0, 0, 24, 0], 1],
  ['ipad-mini-portrait', 744, 1133, [24, 20, 0, 0], 1],
  ['ipad-portrait', 820, 1180, [24, 20, 0, 0], 1],
  ['ipad-landscape', 1180, 820, [24, 20, 0, 0], 1],
  ['ipadpro-landscape', 1366, 1024, [24, 20, 0, 0], 1],
  ['laptop-s', 1280, 720, [0, 0, 0, 0], 0],
  ['laptop', 1440, 900, [0, 0, 0, 0], 0],
  ['desktop', 1920, 1080, [0, 0, 0, 0], 0],
  ['wide', 2560, 1440, [0, 0, 0, 0], 0],
].filter(p => !ONLY || p[0].includes(ONLY))

function inspect([T, B, L, R]) {
  const W = innerWidth, H = innerHeight, out = []
  const sel = e => { let s = e.tagName.toLowerCase(); if (e.id) s += '#' + e.id; const dt = e.getAttribute('data-tour') || e.getAttribute('data-t'); if (dt) s += `[${dt}]`; const t = (e.getAttribute('aria-label') || e.innerText || e.getAttribute('alt') || '').trim().replace(/\s+/g, ' ').slice(0, 40); return t ? `${s} "${t}"` : s }
  const vis = e => { if (!e.checkVisibility({ visibilityProperty: true, opacityProperty: true, contentVisibilityAuto: true })) return false; const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1 }
  const fixedish = e => { for (let n = e; n && n !== document.body; n = n.parentElement) { const p = getComputedStyle(n).position; if (p === 'fixed' || p === 'sticky') return true } return false }
  const hiddenByAncestor = e => { const r = e.getBoundingClientRect(); for (let n = e.parentElement; n && n !== document.body; n = n.parentElement) { const c = getComputedStyle(n); if (c.overflow !== 'visible' || c.overflowX !== 'visible') { const q = n.getBoundingClientRect(); if (r.right <= q.left || r.left >= q.right || r.bottom <= q.top || r.top >= q.bottom) return true } } return false }
  const sw = document.documentElement.scrollWidth
  if (sw > W + 1) out.push(['hscroll', `page is ${sw}px wide in a ${W}px screen`])
  // An open dialog, drawer or tour card is MEANT to cover the page: while one is up, only what is inside it is judged.
  const tops = [...document.querySelectorAll(':modal, [aria-modal=true], .dash-coach')].filter(e => e.checkVisibility())
  const inTop = e => !tops.length || tops.some(t => t.contains(e))
  // A list that scrolls may pass under the home bar — its END must be able to scroll clear, which padding handles.
  const scrollsOnDown = e => { for (let n = e.parentElement; n; n = n.parentElement) { const c = getComputedStyle(n); if (/(auto|scroll)/.test(c.overflowY) && n.scrollHeight > n.clientHeight + 1 && n.scrollTop + n.clientHeight < n.scrollHeight - 1) return true; if (n === document.body) break } return false }
  const inter = [...document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,[role=button],[role=tab],[role=switch],[role=link]')].filter(vis)
  const texty = [...document.querySelectorAll('body *')].filter(e => !(e instanceof SVGElement) && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())).filter(vis)
  const seen = new Set()
  for (const e of new Set([...inter, ...texty])) {
    if (hiddenByAncestor(e) || !inTop(e)) continue
    const r = e.getBoundingClientRect(), fx = fixedish(e)
    const top = fx || r.top + scrollY < T  // in-flow content only counts at scroll 0
    if (T && top && r.top < T && r.bottom > 2 && r.top > -r.height) out.push(['under-status-bar', `${sel(e)} top=${Math.round(r.top)} (safe from ${T})`])
    if (B && fx && r.bottom > H - B && r.top < H && !scrollsOnDown(e)) out.push(['under-home-bar', `${sel(e)} bottom=${Math.round(r.bottom)} (safe to ${H - B})`])
    if (L && r.left < L && r.right > 0 && r.top < H && r.bottom > 0) out.push(['under-notch-left', `${sel(e)} left=${Math.round(r.left)} (safe from ${L})`])
    if (R && r.right > W - R && r.left < W && r.top < H && r.bottom > 0) out.push(['under-notch-right', `${sel(e)} right=${Math.round(r.right)} (safe to ${W - R})`])
  }
  for (const e of inter) {
    if (hiddenByAncestor(e) || !inTop(e)) continue
    const r = e.getBoundingClientRect()
    if ((r.left < -1 || r.right > W + 1) && r.bottom > 0 && r.top < H) {
      let scroller = false; for (let n = e.parentElement; n; n = n.parentElement) { const c = getComputedStyle(n); if (/(auto|scroll)/.test(c.overflowX) && n.scrollWidth > n.clientWidth) { scroller = true; break } }
      if (!scroller) out.push(['offscreen-x', `${sel(e)} x=${Math.round(r.left)}..${Math.round(r.right)} of ${W}`])
    }
    if (r.top < 0 || r.bottom > H || r.left < 0 || r.right > W) continue
    const pts = [[r.left + r.width / 2, r.top + r.height / 2]]
    for (const [x, y] of pts) {
      const h = document.elementFromPoint(x, y)
      if (!h || h === e || e.contains(h) || h.contains(e)) continue
      if (h.closest('label') && h.closest('label').contains(e)) continue
      if (h.closest('details[open]') && !h.closest('details[open]').contains(e)) continue // an open ⋯ menu floats over the page on purpose
      if (h.closest('nextjs-portal')) continue // the dev server's own badge — not in the shipped app
      if (fixedish(h) && scrollsOnDown(e)) continue // a pinned Save bar over a list that still scrolls clear of it
      out.push(['covered', `${sel(e)} is under ${sel(h)}`])
    }
  }
  for (const e of texty) {
    const c = getComputedStyle(e)
    const clipX = /(hidden|clip)/.test(c.overflowX) && e.scrollWidth > e.clientWidth + 2 && c.textOverflow !== 'ellipsis'
    const clipY = /(hidden|clip)/.test(c.overflowY) && e.scrollHeight > e.clientHeight + 2 && !c.webkitLineClamp?.match(/\d/)
    if (clipX || clipY) out.push(['text-clipped', `${sel(e)} ${e.scrollWidth}x${e.scrollHeight} in ${e.clientWidth}x${e.clientHeight}`])
  }
  return out.filter(([k, m]) => { const key = k + m; if (seen.has(key)) return false; seen.add(key); return true })
}

const engine = process.env.ENGINE === 'webkit' ? webkit : chromium
const browser = await engine.launch()
const results = []
const t0 = Date.now()
for (const [name, w, h, insets, mobile] of PROFILES) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: engine === chromium ? !!mobile : undefined, hasTouch: !!mobile, deviceScaleFactor: mobile ? 2 : 1 })
  if (process.env.SEED) await ctx.addInitScript(process.env.SEED)
  const page = await ctx.newPage()
  if (engine === chromium) { const s = await ctx.newCDPSession(page); await s.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: insets[0], bottom: insets[1], left: insets[2], right: insets[3] } }) }
  for (const R0 of ROUTES) {
    const R = typeof R0 === 'string' ? { url: R0, steps: [] } : R0
    const ins = engine === chromium ? insets : [0, 0, 0, 0]
    const check = async (label) => { const found = await page.evaluate(inspect, ins); for (const [rule, msg] of found) results.push({ route: R.url + label, profile: name, rule, msg }) }
    try {
      await page.goto(BASE + R.url, { waitUntil: 'networkidle', timeout: 45000 })
      await page.waitForTimeout(+(process.env.SETTLE ?? 800))
      await check('')
      for (const st of R.steps) {
        for (let k = 0; k < (st.times ?? 1); k++) {
          if (st.reload) { await page.goto(BASE + R.url, { waitUntil: 'networkidle' }); await page.waitForTimeout(600) }
          const loc = page.locator(st.click).filter({ visible: true }).first()
          if (!(await loc.count())) { if (st.times || st.optional) break; results.push({ route: R.url + ' ▸ ' + st.label, profile: name, rule: 'step-missing', msg: st.click }); break }
          if (st.fill) await loc.fill(st.fill); else await loc.click({ timeout: 5000 }).catch(e => results.push({ route: R.url + ' ▸ ' + st.label, profile: name, rule: 'click-failed', msg: e.message.split('\n')[0] }))
          if (st.press) await page.keyboard.press(st.press)
          await page.waitForTimeout(st.wait ?? 700)
          await check(' ▸ ' + st.label + (st.times ? ' #' + (k + 1) : ''))
        }
      }
    } catch (e) { results.push({ route: R.url, profile: name, rule: 'load-error', msg: e.message.split('\n')[0] }) }
  }
  await ctx.close()
  console.error(`· ${name} done — ${results.length} findings so far, ${Math.round((Date.now() - t0) / 1000)}s`)
}
await browser.close()
if (process.env.OUT) writeFileSync(process.env.OUT, JSON.stringify(results, null, 1))
const by = {}; for (const r of results) { const k = `${r.route} | ${r.rule} | ${r.msg.replace(/-?\d+(\.\d+)?/g, '#')}`; (by[k] ??= new Set()).add(r.profile) }
for (const [k, v] of Object.entries(by).sort()) console.log(`${k}  @ ${[...v].join(',')}`)
const blind = results.filter(r => /load-error|step-missing|click-failed/.test(r.rule))
console.log(`\n${results.length} findings, ${Object.keys(by).length} distinct`)
if (blind.length) { console.log(`COULD NOT LOOK at ${blind.length} page/step(s) — see load-error / step-missing / click-failed above`); process.exit(2) }
process.exit(results.length ? 1 : 0)
