import { catalog } from './catalog'
import { recognizeResponseSchema, type MealSlot, type Recipe } from './schema'

function scoreRecipe(text: string, recipe: Recipe) {
  const hay = `${recipe.name} ${recipe.keywords.join(' ')} ${recipe.id}`.toLowerCase()
  return recipe.keywords.reduce((n, k) => n + (text.includes(k.toLowerCase()) ? 2 : 0), hay.includes(text.split(' ')[0] ?? '') ? 1 : 0)
}

export function recognizeFoods(raw: string) {
  const text = raw.trim().toLowerCase()
  if (!text) {
    return recognizeResponseSchema.parse({
      foods: [],
      confidence: 0,
      note: 'Add a photo filename or a sentence like “Leo ate idli and banana”.',
    })
  }
  const ranked = catalog.recipes
    .map((r) => ({ r, score: scoreRecipe(text, r) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
  const best = ranked[0]?.r
  const foods = [...new Set(text.split(/[^a-z]+/).filter((w) => w.length > 2))]
  const slot: MealSlot | undefined = /breakfast|idli|poha|chilla/.test(text)
    ? 'breakfast'
    : /lunch|dal|rice|pulao/.test(text)
      ? 'lunch'
      : /dinner|thali|roti/.test(text)
        ? 'dinner'
        : /snack|banana|chana|makhana/.test(text)
          ? 'snack'
          : best?.slot
  return recognizeResponseSchema.parse({
    foods: foods.slice(0, 8),
    recipeId: best?.id,
    recipeName: best?.name,
    slot,
    confidence: best ? Math.min(0.92, 0.45 + (ranked[0]?.score ?? 0) * 0.08) : 0.2,
    note: best
      ? `Matched “${best.name}”. Demo recognizer — confirm before logging.`
      : 'No catalog match. Log the plate in your own words.',
  })
}
