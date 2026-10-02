import { describe, expect, it } from 'vitest'
import { EROTIC_ROWS } from './erotic-movies-data'
import platformsJson from './streaming-platforms.json'

// Apps blocked in India by the I&B Ministry (Mar 2024, Jul 2025, Feb 2026 orders).
const BLOCKED = [
  'altt',
  'altbalaji',
  'ullu',
  'bigshots',
  'desiflix',
  'boomex',
  'neonx',
  'gulab',
  'kangan',
  'jalva',
  'hitprime',
  'fugi',
  'feneo',
  'showx',
  'moodx',
  'triflicks',
  'mojflix',
  'hulchul',
  'primeplay',
  'besharams',
  'voovi',
  'yessma',
  'uncutadda',
  'koyal',
  'jugnu',
]
const PLATFORMS_COLUMN = 6

describe('blocked platforms', () => {
  it('are not listed as streaming platforms', () => {
    const ids = platformsJson.platforms.map((p) => p.id)
    expect(ids.filter((id) => BLOCKED.includes(id))).toEqual([])
  })

  it('are not linked from any erotic shelf title', () => {
    const linked = EROTIC_ROWS.flatMap((row) => String(row[PLATFORMS_COLUMN]).split(','))
    expect(linked.filter((id) => BLOCKED.includes(id))).toEqual([])
  })
})
