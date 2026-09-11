import { describe, expect, it } from 'vitest'
import { LIVE_SITE } from './assets'
import { launcherFor } from './launcher'

describe('live app launcher', () => {
  it('downloads a Windows app that opens the live site in Edge/Chrome app mode', () => {
    const file = launcherFor('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0')
    expect(file.filename).toBe('Willow-Live-App.cmd')
    expect(file.body).toContain('--app="%LIVE%"')
    expect(file.body).toContain(LIVE_SITE)
    expect(file.body).toContain('msedge.exe')
  })

  it('downloads a Mac app that opens the live site', () => {
    const file = launcherFor('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
    expect(file.filename).toBe('Willow-Live-App.command')
    expect(file.body).toContain('--app="$LIVE"')
    expect(file.body).toContain(LIVE_SITE)
  })
})
