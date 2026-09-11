import catalogJson from '../../data/parent-feed.json'
import {
  parentFeedCatalogSchema,
  parentFeedPlanSchema,
  parentFeedRequestSchema,
  type ParentFeedPlan,
  type ParentFeedRequest,
  type RankedParentItem,
} from './schema'

export const catalog = parentFeedCatalogSchema.parse(catalogJson)

function durationFit(minutes: number, mode: NonNullable<ParentFeedRequest['timeMode']>) {
  if (mode === 'mixed') return 8
  if (mode === 'short') return minutes <= 25 ? 18 : minutes <= 45 ? 4 : -6
  return minutes >= 45 ? 16 : minutes >= 20 ? 6 : -4
}

export function rankParentFeed(raw: ParentFeedRequest): RankedParentItem[] {
  const input = parentFeedRequestSchema.parse(raw)
  const interests = new Set(input.interests ?? [])
  const goals = new Set(input.goals ?? [])
  const langs = new Set(input.languages ?? ['en', 'hi'])
  const mode = input.timeMode ?? 'mixed'
  const ratings = input.ratings ?? {}

  return catalog.items
    .map((item) => {
      const reasons: string[] = [`Impact ${item.impactScore}`]
      let score = item.impactScore
      if (!interests.size || interests.has(item.category)) {
        score += interests.has(item.category) ? 22 : 6
        if (interests.has(item.category)) reasons.push(`Matches ${item.category}`)
      } else {
        score -= 8
      }
      const goalHits = item.goals.filter((g) => goals.has(g))
      if (goalHits.length) {
        score += goalHits.length * 12
        reasons.push(`Goal: ${goalHits.join(', ')}`)
      }
      if (item.languages.some((l) => langs.has(l))) {
        score += 10
        reasons.push(item.languages.includes('hi') ? 'Hindi/English OK' : 'English')
      } else {
        score -= 12
      }
      const d = durationFit(item.durationMin, mode)
      score += d
      if (d > 10) reasons.push(mode === 'short' ? 'Fits a short slot' : 'Deep-dive length')
      const rating = ratings[item.id]
      if (rating === 1) {
        score += 14
        reasons.push('You liked this')
      }
      if (rating === -1) {
        score -= 28
        reasons.push('You passed on this')
      }
      if (item.indiaNote) score += 4
      return { ...item, score, reasons }
    })
    .sort((a, b) => b.score - a.score || b.impactScore - a.impactScore)
}

function pickDaily(ranked: RankedParentItem[], date: string) {
  const day = [...date].reduce((n, ch) => n + ch.charCodeAt(0), 0)
  const rotated = ranked.filter((i) => i.score > 40)
  const pool = rotated.length ? rotated : ranked
  const seen = new Set<string>()
  const out: RankedParentItem[] = []
  const start = day % pool.length
  const ordered = [...pool.slice(start), ...pool.slice(0, start)]
  for (const item of ordered) {
    if (seen.has(item.category) && out.length < 3) continue
    if (seen.has(item.category) && out.length >= 3) continue
    if (seen.has(item.category)) continue
    seen.add(item.category)
    out.push(item)
    if (out.length >= 4) break
  }
  if (out.length < 3) {
    for (const item of ranked) {
      if (out.some((x) => x.id === item.id)) continue
      out.push(item)
      if (out.length >= 4) break
    }
  }
  return out
}

export function planParentFeed(raw: ParentFeedRequest): ParentFeedPlan {
  const input = parentFeedRequestSchema.parse(raw)
  const ranked = rankParentFeed(input)
  const date = input.date ?? new Date().toISOString().slice(0, 10)
  const daily = pickDaily(ranked, date)
  const weekly =
    ranked.find((i) => (i.format === 'film' || i.format === 'series' || i.format === 'course') && i.durationMin >= 20) ??
    ranked[0]
  const inBand = input.ageYears >= 33 && input.ageYears <= 50
  const safeguards = [
    'Official links only. Willow does not host or pirate films.',
    'This is a growth feed, not investment advice, medical advice, or a degree.',
    'Turn autoplay off on YouTube. One clip, one note.',
    'Netflix/Prime titles need your own subscription.',
  ]
  if (!inBand) safeguards.unshift('Catalog is tuned for parents 33–50 in India; still usable outside that band.')
  return parentFeedPlanSchema.parse({
    schemaVersion: catalog.schemaVersion,
    audience: `Parents ${catalog.audience.ageMin}–${catalog.audience.ageMax} · ${catalog.audience.region}`,
    daily,
    weekly,
    ranked,
    safeguards,
  })
}

export const DEFAULT_PARENT_PROFILE = {
  ageYears: 38,
  interests: ['parenting', 'learning', 'finance', 'movies'] as const,
  goals: ['parenting', 'wealth', 'learning'] as const,
  timeMode: 'mixed' as const,
  languages: ['en', 'hi'] as const,
}
