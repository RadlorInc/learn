'use client'
/**
 * WorldSelect — a reusable "pick a world" screen. The child chooses which storytelling
 * to play instead of it being chosen for them, so they have agency over where the
 * chapter goes. Each card previews a world's background + a real item sprite (its `itemImage`,
 * falling back to an emoji only if none is given) + name. Generic over any
 * chapter: pass the list of `worlds` and an `onPick(id)`. Used by the Counting chapter
 * (Nature/Farm/Space) and the Number-Order chapter (River/Train/Sky).
 */
import React from 'react'
import { speak, unlockSpeech } from '@/infra/useMiloSpeaker'
import { TintedSprite } from './TintedSprite'
import { SceneBg } from '@/shared/ui/SceneBg'

export interface PickWorld { id: string; label: string; emoji: string; bgImage?: string; itemImage?: string; itemTint?: string }

// A real object sprite in the card corner (emoji fallback only if the PNG 404s). If the sprite is
// a grayscale pat_* one, `tint` colors it so the card never shows a gray object.
function ItemBadge({ src, emoji, tint }: { src: string; emoji: string; tint?: string }) {
  const [missing, setMissing] = React.useState(false)
  const wrap: React.CSSProperties = { position: 'absolute', bottom: 6, right: 8, width: 'clamp(46px,8vh,72px)', height: 'clamp(46px,8vh,72px)', filter: 'drop-shadow(0 3px 5px rgba(0,0,0,.4))' }
  if (tint) return <div style={wrap}><TintedSprite src={src} size="100%" hex={tint} emoji={emoji} /></div>
  if (missing) return <span style={{ position: 'absolute', bottom: 8, right: 10, fontSize: 'clamp(28px,5vh,44px)', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.35))' }}>{emoji}</span>
  return <img src={src} alt="" draggable={false} decoding="async" loading="lazy" onError={() => setMissing(true)}
    style={{ ...wrap, objectFit: 'contain' }} />
}

export default function WorldSelect({ title = 'Where shall we go today?', worlds, onPick, onExit }: {
  title?: string
  worlds: PickWorld[]
  onPick: (id: string) => void
  onExit?: () => void
}) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'clamp(14px,3vh,28px)', padding: '4vh 4vw', background: 'linear-gradient(180deg,#bfe6f7 0%,#d9f0e6 60%,#cdeccf 100%)' }}>
      {onExit && (
        <button onClick={onExit} style={{ position: 'absolute', top: 14, left: 16, padding: '7px 14px', minHeight: 44, borderRadius: 50, background: 'var(--paper)', border: '3px solid var(--milo-orange)', color: 'var(--milo-orange)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>← Menu</button>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src="/assets/characters/milo_explorer.png" alt="" draggable={false} decoding="async" loading="lazy" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          style={{ width: 'clamp(48px,8vh,76px)', height: 'clamp(48px,8vh,76px)', objectFit: 'contain' }} />
        <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(22px,4.4vh,38px)', color: 'var(--ink)' }}>{title}</h1>
      </div>

      <div style={{ display: 'flex', gap: 'clamp(14px,3vw,34px)', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'stretch' }}>
        {worlds.map(world => (
          <button key={world.id}
            onClick={() => { unlockSpeech(); speak(world.label); onPick(world.id) }}
            /* ⚠️ A `vh` TERM, BECAUSE A CARD'S HEIGHT IS ITS WIDTH. This was `clamp(200px,26vw,300px)`
               — width-derived with nothing about the frame's height in it, which is the same fault
               the teen shell was built around. At 640×320 the 26vw computes to 166 and the 200px
               MINIMUM then wins, so three 200px cards could not sit in one row of a 589px content
               box, wrapped to two rows of ~180px each, and the third card ran off the bottom of a
               320px frame. Measured on `beads`, `numbers` and `counting`.
               `min(26vw, 40vh)` keeps the roomy frames where they were (288px at 1280×720 against
               the old 300 cap) and lets a short one shrink instead of wrapping; the floor drops to
               120px, which is still nearly three times the 44px tap minimum. */
            style={{ width: 'clamp(120px,min(26vw,40vh),300px)', borderRadius: 24, overflow: 'hidden', cursor: 'pointer', padding: 0,
              border: '5px solid var(--paper)', background: 'var(--paper)', boxShadow: '0 8px 0 rgba(61,37,22,.18)',
              transition: 'transform .18s ease, box-shadow .18s ease' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 12px 0 rgba(61,37,22,.18)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 0 rgba(61,37,22,.18)' }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 10', background: '#cfe8df' }}>
              {/* A card thumbnail, not a backdrop — `sizes` says so, or the optimizer buys a
                  full-viewport width for a tile that is never more than ~360 CSS px wide. */}
              {world.bgImage && <SceneBg src={world.bgImage} sizes="(max-width: 700px) 90vw, 360px"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />}
              {/* a REAL item sprite from the world (not an emoji); emoji only if no sprite is given */}
              {world.itemImage
                ? <ItemBadge src={world.itemImage} emoji={world.emoji} tint={world.itemTint} />
                : <span style={{ position: 'absolute', bottom: 8, right: 10, fontSize: 'clamp(28px,5vh,44px)', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.35))' }}>{world.emoji}</span>}
            </div>
            <div style={{ padding: '12px 10px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(16px,2.6vh,22px)', color: 'var(--milo-orange)', textAlign: 'center' }}>{world.label.replace(/^Milo's /, '')}</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(11px,1.7vh,14px)', color: 'var(--ink-soft)' }}>Tap to explore ▶</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
