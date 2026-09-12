import { describe, expect, it } from 'vitest'
import { detectSeason } from './season'

describe('festival overlays', () => {
  it('lights Rang-friendly seasons without touching child records', () => {
    expect(detectSeason(new Date('2026-11-01T12:00:00'))).toBe('diwali')
    expect(detectSeason(new Date('2026-03-04T12:00:00'))).toBe('holi')
    expect(detectSeason(new Date('2026-06-01T12:00:00'))).toBe('none')
  })
})
