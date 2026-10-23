import type { CloseTaskId } from '../../types'

export type CloseDay = 'T+1' | 'T+2' | 'T+3' | 'T+4' | 'T+5'

export interface CloseTaskDef {
  id: CloseTaskId
  day: CloseDay
  title: string
  detail: string
  href: string
}

export const CLOSE_DAYS: { day: CloseDay; label: string }[] = [
  { day: 'T+1', label: 'Day 1 · Attendance & hours' },
  { day: 'T+2', label: 'Day 2 · Invoices & GST' },
  { day: 'T+3', label: 'Day 3 · Collections' },
  { day: 'T+4', label: 'Day 4 · Staff & supplies' },
  { day: 'T+5', label: 'Day 5 · Pack & lock' },
]

/** Centre month-end — not a corporate GAAP close. */
export const CLOSE_TASKS: CloseTaskDef[] = [
  {
    id: 'lock-attendance',
    day: 'T+1',
    title: 'Lock attendance',
    detail: 'Last-day check-in/out is complete so extra hours can bill.',
    href: '/attendance',
  },
  {
    id: 'post-extras',
    day: 'T+1',
    title: 'Post extras',
    detail: 'Van, shop, and late-stay extras are on fee invoices.',
    href: '/billing',
  },
  {
    id: 'staff-hours',
    day: 'T+1',
    title: 'Record staff hours',
    detail: 'Everyone is clocked out and hours are on the roster.',
    href: '/staff',
  },
  {
    id: 'issue-invoices',
    day: 'T+2',
    title: 'Issue fee invoices',
    detail: 'No drafts left. Tuition and extras are sent.',
    href: '/billing',
  },
  {
    id: 'gst-review',
    day: 'T+2',
    title: 'Review GST',
    detail: 'GST on transport and shop extras is checked. Tuition is often exempt.',
    href: '/billing',
  },
  {
    id: 'chase-overdue',
    day: 'T+3',
    title: 'Chase overdue fees',
    detail: 'Overdue families have a reminder. No child names in the note.',
    href: '/billing',
  },
  {
    id: 'inventory-count',
    day: 'T+4',
    title: 'Count low supplies',
    detail: 'Classroom, kitchen, and health stock below reorder point.',
    href: '/inventory',
  },
  {
    id: 'ratio-check',
    day: 'T+4',
    title: 'Check licensing ratios',
    detail: 'Present children vs staff on the floor still meet the licence.',
    href: '/staff',
  },
  {
    id: 'reporting-pack',
    day: 'T+5',
    title: 'Review occupancy pack',
    detail: 'Occupancy, collection rate, and incidents look right.',
    href: '/reports',
  },
  {
    id: 'period-lock',
    day: 'T+5',
    title: 'Lock the month',
    detail: 'Hard close. Further fee edits wait until you reopen.',
    href: '/billing',
  },
]

export function periodKey(isoDate: string) {
  return isoDate.slice(0, 7)
}

export function periodLabel(period: string) {
  const [year, month] = period.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

export function nearbyPeriods(from: string, count = 3) {
  const [year, month] = from.split('-').map(Number)
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(year, month - 1 - i, 1)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  })
}

export function inPeriod(isoDate: string, period: string) {
  return isoDate.slice(0, 7) === period
}
