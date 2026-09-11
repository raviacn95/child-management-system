import { z } from 'zod'

export const parentCategorySchema = z.enum(['movies', 'learning', 'parenting', 'finance', 'health'])
export const parentGoalSchema = z.enum(['wealth', 'parenting', 'learning', 'health', 'career'])
export const parentFormatSchema = z.enum(['clip', 'film', 'series', 'course', 'podcast'])
export const parentLangSchema = z.enum(['en', 'hi'])
export const parentTimeSchema = z.enum(['short', 'long', 'mixed'])

export const parentFeedItemSchema = z.object({
  id: z.string(),
  n: z.number().int().min(1).max(15),
  title: z.string(),
  category: parentCategorySchema,
  format: parentFormatSchema,
  durationMin: z.number().int().min(1),
  languages: z.array(parentLangSchema).min(1),
  goals: z.array(parentGoalSchema).min(1),
  impactScore: z.number().int().min(1).max(100),
  why: z.string(),
  evidence: z.string().optional(),
  indiaNote: z.string().optional(),
  url: z.string().url(),
  platform: z.string(),
})

export const parentFeedCatalogSchema = z.object({
  schemaVersion: z.string(),
  source: z.string().optional(),
  audience: z.object({
    ageMin: z.number(),
    ageMax: z.number(),
    region: z.string(),
  }),
  items: z.array(parentFeedItemSchema).length(15),
})

export const parentFeedRequestSchema = z.object({
  ageYears: z.number().min(18).max(80),
  interests: z.array(parentCategorySchema).optional(),
  goals: z.array(parentGoalSchema).optional(),
  timeMode: parentTimeSchema.optional(),
  languages: z.array(parentLangSchema).optional(),
  date: z.string().optional(),
  ratings: z.record(z.string(), z.union([z.literal(-1), z.literal(1)])).optional(),
})

export const rankedParentItemSchema = parentFeedItemSchema.extend({
  score: z.number(),
  reasons: z.array(z.string()),
})

export const parentFeedPlanSchema = z.object({
  schemaVersion: z.string(),
  audience: z.string(),
  daily: z.array(rankedParentItemSchema).min(1),
  weekly: rankedParentItemSchema,
  ranked: z.array(rankedParentItemSchema),
  safeguards: z.array(z.string()),
})

export type ParentCategory = z.infer<typeof parentCategorySchema>
export type ParentGoal = z.infer<typeof parentGoalSchema>
export type ParentTimeMode = z.infer<typeof parentTimeSchema>
export type ParentLang = z.infer<typeof parentLangSchema>
export type ParentFeedItem = z.infer<typeof parentFeedItemSchema>
export type ParentFeedRequest = z.infer<typeof parentFeedRequestSchema>
export type ParentFeedPlan = z.infer<typeof parentFeedPlanSchema>
export type RankedParentItem = z.infer<typeof rankedParentItemSchema>
