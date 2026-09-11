import { catalogStats, eroticTitles, platforms, titles, watchLinks } from './catalog'
import {
  LANG_LABEL,
  movieRecommendRequestSchema,
  movieRecommendResponseSchema,
  type MovieRecommendRequest,
  type MovieTitle,
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

function tasteScore(
  t: MovieTitle,
  weights: typeof FAMILY_WEIGHTS,
  rand: () => number,
  opts: { shelf: 'family' | 'erotic'; originalsOnly: boolean },
) {
  const s = t.scores
  const erotic = s.erotic ?? 0
  const base =
    s.critic * weights.critic +
    s.audience * weights.audience +
    s.youtube * weights.youtube +
    s.instagram * weights.instagram +
    erotic * (weights.erotic ?? 0)
  const agreement = (1 - Math.abs(s.critic - s.audience) / 100) * 6
  const hiddenGem = s.critic >= 82 && s.youtube < 72 ? 5.5 : 0
  const canonical = t.year < 1995 && s.critic >= 88 ? 4 : 0
  const freshness = t.year >= 2022 ? 1.8 : 0
  const malayalamBoost = !opts.originalsOnly && opts.shelf === 'family' && t.originalLang === 'ml' ? 3.5 : 0
  const explore = rand() * 14
  return base + agreement + hiddenGem + canonical + freshness + malayalamBoost + explore
}

function similarity(a: MovieTitle, b: MovieTitle, mixedLang: boolean) {
  if (a.id === b.id) return 1
  if (a.storyId && b.storyId && a.storyId === b.storyId) return 1
  let s = 0
  if (mixedLang && a.originalLang === b.originalLang) s += 0.2
  const ga = new Set(a.genres)
  const overlap = b.genres.filter((g) => ga.has(g)).length
  s += Math.min(0.28, overlap * 0.12)
  if (Math.floor(a.year / 10) === Math.floor(b.year / 10)) s += 0.16
  if (a.kind === b.kind) s += 0.04
  return Math.min(1, s)
}

/** Maximal marginal relevance: high taste, but not the same language/decade/plot twice in a row. */
function pickDiverse(ranked: RankedMovie[], limit: number, mixedLang: boolean) {
  const remaining = [...ranked]
  const picked: RankedMovie[] = []
  while (picked.length < limit && remaining.length) {
    let bestI = 0
    let best = -Infinity
    for (let i = 0; i < remaining.length; i++) {
      const cand = remaining[i]
      const sim = picked.length === 0 ? 0 : Math.max(...picked.map((p) => similarity(cand, p, mixedLang)))
      const mmr = 0.74 * cand.score - 26 * sim
      if (mmr > best) {
        best = mmr
        bestI = i
      }
    }
    picked.push(remaining.splice(bestI, 1)[0])
  }
  return picked
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
  const originalsOnly = input.originalsOnly ?? Boolean(input.languages?.length)

  let pool = catalog
  if (input.languages?.length) {
    const want = new Set(input.languages)
    pool = originalsOnly
      ? pool.filter((t) => want.has(t.originalLang))
      : pool.filter((t) => t.languages.some((l) => want.has(l)))
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
    const score = tasteScore(t, weights, rand, { shelf, originalsOnly })
    const reasons = [
      `Critics ${s.critic}`,
      `Audience ${s.audience}`,
      `YouTube heat ${s.youtube}`,
      `Instagram heat ${s.instagram}`,
    ]
    if (shelf === 'erotic') reasons.unshift(`Erotic heat ${erotic}`)
    reasons.push(`Original ${LANG_LABEL[t.originalLang]}`)
    if (s.critic >= 82 && s.youtube < 72) reasons.push('Hidden gem')
    if (t.year < 1995 && s.critic >= 88) reasons.push('Canonical')
    if (t.adult) reasons.push('18+')
    return { ...t, score, reasons, watchLinks: watchLinks(t, { tv: input.tv, connectedIds: input.connectedPlatformIds }) }
  })

  ranked.sort((a, b) => b.score - a.score)
  const mixedLang = !originalsOnly
  const picked = pickDiverse(ranked, Math.min(limit, ranked.length), mixedLang)

  return movieRecommendResponseSchema.parse({
    schemaVersion: '1.1.0',
    generatedAt: new Date().toISOString(),
    seed,
    platformCount: platforms.length,
    totalCatalog: catalog.length,
    count: picked.length,
    originalsOnly,
    titles: picked,
    safeguards:
      shelf === 'erotic'
        ? [
            '18+ only. Titles are adult cinema/series with explicit intimacy — not for children, classrooms, or shared family screens.',
            'A language chip keeps original-language titles only. Dubbed copies and remakes of the same story are hidden.',
            'Catalog excludes titles centered on minors. Willow does not host, scrape, or pirate streams.',
            'Watch links open official storefront search with the original language in the query (Prime, Netflix, MUBI, ALTT, and 50+ others).',
            'Ranking mixes critic/audience agreement, hidden gems, and diversity — not a popularity loop that repeats the same plot.',
          ]
        : [
            'A language chip keeps original-language movies and series only. Dubbed copies and remakes of the same story are hidden.',
            'Watch links open official storefront search with the original language in the query (Prime, Google Movies, SonyLIV, Hotstar, Netflix, and 50+ others).',
            'Willow does not host, scrape, or pirate streams. Availability changes by region and subscription.',
            'Ranking mixes critic/audience agreement, hidden gems, decade/genre spread, and remake penalties — not raw popularity.',
            'Critic / YouTube / Instagram scores are editorial heat indexes for ranking, not live scraped reviews.',
          ],
  })
}

export { catalogStats, eroticTitles, platforms, titles }
