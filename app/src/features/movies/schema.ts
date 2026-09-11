import { z } from 'zod'

export const movieLangSchema = z.enum([
  'en',
  'hi',
  'ml',
  'ta',
  'te',
  'kn',
  'bn',
  'mr',
  'pa',
  'fr',
  'es',
  'it',
  'ja',
  'ko',
  'de',
  'zh',
  'sv',
  'da',
  'pl',
  'pt',
])
export const movieKindSchema = z.enum(['movie', 'series'])
export const movieShelfSchema = z.enum(['family', 'erotic'])

export const LANG_LABEL: Record<z.infer<typeof movieLangSchema>, string> = {
  en: 'English',
  hi: 'Hindi',
  ml: 'Malayalam',
  ta: 'Tamil',
  te: 'Telugu',
  kn: 'Kannada',
  bn: 'Bengali',
  mr: 'Marathi',
  pa: 'Punjabi',
  fr: 'French',
  es: 'Spanish',
  it: 'Italian',
  ja: 'Japanese',
  ko: 'Korean',
  de: 'German',
  zh: 'Chinese',
  sv: 'Swedish',
  da: 'Danish',
  pl: 'Polish',
  pt: 'Portuguese',
}

export const platformSchema = z.object({
  id: z.string(),
  name: z.string(),
  region: z.string(),
  searchUrl: z.string(),
})

export const scoreSchema = z.object({
  critic: z.number().min(0).max(100),
  audience: z.number().min(0).max(100),
  youtube: z.number().min(0).max(100),
  instagram: z.number().min(0).max(100),
  erotic: z.number().min(0).max(100).optional().default(0),
})

export const titleSchema = z.object({
  id: z.string(),
  title: z.string(),
  year: z.number().int(),
  kind: movieKindSchema,
  originalLang: movieLangSchema,
  languages: z.array(movieLangSchema).min(1),
  genres: z.array(z.string()),
  platformIds: z.array(z.string()).min(1),
  scores: scoreSchema,
  why: z.string(),
  adult: z.boolean().optional().default(false),
  shelf: movieShelfSchema.optional(),
  storyId: z.string().optional(),
})

export const watchLinkSchema = z.object({
  platformId: z.string(),
  platformName: z.string(),
  url: z.string().url(),
})

export const rankedTitleSchema = titleSchema.extend({
  score: z.number(),
  reasons: z.array(z.string()),
  watchLinks: z.array(watchLinkSchema).min(1),
})

export const movieRecommendRequestSchema = z.object({
  shelf: movieShelfSchema.optional(),
  limit: z.number().int().min(1).max(150).optional(),
  languages: z.array(movieLangSchema).optional(),
  originalsOnly: z.boolean().optional(),
  kind: movieKindSchema.optional(),
  platformId: z.string().optional(),
  decade: z.number().int().optional(),
  weights: z
    .object({
      critic: z.number().optional(),
      audience: z.number().optional(),
      youtube: z.number().optional(),
      instagram: z.number().optional(),
      erotic: z.number().optional(),
    })
    .optional(),
  seed: z.string().optional(),
  tv: z.boolean().optional(),
  connectedPlatformIds: z.array(z.string()).optional(),
})

export const movieRecommendResponseSchema = z.object({
  schemaVersion: z.literal('1.1.0'),
  generatedAt: z.string(),
  seed: z.string(),
  platformCount: z.number(),
  totalCatalog: z.number(),
  count: z.number(),
  originalsOnly: z.boolean(),
  titles: z.array(rankedTitleSchema),
  safeguards: z.array(z.string()),
})

export type MovieLang = z.infer<typeof movieLangSchema>
export type MovieKind = z.infer<typeof movieKindSchema>
export type MovieShelfKind = z.infer<typeof movieShelfSchema>
export type MovieTitle = z.infer<typeof titleSchema>
export type RankedMovie = z.infer<typeof rankedTitleSchema>
export type MovieRecommendRequest = z.infer<typeof movieRecommendRequestSchema>
export type MovieRecommendResponse = z.infer<typeof movieRecommendResponseSchema>
