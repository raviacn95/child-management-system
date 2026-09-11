import { describe, expect, it } from 'vitest'
import { bmiPercentileFromMeasures } from './bmiPercentile'
import { catalog, mealAgeBandFromMonths } from './catalog'
import { planFamilyMeals } from './plan'
import { recognizeFoods } from './recognize'

describe('meal planner catalog', () => {
  it('loads four age bands and Indian staple recipes', () => {
    expect(catalog.ageBands.map((b) => b.id)).toEqual(['0-2', '2-5', '5-8', '8-12'])
    expect(catalog.recipes.some((r) => /idli|poha|dal|roti/i.test(r.name))).toBe(true)
    for (const band of catalog.ageBands) {
      expect(band.targets.calciumMg).toBeGreaterThan(0)
      expect(band.targets.ironMg).toBeGreaterThan(0)
    }
  })
})

describe('BMI percentiles', () => {
  it('does not classify under 24 months', () => {
    const out = bmiPercentileFromMeasures(18, 11, 80, 'Girl')
    expect(out.band).toBe('infant')
    expect(out.percentile).toBeNull()
  })

  it('maps a typical 5-year-old boy near the healthy range', () => {
    const out = bmiPercentileFromMeasures(66, 18.6, 112, 'Boy')
    expect(out.band).toBe('healthy')
    expect(out.percentile).toBeGreaterThan(5)
    expect(out.percentile).toBeLessThan(85)
  })
})

describe('family meal engine', () => {
  it('maps months into age bands', () => {
    expect(mealAgeBandFromMonths(12)).toBe('0-2')
    expect(mealAgeBandFromMonths(36)).toBe('2-5')
    expect(mealAgeBandFromMonths(72)).toBe('5-8')
    expect(mealAgeBandFromMonths(120)).toBe('8-12')
  })

  it('keeps peanut recipes off a peanut-allergic plate and still shares a family meal', () => {
    const plan = planFamilyMeals({
      children: [
        {
          childId: 'c-leo',
          childName: 'Leo Shah',
          ageYears: 5.5,
          sex: 'Boy',
          heightCm: 112,
          weightKg: 18.6,
          allergies: ['Peanuts'],
          dietType: 'Vegetarian',
          foodPreferences: 'No peanuts.',
        },
        {
          childId: 'c-mira',
          childName: 'Mira Shah',
          ageYears: 2.7,
          sex: 'Girl',
          heightCm: 88,
          weightKg: 11.1,
          allergies: [],
          dietType: 'Vegetarian',
          foodPreferences: 'No cow dairy yet.',
        },
      ],
      filters: ['nut-free'],
    })
    expect(plan.shared.length).toBeGreaterThan(0)
    const leo = plan.children.find((c) => c.childId === 'c-leo')!
    expect(leo.neverServe).toContain('Peanuts')
    expect(leo.meals.every((m) => !/peanut/i.test(m.recipeName))).toBe(true)
    expect(leo.scores.overall).toBeGreaterThan(0)
    expect(plan.grocery.some((g) => /dal|idli|poha|rice|atta|ragi/i.test(g.grocery))).toBe(true)
    const mira = plan.children.find((c) => c.childId === 'c-mira')!
    expect(mira.meals.every((m) => m.safe || m.swap)).toBe(true)
    expect(JSON.stringify(plan)).not.toMatch(/calorie ceiling/i)
  })

  it('does not recommend egg bhurji to vegetarians', () => {
    const plan = planFamilyMeals({
      children: [
        {
          childName: 'Ava',
          ageYears: 6,
          dietType: 'Vegetarian',
          allergies: [],
        },
      ],
      filters: ['vegetarian'],
    })
    expect(plan.children[0]?.meals.some((m) => m.recipeId === 'egg-bhurji-skip' && m.safe)).toBe(false)
  })
})

describe('food recognizer', () => {
  it('maps idli photo text to the catalog recipe', () => {
    const out = recognizeFoods('idli-sambar.jpg')
    expect(out.recipeId).toBe('idli-sambar')
    expect(out.slot).toBe('breakfast')
    expect(out.confidence).toBeGreaterThan(0.4)
  })
})
