import { platforms, titles, watchLinks, watchUrl } from '../movies/catalog'
import { LANG_LABEL, type MovieTitle, type RankedMovie } from '../movies/schema'
import { fireTvIntent } from '../ott/fireTv'
import type { AgentGenre, AgentPlatform, MovieFilters } from './schema'

export type WatchContext = {
  tv: boolean
  connectedIds: readonly string[]
  adFreeIds: readonly string[]
  preferAdFree: boolean
}

export type SearchLink = { platformId: string; platformName: string; url: string }

export const AGENT_RESULTS = 6
const SEARCH_PLATFORMS: AgentPlatform[] = ['netflix', 'prime', 'hotstar', 'youtube']
const MIN_PARTIAL = 5
const FILLER = new Set(
  'a an and about any anything best find for from good in like me movie movies film films of on please recommend series show shows some something suggest the to top watch with'.split(' '),
)
const GENRE_LABEL: Partial<Record<AgentGenre, string>> = { scifi: 'sci-fi', sport: 'sports', biopic: 'biopic' }

export function normalizeTitle(value: string) {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

function pickYear(list: readonly MovieTitle[], year?: number) {
  return (year ? list.find((t) => t.year === year) : undefined) ?? list[0] ?? null
}

/** Exact title first, then a title that starts with or contains the whole phrase. Never fuzzy-guesses short words. */
export function matchTitle(query: string, year?: number, pool: readonly MovieTitle[] = titles): MovieTitle | null {
  const want = normalizeTitle(query)
  if (want.length < 2) return null
  const family = pool.filter((t) => !t.adult)
  const named = family.map((t) => ({ t, name: normalizeTitle(t.title) }))
  const exact = named.filter((n) => n.name === want).map((n) => n.t)
  if (exact.length) return pickYear(exact, year)
  if (want.length < MIN_PARTIAL) return null
  const partial = named.filter((n) => n.name.startsWith(`${want} `) || ` ${n.name} `.includes(` ${want} `)).map((n) => n.t)
  return pickYear(partial, year)
}

function taste(t: MovieTitle) {
  return t.scores.critic * 0.5 + t.scores.audience * 0.3 + t.scores.youtube * 0.2
}

function queryWords(query?: string) {
  return normalizeTitle(query ?? '')
    .split(' ')
    .filter((w) => w.length >= 3 && !FILLER.has(w))
}

export function rankedFor(title: MovieTitle, ctx: WatchContext): RankedMovie {
  return {
    ...title,
    score: taste(title),
    reasons: [],
    watchLinks: watchLinks(title, {
      tv: ctx.tv,
      connectedIds: ctx.connectedIds,
      adFreeIds: ctx.adFreeIds,
      preferAdFree: ctx.preferAdFree,
    }),
  }
}

/** Family-shelf titles that fit the filters, best rated first. A query narrows the list only when it matches something. */
export function findMovies(filters: MovieFilters, ctx: WatchContext, limit = AGENT_RESULTS, pool: readonly MovieTitle[] = titles) {
  const decade = filters.decade
  const fitting = pool
    .filter((t) => !t.adult)
    .filter((t) => !filters.language || t.originalLang === filters.language)
    .filter((t) => !filters.kind || t.kind === filters.kind)
    .filter((t) => decade == null || (t.year >= decade && t.year < decade + 10))
    .filter((t) => !filters.platform || t.platformIds.includes(filters.platform))
    .filter((t) => !filters.genre || t.genres.includes(filters.genre))
    .sort((a, b) => taste(b) - taste(a))
  const words = queryWords(filters.query)
  const about = words.length
    ? fitting.filter((t) => {
        const hay = normalizeTitle(`${t.title} ${t.genres.join(' ')} ${t.why}`)
        return words.some((w) => hay.includes(w))
      })
    : []
  return (about.length ? about : fitting).slice(0, limit).map((t) => rankedFor(t, ctx))
}

/** Official storefront searches for a title Willow does not list. */
export function searchLinks(title: string, year: number | undefined, platform: AgentPlatform | undefined, tv: boolean): SearchLink[] {
  const ids = platform ? [platform] : SEARCH_PLATFORMS
  return ids.flatMap((id) => {
    const p = platforms.find((x) => x.id === id)
    if (!p) return []
    return [{ platformId: id, platformName: p.name, url: tv ? fireTvIntent(id, title, year) : watchUrl(id, title, year) }]
  })
}

export function platformLabel(id: string) {
  return platforms.find((p) => p.id === id)?.name ?? id
}

export function searchPhrase(filters: MovieFilters) {
  const lang = filters.language ? `${LANG_LABEL[filters.language]} ` : ''
  const genre = filters.genre ? `${GENRE_LABEL[filters.genre] ?? filters.genre} ` : ''
  const about = filters.query ? ` ${filters.query}` : ''
  return `${lang}${genre}${filters.kind === 'series' ? 'series' : 'movies'}${about}`
}

export function describeFilters(filters: MovieFilters) {
  const lang = filters.language ? `${LANG_LABEL[filters.language]} ` : ''
  const genre = filters.genre ? `${GENRE_LABEL[filters.genre] ?? filters.genre} ` : ''
  const kind = filters.kind === 'series' ? 'series' : 'movies'
  const about = filters.query ? ` about ${filters.query}` : ''
  const decade = filters.decade ? ` from the ${filters.decade}s` : ''
  const platform = filters.platform ? ` on ${platformLabel(filters.platform)}` : ''
  return `${lang}${genre}${kind}${about}${decade}${platform}`
}
