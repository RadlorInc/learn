/**
 * Measure the spoken corpus of the 12–18 GameShell bands, the way _voiceCorpus911 does for 9–11:
 * their `say`/`work`/reveal text is BUILT AT RUNTIME from each round's numbers, so it exists
 * nowhere as a literal and `scripts/voice-corpus.mts`'s grep can only ever see the fixed lines.
 *
 *   VOICE_CORPUS=1 npx vitest run src/__tests__/_voiceCorpusTeen.test.ts
 *
 * Writes scripts/.voice-corpus-teen.json. Reporting only — nothing renders from it yet.
 */
import { it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { clipKey } from '@/core/voiceClips'
import { ENCOURAGEMENT } from '@/shared/hooks/useAdaptive'
import { CONFIG as FunctionFactory_C } from '@/features/chapters/teen/games/FunctionFactory'
import { CONFIG as NightFlight_C } from '@/features/chapters/teen/games/NightFlight'
import { CONFIG as BalanceBench_C } from '@/features/chapters/teen/games/BalanceBench'
import { CONFIG as GearLab_C } from '@/features/chapters/teen/games/GearLab'
import { CONFIG as BuildSite_C } from '@/features/chapters/teen/games/BuildSite'
import { CONFIG as WeatherStation_C } from '@/features/chapters/teen/games/WeatherStation'
import { CONFIG as CableCar_C } from '@/features/chapters/teen/games/CableCar'
import { CONFIG as ScoreMachine_C } from '@/features/chapters/teen/games/ScoreMachine'
import { CONFIG as StoreCheckout_C } from '@/features/chapters/teen/games/StoreCheckout'
import { CONFIG as JuiceBar_C } from '@/features/chapters/teen/games/JuiceBar'
import { CONFIG as KitchenCounter_C } from '@/features/chapters/teen/games/KitchenCounter'
import { CONFIG as SkyTower_C } from '@/features/chapters/teen/games/SkyTower'
import { CONFIG as PowerUps_C } from '@/features/chapters/teen/games/PowerUps'
import { CONFIG as TicketCheckout_C } from '@/features/chapters/teen/games/TicketCheckout'
import { CONFIG as BuildPlot_C } from '@/features/chapters/teen/games/BuildPlot'
import { CONFIG as GoingViral_C } from '@/features/chapters/teen/games/GoingViral'
import { CONFIG as SkateRamp_C } from '@/features/chapters/teen/games/SkateRamp'
import { CONFIG as MapMaker_C } from '@/features/chapters/teen/games/MapMaker'
import { CONFIG as SavingGoal_C } from '@/features/chapters/teen/games/SavingGoal'
import { CONFIG as TheShot_C } from '@/features/chapters/teen/games/TheShot'
import { CONFIG as ScreenDistance_C } from '@/features/chapters/teen/games/ScreenDistance'
import { CONFIG as Leaderboard_C } from '@/features/chapters/teen/games/Leaderboard'
import { CONFIG as FollowerGrowth_C } from '@/features/chapters/teen/games/FollowerGrowth'
import { CONFIG as BestPlan_C } from '@/features/chapters/teen/games/BestPlan'
import { CONFIG as TwoReceipts_C } from '@/features/chapters/teen/games/TwoReceipts'
import { CONFIG as DaylightHours_C } from '@/features/chapters/teen/games/DaylightHours'
import { CONFIG as BigWheel_C } from '@/features/chapters/teen/games/BigWheel'
import { CONFIG as TorchOnTheWall_C } from '@/features/chapters/teen/games/TorchOnTheWall'
import { CONFIG as BalanceThatGrows_C } from '@/features/chapters/teen/games/BalanceThatGrows'
import { CONFIG as ColdSnap_C } from '@/features/chapters/teen/games/ColdSnap'
import { CONFIG as TheReviews_C } from '@/features/chapters/teen/games/TheReviews'
import { CONFIG as WalkHome_C } from '@/features/chapters/teen/games/WalkHome'
import { CONFIG as PhotoFilters_C } from '@/features/chapters/teen/games/PhotoFilters'
import { CONFIG as Pace_C } from '@/features/chapters/teen/games/Pace'
import { CONFIG as ResaleFlip_C } from '@/features/chapters/teen/games/ResaleFlip'
import { CONFIG as ShareTheWifi_C } from '@/features/chapters/teen/games/ShareTheWifi'
import { CONFIG as TrainingBlock_C } from '@/features/chapters/teen/games/TrainingBlock'

/* eslint-disable @typescript-eslint/no-explicit-any */
const CONFIGS: [string, string, any][] = [
  ['12-14', 'FunctionFactory', FunctionFactory_C],
  ['12-14', 'NightFlight', NightFlight_C],
  ['12-14', 'BalanceBench', BalanceBench_C],
  ['12-14', 'GearLab', GearLab_C],
  ['12-14', 'BuildSite', BuildSite_C],
  ['12-14', 'WeatherStation', WeatherStation_C],
  ['12-14', 'CableCar', CableCar_C],
  ['12-14', 'ScoreMachine', ScoreMachine_C],
  ['12-14', 'StoreCheckout', StoreCheckout_C],
  ['12-14', 'JuiceBar', JuiceBar_C],
  ['12-14', 'KitchenCounter', KitchenCounter_C],
  ['12-14', 'SkyTower', SkyTower_C],
  ['15-16', 'PowerUps', PowerUps_C],
  ['15-16', 'TicketCheckout', TicketCheckout_C],
  ['15-16', 'BuildPlot', BuildPlot_C],
  ['15-16', 'GoingViral', GoingViral_C],
  ['15-16', 'SkateRamp', SkateRamp_C],
  ['15-16', 'MapMaker', MapMaker_C],
  ['15-16', 'SavingGoal', SavingGoal_C],
  ['15-16', 'TheShot', TheShot_C],
  ['15-16', 'ScreenDistance', ScreenDistance_C],
  ['15-16', 'Leaderboard', Leaderboard_C],
  ['15-16', 'FollowerGrowth', FollowerGrowth_C],
  ['15-16', 'BestPlan', BestPlan_C],
  ['17-18', 'TwoReceipts', TwoReceipts_C],
  ['17-18', 'DaylightHours', DaylightHours_C],
  ['17-18', 'BigWheel', BigWheel_C],
  ['17-18', 'TorchOnTheWall', TorchOnTheWall_C],
  ['17-18', 'BalanceThatGrows', BalanceThatGrows_C],
  ['17-18', 'ColdSnap', ColdSnap_C],
  ['17-18', 'TheReviews', TheReviews_C],
  ['17-18', 'WalkHome', WalkHome_C],
  ['17-18', 'PhotoFilters', PhotoFilters_C],
  ['17-18', 'Pace', Pace_C],
  ['17-18', 'ResaleFlip', ResaleFlip_C],
  ['17-18', 'ShareTheWifi', ShareTheWifi_C],
  ['17-18', 'TrainingBlock', TrainingBlock_C],
]
const lines = new Map<string, { text: string; kind: string; band: string; chapter: string }>()
const add = (band: string, chapter: string, kind: string, ...texts: (string | undefined)[]) => {
  for (const raw of texts) {
    if (typeof raw !== 'string') continue
    const text = raw.replace(/\s+/g, ' ').trim()
    if (!text || !/[a-zA-Z]/.test(text) || text.length > 300) continue
    if (!lines.has(clipKey(text))) lines.set(clipKey(text), { text, kind, band, chapter })
  }
}
const list = (x: any) => (x == null ? [] : Array.isArray(x) ? x : [x])

it('measures the 12–18 corpus', () => {
  if (!process.env.VOICE_CORPUS) return
  add('shared', 'shared', 'miss', ...ENCOURAGEMENT.flat())
  for (const [band, name, c] of CONFIGS) {
    add(band, name, 'teach', typeof c.start?.blurb === 'string' ? c.start.blurb : undefined, c.overview?.say)
    for (const t of list(c.tutorial)) for (const s of t.steps ?? []) add(band, name, 'teach', s.say)
    for (const g of list(c.guided)) add(band, name, 'teach', `${g.coach} ${g.task.say}`)
    const cov: string[] = c.coverage?.all ?? []
    for (let i = 0; i < 1500; i++) {
      const d = ((i % 3) + 1) as 1 | 2 | 3
      let t: any
      try { t = c.makeTask(d, cov.slice(0, i % (cov.length + 1))) } catch { continue }
      if (!t) continue
      add(band, name, 'scored', t.say)
      add(band, name, 'reteach', ...(t.work ?? []))
      const rev = c.revealText?.(t)
      if (typeof rev === 'string') add(band, name, 'miss', `It was ${rev}.`)
    }
  }
  writeFileSync('scripts/.voice-corpus-teen.json',
    JSON.stringify([...lines.entries()].map(([key, v]) => ({ key, chars: v.text.length, ...v })), null, 2))
})
