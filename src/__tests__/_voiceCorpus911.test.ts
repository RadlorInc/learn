/**
 * The 9–11 spoken corpus → scripts/.voice-corpus-9-11.json, for voice-generate.mts --corpus.
 *
 *   VOICE_CORPUS=1 npx vitest run src/__tests__/_voiceCorpus911.test.ts
 *
 * ⚠️ WHY THIS EXISTS RATHER THAN `scripts/voice-corpus.mts`. That script greps the game .tsx
 * files for `say:`/`work:`/`blurb:` LITERALS, which is right for 12–18 — their lines are written
 * in the component. The ten 9–11 chapters are ports: their spoken text is BUILT AT RUNTIME by the
 * maths module (`r.spoken`, `explainBeats(r)`), so it exists nowhere as a literal and the grep
 * finds only the ten start blurbs. Driving `config.makeTask` to saturation is the only way to see
 * the lines a child actually hears. Same reason `_voiceCorpus35.test.ts` is a vitest file.
 *
 * What GameShell actually speaks, and so what is collected (see its speak() call sites):
 *   t.say                       — the round, at tiers 1–2 only (`if (d < 3)`)
 *   `${g.coach} ${g.task.say}`  — the guided round, spoken as ONE utterance
 *   `It was ${revealText}. ${encouragement}` — the miss, likewise one utterance
 *   task.work[]                 — the 3-wrong re-teach, one utterance per line
 *   overview.say, tutorial step says, start.blurb
 * NOT collected: anything carrying the child's name (unrenderable), and PRAISE — `praisesOnCorrect`
 * is 3–5 / 6–8 only, so this band hears none.
 */
import { it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { clipKey } from '@/core/voiceClips'
import { ENCOURAGEMENT } from '@/shared/hooks/useAdaptive'
import { COIN_TRAY_CONFIG } from '@/features/chapters/teen/games/CoinTrayGame'
import { FACTOR_LAB_CONFIG } from '@/features/chapters/teen/games/FactorLabGame'
import { PIZZA_COUNTER_CONFIG } from '@/features/chapters/teen/games/PizzaCounterGame'
import { HEIGHT_BAR_CONFIG } from '@/features/chapters/teen/games/HeightBarGame'
import { ANGLE_SHOP_CONFIG } from '@/features/chapters/teen/games/AngleShopGame'
import { MISSION_BRIEF_CONFIG } from '@/features/chapters/teen/games/MissionBriefGame'
import { EMPTY_PLOT_CONFIG } from '@/features/chapters/teen/games/EmptyPlotGame'
import { LOADING_BAY_CONFIG } from '@/features/chapters/teen/games/LoadingBayGame'
import { PACKING_SHED_CONFIG } from '@/features/chapters/teen/games/PackingShedGame'
import { BUS_RUN_CONFIG } from '@/features/chapters/teen/games/BusRunGame'

/* eslint-disable @typescript-eslint/no-explicit-any */
type Bucket = 'scored' | 'teach' | 'miss' | 'reteach'
const ORDER: Bucket[] = ['scored', 'teach', 'miss', 'reteach']
const lines = new Map<string, { text: string; kind: Bucket; sources: string[] }>()

function add(kind: Bucket, src: string, ...texts: (string | undefined)[]) {
  for (const raw of texts) {
    if (typeof raw !== 'string') continue
    const text = raw.replace(/\s+/g, ' ').trim()
    if (!text || !/[a-zA-Z]/.test(text) || text.length > 300) continue
    const key = clipKey(text)
    const hit = lines.get(key)
    if (!hit) lines.set(key, { text, kind, sources: [src] })
    else {
      if (!hit.sources.includes(src)) hit.sources.push(src)
      if (ORDER.indexOf(kind) < ORDER.indexOf(hit.kind)) hit.kind = kind
    }
  }
}

const CONFIGS: [string, any][] = [
  ['coinTray', COIN_TRAY_CONFIG], ['factorLab', FACTOR_LAB_CONFIG], ['pizzaCounter', PIZZA_COUNTER_CONFIG],
  ['heightBar', HEIGHT_BAR_CONFIG], ['angleShop', ANGLE_SHOP_CONFIG], ['missionBrief', MISSION_BRIEF_CONFIG],
  ['emptyPlot', EMPTY_PLOT_CONFIG], ['loadingBay', LOADING_BAY_CONFIG], ['packingShed', PACKING_SHED_CONFIG],
  ['busRun', BUS_RUN_CONFIG],
]
const DRAWS = 1500
const list = (x: any) => (x == null ? [] : Array.isArray(x) ? x : [x])

it('builds the 9–11 corpus', () => {
  if (!process.env.VOICE_CORPUS) return

  for (const [name, c] of CONFIGS) {
    add('teach', name, typeof c.start?.blurb === 'string' ? c.start.blurb : undefined, c.overview?.say)
    for (const t of list(c.tutorial)) for (const s of t.steps ?? []) add('teach', name, s.say)
    // The guided line is spoken as ONE utterance, so that whole string is the clip.
    for (const g of list(c.guided)) add('teach', name, `${g.coach} ${g.task.say}`, g.task.say)

    // ⚠️ `asked` is varied because a chapter declaring `coverage` spends a scarce round on an
    // UNMET reading — held at [] the generator is deterministic by type and a sweep draws one
    // question kind per tier while reporting itself thorough (chapter-craft.md §4).
    const cov: string[] = c.coverage?.all ?? []
    for (let i = 0; i < DRAWS; i++) {
      const d = ((i % 3) + 1) as 1 | 2 | 3
      const asked = cov.slice(0, i % (cov.length + 1))
      let t: any
      try { t = c.makeTask(d, asked) } catch { continue }
      if (!t) continue
      // t.say is spoken at tiers 1–2 only; collected regardless of the draw's own d.
      add('scored', name, t.say)
      add('reteach', name, ...(t.work ?? []))
      const rev = c.revealText?.(t)
      if (typeof rev === 'string') for (const e of ENCOURAGEMENT.flat()) add('miss', name, `It was ${rev}. ${e}`)
    }
  }

  // ⚠️ RENDER ORDER IS VALUE ORDER, because the corpus is bigger than a month's quota and
  // voice-generate walks it top to bottom until the 401. `teach` is the fixed walkthrough every
  // first run plays (69 lines); `reteach` is only ever heard after three wrong in a row.
  const RENDER: Bucket[] = ['teach', 'scored', 'miss', 'reteach']
  const out = [...lines.entries()]
    .map(([key, v]) => ({ key, text: v.text, chars: v.text.length, kind: v.kind, sources: v.sources }))
    .sort((a, b) => RENDER.indexOf(a.kind) - RENDER.indexOf(b.kind) || b.chars - a.chars)
  writeFileSync('scripts/.voice-corpus-9-11.json', JSON.stringify(out, null, 2))
  const per = ORDER.map(k => `${k} ${out.filter(l => l.kind === k).length}`).join(' · ')
  console.warn(`9–11 corpus: ${out.length} lines · ${out.reduce((n, l) => n + l.chars, 0).toLocaleString()} chars — ${per}`)
})
