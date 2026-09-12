import { describe, expect, it } from 'vitest'
import { nearestFocus, steerKey } from './tvSteer'

describe('TV remote steering', () => {
  it('maps arrow keys and picks the next tile to the right', () => {
    expect(steerKey('ArrowRight')).toBe('right')
    const home = { left: 0, top: 0, width: 80, height: 40 } as DOMRect
    const movies = document.createElement('a')
    const tv = document.createElement('a')
    const next = nearestFocus(home, [
      { el: movies, box: { left: 120, top: 0, width: 80, height: 40 } as DOMRect },
      { el: tv, box: { left: 240, top: 0, width: 80, height: 40 } as DOMRect },
    ], 'right')
    expect(next).toBe(movies)
  })
})
