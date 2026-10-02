import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Tv } from 'lucide-react'
import { isTvMode } from '../../lib/tv'
import type { WatchIds } from '../ott/deepLink'
import { watchIdsFor } from '../ott/watchIds'
import { openChannel } from './channel'
import { PLAY_STATUS, playMessage, requestPlay, tvChoices, type PlayChoice, type PlayResult } from './playRequest'
import { loadDevice, useLinkedTvs } from './store'

type Props = {
  title: string
  year?: number
  lang?: string
  watchIds?: WatchIds
  links: readonly { platformId: string; platformName: string }[]
}

const CHIP = 'rounded-lg px-2 py-1 text-xs font-semibold'

/** Phone-only: sends the title to the most recently linked TV, which opens it with its own Watch logic. */
export function PlayOnTv({ title, year, lang, watchIds, links }: Props) {
  const tvs = useLinkedTvs()
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<PlayResult | 'sending' | null>(null)
  const choices = tvChoices(links)
  if (isTvMode() || !tvs.length || !choices.length) return null
  const tv = tvs[0]

  async function play(choice: PlayChoice) {
    setOpen(false)
    setStatus('sending')
    const channel = openChannel({ topic: tv.id, key: tv.key, self: loadDevice('phone'), peerId: tv.tvId })
    const msg = playMessage({ title, year, lang, platformId: choice.platformId, watchIds: watchIds ?? watchIdsFor(title, year) })
    try {
      setStatus(await requestPlay(channel, msg))
    } finally {
      channel.close()
    }
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-1" data-testid="play-on-tv">
      <button
        type="button"
        className={`${CHIP} inline-flex items-center gap-1 border border-pine bg-pine-soft text-pine hover:brightness-95`}
        aria-label={`Play ${title} on ${tv.name} with ${choices[0].platformName}`}
        disabled={status === 'sending'}
        onClick={() => void play(choices[0])}
      >
        <Tv size={12} aria-hidden /> Play on TV
      </button>
      {choices.length > 1 ? (
        <button
          type="button"
          className={`${CHIP} border border-line text-pine`}
          aria-expanded={open}
          aria-label={`Choose the app for ${title} on TV`}
          onClick={() => setOpen((value) => !value)}
        >
          <ChevronDown size={12} aria-hidden />
        </button>
      ) : null}
      {open
        ? choices.map((choice) => (
            <button
              key={choice.platformId}
              type="button"
              className={`${CHIP} border border-line text-pine hover:border-pine`}
              onClick={() => void play(choice)}
            >
              on {choice.platformName}
            </button>
          ))
        : null}
      {status ? (
        <span role="status" className="text-xs text-muted" data-testid="play-on-tv-status">
          {PLAY_STATUS[status]}
          {status === 'opening' ? (
            <>
              {' · '}
              <Link to="/remote" className="font-semibold text-pine">
                Remote
              </Link>
            </>
          ) : null}
        </span>
      ) : null}
    </span>
  )
}
