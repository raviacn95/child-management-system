import { useMemo, useState } from 'react'
import { Play, RefreshCw } from 'lucide-react'
import { Button } from '../../components/ui'
import { useStore } from '../../store'
import { fireTvIntent } from '../ott/fireTv'
import { useOpenWatch } from '../ott/WatchPane'
import { currentYearFirst } from './fresh'
import { recommendMovies } from './recommend'
import { LANG_LABEL, type MovieLang, type RankedMovie } from './schema'

const TV_LIMIT = 24

const TV_LANGS: { id: MovieLang | 'all'; label: string }[] = [
  { id: 'all', label: 'All languages' },
  { id: 'ml', label: 'Malayalam' },
  { id: 'hi', label: 'Hindi' },
  { id: 'en', label: 'English' },
  { id: 'ta', label: 'Tamil' },
  { id: 'te', label: 'Telugu' },
]

function bestLink(title: RankedMovie, connected: readonly string[]) {
  return title.watchLinks.find((link) => connected.includes(link.platformId)) ?? title.watchLinks[0]
}

/** Living-room shelf: one row of big language chips, then big cards with just Watch and Trailer. */
export function TvMovieShelf() {
  const { state } = useStore()
  const openWatch = useOpenWatch()
  const [lang, setLang] = useState<MovieLang | 'all'>('all')
  const [seed, setSeed] = useState(() => `tv-${Date.now()}`)
  const connectedKey = (state.ottAccounts ?? [])
    .filter((account) => account.userId === state.currentUserId && account.connected)
    .map((account) => account.platformId)
    .sort()
    .join(',')

  const { titles, connected } = useMemo(() => {
    const ids = connectedKey ? connectedKey.split(',') : []
    const result = recommendMovies({
      shelf: 'family',
      limit: TV_LIMIT,
      languages: lang === 'all' ? undefined : [lang],
      originalsOnly: lang !== 'all',
      seed,
      tv: true,
      connectedPlatformIds: ids,
    })
    return { titles: currentYearFirst(result.titles), connected: ids }
  }, [lang, seed, connectedKey])

  return (
    <section className="tv-shelf" data-testid="tv-movie-shelf" aria-labelledby="tv-shelf-heading">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="tv-shelf-heading" className="font-display text-2xl font-semibold">
          Pick a movie
        </h2>
        <Button data-tv-focus="1" data-testid="tv-shuffle" onClick={() => setSeed(`tv-${Date.now()}`)}>
          <RefreshCw size={18} /> Shuffle
        </Button>
      </div>
      <div className="mb-5 flex flex-wrap gap-3" role="group" aria-label="Language">
        {TV_LANGS.map((item) => (
          <Button
            key={item.id}
            data-tv-focus="1"
            variant={lang === item.id ? 'primary' : 'ghost'}
            aria-pressed={lang === item.id}
            onClick={() => setLang(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>
      <ul className="tv-grid">
        {titles.map((title) => {
          const link = bestLink(title, connected)
          return (
            <li key={title.id} className="card tv-card" data-testid="tv-movie-card">
              <h3 className="tv-card-title">{title.title}</h3>
              <p className="tv-card-meta">
                {title.year} · {LANG_LABEL[title.originalLang]}
              </p>
              <div className="tv-card-actions">
                {link ? (
                  <Button
                    data-tv-focus="1"
                    data-testid="tv-movie-watch"
                    aria-label={`Watch ${title.title} on ${link.platformName}`}
                    onClick={() =>
                      openWatch({
                        url: fireTvIntent(link.platformId, title.title, title.year, title.originalLang),
                        title: title.title,
                        platformName: link.platformName,
                      })
                    }
                  >
                    <Play size={18} /> {link.platformName}
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  data-tv-focus="1"
                  data-testid="tv-movie-trailer"
                  aria-label={`Trailer for ${title.title}`}
                  onClick={() =>
                    openWatch({
                      url: fireTvIntent('youtube', `${title.title} ${title.year} official trailer`),
                      title: title.title,
                      platformName: 'YouTube',
                    })
                  }
                >
                  Trailer
                </Button>
              </div>
            </li>
          )
        })}
      </ul>
      {titles.length === 0 ? <p className="text-muted">No titles in this language yet — try All languages.</p> : null}
    </section>
  )
}
