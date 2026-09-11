import catalogJson from '../../data/meal-planner.json'
import { mealPlannerCatalogSchema, type MealAgeBand, type Recipe } from './schema'

export const catalog = mealPlannerCatalogSchema.parse(catalogJson)

export function mealAgeBandFromMonths(months: number): MealAgeBand {
  if (months < 24) return '0-2'
  if (months < 60) return '2-5'
  if (months < 96) return '5-8'
  return '8-12'
}

export function getAgeBand(id: MealAgeBand) {
  return catalog.ageBands.find((b) => b.id === id) ?? catalog.ageBands[1]
}

export function getRecipe(id: string): Recipe | undefined {
  return catalog.recipes.find((r) => r.id === id)
}

export function recipesForSlot(slot: Recipe['slot']) {
  return catalog.recipes.filter((r) => r.slot === slot)
}

export function listAgeBands() {
  return catalog.ageBands
}
