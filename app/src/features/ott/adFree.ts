import type { PlatformAds } from '../movies/schema'

export type AdLabel = 'ad-free' | 'has-ads' | 'unknown'

export interface AdFreeContext {
  /** Connected platforms the user marked as an ad-free plan. */
  adFreeIds?: readonly string[]
  connectedIds?: readonly string[]
  platformAds?: Readonly<Partial<Record<string, PlatformAds>>>
}

export interface RankContext extends AdFreeContext {
  listedIds: readonly string[]
  preferAdFree?: boolean
}

export function adLabelFor(platformId: string, ctx: AdFreeContext): AdLabel {
  const ads = ctx.platformAds?.[platformId]
  if (ctx.adFreeIds?.includes(platformId) || ads === 'none') return 'ad-free'
  if (ads === 'tiered' || ads === 'always') return 'has-ads'
  return 'unknown'
}

/** Ad-free and actually on this user's account — ads: 'none' alone is not enough to promote a link. */
export function isAdFreeForUser(platformId: string, ctx: AdFreeContext) {
  if (ctx.adFreeIds?.includes(platformId)) return true
  return ctx.platformAds?.[platformId] === 'none' && Boolean(ctx.connectedIds?.includes(platformId))
}

function tier(id: string, ctx: RankContext) {
  const listed = ctx.listedIds.includes(id)
  const connected = Boolean(ctx.connectedIds?.includes(id))
  if (listed && ctx.preferAdFree !== false && isAdFreeForUser(id, ctx)) return 0
  if (ctx.platformAds?.[id] === 'always' && !ctx.adFreeIds?.includes(id)) return 5
  if (listed && connected) return 1
  if (listed) return 2
  if (connected) return 3
  return 4
}

export function isListedAdFree(id: string, ctx: RankContext) {
  return tier(id, ctx) === 0
}

export function rankWatchIds(ids: readonly string[], ctx: RankContext): string[] {
  return ids
    .map((id, index) => ({ id, index, tier: tier(id, ctx) }))
    .sort((a, b) => a.tier - b.tier || a.index - b.index)
    .map((entry) => entry.id)
}
