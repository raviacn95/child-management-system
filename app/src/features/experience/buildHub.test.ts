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
    expect(rows.find((row) => row.id === 'learning')?.title).toMatch(/Watch together/)
  })

  it('leads Cinema with movies and Harbor with the director desk', () => {
    const cinema = buildHub({ look: 'cinema', role: 'director', resume: [], watchTogether: false }).map((r) => r.id)
    const harbor = buildHub({ look: 'harbor', role: 'director', resume: [], watchTogether: false }).map((r) => r.id)
    expect(cinema[0] === 'movies' || cinema[1] === 'movies' || cinema[0] === 'top-picks').toBe(true)
    expect(harbor[0] === 'reports' || harbor[1] === 'reports').toBe(true)
    expect(harbor).toContain('reports')
  })

  it('writes a spoken weekly digest without child medical notes', () => {
    const lines = weeklyDigest({ present: 12, enrolled: 18, look: 'grove', childNames: ['Leo'] })
    expect(lines.join(' ')).toMatch(/12 of 18/)
    expect(lines.join(' ')).not.toMatch(/PIN|allerg/i)
  })
})
