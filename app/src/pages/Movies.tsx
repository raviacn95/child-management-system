import { PageHead } from '../components/ui'
import { FreshReleasesRow } from '../features/movies/FreshReleasesRow'
import { MovieShelf } from '../features/movies/MovieShelf'
import { TvMovieShelf } from '../features/movies/TvMovieShelf'
import { TopPicksShelf } from '../features/top-picks/TopPicksShelf'
import { Link } from 'react-router-dom'
import { isTvMode } from '../lib/tv'
import { useStore } from '../store'

export function MoviesPage() {
  const { state } = useStore()
  const user = state.users.find((u) => u.id === state.currentUserId)
  const canErotic = user && user.role !== 'teacher'
  const tv = isTvMode()

  if (tv) {
    return (
      <div data-testid="movies-page">
        <PageHead
          title="Movies"
          actions={
            <Link to="/tv" className="text-sm font-semibold text-pine" data-tv-focus="1" data-testid="movies-to-tv">
              TV tonight →
            </Link>
          }
        />
        <FreshReleasesRow />
        <TvMovieShelf />
      </div>
    )
  }

  return (
    <div data-testid="movies-page">
      <PageHead
        title="100 movies & series"
        subtitle="Prime, Google Movies, SonyLIV, Hotstar, ManoramaMAX and 50+ official storefronts. Ranked by critics, audience, YouTube and Instagram heat. Malayalam is first-class. Shuffle for a new 100."
        actions={
          <Link to="/tv" className="text-sm font-semibold text-pine" data-tv-focus="1" data-testid="movies-to-tv">
            TV tonight →
          </Link>
        }
      />
      <FreshReleasesRow />
      <TopPicksShelf />
      {canErotic ? (
        <p className="mb-6 text-xs text-muted">
          After hours, 18+ only:{' '}
          <Link to="/erotic" className="font-semibold text-pine" data-testid="erotic-link">
            Open the 150-title erotic shelf →
          </Link>
        </p>
      ) : null}
      <MovieShelf compact />
    </div>
  )
}
