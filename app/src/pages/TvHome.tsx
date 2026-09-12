import { Link } from 'react-router-dom'
import { MovieShelf } from '../features/movies/MovieShelf'
import { TopPicksShelf } from '../features/top-picks/TopPicksShelf'
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
          <p className="text-xs font-semibold tracking-[0.18em] text-gold uppercase">Willow Movies · Fire TV</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">What to watch tonight</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            This living-room shelf replaces Google Play Movies. Pick a title, then open Prime, Netflix, SonyLIV or
            Hotstar — those apps keep your login on the Stick.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/movies" className="text-sm font-semibold text-pine" data-tv-focus="1" data-testid="tv-to-movies">
            Movies →
          </Link>
          <Link to="/ott" className="text-sm font-semibold text-pine" data-tv-focus="1">
            Manage OTT logins →
          </Link>
        </div>
      </div>
      {mine.length > 0 ? (
        <div className="mb-8 flex flex-wrap gap-2">
          {mine.map((a) => {
            const p = platforms.find((x) => x.id === a.platformId)
            return (
              <Button
                key={a.id}
                variant="soft"
                data-tv-focus="1"
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
      <TopPicksShelf />
      <MovieShelf compact />
    </div>
  )
}
