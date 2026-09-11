import { describe, expect, it } from 'vitest'
import { catalog, horizonBandFromYears, planHorizons } from './horizons'

describe('horizon catalog', () => {
  it('has exactly 15 activities across three age bands', () => {
    expect(catalog.activities).toHaveLength(15)
    expect(catalog.ageBands.map((b) => b.id)).toEqual(['2-5', '6-9', '10-13'])
    expect(new Set(catalog.activities.map((a) => a.n)).size).toBe(15)
  })
})

describe('horizon planner', () => {
  it('maps ages into the research bands', () => {
    expect(horizonBandFromYears(3)).toBe('2-5')
    expect(horizonBandFromYears(7)).toBe('6-9')
    expect(horizonBandFromYears(11)).toBe('10-13')
  })

  it('gives preschoolers picture books and outdoor play, not Scratch Jr', () => {
    const plan = planHorizons({ childName: 'Mira', ageYears: 2.7, bmiBand: 'healthy' })
    expect(plan.ageBand).toBe('2-5')
    expect(plan.activities.map((a) => a.id)).toEqual(
      expect.arrayContaining(['story-books', 'sort-match', 'music-rhythm', 'outdoor-play', 'art-large-tools']),
    )
    expect(plan.activities.some((a) => a.id === 'scratch-jr')).toBe(false)
    expect(plan.today.length).toBeGreaterThan(0)
  })

  it('boosts movement when BMI is watch, without calorie language', () => {
    const plan = planHorizons({
      childId: 'c-leo',
      ageYears: 7,
      bmiBand: 'watch',
      date: '2026-09-11',
    })
    expect(plan.ageBand).toBe('6-9')
    expect(plan.today.some((a) => a.id === 'team-sports' || a.id === 'cooking-recipes')).toBe(true)
    expect(plan.bmiCue).toMatch(/movement|play/i)
    expect(plan.bmiCue.toLowerCase()).not.toMatch(/diet|ceiling|calorie/)
    expect(plan.today[0]?.minutesToday).toBeGreaterThanOrEqual(plan.activities.find((a) => a.id === plan.today[0]?.id)?.minutes ?? 0)
  })

  it('uses infant tasks under age 2', () => {
    const plan = planHorizons({ ageYears: 1.2, bmiBand: 'infant' })
    expect(plan.today[0]?.task).toMatch(/tummy|lullaby|babble|cups/i)
  })
})
