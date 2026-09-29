import { useMemo, useState } from 'react'
import { RefreshCw, Sparkles } from 'lucide-react'
import { Badge, Button } from '../../components/ui'
import { isTvMode } from '../../lib/tv'
import { fireTvIntent } from '../ott/fireTv'
import { useOpenWatch } from '../ott/WatchPane'
import { watchUrl } from './catalog'
import { asMovieLang, freshLangs, isJustAdded, orderFresh, releasedLabel, type FreshTitle } from './fresh'
import { LANG_LABEL } from './schema'
import { useFreshMovies } from './useFreshMovies'

const WEB_VISIBLE = 12
const TV_VISIBLE = 18
const MINUTE_MS = 60 * 1000

function langLabel(title: FreshTitle) {
  const lang = asMovieLang(title.lang)
  if (lang) return LANG_LABEL[lang]
  return title.india ? 'Indian cinema' : 'World cinema'
}

function chipLabel(id: string) {
  const lang = asMovieLang(id)
  return lang ? LANG_LABEL[lang] : id.toUpperCase()
}

function updatedLabel(iso: string, now: Date) {
  const minutes = Math.max(0, Math.round((now.getTime() - Date.parse(iso)) / MINUTE_MS))
  if (minutes < 2) return 'updated just now'
  if (minutes < 60) return `updated ${minutes} min ago`
  const hours = Math.round(minutes / 60)
  return hours < 48 ? `updated ${hours} h ago` : `updated ${Math.round(hours / 24)} days ago`
}

export function FreshReleasesRow() {
  const { cache, status, refresh } = useFreshMovies()
  const tv = isTvMode()
  const openWatch = useOpenWatch()
  const [lang, setLang] = useState('all')
  const [showAll, setShowAll] = useState(false)

  const view = useMemo(() => {
    if (!cache) return null
    const now = new Date()
    const ordered = orderFresh(cache, now)
    const shown = lang === 'all' ? ordered : ordered.filter((title) => title.lang === lang)
    return {
      now,
      shown,
      langs: freshLangs(cache.feed.titles),
      justAdded: ordered.filter((title) => isJustAdded(cache, title.id, now)).length,
    }
  }, [cache, lang])

  if (!cache || !view || cache.feed.titles.length === 0) {
    return status === 'loading' ? (
      <p className="mb-6 text-sm text-muted" data-testid="fresh-loading">
        Loading this year’s new films…
      </p>
    ) : null
  }

  const limit = tv ? TV_VISIBLE : WEB_VISIBLE
  const visible = showAll ? view.shown : view.shown.slice(0, limit)

  function open(platformId: string, platformName: string, title: FreshTitle, query = title.title) {
    const originalLang = asMovieLang(title.lang)
    const url = tv ? fireTvIntent(platformId, query, title.year, originalLang) : watchUrl(platformId, query, title.year, originalLang)
    openWatch({ url, title: title.title, platformName })
  }

  return (
    <section className="fresh-row mb-8" data-testid="fresh-row" aria-labelledby="fresh-row-heading">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="fresh-row-heading" className="font-display text-2xl font-semibold">
            <Sparkles className="mr-1 inline text-gold" size={20} aria-hidden /> New in {cache.feed.year}
          </h2>
          <p className="text-sm text-muted" aria-live="polite" data-testid="fresh-status">
            {cache.feed.titles.length} films out this year
            {view.justAdded ? ` · ${view.justAdded} just added` : ''} · {updatedLabel(cache.feed.generatedAt, view.now)}
            {status === 'error' ? ' · offline, showing saved list' : ''}
          </p>
        </div>
        <Button
          variant="ghost"
          data-tv-focus="1"
          data-testid="fresh-refresh"
          disabled={status === 'loading'}
          onClick={() => void refresh()}
        >
          <RefreshCw size={16} className={status === 'loading' ? 'animate-spin' : ''} /> Check for new films
        </Button>
      </div>

      {view.langs.length > 1 ? (
        <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="New films by language">
          {['all', ...view.langs].map((id) => (
            <Button
              key={id}
              variant={lang === id ? 'primary' : 'ghost'}
              data-tv-focus="1"
              aria-pressed={lang === id}
              onClick={() => setLang(id)}
            >
              {id === 'all' ? 'All new' : chipLabel(id)}
            </Button>
          ))}
        </div>
      ) : null}

      <ul className={tv ? 'movie-rail' : 'grid gap-3 sm:grid-cols-2 xl:grid-cols-3'}>
        {visible.map((title) => (
          <li key={title.id} className="card fresh-card p-4" data-testid="fresh-card">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold">{title.title}</h3>
              {isJustAdded(cache, title.id, view.now) ? <Badge tone="gold">Just added</Badge> : null}
            </div>
            <p className="mt-1 text-xs text-muted">
              {releasedLabel(title.released, view.now)} · {langLabel(title)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="soft"
                data-tv-focus="1"
                data-testid="fresh-where"
                aria-label={`Where to watch ${title.title}`}
                onClick={() => open('justwatch', 'JustWatch', title)}
              >
                Where to watch
              </Button>
              <Button
                variant="ghost"
                data-tv-focus="1"
                data-testid="fresh-trailer"
                aria-label={`Trailer for ${title.title}`}
                onClick={() => open('youtube', 'YouTube', title, `${title.title} official trailer`)}
              >
                Trailer
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {view.shown.length > limit ? (
        <Button variant="ghost" className="mt-3" data-tv-focus="1" onClick={() => setShowAll((value) => !value)}>
          {showAll ? 'Show fewer' : `Show all ${view.shown.length} new films`}
        </Button>
      ) : null}
      <p className="mt-2 text-xs text-muted">Release list from Wikidata (CC0). Buttons open official storefront search.</p>
    </section>
  )
}
