import type { Channel } from './channel'
import type { PlayMessage } from './schema'
import type { WatchIds } from '../ott/deepLink'

export type PlayResult = 'opening' | 'failed' | 'no-answer' | 'relay-error'

export type PlayChoice = { platformId: string; platformName: string }

/** Sends one play request and waits for the TV's ack. */
export function requestPlay(channel: Channel, msg: PlayMessage, timeoutMs = 12_000): Promise<PlayResult> {
  return new Promise((resolve) => {
    const stop = channel.listen((reply) => {
      if (reply.type === 'ack') done(reply.status)
    })
    const timer = setTimeout(() => done('no-answer'), timeoutMs)
    function done(result: PlayResult) {
      clearTimeout(timer)
      stop()
      resolve(result)
    }
    channel
      .ready()
      .then(() => channel.send(msg))
      .catch(() => done('relay-error'))
  })
}

/** Official storefront choices in the shelf's existing order (ad-free / connected first); JustWatch is not an app. */
export function tvChoices(links: readonly { platformId: string; platformName: string }[]): PlayChoice[] {
  const seen = new Set<string>()
  return links.filter((link) => link.platformId !== 'justwatch' && !seen.has(link.platformId) && seen.add(link.platformId)).slice(0, 6)
}

export function playMessage(input: {
  title: string
  year?: number
  lang?: string
  platformId: string
  watchIds?: WatchIds
}): PlayMessage {
  const ids = input.watchIds && Object.keys(input.watchIds).length ? input.watchIds : undefined
  return {
    type: 'play',
    title: input.title.slice(0, 120),
    platformId: input.platformId,
    ...(input.year && input.year >= 1900 && input.year <= 2100 ? { year: input.year } : {}),
    ...(input.lang && /^[a-z]{2}$/.test(input.lang) ? { lang: input.lang } : {}),
    ...(ids ? { watchIds: ids } : {}),
  }
}

export const PLAY_STATUS: Record<PlayResult | 'sending', string> = {
  sending: 'Sending to TV…',
  opening: 'Playing on TV',
  failed: 'The TV could not open that app',
  'no-answer': 'TV did not answer. Is Willow open on the TV?',
  'relay-error': 'Could not reach the free relay. Try again in a few seconds.',
}
