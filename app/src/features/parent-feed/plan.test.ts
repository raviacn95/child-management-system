import { describe, expect, it } from 'vitest'
import { catalog, planParentFeed, rankParentFeed } from './plan'

describe('parent growth feed', () => {
  it('loads 15 items for Indian parents 33–50', () => {
    expect(catalog.items).toHaveLength(15)
    expect(catalog.audience).toEqual({ ageMin: 33, ageMax: 50, region: 'IN' })
    expect(new Set(catalog.items.map((i) => i.n)).size).toBe(15)
  })

  it('boosts parenting + Hindi when that is the profile', () => {
    const ranked = rankParentFeed({
      ageYears: 38,
      interests: ['parenting'],
      goals: ['parenting'],
      languages: ['hi'],
      timeMode: 'short',
    })
    expect(ranked[0]?.category).toBe('parenting')
    expect(ranked.some((i) => i.id === 'harvard-developing-child' || i.id === 'unicef-india-parenting')).toBe(true)
  })

  it('returns a mixed daily playlist and a long weekly deep dive', () => {
    const plan = planParentFeed({
      ageYears: 42,
      interests: ['movies', 'learning', 'finance', 'parenting'],
      goals: ['wealth', 'parenting', 'learning'],
      timeMode: 'mixed',
      languages: ['en', 'hi'],
    })
    expect(plan.daily.length).toBeGreaterThanOrEqual(3)
    const cats = new Set(plan.daily.map((i) => i.category))
    expect(cats.size).toBeGreaterThanOrEqual(3)
    expect(['film', 'series', 'course']).toContain(plan.weekly.format)
    expect(plan.safeguards.some((s) => /pirate|official/i.test(s))).toBe(true)
  })

  it('down-ranks skipped titles', () => {
    const up = rankParentFeed({ ageYears: 36, ratings: { 'crash-course': 1 } })
    const down = rankParentFeed({ ageYears: 36, ratings: { 'crash-course': -1 } })
    const upScore = up.find((i) => i.id === 'crash-course')!.score
    const downScore = down.find((i) => i.id === 'crash-course')!.score
    expect(upScore).toBeGreaterThan(downScore)
  })
})
