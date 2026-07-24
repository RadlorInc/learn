/**
 * Chapter 4 (Home Time) layout invariants.
 *
 * Every founder-visible layout fault in these creature chapters — the moonwalk, the pile-up, the
 * cut-off leader — was a hand-tuned constant that happened to hold at 1024×600 with three rabbits
 * and broke on a wider sprite or a fifth creature. So the layout is a set of INVARIANTS derived
 * from each sprite's own aspect, and this sweeps every screen size × pool size × creature and
 * asserts them. A screenshot cannot check this: the creatures are pointerEvents:none, so
 * elementFromPoint looks straight through them.
 */
import { describe, it, expect } from 'vitest'
import {
  CAST, HABITATS, homeOf, aspectOf, huddleGeom, huddleRows, waitSpot, clusterSpot, leadX, fitBands,
  GATHER_LEFT, GATHER_COL, HUDDLE_RIGHT, LEAD_X as MILO_X, LEAD_SCALE as MILO_SCALE, BANNER_PX, STRIP_PX,
  type Habitat,
} from '@/features/chapters/story/critters'

const BANDS: Record<Habitat['move'], { lead: number; cluster: number; wait: [number, number] }> = {
  land: { lead: 92, cluster: 72, wait: [82, 92] },
  swim: { lead: 76, cluster: 46, wait: [64, 76] },
  air:  { lead: 88, cluster: 54, wait: [64, 76] },
}
const bandsFor = (w: Habitat): Habitat => {
  const b = BANDS[w.move]
  return { ...w, lineY: b.cluster, waitY0: b.wait[0], waitY1: b.wait[1] }
}

const MILO_LAND = '/assets/characters/milo_side.png'
const MILO_REEF = '/assets/characters/milo_underwater.png'

/** The sizing chain out of HomeScene, in the same order — Milo's place from the UNCAPPED size,
 *  then the huddle's room, then the sprite capped to its slot. */
function layout(vw: number, vh: number, pool: number, castIdx: number) {
  const kind = CAST[castIdx]
  const world = homeOf(kind)
  const short = vh < 470
  const baseSize = Math.round(Math.max(short ? 54 : 66, Math.min((vw * 0.86) / pool, vh * (short ? 0.28 : 0.24), 152)))
  const aspect = aspectOf(kind.src)
  const rawSize = baseSize * (kind.scale ?? 1)
  const miloSrc = world.move === 'swim' ? MILO_REEF : MILO_LAND
  const mx = leadX(MILO_X, rawSize, aspectOf(miloSrc), MILO_SCALE, vw)
  const edgePct = (rawSize * aspect / 2) / Math.max(1, vw) * 100
  const spanPct = huddleGeom(pool, HUDDLE_RIGHT, edgePct).span
  const rows = huddleRows(spanPct, (rawSize * aspect) / Math.max(1, vw) * 100)
  const slotPx = spanPct * rows / 100 * vw
  const size = Math.round(Math.max(40, Math.min(rawSize, (slotPx / aspect) * 0.98)))
  const band: Habitat = fitBands(bandsFor(world), vh, size, MILO_SCALE)
  const leadY = Math.max(band.lineY + 4, Math.min(BANDS[world.move].lead, (vh - STRIP_PX) / vh * 100))
  return { kind, world, mx, edgePct, rows, size, band, leadY, aspect, miloSrc, spanPct }
}
const halfW = (size: number, scale: number, aspect: number, vw: number) => (size * scale * aspect / 2) / vw * 100

const SIZES: Array<[number, number]> = [
  [640, 320], [667, 375], [740, 360], [812, 375], [844, 390], [896, 414],
  [1024, 400], [1024, 600], [1180, 820], [1280, 800], [1512, 860], [1920, 1080],
]
const POOLS = [3, 4, 5, 6, 7, 8, 9, 10]

describe('Home Time layout invariants', () => {
  it('holds across every screen × pool × creature', () => {
    const failures: string[] = []
    for (const [vw, vh] of SIZES) {
      for (const pool of POOLS) {
        for (let c = 0; c < CAST.length; c++) {
          const L = layout(vw, vh, pool, c)
          const tag = `${vw}x${vh} pool=${pool} ${L.kind.little}`
          const half = halfW(L.size, 1, L.aspect, vw)

          const waits = Array.from({ length: pool }, (_, i) => waitSpot(i, pool, L.band, HUDDLE_RIGHT, L.edgePct, L.rows))
          // The whole gather cluster, at its worst case: every one of the pool chosen at once.
          const cluster = Array.from({ length: pool }, (_, k) => clusterSpot(k, L.band, L.mx - 6, GATHER_COL, GATHER_LEFT))

          // ① Travel always runs left→right. A creature standing right of where it is going walks
          //    BACKWARDS while its legs run forwards — that is the moonwalk.
          const huddleRight = Math.max(...waits.map(w => w.left))
          const clusterLeft = Math.min(...cluster.map(s => s.left))
          if (huddleRight >= clusterLeft) failures.push(`${tag}: huddle ${huddleRight.toFixed(1)}% reaches the cluster at ${clusterLeft.toFixed(1)}%`)

          // ② Nothing crosses a screen edge — measured from the sprite's own width, since a shark
          //    is 1.75× wider than it is tall and hangs off an edge a tall sprite clears.
          const leftMost = Math.min(...waits.map(w => w.left)) - half
          if (leftMost < 0) failures.push(`${tag}: leftmost sprite off screen at ${leftMost.toFixed(1)}%`)
          const miloRight = L.mx + halfW(L.size, MILO_SCALE, aspectOf(L.miloSrc), vw)
          if (miloRight > 97.5) failures.push(`${tag}: Milo's right edge at ${miloRight.toFixed(1)}%`)
          const clusterRight = Math.max(...cluster.map(s => s.left)) + halfW(L.size, 0.8, L.aspect, vw)
          if (clusterRight > 100) failures.push(`${tag}: cluster runs off the right at ${clusterRight.toFixed(1)}%`)

          // ③ Two creatures in the SAME huddle row must not overlap, or one buries the other and
          //    the child cannot count them.
          const sameRowGap = L.spanPct * L.rows - (L.size * L.aspect / vw * 100)
          if (pool > 1 && sameRowGap < 0) failures.push(`${tag}: same-row overlap of ${(-sameRowGap).toFixed(1)}%`)

          // ④ Still big enough to see and to hit. 46px is the floored tap target in HomeScene.
          if (L.size < 40) failures.push(`${tag}: sprite ${L.size}px`)
          if (Math.max(46, Math.round(L.size * 1.05)) < 44) failures.push(`${tag}: tap target too small`)

          // ⑤ fitBands' actual contract, in px: heads clear the PROMPT PILL (not merely the top of
          //    the screen — at 640×320 the pill owns the top 29% and every reef head sat behind
          //    it), feet clear the Ready button along the bottom, and the cluster always stands
          //    further back than the huddle.
          // EPS because fitBands puts the head EXACTLY on the prompt's lower edge by construction
          // (that is its contract, and BANNER_PX already carries a few px of air) — without it the
          // sweep trips on float dust at every size where the fit actually binds.
          const EPS = 0.5
          // Milo stands on his own GROUND line, not the cluster's or the huddle's — see BANDS.
          const miloHead = L.leadY / 100 * vh - L.size * MILO_SCALE
          if (miloHead < BANNER_PX - EPS) failures.push(`${tag}: Milo's head ${(BANNER_PX - miloHead).toFixed(0)}px behind the prompt`)
          const clusterHead = L.band.lineY / 100 * vh - L.size * 0.8
          if (clusterHead < BANNER_PX - EPS) failures.push(`${tag}: gathered head ${(BANNER_PX - clusterHead).toFixed(0)}px behind the prompt`)
          // Measured off the REAL spots, not the band they came from: waitSpot adds an organic
          // per-creature jitter, and reading the band instead of the spot is exactly how a 5px
          // overlap with the Ready button survived a clean sweep.
          const waitHead = Math.min(...waits.map(w => w.top)) / 100 * vh - L.size
          if (waitHead < BANNER_PX - EPS) failures.push(`${tag}: waiting head ${(BANNER_PX - waitHead).toFixed(0)}px behind the prompt`)
          const feet = Math.max(L.leadY, ...waits.map(w => w.top)) / 100 * vh
          if (feet > vh - STRIP_PX + EPS) failures.push(`${tag}: feet ${(feet - (vh - STRIP_PX)).toFixed(0)}px inside the Ready button`)
          // The leader must stand NEARER the camera than the group he is gathering, or he is
          // standing among them rather than at the head of them.
          if (L.leadY <= L.band.lineY) failures.push(`${tag}: leader not in front of the group`)
          if (L.band.lineY >= L.band.waitY0) failures.push(`${tag}: cluster band is not behind the huddle`)
        }
      }
    }
    expect(failures.slice(0, 12)).toEqual([])
  })

  it('never repeats a creature across a ten-round run, and every habitat is reachable', () => {
    const seen = new Set(Array.from({ length: 10 }, (_, r) => CAST[r % CAST.length].src))
    expect(seen.size).toBe(10)
    expect(new Set(CAST.map(k => k.home))).toEqual(new Set(Object.keys(HABITATS)))
  })
})
