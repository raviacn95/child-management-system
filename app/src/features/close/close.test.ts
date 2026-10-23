import { describe, expect, it } from 'vitest'
import { createSeed, today } from '../../data/seed'
import { closeProgress } from './progress'
import { closeSignals, suggestedStatus } from './signals'
import { nearbyPeriods, periodKey, periodLabel } from './tasks'
import type { CloseTaskId, CloseTaskStatus } from '../../types'

function withTasks(tasks: { id: CloseTaskId; status: CloseTaskStatus }[]) {
  const state = createSeed()
  return {
    ...state,
    currentSiteId: 'site-grove',
    closePeriods: [{ period: periodKey(today()), siteId: 'site-grove', tasks }],
  }
}

describe('close period helpers', () => {
  it('keys and lists nearby months', () => {
    expect(periodKey('2026-10-24')).toBe('2026-10')
    expect(periodLabel('2026-10')).toMatch(/October 2026/)
    expect(nearbyPeriods('2026-10')).toEqual(['2026-10', '2026-09', '2026-08'])
  })
})

describe('close signals from demo seed', () => {
  const state = createSeed()
  const period = periodKey(today())
  const signals = closeSignals(state, period, 'site-grove')

  it('counts enrolled, GST, overdue, and clocked-in staff without naming children', () => {
    expect(signals.enrolled).toBeGreaterThan(0)
    expect(signals.gstInvoices).toBeGreaterThan(0)
    expect(signals.overdueInvoices).toBeGreaterThan(0)
    expect(signals.staffClockedIn).toBeGreaterThan(0)
    expect(JSON.stringify(signals)).not.toMatch(/Leo|Shah|Mira|Noah/i)
  })

  it('flags staff hours and overdue as at risk until the director confirms', () => {
    expect(suggestedStatus('staff-hours', signals)).toBe('at_risk')
    expect(suggestedStatus('chase-overdue', signals)).toBe('at_risk')
    expect(suggestedStatus('gst-review', signals)).toBe('in_progress')
  })
})

describe('close progress', () => {
  it('uses director marks over auto suggestions and blocks lock until nine tasks are done', () => {
    const open = closeProgress(createSeed(), periodKey(today()), 'site-grove')
    expect(open.locked).toBe(false)
    expect(open.canLock).toBe(false)
    expect(open.total).toBe(9)
    expect(open.tasks.find((t) => t.id === 'staff-hours')?.status).toBe('at_risk')

    const marked = closeProgress(
      withTasks([{ id: 'staff-hours', status: 'complete' }]),
      periodKey(today()),
      'site-grove',
    )
    expect(marked.tasks.find((t) => t.id === 'staff-hours')?.status).toBe('complete')
    expect(marked.done).toBe(1)
  })

  it('allows lock only when every task except period-lock is complete', () => {
    const ids: CloseTaskId[] = [
      'lock-attendance',
      'post-extras',
      'staff-hours',
      'issue-invoices',
      'gst-review',
      'chase-overdue',
      'inventory-count',
      'ratio-check',
      'reporting-pack',
    ]
    const ready = closeProgress(
      withTasks(ids.map((id) => ({ id, status: 'complete' }))),
      periodKey(today()),
      'site-grove',
    )
    expect(ready.canLock).toBe(true)
    expect(ready.done).toBe(9)

    const locked = closeProgress(
      {
        ...withTasks(ids.map((id) => ({ id, status: 'complete' }))),
        closePeriods: [
          {
            period: periodKey(today()),
            siteId: 'site-grove',
            tasks: ids.map((id) => ({ id, status: 'complete' as const })),
            lockedAt: '2026-10-24T10:00:00.000Z',
            lockedBy: 'u-maya',
          },
        ],
      },
      periodKey(today()),
      'site-grove',
    )
    expect(locked.locked).toBe(true)
    expect(locked.tasks.find((t) => t.id === 'period-lock')?.status).toBe('complete')
  })
})
