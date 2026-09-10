import type { BmiBand, Child, Role } from './types'

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
  if (m < 6) return '0–6M'
  if (m < 12) return '6–12M'
  if (m < 18) return '12–18M'
  if (m < 24) return '18–24M'
  if (m < 36) return '2T'
  if (m < 48) return '3T'
  if (m < 60) return '4T'
  if (m < 72) return '5T'
  return '6/7'
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

export function money(n: number) {
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
}

export function canSee(role: Role, module: string) {
  if (role === 'director') return true
  const teacher = [
    'dashboard',
    'children',
    'attendance',
    'daily-care',
    'health',
    'classrooms',
    'messages',
    'calendar',
    'learning',
    'meals',
    'staff',
    'workers',
    'shop',
    'grow',
  ]
  const parent = [
    'dashboard',
    'children',
    'daily-care',
    'health',
    'billing',
    'messages',
    'calendar',
    'documents',
    'learning',
    'meals',
    'workers',
    'shop',
    'grow',
  ]
  if (role === 'teacher') return teacher.includes(module)
  return parent.includes(module)
}

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
