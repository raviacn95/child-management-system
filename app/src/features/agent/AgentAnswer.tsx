import { Play, Search } from 'lucide-react'
import { useMemo } from 'react'
import { Button } from '../../components/ui'
import { titles, trailerUrl } from '../movies/catalog'
import { loadFreshCache } from '../movies/fresh'
import { freshToCatalogTitles } from '../movies/freshShelf'
import { LANG_LABEL, type RankedMovie } from '../movies/schema'
import { bestLink } from '../movies/tvWatch'
import { CustomAppLinks } from '../ott/CustomAppLinks'
import { fireTvIntent } from '../ott/fireTv'
import { useOpenWatch } from '../ott/WatchPane'
import { describeFilters, findMovies, matchTitle, rankedFor, searchLinks, searchPhrase, type WatchContext } from './movieSearch'
import type { AgentAction, AgentPlatform, AgentTurn } from './schema'
import { useWatchContext } from './useAgent'

type OpenMovie = Extract<AgentAction, { type: 'open_movie' }>
type FindMovies = Extract<AgentAction, { type: 'find_movies' }>

function MovieCard({ title, ctx, prefer, focus, onDone }: { title: RankedMovie; ctx: WatchContext; prefer?: string; focus: boolean; onDone: () => void }) {
  const openWatch = useOpenWatch()
  const preferred = prefer ? title.watchLinks.find((l) => l.platformId === prefer) : undefined
  const best = bestLink(title, ctx.connectedIds, { adFreeIds: ctx.adFreeIds, preferAdFree: ctx.preferAdFree })
  const link = preferred ?? best.link
  const open = (url: string, platformName: string) => {
    openWatch({ url, title: title.title, platformName })
    onDone()
  }
  const watch = () => link && open(ctx.tv ? fireTvIntent(link.platformId, title.title, title.year, title.originalLang) : link.url, link.platformName)
  const trailer = () =>
    ctx.tv
      ? open(fireTvIntent('youtube', `${title.title} ${title.year} official trailer`), 'YouTube')
      : open(trailerUrl(title.title, title.year, title.originalLang), 'YouTube trailer')

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line px-3 py-2" data-testid="agent-movie">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{title.title}</p>
        <p className="text-xs text-muted">
          {title.year} · {LANG_LABEL[title.originalLang]}
          {title.genres.length ? ` · ${title.genres.slice(0, 2).join(', ')}` : ''}
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {link ? (
          <Button autoFocus={focus} data-tv-focus="1" data-testid="agent-watch" aria-label={`Watch ${title.title} on ${link.platformName}`} onClick={watch}>
            <Play size={14} /> {link.platformName}
            {!preferred && best.adFree ? ' · ad-free' : ''}
          </Button>
        ) : null}
        <Button variant="ghost" data-tv-focus="1" aria-label={`Trailer for ${title.title}`} onClick={trailer}>
          Trailer
        </Button>
      </div>
    </li>
  )
}

type SearchAppsProps = { query: string; year?: number; platform?: AgentPlatform; note: string; testId: string; ctx: WatchContext; onDone: () => void }

function SearchApps({ query, year, platform, note, testId, ctx, onDone }: SearchAppsProps) {
  const openWatch = useOpenWatch()
  const links = searchLinks(query, year, platform, ctx.tv)
  return (
    <div className="rounded-xl border border-dashed border-line px-3 py-2" data-testid={testId}>
      <p className="text-xs text-muted">{note}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {links.map((l, i) => (
          <Button
            key={l.platformId}
            variant={i === 0 ? 'primary' : 'ghost'}
            autoFocus={i === 0}
            data-tv-focus="1"
            data-testid="agent-search-link"
            aria-label={`Search ${query} on ${l.platformName}`}
            onClick={() => {
              openWatch({ url: l.url, title: query, platformName: l.platformName })
              onDone()
            }}
          >
            <Search size={14} /> {l.platformName}
          </Button>
        ))}
        <CustomAppLinks title={query} year={year} look={ctx.tv ? 'tv' : 'chip'} />
      </div>
    </div>
  )
}

function useFound(action: AgentAction, ctx: WatchContext) {
  return useMemo(() => {
    if (action.type === 'find_movies') return findMovies(action, ctx)
    if (action.type !== 'open_movie') return []
    const pool = [...titles, ...freshToCatalogTitles(loadFreshCache()?.feed)]
    const match = matchTitle(action.title, action.year, pool)
    return match ? [rankedFor(match, ctx)] : []
  }, [action, ctx])
}

function Results({ action, found, ctx, onDone }: { action: FindMovies | OpenMovie; found: RankedMovie[]; ctx: WatchContext; onDone: () => void }) {
  if (found.length === 0 && action.type === 'open_movie')
    return (
      <SearchApps
        query={action.title}
        year={action.year}
        platform={action.platform}
        note={`Willow does not list ${action.title} yet. Search for it in an official app:`}
        testId="agent-unlisted"
        ctx={ctx}
        onDone={onDone}
      />
    )
  if (found.length === 0)
    return <SearchApps query={searchPhrase(action)} platform={action.platform} note="Search the official apps instead:" testId="agent-no-match" ctx={ctx} onDone={onDone} />
  return (
    <ul className="grid max-h-80 gap-2 overflow-auto" aria-label="Suggested titles">
      {found.map((title, i) => (
        <MovieCard key={title.id} title={title} ctx={ctx} prefer={action.platform} focus={i === 0} onDone={onDone} />
      ))}
    </ul>
  )
}

export function AgentAnswer({ turn, onDone }: { turn: AgentTurn; onDone: () => void }) {
  const ctx = useWatchContext()
  const { action } = turn
  const found = useFound(action, ctx)
  const shelfEmpty = action.type === 'find_movies' && found.length === 0
  return (
    <section className="mt-3 grid gap-2" data-testid="agent-answer" data-source={turn.source}>
      <p className="text-sm font-semibold" role="status" data-testid="agent-say">
        {shelfEmpty ? `Willow's family shelf has no ${describeFilters(action)} yet.` : turn.say}
      </p>
      {action.type === 'find_movies' || action.type === 'open_movie' ? <Results action={action} found={found} ctx={ctx} onDone={onDone} /> : null}
    </section>
  )
}
