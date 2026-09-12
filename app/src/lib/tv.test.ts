import { describe, expect, it, beforeEach } from 'vitest'
import { detectFireTv, homePath, isTvMode, setTvMode } from './tv'

describe('TV home', () => {
  beforeEach(() => localStorage.clear())

  it('sends the living room to the Household Hub', () => {
    expect(isTvMode()).toBe(false)
    expect(homePath()).toBe('/')
    setTvMode(true)
    expect(homePath()).toBe('/hub')
  })

  it('treats Realme and Android TV as living-room devices', () => {
    expect(detectFireTv('Mozilla/5.0 (Linux; Android 11; Realme Smart TV) AppleWebKit/537.36 Chrome/91.0.4472.114 Safari/537.36')).toBe(true)
    expect(detectFireTv('Mozilla/5.0 (Linux; Android 12; Android TV) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36')).toBe(true)
    expect(detectFireTv('Mozilla/5.0 (Linux; Android 10; SMART TV) AppleWebKit/537.36 Chrome/64.0.3282.123 Safari/537.36')).toBe(true)
    expect(detectFireTv('Mozilla/5.0 (Linux; Android 14; RMX3630) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36')).toBe(false)
    expect(
      detectFireTv(
        'Mozilla/5.0 (Linux; Android 11; RMV2105) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/91.0.4472.120 Mobile Safari/537.36 wv',
      ),
    ).toBe(true)
  })
})
