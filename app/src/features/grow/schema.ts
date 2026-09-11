import { z } from 'zod'
import type { SkillId } from '../../types'

export const horizonBandSchema = z.enum(['2-5', '6-9', '10-13'])
export const horizonDomainSchema = z.enum(['cognitive', 'physical', 'social', 'emotional', 'creative'])
export const skillIdSchema = z.enum([
  'language',
  'numeracy',
  'motor',
  'fineMotor',
  'social',
  'music',
  'art',
  'science',
  'focus',
  'leadership',
])
export const bmiBandSchema = z.enum(['infant', 'under', 'healthy', 'watch', 'high'])

export const horizonActivitySchema = z.object({
  id: z.string(),
  n: z.number().int().min(1).max(15),
  name: z.string(),
  ageBand: horizonBandSchema,
  skillId: skillIdSchema,
  domains: z.array(horizonDomainSchema).min(1),
  minutes: z.number().int().min(5),
  why: z.string(),
  todayTask: z.string(),
  infantTask: z.string().optional(),
  materials: z.array(z.string()).default([]),
})

export const horizonAgeBandSchema = z.object({
  id: horizonBandSchema,
  ageMinYears: z.number(),
  ageMaxYears: z.number(),
  label: z.string(),
  science: z.string(),
  activityIds: z.array(z.string()).length(5),
})

export const horizonBmiOverlaySchema = z.object({
  cue: z.string(),
  boostIds: z.array(z.string()),
  minutesAdj: z.number().int(),
})

export const horizonsCatalogSchema = z.object({
  schemaVersion: z.string(),
  source: z.string().optional(),
  ageBands: z.array(horizonAgeBandSchema).length(3),
  bmiOverlays: z.object({
    infant: horizonBmiOverlaySchema,
    under: horizonBmiOverlaySchema,
    healthy: horizonBmiOverlaySchema,
    watch: horizonBmiOverlaySchema,
    high: horizonBmiOverlaySchema,
  }),
  activities: z.array(horizonActivitySchema).length(15),
})

export const horizonPlanRequestSchema = z.object({
  childId: z.string().optional(),
  childName: z.string().optional(),
  ageYears: z.number().min(0).max(18),
  bmiBand: bmiBandSchema.optional(),
  percentile: z.number().optional(),
  date: z.string().optional(),
  completedIds: z.array(z.string()).optional(),
})

export const plannedActivitySchema = horizonActivitySchema.extend({
  minutesToday: z.number(),
  featured: z.boolean(),
  task: z.string(),
})

export const horizonPlanSchema = z.object({
  schemaVersion: z.string(),
  ageBand: horizonBandSchema,
  label: z.string(),
  science: z.string(),
  bmiCue: z.string(),
  today: z.array(plannedActivitySchema).min(1),
  activities: z.array(plannedActivitySchema).length(5),
})

export type HorizonBand = z.infer<typeof horizonBandSchema>
export type HorizonActivity = z.infer<typeof horizonActivitySchema>
export type HorizonPlan = z.infer<typeof horizonPlanSchema>
export type HorizonPlanRequest = z.infer<typeof horizonPlanRequestSchema>
export type HorizonSkillId = SkillId
