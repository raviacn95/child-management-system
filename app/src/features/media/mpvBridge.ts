export type MpvPlaybackEventName = 'play' | 'pause' | 'seek' | 'ended'

export type MpvPlaybackEvent = {
  event: MpvPlaybackEventName
  mediaId: string
  positionSec?: number
  durationSec?: number
}

export function parseMpvPlaybackMessage(data: unknown): MpvPlaybackEvent | null {
  if (!data || typeof data !== 'object') return null
  const envelope = data as { willowMpv?: unknown }
  if (!envelope.willowMpv || typeof envelope.willowMpv !== 'object') return null
  const message = envelope.willowMpv as Record<string, unknown>
  const event = message.event
  const mediaId = message.mediaId
  if (!isEventName(event) || typeof mediaId !== 'string' || !mediaId) return null

  return {
    event,
    mediaId,
    ...(typeof message.positionSec === 'number' ? { positionSec: message.positionSec } : {}),
    ...(typeof message.durationSec === 'number' ? { durationSec: message.durationSec } : {}),
  }
}

function isEventName(value: unknown): value is MpvPlaybackEventName {
  return value === 'play' || value === 'pause' || value === 'seek' || value === 'ended'
}