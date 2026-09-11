import { describe, expect, it } from 'vitest'
import { ageBandFromYears, recommend } from './recommend'

describe('learning recommendation pipeline', () => {
  it('maps ages into curated bands', () => {
    expect(ageBandFromYears(3)).toBe('2-5')
    expect(ageBandFromYears(6)).toBe('5-8')
    expect(ageBandFromYears(10)).toBe('8-12')
  })

  it('packs toddlers with Numberblocks and Super Simple Songs', () => {
    const out = recommend({
      ageYears: 3,
      stage: 'playgroup',
      interests: ['math', 'music'],
      allergies: [],
      countryCode: 'IN',
    })
    expect(out.ageBand).toBe('2-5')
    expect(out.channels.map((c) => c.id)).toEqual(expect.arrayContaining(['numberblocks', 'super-simple-songs']))
    expect(out.anekalTip).toMatch(/Numberblocks/)
  })

  it('ranks art interest highest for early elementary', () => {
    const out = recommend({
      ageYears: 6,
      stage: 'ukg',
      interests: ['art'],
      allergies: ['Peanuts'],
      countryCode: 'IN',
    })
    expect(out.ageBand).toBe('5-8')
    expect(out.channels[0]?.id).toBe('art-for-kids-hub')
    expect(out.safeguards.some((s) => s.includes('Peanuts'))).toBe(true)
    expect(out.anekalTip).toMatch(/Anekal/)
  })

  it('recommends Crash Course Kids and TED-Ed for 8–12', () => {
    const out = recommend({
      childName: 'Asha',
      ageYears: 10,
      interests: ['science'],
      allergies: [],
    })
    expect(out.ageBand).toBe('8-12')
    expect(out.channels.map((c) => c.id)).toEqual(expect.arrayContaining(['crash-course-kids', 'ted-ed']))
    expect(out.playlist.length).toBeGreaterThan(0)
  })
})
