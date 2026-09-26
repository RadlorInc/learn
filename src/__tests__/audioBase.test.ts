/**
 * src/core/audioBase.ts — the ONE value that says where the recorded audio lives (founder, 2026-09-26: "a single config
 * value so we can move to Cloudflare R2 later by re-uploading and changing one value"). Expected values by hand.
 */
import { describe, it, expect } from 'vitest'
import { audioBaseFrom, audioOriginFrom } from '@/core/audioBase'

describe('the audio base URL', () => {
  it('defaults to the lesson-audio bucket of the Supabase project', () => {
    expect(audioBaseFrom(undefined, 'https://abcdefghijklmnopqrst.supabase.co'))
      .toBe('https://abcdefghijklmnopqrst.supabase.co/storage/v1/object/public/lesson-audio')
    expect(audioBaseFrom('', 'https://abcdefghijklmnopqrst.supabase.co/'))
      .toBe('https://abcdefghijklmnopqrst.supabase.co/storage/v1/object/public/lesson-audio')
  })

  it('NEXT_PUBLIC_AUDIO_BASE_URL wins — the one value to change for a move (R2 or anywhere)', () => {
    expect(audioBaseFrom('https://audio.example.org/lesson-audio/', 'https://abcdefghijklmnopqrst.supabase.co'))
      .toBe('https://audio.example.org/lesson-audio')
    expect(audioOriginFrom('https://audio.example.org/lesson-audio')).toBe('https://audio.example.org')
  })

  it('the local stack is allowed over http; anything else must be https', () => {
    expect(audioBaseFrom(undefined, 'http://127.0.0.1:54321')).toBe('http://127.0.0.1:54321/storage/v1/object/public/lesson-audio')
    expect(audioBaseFrom('http://audio.example.org/x', undefined)).toBeNull()
  })

  it('nothing usable → null, so the player asks for no clip rather than a broken URL', () => {
    expect(audioBaseFrom(undefined, undefined)).toBeNull()
    expect(audioBaseFrom('not a url', '')).toBeNull()
    expect(audioOriginFrom(null)).toBeNull()
  })
})
