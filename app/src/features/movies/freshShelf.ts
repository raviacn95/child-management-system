import { platforms, titles as catalogTitles, watchLinks } from './catalog'
import { asMovieLang, sortedProviders, type FreshFeed } from './fresh'
import { LANG_LABEL, titleSchema, type MovieKind, type MovieLang, type MovieTitle, type RankedMovie } from './schema'

export interface FreshShelfOptions {
  limit: number
  maxFresh?: number
  lang?: MovieLang
  kind?: MovieKind
  platformId?: string
  region?: string
  links?: Parameters<typeof watchLinks>[1]
}

const NO_SCORES = { critic: 0, audience: 0, youtube: 0, instagram: 0, erotic: 0 }

function catalogKey(title: string, year: number) {
  const name = title
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '')
  return `${name}|${year}`
}

const staticKeys = new Set(catalogTitles.map((t) => catalogKey(t.title, t.year)))

/** Feed titles with at least one known Indian channel, as catalog movies (newest release first). */
export function freshToCatalogTitles(feed: FreshFeed | null | undefined): MovieTitle[] {
  if (!feed) return []
  return [...feed.titles]
    .sort((a, b) => b.released.localeCompare(a.released))
    .flatMap((fresh) => {
      const lang = asMovieLang(fresh.lang)
      const channels = sortedProviders(fresh).flatMap((provider) => {
        const platform = platforms.find((p) => p.id === provider.platformId)
        return platform ? [{ ...provider, name: platform.name }] : []
      })
      if (!lang || !channels.length || staticKeys.has(catalogKey(fresh.title, fresh.year))) return []
      const where = channels
        .map((c) => (c.kind === 'rent' ? `Rent on ${c.name}` : c.kind === 'buy' ? `Buy on ${c.name}` : c.name))
        .join(', ')
      const parsed = titleSchema.safeParse({
        id: fresh.id,
        title: fresh.title,
        year: fresh.year,
        kind: 'movie',
        originalLang: lang,
        languages: [lang],
        genres: [],
        platformIds: channels.map((c) => c.platformId),
        scores: NO_SCORES,
        why: `New in ${fresh.year}, released ${fresh.released}. In India: ${where}.`,
        adult: false,
        shelf: 'family',
      })
      return parsed.success ? [parsed.data] : []
    })
}

/** Lifts this year's streaming films onto a family shelf without growing it past `limit`. */
export function withFreshTitles(ranked: RankedMovie[], fresh: MovieTitle[], opts: FreshShelfOptions): RankedMovie[] {
  const region = opts.region?.toUpperCase()
  if (opts.kind === 'series' || (region && region !== 'IN')) return ranked.slice(0, opts.limit)
  const taken = new Set(ranked.map((t) => t.id))
  const picked = fresh
    .filter((t) => !taken.has(t.id))
    .filter((t) => !opts.lang || t.originalLang === opts.lang)
    .filter((t) => !opts.platformId || t.platformIds.includes(opts.platformId))
    .slice(0, Math.min(opts.maxFresh ?? opts.limit, opts.limit))
    .map((t) => ({
      ...t,
      score: 0,
      reasons: [`New in ${t.year}`, `Original ${LANG_LABEL[t.originalLang]}`],
      watchLinks: watchLinks(t, opts.links),
    }))
  return [...picked, ...ranked].slice(0, opts.limit)
}
