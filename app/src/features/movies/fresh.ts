import { z } from 'zod'
import { movieLangSchema, type MovieLang } from './schema'

export const FRESH_FEED_FILE = 'movies-fresh.json'
export const FRESH_POLL_MS = 10 * 60 * 1000
const CACHE_KEY = 'willow-fresh-movies-v1'
const JUST_ADDED_MS = 48 * 60 * 60 * 1000
const RECENT_RELEASE_MS = 7 * 24 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
const LANG_ORDER = ['ml', 'hi', 'ta', 'te', 'kn', 'bn', 'mr', 'pa', 'en', 'ko', 'ja', 'fr', 'es', 'it', 'de', 'pt']
const IN_CINEMAS_MS = 56 * DAY_MS

export const PROVIDER_KINDS = ['stream', 'free', 'ads', 'rent', 'buy'] as const
const freshProviderSchema = z.object({
  platformId: z.string().regex(/^[a-z0-9]{2,24}$/),
  kind: z.enum(PROVIDER_KINDS),
})
export type FreshProvider = z.infer<typeof freshProviderSchema>

const freshTitleSchema = z.object({
  id: z.string().regex(/^wd-Q\d+$/),
  qid: z.string().regex(/^Q\d+$/),
  title: z
    .string()
    .min(1)
    .max(120)
    .refine((value) => !/[<>]/.test(value)),
  year: z.number().int().min(1900).max(3000),
  released: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lang: z.string().max(3).default(''),
  india: z.boolean().default(false),
  sitelinks: z.number().nonnegative().default(0),
  providers: z
    .array(z.unknown())
    .max(40)
    .catch([])
    .default([])
    .transform((list) =>
      list.flatMap((item) => {
        const parsed = freshProviderSchema.safeParse(item)
        return parsed.success ? [parsed.data] : []
      }),
    ),
  providersSource: z.enum(['tmdb', 'wikidata']).optional().catch(undefined),
  tmdbId: z.number().int().positive().optional().catch(undefined),
})

const freshFeedShape = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.string().datetime(),
  year: z.number().int(),
  source: z.string().max(200).default(''),
  titles: z.array(z.unknown()),
})

export type FreshTitle = z.infer<typeof freshTitleSchema>
export type FreshFeed = Omit<z.infer<typeof freshFeedShape>, 'titles'> & { titles: FreshTitle[] }
export type FreshCache = { feed: FreshFeed; addedAt: Record<string, string>; checkedAt: string }

export function parseFreshFeed(raw: unknown): FreshFeed | null {
  const shape = freshFeedShape.safeParse(raw)
  if (!shape.success) return null
  const titles = shape.data.titles.flatMap((row) => {
    const parsed = freshTitleSchema.safeParse(row)
    return parsed.success ? [parsed.data] : []
  })
  return { ...shape.data, titles }
}

/** Stable partition: titles from `year` first, everything else keeps its ranking. */
export function currentYearFirst<T extends { year: number }>(list: readonly T[], year = new Date().getFullYear()): T[] {
  return [...list.filter((item) => item.year === year), ...list.filter((item) => item.year !== year)]
}

export function mergeFreshFeed(prev: FreshCache | null, feed: FreshFeed, now: Date): FreshCache {
  const known = new Set(prev?.feed.titles.map((title) => title.id) ?? [])
  const stamp = now.toISOString()
  const addedAt: Record<string, string> = {}
  for (const title of feed.titles) {
    const earlier = prev?.addedAt[title.id]
    if (earlier) addedAt[title.id] = earlier
    else if (prev && !known.has(title.id)) addedAt[title.id] = stamp
    else if (!prev && now.getTime() - Date.parse(`${title.released}T00:00:00Z`) <= RECENT_RELEASE_MS) addedAt[title.id] = stamp
  }
  return { feed, addedAt, checkedAt: stamp }
}

export function isJustAdded(cache: FreshCache, id: string, now: Date) {
  const at = cache.addedAt[id]
  return Boolean(at) && now.getTime() - Date.parse(at) <= JUST_ADDED_MS
}

export function orderFresh(cache: FreshCache, now: Date, direction: 'newest' | 'oldest' = 'newest'): FreshTitle[] {
  if (direction === 'oldest') return [...cache.feed.titles].sort((a, b) => a.released.localeCompare(b.released))
  const added = (title: FreshTitle) => (isJustAdded(cache, title.id, now) ? 1 : 0)
  return [...cache.feed.titles].sort((a, b) => added(b) - added(a) || b.released.localeCompare(a.released))
}

export function freshLangs(titles: readonly FreshTitle[]): string[] {
  const present = new Set(titles.map((title) => title.lang).filter(Boolean))
  return LANG_ORDER.filter((lang) => present.has(lang))
}

/** One button per channel, best way to watch first: streaming, free, with ads, rent, buy. */
export function sortedProviders(title: FreshTitle): FreshProvider[] {
  const rank = (provider: FreshProvider) => PROVIDER_KINDS.indexOf(provider.kind)
  const best = new Map<string, FreshProvider>()
  for (const provider of title.providers) {
    const prev = best.get(provider.platformId)
    if (!prev || rank(provider) < rank(prev)) best.set(provider.platformId, provider)
  }
  return [...best.values()].sort((a, b) => rank(a) - rank(b))
}

/** Honest status for a film with no listed channel; null when one is listed. */
export function availabilityNote(title: FreshTitle, now: Date) {
  if (title.providers.length) return null
  if (now.getTime() - Date.parse(`${title.released}T00:00:00Z`) <= IN_CINEMAS_MS) return 'In cinemas'
  return title.providersSource === 'tmdb' ? 'Not streaming in India yet' : 'Streaming channel not confirmed yet'
}

export function hasTmdbData(feed: FreshFeed) {
  return feed.titles.some((title) => title.providersSource === 'tmdb')
}

export function asMovieLang(lang: string): MovieLang | undefined {
  const parsed = movieLangSchema.safeParse(lang)
  return parsed.success ? parsed.data : undefined
}

export function releasedLabel(released: string, now: Date) {
  const days = Math.floor((now.getTime() - Date.parse(`${released}T00:00:00Z`)) / DAY_MS)
  if (days <= 0) return 'Out today'
  if (days === 1) return 'Out yesterday'
  if (days < 7) return `Out ${days} days ago`
  return new Date(`${released}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

export function loadFreshCache(): FreshCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as Partial<FreshCache>
    const feed = parseFreshFeed(data.feed)
    if (!feed || typeof data.checkedAt !== 'string') return null
    const addedAt = z.record(z.string(), z.string()).safeParse(data.addedAt)
    return { feed, addedAt: addedAt.success ? addedAt.data : {}, checkedAt: data.checkedAt }
  } catch {
    return null
  }
}

export function saveFreshCache(cache: FreshCache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    /* private mode or full storage: the in-memory feed still works */
  }
}
