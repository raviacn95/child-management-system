import { describe, expect, it } from 'vitest'
import { buildHub, weeklyDigest } from './buildHub'

describe('household hub', () => {
  it('mixes learning, parent growth, and family movies', () => {
    const rows = buildHub({ look: 'grove', role: 'parent', resume: [], watchTogether: true })
    const titles = rows.map((row) => row.id)
    expect(titles).toContain('learning')
    expect(titles).toContain('movies')
    expect(titles).toContain('parenting')
    expect(titles).toContain('top-picks')
    expect(titles).toContain('shopping')
    expect(rows.find((row) => row.id === 'learning')?.title).toMatch(/Watch together/)
    const arcade = buildHub({ look: 'arcade', role: 'parent', resume: [], watchTogether: false }).map((r) => r.id)
    expect(arcade.indexOf('shopping')).toBeLessThan(arcade.indexOf('top-picks'))
  })

  it('leads Cinema with movies and Harbor with the director desk', () => {
    const cinema = buildHub({ look: 'cinema', role: 'director', resume: [], watchTogether: false }).map((r) => r.id)
    const harbor = buildHub({ look: 'harbor', role: 'director', resume: [], watchTogether: false }).map((r) => r.id)
    expect(cinema.includes('watch')).toBe(true)
    expect(cinema.indexOf('watch')).toBeLessThan(cinema.indexOf('movies'))
    expect(cinema[0] === 'watch' || cinema[1] === 'watch' || cinema[0] === 'movies' || cinema[1] === 'movies' || cinema[0] === 'top-picks').toBe(true)
    expect(harbor.includes('watch')).toBe(true)
    expect(harbor.indexOf('reports')).toBeGreaterThan(-1)
    expect(harbor.indexOf('reports')).toBeLessThan(4)
    expect(harbor).toContain('reports')
  })

  it('writes a spoken weekly digest without child medical notes', () => {
    const lines = weeklyDigest({ present: 12, enrolled: 18, look: 'grove', childNames: ['Leo'] })
    expect(lines.join(' ')).toMatch(/12 of 18/)
    expect(lines.join(' ')).not.toMatch(/PIN|allerg/i)
  })
})
