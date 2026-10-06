import { describe, expect, it } from 'vitest'
import { parseMpvPlaybackMessage } from './mpvBridge'

describe('mpv playback bridge', () => {
  it('accepts the allowlisted playback events', () => {
    expect(
      parseMpvPlaybackMessage({
        willowMpv: { event: 'seek', mediaId: 'learning:channel:demo', positionSec: 12.4, durationSec: 90 },
      }),
    ).toEqual({ event: 'seek', mediaId: 'learning:channel:demo', positionSec: 12.4, durationSec: 90 })
  })

  it('rejects unrelated or malformed window messages', () => {
    expect(parseMpvPlaybackMessage({ event: 'play', mediaId: 'learning:channel:demo' })).toBeNull()
    expect(parseMpvPlaybackMessage({ willowMpv: { event: 'volume', mediaId: 'learning:channel:demo' } })).toBeNull()
  })
})