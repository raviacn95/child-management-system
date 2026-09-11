import catalogJson from '../../data/horizons.json'
import { ageMonths } from '../../lib'
import {
  horizonsCatalogSchema,
  horizonPlanRequestSchema,
  horizonPlanSchema,
  type HorizonActivity,
  type HorizonBand,
  type HorizonPlan,
  type HorizonPlanRequest,
} from './schema'
import type { BmiBand, SkillId } from '../../types'

export const catalog = horizonsCatalogSchema.parse(catalogJson)

export function horizonBandFromYears(years: number): HorizonBand {
  if (years < 6) return '2-5'
  if (years < 10) return '6-9'
  return '10-13'
}

export function getHorizonBand(id: HorizonBand) {
  return catalog.ageBands.find((b) => b.id === id) ?? catalog.ageBands[0]
}

export function activitiesForBand(id: HorizonBand): HorizonActivity[] {
  const band = getHorizonBand(id)
  return band.activityIds
    .map((aid) => catalog.activities.find((a) => a.id === aid))
    .filter((a): a is HorizonActivity => Boolean(a))
}

export function activityForSkill(skillId: SkillId, years: number) {
  const band = horizonBandFromYears(years)
  return activitiesForBand(band).find((a) => a.skillId === skillId)
}

function dayIndex(date: string, childId: string, modulo: number) {
  const n = [...`${date}:${childId}`].reduce((s, ch) => s + ch.charCodeAt(0), 0)
  return modulo > 0 ? n % modulo : 0
}

export function planHorizons(raw: HorizonPlanRequest): HorizonPlan {
  const input = horizonPlanRequestSchema.parse(raw)
  const years = input.ageYears
  const infant = years < 2
  const bandId = horizonBandFromYears(infant ? 3 : years)
  const band = getHorizonBand(bandId)
  const bmi: BmiBand = infant ? 'infant' : (input.bmiBand ?? 'healthy')
  const overlay = catalog.bmiOverlays[bmi]
  const date = input.date ?? new Date().toISOString().slice(0, 10)
  const list = activitiesForBand(bandId)
  const done = new Set(input.completedIds ?? [])
  const rotate = dayIndex(date, input.childId ?? input.childName ?? 'child', list.length)

  const ranked = list.map((a, i) => {
    let score = i === rotate ? 12 : 0
    if (overlay.boostIds.includes(a.id)) score += 20
    if (done.has(a.id)) score -= 8
    return { a, score }
  })
  ranked.sort((x, y) => y.score - x.score)
  const featuredIds = new Set(ranked.slice(0, bmi === 'healthy' && !infant ? 1 : 2).map((x) => x.a.id))

  const activities = list.map((a) => ({
    ...a,
    minutesToday: Math.max(5, a.minutes + overlay.minutesAdj),
    featured: featuredIds.has(a.id),
    task: infant && a.infantTask ? a.infantTask : a.todayTask,
  }))
  const today = activities.filter((a) => a.featured)

  return horizonPlanSchema.parse({
    schemaVersion: catalog.schemaVersion,
    ageBand: bandId,
    label: infant ? `${band.label} (first-years path)` : band.label,
    science: band.science,
    bmiCue: overlay.cue,
    today: today.length ? today : activities.slice(0, 1),
    activities,
  })
}

export function planHorizonsForChild(
  child: { id: string; firstName: string; lastName: string; dob: string },
  bmiBand?: BmiBand,
  completedIds: string[] = [],
  date?: string,
) {
  return planHorizons({
    childId: child.id,
    childName: `${child.firstName} ${child.lastName}`.trim(),
    ageYears: Math.max(0, ageMonths(child.dob) / 12),
    bmiBand,
    completedIds,
    date,
  })
}
