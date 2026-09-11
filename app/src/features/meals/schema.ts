import { z } from 'zod'

export const mealAgeBandSchema = z.enum(['0-2', '2-5', '5-8', '8-12'])
export const bmiBandSchema = z.enum(['infant', 'under', 'healthy', 'watch', 'high'])
export const mealSlotSchema = z.enum(['breakfast', 'lunch', 'snack', 'dinner'])
export const dietTagSchema = z.enum(['vegetarian', 'egg', 'jain', 'nut-free', 'dairy-free', 'lactose-free'])

export const nutrientsSchema = z.object({
  energyKcal: z.number().min(0),
  proteinG: z.number().min(0),
  calciumMg: z.number().min(0),
  ironMg: z.number().min(0),
  vitaminDIU: z.number().min(0),
  fiberG: z.number().min(0),
})

export const ingredientSchema = z.object({
  item: z.string(),
  qty: z.number(),
  unit: z.string(),
  grocery: z.string(),
})

export const ageBandRecordSchema = z.object({
  id: mealAgeBandSchema,
  ageMinMonths: z.number().int().min(0),
  ageMaxMonths: z.number().int().min(0),
  label: z.string(),
  focus: z.array(z.string()).default([]),
  targets: nutrientsSchema,
  note: z.string().optional(),
})

export const bmiOverlaySchema = z.object({
  growthCue: z.string(),
  energyAdjKcal: z.number(),
  extraSnack: z.boolean(),
  playMinutes: z.number().int().min(0).optional(),
})

export const recipeSchema = z.object({
  id: z.string(),
  name: z.string(),
  slot: mealSlotSchema,
  ageBands: z.array(mealAgeBandSchema).min(1),
  diet: z.array(dietTagSchema),
  allergens: z.array(z.string()),
  avoidIf: z.array(z.string()).default([]),
  swap: z.string().optional(),
  tip: z.string().optional(),
  ingredients: z.array(ingredientSchema).min(1),
  portionByBand: z.object({
    '0-2': z.number(),
    '2-5': z.number(),
    '5-8': z.number(),
    '8-12': z.number(),
  }),
  nutrients: nutrientsSchema,
  keywords: z.array(z.string()).default([]),
})

export const mealPlannerCatalogSchema = z.object({
  schemaVersion: z.string(),
  source: z.string().optional(),
  ageBands: z.array(ageBandRecordSchema).min(4),
  bmiOverlays: z.object({
    infant: bmiOverlaySchema,
    under: bmiOverlaySchema,
    healthy: bmiOverlaySchema,
    watch: bmiOverlaySchema,
    high: bmiOverlaySchema,
  }),
  recipes: z.array(recipeSchema).min(8),
})

export const childPlanInputSchema = z.object({
  childId: z.string().optional(),
  childName: z.string().optional(),
  ageYears: z.number().min(0).max(18),
  sex: z.string().optional(),
  heightCm: z.number().optional(),
  weightKg: z.number().optional(),
  allergies: z.array(z.string()).default([]),
  dietType: z.string().optional(),
  foodPreferences: z.string().optional(),
})

export const planRequestSchema = z.object({
  children: z.array(childPlanInputSchema).min(1),
  filters: z.array(dietTagSchema).default([]),
})

export const groceryLineSchema = z.object({
  grocery: z.string(),
  qty: z.number(),
  unit: z.string(),
})

export const childSlotSchema = z.object({
  slot: mealSlotSchema,
  recipeId: z.string(),
  recipeName: z.string(),
  portion: z.number(),
  swap: z.string().optional(),
  safe: z.boolean(),
})

export const growthScoresSchema = z.object({
  overall: z.number().min(0).max(100),
  protein: z.number().min(0).max(100),
  calcium: z.number().min(0).max(100),
  iron: z.number().min(0).max(100),
  vitaminD: z.number().min(0).max(100),
  fiber: z.number().min(0).max(100),
})

export const childDayPlanSchema = z.object({
  childId: z.string().optional(),
  childName: z.string().optional(),
  ageBand: mealAgeBandSchema,
  bmiBand: bmiBandSchema,
  bmi: z.number().optional(),
  percentile: z.number().optional(),
  growthCue: z.string(),
  targets: nutrientsSchema,
  scores: growthScoresSchema,
  meals: z.array(childSlotSchema),
  neverServe: z.array(z.string()),
})

export const familyDayPlanSchema = z.object({
  schemaVersion: z.string(),
  shared: z.array(
    z.object({
      slot: mealSlotSchema,
      recipeId: z.string(),
      recipeName: z.string(),
      tip: z.string().optional(),
      portions: z.array(
        z.object({
          childId: z.string().optional(),
          childName: z.string().optional(),
          portion: z.number(),
        }),
      ),
    }),
  ),
  children: z.array(childDayPlanSchema),
  grocery: z.array(groceryLineSchema),
  safeguards: z.array(z.string()),
})

export const recognizeResponseSchema = z.object({
  foods: z.array(z.string()),
  recipeId: z.string().optional(),
  recipeName: z.string().optional(),
  slot: mealSlotSchema.optional(),
  confidence: z.number().min(0).max(1),
  note: z.string(),
})

export type MealAgeBand = z.infer<typeof mealAgeBandSchema>
export type DietTag = z.infer<typeof dietTagSchema>
export type MealSlot = z.infer<typeof mealSlotSchema>
export type Nutrients = z.infer<typeof nutrientsSchema>
export type Recipe = z.infer<typeof recipeSchema>
export type PlanRequest = z.infer<typeof planRequestSchema>
export type FamilyDayPlan = z.infer<typeof familyDayPlanSchema>
export type ChildDayPlan = z.infer<typeof childDayPlanSchema>
