import { PageHead } from '../components/ui'
import { MovieShelf } from '../features/movies/MovieShelf'
import { TopPicksShelf } from '../features/top-picks/TopPicksShelf'
import { Link } from 'react-router-dom'
import { useStore } from '../store'

export function MoviesPage() {
  const { state } = useStore()
  const user = state.users.find((u) => u.id === state.currentUserId)
  const canErotic = user && user.role !== 'teacher'

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
