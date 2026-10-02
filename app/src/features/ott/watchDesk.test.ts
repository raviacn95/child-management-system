import { describe, expect, it, vi } from 'vitest'
import { NATIVE_INTENT_MARKER } from './openPlan'
import { openChannel, openOfficialApp, WATCH_RETURN_KEY } from './watchDesk'

const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36'
const FIRE_TV_UA = 'Mozilla/5.0 (Linux; Android 9; AFTKA Build/PS7633; wv) AppleWebKit/537.36 Chrome/120.0 Safari/537.36'

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

  it('opens the official storefront in a new tab without leaving the Willow tab', () => {
    const open = vi.fn()
    const assign = vi.fn()
    const opened = openOfficialApp(
      'https://www.primevideo.com/search?phrase=Drishyam',
      { tv: false, native: false, ua: DESKTOP_UA },
      { open, assign },
    )
    expect(opened).toBe(true)
    expect(open).toHaveBeenCalledWith('https://www.primevideo.com/search?phrase=Drishyam', '_blank', 'noopener')
    expect(assign).not.toHaveBeenCalled()
    expect(sessionStorage.getItem(WATCH_RETURN_KEY)).toBeTruthy()
  })

  it('hands a Fire TV intent to the app shell instead of a tab or frame', () => {
    const open = vi.fn()
    const assign = vi.fn()
    const intent =
      'intent://www.primevideo.com/search?phrase=Drishyam#Intent;scheme=https;package=com.amazon.avod.thirdpartyclient;S.browser_fallback_url=https%3A%2F%2Fwww.primevideo.com%2Fsearch%3Fphrase%3DDrishyam;end'
    expect(openOfficialApp(intent, { tv: true, native: true, ua: `${FIRE_TV_UA} ${NATIVE_INTENT_MARKER}` }, { open, assign })).toBe(
      true,
    )
    expect(assign).toHaveBeenCalledWith(intent)
    expect(open).not.toHaveBeenCalled()
  })

  it('opens an embeddable link in a tab when asked for the official app', () => {
    const open = vi.fn()
    openOfficialApp('https://www.youtube.com/embed?listType=search&list=Drishyam', { tv: false, native: false, ua: DESKTOP_UA }, {
      open,
      assign: vi.fn(),
    })
    expect(open).toHaveBeenCalledWith('https://www.youtube.com/embed?listType=search&list=Drishyam', '_blank', 'noopener')
  })

  it('does nothing for links that are not official https pages', () => {
    const open = vi.fn()
    const assign = vi.fn()
    expect(openOfficialApp('javascript:alert(1)', { tv: false, native: false, ua: DESKTOP_UA }, { open, assign })).toBe(false)
    expect(open).not.toHaveBeenCalled()
    expect(assign).not.toHaveBeenCalled()
  })
})
