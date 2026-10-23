import type { AppState, CloseTaskId, CloseTaskStatus } from '../../types'
import { today } from '../../data/seed'
import { inPeriod } from './tasks'

const EXTRA = /transport|van|shop|mart|late|extra/i

export interface CloseSignals {
  enrolled: number
  attended: number
  invoiceCount: number
  draftInvoices: number
  overdueInvoices: number
  outstanding: number
  gstInvoices: number
  extrasPosted: number
  staffClockedIn: number
  lowStock: number
  ratioAlerts: number
}

export function closeSignals(state: AppState, period: string, siteId: string): CloseSignals {
  const enrolled = state.children.filter((c) => c.siteId === siteId && c.status === 'enrolled')
  const attendedIds = new Set(
    state.attendance.filter((a) => inPeriod(a.date, period) && enrolled.some((c) => c.id === a.childId)).map((a) => a.childId),
  )
  const invoices = state.invoices.filter((inv) => inPeriod(inv.issuedDate, period) || inPeriod(inv.dueDate, period))
  const rooms = state.classrooms.filter((r) => r.siteId === siteId)
  const present = enrolled.filter((c) =>
    state.attendance.some((a) => a.childId === c.id && a.date === today() && a.checkIn && !a.checkOut),
  )
  const ratioAlerts = rooms.filter((room) => {
    const inRoom = present.filter((c) => c.classroomId === room.id).length
    const staffOn = state.staff.filter((s) => s.clockedIn && s.classroomIds.includes(room.id)).length
    const needed = Math.ceil(inRoom / room.ratioChildren) * room.ratioStaff
    return inRoom > 0 && staffOn < needed
  }).length

  return {
    enrolled: enrolled.length,
    attended: attendedIds.size,
    invoiceCount: invoices.length,
    draftInvoices: invoices.filter((i) => i.status === 'draft').length,
    overdueInvoices: invoices.filter((i) => i.status === 'overdue').length,
    outstanding: invoices.filter((i) => i.status !== 'paid').reduce((sum, i) => sum + (i.amount - i.paid), 0),
    gstInvoices: invoices.filter((i) => (i.gstAmount ?? 0) > 0).length,
    extrasPosted:
      invoices.filter((i) => i.items.some((item) => EXTRA.test(item.desc))).length +
      (state.shopOrders ?? []).filter((o) => inPeriod(o.placedAt, period)).length,
    staffClockedIn: state.staff.filter((s) => s.clockedIn).length,
    lowStock: state.inventory.filter((i) => i.qty <= i.reorderAt).length,
    ratioAlerts,
  }
}

export function signalHint(id: CloseTaskId, s: CloseSignals): string {
  if (id === 'lock-attendance') return `${s.attended} of ${s.enrolled} enrolled have attendance this month`
  if (id === 'post-extras') return `${s.extrasPosted} extra or shop lines this month`
  if (id === 'staff-hours') return s.staffClockedIn ? `${s.staffClockedIn} still clocked in` : 'No one is clocked in'
  if (id === 'issue-invoices') return `${s.invoiceCount} invoices · ${s.draftInvoices} draft`
  if (id === 'gst-review') return `${s.gstInvoices} invoices with a GST component`
  if (id === 'chase-overdue') return `${s.overdueInvoices} overdue`
  if (id === 'inventory-count') return `${s.lowStock} items at or below reorder`
  if (id === 'ratio-check') return s.ratioAlerts ? `${s.ratioAlerts} rooms short of ratio` : 'Ratios look covered'
  if (id === 'reporting-pack') return `${s.enrolled} enrolled · ${s.overdueInvoices} overdue`
  return 'Lock after the other nine tasks are done'
}

export function suggestedStatus(id: CloseTaskId, s: CloseSignals): CloseTaskStatus | null {
  if (id === 'lock-attendance') {
    if (!s.enrolled) return 'at_risk'
    if (s.attended < s.enrolled * 0.5) return 'at_risk'
    if (s.attended === s.enrolled) return 'in_progress'
    return null
  }
  if (id === 'post-extras') return s.extrasPosted > 0 ? 'in_progress' : null
  if (id === 'staff-hours') return s.staffClockedIn > 0 ? 'at_risk' : 'in_progress'
  if (id === 'issue-invoices') {
    if (s.draftInvoices > 0) return 'at_risk'
    if (s.invoiceCount > 0) return 'in_progress'
    return 'at_risk'
  }
  if (id === 'gst-review') return s.gstInvoices > 0 ? 'in_progress' : null
  if (id === 'chase-overdue') return s.overdueInvoices > 0 ? 'at_risk' : s.invoiceCount ? 'in_progress' : null
  if (id === 'inventory-count') return s.lowStock > 0 ? 'at_risk' : 'in_progress'
  if (id === 'ratio-check') return s.ratioAlerts > 0 ? 'at_risk' : 'in_progress'
  return null
}
