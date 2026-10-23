import { today } from '../../data/seed'
import type { AppState } from '../../types'
import { closeProgress } from '../close/progress'
import { closeSignals } from '../close/signals'
import { periodKey } from '../close/tasks'
import type { OpsSnapshot } from './opsIntent'

export function opsSnapshot(state: AppState): OpsSnapshot {
  const period = periodKey(today())
  const siteId = state.currentSiteId
  const signals = closeSignals(state, period, siteId)
  const progress = closeProgress(state, period, siteId)
  const enrolled = state.children.filter((c) => c.siteId === siteId && c.status === 'enrolled')
  const presentToday = enrolled.filter((c) =>
    state.attendance.some((a) => a.childId === c.id && a.date === today() && a.checkIn && !a.checkOut),
  ).length
  return {
    enrolled: signals.enrolled,
    presentToday,
    overdueInvoices: signals.overdueInvoices,
    invoiceCount: signals.invoiceCount,
    closeDone: progress.done,
    closeTotal: progress.total,
    closeLocked: progress.locked,
    ratioAlerts: signals.ratioAlerts,
    lowStock: signals.lowStock,
  }
}
