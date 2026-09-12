import { describe, expect, it } from 'vitest'
import { LOOK_IDS } from './looks'
import { LOOK_PALETTES, contrastRatio, isLongHourSafe } from './tokens'

describe('Willow design tokens', () => {
  it('keeps every look readable and safe for long sessions', () => {
    for (const id of LOOK_IDS) {
      const palette = LOOK_PALETTES[id]
      expect(contrastRatio(palette.ink, palette.sand)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(palette.ink, palette.paper)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(palette.muted, palette.sand)).toBeGreaterThanOrEqual(4.5)
      expect(isLongHourSafe(palette.sand)).toBe(true)
      expect(isLongHourSafe(palette.paper)).toBe(true)
      expect(isLongHourSafe(palette.ink)).toBe(true)
    }
  })
})
