import { catalogStats, eroticTitles, platforms, titles, watchLinks } from './catalog'
import {
  movieRecommendRequestSchema,
  movieRecommendResponseSchema,
  type MovieRecommendRequest,
  type RankedMovie,
} from './schema'

const FAMILY_WEIGHTS = { critic: 0.35, audience: 0.2, youtube: 0.25, instagram: 0.2, erotic: 0 }
const EROTIC_WEIGHTS = { critic: 0.1, audience: 0.15, youtube: 0.2, instagram: 0.2, erotic: 0.35 }

function hashSeed(seed: string) {
  let h = 2166136261
  for (const ch of seed) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(a: number) {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function defaultSeed(now = new Date()) {
  return `${now.toISOString().slice(0, 13)}`
}

export function recommendMovies(raw: MovieRecommendRequest = {}) {
  const input = movieRecommendRequestSchema.parse(raw)
  const shelf = input.shelf ?? 'family'
  const cap = shelf === 'erotic' ? 150 : 100
  const limit = Math.min(input.limit ?? cap, cap)
  const weights = { ...(shelf === 'erotic' ? EROTIC_WEIGHTS : FAMILY_WEIGHTS), ...input.weights }
  const seed = input.seed ?? defaultSeed()
  const rand = mulberry32(hashSeed(seed))
  const catalog = shelf === 'erotic' ? eroticTitles : titles

  let pool = catalog
  if (input.languages?.length) {
    const want = new Set(input.languages)
    pool = pool.filter((t) => t.languages.some((l) => want.has(l)))
  }
  if (input.kind) pool = pool.filter((t) => t.kind === input.kind)
  if (input.platformId) pool = pool.filter((t) => t.platformIds.includes(input.platformId!))
  if (input.decade != null) {
    const start = input.decade
    pool = pool.filter((t) => t.year >= start && t.year < start + 10)
  }

  const ranked: RankedMovie[] = pool.map((t) => {
    const s = t.scores
    const erotic = s.erotic ?? 0
    const base =
      s.critic * weights.critic +
      s.audience * weights.audience +
      s.youtube * weights.youtube +
      s.instagram * weights.instagram +
      erotic * (weights.erotic ?? 0)
    const jitter = rand() * 8
    const malayalamBoost = t.languages.includes('ml') && (!input.languages?.length || input.languages.includes('ml')) ? 3 : 0
    const score = base + jitter + malayalamBoost
    const reasons = [
      `Critics ${s.critic}`,
      `Audience ${s.audience}`,
      `YouTube heat ${s.youtube}`,
      `Instagram heat ${s.instagram}`,
    ]
    if (shelf === 'erotic') reasons.unshift(`Erotic heat ${erotic}`)
    if (t.languages.includes('ml')) reasons.push('Malayalam')
    if (t.adult) reasons.push('18+')
    return { ...t, score, reasons, watchLinks: watchLinks(t, { tv: input.tv, connectedIds: input.connectedPlatformIds }) }
  })

  ranked.sort((a, b) => b.score - a.score)
  const picked = ranked.slice(0, Math.min(limit, ranked.length))

  if (picked.length < limit) {
    const have = new Set(picked.map((t) => t.id))
    for (const t of catalog) {
      if (have.has(t.id)) continue
      const extra: RankedMovie = {
        ...t,
        score: ((t.scores.erotic ?? 0) + t.scores.youtube) / 2 + rand() * 4,
        reasons: [`Backfill to keep a ${cap}-title shelf`, `Critics ${t.scores.critic}`],
        watchLinks: watchLinks(t, { tv: input.tv, connectedIds: input.connectedPlatformIds }),
      }
      picked.push(extra)
      have.add(t.id)
      if (picked.length >= limit) break
    }
  }

  return movieRecommendResponseSchema.parse({
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    seed,
    platformCount: platforms.length,
    totalCatalog: catalog.length,
    count: picked.length,
    titles: picked.slice(0, limit),
    safeguards:
      shelf === 'erotic'
        ? [
            '18+ only. Titles are adult cinema/series with explicit intimacy — not for children, classrooms, or shared family screens.',
            'Catalog excludes titles centered on minors. Willow does not host, scrape, or pirate streams.',
            'Watch links open official storefront search (Prime, Netflix, MUBI, ALTT, Google Movies, and 50+ others).',
            'Erotic heat is an editorial index (reviews + YouTube/Instagram mention heat), not live scraped nude scenes.',
          ]
        : [
            'Watch links open official storefront search (Prime, Google Movies, SonyLIV, Hotstar, Netflix, ManoramaMAX, and 50+ others).',
            'Willow does not host, scrape, or pirate streams. Availability changes by region and subscription.',
            'Critic / YouTube / Instagram scores are editorial heat indexes for ranking, not live scraped reviews.',
            'Scores are not investment in a title’s quality as a moral ranking — they mix reviews + influencer mention heat.',
          ],
  })
}

export { catalogStats, eroticTitles, platforms, titles }
