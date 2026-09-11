import { ageMonths } from '../../lib'
import { bmiPercentileFromMeasures, growthLabel } from './bmiPercentile'
import { catalog, getAgeBand, mealAgeBandFromMonths } from './catalog'
import {
  familyDayPlanSchema,
  planRequestSchema,
  type ChildDayPlan,
  type DietTag,
  type FamilyDayPlan,
  type MealSlot,
  type Nutrients,
  type PlanRequest,
  type Recipe,
} from './schema'

const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'snack', 'dinner']

function clampScore(got: number, target: number) {
  if (target <= 0) return 100
  return Math.max(0, Math.min(100, Math.round((got / target) * 100)))
}

function scaleNutrients(n: Nutrients, portion: number): Nutrients {
  return {
    energyKcal: n.energyKcal * portion,
    proteinG: n.proteinG * portion,
    calciumMg: n.calciumMg * portion,
    ironMg: n.ironMg * portion,
    vitaminDIU: n.vitaminDIU * portion,
    fiberG: n.fiberG * portion,
  }
}

function addNutrients(a: Nutrients, b: Nutrients): Nutrients {
  return {
    energyKcal: a.energyKcal + b.energyKcal,
    proteinG: a.proteinG + b.proteinG,
    calciumMg: a.calciumMg + b.calciumMg,
    ironMg: a.ironMg + b.ironMg,
    vitaminDIU: a.vitaminDIU + b.vitaminDIU,
    fiberG: a.fiberG + b.fiberG,
  }
}

function zero(): Nutrients {
  return { energyKcal: 0, proteinG: 0, calciumMg: 0, ironMg: 0, vitaminDIU: 0, fiberG: 0 }
}

function bitsOf(child: PlanRequest['children'][number]) {
  return [...(child.allergies ?? []), child.dietType ?? '', child.foodPreferences ?? ''].join(' ').toLowerCase()
}

function recipeBlocked(recipe: Recipe, child: PlanRequest['children'][number], extra: DietTag[]) {
  const bits = bitsOf(child)
  const peanut = /peanut|groundnut/.test(bits)
  const egg = /\begg/.test(bits)
  const dairyOff =
    /no cow dairy|no dairy|dairy-free|lactose-free/.test(bits) || extra.includes('dairy-free') || extra.includes('lactose-free')
  const vegetarian = /vegetarian|jain/.test(bits) || extra.includes('vegetarian')
  const jain = /jain/.test(bits) || extra.includes('jain')
  const gluten = /gluten/.test(bits)
  const avoid = recipe.avoidIf.map((a) => a.toLowerCase())
  const allergens = recipe.allergens.map((a) => a.toLowerCase())
  if ((peanut || extra.includes('nut-free')) && (avoid.includes('peanut') || allergens.includes('peanut'))) return true
  if (egg && (avoid.includes('egg') || allergens.includes('egg'))) return true
  if (dairyOff && (allergens.includes('dairy') || avoid.includes('dairy') || avoid.includes('lactose'))) return true
  if (vegetarian && (avoid.includes('vegetarian') || allergens.includes('egg'))) return true
  if (jain && !recipe.diet.includes('jain')) return true
  if (gluten && allergens.includes('gluten')) return true
  return false
}

function growthScores(got: Nutrients, targets: Nutrients) {
  const protein = clampScore(got.proteinG, targets.proteinG)
  const calcium = clampScore(got.calciumMg, targets.calciumMg)
  const iron = clampScore(got.ironMg, targets.ironMg)
  const vitaminD = clampScore(got.vitaminDIU, targets.vitaminDIU)
  const fiber = clampScore(got.fiberG, targets.fiberG)
  return {
    protein,
    calcium,
    iron,
    vitaminD,
    fiber,
    overall: Math.round((protein + calcium + iron + vitaminD + fiber) / 5),
  }
}

function neverServe(child: PlanRequest['children'][number]) {
  return [...new Set((child.allergies ?? []).map((a) => a.trim()).filter(Boolean))]
}

type Prepared = {
  child: PlanRequest['children'][number]
  band: ReturnType<typeof mealAgeBandFromMonths>
  bmiBand: ChildDayPlan['bmiBand']
  bmi?: number
  percentile?: number
  overlay: (typeof catalog.bmiOverlays)[ChildDayPlan['bmiBand']]
  targets: Nutrients
}

function prepare(child: PlanRequest['children'][number]): Prepared {
  const months = Math.round(child.ageYears * 12)
  const band = mealAgeBandFromMonths(months)
  const growth =
    child.heightCm && child.weightKg
      ? bmiPercentileFromMeasures(months, child.weightKg, child.heightCm, child.sex)
      : {
          bmi: 0,
          percentile: null as number | null,
          band: (months < 24 ? 'infant' : 'healthy') as ChildDayPlan['bmiBand'],
        }
  const overlay = catalog.bmiOverlays[growth.band]
  const targets = { ...getAgeBand(band).targets }
  if (overlay.energyAdjKcal) targets.energyKcal += overlay.energyAdjKcal
  return {
    child,
    band,
    bmiBand: growth.band,
    bmi: growth.bmi || undefined,
    percentile: growth.percentile ?? undefined,
    overlay,
    targets,
  }
}

function pickSharedRecipe(slot: MealSlot, prepared: Prepared[], extra: DietTag[], used: Set<string>) {
  const ranked = catalog.recipes
    .filter((r) => r.slot === slot)
    .map((r) => {
      const ageOk = prepared.filter((p) => r.ageBands.includes(p.band)).length
      const safe = prepared.filter((p) => !recipeBlocked(r, p.child, extra)).length
      let score = safe * 20 + ageOk * 8
      if (!used.has(r.id)) score += 4
      if (prepared.some((p) => p.bmiBand === 'infant') && r.ageBands.includes('0-2')) score += 6
      if (prepared.some((p) => p.bmiBand === 'watch' || p.bmiBand === 'high') && (r.id === 'makhana-cucumber' || r.id === 'fruit-chana'))
        score += 5
      return { r, score, safe }
    })
    .sort((a, b) => b.score - a.score || b.safe - a.safe)
  return ranked[0]?.r
}

function extraEnergySnack(prepared: Prepared, extra: DietTag[]) {
  const ids = prepared.bmiBand === 'under' ? ['banana-curd', 'avocado-toast', 'ragi-banana'] : []
  return catalog.recipes.find((r) => ids.includes(r.id) && !recipeBlocked(r, prepared.child, extra))
}

export function planFamilyMeals(raw: PlanRequest): FamilyDayPlan {
  const input = planRequestSchema.parse(raw)
  const extra = input.filters
  const prepared = input.children.map(prepare)
  const used = new Set<string>()
  const safeguards: string[] = [
    'Growth scores measure nutrient quality (calcium, iron, vitamin D, fiber, protein) — not calorie restriction.',
    'BMI percentiles are a home screen using CDC-style cut-points, not a diagnosis.',
  ]

  const sharedRecipes = new Map<MealSlot, Recipe>()
  for (const slot of SLOTS) {
    const recipe = pickSharedRecipe(slot, prepared, extra, used)
    if (recipe) {
      used.add(recipe.id)
      sharedRecipes.set(slot, recipe)
    }
  }

  const children: ChildDayPlan[] = prepared.map((p) => {
    const meals: ChildDayPlan['meals'] = []
    let got = zero()
    for (const slot of SLOTS) {
      let recipe = sharedRecipes.get(slot)
      if (recipe && !recipe.ageBands.includes(p.band)) {
        recipe = catalog.recipes.find((r) => r.slot === slot && r.ageBands.includes(p.band) && !recipeBlocked(r, p.child, extra)) ?? recipe
      }
      if (!recipe) continue
      const portion = recipe.portionByBand[p.band]
      if (portion <= 0) continue
      const safe = !recipeBlocked(recipe, p.child, extra)
      meals.push({
        slot,
        recipeId: recipe.id,
        recipeName: recipe.name,
        portion,
        swap: safe ? undefined : recipe.swap,
        safe,
      })
      got = addNutrients(got, scaleNutrients(recipe.nutrients, portion))
      if (!safe && recipe.swap) safeguards.push(`${p.child.childName ?? 'Child'}: ${recipe.swap}`)
    }
    if (p.overlay.extraSnack) {
      const snack = extraEnergySnack(p, extra)
      if (snack && !meals.some((m) => m.recipeId === snack.id)) {
        const portion = snack.portionByBand[p.band]
        meals.push({
          slot: 'snack',
          recipeId: snack.id,
          recipeName: `Extra energy: ${snack.name}`,
          portion,
          safe: true,
        })
        got = addNutrients(got, scaleNutrients(snack.nutrients, portion))
      }
    }
    const banned = neverServe(p.child)
    if (banned.length) safeguards.push(`Never serve ${p.child.childName ?? 'this child'}: ${banned.join(', ')}.`)
    return {
      childId: p.child.childId,
      childName: p.child.childName,
      ageBand: p.band,
      bmiBand: p.bmiBand,
      bmi: p.bmi,
      percentile: p.percentile,
      growthCue: p.overlay.growthCue,
      targets: p.targets,
      scores: growthScores(got, p.targets),
      meals,
      neverServe: banned,
    }
  })

  const groceryMap = new Map<string, { grocery: string; qty: number; unit: string }>()
  for (const child of children) {
    for (const meal of child.meals) {
      const recipe = catalog.recipes.find((r) => r.id === meal.recipeId)
      if (!recipe) continue
      for (const ing of recipe.ingredients) {
        const prev = groceryMap.get(ing.grocery)
        const qty = ing.qty * meal.portion
        if (prev) prev.qty += qty
        else groceryMap.set(ing.grocery, { grocery: ing.grocery, qty, unit: ing.unit })
      }
    }
  }

  const shared = SLOTS.flatMap((slot) => {
    const recipe = sharedRecipes.get(slot)
    if (!recipe) return []
    const portions = children.flatMap((c) => {
      const meal = c.meals.find((m) => m.slot === slot && m.recipeId === recipe.id)
      if (!meal) return []
      return [{ childId: c.childId, childName: c.childName, portion: meal.portion }]
    })
    return [
      {
        slot,
        recipeId: recipe.id,
        recipeName: recipe.name,
        tip: recipe.tip,
        portions,
      },
    ]
  })

  return familyDayPlanSchema.parse({
    schemaVersion: catalog.schemaVersion,
    shared,
    children,
    grocery: [...groceryMap.values()].map((g) => ({ ...g, qty: Math.round(g.qty * 10) / 10 })),
    safeguards: [...new Set(safeguards)],
  })
}

export function childToPlanInput(
  child: {
    id: string
    firstName: string
    lastName: string
    dob: string
    gender: string
    allergies: { name: string }[]
    dietType?: string
    foodPreferences: string
  },
  growth?: { heightCm: number; weightKg: number },
) {
  return {
    childId: child.id,
    childName: `${child.firstName} ${child.lastName}`.trim(),
    ageYears: Math.max(0, ageMonths(child.dob) / 12),
    sex: child.gender,
    heightCm: growth?.heightCm,
    weightKg: growth?.weightKg,
    allergies: child.allergies.map((a) => a.name),
    dietType: child.dietType,
    foodPreferences: child.foodPreferences,
  }
}

export { growthLabel }
