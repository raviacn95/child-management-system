import { describe, expect, it, beforeEach } from 'vitest'
import { homePath, isTvMode, setTvMode } from './tv'

describe('TV home', () => {
  beforeEach(() => localStorage.clear())

  it('sends the living room to the Household Hub', () => {
    expect(isTvMode()).toBe(false)
    expect(homePath()).toBe('/')
    setTvMode(true)
    expect(homePath()).toBe('/hub')
  })
})
