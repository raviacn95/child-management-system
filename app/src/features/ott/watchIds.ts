import { z } from 'zod'
import watchIdsFile from '../../data/watch-ids.json'
import { watchIdsSchema, type WatchIds } from './deepLink'

const fileSchema = z.object({
  titles: z.record(z.string(), z.object({ title: z.string(), year: z.number().int(), ids: watchIdsSchema })),
})

export type TitledWatchIds = { title: string; year: number; watchIds?: WatchIds }

export function watchKey(title: string, year: number) {
  const name = title
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '')
  return `${name}|${year}`
}

/** Title + year → IDs. Two entries with the same key but different IDs cancel out rather than guess. */
export function indexWatchIds(entries: readonly TitledWatchIds[]): ReadonlyMap<string, WatchIds> {
  const next = new Map<string, WatchIds>()
  const clashes = new Set<string>()
  for (const entry of entries) {
    const ids = entry.watchIds
    if (!ids || !Object.keys(ids).length) continue
    const key = watchKey(entry.title, entry.year)
    if (clashes.has(key)) continue
    const prev = next.get(key)
    if (prev && JSON.stringify(prev) !== JSON.stringify(ids)) {
      next.delete(key)
      clashes.add(key)
      continue
    }
    next.set(key, ids)
  }
  return next
}

const staticEntries = Object.values(fileSchema.parse(watchIdsFile).titles).map((entry) => ({
  title: entry.title,
  year: entry.year,
  watchIds: entry.ids,
}))

const catalogIds = indexWatchIds(staticEntries)
let freshIds: ReadonlyMap<string, WatchIds> = new Map()

export function watchIdsFor(title: string | undefined, year: number | undefined): WatchIds | undefined {
  if (!title || !year) return undefined
  const key = watchKey(title, year)
  return catalogIds.get(key) ?? freshIds.get(key)
}

/** IDs from the latest 2026 feed; the committed catalog file keeps priority. */
export function rememberWatchIds(entries: readonly TitledWatchIds[]) {
  freshIds = indexWatchIds(entries)
}
