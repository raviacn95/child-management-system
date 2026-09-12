import { z } from 'zod'
import { movieKindSchema, movieLangSchema } from '../movies/schema'

export const topPickSchema = z.object({
  id: z.string(),
  kind: movieKindSchema,
  title: z.string(),
  year: z.number().int(),
  originalLang: movieLangSchema,
  genres: z.array(z.string()).min(1),
  platformIds: z.array(z.string()).min(1),
  rating: z.string(),
  summary: z.string().min(20),
  whyToWatch: z.string().min(20),
  sourceName: z.string(),
  sourceLink: z.string().url(),
  familyFirst: z.boolean().optional(),
})

export const topPicksCatalogSchema = z.object({
  schemaVersion: z.string(),
  source: z.string(),
  items: z.array(topPickSchema).length(10),
})

export const watchLinkSchema = z.object({
  platformId: z.string(),
  platformName: z.string(),
  url: z.string().url(),
})

export const rankedTopPickSchema = topPickSchema.extend({
  watchLinks: z.array(watchLinkSchema).min(1),
})

export type TopPick = z.infer<typeof topPickSchema>
export type RankedTopPick = z.infer<typeof rankedTopPickSchema>
