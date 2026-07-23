/**
 * ParadeStage — the counting parade, rendered as a real-time canvas scene.
 *
 * WHY THIS EXISTS: the DOM parade animated with CSS `transition` + keyframes. That gives linear
 * travel, a canned bob, and nothing else — no squash on footfall, no particles, no camera, no
 * secondary motion. This is the same parade driven by a game loop instead: spring physics, a
 * procedural gait per locomotion type, a particle system, and a camera that punches on a count.
 *
 * DIVISION OF LABOUR (matters if you extend this):
 *   • This class owns the SCENE — spawning, gaits, tap hit-testing, effects, exits.
 *   • React owns the GAME — how many are counted, the answer choices, speech, adaptive scoring.
 *   • The DOM `BiomeBackground` stays the backdrop; this canvas is transparent and sits over it,
 *     so the biome cross-fade and all the responsive work keep working untouched.
 *
 * The only thing crossing the boundary is `onCount()` (a creature was tapped) — React reacts.
 *
 * CEILING, stated honestly: the source art is ONE static PNG per creature, so every gait here is
 * procedural (bob / squash / lean / undulate applied to a single frame). That reads as alive and is
 * a large jump on CSS, but it is not a drawn walk cycle. Real limb animation needs either a
 * multi-frame sheet or a skeletal rig (Rive/Spine) — see `swapTexture` note in Creature.
 */
import { AnimatedSprite, Application, Assets, Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js'
import { RIGS, type Rig, type RigLeg } from './rigs'
import { SHEETS } from './sheets'

// ── tiny spring integrator ────────────────────────────────────────────────────────────
// Critically-ish damped. Everything that moves goes through one of these rather than a linear
// tween — that overshoot-and-settle is most of what separates "game" motion from CSS motion.
class Spring {
  v = 0
  constructor(public x: number, private k = 120, private d = 18) {}
  set(x: number) { this.x = x; this.v = 0 }
  step(target: number, dt: number) {
    // clamp dt so a backgrounded tab that resumes with a 2s frame can't explode the integrator
    const h = Math.min(dt, 1 / 30)
    this.v += ((target - this.x) * this.k - this.v * this.d) * h
    this.x += this.v * h
    return this.x
  }
}

export type Gait = 'walk' | 'fly' | 'swim' | 'crawl'

/** How fast a rigged creature's limbs swing, matching each gait's own cadence below. */
const SWING_RATE: Record<Gait, number> = { walk: 7.5, crawl: 15, swim: 2.1, fly: 2.6 }

/**
 * Fraction of the cycle a foot spends PLANTED. Above 0.5 the leg sweeps back slowly under load and
 * flicks forward quickly — the asymmetry is most of what separates a walk from a pendulum, which is
 * exactly how this rig read when both halves took the same time.
 */
const STANCE = 0.62

/**
 * How far a creature travels in ONE walk cycle, as a fraction of its own height. This is the number
 * that ties ground speed to leg speed — get it wrong and the feet skate (too fast) or moonwalk
 * (too slow). Tuned by eye against the drawn cycle.
 */
const STRIDE = 0.67

/**
 * How much faster a counted creature hurries off. The child has already answered it, so every
 * frame it spends ambling away is dead time — but the leg cycle is sped up by the same factor so
 * the feet stay locked to the ground and it reads as scurrying, not sliding.
 */
const EXIT_BOOST = 2.4

interface CreatureOpts {
  texture: Texture
  gait: Gait
  size: number
  faceDir: 1 | -1      // +1 travels right, -1 travels left
  artFacesLeft: boolean
  enterX: number
  restX: number
  exitX: number
  y: number
  grounded: boolean
  /** Present → the sprite is cut into body + swinging legs instead of drawn as one frame. */
  rig?: Rig
  /** Present → a drawn walk cycle plays instead. Wins over `rig`: real frames beat a puppet. */
  frames?: Texture[]
  fps?: number
}

// ── one parading creature ─────────────────────────────────────────────────────────────
class Creature {
  root = new Container()      // travel position (spring-driven)
  private body = new Container()   // gait transforms live here so they never fight travel
  private sprite: Sprite
  private shadow?: Graphics
  /** Cut-out leg pieces, swung from their joints. Empty for un-rigged creatures. */
  private legs: Array<{ s: Sprite; L: RigLeg; len: number }> = []
  /**
   * Ground speed, px/sec, derived from the walk cadence — see STRIDE. Travel is NOT a spring: a
   * spring eases the creature in at a speed unrelated to its legs, so it reads as a sticker being
   * pushed across the screen while its feet skate. Walking it in at cycle speed means it arrives
   * under its own legs.
   */
  private speed: number
  private moving = true
  private phase = Math.random() * Math.PI * 2
  private t = 0
  private popT = -1            // >=0 while the "counted" squash-stretch plays
  leaving = false
  dead = false
  onGone?: () => void
  onTap?: () => void
  /** Fires the moment it is counted — NOT when it finishes leaving. The next creature is sent in
   *  off the back of this, so the child never waits out an exit walk before the next one appears. */
  onCounted?: () => void

  constructor(private o: CreatureOpts) {
    // A drawn walk cycle if we have one, else the single static frame. AnimatedSprite IS a Sprite,
    // so every anchor / scale / facing / hit-area line below applies unchanged to both.
    if (o.frames?.length) {
      const anim = new AnimatedSprite(o.frames)
      anim.animationSpeed = (o.fps ?? 20) / 60
      anim.gotoAndPlay(Math.floor(Math.random() * o.frames.length))   // desync creatures on stage
      this.sprite = anim
    } else {
      this.sprite = new Sprite(o.texture)
    }
    // A walker pivots at its FEET (so the landing squash compresses downward onto the ground); a
    // flyer pivots at its CENTRE (it has no ground contact, and a feet-anchored flyer renders
    // entirely above its lane and clips off the top of the screen).
    this.sprite.anchor.set(0.5, o.grounded ? 1 : 0.5)
    // Size off whatever is actually being drawn — a sheet CELL is not the source sprite's size, so
    // measuring the source here would render a sheeted creature at the wrong scale.
    const art = this.sprite.texture
    const scale = o.size / Math.max(art.width, art.height)
    this.sprite.scale.set(scale)
    // Point the art the way it travels. Some source sprites were drawn facing left (verified per
    // file upstream) — fold that in so the flip lands correctly either way.
    this.sprite.scale.x = scale * o.faceDir * (o.artFacesLeft ? -1 : 1)

    if (o.grounded) {
      this.shadow = new Graphics()
      this.root.addChild(this.shadow)
    }

    // A rigged creature replaces that single sprite with the same art cut into pieces. The pieces
    // are laid out in SOURCE pixel coordinates inside one container, which then carries the scale,
    // the facing flip and the same anchor the plain sprite would have had — so a rigged creature
    // sits and travels identically to an un-rigged one.
    const rigged = !!o.rig && !o.frames?.length      // drawn frames beat a cut-out puppet
    const tap = rigged ? this.buildRig(o.rig!, o.texture, scale) : this.sprite
    if (!rigged) this.body.addChild(this.sprite)
    this.root.addChild(this.body)

    // One cycle carries the creature one stride, so ground speed and leg speed agree by
    // construction. A flyer or swimmer has no ground contact to betray a mismatch, so it just
    // cruises at a comfortable rate.
    const cyclesPerSec = o.frames?.length
      ? (o.fps ?? 20) / o.frames.length
      : SWING_RATE[o.gait] / (Math.PI * 2)
    this.speed = o.grounded ? cyclesPerSec * STRIDE * o.size : o.size * 1.15

    this.root.x = o.enterX
    this.root.y = o.y

    tap.eventMode = 'static'
    tap.cursor = 'pointer'
    // Generous hit area — 3-year-old fingers miss a tight sprite bounds constantly. Expressed in
    // local (pre-anchor) space, so it has to follow whichever anchor the creature got above.
    // MEASURE THE THING ACTUALLY DRAWN. A sheeted creature's sprite is one CELL (e.g. 351×256), not
    // the 1024×1024 source — using the source here makes the hit box 3–4× too big in local space,
    // and it then swallows the neighbouring creature so taps land on the wrong one.
    tap.hitArea = rigged
      ? new Rectangle(0, 0, o.texture.width, o.texture.height)
      : { contains: (x: number, y: number) => {
          const w = art.width, h = art.height
          const top = o.grounded ? -h * 1.2 : -h * 0.7
          const bot = o.grounded ? h * 0.25 : h * 0.7
          // Generous for small fingers, but under half the gap between the two rest positions so
          // two creatures on stage can never have overlapping hit boxes.
          return x > -w * 0.7 && x < w * 0.7 && y > top && y < bot
        } }
    tap.on('pointertap', () => { if (!this.leaving && !this.dead) this.onTap?.() })
  }

  /**
   * Assemble body + legs from sub-rectangles of one texture. No second asset: the body is the slab
   * above the cut plus the gap strips between the legs below it, so nothing of the art is lost and
   * the legs are free to swing out from under it.
   */
  private buildRig(rig: Rig, src: Texture, scale: number): Container {
    const W = src.width, H = src.height
    const box = new Container()
    box.scale.set(scale * this.o.faceDir * (this.o.artFacesLeft ? -1 : 1), scale)
    box.pivot.set(W / 2, this.o.grounded ? H : H / 2)

    const piece = (x: number, y: number, w: number, h: number) => {
      const s = new Sprite(new Texture({ source: src.source, frame: new Rectangle(x, y, w, h) }))
      s.position.set(x, y)
      return s
    }
    const leg = (L: RigLeg) => {
      const s = piece(L.x0, rig.legTop, L.x1 - L.x0, rig.bottom - rig.legTop)
      // Rotate about the joint rather than the piece's corner.
      s.pivot.set(L.pivotX - L.x0, L.pivotY - rig.legTop)
      s.position.set(L.pivotX, L.pivotY)
      this.legs.push({ s, L, len: rig.bottom - L.pivotY })
      return s
    }

    for (const L of rig.legs) if (!L.near) box.addChild(leg(L))
    box.addChild(piece(0, 0, W, rig.cutY))                      // everything above the cut
    // …plus the strips between and outside the legs below it, so the ground line stays intact.
    let x = 0
    for (const L of [...rig.legs].sort((a, b) => a.x0 - b.x0)) {
      if (L.x0 > x) box.addChild(piece(x, rig.cutY, L.x0 - x, H - rig.cutY))
      x = Math.max(x, L.x1)
    }
    if (x < W) box.addChild(piece(x, rig.cutY, W - x, H - rig.cutY))
    for (const L of rig.legs) if (L.near) box.addChild(leg(L))

    this.body.addChild(box)
    return box
  }

  count() {
    if (this.leaving) return
    this.leaving = true
    this.popT = 0
    // Speed the drawn cycle up to match the quicker exit, so the legs keep pace with the ground.
    const anim = this.sprite as AnimatedSprite
    if (this.o.frames?.length) anim.animationSpeed = ((this.o.fps ?? 20) / 60) * EXIT_BOOST
    this.onCounted?.()
  }

  update(dt: number, sizeScale: number) {
    if (this.dead) return
    this.t += dt

    // ── travel: WALK there, don't get pushed there ────────────────────────────────────────
    const target = this.leaving ? this.o.exitX : this.o.restX
    const gap = target - this.root.x
    const dist = Math.abs(gap)
    // Ease over the last stride only, so it settles instead of stopping dead mid-step — but the
    // rest of the approach is at full walking pace, which is what makes it read as walking.
    const slow = this.leaving ? EXIT_BOOST : Math.max(0.3, Math.min(1, dist / (this.o.size * 0.9)))
    this.moving = dist > 2
    if (this.moving) this.root.x += Math.sign(gap) * Math.min(this.speed * slow * dt, dist)

    // A standing creature must NOT keep cycling its legs — that is skating on the spot. Hold the
    // cycle and let the idle breath below carry it instead.
    const anim = this.sprite as AnimatedSprite
    if (this.o.frames?.length && anim.playing !== this.moving) {
      if (this.moving) anim.play(); else anim.stop()
    }

    if (this.leaving && dist < 12) {
      this.dead = true
      this.onGone?.()
      return
    }

    // ── procedural gait ───────────────────────────────────────────────────────────────
    // Applied to a single static frame: bob + squash + lean, tuned per locomotion so a rabbit
    // hops, an eagle glides, a fish undulates and an ant scuttles.
    const p = this.phase + this.t
    let bob = 0, squash = 1, lean = 0

    switch (this.o.gait) {
      case 'walk': {
        const s = p * 7.5
        // |sin| gives a hop arc with a hard landing; squash fires on the landing, not in the air
        const hop = Math.abs(Math.sin(s))
        bob = -hop * this.o.size * 0.16
        const land = Math.max(0, 1 - hop * 3)          // sharp spike at footfall
        squash = 1 - land * 0.14
        lean = Math.sin(s * 0.5) * 0.05
        break
      }
      case 'crawl': {
        const s = p * 15
        bob = -Math.abs(Math.sin(s)) * this.o.size * 0.05
        squash = 1 - Math.max(0, 1 - Math.abs(Math.sin(s)) * 3) * 0.07
        lean = Math.sin(s * 0.5) * 0.09              // scuttling wobble
        break
      }
      case 'fly': {
        bob = Math.sin(p * 2.6) * this.o.size * 0.13
        squash = 1 + Math.sin(p * 5.2) * 0.05         // wing-beat breathing
        lean = Math.sin(p * 2.6) * 0.1
        break
      }
      case 'swim': {
        bob = Math.sin(p * 2.1) * this.o.size * 0.09
        lean = Math.sin(p * 2.1 + 0.6) * 0.14         // body follows the tail, lagging
        squash = 1 + Math.sin(p * 4.2) * 0.03
        break
      }
    }

    // Rigged creatures walk with their actual legs, swung from the joints in diagonal pairs at the
    // same cadence as the gait above. The canned hop is dialled back once they do: a bouncing body
    // AND striding legs together read as panic, not as walking.
    // A drawn cycle already contains its own bob, squash and weight — layering the procedural gait
    // on top double-counts it and the creature visibly wobbles. Keep only a whisper of it.
    if (this.o.frames?.length) {
      if (this.moving) { bob *= 0.2; squash = 1; lean *= 0.25 }
      else {
        // Standing and waiting to be counted: a slow breath, so it stays alive without walking
        // on the spot. The walk cycle is paused above.
        const breath = Math.sin(this.t * 1.7)
        bob = breath * this.o.size * 0.012
        squash = 1 + breath * 0.018
        lean = 0
      }
    }

    if (this.legs.length) {
      // Cadence matched to each gait above, or a scuttling crab plods and a paddling turtle thrashes.
      const cyc = (p * SWING_RATE[this.o.gait]) / (Math.PI * 2)
      const steps = this.o.gait === 'walk' || this.o.gait === 'crawl'

      for (const { s, L, len } of this.legs) {
        const u = (((cyc + L.phase) % 1) + 1) % 1     // this leg's place in the cycle, 0..1
        if (!steps) {
          // Flippers and wings sweep evenly — there is no ground to push against.
          s.rotation = Math.sin(u * Math.PI * 2) * L.amp
          continue
        }
        if (u < STANCE) {
          // PLANTED: sweep back at a constant rate, so the foot reads as fixed on the ground while
          // the body passes over it. Constant speed here is what stops the skate.
          s.rotation = L.amp * (1 - 2 * (u / STANCE))
          s.y = L.pivotY
          s.scale.y = 1
        } else {
          // SWING: return forward in the SHORTER remaining time — so it flicks, not drifts — and
          // lift + fold the leg so the foot clears the ground instead of dragging through it.
          const k = (u - STANCE) / (1 - STANCE)
          const ease = k * k * (3 - 2 * k)
          const lift = Math.sin(k * Math.PI)
          s.rotation = -L.amp + 2 * L.amp * ease
          s.y = L.pivotY - lift * len * 0.16       // foot clears the ground
          s.scale.y = 1 - lift * 0.12              // fakes a knee bend on a one-piece leg
        }
      }

      if (steps) {
        // Weight: body drops onto each footfall and rises through mid-stance. Two beats per cycle,
        // so it lands with the legs rather than floating free of them.
        bob = bob * 0.3 - (0.5 - 0.5 * Math.cos(cyc * 4 * Math.PI)) * this.o.size * 0.035
      }
    }

    // "counted" pop — squash down hard, then overshoot up, then settle. This is the single most
    // important piece of juice in the scene: it's the child's feedback that the tap registered.
    let popScale = 1
    if (this.popT >= 0) {
      this.popT += dt
      const k = this.popT / 0.42
      if (k >= 1) this.popT = -1
      else popScale = 1 + Math.sin(k * Math.PI) * 0.45 * (k < 0.18 ? -1.2 : 1)
    }

    this.body.y = bob
    this.body.rotation = lean
    this.body.scale.set(popScale * (2 - squash), popScale * squash)

    if (this.shadow) {
      // Shadow tracks the hop: tighter and darker on landing, wide and faint at apex.
      const lift = Math.min(1, Math.abs(bob) / (this.o.size * 0.18))
      this.shadow.clear()
      this.shadow
        .ellipse(0, 0, this.o.size * (0.3 - lift * 0.07) * sizeScale, this.o.size * (0.08 - lift * 0.02) * sizeScale)
        .fill({ color: 0x140e08, alpha: 0.3 - lift * 0.14 })
    }
  }

  destroy() { this.root.destroy({ children: true }) }
}

// ── particles ─────────────────────────────────────────────────────────────────────────
interface P { g: Graphics; vx: number; vy: number; life: number; max: number; spin: number }

export interface StageOpts {
  onCount: () => void
}

export class ParadeStage {
  private app = new Application()
  private camera = new Container()      // everything shakeable lives under here
  private world = new Container()
  private fx = new Container()
  private motes = new Container()
  private creatures: Creature[] = []
  private particles: P[] = []
  private shake = 0
  private punch = new Spring(1, 200, 16)
  // Reduced motion drops the camera shake and the particle burst (vestibular triggers) but KEEPS
  // the gait and the squash pop — those are the feedback that a tap registered, not decoration.
  private reduced = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  private w = 0
  private h = 0
  private ready = false
  private disposed = false

  constructor(private opts: StageOpts) {}

  async init(host: HTMLElement) {
    await this.app.init({
      backgroundAlpha: 0,               // transparent — the DOM BiomeBackground shows through
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      resizeTo: host,
    })
    if (this.disposed) { this.app.destroy(true); return }

    this.app.canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none'
    host.appendChild(this.app.canvas)

    this.camera.addChild(this.motes, this.world, this.fx)
    this.app.stage.addChild(this.camera)
    this.w = this.app.screen.width
    this.h = this.app.screen.height

    this.seedMotes()
    this.app.ticker.add(t => this.tick(t.deltaMS / 1000))
    this.ready = true
    if (process.env.NODE_ENV !== 'production') {
      ;(window as unknown as { __parade?: ParadeStage }).__parade = this
    }
  }

  /** Floating dust/bokeh drifting through the scene — cheap atmosphere that sells depth. */
  private seedMotes() {
    for (let i = 0; i < 26; i++) {
      const g = new Graphics()
      const r = 1.5 + Math.random() * 3.5
      g.circle(0, 0, r).fill({ color: 0xffffff, alpha: 0.06 + Math.random() * 0.16 })
      g.x = Math.random() * this.w
      g.y = Math.random() * this.h
      g.blendMode = 'add'
      ;(g as Graphics & { _v: number })._v = 4 + Math.random() * 14
      this.motes.addChild(g)
    }
  }

  async spawn(cfg: {
    key: number
    src: string
    gait: Gait
    slot: 0 | 1
    size: number
    lanePct: number
    artFacesLeft: boolean
    grounded: boolean
    /** Fires once this creature has finished walking off — used for teardown only. */
    onGone?: () => void
    /** Fires the instant it is tapped. Refill the slot from HERE, not from `onGone`. */
    onCounted?: () => void
  }) {
    if (!this.ready || this.disposed) return
    let texture: Texture
    try { texture = await Assets.load(cfg.src) } catch { return }   // missing art → just no creature
    if (this.disposed) return

    // Slice the drawn walk cycle into cells, if this creature has one. A failed sheet load falls
    // through to the static sprite rather than dropping the creature — the round still has to work.
    const sheet = SHEETS[cfg.src]
    let frames: Texture[] | undefined
    if (sheet) {
      try {
        const strip: Texture = await Assets.load(sheet.url)
        const cw = strip.width / sheet.frames
        frames = Array.from({ length: sheet.frames }, (_, i) =>
          new Texture({ source: strip.source, frame: new Rectangle(i * cw, 0, cw, strip.height) }))
      } catch { frames = undefined }
      if (this.disposed) return
    }

    const dir: 1 | -1 = cfg.slot === 0 ? 1 : -1
    const c = new Creature({
      texture,
      gait: cfg.gait,
      size: cfg.size,
      faceDir: dir,
      artFacesLeft: cfg.artFacesLeft,
      enterX: cfg.slot === 0 ? -cfg.size : this.w + cfg.size,
      restX: this.w * (cfg.slot === 0 ? 0.36 : 0.64),
      exitX: cfg.slot === 0 ? this.w + cfg.size * 1.5 : -cfg.size * 1.5,
      y: this.h * (cfg.lanePct / 100),
      grounded: cfg.grounded,
      rig: RIGS[cfg.src],
      frames,
      fps: sheet?.fps,
    })
    c.onTap = () => {
      if (c.leaving) return
      c.count()
      if (!this.reduced) {
        this.burst(c.root.x, c.root.y - cfg.size * 0.5)
        this.shake = 9
        this.punch.set(1.035)
      }
      this.opts.onCount()
    }
    c.onCounted = () => cfg.onCounted?.()
    c.onGone = () => {
      this.creatures = this.creatures.filter(x => x !== c)
      c.destroy()
      cfg.onGone?.()
    }
    this.creatures.push(c)
    this.world.addChild(c.root)
  }

  /** Sparkle burst + expanding shockwave ring at a count. */
  private burst(x: number, y: number) {
    const ring = new Graphics()
    ring.circle(0, 0, 18).stroke({ width: 4, color: 0xfff3c4, alpha: 0.95 })
    ring.x = x; ring.y = y; ring.blendMode = 'add'
    this.fx.addChild(ring)
    this.particles.push({ g: ring, vx: 0, vy: 0, life: 0, max: 0.5, spin: 0 })

    for (let i = 0; i < 16; i++) {
      const g = new Graphics()
      const r = 2.5 + Math.random() * 4
      const warm = [0xfff3c4, 0xffd479, 0xffffff, 0x9be7ff][i % 4]
      g.roundRect(-r, -r * 0.35, r * 2, r * 0.7, r * 0.35).fill({ color: warm, alpha: 1 })
      g.x = x; g.y = y; g.blendMode = 'add'
      const a = (i / 16) * Math.PI * 2 + Math.random() * 0.4
      const sp = 150 + Math.random() * 260
      this.fx.addChild(g)
      this.particles.push({
        g, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60,
        life: 0, max: 0.5 + Math.random() * 0.4, spin: (Math.random() - 0.5) * 12,
      })
    }
  }

  private tick(dt: number) {
    if (this.disposed) return
    this.w = this.app.screen.width
    this.h = this.app.screen.height
    const sizeScale = 1

    for (const c of this.creatures) c.update(dt, sizeScale)

    // particles: gravity + drag + fade. The ring (spin 0, vx 0) instead scales up and fades.
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.life += dt
      const k = p.life / p.max
      if (k >= 1) { p.g.destroy(); this.particles.splice(i, 1); continue }
      if (p.spin === 0 && p.vx === 0 && p.vy === 0) {
        p.g.scale.set(1 + k * 2.6)
        p.g.alpha = (1 - k) * 0.9
      } else {
        p.vy += 620 * dt          // gravity
        p.vx *= 1 - 2.4 * dt      // drag
        p.vy *= 1 - 1.6 * dt
        p.g.x += p.vx * dt
        p.g.y += p.vy * dt
        p.g.rotation += p.spin * dt
        p.g.alpha = 1 - k * k
        p.g.scale.set(1 - k * 0.4)
      }
    }

    // motes drift upward and wrap
    for (const m of this.motes.children as Array<Graphics & { _v: number }>) {
      m.y -= m._v * dt
      m.x += Math.sin(m.y * 0.01) * 6 * dt
      if (m.y < -10) { m.y = this.h + 10; m.x = Math.random() * this.w }
    }

    // camera: decaying shake + a scale punch that springs back to 1
    this.shake *= 1 - Math.min(1, 7 * dt)
    const s = this.punch.step(1, dt)
    this.camera.scale.set(s)
    this.camera.x = (this.w * (1 - s)) / 2 + (Math.random() - 0.5) * this.shake
    this.camera.y = (this.h * (1 - s)) / 2 + (Math.random() - 0.5) * this.shake
  }

  /** Dev-only introspection for live verification (positions are otherwise invisible in canvas). */
  debug() {
    return {
      w: this.w, h: this.h, fps: Math.round(this.app.ticker.FPS),
      creatures: this.creatures.map(c => ({ x: Math.round(c.root.x), y: Math.round(c.root.y), leaving: c.leaving })),
    }
  }

  /** Taps must be enabled only while the child is meant to answer (not during speech). */
  setInteractive(on: boolean) {
    if (!this.ready) return
    this.app.canvas.style.pointerEvents = on ? 'auto' : 'none'
  }

  dispose() {
    this.disposed = true
    if (this.ready) this.app.destroy(true, { children: true })
  }
}
