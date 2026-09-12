import { describe, expect, it, vi } from 'vitest'
import { openChannel, openOfficialApp, WATCH_RETURN_KEY } from './watchDesk'

describe('single-page watch', () => {
  it('opens the channel in this page and remembers Willow so Back can close it', () => {
    const assign = vi.fn()
    openChannel('https://www.jiohotstar.com/in/search?q=Drishyam', {
      href: 'https://raviacn95.github.io/child-management-system/#/movies',
      assign,
    })
    expect(sessionStorage.getItem(WATCH_RETURN_KEY)).toContain('#/movies')
    expect(assign).toHaveBeenCalledTimes(1)
    expect(assign).toHaveBeenCalledWith('https://www.jiohotstar.com/in/search?q=Drishyam')
  })

  it('opens the official app without leaving the Willow tab', () => {
    const open = vi.fn(() => ({ closed: false }))
    vi.stubGlobal('open', open)
    const opened = openOfficialApp('https://www.primevideo.com/search?phrase=Drishyam')
    expect(opened).toBe(true)
    expect(open).toHaveBeenCalledWith('https://www.primevideo.com/search?phrase=Drishyam', 'willow_player')
    expect(sessionStorage.getItem(WATCH_RETURN_KEY)).toBeTruthy()
    vi.unstubAllGlobals()
  })
})
