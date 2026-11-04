import { describe, expect, it } from 'vitest'
import { BRAIN_CARDS, BRAIN_CATEGORIES } from './cards'
import { cardText, curiosityFromReads, dailyCards, geniusPath, levelForAge, nextOnPath, similarCards, whyChain } from './feed'

describe('brain feed', () => {
  it('offers fifty cards, five in each section', () => {
    expect(BRAIN_CARDS).toHaveLength(50)
    for (const category of BRAIN_CATEGORIES) {
      expect(BRAIN_CARDS.filter((card) => card.category === category)).toHaveLength(5)
    }
  })

  it('keeps the same daily order and still includes every card', () => {
    const first = dailyCards(BRAIN_CARDS, '2026-11-04')
    const second = dailyCards(BRAIN_CARDS, '2026-11-04')
    expect(first.map((card) => card.id)).toEqual(second.map((card) => card.id))
    expect(new Set(first.map((card) => card.id)).size).toBe(50)
  })

  it('shortens the words for a younger child and grows a why chain', () => {
    expect(levelForAge(4)).toBe('super')
    expect(levelForAge(6)).toBe('simple')
    expect(levelForAge(9)).toBe('normal')
    const octopus = BRAIN_CARDS.find((card) => card.id === 'animals-octopus')!
    expect(cardText(octopus, 'super').length).toBeLessThan(cardText(octopus, 'normal').length)
    expect(whyChain(octopus, 1)).toHaveLength(1)
    expect(whyChain(octopus, 2)[1]).toMatch(/heart|gill/i)
  })

  it('raises the topic a child opens most and finds a nearby fact', () => {
    const scores = curiosityFromReads(BRAIN_CARDS, ['animals-octopus', 'animals-whale', 'space-moon'])
    const animals = scores.find((row) => row.category === 'animals')!
    const space = scores.find((row) => row.category === 'space')!
    expect(animals.score).toBeGreaterThan(space.score)
    const near = similarCards(BRAIN_CARDS, 'animals-octopus', 3)
    expect(near).toHaveLength(3)
    expect(near[0].score).toBeGreaterThanOrEqual(near[2].score)
  })

  it('walks a connected space path and skips a card already opened', () => {
    expect(geniusPath(BRAIN_CARDS).map((card) => card.id)).toEqual([
      'space-earth',
      'space-moon',
      'science-gravity',
      'space-satellites',
      'space-travel',
    ])
    expect(nextOnPath(BRAIN_CARDS, ['space-earth'])?.id).toBe('space-moon')
  })
})
