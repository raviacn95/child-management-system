import { Link } from 'react-router-dom'
import { MovieShelf } from '../features/movies/MovieShelf'
import { useStore } from '../store'
import { platforms } from '../features/movies/catalog'
import { fireTvIntent } from '../features/ott/fireTv'
import { useOpenWatch } from '../features/ott/WatchPane'
import { Button } from '../components/ui'

export function TvHome() {
  const { state, touchOtt } = useStore()
  const mine = (state.ottAccounts ?? []).filter((a) => a.userId === state.currentUserId && a.connected)
  const openWatch = useOpenWatch()

  return (
    <div data-testid="tv-home">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Willow Movies · Fire TV</p>
          <h1 className="font-display text-4xl font-semibold">What to watch tonight</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            This living-room shelf replaces Google Play Movies. Pick a title, then open Prime, Netflix, SonyLIV or
            Hotstar — those apps keep your login on the Stick.
          </p>
        </div>
        <Link to="/ott" className="text-sm font-semibold text-pine">
          Manage OTT logins →
        </Link>
      </div>
      {mine.length > 0 ? (
        <div className="mb-8 flex flex-wrap gap-2">
          {mine.map((a) => {
            const p = platforms.find((x) => x.id === a.platformId)
            return (
              <Button
                key={a.id}
                variant="soft"
                onClick={() => {
                  touchOtt(a.id)
                  openWatch({
                    url: fireTvIntent(a.platformId, p?.name),
                    title: p?.name ?? a.platformId,
                    platformName: p?.name ?? a.platformId,
                  })
                }}
              >
                {p?.name ?? a.platformId}
              </Button>
            )
          })}
        </div>
      ) : (
        <p className="mb-8 text-sm text-muted">
          No OTTs saved yet.{' '}
          <Link className="font-semibold text-pine" to="/ott">
            Add Prime / Netflix / SonyLIV
          </Link>
        </p>
      )}
      <MovieShelf compact />
    </div>
  )
}
