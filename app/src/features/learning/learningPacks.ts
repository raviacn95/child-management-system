import catalogJson from '../../data/learning-packs.json'
import { CHANNELS } from '../../data/learning-channels'
import type { AgeBand, LearningChannel } from '../../types'
import { learningPacksCatalogSchema, type hydratedPackSchema } from './schema'
import type { z } from 'zod'

export type HydratedPack = z.infer<typeof hydratedPackSchema>

export function ageBandFromYears(years: number): AgeBand {
  if (years < 5) return '2-5'
  if (years < 8) return '5-8'
  return '8-12'
}

const catalog = learningPacksCatalogSchema.parse(catalogJson)

export const BAND_SAMPLE_AGE: Record<AgeBand, number> = {
  '2-5': 3,
  '5-8': 6,
  '8-12': 10,
}

const EXPECTED_FEATURED: Record<AgeBand, string[]> = {
  '2-5': ['numberblocks', 'alphablocks'],
  '5-8': ['scishow-kids', 'art-for-kids-hub'],
  '8-12': ['crash-course-kids', 'ted-ed', 'nasa'],
}

function channelMap() {
  return new Map(CHANNELS.map((c) => [c.id, c]))
}

export function listPackRecords() {
  return catalog.packs
}

export function ageBandsForChannel(id: string): AgeBand[] {
  const bands = catalog.packs.filter((p) => p.channelIds.includes(id)).map((p) => p.ageBand)
  return [...new Set(bands)]
}

export function listChannels(): LearningChannel[] {
  return CHANNELS.map((channel) => {
    const fromPacks = ageBandsForChannel(channel.id)
    return { ...channel, ageBands: fromPacks.length ? fromPacks : channel.ageBands }
  })
}

export function hydratePack(pack: (typeof catalog.packs)[number]): HydratedPack {
  const map = channelMap()
  const seen = new Set<string>()
  const channels = pack.channelIds
    .map((id) => map.get(id))
    .filter((c): c is LearningChannel => {
      if (!c || seen.has(c.id)) return false
      seen.add(c.id)
      return true
    })
    .map((c) => ({
      id: c.id,
      name: c.name,
      handle: c.handle,
      interests: c.interests,
      description: c.description,
      youtubeUrl: c.youtubeUrl,
      playlistUrl: c.playlistUrl ?? c.youtubeUrl,
      youtubeKids: c.youtubeKids,
      adLight: c.adLight,
      autoplaySafe: c.autoplaySafe,
      coViewingTip: c.coViewingTip,
    }))
  return { ...pack, channels }
}

export function getLearningPacks() {
  return {
    schemaVersion: catalog.schemaVersion,
    packs: catalog.packs.map(hydratePack),
  }
}

export function getPackByAgeBand(band: AgeBand): HydratedPack | undefined {
  const record = catalog.packs.find((p) => p.ageBand === band)
  return record ? hydratePack(record) : undefined
}

export function getPackForAgeYears(years: number) {
  return getPackByAgeBand(ageBandFromYears(years))
}

export function searchYouTubeMock(query: string) {
  const q = query.trim().toLowerCase()
  const hits = listChannels().filter(
    (c) =>
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.id.includes(q) ||
      c.interests.some((i) => i.includes(q)) ||
      (c.handle?.toLowerCase().includes(q) ?? false),
  )
  return {
    kind: 'youtube#searchListResponse' as const,
    items: hits.slice(0, 8).map((c) => ({
      id: { kind: 'youtube#channel', channelId: c.id },
      snippet: {
        title: c.name,
        description: c.description,
        channelTitle: c.name,
        playlistUrl: c.playlistUrl ?? c.youtubeUrl,
      },
    })),
  }
}

export { EXPECTED_FEATURED }
