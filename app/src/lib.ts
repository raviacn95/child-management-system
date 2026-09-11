import type { BmiBand, Child } from './types'
import { packOf } from './data/country'

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

export function childName(c: Child) {
  return `${c.firstName} ${c.lastName}`
}

export function ageMonths(dob: string) {
  const d = new Date(dob)
  const now = new Date()
  return (
    (now.getFullYear() - d.getFullYear()) * 12 +
    (now.getMonth() - d.getMonth()) -
    (now.getDate() < d.getDate() ? 1 : 0)
  )
}

export function clothingSize(dob: string) {
  const m = Math.max(0, ageMonths(dob))
  if (m < 3) return '0–3M'
  if (m < 6) return '3–6M'
  if (m < 12) return '6–12M'
  if (m < 18) return '12–18M'
  if (m < 24) return '18–24M'
  if (m < 36) return '2–3Y'
  if (m < 48) return '3–4Y'
  if (m < 60) return '4–5Y'
  if (m < 72) return '5–6Y'
  return '6–7Y'
}

export function ageYears(dob: string) {
  const d = new Date(dob)
  const now = new Date()
  let years = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) years -= 1
  if (years < 1) {
    const months = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth()
    return `${Math.max(months, 0)} mo`
  }
  return `${years} yr`
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function formatDate(iso: string) {
  if (!iso) return '—'
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatTime(isoOrHm: string) {
  if (!isoOrHm) return '—'
  if (isoOrHm.includes('T')) {
    return new Date(isoOrHm).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  }
  const [h, m] = isoOrHm.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function money(n: number, country?: string | null) {
  const pack = packOf(country)
  const whole = pack.currency === 'INR'
  return n.toLocaleString(pack.locale, {
    style: 'currency',
    currency: pack.currency,
    maximumFractionDigits: whole ? 0 : 2,
    minimumFractionDigits: whole ? 0 : 2,
  })
}

export { canSee } from './lib/rbac'

export function bodyMassIndex(kg: number, cm: number) {
  const m = cm / 100
  if (m <= 0 || kg <= 0) return 0
  return kg / (m * m)
}

export function bmiProfile(dob: string, kg: number, cm: number): { bmi: number; band: BmiBand; label: string } {
  const bmi = bodyMassIndex(kg, cm)
  if (ageMonths(dob) < 24) {
    return { bmi, band: 'infant', label: 'Under 2 — follow feeding plan, not adult BMI cuts' }
  }
  if (bmi < 14.5) return { bmi, band: 'under', label: 'Needs extra energy (simplified screen)' }
  if (bmi < 17.5) return { bmi, band: 'healthy', label: 'Healthy range (simplified screen)' }
  if (bmi < 19) return { bmi, band: 'watch', label: 'Watch portions and daily movement' }
  return { bmi, band: 'high', label: 'More veg, water, and active play' }
}

export function hueStyle(hue: number) {
  return {
    background: `hsl(${hue} 42% 88%)`,
    color: `hsl(${hue} 45% 28%)`,
  }
}
