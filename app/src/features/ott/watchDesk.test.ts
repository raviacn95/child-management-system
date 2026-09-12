import { describe, expect, it, vi } from 'vitest'
import { openChannel, WATCH_RETURN_KEY } from './watchDesk'

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
})
