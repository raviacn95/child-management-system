import type { BmiBand } from '../../types'

/** Simplified CDC BMI-for-age cut-points (P5 / P50 / P85 / P95). Demo screen, not a clinic chart. */
const BOYS: Record<number, [number, number, number, number]> = {
  2: [14.8, 16.6, 18.2, 19.3],
  3: [14.3, 15.7, 17.4, 18.4],
  4: [14.0, 15.3, 16.9, 18.0],
  5: [13.8, 15.2, 16.8, 18.1],
  6: [13.7, 15.4, 17.1, 18.8],
  7: [13.7, 15.5, 17.4, 19.6],
  8: [13.8, 15.8, 18.0, 20.6],
  9: [14.0, 16.2, 18.6, 21.6],
  10: [14.2, 16.6, 19.4, 22.6],
  11: [14.5, 17.2, 20.2, 23.7],
  12: [15.0, 17.8, 21.1, 24.8],
}

const GIRLS: Record<number, [number, number, number, number]> = {
  2: [14.4, 16.4, 18.0, 19.1],
  3: [14.2, 15.7, 17.2, 18.3],
  4: [13.9, 15.3, 16.8, 18.0],
  5: [13.7, 15.2, 16.9, 18.3],
  6: [13.6, 15.3, 17.1, 18.8],
  7: [13.6, 15.5, 17.6, 19.7],
  8: [13.7, 15.8, 18.3, 20.7],
  9: [13.9, 16.3, 19.1, 21.8],
  10: [14.2, 16.8, 20.0, 23.0],
  11: [14.6, 17.5, 20.9, 24.1],
  12: [15.0, 18.1, 21.7, 25.2],
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function bodyMassIndex(kg: number, cm: number) {
  const m = cm / 100
  if (m <= 0 || kg <= 0) return 0
  return kg / (m * m)
}

function cutsFor(ageYears: number, sex: string): [number, number, number, number] {
  const table = /girl|female/i.test(sex) ? GIRLS : BOYS
  const lo = Math.max(2, Math.min(12, Math.floor(ageYears)))
  const hi = Math.max(2, Math.min(12, Math.ceil(ageYears)))
  const a = table[lo] ?? table[5]
  const b = table[hi] ?? a
  const t = lo === hi ? 0 : ageYears - lo
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)]
}

function percentileFromCuts(bmi: number, cuts: [number, number, number, number]) {
  const [p5, p50, p85, p95] = cuts
  if (bmi <= p5) return Math.max(1, 5 * (bmi / p5))
  if (bmi <= p50) return lerp(5, 50, (bmi - p5) / (p50 - p5))
  if (bmi <= p85) return lerp(50, 85, (bmi - p50) / (p85 - p50))
  if (bmi <= p95) return lerp(85, 95, (bmi - p85) / (p95 - p85))
  return Math.min(99, 95 + Math.min(4, (bmi - p95) * 2))
}

export function bmiPercentileFromMeasures(months: number, kg: number, cm: number, sex = '') {
  const bmi = bodyMassIndex(kg, cm)
  if (months < 24 || bmi <= 0) {
    return { bmi, percentile: null as number | null, band: 'infant' as BmiBand, months }
  }
  const percentile = percentileFromCuts(bmi, cutsFor(months / 12, sex))
  let band: BmiBand = 'healthy'
  if (percentile < 5) band = 'under'
  else if (percentile >= 95) band = 'high'
  else if (percentile >= 85) band = 'watch'
  return { bmi, percentile, band, months }
}

export function growthLabel(band: BmiBand, percentile: number | null) {
  if (band === 'infant' || percentile == null) return 'Under 2 — follow feeding plan, not adult BMI cuts'
  const pct = `~${Math.round(percentile)}th percentile (CDC-style screen)`
  if (band === 'under') return `Needs extra energy · ${pct}`
  if (band === 'watch') return `Watch veg, water, and play · ${pct}`
  if (band === 'high') return `More veg, water, and active play · ${pct}`
  return `Healthy growth range · ${pct}`
}
