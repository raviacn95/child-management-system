import { z } from 'zod'

export const ageBandSchema = z.enum(['2-5', '5-8', '8-12'])
export const interestSchema = z.enum([
  'animals',
  'art',
  'math',
  'music',
  'science',
  'stories',
  'movement',
  'space',
  'history',
])

export const recommendationInputSchema = z.object({
  childId: z.string().optional(),
  childName: z.string().optional(),
  ageYears: z.number().min(0).max(18),
  stage: z.string().optional(),
  interests: z.array(interestSchema).default([]),
  allergies: z.array(z.string()).default([]),
  countryCode: z.string().optional(),
})

export const rankedChannelSchema = z.object({
  id: z.string(),
  name: z.string(),
  handle: z.string().optional(),
  ageBands: z.array(ageBandSchema),
  interests: z.array(interestSchema),
  description: z.string(),
  youtubeUrl: z.string().url(),
  playlistUrl: z.string().url().optional(),
  youtubeKids: z.boolean(),
  adLight: z.boolean(),
  autoplaySafe: z.boolean(),
  coViewingTip: z.string(),
  score: z.number(),
  reasons: z.array(z.string()),
})

export const recommendationOutputSchema = z.object({
  ageBand: ageBandSchema,
  childName: z.string().optional(),
  channels: z.array(rankedChannelSchema),
  playlist: z.array(z.object({ channelId: z.string(), url: z.string().url() })),
  safeguards: z.array(z.string()),
  anekalTip: z.string().optional(),
})

export const catalogChannelSchema = z.object({
  id: z.string(),
  name: z.string(),
  handle: z.string().optional(),
  interests: z.array(interestSchema),
  description: z.string(),
  youtubeUrl: z.string().url(),
  playlistUrl: z.string().url(),
  youtubeKids: z.boolean().optional(),
  adLight: z.boolean().optional(),
  autoplaySafe: z.boolean().optional(),
  coViewingTip: z.string().optional(),
})

export const packRecordSchema = z.object({
  id: z.string(),
  ageBand: ageBandSchema,
  ageMin: z.number().int().min(0),
  ageMax: z.number().int().max(18),
  label: z.string(),
  focus: z.array(z.string()).min(1),
  featuredChannelIds: z.array(z.string()).default([]),
  channelIds: z.array(z.string()).min(1),
  playlistUrl: z.string().url(),
  anekalTip: z.string().optional(),
})

export const learningPacksCatalogSchema = z.object({
  schemaVersion: z.string(),
  channels: z.array(catalogChannelSchema).optional(),
  packs: z.array(packRecordSchema).min(1),
})

export const hydratedPackSchema = packRecordSchema.extend({
  channels: z.array(catalogChannelSchema),
})

export const packsResponseSchema = z.object({
  schemaVersion: z.string(),
  packs: z.array(hydratedPackSchema),
})

export const youtubeSearchResponseSchema = z.object({
  kind: z.literal('youtube#searchListResponse'),
  items: z.array(
    z.object({
      id: z.object({ kind: z.string(), channelId: z.string() }),
      snippet: z.object({
        title: z.string(),
        description: z.string(),
        channelTitle: z.string(),
        playlistUrl: z.string().url().optional(),
      }),
    }),
  ),
})

export const pipelineJsonSchema = {
  $id: 'https://willow.care/schema/learning-recommendation.json',
  title: 'Willow learning recommendation pipeline',
  type: 'object',
  required: ['ageYears'],
  properties: {
    childId: { type: 'string' },
    childName: { type: 'string' },
    ageYears: { type: 'number', minimum: 0, maximum: 18 },
    stage: { type: 'string', description: 'playgroup | nursery | lkg | ukg' },
    interests: { type: 'array', items: { enum: interestSchema.options } },
    allergies: { type: 'array', items: { type: 'string' } },
    countryCode: { type: 'string' },
  },
} as const
