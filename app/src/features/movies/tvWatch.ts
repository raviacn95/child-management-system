import type { RankedMovie } from './schema'

type WatchLink = RankedMovie['watchLinks'][number]

/** TV Watch target: ad-free listed plan, connected listed plan, first official link, JustWatch last. */
export function bestLink(
  title: RankedMovie,
  connected: readonly string[],
  opts: { adFreeIds?: readonly string[]; preferAdFree?: boolean } = {},
): { link: WatchLink | undefined; adFree: boolean } {
  const official = title.watchLinks.filter((link) => link.platformId !== 'justwatch')
  const listed = official.filter((link) => title.platformIds.includes(link.platformId))
  const adFreeForUser = (link: WatchLink) =>
    Boolean(opts.adFreeIds?.includes(link.platformId) || (link.adFree && connected.includes(link.platformId)))
  const adFreeLink = opts.preferAdFree === false ? undefined : listed.find(adFreeForUser)
  if (adFreeLink) return { link: adFreeLink, adFree: true }
  const link = listed.find((item) => connected.includes(item.platformId)) ?? official[0] ?? title.watchLinks[0]
  return { link, adFree: Boolean(link && adFreeForUser(link)) }
}
